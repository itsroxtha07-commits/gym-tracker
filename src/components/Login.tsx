import { useState } from 'react';
import { api, setToken, User } from '../api';

interface Props {
  onAuth: (user: User) => void;
}

export default function Login({ onAuth }: Props) {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    setBusy(true);
    try {
      const res =
        mode === 'login'
          ? await api.login(email, password)
          : await api.register(email, password, name);
      setToken(res.token);
      onAuth(res.user);
    } catch (e: any) {
      setErr(e.message || 'Something went wrong');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="auth-wrap">
      <div className="card auth-card">
        <div style={{ textAlign: 'center', marginBottom: 16 }}>
          <div style={{ fontSize: 48 }}>💪</div>
          <h1 style={{ margin: '8px 0 4px' }}>Gym Schedule & Tracker</h1>
          <p className="muted">{mode === 'login' ? 'Welcome back!' : 'Create your account'}</p>
        </div>

        <form onSubmit={submit} className="auth-form">
          {mode === 'register' && (
            <input
              placeholder="Your name (optional)"
              value={name}
              onChange={e => setName(e.target.value)}
            />
          )}
          <input
            type="email"
            placeholder="Email"
            required
            autoComplete="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
          />
          <input
            type="password"
            placeholder="Password (min 6 chars)"
            required
            minLength={6}
            autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
            value={password}
            onChange={e => setPassword(e.target.value)}
          />
          {err && <div className="auth-error">⚠ {err}</div>}
          <button type="submit" className="primary" disabled={busy}>
            {busy ? '…' : mode === 'login' ? 'Log In' : 'Sign Up'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: 12 }}>
          <button
            className="ghost small"
            type="button"
            onClick={() => { setErr(null); setMode(mode === 'login' ? 'register' : 'login'); }}
          >
            {mode === 'login'
              ? "Don't have an account? Sign up"
              : 'Already have an account? Log in'}
          </button>
        </div>
      </div>
    </div>
  );
}
