import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { productSubTypeSchema } from '@/schema/config';

// GET - List all product subtypes (optionally filter by product type)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const productTypeId = searchParams.get('productTypeId');
    const includeType = searchParams.get('includeType');

    const where = productTypeId
      ? { productTypeId: parseInt(productTypeId) }
      : {};

    const productSubTypes = await prisma.productSubType.findMany({
      where,
      orderBy: { name: 'desc' },
      include: {
        productType: includeType != 'false' ? true : false,
      },
    });

    return NextResponse.json({
      success: true,
      data: productSubTypes,
    });
  } catch (error) {
    console.error('Error fetching product subtypes:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch product subtypes' },
      { status: 500 }
    );
  }
}

// POST - Create new product subtype
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = productSubTypeSchema.parse(body);

    // Check if product type exists
    const productType = await prisma.productType.findUnique({
      where: { id: validatedData.productTypeId },
    });

    if (!productType) {
      return NextResponse.json(
        { success: false, error: 'Product type not found' },
        { status: 404 }
      );
    }

    // Check if product subtype with same name exists for this product type
    const existing = await prisma.productSubType.findFirst({
      where: {
        name: validatedData.name,
        productTypeId: validatedData.productTypeId,
      },
    });

    if (existing) {
      return NextResponse.json(
        {
          success: false,
          error:
            'Product subtype with this name already exists for this product type',
        },
        { status: 400 }
      );
    }

    const productSubType = await prisma.productSubType.create({
      data: validatedData,
      include: {
        productType: true,
      },
    });

    return NextResponse.json(
      { success: true, data: productSubType },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating product subtype:', error);
    if (error instanceof Error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { success: false, error: 'Failed to create product subtype' },
      { status: 500 }
    );
  }
}
