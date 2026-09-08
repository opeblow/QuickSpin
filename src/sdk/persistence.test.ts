import { beforeEach, describe, expect, it } from "vitest";
import {
  bestLabel,
  bestScore,
  completedSessions,
  currentDayStreak,
  leaderboard,
  perceivedWaitStats,
  recordSession,
  resetAll,
  totalSessions,
  totalWaitTurnedToPlayMs,
} from "./persistence";

const DAY = 24 * 60 * 60 * 1000;

describe("persistence", () => {
  beforeEach(() => {
    resetAll();
    Date.now = () => Date.parse("2026-09-08T12:00:00Z");
  });

  it("stores a completed session and yields bests", () => {
    const r = recordSession({
      gameId: "runner",
      score: 1200,
      actualWaitMs: 8000,
      engagedPlayMs: 6000,
      feltWaitMs: 5000,
      completed: true,
    });
    expect(r.dayStreak).toBe(1);
    expect(bestScore("runner")).toBe(1200);
    expect(bestLabel("runner")).toBe("1200");
    expect(totalSessions()).toBe(1);
    expect(completedSessions()).toBe(1);
    expect(r.sessionStreak).toBe(1);
  });

  it("does not count a cancelled session in bests but counts it as a session", () => {
    recordSession({
      gameId: "runner",
      score: 500,
      actualWaitMs: 5000,
      engagedPlayMs: 100,
      completed: true,
    });
    recordSession({
      gameId: "runner",
      score: null,
      actualWaitMs: 3000,
      engagedPlayMs: 0,
      completed: false,
    });
    expect(totalSessions()).toBe(2);
    expect(completedSessions()).toBe(1);
    expect(bestScore("runner")).toBe(500);
    expect(bestLabel("runner")).toBe("500");
  });

  it("caps the stored record list", () => {
    for (let i = 0; i < 1010; i++) {
      recordSession({
        gameId: "orbit",
        score: i,
        actualWaitMs: 1000,
        engagedPlayMs: 200,
        completed: true,
      });
    }
    expect(totalSessions()).toBe(1000);
    expect(leaderboard("orbit", 5)[0].score).toBe(1009);
  });

  it("survives corrupt storage gracefully", () => {
    localStorage.setItem("quickspin:sessions:v1", "{not json[[");
    expect(totalSessions()).toBe(0);
    expect(
      recordSession({
        gameId: "runner",
        score: 1,
        actualWaitMs: 1,
        engagedPlayMs: 0,
        completed: true,
      }).dayStreak
    ).toBe(1);
  });

  it("computes a calendar-day streak across consecutive days ending today", () => {
    const today = Date.now();
    recordSession({
      gameId: "runner",
      score: 1,
      actualWaitMs: 1,
      engagedPlayMs: 0,
      completed: true,
    });
    Date.now = () => today - DAY;
    recordSession({
      gameId: "runner",
      score: 2,
      actualWaitMs: 1,
      engagedPlayMs: 0,
      completed: true,
    });
    Date.now = () => today - 2 * DAY;
    recordSession({
      gameId: "runner",
      score: 3,
      actualWaitMs: 1,
      engagedPlayMs: 0,
      completed: true,
    });
    Date.now = () => today;
    expect(currentDayStreak()).toBe(3);
  });

  it("resets the session streak when a wait is cancelled or fails", () => {
    recordSession({
      gameId: "runner",
      score: 1,
      actualWaitMs: 1,
      engagedPlayMs: 0,
      completed: true,
    });
    recordSession({
      gameId: "runner",
      score: 2,
      actualWaitMs: 1,
      engagedPlayMs: 0,
      completed: true,
    });
    const r = recordSession({
      gameId: "runner",
      score: null,
      actualWaitMs: 5,
      engagedPlayMs: 0,
      completed: false,
    });
    expect(r.sessionStreak).toBe(0);
  });

  it("computes average perceived-vs-actual ratio", () => {
    recordSession({
      gameId: "runner",
      score: 1,
      actualWaitMs: 10000,
      engagedPlayMs: 1000,
      feltWaitMs: 5000,
      completed: true,
    });
    recordSession({
      gameId: "runner",
      score: 1,
      actualWaitMs: 10000,
      engagedPlayMs: 1000,
      feltWaitMs: 10000,
      completed: true,
    });
    const stats = perceivedWaitStats();
    expect(stats.samples).toBe(2);
    expect(stats.avgRatio).toBeCloseTo(0.75);
  });

  it("totals only genuine wait that was turned into play", () => {
    recordSession({
      gameId: "runner",
      score: 1,
      actualWaitMs: 8000,
      engagedPlayMs: 5000,
      completed: true,
    });
    recordSession({
      gameId: "runner",
      score: null,
      actualWaitMs: 4000,
      engagedPlayMs: 0,
      completed: false,
    });
    expect(totalWaitTurnedToPlayMs()).toBe(8000);
  });

  it("resetAll clears everything", () => {
    recordSession({
      gameId: "runner",
      score: 9,
      actualWaitMs: 1,
      engagedPlayMs: 0,
      completed: true,
    });
    resetAll();
    expect(totalSessions()).toBe(0);
    expect(bestScore("runner")).toBe(0);
  });
});
