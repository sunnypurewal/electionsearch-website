"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var node_fetch_1 = require("node-fetch");
// tslint:disable-next-line: max-line-length
function search(query, from, retry, resolver) {
    if (from === void 0) { from = 0; }
    if (retry === void 0) { retry = 0; }
    return new Promise(function (resolve, _) {
        var body = {
            from: from,
            query: {
                function_score: {
                    boost_mode: "sum",
                    functions: [
                        {
                            random_score: {
                                field: "_seq_no",
                                seed: 10,
                            },
                            weight: 0.0001,
                        },
                        {
                            field_value_factor: {
                                factor: 1 / (Date.now() * 1000),
                                field: "timestamp",
                                missing: 0,
                            },
                        },
                    ],
                    query: {
                        multi_match: {
                            fields: ["body", "title", "tags"],
                            query: query,
                        },
                    },
                    score_mode: "sum",
                },
            },
            // sort: [
            //   "_score",
            //   {
            //     timestamp: {
            //       order: "desc",
            //     },
            //   },
            // ],
            suggest: {
                corrections: {
                    term: {
                        field: "body",
                        sort: "frequency",
                    },
                    text: query,
                },
            },
        };
        node_fetch_1.default("http://localhost:9200/articles/_search", {
            body: JSON.stringify(body),
            headers: { "Content-Type": "application/json" },
            method: "post",
        })
            .then(function (response) { return response.json(); })
            .then(function (json) {
            json.query = query;
            if (json.hits.hits.length || 0 > 0) {
                if (resolver) {
                    resolver(json);
                }
                else {
                    resolve(json);
                }
            }
            else {
                var corrections = json.suggest.corrections || [];
                if (!retry) {
                    var corrected_1 = [];
                    corrections.forEach(function (c) {
                        if (c.options.length > 0) {
                            corrected_1.push(c.options[0].text);
                        }
                    });
                    if (corrected_1.length === query.split(" ").length) {
                        search(corrected_1.join(" "), from, retry + 1, resolve);
                    }
                    else {
                        resolve(json);
                    }
                }
                else {
                    resolve(json);
                }
            }
        })
            .catch(function (e) { return console.log(e); });
    });
}
exports.default = search;
