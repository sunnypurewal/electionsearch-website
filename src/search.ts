import fetch from "node-fetch"

// tslint:disable-next-line: max-line-length
export default function search(query: string, from: number = 0, retry: number = 0, resolver?: (value?: unknown) => void) {
  return new Promise((resolve, _) => {
    const body = {
      from,
      query: {
        function_score: {
          boost_mode: "multiply",
          functions: [
            // {
            //   random_score: {
            //     field: "_seq_no",
            //     seed: 10,
            //   },
            //   weight: 0.0001,
            // },
            // {
            //   field_value_factor: {
            //     factor: 1 / Date.now(),
            //     field: "timestamp",
            //     missing: 0,
            //   },
            // },
            // {
            //   linear: {
            //     timestamp: {
            //       decay: 0.5,
            //       scale: "7d",
            //     },
            //   },
            // },
          ],
          query: {
            range: {
              timestamp: {
                boost: 50,
                gte: "2019-09-11",
              },
            },
            multi_match: {
              fields: ["body^0.5", "title^1.5", "tags^0.5"],
              query,
            },
          },
          score_mode: "sum",
        },
      },
      // sort: [
      //   "_score",
      //   {
      //     timestamp: {
      //       order: "desc",
      //     },
      //   },
      // ],
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
