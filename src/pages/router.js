const app = document.getElementById('app');
const style = document.getElementById('page-style');

const routes = {
  login: {
    html: './src/pages/login-page/login.html',
    css: './src/pages/login-page/styles.css',
    js: './src/pages/login-page/login_scripts.js'
  },
  main_menu: {
    html: './src/pages/main-menu-page/main_menu.html',
    css: './src/pages/main-menu-page/styles.css',
    js: './src/pages/main-menu-page/main_menu_scripts.js'
  },
  lobby: {
    html: './src/pages/lobby-page/lobby.html',
    css: './src/pages/lobby-page/styles.css',
    js: './src/pages/lobby-page/lobby_scripts.js'
  },
  game: {
    html: './src/pages/game-page/game.html',
    css: './src/pages/game-page/styles.css',
    js: './src/pages/game-page/game_scripts.js'
  }
};

// SPA Reload handling
if (performance.getEntriesByType("navigation")[0].type === "reload") {
  sessionStorage.clear();
  localStorage.clear();
  window.location.href = "index.html";
}

// Show page when CSS is loaded
async function waitForCss(href) {
  return new Promise((resolve, reject) => {
    const isSameCss = style.getAttribute('href')?.split('?')[0] === href;
    if (isSameCss && style.sheet) {
      resolve();
    } else {
      style.onload = resolve;
      style.onerror = reject;
      style.href = `${href}?v=${Date.now()}`;
    }
  });
}

// SPA page loader
async function loadPage() {
  if (window.__cleanup) {
    try { window.__cleanup(); } catch (e) {}
    window.__cleanup = null;
  }

  window.location.hash = window.location.hash || '#login';
  const hash = location.hash.slice(1).split('?')[0];
  const route = routes[hash] || routes['login'];

  try {
    // Fetch HTML first but don't inject yet
    const res = await fetch(route.html, { cache: 'no-store' });
    const html = await res.text();

    // Remove old script
    const oldScript = document.getElementById('page-script');
    if (oldScript) oldScript.remove();

    // Wait for CSS
    await waitForCss(route.css);

    // Inject HTML after CSS is ready
    app.innerHTML = html;
    document.body.style.visibility = 'visible';

    // Inject page JS
    const script = document.createElement('script');
    script.src = `${route.js}?v=${Date.now()}`;
    script.id = 'page-script';
    script.async = false;
    document.body.appendChild(script);

  } catch (err) {
    console.error(err);
    app.innerHTML = '<p style="color:red;text-align:center;">Failed to load page.</p>';
    app.style.visibility = 'visible';
  }
}

// SPA navigation
window.addEventListener('hashchange', loadPage);
window.addEventListener('load', loadPage);
