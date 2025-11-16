'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Plus, Pencil, Trash2, Filter, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { AddExpenseDialog } from './add-expense-dialog';
import { Expense, ExpenseCategory } from '@/schema/expense';
import DataTable from '@/components/dataTable/data-table';

export function ExpenseList() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  useEffect(() => {
    fetchExpenses();
    fetchCategories();
  }, []);

  const fetchExpenses = async () => {
    try {
      const response = await fetch('/api/expenses');
      const data = await response.json();
      if (response.ok) {
        setExpenses(data.data || []);
      } else {
        toast.error('Failed to load expenses');
      }
    } catch (error) {
      toast.error('Error loading expenses');
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/expenses/categories');
      const data = await response.json();
      if (response.ok) {
        setCategories(data.data || []);
      }
    } catch (error) {
      console.error('Error loading categories');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this expense?')) return;

    try {
      const response = await fetch(`/api/expenses/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success('Expense deleted successfully');
        fetchExpenses();
      } else {
        toast.error('Failed to delete expense');
      }
    } catch (error) {
      toast.error('Error deleting expense');
    }
  };

  const handleEdit = (expense: Expense) => {
    setEditingExpense(expense);
    setDialogOpen(true);
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
    setEditingExpense(null);
    fetchExpenses();
  };

  // Filter expenses based on category and search term
  const filteredExpenses = expenses.filter((expense) => {
    const matchesCategory =
      selectedCategory === 'all' ||
      expense.categoryId.toString() === selectedCategory;
    const matchesSearch =
      searchTerm === '' ||
      expense.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      expense.category.name.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Pagination
  const totalPages = Math.ceil(filteredExpenses.length / itemsPerPage);
  const paginatedExpenses = filteredExpenses.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const totalExpenses = filteredExpenses.reduce(
    (sum, expense) => sum + expense.amount,
    0
  );

  const handlePageChange = (pageNo: number) => {
    setCurrentPage(pageNo);
  };

  const clearFilters = () => {
    setSelectedCategory('all');
    setSearchTerm('');
    setCurrentPage(1);
  };

  const columns = [
    {
      name: '#',
      accessor: (row: Expense, index: number) =>
        (currentPage - 1) * itemsPerPage + index + 1,
      id: 'index',
      className: 'w-12',
    },
    {
      name: 'Date',
      accessor: (row: Expense) => format(new Date(row.date), 'MMM dd, yyyy'),
      id: 'date',
    },
    {
      name: 'Category',
      accessor: (row: Expense) => (
        <Badge variant="outline">{row.category.name}</Badge>
      ),
      id: 'category',
    },
    {
      name: 'Amount',
      accessor: (row: Expense) => `PKR ${row.amount.toFixed(2)}`,
      id: 'amount',
      className: 'text-right font-medium',
      headerClassName: 'text-right',
    },
    {
      name: 'Description',
      accessor: (row: Expense) => (
        <span className="max-w-xs truncate block">
          {row.description || '-'}
        </span>
      ),
      id: 'description',
    },
    {
      name: 'Actions',
      accessor: (row: Expense) => (
        <div className="flex justify-end gap-2">
          <Button size="icon" variant="ghost" onClick={() => handleEdit(row)}>
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            onClick={() => handleDelete(row.id)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
      id: 'actions',
      className: 'text-right',
      headerClassName: 'text-right',
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold text-red-600">
              PKR {totalExpenses.toFixed(2)}
            </span>
          </div>
          <p className="text-sm text-muted-foreground">
            Total Expenses ({filteredExpenses.length} records)
          </p>
        </div>
        <div className="flex gap-4">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
            <div className="flex items-center gap-2 flex-1">
              <Select
                value={selectedCategory}
                onValueChange={setSelectedCategory}
              >
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Filter by category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map((category) => (
                    <SelectItem
                      key={category.id}
                      value={category.id.toString()}
                    >
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {(selectedCategory !== 'all' || searchTerm !== '') && (
              <Button variant="outline" size="sm" onClick={clearFilters}>
                <X className="mr-2 h-4 w-4" />
                Clear Filters
              </Button>
            )}
          </div>
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Expense
          </Button>
        </div>
      </div>

      {/* Filters */}

      <DataTable
        columns={columns}
        data={paginatedExpenses}
        loading={loading}
        emptyMessage="No expenses found"
        skeletonRows={5}
        currentPage={currentPage}
        lastPage={totalPages}
        onPageChange={handlePageChange}
      />

      <AddExpenseDialog
        open={dialogOpen}
        onClose={handleDialogClose}
        expense={editingExpense}
      />
    </div>
  );
}
