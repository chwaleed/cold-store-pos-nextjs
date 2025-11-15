/*
  Warnings:

  - You are about to drop the column `entryReceiptId` on the `ClearanceReceipt` table. All the data in the column will be lost.
  - You are about to drop the column `totalRent` on the `ClearanceReceipt` table. All the data in the column will be lost.
  - You are about to drop the column `daysStored` on the `ClearedItem` table. All the data in the column will be lost.
  - You are about to drop the column `kjQuantityCleared` on the `ClearedItem` table. All the data in the column will be lost.
  - You are about to drop the column `quantityCleared` on the `ClearedItem` table. All the data in the column will be lost.
  - You are about to drop the column `rentPerDay` on the `ClearedItem` table. All the data in the column will be lost.
  - You are about to drop the column `totalRent` on the `ClearedItem` table. All the data in the column will be lost.
  - Added the required column `totalAmount` to the `ClearanceReceipt` table without a default value. This is not possible if the table is not empty.
  - Added the required column `clearQuantity` to the `ClearedItem` table without a default value. This is not possible if the table is not empty.
  - Added the required column `entryReceiptNo` to the `ClearedItem` table without a default value. This is not possible if the table is not empty.
  - Added the required column `totalAmount` to the `ClearedItem` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA foreign_keys=OFF;

-- Migrate ClearanceReceipt table
CREATE TABLE "new_ClearanceReceipt" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "clearanceNo" TEXT NOT NULL,
    "customerId" INTEGER NOT NULL,
    "carNo" TEXT,
    "clearanceDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "totalAmount" REAL NOT NULL DEFAULT 0,
    "description" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ClearanceReceipt_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Copy existing data from ClearanceReceipt, using totalRent as totalAmount
INSERT INTO "new_ClearanceReceipt" ("id", "carNo", "clearanceDate", "clearanceNo", "createdAt", "customerId", "description", "updatedAt", "totalAmount") 
SELECT "id", "carNo", "clearanceDate", "clearanceNo", "createdAt", "customerId", "description", "updatedAt", COALESCE("totalRent", 0) 
FROM "ClearanceReceipt";

DROP TABLE "ClearanceReceipt";
ALTER TABLE "new_ClearanceReceipt" RENAME TO "ClearanceReceipt";
CREATE UNIQUE INDEX "ClearanceReceipt_clearanceNo_key" ON "ClearanceReceipt"("clearanceNo");
CREATE INDEX "ClearanceReceipt_customerId_idx" ON "ClearanceReceipt"("customerId");
CREATE INDEX "ClearanceReceipt_clearanceNo_idx" ON "ClearanceReceipt"("clearanceNo");
CREATE INDEX "ClearanceReceipt_clearanceDate_idx" ON "ClearanceReceipt"("clearanceDate");

-- Migrate ClearedItem table
CREATE TABLE "new_ClearedItem" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "clearanceReceiptId" INTEGER NOT NULL,
    "entryReceiptNo" TEXT NOT NULL DEFAULT '',
    "entryItemId" INTEGER NOT NULL,
    "clearQuantity" REAL NOT NULL DEFAULT 0,
    "clearKjQuantity" REAL,
    "totalAmount" REAL NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ClearedItem_clearanceReceiptId_fkey" FOREIGN KEY ("clearanceReceiptId") REFERENCES "ClearanceReceipt" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ClearedItem_entryItemId_fkey" FOREIGN KEY ("entryItemId") REFERENCES "EntryItem" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Copy existing data with calculated values
INSERT INTO "new_ClearedItem" ("id", "clearanceReceiptId", "createdAt", "entryItemId", "updatedAt", "clearQuantity", "clearKjQuantity", "totalAmount", "entryReceiptNo")
SELECT 
    ci."id", 
    ci."clearanceReceiptId", 
    ci."createdAt", 
    ci."entryItemId", 
    ci."updatedAt",
    COALESCE(ci."quantityCleared", 0),
    ci."kjQuantityCleared",
    COALESCE(ci."totalRent", 0),
    COALESCE(er."receiptNo", '')
FROM "ClearedItem" ci
LEFT JOIN "EntryItem" ei ON ci."entryItemId" = ei."id"
LEFT JOIN "EntryReceipt" er ON ei."entryReceiptId" = er."id";

DROP TABLE "ClearedItem";
ALTER TABLE "new_ClearedItem" RENAME TO "ClearedItem";
CREATE INDEX "ClearedItem_clearanceReceiptId_idx" ON "ClearedItem"("clearanceReceiptId");
CREATE INDEX "ClearedItem_entryItemId_idx" ON "ClearedItem"("entryItemId");
CREATE INDEX "ClearedItem_entryReceiptNo_idx" ON "ClearedItem"("entryReceiptNo");

PRAGMA foreign_key_check("ClearanceReceipt");
PRAGMA foreign_key_check("ClearedItem");
PRAGMA foreign_keys=ON;
