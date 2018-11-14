"use strict";

const fs = require("fs");
const request = require("request");
const program = require("commander");
const pkg = require("./package.json");
const http = require("http");

/**
 * we want to incorporate the user provided index and type information.
 * It takes a single parameter, path, and returns the full URL to Elasticsearch based on the program parameters.
 */
const fullUrl = (path = "") => {
  let url = `http://${program.host}:${program.port}/`;
  if (program.index) {
    url += program.index + "/";
    if (program.type) {
      url += program.type + "/";
    }
  }
  return url + path.replace(/^\/*/, "");
};

/**
 * a callback which is common for handling of the response of the http get request
 */
const handleResponse = (err, res, body) => {
  if (program.json) {
    console.log(JSON.stringify(err || body));
  } else {
    if (err) throw err;
    console.log(body);
  }
};

program
  .version(pkg.version)
  .description(pkg.description)
  .usage("[option] <command> [...]")
  .option("-o, --host <hostname>", "hostname [localhost]", "localhost")
  .option("-p, --port <number>", "port number [9200]", "9200")
  .option("-j, --json", "format output as JSON")
  .option("-i, --index <name>", "which index to use")
  .option("-t, --type <type>", "default type for bulk operations")
  .option("-f, --filter <filter>", "source filter for query results");

/**
 * a command to log the full URL to the console
 */
program
  .command("url [path]")
  .description("generate the URL for the options and path (default is /)")
  .action((path = "/") => console.log(fullUrl(path)));

/**
 * a command to perform an HTTP get request for the url and output the result
 * The command called get that takes a single optional parameter called path.
 */
program
  .command("get [path]")
  .description("perform an http get request for path (default is /)")
  .action((path = "/") => {
    const options = {
      url: fullUrl(path),
      // When set to true, the json flag indicates that the request should include an HTTP hader asking the server for a JSON formatted response.
      json: program.json
    };
    request.get(options, handleResponse);
  });

/**A command to create an index */
program
  .command("create-index")
  .description("create an index")
  .action(() => {
    if (!program.index) {
      const msg = "No index specified! Use --index <name>";
      if (!program.json) throw Error(msg);
      console.log(
        JSON.stringify({
          error: msg
        })
      );
      return;
    }
    request.put(fullUrl(), handleResponse);
  });

/**
 * A command which listing indices
 */
program
  .command("list-indices")
  .alias("li")
  .description("get a list of indices in this cluster")
  .action(() => {
    const path = program.json ? "_all" : "_cat/indices?v";
    request(
      {
        url: fullUrl(path),
        json: program.json
      },
      handleResponse
    );
  });

/**
 * a command which allows us to bulk-upload documents.
 */
program
  .command("bulk <file>")
  .description("read and perform bulk options from the specified file")
  .action(file => {
    // first, check the provided file to make sure it exists and can be reached.
    fs.stat(file, (err, stats) => {
      if (err) {
        if (process.json) {
          console.log(JSON.stringify(err));
          return;
        }
        throw err;
      }

      // for consistent with the Elasticsearch's _bulk API which expects to receive JSON
      // and We expect to receive JSON back
      const options = {
        url: fullUrl("_bulk"),
        json: true,
        headers: {
          // stream the file content to server rather than handling all the content to the Request module at once.
          "content-length": stats.size,
          "content-type": "application/json"
        }
      };

      const req = request.post(options);
      const stream = fs.createReadStream(file);
      // pipe the file into request
      stream.pipe(req);
      // pipe the output directly to standard output.
      req.pipe(process.stdout);
    });
  });

/**
 * A Elsticsearch query command
 */
program
  .command("query [queries]")
  .alias("q")
  .description("perform an Elasticsearch query")
  .action((queries = []) => {
    const options = {
      url: fullUrl("_search"),
      json: program.json,
      qs: {}
    };
    console.log(typeof queries);
    if (queries && queries.length) {
      //   options.qs.q = queries.join(" ");
      options.qs.q = queries;
    }
    if (program.filter) {
      options.qs._source = program.filter;
    }
    request(options, handleResponse);
  });

program.parse(process.argv);
if (!program.args.filter(arg => typeof arg === "object").length) {
  program.help();
}
