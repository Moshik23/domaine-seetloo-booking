import { z } from "zod";
import { DEFAULT_STAFF_NAME } from "@/lib/constants";

const dateStr = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD");
const timeStr = z.string().regex(/^\d{2}:\d{2}$/, "Use HH:mm");
const venueEnum = z.enum(["HALL", "CHALET", "BOTH"]);

export const bookingEventSchema = z.object({
  label: z.string().trim().min(1, "Event name is required"),
  venue: venueEnum,
  date: dateStr,
  startTime: timeStr,
  endTime: timeStr.nullable(),
});

export const bookingInputSchema = z.object({
  formDate: dateStr.nullable().optional(),
  surname: z.string().trim().min(1, "Surname is required"),
  otherNames: z.string().trim().min(1, "Other names are required"),
  phone1: z.string().trim().min(1, "At least one phone number is required"),
  phone2: z.string().trim().nullable().optional(),
  address: z.string().trim().nullable().optional(),
  dateIn: dateStr,
  timeIn: timeStr.nullable().optional(),
  dateOut: dateStr,
  timeOut: timeStr.nullable().optional(),
  occupancyVenue: venueEnum,
  agreedPrice: z.coerce.number().int().nonnegative(),
  deposit: z.coerce.number().int().nonnegative(),
  bookedByStaffName: z.string().trim().min(1).default(DEFAULT_STAFF_NAME),
  notes: z.string().trim().nullable().optional(),
  events: z.array(bookingEventSchema).min(1, "Add at least one event"),
});

export type BookingEventInput = z.infer<typeof bookingEventSchema>;
export type BookingInput = z.infer<typeof bookingInputSchema>;

export const paymentInputSchema = z.object({
  bookingId: z.string().min(1),
  amount: z.coerce.number().int().positive("Amount must be greater than 0"),
  date: dateStr,
  note: z.string().trim().nullable().optional(),
});

export type PaymentInput = z.infer<typeof paymentInputSchema>;
