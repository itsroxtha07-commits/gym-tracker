import { useEffect, useMemo, useRef, useState } from 'react';
import { AppState, DAYS, DayOfWeek } from './types';
import { defaultState } from './storage';
import { api, getToken, setToken, User } from './api';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import Schedule from './components/Schedule';
import Exercises from './components/Exercises';
import WorkoutSession from './components/WorkoutSession';
import History from './components/History';
import Metrics from './components/Metrics';
import Goals from './components/Goals';
import Admin from './components/Admin';
import Profile from './components/Profile';

type Tab = 'dashboard' | 'schedule' | 'exercises' | 'workout' | 'history' | 'metrics' | 'goals' | 'profile' | 'admin';

const todayName = (): DayOfWeek => {
  const map: DayOfWeek[] = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return map[new Date().getDay()];
};

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [bootLoading, setBootLoading] = useState(true);
  const [state, setState] = useState<AppState | null>(null);
  const [tab, setTab] = useState<Tab>('dashboard');
  const [activeDay, setActiveDay] = useState<DayOfWeek>(todayName());
  const [syncStatus, setSyncStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const saveTimer = useRef<number | null>(null);
  const firstLoad = useRef(true);

  // Boot: validate existing token
  useEffect(() => {
    (async () => {
      if (!getToken()) { setBootLoading(false); return; }
      try {
        const { user } = await api.me();
        setUser(user);
      } catch {
        setToken(null);
      } finally {
        setBootLoading(false);
      }
    })();
  }, []);

  // Load state on login
  useEffect(() => {
    if (!user) { setState(null); return; }
    (async () => {
      firstLoad.current = true;
      try {
        const { data } = await api.getState();
        setState(data ?? defaultState());
      } catch (e) {
        console.error(e);
        setState(defaultState());
      }
    })();
  }, [user]);

  // Debounced auto-save to server
  useEffect(() => {
    if (!user || !state) return;
    if (firstLoad.current) { firstLoad.current = false; return; }
    if (saveTimer.current) window.clearTimeout(saveTimer.current);
    setSyncStatus('saving');
    saveTimer.current = window.setTimeout(async () => {
      try {
        await api.putState(state);
        setSyncStatus('saved');
        window.setTimeout(() => setSyncStatus('idle'), 1500);
      } catch (e) {
        console.error(e);
        setSyncStatus('error');
      }
    }, 700);
  }, [state, user]);

  const today = todayName();
  const todaySchedule = useMemo(
    () => state?.schedule.find(s => s.day === today),
    [state, today]
  );

  const startWorkout = (day: DayOfWeek) => { setActiveDay(day); setTab('workout'); };
  const logout = () => { setToken(null); setUser(null); setState(null); };
  const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36);

  if (bootLoading) return <div className="boot"><div className="spinner" />Loading…</div>;
  if (!user) return <Login onAuth={setUser} />;
  if (!state) return <div className="boot"><div className="spinner" />Syncing your data…</div>;

  const tabs: { id: Tab; label: string; icon: string }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊' },
    { id: 'schedule', label: 'Schedule', icon: '📅' },
    { id: 'workout', label: 'Workout', icon: '🔥' },
    { id: 'exercises', label: 'Exercises', icon: '🏋️' },
    { id: 'history', label: 'History', icon: '📜' },
    { id: 'metrics', label: 'Body', icon: '⚖️' },
    { id: 'goals', label: 'Goals', icon: '🎯' },
    { id: 'profile', label: 'Profile', icon: '👤' },
    ...(user.is_admin ? [{ id: 'admin' as Tab, label: 'Admin', icon: '🛡️' }] : [])
  ];

  const syncBadge = { idle: '', saving: '⏳ Syncing…', saved: '✓ Synced', error: '⚠ Offline' }[syncStatus];

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">
          <span className="logo">💪</span>
          <div>
            <h1>Gym Schedule & Tracker</h1>
            <p className="muted">
              Today is <b>{today}</b>{todaySchedule ? ` — ${todaySchedule.title}` : ''}
            </p>
          </div>
        </div>
        <div className="user-box">
          {syncBadge && <span className={`sync-badge ${syncStatus}`}>{syncBadge}</span>}
          <span className="muted small">👤 {user.name || user.email}</span>
          <button className="ghost small" onClick={logout}>Log out</button>
        </div>
      </header>

      <nav className="tabs">
        {tabs.map(t => (
          <button
            key={t.id}
            className={tab === t.id ? 'tab active' : 'tab'}
            onClick={() => setTab(t.id)}
          >
            <span>{t.icon}</span> {t.label}
          </button>
        ))}
      </nav>

      <main className="content">
        {tab === 'dashboard' && <Dashboard state={state} onStart={startWorkout} today={today} />}
        {tab === 'schedule' && <Schedule state={state} setState={setState} onStart={startWorkout} />}
        {tab === 'exercises' && <Exercises state={state} setState={setState} uid={uid} />}
        {tab === 'workout' && (
          <WorkoutSession
            state={state} setState={setState}
            day={activeDay} setDay={setActiveDay}
            uid={uid} onDone={() => setTab('history')}
          />
        )}
        {tab === 'history' && <History state={state} setState={setState} />}
        {tab === 'metrics' && <Metrics state={state} setState={setState} uid={uid} />}
        {tab === 'goals' && <Goals state={state} setState={setState} uid={uid} />}
        {tab === 'profile' && <Profile user={user} state={state} setState={setState} onLogout={logout} />}
        {tab === 'admin' && user.is_admin && <Admin currentUser={user} />}
      </main>

      <footer className="footer muted">
        Synced to your account • {DAYS.length}-day weekly planner
      </footer>
    </div>
  );
}
