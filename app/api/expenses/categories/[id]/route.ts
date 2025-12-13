import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET category by ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const category = await prisma.expenseCategory.findUnique({
      where: { id: parseInt(params.id) },
    });

    if (!category) {
      return NextResponse.json(
        { success: false, error: 'Category not found' },
        { status: 404 }
      );
    }

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

// PUT update category
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { name, description, isActive } = body;

    const category = await prisma.expenseCategory.update({
      where: { id: parseInt(params.id) },
      data: {
        name,
        description,
        isActive,
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

// DELETE category (with cascade delete)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const categoryId = parseInt(params.id);

    // Check if category exists and get expense count
    const category = await prisma.expenseCategory.findUnique({
      where: { id: categoryId },
      include: {
        _count: {
          select: { expenses: true },
        },
      },
    });

    if (!category) {
      return NextResponse.json(
        { success: false, error: 'Category not found' },
        { status: 404 }
      );
    }

    // Delete category - this will cascade delete all related expenses
    await prisma.expenseCategory.delete({
      where: { id: categoryId },
    });

    return NextResponse.json({
      success: true,
      message: `Category and ${category._count.expenses} related expenses deleted successfully`,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
