// Dev frontend: serves frontend/ and proxies Socket.IO and /config.json to
// the realtime server, so the browser talks to one origin.
const http = require('node:http');
const path = require('node:path');
const { loadConfigOrExit, loadEnvFile } = require('../../backend/config');
const { createStaticHandler } = require('../../backend/http/static');
const { proxyRequest, proxyUpgrade } = require('./proxy');

loadEnvFile();
const serveStatic = createStaticHandler(path.join(__dirname, '../../frontend'), loadConfigOrExit().site);
const HOST = process.env.FRONTEND_HOST || '127.0.0.1';
const PORT = Number(process.env.FRONTEND_PORT || 3000);
const target = {
    hostname: process.env.API_HOST || '127.0.0.1',
    port: Number(process.env.API_PORT || process.env.PORT || 8080),
};

const server = http.createServer((req, res) => {
    if (req.url.startsWith('/socket.io/') || req.url.split('?')[0] === '/config.json') {
        return proxyRequest(target, req, res);
    }
    serveStatic(req, res).catch(err => {
        console.error(`Frontend request failed: ${err.message}`);
        if (!res.headersSent) res.writeHead(500);
        res.end();
    });
});
server.on('upgrade', (req, socket, head) => proxyUpgrade(target, req, socket, head));

server.listen(PORT, HOST, () => {
    console.log(`Frontend dev server → http://${HOST}:${PORT}`);
    console.log(`Proxying /socket.io/* → http://${target.hostname}:${target.port}`);
});

const shutdown = () => server.close(() => process.exit(0));
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
