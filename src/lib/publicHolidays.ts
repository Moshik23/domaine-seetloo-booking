export interface PublicHoliday {
  date: string; // "YYYY-MM-DD"
  name: string;
}

interface FixedHoliday {
  month: number; // 1-12
  day: number;
  name: string;
}

/**
 * Mauritius public holidays that fall on the same Gregorian date every year — these
 * apply to any year without needing a fresh Gazette notice. (Independence & Republic
 * Day is fixed at March 12; the others are similarly date-anchored, not lunar.)
 */
const FIXED_HOLIDAYS: FixedHoliday[] = [
  { month: 1, day: 1, name: "New Year's Day" },
  { month: 1, day: 2, name: "New Year Holiday" },
  { month: 2, day: 1, name: "Abolition of Slavery" },
  { month: 3, day: 12, name: "Independence & Republic Day" },
  { month: 5, day: 1, name: "Labour Day" },
  { month: 8, day: 15, name: "Assumption of the Blessed Virgin Mary" },
  { month: 11, day: 2, name: "Arrival of Indentured Labourers" },
  { month: 12, day: 25, name: "Christmas Day" },
];

/**
 * Mauritius gazetted public holidays that follow a lunar or religious calendar, by year.
 *
 * IMPORTANT — this list cannot be computed and must be updated by hand every year: these
 * are only confirmed once the Prime Minister's Office publishes the official Government
 * Gazette notice for that year (typically late in the preceding year). Eid-Ul-Fitr in
 * particular is subject to moon-sighting confirmation and can shift by a day even after
 * being provisionally announced.
 *
 * 2026 dates below were cross-checked against two independent holiday calendars in
 * August 2026 (see PR/commit history) — reconfirm against the actual Gazette notice
 * each year rather than assuming these patterns repeat. As of mid-August 2026 the 2027
 * Gazette notice has not yet been published (Cabinet typically announces it toward the
 * end of the preceding year), so 2027 isn't listed here yet.
 */
const LUNAR_HOLIDAYS_2026: PublicHoliday[] = [
  { date: "2026-02-01", name: "Thaipoosam Cavadee" },
  { date: "2026-02-15", name: "Maha Shivaratree" },
  { date: "2026-02-17", name: "Chinese Spring Festival" },
  { date: "2026-03-19", name: "Ugaadi" },
  { date: "2026-03-21", name: "Eid-Ul-Fitr*" },
  { date: "2026-09-15", name: "Ganesh Chaturthi" },
  { date: "2026-11-08", name: "Divali" },
];

const LUNAR_HOLIDAYS_BY_YEAR: Record<number, PublicHoliday[]> = {
  2026: LUNAR_HOLIDAYS_2026,
};

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

/** Returns the names of any public holiday(s) falling on this "YYYY-MM-DD" date. */
export function getHolidayNamesForDate(date: string): string[] {
  const year = Number(date.slice(0, 4));
  const monthDay = date.slice(5); // "MM-DD"

  const fixed = FIXED_HOLIDAYS.filter((h) => `${pad2(h.month)}-${pad2(h.day)}` === monthDay).map((h) => h.name);
  const lunar = (LUNAR_HOLIDAYS_BY_YEAR[year] ?? []).filter((h) => h.date === date).map((h) => h.name);

  return [...fixed, ...lunar];
}
