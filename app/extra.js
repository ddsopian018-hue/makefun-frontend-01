// The leaderboard and the public profile, loaded by main.js only when a route
// asks for them, so the board's first load never pays for them.

import { bytes, date, esc, money, shortAddress, winRate } from './format.js';

/** An avatar the API points at, loaded the way its same-origin policy asks. */
const avatar = (src, handle) =>
  src ? `<img class="avatar" crossorigin="anonymous" src="https://make.fun${esc(src)}" alt="" loading="lazy">` : `<span class="avatar letter">${esc(String(handle ?? '?').slice(0, 1).toUpperCase())}</span>`;

/** One leaderboard row: rank, the entrant (a link to their profile), their entry, its rate and size. */
function row(e) {
  const v = e.values ?? {};
  return `
  <tr>
    <td class="rank">${e.rank ?? ''}</td>
    <td>${avatar(e.image, e.handle)} <a href="#/u/${encodeURIComponent(e.handle ?? '')}">@${esc(e.handle ?? '')}</a>${e.house ? ' <span class="tag">house</span>' : ''}</td>
    <td class="entry-title">${esc(e.title ?? '')}</td>
    <td class="rate">${winRate(v.judge)}</td>
    <td>${v.valid ? 'valid' : '—'}</td>
    <td>${bytes(v.bytes)}</td>
    <td>${esc(e.status ?? '')}</td>
  </tr>`;
}

const PAGE = 50;

/** A bounty's leaderboard: the phase and its window, then the ranked entries in pages of fifty. */
export function leaderboard(data, slug, page = 1) {
  const entries = data.entries ?? [];
  const visible = entries.slice(0, page * PAGE);
  const phase = data.phase ?? {};
  const more = entries.length > visible.length
    ? `<button id="more" type="button">Show more (${entries.length - visible.length} left)</button>`
    : '';
  return `
  <p class="crumbs"><a href="#/bounty/${encodeURIComponent(slug)}">← Bounty page</a> · <a href="#/">All bounties</a></p>
  <h1>Leaderboard</h1>
  <p class="lede">${esc(data.competition?.title ?? slug)} — ${esc(phase.title ?? '')} phase, ${entries.length} ranked entries. Ranked by judge win rate; ties break to the smaller entry.</p>
  ${entries.length ? `
  <table class="board-table">
    <thead><tr><th>#</th><th>Entrant</th><th>Entry</th><th>Win rate</th><th>Valid</th><th>Size</th><th>Status</th></tr></thead>
    <tbody>${visible.map(row).join('')}</tbody>
  </table>${more}` : '<p class="empty">No ranked entries yet. Results appear here once entries are judged.</p>'}`;
}

/** One line of a profile's record: entered, placed, won, podiums and prize money. */
function recordLine(r = {}) {
  return `
  <dl class="facts">
    <div><dt>Entered</dt><dd>${r.competitions_entered ?? 0}</dd></div>
    <div><dt>Placed</dt><dd>${r.competitions_placed ?? 0}</dd></div>
    <div><dt>Won</dt><dd>${r.competitions_won ?? 0}</dd></div>
    <div><dt>Podiums</dt><dd>${r.podium_finishes ?? 0}</dd></div>
    <div><dt>Best place</dt><dd>${r.best_placement ?? '—'}</dd></div>
    <div><dt>Prizes</dt><dd><strong>${money(r.prize_usd)}</strong></dd></div>
  </dl>`;
}

/** An account's public profile: who they are, their record, their placed entries and payouts. */
export function profile(p) {
  const name = p.display_name || `@${p.handle}`;
  const links = [
    p.github_login ? `<span>GitHub: ${esc(p.github_login)}</span>` : '',
    p.discord ? `<span>Discord: ${esc(p.discord)}</span>` : '',
    p.x ? `<span>X: ${esc(p.x)}</span>` : '',
    p.wallet?.address
      ? `<span>Wallet: <a href="${esc(p.wallet.explorer_url ?? '#')}" rel="noopener">${shortAddress(p.wallet.address)}</a></span>`
      : '',
  ].filter(Boolean).join(' · ');
  const solutions = (p.solutions ?? []).map(
    (s) => `<li><a href="#/bounty/${encodeURIComponent(s.competition?.slug ?? '')}">${esc(s.title ?? 'Entry')}</a> — ${esc(s.competition?.title ?? '')}${s.placement ? ` · place ${s.placement}` : ''}${s.prize_usd ? ` · ${money(s.prize_usd)}` : ''}</li>`,
  );
  const payouts = (p.payouts ?? []).map(
    (s) => `<li>${money(s.amount_usd)} — ${esc(s.competition?.title ?? 'prize')}${s.place ? ` (place ${s.place})` : ''}, ${date(s.paid_at)}</li>`,
  );
  return `
  <p class="crumbs"><a href="#/">← All bounties</a></p>
  <div class="profile-head">${avatar(p.image, p.handle)}<div>
    <h1>${esc(name)}</h1>
    <p class="lede">@${esc(p.handle)}${p.house ? ' · house account' : ''} · joined ${date(p.joined_at)}</p>
  </div></div>
  ${p.bio ? `<p>${esc(p.bio)}</p>` : ''}
  <p class="links">${links}</p>
  <h2>Record</h2>
  ${recordLine(p.record)}
  <h2>Placed entries</h2>
  ${solutions.length ? `<ul class="plain">${solutions.join('')}</ul>` : '<p class="empty">No placed entries yet.</p>'}
  <h2>Payouts</h2>
  ${payouts.length ? `<ul class="plain">${payouts.join('')}</ul>` : '<p class="empty">No payouts yet.</p>'}`;
}
