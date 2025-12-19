import { NextRequest, NextResponse } from 'next/server';
import { generatePDFFromHTML } from '@/lib/pdf-receipt-generator';
import { buildRoomWiseReportHTML } from '@/lib/pdf-templates';
import { format } from 'date-fns';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { reportData, roomName, reportMode, fromDate, toDate } = body;

    if (!reportData || !roomName) {
      return NextResponse.json(
        { success: false, error: 'Report data and room name are required' },
        { status: 400 }
      );
    }

    // Generate HTML using Urdu template
    const html = buildRoomWiseReportHTML(reportData, {
      roomName,
      reportMode,
      fromDate,
      toDate,
    });

    // Generate PDF using Puppeteer
    const pdfBuffer = await generatePDFFromHTML({
      html,
      fileName: `room_wise_report_${roomName}_${format(new Date(fromDate), 'yyyy-MM-dd')}_to_${format(new Date(toDate), 'yyyy-MM-dd')}.pdf`,
    });

    // Return PDF as response
    const response = new NextResponse(pdfBuffer as any, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="room_wise_report_${roomName}_${format(new Date(fromDate), 'yyyy-MM-dd')}_to_${format(new Date(toDate), 'yyyy-MM-dd')}.pdf"`,
      },
    });

    return response;
  } catch (error) {
    console.error('Error generating PDF:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to generate PDF' },
      { status: 500 }
    );
  }
}
