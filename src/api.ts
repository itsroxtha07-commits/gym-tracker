import { AppState } from './types';

const API_BASE = import.meta.env.VITE_API_BASE || '/api';
const TOKEN_KEY = 'gym-tracker-token';

export const getToken = () => localStorage.getItem(TOKEN_KEY);
export const setToken = (t: string | null) => {
  if (t) localStorage.setItem(TOKEN_KEY, t);
  else localStorage.removeItem(TOKEN_KEY);
};

export interface User {
  id: number;
  email: string;
  name: string | null;
  is_admin?: boolean;
}

export interface AdminUserRow extends User {
  created_at: string;
  last_active: string | null;
  workouts: number;
  exercises: number;
  goals: number;
  metrics: number;
  has_data: boolean;
}

export interface AdminStats {
  totalUsers: number;
  totalAdmins: number;
  totalWorkouts: number;
  totalSets: number;
  totalVolumeKg: number;
  activeUsers: number;
}

async function request<T>(path: string, opts: RequestInit = {}): Promise<T> {
  const token = getToken();
  const res = await fetch(`${API_BASE}${path}`, {
    ...opts,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(opts.headers || {})
    }
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || `HTTP ${res.status}`);
  }
  return res.json();
}

export const api = {
  register: (email: string, password: string, name?: string) =>
    request<{ token: string; user: User }>('/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, name })
    }),
  login: (email: string, password: string) =>
    request<{ token: string; user: User }>('/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    }),
  me: () => request<{ user: User }>('/me'),
  getState: () =>
    request<{ data: AppState | null; updated_at: string | null }>('/state'),
  putState: (data: AppState) =>
    request<{ ok: true; updated_at: string }>('/state', {
      method: 'PUT',
      body: JSON.stringify({ data })
    }),
  changePassword: (currentPassword: string, newPassword: string) =>
    request<{ ok: true }>('/change-password', {
      method: 'POST',
      body: JSON.stringify({ currentPassword, newPassword })
    }),
  deleteAccount: () =>
    request<{ ok: true }>('/account', { method: 'DELETE' }),

  // Admin
  adminStats: () => request<AdminStats>('/admin/stats'),
  adminUsers: () => request<{ users: AdminUserRow[]; total: number }>('/admin/users'),
  adminGetUser: (id: number) =>
    request<{ user: User; created_at: string; state: { data: AppState; updated_at: string } | null }>(`/admin/users/${id}`),
  adminDeleteUser: (id: number) =>
    request<{ ok: true }>(`/admin/users/${id}`, { method: 'DELETE' }),
  adminToggleAdmin: (id: number) =>
    request<{ ok: true; user: User }>(`/admin/users/${id}/toggle-admin`, { method: 'POST' }),
  adminResetPassword: (id: number) =>
    request<{ ok: true; tempPassword: string; email: string }>(`/admin/users/${id}/reset-password`, { method: 'POST' })
};
