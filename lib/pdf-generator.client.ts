import { format } from 'date-fns';

async function fetchPDF(
  type: string,
  data: any,
  filters?: any,
  fileName?: string
) {
  const res = await fetch('/api/reports/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ type, data, filters, fileName }),
  });

  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Failed to generate PDF: ${txt}`);
  }

  const arr = await res.arrayBuffer();
  return new Blob([arr], { type: 'application/pdf' });
}

function createPdfClient(
  type: string,
  data: any,
  filters?: any,
  fileName?: string
) {
  let blobPromise: Promise<Blob> | null = null;

  const ensureBlob = () => {
    if (!blobPromise) blobPromise = fetchPDF(type, data, filters, fileName);
    return blobPromise;
  };

  return {
    download: async (name?: string) => {
      const blob = await ensureBlob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download =
        name || fileName || `report-${format(new Date(), 'yyyy-MM-dd')}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    },
    print: async () => {
      const blob = await ensureBlob();
      const url = URL.createObjectURL(blob);
      const w = window.open(url);
      if (!w) {
        const a = document.createElement('a');
        a.href = url;
        a.download =
          fileName || `report-${format(new Date(), 'yyyy-MM-dd')}.pdf`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
        return;
      }
      w.onload = () => {
        try {
          w.focus();
          w.print();
        } catch (e) {}
      };
    },
    getBlob: ensureBlob,
  };
}

export const generateCustomerReportPDF = (reportData: any, filters: any) =>
  createPdfClient(
    'customer',
    reportData,
    filters,
    `customer-report-${format(new Date(), 'yyyy-MM-dd')}.pdf`
  );

export const generateAuditReportPDF = (reportData: any) =>
  createPdfClient(
    'audit',
    reportData,
    undefined,
    `audit-report-${format(new Date(), 'yyyy-MM-dd')}.pdf`
  );

export const generateExpenseReportPDF = (reportData: any, filters: any) =>
  createPdfClient(
    'expense',
    reportData,
    filters,
    `expense-report-${format(new Date(), 'yyyy-MM-dd')}.pdf`
  );

export const generateOverallReportPDF = (reportData: any, filters: any) =>
  createPdfClient(
    'overall',
    reportData,
    filters,
    `overall-report-${format(new Date(), 'yyyy-MM-dd')}.pdf`
  );

export const generateStockReportPDF = (
  inventory: any[],
  summary: any,
  filters: any
) =>
  createPdfClient(
    'stock',
    { inventory, summary },
    filters,
    `stock-report-${format(new Date(), 'yyyy-MM-dd')}.pdf`
  );

export const generateEntryReceiptPDF = (receiptData: any) =>
  createPdfClient(
    'entry',
    receiptData,
    undefined,
    `entry-receipt-${receiptData?.receiptNo || Date.now()}.pdf`
  );

export const generateClearanceReceiptPDF = (clearanceData: any) =>
  createPdfClient(
    'clearance',
    clearanceData,
    undefined,
    `clearance-receipt-${clearanceData?.clearanceNo || Date.now()}.pdf`
  );

export const generateCashBookReportPDF = (reportData: any, filters: any) =>
  createPdfClient(
    'cash-book',
    reportData,
    filters,
    `cash-book-report-${format(new Date(), 'yyyy-MM-dd')}.pdf`
  );
