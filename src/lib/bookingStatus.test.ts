import { describe, it, expect } from "vitest";
import { classifyBooking } from "@/lib/bookingStatus";

describe("classifyBooking", () => {
  it("is CANCELLED regardless of dates when status is CANCELLED", () => {
    expect(classifyBooking({ status: "CANCELLED", dateOut: "2020-01-01" }, "2026-08-15")).toBe("CANCELLED");
    expect(classifyBooking({ status: "CANCELLED", dateOut: "2030-01-01" }, "2026-08-15")).toBe("CANCELLED");
  });

  it("is COMPLETED when confirmed and dateOut is before today", () => {
    expect(classifyBooking({ status: "CONFIRMED", dateOut: "2026-08-14" }, "2026-08-15")).toBe("COMPLETED");
  });

  it("is ONGOING when confirmed and dateOut is today or in the future", () => {
    expect(classifyBooking({ status: "CONFIRMED", dateOut: "2026-08-15" }, "2026-08-15")).toBe("ONGOING");
    expect(classifyBooking({ status: "CONFIRMED", dateOut: "2026-09-01" }, "2026-08-15")).toBe("ONGOING");
  });
});
