import { button, holdFocus, line } from '../../lib/dom.js';
import { show } from '../../lib/grid.js';
import { setScreen } from '../../lib/screen.js';
import { cat } from '../../ui/cat.js';
import { roster } from './roster.js';

export function showWaiting(game, state, { setReady, kick, leave }) {
    const refocus = holdFocus();
    game.replaceChildren();
    const card = line('game-card');
    game.appendChild(card);

    const ready = state.players.filter(player => player.ready).length;
    const lines = [];
    if (state.code) lines.push(line('game-prompt', 'share this code'), line('game-big game-invite-code', state.code));
    else lines.push(line('game-big', `${ready} / ${state.players.length} ready`));
    lines.push(
        line('game-prompt', `${state.players.length} of ${state.maxPlayers} players · starts when everyone is ready`),
        roster(state, { onKick: kick }),
    );
    if (state.hostId === state.me.id && state.players.length > 1) {
        lines.push(line('game-prompt', 'you own this room · kick removes a player'));
    }
    const toggle = button(state.me.ready ? "i'm not ready" : "► i'm ready", 'game-start-btn', () =>
        setReady(!state.me.ready),
    );
    toggle.dataset.focus = 'ready';
    lines.push(toggle);
    show(card, ...lines);
    cat(card, `lobby ${state.id}`);
    setScreen(state.code ? 'invite room' : 'lobby', {
        exit: { label: 'leave', run: leave },
        keys: '↵ ready · esc leave',
    });
    refocus(toggle);
}
