'use client';

import * as React from 'react';
import { Check, ChevronsUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Customer } from '@/types/customer';

interface CustomerSearchSelectProps {
  value?: number;
  onValueChange: (value: number) => void;
  disabled?: boolean;
}

export function CustomerSearchSelect({
  value,
  onValueChange,
  disabled,
}: CustomerSearchSelectProps) {
  const [open, setOpen] = React.useState(false);
  const [customers, setCustomers] = React.useState<Customer[]>([]);
  const [search, setSearch] = React.useState('');
  const [loading, setLoading] = React.useState(false);

  // Fetch recent customers on mount
  React.useEffect(() => {
    const fetchRecentCustomers = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/customer?limit=5');
        const data = await response.json();
        if (data.success) {
          setCustomers(data.data);
        }
      } catch (error) {
        console.error('Failed to fetch recent customers:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchRecentCustomers();
  }, []);

  // Debounced search
  React.useEffect(() => {
    if (!search) {
      // Reset to recent customers when search is cleared
      const fetchRecentCustomers = async () => {
        try {
          const response = await fetch('/api/customer?limit=5');
          const data = await response.json();
          if (data.success) {
            setCustomers(data.data);
          }
        } catch (error) {
          console.error('Failed to fetch recent customers:', error);
        }
      };
      fetchRecentCustomers();
      return;
    }

    const timer = setTimeout(async () => {
      try {
        setLoading(true);
        const response = await fetch(
          `/api/customer?search=${encodeURIComponent(search)}&limit=20`
        );
        const data = await response.json();
        if (data.success) {
          setCustomers(data.data);
        }
      } catch (error) {
        console.error('Failed to search customers:', error);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [search]);

  const selectedCustomer = customers.find((customer) => customer.id === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
          disabled={disabled}
        >
          {selectedCustomer ? selectedCustomer.name : 'Select customer...'}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>

      {/* IMPORTANT: pointer-events-auto + z-index */}
      <PopoverContent
        className="w-[400px] p-0 z-50 pointer-events-auto"
        align="start"
      >
        {/* Override all muted/opacity inside command */}
        <Command
          shouldFilter={false}
          className="[&_*]:!text-black [&_*]:pointer-events-auto"
        >
          <CommandInput
            placeholder="Search customer..."
            value={search}
            onValueChange={setSearch}
          />

          <CommandList>
            <CommandEmpty>
              {loading ? 'Searching...' : 'No customer found.'}
            </CommandEmpty>

            <CommandGroup>
              {customers.map((customer) => (
                <CommandItem
                  key={customer.id}
                  value={customer.id.toString()}
                  // keyboard
                  onSelect={() => {
                    onValueChange(customer.id);
                    setOpen(false);
                  }}
                  // mouse (fix click issue)
                  onClick={(e) => {
                    e.stopPropagation();
                    onValueChange(customer.id);
                    setOpen(false);
                  }}
                  // needed for some browsers
                  onPointerDown={(e) => e.stopPropagation()}
                  className="!text-black cursor-pointer !opacity-100 data-[selected]:!opacity-100 data-[disabled]:!opacity-100 hover:!text-black hover:!opacity-100"
                >
                  <Check
                    className={cn(
                      'mr-2 h-4 w-4',
                      value === customer.id ? 'opacity-100' : 'opacity-0'
                    )}
                  />

                  <div className="flex flex-col">
                    <span className="font-medium">{customer.name}</span>
                    {customer.phone && (
                      <span className="text-xs text-gray-700">
                        {customer.phone}
                      </span>
                    )}
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
