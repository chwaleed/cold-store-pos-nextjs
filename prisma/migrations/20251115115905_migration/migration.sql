-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_ClearedItem" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "clearanceReceiptId" INTEGER NOT NULL,
    "entryReceiptId" INTEGER NOT NULL,
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
INSERT INTO "new_ClearedItem" ("clearKjQuantity", "clearQuantity", "clearanceReceiptId", "createdAt", "entryItemId", "entryReceiptId", "id", "totalAmount", "updatedAt") SELECT "clearKjQuantity", "clearQuantity", "clearanceReceiptId", "createdAt", "entryItemId", "entryReceiptId", "id", "totalAmount", "updatedAt" FROM "ClearedItem";
DROP TABLE "ClearedItem";
ALTER TABLE "new_ClearedItem" RENAME TO "ClearedItem";
CREATE INDEX "ClearedItem_clearanceReceiptId_idx" ON "ClearedItem"("clearanceReceiptId");
CREATE INDEX "ClearedItem_entryReceiptId_idx" ON "ClearedItem"("entryReceiptId");
CREATE INDEX "ClearedItem_entryItemId_idx" ON "ClearedItem"("entryItemId");
PRAGMA foreign_key_check("ClearedItem");
PRAGMA foreign_keys=ON;
