export interface Customer {
  id: number;
  name: string;
  fatherName?: string | null;
  phone?: string | null;
  address?: string | null;
  village?: string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface CustomerWithBalance extends Customer {
  balance?: number;
  _count?: {
    entryReceipts: number;
    clearanceReceipts: number;
  };
}

export interface CustomerListResponse {
  success: boolean;
  data: Customer[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface CustomerResponse {
  success: boolean;
  data: CustomerWithBalance;
  message?: string;
}
