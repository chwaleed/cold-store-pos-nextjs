import { NextRequest, NextResponse } from 'next/server';
import { writeFile } from 'fs/promises';
import { restoreFromBackup } from '@/lib/backup';
import path from 'path';
import { existsSync, mkdirSync } from 'fs';

/**
 * POST /api/backup/upload
 * Upload and restore from a backup file (.db or .json)
 */
export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No file uploaded' },
        { status: 400 }
      );
    }

    // Validate file type
    const fileName = file.name;
    const isValidFormat =
      fileName.endsWith('.db') || fileName.endsWith('.json');

    if (!isValidFormat) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid file format. Only .db or .json files are allowed.',
        },
        { status: 400 }
      );
    }

    // Create temporary directory if it doesn't exist
    const tempDir = path.join(process.cwd(), 'temp');
    if (!existsSync(tempDir)) {
      mkdirSync(tempDir, { recursive: true });
    }

    // Save uploaded file temporarily
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const tempFilePath = path.join(tempDir, fileName);

    await writeFile(tempFilePath, new Uint8Array(buffer));

    // If it's a .db file, also check for accompanying .meta.json
    if (fileName.endsWith('.db')) {
      const metaFile = formData.get('metaFile') as File;
      if (metaFile) {
        const metaBytes = await metaFile.arrayBuffer();
        const metaBuffer = Buffer.from(metaBytes);
        const metaFilePath = path.join(
          tempDir,
          fileName.replace('.db', '.meta.json')
        );
        await writeFile(metaFilePath, new Uint8Array(metaBuffer));
      }
    }

    // Restore from the uploaded backup
    const restoredRecords = await restoreFromBackup(tempFilePath);

    // Clean up temporary file
    const fs = require('fs');
    if (fs.existsSync(tempFilePath)) {
      fs.unlinkSync(tempFilePath);
    }
    if (fileName.endsWith('.db')) {
      const metaFilePath = tempFilePath.replace('.db', '.meta.json');
      if (fs.existsSync(metaFilePath)) {
        fs.unlinkSync(metaFilePath);
      }
    }

    return NextResponse.json(
      {
        success: true,
        message: `Successfully restored ${restoredRecords} records from uploaded backup`,
        restoredRecords,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error uploading and restoring backup:', error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : 'Failed to restore backup',
      },
      { status: 500 }
    );
  }
}
