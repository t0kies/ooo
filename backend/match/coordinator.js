const { performance } = require('node:perf_hooks');
const { DIFFICULTY_PRESETS } = require('../game/puzzles');
const { InviteCodes } = require('./invites');
const { createInvite, joinInvite, quickJoin } = require('./join');
const { submitGuess } = require('./guess');
const { drain, shutdown } = require('./drain');
const { PlayerRegistry } = require('./registry');
const { disconnect, kick, reconnect, setReady } = require('./presence');

const DEFAULTS = {
    matchDurationMs: 35_000,
    lobbyTimeoutMs: 5 * 60_000,
    startingHealth: 5,
    minReactionMs: 250,
    minPlayers: 2,
    maxPlayers: 8,
    difficulty: DIFFICULTY_PRESETS.normal,
    nicknameMaxLength: undefined,
};

// All matches, in memory. Methods take a socket id and return an ack payload;
// updates go out through `emit`. Clock, timers and randomness are injectable
// for tests. Each method delegates to a module working on the shared `ctx`.
class MatchCoordinator {
    constructor({
        emit = () => {},
        now = () => performance.now(),
        wallNow = () => Date.now(),
        setTimeoutFn = setTimeout,
        clearTimeoutFn = clearTimeout,
        random = Math.random,
        ...options
    } = {}) {
        const later = (fn, ms) => {
            const timer = setTimeoutFn(fn, ms);
            timer?.unref?.();
            return timer;
        };
        const cancel = timer => timer && clearTimeoutFn(timer);
        // an option passed as undefined keeps its default
        const given = Object.entries(options).filter(([, value]) => value !== undefined);
        const settings = { ...DEFAULTS, ...Object.fromEntries(given) };
        this.ctx = { emit, now, wallNow, random, later, cancel, settings, draining: false, onIdle: null };
        Object.assign(this.ctx, {
            matches: new Map(),
            players: new PlayerRegistry(),
            invites: new InviteCodes({ later, cancel, holdMs: settings.lobbyTimeoutMs }),
            quickQueue: [],
        });
    }

    get matches() {
        return this.ctx.matches;
    }

    quickJoin = (socketId, nickname) => quickJoin(this.ctx, socketId, nickname);
    createInvite = (socketId, nickname) => createInvite(this.ctx, socketId, nickname);
    joinInvite = (socketId, code, nickname) => joinInvite(this.ctx, socketId, code, nickname);
    setReady = (socketId, ready) => setReady(this.ctx, socketId, ready);
    kick = (socketId, playerId) => kick(this.ctx, socketId, playerId);
    submitGuess = (socketId, questionIndex, optionId) => submitGuess(this.ctx, socketId, questionIndex, optionId);
    reconnect = (socketId, token) => reconnect(this.ctx, socketId, token);
    disconnect = socketId => disconnect(this.ctx, socketId);

    drain = onIdle => drain(this.ctx, onIdle);
    shutdown = () => shutdown(this.ctx);
}

module.exports = { DEFAULTS, MatchCoordinator };
