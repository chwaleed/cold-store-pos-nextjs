'use client';

import { useEffect, useRef } from 'react';

/**
 * Hook to check and run scheduled backups on app startup
 */
export function useBackupScheduler() {
  const hasChecked = useRef(false);

  useEffect(() => {
    // Only run once per session
    if (hasChecked.current) return;
    hasChecked.current = true;

    const checkScheduledBackup = async () => {
      try {
        const response = await fetch('/api/backup/check-schedule');
        const data = await response.json();

        if (data.success && data.backupNeeded) {
          console.log('Scheduled backup created:', data.fileName);
        }
      } catch (error) {
        console.error('Error checking scheduled backup:', error);
      }
    };

    // Run check after a short delay to not block app startup
    const timeoutId = setTimeout(checkScheduledBackup, 2000);

    return () => clearTimeout(timeoutId);
  }, []);
}
