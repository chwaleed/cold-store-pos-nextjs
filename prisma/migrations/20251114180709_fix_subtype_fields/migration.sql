/*
  Warnings:

  - You are about to drop the column `typeId` on the `ProductSubType` table. All the data in the column will be lost.
  - Added the required column `productTypeId` to the `ProductSubType` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_ProductSubType" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "productTypeId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ProductSubType_productTypeId_fkey" FOREIGN KEY ("productTypeId") REFERENCES "ProductType" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
-- Copy typeId data to productTypeId
INSERT INTO "new_ProductSubType" ("id", "productTypeId", "name", "createdAt", "updatedAt") 
SELECT "id", "typeId", "name", "createdAt", "updatedAt" FROM "ProductSubType";
DROP TABLE "ProductSubType";
ALTER TABLE "new_ProductSubType" RENAME TO "ProductSubType";
CREATE INDEX "ProductSubType_productTypeId_idx" ON "ProductSubType"("productTypeId");
CREATE UNIQUE INDEX "ProductSubType_productTypeId_name_key" ON "ProductSubType"("productTypeId", "name");
PRAGMA foreign_key_check("ProductSubType");
PRAGMA foreign_keys=ON;
