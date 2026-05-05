'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Modal } from '@/components/ui/Modal';
import { EVENT_TYPES } from '@/types';
import { nowTimeString } from '@/lib/utils';
import type { GameEvent } from '@/types';

const schema = z.object({
  quarter: z.coerce.number().optional().nullable(),
  game_clock_time: z.string().optional(),
  event_type: z.string().min(1, 'Required'),
  team_involved: z.string().optional(),
  player_number: z.coerce.number().optional().nullable(),
  description: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

interface EventFormProps {
  gameId: string;
  homeName: string;
  awayName: string;
  currentQuarter: number;
  currentClock: string;
  initialData?: Partial<GameEvent>;
  onSave: (data: FormData & { game_id: string; wall_clock_time: string }) => Promise<void>;
  onClose: () => void;
}

export function EventForm({
  gameId, homeName, awayName, currentQuarter, currentClock, initialData, onSave, onClose,
}: EventFormProps) {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      quarter:         initialData?.quarter         ?? currentQuarter,
      game_clock_time: initialData?.game_clock_time ?? currentClock,
      event_type:      initialData?.event_type      ?? '',
      team_involved:   initialData?.team_involved   ?? '',
      player_number:   initialData?.player_number   ?? undefined,
      description:     initialData?.description     ?? '',
    },
  });

  const onSubmit = async (data: FormData) => {
    await onSave({ ...data, game_id: gameId, wall_clock_time: nowTimeString() });
    onClose();
  };

  return (
    <Modal title="📋 Game Event" onClose={onClose} size="sm">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="label">Event Type</label>
          <select {...register('event_type')} className="input-field">
            <option value="">Select…</option>
            {EVENT_TYPES.map(e => <option key={e} value={e}>{e}</option>)}
          </select>
          {errors.event_type && <p className="text-red-400 text-xs mt-1">{errors.event_type.message}</p>}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Quarter</label>
            <select {...register('quarter')} className="input-field">
              <option value="">—</option>
              {[1,2,3,4,5,6].map(q => <option key={q} value={q}>{q<=4?`Q${q}`:`OT${q-4}`}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Clock</label>
            <input {...register('game_clock_time')} placeholder="7:42" className="input-field" />
          </div>
        </div>

        <div>
          <label className="label">Team Involved (opt)</label>
          <select {...register('team_involved')} className="input-field">
            <option value="">—</option>
            <option value="home">{homeName}</option>
            <option value="away">{awayName}</option>
            <option value="both">Both</option>
          </select>
        </div>

        <div>
          <label className="label">Player # (opt)</label>
          <input {...register('player_number')} type="number" placeholder="##" className="input-field" />
        </div>

        <div>
          <label className="label">Description</label>
          <textarea {...register('description')} rows={3} placeholder="Describe what happened…" className="input-field resize-none" />
        </div>

        <button type="submit" disabled={isSubmitting} className="btn-primary w-full">
          {isSubmitting ? 'Saving…' : initialData ? 'Update Event' : 'Save Event'}
        </button>
      </form>
    </Modal>
  );
}
