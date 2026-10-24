import { button, line } from '../../lib/dom.js';
import { show } from '../../lib/grid.js';
import { setScreen } from '../../lib/screen.js';
import { cat } from '../../ui/cat.js';

// Out of health while the match runs on: the score, the roster, and (in a
// quick match) a way into the next one. Returns the button to focus.
export function showOut(card, state, { hud, players }, { leave, findAnother }) {
    const { score, questionIndex } = state.me;
    const actions = line('game-actions');
    const next = state.type === 'quick' ? button('► find another match', 'game-start-btn', findAnother) : null;
    if (next) {
        next.dataset.focus = 'find';
        actions.append(next);
    }
    const menu = button('back to menu', 'game-close-btn', leave);
    menu.dataset.focus = 'menu';
    actions.append(menu);

    show(
        card,
        line('game-big', `${score} right`),
        line('game-prompt', `out of health after ${questionIndex} picks · the match is still running`),
        players,
        actions,
    );
    cat(card, `out ${state.id}`);
    setScreen('match', {
        hud,
        exit: { label: 'menu', run: leave },
        keys: next ? '↵ find another match · esc menu' : 'esc menu',
    });
    return next ?? menu;
}
