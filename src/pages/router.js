const app = document.getElementById('app');
const style = document.getElementById('page-style');

const routes = {
  login: { html: './src/pages/login-page/login.html', css: './src/pages/login-page/styles.css', js: './src/pages/login-page/login_scripts.js' },
  main_menu: { html: './src/pages/main-menu-page/main_menu.html', css: './src/pages/main-menu-page/styles.css', js: './src/pages/main-menu-page/main_menu_scripts.js' },
  lobby: { html: './src/pages/lobby-page/lobby.html', css: './src/pages/lobby-page/styles.css', js: './src/pages/lobby-page/lobby_scripts.js' },
  game: { html: './src/pages/game-page/game.html', css: './src/pages/game-page/styles.css', js: './src/pages/game-page/game_scripts.js' }
};

async function loadCss(href) {
  return new Promise((resolve, reject) => {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = `${href}?v=${Date.now()}`;
    link.onload = () => resolve(link);
    link.onerror = () => reject(new Error('Failed to load CSS: ' + href));
    document.head.appendChild(link);
  });
}

async function loadPage() {
  if (window.__cleanup) {
    try { window.__cleanup(); } catch (e) {}
    window.__cleanup = null;
  }

  const hash = (location.hash.slice(1).split('?')[0]) || 'login';
  const route = routes[hash] || routes['login'];

  try {
    app.style.opacity = '0';

    const [htmlRes, cssLink] = await Promise.all([
      fetch(route.html, { cache: 'no-store' }),
      loadCss(route.css)
    ]);

    const html = await htmlRes.text();

    const oldScript = document.getElementById('page-script');
    if (oldScript) oldScript.remove();

    const oldLinks = document.querySelectorAll('link[data-router-css]');
    oldLinks.forEach(l => l.remove());
    cssLink.dataset.routerCss = true;

    app.innerHTML = html;

    void app.offsetHeight;
    app.style.transition = 'opacity 0.25s ease';
    app.style.opacity = '1';
    document.body.style.visibility = 'visible';

    const script = document.createElement('script');
    script.src = `${route.js}?v=${Date.now()}`;
    script.id = 'page-script';
    script.onload = () => console.log(`${route.js} loaded`);
    document.body.appendChild(script);

  } catch (err) {
    console.error(err);
    app.innerHTML = '<p style="color:red;text-align:center;">Failed to load page.</p>';
    document.body.style.visibility = 'visible';
  }
}

// Detect page refresh and auto-redirect to #login
function detectPageRefresh() {
  const navEntries = performance.getEntriesByType('navigation');
  const wasReloaded = navEntries.length > 0
    ? navEntries[0].type === 'reload'
    : performance.navigation.type === performance.navigation.TYPE_RELOAD;

  if (wasReloaded) {
    console.log('Page was refreshed, redirecting to login...');
    location.hash = '#login';
  }
}

window.addEventListener('hashchange', loadPage);
window.addEventListener('load', () => {
  detectPageRefresh();
  if (!location.hash) location.hash = '#login';
  loadPage();
});
