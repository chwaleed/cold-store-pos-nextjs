-- Remove CNIC column from Customer table
PRAGMA foreign_keys=off;

-- Drop CNIC related indexes if they exist
DROP INDEX IF EXISTS "Customer_cnic_key";
DROP INDEX IF EXISTS "Customer_cnic_idx";

-- Create a new Customer table without the 'cnic' column and copy the data
CREATE TABLE "Customer_new" (
  "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
  "name" TEXT NOT NULL,
  "fatherName" TEXT,
  "phone" TEXT,
  "address" TEXT,
  "village" TEXT,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL
);

INSERT INTO "Customer_new" ("id", "name", "fatherName", "phone", "address", "village", "createdAt", "updatedAt")
SELECT "id", "name", "fatherName", "phone", "address", "village", "createdAt", "updatedAt" FROM "Customer";

DROP TABLE "Customer";
ALTER TABLE "Customer_new" RENAME TO "Customer";

-- Recreate indexes (except CNIC ones)
CREATE INDEX IF NOT EXISTS "Customer_name_idx" ON "Customer"("name");
CREATE INDEX IF NOT EXISTS "Customer_phone_idx" ON "Customer"("phone");

PRAGMA foreign_keys=on;
