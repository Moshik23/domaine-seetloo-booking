"use client";

import { useEffect, useRef } from "react";
import type { ConflictDetail } from "@/lib/conflicts";
import { mergeDateRanges, formatDateRangeDisplay } from "@/lib/dateUtils";
import { playConflictChime } from "@/lib/sound";

/**
 * One clash per (booking, date range) — staff need "who, when", not every technical block.
 * Uses each block's full start-end span (not just its start date) so a single multi-day
 * block, e.g. a 4-day stay window, merges cleanly with other blocks inside it instead of
 * fragmenting into misleading gaps.
 */
function summarizeConflicts(conflicts: ConflictDetail[]) {
  const byBooking = new Map<string, { name: string; ranges: { start: string; end: string }[] }>();

  for (const c of conflicts) {
    if (!byBooking.has(c.otherBookingId)) {
      byBooking.set(c.otherBookingId, {
        name: [c.otherSurname, c.otherOtherNames].filter(Boolean).join(" "),
        ranges: [],
      });
    }
    byBooking.get(c.otherBookingId)!.ranges.push({
      start: c.otherRange[0].split("T")[0],
      end: c.otherRange[1].split("T")[0],
    });
  }

  const summary: { name: string; start: string; end: string }[] = [];
  for (const { name, ranges } of byBooking.values()) {
    for (const range of mergeDateRanges(ranges)) {
      summary.push({ name, ...range });
    }
  }
  return summary;
}

export function ConflictWarningBanner({ conflicts }: { conflicts: ConflictDetail[] }) {
  const wasShowing = useRef(false);

  useEffect(() => {
    if (conflicts.length > 0 && !wasShowing.current) {
      playConflictChime();
    }
    wasShowing.current = conflicts.length > 0;
  }, [conflicts.length]);

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
            {s.name} {s.start === s.end ? `on ${formatDateRangeDisplay(s.start, s.end)}` : `from ${formatDateRangeDisplay(s.start, s.start)} to ${formatDateRangeDisplay(s.end, s.end)}`}
          </li>
        ))}
      </ul>
    </div>
  );
}
