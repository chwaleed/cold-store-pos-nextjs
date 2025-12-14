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
    "isDirectCash" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Ledger_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Ledger_entryReceiptId_fkey" FOREIGN KEY ("entryReceiptId") REFERENCES "EntryReceipt" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Ledger_clearanceReceiptId_fkey" FOREIGN KEY ("clearanceReceiptId") REFERENCES "ClearanceReceipt" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Ledger" ("clearanceReceiptId", "createdAt", "creditAmount", "customerId", "debitAmount", "description", "entryReceiptId", "id", "isDiscount", "type", "updatedAt") SELECT "clearanceReceiptId", "createdAt", "creditAmount", "customerId", "debitAmount", "description", "entryReceiptId", "id", "isDiscount", "type", "updatedAt" FROM "Ledger";
DROP TABLE "Ledger";
ALTER TABLE "new_Ledger" RENAME TO "Ledger";
CREATE INDEX "Ledger_customerId_idx" ON "Ledger"("customerId");
CREATE INDEX "Ledger_createdAt_idx" ON "Ledger"("createdAt");
CREATE INDEX "Ledger_entryReceiptId_idx" ON "Ledger"("entryReceiptId");
CREATE INDEX "Ledger_clearanceReceiptId_idx" ON "Ledger"("clearanceReceiptId");
CREATE INDEX "Ledger_type_idx" ON "Ledger"("type");
PRAGMA foreign_key_check("Ledger");
PRAGMA foreign_keys=ON;
