'use client';

import { useState, useEffect } from 'react';
import { Plus, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CustomerTable } from '@/components/customer/customer-table';
import { AddCustomerDialog } from '@/components/customer/add-customer-dialog';
import { Customer } from '@/types/customer';
import { useDebounce } from 'use-debounce';
import { useToast } from '@/components/ui/use-toast';

export default function CustomerPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch] = useDebounce(searchTerm, 500);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        setLoading(true);
        const response = await fetch(
          `/api/customer?search=${debouncedSearch}&page=${page}&limit=10`
        );
        const data = await response.json();

        if (data.success) {
          setCustomers(data.data);
          setTotalPages(data.pagination.totalPages);
        } else {
          toast({
            title: 'Error',
            description: 'Failed to fetch customers',
            variant: 'destructive',
          });
        }
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Failed to fetch customers',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchCustomers();
  }, [debouncedSearch, page, toast]);

  const handleRefresh = () => {
    setPage(1);
  };

  const handleCustomerAdded = () => {
    setIsAddDialogOpen(false);
    handleRefresh();
  };

  return (
    <div className="w-full rounded-xl bg-white h-full mx-auto p-4 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Customers</h1>
          <p className="text-muted-foreground">
            Manage customer information and records
          </p>
        </div>
        <Button onClick={() => setIsAddDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Customer
        </Button>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, phone, CNIC, or village..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <CustomerTable
        customers={customers}
        loading={loading}
        page={page}
        totalPages={totalPages}
        onPageChange={setPage}
        onRefresh={handleRefresh}
      />

      <AddCustomerDialog
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        onSuccess={handleCustomerAdded}
      />
    </div>
  );
}
