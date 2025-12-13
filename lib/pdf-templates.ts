import { format } from 'date-fns';
import {
  generateEntryReceiptHTML,
  generateClearanceReceiptHTML,
} from './urdu-receipt-templates';

// Urdu text mapping same as pdf-generator
export const urduText = {
  header: 'احمد وقاص کولڈ اسٹوریج',
  customerReport: 'کسٹمر رپورٹ',
  overallReport: 'مجموعی رپورٹ',
  expenseReport: 'اخراجات رپورٹ',
  auditReport: 'آڈٹ رپورٹ',
  stockReport: 'اسٹاک رپورٹ',
  date: 'تاریخ',
  period: 'مدت',
  totalAmount: 'کل رقم',
  currentBalance: 'موجودہ بیلنس',
  entries: 'رسیدیں',
};

export const bilingualText = (english: string, urdu: string) => {
  return `${english} / ${urdu}`;
};

// Helper to embed a basic page layout with fonts and rtl support.
function wrapHtml(title: string, bodyContent: string) {
  return `<!DOCTYPE html>
<html lang="ur" dir="rtl">
  <head>
    <meta charset="UTF-8"/>
    <meta name="viewport" content="width=device-width, initial-scale=1"/>
    <title>${title}</title>
    <style>
      @import url("https://fonts.googleapis.com/css2?family=Roboto:wght@400;700&display=swap");
      /* Urdu font loaded from static path which is included in project root */
      @font-face {
        font-family: 'NotoNastaliqUrdu';
        src: url('/Noto_Nastaliq_Urdu/static/NotoNastaliqUrdu-Regular.ttf') format('truetype');
        font-weight: normal;
        font-style: normal;
        font-display: swap;
      }

      body { font-family: Roboto, Arial, sans-serif; padding: 20px; }
      .urdu { font-family: 'NotoNastaliqUrdu', 'Noto Naskh Arabic', serif; }
      .header { text-align:center; margin-bottom: 10px; }
      h1 { margin: 0 0 5px 0; }
      .subheader { color: #555; margin-bottom: 10px }
      table { width: 100%; border-collapse: collapse; margin-bottom: 10px; }
      th, td { border: 1px solid #ddd; padding: 6px; }
      th { background: #f4f4f4; text-align: right; }
      .right { text-align: right }
      .ltr { direction:ltr; text-align:left }
      .summary { width: 50%; margin: 0 auto 10px auto }
      .small { font-size: 0.9em; color:#666 }
    </style>
  </head>
  <body>
    <div class="header">
      <h1>Ahmad Waqas Cold Storage</h1>
      <div class="urdu">${urduText.header}</div>
      <div class="subheader">${title}</div>
    </div>
    ${bodyContent}
    <footer class="small">Generated: ${format(new Date(), 'PPP pp')}</footer>
  </body>
</html>`;
}

export const buildStockReportHTML = (
  inventory: any[],
  summary: any,
  filters: any
) => {
  const room = filters?.roomName || 'All Rooms';
  const rows = inventory
    .map(
      (item, idx) => `
      <tr>
        <td style="text-align:center">${idx + 1}</td>
        <td>${item.productType?.name || '-'}</td>
        <td>${item.productSubType?.name || '-'}</td>
        <td>${item.room?.name || '-'}</td>
        <td class="right">${item.remainingQuantity || 0}</td>
        <td class="ltr">Rs. ${(item.unitPrice || 0).toFixed(2)}</td>
        <td class="ltr">Rs. ${((item.remainingQuantity || 0) * (item.unitPrice || 0)).toFixed(2)}</td>
      </tr>
    `
    )
    .join('\n');

  const body = `
    <div class="summary">
      <table>
        <tbody>
          <tr><td>Total Items</td><td class="right">${summary?.totalItems || 0}</td></tr>
          <tr><td>Total Quantity</td><td class="right">${summary?.totalQuantity || 0}</td></tr>
          <tr><td>Total Value</td><td class="ltr">Rs. ${(summary?.totalValue || 0).toFixed(2)}</td></tr>
        </tbody>
      </table>
    </div>

    <div class="small">Room: ${room}</div>

    <table>
      <thead>
        <tr>
          <th>#</th>
          <th>Product Type</th>
          <th>Sub Type</th>
          <th>Room</th>
          <th>Qty</th>
          <th>Unit Price</th>
          <th>Total Value</th>
        </tr>
      </thead>
      <tbody>
        ${rows}
      </tbody>
    </table>
  `;

  return wrapHtml('Stock Summary Report', body);
};

export const buildExpenseReportHTML = (reportData: any, filters: any) => {
  const rows = (reportData.expenses || [])
    .map(
      (e: any) => `
      <tr>
        <td class="right">${format(new Date(e.date), 'PP')}</td>
        <td>${e.category?.name || '-'}</td>
        <td class="ltr">Rs. ${(e.amount || 0).toFixed(2)}</td>
        <td>${e.description || '-'}</td>
      </tr>
    `
    )
    .join('\n');

  const body = `
    <div class="small">Period: ${filters?.period || 'All'}</div>
    <div class="summary">
      <table>
        <tbody>
          <tr><td>Grand Total</td><td class="ltr">Rs. ${(reportData.summary?.grandTotal || 0).toFixed(2)}</td></tr>
          <tr><td>Count</td><td class="right">${reportData.summary?.count || 0}</td></tr>
        </tbody>
      </table>
    </div>

    <table>
      <thead>
        <tr>
          <th>Date</th>
          <th>Category</th>
          <th>Amount</th>
          <th>Description</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
  `;

  return wrapHtml('Expense Report', body);
};

export const buildOverallReportHTML = (reportData: any, filters: any) => {
  const rowsEntryByType = (reportData.entryByType || [])
    .map(
      (r: any) =>
        `<tr><td>${r.productType}</td><td class="right">${r.quantity}</td><td class="ltr">Rs. ${(r.amount || 0).toFixed(2)}</td></tr>`
    )
    .join('\n');

  const rowsClearanceByType = (reportData.clearanceByType || [])
    .map(
      (r: any) =>
        `<tr><td>${r.productType}</td><td class="right">${r.quantity}</td><td class="ltr">Rs. ${(r.amount || 0).toFixed(2)}</td></tr>`
    )
    .join('\n');

  const entryReceiptRows = (reportData.entries || [])
    .map((receipt: any) => {
      const totalItems = (receipt.items || []).length;
      const totalQty = (receipt.items || []).reduce(
        (sum: number, item: any) => sum + (item.quantity || 0),
        0
      );

      return `
      <tr>
        <td class="right">${format(new Date(receipt.entryDate || receipt.date), 'PP')}</td>
        <td>${receipt.receiptNo || receipt.id}</td>
        <td>${receipt.customer?.name || '-'}</td>
        <td class="right">${totalItems}</td>
        <td class="right">${totalQty}</td>
        <td class="ltr">Rs. ${(receipt.totalAmount || 0).toFixed(2)}</td>
      </tr>
    `;
    })
    .join('\n');

  const clearanceReceiptRows = (reportData.clearances || [])
    .map((receipt: any) => {
      const totalItems = (receipt.clearedItems || []).length;
      const totalQty = (receipt.clearedItems || []).reduce(
        (sum: number, item: any) => sum + (item.clearQuantity || 0),
        0
      );

      return `
      <tr>
        <td class="right">${format(new Date(receipt.clearanceDate || receipt.date), 'PP')}</td>
        <td>${receipt.clearanceNo || receipt.id}</td>
        <td>${receipt.customer?.name || '-'}</td>
        <td class="right">${totalItems}</td>
        <td class="right">${totalQty}</td>
        <td class="ltr">Rs. ${(receipt.totalAmount || 0).toFixed(2)}</td>
      </tr>
    `;
    })
    .join('\n');

  const body = `
    <div class="small">Period: ${filters?.period || 'All'}</div>

    <table>
      <thead>
        <tr><th>Summary</th><th></th></tr>
      </thead>
   <tbody>
  <tr>
    <td class="urdu">کل اندراج کی رقم</td>
    <td class="ltr">Rs. ${(reportData.summary?.totalEntryAmount || 0).toFixed(2)}</td>
  </tr>
  <tr>
    <td class="urdu">کل اندراج کی مقدار</td>
    <td class="right">${reportData.summary?.totalEntryQuantity || 0}</td>
  </tr>
  <tr>
    <td class="urdu">کل نکاسی کی رقم</td>
    <td class="ltr">Rs. ${(reportData.summary?.totalClearanceAmount || 0).toFixed(2)}</td>
  </tr>
  <tr>
    <td class="urdu">کل نکاسی کی مقدار</td>
    <td class="right">${reportData.summary?.totalClearanceQuantity || 0}</td>
  </tr>
</tbody>



    </table>

    ${
      reportData.entryByType && reportData.entryByType.length > 0
        ? `
      <h3>Entry by Product Type</h3>
      <table><thead><tr><th>Product Type</th><th>Quantity</th><th>Amount</th></tr></thead><tbody>${rowsEntryByType}</tbody></table>
    `
        : ''
    }

    ${
      reportData.clearanceByType && reportData.clearanceByType.length > 0
        ? `
      <h3>Clearance by Product Type</h3>
      <table><thead><tr><th>Product Type</th><th>Quantity</th><th>Amount</th></tr></thead><tbody>${rowsClearanceByType}</tbody></table>
    `
        : ''
    }

    ${
      reportData.summary?.entryByRoom &&
      Object.keys(reportData.summary.entryByRoom).length > 0
        ? `
      <h3>Room-wise Summary</h3>
      <table>
        <thead>
          <tr>
            <th>Room</th>
            <th>Entry Qty</th>
            <th>Entry Amount</th>
            <th>Cleared Qty</th>
            <th>Cleared Amount</th>
            <th>Current Stock</th>
          </tr>
        </thead>
        <tbody>
          ${Object.keys(reportData.summary.entryByRoom)
            .map((room) => {
              const entry = reportData.summary.entryByRoom[room] || {
                quantity: 0,
                amount: 0,
              };
              const clearance = reportData.summary.clearanceByRoom?.[room] || {
                quantity: 0,
                amount: 0,
              };
              const current = reportData.summary.currentStockByRoom?.[room] || {
                quantity: 0,
              };
              return `
              <tr>
                <td>${room}</td>
                <td class="right">${entry.quantity}</td>
                <td class="ltr">Rs. ${entry.amount.toFixed(2)}</td>
                <td class="right">${clearance.quantity}</td>
                <td class="ltr">Rs. ${clearance.amount.toFixed(2)}</td>
                <td class="right">${current.quantity}</td>
              </tr>
            `;
            })
            .join('')}
        </tbody>
      </table>
    `
        : ''
    }

    ${
      reportData.summary?.detailedProductBreakdown &&
      reportData.summary.detailedProductBreakdown.length > 0
        ? `
      <h3>Detailed Product Breakdown</h3>
      <table>
        <thead>
          <tr>
            <th>Product Type</th>
            <th>Entry Qty</th>
            <th>Cleared Qty</th>
            <th>Remaining Qty</th>
          </tr>
        </thead>
        <tbody>
          ${reportData.summary.detailedProductBreakdown
            .map((item: any) => {
              const productName = item.productSubType
                ? `${item.productType} (${item.productSubType})`
                : item.productType;
              return `
              <tr>
                <td>${productName}</td>
                <td class="right">${item.entryQuantity}</td>
                <td class="right">${item.clearanceQuantity}</td>
                <td class="right">${item.currentQuantity}</td>
              </tr>
            `;
            })
            .join('')}
        </tbody>
      </table>
    `
        : ''
    }

    ${
      filters?.detailed && entryReceiptRows.length > 0
        ? `
      <h3>Entry Receipts</h3>
      <table>
        <thead>
          <tr>
            <th>Date</th>
            <th>Receipt No</th>
            <th>Customer</th>
            <th>Total Items</th>
            <th>Total Qty</th>
            <th>Total Amount</th>
          </tr>
        </thead>
        <tbody>${entryReceiptRows}</tbody>
      </table>
    `
        : ''
    }

    ${
      filters?.detailed && clearanceReceiptRows.length > 0
        ? `
      <h3>Clearance Receipts</h3>
      <table>
        <thead>
          <tr>
            <th>Date</th>
            <th>Clearance No</th>
            <th>Customer</th>
            <th>Total Items</th>
            <th>Total Qty</th>
            <th>Total Amount</th>
          </tr>
        </thead>
        <tbody>${clearanceReceiptRows}</tbody>
      </table>
    `
        : ''
    }
  `;

  return wrapHtml('Overall Report', body);
};

export const buildAuditReportHTML = (reportData: any) => {
  const periodType =
    reportData?.period?.type === 'month' ? 'Monthly' : 'Yearly';
  const profitMargin = reportData?.financial?.profitMargin;
  const profitMarginValue =
    typeof profitMargin === 'string'
      ? parseFloat(profitMargin)
      : profitMargin || 0;

  const body = `
   <div class="small urdu">مدت: ${periodType} - ${reportData?.period?.year || 'N/A'}</div>

<table>
  <tbody>
    <tr><td class="urdu">کل آمدنی</td><td class="ltr">Rs. ${Number(reportData?.financial?.totalRevenue || 0).toFixed(2)}</td></tr>
    <tr><td class="urdu">کل اخراجات</td><td class="ltr">Rs. ${Number(reportData?.financial?.totalCosts || 0).toFixed(2)}</td></tr>
    <tr><td class="urdu">خالص منافع / نقصان</td><td class="ltr">Rs. ${Number(reportData?.financial?.profitLoss || 0).toFixed(2)}</td></tr>
    <tr><td class="urdu">منافع کی شرح</td><td class="right">${Number(profitMarginValue).toFixed(2)}%</td></tr>
    <tr><td class="urdu">بقایاجات</td><td class="ltr">Rs. ${Number(reportData?.financial?.outstandingBalance || 0).toFixed(2)}</td></tr>
  </tbody>
</table>

<h3 class="urdu">آپریشنز خلاصہ</h3>
<table>
  <tbody>
    <tr><td class="urdu">اندراج کی رقم</td><td class="ltr">Rs. ${Number(reportData?.entry?.totalAmount || 0).toFixed(2)}</td></tr>
    <tr><td class="urdu">اندراج کی مقدار</td><td class="right">${Number(reportData?.entry?.totalQuantity || 0)}</td></tr>
    <tr><td class="urdu">نکاسی کی رقم</td><td class="ltr">Rs. ${Number(reportData?.clearance?.totalAmount || 0).toFixed(2)}</td></tr>
    <tr><td class="urdu">نکاسی کی مقدار</td><td class="right">${Number(reportData?.clearance?.totalQuantity || 0)}</td></tr>
  </tbody>
</table>

<h3 class="urdu">اسٹاک کی صورتحال</h3>
<table>
  <tbody>
    <tr><td class="urdu">کل اسٹاک مالیت</td><td class="ltr">Rs. ${Number(reportData?.inventory?.totalValue || 0).toFixed(2)}</td></tr>
    <tr><td class="urdu">اسٹاک میں موجود اشیاء</td><td class="right">${Number(reportData?.inventory?.itemCount || 0)}</td></tr>
    <tr><td class="urdu">کل مقدار</td><td class="right">${Number(reportData?.inventory?.totalQuantity || 0)}</td></tr>
  </tbody>
</table>

  `;

  return wrapHtml('Audit Report', body);
};

export const buildCustomerReportHTML = (reportData: any, filters: any) => {
  const dateRange =
    filters.fromDate && filters.toDate
      ? `${format(new Date(filters.fromDate), 'PP')} - ${format(new Date(filters.toDate), 'PP')}`
      : 'Date range not specified';

  // Check if this is a marka search report
  if (
    filters.marka &&
    (reportData.entryMarkaData ||
      reportData.clearanceMarkaData ||
      reportData.currentStockMarkaData)
  ) {
    let body = `
      <div class="small">Report Type: ${filters.reportType} - Marka Search</div>
      <div class="small">Customer: ${reportData.customer?.name || '-'}</div>
      <div class="small">Date Range: ${dateRange}</div>
      <div class="small">Marka Filter: "${filters.marka}"</div>
    `;

    // Entry Marka Summary
    if (reportData.entryMarkaData && reportData.entryMarkaData.length > 0) {
      const entryMarkaRows = reportData.entryMarkaData
        .map(
          (item: any) => `
          <tr>
            <td>${reportData.customer?.name || '-'}</td>
            <td>${item.marka}</td>
            <td class="right">${item.totalQuantity}</td>
          </tr>
        `
        )
        .join('\n');

      body += `
        <h3>Entry Marka Summary</h3>
        <table>
          <thead>
            <tr>
              <th>Customer</th><th>Marka</th><th>Total Items</th>
            </tr>
          </thead>
          <tbody>${entryMarkaRows}</tbody>
        </table>
      `;
    }

    // Clearance Marka Summary
    if (
      reportData.clearanceMarkaData &&
      reportData.clearanceMarkaData.length > 0
    ) {
      const clearanceMarkaRows = reportData.clearanceMarkaData
        .map(
          (item: any) => `
          <tr>
            <td>${reportData.customer?.name || '-'}</td>
            <td>${item.marka}</td>
            <td class="right">${item.totalQuantity}</td>
          </tr>
        `
        )
        .join('\n');

      body += `
        <h3>Clearance Marka Summary</h3>
        <table>
          <thead>
            <tr>
              <th>Customer</th><th>Marka</th><th>Total Items</th>
            </tr>
          </thead>
          <tbody>${clearanceMarkaRows}</tbody>
        </table>
      `;
    }

    // Current Stock Marka Summary
    if (
      reportData.currentStockMarkaData &&
      reportData.currentStockMarkaData.length > 0
    ) {
      const currentStockMarkaRows = reportData.currentStockMarkaData
        .map(
          (item: any) => `
          <tr>
            <td>${reportData.customer?.name || '-'}</td>
            <td>${item.marka}</td>
            <td class="right">${item.totalQuantity}</td>
          </tr>
        `
        )
        .join('\n');

      body += `
        <h3>Current Stock Marka Summary</h3>
        <table>
          <thead>
            <tr>
              <th>Customer</th><th>Marka</th><th>Total Items</th>
            </tr>
          </thead>
          <tbody>${currentStockMarkaRows}</tbody>
        </table>
      `;
    }

    body += `
      <div class="small">Balance: Rs. ${Math.abs(reportData.balance || 0).toFixed(2)} ${
        reportData.balance > 0
          ? '(Receivable)'
          : reportData.balance < 0
            ? '(Payable)'
            : '(Settled)'
      }</div>
    `;

    return wrapHtml('Customer Report - Marka Summary', body);
  }

  // Check if this is a summary report
  if (
    !filters.detailed &&
    (reportData.entrySummaryData ||
      reportData.clearanceSummaryData ||
      reportData.currentStockSummaryData)
  ) {
    let body = `
      <div class="small">Report Type: ${filters.reportType} - Summary View</div>
      <div class="small">Customer: ${reportData.customer?.name || '-'}</div>
      <div class="small">Date Range: ${dateRange}</div>
    `;

    // Entry Summary
    if (reportData.entrySummaryData && reportData.entrySummaryData.length > 0) {
      const entrySummaryRows = reportData.entrySummaryData
        .map(
          (item: any) => `
          <tr>
            <td>${reportData.customer?.name || '-'}</td>
            <td>${item.productType}${item.subType ? ` (${item.subType})` : ''}</td>
            <td class="right">${item.totalQuantity}</td>
          </tr>
        `
        )
        .join('\n');

      body += `
        <h3>Entry Summary</h3>
        <table>
          <thead>
            <tr>
              <th>Customer</th><th>Product Type</th><th>Total Items</th>
            </tr>
          </thead>
          <tbody>${entrySummaryRows}</tbody>
        </table>
      `;
    }

    // Clearance Summary
    if (
      reportData.clearanceSummaryData &&
      reportData.clearanceSummaryData.length > 0
    ) {
      const clearanceSummaryRows = reportData.clearanceSummaryData
        .map(
          (item: any) => `
          <tr>
            <td>${reportData.customer?.name || '-'}</td>
            <td>${item.productType}${item.subType ? ` (${item.subType})` : ''}</td>
            <td class="right">${item.totalQuantity}</td>
          </tr>
        `
        )
        .join('\n');

      body += `
        <h3>Clearance Summary</h3>
        <table>
          <thead>
            <tr>
              <th>Customer</th><th>Product Type</th><th>Total Items</th>
            </tr>
          </thead>
          <tbody>${clearanceSummaryRows}</tbody>
        </table>
      `;
    }

    // Current Stock Summary
    if (
      reportData.currentStockSummaryData &&
      reportData.currentStockSummaryData.length > 0
    ) {
      const currentStockSummaryRows = reportData.currentStockSummaryData
        .map(
          (item: any) => `
          <tr>
            <td>${reportData.customer?.name || '-'}</td>
            <td>${item.productType}${item.subType ? ` (${item.subType})` : ''}</td>
            <td class="right">${item.totalQuantity}</td>
          </tr>
        `
        )
        .join('\n');

      body += `
        <h3>Current Stock Summary</h3>
        <table>
          <thead>
            <tr>
              <th>Customer</th><th>Product Type</th><th>Total Items</th>
            </tr>
          </thead>
          <tbody>${currentStockSummaryRows}</tbody>
        </table>
      `;
    }

    body += `
      <div class="small">Balance: Rs. ${Math.abs(reportData.balance || 0).toFixed(2)} ${
        reportData.balance > 0
          ? '(Receivable)'
          : reportData.balance < 0
            ? '(Payable)'
            : '(Settled)'
      }</div>
    `;

    return wrapHtml('Customer Report - Summary', body);
  }

  // Detailed report (existing logic)
  const entryReceipts = reportData.entryData?.receipts || [];
  const clearanceReceipts = reportData.clearanceData?.receipts || [];

  // Build a flat list of entry item rows across all entry receipts
  const entryRows = entryReceipts
    .flatMap((receipt: any) =>
      receipt.items.map((item: any) => ({
        date: receipt.entryDate || receipt.date,
        no: receipt.receiptNo || receipt.id,
        productType: item.productType?.name || '-',
        productSubType: item.productSubType?.name || '-',
        marka: item.marka || '-',
        qty: item.quantity || 0,
        amount: item.totalPrice || item.totalAmount || 0,
      }))
    )
    .map(
      (r: any, idx: number) => `
      <tr>
        <td class="right">${format(new Date(r.date), 'PP')}</td>
        <td>${r.no}</td>
        <td>${r.productType}</td>
        <td>${r.productSubType}</td>
        <td>${r.marka}</td>
        <td class="right">${r.qty}</td>
        <td class="ltr">Rs. ${(r.amount || 0).toFixed(2)}</td>
      </tr>
    `
    )
    .join('\n');

  // Build flat list of cleared items for clearances
  const clearanceRows = clearanceReceipts
    .flatMap((receipt: any) =>
      receipt.clearedItems.map((item: any) => ({
        date: receipt.clearanceDate || receipt.date,
        no: receipt.clearanceNo || receipt.id,
        productType: item.entryItem?.productType?.name || '-',
        productSubType: item.entryItem?.productSubType?.name || '-',
        marka: item.entryItem?.marka || '-',
        qty: item.clearQuantity || 0,
        amount: item.totalAmount || 0,
      }))
    )
    .map(
      (r: any, idx: number) => `
      <tr>
        <td class="right">${format(new Date(r.date), 'PP')}</td>
        <td>${r.no}</td>
        <td>${r.productType}</td>
        <td>${r.productSubType}</td>
        <td>${r.marka}</td>
        <td class="right">${r.qty}</td>
        <td class="ltr">Rs. ${(r.amount || 0).toFixed(2)}</td>
      </tr>
    `
    )
    .join('\n');

  const body = `
    <div class="small">Report Type: ${filters.reportType} - Detailed View</div>
    <div class="small">Customer: ${reportData.customer?.name || '-'}</div>
    <div class="small">Date Range: ${dateRange}</div>

    ${
      entryRows.length > 0
        ? `
      <h3>Entry Records</h3>
      <table>
        <thead>
          <tr>
            <th>Date</th><th>Receipt No</th><th>Product Type</th><th>Sub Type</th><th>Marka</th><th>Qty</th><th>Amount</th>
          </tr>
        </thead>
        <tbody>${entryRows}</tbody>
      </table>
    `
        : ''
    }

    ${
      clearanceRows.length > 0
        ? `
      <h3>Clearance Records</h3>
      <table>
        <thead>
          <tr>
            <th>Date</th><th>Clearance No</th><th>Product Type</th><th>Sub Type</th><th>Marka</th><th>Qty</th><th>Amount</th>
          </tr>
        </thead>
        <tbody>${clearanceRows}</tbody>
      </table>
    `
        : ''
    }

    <div class="small">Balance: Rs. ${Math.abs(reportData.balance || 0).toFixed(2)} ${
      reportData.balance > 0
        ? '(Receivable)'
        : reportData.balance < 0
          ? '(Payable)'
          : '(Settled)'
    }</div>
    
    ${
      reportData.ledger && reportData.ledger.length > 0
        ? `
      <h3>Ledger</h3>
      <table>
        <thead>
          <tr><th>Date</th><th>Description</th><th>Debit</th><th>Credit</th></tr>
        </thead>
        <tbody>
          ${reportData.ledger
            .map(
              (l: any) => `
              <tr>
                <td class="right">${format(new Date(l.createdAt), 'PP')}</td>
                <td>${l.description || '-'}</td>
                <td class="ltr">Rs. ${(l.debitAmount || 0).toFixed(2)}</td>
                <td class="ltr">Rs. ${(l.creditAmount || 0).toFixed(2)}</td>
              </tr>
            `
            )
            .join('\n')}
        </tbody>
      </table>
    `
        : ''
    }
  `;

  return wrapHtml('Customer Report - Detailed', body);
};

export const buildEntryReceiptHTML = (receiptData: any) => {
  // Reuse existing Urdu templates for entry & clearance receipts
  return generateEntryReceiptHTML(receiptData);
};

export const buildClearanceReceiptHTML = (clearanceData: any) => {
  return generateClearanceReceiptHTML(clearanceData);
};
