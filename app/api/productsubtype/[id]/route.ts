import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { updateProductSubTypeSchema } from '@/schema/config';

// GET - Get single product subtype
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);

    if (isNaN(id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid product subtype ID' },
        { status: 400 }
      );
    }

    const productSubType = await prisma.productSubType.findUnique({
      where: { id },
      include: {
        productType: true,
        _count: {
          select: { entryItems: true },
        },
      },
    });

    if (!productSubType) {
      return NextResponse.json(
        { success: false, error: 'Product subtype not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: productSubType,
    });
  } catch (error) {
    console.error('Error fetching product subtype:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch product subtype' },
      { status: 500 }
    );
  }
}

// PUT - Update product subtype
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);

    if (isNaN(id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid product subtype ID' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const validatedData = updateProductSubTypeSchema.parse(body);

    // Check if product subtype exists
    const existing = await prisma.productSubType.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Product subtype not found' },
        { status: 404 }
      );
    }

    // If product type is being changed, verify it exists
    if (validatedData.productTypeId) {
      const productType = await prisma.productType.findUnique({
        where: { id: validatedData.productTypeId },
      });

      if (!productType) {
        return NextResponse.json(
          { success: false, error: 'Product type not found' },
          { status: 404 }
        );
      }
    }

    // Check for duplicate name within the same product type
    const productTypeId = validatedData.productTypeId || existing.productTypeId;
    const name = validatedData.name || existing.name;

    if (validatedData.name || validatedData.productTypeId) {
      const duplicate = await prisma.productSubType.findFirst({
        where: {
          name,
          productTypeId,
          id: { not: id },
        },
      });

      if (duplicate) {
        return NextResponse.json(
          {
            success: false,
            error:
              'Product subtype with this name already exists for this product type',
          },
          { status: 400 }
        );
      }
    }

    const productSubType = await prisma.productSubType.update({
      where: { id },
      data: validatedData,
      include: {
        productType: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: productSubType,
    });
  } catch (error) {
    console.error('Error updating product subtype:', error);
    if (error instanceof Error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { success: false, error: 'Failed to update product subtype' },
      { status: 500 }
    );
  }
}

// DELETE - Delete product subtype (with cascade delete)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);

    if (isNaN(id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid product subtype ID' },
        { status: 400 }
      );
    }

    // Check if product subtype exists
    const productSubType = await prisma.productSubType.findUnique({
      where: { id },
      include: {
        _count: {
          select: { entryItems: true },
        },
      },
    });

    if (!productSubType) {
      return NextResponse.json(
        { success: false, error: 'Product subtype not found' },
        { status: 404 }
      );
    }

    // Delete the ProductSubType - database will cascade delete EntryItems
    await prisma.productSubType.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      data: {
        message: `Product subtype and ${productSubType._count.entryItems} related entry items deleted successfully`,
      },
    });
  } catch (error) {
    console.error('Error deleting product subtype:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete product subtype' },
      { status: 500 }
    );
  }
}
