import { NextRequest, NextResponse } from 'next/server';
import {
  getBackupSettings,
  shouldCreateBackup,
  createBackup,
  saveBackupSettings,
} from '@/lib/backup';

/**
 * GET /api/backup/check-schedule
 * Check if a scheduled backup is needed and create it if necessary
 */
export async function GET(req: NextRequest) {
  try {
    const settings = await getBackupSettings();

    if (!settings || !settings.isEnabled) {
      return NextResponse.json({
        success: true,
        message: 'Automatic backup is disabled',
        backupNeeded: false,
      });
    }

    const needsBackup = shouldCreateBackup(settings);

    if (!needsBackup) {
      return NextResponse.json({
        success: true,
        message: 'No backup needed at this time',
        backupNeeded: false,
      });
    }

    // Create the backup
    const { fileName, filePath } = await createBackup(settings.backupPath);

    // Update last backup date
    await saveBackupSettings({
      ...settings,
      lastBackupDate: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      message: 'Scheduled backup created successfully',
      backupNeeded: true,
      fileName,
      filePath,
    });
  } catch (error) {
    console.error('Error checking backup schedule:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
