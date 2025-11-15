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

// DELETE category
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check if category has expenses
    const expenseCount = await prisma.expense.count({
      where: { categoryId: parseInt(params.id) },
    });

    if (expenseCount > 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Cannot delete category with existing expenses',
        },
        { status: 400 }
      );
    }

    await prisma.expenseCategory.delete({
      where: { id: parseInt(params.id) },
    });

    return NextResponse.json({
      success: true,
      message: 'Category deleted successfully',
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
