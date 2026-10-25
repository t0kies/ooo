import { startSolo } from '../../solo/solo.js';
import { savedMatch } from '../saved.js';

// `guess.question` is the question just guessed at. It stays on screen,
// with `answer` (the right option) once the server replies, until the pick
// has been marked, even though the next question has already arrived.
const freshGuess = () => ({ feedback: '', pending: false, picked: -1, question: null, answer: -1 });

export function createSession(game, socket, sound, { damage, clock }) {
    return {
        game,
        socket,
        sound,
        damage,
        clock,
        stopSolo: null,
        state: null,
        result: null,
        selfId: null,
        notice: '',
        queued: false,
        pendingAction: null,
        reconnecting: false,
        leaveArmed: null, // timer while the first of two esc presses is armed
        guess: freshGuess(),
        revealing: null,
    };
}

export function stopPractice(ctx) {
    ctx.stopSolo?.();
    ctx.stopSolo = null;
}

// Back to the menu, with `message` as the notice.
export function goHome(ctx, message = '') {
    clearTimeout(ctx.leaveArmed);
    clearTimeout(ctx.revealing);
    stopPractice(ctx);
    ctx.clock.stop();
    ctx.clock.setRemaining(null);
    ctx.damage.clear();
    Object.assign(ctx, { leaveArmed: null, state: null, result: null, queued: false, notice: message });
    ctx.guess = freshGuess();
    ctx.render();
}

export function leave(ctx) {
    if (ctx.socket?.connected) ctx.socket.emit('match:leave', {}, () => {});
    savedMatch.clear();
    goHome(ctx);
}

export function disarmLeave(ctx) {
    clearTimeout(ctx.leaveArmed);
    ctx.leaveArmed = null;
    if (ctx.state?.phase === 'active') ctx.render();
}

// Practice while waiting in the queue; a found match interrupts it.
export function practiceWhileQueued(ctx) {
    const back = () => {
        stopPractice(ctx);
        ctx.render();
    };
    ctx.stopSolo = startSolo(ctx.game, ctx.sound, back, 'back to queue');
}
