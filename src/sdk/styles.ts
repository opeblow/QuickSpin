/** Shadow-DOM-scoped styles for the QuickSpin widget. No CSS leaks to/from
 *  the host page; themes arrive as CSS variables set on a `:host` wrapper. */
export const WIDGET_CSS = String.raw`
:host {
  --qs-primary: #8b7cff;
  --qs-surface: #10111a;
  --qs-elevated: #181a27;
  --qs-game: #202334;
  --qs-text: #f8f9fc;
  --qs-muted: #a9b0c0;
  --qs-border: rgba(255, 255, 255, 0.1);
  --qs-success: #16a36a;
  --qs-radius: 16px;
  --qs-font: Inter, system-ui, -apple-system, "Segoe UI", sans-serif;
  --qs-monospace: "Geist Mono", "SFMono-Regular", ui-monospace, monospace;
}

.quickspin-root {
  font-family: var(--qs-font);
  color: var(--qs-text);
  background: var(--qs-surface);
  border: 1px solid var(--qs-border);
  border-radius: var(--qs-radius);
  overflow: hidden;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.35);
  font-size: 13px;
  line-height: 1.5;
}

.quickspin-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 10px 14px;
  border-bottom: 1px solid var(--qs-border);
}

.quickspin-brand {
  display: flex;
  align-items: center;
  gap: 7px;
  font-weight: 700;
  font-size: 12.5px;
  color: var(--qs-muted);
}

.quickspin-dot {
  width: 9px;
  height: 9px;
  border-radius: 999px;
  background: var(--qs-primary);
  box-shadow: 0 0 0 0 rgba(139, 124, 255, 0.5);
  animation: qs-pulse 1.6s infinite;
}

@keyframes qs-pulse {
  0% { box-shadow: 0 0 0 0 rgba(139, 124, 255, 0.45); }
  70% { box-shadow: 0 0 0 8px rgba(139, 124, 255, 0); }
  100% { box-shadow: 0 0 0 0 rgba(139, 124, 255, 0); }
}

.quickspin-status {
  flex: 1;
  font-weight: 600;
  font-size: 13px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.quickspin-elapsed {
  font-family: var(--qs-monospace);
  font-size: 12px;
  color: var(--qs-muted);
  font-variant-numeric: tabular-nums;
}

.quickspin-tools {
  display: flex;
  gap: 4px;
}

.quickspin-btn {
  appearance: none;
  border: 1px solid transparent;
  background: transparent;
  color: var(--qs-muted);
  width: 28px;
  height: 28px;
  border-radius: 8px;
  font-size: 14px;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.quickspin-btn:hover {
  background: rgba(255, 255, 255, 0.06);
  color: var(--qs-text);
}

.quickspin-stage {
  position: relative;
  min-height: 220px;
}

.quickspin-canvas {
  display: block;
  width: 100%;
  height: 220px;
  touch-action: manipulation;
}

.quickspin-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 20px;
  text-align: center;
  background: color-mix(in srgb, var(--qs-surface) 88%, transparent);
  animation: qs-fade 180ms ease-out;
}

.quickspin-overlay[hidden] {
  display: none;
}

@keyframes qs-fade {
  from { opacity: 0; }
  to { opacity: 1; }
}

.quickspin-waiting-label {
  color: var(--qs-muted);
  font-size: 12.5px;
}

.quickspin-score-big {
  font-family: var(--qs-monospace);
  font-size: 40px;
  font-weight: 700;
  color: var(--qs-primary);
  line-height: 1.1;
}

.quickspin-label {
  color: var(--qs-muted);
  font-size: 13px;
}

.quickspin-notes {
  list-style: none;
  margin: 0;
  padding: 0;
  color: var(--qs-muted);
  font-size: 12px;
}

.quickspin-actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  justify-content: center;
  margin-top: 4px;
}

.quickspin-btn-primary,
.quickspin-btn-ghost {
  appearance: none;
  border: none;
  border-radius: 10px;
  padding: 9px 16px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
}

.quickspin-btn-primary {
  background: var(--qs-primary);
  color: #10111a;
}

.quickspin-btn-ghost {
  background: rgba(255, 255, 255, 0.08);
  color: var(--qs-text);
}

.quickspin-felt {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  justify-content: center;
}

.quickspin-felt-btn {
  appearance: none;
  border: 1px solid var(--qs-border);
  background: var(--qs-elevated);
  color: var(--qs-text);
  border-radius: 999px;
  padding: 8px 14px;
  font-size: 12.5px;
  font-weight: 600;
  cursor: pointer;
}

.quickspin-felt-btn:hover {
  border-color: var(--qs-primary);
}

.quickspin-reduction {
  font-size: 13px;
  font-weight: 700;
  color: var(--qs-success);
}

.quickspin-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 9px 14px;
  border-top: 1px solid var(--qs-border);
  font-size: 11.5px;
  color: var(--qs-muted);
}

.quickspin-progress {
  height: 3px;
  background: var(--qs-border);
}

.quickspin-progress-fill {
  height: 100%;
  width: 0%;
  background: linear-gradient(90deg, var(--qs-primary), #ffe06a);
  transition: width 160ms linear;
}

.quickspin-progress-fill.indeterminate {
  width: 34% !important;
  animation: qs-slide 1.1s ease-in-out infinite;
}

@keyframes qs-slide {
  0% { margin-left: -34%; }
  100% { margin-left: 100%; }
}

.quickspin-games {
  display: flex;
  gap: 6px;
  padding: 8px 14px 0;
}

.quickspin-gamebtn {
  appearance: none;
  border: 1px solid var(--qs-border);
  background: var(--qs-elevated);
  color: var(--qs-muted);
  font-size: 11.5px;
  font-weight: 600;
  padding: 5px 10px;
  border-radius: 999px;
  cursor: pointer;
}

.quickspin-gamebtn[aria-pressed="true"] {
  color: var(--qs-primary);
  border-color: var(--qs-primary);
}

.quickspin-canvas:focus-visible,
.quickspin-btn:focus-visible,
.quickspin-btn-primary:focus-visible,
.quickspin-btn-ghost:focus-visible,
.quickspin-felt-btn:focus-visible,
.quickspin-gamebtn:focus-visible {
  outline: 2px solid var(--qs-primary);
  outline-offset: 2px;
}

@media (prefers-reduced-motion: reduce) {
  .quickspin-dot { animation: none; }
  .quickspin-progress-fill.indeterminate { animation: none; }
  .quickspin-overlay { animation: none; }
}
`;
