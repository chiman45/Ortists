// Browser-side memory of recent GET answers, shared by every page.
//
// Each page used to download everything again on every visit and showed a
// loading skeleton until it arrived. With this, a page first shows what was
// loaded last time (instantly), then quietly refreshes it.
//
// Lives in memory only: it is cleared by a full page reload and on sign-out.

interface Entry { at: number; data: unknown }

const store    = new Map<string, Entry>();
const inflight = new Map<string, Promise<unknown>>();

/** Last known answer for this URL, however old, or undefined. */
export function peek<T>(url: string): T | undefined {
  return store.get(url)?.data as T | undefined;
}

export function setCached(url: string, data: unknown): void {
  store.set(url, { at: Date.now(), data });
}

/** Forget every answer whose URL starts with one of these prefixes (call after a change). */
export function invalidate(...prefixes: string[]): void {
  for (const key of [...store.keys()]) {
    if (prefixes.some(p => key.startsWith(p))) store.delete(key);
  }
}

let owner: string | null = null;

/** Tie the cache to one account: a different signed-in user starts empty. */
export function bindCacheToUser(userId: string | null): void {
  if (owner !== userId) { store.clear(); inflight.clear(); owner = userId; }
}

export function clearClientCache(): void {
  store.clear();
  inflight.clear();
}

/**
 * GET JSON. An answer younger than `maxAge` ms is reused without a request,
 * and two callers asking for the same URL at once share one request.
 */
export async function getJSON<T>(url: string, maxAge = 0): Promise<T> {
  const hit = store.get(url);
  if (hit && Date.now() - hit.at < maxAge) return hit.data as T;

  const running = inflight.get(url);
  if (running) return running as Promise<T>;

  const p = fetch(url)
    .then(async r => {
      if (!r.ok) throw new Error(`${r.status}`);
      const data = await r.json();
      store.set(url, { at: Date.now(), data });
      return data;
    })
    .finally(() => inflight.delete(url));
  inflight.set(url, p);
  return p as Promise<T>;
}

/**
 * Show-then-refresh: calls `onData` straight away with the last known answer
 * (if any), then again with a fresh one unless the cached copy is younger than
 * `maxAge`. Returns a function that stops further callbacks (use as effect cleanup).
 */
export function swr<T>(url: string, onData: (data: T) => void, maxAge = 0): () => void {
  let live = true;
  const hit = store.get(url);
  if (hit) onData(hit.data as T);
  if (!hit || Date.now() - hit.at >= maxAge) {
    getJSON<T>(url, maxAge).then(d => { if (live) onData(d); }).catch(() => {});
  }
  return () => { live = false; };
}
