'use client';
import React, { useState, useEffect } from 'react';
import NextTopLoader from 'nextjs-toploader';
interface RootLayoutProps {
  children: React.ReactNode;
}
import Link from 'next/link';
import { Menu, Snowflake } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetTrigger } from '@/components/ui/sheet';
import { ModeToggle } from '@/components/darkmode/darkmode';
import { ThemeProvider } from '@/components/theme-provider';
import Navbar from '@/components/dashboard/navbar';
import { NavbarSheet } from '@/components/dashboard/NavbarSheet';
import Bread from '@/components/dashboard/breadcrumb';
import axios from 'axios';
import { KeyboardShortcutsProvider } from '@/components/keyboard-shortcuts/keyboard-shortcuts-provider';
import useStore from './(store)/store';
import { useBackupScheduler } from '@/lib/use-backup-scheduler';

const RootLayout = ({ children }: RootLayoutProps) => {
  const [storeName, setStoreName] = useState<string | null>('Ahmad Cold Store');
  const state = useStore((state) => state);

  // Initialize backup scheduler
  useBackupScheduler();

  const fetchFilters = async () => {
    try {
      const [types, subTypes, rooms, packTypes] = await Promise.all([
        axios.get('/api/producttype'),
        axios.get('/api/productsubtype'),
        axios.get('/api/room'),
        axios.get('/api/packtype'),
      ]);
      if (types.data && types.data?.success) {
        state.setTypes(types.data.data);
      }
      if (subTypes.data && subTypes.data?.success) {
        state.setSubTypes(subTypes.data.data);
      }
      if (rooms.data && rooms.data?.success) {
        state.setRooms(rooms.data.data);
      }
      if (packTypes.data && packTypes.data?.success) {
        state.setPackTypes(packTypes.data.data);
      }
    } catch (error) {
      console.error('Error fetching filters:', error);
    }
  };

  const doublePrices = async () => {
    try {
      await axios.get('/api/inventory/apply-double');
    } catch (error) {}
  };

  useEffect(() => {
    fetchFilters();
    doublePrices();
  }, []);

  return (
    <KeyboardShortcutsProvider>
      <div className="bg-gray-300 dark:bg-black">
        <div className="grid min-h-screen w-full md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr]">
          <div className="hidden border-r bg-muted/40 md:block">
            <div className="flex h-full max-h-screen flex-col gap-2">
              <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
                <Link
                  href="/"
                  className="flex items-center gap-2 font-semibold"
                >
                  <Snowflake className="h-6 w-6" />
                  <span className="">{storeName} </span>
                </Link>
              </div>
              <Navbar />
            </div>
          </div>
          <div className="flex  flex-col">
            <header className="flex h-14 items-center gap-4 border-b bg-muted/40 px-4 lg:h-[60px] lg:px-6">
              <Sheet>
                <SheetTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    className="shrink-0 md:hidden"
                  >
                    <Menu className="h-5 w-5" />
                    <span className="sr-only">Toggle navigation menu</span>
                  </Button>
                </SheetTrigger>
                <NavbarSheet />
              </Sheet>
              <Bread />
              <ModeToggle />
            </header>
            <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
              <div
                className="flex flex-1 items-center justify-center rounded-lg border border-dashed shadow-sm"
                x-chunk="dashboard-02-chunk-1"
              >
                <ThemeProvider
                  attribute="class"
                  defaultTheme="system"
                  enableSystem
                  disableTransitionOnChange
                >
                  <NextTopLoader showSpinner={false} />
                  {children}
                </ThemeProvider>
              </div>
            </main>
          </div>
        </div>
      </div>
    </KeyboardShortcutsProvider>
  );
};

export default RootLayout;
