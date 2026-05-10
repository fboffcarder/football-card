'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { FOUL_TYPES } from '@/types';
import { nowTimeString } from '@/lib/utils';
import type { Penalty, Official } from '@/types';

const schema = z.object({
  quarter: z.coerce.number().min(1),
  game_clock_time: z.string().optional(),
  team_penalized: z.string().min(1, 'Required'),
  player_number: z.coerce.number().optional().nullable(),
  foul_type: z.string().min(1, 'Required'),
  yardage: z.coerce.number().optional().nullable(),
  enforcement_type: z.string().optional(),
  enforcement_modifier: z.string().optional(),
  status: z.string().default('Accepted'),
  automatic_first_down: z.boolean().default(false),
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
  officials: Official[];
  initialData?: Partial<Penalty>;
  onSave: (data: FormData & { game_id: string; wall_clock_time: string; spot_enforcement: boolean }) => Promise<void>;
  onClose: () => void;
}

export function PenaltyForm({
  gameId, homeName, awayName, currentQuarter, currentClock, officials, initialData, onSave, onClose,
}: PenaltyFormProps) {
  // Pre-populate officials from stored comma-separated string
  const [selectedOfficials, setSelectedOfficials] = useState<string[]>(
    initialData?.calling_official_position
      ? initialData.calling_official_position.split(', ').filter(Boolean)
      : []
  );

  // Derive enforcement_modifier from spot_enforcement if enforcement_modifier not stored
  const derivedModifier =
    initialData?.enforcement_modifier ??
    (initialData?.spot_enforcement === true ? 'spot' : initialData?.spot_enforcement === false ? 'previous' : undefined);

  const { register, handleSubmit, watch, setValue, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      quarter: initialData?.quarter ?? currentQuarter,
      game_clock_time: initialData?.game_clock_time ?? currentClock,
      team_penalized: initialData?.team_penalized ?? '',
      player_number: initialData?.player_number ?? undefined,
      foul_type: initialData?.foul_type ?? '',
      yardage: initialData?.yardage ?? undefined,
      enforcement_type: initialData?.enforcement_type ?? undefined,
      enforcement_modifier: derivedModifier,
      status: initialData?.status ?? 'Accepted',
      automatic_first_down: initialData?.automatic_first_down ?? false,
      down_and_distance_before: initialData?.down_and_distance_before ?? '',
      notes: initialData?.notes ?? '',
    },
  });

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
      calling_official_position: selectedOfficials.join(', ') || undefined,
    });
    onClose();
  };

  return (
    <Modal title="🚩 Penalty" onClose={onClose} size="lg">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">

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

        <div>
          <label className="label">Foul Type</label>
          <select {...register('foul_type')} className="input-field">
            <option value="">Select foul…</option>
            {FOUL_TYPES.map(f => <option key={f} value={f}>{f}</option>)}
          </select>
          {errors.foul_type && <p className="text-red-400 text-xs mt-1">{errors.foul_type.message}</p>}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Player # (opt)</label>
            <input {...register('player_number')} type="number" placeholder="##" className="input-field" />
          </div>
          <div>
            <label className="label">Yards</label>
            <select {...register('yardage')} className="input-field">
              <option value="">—</option>
              {Array.from({ length: 15 }, (_, i) => i + 1).map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Enforcement: Live / Dead Ball */}
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

        <div>
          <label className="label">Down &amp; Distance After Enforcement</label>
          <input {...register('down_and_distance_before')} placeholder="e.g. 1st & 10" className="input-field" />
        </div>

        {/* Calling Officials — only officials assigned to this game */}
        <div>
          <label className="label">Calling Official(s)</label>
          {officials.length === 0 ? (
            <p className="text-xs text-[var(--color-text-dim)] italic">No officials recorded for this game.</p>
          ) : (
            <div className="grid grid-cols-2 gap-1.5">
              {officials.map(o => {
                const label = o.name ? `${o.name} (${o.position})` : o.position;
                const key   = o.name || o.position;
                return (
                  <label key={key}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer text-sm transition-colors ${
                      selectedOfficials.includes(key)
                        ? 'bg-field-800 border-field-500 text-field-300'
                        : 'border-[var(--color-border)] text-[var(--color-text-dim)]'
                    }`}
                    onClick={() => toggleOfficial(key)}
                  >
                    <span className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${
                      selectedOfficials.includes(key) ? 'bg-field-500 border-field-500' : 'border-[var(--color-border)]'
                    }`}>
                      {selectedOfficials.includes(key) && <span className="text-white text-xs">✓</span>}
                    </span>
                    {label}
                  </label>
                );
              })}
            </div>
          )}
        </div>

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

        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" {...register('automatic_first_down')} className="accent-field-500 w-4 h-4" />
          <span className="text-sm text-[var(--color-text)]">Automatic 1st Down</span>
        </label>

        <div>
          <label className="label">Notes (opt)</label>
          <textarea {...register('notes')} rows={2} placeholder="Any extra details…" className="input-field resize-none" />
        </div>

        <button type="submit" disabled={isSubmitting} className="btn-primary w-full">
          {isSubmitting ? 'Saving…' : initialData ? 'Update Penalty' : 'Save Penalty'}
        </button>
      </form>
    </Modal>
  );
}
