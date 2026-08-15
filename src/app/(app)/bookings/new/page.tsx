"use client";

import { BookingForm } from "@/components/booking-form/BookingForm";
import { createBooking } from "@/actions/bookings.actions";

export default function NewBookingPage() {
  return (
    <div>
      <h1 className="mb-6 text-lg font-semibold text-neutral-900 dark:text-neutral-100">New Booking</h1>
      <BookingForm
        submitLabel="Create Booking"
        onSubmit={async (input) => {
          const result = await createBooking(input);
          if (result.success) {
            return { success: true, id: result.data.id };
          }
          return { success: false, error: result.error, conflicts: result.conflicts };
        }}
      />
    </div>
  );
}
