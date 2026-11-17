// make.fun's public API: read-only GET requests, open to any origin (CORS).
// The full API is described at https://make.fun/api/openapi.json.
//
// Answers are cached in memory and revalidated with their ETag: the API binds
// ETags to the minute, so a revalidation inside the minute answers 304 and no
// body crosses the wire, and two views asking for the same path at once share
// one request. Nothing here writes, signs in, or sends a key.

const API = 'https://make.fun/api';
const cache = new Map();
const inflight = new Map();
const FRESH_MS = 20000;

async function get(path) {
  const hit = cache.get(path);
  if (hit && Date.now() - hit.at < FRESH_MS) return hit.body;
  if (inflight.has(path)) return inflight.get(path);
  const run = (async () => {
    const headers = hit?.etag ? { 'if-none-match': hit.etag } : {};
    const res = await fetch(API + path, { headers });
    if (res.status === 304 && hit) {
      hit.at = Date.now();
      return hit.body;
    }
    if (!res.ok) throw new Error(`make.fun answered ${res.status} for ${path}`);
    const body = await res.json();
    cache.set(path, { body, etag: res.headers.get('etag'), at: Date.now() });
    return body;
  })();
  inflight.set(path, run);
  try {
    return await run;
  } finally {
    inflight.delete(path);
  }
}

/** The open bounties: { items: [...] } (activity=times leaves out the activity a board does not show). */
export const getBounties = () => get('/competitions?status=open&activity=times');

/** One bounty, by its slug: summary, description and rules, rewards, live pot, dates, status. */
export const getBounty = (slug) => get(`/competitions/${encodeURIComponent(slug)}`);

/** One bounty's leaderboard: { entries: [...], columns: [...], phase: {...} }. */
export const getLeaderboard = (slug) => get(`/competitions/${encodeURIComponent(slug)}/leaderboard`);

/** One account's public profile: its record, solutions, payouts and wallet. */
export const getProfile = (handle) => get(`/profiles/${encodeURIComponent(handle)}`);
