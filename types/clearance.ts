import { Customer } from './customer';
import { EntryReceipt, EntryItem } from './entry';

export interface ClearedItem {
  id: number;
  clearanceReceiptId: number;
  entryReceiptId: number;
  entryItemId: number;
  clearQuantity: number;
  clearKjQuantity: number | null;
  totalAmount: number;
  createdAt: Date;
  updatedAt: Date;
  entryItem?: EntryItem;
  entryReceipt?: EntryReceipt;
}

export interface ClearanceReceipt {
  id: number;
  receiptNo: string;
  customerId: number;
  itemsCount: number;
  carNo: string | null;
  clearanceDate: Date;
  totalAmount: number;
  description: string | null;
  createdAt: Date;
  updatedAt: Date;
  customer?: Customer;
  clearedItems?: ClearedItem[];
}

export interface ClearanceResponse {
  success: boolean;
  data?: ClearanceReceipt;
  error?: string;
}

export interface ClearanceListResponse {
  success: boolean;
  data: ClearanceReceipt[];
  totalPages?: number;
  currentPage?: number;
}

// Helper types for clearance form
export interface EntryItemWithDetails {
  id: number;
  entryReceiptId: number;
  productTypeId: number;
  productSubTypeId: number | null;
  packTypeId: number;
  roomId: number;
  boxNo: string | null;
  marka: string | null;
  quantity: number;
  remainingQuantity: number;
  unitPrice: number;
  totalPrice: number;
  hasKhaliJali: boolean;
  kjQuantity: number | null;
  remainingKjQuantity: number | null; // Track remaining KJ separately
  kjUnitPrice: number | null;
  kjTotal: number | null;
  grandTotal: number;
  createdAt: Date;
  updatedAt: Date;
  productType: { name: string };
  productSubType: { name: string } | null;
  packType: { name: string };
  room: { name: string };
  entryReceipt: {
    id: number;
    receiptNo: string;
    entryDate: Date;
    customerId: number;
    customer: Customer;
  };
}

export interface ClearedItemWithDetails {
  entryItemId: number;
  clearQuantity: number;
  clearKjQuantity: number | null;
  productName: string;
  type: string;
  subType: string;
  packName: string;
  roomName: string;
  boxNo: string | null;
  availableQty: number;
  unitPrice: number;
  hasKhaliJali: boolean;
  kjQuantity?: number | null;
  kjUnitPrice?: number | null;
  grandTotal: number;
}
