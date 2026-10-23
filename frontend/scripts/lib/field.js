// A labelled text input with a drawn ▓ cursor (the native caret is hidden).
// The input is one cell wider than maxLength so the cursor fits after the
// last character. Returns { el, input, place }; place() moves the cursor
// after the value is set from code.
export function field({ label, name, placeholder = '', maxLength, autocomplete = 'off', onEnter }) {
    const el = document.createElement('label');
    el.className = 'field';
    const box = document.createElement('span');
    box.className = 'field-box';
    const input = document.createElement('input');
    input.type = 'text';
    Object.assign(input, { name, placeholder, autocomplete });
    if (maxLength) {
        input.maxLength = maxLength;
        box.style.setProperty('--cells', maxLength + 1);
    }
    if (onEnter) {
        input.addEventListener('keydown', event => {
            if (event.key !== 'Enter') return;
            event.preventDefault();
            onEnter();
        });
    }

    const cursor = document.createElement('span');
    cursor.className = 'field-cursor';
    cursor.setAttribute('aria-hidden', 'true');
    cursor.textContent = '▓';
    const place = () => {
        const focused = document.activeElement === input;
        const at = focused ? (input.selectionStart ?? input.value.length) : input.value.length;
        cursor.style.setProperty('--at', at);
        box.dataset.empty = String(input.value === '');
    };
    for (const type of ['input', 'focus', 'blur', 'select', 'pointerup', 'keyup']) input.addEventListener(type, place);
    // arrows, home and end move the selection after keydown
    input.addEventListener('keydown', () => requestAnimationFrame(place));

    box.append(input, cursor);
    if (label) {
        const text = document.createElement('span');
        text.className = 'field-label';
        text.textContent = label;
        el.append(text);
    }
    el.append(box);
    requestAnimationFrame(place);
    return { el, input, place };
}
