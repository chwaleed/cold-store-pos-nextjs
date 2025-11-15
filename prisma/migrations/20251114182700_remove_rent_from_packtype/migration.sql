/*
  Warnings:

  - You are about to drop the column `rentPerDay` on the `PackType` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_PackType" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_PackType" ("createdAt", "id", "name", "updatedAt") SELECT "createdAt", "id", "name", "updatedAt" FROM "PackType";
DROP TABLE "PackType";
ALTER TABLE "new_PackType" RENAME TO "PackType";
CREATE UNIQUE INDEX "PackType_name_key" ON "PackType"("name");
PRAGMA foreign_key_check("PackType");
PRAGMA foreign_keys=ON;
