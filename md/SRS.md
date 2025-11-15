# Software Requirements Specification (SRS)

## Cold Store Management & POS System

**Version:** 1.0  
**Date:** November 14, 2025  
**Prepared For:** Cold Storage Facility - Pir Jo Goth, Sindh, Pakistan

---

## Table of Contents

1. [Introduction](#1-introduction)
2. [System Overview](#2-system-overview)
3. [Functional Requirements](#3-functional-requirements)
4. [Non-Functional Requirements](#4-non-functional-requirements)
5. [System Workflows](#5-system-workflows)
6. [User Interface Requirements](#6-user-interface-requirements)
7. [Data Requirements](#7-data-requirements)
8. [Business Rules](#8-business-rules)
9. [System Constraints](#9-system-constraints)
10. [Acceptance Criteria](#10-acceptance-criteria)

---

## 1. Introduction

### 1.1 Purpose

This document specifies the complete requirements for a Point of Sale (POS) and Management System for a cold storage facility. The system will manage inventory storage, rent calculations, customer accounts, payments, and financial reporting.

### 1.2 Scope

The system will:

- Manage farmer/customer information and accounts
- Track inventory storage in cold and hot rooms
- Calculate storage rent based on duration and pack type
- Process various payment methods and schedules
- Maintain customer ledgers with debit/credit entries
- Generate reports and receipts
- Operate as a standalone desktop application

### 1.3 Target Users

- **Primary Users:** Cold storage operators/staff
- **Secondary Users:** Management/owners for reports
- **Indirect Users:** Farmers/customers (receipt recipients)

### 1.4 Definitions & Acronyms

- **POS:** Point of Sale
- **Bori:** Sack/bag packaging type (بوری)
- **Jali:** Crate/basket packaging type (جالی)
- **Khali Jali:** Empty crate return charges
- **Marka:** Marking/label on packages
- **Clearance:** Process of removing items from storage
- **Ledger:** Financial record of customer transactions
- **SRS:** Software Requirements Specification

---

## 2. System Overview

### 2.1 System Context

The Cold Store Management System is a desktop application that will run locally on Windows computers at the cold storage facility. It will manage the complete lifecycle of agricultural products from entry to clearance.

### 2.2 System Architecture

```
┌─────────────────────────────────────────┐
│        Desktop Application (Tauri)       │
│                                          │
│  ┌────────────────────────────────────┐ │
│  │     Next.js Frontend (React)       │ │
│  │  - UI Components                   │ │
│  │  - Forms & Validation              │ │
│  │  - Reports & Dashboards            │ │
│  └────────────────────────────────────┘ │
│                   ↕                      │
│  ┌────────────────────────────────────┐ │
│  │     API Layer (Next.js Routes)     │ │
│  │  - Business Logic                  │ │
│  │  - Data Validation                 │ │
│  │  - Calculations                    │ │
│  └────────────────────────────────────┘ │
│                   ↕                      │
│  ┌────────────────────────────────────┐ │
│  │       Prisma ORM                   │ │
│  └────────────────────────────────────┘ │
│                   ↕                      │
│  ┌────────────────────────────────────┐ │
│  │       SQLite Database              │ │
│  │  - Local file storage              │ │
│  │  - No network required             │ │
│  └────────────────────────────────────┘ │
└─────────────────────────────────────────┘
```

### 2.3 Technology Stack

- **Frontend:** Next.js 14+, React 18+, TypeScript, Tailwind CSS
- **Database:** SQLite (local file-based)
- **ORM:** Prisma
- **Desktop Framework:** Tauri
- **UI Components:** shadcn/ui
- **Form Handling:** React Hook Form + Zod validation
- **Date Handling:** date-fns
- **Charts/Reports:** Recharts

---

## 3. Functional Requirements

### 3.1 Customer Management Module

#### FR-CM-001: Add New Customer

**Priority:** HIGH  
**Description:** System shall allow adding new farmer/customer records

**Input Fields:**

- Customer Name (Required, String, Max 100 chars)
- Father's Name (Optional, String, Max 100 chars)
- CNIC (Optional, String, 13 digits, Unique)
- Phone Number (Optional, String, Max 15 chars)
- Address (Optional, Text)
- Village/Area (Optional, String, Max 100 chars)

**Business Rules:**

- Customer name is mandatory
- CNIC must be unique if provided
- System auto-generates Customer ID
- Creation timestamp is auto-recorded

**Output:** Customer created successfully with unique ID

---

#### FR-CM-002: Search Customers

**Priority:** HIGH  
**Description:** System shall provide customer search functionality

**Search Criteria:**

- By Name (partial match)
- By Phone Number
- By CNIC
- By Village
- By Customer ID

**Output:** List of matching customers with basic details

---

#### FR-CM-003: View Customer Details

**Priority:** HIGH  
**Description:** System shall display complete customer information

**Display Information:**

- Personal details
- Current active inventory items
- Total pending rent amount
- Recent transactions (last 10)
- Current ledger balance
- Payment history

---

#### FR-CM-004: Edit Customer Information

**Priority:** MEDIUM  
**Description:** System shall allow updating customer details

**Editable Fields:** All fields except Customer ID and creation date

**Business Rules:**

- Cannot change to duplicate CNIC
- Maintains audit trail of changes

---

#### FR-CM-005: Customer Ledger

**Priority:** HIGH  
**Description:** System shall maintain complete financial ledger per customer

**Ledger Entries Include:**

- Date and time of transaction
- Description of transaction
- Debit amount (rent charges, services)
- Credit amount (payments received, cash advances given)
- Running balance
- Reference to source document (inventory, clearance, payment)

**Calculation:**

- Balance = Previous Balance + Debits - Credits
- Positive balance = Customer owes money
- Negative balance = We owe customer money

---

### 3.2 System Configuration Module

#### FR-SC-001: Product Type Management

**Priority:** HIGH  
**Description:** System shall manage product categories

**Operations:**

- Add new product type (e.g., Potato, Onion, Garlic)
- Edit product type name
- Delete product type (if no inventory exists)
- View all product types

**Business Rules:**

- Product type names must be unique
- Cannot delete if associated inventory exists

---

#### FR-SC-002: Product Subtype Management

**Priority:** HIGH  
**Description:** System shall manage product varieties under each type

**Operations:**

- Add subtype under product type (e.g., Cardinal under Potato)
- Edit subtype name
- Delete subtype (if no inventory exists)
- View subtypes by product type

**Business Rules:**

- Subtype names must be unique within a product type
- Cannot delete if associated inventory exists

---

#### FR-SC-003: Room Management

**Priority:** HIGH  
**Description:** System shall manage storage rooms

**Room Information:**

- Room Name (Required, Unique)
- Room Type (Required: COLD or HOT)
- Capacity (Optional, Integer)
- Active Status (Boolean)

**Operations:**

- Add new room
- Edit room details
- Deactivate/Activate room
- View current occupancy

**Business Rules:**

- Room names must be unique
- Cannot delete room with active inventory
- Can only deactivate (not delete)

---

#### FR-SC-004: Pack Type Management

**Priority:** HIGH  
**Description:** System shall manage packaging types

**Pack Types:**

- Bori (Sack/Bag)
- Jali (Crate/Basket)

**Operations:**

- Add new pack type
- Edit pack type name
- View all pack types

---

#### FR-SC-005: Rent Configuration

**Priority:** HIGH  
**Description:** System shall configure rent rates

**Configuration:**

- Rent per pack type per day
- Example: Bori = 2 PKR/day, Jali = 1.5 PKR/day

**Operations:**

- Set rent rate for each pack type
- Update rent rates
- View current rates
- Maintain history of rate changes

**Business Rules:**

- Each pack type must have a rent rate
- Rate changes only apply to new calculations
- Historical rates preserved for existing entries

---

### 3.3 Inventory Entry Module

#### FR-IE-001: Add Inventory Entry

**Priority:** HIGH  
**Description:** System shall record new inventory coming into storage

**Entry Header:**

- **Date:** Auto-populated with current date, editable
- **Receipt No:** Auto-generated unique number (Format: CS-YYYYMMDD-XXXX)
- **Customer:** Searchable dropdown, Required
- **Car Number:** Text field, Required

**Entry Items (Array - Multiple items per entry):**

Each item contains:

1. **Product Type:** Dropdown, Required
2. **Product Subtype:** Dropdown (filtered by type), Optional
3. **Pack Type:** Dropdown (Bori/Jali), Required
4. **Room:** Dropdown (Cold/Hot rooms), Required
5. **Box Number:** Integer, Optional
6. **Marka (Marking):** Text, Optional
7. **Quantity:** Integer, Required, Min: 1
8. **Unit Price:** Decimal, Required, Min: 0
9. **Total Price:** Auto-calculated (Quantity × Unit Price)

**Khali Jali Section (Checkbox):**

- If checked, show additional fields:
  - **KJ Quantity:** Integer, Required
  - **KJ Unit Price:** Decimal, Required
  - **KJ Total:** Auto-calculated (KJ Quantity × KJ Unit Price)

10. **Grand Total per Item:** Auto-calculated (Total Price + KJ Total)

**Form Totals:**

- **Overall Total:** Sum of all item Grand Totals

**Operations:**

- Add multiple items dynamically
- Remove items
- Save complete entry
- Print receipt after save
- Edit entry (within same day only)
- View entry details

**Business Rules:**

- Receipt number must be unique
- At least one item required
- All required fields must be filled
- Cannot save with duplicate receipt number
- Customer must be selected
- Quantity must be positive
- All items automatically marked as "STORED" status
- Remaining quantity = Initial quantity
- Entry creates NO ledger entry (no payment at this stage)

**Output:**

- Entry saved successfully
- Receipt generated
- Items added to inventory tracking
- Customer can see items in their account

---

#### FR-IE-002: View Inventory List

**Priority:** HIGH  
**Description:** System shall display all inventory entries

**List Columns:**

- Receipt Number
- Date
- Customer Name
- Car Number
- Total Items
- Total Amount
- Status (ACTIVE/PARTIAL_CLEARED/CLEARED)

**Filters:**

- By date range
- By customer
- By status
- By receipt number

**Actions:**

- View details
- Print receipt
- Edit (if same day)

---

#### FR-IE-003: View Inventory Details

**Priority:** HIGH  
**Description:** System shall show complete entry information

**Display:**

- Header information
- All items with details
- Item-wise status (STORED/PARTIAL_CLEARED/CLEARED)
- Remaining quantities
- Associated clearances (if any)

---

### 3.4 Clearance Module

#### FR-CL-001: Create Clearance

**Priority:** HIGH  
**Description:** System shall process product removal from storage

**Clearance Flow:**

**Step 1: Select Customer**

- Searchable customer dropdown
- Shows only customers with active inventory

**Step 2: Select Inventory Entry**

- Shows all active/partial entries for selected customer
- Displays entry details (date, receipt no, items)

**Step 3: Select Items to Clear**

- Shows all items from selected entry
- For each item display:
  - Product details
  - Original quantity
  - Already cleared quantity
  - Remaining quantity
  - Room location
  - Entry date

**Step 4: Specify Clearance Details**

**Clearance Header:**

- **Clearance Number:** Auto-generated (Format: CL-YYYYMMDD-XXXX)
- **Date:** Current date, editable
- **Car Number:** Text, Optional
- **Clearance Type:** Auto-determined (FULL/PARTIAL)

**For Each Selected Item:**

- **Quantity to Clear:** Integer, Required, Max = Remaining Quantity
- **Days Stored:** Auto-calculated (Clearance Date - Entry Date)
- **Rent Per Unit Per Day:** From configuration
- **Total Rent:** Auto-calculated (Quantity × Days × Rent Rate)

**Clearance Totals:**

- **Total Rent:** Sum of all item rents
- **Rent Paid:** Decimal input, Optional, Default: 0
- **Rent Pending:** Auto-calculated (Total Rent - Rent Paid)

**Step 5: Payment (Optional)**

- Can record payment now or later
- Payment amount can be 0, partial, or full

**Operations:**

- Clear selected items
- Calculate rent automatically
- Record payment (if any)
- Update inventory item status
- Create ledger entries
- Generate clearance receipt

**Business Rules:**

- Cannot clear more than remaining quantity
- Days stored = Calendar days (ceiling function)
- Minimum days stored = 1 (same day clearance = 1 day rent)
- Clearance type:
  - FULL: All items from entry cleared completely
  - PARTIAL: Some items or partial quantities cleared
- Item status after clearance:
  - If remaining quantity = 0: CLEARED
  - If remaining quantity > 0: PARTIAL_CLEARED
- Inventory entry status:
  - If all items cleared: CLEARED
  - If some items/partial cleared: PARTIAL_CLEARED
  - Otherwise: ACTIVE

**Ledger Entries Created:**

1. **Debit Entry (Rent Charge):**

   - Description: "Clearance [CL-No] - Storage Rent"
   - Debit: Total Rent
   - Credit: 0
   - Balance: Previous Balance + Total Rent

2. **Credit Entry (If Payment Made):**
   - Description: "Payment for Clearance [CL-No]"
   - Debit: 0
   - Credit: Rent Paid
   - Balance: Previous Balance - Rent Paid

**Output:**

- Clearance record saved
- Inventory updated
- Ledger updated
- Clearance receipt printed

---

#### FR-CL-002: Rent Calculation Logic

**Priority:** HIGH  
**Description:** System shall calculate storage rent accurately

**Formula:**

```
For each item being cleared:
  Days Stored = CEILING((Clearance Date - Entry Date) / 1 day)
  Rent Per Unit = Rent Rate from Pack Type Configuration
  Total Item Rent = Quantity Cleared × Days Stored × Rent Per Unit

Total Clearance Rent = SUM(All Item Rents)
```

**Examples:**

**Example 1: Simple Clearance**

- Entry Date: Jan 1, 2025
- Clearance Date: Jan 15, 2025
- Days Stored: 15 days
- Pack Type: Bori, Rent Rate: 2 PKR/day
- Quantity: 100 Bori
- Total Rent: 100 × 15 × 2 = 3,000 PKR

**Example 2: Multiple Items**

- Item 1: 50 Bori × 20 days × 2 PKR = 2,000 PKR
- Item 2: 30 Jali × 20 days × 1.5 PKR = 900 PKR
- Total Rent: 2,900 PKR

**Example 3: Same Day Clearance**

- Entry Date: Jan 10, 2025 10:00 AM
- Clearance Date: Jan 10, 2025 4:00 PM
- Days Stored: 1 day (minimum)
- Rent charged for 1 day

---

#### FR-CL-003: View Clearance List

**Priority:** HIGH  
**Description:** System shall display all clearances

**List Columns:**

- Clearance Number
- Date
- Customer Name
- Receipt Number (original inventory)
- Type (FULL/PARTIAL)
- Total Rent
- Rent Paid
- Rent Pending
- Status

**Filters:**

- By date range
- By customer
- By clearance type
- By payment status (Paid/Pending/Partial)

**Actions:**

- View details
- Print receipt
- Record additional payment

---

#### FR-CL-004: View Clearance Details

**Priority:** HIGH  
**Description:** System shall show complete clearance information

**Display:**

- Clearance header details
- Items cleared with quantities
- Rent calculations breakdown
- Payment details
- Related payments
- Ledger entries created

---

### 3.5 Payment Module

#### FR-PM-001: Record Payment

**Priority:** HIGH  
**Description:** System shall record customer payments

**Payment Types:**

**Type 1: Rent Payment (Against Clearance)**

- Select customer
- Select pending clearance
- Record payment amount
- Payment can be partial or full

**Type 2: Advance Payment**

- Customer pays in advance
- Not linked to specific clearance
- Adjusts customer balance

**Type 3: General Payment**

- Payment against overall balance
- Not linked to specific clearance

**Payment Form:**

- **Customer:** Dropdown, Required
- **Date:** Date picker, Default: Today
- **Clearance:** Dropdown (optional, shows pending clearances)
- **Amount:** Decimal, Required, Min: 0
- **Payment Type:** Dropdown (RENT/ADVANCE/GENERAL)
- **Payment Mode:** Dropdown (CASH/BANK/CHEQUE)
- **Reference:** Text (Cheque number, Transaction ID)
- **Notes:** Text area (Optional)

**Operations:**

- Record payment
- Update clearance pending amount (if linked)
- Create ledger entry
- Print payment receipt

**Business Rules:**

- Payment amount must be positive
- Cannot pay more than pending for linked clearance
- Payment creates CREDIT ledger entry
- Updates customer balance

**Ledger Entry Created:**

- Description: "Payment received - [Payment Type]"
- Debit: 0
- Credit: Payment Amount
- Balance: Previous Balance - Payment Amount

**Output:**

- Payment recorded successfully
- Ledger updated
- Receipt printed

---

#### FR-PM-002: Cash Advance to Customer

**Priority:** HIGH  
**Description:** System shall record cash given to customers

**Use Case:**
Farmers sometimes request cash advances. This creates a debt that customer owes.

**Cash Advance Form:**

- **Customer:** Dropdown, Required
- **Date:** Date picker, Default: Today
- **Amount:** Decimal, Required, Min: 0
- **Purpose:** Text area, Optional
- **Notes:** Text area, Optional

**Operations:**

- Record cash advance
- Create ledger entry (DEBIT - customer owes this)
- Update customer balance
- Print receipt

**Business Rules:**

- Advance creates DEBIT entry in ledger
- Increases customer's debt
- Can be adjusted against future clearances
- Status: PENDING until adjusted/returned

**Ledger Entry Created:**

- Description: "Cash advance given - [Purpose]"
- Debit: Advance Amount
- Credit: 0
- Balance: Previous Balance + Advance Amount

**Output:**

- Cash advance recorded
- Customer balance increased
- Receipt generated

---

#### FR-PM-003: View Payment History

**Priority:** MEDIUM  
**Description:** System shall display all payments

**List Columns:**

- Date
- Customer Name
- Payment Type
- Amount
- Payment Mode
- Reference
- Clearance No (if linked)

**Filters:**

- By date range
- By customer
- By payment type
- By payment mode

---

### 3.6 Reports Module

#### FR-RP-001: Dashboard

**Priority:** HIGH  
**Description:** System shall display key metrics on dashboard

**Dashboard Widgets:**

1. **Storage Summary**

   - Total items in storage
   - By room (Cold/Hot)
   - By pack type (Bori/Jali)
   - Total occupied space

2. **Financial Summary**

   - Total pending rent
   - Today's collections
   - This month's revenue
   - Outstanding balance (by customer)

3. **Recent Activity**

   - Last 10 inventory entries
   - Last 10 clearances
   - Recent payments

4. **Quick Stats**
   - Total active customers
   - Active inventory entries
   - Pending clearances
   - Low stock alerts (optional)

---

#### FR-RP-002: Inventory Report

**Priority:** HIGH  
**Description:** System shall generate current stock reports

**Report Types:**

**1. Current Stock by Room**

- Room wise breakdown
- Product type distribution
- Quantities
- Customer distribution

**2. Current Stock by Customer**

- Customer name
- Active entries
- Total quantities
- Storage duration
- Estimated pending rent

**3. Current Stock by Product**

- Product type and subtype
- Total quantities
- Room locations
- Customer details

**4. Long Storage Items**

- Items stored > X days
- Sorted by storage duration
- Customer details
- Accumulated rent

**Filters:**

- Date range
- Customer
- Room
- Product type
- Storage duration

**Export:** PDF, Excel, CSV

---

#### FR-RP-003: Financial Reports

**Priority:** HIGH  
**Description:** System shall generate financial reports

**Report Types:**

**1. Daily Collection Report**

- Date wise collection
- Payment breakdown by type
- Payment mode distribution
- Total collected

**2. Monthly Revenue Report**

- Month wise revenue
- Clearance wise breakdown
- Payment trends
- Outstanding amounts

**3. Customer Balance Report**

- All customers with balances
- Debit/Credit summary
- Pending amounts
- Payment history

**4. Clearance Summary Report**

- Date range clearances
- Total rent charged
- Total rent collected
- Pending amounts
- By customer breakdown

**5. Customer Ledger Statement**

- Complete transaction history
- Date, description, debit, credit, balance
- Opening and closing balance
- Filterable by date range

**Filters:**

- Date range (mandatory)
- Customer (optional)
- Report type specific filters

**Export:** PDF, Excel, CSV

---

#### FR-RP-004: Operational Reports

**Priority:** MEDIUM  
**Description:** System shall generate operational reports

**Report Types:**

**1. Daily Activity Report**

- Entries added
- Clearances processed
- Payments received
- Items count

**2. Room Utilization Report**

- Room wise occupancy
- Capacity vs occupied
- Product distribution
- Utilization percentage

**3. Customer Activity Report**

- Customer transactions
- Storage patterns
- Payment behavior
- Active/inactive customers

**Export:** PDF, Excel

---

### 3.7 Printing & Documents

#### FR-PR-001: Inventory Entry Receipt

**Priority:** HIGH  
**Description:** System shall print inventory receipt

**Receipt Contains:**

- Header: Cold Store name, address, phone
- Receipt number
- Date
- Customer details
- Car number
- Item-wise details:
  - Product type/subtype
  - Pack type
  - Room
  - Quantity
  - Unit price
  - Total price
  - Khali Jali details (if any)
  - Grand total per item
- Overall total
- Footer: Terms & conditions, signature lines

**Languages:** Urdu/English (configurable)

---

#### FR-PR-002: Clearance Receipt

**Priority:** HIGH  
**Description:** System shall print clearance receipt

**Receipt Contains:**

- Header: Cold Store name
- Clearance number
- Date
- Customer details
- Original receipt number
- Item-wise details:
  - Product details
  - Quantity cleared
  - Days stored
  - Rent per unit per day
  - Total rent
- Total rent
- Rent paid
- Rent pending
- Payment details (if any)
- Footer: Signature lines

---

#### FR-PR-003: Payment Receipt

**Priority:** HIGH  
**Description:** System shall print payment receipt

**Receipt Contains:**

- Header: Cold Store name
- Payment receipt number
- Date
- Customer details
- Amount received
- Payment mode
- Reference number
- Against clearance (if applicable)
- Previous balance
- New balance
- Footer: Signature, stamp

---

#### FR-PR-004: Customer Ledger Statement

**Priority:** MEDIUM  
**Description:** System shall print customer ledger

**Statement Contains:**

- Header: Cold Store name, period
- Customer details
- Opening balance
- Transaction details:
  - Date
  - Description
  - Debit
  - Credit
  - Balance
- Closing balance
- Summary: Total debits, credits
- Footer: Generated date, signature

---

### 3.8 Data Management

#### FR-DM-001: Database Backup

**Priority:** HIGH  
**Description:** System shall backup database

**Features:**

- Manual backup on demand
- Auto backup on application close
- Backup file naming: coldstore_backup_YYYYMMDD_HHMMSS.db
- Backup location: User selectable folder

**Operations:**

- Create backup
- Restore from backup
- Verify backup integrity

---

#### FR-DM-002: Data Export

**Priority:** MEDIUM  
**Description:** System shall export data

**Export Formats:**

- CSV (for data tables)
- Excel (for reports)
- PDF (for receipts and statements)

**Exportable Data:**

- Customer list
- Inventory list
- Clearance list
- Payment list
- Reports

---

## 4. Non-Functional Requirements

### 4.1 Performance Requirements

#### NFR-PF-001: Response Time

- Page load time: < 2 seconds
- Search results: < 1 second
- Form submission: < 3 seconds
- Report generation: < 5 seconds
- Receipt printing: < 2 seconds

#### NFR-PF-002: Capacity

- Support up to 10,000 customers
- Support up to 100,000 inventory entries per year
- Support up to 50,000 clearances per year
- Database size: Up to 5 GB

#### NFR-PF-003: Concurrent Operations

- Single user at a time (desktop app)
- No multi-user concurrency required

---

### 4.2 Usability Requirements

#### NFR-US-001: User Interface

- Clean, intuitive interface
- Urdu/English language support
- Keyboard shortcuts for common operations
- Minimal clicks to complete tasks
- Clear error messages
- Confirmation dialogs for critical actions

#### NFR-US-002: Accessibility

- Large, readable fonts
- High contrast UI
- Keyboard navigation support
- Touch-friendly (if touchscreen)

#### NFR-US-003: Learning Curve

- New user should be productive within 1 hour
- Basic operations without manual
- Context-sensitive help
- Tooltips for fields

---

### 4.3 Reliability Requirements

#### NFR-RL-001: Data Integrity

- All database operations must be transactional
- No data loss on application crash
- Data validation on all inputs
- Referential integrity maintained

#### NFR-RL-002: Availability

- 99% uptime during business hours
- Graceful error handling
- Auto-recovery from minor errors

#### NFR-RL-003: Backup & Recovery

- Daily automatic backups
- Manual backup option
- Restore functionality tested
- Backup verification

---

### 4.4 Security Requirements

#### NFR-SC-001: Data Security

- Database file encrypted
- No unauthorized file access
- Secure backup files

#### NFR-SC-002: User Authentication (Future)

- Optional login system
- Role-based access (admin, operator)
- Password protection

#### NFR-SC-003: Audit Trail

- Log critical operations
- Track who did what when (if multi-user)
- Cannot delete audit logs

---

### 4.5 Maintainability Requirements

#### NFR-MT-001: Code Quality

- Well-documented code
- Modular architecture
- Reusable components
- Follow TypeScript best practices

#### NFR-MT-002: Updates

- Easy to deploy updates
- No data loss during updates
- Backward compatible

---

## 5. System Workflows

### 5.1 Complete Business Flow

```
FARMER ARRIVES WITH PRODUCTS
         ↓
[1. INVENTORY ENTRY]
- Record farmer details
- Record product details
- Assign room and space
- Print receipt
- No payment at this stage
         ↓
[PRODUCTS STORED]
- Items remain in cold/hot room
- Rent accumulating daily
- Farmer can come anytime for clearance
         ↓
[2. CLEARANCE REQUEST]
- Farmer comes to take products
         ↓
[3. CLEARANCE PROCESS]
- Select farmer
- Select items to clear
- Calculate storage days
- Calculate total rent
         ↓
[4. PAYMENT OPTIONS]

Option A: Full Payment Now
- Pay total rent
- Clear ledger for this clearance
- Print receipt
- Release products

Option B: Partial Payment Now
- Pay some amount
- Remaining recorded as pending
- Print receipt
- Release products

Option C: No Payment Now
- Zero payment
- Full amount pending
- Print receipt
- Release products
- Pay later

Option D: Advance Adjusted
- Customer has advance balance
- Adjust from advance
- Print receipt
- Release products

         ↓
[5. FUTURE PAYMENTS]
- Customer can pay pending amounts anytime
- Can pay against specific clearance
- Can pay general amount
- Multiple payments allowed
         ↓
[6. LEDGER UPDATED]
- All transactions recorded
- Balance calculated
- Statement available anytime
```

---

### 5.2 Detailed Workflow: Inventory Entry

```
START
  ↓
[Open Inventory Entry Form]
  ↓
[Auto-fill Date] (Today)
  ↓
[Select/Search Customer]
  ↓
Is customer existing?
  ├─ No → [Create New Customer] → Continue
  └─ Yes → Continue
  ↓
[Enter Car Number]
  ↓
[Auto-generate Receipt Number]
  ↓
[ADD ITEMS Loop]
  ↓
[Select Product Type] (e.g., Potato)
  ↓
[Select Product Subtype] (e.g., Cardinal) [Optional]
  ↓
[Select Pack Type] (Bori or Jali)
  ↓
[Select Room] (Cold Room 1, Hot Room 2, etc.)
  ↓
[Enter Box Number] [Optional]
  ↓
[Enter Marka] [Optional]
  ↓
[Enter Quantity] (Number of packs)
  ↓
[Enter Unit Price] (Price per pack)
  ↓
[System Calculates: Total Price = Quantity × Unit Price]
  ↓
[Khali Jali Checkbox]
  ├─ Checked?
  │   ↓
  │  [Enter KJ Quantity]
  │   ↓
  │  [Enter KJ Unit Price]
  │   ↓
  │  [System Calculates: KJ Total = KJ Qty × KJ Price]
  │   ↓
  │  [System Calculates: Grand Total = Total Price + KJ Total]
  └─ Not Checked?
      ↓
     [Grand Total = Total Price]
  ↓
[Display Item in Table]
  ↓
Add more items?
  ├─ Yes → [Go to ADD ITEMS Loop]
  └─ No → Continue
  ↓
[System Calculates: Overall Total = Sum of all Grand Totals]
  ↓
[Review All Items]
  ↓
[Click Save]
  ↓
[Validate Form]
  ↓
Are all required fields filled?
  ├─ No → [Show Error] → [Fix Errors]
  └─ Yes → Continue
  ↓
[Save to Database]
  ├─ Create Inventory Entry
  ├─ Create Inventory Items
  └─ Set Status: ACTIVE
  ↓
[Show Success Message]
  ↓
[Generate Receipt]
  ↓
[Print Receipt]
  ↓
[Customer Takes Receipt]
  ↓
[Products Stored in Assigned Room]
  ↓
END
```

---

### 5.3 Detailed Workflow: Clearance Process

```
START
  ↓
[Open Clearance Form]
  ↓
[Select Customer]
  ↓
[System Fetches Customer's Active Inventories]
  ↓
Any active inventory?
  ├─ No → [Show Message: No items in storage] → END
  └─ Yes → Continue
  ↓
[Display Active Inventory Entries]
  ├─ Receipt No
  ├─ Date
  ├─ Total Items
  └─ Status
  ↓
[Select Inventory Entry to Clear]
  ↓
[System Displays All Items from Selected Entry]
For each item show:
  ├─ Product Type/Subtype
  ├─ Pack Type
  ├─ Room
  ├─ Original Quantity
  ├─ Already Cleared Quantity
  ├─ Remaining Quantity
  ├─ Entry Date
  └─ Checkbox to select
  ↓
[Select Items to Clear]
  ↓
For each selected item:
  ↓
[Enter Quantity to Clear]
  ↓
Is quantity valid?
  ├─ Quantity > Remaining? → [Show Error] → [Re-enter]
  └─ Valid → Continue
  ↓
[System Calculates Days Stored]
  Days = CEILING((Today - Entry Date) / 1 day)
  Minimum = 1 day
  ↓
[System Gets Rent Rate from Config]
  Based on Pack Type (Bori/Jali)
  ↓
[System Calculates Item Rent]
  Item Rent = Quantity to Clear × Days Stored × Rent Rate
  ↓
[Display Item Rent]
  ↓
All items processed?
  ├─ No → [Continue with next item]
  └─ Yes → Continue
  ↓
[System Calculates Total Rent]
  Total Rent = Sum of all Item Rents
  ↓
[Display Rent Breakdown]
  ├─ Item-wise rent
  ├─ Total days stored
  └─ Total rent
  ↓
[Enter Car Number] [Optional]
  ↓
[Auto-generate Clearance Number]
  ↓
[PAYMENT SECTION]
  ↓
[Enter Rent Paid Amount] (Default: 0)
  ↓
[System Calculates Rent Pending]
  Rent Pending = Total Rent - Rent Paid
  ↓
[Display Summary]
  ├─ Total Rent: X PKR
  ├─ Paid Now: Y PKR
  └─ Pending: Z PKR
  ↓
[Review All Details]
  ↓
[Click Save Clearance]
  ↓
[Validate Form]
  ↓
All validations passed?
  ├─ No → [Show Errors] → [Fix]
  └─ Yes → Continue
  ↓
[START DATABASE TRANSACTION]
  ↓
[Create Clearance Record]
  ├─ Clearance Number
  ├─ Date
  ├─ Total Rent
  ├─ Rent Paid
  └─ Rent Pending
  ↓
[Create Clearance Items]
  For each item cleared:
  ├─ Link to Inventory Item
  ├─ Quantity Cleared
  ├─ Days Stored
  ├─ Rent Per Unit
  └─ Total Rent
  ↓
[Update Inventory Items]
  For each item:
  ├─ Increment Cleared Quantity
  ├─ Decrement Remaining Quantity
  └─ Update Status:
      ├─ If Remaining = 0 → CLEARED
      └─ If Remaining > 0 → PARTIAL_CLEARED
  ↓
[Update Inventory Entry Status]
  ├─ All items cleared? → CLEARED
  ├─ Some items cleared? → PARTIAL_CLEARED
  └─ Otherwise → ACTIVE
  ↓
[CREATE LEDGER ENTRIES]
  ↓
[Get Customer's Current Balance]
  ↓
[Create Ledger Entry for Rent Charge]
  ├─ Description: "Clearance [CL-XXX] - Storage Rent"
  ├─ Debit: Total Rent
  ├─ Credit: 0
  ├─ Balance: Previous Balance + Total Rent
  └─ Link to Clearance
  ↓
If Rent Paid > 0:
  ↓
[Create Ledger Entry for Payment]
  ├─ Description: "Payment for Clearance [CL-XXX]"
  ├─ Debit: 0
  ├─ Credit: Rent Paid
  ├─ Balance: Previous Balance - Rent Paid
  └─ Link to Clearance
  ↓
[Update Clearance with Ledger References]
  ↓
[COMMIT TRANSACTION]
  ↓
Transaction Successful?
  ├─ No → [ROLLBACK] → [Show Error] → END
  └─ Yes → Continue
  ↓
[Show Success Message]
  ↓
[Generate Clearance Receipt]
  ↓
[Print Receipt]
  ↓
[Customer Takes Receipt]
  ↓
[Products Released to Customer]
  ↓
END
```

---

### 5.4 Detailed Workflow: Payment Recording

```
START
  ↓
[Open Payment Form]
  ↓
[Select Customer]
  ↓
[System Displays Customer Info]
  ├─ Current Balance
  ├─ Pending Clearances (if any)
  └─ Recent transactions
  ↓
[Select Payment Type]
  ├─ Against Specific Clearance
  ├─ General Payment
  └─ Advance Payment
  ↓
If "Against Specific Clearance" selected:
  ↓
  [Display Pending Clearances]
    ├─ Clearance Number
    ├─ Date
    ├─ Total Rent
    ├─ Paid Amount
    └─ Pending Amount
  ↓
  [Select Clearance]
  ↓
  [Display Pending Amount]
  ↓
  [Enter Payment Amount]
  ↓
  Is amount > pending?
    ├─ Yes → [Show Warning] → [Adjust or Confirm]
    └─ No → Continue
  ↓
[Enter Payment Date] (Default: Today)
  ↓
[Select Payment Mode]
  ├─ Cash
  ├─ Bank Transfer
  └─ Cheque
  ↓
If Bank/Cheque:
  ↓
  [Enter Reference Number]
    ├─ Cheque Number
    └─ Transaction ID
  ↓
[Enter Notes] [Optional]
  ↓
[Display Summary]
  ├─ Previous Balance: X PKR
  ├─ Payment Amount: Y PKR
  └─ New Balance: X - Y PKR
  ↓
[Review Details]
  ↓
[Click Save Payment]
  ↓
[Validate Form]
  ↓
Valid?
  ├─ No → [Show Errors] → [Fix]
  └─ Yes → Continue
  ↓
[START DATABASE TRANSACTION]
  ↓
[Create Payment Record]
  ├─ Customer ID
  ├─ Clearance ID (if linked)
  ├─ Amount
  ├─ Payment Type
  ├─ Payment Mode
  ├─ Reference
  └─ Notes
  ↓
If Linked to Clearance:
  ↓
  [Update Clearance]
    ├─ Increment Rent Paid
    └─ Decrement Rent Pending
  ↓
[Get Customer's Current Balance]
  ↓
[Create Ledger Entry]
  ├─ Description: "Payment received - [Type]"
  ├─ Debit: 0
  ├─ Credit: Payment Amount
  ├─ Balance: Previous Balance - Payment Amount
  ├─ Link to Payment
  └─ Link to Clearance (if applicable)
  ↓
[COMMIT TRANSACTION]
  ↓
Transaction Successful?
  ├─ No → [ROLLBACK] → [Show Error] → END
  └─ Yes → Continue
  ↓
[Show Success Message]
  ↓
[Generate Payment Receipt]
  ↓
[Print Receipt]
  ↓
[Customer Takes Receipt]
  ↓
END
```

---

### 5.5 Detailed Workflow: Cash Advance to Customer

```
START
  ↓
[Open Cash Advance Form]
  ↓
[Select Customer]
  ↓
[System Displays Customer Info]
  ├─ Current Balance
  ├─ Existing Advances (if any)
  └─ Recent transactions
  ↓
[Enter Advance Amount]
  ↓
[Enter Purpose/Reason] [Optional]
  e.g., "For seeds purchase", "Personal need"
  ↓
[Enter Date] (Default: Today)
  ↓
[Enter Notes] [Optional]
  ↓
[Display Impact]
  ├─ Current Balance: X PKR
  ├─ Advance Amount: Y PKR
  └─ New Balance: X + Y PKR
  (Note: Balance increases because customer owes more)
  ↓
[Show Warning]
  "This will add to customer's debt. Confirm?"
  ↓
[Review Details]
  ↓
[Click Confirm]
  ↓
[Validate Form]
  ↓
Valid?
  ├─ No → [Show Errors] → [Fix]
  └─ Yes → Continue
  ↓
[START DATABASE TRANSACTION]
  ↓
[Create Cash Advance Record]
  ├─ Customer ID
  ├─ Amount
  ├─ Purpose
  ├─ Date
  ├─ Status: PENDING
  └─ Adjusted Amount: 0
  ↓
[Get Customer's Current Balance]
  ↓
[Create Ledger Entry]
  ├─ Description: "Cash advance given - [Purpose]"
  ├─ Debit: Advance Amount
  ├─ Credit: 0
  ├─ Balance: Previous Balance + Advance Amount
  └─ Link to Cash Advance
  ↓
[COMMIT TRANSACTION]
  ↓
Transaction Successful?
  ├─ No → [ROLLBACK] → [Show Error] → END
  └─ Yes → Continue
  ↓
[Show Success Message]
  ↓
[Generate Advance Receipt]
  ↓
[Print Receipt]
  ↓
[Give Cash to Customer]
  ↓
[Customer Takes Receipt]
  ↓
END

Note: The advance will be automatically considered when
calculating customer's total balance. Can be adjusted
against future clearances or returned separately.
```

---

### 5.6 Ledger Balance Calculation Logic

```
CUSTOMER LEDGER BALANCE CALCULATION
=====================================

Initial Balance = 0

For each transaction (chronologically):

  If Transaction Type = Inventory Entry:
    → No immediate ledger impact
    → Just records what was stored

  If Transaction Type = Clearance (Rent Charge):
    → Debit += Total Rent
    → Balance += Total Rent
    → (Customer owes more)

  If Transaction Type = Payment Received:
    → Credit += Payment Amount
    → Balance -= Payment Amount
    → (Customer owes less)

  If Transaction Type = Cash Advance Given:
    → Debit += Advance Amount
    → Balance += Advance Amount
    → (Customer owes more)

BALANCE INTERPRETATION:
- Positive Balance = Customer owes us money
- Negative Balance = We owe customer money
- Zero Balance = All settled

EXAMPLES:

Example 1: Simple Flow
Day 1: Inventory entry → Balance: 0
Day 15: Clearance, Rent: 5,000 PKR → Balance: +5,000 PKR
Day 15: Payment: 3,000 PKR → Balance: +2,000 PKR
Day 30: Payment: 2,000 PKR → Balance: 0 PKR

Example 2: With Cash Advance
Day 1: Inventory entry → Balance: 0
Day 5: Cash advance: 2,000 PKR → Balance: +2,000 PKR
Day 20: Clearance, Rent: 4,000 PKR → Balance: +6,000 PKR
Day 20: Payment: 6,000 PKR → Balance: 0 PKR

Example 3: Over-payment
Day 1: Inventory entry → Balance: 0
Day 10: Clearance, Rent: 3,000 PKR → Balance: +3,000 PKR
Day 10: Payment: 5,000 PKR → Balance: -2,000 PKR
(We owe customer 2,000 PKR - will adjust in next transaction)

Example 4: Multiple Clearances
Day 1: Inventory entry #1 → Balance: 0
Day 10: Clearance #1, Rent: 2,000 PKR → Balance: +2,000 PKR
Day 15: Inventory entry #2 → Balance: +2,000 PKR
Day 25: Clearance #2, Rent: 3,000 PKR → Balance: +5,000 PKR
Day 25: Payment: 5,000 PKR → Balance: 0 PKR
```

---

## 6. User Interface Requirements

### 6.1 Main Layout

```
┌─────────────────────────────────────────────────────────┐
│ COLD STORE MANAGEMENT SYSTEM            [_] [□] [X]     │
├──────────┬──────────────────────────────────────────────┤
│          │                                               │
│ SIDEBAR  │           MAIN CONTENT AREA                  │
│          │                                               │
│ Dashboard│  ┌─────────────────────────────────────────┐ │
│ ▼        │  │                                         │ │
│          │  │     PAGE HEADER                         │ │
│ Inventory│  │                                         │ │
│ ├─Add New│  ├─────────────────────────────────────────┤ │
│ └─List   │  │                                         │ │
│          │  │                                         │ │
│ Clearance│  │                                         │ │
│ ├─New    │  │     MAIN CONTENT                        │ │
│ └─List   │  │     (Forms, Tables, Reports)            │ │
│          │  │                                         │ │
│ Payments │  │                                         │ │
│ Customers│  │                                         │ │
│ Reports  │  │                                         │ │
│ Settings │  │                                         │ │
│          │  └─────────────────────────────────────────┘ │
├──────────┴──────────────────────────────────────────────┤
│ Status Bar: User | Date | Time | Connection Status      │
└─────────────────────────────────────────────────────────┘
```

### 6.2 Form Design Principles

**All Forms Should Have:**

1. Clear title and instructions
2. Grouped related fields
3. Required field indicators (\*)
4. Inline validation
5. Clear error messages
6. Save/Cancel buttons
7. Confirmation for destructive actions
8. Loading indicators
9. Success/Error notifications

**Form Layout:**

```
┌─────────────────────────────────────┐
│ FORM TITLE                    [?]   │
├─────────────────────────────────────┤
│                                     │
│ Section 1: Basic Information       │
│ ┌─────────────────────────────────┐ │
│ │ Field Label *                   │ │
│ │ [Input Field              ]     │ │
│ │ Help text or validation error   │ │
│ └─────────────────────────────────┘ │
│                                     │
│ Section 2: Details                  │
│ ┌─────────────────────────────────┐ │
│ │ ...                             │ │
│ └─────────────────────────────────┘ │
│                                     │
│          [Cancel] [Save]            │
└─────────────────────────────────────┘
```

### 6.3 Table Design Principles

**All Tables Should Have:**

1. Column headers with sorting
2. Search/filter bar
3. Pagination
4. Row actions (Edit, Delete, View)
5. Bulk actions (if applicable)
6. Export options
7. Empty state message
8. Loading state

**Table Layout:**

```
┌─────────────────────────────────────────────┐
│ TABLE TITLE               [Search] [Filter] │
├─────────────────────────────────────────────┤
│ [Export CSV] [Export Excel]       [+ Add]   │
├──┬──────┬──────┬──────┬────────┬──────────┤
│☐│Col 1↕│Col 2↕│Col 3↕│Col 4 ↕ │ Actions  │
├──┼──────┼──────┼──────┼────────┼──────────┤
│☐│Data  │Data  │Data  │Data    │[👁][✏][🗑]│
│☐│Data  │Data  │Data  │Data    │[👁][✏][🗑]│
│☐│Data  │Data  │Data  │Data    │[👁][✏][🗑]│
├──┴──────┴──────┴──────┴────────┴──────────┤
│ Showing 1-10 of 150    [<] [1][2][3] [>]  │
└─────────────────────────────────────────────┘
```

### 6.4 Specific Screen Layouts

#### 6.4.1 Inventory Entry Form

```
┌─────────────────────────────────────────────────┐
│ Add New Inventory Entry                   [?]   │
├─────────────────────────────────────────────────┤
│                                                 │
│ Receipt Information                             │
│ ┌─────────────┬─────────────┬────────────────┐ │
│ │Date*        │Customer*    │Car Number*     │ │
│ │[Date Picker]│[Select ▾]   │[Text Input   ] │ │
│ └─────────────┴─────────────┴────────────────┘ │
│                                                 │
│ Receipt No: CS-20250114-0001 (Auto-generated)  │
│                                                 │
│ Items                            [+ Add Item]   │
│ ┌─────────────────────────────────────────────┐ │
│ │ Item #1                           [Remove X]│ │
│ │ ┌──────────┬──────────┬─────────┬────────┐ │ │
│ │ │Type*     │Subtype   │Pack*    │Room*   │ │ │
│ │ │[Select▾] │[Select▾] │[Select▾]│[Select▾││ │
│ │ └──────────┴──────────┴─────────┴────────┘ │ │
│ │ ┌───────┬──────┬─────────┬──────────────┐ │ │
│ │ │Box No │Marka │Quantity*│Unit Price*   │ │ │
│ │ │[    ] │[   ] │[      ] │[          ]  │ │ │
│ │ └───────┴──────┴─────────┴──────────────┘ │ │
│ │                                             │ │
│ │ Total Price: 10,000 PKR                    │ │
│ │                                             │ │
│ │ ☐ Khali Jali                               │ │
│ │ ┌─────────────┬──────────────┬───────────┐ │ │
│ │ │KJ Quantity  │KJ Unit Price │KJ Total   │ │ │
│ │ │[disabled  ] │[disabled   ] │0 PKR      │ │ │
│ │ └─────────────┴──────────────┴───────────┘ │ │
│ │                                             │ │
│ │ Grand Total: 10,000 PKR                    │ │
│ └─────────────────────────────────────────────┘ │
│                                                 │
│ [+ Add Another Item]                            │
│                                                 │
│ ┌─────────────────────────────────────────────┐ │
│ │ Overall Total: 10,000 PKR                   │ │
│ └─────────────────────────────────────────────┘ │
│                                                 │
│              [Cancel] [Save & Print]            │
└─────────────────────────────────────────────────┘
```

#### 6.4.2 Clearance Form

```
┌─────────────────────────────────────────────────┐
│ New Clearance                             [?]   │
├─────────────────────────────────────────────────┤
│                                                 │
│ Step 1: Select Customer                         │
│ ┌─────────────────────────────────────────────┐ │
│ │ Customer: [Search and Select...        ▾]   │ │
│ │                                             │ │
│ │ Current Balance: +5,000 PKR (Pending)       │ │
│ └─────────────────────────────────────────────┘ │
│                                                 │
│ Step 2: Select Inventory Entry                  │
│ ┌─────────────────────────────────────────────┐ │
│ │ ○ Receipt: CS-20250101-0001 | Date: Jan 1  │ │
│ │   Items: 3 | Status: ACTIVE                 │ │
│ │                                             │ │
│ │ ● Receipt: CS-20250110-0005 | Date: Jan 10 │ │
│ │   Items: 2 | Status: ACTIVE                 │ │
│ └─────────────────────────────────────────────┘ │
│                                                 │
│ Step 3: Select Items to Clear                   │
│ ┌─────────────────────────────────────────────┐ │
│ │ ☑ Potato-Cardinal | Bori | Room 1          │ │
│ │   Original: 100 | Cleared: 0 | Remaining: 100│ │
│ │   Entry Date: Jan 10, 2025                  │ │
│ │   ┌──────────────────────────────────────┐ │ │
│ │   │ Qty to Clear: [50  ] (Max: 100)      │ │ │
│ │   │ Days Stored: 5 days                  │ │ │
│ │   │ Rent Rate: 2 PKR/day/unit            │ │ │
│ │   │ Item Rent: 500 PKR                   │ │ │
│ │   └──────────────────────────────────────┘ │ │
│ │                                             │ │
│ │ ☐ Onion-Red | Jali | Room 2                │ │
│ │   Original: 80 | Cleared: 0 | Remaining: 80│ │
│ │   Entry Date: Jan 10, 2025                  │ │
│ └─────────────────────────────────────────────┘ │
│                                                 │
│ Clearance Details                               │
│ ┌─────────────────────────────────────────────┐ │
│ │ Date: [Jan 15, 2025]                        │ │
│ │ Car Number: [LES-1234]                      │ │
│ │ Clearance No: CL-20250115-0001 (Auto)       │ │
│ └─────────────────────────────────────────────┘ │
│                                                 │
│ Rent Calculation                                │
│ ┌─────────────────────────────────────────────┐ │
│ │ Total Rent:          500.00 PKR             │ │
│ │ Rent Paid Now: [     300.00] PKR            │ │
│ │ Rent Pending:        200.00 PKR             │ │
│ └─────────────────────────────────────────────┘ │
│                                                 │
│       [Cancel] [Save & Release Products]        │
└─────────────────────────────────────────────────┘
```

#### 6.4.3 Dashboard

```
┌─────────────────────────────────────────────────┐
│ Dashboard                                       │
├─────────────────────────────────────────────────┤
│                                                 │
│ ┌──────────────┬──────────────┬──────────────┐ │
│ │ Total Storage│ Pending Rent │Today's Income│ │
│ │   1,234 Units│   25,000 PKR │   5,000 PKR  │ │
│ │      📦       │       💰      │      ✓       │ │
│ └──────────────┴──────────────┴──────────────┘ │
│                                                 │
│ ┌──────────────┬──────────────┬──────────────┐ │
│ │Active Entries│ Clearances   │   Customers  │ │
│ │     45       │   This Week  │     Active   │ │
│ │              │      12      │      78      │ │
│ └──────────────┴──────────────┴──────────────┘ │
│                                                 │
│ Storage by Room                 [View Details] │
│ ┌─────────────────────────────────────────────┐ │
│ │ Cold Room 1: ████████░░ 80% (800/1000)     │ │
│ │ Cold Room 2: ██████░░░░ 60% (600/1000)     │ │
│ │ Hot Room 1:  ███░░░░░░░ 30% (150/500)      │ │
│ └─────────────────────────────────────────────┘ │
│                                                 │
│ Recent Activity                 [View All]      │
│ ┌─────────────────────────────────────────────┐ │
│ │ 🔴 New Entry    CS-001  Ahmed Ali  Jan 14  │ │
│ │ 🟢 Clearance   CL-005  Hassan K   Jan 14  │ │
│ │ 💰 Payment      5000   Rashid H   Jan 14  │ │
│ │ 🔴 New Entry    CS-002  Ali Shah  Jan 13  │ │
│ └─────────────────────────────────────────────┘ │
│                                                 │
│ Top Pending Balances            [View All]      │
│ ┌─────────────────────────────────────────────┐ │
│ │ 1. Ahmed Ali         15,000 PKR            │ │
│ │ 2. Hassan Khan       12,500 PKR            │ │
│ │ 3. Rashid Hussain    10,000 PKR            │ │
│ └─────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────┘
```

---

## 7. Data Requirements

### 7.1 Data Entities

**Primary Entities:**

1. Customer
2. ProductType
3. ProductSubtype
4. Room
5. PackType
6. Inventory (Entry)
7. InventoryItem
8. Clearance
9. ClearanceItem
10. Payment
11. CashAdvance
12. LedgerEntry
13. RentConfig

### 7.2 Data Retention

- **Transactional Data:** Retained indefinitely
- **Audit Logs:** 2 years minimum
- **Backup Files:** 6 months minimum
- **Deleted Records:** Soft delete (marked inactive)

### 7.3 Data Validation Rules

**Customer:**

- Name: Required, 1-100 characters
- CNIC: Optional, 13 digits, unique if provided
- Phone: Optional, valid phone format

**Inventory Entry:**

- Receipt No: Required, unique, auto-generated
- Date: Required, cannot be future date
- Customer: Required, must exist
- Car Number: Required
- Items: At least 1 item required

**Inventory Item:**

- Product Type: Required
- Pack Type: Required
- Room: Required
- Quantity: Required, > 0
- Unit Price: Required, >= 0
- If Khali Jali checked: KJ fields required

**Clearance:**

- Customer: Required
- Inventory: Required, must be active
- Quantity to Clear: Required, > 0, <= Remaining
- Rent Paid: >= 0

**Payment:**

- Customer: Required
- Amount: Required, > 0
- Payment Mode: Required
- Date: Required

---

## 8. Business Rules

### 8.1 Inventory Management Rules

1. **Multiple entries per customer**: Allowed
2. **Multiple items per entry**: Allowed
3. **Same product in multiple rooms**: Allowed
4. **Partial clearance**: Allowed
5. **Cannot clear more than remaining**: System prevents
6. **Cannot delete entry with clearances**: System prevents
7. **Entry edit window**: Same day only
8. **Receipt number**: Must be unique, auto-generated

### 8.2 Rent Calculation Rules

1. **Minimum storage period**: 1 day
2. **Days calculation**: Ceiling function (partial day = full day)
3. **Rent rate**: Based on pack type (Bori/Jali)
4. **Rate changes**: Only apply to new clearances
5. **Rent accumulation**: Starts from entry date
6. **Multiple pack types**: Each calculated separately

### 8.3 Payment Rules

1. **Payment timing**: Flexible (at clearance, before, after, or never)
2. **Partial payment**: Allowed
3. **Over-payment**: Allowed (creates negative balance)
4. **Multiple payments per clearance**: Allowed
5. **Payment without clearance**: Allowed (general payment)
6. **Cash advance**: Creates debit entry (increases debt)
7. **Payment modes**: Cash, Bank, Cheque (for tracking only)

### 8.4 Ledger Rules

1. **All transactions recorded**: No exceptions
2. **Chronological order**: Maintained strictly
3. **Running balance**: Updated with each entry
4. **Debit**: Increases customer's debt
5. **Credit**: Decreases customer's debt
6. **Balance cannot be edited**: System calculated only
7. **Ledger entries immutable**: Cannot be deleted/edited
8. **Correction entries**: If mistake, create reversing entry

### 8.5 Status Management Rules

**Inventory Item Status:**

- **STORED**: Initial status when added
- **PARTIAL_CLEARED**: Some quantity cleared, some remaining
- **CLEARED**: All quantity cleared

**Inventory Entry Status:**

- **ACTIVE**: Has items in storage
- **PARTIAL_CLEARED**: Some items fully/partially cleared
- **CLEARED**: All items cleared

**Status Transitions:**

```
STORED → PARTIAL_CLEARED → CLEARED
ACTIVE → PARTIAL_CLEARED → CLEARED
```

**Rules:**

- Status is auto-calculated, never manually set
- Once CLEARED, cannot be reversed
- PARTIAL_CLEARED can have multiple clearances

### 8.6 Data Integrity Rules

1. **Referential Integrity**: All foreign keys must be valid
2. **Cascading Deletes**: Prevented for safety
3. **Soft Deletes**: Used for configuration data
4. **Quantity Conservation**: Total cleared ≤ Total entered
5. **Balance Integrity**: Sum of ledger entries = Balance
6. **Transaction Atomicity**: All or nothing for multi-step operations

---

## 9. System Constraints

### 9.1 Technical Constraints

1. **Platform**: Windows 10 or higher
2. **Database**: SQLite (single file)
3. **Single User**: No concurrent access
4. **Offline Only**: No internet required
5. **Local Storage**: All data on local machine
6. **Memory**: Minimum 4GB RAM
7. **Disk Space**: Minimum 1GB free

### 9.2 Business Constraints

1. **Language**: Urdu/English (text content)
2. **Currency**: Pakistani Rupee (PKR)
3. **Date Format**: DD/MM/YYYY or configurable
4. **Number Format**: Indian number system (1,00,000)
5. **Fiscal Year**: Configurable
6. **Time Zone**: Pakistan Standard Time (PKT)

### 9.3 Operational Constraints

1. **Business Hours**: 24/7 operation capability
2. **Backup Schedule**: Daily recommended
3. **Receipt Printing**: Requires printer setup
4. **Report Export**: Requires file system access
5. **Update Mechanism**: Manual installation

---

## 10. Acceptance Criteria

### 10.1 Functional Acceptance

**Must Have (Critical):**

- ✅ Add/Edit/View customers
- ✅ Configure products, rooms, pack types, rent rates
- ✅ Add inventory entries with multiple items
- ✅ Calculate item totals and grand totals correctly
- ✅ Process clearances with rent calculation
- ✅ Support flexible payment options
- ✅ Maintain accurate customer ledgers
- ✅ Record cash advances
- ✅ Generate and print receipts
- ✅ View inventory and clearance lists
- ✅ Search and filter data
- ✅ Calculate rent based on days and pack type
- ✅ Update inventory status correctly
- ✅ Database backup and restore

**Should Have (Important):**

- ✅ Dashboard with key metrics
- ✅ Financial reports (revenue, collections, pending)
- ✅ Customer ledger statements
- ✅ Inventory reports (by room, customer, product)
- ✅ Export reports to PDF/Excel
- ✅ Advanced search functionality
- ✅ Date range filters
- ✅ Payment history views

**Nice to Have (Optional):**

- User authentication
- Multiple user roles
- Activity logs
- Email receipts
- SMS notifications
- Barcode scanning
- Automated reminders

### 10.2 Performance Acceptance

- Page load time < 2 seconds ✅
- Search results < 1 second ✅
- Form submission < 3 seconds ✅
- Report generation < 5 seconds ✅
- Handles 10,000+ customers ✅
- Handles 100,000+ entries per year ✅
- Database size up to 5GB ✅

### 10.3 Usability Acceptance

- New user productive within 1 hour ✅
- No crashes during normal operation ✅
- Clear error messages ✅
- Intuitive navigation ✅
- Responsive UI (no freezing) ✅
- Readable fonts and colors ✅
- Keyboard shortcuts work ✅

### 10.4 Data Accuracy Acceptance

- All calculations correct (100% accuracy) ✅
- Rent calculation matches manual calculation ✅
- Ledger balance always correct ✅
- No data loss during operations ✅
- Quantity tracking accurate ✅
- Status updates correct ✅

### 10.5 Testing Scenarios

**Test Scenario 1: Complete Flow**

```
1. Add new customer
2. Configure product type "Potato"
3. Add subtype "Cardinal"
4. Configure room "Cold Room 1"
5. Set pack type "Bori" rent rate: 2 PKR/day
6. Add inventory entry with 100 Bori
7. Wait 10 days (or change date)
8. Clear 50 Bori
9. System calculates: 50 × 10 × 2 = 1,000 PKR rent
10. Pay 600 PKR
11. Pending: 400 PKR
12. Check customer ledger shows correct balance
13. Print all receipts
```

**Test Scenario 2: Partial Clearance**

```
1. Add inventory: 100 Bori on Jan 1
2. Clear 30 Bori on Jan 10 (9 days)
3. Clear 40 Bori on Jan 20 (19 days for these)
4. Clear remaining 30 Bori on Jan 30 (29 days)
5. Verify each clearance calculated correctly
6. Verify item status updates correctly
7. Verify total rent matches sum of clearances
```

**Test Scenario 3: Multiple Items**

```
1. Add inventory with 3 different items:
   - 100 Bori Potato in Cold Room 1
   - 50 Jali Onion in Cold Room 2
   - 80 Bori Garlic in Hot Room 1
2. Clear all items after 15 days
3. Verify each item rent calculated with correct rate
4. Verify total is sum of all item rents
5. Make partial payment
6. Verify ledger entries created correctly
```

**Test Scenario 4: Cash Advance**

```
1. Customer has active inventory
2. Give cash advance: 5,000 PKR
3. Later, clear items with rent: 8,000 PKR
4. Pay 3,000 PKR
5. Balance should be: +5,000 (advance) + 8,000 (rent) - 3,000 (paid) = 10,000 PKR
6. Verify ledger shows all transactions
```

**Test Scenario 5: Khali Jali**

```
1. Add inventory with Khali Jali:
   - Quantity: 100 Jali
   - Unit Price: 50 PKR
   - Total: 5,000 PKR
   - KJ Quantity: 100
   - KJ Unit Price: 5 PKR
   - KJ Total: 500 PKR
   - Grand Total: 5,500 PKR
2. Verify grand total calculation correct
3. Verify receipt shows breakdown
```

**Test Scenario 6: Same Day Clearance**

```
1. Add inventory today at 10:00 AM
2. Clear same day at 4:00 PM
3. Verify days stored = 1 day (minimum)
4. Verify rent calculated for 1 day
```

**Test Scenario 7: Payment Without Clearance**

```
1. Customer has pending balance: 10,000 PKR
2. Record general payment: 5,000 PKR
3. Verify balance reduced to 5,000 PKR
4. Payment not linked to specific clearance
5. Ledger shows credit entry
```

**Test Scenario 8: Multiple Entries Same Customer**

```
1. Customer adds entry on Jan 1
2. Customer adds another entry on Jan 10
3. Clear items from first entry on Jan 15
4. Clear items from second entry on Jan 20
5. Record payments separately
6. Verify each clearance calculated independently
7. Verify ledger shows all transactions
```

**Test Scenario 9: Over-Payment**

```
1. Clearance rent: 5,000 PKR
2. Customer pays: 7,000 PKR
3. Balance becomes: -2,000 PKR (we owe customer)
4. Next clearance rent: 3,000 PKR
5. Net balance: -2,000 + 3,000 = +1,000 PKR
6. Verify ledger correct
```

**Test Scenario 10: Backup and Restore**

```
1. Add 10 entries with various data
2. Create backup
3. Add 5 more entries
4. Restore from backup
5. Verify only first 10 entries present
6. Verify data integrity maintained
```

---

## 11. System Interfaces

### 11.1 User Interfaces

**Screen Resolution Support:**

- Minimum: 1366 x 768
- Recommended: 1920 x 1080
- Maximum: 4K displays

**UI Components:**

- Forms: React Hook Form
- Tables: TanStack Table (React Table)
- Date Pickers: date-fns
- Modals: Radix UI Dialog
- Notifications: React Hot Toast
- Charts: Recharts

### 11.2 Hardware Interfaces

**Required:**

- Display: Monitor (any resolution)
- Input: Keyboard and Mouse
- Storage: Local hard drive

**Optional:**

- Printer: For receipt printing
- Barcode Scanner: For future expansion
- Backup Drive: External HDD/USB for backups

### 11.3 Software Interfaces

**Operating System:**

- Windows 10/11 (Primary)
- Linux (Future)
- macOS (Future)

**Database:**

- SQLite 3.x
- File-based, no server required
- ACID compliant

**Runtime:**

- Tauri (Rust-based)
- No external dependencies
- Self-contained executable

---

## 12. Assumptions and Dependencies

### 12.1 Assumptions

1. Single user operates the system at a time
2. Computer has reliable power supply (UPS recommended)
3. Users have basic computer literacy
4. Printer is configured if receipt printing needed
5. Regular backups are performed by users
6. System date/time is correct
7. Network not required for operation
8. Windows OS is updated and maintained

### 12.2 Dependencies

**Technical Dependencies:**

- Node.js (development only)
- Rust toolchain (development only)
- Windows API (for Tauri)
- SQLite driver

**External Dependencies:**

- None (fully offline system)

**Third-Party Libraries:**

- Next.js 14+
- Prisma 5+
- Tauri 2.x
- React 18+
- TypeScript 5+
- Tailwind CSS 3+

---

## 13. Glossary

**Agricultural Terms:**

- **Bori (بوری)**: Sack or bag, typically jute or plastic
- **Jali (جالی)**: Crate or basket, typically plastic mesh
- **Marka (مارکہ)**: Mark or label on packages
- **Khali Jali (خالی جالی)**: Empty crate return charges

**Business Terms:**

- **Cold Room**: Refrigerated storage room
- **Hot Room**: Non-refrigerated storage room
- **Clearance**: Process of removing items from storage
- **Ledger**: Financial record of transactions
- **Debit**: Amount customer owes (increases balance)
- **Credit**: Amount paid or owed to customer (decreases balance)

**Technical Terms:**

- **POS**: Point of Sale system
- **CRUD**: Create, Read, Update, Delete operations
- **Transaction**: Atomic database operation
- **Soft Delete**: Marking as inactive instead of deleting
- **ORM**: Object-Relational Mapping (Prisma)

---

## 14. Appendices

### Appendix A: Sample Receipts

**Inventory Entry Receipt:**

```
═══════════════════════════════════════════════
         COLD STORE MANAGEMENT SYSTEM
              [Store Name]
           [Address, Phone]
═══════════════════════════════════════════════

INVENTORY ENTRY RECEIPT

Receipt No: CS-20250114-0001
Date: 14/01/2025
Time: 10:30 AM

Customer Details:
Name: Ahmed Ali
Father Name: Ali Hassan
Phone: 0300-1234567
Village: Pir Jo Goth

Car Number: LES-1234

───────────────────────────────────────────────
ITEMS:
───────────────────────────────────────────────

1. Potato - Cardinal
   Pack Type: Bori
   Room: Cold Room 1, Box: 15
   Marka: AA-2025
   Quantity: 100 x 50 PKR = 5,000 PKR

   Khali Jali:
   Quantity: 100 x 5 PKR = 500 PKR

   Item Total: 5,500 PKR

2. Onion - Red
   Pack Type: Jali
   Room: Cold Room 2, Box: 22
   Quantity: 50 x 40 PKR = 2,000 PKR

   Item Total: 2,000 PKR

───────────────────────────────────────────────
TOTAL AMOUNT: 7,500 PKR
───────────────────────────────────────────────

Terms & Conditions:
- Storage charges apply as per pack type
- Minimum storage period: 1 day
- Items must be cleared within agreed period
- Receipt must be presented for clearance

Customer Signature: _________________

Received By: _________________

═══════════════════════════════════════════════
```

**Clearance Receipt:**

```
═══════════════════════════════════════════════
         COLD STORE MANAGEMENT SYSTEM
              [Store Name]
           [Address, Phone]
═══════════════════════════════════════════════

CLEARANCE RECEIPT

Clearance No: CL-20250125-0001
Date: 25/01/2025
Time: 3:45 PM

Customer: Ahmed Ali
Original Receipt: CS-20250114-0001
Car Number: LES-5678

───────────────────────────────────────────────
ITEMS CLEARED:
───────────────────────────────────────────────

1. Potato - Cardinal (Bori)
   Quantity Cleared: 50 (of 100)
   Entry Date: 14/01/2025
   Days Stored: 11 days
   Rate: 2 PKR/day/unit
   Rent: 50 x 11 x 2 = 1,100 PKR

───────────────────────────────────────────────
RENT CALCULATION:
───────────────────────────────────────────────
Total Rent:           1,100 PKR
Rent Paid Now:          600 PKR
Rent Pending:           500 PKR
───────────────────────────────────────────────

Payment Details:
Mode: Cash
Amount: 600 PKR
Date: 25/01/2025

Customer's Outstanding Balance: 500 PKR

───────────────────────────────────────────────

Released By: _________________

Received By (Customer): _________________

═══════════════════════════════════════════════
```

### Appendix B: Sample Reports

**Customer Ledger Statement:**

```
═══════════════════════════════════════════════
         CUSTOMER LEDGER STATEMENT
═══════════════════════════════════════════════

Customer: Ahmed Ali
CNIC: 42101-1234567-8
Phone: 0300-1234567
Period: 01/01/2025 to 31/01/2025

Opening Balance: 0.00 PKR

───────────────────────────────────────────────
Date       Description              Debit  Credit  Balance
───────────────────────────────────────────────
14/01/25   Inventory CS-001         -      -       0.00
20/01/25   Cash Advance            2000    -       2000.00
25/01/25   Clearance CL-001 Rent   1100    -       3100.00
25/01/25   Payment - Cash          -       600     2500.00
28/01/25   Clearance CL-002 Rent   1500    -       4000.00
30/01/25   Payment - Bank          -       2000    2000.00
───────────────────────────────────────────────

Closing Balance: 2,000.00 PKR (Customer Owes)

Summary:
Total Debits:  4,600 PKR
Total Credits: 2,600 PKR
Net Balance:   2,000 PKR

═══════════════════════════════════════════════
Generated: 31/01/2025 5:30 PM
Authorized Signature: _________________
═══════════════════════════════════════════════
```

### Appendix C: Database Schema Diagram

```
┌─────────────────┐
│    Customer     │
├─────────────────┤
│ id (PK)         │
│ name            │
│ fatherName      │
│ cnic (UNIQUE)   │
│ phone           │
│ address         │
│ village         │
└─────────────────┘
        │
        │ 1:N
        ↓
┌─────────────────┐       ┌─────────────────┐
│   Inventory     │──────→│ InventoryItem   │
├─────────────────┤  1:N  ├─────────────────┤
│ id (PK)         │       │ id (PK)         │
│ receiptNo       │       │ inventoryId(FK) │
│ date            │       │ productTypeId   │
│ carNumber       │       │ packTypeId      │
│ customerId (FK) │       │ roomId          │
│ totalAmount     │       │ quantity        │
│ status          │       │ remainingQty    │
└─────────────────┘       │ unitPrice       │
        │                 │ totalPrice      │
        │ 1:N             │ grandTotal      │
        ↓                 │ status          │
┌─────────────────┐       └─────────────────┘
│   Clearance     │               │
├─────────────────┤               │
│ id (PK)         │               │ 1:N
│ clearanceNo     │               ↓
│ inventoryId(FK) │       ┌─────────────────┐
│ date            │       │ ClearanceItem   │
│ totalRent       │       ├─────────────────┤
│ rentPaid        │←──────│ clearanceId(FK) │
│ rentPending     │  1:N  │ inventoryItemId │
└─────────────────┘       │ qtyCleared      │
        │                 │ daysStored      │
        │ 1:N             │ rentPerUnit     │
        ↓                 │ totalRent       │
┌─────────────────┐       └─────────────────┘
│    Payment      │
├─────────────────┤       ┌─────────────────┐
│ id (PK)         │       │  LedgerEntry    │
│ customerId (FK) │       ├─────────────────┤
│ clearanceId(FK) │       │ id (PK)         │
│ amount          │       │ customerId (FK) │
│ paymentType     │       │ date            │
│ paymentMode     │       │ description     │
└─────────────────┘       │ debit           │
        │                 │ credit          │
        └────────────────→│ balance         │
                   1:1    │ inventoryId(FK) │
                          │ clearanceId(FK) │
┌─────────────────┐       │ paymentId (FK)  │
│  CashAdvance    │       └─────────────────┘
├─────────────────┤               ↑
│ id (PK)         │               │
│ customerId (FK) │───────────────┘
│ amount          │         1:1
│ purpose         │
│ status          │
└─────────────────┘

┌─────────────────┐       ┌─────────────────┐
│  ProductType    │       │      Room       │
├─────────────────┤       ├─────────────────┤
│ id (PK)         │       │ id (PK)         │
│ name            │       │ name            │
└─────────────────┘       │ roomType        │
        │                 │ capacity        │
        │ 1:N             └─────────────────┘
        ↓
┌─────────────────┐       ┌─────────────────┐
│ ProductSubtype  │       │    PackType     │
├─────────────────┤       ├─────────────────┤
│ id (PK)         │       │ id (PK)         │
│ name            │       │ name            │
│ productTypeId   │       └─────────────────┘
└─────────────────┘               │
                                  │ 1:1
                                  ↓
                          ┌─────────────────┐
                          │   RentConfig    │
                          ├─────────────────┤
                          │ id (PK)         │
                          │ packTypeId (FK) │
                          │ rentPerDay      │
                          └─────────────────┘
```

### Appendix D: Calculation Formulas

**1. Item Total Price:**

```
Total Price = Quantity × Unit Price
```

**2. Khali Jali Total:**

```
KJ Total = KJ Quantity × KJ Unit Price
```

**3. Item Grand Total:**

```
Grand Total = Total Price + KJ Total
```

**4. Entry Overall Total:**

```
Overall Total = Σ(All Items' Grand Total)
```

**5. Days Stored:**

```
Days Stored = CEILING((Clearance Date - Entry Date) / 86400000 milliseconds)
Minimum Days = 1
```

**6. Item Rent:**

```
Item Rent = Quantity Cleared × Days Stored × Rent Per Unit Per Day

Where:
Rent Per Unit Per Day = From RentConfig based on Pack Type
```

**7. Total Clearance Rent:**

```
Total Rent = Σ(All Items' Rent)
```

**8. Pending Rent:**

```
Pending Rent = Total Rent - Rent Paid
```

**9. Ledger Balance:**

```
New Balance = Previous Balance + Debit - Credit

Where:
- Debit = Rent charged, Cash advance given
- Credit = Payments received
```

**10. Customer Balance:**

```
Customer Balance = Last Ledger Entry Balance

Interpretation:
- Positive Balance = Customer owes money
- Negative Balance = We owe customer money
- Zero = All settled
```

### Appendix E: Status Transition Matrix

```
INVENTORY ITEM STATUS TRANSITIONS:

Current Status     Action              New Status
─────────────────────────────────────────────────────
STORED            → Clear Partial      → PARTIAL_CLEARED
STORED            → Clear All          → CLEARED
PARTIAL_CLEARED   → Clear Remaining    → CLEARED
PARTIAL_CLEARED   → Clear Some More    → PARTIAL_CLEARED
CLEARED           → (No action)        → CLEARED


INVENTORY ENTRY STATUS TRANSITIONS:

Current Status     Condition                New Status
──────────────────────────────────────────────────────────
ACTIVE            → All items CLEARED      → CLEARED
ACTIVE            → Any item PARTIAL/CLEAR → PARTIAL_CLEARED
PARTIAL_CLEARED   → All items CLEARED      → CLEARED
PARTIAL_CLEARED   → Still has active       → PARTIAL_CLEARED
CLEARED           → (Final state)          → CLEARED
```

### Appendix F: Error Messages

**Validation Errors:**

- "Customer name is required"
- "Please select a customer"
- "Car number is required"
- "Receipt number already exists"
- "At least one item is required"
- "Quantity must be greater than 0"
- "Unit price cannot be negative"
- "Cannot clear more than remaining quantity (Max: X)"
- "Khali Jali quantity is required when checkbox is checked"

**Business Logic Errors:**

- "Cannot delete product type with existing inventory"
- "Cannot delete room with active items"
- "No active inventory found for this customer"
- "This entry has already been fully cleared"
- "Insufficient remaining quantity for clearance"
- "Payment amount cannot be negative"

**System Errors:**

- "Database connection failed"
- "Failed to save data. Please try again"
- "Failed to generate receipt number"
- "Backup creation failed"
- "Restore operation failed"
- "Printer not configured"

---

## 15. Future Enhancements

### Phase 2 Features (Post-Launch):

1. **Multi-user Support**

   - User accounts with roles
   - Concurrent access control
   - Activity logs per user

2. **Advanced Reporting**

   - Graphical dashboards
   - Trend analysis
   - Predictive analytics
   - Profit/loss statements

3. **Notifications**

   - SMS alerts for pending payments
   - WhatsApp notifications
   - Email receipts
   - Long storage alerts

4. **Barcode Integration**

   - Barcode generation for entries
   - Barcode scanning for clearance
   - Mobile app for scanning

5. **Mobile App**

   - View inventory on mobile
   - Record payments on-the-go
   - Customer portal

6. **Cloud Backup**

   - Automatic cloud backup
   - Multi-location sync
   - Disaster recovery

7. **Advanced Features**
   - Contract management
   - Insurance tracking
   - Quality grading system
   - Temperature monitoring
   - Automated rent reminders

---

## 16. Support and Maintenance

### 16.1 User Support

- User manual (PDF)
- Video tutorials
- On-site training (1 day)
- Phone/WhatsApp support
- Remote assistance

### 16.2 Maintenance

- Bug fixes: As needed
- Updates: Quarterly
- Database optimization: Monthly recommended
- Backup verification: Weekly recommended

### 16.3 Training Requirements

**For Operators:**

- Basic computer skills
- Understanding of cold storage operations
- 2-3 hours hands-on training
- Practice with test data

**Training Topics:**

1. Customer management
2. Inventory entry process
3. Clearance and rent calculation
4. Payment recording
5. Report generation
6. Backup and restore
7. Troubleshooting common issues

---

## Document Control

**Version History:**

| Version | Date        | Author           | Changes              |
| ------- | ----------- | ---------------- | -------------------- |
| 1.0     | 14 Nov 2025 | Development Team | Initial SRS document |

**Approval:**

| Role            | Name | Signature | Date |
| --------------- | ---- | --------- | ---- |
| Business Owner  |      |           |      |
| Project Manager |      |           |      |
| Developer       |      |           |      |
| QA Lead         |      |           |      |

---

## END OF DOCUMENT

**Total Pages:** As rendered  
**Document ID:** CS-POS-SRS-001  
**Classification:** Internal Use  
**Next Review Date:** After Phase 1 Completion

═══════════════════════════════════════════════════════════
