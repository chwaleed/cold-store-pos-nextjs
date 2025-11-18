import { NextRequest, NextResponse } from 'next/server';
import {
  generatePDFFromHTML,
  getUrduFontPath,
} from '@/lib/pdf-receipt-generator';
import {
  buildStockReportHTML,
  buildExpenseReportHTML,
  buildOverallReportHTML,
  buildAuditReportHTML,
  buildCustomerReportHTML,
  buildEntryReceiptHTML,
  buildClearanceReceiptHTML,
} from '@/lib/pdf-templates';
import fs from 'fs';
import path from 'path';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const type = body.type;
    const data = body.data;
    const filters = body.filters;

    let html = '';
    let fileName = body.fileName || `report-${Date.now()}.pdf`;

    switch (type) {
      case 'stock':
        html = buildStockReportHTML(
          data.inventory || [],
          data.summary || {},
          filters || {}
        );
        break;
      case 'expense':
        html = buildExpenseReportHTML(data, filters || {});
        break;
      case 'overall':
        html = buildOverallReportHTML(data, filters || {});
        break;
      case 'audit':
        html = buildAuditReportHTML(data);
        break;
      case 'customer':
        html = buildCustomerReportHTML(data, filters || {});
        break;
      case 'entry':
        html = buildEntryReceiptHTML(data);
        break;
      case 'clearance':
        html = buildClearanceReceiptHTML(data);
        break;
      default:
        return NextResponse.json(
          { success: false, error: 'Unknown report type' },
          { status: 400 }
        );
    }

    // Ensure the fonts are accessible in the HTML by embedding base64 for the Urdu font
    // We'll attempt to find the font using the helper from pdf-receipt-generator or fallback to a static path
    try {
      const fontPath = getUrduFontPath();
      if (fs.existsSync(fontPath)) {
        const fontData = fs.readFileSync(fontPath);
        const b64 = fontData.toString('base64');
        // Embed base64 into CSS by replacing reference if present
        html = html.replace(
          "url('/Noto_Nastaliq_Urdu/static/NotoNastaliqUrdu-Regular.ttf')",
          `url('data:font/ttf;base64,${b64}')`
        );
      }
    } catch (err) {
      console.warn('Could not embed urdu font:', err);
    }

    const pdfBuffer = await generatePDFFromHTML({ html, fileName });

    // convert to Node Buffer for Response
    const nodeBuffer = Buffer.from(pdfBuffer as any);

    return new Response(nodeBuffer as any, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${fileName}"`,
      },
    });
  } catch (error: any) {
    console.error('PDF route error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
