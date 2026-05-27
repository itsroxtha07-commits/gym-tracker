import { useRef, useState } from 'react';
import { api, setToken, User } from '../api';
import { AppState } from '../types';

interface Props {
  user: User;
  state: AppState;
  setState: (s: AppState) => void;
  onLogout: () => void;
}

export default function Profile({ user, state, setState, onLogout }: Props) {
  const [curPw, setCurPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [pwMsg, setPwMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const downloadJson = () => {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `gym-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadCsv = () => {
    const rows: string[] = ['date,day,workout_title,exercise,set,reps,weight_kg,volume_kg'];
    state.logs.forEach(log => {
      log.entries.forEach(e => {
        e.sets.forEach((s, i) => {
          if (s.done) {
            rows.push([
              log.date, log.day, JSON.stringify(log.title), JSON.stringify(e.exerciseName),
              i + 1, s.reps, s.weight, s.reps * s.weight
            ].join(','));
          }
        });
      });
    });
    const blob = new Blob([rows.join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `gym-history-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const importJson = async (file: File) => {
    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      if (!parsed.exercises || !parsed.schedule) throw new Error('Invalid backup file');
      if (!confirm('This will REPLACE all your current data with the backup. Continue?')) return;
      setState(parsed as AppState);
      alert('✓ Backup restored! It will sync to the server shortly.');
    } catch (e: any) {
      alert('Failed to import: ' + e.message);
    }
  };

  const changePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwMsg(null);
    try {
      await api.changePassword(curPw, newPw);
      setPwMsg({ ok: true, text: '✓ Password changed successfully' });
      setCurPw(''); setNewPw('');
    } catch (e: any) {
      setPwMsg({ ok: false, text: e.message });
    }
  };

  const deleteAccount = async () => {
    const confirmText = prompt(`This will PERMANENTLY delete your account and ALL your data.\n\nType your email "${user.email}" to confirm:`);
    if (confirmText !== user.email) return;
    try {
      await api.deleteAccount();
      setToken(null);
      onLogout();
    } catch (e: any) {
      alert(e.message);
    }
  };

  // Stats
  const totalSets = state.logs.reduce(
    (a, l) => a + l.entries.reduce((b, e) => b + e.sets.filter(s => s.done).length, 0), 0
  );
  const totalVolume = state.logs.reduce(
    (a, l) => a + l.entries.reduce(
      (b, e) => b + e.sets.filter(s => s.done).reduce((c, s) => c + s.reps * s.weight, 0), 0), 0
  );

  return (
    <div>
      <div className="card">
        <h2>👤 Account</h2>
        <div className="profile-info">
          <div><span className="muted small">Email</span><div><b>{user.email}</b></div></div>
          <div><span className="muted small">Name</span><div><b>{user.name || '—'}</b></div></div>
          <div><span className="muted small">User ID</span><div><b>#{user.id}</b></div></div>
          <div><span className="muted small">Role</span><div><b>{user.is_admin ? '👑 Admin' : 'User'}</b></div></div>
        </div>
      </div>

      <div className="card">
        <h2>📊 Your Stats</h2>
        <div className="stat-grid">
          <div className="stat"><div className="stat-label">Exercises</div><div className="stat-value">{state.exercises.length}</div></div>
          <div className="stat"><div className="stat-label">Workouts</div><div className="stat-value">{state.logs.length}</div></div>
          <div className="stat"><div className="stat-label">Sets</div><div className="stat-value">{totalSets}</div></div>
          <div className="stat"><div className="stat-label">Volume</div><div className="stat-value">{Math.round(totalVolume).toLocaleString()}<span style={{ fontSize: 14 }}>kg</span></div></div>
          <div className="stat"><div className="stat-label">Body Logs</div><div className="stat-value">{state.metrics.length}</div></div>
          <div className="stat"><div className="stat-label">Goals</div><div className="stat-value">{state.goals.length}</div></div>
        </div>
      </div>

      <div className="card">
        <h2>💾 Backup & Export</h2>
        <p className="muted small">Download all your data. JSON is a full backup you can re-import; CSV is for spreadsheets.</p>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button onClick={downloadJson}>⬇ Download JSON backup</button>
          <button onClick={downloadCsv}>⬇ Export history CSV</button>
          <button onClick={() => fileRef.current?.click()}>⬆ Restore from backup</button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            style={{ display: 'none' }}
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) importJson(f);
              e.target.value = '';
            }}
          />
        </div>
      </div>

      <div className="card">
        <h2>🔑 Change Password</h2>
        <form onSubmit={changePassword} className="auth-form" style={{ maxWidth: 380 }}>
          <input type="password" placeholder="Current password" required value={curPw} onChange={e => setCurPw(e.target.value)} autoComplete="current-password" />
          <input type="password" placeholder="New password (min 6 chars)" required minLength={6} value={newPw} onChange={e => setNewPw(e.target.value)} autoComplete="new-password" />
          {pwMsg && (
            <div className={pwMsg.ok ? 'auth-ok' : 'auth-error'}>
              {pwMsg.text}
            </div>
          )}
          <button type="submit" className="primary">Update Password</button>
        </form>
      </div>

      <div className="card danger-card">
        <h2>⚠️ Danger Zone</h2>
        <p className="muted small">Deleting your account is permanent and immediate. Make a backup first.</p>
        <button className="danger" onClick={deleteAccount}>🗑 Delete my account & all data</button>
      </div>
    </div>
  );
}
