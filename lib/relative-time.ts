const MINUTE_MS = 60_000;
const HOUR_MS = 60 * MINUTE_MS;
const DAY_MS = 24 * HOUR_MS;
const WEEK_MS = 7 * DAY_MS;
const MONTH_MS = 30 * DAY_MS;
const YEAR_MS = 365 * DAY_MS;

function plural(count: number, unit: string) {
  return count === 1 ? `${count} ${unit} ago` : `${count} ${unit}s ago`;
}

/** Normalize Postgres / driver timestamps so Safari and Node agree. */
export function parseTimestamp(value: Date | string): Date {
  if (value instanceof Date) return value;

  const trimmed = value.trim();
  if (trimmed === "") return new Date(Number.NaN);

  // "2026-11-19 13:19:48.015+00" → "2026-11-19T13:19:48.015+00:00"
  const withT = trimmed.includes("T") ? trimmed : trimmed.replace(" ", "T");
  const withOffset = withT
    .replace(/([+-]\d{2})$/, "$1:00")
    .replace(/\+00:00$/, "Z");

  return new Date(withOffset);
}

export function formatRelativeTime(
  value: Date | string,
  now: Date = new Date(),
): string {
  const date = parseTimestamp(value);
  if (Number.isNaN(date.getTime())) return "";

  const diffMs = Math.max(0, now.getTime() - date.getTime());

  if (diffMs < MINUTE_MS) return "just now";
  if (diffMs < HOUR_MS) return plural(Math.floor(diffMs / MINUTE_MS), "minute");
  if (diffMs < DAY_MS) return plural(Math.floor(diffMs / HOUR_MS), "hour");
  if (diffMs < WEEK_MS) return plural(Math.floor(diffMs / DAY_MS), "day");
  if (diffMs < MONTH_MS) return plural(Math.floor(diffMs / WEEK_MS), "week");
  if (diffMs < YEAR_MS) return plural(Math.floor(diffMs / MONTH_MS), "month");
  return plural(Math.floor(diffMs / YEAR_MS), "year");
}
