// Fills the %NAME% placeholders in index.html and the manifest from the site
// settings, escaped for the file they're in.

// The request's own origin, for link previews when PUBLIC_URL is unset. Empty
// (relative URLs) if Host isn't a plain host name.
function originOf(req) {
    const host = String(req.headers.host || '');
    if (!/^[a-z0-9.-]+(:\d+)?$/i.test(host)) return '';
    const proto = String(req.headers['x-forwarded-proto'] || '')
        .split(',')[0]
        .trim();
    return `${proto === 'https' ? 'https' : 'http'}://${host}`;
}

const escapeHtml = text => text.replace(/[&<>"']/g, c => `&#${c.charCodeAt(0)};`);
const escapeJson = text => JSON.stringify(text).slice(1, -1);
const ESCAPES = { '.html': escapeHtml, '.webmanifest': escapeJson };
const FILLED = ['index.html', 'manifest.webmanifest'];

function siteValues(site, req) {
    return {
        ORIGIN: site.publicUrl ?? originOf(req),
        SITE_NAME: site.name ?? '',
        SITE_DESCRIPTION: site.description ?? '',
        SITE_AUTHOR: site.author ?? '',
        YEAR: String(new Date().getFullYear()),
    };
}

// Unknown placeholders are left as they are.
function fill(body, ext, values) {
    const encode = ESCAPES[ext];
    return body.replace(/%([A-Z_]+)%/g, (token, key) => (key in values ? encode(values[key]) : token));
}

module.exports = { FILLED, fill, originOf, siteValues };
