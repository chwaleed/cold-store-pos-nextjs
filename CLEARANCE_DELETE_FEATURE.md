# Clearance Receipt Delete Feature

## Overview

Added the ability to delete clearance receipts with complete reversal of all related data.

## What Gets Reverted When Deleting a Clearance Receipt

### 1. Stock/Inventory

- **Entry Items**: Restores both product quantity and Khali Jali (KJ) quantity back to the original entry items
- The `remainingQuantity` and `remainingKjQuantity` fields are incremented by the cleared amounts

### 2. Ledger Entries

- All ledger entries associated with the clearance receipt are deleted
- This includes:
  - Discount entries (if any)
  - Payment entries (if any)
  - Any other ledger transactions linked to this clearance

### 3. Cash Book

- All cash book entries related to this clearance are removed
- This includes payment inflows that were recorded when the clearance was created

### 4. Daily Cash Summary

- The daily cash summary for the clearance date is recalculated
- Opening balance, total inflows, total outflows, and closing balance are all updated

### 5. Clearance Data

- The clearance receipt itself is deleted
- All cleared items (line items) are deleted via cascade

## Implementation Details

### Backend (API)

**File**: `app/api/clearance/[id]/route.ts`

The DELETE endpoint already existed and handles:

```typescript
- Validates clearance exists
- Uses a transaction to ensure atomicity
- Restores quantities to entry items
- Deletes ledger entries
- Deletes clearance receipt (cascade deletes cleared items)
- Removes cash book entries via updateCashBookEntryForSource()
- Updates daily cash summary
```

### Frontend (UI)

#### 1. Clearance Table Component

**File**: `components/clearance/clearance-table.tsx`

Added:

- Delete button (trash icon) in the Actions column
- Confirmation dialog with detailed explanation of what will be reverted
- Loading state during deletion
- Success/error toast notifications
- Automatic list refresh after successful deletion

#### 2. Clearance Preview Component

**File**: `components/clearance/clearance-recipt-preview.tsx`

Added:

- Delete button in the header toolbar
- Same confirmation dialog as table view
- Redirects to clearance list after successful deletion
- Loading state and error handling

## User Experience

### Confirmation Dialog

When clicking delete, users see a dialog that clearly explains:

- The action is permanent and cannot be undone
- Stock quantities will be restored
- Ledger entries will be removed
- Cash book entries will be deleted
- Daily cash summary will be updated

### Safety Features

- Confirmation required before deletion
- Button disabled during deletion process
- Clear feedback via toast notifications
- Transaction-based deletion ensures data consistency

## Usage

### From Clearance List

1. Navigate to clearance list page
2. Click the trash icon in the Actions column
3. Review the confirmation dialog
4. Click "Delete" to confirm or "Cancel" to abort

### From Clearance Preview

1. Open a clearance receipt
2. Click the "Delete" button in the header
3. Review the confirmation dialog
4. Click "Delete Receipt" to confirm or "Cancel" to abort

## Technical Notes

- All database operations are wrapped in a transaction for data integrity
- The deletion is atomic - either everything succeeds or nothing changes
- Cash book integration is handled via the existing `updateCashBookEntryForSource()` helper
- Daily cash summary recalculation happens after the transaction completes
- The UI components use React state management for loading and dialog states
