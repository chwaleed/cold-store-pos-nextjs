import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding Cold Store Management System database...');

  // Clear existing data
  await prisma.ledger.deleteMany();
  await prisma.clearedItem.deleteMany();
  await prisma.clearanceReceipt.deleteMany();
  await prisma.entryItem.deleteMany();
  await prisma.entryReceipt.deleteMany();
  await prisma.productSubType.deleteMany();
  await prisma.productType.deleteMany();
  await prisma.packType.deleteMany();
  await prisma.room.deleteMany();
  await prisma.customer.deleteMany();

  console.log('Cleared existing data');

  // Seed Product Types
  const potato = await prisma.productType.create({
    data: {
      name: 'Potato',
      subTypes: {
        create: [
          { name: 'Cardinal' },
          { name: 'Red' },
          { name: 'White' }
        ]
      }
    }
  });

  const onion = await prisma.productType.create({
    data: {
      name: 'Onion',
      subTypes: {
        create: [
          { name: 'Red' },
          { name: 'White' },
          { name: 'Yellow' }
        ]
      }
    }
  });

  const garlic = await prisma.productType.create({
    data: {
      name: 'Garlic',
      subTypes: {
        create: [
          { name: 'Chinese' },
          { name: 'Local' }
        ]
      }
    }
  });

  console.log('✓ Created 3 Product Types with subtypes');

  // Seed Rooms
  const coldRoom1 = await prisma.room.create({
    data: {
      name: 'Cold Room 1',
      type: 'COLD',
      capacity: 5000,
      isActive: true
    }
  });

  const coldRoom2 = await prisma.room.create({
    data: {
      name: 'Cold Room 2',
      type: 'COLD',
      capacity: 3000,
      isActive: true
    }
  });

  const hotRoom1 = await prisma.room.create({
    data: {
      name: 'Hot Room 1',
      type: 'HOT',
      capacity: 2000,
      isActive: true
    }
  });

  console.log('✓ Created 3 Rooms (2 Cold, 1 Hot)');

  // Seed Pack Types
  const bori = await prisma.packType.create({
    data: {
      name: 'Bori',
      rentPerDay: 2.0 // 2 PKR per day
    }
  });

  const jali = await prisma.packType.create({
    data: {
      name: 'Jali',
      rentPerDay: 1.5 // 1.5 PKR per day
    }
  });

  console.log('✓ Created 2 Pack Types');

  // Seed Sample Customers
  const customer1 = await prisma.customer.create({
    data: {
      name: 'Muhammad Ahmed',
      fatherName: 'Abdul Rahman',
      cnic: '1234567890123',
      phone: '03001234567',
      address: 'Main Bazar',
      village: 'Village A'
    }
  });

  const customer2 = await prisma.customer.create({
    data: {
      name: 'Ali Hassan',
      fatherName: 'Hassan Ali',
      cnic: '3210987654321',
      phone: '03009876543',
      address: 'Chowk Road',
      village: 'Village B'
    }
  });

  const customer3 = await prisma.customer.create({
    data: {
      name: 'Fatima Khan',
      fatherName: 'Khan Muhammad',
      phone: '03111234567',
      address: 'Market Street',
      village: 'Village C'
    }
  });

  console.log('✓ Created 3 Sample Customers');

  console.log('\n✅ Database seeding completed successfully!');
  console.log('\nSummary:');
  console.log('- Product Types: 3 (Potato, Onion, Garlic)');
  console.log('- Product SubTypes: 8');
  console.log('- Rooms: 3 (2 Cold, 1 Hot)');
  console.log('- Pack Types: 2 (Bori @ 2 PKR/day, Jali @ 1.5 PKR/day)');
  console.log('- Customers: 3');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
