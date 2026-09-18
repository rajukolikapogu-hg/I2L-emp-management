-- CreateTable
CREATE TABLE "Employee" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "designation" TEXT NOT NULL,
    "dateOfBirth" TEXT NOT NULL,
    "salaryCents" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Payment" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "employeeId" INTEGER NOT NULL,
    "periodMonth" TEXT NOT NULL,
    "amountCents" INTEGER NOT NULL,
    "paymentDate" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Payment_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee" ("id") ON DELETE RESTRICT ON UPDATE RESTRICT
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "Payment_employeeId_periodMonth_key" ON "Payment"("employeeId", "periodMonth");

-- Immutability guarantees (EMP-3, EMP-4, EMP-5, HIST-3).
-- Employees and payments are create-only. See docs/OPERATIONS.md for the
-- supervised manual-correction procedure if a data-entry mistake must be fixed.
CREATE TRIGGER "Employee_no_update" BEFORE UPDATE ON "Employee"
BEGIN SELECT RAISE(ABORT, 'Employee records are immutable'); END;

CREATE TRIGGER "Employee_no_delete" BEFORE DELETE ON "Employee"
BEGIN SELECT RAISE(ABORT, 'Employee records cannot be deleted'); END;

CREATE TRIGGER "Payment_no_update" BEFORE UPDATE ON "Payment"
BEGIN SELECT RAISE(ABORT, 'Payment records are immutable'); END;

CREATE TRIGGER "Payment_no_delete" BEFORE DELETE ON "Payment"
BEGIN SELECT RAISE(ABORT, 'Payment records cannot be deleted'); END;
