import type {
  EndReason,
  ExecutionSignal,
  ExecutionSignalKind,
  GameDefinition,
  GameHost,
  GameInstance,
  GameResult,
} from "./types";

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
  signalX: number;
  signalY: number;
  signalKind: ExecutionSignalKind | null;
  signalLabel: string | null;
  signalActive: boolean;
  signalBonus: number;
  signalsCollected: number;
}

const PLAYER_H = 40;
const PLAYER_W = 24;
const SIGNAL_SIZE = 18;
const GRAVITY = 2400;
const JUMP = 720;

function signalValue(kind: ExecutionSignalKind): number {
  switch (kind) {
    case "retrieval":
      return 150;
    case "tool":
      return 200;
    case "artifact":
      return 250;
    case "warning":
      return 300;
  }
}

function clearSignal(s: RunnerSurface): void {
  s.signalActive = false;
  s.signalKind = null;
  s.signalLabel = null;
}

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
    signalX: width + 24,
    signalY: groundY - 84,
    signalKind: null,
    signalLabel: null,
    signalActive: false,
    signalBonus: 0,
    signalsCollected: 0,
  };
}

/** One physics step. `progress` is the host-provided or phase-derived intensity. */
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
  if (s.obstacleX + s.obstacleW < 0) {
    s.obstacleX = width + 40 + (180 + Math.random() * 140);
    s.obstacleH = 40 + Math.random() * 28;
  }

  if (s.signalActive) {
    s.signalX -= s.speed * 0.92 * dt;
    if (s.signalX + SIGNAL_SIZE < 0) clearSignal(s);
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

/** Put one truthful host execution event onto the runner track. */
export function runnerInjectSignal(
  s: RunnerSurface,
  width: number,
  signal: ExecutionSignal
): boolean {
  if (s.crashed || s.signalActive) return false;
  s.signalX = width + 24;
  s.signalY = s.groundY - 84;
  s.signalKind = signal.kind;
  s.signalLabel = signal.label;
  s.signalActive = true;
  return true;
}

/** Collect the active execution token when the player actually intersects it. */
export function runnerCollectSignal(s: RunnerSurface): boolean {
  if (!s.signalActive || s.crashed || !s.signalKind) return false;
  const px = 8;
  const py = s.playerY;
  const hit =
    s.signalX < px + PLAYER_W &&
    s.signalX + SIGNAL_SIZE > px &&
    s.signalY < py + PLAYER_H &&
    s.signalY + SIGNAL_SIZE > py;
  if (!hit) return false;

  s.signalBonus += signalValue(s.signalKind);
  s.signalsCollected += 1;
  clearSignal(s);
  return true;
}

export function runnerResult(s: RunnerSurface, reason: EndReason): GameResult {
  const score = Math.max(0, Math.floor(s.distance) + s.signalBonus);
  const notes: string[] = [];
  if (s.signalsCollected > 0) notes.push(`AI signals collected: ${s.signalsCollected}`);
  if (reason === "ai-complete") notes.push("AI finished — you beat the wait.");
  if (reason === "player-failed") notes.push("Crashed — the wait wins this round.");
  return { score, label: `${score.toLocaleString()} m`, notes, reason };
}

function signalColor(kind: ExecutionSignalKind | null): string {
  switch (kind) {
    case "retrieval":
      return "#72d8ff";
    case "tool":
      return "#b99cff";
    case "artifact":
      return "#60efb7";
    case "warning":
      return "#ffcf70";
    default:
      return "#ffffff";
  }
}

export const runnerGame: GameDefinition = {
  id: "runner",
  name: "Wait Runner",
  tagline: "Outrun the wait.",
  controls: "Space or tap to jump · collect live AI signals",
  create(host: GameHost): GameInstance {
    let logicalW = host.canvas.clientWidth || 480;
    let logicalH = host.canvas.clientHeight || 220;
    let state = createRunnerSurface(logicalW, logicalH);
    let paused = false;
    let lastW = 0;
    let lastH = 0;
    const signalQueue: ExecutionSignal[] = [];
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

    const activateNextSignal = () => {
      if (state.signalActive) return;
      const next = signalQueue.shift();
      if (next) runnerInjectSignal(state, logicalW, next);
    };

    const onKey = (e: KeyboardEvent) => {
      if (e.code !== "Space") return;
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable)) return;
      if (t && t !== host.root && t !== host.canvas) return;
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

      if (state.signalActive && state.signalX < logicalW) {
        ctx.save();
        ctx.translate(state.signalX + SIGNAL_SIZE / 2, state.signalY + SIGNAL_SIZE / 2);
        ctx.rotate(Math.PI / 4);
        ctx.fillStyle = signalColor(state.signalKind);
        ctx.fillRect(-SIGNAL_SIZE / 2, -SIGNAL_SIZE / 2, SIGNAL_SIZE, SIGNAL_SIZE);
        ctx.restore();
        ctx.font = "10px system-ui, sans-serif";
        ctx.fillStyle = "rgba(255,255,255,0.78)";
        ctx.fillText((state.signalLabel ?? state.signalKind ?? "signal").slice(0, 22), 8, 28);
      }

      ctx.fillStyle = "rgba(255,214,106,0.95)";
      ctx.fillRect(8, state.playerY, PLAYER_W, PLAYER_H);
      ctx.font = "10px system-ui, sans-serif";
      ctx.fillStyle = "rgba(255,255,255,0.5)";
      ctx.fillText(`${state.distance.toFixed(0)} m · signals ${state.signalsCollected}`, 8, 12);
      if (host.phase) {
        const label = host.phase.slice(0, 30);
        const width = ctx.measureText(label).width;
        ctx.fillStyle = "rgba(255,255,255,0.45)";
        ctx.fillText(label, Math.max(8, logicalW - width - 8), 12);
      }
    };

    return {
      start() {
        paused = false;
        resizeIfNeeded();
        host.root.tabIndex = 0;
        host.canvas.tabIndex = 0;
        host.root.addEventListener("keydown", onKey);
        host.canvas.addEventListener("pointerdown", onPointer);
        host.canvas.setAttribute(
          "aria-label",
          runnerGame.name +
            ": keep a character running by jumping over obstacles while the model thinks. Space or tap to jump. Live host execution signals appear as collectible diamonds."
        );
        activateNextSignal();
      },
      tick(_time: number, dt: number) {
        if (paused) return;
        resizeIfNeeded();
        runnerStep(state, Math.min(dt, 0.05), logicalW, host.intensity);
        runnerCollectSignal(state);
        activateNextSignal();
        if (runnerCollides(state)) {
          state.crashed = true;
          host.finish("player-failed");
        }
        draw();
      },
      signal(signal) {
        signalQueue.push(signal);
        if (signalQueue.length > 8) signalQueue.shift();
        activateNextSignal();
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
