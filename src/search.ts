import fetch from "node-fetch"

export default function search(query: string, retry: number = 0, resolver?: (value?: unknown) => void) {
  return new Promise((resolve, _) => {
    const body = {
      query: {
          bool : {
              must : {
                  query_string : {
                      query,
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
    }
    fetch(`http://localhost:9200/articles/_search`,
    {
      body: JSON.stringify(body),
      headers: {"Content-Type": "application/json"},
      method: "post",
    })
    .then((response) => response.json())
    .then((json) => {
      if (json.hits.hits.length > 0) {
        if (resolver) {
          resolver(json)
        } else {
          resolve(json)
        }
      } else {
        const corrections = json.suggest.corrections as any[]
        if (!retry) {
          const corrected: string[] = []
          corrections.forEach((c) => {
            if (c.options.length > 0) {
              corrected.push(c.options[0].text)
            }
          })
          if (corrected.length === query.split(" ").length) {
            search(corrected.join(" "), retry + 1, resolve)
          } else {
            json.query = query
            resolve(json)
          }
        } else {
          json.query = query
          resolve(json)
        }
      }
    })
  })
}
