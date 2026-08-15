import { formatDateDisplay } from "@/lib/dateUtils";

export interface PaymentRow {
  id: string;
  amount: number;
  date: string;
  note: string | null;
}

export function PaymentLog({ payments }: { payments: PaymentRow[] }) {
  if (payments.length === 0) {
    return <p className="text-sm text-neutral-500 dark:text-neutral-400">No payments logged yet.</p>;
  }

  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="border-b border-neutral-200 text-left text-neutral-500 dark:border-neutral-800 dark:text-neutral-400">
          <th className="py-1 font-medium">Date</th>
          <th className="py-1 font-medium">Amount (Rs)</th>
          <th className="py-1 font-medium">Note</th>
        </tr>
      </thead>
      <tbody>
        {payments.map((p) => (
          <tr key={p.id} className="border-b border-neutral-100 dark:border-neutral-800 dark:text-neutral-200">
            <td className="py-1">{formatDateDisplay(p.date)}</td>
            <td className="py-1">{p.amount.toLocaleString()}</td>
            <td className="py-1 text-neutral-500 dark:text-neutral-400">{p.note ?? ""}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
