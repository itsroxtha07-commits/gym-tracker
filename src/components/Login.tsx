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
  const [showForgot, setShowForgot] = useState(false);

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

        <div style={{ textAlign: 'center', marginTop: 12, display: 'flex', flexDirection: 'column', gap: 6 }}>
          <button
            className="ghost small"
            type="button"
            onClick={() => { setErr(null); setMode(mode === 'login' ? 'register' : 'login'); }}
          >
            {mode === 'login'
              ? "Don't have an account? Sign up"
              : 'Already have an account? Log in'}
          </button>
          {mode === 'login' && (
            <button className="ghost small" type="button" onClick={() => setShowForgot(true)}>
              Forgot password?
            </button>
          )}
        </div>

        {showForgot && (
          <div className="modal-backdrop" onClick={() => setShowForgot(false)}>
            <div className="modal card" onClick={e => e.stopPropagation()} style={{ maxWidth: 460 }}>
              <div className="card-header">
                <h3>🔑 Forgot Password</h3>
                <button className="ghost small" onClick={() => setShowForgot(false)}>✕</button>
              </div>
              <p>Since this is a private gym tracker, password resets are handled by the admin.</p>
              <ol className="muted" style={{ paddingLeft: 20, lineHeight: 1.8 }}>
                <li>Email the admin: <b>its.roxtha07@gmail.com</b></li>
                <li>Include the email address you signed up with</li>
                <li>Admin will reply with a temporary password</li>
                <li>Log in with it, then go to <b>Profile → Change Password</b> to set a new one</li>
              </ol>
              <div style={{ marginTop: 12 }}>
                <a
                  href="mailto:its.roxtha07@gmail.com?subject=Gym Tracker - Password Reset Request&body=Hi, please reset the password for my account. My email is: "
                  className="primary"
                  style={{ display: 'inline-block', padding: '8px 14px', borderRadius: 8, textDecoration: 'none', color: 'white' }}
                >
                  📧 Email Admin
                </a>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
