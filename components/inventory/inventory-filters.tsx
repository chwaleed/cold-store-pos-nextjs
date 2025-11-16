'use client';

import { useState, useEffect } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import useStore from '@/app/(root)/(store)/store';

interface InventoryFiltersProps {
  filters: {
    room: string;
    type: string;
    subType: string;
    dateFrom: string;
    dateTo: string;
    search: string;
  };
  setFilters: (filters: any) => void;
  searchPlaceholder?: string;
}

export function InventoryFilters({
  filters,
  setFilters,
  searchPlaceholder = 'Search by receipt no, marka, or box no...',
}: InventoryFiltersProps) {
  const [subTypesToShow, setSubTypesToShow] = useState<any[]>([]);
  const [searchInput, setSearchInput] = useState(filters.search || '');
  const rooms = useStore((state) => state.rooms);
  const types = useStore((state) => state.types);
  const subTypes = useStore((state) => state.subType);

  useEffect(() => {
    if (!filters.type) return;
    if (filters.type != 'all') {
      const filtered = subTypes.filter(
        (st) => st.productTypeId.toString() === filters.type
      );
      setSubTypesToShow(filtered);
    } else {
      setSubTypesToShow([]);
    }
  }, [filters.type, subTypes]);

  // Debounce search input
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchInput !== filters.search) {
        setFilters({ ...filters, search: searchInput });
      }
    }, 500); // 500ms debounce

    return () => clearTimeout(timeoutId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchInput]);

  return (
    <div className="space-y-3">
      {/* Search Bar */}
      <div className="flex gap-5">
        <div className="w-full">
          <Input
            placeholder={searchPlaceholder}
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="w-full"
          />
        </div>

        {/* Compact Filters */}
        <div className="flex gap-2">
          <Select
            value={filters.room}
            onValueChange={(value) => setFilters({ ...filters, room: value })}
          >
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Room" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Rooms</SelectItem>
              {rooms.map((room) => (
                <SelectItem key={room.id} value={room.id.toString()}>
                  {room.name} ({room.type})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={filters.type}
            onValueChange={(value) =>
              setFilters({ ...filters, type: value, subType: 'all' })
            }
          >
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              {types.map((type) => (
                <SelectItem key={type.id} value={type.id.toString()}>
                  {type.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={filters.subType}
            disabled={subTypesToShow.length === 0}
            onValueChange={(value) =>
              setFilters({ ...filters, subType: value })
            }
          >
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Subtype" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Subtype</SelectItem>
              {subTypesToShow.map((subtype) => (
                <SelectItem key={subtype.id} value={subtype.id.toString()}>
                  {subtype.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Input
            type="date"
            value={filters.dateFrom}
            onChange={(e) =>
              setFilters({ ...filters, dateFrom: e.target.value })
            }
            className="w-[150px]"
          />

          <Input
            type="date"
            value={filters.dateTo}
            onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
            className="w-[150px]"
          />
        </div>
      </div>
    </div>
  );
}
