'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, Loader2, Snowflake, Flame } from 'lucide-react';
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
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
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
import { roomSchema, type RoomFormData } from '@/schema/config';
import { Room } from '@/types/config';
import DataTable from '@/components/dataTable/data-table';

interface RoomWithCount extends Room {
  _count?: {
    entryItems: number;
  };
}

export function RoomManager() {
  const [rooms, setRooms] = useState<RoomWithCount[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [page, setPage] = useState(1);
  const [itemsPerPage] = useState(10);

  const form = useForm<RoomFormData>({
    resolver: zodResolver(roomSchema),
    defaultValues: {
      name: '',
      type: 'Cold',
      capacity: null,
    },
  });

  useEffect(() => {
    fetchRooms();
  }, []);

  const fetchRooms = async () => {
    try {
      const response = await fetch('/api/room');
      const data = await response.json();

      if (data.success) {
        setRooms(data.data);
      } else {
        toast.error(data.error || 'Failed to fetch rooms');
      }
    } catch (error) {
      toast.error('Failed to fetch rooms');
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data: RoomFormData) => {
    setSubmitting(true);

    try {
      const url =
        editMode && selectedId ? `/api/room/${selectedId}` : '/api/room';
      const method = editMode ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (result.success) {
        toast.success(
          editMode ? 'Room updated successfully' : 'Room created successfully'
        );
        form.reset();
        setDialogOpen(false);
        // Refresh data immediately
        await fetchRooms();
      } else {
        toast.error(result.error || 'Operation failed');
      }
    } catch (error) {
      toast.error('An error occurred');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (room: RoomWithCount) => {
    setSelectedId(room.id);
    setEditMode(true);
    form.reset({
      name: room.name,
      type: room.type,
      capacity: room.capacity,
    });
    setDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!selectedId) return;

    try {
      const response = await fetch(`/api/room/${selectedId}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (result.success) {
        toast.success('Room deleted successfully');
        setDeleteDialogOpen(false);
        setSelectedId(null);
        // Refresh data immediately
        await fetchRooms();
      } else {
        toast.error(result.error || 'Failed to delete room');
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
      type: 'Cold',
      capacity: null,
    });
    setDialogOpen(true);
  };

  const columns = [
    { name: 'Name', accessor: 'name', id: 'name', className: 'font-medium' },
    {
      name: 'Type',
      accessor: (row: any) => (
        <Badge
          variant={row.type === 'Cold' ? 'default' : 'destructive'}
          className="gap-1"
        >
          {row.type === 'Cold' ? (
            <Snowflake className="h-3 w-3" />
          ) : (
            <Flame className="h-3 w-3" />
          )}
          {row.type}
        </Badge>
      ),
      id: 'type',
    },
    {
      name: 'Capacity',
      accessor: (row: any) => (row.capacity ? `${row.capacity} units` : 'N/A'),
      id: 'capacity',
    },
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

  const totalPages = Math.ceil(rooms.length / itemsPerPage);
  const paginatedData = rooms.slice(
    (page - 1) * itemsPerPage,
    page * itemsPerPage
  );

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Storage Rooms</CardTitle>
              <CardDescription>
                Manage cold and hot storage rooms
              </CardDescription>
            </div>
            <Button onClick={handleAddNew}>
              <Plus className="mr-2 h-4 w-4" />
              Add Room
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={paginatedData}
            loading={loading}
            emptyMessage="No rooms found. Add one to get started."
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
            <DialogTitle>{editMode ? 'Edit Room' : 'Add Room'}</DialogTitle>
            <DialogDescription>
              {editMode
                ? 'Update the room details'
                : 'Create a new storage room'}
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
                      <Input placeholder="e.g., Cold Room 1" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Type *</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select room type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Cold">Cold Room</SelectItem>
                        <SelectItem value="Hot">Hot Room</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="capacity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Capacity (optional)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="e.g., 5000"
                        {...field}
                        value={field.value || ''}
                        onChange={(e) => {
                          const value = e.target.value;
                          field.onChange(value ? parseInt(value) : null);
                        }}
                      />
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
              room.
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
