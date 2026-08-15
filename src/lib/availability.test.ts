import { describe, it, expect } from "vitest";
import { buildDayOccupancyMap } from "@/lib/availability";
import type { EventLike } from "@/lib/conflicts";
import type { Venue } from "@/generated/prisma/enums";

interface TestBooking {
  id: string;
  surname: string;
  otherNames: string;
  dateIn: string;
  timeIn: string | null;
  dateOut: string;
  timeOut: string | null;
  occupancyVenue: Venue;
  events: EventLike[];
}

function booking(overrides: Partial<TestBooking> & { id: string; surname: string }): TestBooking {
  return {
    otherNames: "",
    dateIn: "2000-01-01",
    timeIn: null,
    dateOut: "2000-01-01",
    timeOut: "00:00",
    occupancyVenue: "HALL",
    events: [],
    ...overrides,
  };
}

describe("buildDayOccupancyMap", () => {
  it("marks every day of a multi-day stay window as occupied for its venue", () => {
    const map = buildDayOccupancyMap([
      booking({ id: "b1", surname: "Curpen", dateIn: "2026-01-23", dateOut: "2026-01-25", occupancyVenue: "BOTH" }),
    ]);

    expect(map["2026-01-23"].HALL).toHaveLength(1);
    expect(map["2026-01-23"].CHALET).toHaveLength(1);
    expect(map["2026-01-24"].HALL).toHaveLength(1);
    expect(map["2026-01-25"].CHALET).toHaveLength(1);
    expect(map["2026-01-26"]).toBeUndefined();
  });

  it("marks only the specific date for a single-day event", () => {
    const map = buildDayOccupancyMap([
      booking({
        id: "b1",
        surname: "Woozageer",
        dateIn: "2026-02-06",
        dateOut: "2026-02-06",
        occupancyVenue: "CHALET",
        events: [{ label: "Birthday Party", venue: "CHALET", date: "2026-02-06", startTime: "18:00", endTime: "22:00" }],
      }),
    ]);

    // The stay window and the event block both land on 2026-02-06, so 2 occupants.
    expect(map["2026-02-06"].CHALET).toHaveLength(2);
    const chaletLabels = map["2026-02-06"].CHALET.map((o) => o.label);
    expect(chaletLabels).toContain("Stay window (Check In–Check Out)");
    expect(chaletLabels).toContain("Birthday Party");
  });

  it("expands BOTH into HALL and CHALET independently", () => {
    const map = buildDayOccupancyMap([
      booking({
        id: "b1",
        surname: "Curpen",
        events: [{ label: "Wedding", venue: "BOTH", date: "2026-05-02", startTime: "12:00", endTime: "15:00" }],
      }),
    ]);

    expect(map["2026-05-02"].HALL.some((o) => o.label === "Wedding")).toBe(true);
    expect(map["2026-05-02"].CHALET.some((o) => o.label === "Wedding")).toBe(true);
  });

  it("returns an empty map for no bookings, and callers control cancelled-exclusion by filtering input", () => {
    expect(buildDayOccupancyMap([])).toEqual({});
  });
});
