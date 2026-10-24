import { read, write } from '../lib/storage.js';

// Personal best for solo practice, kept in this browser only.
const KEY = 'pickles.best';

export function bestScore() {
    const value = Number(read('localStorage', KEY));
    return value > 0 ? value : null;
}

// True when the score beats an earlier best.
export function recordScore(score) {
    const old = bestScore();
    if (score <= (old ?? 0)) return false;
    write('localStorage', KEY, String(score));
    return old != null;
}
