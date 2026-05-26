import { useState } from 'react';
import { AppState, BodyMetric } from '../types';

interface Props {
  state: AppState;
  setState: (s: AppState) => void;
  uid: () => string;
}

export default function Metrics({ state, setState, uid }: Props) {
  const [form, setForm] = useState<Omit<BodyMetric, 'id'>>({
    date: new Date().toISOString().slice(0, 10),
    weightKg: 70,
    bodyFatPct: undefined,
    notes: ''
  });

  const add = () => {
    setState({ ...state, metrics: [...state.metrics, { ...form, id: uid() }] });
  };

  const remove = (id: string) =>
    setState({ ...state, metrics: state.metrics.filter(m => m.id !== id) });

  const sorted = [...state.metrics].sort((a, b) => a.date.localeCompare(b.date));
  const maxW = Math.max(...sorted.map(m => m.weightKg), 1);
  const minW = Math.min(...sorted.map(m => m.weightKg), maxW);
  const range = Math.max(maxW - minW, 1);

  return (
    <div>
      <div className="card">
        <h2>⚖️ Log Body Metric</h2>
        <div className="form-row">
          <input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} />
          <input type="number" step="0.1" placeholder="Weight (kg)" value={form.weightKg} onChange={e => setForm({ ...form, weightKg: +e.target.value })} />
          <input type="number" step="0.1" placeholder="Body Fat %" value={form.bodyFatPct ?? ''} onChange={e => setForm({ ...form, bodyFatPct: e.target.value ? +e.target.value : undefined })} />
          <input placeholder="Notes" value={form.notes || ''} onChange={e => setForm({ ...form, notes: e.target.value })} />
          <button className="primary" onClick={add}>Add</button>
        </div>
      </div>

      {sorted.length > 0 && (
        <div className="card">
          <h2>Weight Trend</h2>
          <div className="bar-chart">
            {sorted.map(m => (
              <div key={m.id} className="bar-col" title={`${m.date}: ${m.weightKg}kg`}>
                <div className="bar" style={{ height: `${((m.weightKg - minW) / range) * 90 + 10}%` }}>
                  <span>{m.weightKg}</span>
                </div>
                <div className="bar-label">{m.date.slice(5)}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="card">
        <h2>History ({sorted.length})</h2>
        {sorted.length === 0 ? <p className="muted">No entries yet.</p> : (
          <div className="table">
            <div className="row head"><div>Date</div><div>Weight</div><div>Body Fat</div><div>Notes</div><div></div></div>
            {[...sorted].reverse().map(m => (
              <div key={m.id} className="row">
                <div>{m.date}</div>
                <div>{m.weightKg} kg</div>
                <div>{m.bodyFatPct ?? '—'}%</div>
                <div>{m.notes}</div>
                <button className="danger small" onClick={() => remove(m.id)}>✕</button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
