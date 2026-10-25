// Starts backend/app.js on a free port and waits for /healthz to answer ok.
const { spawn } = require('node:child_process');
const net = require('node:net');

const freePort = () =>
    new Promise((resolve, reject) => {
        const server = net.createServer().listen(0, () => {
            const { port } = server.address();
            server.close(() => resolve(port));
        });
        server.on('error', reject);
    });

async function smoke(timeoutMs = 10000) {
    const port = await freePort();
    const app = spawn('node', ['backend/app.js'], { env: { ...process.env, PORT: String(port) }, stdio: 'ignore' });
    try {
        const deadline = Date.now() + timeoutMs;
        while (Date.now() < deadline) {
            const ok = await fetch(`http://127.0.0.1:${port}/healthz`)
                .then(res => res.ok)
                .catch(() => false);
            if (ok) return;
            await new Promise(resolve => setTimeout(resolve, 200));
        }
        throw new Error(`backend/app.js did not answer /healthz within ${timeoutMs / 1000}s`);
    } finally {
        app.kill();
    }
}

module.exports = { smoke };
