import { choiceRow, markChoices, pickIndex } from '../ui/choices.js';

function shuffled(items) {
    const copy = items.slice();
    for (let i = copy.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
}

// One round: the swatches shuffled, picked by click or key. Marks the pick
// and resolves `answer` with { ok }. Aborting `signal` ends the round.
export function pickOne(card, { odd, rest }, signal) {
    const options = shuffled([odd, ...rest]);
    let finish;
    const { grid, buttons } = choiceRow(card, options, index => finish(options[index]));

    const answer = new Promise(resolve => {
        let over = false;
        const onKey = event => {
            const index = pickIndex(event, options.length);
            if (index < 0) return;
            event.preventDefault();
            finish(options[index]);
        };
        finish = picked => {
            if (over) return;
            over = true;
            document.removeEventListener('keydown', onKey);
            buttons.forEach(choice => {
                choice.disabled = true;
            });
            if (picked) markChoices(buttons, options.indexOf(odd), picked === odd ? -1 : options.indexOf(picked));
            resolve({ ok: picked === odd });
        };
        document.addEventListener('keydown', onKey);
        signal.addEventListener('abort', () => finish(null), { once: true });
    });

    return { grid, answer };
}
