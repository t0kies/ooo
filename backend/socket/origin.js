// Browsers send Origin on every WebSocket upgrade but not on every same-origin
// polling request, so a missing Origin is refused only for upgrades.
function sameOrigin(request, { requireOrigin = false } = {}) {
    const origin = request.headers.origin;
    if (!origin) return !(requireOrigin && String(request.headers.upgrade).toLowerCase() === 'websocket');

    try {
        return new URL(origin).host.toLowerCase() === String(request.headers.host || '').toLowerCase();
    } catch {
        return false;
    }
}

// Behind a proxy the socket address is the proxy's, so the IP is read from
// `header` (Railway: x-real-ip). The last entry is the one the proxy added.
function clientIp(socket, header) {
    if (header) {
        const forwarded = String(socket.handshake.headers[header] || '')
            .split(',')
            .pop()
            .trim();
        if (forwarded) return forwarded;
    }
    return socket.handshake.address || 'unknown';
}

module.exports = { clientIp, sameOrigin };
