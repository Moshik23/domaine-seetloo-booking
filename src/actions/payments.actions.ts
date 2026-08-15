"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { paymentInputSchema, type PaymentInput } from "@/lib/validation";
import type { ActionResult } from "@/actions/bookings.actions";

export async function addPayment(rawInput: PaymentInput): Promise<ActionResult<{ id: string }>> {
  const parsed = paymentInputSchema.safeParse(rawInput);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid payment." };
  }
  const input = parsed.data;

  const payment = await prisma.payment.create({
    data: {
      bookingId: input.bookingId,
      amount: input.amount,
      date: input.date,
      note: input.note || null,
    },
  });

  revalidatePath(`/bookings/${input.bookingId}`);
  return { success: true, data: { id: payment.id } };
}
