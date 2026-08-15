import {
  BUSINESS_NAME,
  BUSINESS_TAGLINE,
  HALL_ONLY_TERMS,
  CHALET_ONLY_TERMS,
  BOTH_VENUES_TERMS,
  VENUE_LABELS,
  BUILDER_CREDIT,
} from "@/lib/constants";
import { formatDateDisplay, formatTimeDisplay } from "@/lib/dateUtils";
import type { BookingDetailData } from "@/components/booking-form/BookingDetailClient";
import type { Venue } from "@/generated/prisma/enums";

function expandVenues(venues: Venue[]): Set<"HALL" | "CHALET"> {
  const set = new Set<"HALL" | "CHALET">();
  for (const v of venues) {
    if (v === "BOTH") {
      set.add("HALL");
      set.add("CHALET");
    } else {
      set.add(v);
    }
  }
  return set;
}

export function PrintableBookingForm({ booking }: { booking: BookingDetailData }) {
  const allVenues = expandVenues([booking.occupancyVenue, ...booking.events.map((e) => e.venue)]);
  const hallOnly = allVenues.has("HALL") && !allVenues.has("CHALET");
  const chaletOnly = allVenues.has("CHALET") && !allVenues.has("HALL");
  const terms = hallOnly ? HALL_ONLY_TERMS : chaletOnly ? CHALET_ONLY_TERMS : BOTH_VENUES_TERMS;

  const outstanding =
    booking.agreedPrice - booking.deposit - booking.payments.reduce((s, p) => s + p.amount, 0);

  return (
    <div className="mx-auto max-w-2xl bg-white p-6 text-sm text-black print:p-0">
      <header className="mb-4 border-b-2 border-black pb-2 text-center">
        <h1 className="text-lg font-bold tracking-wide">{BUSINESS_NAME}</h1>
        <p className="text-xs">Arrangement for Booking of Hall, Décor and sound System</p>
      </header>

      {hallOnly && (
        <p className="mb-2 text-center text-sm font-bold uppercase">Client has booked Hall Only</p>
      )}
      {chaletOnly && (
        <p className="mb-2 text-center text-sm font-bold uppercase">Client booked Chalet Only</p>
      )}

      <table className="mb-4 w-full border-collapse border border-black print-avoid-break">
        <tbody>
          <Row label="Date">{formatDateDisplay(booking.formDate)}</Row>
          <Row label="Surname">{booking.surname}</Row>
          <Row label="Other Names">{booking.otherNames}</Row>
          <Row label="Telephone number">{[booking.phone1, booking.phone2].filter(Boolean).join(" / ")}</Row>
          <Row label="Address">{booking.address || "—"}</Row>
          {booking.events.map((e, i) => (
            <Row key={i} label={`${e.label} in ${VENUE_LABELS[e.venue]}`}>
              {formatDateDisplay(e.date)} @ {formatTimeDisplay(e.startTime)}
              {e.endTime ? ` to ${formatTimeDisplay(e.endTime)}` : ""}
            </Row>
          ))}
          <Row label="Date In / Check In">
            {formatDateDisplay(booking.dateIn)}
            {booking.timeIn ? ` @ ${formatTimeDisplay(booking.timeIn)}` : ""}
          </Row>
          <Row label="Date Out / Check Out">
            {formatDateDisplay(booking.dateOut)}
            {booking.timeOut ? ` @ ${formatTimeDisplay(booking.timeOut)}` : ""}
          </Row>
          <Row label="Agreed Price">Rs {booking.agreedPrice.toLocaleString()}</Row>
          <Row label="Deposit (non-refundable)">Rs {booking.deposit.toLocaleString()}</Row>
          <Row label="Outstanding payment">Rs {Math.max(outstanding, 0).toLocaleString()}</Row>
          <Row label="Booked By">{booking.bookedByStaffName}</Row>
        </tbody>
      </table>

      <div className="mb-4 space-y-1 text-xs">
        {terms.map((t, i) => (
          <p key={i}>{t}</p>
        ))}
        {booking.notes && <p className="italic">{booking.notes}</p>}
      </div>

      <div className="mt-14 grid grid-cols-2 gap-8 text-sm print-avoid-break">
        <div>
          <p>Signature: _____________________</p>
          <p className="mt-1">Client Name: {booking.surname} {booking.otherNames}</p>
        </div>
        <div>
          <p>Signature: _____________________</p>
          <p className="mt-1">Domaine Seetloo: {booking.bookedByStaffName}</p>
        </div>
      </div>

      <footer className="mt-8 text-center text-xs text-neutral-500">
        <p>{BUSINESS_NAME}</p>
        <p>{BUSINESS_TAGLINE}</p>
        <p className="mt-2 text-[10px] text-neutral-400">{BUILDER_CREDIT}</p>
      </footer>
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <tr className="border border-black">
      <td className="w-2/5 border border-black px-2 py-1 align-top font-medium">{label}</td>
      <td className="border border-black px-2 py-1 align-top">{children}</td>
    </tr>
  );
}
