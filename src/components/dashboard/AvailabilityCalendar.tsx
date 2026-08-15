"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { DayOccupancy, DayOccupant } from "@/lib/availability";
import { formatDateDisplay, formatTimeDisplay, todayIso } from "@/lib/dateUtils";
import { getHolidayNamesForDate } from "@/lib/publicHolidays";
import { getInauspiciousPeriodsForDate } from "@/lib/hinduInauspiciousPeriods";

const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTH_LABELS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

function toIso(year: number, monthIndex0: number, day: number) {
  return `${year}-${pad2(monthIndex0 + 1)}-${pad2(day)}`;
}

/** Returns a 6x7 grid of ISO date strings (may spill into adjacent months) for a calendar view. */
function buildMonthGrid(year: number, monthIndex0: number): string[] {
  const firstOfMonth = new Date(Date.UTC(year, monthIndex0, 1));
  const startWeekday = firstOfMonth.getUTCDay(); // 0 = Sunday
  const gridStart = new Date(Date.UTC(year, monthIndex0, 1 - startWeekday));

  const days: string[] = [];
  for (let i = 0; i < 42; i++) {
    const d = new Date(gridStart);
    d.setUTCDate(gridStart.getUTCDate() + i);
    days.push(toIso(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  }
  return days;
}

function summarizeOccupants(occupants: DayOccupant[]): string {
  return occupants
    .map((o) => {
      const time = formatTimeDisplay(o.start.split("T")[1]);
      return `${o.surname} ${o.otherNames} — ${o.label} (${time})`;
    })
    .join("\n");
}

export function AvailabilityCalendar({
  occupancyMap,
}: {
  occupancyMap: Record<string, DayOccupancy>;
}) {
  const today = todayIso();
  const [year, setYear] = useState(() => Number(today.slice(0, 4)));
  const [monthIndex0, setMonthIndex0] = useState(() => Number(today.slice(5, 7)) - 1);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [showHindu, setShowHindu] = useState(false);

  const gridDates = useMemo(() => buildMonthGrid(year, monthIndex0), [year, monthIndex0]);

  function goToMonth(y: number, m0: number) {
    // normalize month index into a valid year/month pair
    const d = new Date(Date.UTC(y, m0, 1));
    setYear(d.getUTCFullYear());
    setMonthIndex0(d.getUTCMonth());
  }

  function jumpToDate(iso: string) {
    if (!iso) return;
    const [y, m] = iso.split("-").map(Number);
    goToMonth(y, m - 1);
    setSelectedDate(iso);
  }

  const selectedOccupancy = selectedDate ? occupancyMap[selectedDate] : undefined;

  return (
    <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-rose-100 bg-gradient-to-r from-rose-50 via-white to-white px-4 py-3 dark:border-rose-900/40 dark:from-rose-950/30 dark:via-neutral-900 dark:to-neutral-900">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => goToMonth(year, monthIndex0 - 1)}
            className="rounded-full border border-neutral-200 bg-white px-2.5 py-1 text-sm text-neutral-600 shadow-sm hover:border-rose-300 hover:text-rose-700 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:border-rose-700 dark:hover:text-rose-400"
            aria-label="Previous month"
          >
            ‹
          </button>
          <h2 className="w-40 text-center text-sm font-semibold tracking-wide text-neutral-900 dark:text-neutral-100">
            {MONTH_LABELS[monthIndex0]} {year}
          </h2>
          <button
            type="button"
            onClick={() => goToMonth(year, monthIndex0 + 1)}
            className="rounded-full border border-neutral-200 bg-white px-2.5 py-1 text-sm text-neutral-600 shadow-sm hover:border-rose-300 hover:text-rose-700 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:border-rose-700 dark:hover:text-rose-400"
            aria-label="Next month"
          >
            ›
          </button>
          <button
            type="button"
            onClick={() => jumpToDate(today)}
            className="ml-2 rounded-full border border-rose-200 bg-rose-50 px-3 py-1 text-xs font-medium text-rose-700 hover:bg-rose-100 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-300 dark:hover:bg-rose-950/70"
          >
            Today
          </button>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-3 text-xs font-medium text-neutral-600 dark:text-neutral-300">
            <span className="flex items-center gap-1.5 rounded-full bg-white px-2 py-1 shadow-sm ring-1 ring-neutral-200 dark:bg-neutral-800 dark:ring-neutral-700">
              <span className="inline-block h-2.5 w-2.5 rounded-full bg-indigo-500" /> Hall
            </span>
            <span className="flex items-center gap-1.5 rounded-full bg-white px-2 py-1 shadow-sm ring-1 ring-neutral-200 dark:bg-neutral-800 dark:ring-neutral-700">
              <span className="inline-block h-2.5 w-2.5 rounded-full bg-emerald-500" /> Chalet
            </span>
            <span className="flex items-center gap-1.5 rounded-full bg-white px-2 py-1 shadow-sm ring-1 ring-neutral-200 dark:bg-neutral-800 dark:ring-neutral-700">
              <span className="inline-block h-2.5 w-2.5 rounded-full bg-amber-400" /> Public holidays
            </span>
            <label className="flex cursor-pointer items-center gap-1.5 rounded-full bg-white px-2 py-1 shadow-sm ring-1 ring-neutral-200 dark:bg-neutral-800 dark:ring-neutral-700">
              <input
                type="checkbox"
                checked={showHindu}
                onChange={(e) => setShowHindu(e.target.checked)}
                className="h-3 w-3 accent-violet-500"
              />
              <span className="inline-block h-2.5 w-2.5 rounded-full bg-violet-400" /> Hindu wedding calendar
            </label>
          </div>
          <div>
            <label htmlFor="jump-to-date" className="sr-only">
              Jump to date
            </label>
            <input
              id="jump-to-date"
              type="date"
              onChange={(e) => jumpToDate(e.target.value)}
              className="rounded-full border border-neutral-200 bg-white px-3 py-1 text-sm shadow-sm dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100"
            />
          </div>
        </div>
      </div>

      <div className="p-4">
        <div className="grid grid-cols-7 gap-1.5 text-center text-xs font-semibold uppercase tracking-wide text-neutral-400 dark:text-neutral-500">
          {WEEKDAY_LABELS.map((w) => (
            <div key={w} className={`py-1 ${w === "Sun" ? "text-red-500 dark:text-red-400" : ""}`}>
              {w}
            </div>
          ))}
        </div>

        <div className="mt-1 grid grid-cols-7 gap-1.5">
          {gridDates.map((date) => {
            const inCurrentMonth = Number(date.slice(5, 7)) === monthIndex0 + 1;
            const dayNum = Number(date.slice(8, 10));
            const occ = occupancyMap[date];
            const hallBooked = !!occ?.HALL.length;
            const chaletBooked = !!occ?.CHALET.length;
            const bothBooked = hallBooked && chaletBooked;
            const isToday = date === today;
            const isSelected = date === selectedDate;
            const holidayNames = getHolidayNamesForDate(date);
            const isHoliday = holidayNames.length > 0;
            const hinduPeriods = showHindu ? getInauspiciousPeriodsForDate(date) : [];
            const isHinduPeriod = hinduPeriods.length > 0;

            const tooltipParts: string[] = [];
            if (isHoliday) tooltipParts.push(`Public holiday:\n${holidayNames.join(", ")}`);
            if (isHinduPeriod) tooltipParts.push(`Hindu calendar:\n${hinduPeriods.map((p) => p.name).join(", ")}`);
            if (hallBooked) tooltipParts.push(`Hall:\n${summarizeOccupants(occ!.HALL)}`);
            if (chaletBooked) tooltipParts.push(`Chalet:\n${summarizeOccupants(occ!.CHALET)}`);

            let cellBg = "bg-white dark:bg-neutral-900";
            if (!inCurrentMonth) cellBg = "bg-neutral-50 dark:bg-neutral-950";
            else if (bothBooked) cellBg = "bg-gradient-to-br from-indigo-50 to-emerald-50 dark:from-indigo-950/40 dark:to-emerald-950/40";
            else if (hallBooked) cellBg = "bg-indigo-50 dark:bg-indigo-950/40";
            else if (chaletBooked) cellBg = "bg-emerald-50 dark:bg-emerald-950/40";

            let borderColor = "border-neutral-200 dark:border-neutral-800";
            if (isSelected) borderColor = "border-rose-400 dark:border-rose-600";
            else if (bothBooked) borderColor = "border-neutral-200 dark:border-neutral-800";
            else if (hallBooked) borderColor = "border-indigo-200 dark:border-indigo-900";
            else if (chaletBooked) borderColor = "border-emerald-200 dark:border-emerald-900";

            return (
              <button
                key={date}
                type="button"
                title={tooltipParts.join("\n\n") || "Available"}
                onClick={() => setSelectedDate(date)}
                className={`relative flex h-16 flex-col items-center justify-start rounded-lg border p-1 text-xs transition hover:-translate-y-0.5 hover:shadow-md ${cellBg} ${borderColor} ${
                  isSelected
                    ? "ring-2 ring-rose-400 dark:ring-rose-600"
                    : isHoliday
                      ? "ring-1 ring-amber-300 dark:ring-amber-700"
                      : isHinduPeriod
                        ? "ring-1 ring-violet-300 dark:ring-violet-700"
                        : ""
                } ${inCurrentMonth ? "text-neutral-700 dark:text-neutral-300" : "text-neutral-400 dark:text-neutral-600"}`}
              >
                {(isHoliday || isHinduPeriod) && (
                  <span className="absolute left-1 top-1 flex gap-0.5">
                    {isHoliday && <span className="h-1.5 w-1.5 rounded-full bg-amber-400" aria-hidden />}
                    {isHinduPeriod && <span className="h-1.5 w-1.5 rounded-full bg-violet-400" aria-hidden />}
                  </span>
                )}
                {isToday && (
                  <span className="absolute right-1 top-1 h-1.5 w-1.5 rounded-full bg-rose-500" aria-hidden />
                )}
                <span className={isToday ? "font-bold text-rose-700 dark:text-rose-400" : "font-medium"}>{dayNum}</span>
                <span className="mt-1.5 flex gap-1">
                  <span
                    className={`h-1.5 w-4 rounded-full ${hallBooked ? "bg-indigo-500" : "bg-neutral-200 dark:bg-neutral-700"}`}
                    aria-hidden
                  />
                  <span
                    className={`h-1.5 w-4 rounded-full ${chaletBooked ? "bg-emerald-500" : "bg-neutral-200 dark:bg-neutral-700"}`}
                    aria-hidden
                  />
                </span>
              </button>
            );
          })}
        </div>

        {selectedDate && (
          <div className="mt-4 rounded-lg border border-neutral-200 bg-neutral-50 p-3 dark:border-neutral-800 dark:bg-neutral-950/60">
            <div className="mb-2 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">{formatDateDisplay(selectedDate)}</h3>
              <button
                type="button"
                onClick={() => setSelectedDate(null)}
                className="text-xs text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100"
              >
                Close
              </button>
            </div>
            {getHolidayNamesForDate(selectedDate).length > 0 && (
              <p className="mb-2 flex items-center gap-1.5 text-sm font-medium text-amber-700 dark:text-amber-400">
                <span className="inline-block h-2 w-2 rounded-full bg-amber-400" />
                Public holiday: {getHolidayNamesForDate(selectedDate).join(", ")}
              </p>
            )}
            {showHindu && getInauspiciousPeriodsForDate(selectedDate).length > 0 && (
              <p className="mb-2 flex items-center gap-1.5 text-sm font-medium text-violet-700 dark:text-violet-400">
                <span className="inline-block h-2 w-2 rounded-full bg-violet-400" />
                Hindu calendar: {getInauspiciousPeriodsForDate(selectedDate).map((p) => p.name).join(", ")}
              </p>
            )}
            {!selectedOccupancy || (selectedOccupancy.HALL.length === 0 && selectedOccupancy.CHALET.length === 0) ? (
              <p className="text-sm font-medium text-emerald-700 dark:text-emerald-400">
                Hall and Chalet are both free on this date.
              </p>
            ) : (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <VenueDetail label="Hall" accent="indigo" occupants={selectedOccupancy.HALL} />
                <VenueDetail label="Chalet" accent="emerald" occupants={selectedOccupancy.CHALET} />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function VenueDetail({
  label,
  accent,
  occupants,
}: {
  label: string;
  accent: "indigo" | "emerald";
  occupants: DayOccupant[];
}) {
  const borderClass = accent === "indigo" ? "border-indigo-300 dark:border-indigo-700" : "border-emerald-300 dark:border-emerald-700";
  const dotClass = accent === "indigo" ? "bg-indigo-500" : "bg-emerald-500";

  if (occupants.length === 0) {
    return (
      <div className={`rounded-md border-l-4 ${borderClass} bg-white p-2 text-sm shadow-sm dark:bg-neutral-900`}>
        <p className="flex items-center gap-1.5 font-medium text-neutral-900 dark:text-neutral-100">
          <span className={`inline-block h-2 w-2 rounded-full ${dotClass}`} /> {label}
        </p>
        <p className="mt-0.5 text-emerald-700 dark:text-emerald-400">Free</p>
      </div>
    );
  }

  const seen = new Set<string>();

  return (
    <div className={`rounded-md border-l-4 ${borderClass} bg-white p-2 text-sm shadow-sm dark:bg-neutral-900`}>
      <p className="flex items-center gap-1.5 font-medium text-neutral-900 dark:text-neutral-100">
        <span className={`inline-block h-2 w-2 rounded-full ${dotClass}`} /> {label}
        <span className="text-xs font-normal text-neutral-500 dark:text-neutral-400">booked</span>
      </p>
      <ul className="mt-1 space-y-1 pl-3.5">
        {occupants.map((o, i) => {
          const time = formatTimeDisplay(o.start.split("T")[1]);
          const key = `${o.bookingId}-${o.label}-${i}`;
          if (seen.has(o.bookingId + o.label)) return null;
          seen.add(o.bookingId + o.label);
          return (
            <li key={key}>
              <Link
                href={`/bookings/${o.bookingId}`}
                className="text-neutral-900 hover:text-rose-700 hover:underline dark:text-neutral-100 dark:hover:text-rose-400"
              >
                {o.surname} {o.otherNames}
              </Link>{" "}
              <span className="text-neutral-500 dark:text-neutral-400">
                — {o.label} ({time})
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
