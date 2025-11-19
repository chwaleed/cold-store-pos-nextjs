import { NextRequest, NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';

/**
 * GET /api/backup/download?filePath=...
 * Download a backup file
 */
export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const filePath = searchParams.get('filePath');

    if (!filePath) {
      return NextResponse.json(
        { success: false, error: 'File path is required' },
        { status: 400 }
      );
    }

    // Validate file exists
    if (!existsSync(filePath)) {
      return NextResponse.json(
        { success: false, error: 'Backup file not found' },
        { status: 404 }
      );
    }

    // Read the file
    const fileBuffer = await readFile(filePath);
    const fileName = path.basename(filePath);

    // Determine content type
    const contentType = fileName.endsWith('.db')
      ? 'application/x-sqlite3'
      : 'application/json';

    // Return file as downloadable response
    return new NextResponse(fileBuffer as any, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${fileName}"`,
        'Content-Length': fileBuffer.length.toString(),
      },
    });
  } catch (error) {
    console.error('Error downloading backup:', error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : 'Failed to download backup',
      },
      { status: 500 }
    );
  }
}
