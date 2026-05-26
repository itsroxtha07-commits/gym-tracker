export type DayOfWeek =
  | 'Monday'
  | 'Tuesday'
  | 'Wednesday'
  | 'Thursday'
  | 'Friday'
  | 'Saturday'
  | 'Sunday';

export const DAYS: DayOfWeek[] = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday'
];

export interface Exercise {
  id: string;
  name: string;
  muscleGroup: string;
  sets: number;
  reps: number;
  weight: number; // kg
  notes?: string;
}

export interface ScheduleDay {
  day: DayOfWeek;
  title: string; // e.g. "Push Day", "Rest"
  exerciseIds: string[];
}

export interface CompletedSet {
  reps: number;
  weight: number;
  done: boolean;
}

export interface WorkoutLog {
  id: string;
  date: string; // ISO yyyy-mm-dd
  day: DayOfWeek;
  title: string;
  entries: {
    exerciseId: string;
    exerciseName: string;
    sets: CompletedSet[];
  }[];
  durationMin?: number;
  notes?: string;
}

export interface BodyMetric {
  id: string;
  date: string;
  weightKg: number;
  bodyFatPct?: number;
  notes?: string;
}

export interface Goal {
  id: string;
  title: string;
  target: string;
  deadline?: string;
  done: boolean;
}

export interface AppState {
  exercises: Exercise[];
  schedule: ScheduleDay[];
  logs: WorkoutLog[];
  metrics: BodyMetric[];
  goals: Goal[];
}
