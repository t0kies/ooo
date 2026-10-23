const http = require('node:http');
const { io: connect } = require('socket.io-client');
const { attachSocketServer } = require('../../backend/socket/server');

// The next `name` event whose payload passes `predicate`.
function event(client, name, predicate = () => true) {
    return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
            client.off(name, onEvent);
            reject(new Error(`Timed out waiting for ${name}`));
        }, 3000);
        function onEvent(payload) {
            if (!predicate(payload)) return;
            clearTimeout(timeout);
            client.off(name, onEvent);
            resolve(payload);
        }
        client.on(name, onEvent);
    });
}

// Emits and resolves with the ack.
function action(client, name, payload) {
    return new Promise((resolve, reject) => {
        client.timeout(3000).emit(name, payload, (err, response) => (err ? reject(err) : resolve(response)));
    });
}

// A socket server on a random port; clients made with `client` are closed after the test.
async function serve(t, options) {
    const server = http.createServer();
    const realtime = attachSocketServer(server, options);
    await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
    const url = `http://127.0.0.1:${server.address().port}`;
    const clients = [];
    t.after(async () => {
        for (const client of clients) client.disconnect();
        await new Promise(resolve => realtime.close(resolve));
    });
    const client = (opts = {}) => {
        const socket = connect(url, { reconnection: false, ...opts });
        clients.push(socket);
        return socket;
    };
    return { client };
}

module.exports = { action, event, serve };
