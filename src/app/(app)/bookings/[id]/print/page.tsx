import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { PrintableBookingForm } from "@/components/print/PrintableBookingForm";
import { PrintButton } from "./PrintButton";

export default async function BookingPrintPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const booking = await prisma.booking.findUnique({
    where: { id },
    include: {
      events: { orderBy: [{ date: "asc" }, { startTime: "asc" }] },
      payments: { orderBy: { date: "asc" } },
    },
  });
  if (!booking) notFound();

  return (
    <div>
      <div className="mb-4 flex items-center gap-2 print:hidden">
        <Link
          href={`/bookings/${id}`}
          className="rounded-md border border-neutral-300 px-4 py-2 text-sm font-medium hover:bg-neutral-50 dark:border-neutral-700 dark:text-neutral-200 dark:hover:bg-neutral-800"
        >
          ← Back to booking
        </Link>
        <PrintButton />
      </div>
      <PrintableBookingForm booking={booking} />
    </div>
  );
}
