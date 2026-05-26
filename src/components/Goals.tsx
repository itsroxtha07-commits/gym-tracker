import { useState } from 'react';
import { AppState, Goal } from '../types';

interface Props {
  state: AppState;
  setState: (s: AppState) => void;
  uid: () => string;
}

export default function Goals({ state, setState, uid }: Props) {
  const [form, setForm] = useState<Omit<Goal, 'id' | 'done'>>({ title: '', target: '', deadline: '' });

  const add = () => {
    if (!form.title.trim()) return;
    setState({ ...state, goals: [...state.goals, { ...form, id: uid(), done: false }] });
    setForm({ title: '', target: '', deadline: '' });
  };
  const toggle = (id: string) =>
    setState({ ...state, goals: state.goals.map(g => g.id === id ? { ...g, done: !g.done } : g) });
  const remove = (id: string) =>
    setState({ ...state, goals: state.goals.filter(g => g.id !== id) });

  return (
    <div>
      <div className="card">
        <h2>🎯 Add Goal</h2>
        <div className="form-row">
          <input placeholder="Goal title" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
          <input placeholder="Target (e.g. 100kg x 5)" value={form.target} onChange={e => setForm({ ...form, target: e.target.value })} />
          <input type="date" value={form.deadline || ''} onChange={e => setForm({ ...form, deadline: e.target.value })} />
          <button className="primary" onClick={add}>Add</button>
        </div>
      </div>

      <div className="card">
        <h2>My Goals ({state.goals.filter(g => !g.done).length} open / {state.goals.length} total)</h2>
        {state.goals.length === 0 ? <p className="muted">No goals yet. Set one!</p> : (
          <ul className="goal-list">
            {state.goals.map(g => (
              <li key={g.id} className={g.done ? 'goal done' : 'goal'}>
                <label className="check">
                  <input type="checkbox" checked={g.done} onChange={() => toggle(g.id)} />
                  <span>{g.done ? '✓' : ''}</span>
                </label>
                <div className="goal-info">
                  <b>{g.title}</b>
                  <div className="muted">{g.target}{g.deadline ? ` • due ${g.deadline}` : ''}</div>
                </div>
                <button className="danger small" onClick={() => remove(g.id)}>✕</button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
