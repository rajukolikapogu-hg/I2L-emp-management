import "server-only";
import type { Employee } from "@prisma/client";
import { prisma } from "@/lib/db";
import type { EmployeeInput } from "@/lib/validation";

// Employee data access is deliberately create/read only (EMP-3, EMP-4, EMP-5).
// The database triggers in the initial migration back this up.

export function createEmployee(input: EmployeeInput): Promise<Employee> {
  return prisma.employee.create({ data: input });
}

export function listEmployees(): Promise<Employee[]> {
  return prisma.employee.findMany({ orderBy: [{ name: "asc" }, { id: "asc" }] });
}

export function getEmployee(id: number): Promise<Employee | null> {
  return prisma.employee.findUnique({ where: { id } });
}
