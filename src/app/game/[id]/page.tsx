'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Share2, FileDown, Play, Lock, Trash2, Pencil, PlayCircle } from 'lucide-react';
import { createClient } from '@/lib/supabase';
import { formatGameDate, formatQuarter } from '@/lib/utils';
import { TimeoutForm } from '@/components/forms/TimeoutForm';
import { PenaltyForm } from '@/components/forms/PenaltyForm';
import { ScoringForm } from '@/components/forms/ScoringForm';
import { ReplayForm } from '@/components/forms/ReplayForm';
import { EventForm } from '@/components/forms/EventForm';
import { OFFICIAL_POSITIONS } from '@/types';
import type {
  Game, Official, CoinToss, Timeout, ScoringPlay,
  Penalty, InstantReplay, GameEvent,
} from '@/types';

type Tab = 'overview' | 'officials' | 'cointoss' | 'scoring' | 'timeouts' | 'penalties' | 'replays' | 'timeline';

const TABS: { id: Tab; label: string }[] = [
  { id: 'overview',  label: 'Overview'  },
  { id: 'officials', label: 'Crew'      },
  { id: 'cointoss',  label: 'Toss'      },
  { id: 'scoring',   label: 'Scoring'   },
  { id: 'timeouts',  label: 'Timeouts'  },
  { id: 'penalties', label: 'Penalties' },
  { id: 'replays',   label: 'Replays'   },
  { id: 'timeline',  label: 'Timeline'  },
];

// ── Generic row action buttons ───────────────────────────────────────────────
function RowActions({ onEdit, onDelete }: { onEdit: () => void; onDelete: () => void }) {
  return (
    <div className="flex gap-0.5 shrink-0 ml-1">
      <button
        onClick={onEdit}
        className="p-2 text-[var(--color-text-muted)] hover:text-field-400 rounded-lg hover:bg-[var(--color-surface-2)] transition-colors"
      >
        <Pencil size={13} />
      </button>
      <button
        onClick={onDelete}
        className="p-2 text-[var(--color-text-muted)] hover:text-red-400 rounded-lg hover:bg-red-900/20 transition-colors"
      >
        <Trash2 size={13} />
      </button>
    </div>
  );
}

export default function GameDetailPage() {
  const params  = useParams();
  const router  = useRouter();
  const gameId  = params.id as string;
  const supabase = createClient();

  // ── Data state ──────────────────────────────────────────────────────────
  const [tab,       setTab]       = useState<Tab>('overview');
  const [game,      setGame]      = useState<Game | null>(null);
  const [officials, setOfficials] = useState<Official[]>([]);
  const [coinToss,  setCoinToss]  = useState<CoinToss | null>(null);
  const [timeouts,  setTimeouts]  = useState<Timeout[]>([]);
  const [scores,    setScores]    = useState<ScoringPlay[]>([]);
  const [penalties, setPenalties] = useState<Penalty[]>([]);
  const [replays,   setReplays]   = useState<InstantReplay[]>([]);
  const [events,    setEvents]    = useState<GameEvent[]>([]);
  const [loading,   setLoading]   = useState(true);

  // ── Finalize / Delete game state ────────────────────────────────────────
  const [showFinalizeConfirm, setShowFinalizeConfirm] = useState(false);
  const [showDeleteConfirm,   setShowDeleteConfirm]   = useState(false);
  const [finalizing,  setFinalizing]  = useState(false);
  const [deleting,    setDeleting]    = useState(false);
  const [actionError, setActionError] = useState('');

  // ── Row edit state ───────────────────────────────────────────────────────
  const [editingTimeout,  setEditingTimeout]  = useState<Timeout | null>(null);
  const [editingScore,    setEditingScore]    = useState<ScoringPlay | null>(null);
  const [editingPenalty,  setEditingPenalty]  = useState<Penalty | null>(null);
  const [editingReplay,   setEditingReplay]   = useState<InstantReplay | null>(null);
  const [editingEvent,    setEditingEvent]    = useState<GameEvent | null>(null);

  // ── Official inline edit state ───────────────────────────────────────────
  const [editingOfficial,     setEditingOfficial]     = useState<Official | null>(null);
  const [officialEditName,    setOfficialEditName]    = useState('');
  const [officialEditPosition,setOfficialEditPosition]= useState('');
  const [officialSaving,      setOfficialSaving]      = useState(false);

  // ── Row delete confirm state ─────────────────────────────────────────────
  const [deleteRow, setDeleteRow] = useState<{ table: string; id: string; label: string } | null>(null);
  const [deleteRowLoading, setDeleteRowLoading] = useState(false);

  // ── Load data ────────────────────────────────────────────────────────────
  useEffect(() => {
    const load = async () => {
      const [g, o, ct, t, s, p, r, e] = await Promise.all([
        supabase.from('games').select('*').eq('id', gameId).single(),
        supabase.from('officials').select('*').eq('game_id', gameId),
        supabase.from('coin_toss').select('*').eq('game_id', gameId).single(),
        supabase.from('timeouts').select('*').eq('game_id', gameId).order('quarter').order('game_clock_time'),
        supabase.from('scoring_plays').select('*').eq('game_id', gameId).order('quarter').order('game_clock_time'),
        supabase.from('penalties').select('*').eq('game_id', gameId).order('quarter').order('game_clock_time'),
        supabase.from('instant_replays').select('*').eq('game_id', gameId).order('quarter'),
        supabase.from('game_events').select('*').eq('game_id', gameId).order('quarter').order('game_clock_time'),
      ]);
      setGame(g.data);
      setOfficials(o.data ?? []);
      setCoinToss(ct.data);
      setTimeouts(t.data ?? []);
      setScores(s.data ?? []);
      setPenalties(p.data ?? []);
      setReplays(r.data ?? []);
      setEvents(e.data ?? []);
      setLoading(false);
    };
    load();
  }, [gameId, supabase]);

  // ── Finalize game ─────────────────────────────────────────────────────────
  const handleFinalize = async () => {
    setFinalizing(true);
    setActionError('');
    const now = new Date().toISOString();
    const { error } = await supabase.from('games')
      .update({ finalized: true, finalized_at: now })
      .eq('id', gameId);
    if (error) { setActionError('Could not finalize: ' + error.message); setFinalizing(false); return; }
    setGame(prev => prev ? { ...prev, finalized: true, finalized_at: now } : null);
    setShowFinalizeConfirm(false);
    setFinalizing(false);
  };

  // ── Delete game ────────────────────────────────────────────────────────────
  const handleDeleteGame = async () => {
    setDeleting(true);
    setActionError('');
    const { error } = await supabase.from('games').delete().eq('id', gameId);
    if (error) { setActionError('Could not delete: ' + error.message); setDeleting(false); return; }
    router.push('/');
  };

  // ── Row update handlers ───────────────────────────────────────────────────
  const handleUpdateTimeout = async (data: any) => {
    const { game_id, ...update } = data;
    const { error } = await supabase.from('timeouts').update(update).eq('id', editingTimeout!.id);
    if (!error) {
      setTimeouts(prev => prev.map(t => t.id === editingTimeout!.id ? { ...t, ...update } : t));
      setEditingTimeout(null);
    }
  };

  const handleUpdateScore = async (data: any) => {
    const { game_id, wall_clock_time, ...update } = data;
    const { error } = await supabase.from('scoring_plays').update(update).eq('id', editingScore!.id);
    if (!error) {
      setScores(prev => prev.map(s => s.id === editingScore!.id ? { ...s, ...update } : s));
      setEditingScore(null);
    }
  };

  const handleUpdatePenalty = async (data: any) => {
    const { game_id, wall_clock_time, ...update } = data;
    const { error } = await supabase.from('penalties').update(update).eq('id', editingPenalty!.id);
    if (!error) {
      setPenalties(prev => prev.map(p => p.id === editingPenalty!.id ? { ...p, ...update } : p));
      setEditingPenalty(null);
    }
  };

  const handleUpdateReplay = async (data: any) => {
    const { game_id, ...update } = data;
    const { error } = await supabase.from('instant_replays').update(update).eq('id', editingReplay!.id);
    if (!error) {
      setReplays(prev => prev.map(r => r.id === editingReplay!.id ? { ...r, ...update } : r));
      setEditingReplay(null);
    }
  };

  const handleUpdateEvent = async (data: any) => {
    const { game_id, wall_clock_time, ...update } = data;
    const { error } = await supabase.from('game_events').update(update).eq('id', editingEvent!.id);
    if (!error) {
      setEvents(prev => prev.map(e => e.id === editingEvent!.id ? { ...e, ...update } : e));
      setEditingEvent(null);
    }
  };

  const handleUpdateOfficial = async () => {
    if (!editingOfficial) return;
    setOfficialSaving(true);
    const { error } = await supabase.from('officials')
      .update({ name: officialEditName, position: officialEditPosition })
      .eq('id', editingOfficial.id);
    if (!error) {
      setOfficials(prev => prev.map(o =>
        o.id === editingOfficial.id
          ? { ...o, name: officialEditName, position: officialEditPosition }
          : o
      ));
      setEditingOfficial(null);
    }
    setOfficialSaving(false);
  };

  // ── Row delete handler ─────────────────────────────────────────────────────
  const handleDeleteRow = async () => {
    if (!deleteRow) return;
    setDeleteRowLoading(true);
    const { error } = await supabase.from(deleteRow.table).delete().eq('id', deleteRow.id);
    if (!error) {
      const id = deleteRow.id;
      switch (deleteRow.table) {
        case 'timeouts':        setTimeouts(prev  => prev.filter(x => x.id !== id)); break;
        case 'scoring_plays':   setScores(prev    => prev.filter(x => x.id !== id)); break;
        case 'penalties':       setPenalties(prev => prev.filter(x => x.id !== id)); break;
        case 'instant_replays': setReplays(prev   => prev.filter(x => x.id !== id)); break;
        case 'game_events':     setEvents(prev    => prev.filter(x => x.id !== id)); break;
        case 'officials':       setOfficials(prev => prev.filter(x => x.id !== id)); break;
      }
      setDeleteRow(null);
    }
    setDeleteRowLoading(false);
  };

  // ── Share ─────────────────────────────────────────────────────────────────
  const handleShare = () => {
    if (!game) return;
    const text = [
      `GAME REPORT — ${formatGameDate(game.game_date)}`,
      `${game.home_team} ${game.final_score_home ?? '?'} — ${game.final_score_away ?? '?'} ${game.away_team}`,
      `Venue: ${game.venue ?? '—'} | ${game.conference ?? ''} ${game.game_level ?? ''}`,
      '',
      `Penalties: ${penalties.length} total`,
      penalties.slice(0, 5).map(p => `  · ${p.foul_type} (${p.team_penalized === 'home' ? game.home_team : game.away_team}) — ${formatQuarter(p.quarter)} ${p.game_clock_time || ''}`).join('\n'),
      '',
      `Scoring Plays: ${scores.length}`,
      scores.map(s => `  · ${s.score_type} — ${s.scoring_team === 'home' ? game.home_team : game.away_team} ${formatQuarter(s.quarter)} ${s.game_clock_time || ''} | ${s.home_score_after}–${s.away_score_after}`).join('\n'),
      '',
      `Replays: ${replays.length}`,
      `Officials: ${officials.map(o => `${o.name} (${o.position})`).join(', ')}`,
      '',
      'Generated by Football Officiating App',
    ].join('\n');
    if (navigator.share) {
      navigator.share({ title: 'Game Report', text });
    } else {
      navigator.clipboard.writeText(text);
      alert('Game report copied to clipboard!');
    }
  };

  // ── PDF export ────────────────────────────────────────────────────────────
  const handlePDF = async () => {
    if (!game) return;
    const jsPDF     = (await import('jspdf')).default;
    const autoTable = (await import('jspdf-autotable')).default;
    const doc       = new jsPDF();
    doc.setFontSize(18);
    doc.text('FOOTBALL OFFICIATING REPORT', 14, 18);
    doc.setFontSize(11);
    doc.text(`${game.home_team} vs ${game.away_team}`, 14, 28);
    doc.text(`${formatGameDate(game.game_date)} — ${game.venue ?? ''}`, 14, 35);
    doc.text(`Final: ${game.home_team} ${game.final_score_home ?? '?'} — ${game.final_score_away ?? '?'} ${game.away_team}`, 14, 42);
    if (officials.length > 0) {
      autoTable(doc, { head: [['Official', 'Position']], body: officials.map(o => [o.name, o.position]), startY: 50, headStyles: { fillColor: [21, 128, 61] } });
    }
    if (penalties.length > 0) {
      autoTable(doc, {
        head: [['Qtr', 'Clock', 'Team', 'Foul', 'Yards', 'Status']],
        body: penalties.map(p => [formatQuarter(p.quarter), p.game_clock_time ?? '', p.team_penalized === 'home' ? game.home_team : game.away_team, p.foul_type, p.yardage ?? 'Spot', p.status]),
        startY: (doc as any).lastAutoTable?.finalY + 8 || 100,
        headStyles: { fillColor: [220, 38, 38] },
      });
    }
    if (scores.length > 0) {
      autoTable(doc, {
        head: [['Qtr', 'Clock', 'Team', 'Type', 'Score']],
        body: scores.map(s => [formatQuarter(s.quarter), s.game_clock_time ?? '', s.scoring_team === 'home' ? game.home_team : game.away_team, s.score_type, `${s.home_score_after}–${s.away_score_after}`]),
        startY: (doc as any).lastAutoTable?.finalY + 8 || 150,
        headStyles: { fillColor: [21, 128, 61] },
      });
    }
    doc.save(`game-report-${game.game_date}-${game.home_team}-vs-${game.away_team}.pdf`);
  };

  // ── Loading / not found ───────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--color-bg)' }}>
        <div className="font-display text-2xl text-field-400 animate-pulse tracking-widest">LOADING…</div>
      </div>
    );
  }
  if (!game) return null;

  const isLive      = game.final_score_home === null;
  const isFinalized = game.finalized === true;

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--color-bg)' }}>

      {/* ══ FINALIZE CONFIRM MODAL ══════════════════════════════════════════ */}
      {showFinalizeConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75">
          <div className="card max-w-sm w-full space-y-5">
            <div className="flex items-center gap-3">
              <Lock size={22} className="text-field-400 shrink-0" />
              <h3 className="font-display text-xl uppercase tracking-wider text-field-400">Finalize Game?</h3>
            </div>
            <p className="text-sm text-[var(--color-text-muted)] leading-relaxed">
              This will permanently lock the game record. No further edits will be possible.
              Make sure all data has been proofread before confirming.
            </p>
            {actionError && <p className="text-xs text-red-400 bg-red-900/30 rounded-lg px-3 py-2">{actionError}</p>}
            <div className="flex gap-3">
              <button onClick={() => { setShowFinalizeConfirm(false); setActionError(''); }} className="btn-secondary flex-1">Cancel</button>
              <button onClick={handleFinalize} disabled={finalizing} className="btn-primary flex-1">
                {finalizing ? 'Finalizing…' : 'YES, FINALIZE'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══ DELETE GAME CONFIRM MODAL ════════════════════════════════════════ */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75">
          <div className="card max-w-sm w-full space-y-5">
            <div className="flex items-center gap-3">
              <Trash2 size={22} className="text-red-400 shrink-0" />
              <h3 className="font-display text-xl uppercase tracking-wider text-red-400">Delete Game?</h3>
            </div>
            <p className="text-sm text-[var(--color-text-muted)] leading-relaxed">
              This will <strong className="text-[var(--color-text)]">permanently delete</strong> this game and all
              associated data. This cannot be undone.
            </p>
            {actionError && <p className="text-xs text-red-400 bg-red-900/30 rounded-lg px-3 py-2">{actionError}</p>}
            <div className="flex gap-3">
              <button onClick={() => { setShowDeleteConfirm(false); setActionError(''); }} className="btn-secondary flex-1">Cancel</button>
              <button onClick={handleDeleteGame} disabled={deleting}
                className="flex-1 rounded-xl px-4 py-2.5 font-display uppercase tracking-wider text-sm bg-red-700 hover:bg-red-600 text-white disabled:opacity-50 transition-colors">
                {deleting ? 'Deleting…' : 'YES, DELETE'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══ DELETE ROW CONFIRM MODAL ═════════════════════════════════════════ */}
      {deleteRow && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75">
          <div className="card max-w-sm w-full space-y-5">
            <div className="flex items-center gap-3">
              <Trash2 size={20} className="text-red-400 shrink-0" />
              <h3 className="font-display text-lg uppercase tracking-wider text-red-400">Delete {deleteRow.label}?</h3>
            </div>
            <p className="text-sm text-[var(--color-text-muted)]">This entry will be permanently removed.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteRow(null)} className="btn-secondary flex-1">Cancel</button>
              <button onClick={handleDeleteRow} disabled={deleteRowLoading}
                className="flex-1 rounded-xl px-4 py-2.5 font-display uppercase tracking-wider text-sm bg-red-700 hover:bg-red-600 text-white disabled:opacity-50 transition-colors">
                {deleteRowLoading ? 'Deleting…' : 'YES, DELETE'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══ OFFICIAL EDIT MODAL ══════════════════════════════════════════════ */}
      {editingOfficial && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75">
          <div className="card max-w-sm w-full space-y-4">
            <h3 className="font-display text-lg uppercase tracking-wider text-field-400">Edit Official</h3>
            <div>
              <label className="label">Name</label>
              <input value={officialEditName} onChange={e => setOfficialEditName(e.target.value)} className="input-field" />
            </div>
            <div>
              <label className="label">Position</label>
              <select value={officialEditPosition} onChange={e => setOfficialEditPosition(e.target.value)} className="input-field">
                {OFFICIAL_POSITIONS.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setEditingOfficial(null)} className="btn-secondary flex-1">Cancel</button>
              <button onClick={handleUpdateOfficial} disabled={officialSaving} className="btn-primary flex-1">
                {officialSaving ? 'Saving…' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══ ROW EDIT FORM MODALS ═════════════════════════════════════════════ */}
      {editingTimeout && (
        <TimeoutForm
          gameId={gameId}
          homeName={game.home_team}
          awayName={game.away_team}
          currentQuarter={editingTimeout.quarter}
          currentClock={editingTimeout.game_clock_time ?? ''}
          initialData={editingTimeout}
          onSave={handleUpdateTimeout}
          onClose={() => setEditingTimeout(null)}
        />
      )}
      {editingScore && (
        <ScoringForm
          gameId={gameId}
          homeName={game.home_team}
          awayName={game.away_team}
          homeScore={0}
          awayScore={0}
          currentQuarter={editingScore.quarter}
          currentClock={editingScore.game_clock_time ?? ''}
          initialData={editingScore}
          onSave={handleUpdateScore}
          onClose={() => setEditingScore(null)}
        />
      )}
      {editingPenalty && (
        <PenaltyForm
          gameId={gameId}
          homeName={game.home_team}
          awayName={game.away_team}
          currentQuarter={editingPenalty.quarter}
          currentClock={editingPenalty.game_clock_time ?? ''}
          initialData={editingPenalty}
          onSave={handleUpdatePenalty}
          onClose={() => setEditingPenalty(null)}
        />
      )}
      {editingReplay && (
        <ReplayForm
          gameId={gameId}
          homeName={game.home_team}
          awayName={game.away_team}
          currentQuarter={editingReplay.quarter}
          currentClock={editingReplay.game_clock_time ?? ''}
          initialData={editingReplay}
          onSave={handleUpdateReplay}
          onClose={() => setEditingReplay(null)}
        />
      )}
      {editingEvent && (
        <EventForm
          gameId={gameId}
          homeName={game.home_team}
          awayName={game.away_team}
          currentQuarter={editingEvent.quarter ?? 1}
          currentClock={editingEvent.game_clock_time ?? ''}
          initialData={editingEvent}
          onSave={handleUpdateEvent}
          onClose={() => setEditingEvent(null)}
        />
      )}

      {/* ══ HEADER ═══════════════════════════════════════════════════════════ */}
      <header className="sticky top-0 z-30 px-4 py-3 border-b border-[var(--color-border)]"
        style={{ backgroundColor: 'var(--color-surface)' }}>
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center gap-3 mb-2">
            <button onClick={() => router.push('/')} className="p-1.5 text-[var(--color-text-muted)]">
              <ArrowLeft size={20} />
            </button>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="font-display text-lg text-[var(--color-text)] truncate tracking-wide">
                  {game.home_team} <span className="text-[var(--color-text-dim)]">vs</span> {game.away_team}
                </h1>
                {isFinalized && (
                  <span className="inline-flex items-center gap-1 text-xs font-display uppercase tracking-wider text-field-400 border border-field-700 bg-field-900/30 px-2 py-0.5 rounded-full">
                    <Lock size={10} /> Finalized
                  </span>
                )}
              </div>
              <p className="text-xs text-[var(--color-text-dim)]">{formatGameDate(game.game_date)}</p>
            </div>
            <div className="flex gap-2">
              {isLive && !isFinalized && (
                <button onClick={() => router.push(`/game/${gameId}/live`)}
                  className="flex items-center gap-1 text-xs font-display uppercase tracking-wider text-field-400 border border-field-700 px-2 py-1 rounded-lg">
                  <Play size={12} /> Live
                </button>
              )}
              <button onClick={handleShare} className="p-2 text-[var(--color-text-muted)] hover:text-[var(--color-text)] rounded-lg hover:bg-[var(--color-surface-2)]">
                <Share2 size={16} />
              </button>
              <button onClick={handlePDF} className="p-2 text-[var(--color-text-muted)] hover:text-[var(--color-text)] rounded-lg hover:bg-[var(--color-surface-2)]">
                <FileDown size={16} />
              </button>
            </div>
          </div>

          {!isLive && (
            <div className="flex items-center justify-center gap-6 py-2 bg-[var(--color-surface-2)] rounded-xl mb-2">
              <span className="font-display text-sm text-[var(--color-text-muted)] truncate max-w-[80px]">{game.home_team}</span>
              <span className="font-display text-3xl text-[var(--color-text)]">{game.final_score_home} — {game.final_score_away}</span>
              <span className="font-display text-sm text-[var(--color-text-muted)] truncate max-w-[80px]">{game.away_team}</span>
            </div>
          )}

          <div className="flex gap-1 overflow-x-auto no-scrollbar">
            {TABS.map(t => (
              <button key={t.id} onClick={() => setTab(t.id)}
                className={`tab whitespace-nowrap ${tab === t.id ? 'tab-active' : 'tab-inactive'}`}>
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-5 space-y-4">

        {/* ── OVERVIEW ──────────────────────────────────────────────────── */}
        {tab === 'overview' && (
          <div className="space-y-4">
            <div className="card space-y-3">
              <h2 className="font-display text-lg uppercase tracking-wider text-field-400">Game Info</h2>
              {[
                ['Date',        formatGameDate(game.game_date)],
                ['Venue',       game.venue],
                ['Conference',  game.conference],
                ['Level',       game.game_level],
                ['Surface',     game.field_surface],
                ['Weather',     game.weather_conditions],
                ['Kickoff',     game.kickoff_time],
                ['Actual Start',game.actual_start_time],
                ['Halftime',    game.halftime_duration_minutes ? `${game.halftime_duration_minutes} min` : null],
                ['Overtime',    game.overtime_periods > 0 ? `${game.overtime_periods} period(s)` : null],
              ].filter(([_, v]) => v).map(([label, value]) => (
                <div key={label as string} className="flex justify-between">
                  <span className="text-sm text-[var(--color-text-muted)]">{label}</span>
                  <span className="text-sm text-[var(--color-text)]">{value}</span>
                </div>
              ))}
            </div>

            <div className="card">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="font-display text-3xl text-[var(--color-text)]">{penalties.length}</div>
                  <div className="text-xs text-[var(--color-text-dim)] uppercase tracking-wider">Penalties</div>
                </div>
                <div>
                  <div className="font-display text-3xl text-[var(--color-text)]">{timeouts.length}</div>
                  <div className="text-xs text-[var(--color-text-dim)] uppercase tracking-wider">Timeouts</div>
                </div>
                <div>
                  <div className="font-display text-3xl text-[var(--color-text)]">{replays.length}</div>
                  <div className="text-xs text-[var(--color-text-dim)] uppercase tracking-wider">Replays</div>
                </div>
              </div>
            </div>

            {game.notes && (
              <div className="card">
                <h3 className="font-display text-sm uppercase tracking-wider text-field-400 mb-2">Notes</h3>
                <p className="text-sm text-[var(--color-text)]">{game.notes}</p>
              </div>
            )}

            {/* ── Manage Game ── */}
            <div className="card space-y-3">
              <h2 className="font-display text-lg uppercase tracking-wider text-field-400">Manage Game</h2>
              {isFinalized ? (
                <div className="flex items-center gap-3 bg-field-900/30 border border-field-700 rounded-xl px-4 py-3">
                  <Lock size={18} className="text-field-400 shrink-0" />
                  <div>
                    <p className="text-sm font-display text-field-400 uppercase tracking-wider">Game Finalized</p>
                    {game.finalized_at && (
                      <p className="text-xs text-[var(--color-text-dim)] mt-0.5">
                        {new Date(game.finalized_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' })}
                      </p>
                    )}
                  </div>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <button onClick={() => router.push(`/game/${gameId}/edit`)}
                      className="btn-secondary flex items-center justify-center gap-2 text-sm py-3">
                      <Pencil size={14} /> Edit Setup
                    </button>
                    <button onClick={() => router.push(`/game/${gameId}/live`)}
                      className="btn-secondary flex items-center justify-center gap-2 text-sm py-3">
                      <PlayCircle size={14} /> Edit Events
                    </button>
                  </div>
                  <button onClick={() => setShowFinalizeConfirm(true)}
                    className="w-full flex items-center justify-center gap-2 rounded-xl px-4 py-3 font-display uppercase tracking-wider text-sm bg-field-800 hover:bg-field-700 text-field-300 border border-field-600 transition-colors">
                    <Lock size={14} /> Finalize Game
                  </button>
                </>
              )}
              <button onClick={() => setShowDeleteConfirm(true)}
                className="w-full flex items-center justify-center gap-2 rounded-xl px-4 py-3 font-display uppercase tracking-wider text-sm bg-red-950/50 hover:bg-red-900/60 text-red-400 border border-red-900 transition-colors">
                <Trash2 size={14} /> Delete Game
              </button>
            </div>
          </div>
        )}

        {/* ── OFFICIALS ─────────────────────────────────────────────────── */}
        {tab === 'officials' && (
          <div className="space-y-2">
            {officials.length === 0 ? <Empty label="No officials recorded" /> : officials.map(o => (
              <div key={o.id} className="card flex items-center justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="font-display text-base text-[var(--color-text)]">{o.name}</div>
                  {o.conference_affiliation && <div className="text-xs text-[var(--color-text-dim)]">{o.conference_affiliation}</div>}
                </div>
                <div className="text-right shrink-0">
                  <div className="text-sm text-field-400 font-display">{o.position}</div>
                  {o.experience_years && <div className="text-xs text-[var(--color-text-dim)]">{o.experience_years} yrs</div>}
                </div>
                {!isFinalized && (
                  <RowActions
                    onEdit={() => { setEditingOfficial(o); setOfficialEditName(o.name); setOfficialEditPosition(o.position); }}
                    onDelete={() => setDeleteRow({ table: 'officials', id: o.id, label: `${o.position} – ${o.name}` })}
                  />
                )}
              </div>
            ))}
          </div>
        )}

        {/* ── COIN TOSS ─────────────────────────────────────────────────── */}
        {tab === 'cointoss' && (
          <div className="card space-y-3">
            {!coinToss ? <Empty label="No coin toss recorded" /> : (
              <>
                {[
                  ['Winner',       coinToss.toss_winner],
                  ['Called',       coinToss.toss_call],
                  ['Result',       coinToss.toss_result],
                  ['Winner Choice',coinToss.winner_choice],
                  ['Loser Gets',   coinToss.loser_choice],
                  ['2nd Half',     coinToss.second_half_choice],
                  ['Home Captains',coinToss.captains_home],
                  ['Away Captains',coinToss.captains_away],
                ].filter(([_, v]) => v).map(([label, value]) => (
                  <div key={label as string} className="flex justify-between">
                    <span className="text-sm text-[var(--color-text-muted)]">{label}</span>
                    <span className="text-sm text-[var(--color-text)]">{value}</span>
                  </div>
                ))}
                {!isFinalized && (
                  <button onClick={() => router.push(`/game/${gameId}/edit`)}
                    className="btn-secondary w-full text-sm mt-2 flex items-center justify-center gap-2">
                    <Pencil size={13} /> Edit via Setup
                  </button>
                )}
              </>
            )}
          </div>
        )}

        {/* ── SCORING ───────────────────────────────────────────────────── */}
        {tab === 'scoring' && (
          <div className="space-y-2">
            {scores.length === 0 ? <Empty label="No scoring plays recorded" /> : scores.map(s => (
              <div key={s.id} className="card flex items-center gap-3">
                <div className="text-center min-w-[44px]">
                  <div className="font-display text-base text-field-400">{formatQuarter(s.quarter)}</div>
                  <div className="font-mono text-xs text-[var(--color-text-dim)]">{s.game_clock_time || '—'}</div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-display text-base text-[var(--color-text)]">{s.score_type}</div>
                  <div className="text-xs text-[var(--color-text-muted)]">
                    {s.scoring_team === 'home' ? game.home_team : game.away_team}
                    {s.scoring_player_number ? ` · #${s.scoring_player_number}` : ''}
                  </div>
                </div>
                <div className="font-display text-xl text-[var(--color-text)] shrink-0">{s.home_score_after}–{s.away_score_after}</div>
                {!isFinalized && (
                  <RowActions
                    onEdit={() => setEditingScore(s)}
                    onDelete={() => setDeleteRow({ table: 'scoring_plays', id: s.id, label: `${s.score_type} – ${formatQuarter(s.quarter)}` })}
                  />
                )}
              </div>
            ))}
          </div>
        )}

        {/* ── TIMEOUTS ──────────────────────────────────────────────────── */}
        {tab === 'timeouts' && (
          <div className="space-y-2">
            {timeouts.length === 0 ? <Empty label="No timeouts recorded" /> : timeouts.map(t => (
              <div key={t.id} className="card flex items-center gap-3">
                <div className="text-center min-w-[44px]">
                  <div className="font-display text-base text-yellow-400">{formatQuarter(t.quarter)}</div>
                  <div className="font-mono text-xs text-[var(--color-text-dim)]">{t.game_clock_time || '—'}</div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-display text-base text-[var(--color-text)]">
                    {t.team === 'home' ? game.home_team : game.away_team}
                  </div>
                  {t.reason && <div className="text-xs text-[var(--color-text-muted)]">{t.reason}</div>}
                </div>
                {t.timeout_number_for_team && (
                  <div className="text-xs text-[var(--color-text-dim)] shrink-0">#{t.timeout_number_for_team}</div>
                )}
                {!isFinalized && (
                  <RowActions
                    onEdit={() => setEditingTimeout(t)}
                    onDelete={() => setDeleteRow({ table: 'timeouts', id: t.id, label: `Timeout – ${formatQuarter(t.quarter)}` })}
                  />
                )}
              </div>
            ))}
          </div>
        )}

        {/* ── PENALTIES ─────────────────────────────────────────────────── */}
        {tab === 'penalties' && (
          <div className="space-y-2">
            {penalties.length === 0 ? <Empty label="No penalties recorded" /> : penalties.map(p => (
              <div key={p.id} className="card border-l-4 border-l-red-600">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="font-display text-base text-[var(--color-text)]">{p.foul_type}</div>
                    <div className="text-xs text-[var(--color-text-muted)] mt-0.5">
                      {p.team_penalized === 'home' ? game.home_team : p.team_penalized === 'away' ? game.away_team : 'Offsetting'}
                      {p.player_number ? ` · #${p.player_number}` : ''}
                      {p.down_and_distance_before ? ` · ${p.down_and_distance_before}` : ''}
                    </div>
                    {p.calling_official_position && <div className="text-xs text-[var(--color-text-dim)]">Called by: {p.calling_official_position}</div>}
                    {p.notes && <div className="text-xs text-[var(--color-text-dim)] mt-1 italic">{p.notes}</div>}
                  </div>
                  <div className="text-right shrink-0">
                    <div className="font-display text-sm text-field-400">{formatQuarter(p.quarter)}</div>
                    <div className="font-mono text-xs text-[var(--color-text-dim)]">{p.game_clock_time || '—'}</div>
                    <div className={`text-xs font-display mt-1 ${p.status === 'Accepted' ? 'text-red-400' : p.status === 'Declined' ? 'text-[var(--color-text-dim)]' : 'text-yellow-400'}`}>
                      {p.status}
                    </div>
                    <div className="text-xs text-[var(--color-text-dim)]">
                      {p.spot_enforcement ? 'Spot' : p.yardage ? `${p.yardage} yds` : '—'}
                      {p.automatic_first_down ? ' · Auto 1st' : ''}
                    </div>
                  </div>
                  {!isFinalized && (
                    <RowActions
                      onEdit={() => setEditingPenalty(p)}
                      onDelete={() => setDeleteRow({ table: 'penalties', id: p.id, label: `${p.foul_type} – ${formatQuarter(p.quarter)}` })}
                    />
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── REPLAYS ───────────────────────────────────────────────────── */}
        {tab === 'replays' && (
          <div className="space-y-2">
            {replays.length === 0 ? <Empty label="No instant replays recorded" /> : replays.map(r => (
              <div key={r.id} className="card">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="font-display text-base text-[var(--color-text)]">{r.initiated_by}</div>
                  <div className="flex items-center gap-2">
                    <div className={`text-xs font-display px-2 py-0.5 rounded-full ${r.outcome === 'Reversed' ? 'bg-red-900/40 text-red-300' : r.outcome === 'Confirmed' ? 'bg-field-900/40 text-field-400' : 'bg-yellow-900/40 text-yellow-300'}`}>
                      {r.outcome}
                    </div>
                    {!isFinalized && (
                      <RowActions
                        onEdit={() => setEditingReplay(r)}
                        onDelete={() => setDeleteRow({ table: 'instant_replays', id: r.id, label: `Replay – ${formatQuarter(r.quarter)}` })}
                      />
                    )}
                  </div>
                </div>
                {r.play_description && <p className="text-sm text-[var(--color-text-muted)]">{r.play_description}</p>}
                <div className="flex gap-4 mt-2 text-xs text-[var(--color-text-dim)]">
                  <span>{formatQuarter(r.quarter)} {r.game_clock_time || ''}</span>
                  {r.review_duration_minutes && <span>{r.review_duration_minutes} min</span>}
                  {r.timeout_charged && <span>⏱ Timeout charged</span>}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── TIMELINE ──────────────────────────────────────────────────── */}
        {tab === 'timeline' && (
          <div className="space-y-2">
            {events.length === 0 ? <Empty label="No events recorded" /> : events.map(ev => (
              <div key={ev.id} className="card flex items-start gap-3">
                <div className="text-center min-w-[44px]">
                  <div className="font-display text-sm text-purple-400">{ev.quarter ? formatQuarter(ev.quarter) : '—'}</div>
                  <div className="font-mono text-xs text-[var(--color-text-dim)]">{ev.game_clock_time || '—'}</div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-display text-base text-[var(--color-text)]">{ev.event_type}</div>
                  {ev.team_involved && <div className="text-xs text-[var(--color-text-muted)]">{ev.team_involved}</div>}
                  {ev.description && <div className="text-xs text-[var(--color-text-dim)] mt-0.5">{ev.description}</div>}
                </div>
                {!isFinalized && (
                  <RowActions
                    onEdit={() => setEditingEvent(ev)}
                    onDelete={() => setDeleteRow({ table: 'game_events', id: ev.id, label: `${ev.event_type}` })}
                  />
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

function Empty({ label }: { label: string }) {
  return (
    <div className="card text-center py-10 text-[var(--color-text-dim)]">
      <p className="font-display tracking-wider">{label}</p>
    </div>
  );
}
