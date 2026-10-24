import { hasMultiplayer } from '../../lib/settings.js';
import { startSolo } from '../../solo/solo.js';
import { showHome } from '../views/home/index.js';
import { showPlay } from '../views/play.js';
import { showQueue } from '../views/queue.js';
import { showResults } from '../views/results.js';
import { showWaiting } from '../views/waiting.js';
import { findAnother, join, playAgain, send } from './actions.js';
import { submitGuess } from './guess.js';
import { goHome, leave, practiceWhileQueued } from './session.js';

function home(ctx) {
    const { game, socket, sound, notice } = ctx;
    showHome(
        game,
        { notice, transportMissing: !socket && hasMultiplayer() },
        {
            quickMatch: nickname => join(ctx, 'match:quick-join', { nickname }),
            createInvite: nickname => join(ctx, 'match:invite-create', { nickname }),
            joinInvite: (code, nickname) => join(ctx, 'match:invite-join', { code, nickname }),
            solo: () => {
                ctx.stopSolo = startSolo(game, sound, () => goHome(ctx));
            },
        },
    );
}

// Draws the screen for the current state.
export function render(ctx) {
    const { game, state, result } = ctx;
    if (ctx.stopSolo && !state && !result) return; // practising; a match will interrupt
    if (result)
        return showResults(game, result, ctx.selfId, { playAgain: () => playAgain(ctx), back: () => goHome(ctx) });
    if (!state && ctx.queued) {
        return showQueue(game, { onPractice: () => practiceWhileQueued(ctx), onCancel: () => leave(ctx) });
    }
    if (!state) return home(ctx);
    if (state.phase === 'lobby') {
        ctx.clock.stop();
        return showWaiting(game, state, {
            setReady: ready => send(ctx, 'match:ready', { ready }),
            kick: playerId => send(ctx, 'match:kick', { playerId }),
            leave: () => leave(ctx),
        });
    }
    const ui = { ...ctx.guess, damaging: ctx.damage.active, leaveArmed: !!ctx.leaveArmed };
    showPlay(game, state, ui, {
        guess: optionId => submitGuess(ctx, optionId),
        leave: () => leave(ctx),
        findAnother: () => findAnother(ctx),
        redraw: () => render(ctx),
    });
    ctx.clock.sync(state.durationMs);
}
