export interface BackupInfo {
  fileName: string;
  filePath: string;
  size: number;
  createdAt: string;
  metadata?: {
    version: string;
    recordCount: number;
    tables: string[];
  };
}

export interface BackupResponse {
  success: boolean;
  message: string;
  backupPath?: string;
  fileName?: string;
  error?: string;
}

export interface RestoreResponse {
  success: boolean;
  message: string;
  restoredRecords?: number;
  error?: string;
}

export interface BackupListResponse {
  success: boolean;
  backups: BackupInfo[];
  error?: string;
}

export interface BackupScheduleInfo {
  nextBackupDate: string | null;
  lastBackupDate: string | null;
  isEnabled: boolean;
  frequency: 'daily' | 'weekly' | 'monthly' | 'manual';
}
