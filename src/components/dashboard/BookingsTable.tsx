import Link from "next/link";
import { VENUE_LABELS } from "@/lib/constants";
import { formatDateDisplay } from "@/lib/dateUtils";
import type { Venue, BookingStatus } from "@/generated/prisma/enums";

export interface BookingRow {
  id: string;
  surname: string;
  otherNames: string;
  occupancyVenue: Venue;
  dateIn: string;
  dateOut: string;
  status: BookingStatus;
  agreedPrice: number;
  deposit: number;
  payments: { amount: number }[];
}

export function BookingsTable({ bookings, emptyMessage = "No bookings match these filters." }: { bookings: BookingRow[]; emptyMessage?: string }) {
  return (
    <div className="overflow-x-auto rounded-md border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-neutral-200 text-left text-neutral-500 dark:border-neutral-800 dark:text-neutral-400">
            <th className="px-3 py-2 font-medium">Customer</th>
            <th className="px-3 py-2 font-medium">Venue</th>
            <th className="px-3 py-2 font-medium">Date In – Date Out</th>
            <th className="px-3 py-2 font-medium">Status</th>
            <th className="px-3 py-2 font-medium">Outstanding</th>
          </tr>
        </thead>
        <tbody>
          {bookings.length === 0 && (
            <tr>
              <td colSpan={5} className="px-3 py-6 text-center text-neutral-500 dark:text-neutral-400">
                {emptyMessage}
              </td>
            </tr>
          )}
          {bookings.map((b) => {
            const outstanding = b.agreedPrice - b.deposit - b.payments.reduce((s, p) => s + p.amount, 0);
            return (
              <tr key={b.id} className="border-b border-neutral-100 hover:bg-rose-50/40 dark:border-neutral-800 dark:hover:bg-rose-950/20">
                <td className="px-3 py-2">
                  <Link href={`/bookings/${b.id}`} className="font-medium text-neutral-900 hover:text-rose-700 hover:underline dark:text-neutral-100 dark:hover:text-rose-400">
                    {b.surname} {b.otherNames}
                  </Link>
                </td>
                <td className="px-3 py-2 dark:text-neutral-300">{VENUE_LABELS[b.occupancyVenue]}</td>
                <td className="px-3 py-2 dark:text-neutral-300">
                  {formatDateDisplay(b.dateIn)} – {formatDateDisplay(b.dateOut)}
                </td>
                <td className="px-3 py-2">
                  {b.status === "CANCELLED" ? (
                    <span className="rounded bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700 dark:bg-red-950/60 dark:text-red-300">
                      Cancelled
                    </span>
                  ) : (
                    <span className="rounded bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700 dark:bg-green-950/60 dark:text-green-300">
                      Confirmed
                    </span>
                  )}
                </td>
                <td className="px-3 py-2">
                  {b.status === "CANCELLED" ? (
                    <span className="dark:text-neutral-400">—</span>
                  ) : outstanding > 0 ? (
                    <span className="font-medium text-amber-700 dark:text-amber-400">Rs {outstanding.toLocaleString()}</span>
                  ) : (
                    <span className="text-neutral-500 dark:text-neutral-400">Paid in full</span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
