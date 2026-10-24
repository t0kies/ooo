import { createDamageEffect } from '../../ui/health.js';
import { createClock } from '../clock.js';
import { serverEvents } from './events.js';
import { onKeydown } from './keys.js';
import { render } from './render.js';
import { createSession, stopPractice } from './session.js';

// Owns the match state and the socket (null when online play is off) and
// decides which screen to show. Returns a teardown function.
export function startMatchClient(game, socket, sound) {
    const ctx = createSession(game, socket, sound, {
        damage: createDamageEffect(sound),
        clock: createClock(sound),
    });
    ctx.render = () => render(ctx);

    const events = Object.entries(serverEvents(ctx));
    const keydown = event => onKeydown(ctx, event);
    for (const [name, handler] of events) socket?.on(name, handler);
    document.addEventListener('keydown', keydown);
    ctx.render();

    return () => {
        stopPractice(ctx);
        ctx.clock.stop();
        ctx.damage.clear();
        document.removeEventListener('keydown', keydown);
        for (const [name, handler] of events) socket?.off(name, handler);
    };
}
