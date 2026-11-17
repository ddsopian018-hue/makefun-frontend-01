// The board and the bounty page, each a function from API data to HTML.
// The leaderboard and profile views live in extra.js and load only when routed to.

import { accepting, date, esc, money, timeLeft } from './format.js';

/** The reward as it stands now: the prize plus any entry fees paid into it. */
export const pot = (b) => money(b.potUsd ?? b.rewardAmount);

/** The entry fee line, when the bounty charges one. */
export const fee = (b) => (b.entryFeeUsd ? `${money(b.entryFeeUsd)} fee` : 'free to enter');

/** A bounty still taking entries sorts and labels by its deadline, never its status alone. */
const state = (b) => (accepting(b) ? 'open' : 'closed');

/** One board card. The whole card is the link to the bounty's page. */
function card(b) {
  const skills = (b.skills ?? []).slice(0, 3).map((s) => `<span class="chip">${esc(s)}</span>`).join('');
  return `
  <li class="card ${state(b)}">
    <a href="#/bounty/${encodeURIComponent(b.slug)}">
      <span class="card-top"><span class="cat">${esc(b.category ?? 'Bounty')}</span><span class="when" data-deadline="${esc(b.deadline)}">${timeLeft(b.deadline)}</span></span>
      <span class="card-title">${esc(b.title)}</span>
      <span class="card-meta">
        <strong class="pot">${pot(b)}</strong>
        <span>${fee(b)}</span>
        <span>${b.submissionCount} ${b.submissionCount === 1 ? 'entry' : 'entries'}</span>
      </span>
      <span class="chips">${skills}</span>
    </a>
  </li>`;
}

/** The board: live totals, a search box, sort orders, and the cards in pages of twelve. */
export function board(data, ui = {}) {
  const items = data.items ?? [];
  const open = items.filter(accepting);
  const totalPot = items.reduce((sum, b) => sum + Number(b.potUsd ?? b.rewardAmount ?? 0), 0);
  const totalEntries = items.reduce((sum, b) => sum + Number(b.submissionCount ?? 0), 0);
  const q = (ui.q ?? '').toLowerCase();
  const shown = items.filter(
    (b) => !q || `${b.title} ${b.category ?? ''} ${(b.skills ?? []).join(' ')}`.toLowerCase().includes(q),
  );
  const sorters = {
    closing: (a, b) => new Date(a.deadline) - new Date(b.deadline),
    pot: (a, b) => Number(b.potUsd ?? b.rewardAmount ?? 0) - Number(a.potUsd ?? a.rewardAmount ?? 0),
    entries: (a, b) => Number(b.submissionCount ?? 0) - Number(a.submissionCount ?? 0),
  };
  shown.sort(sorters[ui.sort] ?? sorters.closing);
  const page = ui.page ?? 1;
  const visible = shown.slice(0, page * 12);
  const cards = visible.map(card).join('');
  const more = shown.length > visible.length
    ? `<button id="more" type="button">Show more (${shown.length - visible.length} left)</button>`
    : '';
  const options = [
    ['closing', 'Closing soonest'],
    ['pot', 'Biggest pot'],
    ['entries', 'Most entries'],
  ]
    .map(([v, label]) => `<option value="${v}"${(ui.sort ?? 'closing') === v ? ' selected' : ''}>${label}</option>`)
    .join('');
  return `
  <section class="hero">
    <h1>Live bounties on make.fun</h1>
    <p class="stats"><strong>${open.length}</strong> taking entries · <strong>${money(totalPot)}</strong> in live pots · <strong>${totalEntries.toLocaleString('en-US')}</strong> entries so far</p>
    <div class="tools">
      <label class="search">Search <input id="q" type="search" placeholder="game, frontend, Solana…" value="${esc(ui.q ?? '')}"></label>
      <label>Sort <select id="sort">${options}</select></label>
    </div>
  </section>
  ${shown.length ? `<ul class="board">${cards}</ul>${more}` : '<p class="empty">No bounty matches that search.</p>'}`;
}

/** The rewards table of a bounty page: place, base prize, its share of the fees, the total now. */
export function rewardsTable(b) {
  const rows = (b.rewardsNow ?? []).map(
    (r) => `<tr><td>${r.place}</td><td>${money(r.baseUsd)}</td><td>${money(r.feeShareUsd)}</td><td><strong>${money(r.amountUsd)}</strong></td></tr>`,
  );
  if (!rows.length && b.rewards) {
    for (const [place, amount] of Object.entries(b.rewards)) {
      rows.push(`<tr><td>${esc(place)}</td><td>${money(amount)}</td><td>—</td><td><strong>${money(amount)}</strong></td></tr>`);
    }
  }
  if (!rows.length) return '';
  return `
  <h2>Rewards — live pot ${pot(b)}</h2>
  <table class="rewards">
    <thead><tr><th>Place</th><th>Prize</th><th>Fee share</th><th>Pays now</th></tr></thead>
    <tbody>${rows.join('')}</tbody>
  </table>`;
}

/** The bounty's description and rules as readable HTML: headings, lists and paragraphs, all escaped first. */
export function richText(text) {
  const out = [];
  let list = false;
  for (const raw of String(text ?? '').split('\n')) {
    const line = raw.trim();
    if (/^#{1,3}\s/.test(line)) {
      if (list) { out.push('</ul>'); list = false; }
      out.push(`<h3>${esc(line.replace(/^#{1,3}\s/, ''))}</h3>`);
    } else if (/^[-*]\s/.test(line)) {
      if (!list) { out.push('<ul>'); list = true; }
      out.push(`<li>${esc(line.replace(/^[-*]\s/, ''))}</li>`);
    } else if (line) {
      if (list) { out.push('</ul>'); list = false; }
      out.push(`<p>${esc(line)}</p>`);
    }
  }
  if (list) out.push('</ul>');
  return out.join('');
}

/** One bounty's page: summary, the facts that decide entering, its rewards and its rules. */
export function bounty(b) {
  const sponsor = b.sponsor?.name ? ` by ${esc(b.sponsor.name)}${b.sponsor.isVerified ? ' ✓' : ''}` : '';
  const skills = (b.skills ?? []).map((s) => `<span class="chip">${esc(s)}</span>`).join('');
  return `
  <p class="crumbs"><a href="#/">← All bounties</a> · <a href="#/bounty/${encodeURIComponent(b.slug)}/leaderboard">Leaderboard →</a></p>
  <h1>${esc(b.title)}</h1>
  <p class="lede">${esc(b.summary ?? '')}</p>
  <dl class="facts">
    <div><dt>Live pot</dt><dd><strong>${pot(b)}</strong></dd></div>
    <div><dt>Entry fee</dt><dd>${b.entryFeeUsd ? money(b.entryFeeUsd) : 'Free'}</dd></div>
    <div><dt>Time left</dt><dd data-deadline="${esc(b.deadline)}">${timeLeft(b.deadline)}</dd></div>
    <div><dt>Deadline</dt><dd>${date(b.deadline)}</dd></div>
    <div><dt>Entries</dt><dd>${b.submissionCount}</dd></div>
    <div><dt>Status</dt><dd>${accepting(b) ? 'Taking entries' : 'Entries closed'} (${esc(b.status ?? '')})</dd></div>
    <div><dt>Category</dt><dd>${esc(b.category ?? '—')}${sponsor}</dd></div>
    <div><dt>Opened</dt><dd>${date(b.publishedAt ?? b.opensAt)}</dd></div>
  </dl>
  <p class="chips">${skills}</p>
  ${rewardsTable(b)}
  <h2>About this bounty</h2>
  <div class="description">${richText(b.description)}</div>`;
}
