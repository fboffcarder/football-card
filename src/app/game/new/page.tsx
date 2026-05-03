'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, Plus, Trash2 } from 'lucide-react';
import { createClient } from '@/lib/supabase';
import { OFFICIAL_POSITIONS, GAME_LEVELS, CONFERENCES } from '@/types';
import { addToQueue } from '@/lib/offlineQueue';

// ─── Form schema ──────────────────────────────────────────────────────────────
const officialSchema = z.object({
  name: z.string().min(1),
  position: z.string().min(1),
  experience_years: z.coerce.number().optional().nullable(),
  conference_affiliation: z.string().optional(),
});

const schema = z.object({
  game_date: z.string().min(1, 'Date required'),
  kickoff_time: z.string().optional(),
  home_team: z.string().min(1, 'Required'),
  away_team: z.string().min(1, 'Required'),
  venue: z.string().optional(),
  conference: z.string().optional(),
  game_level: z.string().optional(),
  weather_conditions: z.string().optional(),
  field_surface: z.string().optional(),
  officials: z.array(officialSchema).optional(),
  // Coin toss
  toss_winner_side: z.string().optional(), // 'home' or 'away'
  toss_call: z.string().optional(),
  toss_result: z.string().optional(),
  winner_choice: z.string().optional(),
  loser_choice: z.string().optional(),
  captains_home: z.string().optional(),
  captains_away: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

export default function NewGamePage() {
  const router = useRouter();
  const supabase = createClient();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const { register, control, handleSubmit, watch, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      game_date: new Date().toISOString().split('T')[0],
      officials: [{ name: '', position: 'Referee' }],
    },
  });

  const { fields: officialFields, append, remove } = useFieldArray({ control, name: 'officials' });

  const homeName = watch('home_team') || 'Home';
  const awayName = watch('away_team') || 'Away';
  const tossCall = watch('toss_call');
  const tossResult = watch('toss_result');

  const onSubmit = async (data: FormData) => {
    setSaving(true);
    setError('');

    try {
      const isOnline = navigator.onLine;
      const gameId = crypto.randomUUID();

      // Build game record
      const gameRecord = {
        id: gameId,
        game_date: data.game_date,
        kickoff_time: data.kickoff_time || null,
        home_team: data.home_team,
        away_team: data.away_team,
        venue: data.venue || null,
        conference: data.conference || null,
        game_level: data.game_level || null,
        weather_conditions: data.weather_conditions || null,
        field_surface: data.field_surface || null,
      };

      if (isOnline) {
        // Save game
        const { error: gameErr } = await supabase.from('games').insert(gameRecord);
        if (gameErr) throw gameErr;

        // Save officials
        const validOfficials = (data.officials || []).filter(o => o.name.trim());
        if (validOfficials.length > 0) {
          await supabase.from('officials').insert(
            validOfficials.map(o => ({ ...o, game_id: gameId }))
          );
        }

        // Save coin toss if any data entered
        if (data.toss_winner_side || data.toss_call) {
          const tossWinner = data.toss_winner_side === 'home' ? data.home_team
            : data.toss_winner_side === 'away' ? data.away_team : null;
          await supabase.from('coin_toss').insert({
            game_id: gameId,
            toss_winner: tossWinner,
            toss_call: data.toss_call || null,
            toss_result: data.toss_result || null,
            winner_choice: data.winner_choice || null,
            loser_choice: data.loser_choice || null,
            captains_home: data.captains_home || null,
            captains_away: data.captains_away || null,
          });
        }
      } else {
        // Queue for later sync
        addToQueue({ table: 'games', operation: 'insert', data: gameRecord });
      }

      // Navigate to in-game screen
      router.push(`/game/${gameId}/live`);
    } catch (err) {
      console.error('FULL ERROR:', err);
      const msg = err instanceof Error ? err.message : JSON.stringify(err);
      setError('Error: ' + msg);
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--color-bg)' }}>
      {/* Header */}
      <header className="sticky top-0 z-30 px-4 py-3 border-b border-[var(--color-border)] flex items-center gap-3"
        style={{ backgroundColor: 'var(--color-surface)' }}>
        <button onClick={() => router.back()} className="p-2 rounded-full hover:bg-[var(--color-surface-2)] text-[var(--color-text-muted)]">
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="font-display text-xl tracking-wider uppercase text-[var(--color-text)]">New Game</h1>
          <p className="text-xs text-[var(--color-text-dim)]">Pre-game setup</p>
        </div>
      </header>

      <form onSubmit={handleSubmit(onSubmit)} className="max-w-xl mx-auto px-4 py-5 space-y-6 pb-24">
        {/* ── Game Info ── */}
        <section className="card space-y-4">
          <h2 className="font-display text-lg uppercase tracking-wider text-field-400">Game Info</h2>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Date</label>
              <input {...register('game_date')} type="date" className="input-field" />
              {errors.game_date && <p className="text-red-400 text-xs mt-1">{errors.game_date.message}</p>}
            </div>
            <div>
              <label className="label">Kickoff</label>
              <input {...register('kickoff_time')} type="time" className="input-field" />
            </div>
          </div>

          <div>
            <label className="label">Home Team</label>
            <input {...register('home_team')} placeholder="e.g. Ohio State" className="input-field" />
            {errors.home_team && <p className="text-red-400 text-xs mt-1">{errors.home_team.message}</p>}
          </div>

          <div>
            <label className="label">Away Team</label>
            <input {...register('away_team')} placeholder="e.g. Michigan" className="input-field" />
            {errors.away_team && <p className="text-red-400 text-xs mt-1">{errors.away_team.message}</p>}
          </div>

          <div>
            <label className="label">Venue / Stadium</label>
            <input {...register('venue')} placeholder="e.g. Ohio Stadium" className="input-field" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Conference</label>
              <select {...register('conference')} className="input-field">
                <option value="">Select…</option>
                {CONFERENCES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Level</label>
              <select {...register('game_level')} className="input-field">
                <option value="">Select…</option>
                {GAME_LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Surface</label>
              <select {...register('field_surface')} className="input-field">
                <option value="">—</option>
                <option value="grass">Grass</option>
                <option value="turf">Turf</option>
              </select>
            </div>
            <div>
              <label className="label">Weather</label>
              <input {...register('weather_conditions')} placeholder="Sunny, 72°" className="input-field" />
            </div>
          </div>
        </section>

        {/* ── Crew ── */}
        <section className="card space-y-4">
          <h2 className="font-display text-lg uppercase tracking-wider text-field-400">Officials Crew</h2>

          {officialFields.map((field, idx) => (
            <div key={field.id} className="flex gap-2 items-start">
              <div className="flex-1 space-y-2">
                <input
                  {...register(`officials.${idx}.name`)}
                  placeholder="Official name"
                  className="input-field"
                />
                <select {...register(`officials.${idx}.position`)} className="input-field">
                  {OFFICIAL_POSITIONS.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              {idx > 0 && (
                <button type="button" onClick={() => remove(idx)}
                  className="mt-1 p-2 text-red-400 hover:bg-red-900/30 rounded-lg">
                  <Trash2 size={16} />
                </button>
              )}
            </div>
          ))}

          {officialFields.length < 8 && (
            <button type="button"
              onClick={() => append({ name: '', position: 'Umpire' })}
              className="btn-secondary flex items-center gap-2 text-sm w-full justify-center">
              <Plus size={14} /> Add Official
            </button>
          )}
        </section>

        {/* ── Coin Toss ── */}
        <section className="card space-y-4">
          <h2 className="font-display text-lg uppercase tracking-wider text-field-400">Coin Toss</h2>

          <div>
            <label className="label">Toss Winner</label>
            <div className="flex gap-3">
              {[['home', homeName + ' (Home)'], ['away', awayName + ' (Away)']].map(([val, lbl]) => (
                <label key={val} className="flex items-center gap-2 cursor-pointer flex-1 bg-[var(--color-surface-2)] rounded-lg px-3 py-2">
                  <input type="radio" {...register('toss_winner_side')} value={val} className="accent-field-500" />
                  <span className="text-sm text-[var(--color-text)]">{lbl}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Called</label>
              <div className="flex gap-2">
                {['Heads', 'Tails'].map(v => (
                  <label key={v} className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" {...register('toss_call')} value={v} className="accent-field-500" />
                    <span className="text-sm text-[var(--color-text)]">{v}</span>
                  </label>
                ))}
              </div>
            </div>
            <div>
              <label className="label">Result</label>
              <div className="flex gap-2">
                {['Heads', 'Tails'].map(v => (
                  <label key={v} className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" {...register('toss_result')} value={v} className="accent-field-500" />
                    <span className={`text-sm ${tossCall && tossResult && tossCall === v ? 'text-field-400' : 'text-[var(--color-text)]'}`}>{v}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Winner's Choice</label>
              <select {...register('winner_choice')} className="input-field">
                <option value="">—</option>
                <option value="Receive">Receive</option>
                <option value="Kick">Kick</option>
                <option value="Defer">Defer</option>
                <option value="Choose End">Choose End</option>
              </select>
            </div>
            <div>
              <label className="label">Loser Gets</label>
              <select {...register('loser_choice')} className="input-field">
                <option value="">—</option>
                <option value="Receive">Receive</option>
                <option value="Kick">Kick</option>
                <option value="Choose End">Choose End</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">{homeName} Captains (#)</label>
              <input {...register('captains_home')} placeholder="e.g. 12, 55, 7, 99" className="input-field" />
              <p className="text-xs text-[var(--color-text-dim)] mt-1">Comma-separated, up to 4</p>
            </div>
            <div>
              <label className="label">{awayName} Captains (#)</label>
              <input {...register('captains_away')} placeholder="e.g. 18, 33, 44, 2" className="input-field" />
            </div>
          </div>
        </section>

        {error && (
          <div className="bg-red-900/30 border border-red-700 text-red-300 rounded-lg px-4 py-3 text-sm">
            {error}
          </div>
        )}

        {/* Submit */}
        <div className="fixed bottom-0 left-0 right-0 p-4 border-t border-[var(--color-border)]"
          style={{ backgroundColor: 'var(--color-surface)' }}>
          <div className="max-w-xl mx-auto">
            <button type="submit" disabled={saving} className="btn-primary w-full text-xl py-4">
              {saving ? 'Starting Game…' : '⚽ Start Game'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
