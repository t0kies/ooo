import { holdFocus, line } from '../../lib/dom.js';
import { onRefit, show, space } from '../../lib/grid.js';
import { setScreen } from '../../lib/screen.js';
import { cat } from '../../ui/cat.js';
import { choiceRow } from '../../ui/choices.js';
import { matchHud } from './hud.js';
import { showOut } from './out.js';
import { roster } from './roster.js';

// two roster columns need 2 × 33 cells and a gap
const SPLIT_COLS = 70;

// The running match. `ui` comes from the client: { feedback, pending,
// picked, question, answer, damaging, leaveArmed }. `question` is the one
// just guessed, kept on screen until its pick is marked. `redraw` is called
// when the card crosses the width for a two-column roster.
export function showPlay(game, state, ui, { guess, leave, findAnother, redraw }) {
    const refocus = holdFocus();
    game.replaceChildren();
    const arena = line('game-arena');
    const hud = matchHud(state, ui.damaging);
    const card = line('game-card');
    arena.append(card);
    game.appendChild(arena);
    const split = space(card).cols >= SPLIT_COLS;
    onRefit(card, card, () => {
        if (space(card).cols >= SPLIT_COLS !== split) redraw();
    });
    const players = roster(state, { split });

    if (!ui.question && (state.me.status === 'eliminated' || !state.question)) {
        refocus(showOut(card, state, { hud, players }, { leave, findAnother }));
        return;
    }
    setScreen('match', {
        hud,
        exit: ui.leaveArmed
            ? { label: 'again to leave', run: leave, armed: true }
            : { label: 'leave match', run: leave, key: 'esc esc' },
        keys: '1–3 or q w e pick',
    });
    const question = ui.question ?? state.question;
    const answered = ui.answer >= 0;
    const { grid } = choiceRow(card, question.options, guess, {
        disabled: !!ui.question,
        picked: ui.pending ? ui.picked : -1,
        right: answered ? ui.answer : -1,
        wrong: answered && ui.picked !== ui.answer ? ui.picked : -1,
        between: { el: players, rows: split ? Math.ceil(state.players.length / 2) : state.players.length },
    });
    // text only when a guess didn't count
    show(card, ...(ui.feedback ? [line('game-notice', ui.feedback)] : []), grid);
    cat(card, `round ${state.id} ${question.index}`);
    refocus();
}
