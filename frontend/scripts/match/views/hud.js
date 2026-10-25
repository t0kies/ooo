import { line } from '../../lib/dom.js';
import { healthIndicator } from '../../ui/health.js';

// The match HUD: level, hearts, and the clock (painted by match/clock.js).
// Scores are in the roster instead.
export function matchHud(state, damaging) {
    const hud = line('game-hud');
    const clock = line('game-clock');
    const bar = line('game-clock-bar');
    bar.setAttribute('aria-hidden', 'true');
    clock.append(bar, line('game-hud-timer', `${Math.ceil(state.durationMs / 1000)}s`));
    hud.append(
        line('game-hud-level', `level ${state.me.questionIndex + 1}`),
        healthIndicator(state.me.health, { lost: damaging }),
        clock,
    );
    return hud;
}
