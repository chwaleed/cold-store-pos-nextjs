/*
  Warnings:

  - You are about to drop the column `invoiceId` on the `Ledger` table. All the data in the column will be lost.
  - Added the required column `type` to the `Ledger` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Ledger" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "customerId" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "entryReceiptId" INTEGER,
    "clearanceReceiptId" INTEGER,
    "description" TEXT NOT NULL,
    "debitAmount" REAL NOT NULL DEFAULT 0,
    "creditAmount" REAL NOT NULL DEFAULT 0,
    "isDiscount" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Ledger_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Ledger_entryReceiptId_fkey" FOREIGN KEY ("entryReceiptId") REFERENCES "EntryReceipt" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Ledger_clearanceReceiptId_fkey" FOREIGN KEY ("clearanceReceiptId") REFERENCES "ClearanceReceipt" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
-- Set default type as 'direct_cash' for existing ledger entries
INSERT INTO "new_Ledger" ("createdAt", "creditAmount", "customerId", "debitAmount", "description", "id", "isDiscount", "updatedAt", "type") 
SELECT "createdAt", "creditAmount", "customerId", "debitAmount", "description", "id", "isDiscount", "updatedAt", 'direct_cash' FROM "Ledger";
DROP TABLE "Ledger";
ALTER TABLE "new_Ledger" RENAME TO "Ledger";
CREATE INDEX "Ledger_customerId_idx" ON "Ledger"("customerId");
CREATE INDEX "Ledger_createdAt_idx" ON "Ledger"("createdAt");
CREATE INDEX "Ledger_entryReceiptId_idx" ON "Ledger"("entryReceiptId");
CREATE INDEX "Ledger_clearanceReceiptId_idx" ON "Ledger"("clearanceReceiptId");
CREATE INDEX "Ledger_type_idx" ON "Ledger"("type");
PRAGMA foreign_key_check("Ledger");
PRAGMA foreign_keys=ON;
