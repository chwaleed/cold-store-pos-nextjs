// Cold Store Management System - Database Schema (Simplified)
// This schema uses a simple Credit Ledger system without status tracking

type Customer = {
  id: number;
  name: string;
  fatherName?: string;
  // cnic removed
  phone?: string;
  address?: string;
  village?: string;
  createdAt: Date;
  updatedAt: Date;
};

type ProductType = {
  id: number;
  name: string; // e.g., Potato, Onion, Garlic
  createdAt: Date;
  updatedAt: Date;
};

type ProductSubType = {
  id: number;
  typeId: number; // Reference to ProductType
  name: string; // e.g., Cardinal, Red, White
  createdAt: Date;
  updatedAt: Date;
};

type Room = {
  id: number;
  name: string; // Unique
  type: 'COLD' | 'HOT'; // Room type
  capacity?: number; // Optional capacity
  isActive: boolean; // Can be deactivated
  createdAt: Date;
  updatedAt: Date;
};

type PackType = {
  id: number;
  name: string; // Bori or Jali
  rentPerDay: number; // Rent rate per pack per day in PKR
  createdAt: Date;
  updatedAt: Date;
};

type EntryReceipt = {
  id: number;
  receiptNo: string; // Unique, Format: CS-YYYYMMDD-XXXX
  customerId: number; // Reference to Customer
  carNo: string;
  entryDate: Date;
  totalAmount: number; // Sum of all items (including KJ)
  description?: string;
  createdAt: Date;
  updatedAt: Date;
};

type EntryItem = {
  id: number;
  entryReceiptId: number; // Reference to EntryReceipt
  productTypeId: number; // Reference to ProductType
  productSubTypeId?: number; // Reference to ProductSubType (optional)
  packTypeId: number; // Reference to PackType
  roomId: number; // Reference to Room
  boxNo?: string;
  marka?: string; // Marking/label
  quantity: number; // Initial quantity
  remainingQuantity: number; // Tracks partial clearances
  unitPrice: number;
  totalPrice: number; // quantity × unitPrice

  // Khali Jali (Empty Crate) fields
  hasKhaliJali: boolean;
  kjQuantity?: number;
  kjUnitPrice?: number;
  kjTotal?: number; // kjQuantity × kjUnitPrice

  grandTotal: number; // totalPrice + kjTotal
  createdAt: Date;
  updatedAt: Date;
};

type ClearanceReceipt = {
  id: number;
  clearanceNo: string; // Unique, Format: CL-YYYYMMDD-XXXX
  customerId: number; // Reference to Customer
  entryReceiptId: number; // Reference to original EntryReceipt
  carNo?: string;
  clearanceDate: Date;
  totalRent: number; // Sum of all item rents
  description?: string;
  createdAt: Date;
  updatedAt: Date;
};

type ClearedItem = {
  id: number;
  clearanceReceiptId: number; // Reference to ClearanceReceipt
  entryItemId: number; // Reference to EntryItem
  quantityCleared: number;
  daysStored: number; // Calculated: clearanceDate - entryDate
  rentPerDay: number; // From PackType at time of clearance
  totalRent: number; // quantityCleared × daysStored × rentPerDay
  createdAt: Date;
  updatedAt: Date;
};

// Simplified Credit Ledger System
// All financial transactions (payments, rent charges, discounts, advances) go here
type Ledger = {
  id: number; // transaction_id (Primary Key)
  customerId: number; // customer_id (Foreign Key to Customer)
  invoiceId?: number; // invoice_id (Foreign Key - Nullable, can be EntryReceipt or ClearanceReceipt ID)
  description: string; // e.g., "Payment", "Rent Charged", "Discount Given", "Cash Advance"
  debitAmount: number; // Amount customer owes (always positive, 0 if credit transaction)
  creditAmount: number; // Amount customer paid (always positive, 0 if debit transaction)
  isDiscount: boolean; // true if this is a discount entry, false otherwise (default: false)
  createdAt: Date;
  updatedAt: Date;
};

// To get customer balance: SUM(debitAmount) - SUM(creditAmount)
// Positive balance = Customer owes money
// Negative balance = We owe customer money
