const { randomBytes } = require('node:crypto');

// Invite codes of open rooms (code → match id), and codes held after a match
// so the group can reopen the same room (code → expiry timer).
class InviteCodes {
    open = new Map();
    held = new Map();

    constructor({ later, cancel, holdMs }) {
        Object.assign(this, { later, cancel, holdMs });
    }

    newCode() {
        let code;
        do code = randomBytes(5).toString('hex').slice(0, 8).toUpperCase();
        while (this.open.has(code) || this.held.has(code));
        return code;
    }

    hold(code) {
        this.held.set(
            code,
            this.later(() => this.held.delete(code), this.holdMs),
        );
    }

    // Takes a held code back for a new room; false if it isn't held.
    reclaim(code) {
        if (!this.held.has(code)) return false;
        this.cancel(this.held.get(code));
        this.held.delete(code);
        return true;
    }

    clearHeld() {
        for (const timer of this.held.values()) this.cancel(timer);
        this.held.clear();
    }

    clear() {
        this.open.clear();
        this.clearHeld();
    }
}

module.exports = { InviteCodes };
