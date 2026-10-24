import { pickIndex } from '../../ui/choices.js';
import { submitGuess } from './guess.js';
import { disarmLeave, goHome, leave } from './session.js';

const ARM_MS = 2000;

// Esc leaves the queue or a lobby, closes results, and leaves a match you're
// out of. While still playing it takes two presses within ARM_MS, so a stray
// key can't throw a game away. In a match, 1–6 / q w e a s d pick.
export function onKeydown(ctx, event) {
    const { state } = ctx;
    if (event.key === 'Escape' && !ctx.stopSolo && !event.defaultPrevented) {
        const out = state?.phase === 'active' && state.me.status === 'eliminated';
        const leaves = ctx.queued || state?.phase === 'lobby' || out || ctx.leaveArmed;
        const way = ctx.result ? goHome : leaves ? leave : null;
        if (way) {
            ctx.sound.back();
            return way(ctx);
        }
        if (state?.phase !== 'active') return;
        ctx.leaveArmed = setTimeout(() => disarmLeave(ctx), ARM_MS);
        return ctx.render();
    }
    if (state?.phase !== 'active') return;
    const index = pickIndex(event, state.question?.options.length ?? 0);
    if (index < 0) return;
    event.preventDefault();
    submitGuess(ctx, index);
}
