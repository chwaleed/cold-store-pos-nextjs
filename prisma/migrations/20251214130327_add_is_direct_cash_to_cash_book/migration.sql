-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_CashBookEntry" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "date" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "transactionType" TEXT NOT NULL,
    "amount" REAL NOT NULL,
    "description" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "referenceId" INTEGER,
    "referenceType" TEXT,
    "customerId" INTEGER,
    "isDirectCash" BOOLEAN NOT NULL DEFAULT false,
    "createdBy" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "CashBookEntry_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_CashBookEntry" ("amount", "createdAt", "createdBy", "customerId", "date", "description", "id", "referenceId", "referenceType", "source", "transactionType", "updatedAt") SELECT "amount", "createdAt", "createdBy", "customerId", "date", "description", "id", "referenceId", "referenceType", "source", "transactionType", "updatedAt" FROM "CashBookEntry";
DROP TABLE "CashBookEntry";
ALTER TABLE "new_CashBookEntry" RENAME TO "CashBookEntry";
CREATE INDEX "CashBookEntry_date_idx" ON "CashBookEntry"("date");
CREATE INDEX "CashBookEntry_transactionType_idx" ON "CashBookEntry"("transactionType");
CREATE INDEX "CashBookEntry_source_idx" ON "CashBookEntry"("source");
CREATE INDEX "CashBookEntry_referenceId_referenceType_idx" ON "CashBookEntry"("referenceId", "referenceType");
PRAGMA foreign_key_check("CashBookEntry");
PRAGMA foreign_keys=ON;
