import type { GameDefinition, GameHost, GameInstance, GameResult } from "./types";

interface FishState {
  playerX: number;
  fishX: number;
  fishY: number;
  fishVX: number;
  fishVY: number;
  caught: number;
  misses: number;
  alive: boolean;
}

/**
 * A lightweight "catch the fish" game — rhythm-based and suited to short waits.
 * Each 'tap' catches a fish if the pointer is near it; the game is scored by
 * catch rate, which rewards accuracy over spam.
 */
export const fishGame: GameDefinition = {
  id: "fish",
  name: "Fish Rush",
  tagline: "Tap when the glowfish is close. Accuracy beats spam.",
  create(host: GameHost): GameInstance {
    const s: FishState = {
      playerX: 0,
      fishX: 0,
      fishY: 0,
      fishVX: 90,
      fishVY: 40,
      caught: 0,
      misses: 0,
      alive: true,
    };

    let raf = 0;
    let lastTs = 0;
    const ctx = host.canvas.getContext("2d")!;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = host.canvas.clientWidth || 320;
      const h = host.canvas.clientHeight || 200;
      host.canvas.width = Math.floor(w * dpr);
      host.canvas.height = Math.floor(h * dpr);
      ctx?.setTransform(dpr, 0, 0, dpr, 0, 0);
      s.fishX = w / 2;
      s.fishY = h / 2;
    };

    const tap = (e: Event) => {
      if (!s.alive) return;
      e.preventDefault();
      const rect = host.canvas.getBoundingClientRect();
      const x = (e as PointerEvent).clientX - rect.left;
      const y = (e as PointerEvent).clientY - rect.top;
      const dist = Math.hypot(x - s.fishX, y - s.fishY);
      if (dist < 30) {
        s.caught++;
        bounce();
        host.finish(buildResult());
      } else {
        s.misses++;
      }
    };

    const bounce = () => {
      const w = host.canvas.width;
      const h = host.canvas.height;
      s.fishX = 30 + Math.random() * (w - 60);
      s.fishY = 30 + Math.random() * (h - 60);
      const ang = Math.random() * Math.PI * 2;
      s.fishVX = Math.cos(ang) * (70 + Math.random() * 80);
      s.fishVY = Math.sin(ang) * (70 + Math.random() * 80);
    };

    const frame = (ts: number) => {
      raf = requestAnimationFrame(frame);
      const dt = lastTs ? Math.min((ts - lastTs) / 1000, 0.05) : 0;
      lastTs = ts;
      tick(ts, dt);
    };

    const tick = (_time: number, dt: number) => {
      void _time;
      if (!s.alive) return;
      const w = host.canvas.width;
      const h = host.canvas.height;

      s.fishX += s.fishVX * dt;
      s.fishY += s.fishVY * dt;
      if (s.fishX < 14) { s.fishX = 14; s.fishVX = Math.abs(s.fishVX); }
      if (s.fishX > w - 14) { s.fishX = w - 14; s.fishVX = -Math.abs(s.fishVX); }
      if (s.fishY < 14) { s.fishY = 14; s.fishVY = Math.abs(s.fishVY); }
      if (s.fishY > h - 14) { s.fishY = h - 14; s.fishVY = -Math.abs(s.fishVY); }

      draw(w, h);
    };

    const buildResult = (): GameResult => {
      const acc = s.caught + s.misses;
      const accuracy = acc > 0 ? s.caught / acc : 0;
      const score = Math.round(s.caught * 1000 * (0.4 + accuracy * 0.6));
      const notes: string[] = [];
      notes.push(`${s.caught} caught · ${accuracy * 100 | 0}% accuracy`);
      if (s.caught >= 3) notes.push("Sharp reflexes, nice.");
      return { score, label: `${score} pts`, notes };
    };

    const draw = (w: number, h: number) => {
      ctx.clearRect(0, 0, w, h);
      ctx.save();
      ctx.strokeStyle = "rgba(255,255,255,0.15)";
      ctx.lineWidth = 1;
      const step = 28;
      for (let x = 0; x <= w; x += step) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
        ctx.stroke();
      }
      for (let y = 0; y <= h; y += step) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
      }
      ctx.restore();

      // glow
      const glow = ctx.createRadialGradient(s.fishX, s.fishY, 0, s.fishX, s.fishY, 30);
      glow.addColorStop(0, "rgba(96,239,183,0.9)");
      glow.addColorStop(1, "rgba(96,239,183,0)");
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(s.fishX, s.fishY, 30, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = "#60efb7";
      ctx.beginPath();
      ctx.arc(s.fishX, s.fishY, 9, 0, Math.PI * 2);
      ctx.fill();

      ctx.font = "10px system-ui, sans-serif";
      ctx.fillStyle = "rgba(255,255,255,0.55)";
      ctx.fillText("tap on the fish · caught " + s.caught, 8, h - 8);
    };

    return {
      start() {
        resize();
        window.addEventListener("resize", resize);
        host.canvas.addEventListener("pointerdown", tap);
        s.alive = true;
        raf = requestAnimationFrame(frame);
      },
      tick,
      pause() {
        cancelAnimationFrame(raf);
      },
      resume() {
        lastTs = 0;
        raf = requestAnimationFrame(frame);
      },
      destroy() {
        cancelAnimationFrame(raf);
        window.removeEventListener("resize", resize);
        host.canvas.removeEventListener("pointerdown", tap);
      },
    };
  },
};
