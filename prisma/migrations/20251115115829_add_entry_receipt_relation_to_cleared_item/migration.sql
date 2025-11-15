/*
  Warnings:

  - You are about to drop the column `entryReceiptNo` on the `ClearedItem` table. All the data in the column will be lost.
  - Added the required column `entryReceiptId` to the `ClearedItem` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_ClearedItem" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "clearanceReceiptId" INTEGER NOT NULL,
    "entryReceiptId" INTEGER NOT NULL DEFAULT 0,
    "entryItemId" INTEGER NOT NULL,
    "clearQuantity" REAL NOT NULL,
    "clearKjQuantity" REAL,
    "totalAmount" REAL NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ClearedItem_clearanceReceiptId_fkey" FOREIGN KEY ("clearanceReceiptId") REFERENCES "ClearanceReceipt" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ClearedItem_entryReceiptId_fkey" FOREIGN KEY ("entryReceiptId") REFERENCES "EntryReceipt" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ClearedItem_entryItemId_fkey" FOREIGN KEY ("entryItemId") REFERENCES "EntryItem" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Populate entryReceiptId from the entryItem's entryReceiptId
INSERT INTO "new_ClearedItem" ("clearKjQuantity", "clearQuantity", "clearanceReceiptId", "createdAt", "entryItemId", "id", "totalAmount", "updatedAt", "entryReceiptId")
SELECT 
    ci."clearKjQuantity", 
    ci."clearQuantity", 
    ci."clearanceReceiptId", 
    ci."createdAt", 
    ci."entryItemId", 
    ci."id", 
    ci."totalAmount", 
    ci."updatedAt",
    ei."entryReceiptId"
FROM "ClearedItem" ci
INNER JOIN "EntryItem" ei ON ci."entryItemId" = ei."id";

DROP TABLE "ClearedItem";
ALTER TABLE "new_ClearedItem" RENAME TO "ClearedItem";
CREATE INDEX "ClearedItem_clearanceReceiptId_idx" ON "ClearedItem"("clearanceReceiptId");
CREATE INDEX "ClearedItem_entryReceiptId_idx" ON "ClearedItem"("entryReceiptId");
CREATE INDEX "ClearedItem_entryItemId_idx" ON "ClearedItem"("entryItemId");
PRAGMA foreign_key_check("ClearedItem");
PRAGMA foreign_keys=ON;
