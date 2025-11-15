'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

export function useKeyboardShortcuts() {
  const router = useRouter();

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Check if user is typing in an input field
      const target = event.target as HTMLElement;
      const isInputField = ['INPUT', 'TEXTAREA', 'SELECT'].includes(
        target.tagName
      );

      // F-key shortcuts (work everywhere except when editing)
      if (event.key === 'F4' && !isInputField) {
        event.preventDefault();
        router.push('/records/new');
        toast.info('Opening Stock Entry (Amad)');
      }

      if (event.key === 'F6' && !isInputField) {
        event.preventDefault();
        router.push('/inventory');
        toast.info('Opening Inventory View');
      }

      if (event.key === 'F7' && !isInputField) {
        event.preventDefault();
        router.push('/clearance/new');
        toast.info('Opening Stock Clearance (Nikasi)');
      }

      if (event.key === 'F8' && !isInputField) {
        event.preventDefault();
        router.push('/reports');
        toast.info('Opening Reports');
      }

      if (event.key === 'F9' && !isInputField) {
        event.preventDefault();
        router.push('/settings');
        toast.info('Opening Settings');
      }

      if (event.key === 'F10' && !isInputField) {
        event.preventDefault();
        router.push('/expenses');
        toast.info('Opening Expenses');
      }

      if (event.key === 'F11' && !isInputField) {
        event.preventDefault();
        router.push('/customers');
        toast.info('Opening Customers');
      }

      // Ctrl/Cmd shortcuts
      if (
        (event.ctrlKey || event.metaKey) &&
        event.key === 's' &&
        !isInputField
      ) {
        event.preventDefault();
        // Save will be handled by individual forms
        toast.info('Save: Ctrl+S');
      }

      if (
        (event.ctrlKey || event.metaKey) &&
        event.key === 'p' &&
        !isInputField
      ) {
        event.preventDefault();
        // Print will be handled by individual pages
        toast.info('Print: Ctrl+P');
      }

      if (
        (event.ctrlKey || event.metaKey) &&
        event.key === 'n' &&
        !isInputField
      ) {
        event.preventDefault();
        toast.info('New Entry: Ctrl+N');
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [router]);
}

export function KeyboardShortcutsProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  useKeyboardShortcuts();
  return <>{children}</>;
}
