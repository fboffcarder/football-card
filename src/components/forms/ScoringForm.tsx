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

// ─── Score options with point values ─────────────────────────────────────────
const SCORE_OPTIONS = [
  // Individual plays
  { value: 'Touchdown',         label: 'Touchdown',              points: 6,  group: 'individual' },
  { value: 'PAT (kick)',        label: 'PAT – Kick (1 pt)',       points: 1,  group: 'individual' },
  { value: 'PAT (2-pt)',        label: 'PAT – 2pt Conv.',         points: 2,  group: 'individual' },
  { value: 'Field Goal',        label: 'Field Goal',              points: 3,  group: 'individual' },
  { value: 'Safety',            label: 'Safety',                  points: 2,  group: 'individual' },
  { value: 'Defensive TD',      label: 'Defensive TD',            points: 6,  group: 'individual' },
  // Combined — records as single entry, auto-adds 7 or 8 pts
  { value: 'TD + PAT (kick)',   label: 'TD + PAT Kick (7 pts)',   points: 7,  group: 'combined' },
  { value: 'TD + PAT (2-pt)',   label: 'TD + 2pt Conv. (8 pts)',  points: 8,  group: 'combined' },
  { value: 'Def TD + PAT (kick)', label: 'Def TD + PAT Kick (7 pts)', points: 7, group: 'combined' },
  { value: 'Def TD + PAT (2-pt)', label: 'Def TD + 2pt (8 pts)', points: 8,  group: 'combined' },
] as const;

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

  // Auto-calculate score when selection changes
  const handleAutoScore = (newTeam?: string, newType?: string) => {
    const t = newTeam ?? team;
    const type = newType ?? scoreType;
    const option = SCORE_OPTIONS.find(o => o.value === type);
    if (!option || !t) return;
    if (t === 'home') setValue('home_score_after', homeScore + option.points);
    if (t === 'away') setValue('away_score_after', awayScore + option.points);
  };

  const onSubmit = async (data: FormData) => {
    await onSave({ ...data, game_id: gameId, wall_clock_time: nowTimeString() });
    onClose();
  };

  const individual = SCORE_OPTIONS.filter(o => o.group === 'individual');
  const combined   = SCORE_OPTIONS.filter(o => o.group === 'combined');

  return (
    <Modal title="🏆 Scoring Play" onClose={onClose} size="md">
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

        {/* Scoring team */}
        <div>
          <label className="label">Scoring Team</label>
          <div className="flex gap-2">
            {[['home', homeName + ' (Home)'], ['away', awayName + ' (Away)']].map(([val, lbl]) => (
              <label key={val}
                className={`flex-1 text-center py-2 rounded-lg border cursor-pointer text-sm font-display tracking-wider transition-colors ${
                  team === val ? 'bg-field-700 border-field-500 text-white' : 'border-[var(--color-border)] text-[var(--color-text-muted)]'
                }`}>
                <input type="radio" {...register('scoring_team')} value={val} className="sr-only"
                  onChange={() => handleAutoScore(val, scoreType)} />
                {lbl}
              </label>
            ))}
          </div>
          {errors.scoring_team && <p className="text-red-400 text-xs mt-1">{errors.scoring_team.message}</p>}
        </div>

        {/* ── Individual score types ── */}
        <div>
          <label className="label">Score Type</label>
          <div className="grid grid-cols-2 gap-1.5 mb-2">
            {individual.map(opt => (
              <label key={opt.value}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer text-sm transition-colors ${
                  scoreType === opt.value
                    ? 'bg-field-800 border-field-500 text-field-300'
                    : 'border-[var(--color-border)] text-[var(--color-text-dim)]'
                }`}>
                <input type="radio" {...register('score_type')} value={opt.value} className="sr-only"
                  onChange={() => handleAutoScore(team, opt.value)} />
                {opt.label}
                <span className="ml-auto text-xs font-mono text-[var(--color-text-dim)]">+{opt.points}</span>
              </label>
            ))}
          </div>

          {/* ── Combined TD + PAT options ── */}
          <p className="text-xs text-[var(--color-text-dim)] uppercase tracking-wider mb-1.5">Combined (TD + PAT)</p>
          <div className="grid grid-cols-1 gap-1.5">
            {combined.map(opt => (
              <label key={opt.value}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer text-sm transition-colors ${
                  scoreType === opt.value
                    ? 'bg-yellow-900 border-yellow-600 text-yellow-200'
                    : 'border-[var(--color-border)] text-[var(--color-text-dim)]'
                }`}>
                <input type="radio" {...register('score_type')} value={opt.value} className="sr-only"
                  onChange={() => handleAutoScore(team, opt.value)} />
                {opt.label}
                <span className="ml-auto text-xs font-mono text-[var(--color-text-dim)]">+{opt.points}</span>
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
