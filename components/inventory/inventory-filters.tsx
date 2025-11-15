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
import { Checkbox } from '@radix-ui/react-checkbox';
import { Label } from '@/components/ui/label';

interface InventoryFiltersProps {
  filters: {
    room: string;
    type: string;
    marka: string;
    dateFrom: string;
    dateTo: string;
    showZeroStock: boolean;
  };
  setFilters: (filters: any) => void;
}

export function InventoryFilters({
  filters,
  setFilters,
}: InventoryFiltersProps) {
  const [rooms, setRooms] = useState<any[]>([]);
  const [types, setTypes] = useState<any[]>([]);

  useEffect(() => {
    fetchFilterOptions();
  }, []);

  const fetchFilterOptions = async () => {
    try {
      const [roomsRes, typesRes] = await Promise.all([
        fetch('/api/room'),
        fetch('/api/producttype'),
      ]);

      const roomsData = await roomsRes.json();
      const typesData = await typesRes.json();

      if (roomsRes.ok) setRooms(roomsData.data || []);
      if (typesRes.ok) setTypes(typesData.data || []);
    } catch (error) {
      console.error('Error loading filter options:', error);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div className="space-y-2">
        <Label>Room</Label>
        <Select
          value={filters.room}
          onValueChange={(value) => setFilters({ ...filters, room: value })}
        >
          <SelectTrigger>
            <SelectValue placeholder="All rooms" />
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
      </div>

      <div className="space-y-2">
        <Label>Product Type</Label>
        <Select
          value={filters.type}
          onValueChange={(value) => setFilters({ ...filters, type: value })}
        >
          <SelectTrigger>
            <SelectValue placeholder="All types" />
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
      </div>

      <div className="space-y-2">
        <Label>Marka</Label>
        <Input
          placeholder="Search by marka..."
          value={filters.marka}
          onChange={(e) => setFilters({ ...filters, marka: e.target.value })}
        />
      </div>

      <div className="space-y-2">
        <Label>Date From</Label>
        <Input
          type="date"
          value={filters.dateFrom}
          onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
        />
      </div>

      <div className="space-y-2">
        <Label>Date To</Label>
        <Input
          type="date"
          value={filters.dateTo}
          onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
        />
      </div>

      <div className="flex items-center space-x-2 pt-8">
        <Checkbox
          id="showZeroStock"
          checked={filters.showZeroStock}
          onCheckedChange={(checked) =>
            setFilters({ ...filters, showZeroStock: checked })
          }
        />
        <Label htmlFor="showZeroStock" className="cursor-pointer">
          Show zero stock items
        </Label>
      </div>
    </div>
  );
}
