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


async function loadPage() {
  
  window.location.hash = window.location.hash || '#login'; // Set default hash if none exists
  const hash = location.hash.slice(1).split('?')[0]; // Get the hash without the query string
  const route = routes[hash] || routes['login'];


  const html = await fetch(route.html).then(res => res.text());
  app.innerHTML = html;
  style.href = route.css;

  // Remove the old js script if it exists
  const oldScript = document.getElementById('page-script');
  if (oldScript) oldScript.remove();

  const script = document.createElement('script'); // Create a new script element

  //Load the new js script
  script.src = route.js;
  script.id = 'page-script';
  script.async = true;  
  document.body.appendChild(script);
}

window.addEventListener('hashchange', loadPage);
window.addEventListener('load', loadPage);