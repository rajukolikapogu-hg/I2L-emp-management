"use client";

import { useActionState, useId, useState } from "react";
import { markPaid, type MarkPaidState } from "@/app/actions";

type Props = { employeeId: number; employeeName: string; salary: string; today: string };

// Records the current month's payment. The amount is prefilled from the employee's
// fixed salary and is not editable (PAY-1); the payment date is required (PAY-2).
// No payment method or notes are captured (PAY-5).
export function MarkPaidForm({ employeeId, employeeName, salary, today }: Props) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState<MarkPaidState, FormData>(markPaid, {});
  const id = useId();

  if (!open) {
    return (
      <button type="button" className="btn-secondary" onClick={() => setOpen(true)}>
        Mark as paid<span className="sr-only"> for {employeeName}</span>
      </button>
    );
  }

  return (
    <form
      action={formAction}
      className="flex flex-wrap items-end gap-3"
      aria-label={`Record payment for ${employeeName}`}
    >
      <input type="hidden" name="employeeId" value={employeeId} />
      <div>
        <label htmlFor={`${id}-amount`} className="label">
          Amount
        </label>
        <input id={`${id}-amount`} value={salary} readOnly className="input w-32 tabular-nums" />
      </div>
      <div>
        <label htmlFor={`${id}-date`} className="label">
          Payment date
        </label>
        <input
          id={`${id}-date`}
          name="paymentDate"
          type="date"
          max={today}
          required
          className="input w-40"
          aria-invalid={state.error ? true : undefined}
          aria-describedby={state.error ? `${id}-error` : undefined}
        />
      </div>
      <div className="flex gap-2">
        <button type="submit" className="btn" disabled={pending}>
          {pending ? "Saving…" : "Save payment"}
        </button>
        <button type="button" className="btn-secondary" onClick={() => setOpen(false)}>
          Cancel
        </button>
      </div>
      {state.error && (
        <p id={`${id}-error`} role="alert" className="field-error w-full">
          {state.error}
        </p>
      )}
    </form>
  );
}
