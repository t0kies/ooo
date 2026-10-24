import { button, line, mark } from '../../lib/dom.js';
import { show } from '../../lib/grid.js';
import { setScreen } from '../../lib/screen.js';
import { cat } from '../../ui/cat.js';
import { endText } from '../messages.js';
import { board } from './board.js';

function headline(winner, won) {
    const title = line('game-big');
    if (!winner) title.append(mark('= ', 'dim'), 'draw');
    else if (won) title.append(mark('★ ', 'mark-busy'), 'you win');
    else title.append(`${winner.nickname} wins`);
    return title;
}

// After a match. An invite match offers the way back to the same room.
export function showResults(game, result, selfId, { playAgain, back }) {
    game.replaceChildren();
    const card = line('game-card');
    game.appendChild(card);

    const winner = result.winnerId ? result.results.find(player => player.id === result.winnerId) : null;
    const mine = result.results.find(player => player.id === selfId);
    const lines = [headline(winner, winner?.id === selfId), line('game-prompt', endText(result.reason))];
    if (mine) {
        const out = mine.status === 'eliminated' ? ', then ran out of health' : '';
        lines.push(line('game-prompt', `you got ${mine.score} of ${mine.questionIndex} right${out}`));
    }

    const again = result.code ? 'back to the room' : 'play again';
    const replay = button(`► ${again}`, 'game-start-btn', playAgain);
    const actions = line('game-actions');
    actions.append(replay, button('back to menu', 'game-close-btn', back));
    show(card, ...lines, board(result, selfId), actions);
    cat(card, 'results');
    setScreen('results', { exit: { label: 'menu', run: back }, keys: `↵ ${again} · esc menu` });
    replay.focus();
}
