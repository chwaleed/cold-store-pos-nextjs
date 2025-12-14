-- CreateTable
CREATE TABLE "OpeningBalanceAudit" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "dailyCashSummaryId" INTEGER NOT NULL,
    "oldOpeningBalance" REAL NOT NULL,
    "newOpeningBalance" REAL NOT NULL,
    "changeReason" TEXT,
    "changedBy" TEXT,
    "changeTimestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "OpeningBalanceAudit_dailyCashSummaryId_fkey" FOREIGN KEY ("dailyCashSummaryId") REFERENCES "DailyCashSummary" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "OpeningBalanceAudit_dailyCashSummaryId_idx" ON "OpeningBalanceAudit"("dailyCashSummaryId");

-- CreateIndex
CREATE INDEX "OpeningBalanceAudit_changeTimestamp_idx" ON "OpeningBalanceAudit"("changeTimestamp");
