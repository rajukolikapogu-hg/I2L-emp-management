"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { cookieSecure } from "@/lib/config";
import { checkAdminCredentials, LOGIN_FAILED_MESSAGE } from "@/lib/credentials";
import { currentPeriodMonth } from "@/lib/month";
import {
  SESSION_COOKIE,
  SESSION_TTL_SECONDS,
  signSessionId,
} from "@/lib/session-token";
import {
  validateEmployeeInput,
  validatePaymentDate,
  type EmployeeField,
  type FieldErrors,
} from "@/lib/validation";
import { currentSessionId, requireAdmin } from "@/server/auth";
import { createEmployee } from "@/server/employees";
import { recordPayment } from "@/server/payments";
import { createSession, deleteSession } from "@/server/sessions";

const GENERIC_ERROR = "Something went wrong while saving. Please try again.";

// ---------------------------------------------------------------- Auth

export type LoginState = { error?: string };

export async function login(_prev: LoginState, formData: FormData): Promise<LoginState> {
  if (!checkAdminCredentials(formData.get("username"), formData.get("password"))) {
    return { error: LOGIN_FAILED_MESSAGE };
  }
  try {
    const sessionId = await createSession();
    const store = await cookies();
    store.set(SESSION_COOKIE, await signSessionId(sessionId), {
      httpOnly: true,
      sameSite: "lax",
      secure: cookieSecure(),
      path: "/",
      maxAge: SESSION_TTL_SECONDS,
    });
  } catch (error) {
    console.error("login failed", error);
    return { error: GENERIC_ERROR };
  }
  redirect("/monthly");
}

export async function logout(): Promise<void> {
  const sessionId = await currentSessionId();
  if (sessionId) await deleteSession(sessionId);
  (await cookies()).delete(SESSION_COOKIE);
  redirect("/login");
}

// ---------------------------------------------------------------- Employees

export type AddEmployeeState = {
  ok?: boolean;
  message?: string;
  errors?: FieldErrors<EmployeeField>;
  values?: Partial<Record<EmployeeField, string>>;
};

export async function addEmployee(
  _prev: AddEmployeeState,
  formData: FormData,
): Promise<AddEmployeeState> {
  await requireAdmin();

  const raw = {
    name: formData.get("name"),
    designation: formData.get("designation"),
    dateOfBirth: formData.get("dateOfBirth"),
    salary: formData.get("salary"),
  };
  const values = Object.fromEntries(
    Object.entries(raw).map(([k, v]) => [k, typeof v === "string" ? v : ""]),
  );
  const result = validateEmployeeInput(raw);
  if (!result.ok) return { errors: result.errors, values };

  try {
    const employee = await createEmployee(result.value);
    revalidatePath("/employees");
    revalidatePath("/monthly");
    return { ok: true, message: `${employee.name} was added.` };
  } catch (error) {
    console.error("addEmployee failed", error);
    return { message: GENERIC_ERROR, values };
  }
}

// ---------------------------------------------------------------- Payments

export type MarkPaidState = { ok?: boolean; error?: string };

export async function markPaid(_prev: MarkPaidState, formData: FormData): Promise<MarkPaidState> {
  await requireAdmin();

  const employeeId = Number(formData.get("employeeId"));
  if (!Number.isSafeInteger(employeeId) || employeeId <= 0) {
    return { error: "Unknown employee." };
  }
  const date = validatePaymentDate(formData.get("paymentDate"));
  if (!date.ok) return { error: date.errors.paymentDate };

  try {
    // Recording is limited to the current month; history is view-only.
    const result = await recordPayment(employeeId, currentPeriodMonth(), date.value);
    if (result.status === "employee-not-found") return { error: "Unknown employee." };
  } catch (error) {
    console.error("markPaid failed", error);
    return { error: GENERIC_ERROR };
  }
  revalidatePath("/monthly");
  revalidatePath(`/employees/${employeeId}`);
  return { ok: true };
}
