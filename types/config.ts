export interface ProductType {
  id: number;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProductSubType {
  id: number;
  name: string;
  productTypeId: number;
  productType?: ProductType;
  createdAt: Date;
  updatedAt: Date;
}

export interface Room {
  id: number;
  name: string;
  type: 'Cold' | 'Hot';
  capacity: number | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface PackType {
  id: number;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ConfigResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface ConfigListResponse<T> {
  success: boolean;
  data: T[];
}
