import { button, line } from '../../lib/dom.js';
import { settings } from '../../lib/settings.js';

const NAME_CELLS = 12;

// Clips a name to `cells`, marking the cut with '..'.
const clip = (text, cells) => (text.length <= cells ? text : `${text.slice(0, Math.max(1, cells - 2))}..`);

// One row per player: ★ you, ☆ others. Lobby rows show ready state; in
// play, hearts and points with names clipped to 12 cells. `split` lays the
// rows out in two columns.
export function roster(state, { onKick, split = false } = {}) {
    const inLobby = state.phase === 'lobby';
    const list = line(split ? 'game-roster is-split' : 'game-roster');
    if (split) list.style.setProperty('--rows', Math.ceil(state.players.length / 2));
    list.style.setProperty('--hearts', settings.match.startingHealth);
    for (const player of state.players) {
        const row = line('game-roster-player');
        const you = player.id === state.me.id;
        const marker = line('game-roster-marker', you ? '★' : '☆');
        if (!you) marker.classList.add('dim');
        marker.setAttribute('aria-hidden', 'true');
        const label = inLobby
            ? you
                ? `${player.nickname} (you)`
                : player.nickname
            : you
              ? `${clip(player.nickname, NAME_CELLS - 5)}(you)`
              : clip(player.nickname, NAME_CELLS);
        const name = line('game-roster-name', label);
        row.append(marker, name, ...(inLobby ? [readyMark(player, player.id === state.hostId)] : playStatus(player)));
        if (inLobby && onKick && state.hostId === state.me.id && !you) row.append(kickButton(player, onKick));
        list.appendChild(row);
    }
    return list;
}

function kickButton(player, onKick) {
    const kick = button('kick', 'game-roster-kick', () => onKick(player.id));
    kick.dataset.focus = `kick-${player.id}`;
    kick.setAttribute('aria-label', `kick ${player.nickname}`);
    return kick;
}

function readyMark(player, isHost) {
    const el = line('game-roster-status');
    const mark = document.createElement('span');
    mark.className = player.ready ? 'mark-ok' : 'dim';
    mark.setAttribute('aria-hidden', 'true');
    mark.textContent = player.ready ? '■' : '□';
    el.append(mark, player.ready ? ' ready' : ' not ready');
    if (isHost) el.append(line('game-roster-away', ' · owner'));
    return el;
}

// Hearts and points as separate cells so the columns line up.
function playStatus(player) {
    const out = player.status === 'eliminated';
    const hearts = line(`game-roster-hearts ${out ? 'dim' : 'mark-hp'}`, out ? 'out' : '♥'.repeat(player.health));
    hearts.setAttribute('aria-label', `${player.health} health`);
    const points = line('game-roster-status', `${String(player.score).padStart(3, ' ')} pts`);
    if (!player.connected) points.append(line('game-roster-away', ' away'));
    return [hearts, points];
}
