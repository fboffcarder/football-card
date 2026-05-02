'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<'login' | 'signup' | 'magic'>('login');
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (mode === 'magic') {
        const { error } = await supabase.auth.signInWithOtp({ email });
        if (error) throw error;
        setSent(true);
      } else if (mode === 'signup') {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        setSent(true);
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        router.push('/');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4" style={{ backgroundColor: 'var(--color-bg)' }}>
        <div className="card max-w-sm w-full text-center space-y-4">
          <div className="text-4xl">✉️</div>
          <h2 className="font-display text-xl text-[var(--color-text)]">Check your email</h2>
          <p className="text-sm text-[var(--color-text-muted)]">
            {mode === 'magic' ? 'We sent a magic link to' : 'Confirmation email sent to'} <strong>{email}</strong>
          </p>
          <button onClick={() => { setSent(false); setMode('login'); }} className="btn-secondary text-sm">
            Back to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ backgroundColor: 'var(--color-bg)' }}>
      <div className="w-full max-w-sm space-y-6">
        {/* Logo */}
        <div className="text-center">
          <h1 className="font-display text-4xl tracking-widest text-field-400 uppercase">Football</h1>
          <p className="text-sm text-[var(--color-text-dim)] tracking-widest uppercase">Officiating</p>
        </div>

        <div className="card space-y-4">
          <div className="flex gap-1 bg-[var(--color-surface-2)] rounded-lg p-1">
            {(['login', 'signup', 'magic'] as const).map(m => (
              <button key={m} onClick={() => setMode(m)}
                className={`flex-1 py-1.5 rounded-md text-sm font-display uppercase tracking-wider transition-colors ${mode === m ? 'bg-field-700 text-white' : 'text-[var(--color-text-dim)]'}`}>
                {m === 'magic' ? '✨ Link' : m}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="label">Email</label>
              <input
                type="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com" required className="input-field"
              />
            </div>

            {mode !== 'magic' && (
              <div>
                <label className="label">Password</label>
                <input
                  type="password" value={password} onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••" required className="input-field"
                />
              </div>
            )}

            {error && <p className="text-red-400 text-sm">{error}</p>}

            <button type="submit" disabled={loading} className="btn-primary w-full">
              {loading ? 'Please wait…' : mode === 'magic' ? 'Send Magic Link' : mode === 'signup' ? 'Create Account' : 'Sign In'}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-[var(--color-text-dim)]">
          Football Officiating App · For officials only
        </p>
      </div>
    </div>
  );
}
