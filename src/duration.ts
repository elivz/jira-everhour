const MAX_SECONDS = 24 * 60 * 60;

const NUM = String.raw`(\d*\.?\d+)`;
const HOURS_MINUTES = new RegExp(String.raw`^(?:${NUM}\s*h(?:ours?|rs?)?)?\s*(?:${NUM}\s*m(?:in(?:ute)?s?)?)?$`);

/**
 * Parses "15m", "1.75h", "1h 20m", "1:20", or a bare number of minutes ("90") into seconds.
 * Returns undefined for anything unparseable, zero, or over 24 hours.
 */
export function parseDuration(input: string): number | undefined {
  const text = input.trim().toLowerCase();
  let minutes: number | undefined;

  const clock = text.match(/^(\d+):([0-5]\d)$/);
  const hm = text.match(HOURS_MINUTES);
  if (clock) {
    minutes = Number(clock[1]) * 60 + Number(clock[2]);
  } else if (/^\d*\.?\d+$/.test(text)) {
    minutes = Number(text);
  } else if (hm && (hm[1] || hm[2])) {
    minutes = Number(hm[1] ?? 0) * 60 + Number(hm[2] ?? 0);
  }

  if (minutes === undefined) return undefined;
  const seconds = Math.round(minutes * 60);
  return seconds > 0 && seconds <= MAX_SECONDS ? seconds : undefined;
}

export function formatDuration(seconds: number): string {
  const totalMinutes = Math.round(seconds / 60);
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  return [h && `${h}h`, m && `${m}m`].filter(Boolean).join(" ") || "0m";
}
