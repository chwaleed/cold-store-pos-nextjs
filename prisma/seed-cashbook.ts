import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting Cash Book seeder...\n');

  // Clean up existing data
  console.log('🧹 Cleaning up existing cash book data...');
  await prisma.openingBalanceAudit.deleteMany({});
  await prisma.dailyCashSummary.deleteMany({});
  await prisma.cashBookEntry.deleteMany({});
  await prisma.expense.deleteMany({});
  await prisma.expenseCategory.deleteMany({});
  await prisma.clearedItem.deleteMany({});
  await prisma.clearanceReceipt.deleteMany({});
  await prisma.ledger.deleteMany({});
  await prisma.entryItem.deleteMany({});
  await prisma.entryReceipt.deleteMany({});
  await prisma.customer.deleteMany({});
  await prisma.room.deleteMany({});
  await prisma.packType.deleteMany({});
  await prisma.productSubType.deleteMany({});
  await prisma.productType.deleteMany({});
  console.log('✅ Cleanup complete\n');

  // Create base data
  console.log('📦 Creating base data...');

  // Create Product Types
  const potato = await prisma.productType.create({
    data: {
      name: 'Potato',
      doubleRentAfter30Days: true,
    },
  });

  const onion = await prisma.productType.create({
    data: {
      name: 'Onion',
      doubleRentAfter30Days: false,
    },
  });

  // Create Product SubTypes
  const cardinalPotato = await prisma.productSubType.create({
    data: {
      productTypeId: potato.id,
      name: 'Cardinal',
    },
  });

  const redOnion = await prisma.productSubType.create({
    data: {
      productTypeId: onion.id,
      name: 'Red',
    },
  });

  // Create Pack Types
  const bori = await prisma.packType.create({
    data: { name: 'Bori' },
  });

  const jali = await prisma.packType.create({
    data: { name: 'Jali' },
  });

  // Create Rooms
  const coldRoom1 = await prisma.room.create({
    data: {
      name: 'Cold Room 1',
      type: 'COLD',
      isActive: true,
    },
  });

  const coldRoom2 = await prisma.room.create({
    data: {
      name: 'Cold Room 2',
      type: 'COLD',
      isActive: true,
    },
  });

  // Create Customers
  const customer1 = await prisma.customer.create({
    data: {
      name: 'Ahmad Ali',
      fatherName: 'Muhammad Ali',
      phone: '03001234567',
      address: 'Main Bazar',
      village: 'Lahore',
    },
  });

  const customer2 = await prisma.customer.create({
    data: {
      name: 'Hassan Khan',
      fatherName: 'Imran Khan',
      phone: '03009876543',
      address: 'Model Town',
      village: 'Karachi',
    },
  });

  const customer3 = await prisma.customer.create({
    data: {
      name: 'Bilal Ahmed',
      fatherName: 'Ahmed Raza',
      phone: '03111234567',
      address: 'Garden Town',
      village: 'Islamabad',
    },
  });

  // Create Expense Categories
  const utilities = await prisma.expenseCategory.create({
    data: {
      name: 'Utilities',
      description: 'Electricity, water, gas bills',
      isActive: true,
    },
  });

  const salaries = await prisma.expenseCategory.create({
    data: {
      name: 'Salaries',
      description: 'Staff salaries and wages',
      isActive: true,
    },
  });

  const maintenance = await prisma.expenseCategory.create({
    data: {
      name: 'Maintenance',
      description: 'Equipment and facility maintenance',
      isActive: true,
    },
  });

  console.log('✅ Base data created\n');

  // Create transactions for the last 7 days
  console.log('💰 Creating cash book transactions...\n');

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let i = 6; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    date.setHours(10, 0, 0, 0);

    console.log(`📅 Day ${7 - i}: ${date.toDateString()}`);

    // Day 1-3: Entry Receipts (Inventory Added)
    if (i >= 4) {
      const entryReceipt = await prisma.entryReceipt.create({
        data: {
          receiptNo: `CS-${date.toISOString().split('T')[0].replace(/-/g, '')}-${String(1).padStart(4, '0')}`,
          customerId:
            i === 6 ? customer1.id : i === 5 ? customer2.id : customer3.id,
          carNo: `ABC-${1000 + i}`,
          entryDate: date,
          totalAmount: 50000,
          description: 'Initial inventory entry',
          items: {
            create: [
              {
                productTypeId: potato.id,
                productSubTypeId: cardinalPotato.id,
                packTypeId: bori.id,
                roomId: coldRoom1.id,
                boxNo: `BOX-${100 + i}`,
                marka: 'A-Grade',
                quantity: 100,
                remainingQuantity: 100,
                unitPrice: 500,
                totalPrice: 50000,
                hasKhaliJali: false,
                grandTotal: 50000,
              },
            ],
          },
        },
      });

      // Create ledger entry for inventory
      await prisma.ledger.create({
        data: {
          customerId:
            i === 6 ? customer1.id : i === 5 ? customer2.id : customer3.id,
          type: 'adding_inventory',
          entryReceiptId: entryReceipt.id,
          description: 'Inventory added - rent charges',
          debitAmount: 50000,
          creditAmount: 0,
        },
      });

      console.log(
        `  ✅ Entry Receipt created for ${i === 6 ? 'Ahmad Ali' : i === 5 ? 'Hassan Khan' : 'Bilal Ahmed'}: ₨50,000`
      );
    }

    // Day 2-6: Clearance Receipts (Cash Inflow)
    if (i >= 1 && i <= 5) {
      // Get an entry item to clear
      const entryItems = await prisma.entryItem.findMany({
        where: {
          remainingQuantity: { gt: 0 },
        },
        take: 1,
      });

      if (entryItems.length > 0) {
        const entryItem = await prisma.entryItem.findFirst({
          where: {
            remainingQuantity: { gt: 0 },
          },
          include: {
            entryReceipt: true,
          },
        });

        if (entryItem) {
          const clearQuantity = 30;
          const clearAmount = clearQuantity * entryItem.unitPrice;

          const clearanceReceipt = await prisma.clearanceReceipt.create({
            data: {
              clearanceNo: `CL-${date.toISOString().split('T')[0].replace(/-/g, '')}-${String(1).padStart(4, '0')}`,
              customerId: entryItem.entryReceipt.customerId,
              carNo: `XYZ-${2000 + i}`,
              clearanceDate: date,
              totalAmount: clearAmount,
              description: 'Partial clearance',
              discount: 500,
              clearedItems: {
                create: [
                  {
                    entryReceiptId: entryItem.entryReceiptId,
                    entryItemId: entryItem.id,
                    clearQuantity: clearQuantity,
                    totalAmount: clearAmount,
                  },
                ],
              },
            },
            include: {
              customer: true,
            },
          });

          // Update remaining quantity
          await prisma.entryItem.update({
            where: { id: entryItem.id },
            data: {
              remainingQuantity: entryItem.remainingQuantity - clearQuantity,
            },
          });

          // Create ledger entry for clearance
          await prisma.ledger.create({
            data: {
              customerId: clearanceReceipt.customerId,
              type: 'clearance',
              clearanceReceiptId: clearanceReceipt.id,
              description: 'Clearance - payment received',
              debitAmount: 0,
              creditAmount: clearAmount - 500, // After discount
            },
          });

          // Create cash book entry for clearance
          await prisma.cashBookEntry.create({
            data: {
              date: date,
              transactionType: 'inflow',
              amount: clearAmount - 500,
              description: `Clearance payment from ${clearanceReceipt.customer.name}`,
              source: 'clearance',
              referenceId: clearanceReceipt.id,
              referenceType: 'clearance_receipt',
              customerId: clearanceReceipt.customerId,
              createdBy: 'system',
            },
          });

          console.log(
            `  ✅ Clearance Receipt created: ₨${clearAmount - 500} (Cash Inflow)`
          );
        }
      }
    }

    // Day 3-7: Direct Cash Payments (Cash Inflow)
    if (i <= 4) {
      const cashAmount = 10000 + i * 1000;
      const customer =
        i % 3 === 0 ? customer1 : i % 3 === 1 ? customer2 : customer3;

      await prisma.ledger.create({
        data: {
          customerId: customer.id,
          type: 'direct_cash',
          description: 'Direct cash payment',
          debitAmount: 0,
          creditAmount: cashAmount,
        },
      });

      await prisma.cashBookEntry.create({
        data: {
          date: date,
          transactionType: 'inflow',
          amount: cashAmount,
          description: `Direct cash payment from ${customer.name}`,
          source: 'ledger',
          customerId: customer.id,
          createdBy: 'system',
        },
      });

      console.log(
        `  ✅ Direct Cash Payment: ₨${cashAmount} from ${customer.name} (Cash Inflow)`
      );
    }

    // Day 1-7: Expenses (Cash Outflow)
    if (i >= 0) {
      const expenses = [
        { category: utilities, amount: 5000, desc: 'Electricity bill' },
        { category: salaries, amount: 15000, desc: 'Staff salary payment' },
        { category: maintenance, amount: 3000, desc: 'Equipment repair' },
      ];

      const expense = expenses[i % 3];

      const expenseRecord = await prisma.expense.create({
        data: {
          date: date,
          categoryId: expense.category.id,
          amount: expense.amount,
          description: expense.desc,
        },
      });

      await prisma.cashBookEntry.create({
        data: {
          date: date,
          transactionType: 'outflow',
          amount: expense.amount,
          description: `${expense.desc} - ${expense.category.name}`,
          source: 'expense',
          referenceId: expenseRecord.id,
          referenceType: 'expense',
          createdBy: 'system',
        },
      });

      console.log(
        `  ✅ Expense: ₨${expense.amount} - ${expense.desc} (Cash Outflow)`
      );
    }

    // Day 2, 4, 6: Manual Transactions
    if (i % 2 === 0 && i > 0) {
      await prisma.cashBookEntry.create({
        data: {
          date: date,
          transactionType: 'inflow',
          amount: 2000,
          description: 'Miscellaneous cash received',
          source: 'manual',
          createdBy: 'admin',
        },
      });

      console.log(`  ✅ Manual Transaction: ₨2,000 (Cash Inflow)`);
    }

    console.log('');
  }

  console.log('✅ Cash book transactions created\n');

  // Create daily summaries
  console.log('📊 Creating daily cash summaries...\n');

  let previousClosingBalance = 50000; // Starting balance

  for (let i = 6; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    date.setHours(0, 0, 0, 0);

    // Calculate totals for the day
    const transactions = await prisma.cashBookEntry.findMany({
      where: {
        date: {
          gte: date,
          lt: new Date(date.getTime() + 24 * 60 * 60 * 1000),
        },
      },
    });

    const totalInflows = transactions
      .filter((t) => t.transactionType === 'inflow')
      .reduce((sum, t) => sum + t.amount, 0);

    const totalOutflows = transactions
      .filter((t) => t.transactionType === 'outflow')
      .reduce((sum, t) => sum + t.amount, 0);

    const closingBalance =
      previousClosingBalance + totalInflows - totalOutflows;

    await prisma.dailyCashSummary.create({
      data: {
        date: date,
        openingBalance: previousClosingBalance,
        totalInflows: totalInflows,
        totalOutflows: totalOutflows,
        closingBalance: closingBalance,
        isReconciled: i > 2, // Reconcile older days
        reconciledBy: i > 2 ? 'admin' : null,
        reconciledAt:
          i > 2 ? new Date(date.getTime() + 20 * 60 * 60 * 1000) : null,
      },
    });

    console.log(
      `  Day ${7 - i}: Opening: ₨${previousClosingBalance.toLocaleString()}, ` +
        `Inflows: ₨${totalInflows.toLocaleString()}, ` +
        `Outflows: ₨${totalOutflows.toLocaleString()}, ` +
        `Closing: ₨${closingBalance.toLocaleString()}`
    );

    previousClosingBalance = closingBalance;
  }

  console.log('\n✅ Daily summaries created\n');

  // Print summary
  console.log('📈 SEEDING SUMMARY\n');
  console.log('='.repeat(50));

  const customerCount = await prisma.customer.count();
  const entryReceiptCount = await prisma.entryReceipt.count();
  const clearanceReceiptCount = await prisma.clearanceReceipt.count();
  const expenseCount = await prisma.expense.count();
  const cashBookEntryCount = await prisma.cashBookEntry.count();
  const dailySummaryCount = await prisma.dailyCashSummary.count();

  console.log(`👥 Customers: ${customerCount}`);
  console.log(`📦 Entry Receipts: ${entryReceiptCount}`);
  console.log(`🚚 Clearance Receipts: ${clearanceReceiptCount}`);
  console.log(`💸 Expenses: ${expenseCount}`);
  console.log(`💰 Cash Book Entries: ${cashBookEntryCount}`);
  console.log(`📊 Daily Summaries: ${dailySummaryCount}`);
  console.log('='.repeat(50));

  const latestSummary = await prisma.dailyCashSummary.findFirst({
    orderBy: { date: 'desc' },
  });

  if (latestSummary) {
    console.log(
      `\n💵 Current Cash Balance: ₨${latestSummary.closingBalance.toLocaleString()}`
    );
  }

  console.log('\n✨ Cash Book seeding completed successfully!\n');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
