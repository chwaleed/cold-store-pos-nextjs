/*
  Warnings:

  - You are about to drop the column `storageTillDate` on the `EntryReceipt` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_EntryReceipt" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "receiptNo" TEXT NOT NULL,
    "customerId" INTEGER NOT NULL,
    "carNo" TEXT NOT NULL,
    "entryDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "totalAmount" REAL NOT NULL,
    "description" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "EntryReceipt_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_EntryReceipt" ("carNo", "createdAt", "customerId", "description", "entryDate", "id", "receiptNo", "totalAmount", "updatedAt") SELECT "carNo", "createdAt", "customerId", "description", "entryDate", "id", "receiptNo", "totalAmount", "updatedAt" FROM "EntryReceipt";
DROP TABLE "EntryReceipt";
ALTER TABLE "new_EntryReceipt" RENAME TO "EntryReceipt";
CREATE UNIQUE INDEX "EntryReceipt_receiptNo_key" ON "EntryReceipt"("receiptNo");
CREATE INDEX "EntryReceipt_customerId_idx" ON "EntryReceipt"("customerId");
CREATE INDEX "EntryReceipt_receiptNo_idx" ON "EntryReceipt"("receiptNo");
CREATE INDEX "EntryReceipt_entryDate_idx" ON "EntryReceipt"("entryDate");
PRAGMA foreign_key_check("EntryReceipt");
PRAGMA foreign_keys=ON;
