import { NextRequest, NextResponse } from 'next/server';
import { restoreBackupSchema } from '@/schema/backup';
import { restoreFromBackup } from '@/lib/backup';
import { RestoreResponse } from '@/types/backup';

/**
 * POST /api/backup/restore
 * Restore data from a backup file
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validatedData = restoreBackupSchema.parse(body);

    // Restore from backup
    const restoredRecords = await restoreFromBackup(
      validatedData.backupFilePath
    );

    const response: RestoreResponse = {
      success: true,
      message: `Successfully restored ${restoredRecords} records`,
      restoredRecords,
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error('Error restoring from backup:', error);
    const response: RestoreResponse = {
      success: false,
      message: 'Failed to restore from backup',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
    return NextResponse.json(response, { status: 500 });
  }
}
