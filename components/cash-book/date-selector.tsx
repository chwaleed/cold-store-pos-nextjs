'use client';

import { useState } from 'react';
import { format, addDays, subDays, startOfToday } from 'date-fns';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { ChevronLeft, ChevronRight, CalendarIcon, Home } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DateSelectorProps {
  selectedDate: Date;
  onDateChange: (date: Date) => void;
}

export function DateSelector({
  selectedDate,
  onDateChange,
}: DateSelectorProps) {
  const [calendarOpen, setCalendarOpen] = useState(false);
  const today = startOfToday();

  const handlePreviousDay = () => {
    onDateChange(subDays(selectedDate, 1));
  };

  const handleNextDay = () => {
    onDateChange(addDays(selectedDate, 1));
  };

  const handleToday = () => {
    onDateChange(today);
  };

  const handleDateInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDate = new Date(e.target.value);
    if (!isNaN(newDate.getTime())) {
      onDateChange(newDate);
    }
  };

  const handleCalendarSelect = (date: Date | undefined) => {
    if (date) {
      onDateChange(date);
      setCalendarOpen(false);
    }
  };

  const isToday =
    format(selectedDate, 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd');
  const isFutureDate = selectedDate > today;

  return (
    <Card className="border-l-4 border-l-primary">
      <CardContent className="p-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          {/* Date Navigation */}
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handlePreviousDay}>
              <ChevronLeft className="h-4 w-4" />
            </Button>

            <div className="flex items-center gap-2">
              <Input
                type="date"
                value={format(selectedDate, 'yyyy-MM-dd')}
                onChange={handleDateInputChange}
                className="w-auto"
              />

              <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm">
                    <CalendarIcon className="h-4 w-4" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={handleCalendarSelect}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={handleNextDay}
              disabled={isFutureDate}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          {/* Date Display and Quick Actions */}
          <div className="flex items-center gap-4">
            <div className="text-center sm:text-right">
              <div className="text-lg font-semibold">
                {format(selectedDate, 'EEEE, MMMM dd, yyyy')}
              </div>
              <div className="text-sm text-muted-foreground">
                {isToday ? (
                  <span className="text-green-600 font-medium">Today</span>
                ) : isFutureDate ? (
                  <span className="text-orange-600 font-medium">
                    Future Date
                  </span>
                ) : (
                  `${Math.abs(Math.floor((today.getTime() - selectedDate.getTime()) / (1000 * 60 * 60 * 24)))} day${Math.abs(Math.floor((today.getTime() - selectedDate.getTime()) / (1000 * 60 * 60 * 24))) !== 1 ? 's' : ''} ago`
                )}
              </div>
            </div>

            {!isToday && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleToday}
                className="gap-2"
              >
                <Home className="h-4 w-4" />
                Today
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
