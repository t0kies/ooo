// Production entry: the frontend, /config.json and Socket.IO on one port.
const path = require('node:path');
const { loadConfigOrExit, loadEnvFile } = require('./config');
const { startServer } = require('./http/server');

loadEnvFile();
startServer({ label: 'App', config: loadConfigOrExit(), staticRoot: path.join(__dirname, '../frontend') });
