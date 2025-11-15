import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET all expense categories
export async function GET(request: NextRequest) {
  try {
    const categories = await prisma.expenseCategory.findMany({
      orderBy: {
        name: 'asc',
      },
    });

    return NextResponse.json({
      success: true,
      data: categories,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// POST create new expense category
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, description, isActive } = body;

    const category = await prisma.expenseCategory.create({
      data: {
        name,
        description,
        isActive: isActive ?? true,
      },
    });

    return NextResponse.json({
      success: true,
      data: category,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
