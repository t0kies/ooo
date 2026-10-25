import { field } from '../../../lib/field.js';
import { settings } from '../../../lib/settings.js';
import { savedNickname } from '../../saved.js';

// The name field on home. It's a menu row: ↑ ↓ pass over it read-only, so the
// page's keys (t, m, letters) still work. Enter or a tap opens it for typing;
// Enter, Esc or blur closes it. Enter on a filled name calls onDone.
// onChange runs on each edit; the name is saved as it's typed.
export function nameField({ onDone, onChange }) {
    const name = field({
        label: 'name',
        name: 'nickname',
        maxLength: settings.nicknameMaxLength,
        autocomplete: 'nickname',
        onEnter: () => {
            if (name.input.readOnly) return edit(true);
            edit(false);
            if (hasName()) onDone();
        },
    });
    const { input } = name;
    const hasName = () => input.value.trim() !== '';
    input.value = savedNickname.get();
    name.place();

    function edit(on) {
        input.readOnly = !on;
        name.el.classList.toggle('is-browsing', !on);
        if (on) input.setSelectionRange(input.value.length, input.value.length);
        name.place();
        onChange();
    }

    input.addEventListener('input', () => {
        savedNickname.set(input.value);
        onChange();
    });
    name.el.addEventListener('pointerdown', () => edit(true));
    input.addEventListener('blur', () => edit(false));
    input.addEventListener('keydown', event => {
        if (event.key !== 'Escape' || input.readOnly) return;
        event.preventDefault();
        edit(false);
    });
    input.readOnly = true;
    name.el.classList.add('is-browsing');
    return { ...name, hasName, typing: () => document.activeElement === input && !input.readOnly };
}
