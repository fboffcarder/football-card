import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format, parseISO } from 'date-fns';

// ─── Tailwind class helper ────────────────────────────────────────────────────
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// ─── Date formatting ──────────────────────────────────────────────────────────
export function formatGameDate(dateStr: string): string {
  try {
    return format(parseISO(dateStr), 'EEE, MMM d, yyyy');
  } catch {
    return dateStr;
  }
}

export function formatTime(timeStr: string | null): string {
  if (!timeStr) return '—';
  // HH:MM:SS → HH:MM AM/PM
  try {
    const [h, m] = timeStr.split(':');
    const hour = parseInt(h, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${m} ${ampm}`;
  } catch {
    return timeStr;
  }
}

// ─── Score display ────────────────────────────────────────────────────────────
export function formatScore(home: number | null, away: number | null): string {
  if (home === null || away === null) return 'In Progress';
  return `${home}–${away}`;
}

// ─── Quarter display ──────────────────────────────────────────────────────────
export function formatQuarter(q: number): string {
  if (q === 1) return '1st';
  if (q === 2) return '2nd';
  if (q === 3) return '3rd';
  if (q === 4) return '4th';
  return `OT${q - 4}`;
}

// ─── Penalty summary ──────────────────────────────────────────────────────────
export function penaltyLabel(foulType: string, yardage: number | null, spotEnforcement: boolean): string {
  if (spotEnforcement) return `${foulType} (spot foul)`;
  if (yardage) return `${foulType} (${yardage} yds)`;
  return foulType;
}

// ─── Wall clock ───────────────────────────────────────────────────────────────
export function nowTimeString(): string {
  const now = new Date();
  return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:00`;
}
