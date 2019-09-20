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
              should : [
                {
                  range: {
                    timestamp: {
                      boost: 1.5,
                      gte: Date.now() - 3600 * 1000,
                    },
                  },
                },
                {
                  range: {
                    timestamp: {
                      boost: 1.25,
                      gte: Date.now() - 86400 * 1000,
                    },
                  },
                },
                {
                  range: {
                    timestamp: {
                      boost: 0.8,
                      lte: Date.now() - 86400 * 3 * 1000,
                    },
                  },
                },
                {
                  range: {
                    timestamp: {
                      boost: 0.5,
                      lte: Date.now() - 86400 * 7 * 1000,
                    },
                  },
                },
              ],
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
