'use client';

import { WifiOff, RefreshCw } from 'lucide-react';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { getQueueLength } from '@/lib/offlineQueue';
import { useState, useEffect } from 'react';

export function OfflineBadge() {
  const { isOnline, syncing } = useOnlineStatus();
  const [queueLen, setQueueLen] = useState(0);

  useEffect(() => {
    setQueueLen(getQueueLength());
    const interval = setInterval(() => setQueueLen(getQueueLength()), 3000);
    return () => clearInterval(interval);
  }, [isOnline]);

  if (isOnline && queueLen === 0) return null;

  return (
    <div className="offline-badge flex items-center gap-2">
      {syncing ? (
        <>
          <RefreshCw size={12} className="animate-spin" />
          <span>Syncing {queueLen} item{queueLen !== 1 ? 's' : ''}…</span>
        </>
      ) : !isOnline ? (
        <>
          <WifiOff size={12} />
          <span>Offline — data saved locally{queueLen > 0 ? ` (${queueLen} pending)` : ''}</span>
        </>
      ) : null}
    </div>
  );
}
