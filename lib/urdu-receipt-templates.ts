// Urdu Receipt HTML Templates
import { EntryReceiptWithDetails } from '@/types/entry';

interface ClearanceReceiptData {
  clearanceNo: string;
  clearanceDate: Date | string;
  customer: {
    name: string;
    phone?: string;
    address?: string;
  };
  carNo: string;
  totalAmount: number;
  description?: string;
  clearedItems: any[];
}

// Helper function to format date to Urdu
function formatDateUrdu(date: Date | string): string {
  const d = new Date(date);
  const day = d.getDate();
  const month = d.getMonth() + 1;
  const year = d.getFullYear();
  return `${day}-${month < 10 ? '0' + month : month}-${year}`;
}

// Helper function to convert numbers to Urdu numerals
function toUrduNumber(num: number | string): string {
  const urduNumerals = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
  return String(num).replace(/\d/g, (d) => urduNumerals[parseInt(d)]);
}

// Helper to get room and rack information
function getRoomRackInfo(items: any[]): string {
  const rooms = new Set<string>();
  const racks: string[] = [];

  items.forEach((item) => {
    const entryItem = item.entryItem || item;
    if (entryItem.room?.name) {
      rooms.add(entryItem.room.name);
    }
    if (entryItem.boxNo) {
      racks.push(entryItem.boxNo);
    }
  });

  return Array.from(rooms).join('، ') || '-';
}

function getRackNumbers(items: any[]): string {
  const racks: string[] = [];
  items.forEach((item) => {
    const entryItem = item.entryItem || item;
    if (entryItem.boxNo) {
      racks.push(entryItem.boxNo);
    }
  });
  return racks.join('، ') || '-';
}

function getMarkaInfo(items: any[]): string {
  const markas: string[] = [];
  items.forEach((item) => {
    const entryItem = item.entryItem || item;
    if (entryItem.marka) {
      markas.push(entryItem.marka);
    }
  });
  return markas.join('، ') || '-';
}

function getVarietyInfo(items: any[]): string {
  const varieties = new Set<string>();
  items.forEach((item) => {
    const entryItem = item.entryItem || item;
    if (entryItem.productSubType?.name) {
      varieties.add(entryItem.productSubType.name);
    }
  });
  return Array.from(varieties).join(' + ') || '-';
}

function getProductDescription(items: any[]): string {
  const productCounts: { [key: string]: number } = {};

  items.forEach((item) => {
    const entryItem = item.entryItem || item;
    const productName = entryItem.productType?.name || 'Unknown';
    const packType = entryItem.packType?.name || '';
    const key = `${packType} ${productName}`;

    const quantity = item.clearQuantity || item.quantity || 0;
    productCounts[key] = (productCounts[key] || 0) + quantity;
  });

  // Convert to Urdu description
  const descriptions = Object.entries(productCounts).map(([product, count]) => {
    return `${product}`;
  });

  return descriptions.join('، ') || '-';
}

// Generate Entry Receipt HTML
export function generateEntryReceiptHTML(
  entry: EntryReceiptWithDetails
): string {
  const totalQuantity = entry.items.reduce(
    (sum, item) => sum + item.quantity,
    0
  );

  // Generate items table rows
  const itemsTableRows = entry.items
    .map((item, index) => {
      const productName = item.productType?.name || '-';
      const subType = item.productSubType?.name || '';
      const packType = item.packType?.name || '-';
      const room = item.room?.name || '-';
      const boxNo = item.boxNo || '-';
      const marka = item.marka || '-';
      const quantity = item.quantity;
      const unitPrice = item.unitPrice.toFixed(2);
      const totalPrice = item.totalPrice.toFixed(2);

      let row = `
          <tr>
            <td style="text-align: center; font-family: Arial;">${index + 1}</td>
            <td>
              <strong>${productName}</strong>
              ${subType ? `<br/><span style="font-size: 0.85em; color: #666;">${subType}</span>` : ''}
            </td>
            <td>${packType}</td>
            <td>${room}<br/><span style="font-size: 0.85em; color: #666;">باکس: ${boxNo}</span></td>
            <td style="font-size: 0.9em;">${marka}</td>
            <td style="text-align: center; font-family: Arial;">${quantity}</td>
            <td style="text-align: left; direction: ltr; font-family: Arial;">Rs. ${unitPrice}</td>
            <td style="text-align: left; direction: ltr; font-family: Arial; font-weight: bold;">Rs. ${totalPrice}</td>
          </tr>`;

      // Add KJ row if applicable
      if (item.hasKhaliJali && item.kjQuantity) {
        const kjTotal = item.kjTotal?.toFixed(2) || '0.00';
        row += `
          <tr style="background-color: #f9f9f9;">
            <td></td>
            <td colspan="4" style="font-style: italic; font-size: 0.9em;">خالی جالی (Empty Crate)</td>
            <td style="text-align: center; font-family: Arial;">${item.kjQuantity}</td>
            <td style="text-align: left; direction: ltr; font-family: Arial;">Rs. ${item.kjUnitPrice?.toFixed(2)}</td>
            <td style="text-align: left; direction: ltr; font-family: Arial; font-weight: bold;">Rs. ${kjTotal}</td>
          </tr>`;
      }

      // Add item total if has KJ
      if (item.hasKhaliJali) {
        row += `
          <tr>
            <td colspan="7" style="text-align: left; font-weight: bold; background-color: #f0f0f0;">کل آئٹم:</td>
            <td style="text-align: left; direction: ltr; font-family: Arial; font-weight: bold; background-color: #f0f0f0;">Rs. ${item.grandTotal.toFixed(2)}</td>
          </tr>`;
      }

      return row;
    })
    .join('');

  return `<!DOCTYPE html>
<html lang="ur" dir="rtl">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Entry Receipt - ${entry.receiptNo}</title>
    <style>
      @import url("https://fonts.googleapis.com/css2?family=Noto+Naskh+Arabic:wght@400;700&display=swap");

      body {
        font-family: "Noto Naskh Arabic", -apple-system, BlinkMacSystemFont,
          "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
        margin: 0;
        padding: 0;
        box-sizing: border-box;
        width: 21cm;
        padding: 1cm;
        text-align: right;
      }

      .container {
        width: 100%;
        max-width: 800px;
        margin: 0 auto;
      }

      .header {
        display: flex;
        justify-content: space-between;
        border-bottom: 2px solid #eee;
        padding-bottom: 10px;
        margin-bottom: 15px;
      }

      .header-col {
        padding: 0 10px;
      }

      .col-left {
        width: 25%;
        text-align: center;
      }
      .col-left .logo-main {
        font-size: 2.5em;
        font-weight: bold;
        text-align: center;
        border: 2px solid #333;
        width: 70px;
        margin: 0 auto;
      }
      .col-left .logo-sub {
        font-size: 0.8em;
        text-align: center;
        margin-bottom: 10px;
      }
      .col-left p {
        margin: 2px 0;
        font-size: 0.9em;
        text-align: left;
        direction: ltr;
      }

      .col-center {
        width: 50%;
        text-align: center;
      }
      .col-center h1 {
        font-size: 2em;
        margin: 0 0 5px 0;
      }
      .col-center .en-title {
        font-family: Arial, sans-serif;
        font-size: 1.5em;
        font-weight: bold;
      }

      .col-center p {
        margin: 2px 0;
        font-size: 0.9em;
      }
      .col-center .address-en {
        font-family: Arial, sans-serif;
        font-size: 0.8em;
      }
      .col-center .sub-addresses {
        display: flex;
        justify-content: space-between;
        font-size: 0.9em;
        margin-top: 5px;
      }

      .col-right {
        width: 25%;
        text-align: right;
      }
      .col-right h2 {
        font-size: 1.2em;
        font-weight: bold;
        margin: 0;
      }
      .col-right p {
        margin: 2px 0;
        font-size: 0.9em;
      }
      .col-right .receipt-book-en {
        font-family: Arial, sans-serif;
        font-size: 0.8em;
        text-align: right;
      }
      .col-right .phone-num {
        font-family: Arial, sans-serif;
        font-size: 1.1em;
        font-weight: bold;
        direction: ltr;
        text-align: right;
      }

      .sub-header {
        display: flex;
        justify-content: space-between;
        margin-bottom: 15px;
        padding: 8px;
        background-color: #f5f5f5;
        border-radius: 4px;
      }

      .sub-header .info-row {
        display: flex;
        gap: 20px;
        font-size: 0.95em;
      }

      .sub-header .info-item {
        display: flex;
        gap: 5px;
      }

      .sub-header .label {
        font-weight: bold;
      }

      .sub-header .value {
        font-family: Arial, sans-serif;
        direction: ltr;
      }

      .items-table {
        width: 100%;
        border-collapse: collapse;
        margin: 15px 0;
        font-size: 0.9em;
      }

      .items-table th,
      .items-table td {
        border: 1px solid #888;
        padding: 6px 8px;
      }

      .items-table th {
        background-color: #e0e0e0;
        font-weight: bold;
        text-align: right;
        font-size: 0.95em;
      }

      .items-table td {
        text-align: right;
      }

      .total-section {
        margin-top: 20px;
        padding: 15px;
        background-color: #f5f5f5;
        border: 2px solid #333;
        border-radius: 4px;
      }

      .total-row {
        display: flex;
        justify-content: space-between;
        font-size: 1.3em;
        font-weight: bold;
      }

      .total-label {
        color: #333;
      }

      .total-value {
        font-family: Arial, sans-serif;
        direction: ltr;
        color: #000;
      }

      .signature-section {
        margin-top: 30px;
        display: flex;
        justify-content: space-between;
        padding: 20px 0;
      }

      .signature-box {
        text-align: center;
        width: 45%;
      }

      .signature-line {
        border-top: 2px solid #333;
        margin-top: 50px;
        padding-top: 5px;
        font-family: Arial, sans-serif;
      }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <div class="header-col col-left">
          <div class="logo-main">A.W.</div>
          <div class="logo-sub">Cold Storage</div>
          <p>0300-7722023</p>
          <p>0344-7278112</p>
          <p>0300-9803096</p>
          <p>0336-4465765</p>
        </div>
        <div class="header-col col-center">
          <h1 class="en-title">Ahmad Waqas Cold Storage</h1>
          <p class="address-en">
            Near Adda Sinchanwala, Burewala Road, Vehari.
          </p>
          <h1>احمد وقاص کولڈ سٹوریج</h1>
          <div class="sub-addresses">
            <span>دکان نمبر 20 غلہ منڈی</span>
            <span>نیو سبزی منڈی بوریوالا روڈ وہاڑی</span>
          </div>
        </div>
        <div class="header-col col-right">
          <p class="receipt-book-en">Entry Receipt</p>
          <h2 style="margin-top: 10px">ستور فون نمبر</h2>
          <p class="phone-num">067-3780228</p>
        </div>
      </div>

      <div class="sub-header">
        <div class="info-row">
          <div class="info-item">
            <span class="label">رسید نمبر:</span>
            <span class="value">${entry.receiptNo}</span>
          </div>
          <div class="info-item">
            <span class="label">تاریخ:</span>
            <span class="value">${formatDateUrdu(entry.entryDate)}</span>
          </div>
        </div>
        <div class="info-row">
          <div class="info-item">
            <span class="label">گاہک:</span>
            <span class="value">${entry.customer.name}</span>
          </div>
          <div class="info-item">
            <span class="label">گاڑی نمبر:</span>
            <span class="value">${entry.carNo}</span>
          </div>
        </div>
      </div>

      <table class="items-table">
        <thead>
          <tr>
            <th style="width: 30px; text-align: center;">#</th>
            <th>مصنوعات</th>
            <th>پیکنگ</th>
            <th>کمرہ / باکس</th>
            <th>مارکہ</th>
            <th style="width: 60px; text-align: center;">تعداد</th>
            <th style="width: 80px;">قیمت</th>
            <th style="width: 100px;">کل قیمت</th>
          </tr>
        </thead>
        <tbody>
${itemsTableRows}
        </tbody>
      </table>

      <div class="total-section">
        <div class="total-row">
          <span class="total-label">کل رقم:</span>
          <span class="total-value">Rs. ${entry.totalAmount.toFixed(2)}</span>
        </div>
      </div>

      <div class="signature-section">
        <div class="signature-box">
          <div>گاہک کے دستخط</div>
          <div class="signature-line">Customer Signature</div>
        </div>
        <div class="signature-box">
          <div>مجاز دستخط</div>
          <div class="signature-line">Authorized Signature</div>
        </div>
      </div>
    </div>
  </body>
</html>`;
}

// Generate Clearance Receipt HTML
export function generateClearanceReceiptHTML(
  clearance: ClearanceReceiptData
): string {
  // Generate items table rows
  const itemsTableRows = clearance.clearedItems
    .map((item, index) => {
      const entryItem = item.entryItem;
      const productName = entryItem?.productType?.name || '-';
      const subType = entryItem?.productSubType?.name || '';
      const packType = entryItem?.packType?.name || '-';
      const room = entryItem?.room?.name || '-';
      const boxNo = entryItem?.boxNo || '-';
      const marka = entryItem?.marka || '-';
      const quantity = item.clearQuantity || 0;
      const unitPrice = entryItem?.unitPrice?.toFixed(2) || '0.00';
      const totalPrice = (quantity * (entryItem?.unitPrice || 0)).toFixed(2);
      const entryReceiptNo = entryItem?.entryReceipt?.receiptNo || '-';

      let row = `
          <tr>
            <td style="text-align: center; font-family: Arial;">${index + 1}</td>
            <td>
              <strong>${productName}</strong>
              ${subType ? `<br/><span style="font-size: 0.85em; color: #666;">${subType}</span>` : ''}
            </td>
            <td>${packType}</td>
            <td>${room}<br/><span style="font-size: 0.85em; color: #666;">باکس: ${boxNo}</span></td>
            <td style="font-size: 0.9em;">${marka}</td>
            <td style="font-size: 0.85em; font-family: Arial;">${entryReceiptNo}</td>
            <td style="text-align: center; font-family: Arial;">${quantity}</td>
            <td style="text-align: left; direction: ltr; font-family: Arial;">Rs. ${unitPrice}</td>
            <td style="text-align: left; direction: ltr; font-family: Arial; font-weight: bold;">Rs. ${totalPrice}</td>
          </tr>`;

      // Add KJ row if applicable
      if (item.clearKjQuantity && entryItem?.kjUnitPrice) {
        const kjTotal = (item.clearKjQuantity * entryItem.kjUnitPrice).toFixed(
          2
        );
        row += `
          <tr style="background-color: #f9f9f9;">
            <td></td>
            <td colspan="5" style="font-style: italic; font-size: 0.9em;">خالی جالی (Empty Crate)</td>
            <td style="text-align: center; font-family: Arial;">${item.clearKjQuantity}</td>
            <td style="text-align: left; direction: ltr; font-family: Arial;">Rs. ${entryItem.kjUnitPrice.toFixed(2)}</td>
            <td style="text-align: left; direction: ltr; font-family: Arial; font-weight: bold;">Rs. ${kjTotal}</td>
          </tr>`;
      }

      // Add item total if has KJ
      if (item.clearKjQuantity && item.totalAmount) {
        row += `
          <tr>
            <td colspan="8" style="text-align: left; font-weight: bold; background-color: #f0f0f0;">کل آئٹم:</td>
            <td style="text-align: left; direction: ltr; font-family: Arial; font-weight: bold; background-color: #f0f0f0;">Rs. ${item.totalAmount.toFixed(2)}</td>
          </tr>`;
      }

      return row;
    })
    .join('');

  return `<!DOCTYPE html>
<html lang="ur" dir="rtl">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Clearance Receipt - ${clearance.clearanceNo}</title>
    <style>
      @font-face {
        font-family: 'Noto Nastaliq Urdu';
        src: url('/Noto_Nastaliq_Urdu/static/NotoNastaliqUrdu-Regular.ttf') format('truetype');
        font-weight: 400; /* 400 is 'normal' or 'regular' */
        font-style: normal;
        font-display: swap;
      }

      body {
        font-family: "Noto Naskh Arabic", -apple-system, BlinkMacSystemFont,
          "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
        margin: 0;
        padding: 0;
        box-sizing: border-box;
        width: 21cm;
        padding: 1cm;
        text-align: right;
      }

      .container {
        width: 100%;
        max-width: 800px;
        margin: 0 auto;
      }

      .header {
        display: flex;
        justify-content: space-between;
        border-bottom: 2px solid #eee;
        padding-bottom: 10px;
        margin-bottom: 15px;
      }

      .header-col {
        padding: 0 10px;
      }

      .col-left {
        width: 25%;
        text-align: center;
      }
      .col-left .logo-main {
        font-size: 2.5em;
        font-weight: bold;
        text-align: center;
        border: 2px solid #333;
        width: 70px;
        margin: 0 auto;
      }
      .col-left .logo-sub {
        font-size: 0.8em;
        text-align: center;
        margin-bottom: 10px;
      }
      .col-left p {
        margin: 2px 0;
        font-size: 0.9em;
        text-align: left;
        direction: ltr;
      }

      .col-center {
        width: 50%;
        text-align: center;
      }
      .col-center h1 {
        font-size: 2em;
        margin: 0 0 5px 0;
      }
      .col-center .en-title {
        font-family: Arial, sans-serif;
        font-size: 1.5em;
        font-weight: bold;
      }

      .col-center p {
        margin: 2px 0;
        font-size: 0.9em;
      }
      .col-center .address-en {
        font-family: Arial, sans-serif;
        font-size: 0.8em;
      }
      .col-center .sub-addresses {
        display: flex;
        justify-content: space-between;
        font-size: 0.9em;
        margin-top: 5px;
      }

      .col-right {
        width: 25%;
        text-align: right;
      }
      .col-right h2 {
        font-size: 1.2em;
        font-weight: bold;
        margin: 0;
      }
      .col-right p {
        margin: 2px 0;
        font-size: 0.9em;
      }
      .col-right .receipt-book-en {
        font-family: Arial, sans-serif;
        font-size: 0.8em;
        text-align: right;
      }
      .col-right .phone-num {
        font-family: Arial, sans-serif;
        font-size: 1.1em;
        font-weight: bold;
        direction: ltr;
        text-align: right;
      }

      .sub-header {
        display: flex;
        justify-content: space-between;
        margin-bottom: 15px;
        padding: 8px;
        background-color: #f5f5f5;
        border-radius: 4px;
      }

      .sub-header .info-row {
        display: flex;
        gap: 20px;
        font-size: 0.95em;
      }

      .sub-header .info-item {
        display: flex;
        gap: 5px;
      }

      .sub-header .label {
        font-weight: bold;
      }

      .sub-header .value {
        font-family: Arial, sans-serif;
        direction: ltr;
      }

      .items-table {
        width: 100%;
        border-collapse: collapse;
        margin: 15px 0;
        font-size: 0.9em;
      }

      .items-table th,
      .items-table td {
        border: 1px solid #888;
        padding: 6px 8px;
      }

      .items-table th {
        background-color: #e0e0e0;
        font-weight: bold;
        text-align: right;
        font-size: 0.95em;
      }

      .items-table td {
        text-align: right;
      }

      .total-section {
        margin-top: 20px;
        padding: 15px;
        background-color: #f5f5f5;
        border: 2px solid #333;
        border-radius: 4px;
      }

      .total-row {
        display: flex;
        justify-content: space-between;
        font-size: 1.3em;
        font-weight: bold;
      }

      .total-label {
        color: #333;
      }

      .total-value {
        font-family: Arial, sans-serif;
        direction: ltr;
        color: #000;
      }

      .signature-section {
        margin-top: 30px;
        display: flex;
        justify-content: space-between;
        padding: 20px 0;
      }

      .signature-box {
        text-align: center;
        width: 45%;
      }

      .signature-line {
        border-top: 2px solid #333;
        margin-top: 50px;
        padding-top: 5px;
        font-family: Arial, sans-serif;
      }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <div class="header-col col-left">
          <div class="logo-main">A.W.</div>
          <div class="logo-sub">Cold Storage</div>
          <p>0300-7722023</p>
          <p>0344-7278112</p>
          <p>0300-9803096</p>
          <p>0336-4465765</p>
        </div>
        <div class="header-col col-center">
          <h1 class="en-title">Ahmad Waqas Cold Storage</h1>
          <p class="address-en">
            Near Adda Sinchanwala, Burewala Road, Vehari.
          </p>
          <h1>احمد وقاص کولڈ سٹوریج</h1>
          <div class="sub-addresses">
            <span>دکان نمبر 20 غلہ منڈی</span>
            <span>نیو سبزی منڈی بوریوالا روڈ وہاڑی</span>
          </div>
        </div>
        <div class="header-col col-right">
          <p class="receipt-book-en">Clearance Receipt</p>
          <h2 style="margin-top: 10px">ستور فون نمبر</h2>
          <p class="phone-num">067-3780228</p>
        </div>
      </div>

      <div class="sub-header">
        <div class="info-row">
          <div class="info-item">
            <span class="label">رسید نمبر:</span>
            <span class="value">${clearance.clearanceNo}</span>
          </div>
          <div class="info-item">
            <span class="label">تاریخ:</span>
            <span class="value">${formatDateUrdu(clearance.clearanceDate)}</span>
          </div>
        </div>
        <div class="info-row">
          <div class="info-item">
            <span class="label">گاہک:</span>
            <span class="value">${clearance.customer.name}</span>
          </div>
          <div class="info-item">
            <span class="label">گاڑی نمبر:</span>
            <span class="value">${clearance.carNo}</span>
          </div>
        </div>
      </div>

      <table class="items-table">
        <thead>
          <tr>
            <th style="width: 30px; text-align: center;">#</th>
            <th>مصنوعات</th>
            <th>پیکنگ</th>
            <th>کمرہ / باکس</th>
            <th>مارکہ</th>
            <th style="width: 70px;">انٹری رسید</th>
            <th style="width: 60px; text-align: center;">تعداد</th>
            <th style="width: 80px;">قیمت</th>
            <th style="width: 100px;">کل قیمت</th>
          </tr>
        </thead>
        <tbody>
${itemsTableRows}
        </tbody>
      </table>

      <div class="total-section">
        <div class="total-row">
          <span class="total-label">کل رقم:</span>
          <span class="total-value">Rs. ${clearance.totalAmount.toFixed(2)}</span>
        </div>
      </div>

      <div class="signature-section">
        <div class="signature-box">
          <div>گاہک کے دستخط</div>
          <div class="signature-line">Customer Signature</div>
        </div>
        <div class="signature-box">
          <div>مجاز دستخط</div>
          <div class="signature-line">Authorized Signature</div>
        </div>
      </div>
    </div>
  </body>
</html>`;
}
