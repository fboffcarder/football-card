'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Modal } from '@/components/ui/Modal';
import { nowTimeString } from '@/lib/utils';

const schema = z.object({
  quarter: z.coerce.number().min(1),
  game_clock_time: z.string().optional(),
  scoring_team: z.string().min(1, 'Required'),
  score_type: z.string().min(1, 'Required'),
  pat_type: z.string().optional(), // only set if score_type is Touchdown or Defensive TD
  scoring_player_number: z.coerce.number().optional().nullable(),
  home_score_after: z.coerce.number().min(0),
  away_score_after: z.coerce.number().min(0),
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
  onSave: (data: Omit<FormData, 'pat_type'> & { game_id: string; wall_clock_time: string; score_type: string }) => Promise<void>;
  onClose: () => void;
}

// Base points per score type (before PAT)
const BASE_POINTS: Record<string, number> = {
  'Touchdown':    6,
  'Defensive TD': 6,
  'Field Goal':   3,
  'Safety':       2,
  'PAT (kick)':   1,
  'PAT (2-pt)':   2,
};

const PAT_POINTS: Record<string, number> = {
  'PAT (kick)': 1,
  'PAT (2-pt)': 2,
};

// Score types that get a PAT follow-up
const TD_TYPES = ['Touchdown', 'Defensive TD'];

const SCORE_TYPES = ['Touchdown', 'Defensive TD', 'Field Goal', 'Safety', 'PAT (kick)', 'PAT (2-pt)'];

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

  const team = watch('scoring_team');
  const scoreType = watch('score_type');
  const patType = watch('pat_type');
  const isTD = TD_TYPES.includes(scoreType);

  // Auto-calculate score
  const calcScore = (t: string, type: string, pat?: string) => {
    const base = BASE_POINTS[type] ?? 0;
    const patPts = pat ? (PAT_POINTS[pat] ?? 0) : 0;
    const total = base + patPts;
    if (t === 'home') setValue('home_score_after', homeScore + total);
    if (t === 'away') setValue('away_score_after', awayScore + total);
  };

  const onSubmit = async (data: FormData) => {
    // Build the final score_type label to store
    let finalType = data.score_type;
    if (isTD && data.pat_type) {
      finalType = `${data.score_type} + ${data.pat_type}`;
    } else if (isTD && !data.pat_type) {
      finalType = `${data.score_type} (no PAT)`;
    }
    const { pat_type, ...rest } = data;
    await onSave({ ...rest, score_type: finalType, game_id: gameId, wall_clock_time: nowTimeString() });
    onClose();
  };

  return (
    <Modal title="🏆 Scoring Play" onClose={onClose} size="md">
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

        {/* Scoring team */}
        <div>
          <label className="label">Scoring Team</label>
          <div className="flex gap-2">
            {[['home', homeName], ['away', awayName]].map(([val, lbl]) => (
              <label key={val}
                className={`flex-1 text-center py-2.5 rounded-lg border cursor-pointer text-sm font-display tracking-wider transition-colors ${
                  team === val
                    ? 'bg-field-700 border-field-500 text-white'
                    : 'border-[var(--color-border)] text-[var(--color-text-muted)]'
                }`}>
                <input type="radio" {...register('scoring_team')} value={val} className="sr-only"
                  onChange={e => { setValue('scoring_team', e.target.value); calcScore(val, scoreType, patType); }} />
                {lbl}
              </label>
            ))}
          </div>
          {errors.scoring_team && <p className="text-red-400 text-xs mt-1">{errors.scoring_team.message}</p>}
        </div>

        {/* Score type */}
        <div>
          <label className="label">Score Type</label>
          <div className="grid grid-cols-2 gap-1.5">
            {SCORE_TYPES.map(type => (
              <label key={type}
                className={`flex items-center justify-between px-3 py-2.5 rounded-lg border cursor-pointer text-sm transition-colors ${
                  scoreType === type
                    ? 'bg-field-800 border-field-500 text-field-300'
                    : 'border-[var(--color-border)] text-[var(--color-text-dim)]'
                }`}>
                <span className="flex items-center gap-2">
                  <input type="radio" {...register('score_type')} value={type} className="sr-only"
                    onChange={() => { setValue('score_type', type); setValue('pat_type', undefined); calcScore(team, type, undefined); }} />
                  {type}
                </span>
                <span className="font-mono text-xs text-[var(--color-text-dim)]">+{BASE_POINTS[type] ?? 0}</span>
              </label>
            ))}
          </div>
          {errors.score_type && <p className="text-red-400 text-xs mt-1">{errors.score_type.message}</p>}
        </div>

        {/* PAT follow-up — only shown after TD or Defensive TD */}
        {isTD && (
          <div className="border border-yellow-800 rounded-xl p-3 bg-yellow-950/30">
            <label className="label text-yellow-400">PAT (optional)</label>
            <p className="text-xs text-[var(--color-text-dim)] mb-2">Leave unselected if PAT was not attempted or failed</p>
            <div className="flex gap-2">
              {['PAT (kick)', 'PAT (2-pt)'].map(pat => (
                <label key={pat}
                  className={`flex-1 text-center py-2 rounded-lg border cursor-pointer text-sm transition-colors ${
                    patType === pat
                      ? 'bg-yellow-800 border-yellow-500 text-yellow-200'
                      : 'border-[var(--color-border)] text-[var(--color-text-dim)]'
                  }`}>
                  <input type="radio" {...register('pat_type')} value={pat} className="sr-only"
                    onChange={() => { setValue('pat_type', pat); calcScore(team, scoreType, pat); }} />
                  {pat === 'PAT (kick)' ? 'Kick (+1)' : '2-pt Conv. (+2)'}
                </label>
              ))}
              {/* Clear PAT selection */}
              {patType && (
                <button type="button"
                  onClick={() => { setValue('pat_type', undefined); calcScore(team, scoreType, undefined); }}
                  className="px-3 text-xs text-[var(--color-text-dim)] border border-[var(--color-border)] rounded-lg">
                  Clear
                </button>
              )}
            </div>
          </div>
        )}

        {/* Player # */}
        <div>
          <label className="label">Player # (opt)</label>
          <input {...register('scoring_player_number')} type="number" placeholder="##" className="input-field" />
        </div>

        {/* Score after — always editable */}
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
