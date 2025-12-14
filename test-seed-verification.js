const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function verifySeededData() {
  console.log('🔍 Verifying Seeded Data...\n');

  try {
    // 1. Check Customers
    console.log('👥 CUSTOMERS:');
    const customers = await prisma.customer.findMany({
      include: {
        _count: {
          select: {
            entryReceipts: true,
            clearanceReceipts: true,
            ledger: true,
          },
        },
      },
    });

    for (const customer of customers) {
      console.log(`   ${customer.name} (${customer.phone})`);
      console.log(`      - Entry Receipts: ${customer._count.entryReceipts}`);
      console.log(
        `      - Clearance Receipts: ${customer._count.clearanceReceipts}`
      );
      console.log(`      - Ledger Entries: ${customer._count.ledger}`);

      // Calculate balance
      const ledgerEntries = await prisma.ledger.findMany({
        where: { customerId: customer.id },
      });

      const totalDebit = ledgerEntries.reduce(
        (sum, entry) => sum + entry.debitAmount,
        0
      );
      const totalCredit = ledgerEntries.reduce(
        (sum, entry) => sum + entry.creditAmount,
        0
      );
      const balance = totalDebit - totalCredit;

      console.log(`      - Balance: ${balance.toFixed(2)} PKR\n`);
    }

    // 2. Check Inventory
    console.log('📦 INVENTORY STATUS:');
    const entryItems = await prisma.entryItem.findMany({
      include: {
        entryReceipt: {
          include: {
            customer: true,
          },
        },
        productType: true,
        productSubType: true,
        room: true,
      },
    });

    for (const item of entryItems) {
      const cleared = item.quantity - item.remainingQuantity;
      const status =
        item.remainingQuantity === 0
          ? '✅ Fully Cleared'
          : cleared > 0
            ? '🔄 Partially Cleared'
            : '📦 In Storage';

      console.log(
        `   ${item.entryReceipt.customer.name} - ${item.productType.name}`
      );
      console.log(`      Room: ${item.room.name}`);
      console.log(
        `      Quantity: ${item.remainingQuantity}/${item.quantity} remaining`
      );
      if (item.hasKhaliJali) {
        console.log(
          `      Khali Jali: ${item.remainingKjQuantity}/${item.kjQuantity} remaining`
        );
      }
      console.log(`      Status: ${status}\n`);
    }

    // 3. Check Cash Book
    console.log('💰 CASH BOOK SUMMARY:');
    const cashBookEntries = await prisma.cashBookEntry.findMany({
      orderBy: { date: 'asc' },
    });

    const totalInflows = cashBookEntries
      .filter((e) => e.transactionType === 'inflow')
      .reduce((sum, e) => sum + e.amount, 0);

    const totalOutflows = cashBookEntries
      .filter((e) => e.transactionType === 'outflow')
      .reduce((sum, e) => sum + e.amount, 0);

    console.log(`   Total Inflows: ${totalInflows.toFixed(2)} PKR`);
    console.log(`   Total Outflows: ${totalOutflows.toFixed(2)} PKR`);
    console.log(`   Net: ${(totalInflows - totalOutflows).toFixed(2)} PKR\n`);

    // 4. Check Daily Summaries
    console.log('📊 DAILY CASH SUMMARIES:');
    const summaries = await prisma.dailyCashSummary.findMany({
      orderBy: { date: 'asc' },
    });

    for (const summary of summaries) {
      const dateStr = summary.date.toISOString().split('T')[0];
      const reconciled = summary.isReconciled ? '✅' : '⏳';
      console.log(`   ${dateStr} ${reconciled}`);
      console.log(`      Opening: ${summary.openingBalance.toFixed(2)} PKR`);
      console.log(`      Inflows: +${summary.totalInflows.toFixed(2)} PKR`);
      console.log(`      Outflows: -${summary.totalOutflows.toFixed(2)} PKR`);
      console.log(`      Closing: ${summary.closingBalance.toFixed(2)} PKR\n`);
    }

    // 5. Check Expenses
    console.log('💸 EXPENSES:');
    const expenses = await prisma.expense.findMany({
      include: {
        category: true,
      },
      orderBy: { date: 'asc' },
    });

    const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);

    for (const expense of expenses) {
      const dateStr = expense.date.toISOString().split('T')[0];
      console.log(
        `   ${dateStr} - ${expense.category.name}: ${expense.amount.toFixed(2)} PKR`
      );
      console.log(`      ${expense.description}\n`);
    }

    console.log(`   Total Expenses: ${totalExpenses.toFixed(2)} PKR\n`);

    // 6. Summary Counts
    console.log('📈 DATABASE SUMMARY:');
    const counts = {
      customers: await prisma.customer.count(),
      productTypes: await prisma.productType.count(),
      productSubTypes: await prisma.productSubType.count(),
      rooms: await prisma.room.count(),
      packTypes: await prisma.packType.count(),
      entryReceipts: await prisma.entryReceipt.count(),
      entryItems: await prisma.entryItem.count(),
      clearanceReceipts: await prisma.clearanceReceipt.count(),
      clearedItems: await prisma.clearedItem.count(),
      ledgerEntries: await prisma.ledger.count(),
      expenseCategories: await prisma.expenseCategory.count(),
      expenses: await prisma.expense.count(),
      cashBookEntries: await prisma.cashBookEntry.count(),
      dailySummaries: await prisma.dailyCashSummary.count(),
    };

    for (const [key, value] of Object.entries(counts)) {
      const label = key
        .replace(/([A-Z])/g, ' $1')
        .replace(/^./, (str) => str.toUpperCase());
      console.log(`   ${label}: ${value}`);
    }

    console.log('\n✅ Verification Complete!');
  } catch (error) {
    console.error('❌ Error verifying data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

verifySeededData();
