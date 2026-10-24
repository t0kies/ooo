// Starts the realtime server and the frontend dev server with --watch, and
// stops both if either exits.
const { spawn } = require('node:child_process');
const { assertPortAvailable, waitForReady } = require('./ports');

const SERVICES = [
    ['realtime server', 'tools/dev-backend/index.js'],
    ['frontend', 'tools/dev-server/index.js'],
];
const apiPort = Number(process.env.API_PORT || process.env.PORT || 8080);
const frontendPort = Number(process.env.FRONTEND_PORT || 3000);
const frontendHost = process.env.FRONTEND_HOST || '127.0.0.1';
const children = [];
let stopping = false;

const alive = child => child.exitCode === null && child.signalCode === null;

function stop(code = 0) {
    if (stopping) return;
    stopping = true;
    process.exitCode = code;
    for (const child of children.filter(alive)) child.kill('SIGTERM');
    setTimeout(() => {
        for (const child of children.filter(alive)) child.kill('SIGKILL');
    }, 5000).unref();
}

process.on('SIGINT', () => stop(130));
process.on('SIGTERM', () => stop(143));

function launch(name, entry) {
    const child = spawn(process.execPath, ['--watch', entry], { stdio: 'inherit' });
    child.on('error', err => {
        console.error(`Could not start ${name}: ${err.message}`);
        stop(1);
    });
    child.on('exit', (code, signal) => {
        if (stopping) return;
        console.error(`${name} stopped${signal ? ` (${signal})` : ` with code ${code}`}. Stopping dev services.`);
        stop(code || 1);
    });
    children.push(child);
}

async function start() {
    try {
        await Promise.all([assertPortAvailable(frontendPort, frontendHost), assertPortAvailable(apiPort, '127.0.0.1')]);
        for (const [name, entry] of SERVICES) launch(name, entry);
        await Promise.all([
            waitForReady(`http://${frontendHost}:${frontendPort}/`, 'Frontend', () => stopping),
            waitForReady(`http://127.0.0.1:${apiPort}/healthz`, 'Realtime server', () => stopping),
        ]);
        if (!stopping) console.log('Frontend and backend are ready.');
    } catch (err) {
        if (stopping) return;
        console.error(`Development stack startup failed: ${err.message}`);
        stop(1);
    }
}

start();
