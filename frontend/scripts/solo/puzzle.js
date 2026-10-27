import { hsbToHex } from '../lib/color.js';
import { oddOf } from '../lib/odd.js';

const OPTION_COUNT = 3;

function randomBase() {
    const between = (min, span) => min + Math.floor(Math.random() * span);
    return hsbToHex(between(0, 360), between(35, 55), between(35, 55));
}

// One round: the odd option and two that share a color.
export function makeRound(level) {
    const base = randomBase();
    const same = oddOf(base, level);
    return {
        odd: { id: 'odd', hex_code: base },
        rest: Array.from({ length: OPTION_COUNT - 1 }, (_, index) => ({ id: `same-${index}`, hex_code: same })),
    };
}
