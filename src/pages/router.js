const app = document.getElementById('app');
const style = document.getElementById('page-style');

const routes = {
  login: { html: './src/pages/login-page/login.html', css: './src/pages/login-page/styles.css', js: './src/pages/login-page/login_scripts.js' },
  main_menu: { html: './src/pages/main-menu-page/main_menu.html', css: './src/pages/main-menu-page/styles.css', js: './src/pages/main-menu-page/main_menu_scripts.js' },
  lobby: { html: './src/pages/lobby-page/lobby.html', css: './src/pages/lobby-page/styles.css', js: './src/pages/lobby-page/lobby_scripts.js' },
  game: { html: './src/pages/game-page/game.html', css: './src/pages/game-page/styles.css', js: './src/pages/game-page/game_scripts.js' }
};

async function waitForCss(href) {
  return new Promise((resolve, reject) => {
    const currentHref = style.getAttribute('href')?.split('?')[0];
    if (currentHref === href && style.sheet) return resolve();

    style.href = `${href}?v=${Date.now()}`;

    let attempts = 0;
    const checkLoaded = () => {
      try {
        if (style.sheet) return resolve();
      } catch(e) {
        // Some browsers throw if sheet not loaded yet
      }
      attempts++;
      if (attempts > 50) return reject(new Error('CSS failed to load'));
      setTimeout(checkLoaded, 50);
    };
    checkLoaded();
  });
}

async function loadPage() {
  if (window.__cleanup) {
    try { window.__cleanup(); } catch(e) {}
    window.__cleanup = null;
  }

  const hash = (location.hash.slice(1).split('?')[0]) || 'login';
  const route = routes[hash] || routes['login'];

  try {
    const res = await fetch(route.html, { cache: 'no-store' });
    const html = await res.text();

    const oldScript = document.getElementById('page-script');
    if (oldScript) oldScript.remove();

    await waitForCss(route.css);

    app.style.opacity = "0";
    app.innerHTML = html;

    window.scrollTo(0, 0);
    void app.offsetHeight; // Force reflow for transition
    app.style.transition = "opacity 0.25s ease";
    app.style.opacity = "1";
    document.body.style.visibility = 'visible';

    const script = document.createElement('script');
    script.src = `${route.js}?v=${Date.now()}`;
    script.id = 'page-script';
    script.onload = () => console.log(`${route.js} loaded`);
    document.body.appendChild(script);

  } catch(err) {
    console.error(err);
    app.innerHTML = '<p style="color:red;text-align:center;">Failed to load page.</p>';
    document.body.style.visibility = 'visible';
  }
}

window.addEventListener('hashchange', loadPage);
window.addEventListener('load', () => {
  if (!location.hash) location.hash = '#login';
  loadPage();
});
