const http = require('node:http');

const forwardHeaders = req => ({ ...req.headers, 'x-forwarded-host': req.headers.host });

// Forwards an HTTP request to the realtime server.
function proxyRequest(target, req, res) {
    const proxy = http.request(
        { ...target, path: req.url, method: req.method, headers: forwardHeaders(req) },
        upstream => {
            res.writeHead(upstream.statusCode, upstream.headers);
            upstream.pipe(res);
        },
    );
    proxy.on('error', err => {
        console.error(`Backend proxy failed: ${err.message}`);
        if (res.headersSent) return;
        res.writeHead(502, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Realtime server unavailable' }));
    });
    req.pipe(proxy);
}

// Forwards a WebSocket upgrade under /socket.io/, then pipes both ways.
function proxyUpgrade(target, req, client, head) {
    if (!req.url.startsWith('/socket.io/')) return client.destroy();
    const proxy = http.request({ ...target, path: req.url, headers: forwardHeaders(req) });
    proxy.on('upgrade', (upstream, socket, upstreamHead) => {
        const status = http.STATUS_CODES[upstream.statusCode] || 'Switching Protocols';
        const headers = Object.entries(upstream.headers)
            .map(([name, value]) => `${name}: ${Array.isArray(value) ? value.join(', ') : value}`)
            .join('\r\n');
        client.write(`HTTP/1.1 ${upstream.statusCode} ${status}\r\n${headers}\r\n\r\n`);
        if (head.length) socket.write(head);
        if (upstreamHead.length) client.write(upstreamHead);
        socket.pipe(client);
        client.pipe(socket);
        for (const [a, b] of [
            [socket, client],
            [client, socket],
        ]) {
            a.on('error', () => b.destroy());
            a.on('close', () => b.destroy());
        }
    });
    proxy.on('error', err => {
        console.error(`WebSocket proxy failed: ${err.message}`);
        client.destroy();
    });
    proxy.end();
}

module.exports = { proxyRequest, proxyUpgrade };
