const app = document.getElementById('app');
const style = document.getElementById('page-style');

const routes = {
  login: {
    html: 'login-page/login.html',
    css: 'login-page/styles.css',
    js: 'login-page/login_scripts.js'
  },
  main_menu: {
    html: 'main-menu-page/main_menu.html',
    css: 'main-menu-page/styles.css',
    js: 'main-menu-page/main_menu_scripts.js'
  },
  lobby: {
    html: 'lobby-page/lobby.html',
    css: 'lobby-page/styles.css',
    js: 'lobby-page/lobby_scripts.js'
  },
  game: {
    html: 'game-page/game.html',
    css: 'game-page/styles.css',
    js: 'game-page/game_scripts.js'
  }
};

if (performance.getEntriesByType("navigation")[0].type === "reload") {
  sessionStorage.clear();
  localStorage.clear();
  window.location.href = "index.html";
}

async function loadPage() {
  if (window.__cleanup) {
    try { window.__cleanup(); } catch (e) {}
    window.__cleanup = null;
  }

  window.location.hash = window.location.hash || '#login';
  const hash = location.hash.slice(1).split('?')[0];
  const route = routes[hash] || routes['login'];

  try {
    const res = await fetch(route.html, { cache: 'no-store' });
    const html = await res.text();
    app.innerHTML = html;
    style.href = `${route.css}?v=${Date.now()}`;

    const oldScript = document.getElementById('page-script');
    if (oldScript) oldScript.remove();

    const script = document.createElement('script');
    script.src = `${route.js}?v=${Date.now()}`;
    script.id = 'page-script';
    script.async = false;
    document.body.appendChild(script);
  } catch (err) {
    console.error(err);
    app.innerHTML = '<p style="color:red;text-align:center;">Failed to load page.</p>';
  }
}

window.addEventListener('hashchange', loadPage);
window.addEventListener('load', loadPage);
