"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { addPayment } from "@/actions/payments.actions";
import { inputClass } from "@/components/ui/Field";
import { todayIso } from "@/lib/dateUtils";

export function AddPaymentForm({ bookingId }: { bookingId: string }) {
  const router = useRouter();
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(todayIso());
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setPending(true);
    const result = await addPayment({ bookingId, amount: Number(amount), date, note: note || null });
    setPending(false);
    if (!result.success) {
      setError(result.error);
      return;
    }
    setAmount("");
    setNote("");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-2">
      <div>
        <label className="mb-1 block text-xs font-medium text-neutral-700 dark:text-neutral-300">Amount (Rs)</label>
        <input
          type="number"
          min="1"
          required
          className={`${inputClass} w-32`}
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-neutral-700 dark:text-neutral-300">Date</label>
        <input
          type="date"
          required
          className={`${inputClass} w-40`}
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />
      </div>
      <div className="flex-1 min-w-[10rem]">
        <label className="mb-1 block text-xs font-medium text-neutral-700 dark:text-neutral-300">Note</label>
        <input className={inputClass} value={note} onChange={(e) => setNote(e.target.value)} />
      </div>
      <button
        type="submit"
        disabled={pending}
        className="rounded-md border border-neutral-300 px-3 py-2 text-sm font-medium hover:bg-neutral-50 disabled:opacity-50 dark:border-neutral-700 dark:text-neutral-200 dark:hover:bg-neutral-800"
      >
        {pending ? "Adding..." : "Add Payment"}
      </button>
      {error && <p className="w-full text-xs text-red-600 dark:text-red-400">{error}</p>}
    </form>
  );
}
