'use strict';

const fs = require('fs');
const request = require('request');
const program = require('commander');
const pkg = require('./package.json');
const http = require('http');

/**
 * we want to incorporate the user provided index and type information.
 * It takes a single parameter, path, and returns the full URL to Elasticsearch based on the program parameters.
 */
const fullUrl = (path = '') => {
    let url = `http://${program.host}:${program.port}/`;
    if (program.index) {
        url += program.index + '/';
        if (program.type) {
            url += program.type + '/';
        }
    }
    return url + path.replace(/^\/*/, '');
};

program
    .version(pkg.version)
    .description(pkg.description)
    .usage('[option] <command> [...]')
    .option('-o, --host <hostname>', 'hostname [localhost]', 'localhost')
    .option('-p, --port <number>', 'port number [9200]', '9200')
    .option('-j, --json', 'format output as JSON')
    .option('-i, --index <name>', 'which index to use')
    .option('-t, --type <type>', 'default type for bulk operations');

/**
 * a command to log the full URL to the console
 */
program.command('url [path]')
    .description('generate the URL for the options and path (default is /)')
    .action((path = '/') => console.log(fullUrl(path)));



/**
 * a command to perform an HTTP get request for the url and output the result
 * The command called get that takes a single optional parameter called path.
 */
program.command('get [path]')
    .description('perform an http get request for path (default is /)')
    .action((path = '/') => {
        const options = {
            url: fullUrl(path),
            json: program.json,
        };

        request(options, (err, res, body) => {
            if (program.json) {
                console.log(JSON.stringify(err || body));
            } else {
                if (err) throw err;
                console.log(body);
            }
        });
    });





program.parse(process.argv);
if (!program.args.filter(arg => typeof arg === 'object').length) {
    program.help();
}