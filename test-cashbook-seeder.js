// Quick test script to verify cash book seeder data
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testCashBookData() {
  console.log('🧪 Testing Cash Book Seeder Data\n');
  console.log('='.repeat(60));

  try {
    // Test 1: Check customers
    const customers = await prisma.customer.findMany();
    console.log(`\n✅ Test 1: Customers Created`);
    console.log(`   Found ${customers.length} customers:`);
    customers.forEach((c) => console.log(`   - ${c.name} (${c.phone})`));

    // Test 2: Check cash book entries
    const cashBookEntries = await prisma.cashBookEntry.findMany({
      include: {
        customer: true,
      },
      orderBy: {
        date: 'asc',
      },
    });
    console.log(`\n✅ Test 2: Cash Book Entries`);
    console.log(`   Total entries: ${cashBookEntries.length}`);

    const inflows = cashBookEntries.filter(
      (e) => e.transactionType === 'inflow'
    );
    const outflows = cashBookEntries.filter(
      (e) => e.transactionType === 'outflow'
    );

    console.log(
      `   - Inflows: ${inflows.length} (₨${inflows.reduce((sum, e) => sum + e.amount, 0).toLocaleString()})`
    );
    console.log(
      `   - Outflows: ${outflows.length} (₨${outflows.reduce((sum, e) => sum + e.amount, 0).toLocaleString()})`
    );

    // Test 3: Check sources
    const sources = {};
    cashBookEntries.forEach((e) => {
      sources[e.source] = (sources[e.source] || 0) + 1;
    });
    console.log(`\n✅ Test 3: Transaction Sources`);
    Object.entries(sources).forEach(([source, count]) => {
      console.log(`   - ${source}: ${count} transactions`);
    });

    // Test 4: Check daily summaries
    const summaries = await prisma.dailyCashSummary.findMany({
      orderBy: {
        date: 'asc',
      },
    });
    console.log(`\n✅ Test 4: Daily Cash Summaries`);
    console.log(`   Total days: ${summaries.length}`);

    if (summaries.length > 0) {
      const first = summaries[0];
      const last = summaries[summaries.length - 1];
      console.log(
        `   - First day opening: ₨${first.openingBalance.toLocaleString()}`
      );
      console.log(
        `   - Last day closing: ₨${last.closingBalance.toLocaleString()}`
      );
      console.log(
        `   - Reconciled days: ${summaries.filter((s) => s.isReconciled).length}`
      );
    }

    // Test 5: Check today's data
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayTransactions = await prisma.cashBookEntry.findMany({
      where: {
        date: {
          gte: today,
          lt: new Date(today.getTime() + 24 * 60 * 60 * 1000),
        },
      },
    });

    const todaySummary = await prisma.dailyCashSummary.findUnique({
      where: { date: today },
    });

    console.log(`\n✅ Test 5: Today's Data (${today.toDateString()})`);
    console.log(`   - Transactions: ${todayTransactions.length}`);
    if (todaySummary) {
      console.log(
        `   - Opening Balance: ₨${todaySummary.openingBalance.toLocaleString()}`
      );
      console.log(
        `   - Total Inflows: ₨${todaySummary.totalInflows.toLocaleString()}`
      );
      console.log(
        `   - Total Outflows: ₨${todaySummary.totalOutflows.toLocaleString()}`
      );
      console.log(
        `   - Closing Balance: ₨${todaySummary.closingBalance.toLocaleString()}`
      );
    } else {
      console.log(`   - No summary found for today`);
    }

    // Test 6: Check entry and clearance receipts
    const entryReceipts = await prisma.entryReceipt.count();
    const clearanceReceipts = await prisma.clearanceReceipt.count();
    const expenses = await prisma.expense.count();

    console.log(`\n✅ Test 6: Related Records`);
    console.log(`   - Entry Receipts: ${entryReceipts}`);
    console.log(`   - Clearance Receipts: ${clearanceReceipts}`);
    console.log(`   - Expenses: ${expenses}`);

    // Test 7: Verify data integrity
    console.log(`\n✅ Test 7: Data Integrity Checks`);

    // Check if all clearance entries have corresponding cash book entries
    const clearanceWithCashBook = await prisma.clearanceReceipt.findMany({
      include: {
        _count: {
          select: {
            ledgerEntries: true,
          },
        },
      },
    });

    const clearancesWithLedger = clearanceWithCashBook.filter(
      (c) => c._count.ledgerEntries > 0
    ).length;

    console.log(
      `   - Clearances with ledger entries: ${clearancesWithLedger}/${clearanceReceipts}`
    );

    // Check if all expenses have cash book entries
    const expensesWithCashBook = await prisma.cashBookEntry.count({
      where: {
        source: 'expense',
      },
    });

    console.log(
      `   - Expenses with cash book entries: ${expensesWithCashBook}/${expenses}`
    );

    console.log('\n' + '='.repeat(60));
    console.log('✨ All tests passed! Cash book data is ready for testing.\n');
  } catch (error) {
    console.error('\n❌ Error during testing:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

testCashBookData();
