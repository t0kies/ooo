import { safeColor } from '../lib/color.js';
import { button, line, mark } from '../lib/dom.js';
import { show } from '../lib/grid.js';
import { setScreen } from '../lib/screen.js';
import { cat } from '../ui/cat.js';
import { bestScore } from './best.js';

const STRIP_LENGTH = 40;

// The last picks: the odd swatch's color, then √ or ╳.
function strip(history) {
    const el = line('game-strip');
    el.setAttribute('role', 'img');
    el.setAttribute('aria-label', history.map((pick, i) => `pick ${i + 1} ${pick.ok ? 'right' : 'wrong'}`).join(', '));
    history.forEach(({ hex, ok }, i) => {
        const cell = line('game-strip-cell');
        cell.style.setProperty('--i', i);
        const swatch = line('blocks', '█');
        swatch.style.color = safeColor(hex);
        cell.append(swatch, line(ok ? 'mark-ok' : 'mark-err', ok ? '√' : '╳'));
        el.appendChild(cell);
    });
    return el;
}

function bestLine(isBest) {
    if (!isBest) {
        const best = bestScore();
        return best == null ? [] : [line('game-best', `best ${best}`)];
    }
    const el = line('game-best');
    el.append(mark('★', 'mark-busy'), ' new best');
    return [el];
}

export function showResult(game, { score, history, isBest }, { onReplay, onExit, exitLabel = 'back to menu' }) {
    game.replaceChildren();
    const card = line('game-card');
    game.appendChild(card);

    const percent = Math.round((100 * score) / history.length);
    const accuracy = history.length ? `reached level ${history.length} · ${percent}% right` : '';
    const replay = button('► play again', 'game-start-btn', onReplay);
    const actions = line('game-actions');
    actions.append(replay, button(exitLabel, 'game-close-btn', onExit));

    show(
        card,
        line('game-prompt', 'out of health'),
        line('game-big', `${score} right`),
        line('game-prompt', accuracy),
        ...bestLine(isBest),
        strip(history.slice(-STRIP_LENGTH)),
        actions,
    );
    cat(card, 'solo result');
    setScreen('solo practice', { exit: { label: exitLabel, run: onExit }, keys: `↵ play again · esc ${exitLabel}` });
    replay.focus();
}
