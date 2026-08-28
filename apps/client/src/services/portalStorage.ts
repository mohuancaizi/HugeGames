const FAVORITES_KEY = "arcade-portal:favorites:v1";
const RECENT_KEY = "arcade-portal:recent:v1";
let sessionFavorites: string[] = [];
let sessionRecent: string[] = [];

function read(key: string, fallback: string[]): { values: string[]; persistent: boolean } {
  try {
    const value = JSON.parse(localStorage.getItem(key) ?? "[]") as unknown;
    return { values: Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [], persistent: true };
  } catch { return { values: fallback, persistent: false }; }
}
function save(key: string, values: string[]): boolean { try { localStorage.setItem(key, JSON.stringify(values)); return true; } catch { return false; } }
export function readFavorites(): { values: string[]; persistent: boolean } { const result = read(FAVORITES_KEY, sessionFavorites); sessionFavorites = result.values.slice(0, 100); return { values: sessionFavorites, persistent: result.persistent }; }
export function readRecent(): { values: string[]; persistent: boolean } { const result = read(RECENT_KEY, sessionRecent); sessionRecent = result.values.slice(0, 50); return { values: sessionRecent, persistent: result.persistent }; }
export function toggleFavorite(slug: string): { values: string[]; persistent: boolean } { const current = readFavorites().values; const values = current.includes(slug) ? current.filter((item) => item !== slug) : [slug, ...current].slice(0, 100); sessionFavorites = values; return { values, persistent: save(FAVORITES_KEY, values) }; }
export function rememberRecent(slug: string): { values: string[]; persistent: boolean } { const values = [slug, ...readRecent().values.filter((item) => item !== slug)].slice(0, 50); sessionRecent = values; return { values, persistent: save(RECENT_KEY, values) }; }
export function removeFavorite(slug: string): void { const values = readFavorites().values.filter((item) => item !== slug); sessionFavorites = values; save(FAVORITES_KEY, values); }
export function clearRecent(): void { sessionRecent = []; save(RECENT_KEY, []); }
