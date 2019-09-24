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
                bool: {
                    must: {
                        multi_match: {
                            fields: ["body^0.75", "title^1.5", "tags^0.5"],
                            query: query,
                        },
                    },
                    should: {
                        range: {
                            timestamp: {
                                boost: 0,
                                lte: 1568160000,
                            },
                        },
                    },
                },
            },
            sort: [
                "_score",
                { timestamp: "desc" },
            ],
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
            console.log("Received json response from elasticsearch", query);
            json.query = query;
            if (json.hits.hits.length || 0 > 0) {
                console.log("Got " + json.hits.hits.length + " hits");
                if (resolver) {
                    console.log("Using existing resolver");
                    resolver(json);
                }
                else {
                    resolve(json);
                }
            }
            else {
                console.log("Got 0 hits");
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
