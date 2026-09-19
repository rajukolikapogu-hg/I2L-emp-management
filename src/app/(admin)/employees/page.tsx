import Link from "next/link";
import { formatIsoDate } from "@/lib/dates";
import { formatCents } from "@/lib/money";
import { listEmployees } from "@/server/employees";
import { AddEmployeeForm } from "./AddEmployeeForm";

export const metadata = { title: "Employees · Employee Management" };

// Employee records are create-only: this page offers no edit or delete controls (EMP-3, EMP-4).
export default async function EmployeesPage() {
  const employees = await listEmployees();

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_20rem]">
      <section aria-labelledby="employees-heading">
        <h1 id="employees-heading" className="text-2xl font-semibold">
          Employees
        </h1>
        {employees.length === 0 ? (
          <div className="card mt-6 p-8 text-center text-slate-600">
            No employees yet. Use the form to add the first one.
          </div>
        ) : (
          <div className="card mt-6 overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50 text-left text-slate-600">
                <tr>
                  <th scope="col" className="px-4 py-3 font-medium">Name</th>
                  <th scope="col" className="px-4 py-3 font-medium">Designation</th>
                  <th scope="col" className="px-4 py-3 font-medium">Date of birth</th>
                  <th scope="col" className="px-4 py-3 text-right font-medium">Salary</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {employees.map((employee) => (
                  <tr key={employee.id}>
                    <td className="px-4 py-3">
                      <Link
                        href={`/employees/${employee.id}`}
                        className="font-medium text-indigo-700 hover:underline"
                      >
                        {employee.name}
                      </Link>
                    </td>
                    <td className="px-4 py-3">{employee.designation}</td>
                    <td className="px-4 py-3">{formatIsoDate(employee.dateOfBirth)}</td>
                    <td className="px-4 py-3 text-right tabular-nums">
                      {formatCents(employee.salaryCents)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section aria-labelledby="add-employee-heading" className="card h-fit p-6">
        <h2 id="add-employee-heading" className="text-lg font-semibold">
          Add employee
        </h2>
        <p className="mt-1 text-sm text-slate-600">
          Employee details and salary cannot be changed after saving.
        </p>
        <AddEmployeeForm />
      </section>
    </div>
  );
}
