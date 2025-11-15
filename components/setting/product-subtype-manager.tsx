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
import {
  productSubTypeSchema,
  type ProductSubTypeFormData,
} from '@/schema/config';
import { ProductType, ProductSubType } from '@/types/config';

interface ProductSubTypeWithType extends ProductSubType {
  productType: ProductType;
}

export function ProductSubTypeManager() {
  const [productSubTypes, setProductSubTypes] = useState<
    ProductSubTypeWithType[]
  >([]);
  const [productTypes, setProductTypes] = useState<ProductType[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const form = useForm<ProductSubTypeFormData>({
    resolver: zodResolver(productSubTypeSchema),
    defaultValues: {
      name: '',
      productTypeId: 0,
    },
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [subTypesRes, typesRes] = await Promise.all([
        fetch('/api/productsubtype'),
        fetch('/api/producttype'),
      ]);

      const [subTypesData, typesData] = await Promise.all([
        subTypesRes.json(),
        typesRes.json(),
      ]);

      if (subTypesData.success) {
        setProductSubTypes(subTypesData.data);
      }

      if (typesData.success) {
        setProductTypes(typesData.data);
      }
    } catch (error) {
      toast.error('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data: ProductSubTypeFormData) => {
    setSubmitting(true);

    try {
      const url =
        editMode && selectedId
          ? `/api/productsubtype/${selectedId}`
          : '/api/productsubtype';
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
            ? 'Product subtype updated successfully'
            : 'Product subtype created successfully'
        );
        form.reset();
        setDialogOpen(false);
        // Refresh data immediately
        await fetchData();
      } else {
        toast.error(result.error || 'Operation failed');
      }
    } catch (error) {
      toast.error('An error occurred');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (subType: ProductSubTypeWithType) => {
    setSelectedId(subType.id);
    setEditMode(true);
    form.reset({
      name: subType.name,
      productTypeId: subType.productTypeId,
    });
    setDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!selectedId) return;

    try {
      const response = await fetch(`/api/productsubtype/${selectedId}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (result.success) {
        toast.success('Product subtype deleted successfully');
        setDeleteDialogOpen(false);
        setSelectedId(null);
        // Refresh data immediately
        await fetchData();
      } else {
        toast.error(result.error || 'Failed to delete product subtype');
      }
    } catch (error) {
      toast.error('An error occurred');
    }
  };

  const handleAddNew = () => {
    setEditMode(false);
    setSelectedId(null);
    form.reset({ name: '', productTypeId: 0 });
    setDialogOpen(true);
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Product Subtypes</CardTitle>
              <CardDescription>
                Manage product subtypes and link them to product types
              </CardDescription>
            </div>
            <Button onClick={handleAddNew} disabled={productTypes.length === 0}>
              <Plus className="mr-2 h-4 w-4" />
              Add Subtype
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : productTypes.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Please add product types first before adding subtypes.
            </div>
          ) : productSubTypes.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No product subtypes found. Add one to get started.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Product Type</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {productSubTypes.map((subType) => (
                  <TableRow key={subType.id}>
                    <TableCell className="font-medium">
                      {subType.name}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {subType.productType.name}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(subType)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setSelectedId(subType.id);
                          setDeleteDialogOpen(true);
                        }}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editMode ? 'Edit Product Subtype' : 'Add Product Subtype'}
            </DialogTitle>
            <DialogDescription>
              {editMode
                ? 'Update the product subtype details'
                : 'Create a new product subtype'}
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="productTypeId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Product Type *</FormLabel>
                    <Select
                      value={field.value?.toString()}
                      onValueChange={(value) => field.onChange(parseInt(value))}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select product type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {productTypes.map((type) => (
                          <SelectItem key={type.id} value={type.id.toString()}>
                            {type.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Subtype Name *</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Red Potato" {...field} />
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
              product subtype.
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
