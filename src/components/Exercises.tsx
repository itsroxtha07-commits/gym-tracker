import { useState } from 'react';
import { AppState, Exercise } from '../types';

interface Props {
  state: AppState;
  setState: (s: AppState) => void;
  uid: () => string;
}

const empty = (): Omit<Exercise, 'id'> => ({
  name: '',
  muscleGroup: 'Chest',
  sets: 3,
  reps: 10,
  weight: 0,
  notes: ''
});

const GROUPS = ['Chest', 'Back', 'Legs', 'Shoulders', 'Arms', 'Core', 'Cardio', 'Other'];

export default function Exercises({ state, setState, uid }: Props) {
  const [form, setForm] = useState<Omit<Exercise, 'id'>>(empty());
  const [filter, setFilter] = useState<string>('All');

  const add = () => {
    if (!form.name.trim()) return;
    setState({ ...state, exercises: [...state.exercises, { ...form, id: uid() }] });
    setForm(empty());
  };

  const update = (id: string, patch: Partial<Exercise>) => {
    setState({
      ...state,
      exercises: state.exercises.map(e => (e.id === id ? { ...e, ...patch } : e))
    });
  };

  const remove = (id: string) => {
    if (!confirm('Delete this exercise? It will be removed from schedule.')) return;
    setState({
      ...state,
      exercises: state.exercises.filter(e => e.id !== id),
      schedule: state.schedule.map(s => ({ ...s, exerciseIds: s.exerciseIds.filter(i => i !== id) }))
    });
  };

  const list = state.exercises.filter(e => filter === 'All' || e.muscleGroup === filter);

  return (
    <div className="exercises">
      <div className="card">
        <h2>➕ Add Exercise</h2>
        <div className="form-row">
          <input placeholder="Name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
          <select value={form.muscleGroup} onChange={e => setForm({ ...form, muscleGroup: e.target.value })}>
            {GROUPS.map(g => <option key={g}>{g}</option>)}
          </select>
          <input type="number" min={1} placeholder="Sets" value={form.sets} onChange={e => setForm({ ...form, sets: +e.target.value })} />
          <input type="number" min={1} placeholder="Reps" value={form.reps} onChange={e => setForm({ ...form, reps: +e.target.value })} />
          <input type="number" min={0} step="0.5" placeholder="Weight kg" value={form.weight} onChange={e => setForm({ ...form, weight: +e.target.value })} />
          <input placeholder="Notes" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
          <button className="primary" onClick={add}>Add</button>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h2>Exercise Library ({state.exercises.length})</h2>
          <select value={filter} onChange={e => setFilter(e.target.value)}>
            <option>All</option>
            {GROUPS.map(g => <option key={g}>{g}</option>)}
          </select>
        </div>
        <div className="table">
          <div className="row head">
            <div>Name</div><div>Group</div><div>Sets</div><div>Reps</div><div>Weight</div><div>Notes</div><div></div>
          </div>
          {list.map(ex => (
            <div key={ex.id} className="row">
              <input value={ex.name} onChange={e => update(ex.id, { name: e.target.value })} />
              <select value={ex.muscleGroup} onChange={e => update(ex.id, { muscleGroup: e.target.value })}>
                {GROUPS.map(g => <option key={g}>{g}</option>)}
              </select>
              <input type="number" value={ex.sets} onChange={e => update(ex.id, { sets: +e.target.value })} />
              <input type="number" value={ex.reps} onChange={e => update(ex.id, { reps: +e.target.value })} />
              <input type="number" step="0.5" value={ex.weight} onChange={e => update(ex.id, { weight: +e.target.value })} />
              <input value={ex.notes || ''} onChange={e => update(ex.id, { notes: e.target.value })} />
              <button className="danger small" onClick={() => remove(ex.id)}>✕</button>
            </div>
          ))}
          {list.length === 0 && <p className="muted">No exercises in this group.</p>}
        </div>
      </div>
    </div>
  );
}
