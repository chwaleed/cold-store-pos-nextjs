import { z } from 'zod';

// Backup frequency options
export const backupFrequencyEnum = z.enum([
  'daily',
  'weekly',
  'monthly',
  'manual',
]);

// Backup configuration schema
export const backupSettingsSchema = z.object({
  isEnabled: z.boolean().default(false),
  frequency: backupFrequencyEnum.default('daily'),
  backupPath: z.string().min(1, 'Backup path is required'),
  lastBackupDate: z.string().nullable().optional(),
  retentionDays: z.number().min(1).max(365).default(30), // Keep backups for 30 days
});

// Manual backup schema
export const manualBackupSchema = z.object({
  backupPath: z.string().min(1, 'Backup path is required'),
});

// Restore backup schema
export const restoreBackupSchema = z.object({
  backupFilePath: z.string().min(1, 'Backup file path is required'),
});

// Backup metadata schema
export const backupMetadataSchema = z.object({
  version: z.string(),
  timestamp: z.string(),
  databaseType: z.string(),
  recordCount: z.number(),
  tables: z.array(z.string()),
});

export type BackupSettings = z.infer<typeof backupSettingsSchema>;
export type ManualBackupRequest = z.infer<typeof manualBackupSchema>;
export type RestoreBackupRequest = z.infer<typeof restoreBackupSchema>;
export type BackupMetadata = z.infer<typeof backupMetadataSchema>;
export type BackupFrequency = z.infer<typeof backupFrequencyEnum>;
