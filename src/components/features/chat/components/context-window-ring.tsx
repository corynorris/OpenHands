import { cn } from "#/utils/utils";
import { getContextFillTone } from "#/components/features/conversation/usage-panel/context-meter";
import { useColorTheme } from "#/hooks/use-color-theme";

const CONTEXT_WINDOW_RING_SIZE = 16;
const CONTEXT_WINDOW_RING_STROKE = 2;

/**
 * Opacity of the ring's unfilled track, as a fraction of `--oh-foreground`.
 *
 * The track is derived from the foreground rather than pinned to a scale stop.
 * It carries information (the arc's proportion is only readable against it), so
 * it is a foreground element, and every stop in the surface family sits close
 * to the surfaces it delimits. Drawing it with `--oh-border` put it in that
 * family: it was 1.57:1 against the composer at rest, and the trigger's hover
 * fill resolves to the same stop, taking it to 1.00:1. No stop in that family
 * fixes it, and no fixed stop holds across the palettes in `color-themes.ts`,
 * whose scales differ.
 *
 * Compositing the foreground over whatever the active theme paints keeps the
 * track between surface and arc by construction rather than by coincidence.
 * 42% is the value that maximises the worst case across the dark palettes;
 * the light theme flips the scale (near-black foreground on near-white
 * surfaces) and needs a heavier mix to hold 3:1, so the track uses 50% there.
 * `context-window-ring.test.tsx` asserts the contrast per theme.
 */
export const CONTEXT_WINDOW_RING_TRACK_ALPHA = 0.42;

/** Light-theme track alpha: keeps WCAG 2.1 SC 1.4.11 (3:1) on light surfaces. */
export const CONTEXT_WINDOW_RING_TRACK_ALPHA_LIGHT = 0.5;

/** Build the track fill for a given foreground mix fraction. */
export function contextWindowTrackColor(alpha: number): string {
  return `color-mix(in srgb, var(--oh-foreground) ${alpha * 100}%, transparent)`;
}

/**
 * Theme-aware track fill, shared by the ring and the popover's usage bar
 * (which had the same defect).
 */
export function useContextWindowTrackColor(): string {
  const { isLight } = useColorTheme();
  return contextWindowTrackColor(
    isLight
      ? CONTEXT_WINDOW_RING_TRACK_ALPHA_LIGHT
      : CONTEXT_WINDOW_RING_TRACK_ALPHA,
  );
}

const TONE_STROKE = {
  neutral: "var(--oh-foreground)",
  warning: "#f59e0b", // amber-500
  danger: "#ef4444", // red-500
} as const;

interface ContextWindowRingProps {
  percentage: number;
  className?: string;
}

export function ContextWindowRing({
  percentage,
  className,
}: ContextWindowRingProps) {
  const radius = (CONTEXT_WINDOW_RING_SIZE - CONTEXT_WINDOW_RING_STROKE) / 2;
  const circumference = 2 * Math.PI * radius;
  const clampedPercentage = Math.min(100, Math.max(0, percentage));
  const dashOffset = circumference - (clampedPercentage / 100) * circumference;
  const tone = getContextFillTone(clampedPercentage);
  const trackColor = useContextWindowTrackColor();

  return (
    <svg
      width={CONTEXT_WINDOW_RING_SIZE}
      height={CONTEXT_WINDOW_RING_SIZE}
      viewBox={`0 0 ${CONTEXT_WINDOW_RING_SIZE} ${CONTEXT_WINDOW_RING_SIZE}`}
      className={cn("shrink-0", className)}
      aria-hidden
    >
      <circle
        cx={CONTEXT_WINDOW_RING_SIZE / 2}
        cy={CONTEXT_WINDOW_RING_SIZE / 2}
        r={radius}
        fill="none"
        style={{ stroke: trackColor }}
        strokeWidth={CONTEXT_WINDOW_RING_STROKE}
        data-testid="context-window-ring-track"
      />
      <circle
        cx={CONTEXT_WINDOW_RING_SIZE / 2}
        cy={CONTEXT_WINDOW_RING_SIZE / 2}
        r={radius}
        fill="none"
        stroke={TONE_STROKE[tone]}
        strokeWidth={CONTEXT_WINDOW_RING_STROKE}
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={dashOffset}
        transform={`rotate(-90 ${CONTEXT_WINDOW_RING_SIZE / 2} ${CONTEXT_WINDOW_RING_SIZE / 2})`}
        className="transition-[stroke-dashoffset,stroke] duration-300"
        data-testid="context-window-ring-arc"
      />
    </svg>
  );
}
