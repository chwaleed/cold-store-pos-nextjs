import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { updateProductTypeSchema } from '@/schema/config';

// GET - Get single product type
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);

    if (isNaN(id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid product type ID' },
        { status: 400 }
      );
    }

    const productType = await prisma.productType.findUnique({
      where: { id },
      include: {
        subTypes: {
          orderBy: { name: 'asc' },
        },
        _count: {
          select: {
            subTypes: true,
            entryItems: true,
          },
        },
      },
    });

    if (!productType) {
      return NextResponse.json(
        { success: false, error: 'Product type not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: productType,
    });
  } catch (error) {
    console.error('Error fetching product type:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch product type' },
      { status: 500 }
    );
  }
}

// PUT - Update product type
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);

    if (isNaN(id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid product type ID' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const validatedData = updateProductTypeSchema.parse(body);

    // Check if product type exists
    const existing = await prisma.productType.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Product type not found' },
        { status: 404 }
      );
    }

    // Check for duplicate name if name is being updated
    if (validatedData.name && validatedData.name !== existing.name) {
      const duplicate = await prisma.productType.findFirst({
        where: { name: validatedData.name },
      });

      if (duplicate) {
        return NextResponse.json(
          {
            success: false,
            error: 'Product type with this name already exists',
          },
          { status: 400 }
        );
      }
    }

    const productType = await prisma.productType.update({
      where: { id },
      data: validatedData,
    });

    return NextResponse.json({
      success: true,
      data: productType,
    });
  } catch (error) {
    console.error('Error updating product type:', error);
    if (error instanceof Error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { success: false, error: 'Failed to update product type' },
      { status: 500 }
    );
  }
}

// DELETE - Delete product type (with cascade delete)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);

    if (isNaN(id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid product type ID' },
        { status: 400 }
      );
    }

    // Check if product type exists
    const productType = await prisma.productType.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            subTypes: true,
            entryItems: true,
          },
        },
      },
    });

    if (!productType) {
      return NextResponse.json(
        { success: false, error: 'Product type not found' },
        { status: 404 }
      );
    }

    // Delete the ProductType - database will cascade delete ProductSubTypes and EntryItems
    await prisma.productType.delete({
      where: { id },
    });

    const totalDeleted =
      productType._count.subTypes + productType._count.entryItems;

    return NextResponse.json({
      success: true,
      data: {
        message: `Product type and ${totalDeleted} related records deleted successfully`,
      },
    });
  } catch (error) {
    console.error('Error deleting product type:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete product type' },
      { status: 500 }
    );
  }
}
