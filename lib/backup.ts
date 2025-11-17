import { db } from './db';
import * as fs from 'fs';
import * as path from 'path';
import { BackupMetadata, BackupSettings } from '@/schema/backup';
import { BackupInfo } from '@/types/backup';

const BACKUP_VERSION = '1.0.0';

/**
 * Get all data from database for backup
 */
export async function getAllDatabaseData() {
  try {
    const [
      customers,
      productTypes,
      productSubTypes,
      rooms,
      packTypes,
      entryReceipts,
      entryItems,
      clearanceReceipts,
      clearedItems,
      ledger,
      expenseCategories,
      expenses,
      settings,
    ] = await Promise.all([
      db.customer.findMany({
        include: { entryReceipts: true, clearanceReceipts: true, ledger: true },
      }),
      db.productType.findMany({
        include: { subTypes: true, entryItems: true },
      }),
      db.productSubType.findMany(),
      db.room.findMany(),
      db.packType.findMany(),
      db.entryReceipt.findMany({
        include: { items: true, ledgerEntries: true },
      }),
      db.entryItem.findMany(),
      db.clearanceReceipt.findMany({
        include: { clearedItems: true, ledgerEntries: true },
      }),
      db.clearedItem.findMany(),
      db.ledger.findMany(),
      db.expenseCategory.findMany({ include: { expenses: true } }),
      db.expense.findMany(),
      db.setting.findMany(),
    ]);

    const totalRecords =
      customers.length +
      productTypes.length +
      productSubTypes.length +
      rooms.length +
      packTypes.length +
      entryReceipts.length +
      entryItems.length +
      clearanceReceipts.length +
      clearedItems.length +
      ledger.length +
      expenseCategories.length +
      expenses.length +
      settings.length;

    return {
      metadata: {
        version: BACKUP_VERSION,
        timestamp: new Date().toISOString(),
        databaseType: 'sqlite',
        recordCount: totalRecords,
        tables: [
          'Customer',
          'ProductType',
          'ProductSubType',
          'Room',
          'PackType',
          'EntryReceipt',
          'EntryItem',
          'ClearanceReceipt',
          'ClearedItem',
          'Ledger',
          'ExpenseCategory',
          'Expense',
          'Setting',
        ],
      },
      data: {
        customers,
        productTypes,
        productSubTypes,
        rooms,
        packTypes,
        entryReceipts,
        entryItems,
        clearanceReceipts,
        clearedItems,
        ledger,
        expenseCategories,
        expenses,
        settings,
      },
    };
  } catch (error) {
    console.error('Error getting database data:', error);
    throw new Error('Failed to retrieve database data for backup');
  }
}

/**
 * Create a backup file
 */
export async function createBackup(
  backupPath: string
): Promise<{ fileName: string; filePath: string }> {
  try {
    // Ensure backup directory exists
    if (!fs.existsSync(backupPath)) {
      fs.mkdirSync(backupPath, { recursive: true });
    }

    // Generate backup filename with timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const fileName = `backup-${timestamp}.json`;
    const filePath = path.join(backupPath, fileName);

    // Get all data
    const backupData = await getAllDatabaseData();

    // Write to file
    fs.writeFileSync(filePath, JSON.stringify(backupData, null, 2), 'utf-8');

    return { fileName, filePath };
  } catch (error) {
    console.error('Error creating backup:', error);
    throw new Error('Failed to create backup file');
  }
}

/**
 * Restore data from backup file
 */
export async function restoreFromBackup(
  backupFilePath: string
): Promise<number> {
  try {
    // Read backup file
    if (!fs.existsSync(backupFilePath)) {
      throw new Error('Backup file not found');
    }

    const fileContent = fs.readFileSync(backupFilePath, 'utf-8');
    const backupData = JSON.parse(fileContent);

    if (!backupData.metadata || !backupData.data) {
      throw new Error('Invalid backup file format');
    }

    // Clear existing data in reverse order (to handle foreign key constraints)
    await db.$transaction(async (tx) => {
      await tx.ledger.deleteMany({});
      await tx.clearedItem.deleteMany({});
      await tx.clearanceReceipt.deleteMany({});
      await tx.entryItem.deleteMany({});
      await tx.entryReceipt.deleteMany({});
      await tx.expense.deleteMany({});
      await tx.expenseCategory.deleteMany({});
      await tx.customer.deleteMany({});
      await tx.productSubType.deleteMany({});
      await tx.productType.deleteMany({});
      await tx.room.deleteMany({});
      await tx.packType.deleteMany({});
      await tx.setting.deleteMany({});
    });

    // Restore data in correct order
    let totalRestored = 0;

    await db.$transaction(async (tx) => {
      // Base tables first
      if (backupData.data.rooms) {
        for (const room of backupData.data.rooms) {
          await tx.room.create({ data: room });
          totalRestored++;
        }
      }

      if (backupData.data.packTypes) {
        for (const packType of backupData.data.packTypes) {
          await tx.packType.create({ data: packType });
          totalRestored++;
        }
      }

      if (backupData.data.productTypes) {
        for (const productType of backupData.data.productTypes) {
          const { subTypes, entryItems, ...typeData } = productType;
          await tx.productType.create({ data: typeData });
          totalRestored++;
        }
      }

      if (backupData.data.productSubTypes) {
        for (const subType of backupData.data.productSubTypes) {
          await tx.productSubType.create({ data: subType });
          totalRestored++;
        }
      }

      if (backupData.data.customers) {
        for (const customer of backupData.data.customers) {
          const { entryReceipts, clearanceReceipts, ledger, ...customerData } =
            customer;
          await tx.customer.create({ data: customerData });
          totalRestored++;
        }
      }

      if (backupData.data.expenseCategories) {
        for (const category of backupData.data.expenseCategories) {
          const { expenses, ...categoryData } = category;
          await tx.expenseCategory.create({ data: categoryData });
          totalRestored++;
        }
      }

      // Dependent tables
      if (backupData.data.entryReceipts) {
        for (const receipt of backupData.data.entryReceipts) {
          const { items, ledgerEntries, ...receiptData } = receipt;
          await tx.entryReceipt.create({ data: receiptData });
          totalRestored++;
        }
      }

      if (backupData.data.entryItems) {
        for (const item of backupData.data.entryItems) {
          await tx.entryItem.create({ data: item });
          totalRestored++;
        }
      }

      if (backupData.data.clearanceReceipts) {
        for (const receipt of backupData.data.clearanceReceipts) {
          const { clearedItems, ledgerEntries, ...receiptData } = receipt;
          await tx.clearanceReceipt.create({ data: receiptData });
          totalRestored++;
        }
      }

      if (backupData.data.clearedItems) {
        for (const item of backupData.data.clearedItems) {
          await tx.clearedItem.create({ data: item });
          totalRestored++;
        }
      }

      if (backupData.data.ledger) {
        for (const ledgerEntry of backupData.data.ledger) {
          await tx.ledger.create({ data: ledgerEntry });
          totalRestored++;
        }
      }

      if (backupData.data.expenses) {
        for (const expense of backupData.data.expenses) {
          await tx.expense.create({ data: expense });
          totalRestored++;
        }
      }

      if (backupData.data.settings) {
        for (const setting of backupData.data.settings) {
          await tx.setting.create({ data: setting });
          totalRestored++;
        }
      }
    });

    return totalRestored;
  } catch (error) {
    console.error('Error restoring from backup:', error);
    throw new Error(
      `Failed to restore from backup: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * List all backups in a directory
 */
export function listBackups(backupPath: string): BackupInfo[] {
  try {
    if (!fs.existsSync(backupPath)) {
      return [];
    }

    const files = fs.readdirSync(backupPath);
    const backupFiles = files.filter(
      (file) => file.startsWith('backup-') && file.endsWith('.json')
    );

    return backupFiles
      .map((file) => {
        const filePath = path.join(backupPath, file);
        const stats = fs.statSync(filePath);

        let metadata;
        try {
          const content = fs.readFileSync(filePath, 'utf-8');
          const data = JSON.parse(content);
          metadata = data.metadata;
        } catch (error) {
          // If we can't read metadata, just skip it
        }

        return {
          fileName: file,
          filePath,
          size: stats.size,
          createdAt: stats.birthtime.toISOString(),
          metadata,
        };
      })
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
  } catch (error) {
    console.error('Error listing backups:', error);
    return [];
  }
}

/**
 * Delete old backups based on retention days
 */
export function cleanOldBackups(
  backupPath: string,
  retentionDays: number
): number {
  try {
    const backups = listBackups(backupPath);
    const now = Date.now();
    const retentionMs = retentionDays * 24 * 60 * 60 * 1000;
    let deletedCount = 0;

    backups.forEach((backup) => {
      const age = now - new Date(backup.createdAt).getTime();
      if (age > retentionMs) {
        try {
          fs.unlinkSync(backup.filePath);
          deletedCount++;
        } catch (error) {
          console.error(`Error deleting old backup ${backup.fileName}:`, error);
        }
      }
    });

    return deletedCount;
  } catch (error) {
    console.error('Error cleaning old backups:', error);
    return 0;
  }
}

/**
 * Get backup settings from database
 */
export async function getBackupSettings(): Promise<BackupSettings | null> {
  try {
    const settingRecord = await db.setting.findUnique({
      where: { key: 'backup_settings' },
    });

    if (!settingRecord) {
      return null;
    }

    return JSON.parse(settingRecord.value) as BackupSettings;
  } catch (error) {
    console.error('Error getting backup settings:', error);
    return null;
  }
}

/**
 * Save backup settings to database
 */
export async function saveBackupSettings(
  settings: BackupSettings
): Promise<void> {
  try {
    await db.setting.upsert({
      where: { key: 'backup_settings' },
      update: { value: JSON.stringify(settings) },
      create: { key: 'backup_settings', value: JSON.stringify(settings) },
    });
  } catch (error) {
    console.error('Error saving backup settings:', error);
    throw new Error('Failed to save backup settings');
  }
}

/**
 * Check if backup is needed based on schedule
 */
export function shouldCreateBackup(settings: BackupSettings): boolean {
  if (!settings.isEnabled || !settings.lastBackupDate) {
    return settings.isEnabled; // If enabled but no last backup, create one
  }

  const lastBackup = new Date(settings.lastBackupDate);
  const now = new Date();
  const daysSinceBackup = Math.floor(
    (now.getTime() - lastBackup.getTime()) / (1000 * 60 * 60 * 24)
  );

  switch (settings.frequency) {
    case 'daily':
      return daysSinceBackup >= 1;
    case 'weekly':
      return daysSinceBackup >= 7;
    case 'monthly':
      return daysSinceBackup >= 30;
    default:
      return false;
  }
}

/**
 * Get the next scheduled backup date
 */
export function getNextBackupDate(settings: BackupSettings): Date | null {
  if (!settings.isEnabled || !settings.lastBackupDate) {
    return null;
  }

  const lastBackup = new Date(settings.lastBackupDate);
  const nextBackup = new Date(lastBackup);

  switch (settings.frequency) {
    case 'daily':
      nextBackup.setDate(nextBackup.getDate() + 1);
      break;
    case 'weekly':
      nextBackup.setDate(nextBackup.getDate() + 7);
      break;
    case 'monthly':
      nextBackup.setMonth(nextBackup.getMonth() + 1);
      break;
    default:
      return null;
  }

  return nextBackup;
}
