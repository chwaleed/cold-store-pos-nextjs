/*
  Warnings:

  - You are about to drop the `OnSaleProduct` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Product` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ProductStock` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ShopData` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Transaction` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `User` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "OnSaleProduct";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "Product";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "ProductStock";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "ShopData";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "Transaction";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "User";
PRAGMA foreign_keys=on;

-- CreateTable
CREATE TABLE "Customer" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "fatherName" TEXT,
    "cnic" TEXT,
    "phone" TEXT,
    "address" TEXT,
    "village" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "ProductType" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "ProductSubType" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "typeId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ProductSubType_typeId_fkey" FOREIGN KEY ("typeId") REFERENCES "ProductType" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Room" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "capacity" INTEGER,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "PackType" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "rentPerDay" REAL NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "EntryReceipt" (
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

-- CreateTable
CREATE TABLE "EntryItem" (
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
    "kjUnitPrice" REAL,
    "kjTotal" REAL,
    "grandTotal" REAL NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "EntryItem_entryReceiptId_fkey" FOREIGN KEY ("entryReceiptId") REFERENCES "EntryReceipt" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "EntryItem_productTypeId_fkey" FOREIGN KEY ("productTypeId") REFERENCES "ProductType" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "EntryItem_productSubTypeId_fkey" FOREIGN KEY ("productSubTypeId") REFERENCES "ProductSubType" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "EntryItem_packTypeId_fkey" FOREIGN KEY ("packTypeId") REFERENCES "PackType" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "EntryItem_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "Room" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ClearanceReceipt" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "clearanceNo" TEXT NOT NULL,
    "customerId" INTEGER NOT NULL,
    "entryReceiptId" INTEGER NOT NULL,
    "carNo" TEXT,
    "clearanceDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "totalRent" REAL NOT NULL,
    "description" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ClearanceReceipt_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ClearanceReceipt_entryReceiptId_fkey" FOREIGN KEY ("entryReceiptId") REFERENCES "EntryReceipt" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ClearedItem" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "clearanceReceiptId" INTEGER NOT NULL,
    "entryItemId" INTEGER NOT NULL,
    "quantityCleared" REAL NOT NULL,
    "daysStored" INTEGER NOT NULL,
    "rentPerDay" REAL NOT NULL,
    "totalRent" REAL NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ClearedItem_clearanceReceiptId_fkey" FOREIGN KEY ("clearanceReceiptId") REFERENCES "ClearanceReceipt" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ClearedItem_entryItemId_fkey" FOREIGN KEY ("entryItemId") REFERENCES "EntryItem" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Ledger" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "customerId" INTEGER NOT NULL,
    "invoiceId" INTEGER,
    "description" TEXT NOT NULL,
    "debitAmount" REAL NOT NULL DEFAULT 0,
    "creditAmount" REAL NOT NULL DEFAULT 0,
    "isDiscount" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Ledger_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Customer_cnic_key" ON "Customer"("cnic");

-- CreateIndex
CREATE INDEX "Customer_name_idx" ON "Customer"("name");

-- CreateIndex
CREATE INDEX "Customer_cnic_idx" ON "Customer"("cnic");

-- CreateIndex
CREATE INDEX "Customer_phone_idx" ON "Customer"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "ProductType_name_key" ON "ProductType"("name");

-- CreateIndex
CREATE INDEX "ProductSubType_typeId_idx" ON "ProductSubType"("typeId");

-- CreateIndex
CREATE UNIQUE INDEX "ProductSubType_typeId_name_key" ON "ProductSubType"("typeId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "Room_name_key" ON "Room"("name");

-- CreateIndex
CREATE UNIQUE INDEX "PackType_name_key" ON "PackType"("name");

-- CreateIndex
CREATE UNIQUE INDEX "EntryReceipt_receiptNo_key" ON "EntryReceipt"("receiptNo");

-- CreateIndex
CREATE INDEX "EntryReceipt_customerId_idx" ON "EntryReceipt"("customerId");

-- CreateIndex
CREATE INDEX "EntryReceipt_receiptNo_idx" ON "EntryReceipt"("receiptNo");

-- CreateIndex
CREATE INDEX "EntryReceipt_entryDate_idx" ON "EntryReceipt"("entryDate");

-- CreateIndex
CREATE INDEX "EntryItem_entryReceiptId_idx" ON "EntryItem"("entryReceiptId");

-- CreateIndex
CREATE INDEX "EntryItem_productTypeId_idx" ON "EntryItem"("productTypeId");

-- CreateIndex
CREATE INDEX "EntryItem_roomId_idx" ON "EntryItem"("roomId");

-- CreateIndex
CREATE UNIQUE INDEX "ClearanceReceipt_clearanceNo_key" ON "ClearanceReceipt"("clearanceNo");

-- CreateIndex
CREATE INDEX "ClearanceReceipt_customerId_idx" ON "ClearanceReceipt"("customerId");

-- CreateIndex
CREATE INDEX "ClearanceReceipt_clearanceNo_idx" ON "ClearanceReceipt"("clearanceNo");

-- CreateIndex
CREATE INDEX "ClearanceReceipt_clearanceDate_idx" ON "ClearanceReceipt"("clearanceDate");

-- CreateIndex
CREATE INDEX "ClearedItem_clearanceReceiptId_idx" ON "ClearedItem"("clearanceReceiptId");

-- CreateIndex
CREATE INDEX "ClearedItem_entryItemId_idx" ON "ClearedItem"("entryItemId");

-- CreateIndex
CREATE INDEX "Ledger_customerId_idx" ON "Ledger"("customerId");

-- CreateIndex
CREATE INDEX "Ledger_createdAt_idx" ON "Ledger"("createdAt");
