import express = require("express")
import * as path from "path"
import search from "./search"
// import url = require("url")

const app = express()
app.set("view engine", "ejs")
app.use(express.static("static"))
const port = 8080

app.get("/", (_, res: express.Response) => {
  res.sendFile(path.join(__dirname + "/static/index.html"))
})

app.get("/search", (req: express.Request, res: express.Response) => {
  const from = ((req.query.page || 1) - 1) * 10
  search(req.query.q, from)
  .then((json: any) => {
    const options = {
      articles: json,
      host: `${req.protocol}://${req.headers.host}`,
      page: req.query.page || 1,
      query: json.query,
      // searchhost: `${req.protocol}://${req.headers.host}?q=${json.query}`,
    }
    if (json.query !== req.query.q) {
      res.redirect(`${req.protocol}://${req.headers.host}/search?q=${json.query}`)
    } else {
      res.render("search", options)
    } 
    // else {
      // res.redirect(`${req.protocol}://${req.headers.host}`)
    // }
  })
})

app.listen(port, "0.0.0.0", () => {
  console.log(`Server started on ${port}`)
})
