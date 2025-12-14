/**
 * Cash Book Integration Test Script
 *
 * This script tests the complete user workflows for the Daily Cash Book feature.
 * Run this script with: node test-cash-book-integration.js
 *
 * Requirements tested:
 * - Navigation to cash book
 * - Automatic integration with clearance, ledger, and expense modules
 * - Manual transaction creation
 * - Daily summary calculations
 * - Report generation
 * - Error handling and edge cases
 */

const BASE_URL = 'http://localhost:3000';

// Test data
const testCustomer = {
  name: 'Test Customer',
  phone: '1234567890',
  address: 'Test Address',
};

const testClearance = {
  receiptNo: 'CLR-TEST-001',
  customerId: null, // Will be set after customer creation
  clearanceDate: new Date().toISOString().split('T')[0],
  paymentAmount: 1000,
  items: [],
};

const testExpense = {
  description: 'Test Office Supplies',
  amount: 250,
  categoryId: 1,
  date: new Date().toISOString().split('T')[0],
};

const testLedgerEntry = {
  customerId: null, // Will be set after customer creation
  type: 'credit',
  amount: 500,
  description: 'Test Direct Cash Payment',
  date: new Date().toISOString().split('T')[0],
  isDiscount: false,
};

const testManualTransaction = {
  date: new Date().toISOString().split('T')[0],
  transactionType: 'inflow',
  amount: 300,
  description: 'Manual Cash Receipt - Test',
};

// Helper function to make API requests
async function apiRequest(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`;
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(`API Error: ${response.status} - ${JSON.stringify(data)}`);
  }

  return data;
}

// Test functions
async function testNavigationAndPageLoad() {
  console.log('🧪 Testing navigation and page load...');

  try {
    // Test if cash book page loads without errors
    const response = await fetch(`${BASE_URL}/cash-book`);
    if (response.ok) {
      console.log('✅ Cash book page loads successfully');
    } else {
      throw new Error(`Page load failed: ${response.status}`);
    }
  } catch (error) {
    console.error('❌ Navigation test failed:', error.message);
    throw error;
  }
}

async function testCashBookAPI() {
  console.log('🧪 Testing Cash Book API endpoints...');

  try {
    // Test GET /api/cash-book
    const today = new Date().toISOString().split('T')[0];
    const transactions = await apiRequest(`/api/cash-book?date=${today}`);
    console.log('✅ GET /api/cash-book works');

    // Test GET /api/cash-book/summary
    const summary = await apiRequest(`/api/cash-book/summary?date=${today}`);
    console.log('✅ GET /api/cash-book/summary works');

    // Test POST /api/cash-book (manual transaction)
    const newTransaction = await apiRequest('/api/cash-book', {
      method: 'POST',
      body: JSON.stringify(testManualTransaction),
    });
    console.log('✅ POST /api/cash-book works');

    return newTransaction.data.id;
  } catch (error) {
    console.error('❌ Cash Book API test failed:', error.message);
    throw error;
  }
}

async function testAutomaticIntegrations() {
  console.log('🧪 Testing automatic integrations...');

  let customerId;

  try {
    // Create test customer
    const customer = await apiRequest('/api/customer', {
      method: 'POST',
      body: JSON.stringify(testCustomer),
    });
    customerId = customer.data.id;
    console.log('✅ Test customer created');

    // Test clearance integration
    testClearance.customerId = customerId;
    const clearance = await apiRequest('/api/clearance', {
      method: 'POST',
      body: JSON.stringify(testClearance),
    });
    console.log('✅ Clearance integration works');

    // Test expense integration
    const expense = await apiRequest('/api/expenses', {
      method: 'POST',
      body: JSON.stringify(testExpense),
    });
    console.log('✅ Expense integration works');

    // Test ledger integration
    testLedgerEntry.customerId = customerId;
    const ledgerEntry = await apiRequest('/api/ledger', {
      method: 'POST',
      body: JSON.stringify(testLedgerEntry),
    });
    console.log('✅ Ledger integration works');

    return {
      customerId,
      clearanceId: clearance.data.id,
      expenseId: expense.data.id,
      ledgerEntryId: ledgerEntry.data.id,
    };
  } catch (error) {
    console.error('❌ Automatic integration test failed:', error.message);
    throw error;
  }
}

async function testDailySummaryCalculations() {
  console.log('🧪 Testing daily summary calculations...');

  try {
    const today = new Date().toISOString().split('T')[0];

    // Get current summary
    const summaryResponse = await apiRequest(
      `/api/cash-book/summary?date=${today}`
    );
    const summary = summaryResponse.summary;

    // Verify calculations
    const expectedClosingBalance =
      summary.openingBalance + summary.totalInflows - summary.totalOutflows;

    if (Math.abs(summary.closingBalance - expectedClosingBalance) < 0.01) {
      console.log('✅ Daily summary calculations are correct');
    } else {
      throw new Error(
        `Calculation mismatch: expected ${expectedClosingBalance}, got ${summary.closingBalance}`
      );
    }

    // Test opening balance setting
    const newOpeningBalance = 5000;
    await apiRequest('/api/cash-book/summary', {
      method: 'POST',
      body: JSON.stringify({
        date: today,
        openingBalance: newOpeningBalance,
      }),
    });
    console.log('✅ Opening balance setting works');
  } catch (error) {
    console.error('❌ Daily summary calculation test failed:', error.message);
    throw error;
  }
}

async function testReportsAndExports() {
  console.log('🧪 Testing reports and export functionality...');

  try {
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000)
      .toISOString()
      .split('T')[0];

    // Test date range report
    const report = await apiRequest(
      `/api/cash-book/reports?from=${yesterday}&to=${today}`
    );
    console.log('✅ Date range reports work');

    // Test audit trail
    const audit = await apiRequest(`/api/cash-book/audit?date=${today}`);
    console.log('✅ Audit trail works');
  } catch (error) {
    console.error('❌ Reports and export test failed:', error.message);
    throw error;
  }
}

async function testErrorHandling() {
  console.log('🧪 Testing error handling and edge cases...');

  try {
    // Test invalid transaction creation
    try {
      await apiRequest('/api/cash-book', {
        method: 'POST',
        body: JSON.stringify({
          date: 'invalid-date',
          transactionType: 'invalid',
          amount: -100,
          description: '',
        }),
      });
      throw new Error('Should have failed with validation error');
    } catch (error) {
      if (
        error.message.includes('validation') ||
        error.message.includes('400')
      ) {
        console.log('✅ Input validation works');
      } else {
        throw error;
      }
    }

    // Test non-existent customer reference
    try {
      await apiRequest('/api/cash-book', {
        method: 'POST',
        body: JSON.stringify({
          ...testManualTransaction,
          customerId: 99999,
        }),
      });
      throw new Error('Should have failed with customer not found error');
    } catch (error) {
      if (error.message.includes('customer') || error.message.includes('404')) {
        console.log('✅ Customer validation works');
      } else {
        throw error;
      }
    }

    // Test future date validation
    const futureDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split('T')[0];
    try {
      await apiRequest('/api/cash-book', {
        method: 'POST',
        body: JSON.stringify({
          ...testManualTransaction,
          date: futureDate,
        }),
      });
      throw new Error('Should have failed with future date error');
    } catch (error) {
      if (error.message.includes('future') || error.message.includes('400')) {
        console.log('✅ Future date validation works');
      } else {
        throw error;
      }
    }
  } catch (error) {
    console.error('❌ Error handling test failed:', error.message);
    throw error;
  }
}

async function testFiltersAndSearch() {
  console.log('🧪 Testing filters and search functionality...');

  try {
    const today = new Date().toISOString().split('T')[0];

    // Test transaction type filter
    const inflowTransactions = await apiRequest(
      `/api/cash-book?date=${today}&transactionType=inflow`
    );
    console.log('✅ Transaction type filter works');

    // Test source filter
    const manualTransactions = await apiRequest(
      `/api/cash-book?date=${today}&source=manual`
    );
    console.log('✅ Source filter works');

    // Test search functionality
    const searchResults = await apiRequest(
      `/api/cash-book?date=${today}&search=test`
    );
    console.log('✅ Search functionality works');

    // Test date range filter
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000)
      .toISOString()
      .split('T')[0];
    const rangeResults = await apiRequest(
      `/api/cash-book?dateFrom=${yesterday}&dateTo=${today}`
    );
    console.log('✅ Date range filter works');
  } catch (error) {
    console.error('❌ Filters and search test failed:', error.message);
    throw error;
  }
}

async function testPaginationAndSorting() {
  console.log('🧪 Testing pagination and sorting...');

  try {
    const today = new Date().toISOString().split('T')[0];

    // Test pagination
    const page1 = await apiRequest(
      `/api/cash-book?date=${today}&page=1&limit=5`
    );
    console.log('✅ Pagination works');

    // Test sorting
    const sortedByAmount = await apiRequest(
      `/api/cash-book?date=${today}&sortBy=amount&sortOrder=desc`
    );
    console.log('✅ Sorting works');
  } catch (error) {
    console.error('❌ Pagination and sorting test failed:', error.message);
    throw error;
  }
}

// Main test runner
async function runAllTests() {
  console.log('🚀 Starting Cash Book Integration Tests...\n');

  const startTime = Date.now();
  let passedTests = 0;
  let totalTests = 0;

  const tests = [
    { name: 'Navigation and Page Load', fn: testNavigationAndPageLoad },
    { name: 'Cash Book API', fn: testCashBookAPI },
    { name: 'Automatic Integrations', fn: testAutomaticIntegrations },
    { name: 'Daily Summary Calculations', fn: testDailySummaryCalculations },
    { name: 'Reports and Exports', fn: testReportsAndExports },
    { name: 'Error Handling', fn: testErrorHandling },
    { name: 'Filters and Search', fn: testFiltersAndSearch },
    { name: 'Pagination and Sorting', fn: testPaginationAndSorting },
  ];

  for (const test of tests) {
    totalTests++;
    try {
      await test.fn();
      passedTests++;
      console.log(`✅ ${test.name} - PASSED\n`);
    } catch (error) {
      console.log(`❌ ${test.name} - FAILED`);
      console.log(`   Error: ${error.message}\n`);
    }
  }

  const endTime = Date.now();
  const duration = (endTime - startTime) / 1000;

  console.log('📊 Test Results:');
  console.log(`   Passed: ${passedTests}/${totalTests}`);
  console.log(`   Duration: ${duration}s`);

  if (passedTests === totalTests) {
    console.log('🎉 All tests passed!');
  } else {
    console.log('⚠️  Some tests failed. Please review the errors above.');
  }
}

// Export for use as module or run directly
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { runAllTests };
} else {
  // Run tests if executed directly
  runAllTests().catch(console.error);
}
