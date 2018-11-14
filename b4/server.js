"use strict";

const express = require("express");
const morgan = require("morgan");
const nconf = require("nconf");
const pkg = require("./package.json");

// load argument and environment variables
nconf.argv().env("__");

// establish a default value for the conf parameter
nconf.defaults({ conf: `${__dirname}/config.json` });

// tell nconf to load the file defined in the conf path.
nconf.file(nconf.get("conf"));

const app = express();
app.use(morgan("dev"));

app.get("/api/version", (req, res) => {
  res.status(200).send(pkg.version);
});

// bring the search.js module, then immediately invokes the module function by passing in the express endpoint and the elasticsearch configuration.
require("./lib/search.js")(app, nconf.get("es"));

app.listen(nconf.get("port"), () => {
  console.log("Ready");
});
