import { useMemo, useState } from 'react';
import { AppState } from '../types';

interface Props {
  state: AppState;
  setState: (s: AppState) => void;
}

export default function History({ state, setState }: Props) {
  const [filterEx, setFilterEx] = useState<string>('');

  const logs = useMemo(() => [...state.logs].sort((a, b) => b.date.localeCompare(a.date)), [state.logs]);

  const remove = (id: string) => {
    if (!confirm('Delete this log?')) return;
    setState({ ...state, logs: state.logs.filter(l => l.id !== id) });
  };

  // PR / progression per exercise
  const progression = useMemo(() => {
    if (!filterEx) return null;
    const points: { date: string; bestWeight: number; topVolume: number }[] = [];
    state.logs.forEach(l => {
      const ent = l.entries.find(e => e.exerciseId === filterEx);
      if (!ent) return;
      const done = ent.sets.filter(s => s.done);
      if (!done.length) return;
      const bestWeight = Math.max(...done.map(s => s.weight));
      const topVolume = done.reduce((a, s) => a + s.reps * s.weight, 0);
      points.push({ date: l.date, bestWeight, topVolume });
    });
    return points.sort((a, b) => a.date.localeCompare(b.date));
  }, [state.logs, filterEx]);

  return (
    <div>
      <div className="card">
        <div className="card-header">
          <h2>📜 Workout History ({logs.length})</h2>
          <select value={filterEx} onChange={e => setFilterEx(e.target.value)}>
            <option value="">— Progression per exercise —</option>
            {state.exercises.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
          </select>
        </div>

        {progression && progression.length > 0 && (
          <div className="progression">
            <h3>{state.exercises.find(e => e.id === filterEx)?.name} progression</h3>
            <div className="bar-chart">
              {progression.map(p => {
                const max = Math.max(...progression.map(x => x.bestWeight), 1);
                return (
                  <div key={p.date} className="bar-col" title={`${p.date}: ${p.bestWeight}kg, vol ${p.topVolume}`}>
                    <div className="bar" style={{ height: `${(p.bestWeight / max) * 100}%` }}>
                      <span>{p.bestWeight}</span>
                    </div>
                    <div className="bar-label">{p.date.slice(5)}</div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {logs.length === 0 && <div className="card"><p className="muted">No history yet. Complete a workout!</p></div>}

      {logs.map(l => {
        const sets = l.entries.reduce((a, e) => a + e.sets.filter(s => s.done).length, 0);
        const vol = l.entries.reduce((a, e) => a + e.sets.filter(s => s.done).reduce((x, s) => x + s.reps * s.weight, 0), 0);
        return (
          <div key={l.id} className="card">
            <div className="card-header">
              <div>
                <h3>{l.date} — {l.day}: {l.title}</h3>
                <p className="muted">{sets} sets • {Math.round(vol)}kg volume • {l.durationMin ?? 0} min</p>
              </div>
              <button className="danger small" onClick={() => remove(l.id)}>Delete</button>
            </div>
            <ul className="exercise-list">
              {l.entries.map((e, i) => {
                const done = e.sets.filter(s => s.done);
                if (done.length === 0) return null;
                const best = Math.max(...done.map(s => s.weight));
                return (
                  <li key={i}>
                    <b>{e.exerciseName}</b>
                    <span className="muted">
                      {done.map(s => `${s.reps}×${s.weight}`).join(', ')} • top {best}kg
                    </span>
                  </li>
                );
              })}
            </ul>
            {l.notes && <p className="muted">📝 {l.notes}</p>}
          </div>
        );
      })}
    </div>
  );
}
