# Production Database Migration Guide

## Overview

This guide will help you safely apply 8 migrations created between Dec 12-14, 2025 to your production database without data corruption.

## Migrations to Apply (in order)

1. `20251212183352_dicountfieldadded` - Adds discount field
2. `20251212184332_cascade_delete_ledger_entries` - Adds cascade deletes
3. `20251213070731_add_cascade_deletes` - More cascade deletes
4. `20251213161849_convert_discount_to_is_discount` - Converts discount to boolean
5. `20251213164325_add_cash_book_models` - Adds cash book tables
6. `20251213172935_add_opening_balance_audit_trail` - Adds audit trail
7. `20251214112424_add_is_direct_cash_to_ledger` - Adds direct cash flag to ledger
8. `20251214130327_add_is_direct_cash_to_cash_book` - Adds direct cash flag to cash book

---

## Pre-Migration Checklist

### 1. **BACKUP YOUR PRODUCTION DATABASE** (CRITICAL!)

```bash
# For SQLite (if production uses SQLite)
copy "path\to\production\database.db" "path\to\backup\database_backup_2025-12-14.db"

# For PostgreSQL
pg_dump -U username -d database_name -F c -f backup_2025-12-14.dump

# For MySQL
mysqldump -u username -p database_name > backup_2025-12-14.sql
```

### 2. **Test on Staging First**

- Apply migrations to a staging/test environment with production data copy
- Verify all features work correctly
- Check data integrity

### 3. **Schedule Maintenance Window**

- Notify users of brief downtime
- Choose low-traffic time
- Estimate 5-10 minutes for migration

---

## Migration Steps

### Step 1: Prepare Production Environment

1. **Stop your production application**

   ```bash
   # Stop your Next.js server or Docker container
   ```

2. **Set production DATABASE_URL**
   ```bash
   # Create/update .env.production file
   DATABASE_URL="your_production_database_url"
   ```

### Step 2: Verify Migration Status

```bash
# Check which migrations are already applied
npx prisma migrate status --schema=./prisma/schema.prisma
```

This will show:

- ✅ Applied migrations
- ⚠️ Pending migrations (these need to be applied)

### Step 3: Apply Migrations Safely

**Option A: Automatic Migration (Recommended)**

```bash
# This applies all pending migrations in order
npx prisma migrate deploy
```

**Option B: Manual Step-by-Step (If you want more control)**

```bash
# Apply migrations one at a time and verify after each
npx prisma migrate resolve --applied 20251212183352_dicountfieldadded
npx prisma migrate resolve --applied 20251212184332_cascade_delete_ledger_entries
# ... continue for each migration
```

### Step 4: Verify Migration Success

```bash
# Check migration status again
npx prisma migrate status

# Generate Prisma Client with new schema
npx prisma generate

# Verify database schema
npx prisma db pull
```

### Step 5: Data Integrity Checks

Run these queries to verify data integrity:

```sql
-- Check if new fields exist and have default values
SELECT COUNT(*) FROM Ledger WHERE isDirectCash IS NULL;
SELECT COUNT(*) FROM CashBook WHERE isDirectCash IS NULL;

-- Verify cascade deletes are working (check foreign keys)
PRAGMA foreign_keys; -- For SQLite
-- Should return 1 (enabled)

-- Check cash book tables exist
SELECT name FROM sqlite_master WHERE type='table' AND name LIKE 'Cash%';
```

### Step 6: Start Application

```bash
# Start your production server
npm run start
# or
npm run dev
```

### Step 7: Post-Migration Testing

Test these features:

- ✅ Create new entries with discount
- ✅ Delete operations (verify cascade works)
- ✅ Cash book functionality
- ✅ Direct cash transactions
- ✅ Ledger operations
- ✅ Reports generation

---

## Rollback Plan (If Something Goes Wrong)

### Immediate Rollback Steps:

1. **Stop the application immediately**

   ```bash
   # Stop server
   ```

2. **Restore from backup**

   ```bash
   # For SQLite
   copy "backup_2025-12-14.db" "production.db"

   # For PostgreSQL
   pg_restore -U username -d database_name backup_2025-12-14.dump

   # For MySQL
   mysql -u username -p database_name < backup_2025-12-14.sql
   ```

3. **Revert to previous code version**

   ```bash
   git checkout <previous-commit-hash>
   npm install
   npx prisma generate
   ```

4. **Restart application with old version**

---

## Migration Safety Features

These migrations are designed to be safe:

1. **Adding new fields** - Uses default values, won't break existing data
2. **Cascade deletes** - Only affects future delete operations
3. **Boolean conversion** - Prisma handles data type conversion safely
4. **New tables** - Doesn't affect existing tables

## Common Issues & Solutions

### Issue 1: "Migration failed to apply"

**Solution:** Check database connection, ensure no other processes are using the database

### Issue 2: "Foreign key constraint failed"

**Solution:** Ensure no orphaned records exist before applying cascade deletes

### Issue 3: "Column already exists"

**Solution:** Migration may have partially applied. Use `prisma migrate resolve` to mark it as applied

---

## Production-Specific Commands

```bash
# Full migration workflow for production
npm run build                    # Build application first
npx prisma migrate deploy        # Apply migrations
npx prisma generate              # Generate client
npm run start                    # Start production server
```

---

## Monitoring After Migration

Monitor these for 24-48 hours:

- Application logs for errors
- Database performance
- User-reported issues
- Data consistency in reports

---

## Emergency Contacts

- Database Admin: [Your DBA contact]
- DevOps Team: [Your DevOps contact]
- Backup Location: [Your backup storage location]

---

## Notes

- All migrations are **additive** (adding fields/tables), making them low-risk
- The `isDirectCash` fields default to `false`, preserving existing behavior
- Cascade deletes only affect future operations, not existing data
- Cash book is a new feature, so no existing data to migrate

**Estimated Downtime:** 5-10 minutes
**Risk Level:** Low (with proper backup)
**Reversibility:** High (can rollback easily)
