import { beforeEach, describe, expect, it } from "vitest";
import {
  bestLabel,
  bestScore,
  completedSessions,
  currentDayStreak,
  leaderboard,
  loadStorage,
  perceivedWaitStats,
  recordSession,
  resetAll,
  totalSessions,
  totalWaitTurnedToPlayMs,
  updateSessionPerception,
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
    expect(r.id).toBeTruthy();
    expect(r.dayStreak).toBe(1);
    expect(bestScore("runner")).toBe(1200);
    expect(bestLabel("runner")).toBe("1200");
    expect(totalSessions()).toBe(1);
    expect(completedSessions()).toBe(1);
    expect(r.sessionStreak).toBe(1);
  });

  it("persists the perceived-wait answer onto the exact completed record", () => {
    const r = recordSession({
      gameId: "runner",
      score: 10,
      actualWaitMs: 12000,
      engagedPlayMs: 9000,
      completed: true,
    });
    expect(loadStorage().records[0].feltWaitMs).toBeNull();
    const updated = updateSessionPerception(r.id, 7000);
    expect(updated?.feltWaitMs).toBe(7000);
    expect(loadStorage().records[0].feltWaitMs).toBe(7000);
  });

  it("rejects perception updates for missing or incomplete records", () => {
    const r = recordSession({
      gameId: null,
      score: null,
      actualWaitMs: 3000,
      engagedPlayMs: 0,
      completed: false,
    });
    expect(updateSessionPerception(r.id, 1000)).toBeNull();
    expect(updateSessionPerception("missing", 1000)).toBeNull();
  });

  it("does not count a cancelled session in bests but counts it as a session", () => {
    recordSession({
      gameId: "runner",
      score: 500,
      actualWaitMs: 5000,
      engagedPlayMs: 100,
      completed: true,
    });
    const cancelled = recordSession({
      gameId: "runner",
      score: null,
      actualWaitMs: 3000,
      engagedPlayMs: 0,
      completed: false,
    });
    expect(totalSessions()).toBe(2);
    expect(completedSessions()).toBe(1);
    expect(bestScore("runner")).toBe(500);
    expect(cancelled.sessionStreak).toBe(0);
  });

  it("recomputes session streak from persisted records instead of memory-only state", () => {
    expect(
      recordSession({
        gameId: "runner",
        score: 1,
        actualWaitMs: 1000,
        engagedPlayMs: 500,
        completed: true,
      }).sessionStreak
    ).toBe(1);
    expect(
      recordSession({
        gameId: "runner",
        score: 2,
        actualWaitMs: 1000,
        engagedPlayMs: 500,
        completed: true,
      }).sessionStreak
    ).toBe(2);
    // loadStorage is a fresh read from localStorage; the next result still derives 3.
    expect(loadStorage().records).toHaveLength(2);
    expect(
      recordSession({
        gameId: "runner",
        score: 3,
        actualWaitMs: 1000,
        engagedPlayMs: 500,
        completed: true,
      }).sessionStreak
    ).toBe(3);
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

  it("computes signed perceived-wait statistics", () => {
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
      feltWaitMs: 15000,
      completed: true,
    });
    const stats = perceivedWaitStats();
    expect(stats.samples).toBe(2);
    expect(stats.avgRatio).toBeCloseTo(1);
    expect(stats.avgDeltaMs).toBeCloseTo(0);
  });

  it("totals only time actually played during completed waits", () => {
    recordSession({
      gameId: "runner",
      score: 1,
      actualWaitMs: 8000,
      engagedPlayMs: 5000,
      completed: true,
    });
    recordSession({
      gameId: null,
      score: null,
      actualWaitMs: 4000,
      engagedPlayMs: 0,
      completed: true,
    });
    expect(totalWaitTurnedToPlayMs()).toBe(5000);
  });

  it("preserves a failed outcome instead of laundering it into completion", () => {
    recordSession({
      gameId: "runner",
      score: null,
      actualWaitMs: 1400,
      engagedPlayMs: 400,
      completed: false,
      outcome: "failed",
      failureCode: "HOST_REQUEST_FAILED",
      failureMessage: "DEMO_PROVIDER_TIMEOUT",
    });
    const records = loadStorage().records;
    const rec = records[records.length - 1];
    expect(rec?.completed).toBe(false);
    expect(rec?.outcome).toBe("failed");
    expect(rec?.failureCode).toBe("HOST_REQUEST_FAILED");
    expect(rec?.failureMessage).toBe("DEMO_PROVIDER_TIMEOUT");
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
