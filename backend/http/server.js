const http = require('node:http');
const { hasMultiplayer, publicConfig } = require('../config');
const { attachSocketServer } = require('../socket/server');
const { realtimeOptions } = require('./realtime-options');
const { handleShutdown } = require('./shutdown');
const { createStaticHandler } = require('./static');

function plain(res, status, body = '', headers = {}) {
    res.writeHead(status, headers);
    res.end(body);
}

// One HTTP server: /healthz, /config.json, the frontend files if staticRoot
// is given, and Socket.IO unless both multiplayer modes are off.
function startServer({ label, config, staticRoot }) {
    const serveStatic = staticRoot && createStaticHandler(staticRoot, config.site);
    const clientConfig = JSON.stringify(publicConfig(config));
    const server = http.createServer((req, res) => {
        const path = req.url.split('?')[0];
        if (path === '/healthz') return plain(res, 200, 'ok', { 'Content-Type': 'text/plain' });
        if (path === '/config.json') {
            return plain(res, 200, clientConfig, { 'Content-Type': 'application/json', 'Cache-Control': 'no-cache' });
        }
        if (!serveStatic) return plain(res, 404);
        serveStatic(req, res).catch(err => {
            console.error('Request failed:', err.message);
            if (!res.headersSent) res.writeHead(500);
            res.end();
        });
    });
    const realtime = hasMultiplayer(config) ? attachSocketServer(server, realtimeOptions(config)) : null;

    server.on('error', err => {
        console.error(`${label} failed:`, err.message);
        process.exit(1);
    });
    server.listen(config.port, () => {
        const modes = Object.keys(config.features).filter(name => config.features[name]);
        console.log(`${label} listening on http://localhost:${config.port}/ (${modes.join(', ')})`);
    });
    handleShutdown({ label, server, realtime, drainSeconds: config.drainSeconds });
    return server;
}

module.exports = { startServer };
