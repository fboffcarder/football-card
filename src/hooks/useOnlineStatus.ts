'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase';
import { getQueue, removeFromQueue } from '@/lib/offlineQueue';

// ─── useOnlineStatus ──────────────────────────────────────────────────────────
// Tracks browser online/offline state and syncs the local queue when back online.

export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const supabase = createClient();

  // Flush buffered writes to Supabase
  const flushQueue = useCallback(async () => {
    const queue = getQueue();
    if (queue.length === 0) return;

    setSyncing(true);
    for (const op of queue) {
      try {
        if (op.operation === 'insert') {
          await supabase.from(op.table).insert(op.data);
        } else if (op.operation === 'update') {
          const { id, ...rest } = op.data as { id: string; [key: string]: unknown };
          await supabase.from(op.table).update(rest).eq('id', id);
        } else if (op.operation === 'delete') {
          await supabase.from(op.table).delete().eq('id', op.data.id);
        }
        removeFromQueue(op.id);
      } catch (err) {
        console.error('Sync error for queued op', op.id, err);
        // Keep in queue to retry next time
      }
    }
    setSyncing(false);
  }, [supabase]);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      flushQueue();
    };
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    setIsOnline(navigator.onLine);

    // Try to flush on mount (in case app was opened after reconnecting)
    if (navigator.onLine) flushQueue();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [flushQueue]);

  return { isOnline, syncing };
}
