import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { updateCustomerSchema } from '@/schema/customer';

// GET /api/customer/[id] - Get customer details
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const customerId = parseInt(params.id);

    if (isNaN(customerId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid customer ID' },
        { status: 400 }
      );
    }

    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
      include: {
        entryReceipts: {
          orderBy: { entryDate: 'desc' },
          take: 5,
        },
        clearanceReceipts: {
          orderBy: { clearanceDate: 'desc' },
          take: 5,
        },
        _count: {
          select: {
            entryReceipts: true,
            clearanceReceipts: true,
          },
        },
      },
    });

    if (!customer) {
      return NextResponse.json(
        { success: false, error: 'Customer not found' },
        { status: 404 }
      );
    }

    // Calculate customer balance
    const ledgerEntries = await prisma.ledger.findMany({
      where: { customerId },
    });

    const balance = ledgerEntries.reduce(
      (acc, entry) => acc + entry.debitAmount - entry.creditAmount,
      0
    );

    return NextResponse.json({
      success: true,
      data: { ...customer, balance },
    });
  } catch (error) {
    console.error('Error fetching customer:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch customer' },
      { status: 500 }
    );
  }
}

// PUT /api/customer/[id] - Update customer
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const customerId = parseInt(params.id);

    if (isNaN(customerId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid customer ID' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const validatedData = updateCustomerSchema.parse(body);

    // Check if customer exists
    const existingCustomer = await prisma.customer.findUnique({
      where: { id: customerId },
    });

    if (!existingCustomer) {
      return NextResponse.json(
        { success: false, error: 'Customer not found' },
        { status: 404 }
      );
    }

    // Check for duplicate CNIC if being updated
    if (validatedData.cnic && validatedData.cnic !== existingCustomer.cnic) {
      const duplicateCustomer = await prisma.customer.findUnique({
        where: { cnic: validatedData.cnic },
      });

      if (duplicateCustomer) {
        return NextResponse.json(
          { success: false, error: 'Customer with this CNIC already exists' },
          { status: 400 }
        );
      }
    }

    const customer = await prisma.customer.update({
      where: { id: customerId },
      data: validatedData,
    });

    return NextResponse.json({
      success: true,
      data: customer,
      message: 'Customer updated successfully',
    });
  } catch (error: any) {
    console.error('Error updating customer:', error);

    if (error.name === 'ZodError') {
      return NextResponse.json(
        { success: false, error: 'Invalid data', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Failed to update customer' },
      { status: 500 }
    );
  }
}

// DELETE /api/customer/[id] - Delete customer
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const customerId = parseInt(params.id);

    if (isNaN(customerId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid customer ID' },
        { status: 400 }
      );
    }

    // Check if customer has any receipts or ledger entries
    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
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

    if (!customer) {
      return NextResponse.json(
        { success: false, error: 'Customer not found' },
        { status: 404 }
      );
    }

    if (
      customer._count.entryReceipts > 0 ||
      customer._count.clearanceReceipts > 0 ||
      customer._count.ledger > 0
    ) {
      return NextResponse.json(
        {
          success: false,
          error: 'Cannot delete customer with existing transactions',
        },
        { status: 400 }
      );
    }

    await prisma.customer.delete({
      where: { id: customerId },
    });

    return NextResponse.json({
      success: true,
      message: 'Customer deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting customer:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete customer' },
      { status: 500 }
    );
  }
}
