import type { Venue } from "@/generated/prisma/enums";

export const VENUE_LABELS: Record<Venue, string> = {
  HALL: "Hall",
  CHALET: "Chalet",
  BOTH: "Hall & Chalet",
};

/** Common event names seen on the paper forms. Staff can still type a custom label. */
export const EVENT_PRESETS = [
  "Geet Gawai",
  "Teeluck",
  "Haldi",
  "Barrat",
  "Wedding",
  "Reception",
  "Birthday Party",
] as const;

export const DEFAULT_STAFF_NAME = "Ramdeo Seetloo";

export const BUSINESS_NAME = "DOMAINE SEETLOO";
export const BUSINESS_TAGLINE = "Your Wedding Palace. Meeting your Expectation.";

/**
 * Printed terms are deliberately NOT standardised across venues — each paper form
 * template has its own exact wording/set, and Hall-only, Chalet-only, and Hall & Chalet
 * bookings each print only their own list, matching the original paper forms exactly.
 */
export const HALL_ONLY_TERMS = [
  "Please note that no events is allowed in houses which is provided to client to stay.",
  "Aircon will be switched on, only during events.",
  "Full payment should be made one week before the events start.",
  "Amount deposited will not be refunded in case of cancellation is made.",
];

export const CHALET_ONLY_TERMS = [
  "Please note that no events is allowed in houses which is provided to client to stay.",
  "Aircon will be switched on, only during events.",
  "Full payment should be made one week before the events start.",
  "Amount deposited will not be refunded in case of cancellation is made.",
  "NO MUSIC, NO Animation, No Karaoke is allowed in Chalet and Parking.",
];

export const BOTH_VENUES_TERMS = [
  "Aircon will be switched on, only during events.",
  "Full payment should be made one week before the events start.",
  "Amount deposited will not be refunded in case of cancellation is made.",
];

export const BUILDER_CREDIT = "Booking portal built by M. Seetloo";
