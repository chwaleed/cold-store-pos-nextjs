# Cold Storage Management System

A comprehensive cold storage management system built with **Next.js 14**, **Prisma ORM**, and **SQLite**. This application is specifically designed for cold storage facilities to manage inventory, customer accounts, clearances, financial transactions, and generate detailed reports with Urdu language support.

## 🌟 Key Features

### 📦 Inventory Management

- **Entry Receipts**: Record incoming inventory with detailed product information
- **Product Types & SubTypes**: Organize products (e.g., Potato, Onion, Garlic with variants like Cardinal, Red, White)
- **Room Management**: Track inventory across different cold/hot storage rooms
- **Pack Types**: Support for different packaging (Bori, Jali)
- **Khali Jali (Empty Crate) Tracking**: Separate tracking for empty crates with automatic pricing
- **Partial Clearance Support**: Handle partial inventory releases with remaining quantity tracking
- **Double Rent Pricing**: Automatic double rent calculation after 30 days for specific products

### 👥 Customer Management

- Complete customer profiles with contact details and addresses
- Customer-wise ledger system with credit/debit tracking
- Direct cash (loan) transactions separate from business operations
- Village-based customer organization

### 🧾 Clearance System

- Generate clearance receipts for inventory releases
- Automatic rent calculation based on storage duration
- Support for partial clearances with remaining quantity updates
- Discount management
- Credit amount tracking
- Urdu receipt generation with PDF export

### 💰 Financial Management

- **Cash Book**: Complete double-entry cash flow tracking
  - Daily opening/closing balance management
  - Inflow/outflow categorization
  - Automatic integration with clearances and expenses
  - Manual transaction support
  - Audit trail for balance changes
- **Ledger System**: Customer-wise credit/debit tracking
- **Expense Management**: Categorized expense tracking
- **Direct Cash Transactions**: Loan tracking (excluded from profit/loss)

### 📊 Comprehensive Reporting

- **Daily Reports**: Day-wise transaction summaries
- **Customer-wise Reports**: Individual customer transaction history
- **Date Range Reports**: Custom period analysis
- **Overall Reports**: Business-wide financial overview
- **Profit & Audit Reports**: Detailed profit/loss analysis with PDF export
- **Cash Book Reports**: Daily cash flow summaries with reconciliation
- **Excel Export**: Export reports to Excel format

### 🎨 User Interface

- **Dark/Light Mode**: Theme switching support
- **Responsive Design**: Works on desktop, tablet, and mobile
- **Urdu Language Support**: Bilingual interface with Urdu receipts
- **Real-time Updates**: Live data synchronization
- **Keyboard Shortcuts**: Quick navigation and actions
- **Network Speed Monitor**: Connection status indicator
- **Weather Widget**: Integrated weather information
- **Clock Widget**: Real-time clock display

## 🛠️ Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Database**: SQLite with Prisma ORM
- **UI Components**: Radix UI + Tailwind CSS
- **State Management**: Zustand
- **Forms**: React Hook Form + Zod validation
- **PDF Generation**: Puppeteer
- **Excel Export**: XLSX
- **Animations**: Framer Motion
- **Icons**: Lucide React + Tabler Icons
- **Date Handling**: date-fns
- **Styling**: Tailwind CSS with custom animations

## 📋 Prerequisites

- **Node.js** (v18 or later)
- **npm** or **yarn** or **bun**
- **SQLite** (included with Prisma)

## 🚀 Getting Started

### Installation

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd storage
   ```

2. **Install dependencies**

   ```bash
   npm install
   # or
   yarn install
   # or
   bun install
   ```

3. **Set up environment variables**

   Create a `.env` file in the root directory:

   ```env
   DATABASE_URL="file:./dev.db"
   ```

4. **Initialize the database**

   ```bash
   npx prisma generate
   npx prisma db push
   ```

5. **Seed the database (optional)**

   ```bash
   npm run seed
   # or seed cash book data
   npm run seed:cashbook
   ```

6. **Run the development server**

   ```bash
   npm run dev
   # or
   yarn dev
   # or
   bun dev
   ```

7. **Open your browser**

   Navigate to [http://localhost:3000](http://localhost:3000)

## 📁 Project Structure

```
├── app/
│   ├── (root)/              # Main application routes
│   │   ├── cash-book/       # Cash book management
│   │   ├── clearance/       # Clearance receipts
│   │   ├── customers/       # Customer management
│   │   ├── expenses/        # Expense tracking
│   │   ├── home/            # Dashboard
│   │   ├── inventory/       # Inventory management
│   │   ├── product/         # Product types & subtypes
│   │   ├── records/         # Entry receipts
│   │   ├── reports/         # Reporting system
│   │   └── settings/        # System settings
│   ├── api/                 # API routes
│   └── layout.tsx           # Root layout
├── components/              # React components
│   ├── cash-book/          # Cash book components
│   ├── clearance/          # Clearance components
│   ├── customer/           # Customer components
│   ├── dashboard/          # Dashboard widgets
│   ├── entry/              # Entry receipt components
│   ├── expense/            # Expense components
│   ├── inventory/          # Inventory components
│   ├── reports/            # Report components
│   └── ui/                 # Reusable UI components
├── lib/                    # Utility functions
│   ├── cash-book-integration.ts
│   ├── pdf-templates.ts
│   └── urdu-receipt-templates.ts
├── prisma/                 # Database schema & migrations
│   ├── schema.prisma       # Database schema
│   ├── seed.ts            # Database seeder
│   └── seed-cashbook.ts   # Cash book seeder
├── schema/                 # Zod validation schemas
├── types/                  # TypeScript type definitions
└── public/                 # Static assets
```

## 🔑 Key Features Explained

### Entry Receipt System

- Record incoming inventory with automatic receipt number generation (CS-YYYYMMDD-XXXX)
- Track product details: type, subtype, pack type, room, quantity, pricing
- Support for Khali Jali (empty crate) tracking with separate pricing
- Automatic ledger entry creation for customer accounts

### Clearance Receipt System

- Generate clearance receipts with automatic number generation (CL-YYYYMMDD-XXXX)
- Calculate rent based on storage duration
- Handle partial clearances with automatic remaining quantity updates
- Support for discounts and credit amounts
- Generate Urdu receipts with PDF export

### Cash Book System

- Track all cash inflows and outflows
- Daily opening/closing balance management
- Automatic integration with:
  - Clearance receipts (inflows)
  - Expense entries (outflows)
  - Ledger payments (inflows/outflows)
- Manual transaction support for miscellaneous entries
- Audit trail for opening balance changes
- Daily reconciliation support

### Ledger System

- Customer-wise credit/debit tracking
- Three transaction types:
  - `adding_inventory`: Debit when inventory is added
  - `clearance`: Credit when inventory is cleared
  - `direct_cash`: Loan transactions (excluded from profit/loss)
- Automatic balance calculation
- Discount tracking

### Reporting System

- **Daily Report**: View all transactions for a specific date
- **Customer-wise Report**: Complete transaction history per customer
- **Date Range Report**: Analyze transactions within a date range
- **Overall Report**: Business-wide financial summary
- **Profit & Audit Report**: Detailed profit/loss with expense breakdown
- **Cash Book Reports**: Daily cash flow with reconciliation status
- Export to Excel and PDF formats

## 🎯 Database Schema Highlights

### Core Models

- **Customer**: Customer information and relationships
- **ProductType**: Main product categories with rent doubling rules
- **ProductSubType**: Product variants
- **Room**: Storage room management
- **PackType**: Packaging types
- **EntryReceipt**: Incoming inventory records
- **EntryItem**: Individual inventory items with partial clearance support
- **ClearanceReceipt**: Outgoing inventory records
- **ClearedItem**: Individual cleared items
- **Ledger**: Customer account transactions
- **Expense**: Business expenses with categories
- **CashBookEntry**: All cash transactions
- **DailyCashSummary**: Daily cash balances
- **OpeningBalanceAudit**: Audit trail for balance changes

## 🔧 Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm run seed         # Seed database with sample data
npm run seed:cashbook # Seed cash book data
```

## 🌐 Environment Variables

```env
DATABASE_URL="file:./dev.db"  # SQLite database path
```

## 📱 Features in Detail

### Urdu Language Support

- Bilingual interface (English/Urdu)
- Urdu receipt generation with proper RTL text rendering
- Noto Nastaliq Urdu font integration
- PDF export with Urdu text support

### Keyboard Shortcuts

- Quick navigation between modules
- Fast data entry
- Shortcut help dialog

### Real-time Features

- Live network speed monitoring
- Real-time clock display
- Weather information widget
- Auto-refresh data updates

### Security & Validation

- Zod schema validation for all forms
- Input sanitization
- Error boundary components
- Comprehensive error handling

## 🐳 Docker Support

A Dockerfile is included for containerized deployment:

```bash
docker build -t cold-storage-app .
docker run -p 3000:3000 cold-storage-app
```

## 📄 Production Migration

See [PRODUCTION_MIGRATION_GUIDE.md](./PRODUCTION_MIGRATION_GUIDE.md) for detailed instructions on migrating to production.

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is private and proprietary.

## 👨‍💻 Developer

Developed by **Ahmad Waqas**

## 🙏 Acknowledgments

- Built with Next.js 14 and modern React patterns
- UI components from Radix UI and shadcn/ui
- Icons from Lucide React and Tabler Icons
- Urdu font support from Noto Nastaliq Urdu

---

**Note**: This is a specialized cold storage management system with features tailored for the cold storage industry, including rent calculation, partial clearances, and comprehensive financial tracking.
