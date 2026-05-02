// Auth utility: real Supabase Auth integration
// Uses Supabase session with synchronous helpers for backward compatibility

import { Profile, HskLevel } from './types';
import { createClient } from './supabase';
import type { User } from '@supabase/supabase-js';

const PROFILE_KEY = 'ccda_profile';

export interface AuthUser {
  email: string;
  name: string;
  id: string;
}

// Module-level cached auth state (populated by listenToAuthChanges)
let cachedUser: AuthUser | null = null;
let authInitialized = false;

// Queue of callbacks waiting for auth to be ready
const authReadyCallbacks: Array<(user: AuthUser | null) => void> = [];

function notifyAuthReady(user: AuthUser | null): void {
  cachedUser = user;
  authInitialized = true;
  for (const cb of authReadyCallbacks) {
    cb(user);
  }
  authReadyCallbacks.length = 0;
}

/**
 * Initialize auth state listener. Call once at app startup.
 * Stores session info in module-level cache for sync access.
 */
export function listenToAuthChanges(): () => void {
  const supabase = createClient();

  // Check existing session
  supabase.auth.getSession().then(({ data: { session } }) => {
    if (session?.user) {
      notifyAuthReady(mapSupabaseUser(session.user));
    } else {
      notifyAuthReady(null);
    }
  });

  // Listen for future changes
  const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
    if (session?.user) {
      notifyAuthReady(mapSupabaseUser(session.user));
    } else {
      notifyAuthReady(null);
    }
  });

  return () => {
    subscription.unsubscribe();
  };
}

function mapSupabaseUser(user: User): AuthUser {
  return {
    id: user.id,
    email: user.email || '',
    name: user.user_metadata?.name || user.email?.split('@')[0] || '用户',
  };
}

/**
 * Wait for auth to be initialized (for use in useEffect before sync calls).
 * Resolves immediately if already initialized.
 */
export function waitForAuth(): Promise<AuthUser | null> {
  if (authInitialized) {
    return Promise.resolve(cachedUser);
  }
  return new Promise((resolve) => {
    authReadyCallbacks.push(resolve);
  });
}

// Synchronous helpers (reads from module-level cache)
export function getClientAuth(): AuthUser | null {
  if (typeof window === 'undefined') return null;
  return cachedUser;
}

export function setClientAuth(user: AuthUser): void {
  cachedUser = user;
  authInitialized = true;
}

export function clearClientAuth(): void {
  cachedUser = null;
}

// Profile helpers (kept as localStorage for now - profile sync via Supabase DB is future work)
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
  // For middleware/API routes, use Supabase server client
  // This is handled by the middleware directly
  return null;
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
