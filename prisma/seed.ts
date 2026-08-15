import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";

const adapter = new PrismaBetterSqlite3({
  url: process.env.DATABASE_URL ?? "file:./dev.db",
});
const prisma = new PrismaClient({ adapter });

async function main() {
  await prisma.payment.deleteMany();
  await prisma.bookingEvent.deleteMany();
  await prisma.booking.deleteMany();

  // Form 3 (Hall only) — Boodhun Mannick
  await prisma.booking.create({
    data: {
      formDate: "2024-06-02",
      surname: "Mannick",
      otherNames: "Boodhun",
      phone1: "57555387",
      phone2: "57686230",
      address: "Ave Central, Bambous",
      dateIn: "2026-05-01",
      dateOut: "2026-05-04",
      timeOut: "22:00",
      occupancyVenue: "HALL",
      agreedPrice: 180000,
      deposit: 25000,
      bookedByStaffName: "Ramdeo Seetloo",
      notes: "Agreed price includes Rs 10,000 for light.",
      events: {
        create: [
          { label: "Geet Gawai", venue: "HALL", date: "2026-05-01", startTime: "19:00", endTime: "23:00" },
          { label: "Teeluck", venue: "HALL", date: "2026-05-02", startTime: "13:00", endTime: "15:00" },
          { label: "Haldi", venue: "HALL", date: "2026-05-02", startTime: "18:00", endTime: "23:00" },
          { label: "Barrat will leave", venue: "HALL", date: "2026-05-03", startTime: "13:00", endTime: null },
          { label: "Reception", venue: "HALL", date: "2026-05-04", startTime: "18:00", endTime: "22:00" },
        ],
      },
      payments: {
        create: [{ amount: 155000, date: "2026-04-24", note: "Balance paid one week before event" }],
      },
    },
  });

  // Form 2 (Chalet only) — Woozageer Manoj
  await prisma.booking.create({
    data: {
      formDate: "2025-08-04",
      surname: "Woozageer",
      otherNames: "Manoj",
      phone1: "57816441",
      phone2: "55002525",
      dateIn: "2026-02-06",
      dateOut: "2026-02-06",
      timeOut: "22:00",
      occupancyVenue: "CHALET",
      agreedPrice: 15000,
      deposit: 5000,
      bookedByStaffName: "Ramdeo Seetloo",
      events: {
        create: [
          { label: "Birthday Party", venue: "CHALET", date: "2026-02-06", startTime: "18:00", endTime: "22:00" },
        ],
      },
      payments: {
        create: [{ amount: 5000, date: "2026-01-30", note: "Partial payment" }],
      },
    },
  });

  // Form 1 (Hall & Chalet) — Sobha Curpen
  await prisma.booking.create({
    data: {
      formDate: "2025-02-22",
      surname: "Curpen",
      otherNames: "Sobha",
      phone1: "57585417",
      phone2: "57752530",
      address: "Eau Coulee Road, Quatre Bornes",
      dateIn: "2026-01-23",
      dateOut: "2026-01-25",
      timeOut: "23:00",
      occupancyVenue: "BOTH",
      agreedPrice: 150000,
      deposit: 25000,
      bookedByStaffName: "Ramdeo Seetloo",
      events: {
        create: [
          { label: "Geet Gawai", venue: "HALL", date: "2026-01-23", startTime: "19:00", endTime: "23:00" },
          { label: "Teeluck", venue: "BOTH", date: "2026-01-24", startTime: "13:00", endTime: "15:00" },
          { label: "Haldi", venue: "BOTH", date: "2026-01-24", startTime: "18:00", endTime: "23:00" },
          { label: "Wedding", venue: "BOTH", date: "2026-01-25", startTime: "12:00", endTime: "15:00" },
          { label: "Reception", venue: "BOTH", date: "2026-01-25", startTime: "18:00", endTime: "23:00" },
        ],
      },
    },
  });

  // A cancelled booking that WOULD have conflicted with Mannick's Haldi (Hall, 2026-05-02
  // 18:00-23:00) had it stayed confirmed — demonstrates that cancelling a booking frees its
  // slot, which is why Mannick's booking above could be confirmed on the same date/venue.
  await prisma.booking.create({
    data: {
      formDate: "2026-03-01",
      surname: "Ramsamy",
      otherNames: "Vikash",
      phone1: "57123456",
      dateIn: "2026-05-02",
      dateOut: "2026-05-02",
      timeOut: "23:00",
      occupancyVenue: "HALL",
      status: "CANCELLED",
      agreedPrice: 90000,
      deposit: 20000,
      bookedByStaffName: "Ramdeo Seetloo",
      notes: "Cancelled by client, deposit forfeited per terms.",
      events: {
        create: [
          { label: "Haldi", venue: "HALL", date: "2026-05-02", startTime: "18:00", endTime: "23:00" },
        ],
      },
    },
  });

  console.log("Seeded 4 bookings (3 confirmed matching the paper forms, 1 cancelled).");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
