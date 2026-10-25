import { settings } from '../lib/settings.js';

// Player-facing text for server error, cancel and end codes.
const ERRORS = {
    invalid_nickname: `a name is 1–${settings.nicknameMaxLength} characters`,
    invalid_code: 'a code is 8 characters, 0–9 and A–F',
    match_not_found: 'no room with that code',
    match_full: 'that room is full',
    not_host: 'only the room owner can do that',
    match_not_waiting: 'that match already started',
    invalid_state: "can't do that right now",
    not_in_match: "you're not in a match",
    match_not_active: "the match isn't taking picks",
    stale_question: 'that one already passed',
    too_fast: 'too fast. look first.',
    invalid_guess: 'pick one of the swatches',
    player_inactive: "you're out of this match",
    match_ended: 'the match is over',
    reconnect_unavailable: "your last match can't be picked up again",
    invalid_reconnect_token: "your last match can't be picked up again",
    server_restarting: 'restarting · try again in a moment',
    feature_disabled: 'that mode is off right now',
    rate_limited: 'slow down a little',
};

const CANCELLED = {
    kicked: 'the owner took you out of the room',
    lobby_expired: 'the room timed out',
    server_restarting: 'restarting · try again in a moment',
};

const ENDED = {
    time: "time's up",
    all_eliminated: 'everyone ran out of health',
    no_active_players: 'everyone else left',
};

export const errorText = code => ERRORS[code] || 'something broke · try again';
export const cancelText = reason => CANCELLED[reason] || 'the match ended';
export const endText = reason => ENDED[reason] || 'match over';

// Text for a guess that didn't count, or ''. `error` is an ack timeout.
export function guessFeedback(error, response) {
    if (error) return 'no answer yet · check your connection';
    if (!response?.ok) return errorText(response?.error);
    return '';
}
