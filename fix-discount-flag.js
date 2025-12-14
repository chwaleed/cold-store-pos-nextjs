// Fix existing discount entries to have isDiscount flag set to true
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function fixDiscountFlags() {
  try {
    console.log('Starting to fix discount flags...');

    // Find all ledger entries with "Discount" in description
    const discountEntries = await prisma.ledger.findMany({
      where: {
        description: {
          contains: 'Discount',
        },
      },
    });

    console.log(`Found ${discountEntries.length} discount entries`);

    // Update each entry to set isDiscount = true
    let updated = 0;
    for (const entry of discountEntries) {
      await prisma.ledger.update({
        where: { id: entry.id },
        data: { isDiscount: true },
      });
      updated++;
      console.log(`Updated entry ${entry.id}: ${entry.description}`);
    }

    console.log(`\nSuccessfully updated ${updated} discount entries`);
    console.log('Done!');
  } catch (error) {
    console.error('Error fixing discount flags:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixDiscountFlags();
