const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
const rand = (min, max) => min + Math.random() * (max - min);

// Emits and resolves with the ack, or { ok: false, error: 'timeout' }.
function emit(socket, event, payload) {
    return new Promise(resolve => {
        socket.timeout(5000).emit(event, payload, (err, response) => {
            resolve(err ? { ok: false, error: 'timeout' } : response);
        });
    });
}

// The option whose color no other option shares.
function oddOption({ options }) {
    const counts = new Map();
    for (const { hex_code } of options) counts.set(hex_code, (counts.get(hex_code) || 0) + 1);
    return options.findIndex(({ hex_code }) => counts.get(hex_code) === 1);
}

// The right option with probability `accuracy`, otherwise a random wrong one.
function pickFor(question, accuracy) {
    const answer = oddOption(question);
    const wrong = question.options.map((_, index) => index).filter(index => index !== answer);
    return Math.random() < accuracy ? answer : wrong[Math.floor(Math.random() * wrong.length)];
}

module.exports = { emit, pickFor, rand, sleep };
