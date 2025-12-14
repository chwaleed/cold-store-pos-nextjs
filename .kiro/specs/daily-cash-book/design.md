# Daily Cash Book Design Document

## Overview

The Daily Cash Book feature provides a centralized cash transaction management system that automatically captures cash flows from existing modules (clearance, ledger, expenses) while allowing manual cash transaction entries. The system maintains daily cash balances and provides comprehensive reporting capabilities for financial oversight and reconciliation.

## Architecture

The Daily Cash Book follows the existing application architecture pattern:

- **Frontend**: React components using Next.js App Router
- **Backend**: API routes with Prisma ORM for database operations
- **Database**: SQLite with new cash book tables integrated into existing schema
- **Integration**: Event-driven updates from existing modules (clearance, ledger, expenses)

### Integration Points

1. **Clearance Module**: Automatic cash inflow recording when clearance receipts include payment amounts
2. **Ledger Module**: Automatic cash transaction recording for direct cash entries
3. **Expense Module**: Automatic cash outflow recording for all expense entries
4. **Navigation**: New sidebar menu item for cash book access

## Components and Interfaces

### Database Schema

#### CashBookEntry Model

```prisma
model CashBookEntry {
  id                Int      @id @default(autoincrement())
  date              DateTime @default(now())
  transactionType   String   // 'inflow' or 'outflow'
  amount            Float
  description       String
  source            String   // 'clearance', 'ledger', 'expense', 'manual'
  referenceId       Int?     // ID of source transaction (clearanceId, ledgerId, expenseId)
  referenceType     String?  // Type of reference ('clearance_receipt', 'ledger_entry', 'expense')
  customerId        Int?     // Optional customer reference
  createdBy         String?  // User who created manual entries
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt

  customer          Customer? @relation(fields: [customerId], references: [id])

  @@index([date])
  @@index([transactionType])
  @@index([source])
  @@index([referenceId, referenceType])
}

model DailyCashSummary {
  id              Int      @id @default(autoincrement())
  date            DateTime @unique
  openingBalance  Float    @default(0)
  totalInflows    Float    @default(0)
  totalOutflows   Float    @default(0)
  closingBalance  Float    @default(0)
  isReconciled    Boolean  @default(false)
  reconciledBy    String?
  reconciledAt    DateTime?
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  @@index([date])
}
```

### API Endpoints

#### Cash Book API (`/api/cash-book`)

- `GET /api/cash-book?date=YYYY-MM-DD` - Get cash transactions for specific date
- `POST /api/cash-book` - Create manual cash transaction
- `PUT /api/cash-book/[id]` - Update manual cash transaction
- `DELETE /api/cash-book/[id]` - Delete manual cash transaction

#### Daily Summary API (`/api/cash-book/summary`)

- `GET /api/cash-book/summary?date=YYYY-MM-DD` - Get daily cash summary
- `POST /api/cash-book/summary` - Set opening balance for a date
- `PUT /api/cash-book/summary/[id]` - Update daily summary

#### Reports API (`/api/cash-book/reports`)

- `GET /api/cash-book/reports?from=DATE&to=DATE` - Get cash book report for date range

### Frontend Components

#### Main Cash Book Page (`/cash-book`)

- **CashBookPage**: Main container component
- **DateSelector**: Date navigation and selection
- **CashSummaryCard**: Daily totals display (opening, inflows, outflows, closing)
- **TransactionList**: List of all cash transactions for selected date
- **AddTransactionDialog**: Modal for manual transaction entry
- **OpeningBalanceDialog**: Modal for setting daily opening balance

#### Supporting Components

- **TransactionRow**: Individual transaction display with edit/delete actions
- **CashBookFilters**: Filter transactions by type, source, customer
- **CashBookReports**: Report generation and export functionality
- **CashBookPrint**: Print-friendly transaction layouts

## Data Models

### CashBookEntry

```typescript
interface CashBookEntry {
  id: number;
  date: Date;
  transactionType: 'inflow' | 'outflow';
  amount: number;
  description: string;
  source: 'clearance' | 'ledger' | 'expense' | 'manual';
  referenceId?: number;
  referenceType?: 'clearance_receipt' | 'ledger_entry' | 'expense';
  customerId?: number;
  customer?: Customer;
  createdBy?: string;
  createdAt: Date;
  updatedAt: Date;
}
```

### DailyCashSummary

```typescript
interface DailyCashSummary {
  id: number;
  date: Date;
  openingBalance: number;
  totalInflows: number;
  totalOutflows: number;
  closingBalance: number;
  isReconciled: boolean;
  reconciledBy?: string;
  reconciledAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}
```

### ManualTransactionInput

```typescript
interface ManualTransactionInput {
  date: Date;
  transactionType: 'inflow' | 'outflow';
  amount: number;
  description: string;
  customerId?: number;
}
```

## Correctness Properties

_A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees._

### Property Reflection

After reviewing all properties identified in the prework, I've identified several areas for consolidation:

**Redundancy Elimination:**

- Properties 1.1, 5.1 are identical (clearance integration) - consolidate into one
- Properties 1.2, 5.2 are identical (ledger integration) - consolidate into one
- Properties 1.3, 5.3 are identical (expense integration) - consolidate into one
- Properties 2.1 and 2.2 can be combined into one comprehensive manual entry property
- Properties 3.3, 6.1, 6.2, 6.3, 6.5 are specific examples rather than universal properties

**Property 1: Automatic clearance integration**
_For any_ clearance receipt with a payment amount, creating the clearance should result in a corresponding cash inflow transaction in the cash book with matching amount and reference
**Validates: Requirements 1.1, 5.1**

**Property 2: Automatic ledger integration**
_For any_ direct cash ledger entry, creating the ledger entry should result in a corresponding cash book transaction with matching amount, type, and reference
**Validates: Requirements 1.2, 5.2**

**Property 3: Automatic expense integration**
_For any_ expense entry, creating the expense should result in a corresponding cash outflow transaction in the cash book with matching amount and reference
**Validates: Requirements 1.3, 5.3**

**Property 4: Daily transaction retrieval ordering**
_For any_ date with multiple cash transactions, retrieving transactions for that date should return them in chronological order by creation time
**Validates: Requirements 1.4**

**Property 5: Daily balance calculations**
_For any_ date with cash transactions, the closing balance should equal opening balance plus total inflows minus total outflows
**Validates: Requirements 1.5**

**Property 6: Manual transaction creation**
_For any_ valid manual transaction input (with required fields), creating the transaction should result in a stored cash book entry with matching data and source marked as "manual"
**Validates: Requirements 2.1, 2.2**

**Property 7: Required field validation**
_For any_ manual transaction input missing required fields (description, amount, transaction type, or date), the creation attempt should be rejected with appropriate validation errors
**Validates: Requirements 2.3**

**Property 8: Real-time total updates**
_For any_ manual transaction creation, the daily cash totals should be immediately recalculated to reflect the new transaction
**Validates: Requirements 2.4**

**Property 9: Transaction persistence with audit trail**
_For any_ manual transaction creation, the saved entry should include proper timestamps, user information, and audit metadata
**Validates: Requirements 2.5**

**Property 10: Date range summary retrieval**
_For any_ valid date range, retrieving cash summaries should return exactly one summary per date in the range with correct calculations
**Validates: Requirements 3.1**

**Property 11: Report content completeness**
_For any_ daily cash report generation, the report should include all required fields: opening balance, closing balance, total inflows, total outflows, and net cash flow
**Validates: Requirements 3.2**

**Property 12: Transaction detail display completeness**
_For any_ cash transaction with source references, displaying the transaction should include transaction source, reference numbers, customer information, and amounts
**Validates: Requirements 3.4**

**Property 13: Opening balance setting**
_For any_ new business day, setting an opening balance should store the value and use it for all subsequent calculations for that date
**Validates: Requirements 4.1**

**Property 14: Default opening balance calculation**
_For any_ date with a previous day's data, the default opening balance should equal the previous day's closing balance
**Validates: Requirements 4.2**

**Property 15: Opening balance modification effects**
_For any_ opening balance modification, all dependent calculations for that day (closing balance, net flow) should be recalculated immediately
**Validates: Requirements 4.4**

**Property 16: Opening balance audit trail**
_For any_ opening balance change, an audit record should be created with timestamp, user, old value, and new value
**Validates: Requirements 4.5**

**Property 17: Source transaction traceability**
_For any_ automatically created cash book entry, the entry should contain valid references to the source transaction for complete traceability
**Validates: Requirements 5.4**

**Property 18: Source transaction consistency**
_For any_ source transaction modification or deletion, the corresponding cash book entries should be updated or removed to maintain data consistency
**Validates: Requirements 5.5**

## Error Handling

### Validation Errors

- **Invalid Amount**: Reject negative amounts or zero values for cash transactions
- **Missing Required Fields**: Validate presence of description, amount, transaction type, and date
- **Invalid Date**: Reject future dates or malformed date inputs
- **Invalid Customer Reference**: Validate customer exists when customer ID is provided

### Integration Errors

- **Source Transaction Not Found**: Handle cases where referenced source transactions are deleted
- **Duplicate Transaction Prevention**: Prevent duplicate cash book entries for the same source transaction
- **Calculation Errors**: Handle edge cases in balance calculations (overflow, precision)

### Concurrency Handling

- **Simultaneous Updates**: Use database transactions to prevent race conditions in balance calculations
- **Optimistic Locking**: Implement version control for daily summaries to prevent conflicting updates

## Testing Strategy

### Unit Testing

The system will use Jest for unit testing with the following focus areas:

- API endpoint validation and error handling
- Database operations and data integrity
- Business logic for balance calculations
- Integration points with existing modules

### Property-Based Testing

The system will use fast-check (JavaScript property-based testing library) for comprehensive property validation:

- Each property-based test will run a minimum of 100 iterations to ensure thorough coverage
- Property tests will generate random valid inputs to verify universal behaviors
- Each property-based test will be tagged with comments referencing the specific correctness property from this design document

**Property-based testing requirements:**

- Use fast-check library for JavaScript/TypeScript property-based testing
- Configure each property test to run minimum 100 iterations
- Tag each test with format: `**Feature: daily-cash-book, Property {number}: {property_text}**`
- Generate realistic test data that respects business constraints
- Test edge cases through property generators (boundary values, empty sets, large datasets)

**Integration Testing:**

- Test automatic cash book entry creation from clearance, ledger, and expense modules
- Verify data consistency across module boundaries
- Test error propagation and rollback scenarios

**End-to-End Testing:**

- Test complete user workflows from navigation to transaction creation
- Verify report generation and export functionality
- Test daily cash reconciliation processes
