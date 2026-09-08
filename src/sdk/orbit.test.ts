import { describe, expect, it } from "vitest";
import { createOrbitSurface, orbitResult, orbitStep, orbitTap } from "./orbit";

describe("orbit physics", () => {
  it("a catch never ends the game — it just stacks the combo", () => {
    const s = createOrbitSurface(480, 220);
    s.fishX = 100;
    s.fishY = 100;
    expect(orbitTap(s, 100, 100, 480, 220)).toBe(true);
    expect(s.caught).toBe(1);
    expect(s.combo).toBe(1);
    expect(s.bestCombo).toBe(1);
    expect(s.active).toBe(true); // still playable
  });

  it("multi-catch builds a combo; a miss resets it", () => {
    const s = createOrbitSurface(480, 220);
    // Force a predictable position after each catch by overwriting.
    for (let i = 0; i < 3; i++) {
      s.fishX = 80 + i * 10;
      s.fishY = 80;
      expect(orbitTap(s, s.fishX, s.fishY, 480, 220)).toBe(true);
    }
    expect(s.caught).toBe(3);
    expect(s.combo).toBe(3);
    expect(s.bestCombo).toBe(3);

    expect(orbitTap(s, -60, -60, 480, 220)).toBe(false);
    expect(s.combo).toBe(0);
    expect(s.misses).toBe(1);
    expect(s.caught).toBe(3);
  });

  it("bounces the target within the play area and speeds up with progress", () => {
    const s = createOrbitSurface(480, 220);
    s.fishX = 10;
    s.fishY = 110;
    s.vx = -40;
    s.vy = 0;
    orbitStep(s, 1 / 60, 480, 220, 0);
    expect(s.fishX).toBeGreaterThanOrEqual(14);
  });

  it("scoring accounts for accuracy and best combo", () => {
    const s = createOrbitSurface(480, 220);
    expect(orbitResult(s, "ai-complete").score).toBe(0);
    s.caught = 4;
    s.misses = 0;
    s.combo = 0;
    s.bestCombo = 4;
    const r = orbitResult(s, "ai-complete");
    expect(r.reason).toBe("ai-complete");
    expect(r.score).toBe(4000 + 4 * 50);
    expect(Array.isArray(r.notes)).toBe(true);
  });
});
