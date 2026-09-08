// Self-contained hero animation for the demo landing: shows the product's
// whole story in ~7s — a classic "thinking…" spinner that turns into a
// playable Wait Runner, ending with a score and a streak.

const TAU = Math.PI * 2;

const clamp = (t: number, a = 0, b = 1): number => Math.max(a, Math.min(b, t));
const ease = (t: number): number => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const pad = (n: number, len = 4): string => String(n).padStart(len, "0");

const MONO = "'Geist Mono', 'SF Mono', ui-monospace, monospace";
const SANS = "Inter, system-ui, -apple-system, 'Segoe UI', sans-serif";

interface Stage {
  ctx: CanvasRenderingContext2D;
  w: number;
  h: number;
}

function drawSpinner(stage: Stage, local: number): void {
  const { ctx, w, h } = stage;
  const cx = w / 2;
  const cy = h * 0.42;
  const r = Math.min(64, w * 0.14);

  ctx.clearRect(0, 0, w, h);
  ctx.textAlign = "center";

  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, TAU);
  ctx.lineWidth = 10;
  ctx.lineCap = "round";
  ctx.strokeStyle = "rgba(104,112,127,0.22)";
  ctx.stroke();

  const sweep = local / 1500;
  const a = -Math.PI / 2 + TAU * sweep;
  ctx.beginPath();
  ctx.arc(cx, cy, r, -Math.PI / 2, a);
  ctx.lineWidth = 10;
  ctx.strokeStyle = "#6658e8";
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(cx, cy, r, a - 0.6, a);
  ctx.lineWidth = 4;
  ctx.strokeStyle = "rgba(102,88,232,0.3)";
  ctx.stroke();

  ctx.font = `600 12px ${SANS}`;
  ctx.fillStyle = "rgba(104,112,127,0.9)";
  ctx.fillText("classic \u201cthinking\u2026\u201d spinner", cx, cy + r + 34);
}

function drawRunner(stage: Stage, local: number): void {
  const { ctx, w, h } = stage;
  const ground = h * 0.8;
  const startX = w * 0.12;
  const blockX = w * 0.62;
  const finishX = w * 0.84;
  const runIn = ease(clamp(local / 700));
  const hop = clamp((local - 700) / 500);
  const runOut = ease(clamp((local - 1200) / 800));

  ctx.clearRect(0, 0, w, h);

  ctx.beginPath();
  ctx.moveTo(0, ground);
  ctx.lineTo(w, ground);
  ctx.lineWidth = 2;
  ctx.strokeStyle = "rgba(23,24,29,0.16)";
  ctx.stroke();

  const bw = 30;
  const bh = 46;
  ctx.fillStyle = "#ffb547";
  ctx.beginPath();
  ctx.roundRect(blockX - bw / 2, ground - bh, bw, bh, 9);
  ctx.fill();

  const x = startX + runIn * (blockX - startX - 34) + runOut * (finishX - blockX);
  const y = ground - Math.sin(hop * Math.PI) * 58;

  ctx.lineCap = "round";
  ctx.lineWidth = 4;
  ctx.strokeStyle = "#6658e8";
  const swing = Math.sin(local / 90) * 8;
  ctx.beginPath();
  ctx.moveTo(x, y - 8);
  ctx.lineTo(x - 5 + swing, ground - 2);
  ctx.moveTo(x, y - 8);
  ctx.lineTo(x + 7 - swing, ground - 2);
  ctx.stroke();

  ctx.fillStyle = "#6658e8";
  ctx.beginPath();
  ctx.roundRect(x - 11, y - 32, 22, 24, 10);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(x, y - 36, 6.5, 0, TAU);
  ctx.fill();
  ctx.fillStyle = "#16b8b0";
  ctx.beginPath();
  ctx.roundRect(x + 1, y - 39, 8, 4.5, 2);
  ctx.fill();

  ctx.font = `700 15px ${MONO}`;
  ctx.textAlign = "left";
  ctx.fillStyle = "#17181d";
  ctx.fillText(`SCORE ${pad(Math.round(clamp(local / 1500) * 9876))}`, 18, 30);

  ctx.font = `600 12px ${SANS}`;
  ctx.textAlign = "right";
  ctx.fillStyle = "rgba(104,112,127,0.85)";
  ctx.fillText("…and a real score, streak, and best to protect", w - 18, h - 22);
}

function drawPop(stage: Stage, local: number): void {
  const { ctx, w, h } = stage;
  const k = ease(clamp(local / 500));
  const cx = w / 2;
  const cy = h * 0.44;

  ctx.clearRect(0, 0, w, h);
  ctx.textAlign = "center";

  ctx.beginPath();
  ctx.arc(cx, cy, 18 + k * 70, 0, TAU);
  ctx.lineWidth = 12;
  ctx.strokeStyle = `rgba(102,88,232,${0.35 * (1 - k)})`;
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(cx, cy, 8 + k * 44, 0, TAU);
  ctx.lineWidth = 6;
  ctx.strokeStyle = `rgba(22,184,176,${0.5 * (1 - k)})`;
  ctx.stroke();

  ctx.font = `800 30px ${SANS}`;
  ctx.fillStyle = "#17181d";
  ctx.fillText("wait over \u2014", cx, cy - 16);
  ctx.fillText("and they played it.", cx, cy + 24);

  ctx.font = `700 15px ${MONO}`;
  ctx.fillStyle = "#6658e8";
  ctx.fillText("SCORE 9876  \u00b7  DAY STREAK 3", cx, cy + 58);
}

/** Mount the looping hero story on a canvas. Pauses automatically when hidden. */
export function mountHeroDemo(canvas: HTMLCanvasElement): void {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const resize = (): void => {
    const r = canvas.getBoundingClientRect();
    canvas.width = Math.max(1, Math.round(r.width * dpr));
    canvas.height = Math.max(1, Math.round(r.height * dpr));
  };
  resize();
  const ro = new ResizeObserver(resize);
  ro.observe(canvas);

  const w = () => canvas.width / dpr;
  const h = () => canvas.height / dpr;
  const stage = (): Stage => ({ ctx, w: w(), h: h() });

  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    ctx.save();
    ctx.scale(dpr, dpr);
    drawPop(stage(), 60);
    ctx.restore();
    return;
  }

  const SPIN = 2600;
  const RUN = 2400;
  const POP = 2200;
  const PERIOD = SPIN + RUN + POP;
  const start = performance.now();

  const frame = (now: number): void => {
    const local = (now - start) % PERIOD;
    ctx.save();
    ctx.scale(dpr, dpr);
    if (local < SPIN) drawSpinner(stage(), local);
    else if (local < SPIN + RUN) drawRunner(stage(), local - SPIN);
    else drawPop(stage(), local - SPIN - RUN);
    ctx.restore();
    requestAnimationFrame(frame);
  };
  requestAnimationFrame(frame);
}
