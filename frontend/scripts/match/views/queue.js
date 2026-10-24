import { button, line } from '../../lib/dom.js';
import { show } from '../../lib/grid.js';
import { setScreen } from '../../lib/screen.js';
import { settings } from '../../lib/settings.js';
import { cat } from '../../ui/cat.js';

// Waiting in the quick-match queue. Practice is offered while waiting; a
// found match replaces this screen.
export function showQueue(game, { onPractice, onCancel }) {
    game.replaceChildren();
    const card = line('game-card');
    game.appendChild(card);
    const lines = [
        line('game-big', 'waiting for players'),
        line(
            'game-prompt',
            `you're in the lobby · 1 of ${settings.match.maxPlayers} · the match opens as soon as someone joins`,
        ),
    ];
    let practice = null;
    if (settings.features.solo) {
        practice = button('► practice while you wait', 'game-start-btn', onPractice);
        lines.push(practice);
    }
    show(card, ...lines);
    cat(card, 'queue');
    setScreen('lobby', { exit: { label: 'leave', run: onCancel }, keys: 'esc leave' });
    practice?.focus();
}
