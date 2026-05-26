import { useEffect, useState } from 'react';
import { AdminStats, AdminUserRow, api, User } from '../api';
import { AppState } from '../types';

interface Props {
  currentUser: User;
}

export default function Admin({ currentUser }: Props) {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [users, setUsers] = useState<AdminUserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [selected, setSelected] = useState<{
    user: User; created_at: string; state: { data: AppState; updated_at: string } | null;
  } | null>(null);

  const load = async () => {
    setLoading(true);
    setErr(null);
    try {
      const [s, u] = await Promise.all([api.adminStats(), api.adminUsers()]);
      setStats(s);
      setUsers(u.users);
    } catch (e: any) {
      setErr(e.message || 'Failed to load admin data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const viewUser = async (id: number) => {
    try {
      const data = await api.adminGetUser(id);
      setSelected(data);
    } catch (e: any) {
      alert(e.message);
    }
  };

  const deleteUser = async (u: AdminUserRow) => {
    if (!confirm(`Delete user ${u.email}? This wipes all their data.`)) return;
    try {
      await api.adminDeleteUser(u.id);
      await load();
    } catch (e: any) {
      alert(e.message);
    }
  };

  const toggleAdmin = async (u: AdminUserRow) => {
    if (!confirm(`${u.is_admin ? 'Revoke' : 'Grant'} admin rights for ${u.email}?`)) return;
    try {
      await api.adminToggleAdmin(u.id);
      await load();
    } catch (e: any) {
      alert(e.message);
    }
  };

  if (loading) return <div className="card"><p className="muted">Loading admin data…</p></div>;
  if (err) return <div className="card"><p className="auth-error">⚠ {err}</p></div>;

  return (
    <div>
      <div className="card-header" style={{ marginBottom: 12 }}>
        <h2 style={{ margin: 0 }}>🛡️ Admin Panel</h2>
        <button className="ghost small" onClick={load}>↻ Refresh</button>
      </div>

      {stats && (
        <div className="stat-grid" style={{ marginBottom: 14 }}>
          <div className="stat card">
            <div className="stat-label">Users</div>
            <div className="stat-value">{stats.totalUsers}</div>
            <div className="muted">{stats.totalAdmins} admin(s)</div>
          </div>
          <div className="stat card">
            <div className="stat-label">Active</div>
            <div className="stat-value">{stats.activeUsers}</div>
            <div className="muted">with saved data</div>
          </div>
          <div className="stat card">
            <div className="stat-label">Workouts</div>
            <div className="stat-value">{stats.totalWorkouts}</div>
            <div className="muted">logged</div>
          </div>
          <div className="stat card">
            <div className="stat-label">Sets Done</div>
            <div className="stat-value">{stats.totalSets.toLocaleString()}</div>
            <div className="muted">across all users</div>
          </div>
          <div className="stat card">
            <div className="stat-label">Volume</div>
            <div className="stat-value">{stats.totalVolumeKg.toLocaleString()}</div>
            <div className="muted">kg lifted</div>
          </div>
        </div>
      )}

      <div className="card">
        <h3>Users ({users.length})</h3>
        <div className="table">
          <div className="row head admin-row">
            <div>Email</div><div>Name</div><div>Role</div>
            <div>Workouts</div><div>Last Active</div><div>Joined</div><div></div>
          </div>
          {users.map(u => (
            <div key={u.id} className="row admin-row">
              <div title={u.email}>{u.email}</div>
              <div>{u.name || '—'}</div>
              <div>
                {u.is_admin ? <span className="badge admin">👑 Admin</span> : <span className="badge">User</span>}
                {u.id === currentUser.id && <span className="badge me"> you</span>}
              </div>
              <div>{u.workouts}</div>
              <div className="small muted">{u.last_active ? new Date(u.last_active).toLocaleDateString() : '—'}</div>
              <div className="small muted">{new Date(u.created_at).toLocaleDateString()}</div>
              <div className="admin-actions">
                <button className="ghost small" onClick={() => viewUser(u.id)}>View</button>
                {u.id !== currentUser.id && (
                  <>
                    <button className="ghost small" onClick={() => toggleAdmin(u)}>
                      {u.is_admin ? 'Revoke' : 'Promote'}
                    </button>
                    <button className="danger small" onClick={() => deleteUser(u)}>✕</button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {selected && (
        <div className="modal-backdrop" onClick={() => setSelected(null)}>
          <div className="modal card" onClick={e => e.stopPropagation()}>
            <div className="card-header">
              <h3>{selected.user.email}</h3>
              <button className="ghost small" onClick={() => setSelected(null)}>✕ Close</button>
            </div>
            <p className="muted small">
              ID: {selected.user.id} • Joined {new Date(selected.created_at).toLocaleString()}
              {selected.state && ` • Last sync ${new Date(selected.state.updated_at).toLocaleString()}`}
            </p>
            {selected.state ? (
              <>
                <h4>Summary</h4>
                <ul className="exercise-list">
                  <li><b>Exercises:</b> {selected.state.data.exercises.length}</li>
                  <li><b>Workout logs:</b> {selected.state.data.logs.length}</li>
                  <li><b>Body metrics:</b> {selected.state.data.metrics.length}</li>
                  <li><b>Goals:</b> {selected.state.data.goals.length}</li>
                </ul>
                <h4>Raw data</h4>
                <pre className="code-block">{JSON.stringify(selected.state.data, null, 2)}</pre>
              </>
            ) : (
              <p className="muted">No saved data yet.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
