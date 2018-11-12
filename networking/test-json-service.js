'usre strict';
const server = require('net').createServer(sock => {
    console.log('subscriber connected');

    // two message chunks that together make a whole message.
    const firstChunk = '{"type": "changed", "timesta"';
    const secondChunk = 'mp" : 1450694370094}\n';

    sock.write(firstChunk);
    const timer = setTimeout(() => {
        sock.write(secondChunk);
        sock.end();
    }, 100);

    sock.on('end', ()=>{
        clearTimeout(timer);
        console.log('subscriber disconnected');
    })
});

server.listen(9999, ()=>{
    console.log('Test server listening for subscribers...');
});