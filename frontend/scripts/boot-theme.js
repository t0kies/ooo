// Runs before first paint (a blocking script in <head>): picks the theme from
// ?theme=, else the last one used, else the first listed.
{
    const link = document.getElementById('theme');
    const themes = link.dataset.themes.split(' ');
    const known = name => (themes.includes(name) ? name : null);
    let saved = null;
    try {
        saved = localStorage.getItem('pickles.theme');
    } catch {}
    const theme = known(new URLSearchParams(location.search).get('theme')) || known(saved) || themes[0];
    link.href = `./styles/themes/${theme}.css`;
    document.documentElement.dataset.theme = theme;
}
