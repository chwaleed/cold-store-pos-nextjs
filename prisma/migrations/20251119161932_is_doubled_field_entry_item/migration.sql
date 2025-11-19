-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_EntryItem" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "entryReceiptId" INTEGER NOT NULL,
    "productTypeId" INTEGER NOT NULL,
    "productSubTypeId" INTEGER,
    "packTypeId" INTEGER NOT NULL,
    "roomId" INTEGER NOT NULL,
    "boxNo" TEXT,
    "marka" TEXT,
    "quantity" REAL NOT NULL,
    "remainingQuantity" REAL NOT NULL,
    "unitPrice" REAL NOT NULL,
    "totalPrice" REAL NOT NULL,
    "hasKhaliJali" BOOLEAN NOT NULL DEFAULT false,
    "kjQuantity" REAL,
    "remainingKjQuantity" REAL,
    "kjUnitPrice" REAL,
    "kjTotal" REAL,
    "isDoubled" BOOLEAN NOT NULL DEFAULT false,
    "grandTotal" REAL NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "EntryItem_entryReceiptId_fkey" FOREIGN KEY ("entryReceiptId") REFERENCES "EntryReceipt" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "EntryItem_productTypeId_fkey" FOREIGN KEY ("productTypeId") REFERENCES "ProductType" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "EntryItem_productSubTypeId_fkey" FOREIGN KEY ("productSubTypeId") REFERENCES "ProductSubType" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "EntryItem_packTypeId_fkey" FOREIGN KEY ("packTypeId") REFERENCES "PackType" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "EntryItem_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "Room" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_EntryItem" ("boxNo", "createdAt", "entryReceiptId", "grandTotal", "hasKhaliJali", "id", "kjQuantity", "kjTotal", "kjUnitPrice", "marka", "packTypeId", "productSubTypeId", "productTypeId", "quantity", "remainingKjQuantity", "remainingQuantity", "roomId", "totalPrice", "unitPrice", "updatedAt") SELECT "boxNo", "createdAt", "entryReceiptId", "grandTotal", "hasKhaliJali", "id", "kjQuantity", "kjTotal", "kjUnitPrice", "marka", "packTypeId", "productSubTypeId", "productTypeId", "quantity", "remainingKjQuantity", "remainingQuantity", "roomId", "totalPrice", "unitPrice", "updatedAt" FROM "EntryItem";
DROP TABLE "EntryItem";
ALTER TABLE "new_EntryItem" RENAME TO "EntryItem";
CREATE INDEX "EntryItem_entryReceiptId_idx" ON "EntryItem"("entryReceiptId");
CREATE INDEX "EntryItem_productTypeId_idx" ON "EntryItem"("productTypeId");
CREATE INDEX "EntryItem_roomId_idx" ON "EntryItem"("roomId");
PRAGMA foreign_key_check("EntryItem");
PRAGMA foreign_keys=ON;
