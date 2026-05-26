import { AppState, DAYS } from './types';

const KEY = 'gym-tracker-state-v1';

export const uid = () =>
  Math.random().toString(36).slice(2, 10) + Date.now().toString(36);

export const defaultState = (): AppState => {
  const exercises = [
    { id: uid(), name: 'Bench Press', muscleGroup: 'Chest', sets: 4, reps: 8, weight: 60 },
    { id: uid(), name: 'Incline Dumbbell Press', muscleGroup: 'Chest', sets: 3, reps: 10, weight: 22 },
    { id: uid(), name: 'Pull Ups', muscleGroup: 'Back', sets: 4, reps: 8, weight: 0 },
    { id: uid(), name: 'Barbell Row', muscleGroup: 'Back', sets: 4, reps: 8, weight: 50 },
    { id: uid(), name: 'Squat', muscleGroup: 'Legs', sets: 4, reps: 8, weight: 80 },
    { id: uid(), name: 'Romanian Deadlift', muscleGroup: 'Legs', sets: 3, reps: 10, weight: 70 },
    { id: uid(), name: 'Overhead Press', muscleGroup: 'Shoulders', sets: 4, reps: 8, weight: 35 },
    { id: uid(), name: 'Lateral Raise', muscleGroup: 'Shoulders', sets: 3, reps: 15, weight: 8 },
    { id: uid(), name: 'Barbell Curl', muscleGroup: 'Arms', sets: 3, reps: 12, weight: 25 },
    { id: uid(), name: 'Tricep Pushdown', muscleGroup: 'Arms', sets: 3, reps: 12, weight: 25 },
    { id: uid(), name: 'Plank', muscleGroup: 'Core', sets: 3, reps: 60, weight: 0, notes: 'seconds' },
    { id: uid(), name: 'Run', muscleGroup: 'Cardio', sets: 1, reps: 30, weight: 0, notes: 'minutes' }
  ];
  const byName = (n: string) => exercises.find(e => e.name === n)!.id;

  return {
    exercises,
    schedule: [
      { day: 'Monday', title: 'Push Day', exerciseIds: [byName('Bench Press'), byName('Incline Dumbbell Press'), byName('Overhead Press'), byName('Tricep Pushdown')] },
      { day: 'Tuesday', title: 'Pull Day', exerciseIds: [byName('Pull Ups'), byName('Barbell Row'), byName('Barbell Curl')] },
      { day: 'Wednesday', title: 'Leg Day', exerciseIds: [byName('Squat'), byName('Romanian Deadlift'), byName('Plank')] },
      { day: 'Thursday', title: 'Cardio + Core', exerciseIds: [byName('Run'), byName('Plank')] },
      { day: 'Friday', title: 'Upper Body', exerciseIds: [byName('Bench Press'), byName('Barbell Row'), byName('Lateral Raise')] },
      { day: 'Saturday', title: 'Lower Body', exerciseIds: [byName('Squat'), byName('Romanian Deadlift')] },
      { day: 'Sunday', title: 'Rest', exerciseIds: [] }
    ],
    logs: [],
    metrics: [],
    goals: [
      { id: uid(), title: 'Bench press bodyweight', target: '80kg x 5', done: false },
      { id: uid(), title: 'Run 5km', target: 'Under 25 min', done: false }
    ]
  };
};

export const loadState = (): AppState => {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return defaultState();
    const parsed = JSON.parse(raw) as AppState;
    // ensure schedule covers all days
    const present = new Set(parsed.schedule.map(s => s.day));
    DAYS.forEach(d => {
      if (!present.has(d)) parsed.schedule.push({ day: d, title: 'Rest', exerciseIds: [] });
    });
    parsed.schedule.sort((a, b) => DAYS.indexOf(a.day) - DAYS.indexOf(b.day));
    return parsed;
  } catch {
    return defaultState();
  }
};

export const saveState = (s: AppState) => {
  localStorage.setItem(KEY, JSON.stringify(s));
};

export const resetState = () => localStorage.removeItem(KEY);
