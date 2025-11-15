import { Customer } from './customer';
import { EntryReceipt, EntryItem } from './entry';

export interface ClearedItem {
  id: number;
  clearanceReceiptId: number;
  entryItemId: number;
  quantityCleared: number;
  kjQuantityCleared: number | null;
  daysStored: number;
  rentPerDay: number;
  totalRent: number;
  createdAt: Date;
  updatedAt: Date;
  entryItem?: EntryItem;
}

export interface ClearanceReceipt {
  id: number;
  clearanceNo: string;
  customerId: number;
  entryReceiptId: number;
  carNo: string | null;
  clearanceDate: Date;
  totalRent: number;
  description: string | null;
  createdAt: Date;
  updatedAt: Date;
  customer?: Customer;
  entryReceipt?: EntryReceipt;
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
export interface CustomerWithInventory extends Customer {
  entryReceipts: Array<{
    id: number;
    receiptNo: string;
    entryDate: Date;
    items: Array<{
      id: number;
      remainingQuantity: number;
      productType: { name: string };
      productSubType: { name: string } | null;
    }>;
  }>;
}

export interface EntryReceiptWithItems extends EntryReceipt {
  items: Array<
    EntryItem & {
      productType: { name: string };
      productSubType: { name: string } | null;
      packType: { name: string };
      room: { name: string };
    }
  >;
}
