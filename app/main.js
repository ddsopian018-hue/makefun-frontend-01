// Boardroom, a make.fun frontend on hash routes:
//
//   #/                              the bounty board
//   #/bounty/<slug>                 one bounty's page
//   #/bounty/<slug>/leaderboard     that bounty's leaderboard
//   #/u/<handle>                    an account's public profile
//
// window.__shotReady is false while a route loads and true once its data is on
// screen, so a screenshot script knows when to capture. Countdowns tick in
// place every 30 seconds; the page itself is never rebuilt to move a clock.

import { getBounties, getBounty, getLeaderboard, getProfile } from './api.js';
import { timeLeft } from './format.js';
import { board, bounty } from './views.js';

const app = document.getElementById('app');
const boardUi = { q: '', sort: 'closing', page: 1 };
let boardData = null;
let routeToken = 0;

function fail(err) {
  app.innerHTML = `<h1>Something went wrong</h1><p class="empty">${String(err?.message ?? err)}</p><p><a href="#/">Back to the board</a></p>`;
  window.__shotReady = true;
}

/** Re-render the board from its cached data after a search, sort or page change: no new request. */
function paintBoard() {
  app.innerHTML = board(boardData, boardUi);
  const q = document.getElementById('q');
  q.addEventListener('input', () => {
    boardUi.q = q.value;
    boardUi.page = 1;
    const pos = q.selectionStart;
    paintBoard();
    const again = document.getElementById('q');
    again.focus();
    again.setSelectionRange(pos, pos);
  });
  document.getElementById('sort').addEventListener('change', (e) => {
    boardUi.sort = e.target.value;
    boardUi.page = 1;
    paintBoard();
  });
  document.getElementById('more')?.addEventListener('click', () => {
    boardUi.page += 1;
    paintBoard();
  });
}

async function render() {
  const token = ++routeToken;
  window.__shotReady = false;
  app.innerHTML = '<p class="loading">Loading live data…</p>';
  const hash = location.hash || '#/';
  try {
    const lb = hash.match(/^#\/bounty\/([^/]+)\/leaderboard/);
    const bt = hash.match(/^#\/bounty\/([^/]+)/);
    const pf = hash.match(/^#\/u\/([^/]+)/);
    if (lb) {
      const slug = decodeURIComponent(lb[1]);
      const { leaderboard } = await import('./extra.js');
      const data = await getLeaderboard(slug);
      if (token !== routeToken) return;
      document.title = `Leaderboard | ${slug} | Boardroom`;
      let page = 1;
      const paint = () => {
        app.innerHTML = leaderboard(data, slug, page);
        document.getElementById('more')?.addEventListener('click', () => { page += 1; paint(); });
      };
      paint();
    } else if (bt) {
      const b = await getBounty(decodeURIComponent(bt[1]));
      if (token !== routeToken) return;
      document.title = `${b.title} | Boardroom`;
      app.innerHTML = bounty(b);
    } else if (pf) {
      const { profile } = await import('./extra.js');
      const p = await getProfile(decodeURIComponent(pf[1]));
      if (token !== routeToken) return;
      document.title = `@${p.handle} | Boardroom`;
      app.innerHTML = profile(p);
    } else {
      boardData = await getBounties();
      if (token !== routeToken) return;
      document.title = 'make.fun bounties — Boardroom';
      paintBoard();
    }
  } catch (err) {
    if (token === routeToken) fail(err);
    return;
  }
  window.scrollTo(0, 0);
  window.__shotReady = true;
}

/** Tick every countdown in place: one text change a clock, no re-render, no request. */
setInterval(() => {
  for (const el of document.querySelectorAll('[data-deadline]')) {
    el.textContent = timeLeft(el.dataset.deadline);
  }
}, 30000);

window.addEventListener('hashchange', render);
render();
