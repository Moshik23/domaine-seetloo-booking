"use client";

import { VENUE_LABELS } from "@/lib/constants";
import { formatDateDisplay, formatTimeDisplay } from "@/lib/dateUtils";
import type { Venue, BookingStatus } from "@/generated/prisma/enums";

export interface ExportableBooking {
  surname: string;
  otherNames: string;
  phone1: string;
  phone2: string | null;
  address: string | null;
  occupancyVenue: Venue;
  dateIn: string;
  timeIn: string | null;
  dateOut: string;
  timeOut: string | null;
  agreedPrice: number;
  deposit: number;
  outstanding: number;
  status: BookingStatus;
  bookedByStaffName: string;
}

function escapeCsvField(value: string | number): string {
  const str = String(value);
  return /[",\r\n]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str;
}

function toCsv(rows: ExportableBooking[]): string {
  const headers = [
    "Surname", "Other Names", "Phone 1", "Phone 2", "Address", "Venue",
    "Date In", "Check In", "Date Out", "Check Out", "Agreed Price (Rs)", "Deposit (Rs)",
    "Outstanding (Rs)", "Status", "Booked By",
  ];
  const lines = [headers.map(escapeCsvField).join(",")];

  for (const b of rows) {
    lines.push(
      [
        b.surname,
        b.otherNames,
        b.phone1,
        b.phone2 ?? "",
        b.address ?? "",
        VENUE_LABELS[b.occupancyVenue],
        formatDateDisplay(b.dateIn),
        b.timeIn ? formatTimeDisplay(b.timeIn) : "",
        formatDateDisplay(b.dateOut),
        b.timeOut ? formatTimeDisplay(b.timeOut) : "",
        b.agreedPrice,
        b.deposit,
        b.status === "CANCELLED" ? "" : b.outstanding,
        b.status === "CANCELLED" ? "Cancelled" : "Confirmed",
        b.bookedByStaffName,
      ]
        .map(escapeCsvField)
        .join(","),
    );
  }

  return lines.join("\r\n");
}

export function ExportCsvButton({ bookings, filename }: { bookings: ExportableBooking[]; filename: string }) {
  function handleExport() {
    const csv = toCsv(bookings);
    // Leading BOM so Excel recognizes UTF-8 (accented names etc.) instead of mis-decoding.
    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  return (
    <button
      type="button"
      onClick={handleExport}
      disabled={bookings.length === 0}
      className="rounded-md border border-neutral-300 px-3 py-2 text-sm font-medium hover:bg-neutral-50 disabled:opacity-50 dark:border-neutral-700 dark:text-neutral-200 dark:hover:bg-neutral-800"
    >
      Export to Excel (CSV)
    </button>
  );
}
