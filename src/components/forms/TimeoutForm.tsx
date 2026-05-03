'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Modal } from '@/components/ui/Modal';

// wall_clock_time removed — not in timeouts table schema
const schema = z.object({
  team: z.string().min(1, 'Required'),
  quarter: z.coerce.number().min(1).max(10),
  game_clock_time: z.string().optional(),
  timeout_number_for_team: z.coerce.number().optional().nullable(),
  reason: z.string().optional(),
  player_number: z.coerce.number().optional().nullable(),
});

type FormData = z.infer<typeof schema>;

interface TimeoutFormProps {
  gameId: string;
  homeName: string;
  awayName: string;
  currentQuarter: number;
  currentClock: string;
  onSave: (data: FormData & { game_id: string }) => Promise<void>;
  onClose: () => void;
}

export function TimeoutForm({
  gameId, homeName, awayName, currentQuarter, currentClock, onSave, onClose,
}: TimeoutFormProps) {
  const { register, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { quarter: currentQuarter, game_clock_time: currentClock },
  });

  const reason = watch('reason');

  const onSubmit = async (data: FormData) => {
    const payload = {
      ...data,
      game_id: gameId,
      player_number: data.reason === 'Player' ? data.player_number : undefined,
    };
    await onSave(payload);
    onClose();
  };

  return (
    <Modal title="🏳️ Timeout" onClose={onClose} size="sm">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="label">Team</label>
          <select {...register('team')} className="input-field">
            <option value="">Select team…</option>
            <option value="home">{homeName} (Home)</option>
            <option value="away">{awayName} (Away)</option>
          </select>
          {errors.team && <p className="text-red-400 text-xs mt-1">{errors.team.message}</p>}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Quarter</label>
            <select {...register('quarter')} className="input-field">
              {[1,2,3,4,5,6,7].map(q => (
                <option key={q} value={q}>{q <= 4 ? `Q${q}` : `OT${q-4}`}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Clock</label>
            <input {...register('game_clock_time')} placeholder="7:42" className="input-field" />
          </div>
        </div>

        <div>
          <label className="label">Timeout # (this half)</label>
          <div className="flex gap-3">
            {[1, 2, 3].map(n => (
              <label key={n} className="flex items-center gap-2 cursor-pointer bg-[var(--color-surface-2)] rounded-lg px-4 py-2 flex-1 justify-center">
                <input type="radio" {...register('timeout_number_for_team')} value={n} className="accent-field-500" />
                <span className="text-sm text-[var(--color-text)]">#{n}</span>
              </label>
            ))}
          </div>
        </div>

        <div>
          <label className="label">Reason</label>
          <select {...register('reason')} className="input-field">
            <option value="">—</option>
            <option value="Coach">Coach</option>
            <option value="Injury">Injury</option>
            <option value="Player">Player</option>
            <option value="TV">TV</option>
            <option value="Challenge">Challenge</option>
          </select>
        </div>

        {reason === 'Player' && (
          <div>
            <label className="label">Player #</label>
            <input
              {...register('player_number')}
              type="number"
              placeholder="Jersey number"
              className="input-field"
            />
          </div>
        )}

        <button type="submit" disabled={isSubmitting} className="btn-primary w-full">
          {isSubmitting ? 'Saving…' : 'Save Timeout'}
        </button>
      </form>
    </Modal>
  );
}
