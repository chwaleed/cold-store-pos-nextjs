export type LedgerType = 'adding_inventory' | 'clearance' | 'direct_cash';

export interface Ledger {
  id: number;
  customerId: number;
  type: LedgerType;
  entryReceiptId?: number | null;
  clearanceReceiptId?: number | null;
  description: string;
  debitAmount: number;
  creditAmount: number;
  isDiscount: boolean;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface LedgerWithReceipt extends Ledger {
  entryReceipt?: {
    id: number;
    receiptNo: string;
    entryDate: Date | string;
  } | null;
  clearanceReceipt?: {
    id: number;
    clearanceNo: string;
    clearanceDate: Date | string;
  } | null;
}

export interface CreateDirectCashLedgerInput {
  customerId: number;
  type: 'debit' | 'credit';
  amount: number;
  description: string;
}
