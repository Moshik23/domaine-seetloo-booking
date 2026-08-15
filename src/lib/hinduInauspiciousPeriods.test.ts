import { describe, it, expect } from "vitest";
import { getInauspiciousPeriodsForDate } from "@/lib/hinduInauspiciousPeriods";

describe("getInauspiciousPeriodsForDate", () => {
  it("returns a single period for a date inside Holashtak", () => {
    expect(getInauspiciousPeriodsForDate("2026-02-26").map((p) => p.name)).toEqual(["Holashtak"]);
  });

  it("returns both periods for a date where Pitru Paksha overlaps Chaturmas", () => {
    expect(getInauspiciousPeriodsForDate("2026-10-01").map((p) => p.name)).toEqual([
      "Chaturmas",
      "Pitru Paksha (Shraadh)",
    ]);
  });

  it("returns an empty array for an unaffected date", () => {
    expect(getInauspiciousPeriodsForDate("2026-06-30")).toEqual([]);
  });

  it("includes the boundary dates of a period", () => {
    expect(getInauspiciousPeriodsForDate("2026-07-25").map((p) => p.name)).toEqual(["Chaturmas"]);
    expect(getInauspiciousPeriodsForDate("2026-11-21").map((p) => p.name)).toEqual(["Chaturmas"]);
  });

  it("handles a period that spans a year boundary", () => {
    expect(getInauspiciousPeriodsForDate("2026-12-31").map((p) => p.name)).toEqual([
      "Kharmas (Sun in Sagittarius)",
    ]);
    expect(getInauspiciousPeriodsForDate("2027-01-14").map((p) => p.name)).toEqual([
      "Kharmas (Sun in Sagittarius)",
    ]);
  });
});
