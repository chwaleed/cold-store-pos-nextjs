import { PrismaClient } from '@prisma/client';
import { faker } from '@faker-js/faker';

const prisma = new PrismaClient();

// --- Configuration for Batching and Delays ---

// For simple createMany loops (Cash, Expenses)
const SIMPLE_BATCH_SIZE = 1000;
const DELAY_AFTER_SIMPLE_BATCH = 100; // 100ms

// For complex loops (Receipts)
const COMPLEX_LOOP_BATCH_SIZE = 500;
const DELAY_AFTER_COMPLEX_BATCH = 50; // 50ms

// Helper function for delays
function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Helper function to generate random date between years
function randomDate(startYear: number, endYear: number): Date {
  const start = new Date(startYear, 0, 1);
  const end = new Date(endYear, 11, 31);
  return new Date(
    start.getTime() + Math.random() * (end.getTime() - start.getTime())
  );
}

async function main() {
  console.log('🚀 Starting large-scale database seeding...');
  const startTime = Date.now();

  // Seed ProductTypes (10 types)
  console.log('📦 Seeding Product Types...');
  const productTypeNames = [
    'Potato',
    'Onion',
    'Garlic',
    'Tomato',
    'Carrot',
    'Cabbage',
    'Cauliflower',
    'Peas',
    'Beans',
    'Cucumber',
  ];
  const productTypes = await Promise.all(
    productTypeNames.map((name, idx) =>
      prisma.productType.upsert({
        where: { name },
        update: {},
        create: {
          name,
          doubleRentAfter30Days: idx % 3 === 0, // Every 3rd product has double rent
        },
      })
    )
  );

  // Seed ProductSubTypes (20 subtypes)
  console.log('📦 Seeding Product SubTypes...');
  const subTypeNames = [
    'Cardinal',
    'Red',
    'White',
    'Yellow',
    'Purple',
    'Green',
    'Organic',
    'Premium',
    'Standard',
    'Economy',
    'Large',
    'Medium',
    'Small',
    'Extra Large',
    'Baby',
    'Fresh',
    'Grade A',
    'Grade B',
    'Export Quality',
    'Local',
  ];

  const productSubTypes = [];
  for (let i = 0; i < subTypeNames.length; i++) {
    const productType = productTypes[i % productTypes.length];
    // This loop is small (20 items), no batching needed.
    const subType = await prisma.productSubType.create({
      data: {
        productTypeId: productType.id,
        name: subTypeNames[i],
      },
    });
    productSubTypes.push(subType);
  }

  // Seed Rooms (10 rooms)
  console.log('🏢 Seeding Rooms...');
  const roomNames = [
    'Cold Room 1',
    'Cold Room 2',
    'Cold Room 3',
    'Cold Room 4',
    'Cold Room 5',
    'Hot Room 1',
    'Hot Room 2',
    'Hot Room 3',
    'Hot Room 4',
    'Hot Room 5',
  ];

  const rooms = await Promise.all(
    roomNames.map((name) =>
      prisma.room.upsert({
        where: { name },
        update: {},
        create: {
          name,
          type: name.includes('Cold') ? 'COLD' : 'HOT',
          capacity: faker.number.int({ min: 1000, max: 5000 }),
          isActive: true,
        },
      })
    )
  );

  // Seed PackTypes
  console.log('📦 Seeding Pack Types...');
  const packNames = ['Bori', 'Jali', 'Crate', 'Box'];
  const packs = await Promise.all(
    packNames.map((name) =>
      prisma.packType.upsert({
        where: { name },
        update: {},
        create: { name },
      })
    )
  );

  // Seed Customers (1000 customers)
  console.log('👥 Seeding 1,000 Customers...');
  const customers = [];
  const customerBatchSize = 100; // This batch size is fine

  for (let i = 0; i < 1000; i += customerBatchSize) {
    const batch = [];
    for (let j = 0; j < customerBatchSize && i + j < 1000; j++) {
      batch.push({
        name: faker.person.fullName(),
        fatherName: faker.person.fullName(),
        phone: faker.phone.number('03#########'),
        address: faker.location.streetAddress(),
        village: faker.location.city(),
      });
    }

    await prisma.customer.createMany({
      data: batch,
    });

    // Fetch the created customers to get their IDs
    const fetchedCustomers = await prisma.customer.findMany({
      skip: i,
      take: customerBatchSize,
      orderBy: { id: 'asc' },
    });

    customers.push(...fetchedCustomers);

    if ((i + customerBatchSize) % 500 === 0) {
      console.log(`  ✓ Created ${i + customerBatchSize} customers...`);
    }
    // Add a small delay after each batch of customer creates/fetches
    await delay(50);
  }

  // Seed Expense Categories (100 categories)
  console.log('💰 Seeding 100 Expense Categories...');
  const expenseCategories = [];
  const categoryPrefixes = [
    'Electricity',
    'Water',
    'Maintenance',
    'Labor',
    'Transport',
    'Fuel',
    'Packaging',
    'Security',
    'Cleaning',
    'Office',
    'Marketing',
    'Insurance',
    'Rent',
    'Repairs',
    'Supplies',
    'Equipment',
    'Utilities',
    'Communication',
    'Professional',
    'Legal',
  ];

  // This loop is small (100), no batching needed.
  for (let i = 0; i < 100; i++) {
    const prefix = categoryPrefixes[i % categoryPrefixes.length];
    const category = await prisma.expenseCategory.create({
      data: {
        name: `${prefix} ${Math.floor(i / categoryPrefixes.length) + 1}`,
        description: faker.lorem.sentence(),
        isActive: faker.datatype.boolean(0.9), // 90% active
      },
    });
    expenseCategories.push(category);
  }

  // Seed Entry Receipts with Items and Ledger (100,000 receipts)
  console.log('📝 Seeding 100,000 Entry Receipts with Items and Ledger...');
  console.log(
    `  ℹ️ This is a complex loop. Will pause for ${DELAY_AFTER_COMPLEX_BATCH}ms every ${COMPLEX_LOOP_BATCH_SIZE} receipts.`
  );

  for (let i = 0; i < 100000; i++) {
    const customer = faker.helpers.arrayElement(customers);
    const entryDate = randomDate(2020, 2025);
    const receiptNo = `CS-${entryDate.getFullYear()}${String(
      entryDate.getMonth() + 1
    ).padStart(
      2,
      '0'
    )}${String(entryDate.getDate()).padStart(2, '0')}-${faker.string.numeric(4)}`;

    // Create Entry Receipt
    const entryReceipt = await prisma.entryReceipt.create({
      data: {
        customerId: customer.id,
        receiptNo,
        carNo: faker.vehicle.vrm(),
        entryDate,
        totalAmount: 0, // Will update after items
        description: faker.datatype.boolean(0.3)
          ? faker.lorem.sentence()
          : null,
      },
    });

    // Create Entry Items (2-5 items per receipt)
    const itemCount = faker.number.int({ min: 2, max: 5 });
    let receiptTotal = 0;

    for (let j = 0; j < itemCount; j++) {
      const productType = faker.helpers.arrayElement(productTypes);
      const productSubType = faker.helpers.arrayElement(
        productSubTypes.filter((st) => st.productTypeId === productType.id)
      );
      const pack = faker.helpers.arrayElement(packs);
      const room = faker.helpers.arrayElement(rooms);

      const quantity = faker.number.int({ min: 10, max: 500 });
      const unitPrice = faker.number.float({
        min: 50,
        max: 1000,
        multipleOf: 0.01,
      });
      const totalPrice = quantity * unitPrice;

      // Khali Jali (30% chance)
      const hasKhaliJali = faker.datatype.boolean(0.3);
      let kjQuantity = null;
      let kjUnitPrice = null;
      let kjTotal = null;

      if (hasKhaliJali) {
        kjQuantity = faker.number.int({ min: 5, max: 50 });
        kjUnitPrice = faker.number.float({
          min: 10,
          max: 100,
          multipleOf: 0.01,
        });
        kjTotal = kjQuantity * kjUnitPrice;
      }

      const grandTotal = totalPrice + (kjTotal || 0);

      await prisma.entryItem.create({
        data: {
          entryReceiptId: entryReceipt.id,
          productTypeId: productType.id,
          productSubTypeId: productSubType?.id,
          packTypeId: pack.id,
          roomId: room.id,
          boxNo: faker.datatype.boolean(0.5)
            ? faker.string.alphanumeric(6).toUpperCase()
            : null,
          marka: faker.datatype.boolean(0.5) ? faker.company.name() : null,
          quantity,
          remainingQuantity: quantity,
          unitPrice,
          totalPrice,
          hasKhaliJali,
          kjQuantity,
          remainingKjQuantity: kjQuantity,
          kjUnitPrice,
          kjTotal,
          grandTotal,
        },
      });

      receiptTotal += grandTotal;
    }

    // Update total amount on receipt
    await prisma.entryReceipt.update({
      where: { id: entryReceipt.id },
      data: { totalAmount: receiptTotal },
    });

    // Create Ledger entry for inventory added (DEBIT)
    await prisma.ledger.create({
      data: {
        customerId: customer.id,
        type: 'adding_inventory',
        entryReceiptId: entryReceipt.id,
        description: `Inventory added - Receipt ${receiptNo}`,
        debitAmount: receiptTotal,
        creditAmount: 0,
        isDiscount: false,
        createdAt: entryDate,
      },
    });

    // Progress update every 10,000 receipts
    if ((i + 1) % 10000 === 0) {
      const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
      console.log(`  ✓ Created ${i + 1} entry receipts... (${elapsed}s)`);
    }

    // *** ADDED DELAY ***
    // Pause every N items to let SQLite catch up
    if ((i + 1) % COMPLEX_LOOP_BATCH_SIZE === 0) {
      await delay(DELAY_AFTER_COMPLEX_BATCH);
    }
  }

  // Seed Direct Cash Ledger Entries (random between customers)
  console.log('💵 Seeding 50,000 Direct Cash Ledger Entries...');
  console.log(
    `  ℹ️ This is a simple loop. Will use createMany in batches of ${SIMPLE_BATCH_SIZE}.`
  );

  let cashLedgerBatch = [];
  for (let i = 0; i < 50000; i++) {
    const customer = faker.helpers.arrayElement(customers);
    const cashDate = randomDate(2020, 2025);
    const amount = faker.number.float({
      min: 1000,
      max: 50000,
      multipleOf: 0.01,
    });

    const ledgerData = {
      customerId: customer.id,
      type: 'direct_cash',
      description: faker.helpers.arrayElement([
        'Cash Payment',
        'Advance Payment',
        'Discount Given',
        'Rent Adjustment',
        'Settlement',
      ]),
      debitAmount: 0,
      creditAmount: amount,
      isDiscount: faker.datatype.boolean(0.2), // 20% are discounts
      createdAt: cashDate,
    };

    cashLedgerBatch.push(ledgerData);

    // When batch is full or at the end of the loop, insert the batch
    if (cashLedgerBatch.length >= SIMPLE_BATCH_SIZE || i === 49999) {
      await prisma.ledger.createMany({
        data: cashLedgerBatch,
      });
      cashLedgerBatch = []; // Reset the batch
      console.log(`  ✓ Created ${i + 1} direct cash entries...`);
      // Pause after inserting the batch
      await delay(DELAY_AFTER_SIMPLE_BATCH);
    }
  }

  // Seed Clearance Receipts with Items and Ledger (100,000 receipts)
  console.log('🔄 Seeding 100,000 Clearance Receipts...');
  console.log(
    `  ℹ️ This is a complex loop. Will pause for ${DELAY_AFTER_COMPLEX_BATCH}ms every ${COMPLEX_LOOP_BATCH_SIZE} receipts.`
  );

  for (let i = 0; i < 100000; i++) {
    const customer = faker.helpers.arrayElement(customers);
    const clearanceDate = randomDate(2020, 2025);
    const clearanceNo = `CL-${clearanceDate.getFullYear()}${String(
      clearanceDate.getMonth() + 1
    ).padStart(2, '0')}${String(clearanceDate.getDate()).padStart(
      2,
      '0'
    )}-${faker.string.numeric(4)}`;

    // Create Clearance Receipt
    const clearanceReceipt = await prisma.clearanceReceipt.create({
      data: {
        customerId: customer.id,
        clearanceNo,
        carNo: faker.datatype.boolean(0.7) ? faker.vehicle.vrm() : null,
        clearanceDate,
        totalAmount: 0, // Will update after items
        description: faker.datatype.boolean(0.3)
          ? faker.lorem.sentence()
          : null,
      },
    });

    // Find some entry items for this customer with remaining quantity
    const entryItems = await prisma.entryItem.findMany({
      where: {
        entryReceipt: { customerId: customer.id },
        remainingQuantity: { gt: 0 },
      },
      take: faker.number.int({ min: 1, max: 4 }),
    });

    if (entryItems.length === 0) {
      // No items to clear, but we still created a receipt.
      // Let's delete it to avoid $0 receipts, or just skip.
      await prisma.clearanceReceipt.delete({
        where: { id: clearanceReceipt.id },
      });
      continue; // Skip to next loop iteration
    }

    let clearanceTotal = 0;

    for (const item of entryItems) {
      const maxClearQty = Math.min(
        item.remainingQuantity,
        faker.number.int({ min: 1, max: item.remainingQuantity })
      );
      // Ensure we don't clear 0
      if (maxClearQty < 1) continue;

      const clearQuantity = faker.number.float({
        min: 1,
        max: maxClearQty,
        multipleOf: 0.01,
      });

      let clearKjQuantity = null;
      if (
        item.hasKhaliJali &&
        item.remainingKjQuantity &&
        item.remainingKjQuantity > 0
      ) {
        const maxKjClear = Math.min(
          item.remainingKjQuantity,
          faker.number.int({ min: 1, max: item.remainingKjQuantity })
        );
        if (maxKjClear >= 1) {
          clearKjQuantity = faker.number.float({
            min: 1,
            max: maxKjClear,
            multipleOf: 0.01,
          });
        }
      }

      const productAmount = clearQuantity * item.unitPrice;
      const kjAmount =
        clearKjQuantity && item.kjUnitPrice
          ? clearKjQuantity * item.kjUnitPrice
          : 0;
      const totalAmount = productAmount + kjAmount;

      // Create cleared item
      await prisma.clearedItem.create({
        data: {
          clearanceReceiptId: clearanceReceipt.id,
          entryReceiptId: item.entryReceiptId,
          entryItemId: item.id,
          clearQuantity,
          clearKjQuantity,
          totalAmount,
        },
      });

      // Update remaining quantities on EntryItem
      await prisma.entryItem.update({
        where: { id: item.id },
        data: {
          remainingQuantity: item.remainingQuantity - clearQuantity,
          remainingKjQuantity:
            clearKjQuantity && item.remainingKjQuantity
              ? item.remainingKjQuantity - clearKjQuantity
              : item.remainingKjQuantity,
        },
      });

      clearanceTotal += totalAmount;
    }

    // If clearance total is 0 (e.g. all items were skipped), delete the receipt
    if (clearanceTotal <= 0) {
      await prisma.clearanceReceipt.delete({
        where: { id: clearanceReceipt.id },
      });
      continue;
    }

    // Update total amount on clearance receipt
    await prisma.clearanceReceipt.update({
      where: { id: clearanceReceipt.id },
      data: { totalAmount: clearanceTotal },
    });

    // Create Ledger entry only if amount > 0 (CREDIT)
    await prisma.ledger.create({
      data: {
        customerId: customer.id,
        type: 'clearance',
        clearanceReceiptId: clearanceReceipt.id,
        description: `Clearance - Receipt ${clearanceNo}`,
        debitAmount: 0,
        creditAmount: clearanceTotal,
        isDiscount: false,
        createdAt: clearanceDate,
      },
    });

    if ((i + 1) % 10000 === 0) {
      const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
      console.log(`  ✓ Created ${i + 1} clearance receipts... (${elapsed}s)`);
    }

    // *** ADDED DELAY ***
    // Pause every N items to let SQLite catch up
    if ((i + 1) % COMPLEX_LOOP_BATCH_SIZE === 0) {
      await delay(DELAY_AFTER_COMPLEX_BATCH);
    }
  }

  // Seed Expenses (100,000 records)
  console.log('💸 Seeding 100,000 Expense Records...');
  console.log(
    `  ℹ️ This is a simple loop. Will use createMany in batches of ${SIMPLE_BATCH_SIZE}.`
  );

  let expenseBatch = [];
  for (let i = 0; i < 100000; i++) {
    const category = faker.helpers.arrayElement(expenseCategories);
    const expenseDate = randomDate(2020, 2025);

    const expenseData = {
      date: expenseDate,
      categoryId: category.id,
      amount: faker.number.float({
        min: 100,
        max: 100000,
        multipleOf: 0.01,
      }),
      description: faker.datatype.boolean(0.6) ? faker.lorem.sentence() : null,
    };

    expenseBatch.push(expenseData);

    // When batch is full or at the end of the loop, insert the batch
    if (expenseBatch.length >= SIMPLE_BATCH_SIZE || i === 99999) {
      await prisma.expense.createMany({
        data: expenseBatch,
      });
      expenseBatch = []; // Reset the batch
      console.log(`  ✓ Created ${i + 1} expenses...`);
      // Pause after inserting the batch
      await delay(DELAY_AFTER_SIMPLE_BATCH);
    }
  }

  const totalTime = ((Date.now() - startTime) / 1000).toFixed(2);
  console.log(`\n✅ Seeding completed in ${totalTime} seconds!`);
  console.log('\n📊 Summary:');
  console.log('  - 10 Product Types');
  console.log('  - 20 Product SubTypes');
  console.log('  - 10 Rooms');
  console.log('  - 1,000 Customers');
  console.log('  - ~100,000 Entry Receipts');
  console.log('  - ~100,000 Clearance Receipts (less skips)');
  console.log('  - 100 Expense Categories');
  console.log('  - 100,000 Expense Records');
  console.log('  - 50,000 Direct Cash Entries');
  console.log('  - ~250,000+ Total Ledger Entries');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
