'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Search, Eye, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import DataTable from '@/components/dataTable/data-table';
import { AddCustomerDialog } from '@/components/customer/add-customer-dialog';
import { EditCustomerDialog } from '@/components/customer/edit-customer-dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Customer } from '@/types/customer';
import { useDebounce } from 'use-debounce';
import { useToast } from '@/components/ui/use-toast';

export default function CustomerPage() {
  const router = useRouter();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch] = useDebounce(searchTerm, 500);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [deleteCustomerId, setDeleteCustomerId] = useState<number | null>(null);
  const [editCustomer, setEditCustomer] = useState<Customer | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
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
  }, [debouncedSearch, page, toast, refreshKey]);

  const handleRefresh = () => {
    setRefreshKey((prev) => prev + 1);
    setPage(1);
  };

  const handleCustomerAdded = () => {
    setIsAddDialogOpen(false);
    handleRefresh();
  };

  const handleDelete = async () => {
    if (!deleteCustomerId) return;

    try {
      const response = await fetch(`/api/customer/${deleteCustomerId}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: 'Success',
          description: 'Customer deleted successfully',
        });
        handleRefresh();
      } else {
        toast({
          title: 'Error',
          description: data.error || 'Failed to delete customer',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete customer',
        variant: 'destructive',
      });
    } finally {
      setDeleteCustomerId(null);
    }
  };

  const columns = [
    {
      name: '#',
      accessor: (row: Customer, index: number) => (page - 1) * 10 + index + 1,
      id: 'index',
    },
    {
      name: 'Name',
      accessor: 'name',
      id: 'name',
      className: 'font-medium',
    },
    {
      name: 'Father Name',
      accessor: (row: Customer) => row.fatherName || '-',
      id: 'fatherName',
    },
    {
      name: 'Phone',
      accessor: (row: Customer) => row.phone || '-',
      id: 'phone',
    },
    {
      name: 'Village',
      accessor: (row: Customer) => row.village || '-',
      id: 'village',
    },
    {
      name: 'Actions',
      accessor: (row: Customer) => (
        <div className="flex gap-2">
          <Button
            size="icon"
            variant="ghost"
            onClick={() => router.push(`/customers/${row.id}`)}
            className="h-8 w-8"
            title="View details"
          >
            <Eye className="h-4 w-4" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            onClick={() => setEditCustomer(row)}
            className="h-8 w-8"
            title="Edit customer"
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            onClick={() => setDeleteCustomerId(row.id)}
            className="h-8 w-8 text-red-600 hover:text-red-700"
            title="Delete customer"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
      id: 'actions',
    },
  ];

  return (
    <div className="w-full rounded-xl bg-background h-full mx-auto p-4 space-y-6">
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
            placeholder="Search by name, phone, or village..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <DataTable
        columns={columns}
        data={customers}
        loading={loading}
        emptyMessage="No customers found"
        skeletonRows={10}
        currentPage={page}
        lastPage={totalPages}
        onPageChange={setPage}
      />

      <AddCustomerDialog
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        onSuccess={handleCustomerAdded}
      />

      <AlertDialog
        open={deleteCustomerId !== null}
        onOpenChange={() => setDeleteCustomerId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              customer record.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {editCustomer && (
        <EditCustomerDialog
          customer={editCustomer}
          open={!!editCustomer}
          onOpenChange={(open) => !open && setEditCustomer(null)}
          onSuccess={() => {
            setEditCustomer(null);
            handleRefresh();
          }}
        />
      )}
    </div>
  );
}
