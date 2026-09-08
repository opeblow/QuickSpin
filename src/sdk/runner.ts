import type { EndReason, GameDefinition, GameHost, GameInstance, GameResult } from "./types";

export interface RunnerSurface {
  speed: number;
  groundY: number;
  playerY: number;
  vy: number;
  grounded: boolean;
  obstacleX: number;
  obstacleW: number;
  obstacleH: number;
  distance: number;
  crashed: boolean;
  ready: boolean;
}

const PLAYER_H = 40;
const PLAYER_W = 24;
const GRAVITY = 2400;
const JUMP = 720;

export function createRunnerSurface(width: number, height: number): RunnerSurface {
  const groundY = height - 44;
  return {
    speed: 0,
    groundY,
    playerY: groundY - PLAYER_H,
    vy: 0,
    grounded: true,
    obstacleX: width + 40,
    obstacleW: 30,
    obstacleH: 52,
    distance: 0,
    crashed: false,
    ready: true,
  };
}

/** One physics step. All coordinates are logical (CSS) pixels. */
export function runnerStep(s: RunnerSurface, dt: number, width: number, progress: number): void {
  if (s.crashed) return;
  const p = Math.max(0, Math.min(1, progress ?? 0));
  s.speed = 220 * (1 + 0.9 * p);
  s.distance += s.speed * dt;

  if (!s.grounded) {
    s.vy += GRAVITY * dt;
    s.playerY += s.vy * dt;
    if (s.playerY >= s.groundY - PLAYER_H) {
      s.playerY = s.groundY - PLAYER_H;
      s.vy = 0;
      s.grounded = true;
    }
  }

  s.obstacleX -= s.speed * dt;

  // Spawn the next obstacle only once the current one has fully exited
  // the left edge — then give it a randomized, fair gap before it returns.
  if (s.obstacleX + s.obstacleW < 0) {
    s.obstacleX = width + 40 + (180 + Math.random() * 140);
    s.obstacleH = 40 + Math.random() * 28;
  }
}

export function runnerJump(s: RunnerSurface): void {
  if (s.crashed) return;
  if (s.grounded) {
    s.grounded = false;
    s.vy = -JUMP;
  }
}

/** AABB collision with a forgiving box. */
export function runnerCollides(s: RunnerSurface): boolean {
  if (s.crashed) return false;
  const px = 8;
  return (
    s.obstacleX < px + PLAYER_W &&
    s.obstacleX + s.obstacleW > px &&
    s.playerY + PLAYER_H - 6 > s.groundY - s.obstacleH &&
    s.playerY < s.groundY - 2
  );
}

export function runnerResult(s: RunnerSurface, reason: EndReason): GameResult {
  const score = Math.max(0, Math.floor(s.distance));
  const notes: string[] = [];
  if (reason === "ai-complete") notes.push("AI finished — you beat the wait.");
  if (reason === "player-failed") notes.push("Crashed — the wait wins this round.");
  return { score, label: `${score.toLocaleString()} m`, notes, reason };
}

export const runnerGame: GameDefinition = {
  id: "runner",
  name: "Wait Runner",
  tagline: "Outrun the wait.",
  controls: "Space or tap to jump",
  create(host: GameHost): GameInstance {
    let logicalW = host.canvas.clientWidth || 480;
    let logicalH = host.canvas.clientHeight || 220;
    let state = createRunnerSurface(logicalW, logicalH);
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
        state = createRunnerSurface(logicalW, logicalH);
      }
    };

    const onKey = (e: KeyboardEvent) => {
      if (e.code !== "Space") return;
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable)) return;
      // Let buttons and links inside the widget keep their native Space activation.
      if (t && t !== host.root && !t.classList.contains("quickspin-canvas")) return;
      e.preventDefault();
      runnerJump(state);
    };

    const onPointer = (e: PointerEvent) => {
      e.preventDefault();
      runnerJump(state);
    };

    const draw = () => {
      if (!ctx) return;
      ctx.clearRect(0, 0, logicalW, logicalH);
      ctx.strokeStyle = "rgba(255,214,106,0.55)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, state.groundY);
      ctx.lineTo(logicalW, state.groundY);
      ctx.stroke();
      if (state.obstacleX + state.obstacleW > 0 && state.obstacleX < logicalW) {
        ctx.fillStyle = "rgba(255,120,120,0.85)";
        ctx.fillRect(
          state.obstacleX,
          state.groundY - state.obstacleH,
          state.obstacleW,
          state.obstacleH
        );
      }
      ctx.fillStyle = "rgba(255,214,106,0.95)";
      ctx.fillRect(8, state.playerY, PLAYER_W, PLAYER_H);
      ctx.font = "10px system-ui, sans-serif";
      ctx.fillStyle = "rgba(255,255,255,0.5)";
      ctx.fillText(`${state.distance.toFixed(0)} m`, 8, 12);
    };

    return {
      start() {
        paused = false;
        resizeIfNeeded();
        host.root.tabIndex = 0;
        host.root.addEventListener("keydown", onKey);
        host.canvas.addEventListener("pointerdown", onPointer);
        host.canvas.setAttribute(
          "aria-label",
          runnerGame.name +
            ": keep a character running by jumping over obstacles while the model thinks. Space or tap to jump."
        );
      },
      tick(_time: number, dt: number) {
        if (paused) return;
        resizeIfNeeded();
        runnerStep(state, Math.min(dt, 0.05), logicalW, host.progress ?? 0);
        if (runnerCollides(state)) {
          state.crashed = true;
          host.finish("player-failed");
        }
        draw();
      },
      finish(reason) {
        return runnerResult(state, reason);
      },
      pause() {
        paused = true;
      },
      resume() {
        paused = false;
      },
      destroy() {
        host.root.removeEventListener("keydown", onKey);
        host.canvas.removeEventListener("pointerdown", onPointer);
      },
    };
  },
};
