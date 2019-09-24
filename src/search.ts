import fetch from "node-fetch"

// tslint:disable-next-line: max-line-length
export default function search(query: string, from: number = 0, retry: number = 0, resolver?: (value?: unknown) => void) {
  return new Promise((resolve, _) => {
    const body = {
      from,
      query : {
        bool: {
          filter: {
            range: {
              timestamp: {
                gte: 1568160000,
              },
            },
          },
          must: {
            multi_match: {
              fields: ["body^0.75", "title^1.5", "tags^0.5"],
              query,
            },
          },
        },
      },
      sort: [
        "_score",
        {timestamp: "desc"},
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
    }
    fetch(`http://localhost:9200/articles/_search`,
    {
      body: JSON.stringify(body),
      headers: {"Content-Type": "application/json"},
      method: "post",
    })
    .then((response) => response.json())
    .then((json) => {
      console.log("Received json response from elasticsearch", query)
      json.query = query
      if (json.hits.hits.length || 0 > 0) {
        console.log(`Got ${json.hits.hits.length} hits`)
        if (resolver) {
          console.log("Using existing resolver")
          resolver(json)
        } else {
          resolve(json)
        }
      } else {
        console.log(`Got 0 hits`)
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
