import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { updateRoomSchema } from '@/schema/config';

// GET - Get single room
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);

    if (isNaN(id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid room ID' },
        { status: 400 }
      );
    }

    const room = await prisma.room.findUnique({
      where: { id },
      include: {
        _count: {
          select: { entryItems: true },
        },
      },
    });

    if (!room) {
      return NextResponse.json(
        { success: false, error: 'Room not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: room,
    });
  } catch (error) {
    console.error('Error fetching room:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch room' },
      { status: 500 }
    );
  }
}

// PUT - Update room
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);

    if (isNaN(id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid room ID' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const validatedData = updateRoomSchema.parse(body);

    // Check if room exists
    const existing = await prisma.room.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Room not found' },
        { status: 404 }
      );
    }

    // Check for duplicate name if name is being updated
    if (validatedData.name && validatedData.name !== existing.name) {
      const duplicate = await prisma.room.findFirst({
        where: { name: validatedData.name },
      });

      if (duplicate) {
        return NextResponse.json(
          { success: false, error: 'Room with this name already exists' },
          { status: 400 }
        );
      }
    }

    const room = await prisma.room.update({
      where: { id },
      data: validatedData,
    });

    return NextResponse.json({
      success: true,
      data: room,
    });
  } catch (error) {
    console.error('Error updating room:', error);
    if (error instanceof Error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { success: false, error: 'Failed to update room' },
      { status: 500 }
    );
  }
}

// DELETE - Delete room (with cascade delete)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);

    if (isNaN(id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid room ID' },
        { status: 400 }
      );
    }

    // Check if room exists
    const room = await prisma.room.findUnique({
      where: { id },
      include: {
        _count: {
          select: { entryItems: true },
        },
      },
    });

    if (!room) {
      return NextResponse.json(
        { success: false, error: 'Room not found' },
        { status: 404 }
      );
    }

    // Delete the Room - database will cascade delete EntryItems
    await prisma.room.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      data: {
        message: `Room and ${room._count.entryItems} related entry items deleted successfully`,
      },
    });
  } catch (error) {
    console.error('Error deleting room:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete room' },
      { status: 500 }
    );
  }
}
