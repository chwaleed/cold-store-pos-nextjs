import * as z from 'zod';

// Setting Schema
export const settingSchema = z.object({
  key: z.string().min(1, 'Key cannot be empty'),
  value: z.string().min(1, 'Value cannot be empty'),
});

export type SettingFormData = z.infer<typeof settingSchema>;

// Setting interface
export interface Setting {
  id: number;
  key: string;
  value: string;
  createdAt: Date;
  updatedAt: Date;
}

// Common setting keys
export const SETTING_KEYS = {
  COMPANY_NAME: 'company_name',
  COMPANY_ADDRESS: 'company_address',
  COMPANY_PHONE: 'company_phone',
  COMPANY_EMAIL: 'company_email',
  TAX_NUMBER: 'tax_number',
  LOGO_URL: 'logo_url',
  DEFAULT_STORAGE_DAYS: 'default_storage_days',
  LOW_STOCK_THRESHOLD: 'low_stock_threshold',
  DEFAULT_ROOM: 'default_room',
  TAX_RATE: 'tax_rate',
  BACKUP_ENABLED: 'backup_enabled',
  BACKUP_FREQUENCY: 'backup_frequency',
  BACKUP_LOCATION: 'backup_location',
  PRINTER_NAME: 'printer_name',
  RECEIPT_PAPER_SIZE: 'receipt_paper_size',
  PRINT_PREVIEW_DEFAULT: 'print_preview_default',
} as const;
