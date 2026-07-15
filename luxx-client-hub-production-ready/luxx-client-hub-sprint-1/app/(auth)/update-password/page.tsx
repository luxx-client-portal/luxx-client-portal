'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/browser';

export default function UpdatePasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function updatePassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    if (password.length < 8) return setError('Use at least 8 characters.');
    if (password !== confirmPassword) return setError('Passwords do not match.');
    setLoading(true);
    try {
      const supabase = createClient();
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) throw updateError;
      router.replace('/dashboard');
      router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Unable to update your password.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="login-page">
      <section className="login-brand">
        <div className="brand-mark">L</div><p>LUXX SOCIALS</p>
        <h1>Create your<br />secure password.</h1>
        <span>Your account gives you private access to your brand workspace.</span>
      </section>
      <section className="login-panel">
        <div className="login-card">
          <p className="eyebrow">ACCOUNT SECURITY</p>
          <h2>Set your password</h2>
          <p className="muted">Choose a password with at least 8 characters.</p>
          {error && <div className="alert error">{error}</div>}
          <form onSubmit={updatePassword} className="stack">
            <label>New password<input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete="new-password" /></label>
            <label>Confirm password<input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required autoComplete="new-password" /></label>
            <button className="button primary" disabled={loading}>{loading ? 'Saving…' : 'Save password'}</button>
          </form>
        </div>
      </section>
    </main>
  );
}
