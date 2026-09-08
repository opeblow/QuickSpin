import { describe, expect, it } from "vitest";
import {
  createRunnerSurface,
  runnerCollides,
  runnerJump,
  runnerResult,
  runnerStep,
} from "./runner";

describe("runner physics", () => {
  it("starts ready with the obstacle just beyond the right edge", () => {
    const s = createRunnerSurface(480, 220);
    expect(s.ready).toBe(true);
    expect(s.obstacleX).toBe(480 + 40);
    expect(s.obstacleX + s.obstacleW > 480).toBe(true);
  });

  it("never spawns the next obstacle until the current one has fully exited the left edge", () => {
    const s = createRunnerSurface(480, 220);
    let prev = s.obstacleX;
    // One frame of movement at the starting speed (dt = 1/60).
    const maxStep = 220 / 60;
    for (let i = 0; i < 1000; i++) {
      runnerStep(s, 1 / 60, 480, 0);
      if (s.obstacleX > prev) {
        // The obstacle may only respawn once it has cleared the left edge
        // within one frame of travel — never while still visibly on screen.
        expect(prev + s.obstacleW).toBeLessThan(maxStep + 0.0001);
        expect(s.obstacleX).toBeGreaterThanOrEqual(480);
      }
      prev = s.obstacleX;
    }
  });

  it("lets the obstacle enter the screen from the right", () => {
    const s = createRunnerSurface(480, 220);
    let seen = false;
    for (let i = 0; i < 1000; i++) {
      runnerStep(s, 1 / 60, 480, 0);
      if (s.obstacleX < 480 && s.obstacleX > 0) seen = true;
    }
    expect(seen).toBe(true);
  });

  it("jump moves the player up (feet-anchored) and returns to the ground", () => {
    const s = createRunnerSurface(480, 220);
    const groundTop = s.groundY - 40;
    expect(s.playerY).toBe(groundTop);
    runnerJump(s);
    expect(s.grounded).toBe(false);
    const y0 = s.playerY;
    runnerStep(s, 1 / 60, 480, 0);
    expect(s.playerY).toBeLessThan(y0);
    let steps = 0;
    while (!s.grounded && steps < 300) {
      runnerStep(s, 1 / 60, 480, 0);
      steps++;
    }
    expect(s.grounded).toBe(true);
    expect(s.playerY).toBe(groundTop);
  });

  it("detects a grounded collision and no collision while airborne high above", () => {
    const s = createRunnerSurface(480, 220);
    s.obstacleX = 8;
    s.obstacleW = 30;
    s.playerY = s.groundY - 40;
    expect(runnerCollides(s)).toBe(true);
    s.playerY = s.groundY - 120;
    expect(runnerCollides(s)).toBe(false);
  });

  it("stop simulating once crashed", () => {
    const s = createRunnerSurface(480, 220);
    s.crashed = true;
    s.obstacleX = 100;
    runnerStep(s, 1 / 60, 480, 0);
    expect(s.obstacleX).toBe(100);
    runnerJump(s);
    expect(s.playerY).toBe(s.groundY - 40);
  });

  it("reports an honest score from live state, tagged to the reason", () => {
    const s = createRunnerSurface(480, 220);
    runnerStep(s, 1, 480, 0);
    const r = runnerResult(s, "ai-complete");
    expect(r.reason).toBe("ai-complete");
    expect(r.score).toBeGreaterThanOrEqual(0);
    expect(r.notes.length).toBeGreaterThan(0);
    const failed = runnerResult(s, "player-failed");
    expect(failed.reason).toBe("player-failed");
  });
});
