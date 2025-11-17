import { NextRequest, NextResponse } from 'next/server';
import { manualBackupSchema } from '@/schema/backup';
import {
  createBackup,
  saveBackupSettings,
  getBackupSettings,
} from '@/lib/backup';
import { BackupResponse } from '@/types/backup';

/**
 * POST /api/backup/manual
 * Create a manual backup
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validatedData = manualBackupSchema.parse(body);

    // Create backup
    const { fileName, filePath } = await createBackup(validatedData.backupPath);

    // Update last backup date in settings
    const settings = await getBackupSettings();
    if (settings) {
      await saveBackupSettings({
        ...settings,
        lastBackupDate: new Date().toISOString(),
      });
    }

    const response: BackupResponse = {
      success: true,
      message: 'Backup created successfully',
      backupPath: filePath,
      fileName,
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error('Error creating manual backup:', error);
    const response: BackupResponse = {
      success: false,
      message: 'Failed to create backup',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
    return NextResponse.json(response, { status: 500 });
  }
}
