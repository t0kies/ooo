const { loadConfig } = require('./load');

function loadConfigOrExit() {
    try {
        return loadConfig();
    } catch (err) {
        console.error(err.message);
        process.exit(1);
    }
}

// Loads ./.env if present. Variables already set in the environment win.
function loadEnvFile() {
    try {
        process.loadEnvFile?.();
    } catch (err) {
        if (err.code !== 'ENOENT') throw err;
    }
}

const hasMultiplayer = config => config.features.quickMatch || config.features.invites;

// The subset sent to the browser at /config.json. No limits or security settings.
function publicConfig(config) {
    const { seconds, startingHealth, minPlayers, maxPlayers } = config.match;
    const { startStep, minStep, rampRounds } = config.difficulty;
    return {
        features: config.features,
        match: { seconds, startingHealth, minPlayers, maxPlayers },
        difficulty: { startStep, minStep, rampRounds },
        nicknameMaxLength: config.nicknameMaxLength,
    };
}

module.exports = { hasMultiplayer, loadConfig, loadConfigOrExit, loadEnvFile, publicConfig };
