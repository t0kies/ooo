import { guessFeedback } from '../messages.js';
import { ACK_TIMEOUT_MS } from './actions.js';

const REVEAL_MS = 700; // how long an answered pick stays marked

// The odd option: the one whose color no other option shares.
const oddOne = options =>
    options.findIndex(option => options.filter(other => other.hex_code === option.hex_code).length === 1);

// Sends a pick for the current question. One pick at a time: the next waits
// until this one has been marked.
export function submitGuess(ctx, optionId) {
    const { state, guess } = ctx;
    if (state?.phase !== 'active' || state.me.status !== 'active' || guess.question) return;
    Object.assign(guess, { pending: true, picked: optionId, question: state.question, answer: -1 });
    ctx.render();
    const payload = { questionIndex: state.me.questionIndex, optionId };
    ctx.socket.timeout(ACK_TIMEOUT_MS).emit('match:guess', payload, (error, response) => {
        guess.pending = false;
        if (!error && response?.ok) {
            if (response.correct) ctx.sound.right();
            guess.answer = response.correct ? optionId : oddOne(guess.question.options);
            ctx.revealing = setTimeout(() => {
                Object.assign(guess, { picked: -1, question: null, answer: -1 });
                if (ctx.state) ctx.render();
            }, REVEAL_MS);
        } else {
            guess.question = null;
        }
        guess.feedback = guessFeedback(error, response);
        ctx.render();
    });
}
