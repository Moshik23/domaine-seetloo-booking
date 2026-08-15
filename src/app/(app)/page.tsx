import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { VENUE_LABELS } from "@/lib/constants";
import { getCurrentAndNextMonthRange } from "@/lib/dateUtils";
import { buildDayOccupancyMap } from "@/lib/availability";
import { AvailabilityCalendar } from "@/components/dashboard/AvailabilityCalendar";
import { BookingsTable } from "@/components/dashboard/BookingsTable";

interface DashboardSearchParams {
  surname?: string;
  venue?: string;
  from?: string;
  to?: string;
  includeCancelled?: string;
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<DashboardSearchParams>;
}) {
  const sp = await searchParams;
  const includeCancelled = sp.includeCancelled === "1";

  const bookings = await prisma.booking.findMany({
    include: { events: true, payments: true },
    orderBy: { dateIn: "asc" },
  });

  const surnameQuery = sp.surname?.trim().toLowerCase() ?? "";
  const hasExplicitDateFilter = !!(sp.from || sp.to);
  const { start: currentMonthStart, end: nextMonthEnd } = getCurrentAndNextMonthRange();

  const filtered = bookings.filter((b) => {
    if (!includeCancelled && b.status === "CANCELLED") return false;
    if (
      surnameQuery &&
      !b.surname.toLowerCase().includes(surnameQuery) &&
      !b.otherNames.toLowerCase().includes(surnameQuery)
    ) {
      return false;
    }
    if (sp.venue && sp.venue !== "ALL" && b.occupancyVenue !== sp.venue) return false;
    if (sp.from && b.dateOut < sp.from) return false;
    if (sp.to && b.dateIn > sp.to) return false;
    // Without an explicit date filter, keep the list to what's actually relevant right
    // now — current + next month — so it doesn't grow unbounded as bookings pile up.
    // The full history lives on the Bookings page instead.
    if (!hasExplicitDateFilter) {
      if (b.dateOut < currentMonthStart || b.dateIn > nextMonthEnd) return false;
    }
    return true;
  });

  const occupancyMap = buildDayOccupancyMap(bookings.filter((b) => b.status === "CONFIRMED"));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">Dashboard</h1>
        <Link
          href="/bookings/new"
          className="rounded-md bg-rose-700 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-rose-800"
        >
          + New Booking
        </Link>
      </div>

      <AvailabilityCalendar occupancyMap={occupancyMap} />

      <form className="flex flex-wrap items-end gap-3 rounded-md border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
        <div>
          <label className="mb-1 block text-xs font-medium text-neutral-700 dark:text-neutral-300">Surname / Name</label>
          <input
            name="surname"
            defaultValue={sp.surname ?? ""}
            className="w-44 rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-neutral-700 dark:text-neutral-300">Venue</label>
          <select
            name="venue"
            defaultValue={sp.venue ?? "ALL"}
            className="rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100"
          >
            <option value="ALL">All</option>
            {(Object.keys(VENUE_LABELS) as Array<keyof typeof VENUE_LABELS>).map((v) => (
              <option key={v} value={v}>
                {VENUE_LABELS[v]}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-neutral-700 dark:text-neutral-300">From</label>
          <input
            type="date"
            name="from"
            defaultValue={sp.from ?? ""}
            className="rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-neutral-700 dark:text-neutral-300">To</label>
          <input
            type="date"
            name="to"
            defaultValue={sp.to ?? ""}
            className="rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100"
          />
        </div>
        <label className="flex items-center gap-1.5 pb-2 text-sm text-neutral-700 dark:text-neutral-300">
          <input type="checkbox" name="includeCancelled" value="1" defaultChecked={includeCancelled} />
          Include cancelled
        </label>
        <button
          type="submit"
          className="rounded-md border border-neutral-300 px-3 py-2 text-sm font-medium hover:bg-neutral-50 dark:border-neutral-700 dark:text-neutral-200 dark:hover:bg-neutral-800"
        >
          Filter
        </button>
        <Link href="/" className="pb-2 text-sm text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100">
          Clear
        </Link>
      </form>

      <div>
        {!hasExplicitDateFilter && (
          <p className="mb-2 text-xs text-neutral-500 dark:text-neutral-400">
            Showing this month and next only. Set a date range above, or visit{" "}
            <Link href="/bookings" className="text-rose-700 hover:underline dark:text-rose-400">
              Bookings
            </Link>{" "}
            for the full history.
          </p>
        )}
        <BookingsTable bookings={filtered} />
      </div>
    </div>
  );
}
