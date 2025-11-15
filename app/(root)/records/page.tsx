'use client';

import { useState, useEffect } from 'react';
import { Plus, Search, Filter, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { EntryTable } from '@/components/entry/entry-table';
import { EntryReceipt } from '@/types/entry';
import { Customer } from '@/types/customer';
import { useDebounce } from 'use-debounce';
import { useToast } from '@/components/ui/use-toast';
import { useRouter } from 'next/navigation';
import { Badge } from '@/components/ui/badge';

export default function RecordsPage() {
  const [entries, setEntries] = useState<EntryReceipt[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch] = useDebounce(searchTerm, 500);
  const [selectedCustomer, setSelectedCustomer] = useState<string>('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  // Fetch customers for filter
  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        const response = await fetch('/api/customer?limit=1000');
        const data = await response.json();
        if (data.success) {
          setCustomers(data.data);
        }
      } catch (error) {
        console.error('Failed to fetch customers', error);
      }
    };
    fetchCustomers();
  }, []);

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

        if (selectedCustomer && selectedCustomer !== 'all') {
          params.append('customerId', selectedCustomer);
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
  }, [debouncedSearch, page, selectedCustomer, startDate, endDate, toast]);

  const handleRefresh = () => {
    setPage(1);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedCustomer('all');
    setStartDate('');
    setEndDate('');
    setPage(1);
  };

  const hasActiveFilters =
    searchTerm ||
    (selectedCustomer && selectedCustomer !== 'all') ||
    startDate ||
    endDate;

  return (
    <div className="w-full rounded-xl bg-white h-full mx-auto p-4 space-y-6">
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
          <Button
            variant="outline"
            size="icon"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter className="h-4 w-4" />
          </Button>
          {hasActiveFilters && (
            <Button variant="ghost" size="sm" onClick={clearFilters}>
              <X className="h-4 w-4 mr-2" />
              Clear Filters
            </Button>
          )}
        </div>

        {showFilters && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-muted rounded-lg">
            <div>
              <label className="text-sm font-medium mb-2 block">Customer</label>
              <Select
                value={selectedCustomer}
                onValueChange={setSelectedCustomer}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Customers" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Customers</SelectItem>
                  {customers.map((customer) => (
                    <SelectItem
                      key={customer.id}
                      value={customer.id.toString()}
                    >
                      {customer.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">
                Start Date
              </label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">End Date</label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>
        )}

        {hasActiveFilters && (
          <div className="flex gap-2 flex-wrap">
            {searchTerm && (
              <Badge variant="secondary">Search: {searchTerm}</Badge>
            )}
            {selectedCustomer && selectedCustomer !== 'all' && (
              <Badge variant="secondary">
                Customer:{' '}
                {
                  customers.find((c) => c.id.toString() === selectedCustomer)
                    ?.name
                }
              </Badge>
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
