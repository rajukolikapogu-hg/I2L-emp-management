import { afterAll, describe, expect, it } from "vitest";
import { prisma } from "@/lib/db";
import { createEmployee, getEmployee, listEmployees } from "@/server/employees";
import { listPaymentsForEmployee, paymentsForMonth, recordPayment } from "@/server/payments";
import { createSession, deleteSession, isSessionActive } from "@/server/sessions";

afterAll(() => prisma.$disconnect());

let seq = 0;
function newEmployee(salaryCents = 500000) {
  seq += 1;
  return createEmployee({
    name: `Test Employee ${seq}`,
    designation: "Engineer",
    dateOfBirth: "1990-01-01",
    salaryCents,
  });
}

async function columns(table: string): Promise<string[]> {
  const rows = await prisma.$queryRawUnsafe<{ name: string }[]>(`PRAGMA table_info("${table}")`);
  return rows.map((r) => r.name);
}

describe("schema (TC-001, TC-002, TC-031)", () => {
  it("has the expected Employee and Payment columns and nothing more", async () => {
    expect(await columns("Employee")).toEqual([
      "id", "name", "designation", "dateOfBirth", "salaryCents", "createdAt",
    ]);
    expect(await columns("Payment")).toEqual([
      "id", "employeeId", "periodMonth", "amountCents", "paymentDate", "createdAt",
    ]);
  });
});

describe("employees", () => {
  // TC-015
  it("stores the salary exactly as entered and lists the employee", async () => {
    const employee = await newEmployee(500000);
    expect((await getEmployee(employee.id))?.salaryCents).toBe(500000);
    expect((await listEmployees()).map((e) => e.id)).toContain(employee.id);
  });

  // TC-018, TC-019: immutability is enforced by the database itself.
  it("rejects updates and deletes at the database level", async () => {
    const employee = await newEmployee(500000);
    await expect(
      prisma.employee.update({ where: { id: employee.id }, data: { salaryCents: 1 } }),
    ).rejects.toThrow();
    await expect(prisma.employee.delete({ where: { id: employee.id } })).rejects.toThrow();
    // Raw SQL surfaces the trigger's own message, proving the guard is in the database.
    await expect(
      prisma.$executeRawUnsafe(`UPDATE "Employee" SET "salaryCents" = 1 WHERE "id" = ?`, employee.id),
    ).rejects.toThrow(/Employee records are immutable/);
    await expect(
      prisma.$executeRawUnsafe(`DELETE FROM "Employee" WHERE "id" = ?`, employee.id),
    ).rejects.toThrow(/Employee records cannot be deleted/);
    expect((await getEmployee(employee.id))?.salaryCents).toBe(500000);
  });
});

describe("payments", () => {
  // TC-028
  it("persists employee, month, stored salary amount and payment date", async () => {
    const employee = await newEmployee(500000);
    const result = await recordPayment(employee.id, "2026-09", "2026-09-15");
    expect(result.status).toBe("recorded");
    const [payment] = await listPaymentsForEmployee(employee.id);
    expect(payment).toMatchObject({
      employeeId: employee.id,
      periodMonth: "2026-09",
      amountCents: 500000,
      paymentDate: "2026-09-15",
    });
    expect((await paymentsForMonth("2026-09")).get(employee.id)?.id).toBe(payment.id);
  });

  // TC-003
  it("has a unique (employeeId, periodMonth) constraint", async () => {
    const employee = await newEmployee();
    const data = { employeeId: employee.id, periodMonth: "2026-08", amountCents: 1, paymentDate: "2026-08-01" };
    await prisma.payment.create({ data });
    await expect(prisma.payment.create({ data })).rejects.toMatchObject({ code: "P2002" });
  });

  // TC-029
  it("treats a repeat mark-as-paid as already paid without a duplicate", async () => {
    const employee = await newEmployee();
    await recordPayment(employee.id, "2026-09", "2026-09-10");
    expect(await recordPayment(employee.id, "2026-09", "2026-09-11")).toEqual({
      status: "already-paid",
    });
    const rows = await listPaymentsForEmployee(employee.id);
    expect(rows).toHaveLength(1);
    expect(rows[0].paymentDate).toBe("2026-09-10");
  });

  // TC-030
  it("stays idempotent under concurrent requests", async () => {
    const employee = await newEmployee();
    const results = await Promise.all(
      Array.from({ length: 5 }, () => recordPayment(employee.id, "2026-09", "2026-09-12")),
    );
    expect(results.filter((r) => r.status === "recorded")).toHaveLength(1);
    expect(results.filter((r) => r.status === "already-paid")).toHaveLength(4);
    expect(await listPaymentsForEmployee(employee.id)).toHaveLength(1);
  });

  it("reports an unknown employee", async () => {
    expect(await recordPayment(999_999, "2026-09", "2026-09-12")).toEqual({
      status: "employee-not-found",
    });
  });

  // TC-036, TC-039
  it("lists history for one employee only, most recent month first", async () => {
    const employee = await newEmployee(300000);
    const other = await newEmployee();
    for (const month of ["2026-03", "2026-07", "2025-12", "2026-05"]) {
      await recordPayment(employee.id, month, `${month}-28`);
    }
    await recordPayment(other.id, "2026-06", "2026-06-28");

    const history = await listPaymentsForEmployee(employee.id);
    expect(history.map((p) => p.periodMonth)).toEqual(["2026-07", "2026-05", "2026-03", "2025-12"]);
    expect(history.every((p) => p.amountCents === 300000 && p.employeeId === employee.id)).toBe(true);
    expect(await listPaymentsForEmployee((await newEmployee()).id)).toEqual([]);
  });

  // TC-042
  it("rejects updates and deletes of payments at the database level", async () => {
    const employee = await newEmployee();
    const result = await recordPayment(employee.id, "2026-09", "2026-09-01");
    if (result.status !== "recorded") throw new Error("expected a payment");
    const id = result.payment.id;
    await expect(prisma.payment.update({ where: { id }, data: { amountCents: 1 } })).rejects.toThrow();
    await expect(prisma.payment.delete({ where: { id } })).rejects.toThrow();
    await expect(
      prisma.$executeRawUnsafe(`UPDATE "Payment" SET "paymentDate" = '2000-01-01' WHERE "id" = ?`, id),
    ).rejects.toThrow(/Payment records are immutable/);
    await expect(prisma.$executeRawUnsafe(`DELETE FROM "Payment" WHERE "id" = ?`, id)).rejects.toThrow(
      /Payment records cannot be deleted/,
    );
    expect((await listPaymentsForEmployee(employee.id))[0]).toMatchObject({
      amountCents: 500000,
      paymentDate: "2026-09-01",
    });
  });
});

describe("sessions (AUTH-3, AUTH-4)", () => {
  it("revokes a session on logout and expires old sessions", async () => {
    const id = await createSession();
    expect(await isSessionActive(id)).toBe(true);
    await deleteSession(id);
    expect(await isSessionActive(id)).toBe(false);

    const old = await createSession(new Date(Date.now() - 13 * 60 * 60 * 1000));
    expect(await isSessionActive(old)).toBe(false);
  });
});
