import { useEffect, useRef } from "react";
import { createQuickSpin } from "../sdk/index";
import type { QuickSpinController, ThemeConfig, WaitEventHandler } from "../sdk/types";

export interface QuickSpinWidgetProps {
  /** Which game to start with. Defaults to "runner". */
  game?: string;
  theme?: ThemeConfig;
  onEvent?: WaitEventHandler;
  /** Delay before the playable surface appears. Defaults to 650ms. */
  delayMs?: number;
  /** Called once with the live controller so the host can drive the session. */
  onReady?: (controller: QuickSpinController) => void;
  className?: string;
  style?: React.CSSProperties;
}

/** Mount a QuickSpin widget inside a React tree. */
export function QuickSpinWidget({
  game,
  theme,
  onEvent,
  delayMs,
  onReady,
  className,
  style,
}: QuickSpinWidgetProps) {
  const ref = useRef<HTMLDivElement>(null);
  const onReadyRef = useRef(onReady);
  onReadyRef.current = onReady;
  const onEventRef = useRef(onEvent);
  onEventRef.current = onEvent;

  const gameRef = useRef(game);
  gameRef.current = game;
  const themeRef = useRef(theme);
  themeRef.current = theme;
  const delayRef = useRef(delayMs);
  delayRef.current = delayMs;

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const controller = createQuickSpin({
      target: el,
      game: gameRef.current,
      theme: themeRef.current,
      delayMs: delayRef.current,
      onEvent: (e) => onEventRef.current?.(e),
    });
    onReadyRef.current?.(controller);
    return () => controller.destroy();
  }, []);

  return <div ref={ref} className={className} style={style} />;
}
