import "server-only";
import { Prisma, type Payment } from "@prisma/client";
import { prisma } from "@/lib/db";

// Payment data access is deliberately create/read only (HIST-3).

export type RecordPaymentResult =
  | { status: "recorded"; payment: Payment }
  | { status: "already-paid" }
  | { status: "employee-not-found" };

/**
 * Records the salary payment for an employee and month. Idempotent: the unique
 * (employeeId, periodMonth) constraint guarantees at most one row (PAY-3), and a
 * duplicate attempt, including a concurrent one, resolves to "already-paid".
 * The amount always comes from the employee's stored salary (PAY-1).
 */
export async function recordPayment(
  employeeId: number,
  periodMonth: string,
  paymentDate: string,
): Promise<RecordPaymentResult> {
  const employee = await prisma.employee.findUnique({ where: { id: employeeId } });
  if (!employee) return { status: "employee-not-found" };

  try {
    const payment = await prisma.payment.create({
      data: { employeeId, periodMonth, paymentDate, amountCents: employee.salaryCents },
    });
    return { status: "recorded", payment };
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return { status: "already-paid" };
    }
    throw error;
  }
}

/** Every payment for one employee, most recent month first (HIST-1, HIST-4). */
export function listPaymentsForEmployee(employeeId: number): Promise<Payment[]> {
  return prisma.payment.findMany({
    where: { employeeId },
    orderBy: [{ periodMonth: "desc" }, { id: "desc" }],
  });
}

/** Payments recorded for a month, keyed by employee id. */
export async function paymentsForMonth(periodMonth: string): Promise<Map<number, Payment>> {
  const payments = await prisma.payment.findMany({ where: { periodMonth } });
  return new Map(payments.map((p) => [p.employeeId, p]));
}
