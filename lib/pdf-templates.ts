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
        font-family: 'Noto Nastaliq Urdu';
        src: url('/Noto_Nastaliq_Urdu/static/NotoNastaliqUrdu-Regular.ttf') format('truetype');
        font-weight: 400;
        font-style: normal;
        font-display: swap;
      }

      body { font-family: Roboto, Arial, sans-serif; padding: 20px; }
      .urdu { font-family: 'Noto Nastaliq Urdu', 'Noto Naskh Arabic', serif; }
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
      .info-list { margin: 15px 0; padding: 10px; background: #f9f9f9; border-radius: 5px; }
      .info-item { padding: 5px 0; border-bottom: 1px solid #e0e0e0; }
      .info-item:last-child { border-bottom: none; }
      .info-label { display: inline-block; min-width: 200px; font-weight: 500; }
      .info-value { display: inline-block; }
    </style>
  </head>
  <body>
    <div class="header">
      <h1>Ahmad Waqas Cold Storage</h1>
      <div class="urdu">${urduText.header}</div>
      <div class="subheader">${title}</div>
    </div>
    ${bodyContent}
    <footer class="small urdu">تیار کردہ: ${format(new Date(), 'PPP pp')}</footer>
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
          <tr><td class="urdu">کل اشیاء</td><td class="right">${summary?.totalItems || 0}</td></tr>
          <tr><td class="urdu">کل مقدار</td><td class="right">${summary?.totalQuantity || 0}</td></tr>
          <tr><td class="urdu">کل قیمت</td><td class="ltr">Rs. ${(summary?.totalValue || 0).toFixed(2)}</td></tr>
        </tbody>
      </table>
    </div>

    <div class="small urdu">کمرہ: ${room}</div>

    <table>
      <thead>
        <tr>
          <th class="urdu">#</th>
          <th class="urdu">پروڈکٹ کی قسم</th>
          <th class="urdu">ذیلی قسم</th>
          <th class="urdu">کمرہ</th>
          <th class="urdu">مقدار</th>
          <th class="urdu">یونٹ قیمت</th>
          <th class="urdu">کل قیمت</th>
        </tr>
      </thead>
      <tbody>
        ${rows}
      </tbody>
    </table>
  `;

  return wrapHtml('اسٹاک خلاصہ رپورٹ', body);
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
    <div class="small urdu">مدت: ${filters?.period || 'تمام'}</div>
    <div class="summary">
      <table>
        <tbody>
          <tr><td class="urdu">کل رقم</td><td class="ltr">Rs. ${(reportData.summary?.grandTotal || 0).toFixed(2)}</td></tr>
          <tr><td class="urdu">تعداد</td><td class="right">${reportData.summary?.count || 0}</td></tr>
        </tbody>
      </table>
    </div>

    <table>
      <thead>
        <tr>
          <th class="urdu">تاریخ</th>
          <th class="urdu">زمرہ</th>
          <th class="urdu">رقم</th>
          <th class="urdu">تفصیل</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
  `;

  return wrapHtml('اخراجات رپورٹ', body);
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
    <div class="small urdu">مدت: ${filters?.period || 'تمام'}</div>

    <table>
      <thead>
        <tr><th class="urdu">خلاصہ</th><th></th></tr>
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
      <h3 class="urdu">پروڈکٹ کی قسم کے مطابق اندراج</h3>
      <table><thead><tr><th class="urdu">پروڈکٹ کی قسم</th><th class="urdu">مقدار</th><th class="urdu">رقم</th></tr></thead><tbody>${rowsEntryByType}</tbody></table>
    `
        : ''
    }

    ${
      reportData.clearanceByType && reportData.clearanceByType.length > 0
        ? `
      <h3 class="urdu">پروڈکٹ کی قسم کے مطابق نکاسی</h3>
      <table><thead><tr><th class="urdu">پروڈکٹ کی قسم</th><th class="urdu">مقدار</th><th class="urdu">رقم</th></tr></thead><tbody>${rowsClearanceByType}</tbody></table>
    `
        : ''
    }

    ${
      reportData.summary?.entryByRoom &&
      Object.keys(reportData.summary.entryByRoom).length > 0
        ? `
      <h3 class="urdu">کمرے کے مطابق خلاصہ</h3>
      <table>
        <thead>
          <tr>
            <th class="urdu">کمرہ</th>
            <th class="urdu">اندراج مقدار</th>
            <th class="urdu">اندراج رقم</th>
            <th class="urdu">نکاسی مقدار</th>
            <th class="urdu">نکاسی رقم</th>
            <th class="urdu">موجودہ اسٹاک</th>
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
      <h3 class="urdu">تفصیلی پروڈکٹ تقسیم</h3>
      <table>
        <thead>
          <tr>
            <th class="urdu">پروڈکٹ کی قسم</th>
            <th class="urdu">اندراج مقدار</th>
            <th class="urdu">نکاسی مقدار</th>
            <th class="urdu">باقی مقدار</th>
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
      <h3 class="urdu">اندراج کی رسیدیں</h3>
      <table>
        <thead>
          <tr>
            <th class="urdu">تاریخ</th>
            <th class="urdu">رسید نمبر</th>
            <th class="urdu">کسٹمر</th>
            <th class="urdu">کل اشیاء</th>
            <th class="urdu">کل مقدار</th>
            <th class="urdu">کل رقم</th>
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
      <h3 class="urdu">نکاسی کی رسیدیں</h3>
      <table>
        <thead>
          <tr>
            <th class="urdu">تاریخ</th>
            <th class="urdu">نکاسی نمبر</th>
            <th class="urdu">کسٹمر</th>
            <th class="urdu">کل اشیاء</th>
            <th class="urdu">کل مقدار</th>
            <th class="urdu">کل رقم</th>
          </tr>
        </thead>
        <tbody>${clearanceReceiptRows}</tbody>
      </table>
    `
        : ''
    }
  `;

  return wrapHtml('مجموعی رپورٹ', body);
};

export const buildAuditReportHTML = (reportData: any, filters?: any) => {
  const dateRange =
    filters?.fromDate && filters?.toDate
      ? `${format(new Date(filters.fromDate), 'PP')} - ${format(new Date(filters.toDate), 'PP')}`
      : 'تاریخ کی حد متعین نہیں';

  const netProfit = reportData?.summary?.netProfit || 0;
  const netProfitColor = netProfit >= 0 ? '#16a34a' : '#dc2626';

  const cashReceived = Number(reportData?.summary?.totalCashReceived || 0);
  const totalDiscount = Number(reportData?.summary?.totalDiscount || 0);
  const totalExpenses = Number(reportData?.summary?.totalExpenses || 0);

  const netCashReceived = cashReceived - totalDiscount;

  const body = `
    <div class="info-list urdu">
      <div class="info-item">
        <span class="info-label">رپورٹ کی قسم:</span>
        <span class="info-value">منافع اور آڈٹ رپورٹ</span>
      </div>
      <div class="info-item">
        <span class="info-label">تاریخ کی حد:</span>
        <span class="info-value">${dateRange}</span>
      </div>
      <div class="info-item">
        <span class="info-label">تیار کردہ:</span>
        <span class="info-value">${format(new Date(), 'PPP pp')}</span>
      </div>
    </div>

    <h3 class="urdu">کاروباری میٹرکس</h3>
    <table>
      <thead>
        <tr>
          <th class="urdu">تفصیل</th>
          <th class="urdu">رقم</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td class="urdu">کل اندراج کی رقم</td>
          <td class="ltr">Rs. ${Number(reportData?.summary?.totalEntryAmount || 0).toFixed(2)}</td>
        </tr>
        <tr>
          <td class="urdu">کل نکاسی کی رقم</td>
          <td class="ltr">Rs. ${Number(reportData?.summary?.totalClearanceAmount || 0).toFixed(2)}</td>
        </tr>
      </tbody>
    </table>

    <h3 class="urdu">آمدنی اور اخراجات</h3>
    <table>
      <thead>
        <tr>
          <th class="urdu">تفصیل</th>
          <th class="urdu">رقم</th>
        </tr>
      </thead>
      <tbody>
       <tr>
          <td class="urdu">نقد وصول شدہ (رعایت کے بعد)</td>
          <td class="ltr">Rs. ${netCashReceived.toFixed(2)}</td>
        </tr>

        <tr>
          <td class="urdu">کل اخراجات</td>
          <td class="ltr">Rs. ${totalExpenses.toFixed(2)}</td>
        </tr>

        <tr>
          <td class="urdu">کل رعایت</td>
          <td class="ltr">Rs. ${totalDiscount.toFixed(2)}</td>
        </tr>

      </tbody>
    </table>

    <div style="background: #f3e8ff; border: 2px solid #9333ea; border-radius: 6px; padding: 12px; margin: 15px 0; text-align: center; max-width: 400px; margin-left: auto; margin-right: auto;">
      <div style="font-size: 12px; color: #6b7280; margin-bottom: 4px; font-weight: 500; font-family: 'Noto Nastaliq Urdu', 'Noto Naskh Arabic', serif;">خالص منافع</div>
      <div style="font-size: 9px; color: #9ca3af; margin-bottom: 6px; font-family: 'Noto Nastaliq Urdu', 'Noto Naskh Arabic', serif;">نقد وصول شدہ - اخراجات - رعایت</div>
      <div style="font-size: 24px; font-weight: 800; color: ${netProfitColor}; direction: ltr;">Rs. ${Number(netProfit).toFixed(2)}</div>
    </div>

    <h3 class="urdu">دیگر میٹرکس</h3>
    <table>
      <thead>
        <tr>
          <th class="urdu">تفصیل</th>
          <th class="urdu">رقم</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td class="urdu">بقایاجات</td>
          <td class="ltr">Rs. ${Number(reportData?.summary?.totalOutstandingBalance || 0).toFixed(2)}</td>
        </tr>
        <tr>
          <td class="urdu">خالص براہ راست نقد (قرضے)</td>
          <td class="ltr">Rs. ${Number(reportData?.summary?.netDirectCash || 0).toFixed(2)}</td>
        </tr>
      </tbody>
    </table>

    <h3 class="urdu">براہ راست نقد / قرض کی تفصیلات</h3>
    <div style="border: 1px solid #e5e7eb; border-radius: 6px; padding: 15px; background: #fafafa;">
      <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e5e7eb;">
        <span style="font-size: 12px; color: #374151; font-family: 'Noto Nastaliq Urdu', 'Noto Naskh Arabic', serif;">براہ راست نقد دیا گیا (قرضے)</span>
        <span style="font-size: 12px; font-weight: 600; color: #dc2626; direction: ltr;">Rs. ${Number(reportData?.summary?.totalDirectCashGiven || 0).toFixed(2)}</span>
      </div>
      <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e5e7eb;">
        <span style="font-size: 12px; color: #374151; font-family: 'Noto Nastaliq Urdu', 'Noto Naskh Arabic', serif;">براہ راست نقد وصول شدہ (واپسی)</span>
        <span style="font-size: 12px; font-weight: 600; color: #16a34a; direction: ltr;">Rs. ${Number(reportData?.summary?.totalDirectCashReceived || 0).toFixed(2)}</span>
      </div>
      <div style="display: flex; justify-content: space-between; padding: 10px; margin-top: 8px; background: #fef3c7; border-radius: 4px; font-weight: 600;">
        <span style="font-size: 12px; color: #374151; font-family: 'Noto Nastaliq Urdu', 'Noto Naskh Arabic', serif;">خالص بقایا قرضے</span>
        <span style="font-size: 12px; font-weight: 600; color: #d97706; direction: ltr;">Rs. ${Number(reportData?.summary?.netDirectCash || 0).toFixed(2)}</span>
      </div>
    </div>

    ${
      reportData?.breakdown?.expensesByCategory &&
      Object.keys(reportData.breakdown.expensesByCategory).length > 0
        ? `
    <h3 class="urdu">زمرہ کے مطابق اخراجات کی تفصیل</h3>
    <table>
      <thead>
        <tr>
          <th class="urdu">زمرہ</th>
          <th class="urdu">رقم</th>
          <th class="urdu">فیصد</th>
        </tr>
      </thead>
      <tbody>
        ${Object.entries(reportData.breakdown.expensesByCategory)
          .sort(([, a]: any, [, b]: any) => b - a)
          .map(
            ([category, amount]: [string, any]) => `
          <tr>
            <td>${category}</td>
            <td class="ltr" style="color: #dc2626; font-weight: 600;">Rs. ${Number(amount).toFixed(2)}</td>
            <td class="right" style="color: #6b7280;">${((amount / reportData.summary.totalExpenses) * 100).toFixed(1)}%</td>
          </tr>
        `
          )
          .join('')}
      </tbody>
    </table>
    `
        : ''
    }
  `;

  return wrapHtml('منافع اور آڈٹ رپورٹ', body);
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
    // Calculate totals for marka search
    const totalEntryAmount = reportData.entryData?.totalAmount || 0;
    const totalClearedAmount = reportData.clearanceData?.totalAmount || 0;
    const totalDiscount =
      reportData.entryData?.totalDiscount ||
      reportData.clearanceData?.totalDiscount ||
      0;
    const outstandingBalance = reportData.balance || 0;

    let body = `
      <div class="info-list urdu">
        <div class="info-item">
          <span class="info-label">رپورٹ کی قسم:</span>
          <span class="info-value">${filters.reportType} - مارکہ تلاش</span>
        </div>
        <div class="info-item">
          <span class="info-label">کسٹمر:</span>
          <span class="info-value">${reportData.customer?.name || '-'}</span>
        </div>
        <div class="info-item">
          <span class="info-label">تاریخ کی حد:</span>
          <span class="info-value">${dateRange}</span>
        </div>
        <div class="info-item">
          <span class="info-label">مارکہ فلٹر:</span>
          <span class="info-value">"${filters.marka}"</span>
        </div>
        <div class="info-item">
          <span class="info-label">کل اندراج کی رقم:</span>
          <span class="info-value ltr">Rs. ${totalEntryAmount.toFixed(2)}</span>
        </div>
        <div class="info-item">
          <span class="info-label">کل نکاسی کی رقم:</span>
          <span class="info-value ltr">Rs. ${totalClearedAmount.toFixed(2)}</span>
        </div>
        <div class="info-item">
          <span class="info-label">کل رعایت:</span>
          <span class="info-value ltr">Rs. ${totalDiscount.toFixed(2)}</span>
        </div>
        <div class="info-item">
          <span class="info-label">بقایا رقم:</span>
          <span class="info-value ltr">Rs. ${Math.abs(outstandingBalance).toFixed(2)} ${
            outstandingBalance > 0
              ? '(وصولی)'
              : outstandingBalance < 0
                ? '(ادائیگی)'
                : '(صاف)'
          }</span>
        </div>
      </div>
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
        <h3 class="urdu">اندراج مارکہ خلاصہ</h3>
        <table>
          <thead>
            <tr>
              <th class="urdu">کسٹمر</th><th class="urdu">مارکہ</th><th class="urdu">کل اشیاء</th>
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
        <h3 class="urdu">نکاسی مارکہ خلاصہ</h3>
        <table>
          <thead>
            <tr>
              <th class="urdu">کسٹمر</th><th class="urdu">مارکہ</th><th class="urdu">کل اشیاء</th>
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
        <h3 class="urdu">موجودہ اسٹاک مارکہ خلاصہ</h3>
        <table>
          <thead>
            <tr>
              <th class="urdu">کسٹمر</th><th class="urdu">مارکہ</th><th class="urdu">کل اشیاء</th>
            </tr>
          </thead>
          <tbody>${currentStockMarkaRows}</tbody>
        </table>
      `;
    }

    body += `
      <div class="small urdu">بیلنس: Rs. ${Math.abs(reportData.balance || 0).toFixed(2)} ${
        reportData.balance > 0
          ? '(وصولی)'
          : reportData.balance < 0
            ? '(ادائیگی)'
            : '(صاف)'
      }</div>
    `;

    return wrapHtml('کسٹمر رپورٹ - مارکہ خلاصہ', body);
  }

  // Check if this is a summary report
  if (
    !filters.detailed &&
    (reportData.entrySummaryData ||
      reportData.clearanceSummaryData ||
      reportData.currentStockSummaryData)
  ) {
    // Calculate totals for summary view
    const totalEntryAmount = reportData.entryData?.totalAmount || 0;
    const totalClearedAmount = reportData.clearanceData?.totalAmount || 0;
    const totalDiscount =
      reportData.entryData?.totalDiscount ||
      reportData.clearanceData?.totalDiscount ||
      0;
    const outstandingBalance = reportData.balance || 0;

    let body = `
      <div class="info-list urdu">
        <div class="info-item">
          <span class="info-label">رپورٹ کی قسم:</span>
          <span class="info-value">${filters.reportType} - خلاصہ</span>
        </div>
        <div class="info-item">
          <span class="info-label">کسٹمر:</span>
          <span class="info-value">${reportData.customer?.name || '-'}</span>
        </div>
        <div class="info-item">
          <span class="info-label">تاریخ کی حد:</span>
          <span class="info-value">${dateRange}</span>
        </div>
        <div class="info-item">
          <span class="info-label">کل اندراج کی رقم:</span>
          <span class="info-value ltr">Rs. ${totalEntryAmount.toFixed(2)}</span>
        </div>
        <div class="info-item">
          <span class="info-label">کل نکاسی کی رقم:</span>
          <span class="info-value ltr">Rs. ${totalClearedAmount.toFixed(2)}</span>
        </div>
        <div class="info-item">
          <span class="info-label">کل رعایت:</span>
          <span class="info-value ltr">Rs. ${totalDiscount.toFixed(2)}</span>
        </div>
        <div class="info-item">
          <span class="info-label">بقایا رقم:</span>
          <span class="info-value ltr">Rs. ${Math.abs(outstandingBalance).toFixed(2)} ${
            outstandingBalance > 0
              ? '(وصولی)'
              : outstandingBalance < 0
                ? '(ادائیگی)'
                : '(صاف)'
          }</span>
        </div>
      </div>
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
        <h3 class="urdu">اندراج کا خلاصہ</h3>
        <table>
          <thead>
            <tr>
              <th class="urdu">کسٹمر</th><th class="urdu">پروڈکٹ کی قسم</th><th class="urdu">کل اشیاء</th>
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
        <h3 class="urdu">نکاسی کا خلاصہ</h3>
        <table>
          <thead>
            <tr>
              <th class="urdu">کسٹمر</th><th class="urdu">پروڈکٹ کی قسم</th><th class="urdu">کل اشیاء</th>
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
        <h3 class="urdu">موجودہ اسٹاک کا خلاصہ</h3>
        <table>
          <thead>
            <tr>
              <th class="urdu">کسٹمر</th><th class="urdu">پروڈکٹ کی قسم</th><th class="urdu">کل اشیاء</th>
            </tr>
          </thead>
          <tbody>${currentStockSummaryRows}</tbody>
        </table>
      `;
    }

    body += `
      <div class="small urdu">بیلنس: Rs. ${Math.abs(reportData.balance || 0).toFixed(2)} ${
        reportData.balance > 0
          ? '(وصولی)'
          : reportData.balance < 0
            ? '(ادائیگی)'
            : '(صاف)'
      }</div>
    `;

    return wrapHtml('کسٹمر رپورٹ - خلاصہ', body);
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

  // Calculate totals for financial summary
  const totalEntryAmount = entryReceipts.reduce(
    (sum: number, receipt: any) => sum + (receipt.totalAmount || 0),
    0
  );
  const totalClearedAmount = clearanceReceipts.reduce(
    (sum: number, receipt: any) => sum + (receipt.totalAmount || 0),
    0
  );
  const totalDiscount =
    entryReceipts.reduce(
      (sum: number, receipt: any) => sum + (receipt.discount || 0),
      0
    ) +
    clearanceReceipts.reduce(
      (sum: number, receipt: any) => sum + (receipt.discount || 0),
      0
    );
  const outstandingBalance = reportData.balance || 0;

  const body = `
    <div class="info-list urdu">
      <div class="info-item">
        <span class="info-label">رپورٹ کی قسم:</span>
        <span class="info-value">${filters.reportType} - تفصیلی</span>
      </div>
      <div class="info-item">
        <span class="info-label">کسٹمر:</span>
        <span class="info-value">${reportData.customer?.name || '-'}</span>
      </div>
      <div class="info-item">
        <span class="info-label">تاریخ کی حد:</span>
        <span class="info-value">${dateRange}</span>
      </div>
      <div class="info-item">
        <span class="info-label">کل اندراج کی رقم:</span>
        <span class="info-value ltr">Rs. ${totalEntryAmount.toFixed(2)}</span>
      </div>
      <div class="info-item">
        <span class="info-label">کل نکاسی کی رقم:</span>
        <span class="info-value ltr">Rs. ${totalClearedAmount.toFixed(2)}</span>
      </div>
      <div class="info-item">
        <span class="info-label">کل رعایت:</span>
        <span class="info-value ltr">Rs. ${totalDiscount.toFixed(2)}</span>
      </div>
      <div class="info-item">
        <span class="info-label">بقایا رقم:</span>
        <span class="info-value ltr">Rs. ${Math.abs(outstandingBalance).toFixed(2)} ${
          outstandingBalance > 0
            ? '(وصولی)'
            : outstandingBalance < 0
              ? '(ادائیگی)'
              : '(صاف)'
        }</span>
      </div>
    </div>

    ${
      entryRows.length > 0
        ? `
      <h3 class="urdu">اندراج کے ریکار
      <table>
        <thead>
          <tr>
            <th class="urdu">تاریخ</th><th class="urdu">رسید نمبر</th><th class="urdu">پروڈکٹ کی قسم</th><th class="urdu">ذیلی قسم</th><th class="urdu">مارکہ</th><th class="urdu">مقدار</th><th class="urdu">رقم</th>
          </tr>
        </thead>
        <tbody >${entryRows}</tbody>
      </table>
    `
        : ''
    }

    ${
      clearanceRows.length > 0
        ? `
      <h3 class="urdu">نکاسی کے ریکارڈ</h3>
      <table>
        <thead>
          <tr>
            <th class="urdu">تاریخ</th><th class="urdu">نکاسی نمبر</th><th class="urdu">پروڈکٹ کی قسم</th><th class="urdu">ذیلی قسم</th><th class="urdu">مارکہ</th><th class="urdu">مقدار</th><th class="urdu">رقم</th>
          </tr>
        </thead>
        <tbody>${clearanceRows}</tbody>
      </table>
    `
        : ''
    }

    <div class="small urdu">بیلنس: Rs. ${Math.abs(reportData.balance || 0).toFixed(2)} ${
      reportData.balance > 0
        ? '(وصولی)'
        : reportData.balance < 0
          ? '(ادائیگی)'
          : '(صاف)'
    }</div>
    
    ${
      reportData.ledger && reportData.ledger.length > 0
        ? `
      <h3 class="urdu">کھاتہ</h3>
      <table>
        <thead>
          <tr><th class="urdu">تاریخ</th><th class="urdu">تفصیل</th><th class="urdu">ڈیبٹ</th><th class="urdu">کریڈٹ</th></tr>
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

  return wrapHtml('کسٹمر رپورٹ - تفصیلی', body);
};

export const buildEntryReceiptHTML = (receiptData: any) => {
  // Reuse existing Urdu templates for entry & clearance receipts
  return generateEntryReceiptHTML(receiptData);
};

export const buildClearanceReceiptHTML = (clearanceData: any) => {
  return generateClearanceReceiptHTML(clearanceData);
};

export const buildCashBookReportHTML = (reportData: any, filters: any) => {
  const dateRange =
    filters?.fromDate && filters?.toDate
      ? `${format(new Date(filters.fromDate), 'PP')} - ${format(new Date(filters.toDate), 'PP')}`
      : 'Date range not specified';

  // Summary section
  let body = `
    <div class="small urdu">رپورٹ کی قسم: نقدی کتاب رپورٹ</div>
    <div class="small urdu">تاریخ کی حد: ${dateRange}</div>
    <div class="small urdu">تیار کردہ: ${format(new Date(), 'PPP pp')}</div>

    <table>
      <thead>
        <tr><th colspan="2" class="urdu">نقدی کتاب کا خلاصہ</th></tr>
      </thead>
      <tbody>
        <tr><td class="urdu">ابتدائی بیلنس</td><td class="ltr">Rs. ${Number(reportData.summary?.openingBalance || 0).toFixed(2)}</td></tr>
        <tr><td class="urdu">کل آمدنی</td><td class="ltr">Rs. ${Number(reportData.summary?.totalInflows || 0).toFixed(2)}</td></tr>
        <tr><td class="urdu">کل اخراجات</td><td class="ltr">Rs. ${Number(reportData.summary?.totalOutflows || 0).toFixed(2)}</td></tr>
        <tr><td class="urdu">خالص نقدی بہاؤ</td><td class="ltr">Rs. ${Number(reportData.summary?.netCashFlow || 0).toFixed(2)}</td></tr>
        <tr><td class="urdu">اختتامی بیلنس</td><td class="ltr">Rs. ${Number(reportData.summary?.closingBalance || 0).toFixed(2)}</td></tr>
        <tr><td class="urdu">کل لین دین</td><td class="right">${reportData.summary?.transactionCount || 0}</td></tr>
      </tbody>
    </table>
  `;

  // Source breakdown
  if (
    reportData.transactionsBySource &&
    Object.keys(reportData.transactionsBySource).length > 0
  ) {
    const sourceRows = Object.entries(reportData.transactionsBySource)
      .map(([source, data]: [string, any]) => {
        const net = data.inflows - data.outflows;
        return `
          <tr>
            <td>${source.charAt(0).toUpperCase() + source.slice(1)}</td>
            <td class="ltr">Rs. ${data.inflows.toFixed(2)}</td>
            <td class="ltr">Rs. ${data.outflows.toFixed(2)}</td>
            <td class="ltr">Rs. ${net.toFixed(2)}</td>
            <td class="right">${data.count}</td>
          </tr>
        `;
      })
      .join('');

    body += `
      <h3 class="urdu">ذریعہ کے مطابق تفصیل</h3>
      <table>
        <thead>
          <tr>
            <th class="urdu">ذریعہ</th>
            <th class="urdu">آمدنی</th>
            <th class="urdu">اخراجات</th>
            <th class="urdu">خالص</th>
            <th class="urdu">تعداد</th>
          </tr>
        </thead>
        <tbody>${sourceRows}</tbody>
      </table>
    `;
  }

  // Daily summaries
  if (reportData.dailySummaries && reportData.dailySummaries.length > 0) {
    const dailyRows = reportData.dailySummaries
      .map(
        (summary: any) => `
        <tr>
          <td class="right">${format(new Date(summary.date), 'PP')}</td>
          <td class="ltr">Rs. ${summary.openingBalance.toFixed(2)}</td>
          <td class="ltr">Rs. ${summary.totalInflows.toFixed(2)}</td>
          <td class="ltr">Rs. ${summary.totalOutflows.toFixed(2)}</td>
          <td class="ltr">Rs. ${summary.closingBalance.toFixed(2)}</td>
        </tr>
      `
      )
      .join('');

    body += `
      <h3 class="urdu">روزانہ خلاصہ</h3>
      <table>
        <thead>
          <tr>
            <th class="urdu">تاریخ</th>
            <th class="urdu">ابتدائی بیلنس</th>
            <th class="urdu">آمدنی</th>
            <th class="urdu">اخراجات</th>
            <th class="urdu">اختتامی بیلنس</th>
          </tr>
        </thead>
        <tbody>${dailyRows}</tbody>
      </table>
    `;
  }

  // Transaction details (if included)
  if (
    filters?.includeTransactionDetails &&
    reportData.transactions &&
    reportData.transactions.length > 0
  ) {
    const transactionRows = reportData.transactions
      .map(
        (transaction: any) => `
        <tr>
          <td class="right">${format(new Date(transaction.date), 'PP')}</td>
          <td>${transaction.transactionType === 'inflow' ? 'Inflow' : 'Outflow'}</td>
          <td class="ltr">Rs. ${transaction.amount.toFixed(2)}</td>
          <td>${transaction.description}</td>
          <td>${transaction.source.charAt(0).toUpperCase() + transaction.source.slice(1)}</td>
          <td>${transaction.customer?.name || '-'}</td>
          <td>${transaction.referenceId || '-'}</td>
        </tr>
      `
      )
      .join('');

    body += `
      <h3 class="urdu">لین دین کی تفصیلات</h3>
      <table>
        <thead>
          <tr>
            <th class="urdu">تاریخ</th>
            <th class="urdu">قسم</th>
            <th class="urdu">رقم</th>
            <th class="urdu">تفصیل</th>
            <th class="urdu">ذریعہ</th>
            <th class="urdu">کسٹمر</th>
            <th class="urdu">حوالہ</th>
          </tr>
        </thead>
        <tbody>${transactionRows}</tbody>
      </table>
    `;
  }

  return wrapHtml('نقدی کتاب رپورٹ', body);
};
