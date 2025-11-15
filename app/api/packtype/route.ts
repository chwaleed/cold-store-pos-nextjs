import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { packTypeSchema } from '@/schema/config';

// GET - List all pack types
export async function GET() {
  try {
    const packTypes = await prisma.packType.findMany({
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: { entryItems: true },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: packTypes,
    });
  } catch (error) {
    console.error('Error fetching pack types:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch pack types' },
      { status: 500 }
    );
  }
}

// POST - Create new pack type
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = packTypeSchema.parse(body);

    // Check if pack type with same name exists
    const existing = await prisma.packType.findFirst({
      where: { name: validatedData.name },
    });

    if (existing) {
      return NextResponse.json(
        { success: false, error: 'Pack type with this name already exists' },
        { status: 400 }
      );
    }

    const packType = await prisma.packType.create({
      data: validatedData,
    });

    return NextResponse.json(
      { success: true, data: packType },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating pack type:', error);
    if (error instanceof Error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { success: false, error: 'Failed to create pack type' },
      { status: 500 }
    );
  }
}
