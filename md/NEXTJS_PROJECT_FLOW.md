# Cold Storage POS System - Flow Documentation

## Next.js + SQLite + Prisma Implementation Guide

> **Note**: This document describes HOW the system should work, not the code implementation. It's designed for rebuilding this system in Next.js with SQLite and Prisma.

---

## Table of Contents

1. [System Overview](#system-overview)
2. [Database Structure](#database-structure)
3. [User Flows](#user-flows)
4. [Module Workflows](#module-workflows)
5. [Business Logic Rules](#business-logic-rules)
6. [UI/UX Guidelines](#uiux-guidelines)
7. [Validation & Error Handling](#validation--error-handling)

---

## System Overview

### Purpose

A desktop-like web application for managing cold storage warehouse operations including inventory tracking, stock entry, stock clearance, customer management, and financial reporting.

### Core Capabilities

- **Stock Entry (Amad)**: Record incoming inventory with customer details
- **Stock Clearance (Nikasi)**: Process outgoing inventory and track removals
- **Inventory Management**: Real-time stock tracking with room/box locations
- **Customer Management**: Maintain customer database with transaction history
- **Expenses Tracking**: Record and categorize business expenses
- **Reporting**: Generate various reports for business insights
- **Settings & Configuration**: Manage system preferences and backups

### User Interface Approach

- **Keyboard-first navigation**: All operations accessible via keyboard shortcuts
- **Fast data entry**: Minimal clicks, tab-based navigation
- **Auto-generation**: Receipt numbers, dates, calculations handled automatically
- **Real-time updates**: Instant feedback and live calculations

---

## Database Structure

### Core Tables

#### 1. **types** (Product Types)

Stores main product categories (e.g., Apple, Orange, Mango)

- Unique type names
- Option to enable "double rent after 30 days" pricing
- Created/updated timestamps

#### 2. **subtypes** (Product Subtypes)

Stores variants within product types (e.g., Red Delicious, Fuji for Apple)

- Links to parent type
- Unique within each type
- Created/updated timestamps

#### 3. **rooms** (Storage Rooms)

Defines storage locations

- Room name
- Room type: Cold or Hot
- Number of boxes in room
- Active status

#### 4. **customers**

Customer information database

- Customer name (unique)
- Contact details (phone, email)
- Business details (company, tax number)
- Address (city, full address)
- Notes for special instructions
- Active/inactive status
- Soft delete capability

#### 5. **amad_entries** (Stock Entry Headers)

Main records for incoming inventory

- Entry date (defaults to today)
- Customer reference (links to customers table)
- Car number (vehicle identification)
- Receipt number (auto-generated: A001, A002, etc.)
- Room and box location
- Marka (brand/label)
- Storage till date (defaults to 1 month from entry)
- Remarks/notes
- Created timestamp and user

#### 6. **amad_items** (Stock Entry Line Items)

Individual items in each stock entry

- Links to amad_entry
- Type and subtype references
- Unit price and quantity
- Total price (calculated)
- Khali Jali (empty bags/containers) details:
  - Checkbox flag
  - Quantity and unit price
  - Total value
- Created timestamp

#### 7. **nikasi_entries** (Stock Clearance Headers)

Main records for outgoing inventory

- Clearance date
- Customer reference
- Car number
- Receipt number (auto-generated, sequential with amad)
- Remarks/notes
- Created timestamp and user

#### 8. **nikasi_items** (Stock Clearance Line Items)

Individual items being cleared

- Links to nikasi_entry
- Links to original amad_item
- Quantity cleared (cannot exceed available)
- Unit price (from original or updated)
- Total price (calculated)
- Khali Jali return details
- Created timestamp

#### 9. **expense_categories**

Categories for business expenses

- Category name (unique)
- Description
- Active status
- Created/updated timestamps

#### 10. **expenses**

Individual expense records

- Expense date
- Category reference
- Amount
- Description/notes
- Created/updated timestamps

#### 11. **settings**

System configuration key-value pairs

- Company information
- Printer settings
- Low stock thresholds
- Default values
- Backup preferences

### Database Relationships

```
types (1) -----> (many) subtypes
types (1) -----> (many) amad_items

customers (1) -----> (many) amad_entries

rooms (1) -----> (many) amad_entries

amad_entries (1) -----> (many) amad_items
amad_items (1) -----> (many) nikasi_items

nikasi_entries (1) -----> (many) nikasi_items

expense_categories (1) -----> (many) expenses
```

### Virtual/Calculated Data

#### Current Stock View

Not stored, calculated on-demand:

- Combine all amad_items
- Subtract all nikasi_items
- Calculate available quantity per item
- Calculate storage days
- Apply pricing rules (double rent after 30 days)
- Show current location (room/box)

---

## User Flows

### 1. Dashboard (Home Page)

**What the User Sees:**

- Welcome message with current date/time
- 6 key statistics cards:
  - Total stock items count
  - Total inventory value
  - Today's entries count
  - Today's clearances count
  - Low stock alerts count
  - Active product types count
- Quick action buttons to all modules
- Recent activity table (last 15 transactions)

**How It Works:**

- Page loads → Query database for statistics
- Display real-time numbers
- Auto-refresh when user returns from other modules
- Click any quick action → Navigate to that module
- Click on recent transaction → View details

**Keyboard Shortcuts:**

- F4: Stock Entry
- F7: Stock Clearance
- F6: Inventory View
- F8: Reports
- F9: Settings
- F10: Expenses
- F11: Customers

---

### 2. Stock Entry (Amad) Flow

**User Goal:** Record incoming inventory from a customer

**Step-by-Step Flow:**

1. **Open Form** (Press F4 or click button)

   - Form loads with today's date auto-filled
   - Receipt number auto-generated (e.g., A001)
   - Cursor in first editable field (customer dropdown)

2. **Select/Add Customer**

   - Option A: Select existing customer from dropdown
   - Option B: Type new customer name directly
   - Option C: Click "+ Add" button for detailed customer entry

   If using "+ Add":

   - Customer dialog opens
   - Enter: name (required), phone, email, company, tax number, city, address, notes
   - Press Enter on last field → Customer saved
   - New customer auto-selected in main form

3. **Enter Car Number** (Tab to field)

   - Type vehicle identification
   - Tab to next field

4. **Verify Receipt Number**

   - Already auto-generated (read-only)
   - System ensures uniqueness across both Amad and Nikasi

5. **Select Room** (Dropdown)

   - Choose Cold Room or Hot Room
   - Box number field becomes enabled

6. **Enter Box Number** (Number field)

   - Type storage box location
   - Tab to next field

7. **Enter Marka** (Optional text field)

   - Type brand/label name
   - Can skip if not applicable

8. **Set Storage Till Date** (Date picker)

   - Auto-filled with 1 month from entry date
   - Editable for custom periods
   - Used for double rent calculation

9. **Add Items** (Click "Add Item" button or shortcut)

   Item Dialog Opens:

   - Select Type (dropdown)
   - Select Subtype (appears if type has subtypes)
   - Select Bori/Jali type (dropdown)
   - Confirm Room (auto-filled from main form)
   - Enter Box Number (if different)
   - Enter Marka (optional, can differ from main)
   - Enter Unit Price (number)
   - Enter Quantity (number)
   - **Khali Jali (Empty Containers) Section:**
     - Check "Khali Jali" checkbox if applicable
     - If checked: Enter KJ quantity and unit price
     - Total calculates automatically
   - Press Enter on last field → Item added to table

   Item appears in table showing:

   - Type/Subtype
   - Bori/Jali
   - Room/Box
   - Marka
   - Unit Price × Quantity = Total
   - Khali Jali total (if applicable)
   - Actions (Edit/Delete)

10. **Add More Items** (Repeat step 9 as needed)

    - Each item adds to running total
    - Can edit or delete items from table

11. **Add Remarks** (Optional)

    - Enter any additional notes
    - Multi-line text supported

12. **Save Entry**

    - Option A: Click "Save" or press Ctrl+S
    - Option B: Click "Save & Print" or press Ctrl+P

    System validates:

    - Customer selected ✓
    - At least one item added ✓
    - All item quantities > 0 ✓
    - Receipt number unique ✓

    If valid:

    - Save to database (amad_entries + amad_items)
    - Update inventory counts
    - Generate receipt number for print
    - Show success message
    - If "Save & Print": Open print preview
    - Form clears, ready for next entry with new receipt number

**Business Rules:**

- Receipt numbers must be unique across Amad and Nikasi
- Each entry must have at least one item
- Customer selection required
- Storage till date defaults to 1 month, editable
- Khali Jali totals add to item totals
- All prices calculated automatically

---

### 3. Stock Clearance (Nikasi) Flow

**User Goal:** Record outgoing inventory

**Step-by-Step Flow:**

1. **Open Form** (Press F7 or click button)

   - Form loads with today's date
   - Receipt number auto-generated (sequential with Amad)
   - Cursor in search field

2. **Search for Stock**

   - Option A: Search by Marka (brand/label)
   - Option B: Search by Type
   - Option C: Search by Receipt number
   - Option D: Filter by Room

   Search executes → Available stock items appear in results table showing:

   - Marka
   - Type/Subtype
   - Available Quantity
   - Room/Box location
   - Unit Price
   - Entry Date

3. **Select Item to Clear**

   - Click item in results table
   - Item details populate:
     - Type/Subtype (read-only)
     - Marka (read-only)
     - Room/Box (read-only)
     - Available Quantity (display only)
     - Unit Price (editable if needed)

4. **Enter Clearance Quantity**

   - Type quantity to remove
   - System validates: quantity ≤ available quantity
   - Total calculates automatically

5. **Khali Jali Return** (If applicable)

   - Check "Return Khali Jali" if returning empty containers
   - Enter quantity and value
   - Deducted from total

6. **Add to Clearance List**

   - Click "Add to Clearance"
   - Item appears in clearance table
   - Can add multiple items to one clearance entry

7. **Enter Car Number** (Optional)

   - Vehicle taking the stock

8. **Add Remarks** (Optional)

   - Any additional notes

9. **Process Clearance**

   - Click "Save Clearance" or press Ctrl+S
   - Option: "Save & Print" (Ctrl+P)

   System validates:

   - At least one item selected ✓
   - All quantities ≤ available ✓
   - Receipt number unique ✓

   If valid:

   - Save to database (nikasi_entries + nikasi_items)
   - Reduce available stock
   - Update inventory
   - Show success message
   - If "Save & Print": Open clearance receipt
   - Form clears for next clearance

**Business Rules:**

- Cannot clear more than available quantity
- Each clearance linked to original Amad item
- Stock reduces immediately upon save
- Receipt numbers sequential and unique
- Khali Jali returns reduce total value

---

### 4. Inventory View Flow

**User Goal:** Check current stock levels and locations

**What User Sees:**

Inventory table with columns:

1. #: Row number
2. Entry Date: When stock entered
3. Customer: Who stored it
4. Marka: Brand/label
5. Type: Product type
6. Subtype: Product variant
7. Room: Storage location
8. Box: Box number
9. Available Qty: Current quantity (Amad - Nikasi)
10. Storage Till: End date
11. Days Left: Color-coded:
    - Green: > 7 days
    - Orange: ≤ 7 days
    - Red: Overdue (negative)
12. Unit Price: Original price
13. Current Price:
    - Same as unit price if < 30 days
    - **Double (in red)** if > 30 days AND type has double rent enabled
14. Total Value: Available Qty × Current Price

Bottom summary:

- Total Items: Count
- Total Quantity: Sum
- Total Value: Grand total using current prices

**Filtering Options:**

User can filter by:

- **Room**: All, Cold, Hot
- **Type**: All types or specific type
- **Marka**: Text search
- **Date Range**: From/To dates
- **Show Zero Stock**: Toggle to hide/show cleared items

**How Filtering Works:**

1. User changes filter → Table reloads
2. Query applies filters to get matching items
3. Calculate available quantities
4. Apply pricing rules
5. Display results
6. Update summary totals

**Double Rent Calculation:**

- For types with "double rent after 30 days" enabled:
  - Calculate: Today - Entry Date
  - If > 30 days: Current Price = Unit Price × 2
  - Display in red/bold to highlight
  - Type name shows ⚡ symbol

**Keyboard Actions:**

- F5: Refresh inventory
- F6: Open inventory view
- Esc: Close/return to dashboard

---

### 5. Customer Management Flow

**User Goal:** Maintain customer database

**Customer List View:**

Table showing:

- Customer Name
- Phone
- Email
- Company
- City
- Active Status

Actions available:

- Add Customer
- Edit Customer
- Delete Customer (soft delete)
- Search customers

**Add Customer Flow:**

1. Click "Add Customer" or press F11
2. Customer Dialog opens with fields:

   - Customer Name (required, unique)
   - Phone Number
   - Email
   - Company Name
   - Tax Number
   - City
   - Address (multi-line)
   - Notes (multi-line)
   - Active checkbox (default: checked)

3. Fill in details (Tab between fields)
4. Press Enter on last field or click "Save"
5. System validates:
   - Name not empty ✓
   - Name unique ✓
6. Save to database
7. Customer appears in list
8. Now available in Stock Entry dropdown

**Edit Customer Flow:**

1. Select customer from list
2. Click "Edit" or double-click customer
3. Customer Dialog opens with existing data
4. Modify fields as needed
5. Save → Updates database
6. Changes reflect everywhere customer is used

**Delete Customer Flow:**

1. Select customer from list
2. Click "Delete"
3. Confirmation dialog: "Are you sure?"
4. If yes → Soft delete (is_active = false)
5. Customer hidden from dropdowns
6. Historical stock entries remain intact

**Search Customers:**

Type in search box → Filters by:

- Customer name
- Phone number
- Email
- Company name

**Active/Inactive Filter:**

Toggle "Active Only" checkbox:

- Checked: Show only active customers
- Unchecked: Show all customers including deleted

---

### 6. Expenses Management Flow

**User Goal:** Track business expenses

**Module Structure:**

Two tabs:

1. **Expenses Tab**: Record and view expenses
2. **Categories Tab**: Manage expense categories

**Tab 1: Expenses**

Table showing:

- Date
- Category
- Amount (Rs. format)
- Description

Summary at top:

- Total Expenses: (in red, bold)
- Count: Number of expenses

**Add Expense Flow:**

1. Click "Add Expense"
2. Expense Dialog opens:
   - Date (defaults to today)
   - Category (dropdown from categories)
   - Amount (number, required, > 0)
   - Description (optional, multi-line)
3. Fill details (Tab navigation)
4. Press Enter or click "Save"
5. Validates:
   - Category selected ✓
   - Amount > 0 ✓
6. Save to database
7. Expense appears in table
8. Summary updates

**Edit Expense:**

- Select expense → Click "Edit"
- Same dialog, pre-filled
- Modify and save

**Delete Expense:**

- Select expense → Click "Delete"
- Confirm → Permanently delete

**Tab 2: Categories**

Table showing:

- Category Name
- Description

**Add Category Flow:**

1. Click "Add Category"
2. Category Dialog:
   - Category Name (required, unique)
   - Description (optional)
3. Save
4. Now available in expense dropdown

**Delete Category:**

- Only allowed if no expenses use it
- Otherwise, show error message

**Default Categories** (created on first use):

- Electricity
- Rent
- Salaries
- Maintenance
- Transportation
- Office Supplies
- Fuel
- Repairs
- Miscellaneous

---

### 7. Reports Module Flow

**User Goal:** Generate business reports

**Report Types:**

#### A. Daily Report

- Shows all transactions for selected date
- Sections:
  - Stock Entries (Amad) with totals
  - Stock Clearances (Nikasi) with totals
  - Net change (Amad total - Nikasi total)

#### B. Date Range Report

- Select: From Date, To Date
- Optional filters: Room, Type
- Shows all transactions in range
- Group by date or type (user choice)
- Summary totals

#### C. Stock Summary Report

- Current stock grouped by:
  - Room (Cold/Hot)
  - Type
  - Marka
- Shows quantities and values
- Grand total inventory value

#### D. Marka Report

- Enter/Select Marka name
- Shows:
  - All stock entries for this marka
  - All clearances for this marka
  - Current balance
  - Total value in/out

#### E. Financial Report

- Date range selection
- Shows:
  - Total Amad value (income)
  - Total Nikasi value (outgoing)
  - Total Expenses
  - Net profit/loss
  - Breakdown by category

**Report Generation Flow:**

1. Select report type (tabs or dropdown)
2. Enter parameters (dates, filters)
3. Click "Generate Report"
4. System queries database with filters
5. Calculates totals and summaries
6. Displays report in HTML preview
7. User can:
   - Print report (Ctrl+P)
   - Export to PDF
   - Export to Excel (optional)
   - Email (optional)

**Keyboard Shortcuts:**

- F8: Open Reports
- Ctrl+P: Print current report
- Esc: Close report view

---

### 8. Settings Module Flow

**User Goal:** Configure system preferences

**Settings Tabs:**

#### Tab 1: General Settings

- Company Name
- Company Address
- Phone/Email
- Tax Number
- Logo upload (optional)

#### Tab 2: Backup & Restore

- **Manual Backup:**

  - Click "Backup Now"
  - Select location
  - System exports SQLite database file
  - Show success message with file path

- **Auto Backup:**

  - Enable/Disable checkbox
  - Set frequency (daily, weekly)
  - Set backup location

- **Restore:**
  - Click "Restore from Backup"
  - Select backup file
  - Confirm (warning: will overwrite current data)
  - System imports database
  - Restart required

#### Tab 3: Printer Settings

- Default printer selection
- Receipt paper size (thermal/A4)
- Print preview by default (checkbox)
- Test print button

#### Tab 4: Default Values

- Low stock threshold (number)
- Default storage period (days, default: 30)
- Default room (Cold/Hot)
- Tax rate (if applicable)

#### Tab 5: About

- App version
- Developer info
- License information
- Help/Support contact

**Save Settings Flow:**

1. Modify any setting
2. Click "Save Settings" (bottom of form)
3. Validate inputs
4. Save to settings table (key-value pairs)
5. Show success message
6. Settings apply immediately (no restart needed unless specified)

---

## Business Logic Rules

### Stock Calculations

#### Available Quantity Formula:

```
Available Quantity =
  (Sum of Amad quantities for this item)
  -
  (Sum of Nikasi quantities for this item)
```

#### Current Price Formula:

```
Days in Storage = Today's Date - Entry Date

If (Type has "Double Rent After 30 Days" = TRUE) AND (Days in Storage > 30):
    Current Price = Original Unit Price × 2
Else:
    Current Price = Original Unit Price
```

#### Total Value Formula:

```
Item Total = (Unit Price × Quantity) + Khali Jali Total
Entry Grand Total = Sum of all Item Totals
Inventory Value = Sum of (Available Quantity × Current Price) for all items
```

### Receipt Number Generation

**Logic:**

1. Query both amad_entries and nikasi_entries tables
2. Find highest receipt number matching pattern "A[digits]"
3. Extract numeric part
4. Increment by 1
5. Format with prefix "A" and zero-padding: A001, A002, etc.
6. Ensure uniqueness before save

**Sequence Example:**

- First entry: A001
- Next Amad: A002
- Next Nikasi: A003
- Next Amad: A004

### Khali Jali (Empty Containers) Logic

**In Stock Entry (Amad):**

- If checkbox checked:
  - User enters KJ quantity and unit price
  - KJ Total = KJ Quantity × KJ Unit Price
  - Item Total = (Main Quantity × Unit Price) + KJ Total
- If unchecked:
  - KJ fields disabled
  - Item Total = Quantity × Unit Price only

**In Stock Clearance (Nikasi):**

- If "Return Khali Jali" checked:
  - User enters return quantity and value
  - Clearance Total = (Cleared Quantity × Unit Price) - KJ Return Value
- If unchecked:
  - Clearance Total = Cleared Quantity × Unit Price

### Storage Period & Double Rent

**Storage Till Date:**

- Auto-calculated: Entry Date + 30 days (default)
- User can modify
- Used to calculate "Days Left"

**Days Left Calculation:**

```
Days Left = Storage Till Date - Today's Date

Color Coding:
- Days Left > 7: Green (OK)
- Days Left ≤ 7 AND Days Left > 0: Orange (Warning)
- Days Left ≤ 0: Red (Overdue)
```

**Double Rent Application:**

- Only applies to types with "double_rent_after_30_days" = TRUE
- Calculated in Inventory View only
- Does not modify original price in database
- Visual indicators:
  - ⚡ symbol next to type name
  - Price displayed in red when doubled

### Customer Auto-Creation

**In Stock Entry:**

- If user types customer name in dropdown
- Name doesn't match existing customer
- User saves entry
- System automatically creates customer with:
  - Name = typed text
  - All other fields = NULL
  - is_active = TRUE
- Customer available immediately for future entries

**Prevents:**

- Duplicate customer names
- Case-sensitive uniqueness check

### Validation Rules

#### Stock Entry:

- ✓ Customer must be selected
- ✓ At least one item required
- ✓ All quantities must be > 0
- ✓ All prices must be ≥ 0
- ✓ Receipt number must be unique

#### Stock Clearance:

- ✓ Clearance quantity must be > 0
- ✓ Clearance quantity ≤ available quantity
- ✓ Must select at least one item
- ✓ Receipt number must be unique

#### Customer Management:

- ✓ Customer name required
- ✓ Customer name unique (case-insensitive)
- ✓ Email format valid (if provided)
- ✓ Phone format valid (if provided)

#### Expenses:

- ✓ Category must be selected
- ✓ Amount must be > 0
- ✓ Date cannot be in future
- ✓ Description max length check

#### Master Data:

- ✓ Type name unique
- ✓ Subtype unique within type
- ✓ Room name unique
- ✓ Cannot delete if has transactions

---

## UI/UX Guidelines

### Keyboard Navigation

**Form Fields:**

- Tab: Move to next field
- Shift+Tab: Move to previous field
- Enter: Move to next field OR submit form (on last field)
- Esc: Cancel/Close dialog

**Tables:**

- Arrow keys: Navigate rows
- Enter: Edit selected row
- Delete: Delete selected row
- Ctrl+F: Search/Filter

**Global Shortcuts:**

- F4: Stock Entry (Amad)
- F7: Stock Clearance (Nikasi)
- F6: Inventory View
- F8: Reports
- F9: Settings
- F10: Expenses
- F11: Customers
- Ctrl+S: Save current form
- Ctrl+P: Print current document
- Ctrl+N: New entry
- Ctrl+Q: Quit application

### Auto-Selection & Auto-Fill

**Auto-Selection:**

- When tabbing to text/number field
- Field content auto-selected
- User can type to replace OR press Tab again to keep value

**Auto-Fill:**

- Date fields: Default to today
- Receipt numbers: Auto-generated, read-only
- Storage till date: Entry date + 30 days
- Totals: Calculate automatically on quantity/price change

### Visual Feedback

**Color Coding:**

- Green: Positive, OK status (Days > 7)
- Orange: Warning (Days ≤ 7)
- Red: Critical, Error, Overdue (Days ≤ 0)
- Gray: Disabled, Read-only fields

**Icons:**

- ⚡: Double rent enabled
- ✓: Success, Completed
- ⚠️: Warning
- ❌: Error, Delete

**Loading States:**

- Show spinner when:
  - Generating reports
  - Loading large datasets
  - Saving to database
  - Printing documents

### Responsive Behavior

**Forms:**

- Modal dialogs for add/edit operations
- Full-width on mobile
- Side-by-side fields on desktop
- Sticky action buttons at bottom

**Tables:**

- Horizontal scroll on small screens
- Sortable columns (click header)
- Filterable (search box at top)
- Pagination for large datasets (50 rows per page)

**Dashboard:**

- Stack cards vertically on mobile
- Grid layout on desktop (2-3 columns)
- Collapsible sections

---

## Validation & Error Handling

### Client-Side Validation

**Before Form Submit:**

1. Check all required fields filled
2. Validate formats (email, phone, numbers)
3. Check value ranges (quantities > 0, etc.)
4. Check uniqueness constraints (receipt numbers, customer names)
5. Show inline error messages
6. Focus first invalid field
7. Prevent submission if invalid

**Real-Time Validation:**

- As user types in fields
- Show red border if invalid
- Show green checkmark if valid
- Display hint text for format requirements

### Server-Side Validation

**On Database Save:**

1. Re-validate all constraints
2. Check foreign key integrity
3. Verify business rules
4. Handle database errors gracefully

### Error Messages

**User-Friendly Messages:**

- ❌ "Customer name is required"
- ❌ "Receipt number A005 already exists"
- ❌ "Cannot clear 100 units - only 50 available"
- ❌ "Amount must be greater than zero"
- ❌ "Invalid email format"

**Technical Errors (Log, Don't Show):**

- Database connection failures
- SQL errors
- Server errors

**Success Messages:**

- ✓ "Stock entry saved successfully!"
- ✓ "Customer added"
- ✓ "Expense recorded"
- ✓ "Settings updated"

### Edge Cases

#### Customer Deleted

- Soft delete only (is_active = false)
- Historical entries remain visible
- Customer name still shows in old records
- Cannot select in new entries

#### Type/Subtype Deletion

- If type has items: Show error, prevent deletion
- Suggest: Mark as inactive instead
- If no items: Allow deletion

#### Database Backup Failure

- Show error message
- Suggest manual export
- Log error details
- Don't crash application

---

## Print Layouts

### Stock Entry Receipt

**Header:**

- Company Name (from settings)
- Company Address
- Phone/Email
- Date & Time

**Body:**

- Receipt No: A001
- Entry Date: DD/MM/YYYY
- Customer: [Name]
- Car Number: [Number]
- Room: [Cold/Hot]
- Box: [Number]
- Marka: [Label]

**Items Table:**
| # | Type | Subtype | Qty | Price | Total |
|---|------|---------|-----|-------|-------|
| 1 | Apple | Fuji | 100 | 50 | 5,000 |
| 2 | Orange | - | 50 | 30 | 1,500 |

**Khali Jali (if applicable):**

- KJ Quantity: 10
- KJ Price: 20
- KJ Total: 200

**Footer:**

- Grand Total: Rs. 6,700
- Remarks: [If any]
- Generated by: [User]
- Signature line

### Stock Clearance Receipt

**Similar layout to Entry Receipt, but:**

- Title: "Stock Clearance Receipt"
- Shows "Cleared Quantity" instead of "Quantity"
- Shows "Original Entry Receipt" reference
- Shows "Remaining Stock" after clearance
- KJ Return section (if applicable)

---

## Reports Layout

### Daily Report

**Header:**

- Report: Daily Transactions
- Date: [Selected Date]
- Generated: [Timestamp]

**Section 1: Stock Entries**

- Table of all Amad entries
- Columns: Time, Receipt, Customer, Marka, Items Count, Total
- Subtotal: Total Amad Value

**Section 2: Stock Clearances**

- Table of all Nikasi entries
- Columns: Time, Receipt, Customer, Marka, Items Count, Total
- Subtotal: Total Nikasi Value

**Section 3: Summary**

- Total Entries: X
- Total Clearances: Y
- Net Change: X - Y
- Ending Stock Value: [Calculated]

### Stock Summary Report

**Group By Room:**

- Cold Room:
  - Type A: Qty, Value
  - Type B: Qty, Value
  - Subtotal
- Hot Room:
  - Type A: Qty, Value
  - Type B: Qty, Value
  - Subtotal
- **Grand Total**

**Group By Type:**

- Type A:
  - Cold Room: Qty, Value
  - Hot Room: Qty, Value
  - Subtotal
- Type B:
  - Cold Room: Qty, Value
  - Hot Room: Qty, Value
  - Subtotal
- **Grand Total**

---



- Index frequently queried columns (marka, receipt_number, entry_date)
- Use pagination for large tables
- Limit result sets (default: 50 rows)
- Use database views for complex queries (current_stock)

**Avoid:**

- N+1 queries (use Prisma includes)
- Full table scans
- Unnecessary joins

### Caching

**Cache:**

- Master data (types, subtypes, rooms, categories)
- Settings configuration
- User preferences

**Invalidate:**

- On data mutation (add/edit/delete)
- Manual refresh (F5)
- Time-based expiration (optional)

### Loading States

**Show loaders for:**

- Report generation (> 1 second)
- Large data fetches (> 500 rows)
- File uploads/downloads
- Print operations

---

## Testing Scenarios

### Critical Flows to Test

1. **Stock Entry:**

   - Add entry with multiple items
   - Add entry with Khali Jali
   - Edit existing entry
   - Delete entry
   - Print receipt
   - Duplicate receipt number prevention

2. **Stock Clearance:**

   - Clear full quantity
   - Clear partial quantity
   - Cannot clear more than available
   - Multiple items in one clearance
   - Khali Jali return

3. **Inventory:**

   - Filter by room
   - Filter by type
   - Filter by marka
   - Double rent calculation
   - Days left color coding
   - Zero stock visibility

4. **Customer Management:**

   - Add customer
   - Edit customer
   - Delete customer (soft)
   - Duplicate name prevention
   - Auto-create from Stock Entry

5. **Reports:**
   - Daily report accuracy
   - Date range report
   - Stock summary calculations
   - Print functionality
   - Export to PDF

### Edge Cases

- Empty database (first use)
- Very large datasets (> 10,000 records)
- Concurrent users (if multi-user)
- Network failures
- Database errors
- Print driver issues

---

## Security Considerations

### Data Protection

- Validate all inputs server-side
- Sanitize user inputs
- Use Prisma (prevents SQL injection)
- Implement rate limiting on API routes
- Use environment variables for sensitive config

### Access Control (Optional)

- User authentication (if multi-user)
- Role-based permissions (admin vs operator)
- Activity logging
- Session management

### Backup Strategy

- Daily auto-backups
- Encrypted backup files
- Off-site backup storage
- Restore testing

---

## Deployment Notes

### Environment Variables

```env
DATABASE_URL="file:./cold_storage.db"
NEXT_PUBLIC_APP_NAME="Cold Storage POS"
NEXT_PUBLIC_COMPANY_NAME="Your Company"
```

### Build Process

1. Install dependencies: `npm install`
2. Generate Prisma Client: `npx prisma generate`
3. Run migrations: `npx prisma migrate deploy`
4. Build Next.js: `npm run build`
5. Start production: `npm run start`

### Database Migrations

- Use Prisma Migrate for schema changes
- Test migrations on copy of production data
- Backup before migration
- Roll back strategy if migration fails

---

## Future Enhancements

### Phase 2 Features:

- Barcode/QR code scanning
- SMS notifications for storage expiry
- WhatsApp receipt delivery
- Multi-warehouse support
- Mobile app (React Native)

### Phase 3 Features:

- Accounting integration
- Customer portal (online stock check)
- Advanced analytics dashboard
- Predictive stock alerts
- API for third-party integrations

---

## Conclusion

This flow document provides a complete blueprint for implementing the Cold Storage POS system in Next.js with SQLite and Prisma. Focus on:

1. **User Experience**: Fast, keyboard-driven workflows
2. **Data Integrity**: Robust validation and error handling
3. **Business Logic**: Accurate calculations and reporting
4. **Performance**: Optimized queries and caching
5. **Maintainability**: Clean architecture and documentation

Build incrementally, test thoroughly, and iterate based on user feedback.

---

**Document Version:** 1.0  
**Last Updated:** November 14, 2025  
**Based on:** PyQt5 Desktop Application (Sessions 1-14)
