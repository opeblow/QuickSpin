import type { EndReason, GameDefinition, GameHost, GameInstance, GameResult } from "./types";

export interface OrbitSurface {
  baseSpeed: number;
  fishX: number;
  fishY: number;
  vx: number;
  vy: number;
  caught: number;
  misses: number;
  combo: number;
  bestCombo: number;
  radius: number;
  active: boolean;
}

export function createOrbitSurface(width: number, height: number): OrbitSurface {
  return {
    baseSpeed: 60,
    fishX: width / 2,
    fishY: height / 2,
    vx: 60,
    vy: 40,
    caught: 0,
    misses: 0,
    combo: 0,
    bestCombo: 0,
    radius: 9,
    active: true,
  };
}

/** Bounce the target around inside the logical play area (multi-catch). */
export function orbitStep(
  s: OrbitSurface,
  dt: number,
  width: number,
  height: number,
  progress: number
): void {
  if (!s.active) return;
  const p = Math.max(0, Math.min(1, progress ?? 0));
  const speedScale = 1 + p * 1.5 + Math.min(s.combo, 8) * 0.05;
  s.fishX += s.vx * speedScale * dt;
  s.fishY += s.vy * speedScale * dt;
  const m = 14;
  if (s.fishX < m) {
    s.fishX = m;
    s.vx = Math.abs(s.vx);
  }
  if (s.fishX > width - m) {
    s.fishX = width - m;
    s.vx = -Math.abs(s.vx);
  }
  if (s.fishY < m) {
    s.fishY = m;
    s.vy = Math.abs(s.vy);
  }
  if (s.fishY > height - m) {
    s.fishY = height - m;
    s.vy = -Math.abs(s.vy);
  }
}

/** Return true when a catch connects; advances combo or resets it. */
export function orbitTap(
  s: OrbitSurface,
  tx: number,
  ty: number,
  width: number,
  height: number
): boolean {
  const d = Math.hypot(tx - s.fishX, ty - s.fishY);
  const hit = d < 34 && s.active;
  if (hit) {
    s.caught += 1;
    s.combo += 1;
    s.bestCombo = Math.max(s.bestCombo, s.combo);
    s.fishX = 28 + Math.random() * Math.max(1, width - 56);
    s.fishY = 28 + Math.random() * Math.max(1, height - 56);
    const ang = Math.random() * Math.PI * 2;
    s.vx = Math.cos(ang) * (70 + Math.random() * 90);
    s.vy = Math.sin(ang) * (70 + Math.random() * 90);
  } else {
    s.misses += 1;
    s.combo = 0;
  }
  return hit;
}

export function orbitResult(s: OrbitSurface, reason: EndReason): GameResult {
  const acc = s.caught + s.misses;
  const accuracy = acc > 0 ? s.caught / acc : 0;
  const score = Math.max(
    0,
    Math.round(s.caught * 1000 * (0.4 + accuracy * 0.6) + s.bestCombo * 50)
  );
  const notes: string[] = [];
  if (s.caught >= 3) notes.push(`Best combo: ${s.bestCombo}`);
  if (reason === "ai-complete") notes.push("AI finished — you beat the wait.");
  return { score, label: `${score.toLocaleString()} pts`, notes, reason };
}

export const orbitGame: GameDefinition = {
  id: "orbit",
  name: "Orbit Catch",
  tagline: "Catch the glow target. Multi-catch, combo-scored.",
  controls: "Tap the target to catch it",
  create(host: GameHost): GameInstance {
    let logicalW = host.canvas.clientWidth || 480;
    let logicalH = host.canvas.clientHeight || 220;
    let state = createOrbitSurface(logicalW, logicalH);
    let paused = false;
    let lastW = 0;
    let lastH = 0;
    const ctx = host.canvas.getContext("2d");

    const resizeIfNeeded = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      logicalW = host.canvas.clientWidth || 480;
      logicalH = host.canvas.clientHeight || 220;
      const bw = Math.round(logicalW * dpr);
      const bh = Math.round(logicalH * dpr);
      if (lastW !== bw || lastH !== bh || host.canvas.width !== bw || host.canvas.height !== bh) {
        lastW = bw;
        lastH = bh;
        host.canvas.width = bw;
        host.canvas.height = bh;
        ctx?.setTransform(dpr, 0, 0, dpr, 0, 0);
        state = createOrbitSurface(logicalW, logicalH);
      }
    };

    const onPointer = (e: PointerEvent) => {
      if (!state.active) return;
      e.preventDefault();
      const rect = host.canvas.getBoundingClientRect();
      orbitTap(state, e.clientX - rect.left, e.clientY - rect.top, logicalW, logicalH);
    };

    const draw = () => {
      if (!ctx) return;
      ctx.clearRect(0, 0, logicalW, logicalH);
      ctx.save();
      ctx.strokeStyle = "rgba(24,26,39,0.4)";
      ctx.lineWidth = 1;
      const step = 30;
      for (let x = 0; x <= logicalW; x += step) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, logicalH);
        ctx.stroke();
      }
      for (let y = 0; y <= logicalH; y += step) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(logicalW, y);
        ctx.stroke();
      }
      ctx.restore();
      const g = ctx.createRadialGradient(state.fishX, state.fishY, 0, state.fishX, state.fishY, 30);
      g.addColorStop(0, "rgba(96,239,183,0.9)");
      g.addColorStop(1, "rgba(96,239,183,0)");
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(state.fishX, state.fishY, 30, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#60efb7";
      ctx.beginPath();
      ctx.arc(state.fishX, state.fishY, state.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.font = "10px system-ui, sans-serif";
      ctx.fillStyle = "rgba(255,255,255,0.55)";
      ctx.fillText(
        `caught ${state.caught} · combo ${state.combo} · accuracy ${state.caught > 0 || state.misses > 0 ? Math.round((state.caught / Math.max(1, state.caught + state.misses)) * 100) : 0}%`,
        8,
        12
      );
    };

    return {
      start() {
        paused = false;
        resizeIfNeeded();
        host.canvas.addEventListener("pointerdown", onPointer);
        host.canvas.setAttribute(
          "aria-label",
          orbitGame.name +
            ": tap the glow target to catch it. More catches in a row build a combo. While the model thinks, keep your hand warm."
        );
      },
      tick(_time: number, dt: number) {
        if (paused) return;
        resizeIfNeeded();
        orbitStep(state, Math.min(dt, 0.05), logicalW, logicalH, host.progress ?? 0);
        draw();
      },
      finish(reason) {
        return orbitResult(state, reason);
      },
      pause() {
        paused = true;
      },
      resume() {
        paused = false;
      },
      destroy() {
        host.canvas.removeEventListener("pointerdown", onPointer);
      },
    };
  },
};
