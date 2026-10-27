const { hsbToHex } = require('./color');

const OPTION_COUNT = 3;

// How far (in brightness points out of 100) the odd swatch sits from the rest:
// startStep on the first round, easing to minStep by round rampRounds.
const DIFFICULTY_PRESETS = {
    easy: { startStep: 20, minStep: 6, rampRounds: 8 },
    normal: { startStep: 16, minStep: 3, rampRounds: 10 },
    hard: { startStep: 12, minStep: 2, rampRounds: 6 },
};

function stepFor(index, { startStep, minStep, rampRounds }) {
    if (rampRounds <= 1) return minStep;
    const progress = Math.min(index, rampRounds - 1) / (rampRounds - 1);
    return Math.max(minStep, Math.round(startStep - (startStep - minStep) * progress));
}

// One round: a random base color for the odd option, the other two a step
// brighter or darker (never past the ends of the scale).
function makeQuestion(index, random = Math.random, difficulty = DIFFICULTY_PRESETS.normal) {
    const hue = Math.floor(random() * 360);
    const saturation = 35 + Math.floor(random() * 55);
    const brightness = 35 + Math.floor(random() * 55);
    const base = hsbToHex(hue, saturation, brightness);
    const step = stepFor(index, difficulty);
    const direction = brightness > 80 ? -1 : brightness < 20 ? 1 : random() < 0.5 ? -1 : 1;
    const alternate = hsbToHex(hue, saturation, Math.max(0, Math.min(100, brightness + direction * step)));
    const correctOption = Math.floor(random() * OPTION_COUNT);

    return {
        index,
        correctOption,
        options: Array.from({ length: OPTION_COUNT }, (_, option) => ({
            id: String(option),
            hex_code: option === correctOption ? base : alternate,
        })),
    };
}

// The question as players see it: no answer key.
function publicQuestion(question) {
    return { index: question.index, options: question.options };
}

module.exports = { DIFFICULTY_PRESETS, OPTION_COUNT, makeQuestion, publicQuestion, stepFor };
