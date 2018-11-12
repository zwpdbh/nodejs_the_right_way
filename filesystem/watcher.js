'user strict';
const fs = require('fs');
const spawn = require('child_process').spawn;
const filename = process.argv[2];

if (!filename) {
    throw Error('A file to watch must be specified!');
}

fs.watch(filename, () => {
    // 'ls' is a ChildProcess
    const ls = spawn('ls', ['-l', '-h', filename]);
    // ls.stdout.pipe(process.stdout);

    let output = '';

    // listen for 'data' event
    ls.stdout.on('data', (chunck) => {
        // console.log(chunck);
        output += chunck;
    });

    ls.on('close', () => {
        // const parts = output.split(/|s+/);
        // console.log([parts[0], parts[4], parts[8]]);
        console.log(output);
    });
}
);

console.log(`Now watching ${filename} for changes...`);



