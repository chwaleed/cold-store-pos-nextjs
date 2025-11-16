# Double Rent After 30 Days - Testing Guide

## Overview

This feature allows product types to automatically double their rental price after 30 days in storage, with visual indicators in the inventory.

## Implementation Summary

### Backend Changes

1. **Database Schema** (`prisma/schema.prisma`)

   - Field `doubleRentAfter30Days` already exists in ProductType model
   - Type: Boolean with default value `false`

2. **API Schemas** (`schema/config.ts`)

   - ✅ Added `doubleRentAfter30Days` to `productTypeSchema`
   - ✅ Added `doubleRentAfter30Days` to `updateProductTypeSchema`

3. **TypeScript Types** (`types/config.ts`)

   - ✅ Added `doubleRentAfter30Days: boolean` to ProductType interface

4. **Inventory API** (`app/api/inventory/route.ts`)
   - ✅ Calculates `displayDays` - shows negative days after 30 days for types with doubleRent enabled
   - ✅ Doubles the price when `doubleRentAfter30Days` is true and days > 30
   - ✅ Returns `hasDoubleRentEnabled` flag and `displayDays` for frontend

### Frontend Changes

1. **Product Type Manager** (`components/setting/product-type-manager.tsx`)

   - ✅ Added checkbox for "Double Amount After 30 Days"
   - ✅ Form now includes `doubleRentAfter30Days` field
   - ✅ Edit mode properly loads the checkbox state
   - ✅ Includes helpful description of the feature

2. **Inventory Table** (`components/inventory/inventory-table.tsx`)
   - ✅ Added lightning icon (⚡) next to product types with double rent active
   - ✅ Shows negative days in red color when storage exceeds 30 days
   - ✅ Icon only appears when both `hasDoubleRentEnabled` is true AND `isDoubleRent` is true

## Testing Instructions

### 1. Create a Product Type with Double Rent Enabled

1. Navigate to **Settings** page
2. Click on **Product Types** tab
3. Click **Add Product Type**
4. Enter a name (e.g., "Premium Potato")
5. ✅ Check the **"Double Amount After 30 Days"** checkbox
6. Click **Create**

### 2. Create a Product Type WITHOUT Double Rent

1. Create another product type (e.g., "Regular Onion")
2. ❌ Leave the checkbox unchecked
3. Click **Create**

### 3. Create Entry Items

1. Create entry receipts with items for both product types
2. Set different entry dates to test:
   - Some items from 25 days ago
   - Some items from 35 days ago (to test the 30-day threshold)
   - Some items from today

### 4. View Inventory

1. Navigate to **Inventory** page
2. Verify the following:

#### For items with doubleRent ENABLED and > 30 days:

- ⚡ Lightning icon appears next to product name
- Days shown as negative (e.g., "-5 days" if 35 days old)
- Days displayed in red color
- Unit price is doubled in calculations

#### For items with doubleRent ENABLED but < 30 days:

- ❌ No lightning icon
- Normal day count (e.g., "25 days")
- Normal pricing

#### For items with doubleRent DISABLED:

- ❌ No lightning icon regardless of days
- Normal day count
- Normal pricing

### 5. Edit Product Type

1. Go back to **Settings** > **Product Types**
2. Click edit on a product type
3. Toggle the **"Double Amount After 30 Days"** checkbox
4. Click **Update**
5. Verify changes reflect in inventory

### 6. API Testing

#### Test Product Type Creation

```bash
curl -X POST http://localhost:3000/api/producttype \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Product",
    "doubleRentAfter30Days": true
  }'
```

#### Test Product Type Update

```bash
curl -X PUT http://localhost:3000/api/producttype/1 \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Updated Product",
    "doubleRentAfter30Days": false
  }'
```

#### Test Inventory API

```bash
curl http://localhost:3000/api/inventory
```

Expected response should include:

```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "typeName": "Premium Potato",
      "daysInStorage": 35,
      "displayDays": -5,
      "isDoubleRent": true,
      "hasDoubleRentEnabled": true,
      "currentPrice": 200,
      "unitPrice": 100
    }
  ]
}
```

## Visual Indicators

### In Settings Form:

- Checkbox with label "Double Amount After 30 Days"
- Description: "Automatically double the rental price for items stored longer than 30 days"

### In Inventory Table:

- ⚡ **Lightning Icon**: Yellow filled lightning bolt (Zap icon from lucide-react)
- **Negative Days**: Displayed in red text when days > 30 for enabled types
- **Product Column**: Icon appears inline with product name

## Edge Cases to Test

1. ✅ Item exactly at 30 days (should NOT activate double rent)
2. ✅ Item at 31 days (should activate double rent)
3. ✅ Toggle feature on existing items
4. ✅ Items with KJ (Khali Jali) - should still work correctly
5. ✅ Filtering inventory by different criteria
6. ✅ Multiple items from same product type with different ages

## Expected Calculations

### Example 1: Double Rent Active

- Entry Date: 35 days ago
- Unit Price: 100 PKR
- Quantity: 10
- doubleRentAfter30Days: true
- **Current Price**: 200 PKR (doubled)
- **Total Value**: 2000 PKR
- **Display Days**: -5 days (in red)
- **Icon**: ⚡ (lightning)

### Example 2: Double Rent Inactive

- Entry Date: 35 days ago
- Unit Price: 100 PKR
- Quantity: 10
- doubleRentAfter30Days: false
- **Current Price**: 100 PKR (normal)
- **Total Value**: 1000 PKR
- **Display Days**: 35 days (normal)
- **Icon**: None

### Example 3: Double Rent Enabled But < 30 Days

- Entry Date: 20 days ago
- Unit Price: 100 PKR
- Quantity: 10
- doubleRentAfter30Days: true
- **Current Price**: 100 PKR (not yet doubled)
- **Total Value**: 1000 PKR
- **Display Days**: 20 days (normal)
- **Icon**: None

## Files Modified

1. ✅ `schema/config.ts` - Added field to validation schemas
2. ✅ `types/config.ts` - Added TypeScript interface field
3. ✅ `app/api/inventory/route.ts` - Added logic for double rent calculation and negative days
4. ✅ `components/setting/product-type-manager.tsx` - Added checkbox UI
5. ✅ `components/inventory/inventory-table.tsx` - Added lightning icon and negative days display

## Notes

- The feature is opt-in per product type
- Only affects the display and calculations, doesn't modify stored data
- Lightning icon uses lucide-react's `Zap` component with yellow color
- Negative days calculation: `-(daysInStorage - 30)`
- Feature can be toggled at any time without data migration
