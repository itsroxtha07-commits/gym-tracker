import { useEffect, useMemo, useState } from 'react';
import { AppState, CompletedSet, DAYS, DayOfWeek, WorkoutLog } from '../types';

interface Props {
  state: AppState;
  setState: (s: AppState) => void;
  day: DayOfWeek;
  setDay: (d: DayOfWeek) => void;
  uid: () => string;
  onDone: () => void;
}

export default function WorkoutSession({ state, setState, day, setDay, uid, onDone }: Props) {
  const schedule = state.schedule.find(s => s.day === day)!;
  const exercises = schedule.exerciseIds
    .map(id => state.exercises.find(e => e.id === id))
    .filter(Boolean) as AppState['exercises'];

  const buildEntries = () =>
    exercises.map(ex => ({
      exerciseId: ex.id,
      exerciseName: ex.name,
      sets: Array.from({ length: ex.sets }, () => ({ reps: ex.reps, weight: ex.weight, done: false } as CompletedSet))
    }));

  const [entries, setEntries] = useState(buildEntries);
  const [notes, setNotes] = useState('');
  const [startedAt] = useState(() => Date.now());
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    setEntries(buildEntries());
    setNotes('');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [day, schedule.exerciseIds.join(',')]);

  useEffect(() => {
    const t = setInterval(() => setElapsed(Math.floor((Date.now() - startedAt) / 1000)), 1000);
    return () => clearInterval(t);
  }, [startedAt]);

  const updateSet = (ei: number, si: number, patch: Partial<CompletedSet>) => {
    setEntries(prev =>
      prev.map((e, i) =>
        i === ei ? { ...e, sets: e.sets.map((s, j) => (j === si ? { ...s, ...patch } : s)) } : e
      )
    );
  };

  const addSet = (ei: number) => {
    setEntries(prev =>
      prev.map((e, i) => {
        if (i !== ei) return e;
        const last = e.sets[e.sets.length - 1] || { reps: 10, weight: 0, done: false };
        return { ...e, sets: [...e.sets, { reps: last.reps, weight: last.weight, done: false }] };
      })
    );
  };

  const removeSet = (ei: number, si: number) => {
    setEntries(prev =>
      prev.map((e, i) => (i === ei ? { ...e, sets: e.sets.filter((_, j) => j !== si) } : e))
    );
  };

  const stats = useMemo(() => {
    const totalSets = entries.reduce((a, e) => a + e.sets.length, 0);
    const doneSets = entries.reduce((a, e) => a + e.sets.filter(s => s.done).length, 0);
    const volume = entries.reduce(
      (a, e) => a + e.sets.filter(s => s.done).reduce((x, s) => x + s.reps * s.weight, 0),
      0
    );
    return { totalSets, doneSets, volume };
  }, [entries]);

  const save = () => {
    if (stats.doneSets === 0) {
      if (!confirm('No sets marked done. Save anyway?')) return;
    }
    const log: WorkoutLog = {
      id: uid(),
      date: new Date().toISOString().slice(0, 10),
      day,
      title: schedule.title,
      entries,
      durationMin: Math.round(elapsed / 60),
      notes
    };
    setState({ ...state, logs: [...state.logs, log] });
    onDone();
  };

  const fmt = (s: number) =>
    `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

  return (
    <div className="workout">
      <div className="card">
        <div className="card-header">
          <div>
            <h2>🔥 {day}: {schedule.title}</h2>
            <p className="muted">
              ⏱ {fmt(elapsed)} • {stats.doneSets}/{stats.totalSets} sets • {Math.round(stats.volume)}kg volume
            </p>
          </div>
          <div className="row-actions">
            <select value={day} onChange={e => setDay(e.target.value as DayOfWeek)}>
              {DAYS.map(d => <option key={d}>{d}</option>)}
            </select>
            <button className="primary" onClick={save}>💾 Save Workout</button>
          </div>
        </div>
      </div>

      {exercises.length === 0 && (
        <div className="card"><p className="muted">No exercises planned for {day}. Add some in the Schedule tab.</p></div>
      )}

      {entries.map((entry, ei) => (
        <div key={entry.exerciseId} className="card">
          <div className="card-header">
            <h3>{entry.exerciseName}</h3>
            <button className="ghost small" onClick={() => addSet(ei)}>+ Set</button>
          </div>
          <div className="sets">
            <div className="set-row head">
              <div>#</div><div>Reps</div><div>Weight (kg)</div><div>Done</div><div></div>
            </div>
            {entry.sets.map((s, si) => (
              <div key={si} className={s.done ? 'set-row done' : 'set-row'}>
                <div>{si + 1}</div>
                <input type="number" value={s.reps} onChange={e => updateSet(ei, si, { reps: +e.target.value })} />
                <input type="number" step="0.5" value={s.weight} onChange={e => updateSet(ei, si, { weight: +e.target.value })} />
                <label className="check">
                  <input type="checkbox" checked={s.done} onChange={e => updateSet(ei, si, { done: e.target.checked })} />
                  <span>{s.done ? '✓' : ''}</span>
                </label>
                <button className="danger small" onClick={() => removeSet(ei, si)}>✕</button>
              </div>
            ))}
          </div>
        </div>
      ))}

      {exercises.length > 0 && (
        <div className="card">
          <h3>Session Notes</h3>
          <textarea
            rows={3}
            placeholder="How did it feel? Any PRs?"
            value={notes}
            onChange={e => setNotes(e.target.value)}
          />
          <div style={{ marginTop: 12 }}>
            <button className="primary" onClick={save}>💾 Save Workout</button>
          </div>
        </div>
      )}
    </div>
  );
}
