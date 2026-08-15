"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BookingForm, bookingToFormValues, type BookingWithEvents } from "./BookingForm";
import { PaymentLog, type PaymentRow } from "@/components/payments/PaymentLog";
import { AddPaymentForm } from "@/components/payments/AddPaymentForm";
import { updateBooking, cancelBooking } from "@/actions/bookings.actions";
import { VENUE_LABELS } from "@/lib/constants";
import { formatDateDisplay, formatTimeDisplay } from "@/lib/dateUtils";
import type { BookingStatus } from "@/generated/prisma/enums";

export interface BookingDetailData extends Omit<BookingWithEvents, "events"> {
  id: string;
  status: BookingStatus;
  events: (BookingWithEvents["events"][number] & { id: string })[];
  payments: PaymentRow[];
}

export function BookingDetailClient({ booking }: { booking: BookingDetailData }) {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  const outstanding = booking.agreedPrice - booking.deposit - booking.payments.reduce((s, p) => s + p.amount, 0);

  async function handleCancel() {
    if (!confirm(`Cancel the booking for ${booking.surname} ${booking.otherNames}? This frees up its dates/venue.`)) {
      return;
    }
    setCancelling(true);
    await cancelBooking(booking.id);
    setCancelling(false);
    router.refresh();
  }

  if (isEditing) {
    return (
      <div>
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
            Edit Booking — {booking.surname} {booking.otherNames}
          </h1>
          <button
            type="button"
            onClick={() => setIsEditing(false)}
            className="text-sm text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100"
          >
            Cancel edit
          </button>
        </div>
        <BookingForm
          bookingId={booking.id}
          defaultValues={bookingToFormValues(booking)}
          submitLabel="Save Changes"
          onSubmit={async (input) => {
            const result = await updateBooking(booking.id, input);
            if (result.success) {
              setIsEditing(false);
              router.refresh();
              return { success: true };
            }
            return { success: false, error: result.error, conflicts: result.conflicts };
          }}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h1 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
            {booking.surname} {booking.otherNames}
          </h1>
          {booking.status === "CANCELLED" && (
            <span className="mt-1 inline-block rounded bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700 dark:bg-red-950/60 dark:text-red-300">
              Cancelled
            </span>
          )}
        </div>
        <div className="flex gap-2">
          <Link
            href={`/bookings/${booking.id}/print`}
            className="rounded-md border border-neutral-300 px-3 py-2 text-sm font-medium hover:bg-neutral-50 dark:border-neutral-700 dark:text-neutral-200 dark:hover:bg-neutral-800"
          >
            Print
          </Link>
          {booking.status === "CONFIRMED" && (
            <>
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="rounded-md border border-neutral-300 px-3 py-2 text-sm font-medium hover:bg-neutral-50 dark:border-neutral-700 dark:text-neutral-200 dark:hover:bg-neutral-800"
              >
                Edit
              </button>
              <button
                type="button"
                onClick={handleCancel}
                disabled={cancelling}
                className="rounded-md border border-red-300 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-50 dark:border-red-900 dark:text-red-400 dark:hover:bg-red-950/40"
              >
                {cancelling ? "Cancelling..." : "Cancel Booking"}
              </button>
            </>
          )}
        </div>
      </div>

      <section className="grid grid-cols-1 gap-x-6 gap-y-1 rounded-md border border-neutral-200 p-4 text-sm sm:grid-cols-2 dark:border-neutral-800 dark:text-neutral-200">
        <p><span className="text-neutral-500 dark:text-neutral-400">Phone:</span> {booking.phone1}{booking.phone2 ? ` / ${booking.phone2}` : ""}</p>
        <p><span className="text-neutral-500 dark:text-neutral-400">Address:</span> {booking.address || "—"}</p>
        <p>
          <span className="text-neutral-500 dark:text-neutral-400">Date In / Check In:</span> {formatDateDisplay(booking.dateIn)}
          {booking.timeIn ? ` ${formatTimeDisplay(booking.timeIn)}` : ""}
        </p>
        <p>
          <span className="text-neutral-500 dark:text-neutral-400">Date Out / Check Out:</span> {formatDateDisplay(booking.dateOut)}
          {booking.timeOut ? ` ${formatTimeDisplay(booking.timeOut)}` : ""}
        </p>
        <p><span className="text-neutral-500 dark:text-neutral-400">Occupancy:</span> {VENUE_LABELS[booking.occupancyVenue]}</p>
        <p><span className="text-neutral-500 dark:text-neutral-400">Booked By:</span> {booking.bookedByStaffName}</p>
        {booking.notes && <p className="sm:col-span-2"><span className="text-neutral-500 dark:text-neutral-400">Notes:</span> {booking.notes}</p>}
      </section>

      <section>
        <h2 className="mb-2 text-sm font-semibold text-neutral-900 dark:text-neutral-100">Events</h2>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-neutral-200 text-left text-neutral-500 dark:border-neutral-800 dark:text-neutral-400">
              <th className="py-1 font-medium">Event</th>
              <th className="py-1 font-medium">Venue</th>
              <th className="py-1 font-medium">Date</th>
              <th className="py-1 font-medium">Time</th>
            </tr>
          </thead>
          <tbody>
            {booking.events.map((e, i) => (
              <tr key={i} className="border-b border-neutral-100 dark:border-neutral-800 dark:text-neutral-200">
                <td className="py-1">{e.label}</td>
                <td className="py-1">{VENUE_LABELS[e.venue]}</td>
                <td className="py-1">{formatDateDisplay(e.date)}</td>
                <td className="py-1">
                  {formatTimeDisplay(e.startTime)}
                  {e.endTime ? `–${formatTimeDisplay(e.endTime)}` : ""}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="rounded-md border border-neutral-200 p-4 text-sm dark:border-neutral-800 dark:text-neutral-200">
        <div className="grid grid-cols-2 gap-1 sm:grid-cols-4">
          <p><span className="text-neutral-500 dark:text-neutral-400">Agreed Price:</span> Rs {booking.agreedPrice.toLocaleString()}</p>
          <p><span className="text-neutral-500 dark:text-neutral-400">Deposit:</span> Rs {booking.deposit.toLocaleString()}</p>
          <p><span className="text-neutral-500 dark:text-neutral-400">Paid (excl. deposit):</span> Rs {booking.payments.reduce((s, p) => s + p.amount, 0).toLocaleString()}</p>
          <p className="font-medium"><span className="text-neutral-500 font-normal dark:text-neutral-400">Outstanding:</span> Rs {outstanding.toLocaleString()}</p>
        </div>
      </section>

      <section>
        <h2 className="mb-2 text-sm font-semibold text-neutral-900 dark:text-neutral-100">Payments</h2>
        <PaymentLog payments={booking.payments} />
        {booking.status === "CONFIRMED" && (
          <div className="mt-3">
            <AddPaymentForm bookingId={booking.id} />
          </div>
        )}
      </section>
    </div>
  );
}
