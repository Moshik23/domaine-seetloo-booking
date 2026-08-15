import { describe, it, expect } from "vitest";
import { getHolidayNamesForDate } from "@/lib/publicHolidays";

describe("getHolidayNamesForDate", () => {
  it("returns a single holiday name for a normal date", () => {
    expect(getHolidayNamesForDate("2026-01-01")).toEqual(["New Year's Day"]);
  });

  it("returns multiple names when two holidays share a date", () => {
    expect(getHolidayNamesForDate("2026-02-01")).toEqual(["Abolition of Slavery", "Thaipoosam Cavadee"]);
  });

  it("returns an empty array for a non-holiday date", () => {
    expect(getHolidayNamesForDate("2026-06-15")).toEqual([]);
  });

  it("returns a fixed-date holiday for a year with no lunar data yet", () => {
    expect(getHolidayNamesForDate("2027-01-01")).toEqual(["New Year's Day"]);
  });

  it("returns an empty array for a lunar holiday's date in a year with no data yet", () => {
    expect(getHolidayNamesForDate("2027-02-15")).toEqual([]);
  });

  it("recognizes fixed-date holidays in past and future years alike", () => {
    expect(getHolidayNamesForDate("2025-12-25")).toEqual(["Christmas Day"]);
    expect(getHolidayNamesForDate("2030-03-12")).toEqual(["Independence & Republic Day"]);
  });
});
