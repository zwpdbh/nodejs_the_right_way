/**
 * Provide API endpoints for searching the books index
 */

"use strict";
const request = require("request");
module.exports = (app, es) => {
  const url = `http://${es.host}:${es.port}/${es.books_index}/book/_search`;

  /**
   * search for books by matching a particular field value.  api: /search/books
   * Example: /api/search/books/authors/Twain
   */
  app.get("/api/search/books/:field/:query", (req, res) => {
    // the first part of this endpoint will construct a request body, an JSON object, which conforms to elastic search rquest body search API.
    // https://www.elastic.co/guide/en/elasticsearch/reference/5.2/search-request-body.html
    const esReqBody = {
      size: 10,
      // the field, and query matches the :filed and :query
      query: { match: { [req.params.field]: req.params.query } }
    };

    // the second part, we will fire off the request to elasticsearch
    const options = { url, json: true, body: esReqBody };
    request.get(options, (err, esRes, esResBody) => {
      if (err) {
        res.status(502).json({ error: "bad-gateway", reason: err.code });
        return;
      }
      if (esRes.statusCode != 200) {
        res.status(esres.statusCode).json(esResBody);
        return;
      }

      // the hits.hits is how elasticsearch structures query responses.
      res.status(200).json(
        esResBody.hits.hits.map(
          // indicates that we expect an object with a property named _source,
          // and that we want to create a local variable of the same name with the same value
          ({ _source }) => _source
        )
      );
    });
  });

  /**For /suggest API endpoint */
  app.get("/api/suggest/:field/:query", (req, res) => {
    // construct a request body
    const esReqBody = {
      size: 0,
      suggest: {
        suggestions: {
          text: req.params.query,
          term: {
            field: req.params.field,
            suggest_mode: "always"
          }
        }
      }
    };

    const options = { url, json: true, body: esReqBody };
    const promise = new Promise((resolve, reject) => {
      request.get(options, (err, esRes, esResBody) => {
        if (err) {
          reject({ error: err });
          return;
        }
        if (esRes.statusCode !== 200) {
          reject({ error: esResBody });
        }

        resolve(esReqBody);
      });
    });
    promise
      .then(esResBody => res.status(200).json(esResBody.suggest.suggestions))
      .catch(({ error }) => res.status(error.status || 502).json(error));
  });
};
