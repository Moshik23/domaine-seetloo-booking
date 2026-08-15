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
      <div className="mb-4 print:hidden">
        <PrintButton />
      </div>
      <PrintableBookingForm booking={booking} />
    </div>
  );
}
