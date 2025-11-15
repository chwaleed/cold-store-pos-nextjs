import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { productTypeSchema } from '@/schema/config';

// GET - List all product types
export async function GET() {
  try {
    const productTypes = await prisma.productType.findMany({
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: { subTypes: true },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: productTypes,
    });
  } catch (error) {
    console.error('Error fetching product types:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch product types' },
      { status: 500 }
    );
  }
}

// POST - Create new product type
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = productTypeSchema.parse(body);

    // Check if product type with same name exists
    const existing = await prisma.productType.findFirst({
      where: { name: validatedData.name },
    });

    if (existing) {
      return NextResponse.json(
        { success: false, error: 'Product type with this name already exists' },
        { status: 400 }
      );
    }

    const productType = await prisma.productType.create({
      data: validatedData,
    });

    return NextResponse.json(
      { success: true, data: productType },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating product type:', error);
    if (error instanceof Error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { success: false, error: 'Failed to create product type' },
      { status: 500 }
    );
  }
}
