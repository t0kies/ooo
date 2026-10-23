const { DIFFICULTY_PRESETS } = require('../game/puzzles');
const { reader } = require('./reader');

// Reads every setting from `env`, with defaults. Throws one error listing
// every invalid value.
function loadConfig(env = process.env) {
    const problems = [];
    const read = reader(env, problems);
    const config = {
        port: read.int('PORT', 8080, { min: 1, max: 65535 }),
        features: readFeatures(read, problems),
        match: readMatch(read, problems),
        difficulty: readDifficulty(read, problems),
        drainSeconds: read.int('DRAIN_SECONDS', 45, { min: 0, max: 600 }),
        nicknameMaxLength: read.int('NICKNAME_MAX_LENGTH', 20, { min: 1, max: 40 }),
        // page title, link preview and credit; publicUrl null = use the request's host
        site: {
            name: read.text('SITE_NAME', 'Odd One Out', { max: 60 }),
            description: read.text('SITE_DESCRIPTION', DESCRIPTION, { max: 300 }),
            author: read.text('SITE_AUTHOR', 'XOXN', { max: 60 }),
            publicUrl: read.url('PUBLIC_URL'),
        },
        security: {
            requireOrigin: read.bool('REQUIRE_ORIGIN', env.NODE_ENV === 'production'),
            clientIpHeader: read.header('CLIENT_IP_HEADER'),
        },
        limits: {
            maxConnections: read.int('MAX_CONNECTIONS', 500, { min: 1, max: 100_000 }),
            maxConnectionsPerIp: read.int('MAX_CONNECTIONS_PER_IP', 20, { min: 1, max: 1000 }),
            eventsPerWindow: read.int('RATE_EVENTS_PER_WINDOW', 30, { min: 1, max: 10_000 }),
            connectsPerWindow: read.int('RATE_CONNECTS_PER_WINDOW', 30, { min: 1, max: 10_000 }),
            windowSeconds: read.int('RATE_WINDOW_SECONDS', 10, { min: 1, max: 3600 }),
        },
    };
    if (problems.length) throw new Error(`Invalid configuration:\n  - ${problems.join('\n  - ')}`);
    return config;
}

const DESCRIPTION = "Spot the color that doesn't belong. Play solo, or race friends in quick matches.";

function readFeatures(read, problems) {
    const features = {
        solo: read.bool('FEATURE_SOLO', true),
        quickMatch: read.bool('FEATURE_QUICK_MATCH', true),
        invites: read.bool('FEATURE_INVITES', true),
    };
    if (!features.solo && !features.quickMatch && !features.invites) {
        problems.push('FEATURE_SOLO, FEATURE_QUICK_MATCH and FEATURE_INVITES cannot all be off');
    }
    return features;
}

function readMatch(read, problems) {
    const minPlayers = read.int('MIN_PLAYERS', 2, { min: 2, max: 32 });
    const maxPlayers = read.int('MAX_PLAYERS', 8, { min: 2, max: 32 });
    if (minPlayers > maxPlayers) {
        problems.push(`MIN_PLAYERS (${minPlayers}) cannot be more than MAX_PLAYERS (${maxPlayers})`);
    }
    return {
        seconds: read.int('MATCH_SECONDS', 35, { min: 5, max: 600 }),
        startingHealth: read.int('STARTING_HEALTH', 5, { min: 1, max: 20 }),
        minPlayers,
        maxPlayers,
        lobbyTimeoutSeconds: read.int('LOBBY_TIMEOUT_SECONDS', 300, { min: 10, max: 3600 }),
        minReactionMs: read.int('MIN_REACTION_MS', 250, { min: 0, max: 5000 }),
    };
}

// A preset, with optional per-value overrides.
function readDifficulty(read, problems) {
    const name = read.choice('DIFFICULTY', 'normal', Object.keys(DIFFICULTY_PRESETS));
    const base = DIFFICULTY_PRESETS[name];
    const startStep = read.int('DIFFICULTY_START_STEP', base.startStep, { min: 1, max: 50 });
    const minStep = read.int('DIFFICULTY_MIN_STEP', base.minStep, { min: 1, max: 50 });
    const rampRounds = read.int('DIFFICULTY_RAMP_ROUNDS', base.rampRounds, { min: 1, max: 100 });
    if (minStep > startStep) {
        problems.push(`DIFFICULTY_MIN_STEP (${minStep}) cannot be more than DIFFICULTY_START_STEP (${startStep})`);
    }
    return { name, startStep, minStep, rampRounds };
}

module.exports = { loadConfig };
