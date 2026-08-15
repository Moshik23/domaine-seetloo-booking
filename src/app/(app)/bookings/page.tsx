import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { VENUE_LABELS } from "@/lib/constants";
import { todayIso } from "@/lib/dateUtils";
import { classifyBooking, LIFECYCLE_LABELS, type BookingLifecycle } from "@/lib/bookingStatus";
import { BookingsTable } from "@/components/dashboard/BookingsTable";
import { ExportCsvButton, type ExportableBooking } from "@/components/dashboard/ExportCsvButton";

interface BookingsSearchParams {
  status?: string;
  surname?: string;
  venue?: string;
}

const TABS: BookingLifecycle[] = ["ONGOING", "COMPLETED", "CANCELLED"];

export default async function BookingsPage({
  searchParams,
}: {
  searchParams: Promise<BookingsSearchParams>;
}) {
  const sp = await searchParams;
  const activeTab: BookingLifecycle = TABS.includes(sp.status?.toUpperCase() as BookingLifecycle)
    ? (sp.status!.toUpperCase() as BookingLifecycle)
    : "ONGOING";

  const today = todayIso();
  const allBookings = await prisma.booking.findMany({
    include: { payments: true },
    orderBy: { dateIn: "asc" },
  });

  const surnameQuery = sp.surname?.trim().toLowerCase() ?? "";

  const forTab = allBookings.filter((b) => {
    if (classifyBooking(b, today) !== activeTab) return false;
    if (
      surnameQuery &&
      !b.surname.toLowerCase().includes(surnameQuery) &&
      !b.otherNames.toLowerCase().includes(surnameQuery)
    ) {
      return false;
    }
    if (sp.venue && sp.venue !== "ALL" && b.occupancyVenue !== sp.venue) return false;
    return true;
  });

  const sorted = [...forTab].sort((a, b) => {
    if (activeTab === "ONGOING") return a.dateIn.localeCompare(b.dateIn);
    if (activeTab === "COMPLETED") return b.dateOut.localeCompare(a.dateOut);
    return b.updatedAt.getTime() - a.updatedAt.getTime(); // cancelled: most recently changed first
  });

  const exportRows: ExportableBooking[] = sorted.map((b) => ({
    surname: b.surname,
    otherNames: b.otherNames,
    phone1: b.phone1,
    phone2: b.phone2,
    address: b.address,
    occupancyVenue: b.occupancyVenue,
    dateIn: b.dateIn,
    timeIn: b.timeIn,
    dateOut: b.dateOut,
    timeOut: b.timeOut,
    agreedPrice: b.agreedPrice,
    deposit: b.deposit,
    outstanding: b.agreedPrice - b.deposit - b.payments.reduce((s, p) => s + p.amount, 0),
    status: b.status,
    bookedByStaffName: b.bookedByStaffName,
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">Bookings</h1>
        <Link
          href="/bookings/new"
          className="rounded-md bg-rose-700 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-rose-800"
        >
          + New Booking
        </Link>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {TABS.map((tab) => {
          const isActive = tab === activeTab;
          const params = new URLSearchParams();
          params.set("status", tab.toLowerCase());
          if (sp.surname) params.set("surname", sp.surname);
          if (sp.venue) params.set("venue", sp.venue);
          return (
            <Link
              key={tab}
              href={`/bookings?${params.toString()}`}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
                isActive
                  ? "bg-rose-700 text-white shadow-sm"
                  : "border border-neutral-300 text-neutral-600 hover:bg-neutral-50 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800"
              }`}
            >
              {LIFECYCLE_LABELS[tab]}
            </Link>
          );
        })}
      </div>

      <form className="flex flex-wrap items-end gap-3 rounded-md border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
        <input type="hidden" name="status" value={activeTab.toLowerCase()} />
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
        <button
          type="submit"
          className="rounded-md border border-neutral-300 px-3 py-2 text-sm font-medium hover:bg-neutral-50 dark:border-neutral-700 dark:text-neutral-200 dark:hover:bg-neutral-800"
        >
          Filter
        </button>
        <Link
          href={`/bookings?status=${activeTab.toLowerCase()}`}
          className="pb-2 text-sm text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100"
        >
          Clear
        </Link>
        <div className="ml-auto">
          <ExportCsvButton
            bookings={exportRows}
            filename={`domaine-seetloo-bookings-${activeTab.toLowerCase()}-${today}.csv`}
          />
        </div>
      </form>

      <BookingsTable
        bookings={sorted}
        emptyMessage={`No ${LIFECYCLE_LABELS[activeTab].toLowerCase()} bookings match these filters.`}
      />
    </div>
  );
}
