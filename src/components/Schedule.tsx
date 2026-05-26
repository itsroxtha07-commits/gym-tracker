import { AppState, DAYS, DayOfWeek } from '../types';

interface Props {
  state: AppState;
  setState: (s: AppState) => void;
  onStart: (d: DayOfWeek) => void;
}

export default function Schedule({ state, setState, onStart }: Props) {
  const updateDay = (day: DayOfWeek, patch: Partial<{ title: string; exerciseIds: string[] }>) => {
    setState({
      ...state,
      schedule: state.schedule.map(s => (s.day === day ? { ...s, ...patch } : s))
    });
  };

  const toggleExercise = (day: DayOfWeek, exId: string) => {
    const sch = state.schedule.find(s => s.day === day)!;
    const ids = sch.exerciseIds.includes(exId)
      ? sch.exerciseIds.filter(i => i !== exId)
      : [...sch.exerciseIds, exId];
    updateDay(day, { exerciseIds: ids });
  };

  return (
    <div className="schedule-grid">
      {DAYS.map(day => {
        const sch = state.schedule.find(s => s.day === day)!;
        return (
          <div key={day} className="card day-card">
            <div className="day-head">
              <h3>{day}</h3>
              <button className="primary small" onClick={() => onStart(day)}>▶ Start</button>
            </div>
            <input
              className="day-title"
              value={sch.title}
              onChange={e => updateDay(day, { title: e.target.value })}
              placeholder="Day title (e.g. Push Day)"
            />
            <div className="exercise-picker">
              {state.exercises.map(ex => {
                const on = sch.exerciseIds.includes(ex.id);
                return (
                  <label key={ex.id} className={on ? 'chip on' : 'chip'}>
                    <input
                      type="checkbox"
                      checked={on}
                      onChange={() => toggleExercise(day, ex.id)}
                    />
                    {ex.name}
                  </label>
                );
              })}
            </div>
            <div className="muted small">{sch.exerciseIds.length} exercise(s)</div>
          </div>
        );
      })}
    </div>
  );
}
