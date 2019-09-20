import express = require("express")
import * as path from "path"
import got = require("got")

const app = express();
app.set("view engine", "ejs");
app.use(express.static("static"));
const port = 8080;

app.get("/", (_, res: express.Response) => {
  res.sendFile(path.join(__dirname + "/static/index.html"));
});

app.get("/search", (req: express.Request, res: express.Response) => {
  (async () => {
    try {
      const response = await got(`http://localhost:9200/articles/_search?q=${req.query.q}`);

      res.render("search", {articles: JSON.parse(response.body)})
    } catch (error) {
      console.log(error.response.body);
    }
  })();
});

app.listen(port, "0.0.0.0", () => {
  console.log(`Server started on ${port}`);
});
