const STORAGE_KEY = "waitfun:leaderboard:v1";

interface StoredEntry {
  id: string;
  gameId: string;
  score: number;
  label: string;
  waitedMs: number;
  ts: number;
}

interface Persisted {
  entries: StoredEntry[];
}

function load(): Persisted {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { entries: [] };
    const parsed = JSON.parse(raw) as Persisted;
    if (!Array.isArray(parsed.entries)) return { entries: [] };
    return parsed;
  } catch {
    return { entries: [] };
  }
}

function save(p: Persisted): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(p));
  } catch {
    /* private mode / quota — non-fatal */
  }
}

let _paused = false;

export function setPaused(v: boolean): void {
  _paused = v;
}

export function isPaused(): boolean {
  return _paused;
}

export function recordResult(
  gameId: string,
  score: number,
  label: string,
  waitedMs: number
): {
  isHighScore: boolean;
  streak: number;
} {
  const p = load();
  const previousBest = bestScore(gameId);
  const isHighScore = score > previousBest;
  p.entries.push({
    id: crypto.randomUUID(),
    gameId,
    score,
    label,
    waitedMs,
    ts: Date.now(),
  });
  // Cap storage to avoid unbounded growth.
  if (p.entries.length > 500) {
    p.entries = p.entries.slice(-500);
  }
  save(p);
  const streak = currentStreak();
  return { isHighScore, streak };
}

export function bestScore(gameId: string): number {
  const p = load();
  return p.entries
    .filter((e) => e.gameId === gameId)
    .reduce((max, e) => (e.score > max ? e.score : max), 0);
}

export function bestLabel(gameId: string): string | null {
  const p = load();
  const best = p.entries.filter((e) => e.gameId === gameId).sort((a, b) => b.score - a.score)[0];
  return best ? best.label : null;
}

export function totalWaitedSeconds(): number {
  const p = load();
  return Math.round(p.entries.reduce((sum, e) => sum + e.waitedMs, 0) / 1000);
}

export function totalSessions(): number {
  return load().entries.length;
}

export function currentStreak(): number {
  const p = load();
  if (p.entries.length === 0) return 0;
  const DAY = 24 * 60 * 60 * 1000;
  const dates = new Set(p.entries.map((e) => new Date(e.ts).toDateString()));
  // Count consecutive trailing days (today included).
  const today = new Date().toDateString();
  if (!dates.has(today)) return 0;
  let streak = 0;
  const cursor = new Date();
  while (true) {
    if (dates.has(cursor.toDateString())) {
      streak++;
      cursor.setTime(cursor.getTime() - DAY);
    } else {
      break;
    }
  }
  return streak;
}

export function leaderboard(gameId: string, limit = 10): { label: string; score: number }[] {
  const p = load();
  return p.entries
    .filter((e) => e.gameId === gameId)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((e) => ({ label: e.label, score: e.score }));
}

export function resetAll(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* noop */
  }
}
