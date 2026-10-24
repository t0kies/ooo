import { errorText } from '../messages.js';
import { savedMatch, savedNickname } from '../saved.js';
import { goHome, leave } from './session.js';

export const ACK_TIMEOUT_MS = 5000;

export function showNotice(ctx, message) {
    ctx.notice = message;
    ctx.render();
}

// Emits with an ack. Connects first if needed (the action is sent on connect).
export function send(ctx, event, payload) {
    const { socket } = ctx;
    if (!socket) return showNotice(ctx, 'online play is off right now · practice still works');
    if (!socket.connected) {
        ctx.pendingAction = { event, payload };
        socket.connect();
        return showNotice(ctx, 'connecting…');
    }
    socket.timeout(ACK_TIMEOUT_MS).emit(event, payload, (error, response) => {
        if (error) return showNotice(ctx, 'no answer · check your connection and try again');
        if (response?.reconnectToken) savedMatch.set(response.reconnectToken);
        if (!response?.ok) return showNotice(ctx, errorText(response?.error));
        if (response.queued && !ctx.state) {
            ctx.queued = true;
            ctx.render();
        }
    });
}

export function join(ctx, event, payload) {
    savedNickname.set(payload.nickname);
    send(ctx, event, payload);
}

// After a match: back to the same room for an invite match, else re-queue.
export function playAgain(ctx) {
    const nickname = savedNickname.get();
    const code = ctx.result?.code;
    goHome(ctx);
    if (!nickname) return;
    if (code) join(ctx, 'match:invite-join', { code, nickname });
    else join(ctx, 'match:quick-join', { nickname });
}

// Out of health: leave the running match and queue for another.
export function findAnother(ctx) {
    const nickname = savedNickname.get();
    leave(ctx);
    if (nickname) join(ctx, 'match:quick-join', { nickname });
}
