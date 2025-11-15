'use client';
import React, { useEffect, useState } from 'react';
import DataTable from '@/components/dataTable/data-table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CustomerSearchSelect } from '@/components/ui/customer-search-select';
import { useDebounce } from 'use-debounce';
import { useToast } from '@/components/ui/use-toast';
import { Eye, Search } from 'lucide-react';
import { useRouter } from 'next/navigation';

// Define the type for a clearance receipt row (adjust as needed)
type ClearanceReceipt = {
  id: number;
  receiptNo: string;
  customerName: string;
  carNo: string;
  date: string;
  itemsCount: number;
  totalAmount: number;
};

export function ClearanceTable() {
  const [receipts, setReceipts] = useState<ClearanceReceipt[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch] = useDebounce(searchTerm, 500);
  const [selectedCustomer, setSelectedCustomer] = useState<number | undefined>(
    undefined
  );
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    const fetchReceipts = async () => {
      try {
        setLoading(true);
        const params = new URLSearchParams({
          search: debouncedSearch,
          page: page.toString(),
          limit: '10',
        });
        if (selectedCustomer)
          params.append('customerId', selectedCustomer.toString());
        if (startDate) params.append('startDate', startDate);
        if (endDate) params.append('endDate', endDate);
        const response = await fetch(`/api/clearance?${params.toString()}`);
        const data = await response.json();
        if (data.success) {
          setReceipts(data.data);
          setTotalPages(data.pagination.totalPages);
        } else {
          toast({
            title: 'Error',
            description: 'Failed to fetch clearance receipts',
            variant: 'destructive',
          });
        }
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Failed to fetch clearance receipts',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };
    fetchReceipts();
  }, [debouncedSearch, page, selectedCustomer, startDate, endDate, toast]);

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedCustomer(undefined);
    setStartDate('');
    setEndDate('');
    setPage(1);
  };

  const hasActiveFilters =
    searchTerm || selectedCustomer || startDate || endDate;

  const columns = [
    { name: 'Receipt No', accessor: 'receiptNo', id: 'receiptNo' },
    {
      name: 'Customer',
      accessor: (row) => `${row.customer?.name}`,
      id: 'customerName',
    },
    { name: 'Car No', accessor: (row) => `${row.carNo}`, id: 'carNo' },
    {
      name: 'Clearance Date',
      accessor: (row: ClearanceReceipt) =>
        new Date(row.date).toLocaleDateString(),
      id: 'clearanceDate',
    },
    {
      name: 'Items',
      accessor: (row: EntryReceipt) => (
        <Badge variant="secondary">{row.itemsCount || 0} items</Badge>
      ),
      id: 'items',
    },
    {
      name: 'Total Amount',
      accessor: (row: ClearanceReceipt) => `PKR ${row.totalAmount.toFixed(2)}`,
      id: 'totalAmount',
    },
    {
      name: 'Actions',
      accessor: (row: EntryReceipt) => (
        <div className="flex  gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push(`/clearance/${row.id}`)}
            title="Preview Receipt"
          >
            <Eye className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
    // Add more columns/actions as needed
  ];

  const totalAmount = receipts.reduce(
    (sum, r) => sum + (r.totalAmount || 0),
    0
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row md:items-end gap-4">
        <div className="flex-1 max-w-md relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by receipt or car number..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <CustomerSearchSelect
            value={selectedCustomer}
            onValueChange={(value) => {
              setSelectedCustomer(value);
              setPage(1);
            }}
          />
          <Input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
          <Input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </div>
        {hasActiveFilters && (
          <Button variant="outline" onClick={clearFilters} size="sm">
            Clear Filters
          </Button>
        )}
      </div>
      {hasActiveFilters && (
        <div className="flex gap-2 flex-wrap">
          {searchTerm && (
            <Badge variant="secondary">Search: {searchTerm}</Badge>
          )}
          {selectedCustomer && (
            <Badge variant="secondary">Customer Filter Active</Badge>
          )}
          {startDate && <Badge variant="secondary">From: {startDate}</Badge>}
          {endDate && <Badge variant="secondary">To: {endDate}</Badge>}
        </div>
      )}
      <DataTable
        columns={columns}
        data={receipts}
        loading={loading}
        currentPage={page}
        lastPage={totalPages}
        onPageChange={setPage}
        emptyMessage="No clearance receipts found"
        skeletonRows={5}
      />
      <div className="flex justify-end mt-2">
        <div className="text-lg font-bold">
          Total: PKR {totalAmount.toFixed(2)}
        </div>
      </div>
    </div>
  );
}
