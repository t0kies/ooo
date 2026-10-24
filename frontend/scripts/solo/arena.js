import { line } from '../lib/dom.js';
import { setScreen } from '../lib/screen.js';
import { healthIndicator } from '../ui/health.js';

// Draws the empty solo screen. Returns the card to put rounds in, and
// updateHud({ level, health, score }).
export function drawArena(game, { best, damage, exitLabel, onExit }) {
    game.replaceChildren();
    const hud = line('game-hud');
    const card = line('game-card');
    card.tabIndex = -1;
    const arena = line('game-arena');
    arena.append(card);
    game.appendChild(arena);
    card.focus();
    setScreen('solo practice', {
        hud,
        exit: { label: exitLabel, run: onExit },
        keys: `1–6 or q w e · a s d pick · esc ${exitLabel}`,
    });

    const updateHud = ({ level, health, score }) =>
        hud.replaceChildren(
            line('game-hud-level', `level ${level}`),
            healthIndicator(health, { lost: damage.active }),
            line('game-hud-score', best == null ? `score ${score}` : `score ${score} · best ${best}`),
        );
    return { card, updateHud };
}
