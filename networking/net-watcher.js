'use strict';

const fs = require('fs');
const net = require('net');
const filename = process.argv[2];

if (!filename) {
    throw Error('Error: no such file ${filename}');
}

// the callback function will be called whenever another endpoint connects.
// connection is a socket which could be used to send and receive data
// this server will return a Server object
let server = net.createServer(connection => {
    console.log("subscriber connected.");
    // connection.write('Now watching ${filename} for changing...');
    connection.write(JSON.stringify({ type: 'watching', file: filename }) + '\n');

    fs.readFile(filename, (err, content) => {
        if (err) {
            throw err;
        }
        console.log(content.toString());
    });

    const watcher = fs.watch(filename, () => {
        // send change file information to client
        // connection.write(`File changed: ${new Date()}\n`);
        connection.write(
            JSON.stringify({ type: 'changed', timestamp: Date.now() }) + '\n'
        );
    });



    connection.on('close', () => {
        console.log("subscriber disconnected.");
        watcher.close();
    });
}).listen(9999, () => {
    console.log('listening for subscribers...');
});


