'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Search, ChevronRight, Trophy, Flag, Clock, RefreshCw } from 'lucide-react';
import { createClient } from '@/lib/supabase';
import { formatGameDate, formatScore } from '@/lib/utils';
import { OfflineBadge } from '@/components/ui/OfflineBadge';
import type { Game } from '@/types';

export default function HomePage() {
  const router = useRouter();
  const supabase = createClient();

  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [stats, setStats] = useState({ total: 0, penalties: 0, touchdowns: 0 });

  // Fetch recent games
  const fetchGames = async (q = '') => {
    setLoading(true);
    let query = supabase
      .from('games')
      .select('*')
      .order('game_date', { ascending: false })
      .limit(20);

    if (q) {
      query = query.or(`home_team.ilike.%${q}%,away_team.ilike.%${q}%,venue.ilike.%${q}%`);
    }

    const { data } = await query;
    setGames(data ?? []);
    setLoading(false);
  };

  // Fetch summary stats
  const fetchStats = async () => {
    const [gamesRes, penRes, tdRes] = await Promise.all([
      supabase.from('games').select('id', { count: 'exact', head: true }),
      supabase.from('penalties').select('id', { count: 'exact', head: true }),
      supabase.from('scoring_plays').select('id', { count: 'exact', head: true }).eq('score_type', 'Touchdown'),
    ]);
    setStats({
      total: gamesRes.count ?? 0,
      penalties: penRes.count ?? 0,
      touchdowns: tdRes.count ?? 0,
    });
  };

  useEffect(() => {
    fetchGames();
    fetchStats();
  }, []);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    fetchGames(e.target.value);
  };

  const isGameComplete = (g: Game) => g.final_score_home !== null;

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--color-bg)' }}>
      {/* Header */}
      <header className="sticky top-0 z-30 px-4 pt-safe-top pb-3 border-b border-[var(--color-border)]"
        style={{ backgroundColor: 'var(--color-surface)', paddingTop: 'max(env(safe-area-inset-top), 12px)' }}>
        <div className="max-w-xl mx-auto">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h1 className="font-display text-2xl tracking-widest text-field-400 uppercase">Football</h1>
              <p className="text-xs text-[var(--color-text-dim)] tracking-widest uppercase">Officiating Log</p>
            </div>
            <button
              onClick={() => router.push('/game/new')}
              className="btn-primary flex items-center gap-2 text-base px-5 py-3"
            >
              <Plus size={18} />
              New Game
            </button>
          </div>

          {/* Search */}
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-dim)]" />
            <input
              value={search}
              onChange={handleSearch}
              placeholder="Search teams, venue…"
              className="input-field pl-9"
            />
          </div>
        </div>
      </header>

      <main className="max-w-xl mx-auto px-4 py-5 space-y-5">
        {/* Stats bar */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Games', value: stats.total, icon: <Trophy size={16} /> },
            { label: 'Penalties', value: stats.penalties, icon: <Flag size={16} /> },
            { label: 'Touchdowns', value: stats.touchdowns, icon: <Clock size={16} /> },
          ].map(s => (
            <div key={s.label} className="card text-center py-3">
              <div className="text-field-400 flex justify-center mb-1">{s.icon}</div>
              <div className="font-display text-2xl text-[var(--color-text)]">{s.value}</div>
              <div className="text-xs text-[var(--color-text-dim)] uppercase tracking-wider">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Games list */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-display text-lg tracking-wider uppercase text-[var(--color-text-muted)]">
              {search ? 'Search Results' : 'Recent Games'}
            </h2>
            <button onClick={() => fetchGames(search)} className="text-[var(--color-text-dim)] hover:text-field-400">
              <RefreshCw size={14} />
            </button>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[1,2,3].map(i => (
                <div key={i} className="card h-20 animate-pulse bg-[var(--color-surface-2)]" />
              ))}
            </div>
          ) : games.length === 0 ? (
            <div className="card text-center py-12">
              <Trophy size={40} className="mx-auto mb-3 text-[var(--color-text-dim)]" />
              <p className="font-display text-lg text-[var(--color-text-muted)]">No games yet</p>
              <p className="text-sm text-[var(--color-text-dim)] mt-1">Tap "New Game" to get started</p>
            </div>
          ) : (
            <div className="space-y-2">
              {games.map(game => (
                <button
                  key={game.id}
                  onClick={() => router.push(`/game/${game.id}`)}
                  className="card w-full text-left flex items-center gap-4 hover:border-field-600 transition-colors active:scale-[0.99]"
                >
                  {/* Date column */}
                  <div className="text-center min-w-[48px]">
                    <div className="font-display text-xl text-field-400 leading-none">
                      {new Date(game.game_date + 'T00:00:00').getDate()}
                    </div>
                    <div className="text-xs text-[var(--color-text-dim)] uppercase">
                      {new Date(game.game_date + 'T00:00:00').toLocaleString('default', { month: 'short' })}
                    </div>
                    <div className="text-xs text-[var(--color-text-dim)]">
                      {new Date(game.game_date + 'T00:00:00').getFullYear()}
                    </div>
                  </div>

                  {/* Game info */}
                  <div className="flex-1 min-w-0">
                    <div className="font-display text-base text-[var(--color-text)] truncate">
                      {game.home_team} <span className="text-[var(--color-text-dim)] text-sm">vs</span> {game.away_team}
                    </div>
                    <div className="text-xs text-[var(--color-text-dim)] truncate mt-0.5">
                      {game.venue || 'Venue TBD'} · {game.conference || game.game_level || '—'}
                    </div>
                  </div>

                  {/* Score / status */}
                  <div className="text-right">
                    {isGameComplete(game) ? (
                      <div className="font-display text-lg text-[var(--color-text)]">
                        {game.final_score_home}–{game.final_score_away}
                      </div>
                    ) : (
                      <div className="text-xs text-field-500 font-display uppercase tracking-wider">Live</div>
                    )}
                    <ChevronRight size={14} className="ml-auto text-[var(--color-text-dim)]" />
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </main>

      <OfflineBadge />
    </div>
  );
}
