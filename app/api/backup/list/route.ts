import { NextRequest, NextResponse } from 'next/server';
import { listBackups, getBackupSettings } from '@/lib/backup';
import { BackupListResponse } from '@/types/backup';

/**
 * GET /api/backup/list
 * List all available backups
 */
export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const backupPath = searchParams.get('backupPath');

    let path = backupPath;
    if (!path) {
      // Try to get from settings
      const settings = await getBackupSettings();
      if (!settings || !settings.backupPath) {
        return NextResponse.json(
          {
            success: false,
            error: 'Backup path not configured',
          },
          { status: 400 }
        );
      }
      path = settings.backupPath;
    }

    const backups = listBackups(path);

    const response: BackupListResponse = {
      success: true,
      backups,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error listing backups:', error);
    const response: BackupListResponse = {
      success: false,
      backups: [],
      error: error instanceof Error ? error.message : 'Unknown error',
    };
    return NextResponse.json(response, { status: 500 });
  }
}
