"use server";

import { prisma } from "@/lib/prisma";
import { findConflicts, type BookingLike, type ConflictDetail } from "@/lib/conflicts";
import { bookingInputSchema, type BookingInput } from "@/lib/validation";
import { revalidatePath } from "next/cache";

export type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string; conflicts?: ConflictDetail[] };

class ConflictError extends Error {
  constructor(public conflicts: ConflictDetail[]) {
    super("Booking conflicts with an existing reservation.");
  }
}

function toBookingLike(input: BookingInput, id?: string): BookingLike {
  return {
    id,
    surname: input.surname,
    dateIn: input.dateIn,
    timeIn: input.timeIn ?? null,
    dateOut: input.dateOut,
    timeOut: input.timeOut ?? null,
    occupancyVenue: input.occupancyVenue,
    events: input.events.map((e) => ({
      label: e.label,
      venue: e.venue,
      date: e.date,
      startTime: e.startTime,
      endTime: e.endTime,
    })),
  };
}

export async function createBooking(rawInput: BookingInput): Promise<ActionResult<{ id: string }>> {
  const parsed = bookingInputSchema.safeParse(rawInput);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid booking data." };
  }
  const input = parsed.data;

  try {
    const id = await prisma.$transaction(async (tx) => {
      const conflicts = await findConflicts(toBookingLike(input), undefined, tx);
      if (conflicts.length > 0) throw new ConflictError(conflicts);

      const booking = await tx.booking.create({
        data: {
          formDate: input.formDate ?? null,
          surname: input.surname,
          otherNames: input.otherNames,
          phone1: input.phone1,
          phone2: input.phone2 || null,
          address: input.address || null,
          dateIn: input.dateIn,
          timeIn: input.timeIn || null,
          dateOut: input.dateOut,
          timeOut: input.timeOut || null,
          occupancyVenue: input.occupancyVenue,
          agreedPrice: input.agreedPrice,
          deposit: input.deposit,
          bookedByStaffName: input.bookedByStaffName,
          notes: input.notes || null,
          events: {
            create: input.events.map((e) => ({
              label: e.label,
              venue: e.venue,
              date: e.date,
              startTime: e.startTime,
              endTime: e.endTime,
            })),
          },
        },
      });

      return booking.id;
    });

    revalidatePath("/");
    return { success: true, data: { id } };
  } catch (err) {
    if (err instanceof ConflictError) {
      return { success: false, error: err.message, conflicts: err.conflicts };
    }
    throw err;
  }
}

export async function updateBooking(
  id: string,
  rawInput: BookingInput,
): Promise<ActionResult<{ id: string }>> {
  const parsed = bookingInputSchema.safeParse(rawInput);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid booking data." };
  }
  const input = parsed.data;

  try {
    await prisma.$transaction(async (tx) => {
      const conflicts = await findConflicts(toBookingLike(input, id), id, tx);
      if (conflicts.length > 0) throw new ConflictError(conflicts);

      await tx.bookingEvent.deleteMany({ where: { bookingId: id } });

      await tx.booking.update({
        where: { id },
        data: {
          formDate: input.formDate ?? null,
          surname: input.surname,
          otherNames: input.otherNames,
          phone1: input.phone1,
          phone2: input.phone2 || null,
          address: input.address || null,
          dateIn: input.dateIn,
          timeIn: input.timeIn || null,
          dateOut: input.dateOut,
          timeOut: input.timeOut || null,
          occupancyVenue: input.occupancyVenue,
          agreedPrice: input.agreedPrice,
          deposit: input.deposit,
          bookedByStaffName: input.bookedByStaffName,
          notes: input.notes || null,
          events: {
            create: input.events.map((e) => ({
              label: e.label,
              venue: e.venue,
              date: e.date,
              startTime: e.startTime,
              endTime: e.endTime,
            })),
          },
        },
      });
    });

    revalidatePath("/");
    revalidatePath(`/bookings/${id}`);
    return { success: true, data: { id } };
  } catch (err) {
    if (err instanceof ConflictError) {
      return { success: false, error: err.message, conflicts: err.conflicts };
    }
    throw err;
  }
}

export async function cancelBooking(id: string): Promise<ActionResult<{ id: string }>> {
  await prisma.booking.update({ where: { id }, data: { status: "CANCELLED" } });
  revalidatePath("/");
  revalidatePath(`/bookings/${id}`);
  return { success: true, data: { id } };
}

/** Live, advisory-only conflict check used while staff are still editing the form. */
export async function checkConflicts(
  draft: BookingLike,
  excludeBookingId?: string,
): Promise<ConflictDetail[]> {
  return findConflicts(draft, excludeBookingId);
}
