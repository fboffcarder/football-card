'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
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
  spot_enforcement: z.boolean().default(false),
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
  onSave: (data: FormData & { game_id: string; wall_clock_time: string }) => Promise<void>;
  onClose: () => void;
}

export function PenaltyForm({
  gameId, homeName, awayName, currentQuarter, currentClock, onSave, onClose,
}: PenaltyFormProps) {
  const { register, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { quarter: currentQuarter, game_clock_time: currentClock, status: 'Accepted' },
  });

  const spotEnf = watch('spot_enforcement');

  const onSubmit = async (data: FormData) => {
    await onSave({ ...data, game_id: gameId, wall_clock_time: nowTimeString() });
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
            <select {...register('yardage')} className="input-field" disabled={spotEnf}>
              <option value="">—</option>
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={15}>15</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Down &amp; Distance</label>
            <input {...register('down_and_distance_before')} placeholder="3rd & 8" className="input-field" />
          </div>
          <div>
            <label className="label">Calling Official</label>
            <select {...register('calling_official_position')} className="input-field">
              <option value="">—</option>
              {OFFICIAL_POSITIONS.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
        </div>

        <div>
          <label className="label">Status</label>
          <div className="flex gap-2">
            {['Accepted', 'Declined', 'Offsetting'].map(s => (
              <label key={s} className="flex items-center gap-2 cursor-pointer">
                <input type="radio" {...register('status')} value={s} className="accent-field-500" />
                <span className="text-sm text-[var(--color-text)]">{s}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap gap-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" {...register('spot_enforcement')} className="accent-field-500 w-4 h-4" />
            <span className="text-sm text-[var(--color-text)]">Spot foul</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" {...register('automatic_first_down')} className="accent-field-500 w-4 h-4" />
            <span className="text-sm text-[var(--color-text)]">Auto 1st Down</span>
          </label>
        </div>

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
