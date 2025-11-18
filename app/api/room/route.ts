import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { roomSchema } from '@/schema/config';

// GET - List all rooms
export async function GET() {
  try {
    const rooms = await prisma.room.findMany({
      orderBy: { name: 'desc' },
      include: {
        _count: {
          select: { entryItems: true },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: rooms,
    });
  } catch (error) {
    console.error('Error fetching rooms:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch rooms' },
      { status: 500 }
    );
  }
}

// POST - Create new room
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = roomSchema.parse(body);

    // Check if room with same name exists
    const existing = await prisma.room.findFirst({
      where: { name: validatedData.name },
    });

    if (existing) {
      return NextResponse.json(
        { success: false, error: 'Room with this name already exists' },
        { status: 400 }
      );
    }

    const room = await prisma.room.create({
      data: validatedData,
    });

    return NextResponse.json({ success: true, data: room }, { status: 201 });
  } catch (error) {
    console.error('Error creating room:', error);
    if (error instanceof Error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { success: false, error: 'Failed to create room' },
      { status: 500 }
    );
  }
}
