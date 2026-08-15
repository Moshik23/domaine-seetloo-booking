import { getHolidayNamesForDate } from "@/lib/publicHolidays";
import { getInauspiciousPeriodsForDate } from "@/lib/hinduInauspiciousPeriods";
import { formatDateDisplay } from "@/lib/dateUtils";

/** Informational only — never blocks a booking, unlike ConflictWarningBanner. */
export function DateAdvisoryBanner({ dates }: { dates: string[] }) {
  const holidayLines = dates.flatMap((date) =>
    getHolidayNamesForDate(date).map((name) => `${formatDateDisplay(date)} is a public holiday (${name}).`),
  );
  const hinduLines = dates.flatMap((date) =>
    getInauspiciousPeriodsForDate(date).map(
      (p) => `${formatDateDisplay(date)} falls within ${p.name} — ${p.note}.`,
    ),
  );

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
