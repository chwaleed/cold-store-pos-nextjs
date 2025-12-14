import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import {
  manualTransactionInputSchema,
  cashBookFiltersSchema,
} from '@/schema/cash-book';
import {
  CashBookIntegrationError,
  ConcurrencyError,
} from '@/lib/cash-book-integration';

// GET /api/cash-book - Get cash transactions for a specific date
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;

    // Parse and validate query parameters
    const queryParams = {
      date: searchParams.get('date'),
      transactionType: searchParams.get('transactionType') || 'all',
      source: searchParams.get('source') || 'all',
      customerId: searchParams.get('customerId')
        ? parseInt(searchParams.get('customerId')!)
        : undefined,
      search: searchParams.get('search') || undefined,
      dateFrom: searchParams.get('dateFrom') || undefined,
      dateTo: searchParams.get('dateTo') || undefined,
      sortBy: searchParams.get('sortBy') || 'date',
      sortOrder: searchParams.get('sortOrder') || 'asc',
      page: parseInt(searchParams.get('page') || '1'),
      limit: parseInt(searchParams.get('limit') || '50'),
    };

    // Validate filters
    const validatedFilters = cashBookFiltersSchema.parse(queryParams);

    // Build where clause with filters
    const where: any = {};

    // Date filtering - support both single date and date range
    if (queryParams.date) {
      const date = new Date(queryParams.date);
      if (isNaN(date.getTime())) {
        return NextResponse.json(
          {
            success: false,
            error: 'Invalid date format. Use YYYY-MM-DD format.',
            code: 'INVALID_DATE_FORMAT',
          },
          { status: 400 }
        );
      }

      // Set date range for the entire day
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

      where.date = {
        gte: startOfDay,
        lte: endOfDay,
      };
    } else if (queryParams.dateFrom || queryParams.dateTo) {
      // Date range filtering
      const dateFilter: any = {};

      if (queryParams.dateFrom) {
        const fromDate = new Date(queryParams.dateFrom);
        if (!isNaN(fromDate.getTime())) {
          fromDate.setHours(0, 0, 0, 0);
          dateFilter.gte = fromDate;
        }
      }

      if (queryParams.dateTo) {
        const toDate = new Date(queryParams.dateTo);
        if (!isNaN(toDate.getTime())) {
          toDate.setHours(23, 59, 59, 999);
          dateFilter.lte = toDate;
        }
      }

      if (Object.keys(dateFilter).length > 0) {
        where.date = dateFilter;
      }
    }

    if (
      validatedFilters.transactionType &&
      validatedFilters.transactionType !== 'all'
    ) {
      where.transactionType = validatedFilters.transactionType;
    }

    if (validatedFilters.source && validatedFilters.source !== 'all') {
      where.source = validatedFilters.source;
    }

    if (validatedFilters.customerId) {
      where.customerId = validatedFilters.customerId;
    }

    // Search functionality
    if (queryParams.search && queryParams.search.trim()) {
      const searchTerm = queryParams.search.trim();
      where.OR = [
        {
          description: {
            contains: searchTerm,
            mode: 'insensitive',
          },
        },
        {
          customer: {
            name: {
              contains: searchTerm,
              mode: 'insensitive',
            },
          },
        },
        {
          customer: {
            phone: {
              contains: searchTerm,
              mode: 'insensitive',
            },
          },
        },
      ];

      // If search term is a number, also search by amount
      const numericSearch = parseFloat(searchTerm);
      if (!isNaN(numericSearch)) {
        where.OR.push({
          amount: numericSearch,
        });
      }
    }

    // Build order by clause
    let orderBy: any = { createdAt: 'desc' }; // Default to latest first

    if (queryParams.sortBy && queryParams.sortBy !== 'date') {
      switch (queryParams.sortBy) {
        case 'amount':
          orderBy = { amount: queryParams.sortOrder || 'desc' };
          break;
        case 'description':
          orderBy = { description: queryParams.sortOrder || 'asc' };
          break;
        default:
          orderBy = { createdAt: queryParams.sortOrder || 'desc' };
      }
    } else {
      // For date sorting, use createdAt
      orderBy = { createdAt: queryParams.sortOrder || 'desc' };
    }

    const skip = (validatedFilters.page! - 1) * validatedFilters.limit!;

    const [transactions, total] = await Promise.all([
      prisma.cashBookEntry.findMany({
        where,
        skip,
        take: validatedFilters.limit,
        orderBy,
        include: {
          customer: {
            select: {
              id: true,
              name: true,
              phone: true,
            },
          },
        },
      }),
      prisma.cashBookEntry.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: transactions,
      pagination: {
        page: validatedFilters.page,
        limit: validatedFilters.limit,
        total,
        totalPages: Math.ceil(total / validatedFilters.limit!),
      },
      filters: {
        date: queryParams.date,
        dateFrom: queryParams.dateFrom,
        dateTo: queryParams.dateTo,
        transactionType: validatedFilters.transactionType,
        source: validatedFilters.source,
        customerId: validatedFilters.customerId,
        search: queryParams.search,
        sortBy: queryParams.sortBy,
        sortOrder: queryParams.sortOrder,
      },
    });
  } catch (error: any) {
    console.error('Error fetching cash book transactions:', error);

    if (error.name === 'ZodError') {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid query parameters',
          code: 'VALIDATION_ERROR',
          details: error.errors,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch cash book transactions',
        code: 'FETCH_FAILED',
      },
      { status: 500 }
    );
  }
}

// POST /api/cash-book - Create manual cash transaction
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate request body structure
    if (!body || typeof body !== 'object') {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid request body',
          code: 'INVALID_REQUEST_BODY',
        },
        { status: 400 }
      );
    }

    const validatedData = manualTransactionInputSchema.parse(body);

    // Validate customer exists if customerId is provided
    if (validatedData.customerId) {
      const customer = await prisma.customer.findUnique({
        where: { id: validatedData.customerId },
      });

      if (!customer) {
        return NextResponse.json(
          {
            success: false,
            error: 'Customer not found',
            code: 'CUSTOMER_NOT_FOUND',
            details: { customerId: validatedData.customerId },
          },
          { status: 404 }
        );
      }
    }

    // Use transaction for data consistency
    const result = await prisma.$transaction(async (tx) => {
      // Check for potential duplicate entries (same description, amount, date, customer)
      const existingEntry = await tx.cashBookEntry.findFirst({
        where: {
          description: validatedData.description,
          amount: validatedData.amount,
          date: validatedData.date,
          customerId: validatedData.customerId,
          source: 'manual',
          createdAt: {
            gte: new Date(Date.now() - 60000), // Within last minute
          },
        },
      });

      if (existingEntry) {
        throw new CashBookIntegrationError(
          'Potential duplicate transaction detected',
          'DUPLICATE_TRANSACTION',
          { existingEntryId: existingEntry.id }
        );
      }

      // Create the cash book entry
      const cashBookEntry = await tx.cashBookEntry.create({
        data: {
          date: validatedData.date,
          transactionType: validatedData.transactionType,
          amount: validatedData.amount,
          description: validatedData.description.trim(),
          source: 'manual',
          customerId: validatedData.customerId,
          createdBy: 'system', // TODO: Replace with actual user when auth is implemented
        },
        include: {
          customer: {
            select: {
              id: true,
              name: true,
              phone: true,
            },
          },
        },
      });

      // Create ledger entry if customer is selected
      if (validatedData.customerId) {
        await tx.ledger.create({
          data: {
            customerId: validatedData.customerId,
            type: 'direct_cash',
            description: validatedData.description.trim(),
            // Inflow = customer paid us (credit), Outflow = we paid customer (debit)
            debitAmount:
              validatedData.transactionType === 'outflow'
                ? validatedData.amount
                : 0,
            creditAmount:
              validatedData.transactionType === 'inflow'
                ? validatedData.amount
                : 0,
          },
        });
      }

      return cashBookEntry;
    });

    // Update daily cash summary outside transaction to avoid deadlocks
    try {
      await updateDailyCashSummary(validatedData.date);
    } catch (summaryError) {
      console.warn('Failed to update daily cash summary:', summaryError);
      // Don't fail the entire operation for summary update issues
    }

    return NextResponse.json(
      {
        success: true,
        data: result,
        message: 'Manual cash transaction created successfully',
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Error creating manual cash transaction:', error);

    if (error.name === 'ZodError') {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid data',
          code: 'VALIDATION_ERROR',
          details: error.errors,
        },
        { status: 400 }
      );
    }

    if (error instanceof CashBookIntegrationError) {
      const statusCode = error.code === 'DUPLICATE_TRANSACTION' ? 409 : 400;
      return NextResponse.json(
        {
          success: false,
          error: error.message,
          code: error.code,
          details: error.details,
        },
        { status: statusCode }
      );
    }

    if (error instanceof ConcurrencyError) {
      return NextResponse.json(
        {
          success: false,
          error: error.message,
          code: 'CONCURRENCY_ERROR',
          retryAfter: error.retryAfter,
        },
        { status: 409 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create manual cash transaction',
        code: 'CREATE_FAILED',
      },
      { status: 500 }
    );
  }
}

// Helper function to update daily cash summary
async function updateDailyCashSummary(date: Date) {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  // Calculate totals for the day
  const transactions = await prisma.cashBookEntry.findMany({
    where: {
      date: {
        gte: startOfDay,
        lte: endOfDay,
      },
    },
  });

  const totalInflows = transactions
    .filter((t: any) => t.transactionType === 'inflow')
    .reduce((sum: number, t: any) => sum + t.amount, 0);

  const totalOutflows = transactions
    .filter((t: any) => t.transactionType === 'outflow')
    .reduce((sum: number, t: any) => sum + t.amount, 0);

  // Get or create daily summary
  const existingSummary = await prisma.dailyCashSummary.findUnique({
    where: { date: startOfDay },
  });

  let openingBalance = existingSummary?.openingBalance || 0;

  // If no existing summary, try to get opening balance from previous day's closing balance
  if (!existingSummary) {
    const previousDay = new Date(startOfDay);
    previousDay.setDate(previousDay.getDate() - 1);

    const previousSummary = await prisma.dailyCashSummary.findUnique({
      where: { date: previousDay },
    });

    openingBalance = previousSummary?.closingBalance || 0;
  }

  const closingBalance = openingBalance + totalInflows - totalOutflows;

  await prisma.dailyCashSummary.upsert({
    where: { date: startOfDay },
    update: {
      totalInflows,
      totalOutflows,
      closingBalance,
    },
    create: {
      date: startOfDay,
      openingBalance,
      totalInflows,
      totalOutflows,
      closingBalance,
    },
  });
}
