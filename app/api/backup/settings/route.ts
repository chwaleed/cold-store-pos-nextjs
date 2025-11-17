import { NextRequest, NextResponse } from 'next/server';
import { backupSettingsSchema } from '@/schema/backup';
import { getBackupSettings, saveBackupSettings } from '@/lib/backup';

/**
 * GET /api/backup/settings
 * Get backup settings
 */
export async function GET() {
  try {
    const settings = await getBackupSettings();

    return NextResponse.json({
      success: true,
      settings: settings || {
        isEnabled: false,
        frequency: 'daily',
        backupPath: '',
        lastBackupDate: null,
        retentionDays: 30,
      },
    });
  } catch (error) {
    console.error('Error getting backup settings:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/backup/settings
 * Save backup settings
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validatedData = backupSettingsSchema.parse(body);

    await saveBackupSettings(validatedData);

    return NextResponse.json({
      success: true,
      message: 'Backup settings saved successfully',
    });
  } catch (error) {
    console.error('Error saving backup settings:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
