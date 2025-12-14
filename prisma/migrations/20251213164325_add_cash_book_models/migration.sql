-- CreateTable
CREATE TABLE "CashBookEntry" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "date" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "transactionType" TEXT NOT NULL,
    "amount" REAL NOT NULL,
    "description" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "referenceId" INTEGER,
    "referenceType" TEXT,
    "customerId" INTEGER,
    "createdBy" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "CashBookEntry_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "DailyCashSummary" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "date" DATETIME NOT NULL,
    "openingBalance" REAL NOT NULL DEFAULT 0,
    "totalInflows" REAL NOT NULL DEFAULT 0,
    "totalOutflows" REAL NOT NULL DEFAULT 0,
    "closingBalance" REAL NOT NULL DEFAULT 0,
    "isReconciled" BOOLEAN NOT NULL DEFAULT false,
    "reconciledBy" TEXT,
    "reconciledAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE INDEX "CashBookEntry_date_idx" ON "CashBookEntry"("date");

-- CreateIndex
CREATE INDEX "CashBookEntry_transactionType_idx" ON "CashBookEntry"("transactionType");

-- CreateIndex
CREATE INDEX "CashBookEntry_source_idx" ON "CashBookEntry"("source");

-- CreateIndex
CREATE INDEX "CashBookEntry_referenceId_referenceType_idx" ON "CashBookEntry"("referenceId", "referenceType");

-- CreateIndex
CREATE UNIQUE INDEX "DailyCashSummary_date_key" ON "DailyCashSummary"("date");

-- CreateIndex
CREATE INDEX "DailyCashSummary_date_idx" ON "DailyCashSummary"("date");
