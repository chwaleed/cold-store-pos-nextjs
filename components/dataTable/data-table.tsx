import React from 'react';

/**
 * Reusable Data Table Component
 *
 * @param {Array} columns - Array of column definitions
 *   Each column should have:
 *   - name: string (column header text)
 *   - accessor: string | function (key to access data or render function)
 *   - id: string (unique identifier)
 *   - className?: string (optional CSS classes for cells)
 *   - headerClassName?: string (optional CSS classes for header)
 *
 * @param {Array} data - Array of data objects
 * @param {boolean} loading - Show skeleton loaders when true
 * @param {string} emptyMessage - Message to show when no data (default: "No data found")
 * @param {number} skeletonRows - Number of skeleton rows to show while loading (default: 5)
 * @param {number} currentPage - Current page number (1-indexed)
 * @param {number} lastPage - Total number of pages
 * @param {function} onPageChange - Callback function when page changes, receives pageNo as parameter
 */

type DataTableProps = {
  columns: {
    name: string;
    accessor: string | ((row: any, rowIndex: number) => React.ReactNode);
    id: string;
    className?: string;
  }[];
  data: any[];
  loading?: boolean;
  emptyMessage?: string;
  skeletonRows?: number;
  currentPage?: number;
  lastPage?: number;
  onPageChange?: (pageNo: number) => void;
};
const DataTable = ({
  columns = [],
  data = [],
  loading = false,
  emptyMessage = 'No data found',
  skeletonRows = 5,
  currentPage,
  lastPage,
  onPageChange,
}: DataTableProps) => {
  // Render cell content based on accessor type
  const renderCell = (row, column, rowIndex) => {
    if (typeof column.accessor === 'function') {
      return column.accessor(row, rowIndex);
    }
    return row[column.accessor] ?? '-';
  };

  // Render skeleton rows during loading
  const renderSkeletonRows = () => {
    return Array.from({ length: skeletonRows }).map((_, index) => (
      <tr key={`skeleton-${index}`}>
        {columns.map((column) => (
          <td key={column.id} className={`px-4 py-3 ${column.className || ''}`}>
            <div className="h-4 bg-gray-200 rounded animate-pulse" />
          </td>
        ))}
      </tr>
    ));
  };

  // Render empty state
  const renderEmptyState = () => (
    <tr>
      <td colSpan={columns.length} className="text-center py-8 text-gray-500">
        {emptyMessage}
      </td>
    </tr>
  );

  // Render data rows
  const renderDataRows = () => {
    return data.map((row, rowIndex) => (
      <tr key={row.id || rowIndex} className="border-b hover:bg-gray-50">
        {columns.map((column) => (
          <td key={column.id} className={`px-4 py-3 ${column.className || ''}`}>
            {renderCell(row, column, rowIndex)}
          </td>
        ))}
      </tr>
    ));
  };

  // Generate page numbers to display
  const getPageNumbers = () => {
    if (!lastPage || lastPage <= 1) return [];

    const pages = [];
    const showPages = 5; // Number of page buttons to show

    let startPage = Math.max(1, currentPage - Math.floor(showPages / 2));
    let endPage = Math.min(lastPage, startPage + showPages - 1);

    // Adjust start if we're near the end
    if (endPage - startPage < showPages - 1) {
      startPage = Math.max(1, endPage - showPages + 1);
    }

    // Add first page and ellipsis if needed
    if (startPage > 1) {
      pages.push(1);
      if (startPage > 2) pages.push('...');
    }

    // Add page numbers
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    // Add ellipsis and last page if needed
    if (endPage < lastPage) {
      if (endPage < lastPage - 1) pages.push('...');
      pages.push(lastPage);
    }

    return pages;
  };

  const showPagination = lastPage && lastPage > 1;

  return (
    <div>
      <div className="rounded-md border overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.id}
                  className={`px-4 py-3 text-left font-medium text-gray-700 ${column.headerClassName || ''}`}
                >
                  {column.name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading
              ? renderSkeletonRows()
              : data.length === 0
                ? renderEmptyState()
                : renderDataRows()}
          </tbody>
        </table>
      </div>

      {showPagination && (
        <div className="flex items-center justify-between mt-4 px-2">
          <div className="text-sm text-gray-600">
            Page {currentPage} of {lastPage}
          </div>

          <div className="flex items-center gap-1">
            {/* Previous button */}
            <button
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage === 1 || loading}
              className="px-3 py-1 rounded border text-sm font-medium hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>

            {/* Page numbers */}
            {getPageNumbers().map((page, index) => {
              if (page === '...') {
                return (
                  <span
                    key={`ellipsis-${index}`}
                    className="px-2 text-gray-400"
                  >
                    ...
                  </span>
                );
              }

              return (
                <button
                  key={page}
                  onClick={() => onPageChange(page)}
                  disabled={loading}
                  className={`px-3 py-1 rounded border text-sm font-medium ${
                    currentPage === page
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'hover:bg-gray-50 disabled:opacity-50'
                  }`}
                >
                  {page}
                </button>
              );
            })}

            {/* Next button */}
            <button
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage === lastPage || loading}
              className="px-3 py-1 rounded border text-sm font-medium hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
export default DataTable;
// Example Usage Component
// const ExampleUsage = () => {
//   const [loading, setLoading] = React.useState(false);
//   const [currentPage, setCurrentPage] = React.useState(1);
//   const [items, setItems] = React.useState([]);
//   const lastPage = 10; // Total pages

//   // Simulate loading data for current page
//   const loadData = (page) => {
//     setLoading(true);
//     setTimeout(() => {
//       // Simulate different data for each page
//       const mockData = [
//         {
//           id: (page - 1) * 2 + 1,
//           entryDate: '2024-01-15',
//           customerName: `Customer ${(page - 1) * 2 + 1}`,
//           marka: 'Brand A',
//           typeName: 'Type 1',
//           subtypeName: 'Subtype A',
//           roomName: 'Room 101',
//           boxNo: `B-${String((page - 1) * 2 + 1).padStart(3, '0')}`,
//           availableQty: 150.5,
//           storageTillDate: '2024-12-31',
//           daysLeft: 45,
//           unitPrice: 50.0,
//           currentPrice: 55.0,
//           totalValue: 8277.5,
//           isDoubleRent: false,
//         },
//         {
//           id: (page - 1) * 2 + 2,
//           entryDate: '2024-02-20',
//           customerName: `Customer ${(page - 1) * 2 + 2}`,
//           marka: 'Brand B',
//           typeName: 'Type 2',
//           subtypeName: 'Subtype B',
//           roomName: 'Room 102',
//           boxNo: `B-${String((page - 1) * 2 + 2).padStart(3, '0')}`,
//           availableQty: 200.0,
//           storageTillDate: '2024-11-30',
//           daysLeft: 15,
//           unitPrice: 75.0,
//           currentPrice: 150.0,
//           totalValue: 30000.0,
//           isDoubleRent: page % 2 === 0,
//         },
//       ];
//       setItems(mockData);
//       setLoading(false);
//     }, 800);
//   };

//   React.useEffect(() => {
//     loadData(currentPage);
//   }, [currentPage]);

//   const handlePageChange = (pageNo) => {
//     setCurrentPage(pageNo);
//     // In real app, fetch data for this page
//     console.log('Changing to page:', pageNo);
//   };

//   // Helper function for days left coloring
//   const getDaysLeftColor = (days) => {
//     if (days === null) return '';
//     if (days < 0) return 'text-red-600 font-bold';
//     if (days <= 7) return 'text-orange-600 font-semibold';
//     if (days <= 30) return 'text-yellow-600';
//     return 'text-green-600';
//   };

//   const columns = [
//     {
//       name: '#',
//       accessor: (row, index) => index + 1,
//       id: 'index',
//     },
//     {
//       name: 'Entry Date',
//       accessor: (row) =>
//         new Date(row.entryDate).toLocaleDateString('en-US', {
//           year: 'numeric',
//           month: 'short',
//           day: 'numeric',
//         }),
//       id: 'entryDate',
//     },
//     {
//       name: 'Customer',
//       accessor: 'customerName',
//       id: 'customer',
//       className: 'font-medium',
//     },
//     {
//       name: 'Marka',
//       accessor: 'marka',
//       id: 'marka',
//     },
//     {
//       name: 'Type',
//       accessor: (row) => (
//         <div>
//           {row.isDoubleRent && <span className="mr-1">⚡</span>}
//           {row.typeName}
//         </div>
//       ),
//       id: 'type',
//     },
//     {
//       name: 'Subtype',
//       accessor: 'subtypeName',
//       id: 'subtype',
//     },
//     {
//       name: 'Room',
//       accessor: (row) => (
//         <span className="inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold">
//           {row.roomName}
//         </span>
//       ),
//       id: 'room',
//     },
//     {
//       name: 'Box',
//       accessor: 'boxNo',
//       id: 'box',
//     },
//     {
//       name: 'Available Qty',
//       accessor: (row) => row.availableQty.toFixed(2),
//       id: 'qty',
//       className: 'text-right font-medium',
//       headerClassName: 'text-right',
//     },
//     {
//       name: 'Storage Till',
//       accessor: (row) =>
//         row.storageTillDate
//           ? new Date(row.storageTillDate).toLocaleDateString('en-US', {
//               year: 'numeric',
//               month: 'short',
//               day: 'numeric',
//             })
//           : '-',
//       id: 'storageTill',
//     },
//     {
//       name: 'Days Left',
//       accessor: (row) => (
//         <span className={getDaysLeftColor(row.daysLeft)}>
//           {row.daysLeft !== null ? `${row.daysLeft} days` : '-'}
//         </span>
//       ),
//       id: 'daysLeft',
//       className: 'text-right',
//       headerClassName: 'text-right',
//     },
//     {
//       name: 'Unit Price',
//       accessor: (row) => `PKR ${row.unitPrice.toFixed(2)}`,
//       id: 'unitPrice',
//       className: 'text-right',
//       headerClassName: 'text-right',
//     },
//     {
//       name: 'Current Price',
//       accessor: (row) => (
//         <span className={row.isDoubleRent ? 'text-red-600 font-bold' : ''}>
//           PKR {row.currentPrice.toFixed(2)}
//         </span>
//       ),
//       id: 'currentPrice',
//       className: 'text-right',
//       headerClassName: 'text-right',
//     },
//     {
//       name: 'Total Value',
//       accessor: (row) => `PKR ${row.totalValue.toFixed(2)}`,
//       id: 'totalValue',
//       className: 'text-right font-bold',
//       headerClassName: 'text-right',
//     },
//   ];

//   return (
//     <div className="p-6 max-w-7xl mx-auto">
//       <div className="mb-4 flex items-center justify-between">
//         <div>
//           <h1 className="text-2xl font-bold">Inventory Table</h1>
//           <p className="text-sm text-gray-500 mt-1">
//             Showing page {currentPage} of {lastPage} pages
//           </p>
//         </div>
//         <button
//           onClick={() => loadData(currentPage)}
//           className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
//           disabled={loading}
//         >
//           {loading ? 'Loading...' : 'Reload'}
//         </button>
//       </div>

//       <DataTable
//         columns={columns}
//         data={items}
//         loading={loading}
//         emptyMessage="No inventory items found"
//         skeletonRows={5}
//         currentPage={currentPage}
//         lastPage={lastPage}
//         onPageChange={handlePageChange}
//       />
//     </div>
//   );
// };

// export default ExampleUsage;
