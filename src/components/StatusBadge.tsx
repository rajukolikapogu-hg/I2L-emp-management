// Paid/unpaid is conveyed by icon and text, not colour alone (MON-2).
export function StatusBadge({ paid }: { paid: boolean }) {
  return paid ? (
    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-sm font-medium text-emerald-800 ring-1 ring-emerald-600/20">
      <span aria-hidden="true">✓</span> Paid
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-sm font-medium text-amber-900 ring-1 ring-amber-600/30">
      <span aria-hidden="true">○</span> Unpaid
    </span>
  );
}
