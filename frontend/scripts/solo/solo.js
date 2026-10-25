import { show } from '../lib/grid.js';
import { settings } from '../lib/settings.js';
import { cat } from '../ui/cat.js';
import { createDamageEffect } from '../ui/health.js';
import { drawArena } from './arena.js';
import { bestScore, recordScore } from './best.js';
import { pickOne } from './pick.js';
import { makeRound } from './puzzle.js';
import { showResult } from './result.js';

// how long a pick stays marked before the next round
const REVEAL_MS = 700;
const wait = ms => new Promise(resolve => setTimeout(resolve, ms));

// Endless practice: no clock, a wrong pick costs a heart, and the swatches
// get closer each level. Returns a function that stops it.
export function startSolo(game, sound, onExit, exitLabel = 'back to menu') {
    const damage = createDamageEffect(sound);
    let run = null;

    async function play() {
        run?.abort();
        run = new AbortController();
        const { signal } = run;
        const { card, updateHud } = drawArena(game, { best: bestScore(), damage, exitLabel, onExit });

        let score = 0;
        let health = settings.match.startingHealth;
        const history = [];
        for (let level = 1; health > 0; level++) {
            updateHud({ level, health, score });
            const round = makeRound(level);
            const { grid, answer } = pickOne(card, round, signal);
            show(card, grid);
            cat(card, `solo ${level}`);

            const { ok } = await answer;
            if (signal.aborted) return;
            if (ok) {
                score++;
                sound.right();
            } else {
                health--;
                damage.hit();
            }
            history.push({ hex: round.odd.hex_code, ok });
            updateHud({ level, health, score });
            await wait(REVEAL_MS);
            if (signal.aborted) return;
        }

        const isBest = recordScore(score);
        showResult(game, { score, history, isBest }, { onReplay: play, onExit, exitLabel });
    }

    const onKeydown = event => {
        if (event.key !== 'Escape') return;
        event.preventDefault();
        sound.back();
        onExit();
    };
    document.addEventListener('keydown', onKeydown);
    play();

    return () => {
        run?.abort();
        damage.clear();
        document.removeEventListener('keydown', onKeydown);
    };
}
