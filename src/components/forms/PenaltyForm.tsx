'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { FOUL_TYPES, OFFICIAL_POSITIONS } from '@/types';
import { nowTimeString } from '@/lib/utils';

const schema = z.object({
  quarter: z.coerce.number().min(1),
  game_clock_time: z.string().optional(),
  team_penalized: z.string().min(1, 'Required'),
  player_number: z.coerce.number().optional().nullable(),
  foul_type: z.string().min(1, 'Required'),
  yardage: z.coerce.number().optional().nullable(),
  // enforcement: live_ball or dead_ball
  enforcement_type: z.string().optional(),
  // modifier: spot or previous (sub-option under live/dead)
  enforcement_modifier: z.string().optional(),
  status: z.string().default('Accepted'),
  automatic_first_down: z.boolean().default(false),
  // stored as comma-separated string in existing column
  calling_official_position: z.string().optional(),
  down_and_distance_before: z.string().optional(),
  notes: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

interface PenaltyFormProps {
  gameId: string;
  homeName: string;
  awayName: string;
  currentQuarter: number;
  currentClock: string;
  onSave: (data: FormData & { game_id: string; wall_clock_time: string; spot_enforcement: boolean }) => Promise<void>;
  onClose: () => void;
}

export function PenaltyForm({
  gameId, homeName, awayName, currentQuarter, currentClock, onSave, onClose,
}: PenaltyFormProps) {
  const { register, handleSubmit, watch, setValue, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { quarter: currentQuarter, game_clock_time: currentClock, status: 'Accepted' },
  });

  // Multi-select officials state
  const [selectedOfficials, setSelectedOfficials] = useState<string[]>([]);

  const toggleOfficial = (position: string) => {
    setSelectedOfficials(prev =>
      prev.includes(position) ? prev.filter(p => p !== position) : [...prev, position]
    );
  };

  const enforcementType = watch('enforcement_type');

  const onSubmit = async (data: FormData) => {
    const isSpot = data.enforcement_modifier === 'spot';
    await onSave({
      ...data,
      game_id: gameId,
      wall_clock_time: nowTimeString(),
      spot_enforcement: isSpot,
      // Store selected officials as comma-separated string
      calling_official_position: selectedOfficials.join(', ') || undefined,
    });
    onClose();
  };

  return (
    <Modal title="🚩 Penalty" onClose={onClose} size="lg">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">

        {/* Quarter + Clock */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Quarter</label>
            <select {...register('quarter')} className="input-field">
              {[1,2,3,4,5,6].map(q => <option key={q} value={q}>{q<=4?`Q${q}`:`OT${q-4}`}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Clock</label>
            <input {...register('game_clock_time')} placeholder="7:42" className="input-field" />
          </div>
        </div>

        {/* Team */}
        <div>
          <label className="label">Team Penalized</label>
          <select {...register('team_penalized')} className="input-field">
            <option value="">Select…</option>
            <option value="home">{homeName} (Home)</option>
            <option value="away">{awayName} (Away)</option>
            <option value="offsetting">Offsetting</option>
          </select>
          {errors.team_penalized && <p className="text-red-400 text-xs mt-1">{errors.team_penalized.message}</p>}
        </div>

        {/* Foul Type */}
        <div>
          <label className="label">Foul Type</label>
          <select {...register('foul_type')} className="input-field">
            <option value="">Select foul…</option>
            {FOUL_TYPES.map(f => <option key={f} value={f}>{f}</option>)}
          </select>
          {errors.foul_type && <p className="text-red-400 text-xs mt-1">{errors.foul_type.message}</p>}
        </div>

        {/* Player + Yards */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Player # (opt)</label>
            <input {...register('player_number')} type="number" placeholder="##" className="input-field" />
          </div>
          <div>
            <label className="label">Yards</label>
            <select {...register('yardage')} className="input-field">
              <option value="">—</option>
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={15}>15</option>
            </select>
          </div>
        </div>

        {/* ── Enforcement: Live / Dead Ball toggle ── */}
        <div>
          <label className="label">Enforcement</label>
          <div className="flex gap-2 mb-2">
            {['Live Ball', 'Dead Ball'].map(type => (
              <label key={type}
                className={`flex-1 text-center py-2 rounded-lg border cursor-pointer text-sm font-display tracking-wider transition-colors ${
                  enforcementType === type
                    ? 'bg-field-700 border-field-500 text-white'
                    : 'border-[var(--color-border)] text-[var(--color-text-muted)]'
                }`}>
                <input type="radio" {...register('enforcement_type')} value={type} className="sr-only" />
                {type}
              </label>
            ))}
          </div>

          {/* Sub-options: Spot / Previous — shown when Live Ball or Dead Ball selected */}
          {enforcementType && (
            <div className="flex gap-2 mt-1">
              {['Spot', 'Previous'].map(mod => (
                <label key={mod}
                  className={`flex-1 text-center py-1.5 rounded-lg border cursor-pointer text-sm transition-colors ${
                    watch('enforcement_modifier') === mod.toLowerCase()
                      ? 'bg-yellow-800 border-yellow-500 text-yellow-200'
                      : 'border-[var(--color-border)] text-[var(--color-text-dim)]'
                  }`}>
                  <input type="radio" {...register('enforcement_modifier')} value={mod.toLowerCase()} className="sr-only" />
                  {mod}
                </label>
              ))}
            </div>
          )}
        </div>

        {/* Down & Distance AFTER enforcement */}
        <div>
          <label className="label">Down &amp; Distance After Enforcement</label>
          <input {...register('down_and_distance_before')} placeholder="e.g. 1st & 10" className="input-field" />
        </div>

        {/* ── Calling Officials — multi-select ── */}
        <div>
          <label className="label">Calling Official(s)</label>
          <div className="grid grid-cols-2 gap-1.5">
            {OFFICIAL_POSITIONS.map(pos => (
              <label key={pos}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer text-sm transition-colors ${
                  selectedOfficials.includes(pos)
                    ? 'bg-field-800 border-field-500 text-field-300'
                    : 'border-[var(--color-border)] text-[var(--color-text-dim)]'
                }`}
                onClick={() => toggleOfficial(pos)}
              >
                <span className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${
                  selectedOfficials.includes(pos) ? 'bg-field-500 border-field-500' : 'border-[var(--color-border)]'
                }`}>
                  {selectedOfficials.includes(pos) && <span className="text-white text-xs">✓</span>}
                </span>
                {pos}
              </label>
            ))}
          </div>
        </div>

        {/* Status */}
        <div>
          <label className="label">Status</label>
          <div className="flex gap-3 flex-wrap">
            {['Accepted', 'Declined', 'Offsetting'].map(s => (
              <label key={s} className="flex items-center gap-2 cursor-pointer">
                <input type="radio" {...register('status')} value={s} className="accent-field-500" />
                <span className="text-sm text-[var(--color-text)]">{s}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Auto 1st Down */}
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" {...register('automatic_first_down')} className="accent-field-500 w-4 h-4" />
          <span className="text-sm text-[var(--color-text)]">Automatic 1st Down</span>
        </label>

        {/* Notes */}
        <div>
          <label className="label">Notes (opt)</label>
          <textarea {...register('notes')} rows={2} placeholder="Any extra details…" className="input-field resize-none" />
        </div>

        <button type="submit" disabled={isSubmitting} className="btn-primary w-full">
          {isSubmitting ? 'Saving…' : 'Save Penalty'}
        </button>
      </form>
    </Modal>
  );
}
