import fetch from "node-fetch"

// tslint:disable-next-line: max-line-length
export default function search(query: string, from: number = 0, retry: number = 0, resolver?: (value?: unknown) => void) {
  return new Promise((resolve, _) => {
    const body = {
      from  ,
      query: {
        function_score: {
          functions: [
            {
              linear: {
                  timestamp: {
                    scale: "7d",
                  },
              },
            },
          ],
          query: {
            multi_match: {
              fields: ["body", "title", "tags"],
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
      json.query = query
      if (json.hits.hits.length || 0 > 0) {
        if (resolver) {
          resolver(json)
        } else {
          resolve(json)
        }
      } else {
        const corrections = json.suggest.corrections as any[] || []
        if (!retry) {
          const corrected: string[] = []
          corrections.forEach((c) => {
            if (c.options.length > 0) {
              corrected.push(c.options[0].text)
            }
          })
          if (corrected.length === query.split(" ").length) {
            search(corrected.join(" "), from, retry + 1, resolve)
          } else {
            resolve(json)
          }
        } else {
          resolve(json)
        }
      }
    })
    .catch((e) => console.log(e))
  })
}
