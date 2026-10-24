import { field } from '../../../lib/field.js';

const CODE_LENGTH = 8;
// kept across redraws so a failed join reopens with the code still there
let typedCode = '';

// The room-code field beside Join Room, hidden until needed. joinRoom()
// joins once the code is whole, otherwise opens the field. Esc clears and
// closes it and focuses back(); an empty field closes on blur.
export function codeField({ onJoin, back }) {
    const code = field({ label: '', name: 'invite-code', maxLength: CODE_LENGTH, onEnter: () => joinRoom() });
    const { el, input } = code;
    el.hidden = true;
    input.setAttribute('aria-label', 'room code');

    input.addEventListener('input', () => {
        input.value = input.value
            .toUpperCase()
            .replace(/[^A-F0-9]/g, '')
            .slice(0, CODE_LENGTH);
        code.place();
        typedCode = input.value;
    });
    input.addEventListener('blur', () => {
        if (!input.value) el.hidden = true;
    });
    input.addEventListener('keydown', event => {
        if (event.key !== 'Escape') return;
        event.preventDefault();
        input.value = typedCode = '';
        el.hidden = true;
        back()?.focus();
    });

    function joinRoom() {
        if (input.value.length === CODE_LENGTH) return onJoin(input.value);
        el.hidden = false;
        input.focus();
    }

    // Reopens with the last typed code; false if there is none.
    function restore() {
        if (!typedCode) return false;
        input.value = typedCode;
        el.hidden = false;
        code.place();
        input.focus();
        return true;
    }

    const forget = () => {
        typedCode = '';
    };
    return { ...code, joinRoom, restore, forget };
}
