const app = document.getElementById('app');

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

async function loadCss(href) {
  return new Promise((resolve, reject) => {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = `${href}?v=${Date.now()}`;
    link.dataset.routerCss = true;
    link.onload = () => resolve(link);
    link.onerror = () => reject(new Error('Failed to load CSS: ' + href));
    document.head.appendChild(link);
  });
}

async function loadPage() {
  if (window.__cleanup) {
    try { window.__cleanup(); } catch (e) { console.warn('Cleanup failed:', e); }
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

    document.querySelectorAll('link[data-router-css]').forEach(l => l.remove());
    document.head.appendChild(cssLink);

    const oldScript = document.getElementById('page-script');
    if (oldScript) oldScript.remove();

    app.innerHTML = html;
    void app.offsetHeight;
    app.style.transition = 'opacity 0.25s ease';
    app.style.opacity = '1';
    document.body.style.visibility = 'visible';

    const script = document.createElement('script');
    script.src = `${route.js}?v=${Date.now()}`;
    script.id = 'page-script';

    script.onload = async () => {
      for (let i = 0; i < 50; i++) {
        if (typeof window.onPageLoad === 'function') break;
        await new Promise(r => setTimeout(r, 50));
      }
      if (typeof window.onPageLoad === 'function') {
        try { window.onPageLoad(); } catch (err) { console.error(err); }
      }
    };

    document.body.appendChild(script);
  } catch (err) {
    console.error(err);
    app.innerHTML = '<p style="color:red;text-align:center;">Failed to load page.</p>';
    document.body.style.visibility = 'visible';
  }
}

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

// --- Mobile orientation warning ---
function handleOrientation() {
  let warning = document.getElementById('orientation-warning');

  if (!warning) {
    warning = document.createElement('div');
    warning.id = 'orientation-warning';
    warning.textContent = 'Please rotate your device to portrait mode';
    Object.assign(warning.style, {
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      backgroundColor: '#000',
      color: '#fff',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      fontSize: '1.5rem',
      fontFamily: 'sans-serif',
      zIndex: 9999,
      textAlign: 'center',
      padding: '20px',
      boxSizing: 'border-box',
      opacity: '0',
      pointerEvents: 'none',
      transition: 'opacity 0.3s ease'
    });
    document.body.appendChild(warning);
  }

  const isMobile = /Mobi|Android/i.test(navigator.userAgent);
  const isLandscape = window.innerWidth > window.innerHeight;

  if (isMobile && isLandscape) {
    warning.style.opacity = '1';
    warning.style.pointerEvents = 'all';
  } else {
    warning.style.opacity = '0';
    warning.style.pointerEvents = 'none';
  }
}

window.addEventListener('load', handleOrientation);
window.addEventListener('resize', handleOrientation);
window.addEventListener('orientationchange', handleOrientation);

// --- Mobile idle timeout handling ---
(function() {
  const MOBILE_IDLE_TIMEOUT = 5 * 60 * 1000; // 5 minutes
  let idleTimer = null;

  function startIdleTimer() {
    idleTimer = setTimeout(() => {
      console.log("Idle timeout triggered, redirecting to login...");

      // Clear session data so the user can't return to old page
      sessionStorage.clear();

      // Set the hash to login and reload
      location.replace('#login');
      location.reload();
    }, MOBILE_IDLE_TIMEOUT);
  }

  function resetIdleTimer() {
    if (idleTimer) clearTimeout(idleTimer);
    startIdleTimer();
  }

  startIdleTimer();

  ['click', 'mousemove', 'keydown', 'touchstart'].forEach(evt => {
    window.addEventListener(evt, resetIdleTimer);
  });

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      if (idleTimer) clearTimeout(idleTimer);
    } else {
      startIdleTimer();
    }
  });
})();
