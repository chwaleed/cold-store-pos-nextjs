'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import {
  Search,
  Filter,
  X,
  Calendar as CalendarIcon,
  ArrowUpDown,
  TrendingUp,
  TrendingDown,
  Receipt,
  User,
  Building,
  DollarSign,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { CustomerSearchSelect } from '@/components/ui/customer-search-select';

export interface CashBookFilters {
  search?: string;
  transactionType?: 'inflow' | 'outflow' | 'all';
  source?: 'clearance' | 'ledger' | 'expense' | 'manual' | 'all';
  customerId?: number;
  dateFrom?: Date;
  dateTo?: Date;
  sortBy?: 'date' | 'amount' | 'description';
  sortOrder?: 'asc' | 'desc';
}

interface CashBookFiltersProps {
  filters: CashBookFilters;
  onFiltersChange: (filters: CashBookFilters) => void;
  onClearFilters: () => void;
  loading?: boolean;
}

export function CashBookFilters({
  filters,
  onFiltersChange,
  onClearFilters,
  loading = false,
}: CashBookFiltersProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [localSearch, setLocalSearch] = useState(filters.search || '');

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (localSearch !== filters.search) {
        onFiltersChange({ ...filters, search: localSearch || undefined });
      }
    }, 300);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [localSearch]);

  const handleFilterChange = (key: keyof CashBookFilters, value: any) => {
    onFiltersChange({
      ...filters,
      [key]: value === 'all' || value === '' ? undefined : value,
    });
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (filters.search) count++;
    if (filters.transactionType && filters.transactionType !== 'all') count++;
    if (filters.source && filters.source !== 'all') count++;
    if (filters.customerId) count++;
    if (filters.dateFrom || filters.dateTo) count++;
    return count;
  };

  const getSourceIcon = (source: string) => {
    switch (source) {
      case 'clearance':
        return <Receipt className="h-3 w-3" />;
      case 'ledger':
        return <User className="h-3 w-3" />;
      case 'expense':
        return <Building className="h-3 w-3" />;
      case 'manual':
        return <DollarSign className="h-3 w-3" />;
      default:
        return null;
    }
  };

  const activeFiltersCount = getActiveFiltersCount();

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Filters & Search
            {activeFiltersCount > 0 && (
              <Badge variant="secondary" className="ml-2">
                {activeFiltersCount}
              </Badge>
            )}
          </CardTitle>
          <div className="flex items-center gap-2">
            {activeFiltersCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onClearFilters}
                disabled={loading}
              >
                <X className="h-4 w-4 mr-1" />
                Clear
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? 'Less' : 'More'}
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Search Bar - Always Visible */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search transactions by description..."
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            className="pl-10"
            disabled={loading}
          />
        </div>

        {/* Quick Filters - Always Visible */}
        <div className="flex flex-wrap gap-2">
          <Select
            value={filters.transactionType || 'all'}
            onValueChange={(value) =>
              handleFilterChange('transactionType', value)
            }
            disabled={loading}
          >
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="inflow">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-green-600" />
                  Inflow
                </div>
              </SelectItem>
              <SelectItem value="outflow">
                <div className="flex items-center gap-2">
                  <TrendingDown className="h-4 w-4 text-red-600" />
                  Outflow
                </div>
              </SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={filters.source || 'all'}
            onValueChange={(value) => handleFilterChange('source', value)}
            disabled={loading}
          >
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Sources</SelectItem>
              <SelectItem value="clearance">
                <div className="flex items-center gap-2">
                  {getSourceIcon('clearance')}
                  Clearance
                </div>
              </SelectItem>
              <SelectItem value="ledger">
                <div className="flex items-center gap-2">
                  {getSourceIcon('ledger')}
                  Ledger
                </div>
              </SelectItem>
              <SelectItem value="expense">
                <div className="flex items-center gap-2">
                  {getSourceIcon('expense')}
                  Expense
                </div>
              </SelectItem>
              <SelectItem value="manual">
                <div className="flex items-center gap-2">
                  {getSourceIcon('manual')}
                  Manual
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Advanced Filters - Expandable */}
        {isExpanded && (
          <div className="space-y-4 pt-4 border-t">
            {/* Customer Filter */}
            <div className="space-y-2">
              <Label>Customer</Label>
              <CustomerSearchSelect
                value={filters.customerId || 0}
                onValueChange={(value) =>
                  handleFilterChange('customerId', value || undefined)
                }
                placeholder="Select customer..."
                disabled={loading}
                allowClear={true}
              />
            </div>

            {/* Date Range Filter */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>From Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        'w-full justify-start text-left font-normal',
                        !filters.dateFrom && 'text-muted-foreground'
                      )}
                      disabled={loading}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {filters.dateFrom
                        ? format(filters.dateFrom, 'MMM dd, yyyy')
                        : 'Select date'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={filters.dateFrom}
                      onSelect={(date) => handleFilterChange('dateFrom', date)}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label>To Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        'w-full justify-start text-left font-normal',
                        !filters.dateTo && 'text-muted-foreground'
                      )}
                      disabled={loading}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {filters.dateTo
                        ? format(filters.dateTo, 'MMM dd, yyyy')
                        : 'Select date'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={filters.dateTo}
                      onSelect={(date) => handleFilterChange('dateTo', date)}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            {/* Sorting Options */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Sort By</Label>
                <Select
                  value={filters.sortBy || 'date'}
                  onValueChange={(value) => handleFilterChange('sortBy', value)}
                  disabled={loading}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="date">Date</SelectItem>
                    <SelectItem value="amount">Amount</SelectItem>
                    <SelectItem value="description">Description</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Sort Order</Label>
                <Select
                  value={filters.sortOrder || 'asc'}
                  onValueChange={(value) =>
                    handleFilterChange('sortOrder', value)
                  }
                  disabled={loading}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="asc">
                      <div className="flex items-center gap-2">
                        <ArrowUpDown className="h-4 w-4" />
                        Ascending
                      </div>
                    </SelectItem>
                    <SelectItem value="desc">
                      <div className="flex items-center gap-2">
                        <ArrowUpDown className="h-4 w-4 rotate-180" />
                        Descending
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        )}

        {/* Active Filters Display */}
        {activeFiltersCount > 0 && (
          <div className="flex flex-wrap gap-2 pt-2 border-t">
            {filters.search && (
              <Badge variant="secondary" className="gap-1">
                Search: "{filters.search}"
                <X
                  className="h-3 w-3 cursor-pointer"
                  onClick={() => {
                    setLocalSearch('');
                    handleFilterChange('search', undefined);
                  }}
                />
              </Badge>
            )}
            {filters.transactionType && filters.transactionType !== 'all' && (
              <Badge variant="secondary" className="gap-1">
                Type: {filters.transactionType}
                <X
                  className="h-3 w-3 cursor-pointer"
                  onClick={() => handleFilterChange('transactionType', 'all')}
                />
              </Badge>
            )}
            {filters.source && filters.source !== 'all' && (
              <Badge variant="secondary" className="gap-1">
                Source: {filters.source}
                <X
                  className="h-3 w-3 cursor-pointer"
                  onClick={() => handleFilterChange('source', 'all')}
                />
              </Badge>
            )}
            {filters.customerId && (
              <Badge variant="secondary" className="gap-1">
                Customer Selected
                <X
                  className="h-3 w-3 cursor-pointer"
                  onClick={() => handleFilterChange('customerId', undefined)}
                />
              </Badge>
            )}
            {(filters.dateFrom || filters.dateTo) && (
              <Badge variant="secondary" className="gap-1">
                Date Range
                <X
                  className="h-3 w-3 cursor-pointer"
                  onClick={() => {
                    handleFilterChange('dateFrom', undefined);
                    handleFilterChange('dateTo', undefined);
                  }}
                />
              </Badge>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
