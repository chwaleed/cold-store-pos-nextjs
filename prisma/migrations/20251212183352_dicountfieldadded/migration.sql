/*
  Warnings:

  - You are about to drop the column `isDiscount` on the `Ledger` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_ClearanceReceipt" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "clearanceNo" TEXT NOT NULL,
    "customerId" INTEGER NOT NULL,
    "carNo" TEXT,
    "clearanceDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "totalAmount" REAL NOT NULL,
    "description" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "creditAmount" REAL,
    "discount" REAL NOT NULL DEFAULT 0,
    CONSTRAINT "ClearanceReceipt_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_ClearanceReceipt" ("carNo", "clearanceDate", "clearanceNo", "createdAt", "creditAmount", "customerId", "description", "id", "totalAmount", "updatedAt") SELECT "carNo", "clearanceDate", "clearanceNo", "createdAt", "creditAmount", "customerId", "description", "id", "totalAmount", "updatedAt" FROM "ClearanceReceipt";
DROP TABLE "ClearanceReceipt";
ALTER TABLE "new_ClearanceReceipt" RENAME TO "ClearanceReceipt";
CREATE INDEX "ClearanceReceipt_customerId_idx" ON "ClearanceReceipt"("customerId");
CREATE INDEX "ClearanceReceipt_clearanceNo_idx" ON "ClearanceReceipt"("clearanceNo");
CREATE INDEX "ClearanceReceipt_clearanceDate_idx" ON "ClearanceReceipt"("clearanceDate");
CREATE TABLE "new_Ledger" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "customerId" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "entryReceiptId" INTEGER,
    "clearanceReceiptId" INTEGER,
    "description" TEXT NOT NULL,
    "debitAmount" REAL NOT NULL DEFAULT 0,
    "creditAmount" REAL NOT NULL DEFAULT 0,
    "discount" REAL NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Ledger_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Ledger_entryReceiptId_fkey" FOREIGN KEY ("entryReceiptId") REFERENCES "EntryReceipt" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Ledger_clearanceReceiptId_fkey" FOREIGN KEY ("clearanceReceiptId") REFERENCES "ClearanceReceipt" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Ledger" ("clearanceReceiptId", "createdAt", "creditAmount", "customerId", "debitAmount", "description", "entryReceiptId", "id", "type", "updatedAt") SELECT "clearanceReceiptId", "createdAt", "creditAmount", "customerId", "debitAmount", "description", "entryReceiptId", "id", "type", "updatedAt" FROM "Ledger";
DROP TABLE "Ledger";
ALTER TABLE "new_Ledger" RENAME TO "Ledger";
CREATE INDEX "Ledger_customerId_idx" ON "Ledger"("customerId");
CREATE INDEX "Ledger_createdAt_idx" ON "Ledger"("createdAt");
CREATE INDEX "Ledger_entryReceiptId_idx" ON "Ledger"("entryReceiptId");
CREATE INDEX "Ledger_clearanceReceiptId_idx" ON "Ledger"("clearanceReceiptId");
CREATE INDEX "Ledger_type_idx" ON "Ledger"("type");
PRAGMA foreign_key_check("ClearanceReceipt");
PRAGMA foreign_key_check("Ledger");
PRAGMA foreign_keys=ON;
