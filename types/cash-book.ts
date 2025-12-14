// Cash Book Types
export interface CashBookEntry {
  id: number;
  date: Date;
  transactionType: 'inflow' | 'outflow';
  amount: number;
  description: string;
  source: 'clearance' | 'ledger' | 'expense' | 'manual';
  referenceId?: number;
  referenceType?: 'clearance_receipt' | 'ledger_entry' | 'expense';
  customerId?: number;
  isDirectCash?: boolean;
  customer?: {
    id: number;
    name: string;
    phone?: string;
  };
  createdBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface DailyCashSummary {
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
  auditTrail?: OpeningBalanceAudit[];
}

export interface OpeningBalanceAudit {
  id: number;
  dailyCashSummaryId: number;
  oldOpeningBalance: number;
  newOpeningBalance: number;
  changeReason?: string;
  changedBy?: string;
  changeTimestamp: Date;
}

export interface ManualTransactionInput {
  date: Date;
  transactionType: 'inflow' | 'outflow';
  amount: number;
  description: string;
  customerId?: number;
}

export interface CashBookFilters {
  date?: Date;
  transactionType?: 'inflow' | 'outflow' | 'all';
  source?: 'clearance' | 'ledger' | 'expense' | 'manual' | 'all';
  customerId?: number;
}

export interface DateRangeReportParams {
  fromDate: Date;
  toDate: Date;
}

export interface CashBookReportData {
  summaries: DailyCashSummary[];
  transactions: CashBookEntry[];
  totalInflows: number;
  totalOutflows: number;
  netCashFlow: number;
}

// API Response Types
export interface CashBookResponse {
  success: boolean;
  data: CashBookEntry[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  filters: {
    date: string;
    transactionType?: string;
    source?: string;
    customerId?: number;
  };
}

export interface CashBookEntryResponse {
  success: boolean;
  data: CashBookEntry;
  message?: string;
}

export interface DailyCashSummaryResponse {
  success: boolean;
  data: DailyCashSummary;
  message?: string;
}

export interface CashBookReportResponse {
  success: boolean;
  data: CashBookReportData;
  message?: string;
}

export interface CashBookErrorResponse {
  success: false;
  error: string;
  code: string;
  details?: any;
  retryAfter?: number;
}

// Utility Types for Frontend Components
export interface CashBookEntryWithCustomer
  extends Omit<CashBookEntry, 'customer'> {
  customer: {
    id: number;
    name: string;
    phone?: string;
  } | null;
}

export interface DailyCashTotals {
  openingBalance: number;
  totalInflows: number;
  totalOutflows: number;
  closingBalance: number;
  netCashFlow: number;
  transactionCount: number;
}

export interface CashBookStats {
  dailyTotals: DailyCashTotals;
  sourceBreakdown: {
    clearance: number;
    ledger: number;
    expense: number;
    manual: number;
  };
  customerBreakdown: {
    customerId: number;
    customerName: string;
    totalAmount: number;
    transactionCount: number;
  }[];
}

// Report Types
export interface CashBookReportSummary {
  totalInflows: number;
  totalOutflows: number;
  netCashFlow: number;
  openingBalance: number;
  closingBalance: number;
  transactionCount: number;
}

export interface TransactionsBySource {
  [source: string]: {
    inflows: number;
    outflows: number;
    count: number;
  };
}

export interface TransactionsByDate {
  date: Date;
  inflows: number;
  outflows: number;
  transactions: CashBookEntry[];
}

export interface CashBookReportDetails {
  dateRange: {
    from: Date;
    to: Date;
  };
  summary: CashBookReportSummary;
  transactionsBySource: TransactionsBySource;
  transactionsByDate: TransactionsByDate[];
  dailySummaries: DailyCashSummary[];
  transactions: CashBookEntry[];
}
