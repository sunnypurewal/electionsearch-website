"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var express = require("express");
var path = require("path");
var search_1 = require("./search");
var app = express();
app.set("view engine", "ejs");
app.use(express.static("static"));
var port = 8080;
app.get("/", function (_, res) {
    res.sendFile(path.join(__dirname + "/static/index.html"));
});
app.get("/search", function (req, res) {
    search_1.default(req.query.q)
        .then(function (json) {
        res.render("search", { articles: json, query: req.query.q });
    });
});
app.listen(port, "0.0.0.0", function () {
    console.log("Server started on " + port);
});
