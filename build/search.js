"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var node_fetch_1 = require("node-fetch");
function search(query, retry, resolver) {
    if (retry === void 0) { retry = 0; }
    return new Promise(function (resolve, _) {
        var body = {
            query: {
                bool: {
                    must: {
                        query_string: {
                            query: query,
                        },
                    },
                },
            },
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
            if (json.hits.hits.length > 0) {
                if (resolver) {
                    resolver(json);
                }
                else {
                    resolve(json);
                }
            }
            else {
                var corrections = json.suggest.corrections;
                if (!retry) {
                    var corrected_1 = [];
                    corrections.forEach(function (c) {
                        if (c.options.length > 0) {
                            corrected_1.push(c.options[0].text);
                        }
                    });
                    if (corrected_1.length === query.split(" ").length) {
                        search(corrected_1.join(" "), retry + 1, resolve);
                    }
                    else {
                        json.query = query;
                        resolve(json);
                    }
                }
                else {
                    json.query = query;
                    resolve(json);
                }
            }
        });
    });
}
exports.default = search;
