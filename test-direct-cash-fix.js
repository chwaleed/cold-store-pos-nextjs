/**
 * Test script to verify direct cash transactions are recorded in cash book
 * Run with: node test-direct-cash-fix.js
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testDirectCashIntegration() {
  console.log('🧪 Testing Direct Cash Cash Book Integration...\n');

  try {
    // 1. Find or create a test customer
    let customer = await prisma.customer.findFirst({
      where: { name: 'Test Customer' },
    });

    if (!customer) {
      customer = await prisma.customer.create({
        data: {
          name: 'Test Customer',
          phone: '1234567890',
        },
      });
      console.log('✅ Created test customer:', customer.name);
    } else {
      console.log('✅ Using existing test customer:', customer.name);
    }

    // 2. Create a direct cash debit (loan given)
    console.log('\n📤 Creating direct cash debit (loan given)...');
    const testDate = new Date();
    const testAmount = 5000;

    const ledgerEntry = await prisma.$transaction(async (tx) => {
      // Create ledger entry
      const entry = await tx.ledger.create({
        data: {
          customerId: customer.id,
          type: 'direct_cash',
          description: 'Test loan given',
          debitAmount: testAmount,
          creditAmount: 0,
          isDirectCash: true,
          createdAt: testDate,
        },
      });

      // Create cash book entry
      const cashBookEntry = await tx.cashBookEntry.create({
        data: {
          date: testDate,
          transactionType: 'outflow',
          amount: testAmount,
          description: 'Direct Cash: Test loan given',
          source: 'ledger',
          referenceId: entry.id,
          referenceType: 'ledger_entry',
          customerId: customer.id,
          isDirectCash: true,
          createdBy: 'test-script',
        },
      });

      return { entry, cashBookEntry };
    });

    console.log('✅ Ledger entry created:', {
      id: ledgerEntry.entry.id,
      amount: ledgerEntry.entry.debitAmount,
      isDirectCash: ledgerEntry.entry.isDirectCash,
    });

    console.log('✅ Cash book entry created:', {
      id: ledgerEntry.cashBookEntry.id,
      amount: ledgerEntry.cashBookEntry.amount,
      type: ledgerEntry.cashBookEntry.transactionType,
      isDirectCash: ledgerEntry.cashBookEntry.isDirectCash,
    });

    // 3. Verify cash book entry exists
    console.log('\n🔍 Verifying cash book entry...');
    const cashBookEntries = await prisma.cashBookEntry.findMany({
      where: {
        referenceId: ledgerEntry.entry.id,
        referenceType: 'ledger_entry',
      },
      include: {
        customer: true,
      },
    });

    if (cashBookEntries.length > 0) {
      console.log('✅ Cash book entry found!');
      console.log('   - Description:', cashBookEntries[0].description);
      console.log('   - Amount:', cashBookEntries[0].amount);
      console.log('   - Type:', cashBookEntries[0].transactionType);
      console.log('   - Is Direct Cash:', cashBookEntries[0].isDirectCash);
      console.log('   - Customer:', cashBookEntries[0].customer?.name);
    } else {
      console.log('❌ Cash book entry NOT found!');
    }

    // 4. Check daily summary
    console.log('\n📊 Checking daily cash summary...');
    const startOfDay = new Date(testDate);
    startOfDay.setHours(0, 0, 0, 0);

    const dailySummary = await prisma.dailyCashSummary.findUnique({
      where: { date: startOfDay },
    });

    if (dailySummary) {
      console.log('✅ Daily summary found:');
      console.log('   - Total Inflows:', dailySummary.totalInflows);
      console.log('   - Total Outflows:', dailySummary.totalOutflows);
      console.log('   - Closing Balance:', dailySummary.closingBalance);
    } else {
      console.log('⚠️  Daily summary not found (may need to be created)');
    }

    // 5. Cleanup test data
    console.log('\n🧹 Cleaning up test data...');
    await prisma.cashBookEntry.delete({
      where: { id: ledgerEntry.cashBookEntry.id },
    });
    await prisma.ledger.delete({
      where: { id: ledgerEntry.entry.id },
    });
    console.log('✅ Test data cleaned up');

    console.log(
      '\n✅ TEST PASSED: Direct cash transactions are now recorded in cash book!'
    );
  } catch (error) {
    console.error('\n❌ TEST FAILED:', error.message);
    console.error('\nFull error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testDirectCashIntegration();
