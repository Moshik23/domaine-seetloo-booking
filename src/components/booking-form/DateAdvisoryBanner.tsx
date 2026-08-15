import { getHolidayNamesForDate } from "@/lib/publicHolidays";
import { getInauspiciousPeriodsForDate } from "@/lib/hinduInauspiciousPeriods";
import { groupConsecutiveDates, formatDateRangeDisplay } from "@/lib/dateUtils";

/** Groups each date under every name that applies to it (a date can carry more than one, e.g. a holiday inside Chaturmas). */
function groupDatesByName(dates: string[], namesForDate: (date: string) => string[]): Map<string, string[]> {
  const byName = new Map<string, string[]>();
  for (const date of dates) {
    for (const name of namesForDate(date)) {
      if (!byName.has(name)) byName.set(name, []);
      byName.get(name)!.push(date);
    }
  }
  return byName;
}

/** Informational only — never blocks a booking, unlike ConflictWarningBanner. */
export function DateAdvisoryBanner({ dates }: { dates: string[] }) {
  const holidayLines = Array.from(groupDatesByName(dates, getHolidayNamesForDate).entries()).flatMap(
    ([name, groupDates]) =>
      groupConsecutiveDates(groupDates).map((r) => {
        const range = formatDateRangeDisplay(r.start, r.end);
        return r.start === r.end
          ? `${range} is a public holiday (${name}).`
          : `${range} includes a public holiday (${name}).`;
      }),
  );

  const hinduNamesForDate = (date: string) => getInauspiciousPeriodsForDate(date).map((p) => p.name);
  const hinduLines = Array.from(groupDatesByName(dates, hinduNamesForDate).entries()).flatMap(([name, groupDates]) => {
    const note = getInauspiciousPeriodsForDate(groupDates[0]).find((p) => p.name === name)!.note;
    return groupConsecutiveDates(groupDates).map(
      (r) => `${formatDateRangeDisplay(r.start, r.end)} falls within ${name} — ${note}.`,
    );
  });

  const lines = [...holidayLines, ...hinduLines];
  if (lines.length === 0) return null;

  return (
    <div className="rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-800 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-300">
      <p className="font-medium">For your information — not a reason to turn the booking down:</p>
      <ul className="mt-1 list-disc space-y-0.5 pl-5">
        {lines.map((line, i) => (
          <li key={i}>{line}</li>
        ))}
      </ul>
    </div>
  );
}
