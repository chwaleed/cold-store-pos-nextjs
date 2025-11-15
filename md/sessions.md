# Cold Store Management System - Development Sessions

**Goal:** Build a fully functional, usable product rapidly in less than 10 focused sessions.

---

## Session 1: Database Setup & Basic Configuration

**Priority:** CRITICAL  
**Duration:** 1-2 hours

### Objectives:

- Set up Prisma schema based on `scheem.ts`
- Create database migrations
- Seed initial data

### Tasks:

1. Create Prisma schema with all models:

   - Customer
   - ProductType, ProductSubType
   - Room, PackType
   - EntryReceipt, EntryItem
   - ClearanceReceipt, ClearedItem
   - Ledger (simplified credit system)

2. Add initial seed data:

   - 2-3 sample product types (Potato, Onion, Garlic)
   - 2-3 subtypes per type
   - 2-3 rooms (1 Cold, 1 Hot)
   - 2 pack types (Bori @ 2 PKR/day, Jali @ 1.5 PKR/day)

3. Test database operations (CRUD)

### Deliverables:

- Working database with schema
- Seed data script
- Basic Prisma client setup

---

## Session 2: Customer Management

**Priority:** HIGH  
**Duration:** 2-3 hours

### Objectives:

- Build complete customer management functionality
- Enable customer creation, search, and viewing

### Tasks:

1. Create API routes:

   - `POST /api/customer` - Add new customer
   - `GET /api/customer` - List/search customers
   - `GET /api/customer/[id]` - Get customer details
   - `PUT /api/customer/[id]` - Update customer

2. Build UI components:

   - Customer list page with search
   - Add customer form (modal or page)
   - Customer details view
   - Edit customer form

3. Implement search by:
   - Name (partial match)
   - Phone
   - CNIC
   - Village

### Deliverables:

- Fully functional customer management
- Search and filter capabilities
- Form validation (Zod schema)

---

## Session 3: Configuration Management

**Priority:** HIGH  
**Duration:** 2 hours

### Objectives:

- Build settings page for system configuration
- Enable management of product types, rooms, and pack types

### Tasks:

1. Create API routes for:

   - Product Types (CRUD)
   - Product SubTypes (CRUD)
   - Rooms (CRUD)
   - Pack Types (CRUD with rent rates)

2. Build Settings page with tabs:

   - Product Types & SubTypes management
   - Room management
   - Pack Type & Rent Rate management

3. Add validation:
   - Unique names
   - Cannot delete if in use

### Deliverables:

- Complete settings/configuration page
- All configuration CRUD operations working

---

## Session 4: Inventory Entry (Part 1 - Basic Entry)

**Priority:** CRITICAL  
**Duration:** 3-4 hours

### Objectives:

- Build inventory entry form
- Enable recording of products coming into storage

### Tasks:

1. Create API route:

   - `POST /api/entry` - Create inventory entry
   - `GET /api/entry` - List all entries
   - `GET /api/entry/[id]` - Get entry details

2. Build inventory entry form:

   - Customer selection (searchable dropdown)
   - Car number input
   - Auto-generate receipt number
   - Dynamic item array
   - Item fields:
     - Product type & subtype
     - Pack type
     - Room
     - Quantity
     - Unit price
     - Box number, Marka (optional)
     - Khali Jali checkbox with KJ fields

3. Calculate totals:

   - Item total = quantity × unitPrice
   - KJ total = kjQuantity × kjUnitPrice
   - Grand total per item
   - Overall total

4. Validation:
   - Unique receipt number
   - All required fields
   - At least one item

### Deliverables:

- Working inventory entry form
- Save entry to database
- View entry list

---

## Session 5: Inventory Entry (Part 2 - View & Receipt)

**Priority:** HIGH  
**Duration:** 2 hours

### Objectives:

- Display inventory entries
- Generate printable receipt

### Tasks:

1. Build inventory list page:

   - Show all entries
   - Filters: date range, customer, receipt number
   - View details button

2. Build entry details view:

   - Show all entry information
   - Item-wise details
   - Remaining quantities

3. Create printable receipt:
   - Format for printing
   - Include all item details
   - Show totals
   - Export as PDF (optional)

### Deliverables:

- Inventory list with filters
- Entry details page
- Printable receipt

---

## Session 6: Clearance (Part 1 - Basic Clearance)

**Priority:** CRITICAL  
**Duration:** 4-5 hours

### Objectives:

- Build clearance process
- Calculate rent automatically
- Record items being removed from storage

### Tasks:

1. Create API routes:

   - `POST /api/clearance` - Create clearance
   - `GET /api/clearance` - List clearances
   - `GET /api/clearance/[id]` - Get clearance details

2. Build clearance form (multi-step):

   - **Step 1:** Select customer (show only customers with inventory)
   - **Step 2:** Select entry receipt
   - **Step 3:** Select items to clear
   - **Step 4:** Specify quantities to clear
   - Auto-calculate:
     - Days stored = clearanceDate - entryDate
     - Rent per unit per day (from PackType)
     - Total rent = quantity × days × rentPerDay

3. Update remaining quantities:

   - EntryItem.remainingQuantity -= quantityCleared

4. Create ledger entry (DEBIT):
   - Description: "Rent for Clearance [CL-XXX]"
   - debitAmount = totalRent
   - creditAmount = 0

### Deliverables:

- Working clearance form
- Rent calculation logic
- Remaining quantity tracking
- Ledger debit entry

---

## Session 7: Clearance (Part 2 - Payment & Receipt)

**Priority:** CRITICAL  
**Duration:** 2-3 hours

### Objectives:

- Handle payment at clearance
- Generate clearance receipt
- Update ledger with payment

### Tasks:

1. Add payment section to clearance form:

   - Total rent (calculated)
   - Rent paid (input field, default 0)
   - Rent pending (auto-calculated)

2. Create ledger entry if payment made (CREDIT):

   - Description: "Payment for Clearance [CL-XXX]"
   - debitAmount = 0
   - creditAmount = rentPaid

3. Build clearance receipt:

   - Clearance number
   - Customer details
   - Items cleared with quantities
   - Days stored
   - Rent calculation breakdown
   - Rent paid
   - Rent pending
   - Print/PDF export

4. Build clearance list page:
   - Show all clearances
   - Filters: date, customer
   - View details

### Deliverables:

- Payment handling at clearance
- Clearance receipt (printable)
- Ledger credit entry for payments
- Clearance list view

---

## Session 8: Payment & Ledger Management

**Priority:** HIGH  
**Duration:** 2-3 hours

### Objectives:

- Record standalone payments
- View customer ledger
- Calculate customer balance

### Tasks:

1. Create API routes:

   - `POST /api/payment` - Record payment
   - `GET /api/payment` - List payments
   - `GET /api/ledger/customer/[id]` - Get customer ledger

2. Build payment form:

   - Select customer
   - Payment date
   - Amount
   - Payment mode (Cash/Bank/Cheque)
   - Reference number
   - Notes
   - Optional: Link to specific clearance

3. Create ledger entry (CREDIT):

   - Description: "Payment received"
   - debitAmount = 0
   - creditAmount = amount

4. Build customer ledger view:

   - Show all transactions
   - Columns: Date, Description, Debit, Credit, Balance
   - Calculate running balance
   - Filter by date range
   - Export/Print statement

5. Show customer balance on customer details page

### Deliverables:

- Payment recording functionality
- Customer ledger view
- Balance calculation
- Payment receipt

---

## Session 9: Dashboard & Reports

**Priority:** MEDIUM  
**Duration:** 3 hours

### Objectives:

- Build dashboard with key metrics
- Generate basic reports

### Tasks:

1. Build dashboard page with widgets:

   - Total customers
   - Active inventory entries
   - Total items in storage
   - Total outstanding balance
   - Recent entries (last 5)
   - Recent clearances (last 5)
   - Recent payments (last 5)

2. Create basic reports:

   - **Current Stock Report:**
     - By customer
     - By room
     - By product type
   - **Customer Balance Report:**
     - All customers with balances
     - Sort by balance amount
   - **Daily Collection Report:**
     - Payments received in date range
     - Total collected

3. Add filters and export (PDF/CSV)

### Deliverables:

- Functional dashboard
- 3 essential reports
- Export functionality

---

## Session 10: Polish & Testing

**Priority:** MEDIUM  
**Duration:** 2-3 hours

### Objectives:

- Bug fixes and refinements
- User experience improvements
- Basic testing

### Tasks:

1. UI/UX improvements:

   - Loading states
   - Error messages
   - Success notifications (toast)
   - Confirm dialogs for critical actions

2. Validation improvements:

   - Better error messages
   - Form validation feedback

3. Testing:

   - Test complete workflow: Entry → Clearance → Payment
   - Test edge cases:
     - Same day clearance (1 day minimum)
     - Partial clearance
     - Zero payment clearance
     - Multiple payments
   - Test calculations accuracy

4. Add helpful features:

   - Keyboard shortcuts
   - Auto-focus on form fields
   - Search debouncing
   - Date pickers

5. Documentation:
   - Add tooltips
   - Help text for complex fields

### Deliverables:

- Polished, tested application
- All critical workflows working
- Better user experience

---

## Post-MVP Enhancements (Future Sessions)

### Session 11+: Advanced Features

- Cash advance to customers
- Discount management
- Advanced reporting (monthly revenue, room utilization)
- Print customization (Urdu/English)
- Database backup/restore
- Multi-user support with authentication
- Receipt templates customization
- SMS notifications (optional)
- Excel import/export

---

## Success Criteria

After Session 10, the system should be able to:

✅ **Manage Customers**

- Add, search, view, edit customers

✅ **Configure System**

- Manage product types, subtypes, rooms, pack types
- Set rent rates

✅ **Record Inventory**

- Create entry receipts
- Track items in storage
- Print entry receipts

✅ **Process Clearance**

- Clear items from storage
- Auto-calculate rent
- Handle partial/full clearance
- Generate clearance receipts

✅ **Handle Payments**

- Record payments at clearance
- Record standalone payments
- Link payments to clearances

✅ **Maintain Ledger**

- Track all financial transactions
- Calculate customer balances
- View ledger statement

✅ **Generate Reports**

- Dashboard with key metrics
- Stock reports
- Balance reports
- Collection reports

---

## Development Guidelines

1. **Database First:** Ensure schema is correct before building UI
2. **API Layer:** Build and test API routes before UI
3. **Validation:** Use Zod for both client and server validation
4. **Components:** Reuse shadcn/ui components
5. **State Management:** Use React Hook Form for forms
6. **Error Handling:** Handle all errors gracefully
7. **Testing:** Test each feature as you build
8. **Commits:** Commit after each session

---

## Tech Stack Reminder

- **Framework:** Next.js 14+ (App Router)
- **Language:** TypeScript
- **Database:** SQLite + Prisma ORM
- **UI:** Tailwind CSS + shadcn/ui
- **Forms:** React Hook Form + Zod
- **Date:** date-fns
- **Charts:** Recharts (for dashboard)
- **PDF:** react-pdf or jsPDF (for receipts)

---

## Notes

- Focus on **core functionality** first
- Keep UI **simple and clean**
- Prioritize **data accuracy** and **calculation correctness**
- Make it **usable** over making it perfect
- Can always refine and add features later

**Target Timeline:** 20-30 hours of focused development to complete all 10 sessions.
