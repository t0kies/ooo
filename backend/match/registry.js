// Players by socket id and by reconnect-token hash.
class PlayerRegistry {
    bySocket = new Map();
    byToken = new Map();

    add(player) {
        this.bySocket.set(player.socketId, player);
        this.byToken.set(player.tokenHash, player);
    }

    // The socket entry is dropped only if it still belongs to this player:
    // after match:leave the same socket may already have joined as someone new.
    forget(player) {
        if (this.bySocket.get(player.socketId) === player) this.bySocket.delete(player.socketId);
        this.byToken.delete(player.tokenHash);
    }

    clear() {
        this.bySocket.clear();
        this.byToken.clear();
    }
}

module.exports = { PlayerRegistry };
