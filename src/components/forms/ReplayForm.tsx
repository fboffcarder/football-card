'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Modal } from '@/components/ui/Modal';
import type { InstantReplay } from '@/types';

const schema = z.object({
  quarter: z.coerce.number().min(1),
  game_clock_time: z.string().optional(),
  initiated_by: z.string().min(1, 'Required'),
  challenging_team: z.string().optional(),
  play_description: z.string().optional(),
  original_ruling: z.string().optional(),
  outcome: z.string().min(1, 'Required'),
  timeout_charged: z.boolean().default(false),
  review_duration_minutes: z.coerce.number().optional().nullable(),
});

type FormData = z.infer<typeof schema>;

interface ReplayFormProps {
  gameId: string;
  homeName: string;
  awayName: string;
  currentQuarter: number;
  currentClock: string;
  initialData?: Partial<InstantReplay>;
  onSave: (data: FormData & { game_id: string }) => Promise<void>;
  onClose: () => void;
}

export function ReplayForm({
  gameId, homeName, awayName, currentQuarter, currentClock, initialData, onSave, onClose,
}: ReplayFormProps) {
  const { register, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      quarter:                 initialData?.quarter                 ?? currentQuarter,
      game_clock_time:         initialData?.game_clock_time         ?? currentClock,
      initiated_by:            initialData?.initiated_by            ?? '',
      challenging_team:        initialData?.challenging_team        ?? '',
      play_description:        initialData?.play_description        ?? '',
      original_ruling:         initialData?.original_ruling         ?? '',
      outcome:                 initialData?.outcome                 ?? '',
      timeout_charged:         initialData?.timeout_charged         ?? false,
      review_duration_minutes: initialData?.review_duration_minutes ?? undefined,
    },
  });

  const initiatedBy = watch('initiated_by');

  const onSubmit = async (data: FormData) => {
    await onSave({ ...data, game_id: gameId });
    onClose();
  };

  return (
    <Modal title="📹 Instant Replay" onClose={onClose} size="md">
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
          <label className="label">Initiated By</label>
          <div className="flex gap-3">
            {["Booth Review", "Coach's Challenge"].map(v => (
              <label key={v} className="flex items-center gap-2 cursor-pointer">
                <input type="radio" {...register('initiated_by')} value={v} className="accent-field-500" />
                <span className="text-sm text-[var(--color-text)]">{v}</span>
              </label>
            ))}
          </div>
          {errors.initiated_by && <p className="text-red-400 text-xs mt-1">{errors.initiated_by.message}</p>}
        </div>

        {initiatedBy === "Coach's Challenge" && (
          <div>
            <label className="label">Challenging Team</label>
            <select {...register('challenging_team')} className="input-field">
              <option value="">Select…</option>
              <option value="home">{homeName}</option>
              <option value="away">{awayName}</option>
            </select>
          </div>
        )}

        <div>
          <label className="label">Play Description</label>
          <textarea {...register('play_description')} rows={2} placeholder="Brief description of the play reviewed…" className="input-field resize-none" />
        </div>

        <div>
          <label className="label">Original Ruling</label>
          <input {...register('original_ruling')} placeholder="e.g. Touchdown, Incomplete pass" className="input-field" />
        </div>

        <div>
          <label className="label">Outcome</label>
          <div className="flex gap-3 flex-wrap">
            {['Confirmed', 'Reversed', 'Stands (inconclusive)'].map(v => (
              <label key={v} className="flex items-center gap-2 cursor-pointer">
                <input type="radio" {...register('outcome')} value={v} className="accent-field-500" />
                <span className="text-sm text-[var(--color-text)]">{v}</span>
              </label>
            ))}
          </div>
          {errors.outcome && <p className="text-red-400 text-xs mt-1">{errors.outcome.message}</p>}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Duration (min)</label>
            <input {...register('review_duration_minutes')} type="number" placeholder="3" className="input-field" />
          </div>
          <div className="flex items-end pb-1">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" {...register('timeout_charged')} className="accent-field-500 w-4 h-4" />
              <span className="text-sm text-[var(--color-text)]">Timeout charged</span>
            </label>
          </div>
        </div>

        <button type="submit" disabled={isSubmitting} className="btn-primary w-full">
          {isSubmitting ? 'Saving…' : initialData ? 'Update Replay' : 'Save Replay'}
        </button>
      </form>
    </Modal>
  );
}
