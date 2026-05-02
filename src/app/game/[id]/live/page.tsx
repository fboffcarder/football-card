'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Flag, Clock, Trophy, Film, ClipboardList, Undo2, CheckCircle } from 'lucide-react';
import { createClient } from '@/lib/supabase';
import { formatQuarter, nowTimeString } from '@/lib/utils';
import { addToQueue } from '@/lib/offlineQueue';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { OfflineBadge } from '@/components/ui/OfflineBadge';
import { TimeoutForm } from '@/components/forms/TimeoutForm';
import { PenaltyForm } from '@/components/forms/PenaltyForm';
import { ScoringForm } from '@/components/forms/ScoringForm';
import { ReplayForm } from '@/components/forms/ReplayForm';
import { EventForm } from '@/components/forms/EventForm';
import type { Game } from '@/types';

// ─── Recent event display ────────────────────────────────────────────────────
interface RecentEvent {
  id: string;
  label: string;
  detail: string;
  color: string;
  table: string;
}

type ModalType = 'timeout' | 'penalty' | 'score' | 'replay' | 'event' | null;

export default function LiveGamePage() {
  const params = useParams();
  const router = useRouter();
  const gameId = params.id as string;
  const { isOnline } = useOnlineStatus();
  const supabase = createClient();

  const [game, setGame] = useState<Game | null>(null);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<ModalType>(null);

  // Live counters (local state, typed in by official)
  const [quarter, setQuarter] = useState(1);
  const [clock, setClock] = useState('');
  const [homeScore, setHomeScore] = useState(0);
  const [awayScore, setAwayScore] = useState(0);
  const [homeTimeouts, setHomeTimeouts] = useState(3);
  const [awayTimeouts, setAwayTimeouts] = useState(3);

  // Recent events log (last 5)
  const [recentEvents, setRecentEvents] = useState<RecentEvent[]>([]);

  // Fetch game info
  useEffect(() => {
    const loadGame = async () => {
      const { data } = await supabase.from('games').select('*').eq('id', gameId).single();
      setGame(data);

      // Restore score from latest scoring play
      const { data: scores } = await supabase
        .from('scoring_plays').select('*').eq('game_id', gameId)
        .order('created_at', { ascending: false }).limit(1);
      if (scores && scores.length > 0) {
        setHomeScore(scores[0].home_score_after);
        setAwayScore(scores[0].away_score_after);
      }
      setLoading(false);
    };
    loadGame();
  }, [gameId, supabase]);

  // ─── Generic save helper ─────────────────────────────────────────────────
  const saveRecord = useCallback(async (table: string, data: Record<string, unknown>, label: string, detail: string, color: string) => {
    if (isOnline) {
      const { error } = await supabase.from(table).insert(data);
      if (error) throw error;
    } else {
      addToQueue({ table, operation: 'insert', data });
    }

    // Update recent event log
    const newEvent: RecentEvent = {
      id: (data.id as string) ?? crypto.randomUUID(),
      label, detail, color, table,
    };
    setRecentEvents(prev => [newEvent, ...prev].slice(0, 5));
  }, [isOnline, supabase]);

  // ─── Form save handlers ──────────────────────────────────────────────────
  const handleSaveTimeout = async (data: Record<string, unknown>) => {
    const id = crypto.randomUUID();
    await saveRecord('timeouts', { ...data, id },
      '🏳️ Timeout', `${data.team === 'home' ? game?.home_team : game?.away_team} — Q${data.quarter} ${data.game_clock_time || ''}`, 'text-yellow-400');
    // Decrement timeout counter
    if (data.team === 'home') setHomeTimeouts(p => Math.max(0, p - 1));
    else setAwayTimeouts(p => Math.max(0, p - 1));
  };

  const handleSavePenalty = async (data: Record<string, unknown>) => {
    const id = crypto.randomUUID();
    await saveRecord('penalties', { ...data, id },
      '🚩 Penalty', `${data.foul_type} — ${data.team_penalized === 'home' ? game?.home_team : game?.away_team}`, 'text-red-400');
  };

  const handleSaveScore = async (data: Record<string, unknown>) => {
    const id = crypto.randomUUID();
    await saveRecord('scoring_plays', { ...data, id },
      '🏆 Score', `${data.score_type} — ${data.scoring_team === 'home' ? game?.home_team : game?.away_team}`, 'text-field-400');
    setHomeScore(data.home_score_after as number);
    setAwayScore(data.away_score_after as number);
  };

  const handleSaveReplay = async (data: Record<string, unknown>) => {
    const id = crypto.randomUUID();
    await saveRecord('instant_replays', { ...data, id },
      '📹 Replay', `${data.initiated_by} — ${data.outcome}`, 'text-blue-400');
  };

  const handleSaveEvent = async (data: Record<string, unknown>) => {
    const id = crypto.randomUUID();
    await saveRecord('game_events', { ...data, id },
      '📋 Event', `${data.event_type}`, 'text-purple-400');
  };

  // ─── Undo last event ─────────────────────────────────────────────────────
  const handleUndo = async () => {
    if (recentEvents.length === 0) return;
    const last = recentEvents[0];
    if (isOnline) {
      await supabase.from(last.table).delete().eq('id', last.id);
    }
    setRecentEvents(prev => prev.slice(1));
  };

  // ─── End game ────────────────────────────────────────────────────────────
  const handleEndGame = async () => {
    if (!confirm('End game and save final score?')) return;
    const update = { final_score_home: homeScore, final_score_away: awayScore };
    if (isOnline) {
      await supabase.from('games').update(update).eq('id', gameId);
    } else {
      addToQueue({ table: 'games', operation: 'update', data: { id: gameId, ...update } });
    }
    router.push(`/game/${gameId}`);
  };

  // ─── Quarter change ───────────────────────────────────────────────────────
  const handleHalfChange = (newQuarter: number) => {
    setQuarter(newQuarter);
    // Reset timeouts at half
    if (newQuarter === 3) {
      setHomeTimeouts(3);
      setAwayTimeouts(3);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--color-bg)' }}>
        <div className="font-display text-2xl text-field-400 tracking-widest animate-pulse">LOADING…</div>
      </div>
    );
  }

  if (!game) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--color-bg)' }}>
        <div className="font-display text-xl text-red-400">Game not found</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: 'var(--color-bg)' }}>
      {/* Header */}
      <header className="px-4 py-3 border-b border-[var(--color-border)] flex items-center gap-3"
        style={{ backgroundColor: 'var(--color-surface)' }}>
        <button onClick={() => router.push(`/game/${gameId}`)} className="p-1.5 text-[var(--color-text-muted)]">
          <ArrowLeft size={20} />
        </button>
        <div className="flex-1">
          <div className="font-display text-base tracking-wider text-[var(--color-text)]">
            {game.home_team} <span className="text-[var(--color-text-dim)]">vs</span> {game.away_team}
          </div>
          <div className="text-xs text-[var(--color-text-dim)]">{game.venue} · {game.conference}</div>
        </div>
        <button onClick={handleEndGame} className="text-xs font-display uppercase tracking-wider text-field-400 border border-field-700 px-3 py-1 rounded-lg">
          End Game
        </button>
      </header>

      {/* Scoreboard */}
      <div className="px-4 py-4 border-b border-[var(--color-border)]" style={{ backgroundColor: 'var(--color-surface)' }}>
        {/* Quarter selector */}
        <div className="flex gap-1 justify-center mb-3">
          {[1,2,3,4,5,6].map(q => (
            <button key={q}
              onClick={() => handleHalfChange(q)}
              className={`font-display text-sm px-3 py-1 rounded-lg transition-colors ${
                quarter === q ? 'bg-field-700 text-white' : 'text-[var(--color-text-dim)] hover:bg-[var(--color-surface-2)]'
              }`}>
              {formatQuarter(q)}
            </button>
          ))}
        </div>

        {/* Score display */}
        <div className="flex items-center justify-between gap-4 mb-3">
          {/* Home team */}
          <div className="flex-1 text-center">
            <div className="text-xs text-[var(--color-text-muted)] uppercase tracking-wider mb-1 truncate">{game.home_team}</div>
            <div className="font-display text-6xl text-[var(--color-text)] leading-none">{homeScore}</div>
            {/* Timeout dots */}
            <div className="flex justify-center gap-1 mt-2">
              {[0,1,2].map(i => (
                <div key={i} className={`w-2.5 h-2.5 rounded-full transition-colors ${i < homeTimeouts ? 'bg-field-500' : 'bg-[var(--color-border)]'}`} />
              ))}
            </div>
          </div>

          {/* Clock */}
          <div className="text-center">
            <div className="font-display text-3xl text-field-400 tracking-widest">{formatQuarter(quarter)}</div>
            <input
              value={clock}
              onChange={e => setClock(e.target.value)}
              placeholder="0:00"
              className="font-mono text-2xl text-center bg-transparent border-b border-[var(--color-border)] text-[var(--color-text)] w-24 py-1 focus:outline-none focus:border-field-500"
            />
          </div>

          {/* Away team */}
          <div className="flex-1 text-center">
            <div className="text-xs text-[var(--color-text-muted)] uppercase tracking-wider mb-1 truncate">{game.away_team}</div>
            <div className="font-display text-6xl text-[var(--color-text)] leading-none">{awayScore}</div>
            {/* Timeout dots */}
            <div className="flex justify-center gap-1 mt-2">
              {[0,1,2].map(i => (
                <div key={i} className={`w-2.5 h-2.5 rounded-full transition-colors ${i < awayTimeouts ? 'bg-field-500' : 'bg-[var(--color-border)]'}`} />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Action buttons */}
      <div className="px-4 py-5 flex-1">
        <div className="grid grid-cols-5 gap-2 mb-6">
          {[
            { id: 'timeout', icon: <Clock size={24} />, label: 'Timeout', color: 'bg-yellow-900/40 border-yellow-700 text-yellow-300', activeColor: 'bg-yellow-800' },
            { id: 'penalty', icon: <Flag size={24} />, label: 'Penalty', color: 'bg-red-900/40 border-red-700 text-red-300', activeColor: 'bg-red-800' },
            { id: 'score', icon: <Trophy size={24} />, label: 'Score', color: 'bg-field-900/60 border-field-700 text-field-300', activeColor: 'bg-field-700' },
            { id: 'replay', icon: <Film size={24} />, label: 'Replay', color: 'bg-blue-900/40 border-blue-700 text-blue-300', activeColor: 'bg-blue-800' },
            { id: 'event', icon: <ClipboardList size={24} />, label: 'Event', color: 'bg-purple-900/40 border-purple-700 text-purple-300', activeColor: 'bg-purple-800' },
          ].map(btn => (
            <button
              key={btn.id}
              onClick={() => setModal(btn.id as ModalType)}
              className={`action-btn border ${btn.color} active:opacity-80`}
            >
              {btn.icon}
              <span className="text-xs">{btn.label}</span>
            </button>
          ))}
        </div>

        {/* Recent events log */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-display text-sm uppercase tracking-wider text-[var(--color-text-dim)]">Recent Events</h3>
            {recentEvents.length > 0 && (
              <button onClick={handleUndo} className="flex items-center gap-1 text-xs text-red-400 hover:text-red-300">
                <Undo2 size={12} /> Undo Last
              </button>
            )}
          </div>

          {recentEvents.length === 0 ? (
            <div className="text-center py-8 text-[var(--color-text-dim)] text-sm">
              No events yet — tap an action button above
            </div>
          ) : (
            <div className="space-y-2 animate-fade-in">
              {recentEvents.map((ev, i) => (
                <div key={ev.id} className={`flex items-center gap-3 px-3 py-2 rounded-xl border border-[var(--color-border)] transition-opacity ${i === 0 ? 'opacity-100' : 'opacity-60'}`}
                  style={{ backgroundColor: 'var(--color-surface)' }}>
                  <span className={`font-display text-sm ${ev.color}`}>{ev.label}</span>
                  <span className="text-xs text-[var(--color-text-dim)] flex-1 truncate">{ev.detail}</span>
                  {i === 0 && <CheckCircle size={12} className="text-field-500 shrink-0" />}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Modals ── */}
      {modal === 'timeout' && (
        <TimeoutForm
          gameId={gameId}
          homeName={game.home_team}
          awayName={game.away_team}
          currentQuarter={quarter}
          currentClock={clock}
          onSave={handleSaveTimeout as never}
          onClose={() => setModal(null)}
        />
      )}
      {modal === 'penalty' && (
        <PenaltyForm
          gameId={gameId}
          homeName={game.home_team}
          awayName={game.away_team}
          currentQuarter={quarter}
          currentClock={clock}
          onSave={handleSavePenalty as never}
          onClose={() => setModal(null)}
        />
      )}
      {modal === 'score' && (
        <ScoringForm
          gameId={gameId}
          homeName={game.home_team}
          awayName={game.away_team}
          homeScore={homeScore}
          awayScore={awayScore}
          currentQuarter={quarter}
          currentClock={clock}
          onSave={handleSaveScore as never}
          onClose={() => setModal(null)}
        />
      )}
      {modal === 'replay' && (
        <ReplayForm
          gameId={gameId}
          homeName={game.home_team}
          awayName={game.away_team}
          currentQuarter={quarter}
          currentClock={clock}
          onSave={handleSaveReplay as never}
          onClose={() => setModal(null)}
        />
      )}
      {modal === 'event' && (
        <EventForm
          gameId={gameId}
          homeName={game.home_team}
          awayName={game.away_team}
          currentQuarter={quarter}
          currentClock={clock}
          onSave={handleSaveEvent as never}
          onClose={() => setModal(null)}
        />
      )}

      <OfflineBadge />
    </div>
  );
}
