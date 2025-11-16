import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

describe('Ledger System Integration Tests', () => {
  let testCustomerId: number;
  let testEntryReceiptId: number;
  let testClearanceReceiptId: number;
  let testProductTypeId: number;
  let testPackTypeId: number;
  let testRoomId: number;

  beforeAll(async () => {
    // Create test customer
    const customer = await prisma.customer.create({
      data: {
        name: 'Test Customer',
        fatherName: 'Test Father',
        phone: '1234567890',
        village: 'Test Village',
      },
    });
    testCustomerId = customer.id;

    // Create test product type
    const productType = await prisma.productType.create({
      data: {
        name: 'Test Potato',
      },
    });
    testProductTypeId = productType.id;

    // Create test pack type
    const packType = await prisma.packType.create({
      data: {
        name: 'Test Bori',
      },
    });
    testPackTypeId = packType.id;

    // Create test room
    const room = await prisma.room.create({
      data: {
        name: 'Test Room 1',
        type: 'COLD',
      },
    });
    testRoomId = room.id;
  });

  afterAll(async () => {
    // Clean up test data
    await prisma.clearedItem.deleteMany({
      where: {
        clearanceReceipt: {
          customerId: testCustomerId,
        },
      },
    });

    await prisma.entryItem.deleteMany({
      where: {
        entryReceipt: {
          customerId: testCustomerId,
        },
      },
    });

    await prisma.ledger.deleteMany({
      where: { customerId: testCustomerId },
    });

    await prisma.clearanceReceipt.deleteMany({
      where: { customerId: testCustomerId },
    });

    await prisma.entryReceipt.deleteMany({
      where: { customerId: testCustomerId },
    });

    await prisma.customer.delete({
      where: { id: testCustomerId },
    });

    await prisma.productType.delete({
      where: { id: testProductTypeId },
    });

    await prisma.packType.delete({
      where: { id: testPackTypeId },
    });

    await prisma.room.delete({
      where: { id: testRoomId },
    });

    await prisma.$disconnect();
  });

  describe('Entry Receipt Ledger Creation', () => {
    it('should create a ledger entry when creating an entry receipt', async () => {
      // Create entry receipt
      const entryReceipt = await prisma.entryReceipt.create({
        data: {
          receiptNo: 'CS-TEST-0001',
          customerId: testCustomerId,
          carNo: 'ABC-123',
          totalAmount: 5000,
          items: {
            create: {
              productTypeId: testProductTypeId,
              packTypeId: testPackTypeId,
              roomId: testRoomId,
              quantity: 100,
              remainingQuantity: 100,
              unitPrice: 50,
              totalPrice: 5000,
              grandTotal: 5000,
            },
          },
        },
      });

      testEntryReceiptId = entryReceipt.id;

      // Create ledger entry
      await prisma.ledger.create({
        data: {
          customerId: testCustomerId,
          type: 'adding_inventory',
          entryReceiptId: entryReceipt.id,
          description: `Entry Receipt: ${entryReceipt.receiptNo}`,
          debitAmount: entryReceipt.totalAmount,
          creditAmount: 0,
        },
      });

      // Verify ledger entry
      const ledgerEntry = await prisma.ledger.findFirst({
        where: {
          customerId: testCustomerId,
          type: 'adding_inventory',
          entryReceiptId: entryReceipt.id,
        },
      });

      expect(ledgerEntry).toBeTruthy();
      expect(ledgerEntry?.type).toBe('adding_inventory');
      expect(ledgerEntry?.debitAmount).toBe(5000);
      expect(ledgerEntry?.creditAmount).toBe(0);
      expect(ledgerEntry?.entryReceiptId).toBe(entryReceipt.id);
    });

    it('should have correct ledger type for inventory addition', async () => {
      const ledgerEntry = await prisma.ledger.findFirst({
        where: {
          customerId: testCustomerId,
          type: 'adding_inventory',
        },
      });

      expect(ledgerEntry?.type).toBe('adding_inventory');
    });
  });

  describe('Clearance Receipt Ledger Creation', () => {
    it('should create a ledger entry when creating a clearance receipt', async () => {
      // Get entry item
      const entryItem = await prisma.entryItem.findFirst({
        where: {
          entryReceiptId: testEntryReceiptId,
        },
      });

      expect(entryItem).toBeTruthy();

      // Create clearance receipt
      const clearanceReceipt = await prisma.clearanceReceipt.create({
        data: {
          clearanceNo: 'CL-TEST-0001',
          customerId: testCustomerId,
          carNo: 'XYZ-456',
          totalAmount: 2500,
          clearedItems: {
            create: {
              entryReceiptId: testEntryReceiptId,
              entryItemId: entryItem!.id,
              clearQuantity: 50,
              totalAmount: 2500,
            },
          },
        },
      });

      testClearanceReceiptId = clearanceReceipt.id;

      // Update remaining quantity
      await prisma.entryItem.update({
        where: { id: entryItem!.id },
        data: {
          remainingQuantity: {
            decrement: 50,
          },
        },
      });

      // Create ledger entry
      await prisma.ledger.create({
        data: {
          customerId: testCustomerId,
          type: 'clearance',
          clearanceReceiptId: clearanceReceipt.id,
          description: `Clearance: ${clearanceReceipt.clearanceNo}`,
          debitAmount: 0,
          creditAmount: clearanceReceipt.totalAmount,
        },
      });

      // Verify ledger entry
      const ledgerEntry = await prisma.ledger.findFirst({
        where: {
          customerId: testCustomerId,
          type: 'clearance',
          clearanceReceiptId: clearanceReceipt.id,
        },
      });

      expect(ledgerEntry).toBeTruthy();
      expect(ledgerEntry?.type).toBe('clearance');
      expect(ledgerEntry?.debitAmount).toBe(0);
      expect(ledgerEntry?.creditAmount).toBe(2500);
      expect(ledgerEntry?.clearanceReceiptId).toBe(clearanceReceipt.id);
    });
  });

  describe('Direct Cash Ledger Entries', () => {
    it('should create a debit ledger entry for direct cash', async () => {
      const ledgerEntry = await prisma.ledger.create({
        data: {
          customerId: testCustomerId,
          type: 'direct_cash',
          description: 'Cash advance given to customer',
          debitAmount: 1000,
          creditAmount: 0,
        },
      });

      expect(ledgerEntry).toBeTruthy();
      expect(ledgerEntry.type).toBe('direct_cash');
      expect(ledgerEntry.debitAmount).toBe(1000);
      expect(ledgerEntry.creditAmount).toBe(0);
      expect(ledgerEntry.entryReceiptId).toBeNull();
      expect(ledgerEntry.clearanceReceiptId).toBeNull();
    });

    it('should create a credit ledger entry for direct cash', async () => {
      const ledgerEntry = await prisma.ledger.create({
        data: {
          customerId: testCustomerId,
          type: 'direct_cash',
          description: 'Cash payment received from customer',
          debitAmount: 0,
          creditAmount: 1500,
        },
      });

      expect(ledgerEntry).toBeTruthy();
      expect(ledgerEntry.type).toBe('direct_cash');
      expect(ledgerEntry.debitAmount).toBe(0);
      expect(ledgerEntry.creditAmount).toBe(1500);
    });
  });

  describe('Ledger Balance Calculation', () => {
    it('should calculate correct customer balance', async () => {
      const ledgerEntries = await prisma.ledger.findMany({
        where: {
          customerId: testCustomerId,
        },
        orderBy: {
          createdAt: 'asc',
        },
      });

      let balance = 0;
      for (const entry of ledgerEntries) {
        balance += entry.debitAmount - entry.creditAmount;
      }

      // Balance should be: 5000 (entry) - 2500 (clearance) + 1000 (debit cash) - 1500 (credit cash) = 2000
      expect(balance).toBe(2000);
    });
  });

  describe('Ledger Retrieval with Receipts', () => {
    it('should retrieve ledger entries with entry receipt details', async () => {
      const ledgerEntry = await prisma.ledger.findFirst({
        where: {
          customerId: testCustomerId,
          type: 'adding_inventory',
        },
        include: {
          entryReceipt: {
            select: {
              id: true,
              receiptNo: true,
              entryDate: true,
            },
          },
        },
      });

      expect(ledgerEntry).toBeTruthy();
      expect(ledgerEntry?.entryReceipt).toBeTruthy();
      expect(ledgerEntry?.entryReceipt?.receiptNo).toBe('CS-TEST-0001');
    });

    it('should retrieve ledger entries with clearance receipt details', async () => {
      const ledgerEntry = await prisma.ledger.findFirst({
        where: {
          customerId: testCustomerId,
          type: 'clearance',
        },
        include: {
          clearanceReceipt: {
            select: {
              id: true,
              clearanceNo: true,
              clearanceDate: true,
            },
          },
        },
      });

      expect(ledgerEntry).toBeTruthy();
      expect(ledgerEntry?.clearanceReceipt).toBeTruthy();
      expect(ledgerEntry?.clearanceReceipt?.clearanceNo).toBe('CL-TEST-0001');
    });

    it('should retrieve direct cash entries without receipts', async () => {
      const ledgerEntry = await prisma.ledger.findFirst({
        where: {
          customerId: testCustomerId,
          type: 'direct_cash',
        },
        include: {
          entryReceipt: true,
          clearanceReceipt: true,
        },
      });

      expect(ledgerEntry).toBeTruthy();
      expect(ledgerEntry?.entryReceipt).toBeNull();
      expect(ledgerEntry?.clearanceReceipt).toBeNull();
    });
  });

  describe('Ledger Type Validation', () => {
    it('should only allow valid ledger types', async () => {
      const validTypes = ['adding_inventory', 'clearance', 'direct_cash'];

      const ledgerEntries = await prisma.ledger.findMany({
        where: {
          customerId: testCustomerId,
        },
      });

      for (const entry of ledgerEntries) {
        expect(validTypes).toContain(entry.type);
      }
    });
  });

  describe('Ledger Entry Relations', () => {
    it('should maintain correct relations between ledger and entry receipt', async () => {
      const entryReceipt = await prisma.entryReceipt.findUnique({
        where: { id: testEntryReceiptId },
        include: {
          ledgerEntries: true,
        },
      });

      expect(entryReceipt?.ledgerEntries).toBeTruthy();
      expect(entryReceipt?.ledgerEntries.length).toBeGreaterThan(0);
      expect(entryReceipt?.ledgerEntries[0].type).toBe('adding_inventory');
    });

    it('should maintain correct relations between ledger and clearance receipt', async () => {
      const clearanceReceipt = await prisma.clearanceReceipt.findUnique({
        where: { id: testClearanceReceiptId },
        include: {
          ledgerEntries: true,
        },
      });

      expect(clearanceReceipt?.ledgerEntries).toBeTruthy();
      expect(clearanceReceipt?.ledgerEntries.length).toBeGreaterThan(0);
      expect(clearanceReceipt?.ledgerEntries[0].type).toBe('clearance');
    });
  });
});
