import { describe, it, expect } from "vitest";
import { getCurrentAndNextMonthRange } from "@/lib/dateUtils";

describe("getCurrentAndNextMonthRange", () => {
  it("spans from the 1st of this month to the last day of next month", () => {
    expect(getCurrentAndNextMonthRange("2026-08-15")).toEqual({ start: "2026-08-01", end: "2026-09-30" });
  });

  it("handles a December start correctly rolling into next year", () => {
    expect(getCurrentAndNextMonthRange("2026-12-05")).toEqual({ start: "2026-12-01", end: "2027-01-31" });
  });

  it("handles a leap-February next month", () => {
    expect(getCurrentAndNextMonthRange("2028-01-10")).toEqual({ start: "2028-01-01", end: "2028-02-29" });
  });
});
