// Auth utility: simple cookie-based auth for MVP
// In production, this would use Supabase Auth

import { Profile, HskLevel } from './types';

const AUTH_COOKIE = 'ccda_auth';
const PROFILE_KEY = 'ccda_profile';

export interface AuthUser {
  email: string;
  name: string;
  id: string;
}

// Client-side helpers
export function getClientAuth(): AuthUser | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = document.cookie
      .split('; ')
      .find(row => row.startsWith(AUTH_COOKIE))
      ?.split('=')[1];
    if (!raw) return null;
    return JSON.parse(decodeURIComponent(raw));
  } catch {
    return null;
  }
}

export function setClientAuth(user: AuthUser): void {
  document.cookie = `${AUTH_COOKIE}=${encodeURIComponent(JSON.stringify(user))};path=/;max-age=${60 * 60 * 24 * 30}`;
}

export function clearClientAuth(): void {
  document.cookie = `${AUTH_COOKIE}=;path=/;max-age=0`;
}

// Profile helpers
export function getClientProfile(): Profile | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(PROFILE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function setClientProfile(profile: Profile): void {
  localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
}

export function updateClientProfile(updates: Partial<Profile>): Profile | null {
  const profile = getClientProfile();
  if (!profile) return null;
  const updated = { ...profile, ...updates };
  setClientProfile(updated);
  return updated;
}

// Server-side helpers for API routes
export function parseAuthCookie(cookieHeader: string | null): AuthUser | null {
  if (!cookieHeader) return null;
  try {
    const raw = cookieHeader
      .split('; ')
      .find(row => row.startsWith(AUTH_COOKIE))
      ?.split('=')[1];
    if (!raw) return null;
    return JSON.parse(decodeURIComponent(raw));
  } catch {
    return null;
  }
}

// Default profile factory
export function createDefaultProfile(authUser: AuthUser): Profile {
  return {
    id: authUser.id,
    name: authUser.name,
    hskLevel: 1 as HskLevel,
    interests: [],
    totalRead: 0,
    streakDays: 0,
    lastReadDate: '',
    points: 0,
    createdAt: Date.now(),
  };
}
