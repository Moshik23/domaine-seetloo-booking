export interface InauspiciousPeriod {
  startDate: string; // "YYYY-MM-DD", inclusive
  endDate: string; // "YYYY-MM-DD", inclusive
  name: string;
  note: string;
}

/**
 * Periods traditionally considered inauspicious for Hindu weddings and other
 * "shubh karya" (auspicious ceremonies) — Holashtak, Kharmas, Adhik Maas, Chaturmas,
 * and Pitru Paksha. This is advisory information only (shown to staff during booking,
 * never blocks a booking) — plenty of families book anyway, this is just so staff can
 * give clients a heads-up.
 *
 * IMPORTANT — like public holidays, this list cannot be computed and must be updated
 * by hand every year. Unlike public holidays, none of these repeat on a fixed Gregorian
 * date at all — Kharmas follows the Sun's solar transit into Sagittarius/Pisces (shifts
 * by about a day year to year), while Holashtak, Adhik Maas, Chaturmas, and Pitru Paksha
 * follow the lunar Hindu Panchang and can shift by weeks. Adhik Maas (an inserted leap
 * month) doesn't even occur every year — it recurs roughly every 32-33 months.
 *
 * Dates below were cross-checked against multiple vivah-muhurat/Panchang sources in
 * August 2026 (see PR/commit history) and cover mid-2026 through mid-January 2027.
 * Reconfirm against a current Hindu Panchang / vivah muhurat calendar each year rather
 * than assuming these patterns repeat — see the Help page for how to update this list.
 */
const INAUSPICIOUS_PERIODS: InauspiciousPeriod[] = [
  {
    startDate: "2026-02-24",
    endDate: "2026-03-03",
    name: "Holashtak",
    note: "the eight days before Holi, avoided for weddings in North Indian tradition",
  },
  {
    startDate: "2026-03-14",
    endDate: "2026-04-13",
    name: "Kharmas (Sun in Pisces)",
    note: "the Sun transits Meen/Pisces, considered inauspicious for weddings",
  },
  {
    startDate: "2026-05-17",
    endDate: "2026-06-15",
    name: "Adhik Maas (Purushottam Maas)",
    note: "an extra lunar month inserted this year; auspicious for spiritual acts, but weddings are avoided",
  },
  {
    startDate: "2026-07-25",
    endDate: "2026-11-21",
    name: "Chaturmas",
    note: "Lord Vishnu's four months of cosmic sleep, the traditional Hindu wedding-season pause",
  },
  {
    startDate: "2026-09-26",
    endDate: "2026-10-10",
    name: "Pitru Paksha (Shraadh)",
    note: "the 16-day period honouring ancestors; weddings are avoided even by families who don't otherwise observe Chaturmas",
  },
  {
    startDate: "2026-12-16",
    endDate: "2027-01-14",
    name: "Kharmas (Sun in Sagittarius)",
    note: "the Sun transits Dhanu/Sagittarius, considered inauspicious for weddings",
  },
];

/** Returns any inauspicious period(s) covering this "YYYY-MM-DD" date (usually 0 or 1, occasionally 2 when Pitru Paksha overlaps Chaturmas). */
export function getInauspiciousPeriodsForDate(date: string): InauspiciousPeriod[] {
  return INAUSPICIOUS_PERIODS.filter((p) => date >= p.startDate && date <= p.endDate);
}
