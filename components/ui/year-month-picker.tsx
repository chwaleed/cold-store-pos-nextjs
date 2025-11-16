'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface YearMonthPickerProps {
  value: Date;
  onChange: (date: Date) => void;
  mode: 'year' | 'month';
}

const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

export function YearMonthPicker({
  value,
  onChange,
  mode,
}: YearMonthPickerProps) {
  const currentYear = new Date().getFullYear();
  const selectedYear = value.getFullYear();
  const selectedMonth = value.getMonth();

  // Generate years array (from 2020 to current year + 2)
  const years = Array.from({ length: currentYear - 2018 }, (_, i) => 2020 + i);

  const handleYearChange = (year: string) => {
    const newDate = new Date(value);
    newDate.setFullYear(parseInt(year));
    onChange(newDate);
  };

  const handleMonthChange = (month: string) => {
    const newDate = new Date(value);
    newDate.setMonth(parseInt(month));
    onChange(newDate);
  };

  const handlePreviousYear = () => {
    const newDate = new Date(value);
    newDate.setFullYear(selectedYear - 1);
    onChange(newDate);
  };

  const handleNextYear = () => {
    const newDate = new Date(value);
    newDate.setFullYear(selectedYear + 1);
    onChange(newDate);
  };

  const handlePreviousMonth = () => {
    const newDate = new Date(value);
    newDate.setMonth(selectedMonth - 1);
    onChange(newDate);
  };

  const handleNextMonth = () => {
    const newDate = new Date(value);
    newDate.setMonth(selectedMonth + 1);
    onChange(newDate);
  };

  if (mode === 'year') {
    return (
      <div className="space-y-2">
        <Label>Select Year</Label>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={handlePreviousYear}
            disabled={selectedYear <= 2020}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Select
            value={selectedYear.toString()}
            onValueChange={handleYearChange}
          >
            <SelectTrigger className="flex-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {years.map((year) => (
                <SelectItem key={year} value={year.toString()}>
                  {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="icon"
            onClick={handleNextYear}
            disabled={selectedYear >= currentYear + 1}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <Label>Select Month and Year</Label>
      <div className="space-y-2">
        {/* Year Selection */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={handlePreviousYear}
            disabled={selectedYear <= 2020}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Select
            value={selectedYear.toString()}
            onValueChange={handleYearChange}
          >
            <SelectTrigger className="flex-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {years.map((year) => (
                <SelectItem key={year} value={year.toString()}>
                  {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="icon"
            onClick={handleNextYear}
            disabled={selectedYear >= currentYear + 1}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        {/* Month Selection */}
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={handlePreviousMonth}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Select
            value={selectedMonth.toString()}
            onValueChange={handleMonthChange}
          >
            <SelectTrigger className="flex-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {MONTHS.map((month, index) => (
                <SelectItem key={index} value={index.toString()}>
                  {month}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon" onClick={handleNextMonth}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
