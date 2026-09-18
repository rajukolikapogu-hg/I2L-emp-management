import Link from "next/link";
import { StatusBadge } from "@/components/StatusBadge";
import { formatIsoDate } from "@/lib/dates";
import { centsToInputValue, formatCents } from "@/lib/money";
import { currentPeriodMonth, formatPeriodMonth, todayIsoDate } from "@/lib/month";
import { listEmployees } from "@/server/employees";
import { paymentsForMonth } from "@/server/payments";
import { MarkPaidForm } from "./MarkPaidForm";

export const metadata = { title: "Monthly view · Emp-management" };

// Lists every employee with their paid/unpaid status for the current month (MON-1).
// Deliberately shows no totals or summary metrics (MON-5).
export default async function MonthlyPage() {
  const periodMonth = currentPeriodMonth();
  const [employees, payments] = await Promise.all([listEmployees(), paymentsForMonth(periodMonth)]);
  const today = todayIsoDate();

  return (
    <>
      <h1 className="text-2xl font-semibold">{formatPeriodMonth(periodMonth)}</h1>
      <p className="mt-1 text-sm text-slate-600">Salary payment status for the current month.</p>

      {employees.length === 0 ? (
        <div className="card mt-6 p-8 text-center text-slate-600">
          No employees yet.{" "}
          <Link href="/employees" className="font-medium text-indigo-700 underline">
            Add an employee
          </Link>{" "}
          to start recording payments.
        </div>
      ) : (
        <div className="card mt-6 overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50 text-left text-slate-600">
              <tr>
                <th scope="col" className="px-4 py-3 font-medium">Employee</th>
                <th scope="col" className="px-4 py-3 font-medium">Salary</th>
                <th scope="col" className="px-4 py-3 font-medium">Status</th>
                <th scope="col" className="px-4 py-3 font-medium">
                  <span className="sr-only">Action</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {employees.map((employee) => {
                const payment = payments.get(employee.id);
                return (
                  <tr
                    key={employee.id}
                    data-testid={`employee-row-${employee.id}`}
                    data-status={payment ? "paid" : "unpaid"}
                    className={payment ? "bg-emerald-50/40" : undefined}
                  >
                    <td className="px-4 py-3 align-top">
                      <Link
                        href={`/employees/${employee.id}`}
                        className="font-medium text-slate-900 hover:underline"
                      >
                        {employee.name}
                      </Link>
                      <div className="text-slate-500">{employee.designation}</div>
                    </td>
                    <td className="px-4 py-3 align-top tabular-nums">
                      {formatCents(employee.salaryCents)}
                    </td>
                    <td className="px-4 py-3 align-top">
                      <StatusBadge paid={Boolean(payment)} />
                    </td>
                    <td className="px-4 py-3 align-top">
                      {payment ? (
                        <span className="text-slate-600">
                          Paid on {formatIsoDate(payment.paymentDate)}
                        </span>
                      ) : (
                        <MarkPaidForm
                          employeeId={employee.id}
                          employeeName={employee.name}
                          salary={centsToInputValue(employee.salaryCents)}
                          today={today}
                        />
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
