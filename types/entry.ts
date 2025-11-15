import { Customer } from './customer';
import { ProductType, ProductSubType, Room, PackType } from './config';

export interface EntryItem {
  id: number;
  entryReceiptId: number;
  productTypeId: number;
  productSubTypeId?: number | null;
  packTypeId: number;
  roomId: number;
  boxNo?: string | null;
  marka?: string | null;
  quantity: number;
  remainingQuantity: number;
  unitPrice: number;
  totalPrice: number;
  hasKhaliJali: boolean;
  kjQuantity?: number | null;
  kjUnitPrice?: number | null;
  kjTotal?: number | null;
  grandTotal: number;
  createdAt: Date | string;
  updatedAt: Date | string;

  // Relations
  productType?: ProductType;
  productSubType?: ProductSubType | null;
  packType?: PackType;
  room?: Room;
}

export interface EntryReceipt {
  id: number;
  receiptNo: string;
  customerId: number;
  carNo: string;
  entryDate: Date | string;
  totalAmount: number;
  description?: string | null;
  createdAt: Date | string;
  updatedAt: Date | string;

  // Relations
  customer?: Customer;
  items?: EntryItem[];
  _count?: {
    items: number;
    clearanceReceipts: number;
  };
}

export interface EntryReceiptWithDetails extends EntryReceipt {
  customer: Customer;
  items: EntryItem[];
}

export interface EntryReceiptListResponse {
  success: boolean;
  data: EntryReceipt[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface EntryReceiptResponse {
  success: boolean;
  data: EntryReceiptWithDetails;
  message?: string;
}

export interface EntryReceiptCreateResponse {
  success: boolean;
  data: EntryReceipt;
  message?: string;
}
