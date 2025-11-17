import pdfMake from 'pdfmake/build/pdfmake';
import { format } from 'date-fns';
import urduFontBase64 from '@/Noto_Nastaliq_Urdu/urdu';
import type {
  TDocumentDefinitions,
  Content,
  ContentText,
} from 'pdfmake/interfaces';

// Configure pdfMake VFS with fonts - only on client side
if (typeof window !== 'undefined') {
  const vfs: Record<string, string> = {
    'NotoNastaliqUrdu-Regular.ttf': urduFontBase64,
  };
  (pdfMake as any).vfs = vfs;
  (pdfMake as any).fonts = {
    NotoNastaliqUrdu: {
      normal: 'NotoNastaliqUrdu-Regular.ttf',
      bold: 'NotoNastaliqUrdu-Regular.ttf',
    },
    Roboto: {
      normal: 'NotoNastaliqUrdu-Regular.ttf', // Use Urdu font as fallback
      bold: 'NotoNastaliqUrdu-Regular.ttf',
    },
  };
}

// Urdu text mappings
const urduText = {
  header: 'احمد وقاص کولڈ اسٹوریج',
  customerReport: 'کسٹمر رپورٹ',
  overallReport: 'مجموعی رپورٹ',
  expenseReport: 'اخراجات رپورٹ',
  auditReport: 'آڈٹ رپورٹ',
  stockReport: 'اسٹاک رپورٹ',
  customerName: 'کسٹمر کا نام',
  phone: 'فون نمبر',
  address: 'پتہ',
  date: 'تاریخ',
  period: 'مدت',
  receiptNo: 'رسید نمبر',
  productType: 'مصنوعات کی قسم',
  quantity: 'مقدار',
  amount: 'رقم',
  totalAmount: 'کل رقم',
  totalQuantity: 'کل مقدار',
  balance: 'بیلنس',
  entryAmount: 'انٹری رقم',
  clearanceAmount: 'کلیئرنس رقم',
  expenses: 'اخراجات',
  profit: 'منافع',
  loss: 'نقصان',
  inventory: 'انوینٹری',
  room: 'کمرہ',
  category: 'قسم',
  description: 'تفصیل',
  entrySummary: 'انٹری کا خلاصہ',
  clearanceSummary: 'کلیئرنس کا خلاصہ',
  receipts: 'رسیدیں',
  currentBalance: 'موجودہ بیلنس',
  receivable: 'وصول کرنے کے لیے',
  payable: 'ادا کرنے کے لیے',
  totalRevenue: 'کل آمدنی',
  totalExpenses: 'کل اخراجات',
  netProfitLoss: 'خالص منافع/نقصان',
  profitMargin: 'منافع کی شرح',
  totalInventoryValue: 'کل انوینٹری کی قیمت',
  totalItems: 'کل اشیاء',
  totalOutstanding: 'کل بقایا',
  roomUtilization: 'کمرے کا استعمال',
  expenseDetails: 'اخراجات کی تفصیل',
  entryByProductType: 'مصنوعات کی قسم سے انٹری',
  clearanceByProductType: 'مصنوعات کی قسم سے کلیئرنس',
  customerWiseSummary: 'کسٹمر کے لحاظ سے',
  summaryByProductType: 'مصنوعات کی قسم سے',
  summaryByRoom: 'کمرے کے لحاظ سے',
  inventoryDetails: 'تفصیلات',
};

// Helper to create bilingual text
const bilingualText = (english: string, urdu: string) => {
  return [
    { text: english, font: 'Roboto' },
    { text: ' / ', font: 'Roboto' },
    { text: urdu, font: 'NotoNastaliqUrdu' },
  ];
};

export const generateCustomerReportPDF = (reportData: any, filters: any) => {
  const content: Content[] = [
    // Header
    {
      text: 'Ahmad Waqas Cold Storage',
      style: 'header',
      alignment: 'center',
      font: 'Roboto',
    },
    {
      text: urduText.header,
      style: 'urduHeader',
      alignment: 'center',
      font: 'NotoNastaliqUrdu',
    },
    {
      text: 'Customer Report',
      style: 'subheader',
      alignment: 'center',
      font: 'Roboto',
    },
    {
      text: urduText.customerReport,
      style: 'urduSubheader',
      alignment: 'center',
      font: 'NotoNastaliqUrdu',
    },
    { text: '\n' },

    // Customer Info
    {
      columns: [
        {
          width: '*',
          stack: [
            {
              text: [
                ...bilingualText('Customer', urduText.customerName),
                { text: `: ${reportData.customer.name}`, font: 'Roboto' },
              ],
              font: 'Roboto',
            },
            ...(reportData.customer.phone
              ? [
                  {
                    text: [
                      ...bilingualText('Phone', urduText.phone),
                      {
                        text: `: ${reportData.customer.phone}`,
                        font: 'Roboto',
                      },
                    ],
                    font: 'Roboto',
                  } as ContentText,
                ]
              : []),
            ...(reportData.customer.address
              ? [
                  {
                    text: [
                      ...bilingualText('Address', urduText.address),
                      {
                        text: `: ${reportData.customer.address}`,
                        font: 'Roboto',
                      },
                    ],
                    font: 'Roboto',
                  } as ContentText,
                ]
              : []),
            {
              text: `Report Type: ${filters.reportType} - ${filters.period}`,
              font: 'Roboto',
            },
            ...(filters.date
              ? [
                  {
                    text: [
                      ...bilingualText('Date', urduText.date),
                      {
                        text: `: ${format(new Date(filters.date), 'PPP')}`,
                        font: 'Roboto',
                      },
                    ],
                    font: 'Roboto',
                  } as ContentText,
                ]
              : []),
          ],
        },
      ],
    },
    { text: '\n' },

    // Summary Table
    {
      table: {
        widths: ['*', 'auto'],
        body: [
          [
            {
              text: [
                ...bilingualText(
                  'Total Entry Amount',
                  `${urduText.totalAmount} ${urduText.entryAmount}`
                ),
              ],
              font: 'Roboto',
            },
            {
              text: `Rs. ${(reportData.entryData?.totalAmount || 0).toFixed(2)}`,
              font: 'Roboto',
              alignment: 'right',
            },
          ],
          [
            {
              text: [
                ...bilingualText(
                  'Total Clearance Amount',
                  `${urduText.totalAmount} ${urduText.clearanceAmount}`
                ),
              ],
              font: 'Roboto',
            },
            {
              text: `Rs. ${(reportData.clearanceData?.totalAmount || 0).toFixed(2)}`,
              font: 'Roboto',
              alignment: 'right',
            },
          ],
          [
            {
              text: [
                ...bilingualText('Current Balance', urduText.currentBalance),
              ],
              font: 'Roboto',
            },
            {
              text: `Rs. ${(reportData.balance || 0).toFixed(2)}`,
              font: 'Roboto',
              alignment: 'right',
            },
          ],
        ],
      },
      layout: 'lightHorizontalLines',
    },
    { text: '\n' },
  ];

  // Entry Receipts
  if (reportData.entries?.length > 0) {
    content.push(
      {
        text: [
          ...bilingualText(
            'Entry Receipts',
            `${urduText.entryAmount} ${urduText.receipts}`
          ),
        ],
        style: 'tableHeader',
        font: 'Roboto',
      },
      {
        table: {
          headerRows: 1,
          widths: ['auto', 'auto', '*', '*', 'auto', 'auto'],
          body: [
            [
              { text: 'Date', bold: true, font: 'Roboto' },
              { text: 'Receipt No', bold: true, font: 'Roboto' },
              { text: 'Product Type', bold: true, font: 'Roboto' },
              { text: 'Sub Type', bold: true, font: 'Roboto' },
              { text: 'Qty', bold: true, font: 'Roboto' },
              { text: 'Amount', bold: true, font: 'Roboto' },
            ],
            ...reportData.entries.map((entry: any) => [
              { text: format(new Date(entry.date), 'PP'), font: 'Roboto' },
              { text: entry.receiptNo || '-', font: 'Roboto' },
              { text: entry.productType?.name || '-', font: 'Roboto' },
              { text: entry.productSubType?.name || '-', font: 'Roboto' },
              { text: entry.quantity?.toString() || '0', font: 'Roboto' },
              {
                text: `Rs. ${(entry.totalAmount || 0).toFixed(2)}`,
                font: 'Roboto',
              },
            ]),
          ],
        },
        layout: 'lightHorizontalLines',
      },
      { text: '\n' }
    );
  }

  // Clearance Receipts
  if (reportData.clearanceData?.receipts?.length > 0) {
    content.push(
      {
        text: [
          ...bilingualText(
            'Clearance Receipts',
            `${urduText.clearanceAmount} ${urduText.receipts}`
          ),
        ],
        style: 'tableHeader',
        font: 'Roboto',
      },
      {
        table: {
          headerRows: 1,
          widths: ['auto', 'auto', '*', '*', 'auto', 'auto'],
          body: [
            [
              { text: 'Date', bold: true, font: 'Roboto' },
              { text: 'Receipt No', bold: true, font: 'Roboto' },
              { text: 'Product Type', bold: true, font: 'Roboto' },
              { text: 'Sub Type', bold: true, font: 'Roboto' },
              { text: 'Qty', bold: true, font: 'Roboto' },
              { text: 'Amount', bold: true, font: 'Roboto' },
            ],
            ...reportData.clearanceData.receipts.map((clearance: any) => [
              {
                text: reportData.clearanceDate
                  ? format(new Date(reportData.clearanceDate), 'PP')
                  : '-',
                font: 'Roboto',
              },
              { text: clearance.receiptNo || '-', font: 'Roboto' },
              { text: clearance.productType?.name || '-', font: 'Roboto' },
              { text: clearance.productSubType?.name || '-', font: 'Roboto' },
              { text: clearance.quantity?.toString() || '0', font: 'Roboto' },
              {
                text: `Rs. ${(clearance.totalAmount || 0).toFixed(2)}`,
                font: 'Roboto',
              },
            ]),
          ],
        },
        layout: 'lightHorizontalLines',
      }
    );
  }

  const docDefinition: TDocumentDefinitions = {
    content,
    styles: {
      header: {
        fontSize: 20,
        bold: true,
        margin: [0, 0, 0, 5] as [number, number, number, number],
      },
      urduHeader: {
        fontSize: 14,
        margin: [0, 0, 0, 10] as [number, number, number, number],
      },
      subheader: {
        fontSize: 16,
        bold: true,
        margin: [0, 10, 0, 5] as [number, number, number, number],
      },
      urduSubheader: {
        fontSize: 12,
        margin: [0, 0, 0, 10] as [number, number, number, number],
      },
      tableHeader: {
        bold: true,
        fontSize: 11,
        margin: [0, 10, 0, 5] as [number, number, number, number],
      },
    },
    defaultStyle: {
      font: 'Roboto',
    },
    pageMargins: [40, 60, 40, 60] as [number, number, number, number],
    footer: (currentPage: number, pageCount: number) => {
      return {
        text: `Page ${currentPage} of ${pageCount} | Generated: ${format(new Date(), 'PPP pp')}`,
        alignment: 'center',
        fontSize: 8,
        margin: [0, 10, 0, 0] as [number, number, number, number],
        font: 'Roboto',
      };
    },
  };

  return pdfMake.createPdf(docDefinition);
};

export const generateAuditReportPDF = (reportData: any) => {
  const content: Content[] = [
    {
      text: 'Ahmad Waqas Cold Storage',
      style: 'header',
      alignment: 'center',
      font: 'Roboto',
    },
    {
      text: urduText.header,
      style: 'urduHeader',
      alignment: 'center',
      font: 'NotoNastaliqUrdu',
    },
    {
      text: 'Audit Report',
      style: 'subheader',
      alignment: 'center',
      font: 'Roboto',
    },
    {
      text: urduText.auditReport,
      style: 'urduSubheader',
      alignment: 'center',
      font: 'NotoNastaliqUrdu',
    },
    { text: '\n' },
    { text: `Period: ${reportData.period}`, font: 'Roboto' },
    ...(reportData.date
      ? [
          {
            text: [
              ...bilingualText('Date', urduText.date),
              {
                text: `: ${format(new Date(reportData.date), 'PPP')}`,
                font: 'Roboto',
              },
            ],
            font: 'Roboto',
          } as ContentText,
        ]
      : []),
    { text: '\n' },

    // Financial Summary
    { text: 'Financial Overview', style: 'tableHeader', font: 'Roboto' },
    {
      table: {
        widths: ['*', 'auto'],
        body: [
          [
            { text: 'Total Revenue', font: 'Roboto' },
            {
              text: `Rs. ${(reportData.financial?.totalRevenue || 0).toFixed(2)}`,
              font: 'Roboto',
              alignment: 'right',
            },
          ],
          [
            { text: 'Total Expenses', font: 'Roboto' },
            {
              text: `Rs. ${(reportData.financial?.totalExpenses || 0).toFixed(2)}`,
              font: 'Roboto',
              alignment: 'right',
            },
          ],
          [
            { text: 'Net Profit/Loss', font: 'Roboto' },
            {
              text: `Rs. ${(reportData.financial?.profitLoss || 0).toFixed(2)}`,
              font: 'Roboto',
              alignment: 'right',
            },
          ],
          [
            { text: 'Profit Margin', font: 'Roboto' },
            {
              text: `${(reportData.financial?.profitMargin || 0).toFixed(2)}%`,
              font: 'Roboto',
              alignment: 'right',
            },
          ],
        ],
      },
      layout: 'lightHorizontalLines',
    },
    { text: '\n' },

    // Inventory Summary
    { text: 'Inventory Summary', style: 'tableHeader', font: 'Roboto' },
    {
      table: {
        widths: ['*', 'auto'],
        body: [
          [
            { text: 'Total Inventory Value', font: 'Roboto' },
            {
              text: `Rs. ${(reportData.inventory?.totalValue || 0).toFixed(2)}`,
              font: 'Roboto',
              alignment: 'right',
            },
          ],
          [
            { text: 'Total Items', font: 'Roboto' },
            {
              text: (reportData.inventory?.totalItems || 0).toString(),
              font: 'Roboto',
              alignment: 'right',
            },
          ],
          [
            { text: 'Total Quantity', font: 'Roboto' },
            {
              text: (reportData.inventory?.totalQuantity || 0).toString(),
              font: 'Roboto',
              alignment: 'right',
            },
          ],
        ],
      },
      layout: 'lightHorizontalLines',
    },
    { text: '\n' },

    // Customer Balance
    { text: 'Customer Balance', style: 'tableHeader', font: 'Roboto' },
    {
      table: {
        widths: ['*', 'auto'],
        body: [
          [
            { text: 'Total Outstanding', font: 'Roboto' },
            {
              text: `Rs. ${(reportData.customerBalance?.totalOutstanding || 0).toFixed(2)}`,
              font: 'Roboto',
              alignment: 'right',
            },
          ],
          [
            { text: 'Total Receivable', font: 'Roboto' },
            {
              text: `Rs. ${(reportData.customerBalance?.totalReceivable || 0).toFixed(2)}`,
              font: 'Roboto',
              alignment: 'right',
            },
          ],
          [
            { text: 'Total Payable', font: 'Roboto' },
            {
              text: `Rs. ${(reportData.customerBalance?.totalPayable || 0).toFixed(2)}`,
              font: 'Roboto',
              alignment: 'right',
            },
          ],
        ],
      },
      layout: 'lightHorizontalLines',
    },
  ];

  // Room Utilization
  if (reportData.rooms && reportData.rooms.length > 0) {
    content.push(
      { text: '\n' },
      { text: 'Room Utilization', style: 'tableHeader', font: 'Roboto' },
      {
        table: {
          headerRows: 1,
          widths: ['*', 'auto', 'auto', 'auto'],
          body: [
            [
              { text: 'Room', bold: true, font: 'Roboto' },
              { text: 'Type', bold: true, font: 'Roboto' },
              { text: 'Utilization', bold: true, font: 'Roboto' },
              { text: 'Quantity', bold: true, font: 'Roboto' },
            ],
            ...reportData.rooms.map((room: any) => [
              { text: room.name || '-', font: 'Roboto' },
              { text: room.type || '-', font: 'Roboto' },
              {
                text: `${(room.utilizationPercentage || 0).toFixed(1)}%`,
                font: 'Roboto',
              },
              { text: (room.totalQuantity || 0).toString(), font: 'Roboto' },
            ]),
          ],
        },
        layout: 'lightHorizontalLines',
      }
    );
  }

  const docDefinition: TDocumentDefinitions = {
    content,
    styles: {
      header: {
        fontSize: 20,
        bold: true,
        margin: [0, 0, 0, 5] as [number, number, number, number],
      },
      urduHeader: {
        fontSize: 14,
        margin: [0, 0, 0, 10] as [number, number, number, number],
      },
      subheader: {
        fontSize: 16,
        bold: true,
        margin: [0, 10, 0, 5] as [number, number, number, number],
      },
      urduSubheader: {
        fontSize: 12,
        margin: [0, 0, 0, 10] as [number, number, number, number],
      },
      tableHeader: {
        bold: true,
        fontSize: 11,
        margin: [0, 10, 0, 5] as [number, number, number, number],
      },
    },
    defaultStyle: {
      font: 'Roboto',
    },
    pageMargins: [40, 60, 40, 60] as [number, number, number, number],
    footer: (currentPage: number, pageCount: number) => {
      return {
        text: `Page ${currentPage} of ${pageCount} | Generated: ${format(new Date(), 'PPP pp')}`,
        alignment: 'center',
        fontSize: 8,
        margin: [0, 10, 0, 0] as [number, number, number, number],
        font: 'Roboto',
      };
    },
  };

  return pdfMake.createPdf(docDefinition);
};

export const generateExpenseReportPDF = (reportData: any, filters: any) => {
  const content: Content[] = [
    {
      text: 'Ahmad Waqas Cold Storage',
      style: 'header',
      alignment: 'center',
      font: 'Roboto',
    },
    {
      text: urduText.header,
      style: 'urduHeader',
      alignment: 'center',
      font: 'NotoNastaliqUrdu',
    },
    {
      text: 'Expense Report',
      style: 'subheader',
      alignment: 'center',
      font: 'Roboto',
    },
    {
      text: urduText.expenseReport,
      style: 'urduSubheader',
      alignment: 'center',
      font: 'NotoNastaliqUrdu',
    },
    { text: '\n' },
    {
      text: [
        ...bilingualText('Period', urduText.period),
        { text: `: ${filters.period}`, font: 'Roboto' },
      ],
      font: 'Roboto',
    },
    ...(filters.date
      ? [
          {
            text: [
              ...bilingualText('Date', urduText.date),
              {
                text: `: ${format(new Date(filters.date), 'PPP')}`,
                font: 'Roboto',
              },
            ],
            font: 'Roboto',
          } as ContentText,
        ]
      : []),
    { text: '\n' },

    // Summary
    {
      table: {
        widths: ['*', 'auto'],
        body: [
          [
            { text: 'Total Expenses', font: 'Roboto' },
            {
              text: `Rs. ${(reportData.summary?.grandTotal || 0).toFixed(2)}`,
              font: 'Roboto',
              alignment: 'right',
            },
          ],
          [
            { text: 'Number of Expenses', font: 'Roboto' },
            {
              text: (reportData.summary?.count || 0).toString(),
              font: 'Roboto',
              alignment: 'right',
            },
          ],
        ],
      },
      layout: 'lightHorizontalLines',
    },
    { text: '\n' },

    // By Category
    { text: 'Expenses by Category', style: 'tableHeader', font: 'Roboto' },
    {
      table: {
        headerRows: 1,
        widths: ['*', 'auto', 'auto'],
        body: [
          [
            { text: 'Category', bold: true, font: 'Roboto' },
            { text: 'Amount', bold: true, font: 'Roboto' },
            { text: 'Percentage', bold: true, font: 'Roboto' },
          ],
          ...Object.entries(reportData.summary?.totalByCategory || {}).map(
            ([category, amount]) => {
              const percentage = (
                ((amount as number) / (reportData.summary?.grandTotal || 1)) *
                100
              ).toFixed(1);
              return [
                { text: category, font: 'Roboto' },
                {
                  text: `Rs. ${(amount as number).toFixed(2)}`,
                  font: 'Roboto',
                  alignment: 'right' as const,
                },
                {
                  text: `${percentage}%`,
                  font: 'Roboto',
                  alignment: 'right' as const,
                },
              ];
            }
          ),
        ],
      },
      layout: 'lightHorizontalLines',
    },
  ];

  // Expense Details
  if (reportData.expenses.length > 0) {
    content.push(
      { text: '\n' },
      { text: 'Expense Details', style: 'tableHeader', font: 'Roboto' },
      {
        table: {
          headerRows: 1,
          widths: ['auto', '*', 'auto', '*'],
          body: [
            [
              { text: 'Date', bold: true, font: 'Roboto' },
              { text: 'Category', bold: true, font: 'Roboto' },
              { text: 'Amount', bold: true, font: 'Roboto' },
              { text: 'Description', bold: true, font: 'Roboto' },
            ],
            ...reportData.expenses.map((expense: any) => [
              { text: format(new Date(expense.date), 'PP'), font: 'Roboto' },
              { text: expense.category?.name || '-', font: 'Roboto' },
              {
                text: `Rs. ${(expense.amount || 0).toFixed(2)}`,
                font: 'Roboto',
              },
              { text: expense.description || '-', font: 'Roboto' },
            ]),
          ],
        },
        layout: 'lightHorizontalLines',
      }
    );
  }

  const docDefinition: TDocumentDefinitions = {
    content,
    styles: {
      header: {
        fontSize: 20,
        bold: true,
        margin: [0, 0, 0, 5] as [number, number, number, number],
      },
      urduHeader: {
        fontSize: 14,
        margin: [0, 0, 0, 10] as [number, number, number, number],
      },
      subheader: {
        fontSize: 16,
        bold: true,
        margin: [0, 10, 0, 5] as [number, number, number, number],
      },
      urduSubheader: {
        fontSize: 12,
        margin: [0, 0, 0, 10] as [number, number, number, number],
      },
      tableHeader: {
        bold: true,
        fontSize: 11,
        margin: [0, 10, 0, 5] as [number, number, number, number],
      },
    },
    defaultStyle: {
      font: 'Roboto',
    },
    pageMargins: [40, 60, 40, 60] as [number, number, number, number],
    footer: (currentPage: number, pageCount: number) => {
      return {
        text: `Page ${currentPage} of ${pageCount} | Generated: ${format(new Date(), 'PPP pp')}`,
        alignment: 'center',
        fontSize: 8,
        margin: [0, 10, 0, 0] as [number, number, number, number],
        font: 'Roboto',
      };
    },
  };

  return pdfMake.createPdf(docDefinition);
};

export const generateOverallReportPDF = (reportData: any, filters: any) => {
  const content: Content[] = [
    {
      text: 'Ahmad Waqas Cold Storage',
      style: 'header',
      alignment: 'center',
      font: 'Roboto',
    },
    {
      text: urduText.header,
      style: 'urduHeader',
      alignment: 'center',
      font: 'NotoNastaliqUrdu',
    },
    {
      text: 'Overall Report',
      style: 'subheader',
      alignment: 'center',
      font: 'Roboto',
    },
    {
      text: urduText.overallReport,
      style: 'urduSubheader',
      alignment: 'center',
      font: 'NotoNastaliqUrdu',
    },
    { text: '\n' },
    {
      text: [
        ...bilingualText('Period', urduText.period),
        { text: `: ${filters.period}`, font: 'Roboto' },
      ],
      font: 'Roboto',
    },
    ...(filters.date
      ? [
          {
            text: [
              ...bilingualText('Date', urduText.date),
              {
                text: `: ${format(new Date(filters.date), 'PPP')}`,
                font: 'Roboto',
              },
            ],
            font: 'Roboto',
          } as ContentText,
        ]
      : []),
    ...(filters.productType
      ? [
          {
            text: `Product Type: ${filters.productType}`,
            font: 'Roboto',
          } as ContentText,
        ]
      : []),
    ...(filters.productSubType
      ? [
          {
            text: `Product Sub Type: ${filters.productSubType}`,
            font: 'Roboto',
          } as ContentText,
        ]
      : []),
    { text: '\n' },

    // Summary
    {
      table: {
        widths: ['*', 'auto'],
        body: [
          [
            { text: 'Total Entry Amount', font: 'Roboto' },
            {
              text: `Rs. ${(reportData.summary?.totalEntryAmount || 0).toFixed(2)}`,
              font: 'Roboto',
              alignment: 'right',
            },
          ],
          [
            { text: 'Total Entry Quantity', font: 'Roboto' },
            {
              text: (reportData.summary?.totalEntryQuantity || 0).toString(),
              font: 'Roboto',
              alignment: 'right',
            },
          ],
          [
            { text: 'Total Clearance Amount', font: 'Roboto' },
            {
              text: `Rs. ${(reportData.summary?.totalClearanceAmount || 0).toFixed(2)}`,
              font: 'Roboto',
              alignment: 'right',
            },
          ],
          [
            { text: 'Total Clearance Quantity', font: 'Roboto' },
            {
              text: (
                reportData.summary?.totalClearanceQuantity || 0
              ).toString(),
              font: 'Roboto',
              alignment: 'right',
            },
          ],
        ],
      },
      layout: 'lightHorizontalLines',
    },
  ];

  // Entry by Type
  if (reportData.entryByType && reportData.entryByType.length > 0) {
    content.push(
      { text: '\n' },
      {
        text: 'Entry by Product Type',
        style: 'tableHeader',
        font: 'Roboto',
      },
      {
        table: {
          headerRows: 1,
          widths: ['*', 'auto', 'auto'],
          body: [
            [
              { text: 'Product Type', bold: true, font: 'Roboto' },
              { text: 'Quantity', bold: true, font: 'Roboto' },
              { text: 'Amount', bold: true, font: 'Roboto' },
            ],
            ...reportData.entryByType.map((item: any) => [
              { text: item.productType || '-', font: 'Roboto' },
              { text: item.quantity?.toString() || '0', font: 'Roboto' },
              {
                text: `Rs. ${(item.amount || 0).toFixed(2)}`,
                font: 'Roboto',
                alignment: 'right' as const,
              },
            ]),
          ],
        },
        layout: 'lightHorizontalLines',
      }
    );
  }

  // Clearance by Type
  if (reportData.clearanceByType && reportData.clearanceByType.length > 0) {
    content.push(
      { text: '\n' },
      {
        text: 'Clearance by Product Type',
        style: 'tableHeader',
        font: 'Roboto',
      },
      {
        table: {
          headerRows: 1,
          widths: ['*', 'auto', 'auto'],
          body: [
            [
              { text: 'Product Type', bold: true, font: 'Roboto' },
              { text: 'Quantity', bold: true, font: 'Roboto' },
              { text: 'Amount', bold: true, font: 'Roboto' },
            ],
            ...reportData.clearanceByType.map((item: any) => [
              { text: item.productType || '-', font: 'Roboto' },
              { text: item.quantity?.toString() || '0', font: 'Roboto' },
              {
                text: `Rs. ${(item.amount || 0).toFixed(2)}`,
                font: 'Roboto',
                alignment: 'right' as const,
              },
            ]),
          ],
        },
        layout: 'lightHorizontalLines',
      }
    );
  }

  // Customer-wise
  if (reportData.byCustomer && reportData.byCustomer.length > 0) {
    content.push(
      { text: '\n' },
      {
        text: 'Customer-wise Summary',
        style: 'tableHeader',
        font: 'Roboto',
      },
      {
        table: {
          headerRows: 1,
          widths: ['*', 'auto', 'auto', 'auto', 'auto'],
          body: [
            [
              { text: 'Customer', bold: true, font: 'Roboto' },
              { text: 'Entry Qty', bold: true, font: 'Roboto' },
              { text: 'Entry Amount', bold: true, font: 'Roboto' },
              { text: 'Clearance Qty', bold: true, font: 'Roboto' },
              { text: 'Clearance Amount', bold: true, font: 'Roboto' },
            ],
            ...reportData.byCustomer.map((item: any) => [
              { text: item.customerName || '-', font: 'Roboto' },
              { text: item.entryQuantity?.toString() || '0', font: 'Roboto' },
              {
                text: `Rs. ${(item.entryAmount || 0).toFixed(2)}`,
                font: 'Roboto',
              },
              {
                text: item.clearanceQuantity?.toString() || '0',
                font: 'Roboto',
              },
              {
                text: `Rs. ${(item.clearanceAmount || 0).toFixed(2)}`,
                font: 'Roboto',
              },
            ]),
          ],
        },
        layout: 'lightHorizontalLines',
      }
    );
  }

  const docDefinition: TDocumentDefinitions = {
    content,
    styles: {
      header: {
        fontSize: 20,
        bold: true,
        margin: [0, 0, 0, 5] as [number, number, number, number],
      },
      urduHeader: {
        fontSize: 14,
        margin: [0, 0, 0, 10] as [number, number, number, number],
      },
      subheader: {
        fontSize: 16,
        bold: true,
        margin: [0, 10, 0, 5] as [number, number, number, number],
      },
      urduSubheader: {
        fontSize: 12,
        margin: [0, 0, 0, 10] as [number, number, number, number],
      },
      tableHeader: {
        bold: true,
        fontSize: 11,
        margin: [0, 10, 0, 5] as [number, number, number, number],
      },
    },
    defaultStyle: {
      font: 'Roboto',
    },
    pageMargins: [40, 60, 40, 60] as [number, number, number, number],
    footer: (currentPage: number, pageCount: number) => {
      return {
        text: `Page ${currentPage} of ${pageCount} | Generated: ${format(new Date(), 'PPP pp')}`,
        alignment: 'center',
        fontSize: 8,
        margin: [0, 10, 0, 0] as [number, number, number, number],
        font: 'Roboto',
      };
    },
  };

  return pdfMake.createPdf(docDefinition);
};

export const generateStockReportPDF = (
  inventory: any[],
  summary: any,
  filters: any
) => {
  const content: Content[] = [
    {
      text: 'Ahmad Waqas Cold Storage',
      style: 'header',
      alignment: 'center',
      font: 'Roboto',
    },
    {
      text: urduText.header,
      style: 'urduHeader',
      alignment: 'center',
      font: 'NotoNastaliqUrdu',
    },
    {
      text: 'Stock Summary Report',
      style: 'subheader',
      alignment: 'center',
      font: 'Roboto',
    },
    {
      text: urduText.stockReport,
      style: 'urduSubheader',
      alignment: 'center',
      font: 'NotoNastaliqUrdu',
    },
    { text: '\n' },
    ...(filters.roomName
      ? [
          {
            text: [
              ...bilingualText('Room', urduText.room),
              { text: `: ${filters.roomName}`, font: 'Roboto' },
            ],
            font: 'Roboto',
          } as ContentText,
        ]
      : []),
    {
      text: [
        ...bilingualText('Generated', urduText.date),
        { text: `: ${format(new Date(), 'PPP')}`, font: 'Roboto' },
      ],
      font: 'Roboto',
    },
    { text: '\n' },

    // Summary
    {
      table: {
        widths: ['*', 'auto'],
        body: [
          [
            { text: 'Total Items', font: 'Roboto', bold: true },
            {
              text: (summary?.totalItems || 0).toString(),
              font: 'Roboto',
              alignment: 'right',
              bold: true,
            },
          ],
          [
            { text: 'Total Quantity', font: 'Roboto', bold: true },
            {
              text: (summary?.totalQuantity || 0).toString(),
              font: 'Roboto',
              alignment: 'right',
              bold: true,
            },
          ],
          [
            { text: 'Total Value', font: 'Roboto', bold: true },
            {
              text: `Rs. ${(summary?.totalValue || 0).toFixed(2)}`,
              font: 'Roboto',
              alignment: 'right',
              bold: true,
            },
          ],
        ],
      },
      layout: 'lightHorizontalLines',
    },
  ];

  // By Product Type
  if (summary.byType && Object.keys(summary.byType).length > 0) {
    content.push(
      { text: '\n' },
      {
        text: 'Summary by Product Type',
        style: 'tableHeader',
        font: 'Roboto',
      },
      {
        table: {
          headerRows: 1,
          widths: ['*', 'auto', 'auto', 'auto'],
          body: [
            [
              { text: 'Product Type', bold: true, font: 'Roboto' },
              { text: 'Items', bold: true, font: 'Roboto' },
              { text: 'Quantity', bold: true, font: 'Roboto' },
              { text: 'Value', bold: true, font: 'Roboto' },
            ],
            ...Object.entries(summary.byType).map(
              ([type, data]: [string, any]) => [
                { text: type || '-', font: 'Roboto' },
                { text: data.items?.toString() || '0', font: 'Roboto' },
                { text: data.quantity?.toString() || '0', font: 'Roboto' },
                {
                  text: `Rs. ${(data.value || 0).toFixed(2)}`,
                  font: 'Roboto',
                  alignment: 'right' as const,
                },
              ]
            ),
          ],
        },
        layout: 'lightHorizontalLines',
      }
    );
  }

  // By Room
  if (summary.byRoom && Object.keys(summary.byRoom).length > 0) {
    content.push(
      { text: '\n' },
      { text: 'Summary by Room', style: 'tableHeader', font: 'Roboto' },
      {
        table: {
          headerRows: 1,
          widths: ['*', 'auto', 'auto', 'auto'],
          body: [
            [
              { text: 'Room', bold: true, font: 'Roboto' },
              { text: 'Items', bold: true, font: 'Roboto' },
              { text: 'Quantity', bold: true, font: 'Roboto' },
              { text: 'Value', bold: true, font: 'Roboto' },
            ],
            ...Object.entries(summary.byRoom).map(
              ([room, data]: [string, any]) => [
                { text: room || '-', font: 'Roboto' },
                { text: data.items?.toString() || '0', font: 'Roboto' },
                { text: data.quantity?.toString() || '0', font: 'Roboto' },
                {
                  text: `Rs. ${(data.value || 0).toFixed(2)}`,
                  font: 'Roboto',
                  alignment: 'right' as const,
                },
              ]
            ),
          ],
        },
        layout: 'lightHorizontalLines',
      }
    );
  }

  // Inventory Details
  if (inventory.length > 0) {
    content.push(
      { text: '\n' },
      { text: 'Inventory Details', style: 'tableHeader', font: 'Roboto' },
      {
        table: {
          headerRows: 1,
          widths: ['*', '*', 'auto', 'auto', 'auto', 'auto'],
          body: [
            [
              { text: 'Product Type', bold: true, font: 'Roboto' },
              { text: 'Sub Type', bold: true, font: 'Roboto' },
              { text: 'Room', bold: true, font: 'Roboto' },
              { text: 'Qty', bold: true, font: 'Roboto' },
              { text: 'Unit Price', bold: true, font: 'Roboto' },
              { text: 'Total Value', bold: true, font: 'Roboto' },
            ],
            ...inventory.map((item: any) => [
              { text: item.productType?.name || '-', font: 'Roboto' },
              { text: item.productSubType?.name || '-', font: 'Roboto' },
              { text: item.room?.name || '-', font: 'Roboto' },
              {
                text: item.remainingQuantity?.toString() || '0',
                font: 'Roboto',
              },
              {
                text: `Rs. ${(item.unitPrice || 0).toFixed(2)}`,
                font: 'Roboto',
              },
              {
                text: `Rs. ${((item.remainingQuantity || 0) * (item.unitPrice || 0)).toFixed(2)}`,
                font: 'Roboto',
                alignment: 'right' as const,
              },
            ]),
          ],
        },
        layout: 'lightHorizontalLines',
        fontSize: 8,
      }
    );
  }

  const docDefinition: TDocumentDefinitions = {
    content,
    styles: {
      header: {
        fontSize: 20,
        bold: true,
        margin: [0, 0, 0, 5] as [number, number, number, number],
      },
      urduHeader: {
        fontSize: 14,
        margin: [0, 0, 0, 10] as [number, number, number, number],
      },
      subheader: {
        fontSize: 16,
        bold: true,
        margin: [0, 10, 0, 5] as [number, number, number, number],
      },
      urduSubheader: {
        fontSize: 12,
        margin: [0, 0, 0, 10] as [number, number, number, number],
      },
      tableHeader: {
        bold: true,
        fontSize: 11,
        margin: [0, 10, 0, 5] as [number, number, number, number],
      },
    },
    defaultStyle: {
      font: 'Roboto',
    },
    pageMargins: [40, 60, 40, 60] as [number, number, number, number],
    footer: (currentPage: number, pageCount: number) => {
      return {
        text: `Page ${currentPage} of ${pageCount} | Generated: ${format(new Date(), 'PPP pp')}`,
        alignment: 'center',
        fontSize: 8,
        margin: [0, 10, 0, 0] as [number, number, number, number],
        font: 'Roboto',
      };
    },
  };

  return pdfMake.createPdf(docDefinition);
};

export const generateEntryReceiptPDF = (receiptData: any) => {
  const content: Content[] = [
    // Header (ہیڈر)
    {
      columns: [
        {
          width: '*',
          text: 'Receipt Book',
          style: 'header',
          alignment: 'left',
        },
        {
          width: 'auto',
          text: urduText.receiptBook,
          style: 'urduHeader',
          alignment: 'right',
        },
      ],
    },
    {
      text: 'Ahmad Waqas Cold Storage',
      style: 'header',
      alignment: 'center',
    },
    {
      text: urduText.header,
      style: 'urduHeader',
      alignment: 'center',
      fontSize: 20, // (بڑا فونٹ)
      bold: true,
      margin: [0, 5, 0, 10],
    },

    // Receipt No and Date (رسید نمبر اور تاریخ)
    {
      table: {
        widths: ['*', 'auto', '*', 'auto'],
        body: [
          [
            // Receipt No (رسید نمبر)
            {
              text: receiptData.receiptNo || ' ۔۔۔۔۔ ',
              style: 'urduValue',
              alignment: 'left',
              margin: [0, 5, 0, 0],
            },
            {
              text: urduText.receiptNo,
              style: 'urduLabel',
              alignment: 'right',
              margin: [0, 5, 0, 0],
            },
            // Date (تاریخ)
            {
              text: receiptData.date
                ? format(new Date(receiptData.date), 'dd-MM-yyyy')
                : ' ۔۔۔۔۔ ',
              style: 'urduValue',
              alignment: 'left',
              margin: [0, 5, 0, 0],
            },
            {
              text: urduText.date,
              style: 'urduLabel',
              alignment: 'right',
              margin: [0, 5, 0, 0],
            },
          ],
        ],
      },
      layout: 'noBorders',
      margin: [0, 0, 0, 10], // (نیچے مارجن)
    },

    // Main Content Table (مرکزی مواد کا ٹیبل)
    {
      table: {
        widths: ['*'],
        body: [
          [
            {
              stack: [
                createReceiptRow(
                  urduText.secretary,
                  receiptData.secretary || ''
                ),
                createReceiptRow(urduText.count, receiptData.quantity || ''),
                createReceiptRow(urduText.roomNo, receiptData.roomNo || ''),
                createReceiptRow(urduText.rackNo, receiptData.rackNo || ''),
                createReceiptRow(urduText.marka, receiptData.marka || ''),
                createReceiptRow(urduText.variety, receiptData.variety || ''),
                createReceiptRow(
                  urduText.rentPacking,
                  receiptData.rentPacking || ''
                ),
                createReceiptRow(
                  urduText.vehicleNo,
                  receiptData.vehicleNo || ''
                ),
                createReceiptRow(urduText.season, receiptData.season || ''),
                createReceiptRow(urduText.details, receiptData.details || ''),
                createReceiptRow(urduText.note, receiptData.note || ''),
              ],
            },
          ],
        ],
      },
      // (تصویر جیسا ٹیبل لے آؤٹ)
      layout: {
        hLineWidth: (i, node) =>
          i === 0 || i === node.table.body.length ? 1 : 0,
        vLineWidth: (i, node) =>
          i === 0 || i === node.table.widths!.length ? 1 : 0,
        paddingTop: (i) => 10,
        paddingBottom: (i) => 10,
      },
    },

    // Signature (دستخط)
    {
      text: `${urduText.signature} : ...............................`,
      style: 'urduLabel',
      alignment: 'right',
      margin: [0, 40, 10, 0], // (اوپر اور دائیں مارجن)
    },
  ];

  const docDefinition: TDocumentDefinitions = {
    content,
    // (اسٹائلز)
    styles: {
      header: {
        fontSize: 16,
        bold: true,
        font: 'Roboto', // (انگلش ہیڈر کے لیے روبوٹو)
      },
      urduHeader: {
        fontSize: 14,
        font: 'NotoNastaliqUrdu', // (اردو ہیڈر کے لیے نوٹو)
      },
      // (اردو لیبل کے لیے اسٹائل)
      urduLabel: {
        font: 'NotoNastaliqUrdu',
        fontSize: 14,
        bold: true,
        margin: [0, 0, 10, 0], // (دائیں مارجن)
      },
      // (اردو ویلیو کے لیے اسٹائل)
      urduValue: {
        font: 'NotoNastaliqUrdu',
        fontSize: 12,
        margin: [10, 0, 0, 0], // (بائیں مارجن)
      },
    },
    defaultStyle: {
      font: 'NotoNastaliqUrdu', // (پوری ڈاکومنٹ کے لیے ڈیفالٹ اردو فونٹ)
    },
    pageMargins: [40, 40, 40, 40] as [number, number, number, number],
  };

  return pdfMake.createPdf(docDefinition);
};
