import { useEffect, useRef } from "react";
import { createQuickSpin } from "../sdk/index";
import type { QuickSpinController, ThemeConfig, WaitEventHandler } from "../sdk/types";

export interface QuickSpinWidgetProps {
  /** Which game to start with. Defaults to "runner". */
  game?: string;
  theme?: ThemeConfig;
  onEvent?: WaitEventHandler;
  /**
   * Called once with the live controller so the host can drive the session:
   * `onReady={c => { c.start({ status: "Reasoning…" }); c.update?.(); }}`
   */
  onReady?: (controller: QuickSpinController) => void;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * Mount a QuickSpin widget inside a React tree. The controller is exposed via
 * `onReady` so the host can call `start()`/`track()` from event handlers.
 */
export function QuickSpinWidget({
  game,
  theme,
  onEvent,
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

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const controller = createQuickSpin({
      target: el,
      game: gameRef.current,
      theme: themeRef.current,
      onEvent: (e) => onEventRef.current?.(e),
    });
    onReadyRef.current?.(controller);
    return () => controller.destroy();
  }, []);

  return <div ref={ref} className={className} style={style} />;
}
