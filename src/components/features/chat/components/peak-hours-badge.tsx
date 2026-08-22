import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { I18nKey } from "#/i18n/declaration";
import { cn } from "#/utils/utils";

/**
 * DeepSeek API pricing windows (per the canvas fork spec).
 *
 * Peak hours: 01:00–04:00 UTC and 06:00–10:00 UTC, Monday–Friday.
 * Everything else (weekends, and all other UTC hours) is off-peak.
 *
 * NOTE: DeepSeek's *officially published* off-peak window is 08:30–16:30 UTC
 * (price multiplier 0.5). This badge deliberately uses the fork's own spec
 * above — tweak PEAK_WINDOWS / PEAK_WEEKDAYS here if it should match the
 * official window instead.
 */
export const PEAK_WINDOWS: { start: number; end: number }[] = [
  { start: 1, end: 4 }, // 01:00–04:00 UTC
  { start: 6, end: 10 }, // 06:00–10:00 UTC
];

/** JS getUTCDay(): 1 = Monday … 5 = Friday. */
const PEAK_WEEKDAYS = [1, 2, 3, 4, 5];

/** Refresh cadence for the badge's clock, in ms. */
const REFRESH_INTERVAL_MS = 60_000;

export function isPeakHours(now: Date): boolean {
  const utcHours = now.getUTCHours();
  if (!PEAK_WEEKDAYS.includes(now.getUTCDay())) return false;
  return PEAK_WINDOWS.some(
    ({ start, end }) => utcHours >= start && utcHours < end,
  );
}

function useIsPeakHours(): boolean {
  const [isPeak, setIsPeak] = useState(() => isPeakHours(new Date()));

  useEffect(() => {
    const tick = () => setIsPeak(isPeakHours(new Date()));
    tick();
    const interval = setInterval(tick, REFRESH_INTERVAL_MS);
    return () => clearInterval(interval);
  }, []);

  return isPeak;
}

/**
 * Small amber/green pill next to the model picker showing whether the current
 * UTC time falls inside DeepSeek's peak pricing window. Read-only — it only
 * reflects the client clock; the tooltip lists the exact windows.
 */
export function PeakHoursBadge() {
  const { t } = useTranslation("openhands");
  const isPeak = useIsPeakHours();

  return (
    <span
      data-testid="peak-hours-badge"
      data-peak={isPeak ? "true" : "false"}
      title={t(I18nKey.COMMON$PEAK_HOURS_TOOLTIP)}
      className={cn(
        "inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-[10px] font-medium leading-4 select-none",
        isPeak
          ? "bg-amber-400/15 text-amber-500"
          : "bg-emerald-400/15 text-emerald-500",
      )}
    >
      {isPeak
        ? t(I18nKey.COMMON$PEAK) || "Peak"
        : t(I18nKey.COMMON$OFF_PEAK) || "Off-peak"}
    </span>
  );
}
