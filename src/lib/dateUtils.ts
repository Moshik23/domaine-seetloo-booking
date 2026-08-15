/**
 * All domain dates/times are plain zero-padded strings ("YYYY-MM-DD", "HH:mm"),
 * never native Date objects, so they sort/compare lexicographically without any
 * timezone conversion risk. See plan doc for rationale.
 */

export function combine(date: string, time: string): string {
  return `${date}T${time}`;
}

/** Adds one calendar day to a "YYYY-MM-DD" string, used for events that cross midnight. */
export function addOneDay(date: string): string {
  const [y, m, d] = date.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  dt.setUTCDate(dt.getUTCDate() + 1);
  const yyyy = dt.getUTCFullYear();
  const mm = String(dt.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(dt.getUTCDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

/** "YYYY-MM-DD" -> "DD/MM/YYYY", matching the paper forms' date format. */
export function formatDateDisplay(date: string | null | undefined): string {
  if (!date) return "";
  const [y, m, d] = date.split("-");
  return `${d}/${m}/${y}`;
}

/** "HH:mm" (24h) -> "h:mm am/pm", matching the paper forms' time format. */
export function formatTimeDisplay(time: string | null | undefined): string {
  if (!time) return "";
  const [hStr, mStr] = time.split(":");
  const h = Number(hStr);
  const period = h >= 12 ? "pm" : "am";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${mStr} ${period}`;
}

/** Every "YYYY-MM-DD" from start to end, inclusive. Assumes start <= end. */
export function eachDateInRange(start: string, end: string): string[] {
  const dates: string[] = [];
  let current = start;
  while (current <= end) {
    dates.push(current);
    if (current === end) break;
    current = addOneDay(current);
  }
  return dates;
}

export function todayIso(): string {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

/** First day of the current month through the last day of next month, inclusive. */
export function getCurrentAndNextMonthRange(today: string = todayIso()): { start: string; end: string } {
  const [y, m] = today.split("-").map(Number);
  const start = `${y}-${String(m).padStart(2, "0")}-01`;
  const lastDayOfNextMonth = new Date(Date.UTC(y, m + 1, 0)); // day 0 rolls back to the last day of "next month"
  const end = `${lastDayOfNextMonth.getUTCFullYear()}-${String(lastDayOfNextMonth.getUTCMonth() + 1).padStart(2, "0")}-${String(lastDayOfNextMonth.getUTCDate()).padStart(2, "0")}`;
  return { start, end };
}
