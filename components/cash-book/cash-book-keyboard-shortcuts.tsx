'use client';

import { useEffect } from 'react';
import { toast } from 'sonner';

interface CashBookKeyboardShortcutsProps {
  onAddTransaction: () => void;
  onRefresh?: () => void;
  onToggleFilters?: () => void;
  disabled?: boolean;
}

export function CashBookKeyboardShortcuts({
  onAddTransaction,
  onRefresh,
  onToggleFilters,
  disabled = false,
}: CashBookKeyboardShortcutsProps) {
  useEffect(() => {
    if (disabled) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      // Only handle shortcuts when not typing in an input
      if (
        event.target instanceof HTMLInputElement ||
        event.target instanceof HTMLTextAreaElement ||
        event.target instanceof HTMLSelectElement ||
        (event.target as HTMLElement)?.contentEditable === 'true'
      ) {
        return;
      }

      // Ctrl/Cmd + N: Add new transaction
      if ((event.ctrlKey || event.metaKey) && event.key === 'n') {
        event.preventDefault();
        onAddTransaction();
        toast.success('Opening add transaction dialog', {
          description: 'Keyboard shortcut: Ctrl+N',
        });
      }

      // F5 or Ctrl/Cmd + R: Refresh (optional)
      if (
        onRefresh &&
        (event.key === 'F5' ||
          ((event.ctrlKey || event.metaKey) && event.key === 'r'))
      ) {
        event.preventDefault();
        onRefresh();
        toast.success('Refreshing cash book data', {
          description: 'Keyboard shortcut: F5 or Ctrl+R',
        });
      }

      // Ctrl/Cmd + F: Toggle filters
      if (
        onToggleFilters &&
        (event.ctrlKey || event.metaKey) &&
        event.key === 'f'
      ) {
        event.preventDefault();
        onToggleFilters();
        toast.success('Toggling filters', {
          description: 'Keyboard shortcut: Ctrl+F',
        });
      }

      // ? or /: Show keyboard shortcuts help
      if (event.key === '?' || event.key === '/') {
        event.preventDefault();
        showKeyboardShortcutsHelp();
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [onAddTransaction, onRefresh, onToggleFilters, disabled]);

  const showKeyboardShortcutsHelp = () => {
    toast.info('Cash Book Keyboard Shortcuts', {
      description: (
        <div className="space-y-1 text-sm">
          <div>
            <kbd className="px-1 py-0.5 bg-muted rounded text-xs">Ctrl+N</kbd>{' '}
            Add Transaction
          </div>
          {onToggleFilters && (
            <div>
              <kbd className="px-1 py-0.5 bg-muted rounded text-xs">Ctrl+F</kbd>{' '}
              Toggle Filters
            </div>
          )}
          <div>
            <kbd className="px-1 py-0.5 bg-muted rounded text-xs">?</kbd> Show
            this help
          </div>
        </div>
      ),
      duration: 5000,
    });
  };

  return null; // This component doesn't render anything
}

// Hook for using keyboard shortcuts in functional components
export function useCashBookKeyboardShortcuts(
  handlers: CashBookKeyboardShortcutsProps
) {
  return <CashBookKeyboardShortcuts {...handlers} />;
}
