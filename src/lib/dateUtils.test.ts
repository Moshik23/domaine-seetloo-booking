import { describe, it, expect } from "vitest";
import { getCurrentAndNextMonthRange, groupConsecutiveDates, mergeDateRanges, formatDateRangeDisplay } from "@/lib/dateUtils";

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

describe("groupConsecutiveDates", () => {
  it("collapses a run of consecutive dates into a single range", () => {
    expect(groupConsecutiveDates(["2026-05-01", "2026-05-02", "2026-05-03"])).toEqual([
      { start: "2026-05-01", end: "2026-05-03" },
    ]);
  });

  it("keeps non-consecutive dates as separate ranges", () => {
    expect(groupConsecutiveDates(["2026-05-01", "2026-05-05"])).toEqual([
      { start: "2026-05-01", end: "2026-05-01" },
      { start: "2026-05-05", end: "2026-05-05" },
    ]);
  });

  it("sorts unordered input and dedupes before grouping", () => {
    expect(groupConsecutiveDates(["2026-05-03", "2026-05-01", "2026-05-02", "2026-05-02"])).toEqual([
      { start: "2026-05-01", end: "2026-05-03" },
    ]);
  });

  it("returns an empty array for no dates", () => {
    expect(groupConsecutiveDates([])).toEqual([]);
  });
});

describe("mergeDateRanges", () => {
  it("keeps a single range unchanged", () => {
    expect(mergeDateRanges([{ start: "2026-05-01", end: "2026-05-04" }])).toEqual([
      { start: "2026-05-01", end: "2026-05-04" },
    ]);
  });

  it("does not let a wide range disappear between two point-ranges it fully spans", () => {
    // This is the exact bug that motivated mergeDateRanges over groupConsecutiveDates: a
    // 4-day block (May 1-4) plus two single-day blocks landing inside it (May 2, May 4)
    // must all collapse into one May 1-4 range, not fragment around the wide one.
    expect(
      mergeDateRanges([
        { start: "2026-05-01", end: "2026-05-04" },
        { start: "2026-05-02", end: "2026-05-02" },
        { start: "2026-05-04", end: "2026-05-04" },
      ]),
    ).toEqual([{ start: "2026-05-01", end: "2026-05-04" }]);
  });

  it("merges adjacent (touching) ranges", () => {
    expect(
      mergeDateRanges([
        { start: "2026-05-01", end: "2026-05-02" },
        { start: "2026-05-03", end: "2026-05-04" },
      ]),
    ).toEqual([{ start: "2026-05-01", end: "2026-05-04" }]);
  });

  it("keeps genuinely separate ranges apart", () => {
    expect(
      mergeDateRanges([
        { start: "2026-05-01", end: "2026-05-01" },
        { start: "2026-05-05", end: "2026-05-05" },
      ]),
    ).toEqual([
      { start: "2026-05-01", end: "2026-05-01" },
      { start: "2026-05-05", end: "2026-05-05" },
    ]);
  });

  it("sorts unordered input before merging", () => {
    expect(
      mergeDateRanges([
        { start: "2026-05-04", end: "2026-05-04" },
        { start: "2026-05-01", end: "2026-05-02" },
      ]),
    ).toEqual([{ start: "2026-05-01", end: "2026-05-02" }, { start: "2026-05-04", end: "2026-05-04" }]);
  });

  it("returns an empty array for no ranges", () => {
    expect(mergeDateRanges([])).toEqual([]);
  });
});

describe("formatDateRangeDisplay", () => {
  it("formats a single-day range as one date", () => {
    expect(formatDateRangeDisplay("2026-05-01", "2026-05-01")).toBe("01/05/2026");
  });

  it("formats a multi-day range with an en dash", () => {
    expect(formatDateRangeDisplay("2026-05-01", "2026-05-04")).toBe("01/05/2026 – 04/05/2026");
  });
});
