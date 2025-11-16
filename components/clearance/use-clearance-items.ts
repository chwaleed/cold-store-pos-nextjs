'use client';

import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import type {
  ClearedItemWithDetails,
  EntryItemWithDetails,
} from '@/types/clearance';

interface UseClearanceItemsProps {
  selectedCustomerId: number | undefined;
  showDialog: boolean;
  filters: any;
}

export function useClearanceItems({
  selectedCustomerId,
  showDialog,
  filters,
}: UseClearanceItemsProps) {
  const [availableItems, setAvailableItems] = useState<EntryItemWithDetails[]>(
    []
  );
  const [loadingItems, setLoadingItems] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({
    totalPages: 1,
    currentPage: 1,
    totalItems: 0,
  });

  const fetchItems = useCallback(async () => {
    if (!selectedCustomerId || !showDialog) {
      return;
    }

    setLoadingItems(true);
    try {
      const params = new URLSearchParams({
        customerId: selectedCustomerId.toString(),
        limit: '10', // 10 items per page
        page: currentPage.toString(),
      });

      // Add search parameter (searches receipt no, marka, and box no)
      if (filters.search) {
        params.append('search', filters.search);
      }

      // Add all filter parameters to API call
      if (filters.room && filters.room !== 'all') {
        params.append('roomId', filters.room);
      }

      if (filters.type && filters.type !== 'all') {
        params.append('productTypeId', filters.type);
      }

      if (filters.subType && filters.subType !== 'all') {
        params.append('productSubTypeId', filters.subType);
      }

      if (filters.dateFrom) {
        params.append('dateFrom', filters.dateFrom);
      }

      if (filters.dateTo) {
        params.append('dateTo', filters.dateTo);
      }

      const response = await fetch(`/api/entry/items?${params.toString()}`);
      const data = await response.json();

      if (data.success) {
        setAvailableItems(data.data);
        setPagination(data.pagination);
      } else {
        toast.error('Failed to fetch available items');
      }
    } catch (error) {
      toast.error('Failed to fetch available items');
    } finally {
      setLoadingItems(false);
    }
  }, [selectedCustomerId, showDialog, filters, currentPage]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filters]);

  return {
    availableItems,
    loadingItems,
    pagination,
    currentPage,
    setCurrentPage,
  };
}
