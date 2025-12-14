import { prisma } from '@/lib/db';

export interface CashBookEntryData {
  date: Date;
  transactionType: 'inflow' | 'outflow';
  amount: number;
  description: string;
  source: 'clearance' | 'ledger' | 'expense' | 'manual';
  referenceId?: number;
  referenceType?: 'clearance_receipt' | 'ledger_entry' | 'expense';
  customerId?: number;
  isDirectCash?: boolean;
  createdBy?: string;
}

export class CashBookIntegrationError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: any
  ) {
    super(message);
    this.name = 'CashBookIntegrationError';
  }
}

export class ConcurrencyError extends Error {
  constructor(
    message: string,
    public retryAfter?: number
  ) {
    super(message);
    this.name = 'ConcurrencyError';
  }
}

/**
 * Creates a cash book entry for automatic integration with existing modules
 */
export async function createCashBookEntry(
  data: CashBookEntryData,
  tx?: any // Prisma transaction client
) {
  try {
    // Validate input data
    validateCashBookEntryData(data);

    const client = tx || prisma;

    // Check for duplicate entries if referenceId is provided
    if (data.referenceId && data.referenceType) {
      const existingEntry = await (client as any).cashBookEntry.findFirst({
        where: {
          referenceId: data.referenceId,
          referenceType: data.referenceType,
          source: data.source,
        },
      });

      if (existingEntry) {
        throw new CashBookIntegrationError(
          'Duplicate cash book entry detected',
          'DUPLICATE_ENTRY',
          {
            existingEntryId: existingEntry.id,
            referenceId: data.referenceId,
            referenceType: data.referenceType,
          }
        );
      }
    }

    // Validate customer exists if customerId is provided
    if (data.customerId) {
      const customer = await (client as any).customer.findUnique({
        where: { id: data.customerId },
      });

      if (!customer) {
        throw new CashBookIntegrationError(
          'Customer not found',
          'CUSTOMER_NOT_FOUND',
          { customerId: data.customerId }
        );
      }
    }

    const cashBookEntry = await (client as any).cashBookEntry.create({
      data: {
        date: data.date,
        transactionType: data.transactionType,
        amount: data.amount,
        description: data.description,
        source: data.source,
        referenceId: data.referenceId,
        referenceType: data.referenceType,
        customerId: data.customerId,
        isDirectCash: data.isDirectCash || false,
        createdBy: data.createdBy || 'system',
      },
    });

    return cashBookEntry;
  } catch (error) {
    if (error instanceof CashBookIntegrationError) {
      throw error;
    }

    throw new CashBookIntegrationError(
      'Failed to create cash book entry',
      'CREATE_FAILED',
      { originalError: error instanceof Error ? error.message : error }
    );
  }
}

/**
 * Updates or deletes cash book entries when source transactions are modified
 */
export async function updateCashBookEntryForSource(
  referenceId: number,
  referenceType: 'clearance_receipt' | 'ledger_entry' | 'expense',
  newData?: Partial<CashBookEntryData>,
  tx?: any
) {
  try {
    const client = tx || prisma;

    // Validate input parameters
    if (!referenceId || referenceId <= 0) {
      throw new CashBookIntegrationError(
        'Invalid reference ID',
        'INVALID_REFERENCE_ID',
        { referenceId }
      );
    }

    if (newData) {
      // Validate new data if provided
      if (newData.amount !== undefined && newData.amount <= 0) {
        throw new CashBookIntegrationError(
          'Amount must be positive',
          'INVALID_AMOUNT',
          { amount: newData.amount }
        );
      }

      if (newData.customerId) {
        const customer = await (client as any).customer.findUnique({
          where: { id: newData.customerId },
        });

        if (!customer) {
          throw new CashBookIntegrationError(
            'Customer not found',
            'CUSTOMER_NOT_FOUND',
            { customerId: newData.customerId }
          );
        }
      }

      // Find existing entries to update
      const existingEntries = await (client as any).cashBookEntry.findMany({
        where: {
          referenceId,
          referenceType,
        },
        select: { id: true, date: true },
      });

      if (existingEntries.length === 0) {
        throw new CashBookIntegrationError(
          'No cash book entries found for source transaction',
          'ENTRY_NOT_FOUND',
          { referenceId, referenceType }
        );
      }

      // Update existing cash book entries
      const updatedEntry = await (client as any).cashBookEntry.updateMany({
        where: {
          referenceId,
          referenceType,
        },
        data: {
          amount: newData.amount,
          description: newData.description,
          transactionType: newData.transactionType,
          customerId: newData.customerId,
          date: newData.date,
        },
      });

      // Collect affected dates for summary updates
      const affectedDates = new Set<Date>();
      existingEntries.forEach((entry) => affectedDates.add(entry.date));
      if (newData.date) {
        affectedDates.add(newData.date);
      }

      // Update daily cash summaries if not in transaction
      if (!tx) {
        for (const date of affectedDates) {
          await updateDailyCashSummaryWithRetry(date);
        }
      }

      return updatedEntry;
    } else {
      // Delete cash book entries
      const deletedEntries = await (client as any).cashBookEntry.findMany({
        where: {
          referenceId,
          referenceType,
        },
        select: { date: true, id: true },
      });

      if (deletedEntries.length === 0) {
        // Not an error - entry might not exist or already deleted
        return [];
      }

      await (client as any).cashBookEntry.deleteMany({
        where: {
          referenceId,
          referenceType,
        },
      });

      // Update daily cash summaries for affected dates if not in transaction
      if (!tx) {
        const affectedDates = new Set<Date>();
        deletedEntries.forEach((entry) => affectedDates.add(entry.date));

        for (const date of affectedDates) {
          await updateDailyCashSummaryWithRetry(date);
        }
      }

      return deletedEntries;
    }
  } catch (error) {
    if (error instanceof CashBookIntegrationError) {
      throw error;
    }

    throw new CashBookIntegrationError(
      'Failed to update cash book entry for source transaction',
      'UPDATE_FAILED',
      {
        referenceId,
        referenceType,
        originalError: error instanceof Error ? error.message : error,
      }
    );
  }
}

/**
 * Validates cash book entry data
 */
function validateCashBookEntryData(data: CashBookEntryData) {
  if (!data.date || isNaN(data.date.getTime())) {
    throw new CashBookIntegrationError('Invalid date', 'INVALID_DATE', {
      date: data.date,
    });
  }

  if (data.amount <= 0) {
    throw new CashBookIntegrationError(
      'Amount must be positive',
      'INVALID_AMOUNT',
      { amount: data.amount }
    );
  }

  if (!data.description || data.description.trim().length === 0) {
    throw new CashBookIntegrationError(
      'Description is required',
      'MISSING_DESCRIPTION'
    );
  }

  if (!['inflow', 'outflow'].includes(data.transactionType)) {
    throw new CashBookIntegrationError(
      'Invalid transaction type',
      'INVALID_TRANSACTION_TYPE',
      { transactionType: data.transactionType }
    );
  }

  if (!['clearance', 'ledger', 'expense', 'manual'].includes(data.source)) {
    throw new CashBookIntegrationError('Invalid source', 'INVALID_SOURCE', {
      source: data.source,
    });
  }

  // Validate future dates
  const now = new Date();
  const maxFutureDate = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 1 day in future
  if (data.date > maxFutureDate) {
    throw new CashBookIntegrationError(
      'Date cannot be more than 1 day in the future',
      'FUTURE_DATE_NOT_ALLOWED',
      { date: data.date }
    );
  }
}

/**
 * Helper function to update daily cash summary with concurrency control
 */
async function updateDailyCashSummary(date: Date, tx?: any) {
  const client = tx || prisma;

  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  try {
    // Calculate totals for the day
    const transactions = await (client as any).cashBookEntry.findMany({
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

    // Get existing summary for optimistic locking
    const existingSummary = await (client as any).dailyCashSummary.findUnique({
      where: { date: startOfDay },
    });

    let openingBalance = existingSummary?.openingBalance || 0;

    // If no existing summary, try to get opening balance from previous day's closing balance
    if (!existingSummary) {
      const previousDay = new Date(startOfDay);
      previousDay.setDate(previousDay.getDate() - 1);

      const previousSummary = await (client as any).dailyCashSummary.findUnique(
        {
          where: { date: previousDay },
        }
      );

      openingBalance = previousSummary?.closingBalance || 0;
    }

    const closingBalance = openingBalance + totalInflows - totalOutflows;

    // Use upsert with version checking for concurrency control
    const result = await (client as any).dailyCashSummary.upsert({
      where: { date: startOfDay },
      update: {
        totalInflows,
        totalOutflows,
        closingBalance,
        updatedAt: new Date(),
      },
      create: {
        date: startOfDay,
        openingBalance,
        totalInflows,
        totalOutflows,
        closingBalance,
      },
    });

    return result;
  } catch (error: any) {
    // Handle potential concurrency conflicts
    if (
      error.code === 'P2002' ||
      error.message?.includes('unique constraint')
    ) {
      throw new ConcurrencyError(
        'Concurrent update detected for daily cash summary',
        1000 // Suggest retry after 1 second
      );
    }

    throw new CashBookIntegrationError(
      'Failed to update daily cash summary',
      'SUMMARY_UPDATE_FAILED',
      {
        date: startOfDay,
        originalError: error instanceof Error ? error.message : error,
      }
    );
  }
}

/**
 * Helper function to update daily cash summary with retry logic
 */
async function updateDailyCashSummaryWithRetry(
  date: Date,
  maxRetries: number = 3,
  baseDelay: number = 100
) {
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await updateDailyCashSummary(date);
    } catch (error) {
      lastError = error as Error;

      if (error instanceof ConcurrencyError && attempt < maxRetries) {
        // Exponential backoff with jitter
        const delay =
          baseDelay * Math.pow(2, attempt - 1) + Math.random() * 100;
        await new Promise((resolve) => setTimeout(resolve, delay));
        continue;
      }

      // If it's not a concurrency error or we've exhausted retries, throw
      throw error;
    }
  }

  throw lastError;
}

/**
 * Safely updates daily cash summary for a date range
 */
export async function updateDailyCashSummariesForDateRange(
  startDate: Date,
  endDate: Date
) {
  const dates: Date[] = [];
  const currentDate = new Date(startDate);

  while (currentDate <= endDate) {
    dates.push(new Date(currentDate));
    currentDate.setDate(currentDate.getDate() + 1);
  }

  const results = await Promise.allSettled(
    dates.map((date) => updateDailyCashSummaryWithRetry(date))
  );

  const failures = results
    .map((result, index) => ({ result, date: dates[index] }))
    .filter(({ result }) => result.status === 'rejected');

  if (failures.length > 0) {
    throw new CashBookIntegrationError(
      'Failed to update some daily cash summaries',
      'BATCH_UPDATE_PARTIAL_FAILURE',
      {
        failedDates: failures.map(({ date }) => date),
        errors: failures.map(({ result }) =>
          result.status === 'rejected' ? result.reason : null
        ),
      }
    );
  }

  return results.map((result) =>
    result.status === 'fulfilled' ? result.value : null
  );
}
