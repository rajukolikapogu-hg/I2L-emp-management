"use client";

import { useActionState } from "react";
import { addEmployee, type AddEmployeeState } from "@/app/actions";
import type { EmployeeField } from "@/lib/validation";

const FIELDS: { name: EmployeeField; label: string; type: string; inputMode?: "decimal" }[] = [
  { name: "name", label: "Name", type: "text" },
  { name: "designation", label: "Designation", type: "text" },
  { name: "dateOfBirth", label: "Date of birth", type: "date" },
  { name: "salary", label: "Monthly salary", type: "text", inputMode: "decimal" },
];

export function AddEmployeeForm() {
  const [state, formAction, pending] = useActionState<AddEmployeeState, FormData>(
    addEmployee,
    {},
  );

  return (
    // Keying on the returned state remounts the inputs so their defaults reflect
    // the submitted values after a validation error, and clear after success.
    <form key={JSON.stringify(state)} action={formAction} className="mt-4 space-y-4" noValidate>
      {state.message && (
        <p
          role={state.ok ? "status" : "alert"}
          className={`rounded-md px-3 py-2 text-sm ${
            state.ok ? "bg-emerald-50 text-emerald-800" : "bg-red-50 text-red-800"
          }`}
        >
          {state.message}
        </p>
      )}
      {FIELDS.map((field) => {
        const error = state.errors?.[field.name];
        return (
          <div key={field.name}>
            <label htmlFor={field.name} className="label">
              {field.label}
            </label>
            <input
              id={field.name}
              name={field.name}
              type={field.type}
              inputMode={field.inputMode}
              required
              defaultValue={state.values?.[field.name] ?? ""}
              className="input"
              aria-invalid={error ? true : undefined}
              aria-describedby={error ? `${field.name}-error` : undefined}
            />
            {error && (
              <p id={`${field.name}-error`} className="field-error">
                {error}
              </p>
            )}
          </div>
        );
      })}
      <button type="submit" className="btn w-full" disabled={pending}>
        {pending ? "Saving…" : "Add employee"}
      </button>
    </form>
  );
}
