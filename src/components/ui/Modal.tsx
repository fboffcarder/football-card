'use client';

import { useEffect } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ModalProps {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
}

// ─── Modal ────────────────────────────────────────────────────────────────────
// Bottom-sheet style on mobile, centered on desktop.

export function Modal({ title, onClose, children, size = 'md' }: ModalProps) {
  // Close on Escape key
  useEffect(() => {
    const handler = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  // Lock body scroll while open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  const sizeClass = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
  }[size];

  return (
    <div
      className="modal-backdrop fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.7)' }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className={cn(
          'modal-panel w-full rounded-t-3xl sm:rounded-2xl',
          'bg-[var(--color-surface)] border border-[var(--color-border)]',
          'shadow-2xl max-h-[90vh] overflow-y-auto',
          'sm:' + sizeClass,
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-[var(--color-border)] sticky top-0 bg-[var(--color-surface)] z-10">
          <h2 className="font-display text-xl tracking-wider text-[var(--color-text)]">{title}</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-[var(--color-surface-2)] text-[var(--color-text-muted)] transition-colors"
          >
            <X size={20} />
          </button>
        </div>
        <div className="px-5 py-4">{children}</div>
      </div>
    </div>
  );
}
