'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/browser';

export default function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  async function signIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    try {
      const supabase = createClient();
      const { error: authError } = await supabase.auth.signInWithPassword({ email, password });
      if (authError) throw authError;
      router.replace('/dashboard');
      router.refresh();
    } catch (caught) {
      const detail = caught instanceof Error ? caught.message : 'Unable to sign in.';
      setError(detail === 'Failed to fetch' ? 'The portal could not reach Supabase. Recheck the Project URL and publishable key in Vercel, then redeploy.' : detail);
    } finally {
      setLoading(false);
    }
  }

  async function resetPassword() {
    setError('');
    setMessage('');
    if (!email) {
      setError('Enter your email address first.');
      return;
    }
    setLoading(true);
    try {
      const supabase = createClient();
      const redirectTo = `${window.location.origin}/auth/callback?next=/update-password`;
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });
      if (resetError) throw resetError;
      setMessage('Password reset email sent.');
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Unable to send the reset email.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-card">
      <p className="eyebrow">CLIENT PORTAL</p>
      <h2>Welcome back</h2>
      <p className="muted">Sign in to your Luxx Client Hub.</p>
      {error && <div className="alert error">{error}</div>}
      {message && <div className="alert success">{message}</div>}
      <form onSubmit={signIn} className="stack">
        <label>
          Email
          <input value={email} onChange={(event) => setEmail(event.target.value)} type="email" required placeholder="you@company.com" autoComplete="email" />
        </label>
        <label>
          Password
          <input value={password} onChange={(event) => setPassword(event.target.value)} type="password" required placeholder="••••••••" autoComplete="current-password" />
        </label>
        <button className="button primary" disabled={loading}>{loading ? 'Signing in…' : 'Sign in'}</button>
      </form>
      <button className="text-button" type="button" onClick={resetPassword} disabled={loading}>Forgot password?</button>
    </div>
  );
}
