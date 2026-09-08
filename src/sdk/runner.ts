import type { GameDefinition, GameHost, GameInstance, GameResult } from "./types";

interface RunnerState {
  speed: number;
  groundY: number;
  playerY: number;
  playerVY: number;
  jumping: boolean;
  obstacleX: number;
  obstacleW: number;
  obstacleH: number;
  distance: number;
  alive: boolean;
  over: boolean;
  jumpCooldown: number;
}

/**
 * A chrome-dino style runner whose difficulty scales with how long the model
 * is taking. The game "ends" when the AI finishes OR the player crashes into
 * an obstacle — whichever comes first. Perceived wait time is compressed into
 * a challenge, so the wait feels shorter and the player is driven to replay.
 */
export const runnerGame: GameDefinition = {
  id: "runner",
  name: "Wait Runner",
  tagline: "Outrun the wait. The model gets smarter the longer you survive.",
  create(host: GameHost): GameInstance {
    const s: RunnerState = {
      speed: 240,
      groundY: 0,
      playerY: 0,
      playerVY: 0,
      jumping: false,
      obstacleX: 0,
      obstacleW: 34,
      obstacleH: 54,
      distance: 0,
      alive: true,
      over: false,
      jumpCooldown: 0,
    };

    let raf = 0;
    let lastTs = 0;
    let started = false;
    const ctx = host.canvas.getContext("2d")!;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = host.canvas.clientWidth || 320;
      const h = host.canvas.clientHeight || 200;
      host.canvas.width = Math.floor(w * dpr);
      host.canvas.height = Math.floor(h * dpr);
      ctx?.setTransform(dpr, 0, 0, dpr, 0, 0);
      s.groundY = h - 40;
    };

    const input = (e: Event) => {
      if (e.type === "pointerdown" || (e as KeyboardEvent).code === "Space") {
        e.preventDefault();
        jump();
      }
    };

    const jump = () => {
      if (!s.alive || s.over) return;
      if (s.jumping) return;
      s.jumping = true;
      s.playerVY = -420;
    };

    const spawnObstacle = () => {
      s.obstacleX = host.canvas.width + 60;
      // Difficulty scales with elapsed wait time so obstacles get denser.
      s.obstacleH = 40 + Math.random() * 30;
    };

    const frame = (ts: number) => {
      raf = requestAnimationFrame(frame);
      const dt = lastTs ? Math.min((ts - lastTs) / 1000, 0.05) : 0;
      lastTs = ts;
      tick(ts, dt);
    };

    const tick = (time: number, dt: number) => {
      void time;
      if (!s.alive || s.over) return;
      const w = host.canvas.width;
      const h = host.canvas.height;

      // Difficulty ramp with progress.
      const accel = 1 + host.progress * 2.2;
      s.speed = 240 * accel;

      // Physics.
      if (s.jumping) {
        s.playerVY += 1300 * dt;
        s.playerY += s.playerVY * dt;
        if (s.playerY >= 0) {
          s.playerY = 0;
          s.jumping = false;
          s.playerVY = 0;
        }
      }

      s.distance += s.speed * dt * 3;

      // Obstacle spawn/move.
      if (s.obstacleX > w) {
        spawnObstacle();
      }
      s.obstacleX -= s.speed * dt;

      // Collision (AABB with a forgiving box).
      const playerH = 38;
      const px = 26;
      const py = s.groundY - playerH - s.playerY;
      if (
        s.obstacleX < px + 20 &&
        s.obstacleX + s.obstacleW > px &&
        s.groundY - s.obstacleH < py + playerH &&
        s.groundY > py
      ) {
        s.alive = false;
        s.over = true;
        host.finish(buildResult());
        return;
      }

      draw(w, h);
    };

    const buildResult = (): GameResult => {
      const score = Math.floor(s.distance);
      const notes: string[] = [];
      if (!s.alive) notes.push("Crashed — the wait won this round.");
      if (host.progress >= 1) notes.push("AI finished — you beat the wait.");
      return { score, label: `${score} m`, notes };
    };

    const draw = (w: number, h: number) => {
      ctx.clearRect(0, 0, w, h);
      const c = { r: 255, g: 214, b: 106 };
      // Ground.
      ctx.strokeStyle = `rgba(${c.r},${c.g},${c.b},0.7)`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, s.groundY);
      ctx.lineTo(w, s.groundY);
      ctx.stroke();

      // Obstacle.
      ctx.fillStyle = "rgba(255,120,120,0.9)";
      ctx.fillRect(s.obstacleX, s.groundY - s.obstacleH, s.obstacleW, s.obstacleH);

      // Player (small square with a pulse).
      const playerH = 38;
      const px = 26;
      const py = s.groundY - playerH - s.playerY;
      ctx.fillStyle = `rgba(${c.r},${c.g},${c.b},0.95)`;
      ctx.fillRect(px, py, playerH - 12, playerH);

      // Speed indicator tied to AI progress.
      ctx.font = "10px system-ui, sans-serif";
      ctx.fillStyle = "rgba(255,255,255,0.55)";
      ctx.fillText(
        "▲ jump / tap  ·  speed " + (1 + host.progress * 2.2).toFixed(1) + "x",
        8,
        h - 8
      );
    };

    return {
      start() {
        started = true;
        resize();
        window.addEventListener("resize", resize);
        window.addEventListener("keydown", input);
        host.canvas.addEventListener("pointerdown", input);
        // First obstacle spawns quickly.
        spawnObstacle();
        s.obstacleX = host.canvas.width + 60;
        raf = requestAnimationFrame(frame);
      },
      tick,
      pause() {
        cancelAnimationFrame(raf);
      },
      resume() {
        if (!started) return;
        lastTs = 0;
        raf = requestAnimationFrame(frame);
      },
      destroy() {
        cancelAnimationFrame(raf);
        window.removeEventListener("resize", resize);
        window.removeEventListener("keydown", input);
        host.canvas.removeEventListener("pointerdown", input);
      },
    };
  },
};
