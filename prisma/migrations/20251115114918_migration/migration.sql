-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_ClearedItem" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "clearanceReceiptId" INTEGER NOT NULL,
    "entryReceiptNo" TEXT NOT NULL,
    "entryItemId" INTEGER NOT NULL,
    "clearQuantity" REAL NOT NULL,
    "clearKjQuantity" REAL,
    "totalAmount" REAL NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ClearedItem_clearanceReceiptId_fkey" FOREIGN KEY ("clearanceReceiptId") REFERENCES "ClearanceReceipt" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ClearedItem_entryItemId_fkey" FOREIGN KEY ("entryItemId") REFERENCES "EntryItem" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_ClearedItem" ("clearKjQuantity", "clearQuantity", "clearanceReceiptId", "createdAt", "entryItemId", "entryReceiptNo", "id", "totalAmount", "updatedAt") SELECT "clearKjQuantity", "clearQuantity", "clearanceReceiptId", "createdAt", "entryItemId", "entryReceiptNo", "id", "totalAmount", "updatedAt" FROM "ClearedItem";
DROP TABLE "ClearedItem";
ALTER TABLE "new_ClearedItem" RENAME TO "ClearedItem";
CREATE INDEX "ClearedItem_clearanceReceiptId_idx" ON "ClearedItem"("clearanceReceiptId");
CREATE INDEX "ClearedItem_entryItemId_idx" ON "ClearedItem"("entryItemId");
CREATE INDEX "ClearedItem_entryReceiptNo_idx" ON "ClearedItem"("entryReceiptNo");
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
    CONSTRAINT "ClearanceReceipt_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_ClearanceReceipt" ("carNo", "clearanceDate", "clearanceNo", "createdAt", "customerId", "description", "id", "totalAmount", "updatedAt") SELECT "carNo", "clearanceDate", "clearanceNo", "createdAt", "customerId", "description", "id", "totalAmount", "updatedAt" FROM "ClearanceReceipt";
DROP TABLE "ClearanceReceipt";
ALTER TABLE "new_ClearanceReceipt" RENAME TO "ClearanceReceipt";
CREATE UNIQUE INDEX "ClearanceReceipt_clearanceNo_key" ON "ClearanceReceipt"("clearanceNo");
CREATE INDEX "ClearanceReceipt_customerId_idx" ON "ClearanceReceipt"("customerId");
CREATE INDEX "ClearanceReceipt_clearanceNo_idx" ON "ClearanceReceipt"("clearanceNo");
CREATE INDEX "ClearanceReceipt_clearanceDate_idx" ON "ClearanceReceipt"("clearanceDate");
PRAGMA foreign_key_check("ClearedItem");
PRAGMA foreign_key_check("ClearanceReceipt");
PRAGMA foreign_keys=ON;
