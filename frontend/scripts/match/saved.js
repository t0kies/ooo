import { read, write } from '../lib/storage.js';

const NICKNAME_KEY = 'pickles.guestNickname';
const RECONNECT_KEY = 'pickles.matchReconnect';

// Nickname in localStorage; reconnect token in sessionStorage, so a closed
// tab can't be resumed by someone else.
export const savedNickname = {
    get: () => read('localStorage', NICKNAME_KEY) || '',
    set: value => write('localStorage', NICKNAME_KEY, value),
};

export const savedMatch = {
    get: () => read('sessionStorage', RECONNECT_KEY),
    set: token => write('sessionStorage', RECONNECT_KEY, token),
    clear: () => write('sessionStorage', RECONNECT_KEY, null),
};
