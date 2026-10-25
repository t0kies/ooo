// Typed env readers. An invalid value is pushed to `problems` and the
// fallback returned, so all errors can be reported together.
function reader(env, problems) {
    const raw = name => (env[name] === undefined || env[name].trim() === '' ? undefined : env[name].trim());
    const fail = (name, expected, got) => {
        problems.push(`${name} must be ${expected} (got ${got})`);
    };

    return {
        int(name, fallback, { min, max }) {
            const text = raw(name);
            if (text === undefined) return fallback;
            const value = Number(text);
            if (Number.isInteger(value) && value >= min && value <= max) return value;
            fail(name, `a whole number from ${min} to ${max}`, `"${text}"`);
            return fallback;
        },
        bool(name, fallback) {
            const text = raw(name)?.toLowerCase();
            if (text === undefined) return fallback;
            if (['true', '1', 'yes', 'on'].includes(text)) return true;
            if (['false', '0', 'no', 'off'].includes(text)) return false;
            fail(name, 'true or false', `"${text}"`);
            return fallback;
        },
        choice(name, fallback, choices) {
            const text = raw(name)?.toLowerCase();
            if (text === undefined) return fallback;
            if (choices.includes(text)) return text;
            fail(name, `one of ${choices.join(', ')}`, `"${text}"`);
            return fallback;
        },
        text(name, fallback, { max }) {
            const text = raw(name);
            if (text === undefined) return fallback;
            if (text.length <= max) return text;
            fail(name, `at most ${max} characters`, text.length);
            return fallback;
        },
        // scheme and host only; a trailing slash is dropped
        url(name) {
            const text = raw(name)?.replace(/\/+$/, '');
            if (text === undefined) return null;
            if (/^https?:\/\/[a-z0-9.-]+(:\d+)?$/i.test(text)) return text;
            fail(name, 'a site address such as https://ooo.xorxnor.com', `"${text}"`);
            return null;
        },
        header(name) {
            const text = raw(name)?.toLowerCase();
            if (text === undefined) return null;
            if (/^[a-z0-9-]+$/.test(text)) return text;
            fail(name, 'an HTTP header name such as x-real-ip', `"${text}"`);
            return null;
        },
    };
}

module.exports = { reader };
