const NICKNAME_MAX_LENGTH = 20;
const INVITE_CODE_PATTERN = /^[A-F0-9]{8}$/;

// Trimmed, NFC-normalized nickname, or null if empty, too long or has control characters.
function normalizeNickname(value, maxLength = NICKNAME_MAX_LENGTH) {
    if (typeof value !== 'string') return null;
    const nickname = value.trim().normalize('NFC');
    if (!nickname || [...nickname].length > maxLength) return null;
    // biome-ignore lint/suspicious/noControlCharactersInRegex: rejecting control characters is the point
    if (/[\u0000-\u001F\u007F]/u.test(nickname)) return null;
    return nickname;
}

// Uppercased 8-character hex code, or null.
function normalizeInviteCode(value) {
    if (typeof value !== 'string') return null;
    const code = value.trim().toUpperCase();
    return INVITE_CODE_PATTERN.test(code) ? code : null;
}

module.exports = { NICKNAME_MAX_LENGTH, normalizeNickname, normalizeInviteCode };
