"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var express = require("express");
var path = require("path");
var search_1 = require("./search");
// import url = require("url")
var app = express();
app.set("view engine", "ejs");
app.use(express.static("static"));
var port = 8080;
app.get("/", function (_, res) {
    res.sendFile(path.join(__dirname + "/static/index.html"));
});
app.get("/search", function (req, res) {
    var from = ((req.query.page || 1) - 1) * 10;
    search_1.default(req.query.q, from)
        .then(function (json) {
        var options = {
            articles: json,
            host: req.protocol + "://" + req.headers.host,
            page: req.query.page || 1,
            query: json.query,
        };
        if (json.query !== req.query.q) {
            console.log("Redirected to correct spelling", json.query);
            res.redirect(req.protocol + "://" + req.headers.host + "/search?q=" + json.query);
        }
        else {
            console.log("Rendering search page");
            res.render("search", options);
        }
        // else {
        // res.redirect(`${req.protocol}://${req.headers.host}`)
        // }
    });
});
app.listen(port, "0.0.0.0", function () {
    console.log("Server started on " + port);
});
