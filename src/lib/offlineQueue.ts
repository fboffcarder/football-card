// ─── Offline Queue ────────────────────────────────────────────────────────────
// When the device has no internet, mutations are stored in localStorage.
// When connectivity returns, the queue is flushed to Supabase.

export interface QueuedOperation {
  id: string;
  table: string;
  operation: 'insert' | 'update' | 'delete';
  data: Record<string, unknown>;
  createdAt: string;
}

const QUEUE_KEY = 'fo_offline_queue';

export function getQueue(): QueuedOperation[] {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(localStorage.getItem(QUEUE_KEY) || '[]');
  } catch {
    return [];
  }
}

export function addToQueue(op: Omit<QueuedOperation, 'id' | 'createdAt'>) {
  const queue = getQueue();
  const entry: QueuedOperation = {
    ...op,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
  };
  queue.push(entry);
  localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
  return entry;
}

export function removeFromQueue(id: string) {
  const queue = getQueue().filter((op) => op.id !== id);
  localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
}

export function clearQueue() {
  localStorage.removeItem(QUEUE_KEY);
}

export function getQueueLength(): number {
  return getQueue().length;
}
