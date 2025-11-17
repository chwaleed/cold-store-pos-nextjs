import { PrismaClient } from '@prisma/client';
import { faker } from '@faker-js/faker';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Seed ProductTypes
  const productTypeNames = ['Potato', 'Onion', 'Garlic'];
  const productTypes = await Promise.all(
    productTypeNames.map((name) =>
      prisma.productType.upsert({
        where: { name },
        update: {},
        create: { name },
      })
    )
  );

  // Seed Rooms
  const roomNames = ['Cold Room 1', 'Cold Room 2', 'Hot Room 1'];
  const rooms = await Promise.all(
    roomNames.map((name) =>
      prisma.room.upsert({
        where: { name },
        update: {},
        create: { name, type: name.includes('Cold') ? 'COLD' : 'HOT' },
      })
    )
  );

  // Seed PackTypes
  const packNames = ['Bori', 'Jali'];
  const packs = await Promise.all(
    packNames.map((name) =>
      prisma.packType.upsert({
        where: { name },
        update: {},
        create: { name },
      })
    )
  );

  // Seed Customers
  const customerCount = 50; // enough for testing
  const customers = [];
  for (let i = 0; i < customerCount; i++) {
    const customer = await prisma.customer.create({
      data: {
        name: faker.person.fullName(),
        fatherName: faker.person.fullName(),
        phone: faker.phone.number('03#########'),
        address: faker.location.streetAddress(),
        village: faker.location.city(),
      },
    });
    customers.push(customer);
  }

  // Seed EntryReceipts and EntryItems
  for (const customer of customers) {
    const receiptCount = faker.number.int({ min: 3, max: 7 }); // each customer has 3-7 receipts
    for (let i = 0; i < receiptCount; i++) {
      const entryReceipt = await prisma.entryReceipt.create({
        data: {
          customerId: customer.id,
          receiptNo: `CS-${faker.date.anytime().getTime()}-${i}`,
          carNo: faker.vehicle.vin(),
          entryDate: faker.date.past(),
          totalAmount: 0, // will update later
        },
      });

      const itemCount = faker.number.int({ min: 2, max: 5 }); // each receipt has 2-5 items
      let receiptTotal = 0;

      for (let j = 0; j < itemCount; j++) {
        const productType = faker.helpers.arrayElement(productTypes);
        const pack = faker.helpers.arrayElement(packs);
        const room = faker.helpers.arrayElement(rooms);

        const quantity = faker.number.int({ min: 10, max: 100 });
        const unitPrice = faker.number.float({
          min: 50,
          max: 500,
          precision: 0.01,
        });
        const totalPrice = quantity * unitPrice;

        await prisma.entryItem.create({
          data: {
            entryReceiptId: entryReceipt.id,
            productTypeId: productType.id,
            packTypeId: pack.id,
            roomId: room.id,
            quantity,
            remainingQuantity: quantity,
            unitPrice,
            totalPrice,
            grandTotal: totalPrice,
          },
        });

        receiptTotal += totalPrice;
      }

      // Update totalAmount on receipt
      await prisma.entryReceipt.update({
        where: { id: entryReceipt.id },
        data: { totalAmount: receiptTotal },
      });
    }
  }

  // Seed ClearanceReceipts and ClearedItems
  for (const customer of customers) {
    const clearanceCount = faker.number.int({ min: 2, max: 5 });
    for (let i = 0; i < clearanceCount; i++) {
      const clearanceReceipt = await prisma.clearanceReceipt.create({
        data: {
          customerId: customer.id,
          clearanceNo: `CL-${faker.date.anytime().getTime()}-${i}`,
          totalAmount: 0,
        },
      });

      // Pick some random EntryItems to clear
      const entryItems = await prisma.entryItem.findMany({
        where: { entryReceipt: { customerId: customer.id } },
        take: faker.number.int({ min: 1, max: 3 }),
      });

      let clearanceTotal = 0;

      for (const item of entryItems) {
        const clearQuantity = faker.number.int({
          min: 1,
          max: Math.floor(item.remainingQuantity),
        });
        const amount = clearQuantity * item.unitPrice;

        await prisma.clearedItem.create({
          data: {
            clearanceReceiptId: clearanceReceipt.id,
            entryReceiptId: item.entryReceiptId,
            entryItemId: item.id,
            clearQuantity,
            totalAmount: amount,
          },
        });

        // Update remaining quantity on EntryItem
        await prisma.entryItem.update({
          where: { id: item.id },
          data: { remainingQuantity: item.remainingQuantity - clearQuantity },
        });

        clearanceTotal += amount;
      }

      // Update totalAmount on clearanceReceipt
      await prisma.clearanceReceipt.update({
        where: { id: clearanceReceipt.id },
        data: { totalAmount: clearanceTotal },
      });
    }
  }

  console.log('✅ Seeding completed!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
