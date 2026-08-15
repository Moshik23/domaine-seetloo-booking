import type { ConflictDetail } from "@/lib/conflicts";
import { formatDateDisplay } from "@/lib/dateUtils";

/** One clash per (booking, date) — staff need "who, when", not every technical block. */
function summarizeConflicts(conflicts: ConflictDetail[]) {
  const seen = new Set<string>();
  const summary: { name: string; date: string }[] = [];

  for (const c of conflicts) {
    const date = c.otherRange[0].split("T")[0];
    const key = `${c.otherBookingId}-${date}`;
    if (seen.has(key)) continue;
    seen.add(key);
    summary.push({
      name: [c.otherSurname, c.otherOtherNames].filter(Boolean).join(" "),
      date,
    });
  }

  return summary;
}

export function ConflictWarningBanner({ conflicts }: { conflicts: ConflictDetail[] }) {
  if (conflicts.length === 0) return null;

  const summary = summarizeConflicts(conflicts);

  return (
    <div className="rounded-md border border-red-300 bg-red-50 p-3 text-sm text-red-800 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300">
      <p className="font-medium">
        Clashes with {summary.length === 1 ? "an existing booking" : "existing bookings"}:
      </p>
      <ul className="mt-1 list-disc space-y-0.5 pl-5">
        {summary.map((s, i) => (
          <li key={i}>
            {s.name} on {formatDateDisplay(s.date)}
          </li>
        ))}
      </ul>
    </div>
  );
}
