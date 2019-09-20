import express = require("express")
import * as path from "path"
import search from "./search"

const app = express()
app.set("view engine", "ejs")
app.use(express.static("static"))
const port = 8080

app.get("/", (_, res: express.Response) => {
  res.sendFile(path.join(__dirname + "/static/index.html"))
})

app.get("/search", (req: express.Request, res: express.Response) => {
  search(req.query.q)
  .then((json: any) => {
    res.render("search", {articles: json, query: req.query.q})
  })
})

app.listen(port, "0.0.0.0", () => {
  console.log(`Server started on ${port}`)
})
