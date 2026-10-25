const fs = require('node:fs');
const path = require('node:path');
const { FILLED, fill, siteValues } = require('./site');

const MIME = {
    '.html': 'text/html',
    '.css': 'text/css',
    '.js': 'application/javascript',
    '.woff2': 'font/woff2',
    '.woff': 'font/woff',
    '.otf': 'font/otf',
    '.mp3': 'audio/mpeg',
    '.svg': 'image/svg+xml',
    '.png': 'image/png',
    '.webmanifest': 'application/manifest+json',
};

function end(res, status) {
    res.writeHead(status);
    res.end();
}

// Serves files under root; unknown paths fall back to index.html.
function createStaticHandler(root, site = {}) {
    const base = path.resolve(root);
    const index = path.join(base, 'index.html');
    const filled = new Set(FILLED.map(file => path.join(base, file)));

    async function send(req, res, file) {
        let body = await fs.promises.readFile(file);
        const ext = path.extname(file);
        if (filled.has(file)) body = fill(body.toString(), ext, siteValues(site, req));
        res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
        res.end(body);
    }

    return async function serve(req, res) {
        let pathname;
        try {
            pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
        } catch {
            return end(res, 400);
        }
        const file = path.resolve(base, `.${pathname}`);
        const relative = path.relative(base, file);
        if (relative.startsWith('..') || path.isAbsolute(relative)) return end(res, 400);

        try {
            await send(req, res, file);
        } catch {
            try {
                await send(req, res, index);
            } catch (err) {
                console.error('index.html could not be served:', err.message);
                end(res, 404);
            }
        }
    };
}

module.exports = { createStaticHandler };
