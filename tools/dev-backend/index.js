// The backend alone: Socket.IO and /config.json. The frontend dev server
// (tools/dev-server) serves the files and proxies to this.
const { loadConfigOrExit, loadEnvFile } = require('../../backend/config');
const { startServer } = require('../../backend/http/server');

loadEnvFile();
const config = loadConfigOrExit();
// API_PORT keeps this off the frontend's port when both read the same .env
if (process.env.API_PORT) config.port = Number(process.env.API_PORT);
startServer({ label: 'Realtime server', config });
