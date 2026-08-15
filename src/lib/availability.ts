import type { Venue } from "@/generated/prisma/enums";
import { buildOccupancyBlocks, type BookingLike } from "@/lib/conflicts";
import { eachDateInRange } from "@/lib/dateUtils";

export interface DayOccupant {
  bookingId: string;
  surname: string;
  otherNames: string;
  label: string; // e.g. "Stay window" or "Haldi"
  start: string; // "YYYY-MM-DDTHH:mm"
  end: string;
}

export interface DayOccupancy {
  HALL: DayOccupant[];
  CHALET: DayOccupant[];
}

interface BookingWithName extends BookingLike {
  id: string;
  otherNames: string;
}

/**
 * Flattens every booking's occupancy blocks (stay window + event lines, same
 * definition the conflict engine uses) into a day -> venue -> occupants map,
 * so the availability calendar always agrees with what the conflict checker
 * would flag. Callers should pass only CONFIRMED bookings.
 */
export function buildDayOccupancyMap(bookings: BookingWithName[]): Record<string, DayOccupancy> {
  const map: Record<string, DayOccupancy> = {};

  for (const booking of bookings) {
    for (const block of buildOccupancyBlocks(booking)) {
      const startDate = block.start.split("T")[0];
      const endDate = block.end.split("T")[0];
      const venues: Exclude<Venue, "BOTH">[] = block.venue === "BOTH" ? ["HALL", "CHALET"] : [block.venue];

      for (const date of eachDateInRange(startDate, endDate)) {
        if (!map[date]) map[date] = { HALL: [], CHALET: [] };
        for (const v of venues) {
          map[date][v].push({
            bookingId: booking.id,
            surname: booking.surname,
            otherNames: booking.otherNames,
            label: block.label,
            start: block.start,
            end: block.end,
          });
        }
      }
    }
  }

  return map;
}
