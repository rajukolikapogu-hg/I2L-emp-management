import Link from "next/link";
import { notFound } from "next/navigation";
import { formatIsoDate } from "@/lib/dates";
import { formatCents } from "@/lib/money";
import { formatPeriodMonth } from "@/lib/month";
import { getEmployee } from "@/server/employees";
import { listPaymentsForEmployee } from "@/server/payments";

export const metadata = { title: "Payment history · Employee Management" };

// Read-only payment history, most recent month first (HIST-1..HIST-4).
export default async function EmployeeHistoryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const id = Number((await params).id);
  if (!Number.isSafeInteger(id) || id <= 0) notFound();

  const employee = await getEmployee(id);
  if (!employee) notFound();
  const payments = await listPaymentsForEmployee(id);

  return (
    <>
      <Link href="/employees" className="text-sm text-indigo-700 hover:underline">
        ← All employees
      </Link>
      <h1 className="mt-2 text-2xl font-semibold">{employee.name}</h1>
      <dl className="mt-2 flex flex-wrap gap-x-8 gap-y-1 text-sm text-slate-600">
        <div>
          <dt className="inline">Designation: </dt>
          <dd className="inline text-slate-900">{employee.designation}</dd>
        </div>
        <div>
          <dt className="inline">Date of birth: </dt>
          <dd className="inline text-slate-900">{formatIsoDate(employee.dateOfBirth)}</dd>
        </div>
        <div>
          <dt className="inline">Monthly salary: </dt>
          <dd className="inline tabular-nums text-slate-900">
            {formatCents(employee.salaryCents)}
          </dd>
        </div>
      </dl>

      <h2 className="mt-8 text-lg font-semibold">Payment history</h2>
      {payments.length === 0 ? (
        <div className="card mt-4 p-8 text-center text-slate-600">No payments recorded yet.</div>
      ) : (
        <div className="card mt-4 overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50 text-left text-slate-600">
              <tr>
                <th scope="col" className="px-4 py-3 font-medium">Month</th>
                <th scope="col" className="px-4 py-3 text-right font-medium">Amount</th>
                <th scope="col" className="px-4 py-3 font-medium">Payment date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100" data-testid="payment-history">
              {payments.map((payment) => (
                <tr key={payment.id} data-period={payment.periodMonth}>
                  <td className="px-4 py-3">{formatPeriodMonth(payment.periodMonth)}</td>
                  <td className="px-4 py-3 text-right tabular-nums">
                    {formatCents(payment.amountCents)}
                  </td>
                  <td className="px-4 py-3">{formatIsoDate(payment.paymentDate)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
