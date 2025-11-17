'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, Loader2 } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
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
import { packTypeSchema, type PackTypeFormData } from '@/schema/config';
import { PackType } from '@/types/config';
import DataTable from '@/components/dataTable/data-table';

interface PackTypeWithCount extends PackType {
  _count?: {
    entryItems: number;
  };
}

export function PackTypeManager() {
  const [packTypes, setPackTypes] = useState<PackTypeWithCount[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [page, setPage] = useState(1);
  const [itemsPerPage] = useState(10);

  const form = useForm<PackTypeFormData>({
    resolver: zodResolver(packTypeSchema),
    defaultValues: {
      name: '',
    },
  });

  useEffect(() => {
    fetchPackTypes();
  }, []);

  const fetchPackTypes = async () => {
    try {
      const response = await fetch('/api/packtype');
      const data = await response.json();

      if (data.success) {
        setPackTypes(data.data);
      } else {
        toast.error(data.error || 'Failed to fetch pack types');
      }
    } catch (error) {
      toast.error('Failed to fetch pack types');
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data: PackTypeFormData) => {
    setSubmitting(true);

    try {
      const url =
        editMode && selectedId
          ? `/api/packtype/${selectedId}`
          : '/api/packtype';
      const method = editMode ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (result.success) {
        toast.success(
          editMode
            ? 'Pack type updated successfully'
            : 'Pack type created successfully'
        );
        form.reset();
        setDialogOpen(false);
        // Refresh data immediately
        await fetchPackTypes();
      } else {
        toast.error(result.error || 'Operation failed');
      }
    } catch (error) {
      toast.error('An error occurred');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (packType: PackTypeWithCount) => {
    setSelectedId(packType.id);
    setEditMode(true);
    form.reset({
      name: packType.name,
    });
    setDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!selectedId) return;

    try {
      const response = await fetch(`/api/packtype/${selectedId}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (result.success) {
        toast.success('Pack type deleted successfully');
        setDeleteDialogOpen(false);
        setSelectedId(null);
        // Refresh data immediately
        await fetchPackTypes();
      } else {
        toast.error(result.error || 'Failed to delete pack type');
      }
    } catch (error) {
      toast.error('An error occurred');
    }
  };

  const handleAddNew = () => {
    setEditMode(false);
    setSelectedId(null);
    form.reset({
      name: '',
    });
    setDialogOpen(true);
  };

  const columns = [
    { name: 'Name', accessor: 'name', id: 'name', className: 'font-medium' },
    {
      name: 'Actions',
      accessor: (row: any) => (
        <div className="flex gap-2">
          <Button variant="ghost" size="icon" onClick={() => handleEdit(row)}>
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              setSelectedId(row.id);
              setDeleteDialogOpen(true);
            }}
          >
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </div>
      ),
      id: 'actions',
      className: 'text-right',
    },
  ];

  const totalPages = Math.ceil(packTypes.length / itemsPerPage);
  const paginatedData = packTypes.slice(
    (page - 1) * itemsPerPage,
    page * itemsPerPage
  );

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Pack Types</CardTitle>
              <CardDescription>
                Manage packaging types used for storage
              </CardDescription>
            </div>
            <Button onClick={handleAddNew}>
              <Plus className="mr-2 h-4 w-4" />
              Add Pack Type
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={paginatedData}
            loading={loading}
            emptyMessage="No pack types found. Add one to get started."
            skeletonRows={5}
            currentPage={page}
            lastPage={totalPages}
            onPageChange={setPage}
          />
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editMode ? 'Edit Pack Type' : 'Add Pack Type'}
            </DialogTitle>
            <DialogDescription>
              {editMode
                ? 'Update the pack type name'
                : 'Create a new pack type'}
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name *</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Bori" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setDialogOpen(false)}
                  disabled={submitting}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={submitting}>
                  {submitting && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  {editMode ? 'Update' : 'Create'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              pack type.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
