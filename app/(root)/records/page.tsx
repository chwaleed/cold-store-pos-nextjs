'use client';

import { useState, useEffect } from 'react';
import { Plus, Search, Filter, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { EntryTable } from '@/components/entry/entry-table';
import { EntryReceipt } from '@/types/entry';
import { useDebounce } from 'use-debounce';
import { useToast } from '@/components/ui/use-toast';
import { useRouter } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { CustomerSearchSelect } from '@/components/ui/customer-search-select';

export default function RecordsPage() {
  const [entries, setEntries] = useState<EntryReceipt[]>([]);
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
  const [showFilters, setShowFilters] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    const fetchEntries = async () => {
      try {
        setLoading(true);

        // Build query params
        const params = new URLSearchParams({
          search: debouncedSearch,
          page: page.toString(),
          limit: '10',
        });

        if (selectedCustomer) {
          params.append('customerId', selectedCustomer.toString());
        }

        if (startDate) {
          params.append('startDate', startDate);
        }

        if (endDate) {
          params.append('endDate', endDate);
        }

        const response = await fetch(`/api/entry?${params.toString()}`);
        const data = await response.json();

        if (data.success) {
          setEntries(data.data);
          setTotalPages(data.pagination.totalPages);
        } else {
          toast({
            title: 'Error',
            description: 'Failed to fetch entry receipts',
            variant: 'destructive',
          });
        }
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Failed to fetch entry receipts',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchEntries();
  }, [
    debouncedSearch,
    page,
    selectedCustomer,
    startDate,
    endDate,
    refreshTrigger,
    toast,
  ]);

  const handleRefresh = () => {
    // Reset to page 1 and trigger a refresh
    setPage(1);
    setRefreshTrigger((prev) => prev + 1);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedCustomer(undefined);
    setStartDate('');
    setEndDate('');
    setPage(1);
  };

  const hasActiveFilters =
    searchTerm || selectedCustomer || startDate || endDate;

  return (
    <div className="w-full rounded-xl bg-background h-full mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Entry Records</h1>
          <p className="text-muted-foreground">
            Manage inventory entry receipts
          </p>
        </div>
        <Button onClick={() => router.push('/records/new')}>
          <Plus className="mr-2 h-4 w-4" />
          New Entry
        </Button>
      </div>

      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by receipt number or car number..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 rounded-lg">
            <div>
              <CustomerSearchSelect
                value={selectedCustomer}
                onValueChange={(value) => {
                  setSelectedCustomer(value);
                  setPage(1);
                }}
              />
            </div>

            <div className="">
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>

            <div>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>
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
      </div>

      <EntryTable
        entries={entries}
        loading={loading}
        page={page}
        totalPages={totalPages}
        onPageChange={setPage}
        onRefresh={handleRefresh}
      />
    </div>
  );
}
