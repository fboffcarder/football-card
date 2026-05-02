'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Modal } from '@/components/ui/Modal';
import { SCORE_TYPES } from '@/types';
import { nowTimeString } from '@/lib/utils';

const schema = z.object({
  quarter: z.coerce.number().min(1),
  game_clock_time: z.string().optional(),
  scoring_team: z.string().min(1, 'Required'),
  score_type: z.string().min(1, 'Required'),
  scoring_player_number: z.coerce.number().optional().nullable(),
  home_score_after: z.coerce.number().min(0),
  away_score_after: z.coerce.number().min(0),
  drive_start_yard_line: z.coerce.number().optional().nullable(),
  notes: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

interface ScoringFormProps {
  gameId: string;
  homeName: string;
  awayName: string;
  homeScore: number;
  awayScore: number;
  currentQuarter: number;
  currentClock: string;
  onSave: (data: FormData & { game_id: string; wall_clock_time: string }) => Promise<void>;
  onClose: () => void;
}

// Points added per score type
const SCORE_POINTS: Record<string, { home?: number; away?: number }> = {
  'Touchdown': { home: 6, away: 6 },
  'PAT (kick)': { home: 1, away: 1 },
  'PAT (2-pt)': { home: 2, away: 2 },
  'Field Goal': { home: 3, away: 3 },
  'Safety': { home: 2, away: 2 },
  'Defensive TD': { home: 6, away: 6 },
};

export function ScoringForm({
  gameId, homeName, awayName, homeScore, awayScore, currentQuarter, currentClock, onSave, onClose,
}: ScoringFormProps) {
  const { register, handleSubmit, watch, setValue, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      quarter: currentQuarter,
      game_clock_time: currentClock,
      home_score_after: homeScore,
      away_score_after: awayScore,
    },
  });

  // Auto-update score when team + type changes
  const team = watch('scoring_team');
  const scoreType = watch('score_type');

  const handleTeamOrTypeChange = () => {
    const points = SCORE_POINTS[scoreType];
    if (!points) return;
    if (team === 'home') setValue('home_score_after', homeScore + (points.home ?? 0));
    if (team === 'away') setValue('away_score_after', awayScore + (points.away ?? 0));
  };

  const onSubmit = async (data: FormData) => {
    await onSave({ ...data, game_id: gameId, wall_clock_time: nowTimeString() });
    onClose();
  };

  return (
    <Modal title="🏆 Scoring Play" onClose={onClose} size="md">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" onChange={handleTeamOrTypeChange}>
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
          <label className="label">Scoring Team</label>
          <select {...register('scoring_team')} className="input-field">
            <option value="">Select…</option>
            <option value="home">{homeName} (Home)</option>
            <option value="away">{awayName} (Away)</option>
          </select>
          {errors.scoring_team && <p className="text-red-400 text-xs mt-1">{errors.scoring_team.message}</p>}
        </div>

        <div>
          <label className="label">Score Type</label>
          <div className="grid grid-cols-3 gap-2">
            {SCORE_TYPES.map(s => (
              <label key={s} className="flex items-center gap-2 bg-[var(--color-surface-2)] rounded-lg px-3 py-2 cursor-pointer">
                <input type="radio" {...register('score_type')} value={s} className="accent-field-500" />
                <span className="text-sm text-[var(--color-text)]">{s}</span>
              </label>
            ))}
          </div>
          {errors.score_type && <p className="text-red-400 text-xs mt-1">{errors.score_type.message}</p>}
        </div>

        <div>
          <label className="label">Player # (opt)</label>
          <input {...register('scoring_player_number')} type="number" placeholder="##" className="input-field" />
        </div>

        {/* Score after */}
        <div>
          <label className="label">Score After This Play</label>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-[var(--color-text-muted)] mb-1 block">{homeName}</label>
              <input {...register('home_score_after')} type="number" className="input-field text-center text-2xl font-display" />
            </div>
            <div>
              <label className="text-xs text-[var(--color-text-muted)] mb-1 block">{awayName}</label>
              <input {...register('away_score_after')} type="number" className="input-field text-center text-2xl font-display" />
            </div>
          </div>
        </div>

        <div>
          <label className="label">Notes (opt)</label>
          <input {...register('notes')} placeholder="Any details…" className="input-field" />
        </div>

        <button type="submit" disabled={isSubmitting} className="btn-primary w-full">
          {isSubmitting ? 'Saving…' : 'Save Score'}
        </button>
      </form>
    </Modal>
  );
}
