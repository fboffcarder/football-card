'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Modal } from '@/components/ui/Modal';
import { nowTimeString } from '@/lib/utils';

const schema = z.object({
  team: z.string().min(1, 'Required'),
  quarter: z.coerce.number().min(1).max(10),
  game_clock_time: z.string().optional(),
  reason: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

interface TimeoutFormProps {
  gameId: string;
  homeName: string;
  awayName: string;
  currentQuarter: number;
  currentClock: string;
  onSave: (data: FormData & { game_id: string; wall_clock_time?: string }) => Promise<void>;
  onClose: () => void;
}

export function TimeoutForm({
  gameId, homeName, awayName, currentQuarter, currentClock, onSave, onClose,
}: TimeoutFormProps) {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { quarter: currentQuarter, game_clock_time: currentClock },
  });

  const onSubmit = async (data: FormData) => {
    await onSave({ ...data, game_id: gameId, wall_clock_time: nowTimeString() });
    onClose();
  };

  return (
    <Modal title="🏳️ Timeout" onClose={onClose} size="sm">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Team */}
        <div>
          <label className="label">Team</label>
          <select {...register('team')} className="input-field">
            <option value="">Select team…</option>
            <option value="home">{homeName} (Home)</option>
            <option value="away">{awayName} (Away)</option>
          </select>
          {errors.team && <p className="text-red-400 text-xs mt-1">{errors.team.message}</p>}
        </div>

        {/* Quarter + Clock */}
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

        {/* Reason */}
        <div>
          <label className="label">Reason (optional)</label>
          <select {...register('reason')} className="input-field">
            <option value="">—</option>
            <option value="Coach">Coach</option>
            <option value="Injury">Injury</option>
            <option value="TV">TV</option>
            <option value="Challenge">Challenge</option>
          </select>
        </div>

        <button type="submit" disabled={isSubmitting} className="btn-primary w-full">
          {isSubmitting ? 'Saving…' : 'Save Timeout'}
        </button>
      </form>
    </Modal>
  );
}
