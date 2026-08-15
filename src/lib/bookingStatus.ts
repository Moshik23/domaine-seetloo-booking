import type { BookingStatus } from "@/generated/prisma/enums";
import { todayIso } from "@/lib/dateUtils";

export type BookingLifecycle = "ONGOING" | "COMPLETED" | "CANCELLED";

export const LIFECYCLE_LABELS: Record<BookingLifecycle, string> = {
  ONGOING: "Ongoing",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
};

/**
 * Derived, not stored: a booking is "completed" once its stay window (Date Out) is
 * in the past, "cancelled" if marked so, and "ongoing" otherwise (upcoming or
 * currently in progress).
 */
export function classifyBooking(
  booking: { status: BookingStatus; dateOut: string },
  today: string = todayIso(),
): BookingLifecycle {
  if (booking.status === "CANCELLED") return "CANCELLED";
  return booking.dateOut < today ? "COMPLETED" : "ONGOING";
}
