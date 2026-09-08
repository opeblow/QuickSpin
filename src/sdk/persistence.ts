const STORAGE_KEY = "quickspin:sessions:v1";

export interface SessionRecord {
  id: string;
  gameId: string | null;
  score: number | null;
  /** Time from session.start() to session.complete() — the real AI wait. */
  actualWaitMs: number;
  /** Time the player was actively in a running game during the wait. */
  engagedPlayMs: number;
  /** What the user told us the wait felt like (perceived-wait question). */
  feltWaitMs: number | null;
  completed: boolean;
  ts: number;
}

interface Persisted {
  version: 1;
  records: SessionRecord[];
}

const CAP = 1000;

export function loadStorage(): Persisted {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { version: 1, records: [] };
    const parsed = JSON.parse(raw) as Partial<Persisted>;
    if (!Array.isArray(parsed.records)) return { version: 1, records: [] };
    const records = parsed.records.filter((r) => typeof r?.ts === "number").slice(-CAP);
    return { version: 1, records };
  } catch {
    return { version: 1, records: [] };
  }
}

function save(p: Persisted): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(p));
  } catch {
    /* private mode / quota — non-fatal */
  }
}

let sessionStreakCounter = 0;

export function recordSession(input: {
  gameId: string | null;
  score: number | null;
  actualWaitMs: number;
  engagedPlayMs: number;
  feltWaitMs?: number | null;
  completed: boolean;
}): { isHighScore: boolean; dayStreak: number; sessionStreak: number } {
  const p = loadStorage();
  const previousBest = input.gameId ? bestScore(input.gameId) : 0;
  const isHighScore = input.completed && !!input.gameId && (input.score ?? 0) > previousBest;

  p.records.push({
    id: (globalThis.crypto?.randomUUID?.() ?? Math.random().toString(36).slice(2)) as string,
    gameId: input.gameId,
    score: input.completed ? input.score : null,
    actualWaitMs: input.actualWaitMs,
    engagedPlayMs: input.engagedPlayMs,
    feltWaitMs: input.feltWaitMs ?? null,
    completed: input.completed,
    ts: Date.now(),
  });
  if (p.records.length > CAP) p.records = p.records.slice(-CAP);
  save(p);

  if (input.completed) sessionStreakCounter += 1;
  else sessionStreakCounter = 0;

  return { isHighScore, dayStreak: currentDayStreak(), sessionStreak: sessionStreakCounter };
}

export function bestScore(gameId: string): number {
  const p = loadStorage();
  return p.records
    .filter((r) => r.gameId === gameId && r.completed && typeof r.score === "number")
    .reduce((max, r) => (r.score! > max ? r.score! : max), 0);
}

export function bestLabel(gameId: string): string | null {
  const p = loadStorage();
  const best = p.records
    .filter((r) => r.gameId === gameId && r.completed && typeof r.score === "number")
    .sort((a, b) => (b.score ?? 0) - (a.score ?? 0))[0];
  return best ? `${best.score}` : null;
}

/** Total real AI wait time from completed sessions (i.e. actually gamified). */
export function totalWaitTurnedToPlayMs(): number {
  const p = loadStorage();
  return p.records.filter((r) => r.completed).reduce((sum, r) => sum + r.actualWaitMs, 0);
}

export function totalSessions(): number {
  return loadStorage().records.length;
}

export function completedSessions(): number {
  return loadStorage().records.filter((r) => r.completed).length;
}

/** Consecutive calendar days (ending today) that contain a completed session. */
export function currentDayStreak(): number {
  const p = loadStorage();
  const days = new Set(
    p.records.filter((r) => r.completed).map((r) => new Date(r.ts).toDateString())
  );
  let streak = 0;
  const cursor = new Date();
  while (days.has(cursor.toDateString())) {
    streak++;
    cursor.setTime(cursor.getTime() - 24 * 60 * 60 * 1000);
  }
  return streak;
}

/** Average perceived-vs-actual wait ratio across sessions with a felt value. */
export function perceivedWaitStats(): { samples: number; avgRatio: number } {
  const p = loadStorage();
  const felt = p.records.filter((r) => typeof r.feltWaitMs === "number" && r.actualWaitMs > 0);
  if (felt.length === 0) return { samples: 0, avgRatio: 0 };
  const sumRatio = felt.reduce((s, r) => s + (r.feltWaitMs ?? 0) / r.actualWaitMs, 0);
  return { samples: felt.length, avgRatio: sumRatio / felt.length };
}

export function leaderboard(gameId: string, limit = 10): { score: number; ts: number }[] {
  const p = loadStorage();
  return p.records
    .filter((r) => r.gameId === gameId && r.completed && typeof r.score === "number")
    .sort((a, b) => (b.score ?? 0) - (a.score ?? 0))
    .slice(0, limit)
    .map((r) => ({ score: r.score!, ts: r.ts }));
}

export function resetAll(): void {
  sessionStreakCounter = 0;
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* noop */
  }
}
