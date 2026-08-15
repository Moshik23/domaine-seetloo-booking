import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { BookingDetailClient } from "@/components/booking-form/BookingDetailClient";

export default async function BookingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const booking = await prisma.booking.findUnique({
    where: { id },
    include: {
      events: { orderBy: [{ date: "asc" }, { startTime: "asc" }] },
      payments: { orderBy: { date: "asc" } },
    },
  });
  if (!booking) notFound();

  return <BookingDetailClient booking={booking} />;
}
