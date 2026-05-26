import { AppState, DayOfWeek } from '../types';

interface Props {
  state: AppState;
  today: DayOfWeek;
  onStart: (d: DayOfWeek) => void;
}

export default function Dashboard({ state, today, onStart }: Props) {
  const todayPlan = state.schedule.find(s => s.day === today)!;
  const todayExercises = todayPlan.exerciseIds
    .map(id => state.exercises.find(e => e.id === id))
    .filter(Boolean);

  // stats
  const totalLogs = state.logs.length;
  const last7 = state.logs.filter(l => {
    const diff = (Date.now() - new Date(l.date).getTime()) / (1000 * 60 * 60 * 24);
    return diff <= 7;
  }).length;

  const totalVolume = state.logs.reduce((acc, log) => {
    return (
      acc +
      log.entries.reduce(
        (a, e) => a + e.sets.filter(s => s.done).reduce((x, s) => x + s.reps * s.weight, 0),
        0
      )
    );
  }, 0);

  const streak = (() => {
    if (state.logs.length === 0) return 0;
    const dates = new Set(state.logs.map(l => l.date));
    let s = 0;
    const d = new Date();
    while (true) {
      const iso = d.toISOString().slice(0, 10);
      if (dates.has(iso)) {
        s++;
        d.setDate(d.getDate() - 1);
      } else break;
    }
    return s;
  })();

  const latestWeight = state.metrics[state.metrics.length - 1];
  const openGoals = state.goals.filter(g => !g.done).length;

  return (
    <div className="dashboard">
      <div className="stat-grid">
        <div className="stat card">
          <div className="stat-label">Workouts</div>
          <div className="stat-value">{totalLogs}</div>
          <div className="muted">{last7} this week</div>
        </div>
        <div className="stat card">
          <div className="stat-label">Streak</div>
          <div className="stat-value">{streak}🔥</div>
          <div className="muted">consecutive days</div>
        </div>
        <div className="stat card">
          <div className="stat-label">Total Volume</div>
          <div className="stat-value">{Math.round(totalVolume).toLocaleString()}</div>
          <div className="muted">kg lifted</div>
        </div>
        <div className="stat card">
          <div className="stat-label">Body Weight</div>
          <div className="stat-value">{latestWeight ? latestWeight.weightKg + 'kg' : '—'}</div>
          <div className="muted">{latestWeight ? latestWeight.date : 'No data'}</div>
        </div>
        <div className="stat card">
          <div className="stat-label">Open Goals</div>
          <div className="stat-value">{openGoals}</div>
          <div className="muted">in progress</div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h2>Today — {today}: {todayPlan.title}</h2>
          {todayExercises.length > 0 && (
            <button className="primary" onClick={() => onStart(today)}>▶ Start Workout</button>
          )}
        </div>
        {todayExercises.length === 0 ? (
          <p className="muted">Rest day or nothing scheduled. Take it easy! 🛌</p>
        ) : (
          <ul className="exercise-list">
            {todayExercises.map(e => (
              <li key={e!.id}>
                <span className="pill">{e!.muscleGroup}</span>
                <b>{e!.name}</b>
                <span className="muted">{e!.sets} × {e!.reps} @ {e!.weight}kg</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="card">
        <h2>Recent Activity</h2>
        {state.logs.length === 0 ? (
          <p className="muted">No workouts logged yet. Crush your first session! 💪</p>
        ) : (
          <ul className="exercise-list">
            {state.logs.slice(-5).reverse().map(l => {
              const setsDone = l.entries.reduce((a, e) => a + e.sets.filter(s => s.done).length, 0);
              return (
                <li key={l.id}>
                  <span className="pill">{l.date}</span>
                  <b>{l.day}: {l.title}</b>
                  <span className="muted">{setsDone} sets done</span>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
