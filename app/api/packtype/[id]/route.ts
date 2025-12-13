import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { updatePackTypeSchema } from '@/schema/config';

// GET - Get single pack type
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);

    if (isNaN(id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid pack type ID' },
        { status: 400 }
      );
    }

    const packType = await prisma.packType.findUnique({
      where: { id },
      include: {
        _count: {
          select: { entryItems: true },
        },
      },
    });

    if (!packType) {
      return NextResponse.json(
        { success: false, error: 'Pack type not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: packType,
    });
  } catch (error) {
    console.error('Error fetching pack type:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch pack type' },
      { status: 500 }
    );
  }
}

// PUT - Update pack type
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);

    if (isNaN(id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid pack type ID' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const validatedData = updatePackTypeSchema.parse(body);

    // Check if pack type exists
    const existing = await prisma.packType.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Pack type not found' },
        { status: 404 }
      );
    }

    // Check for duplicate name if name is being updated
    if (validatedData.name && validatedData.name !== existing.name) {
      const duplicate = await prisma.packType.findFirst({
        where: { name: validatedData.name },
      });

      if (duplicate) {
        return NextResponse.json(
          { success: false, error: 'Pack type with this name already exists' },
          { status: 400 }
        );
      }
    }

    const packType = await prisma.packType.update({
      where: { id },
      data: validatedData,
    });

    return NextResponse.json({
      success: true,
      data: packType,
    });
  } catch (error) {
    console.error('Error updating pack type:', error);
    if (error instanceof Error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { success: false, error: 'Failed to update pack type' },
      { status: 500 }
    );
  }
}

// DELETE - Delete pack type (with cascade delete)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);

    if (isNaN(id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid pack type ID' },
        { status: 400 }
      );
    }

    // Check if pack type exists
    const packType = await prisma.packType.findUnique({
      where: { id },
      include: {
        _count: {
          select: { entryItems: true },
        },
      },
    });

    if (!packType) {
      return NextResponse.json(
        { success: false, error: 'Pack type not found' },
        { status: 404 }
      );
    }

    // Delete the PackType - database will cascade delete EntryItems
    await prisma.packType.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      data: {
        message: `Pack type and ${packType._count.entryItems} related entry items deleted successfully`,
      },
    });
  } catch (error) {
    console.error('Error deleting pack type:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete pack type' },
      { status: 500 }
    );
  }
}
