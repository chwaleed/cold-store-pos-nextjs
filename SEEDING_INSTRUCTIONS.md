# Database Seeding Instructions

This guide explains how to seed your database with test data for the Cold Storage Management System.

## Prerequisites

- Node.js installed
- Database configured (SQLite)
- Prisma CLI installed

## Quick Start

### 1. Reset and Seed Database

```bash
# Reset database and run migrations
npx prisma migrate reset

# This will automatically run the seeder after reset
```

### 2. Seed Only (Without Reset)

```bash
# Run the seeder manually
npm run seed
```

Or using Prisma:

```bash
npx prisma db seed
```

## What Gets Seeded

The seeder creates a complete test dataset including:

### Master Data

- **Settings**: Business name, address, phone, currency
- **Product Types**: Potato (آلو), Onion (پیاز), Garlic (لہسن)
- **Product SubTypes**: Cardinal, Red, White varieties
- **Rooms**: 2 Cold Rooms + 1 Hot Room
- **Pack Types**: Bori (بوری), Jali (جالی)

### Customers

- 3 test customers with Urdu names
- Complete contact information
- Village and address details

### Expense Categories & Expenses

- Electricity (بجلی)
- Salary (تنخواہ)
- Maintenance (مرمت)
- Sample expenses for the last 3 days

### Entry Receipts

- 3 entry receipts across 3 customers
- Multiple entry items with different products
- Includes Khali Jali (empty crates) tracking
- Distributed across different rooms

### Clearance Receipts

- 1 partial clearance receipt
- Demonstrates partial quantity clearance
- Includes discount handling
- Updates remaining quantities

### Ledger Entries

- Rent charges for all entries
- Direct cash payments (advances)
- Clearance payments
- Discount entries

### Cash Book

- Expense outflows
- Clearance payment inflows
- Direct cash payment inflows
- Linked to source transactions

### Daily Cash Summaries

- 3 days of cash summaries
- Opening and closing balances
- Reconciliation status
- Tracks total inflows/outflows

## Test Scenarios Covered

### 1. Complete Entry Flow

- Customer brings inventory
- Multiple items with different products
- Khali Jali tracking
- Rent charges added to ledger

### 2. Partial Clearance Flow

- Customer clears partial quantity
- Remaining quantity updated
- Payment received
- Discount applied
- Cash book updated

### 3. Direct Cash Payments

- Advance payments
- Partial payments
- Tracked in ledger and cash book

### 4. Expense Management

- Multiple expense categories
- Daily expenses recorded
- Cash book outflows created

### 5. Cash Book Integration

- All transactions reflected
- Daily summaries calculated
- Opening/closing balances tracked

## Verify Seeded Data

After seeding, you can verify the data:

```bash
# Open Prisma Studio to browse data
npx prisma studio
```

Or check counts programmatically:

```bash
# Run the test script
node test-cashbook-seeder.js
```

## Customer Balances After Seeding

### Customer 1 (احمد علی)

- Total Rent: 7,500 PKR
- Payments: 3,000 PKR (advance) + 2,550 PKR (clearance)
- Discount: 200 PKR
- **Balance Due**: 1,750 PKR

### Customer 2 (حسن رضا)

- Total Rent: 7,500 PKR
- Payments: 5,000 PKR (advance)
- **Balance Due**: 2,500 PKR

### Customer 3 (فاطمہ بی بی)

- Total Rent: 4,800 PKR
- Payments: 0 PKR
- **Balance Due**: 4,800 PKR

## Inventory Status After Seeding

### Customer 1

- **Potato Cardinal**: 50/100 remaining (50 cleared)
- **Onion White**: 50/50 remaining (not cleared)

### Customer 2

- **Potato Red**: 150/150 remaining (not cleared)

### Customer 3

- **Garlic**: 80/80 remaining (not cleared)

## Cash Book Status

### Opening Balance (2 days ago): 50,000 PKR

### Transactions:

- Day 1: -15,000 (Electricity)
- Day 2: +5,000 (Advance) -25,000 (Salary)
- Day 3: +3,000 (Advance) +2,550 (Clearance) -5,000 (Maintenance)

### Current Balance: 15,550 PKR

## Customizing Seed Data

To modify the seed data, edit `prisma/seed.ts`:

1. Adjust quantities and prices
2. Add more customers
3. Create additional transactions
4. Modify date ranges
5. Add more product types

After making changes, run:

```bash
npm run seed
```

## Troubleshooting

### Error: "Module not found"

```bash
npm install
npx prisma generate
```

### Error: "Database locked"

```bash
# Stop the development server
# Then run seed again
npm run seed
```

### Error: "Unique constraint failed"

```bash
# Reset the database first
npx prisma migrate reset
```

## Clean Database

To start fresh:

```bash
# This will delete all data and re-run migrations
npx prisma migrate reset --skip-seed

# Then seed again if needed
npm run seed
```

## Notes

- The seeder uses realistic Urdu names and terms
- All dates are relative to current date
- Prices are in PKR (Pakistani Rupees)
- Receipt numbers follow the format: CS-YYYYMMDD-XXXX
- All foreign key relationships are properly maintained
- Partial clearances demonstrate remaining quantity tracking
