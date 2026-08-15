import { describe, it, expect } from "vitest";
import {
  buildOccupancyBlocks,
  venueOverlaps,
  timeOverlaps,
  findConflictsAmong,
  findConflicts,
  type BookingLike,
} from "@/lib/conflicts";

// Default stay window is zero-width (dateIn === dateOut, timeOut "00:00"), which the
// half-open interval check in timeOverlaps always treats as non-overlapping — even against
// another booking using the same default. This keeps the default a true no-op so tests that
// aren't about the stay window itself don't pick up a spurious "Stay window" conflict; tests
// that specifically want to exercise the stay-window block override dateIn/dateOut/timeOut.
function booking(overrides: Partial<BookingLike> & Pick<BookingLike, "surname">): BookingLike {
  return {
    dateIn: "2000-01-01",
    timeIn: null,
    dateOut: "2000-01-01",
    timeOut: "00:00",
    occupancyVenue: "HALL",
    events: [],
    ...overrides,
  };
}

describe("venueOverlaps", () => {
  it("returns true for identical venues", () => {
    expect(venueOverlaps("HALL", "HALL")).toBe(true);
    expect(venueOverlaps("CHALET", "CHALET")).toBe(true);
  });

  it("returns false for different single venues", () => {
    expect(venueOverlaps("HALL", "CHALET")).toBe(false);
  });

  it("returns true whenever BOTH is involved", () => {
    expect(venueOverlaps("BOTH", "HALL")).toBe(true);
    expect(venueOverlaps("HALL", "BOTH")).toBe(true);
    expect(venueOverlaps("BOTH", "CHALET")).toBe(true);
    expect(venueOverlaps("BOTH", "BOTH")).toBe(true);
  });
});

describe("timeOverlaps", () => {
  it("detects an overlap when ranges intersect", () => {
    const a = { label: "a", venue: "HALL" as const, start: "2026-05-01T18:00", end: "2026-05-01T23:00" };
    const b = { label: "b", venue: "HALL" as const, start: "2026-05-01T20:00", end: "2026-05-01T22:00" };
    expect(timeOverlaps(a, b)).toBe(true);
  });

  it("does not treat back-to-back ranges (end === start) as a conflict", () => {
    const a = { label: "a", venue: "HALL" as const, start: "2026-05-01T13:00", end: "2026-05-01T18:00" };
    const b = { label: "b", venue: "HALL" as const, start: "2026-05-01T18:00", end: "2026-05-01T23:00" };
    expect(timeOverlaps(a, b)).toBe(false);
  });

  it("does not treat fully separate ranges as a conflict", () => {
    const a = { label: "a", venue: "HALL" as const, start: "2026-05-01T09:00", end: "2026-05-01T11:00" };
    const b = { label: "b", venue: "HALL" as const, start: "2026-05-01T18:00", end: "2026-05-01T23:00" };
    expect(timeOverlaps(a, b)).toBe(false);
  });
});

describe("buildOccupancyBlocks", () => {
  it("includes a stay-window block plus one block per event with an end time", () => {
    const b = booking({
      surname: "Test",
      dateIn: "2026-05-01",
      dateOut: "2026-05-02",
      timeOut: "22:00",
      events: [
        { label: "Reception", venue: "HALL", date: "2026-05-01", startTime: "18:00", endTime: "22:00" },
        { label: "Barrat will leave", venue: "HALL", date: "2026-05-02", startTime: "13:00", endTime: null },
      ],
    });

    const blocks = buildOccupancyBlocks(b);

    expect(blocks).toHaveLength(2); // stay window + Reception; the open-ended Barrat line is skipped
    expect(blocks[0]).toMatchObject({ start: "2026-05-01T00:00", end: "2026-05-02T22:00" });
    expect(blocks[1]).toMatchObject({
      label: "Reception",
      start: "2026-05-01T18:00",
      end: "2026-05-01T22:00",
    });
  });

  it("rolls the end date forward for events that cross midnight", () => {
    const b = booking({
      surname: "Test",
      events: [
        { label: "Late Reception", venue: "HALL", date: "2026-05-01", startTime: "22:00", endTime: "01:00" },
      ],
    });

    const blocks = buildOccupancyBlocks(b);
    const eventBlock = blocks.find((x) => x.label === "Late Reception")!;

    expect(eventBlock.start).toBe("2026-05-01T22:00");
    expect(eventBlock.end).toBe("2026-05-02T01:00");
  });
});

describe("findConflictsAmong", () => {
  it("flags overlapping events on the same venue", () => {
    const existing = booking({
      surname: "Mannick",
      events: [{ label: "Haldi", venue: "HALL", date: "2026-05-02", startTime: "18:00", endTime: "23:00" }],
    });
    const candidate = booking({
      surname: "NewClient",
      events: [{ label: "Reception", venue: "HALL", date: "2026-05-02", startTime: "19:00", endTime: "22:00" }],
    });

    const conflicts = findConflictsAmong(candidate, [existing]);
    expect(conflicts).toHaveLength(1);
    expect(conflicts[0].otherSurname).toBe("Mannick");
  });

  it("does not flag non-overlapping events on the same date/venue", () => {
    // dateIn/dateOut/timeOut are left at the helper's zero-width default so only the
    // event lines below are exercised, isolated from stay-window overlap.
    const existing = booking({
      surname: "Mannick",
      events: [{ label: "Teeluck", venue: "HALL", date: "2026-05-02", startTime: "13:00", endTime: "15:00" }],
    });
    const candidate = booking({
      surname: "NewClient",
      events: [{ label: "Haldi", venue: "HALL", date: "2026-05-02", startTime: "18:00", endTime: "23:00" }],
    });

    const conflicts = findConflictsAmong(candidate, [existing]);
    expect(conflicts).toHaveLength(0);
  });

  it("flags overlap when either side's venue is BOTH", () => {
    const existing = booking({
      surname: "Curpen",
      events: [{ label: "Wedding", venue: "BOTH", date: "2026-05-02", startTime: "12:00", endTime: "15:00" }],
    });
    const candidate = booking({
      surname: "NewClient",
      events: [{ label: "Birthday Party", venue: "CHALET", date: "2026-05-02", startTime: "13:00", endTime: "16:00" }],
    });

    const conflicts = findConflictsAmong(candidate, [existing]);
    expect(conflicts).toHaveLength(1);
  });

  it("does not flag different venues that never involve BOTH", () => {
    const existing = booking({
      surname: "Mannick",
      events: [{ label: "Haldi", venue: "HALL", date: "2026-05-02", startTime: "18:00", endTime: "23:00" }],
    });
    const candidate = booking({
      surname: "Woozageer",
      events: [{ label: "Birthday Party", venue: "CHALET", date: "2026-05-02", startTime: "18:00", endTime: "22:00" }],
    });

    const conflicts = findConflictsAmong(candidate, [existing]);
    expect(conflicts).toHaveLength(0);
  });

  it("flags a conflict from the stay window alone, even with no matching event line", () => {
    // Chalet used purely as overnight lodging (no discrete event) still blocks the venue.
    const existing = booking({
      surname: "Existing",
      dateIn: "2026-06-01",
      dateOut: "2026-06-03",
      timeOut: "10:00",
      occupancyVenue: "CHALET",
      events: [],
    });
    const candidate = booking({
      surname: "NewClient",
      dateIn: "2026-06-02",
      dateOut: "2026-06-02",
      timeOut: "20:00",
      occupancyVenue: "CHALET",
      events: [{ label: "Birthday Party", venue: "CHALET", date: "2026-06-02", startTime: "18:00", endTime: "20:00" }],
    });

    const conflicts = findConflictsAmong(candidate, [existing]);
    expect(conflicts.length).toBeGreaterThan(0);
  });

  it("excludes the booking itself when editing (self-exclusion)", () => {
    const existing = booking({
      surname: "Mannick",
      id: "booking-1",
      events: [{ label: "Haldi", venue: "HALL", date: "2026-05-02", startTime: "18:00", endTime: "23:00" }],
    });
    // Editing the same booking to slightly adjust its own time should not conflict with itself.
    const candidate = booking({
      surname: "Mannick",
      id: "booking-1",
      events: [{ label: "Haldi", venue: "HALL", date: "2026-05-02", startTime: "18:30", endTime: "23:00" }],
    });

    const conflicts = findConflictsAmong(candidate, [existing]);
    expect(conflicts).toHaveLength(0);
  });
});

describe("findConflicts (integration against the seeded dev database)", () => {
  it("excludes cancelled bookings from the conflict check", async () => {
    // prisma/seed.ts seeds a CANCELLED booking (Ramsamy) on Hall, 2026-05-02 18:00-23:00 —
    // the exact same slot as Mannick's confirmed Haldi. A new candidate for that slot
    // should conflict with Mannick (confirmed) but never even mention Ramsamy (cancelled).
    const candidate = booking({
      surname: "IntegrationTestCandidate",
      dateIn: "2026-05-02",
      dateOut: "2026-05-02",
      timeOut: "23:00",
      occupancyVenue: "HALL",
      events: [{ label: "Haldi", venue: "HALL", date: "2026-05-02", startTime: "18:00", endTime: "23:00" }],
    });

    const conflicts = await findConflicts(candidate);

    expect(conflicts.some((c) => c.otherSurname === "Mannick")).toBe(true);
    expect(conflicts.some((c) => c.otherSurname === "Ramsamy")).toBe(false);
  });

  it("excludes the booking being edited via excludeBookingId", async () => {
    const { prisma } = await import("@/lib/prisma");
    const mannick = await prisma.booking.findFirstOrThrow({ where: { surname: "Mannick" } });

    const candidate = booking({
      id: mannick.id,
      surname: "Mannick",
      dateIn: "2026-05-02",
      dateOut: "2026-05-02",
      timeOut: "23:00",
      occupancyVenue: "HALL",
      events: [{ label: "Haldi", venue: "HALL", date: "2026-05-02", startTime: "18:00", endTime: "23:00" }],
    });

    const conflicts = await findConflicts(candidate, mannick.id);
    expect(conflicts).toHaveLength(0);
  });
});
