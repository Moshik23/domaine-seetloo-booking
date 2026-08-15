import type { Venue } from "@/generated/prisma/enums";
import type { prisma as PrismaSingleton } from "@/lib/prisma";
import { addOneDay, combine } from "@/lib/dateUtils";

/** Anything shaped like the Prisma client (or an interactive $transaction callback client). */
type ConflictQueryClient = Pick<typeof PrismaSingleton, "booking">;

export interface EventLike {
  label: string;
  venue: Venue;
  date: string; // "YYYY-MM-DD"
  startTime: string; // "HH:mm"
  endTime: string | null; // null = informational marker only, not an occupancy block
}

export interface BookingLike {
  id?: string;
  surname: string;
  otherNames?: string;
  dateIn: string; // "YYYY-MM-DD"
  timeIn: string | null; // Check In time
  dateOut: string; // "YYYY-MM-DD"
  timeOut: string | null; // Check Out time
  occupancyVenue: Venue;
  events: EventLike[];
}

export interface OccupancyBlock {
  label: string;
  venue: Venue;
  start: string; // "YYYY-MM-DDTHH:mm", sortable
  end: string; // "YYYY-MM-DDTHH:mm", sortable
}

export interface ConflictDetail {
  yourBlockLabel: string;
  otherBookingId: string;
  otherSurname: string;
  otherOtherNames: string;
  otherBlockLabel: string;
  otherVenue: Venue;
  otherRange: [string, string];
}

/**
 * Flattens a booking into occupancy blocks: one for the overall stay window
 * (Check In - Check Out), plus one per event line that has an end time. Event
 * lines without an end time (e.g. "Barrat will leave Hall @ 1pm") are
 * informational markers on the paper form, not occupancy blocks.
 */
export function buildOccupancyBlocks(booking: BookingLike): OccupancyBlock[] {
  const blocks: OccupancyBlock[] = [
    {
      label: "Stay window (Check In–Check Out)",
      venue: booking.occupancyVenue,
      start: combine(booking.dateIn, booking.timeIn ?? "00:00"),
      end: combine(booking.dateOut, booking.timeOut ?? "23:59"),
    },
  ];

  for (const event of booking.events) {
    if (!event.endTime) continue;

    const endDate = event.endTime < event.startTime ? addOneDay(event.date) : event.date;

    blocks.push({
      label: event.label,
      venue: event.venue,
      start: combine(event.date, event.startTime),
      end: combine(endDate, event.endTime),
    });
  }

  return blocks;
}

export function venueOverlaps(a: Venue, b: Venue): boolean {
  return a === b || a === "BOTH" || b === "BOTH";
}

/** Half-open interval overlap: back-to-back blocks (end === start) do not conflict. */
export function timeOverlaps(a: OccupancyBlock, b: OccupancyBlock): boolean {
  return a.start < b.end && b.start < a.end;
}

/**
 * Pure comparison: given a candidate booking and a list of other bookings (already
 * fetched), returns every conflicting block pair. No I/O, fully unit-testable.
 */
export function findConflictsAmong(
  candidate: BookingLike,
  others: BookingLike[],
): ConflictDetail[] {
  const candidateBlocks = buildOccupancyBlocks(candidate);
  const conflicts: ConflictDetail[] = [];

  for (const other of others) {
    if (other.id !== undefined && candidate.id !== undefined && other.id === candidate.id) {
      continue;
    }

    const otherBlocks = buildOccupancyBlocks(other);

    for (const cb of candidateBlocks) {
      for (const ob of otherBlocks) {
        if (venueOverlaps(cb.venue, ob.venue) && timeOverlaps(cb, ob)) {
          conflicts.push({
            yourBlockLabel: cb.label,
            otherBookingId: other.id ?? "",
            otherSurname: other.surname,
            otherOtherNames: other.otherNames ?? "",
            otherBlockLabel: ob.label,
            otherVenue: ob.venue,
            otherRange: [ob.start, ob.end],
          });
        }
      }
    }
  }

  return conflicts;
}

/**
 * Authoritative conflict check against the database: fetches every CONFIRMED
 * booking (excluding the one being edited, if any) and compares against it.
 * A full scan is intentional — a single-venue business does at most a few
 * hundred bookings/year, trivial to compare in JS.
 *
 * Accepts an optional `client` so callers can pass an interactive `$transaction`
 * client (making the check-then-write atomic); defaults to lazily importing the
 * app-wide singleton so this module has no top-level DB side effect, keeping the
 * pure functions above importable/testable without a database.
 */
export async function findConflicts(
  candidate: BookingLike,
  excludeBookingId?: string,
  client?: ConflictQueryClient,
): Promise<ConflictDetail[]> {
  const db = client ?? (await import("@/lib/prisma")).prisma;

  const others = await db.booking.findMany({
    where: {
      status: "CONFIRMED",
      ...(excludeBookingId ? { id: { not: excludeBookingId } } : {}),
    },
    include: { events: true },
  });

  return findConflictsAmong(candidate, others);
}
