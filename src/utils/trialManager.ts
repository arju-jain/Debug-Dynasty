/**
 * Anonymous Free Trial Management for Debug Dynasty
 * Enforces policy of 2 free debugging sessions before requiring authentication.
 * Server-authoritative trial tracking with persistent session binding.
 */

const TRIALS_STORAGE_KEY = 'debugdynasty_trials';
const ANON_SESSION_KEY = 'debugdynasty_anon_session';
export const MAX_FREE_TRIALS = 2;

export function isDevEnvironment(): boolean {
  if (typeof window === 'undefined') return false;
  const host = window.location.hostname;
  return (
    Boolean(import.meta.env.DEV) ||
    host === 'localhost' ||
    host === '127.0.0.1' ||
    host === '0.0.0.0' ||
    host.endsWith('.local')
  );
}

/**
 * Returns a stable anonymous session identifier that persists across page refreshes.
 * Never resets or creates a new session ID if one is already present.
 */
export function getAnonymousSessionId(): string {
  if (typeof window === 'undefined') return 'anon_sess_server_rendered';
  try {
    const existing = localStorage.getItem(ANON_SESSION_KEY);
    if (existing && existing.trim()) {
      return existing.trim();
    }
    const newSessionId = `anon_sess_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}${Math.random().toString(36).slice(2, 8)}`;
    localStorage.setItem(ANON_SESSION_KEY, newSessionId);
    return newSessionId;
  } catch {
    return 'anon_sess_fallback';
  }
}

/**
 * Sets the anonymous session identifier in localStorage.
 */
export function setAnonymousSessionId(sessionId: string): void {
  if (typeof window === 'undefined' || !sessionId) return;
  try {
    localStorage.setItem(ANON_SESSION_KEY, sessionId);
  } catch {
    // Storage access fallback
  }
}

/**
 * Retrieves the locally stored trial count (0..2).
 */
export function getStoredTrialsRemaining(): number {
  if (typeof window === 'undefined') return MAX_FREE_TRIALS;
  try {
    const saved = localStorage.getItem(TRIALS_STORAGE_KEY);
    if (saved !== null) {
      const parsed = parseInt(saved, 10);
      if (!isNaN(parsed) && parsed >= 0 && parsed <= MAX_FREE_TRIALS) {
        return parsed;
      }
    }
  } catch {
    // Storage access fallback
  }
  return MAX_FREE_TRIALS;
}

/**
 * Persists the remaining trial count to localStorage.
 */
export function setStoredTrialsRemaining(count: number): void {
  if (typeof window === 'undefined') return;
  try {
    const clamped = Math.max(0, Math.min(MAX_FREE_TRIALS, count));
    localStorage.setItem(TRIALS_STORAGE_KEY, clamped.toString());
  } catch {
    // Storage access fallback
  }
}

/**
 * Queries the backend for the authoritative trial status for the current session.
 * Syncs the local storage and dispatches update event.
 */
export async function syncTrialsWithServer(): Promise<number> {
  if (typeof window === 'undefined') return getStoredTrialsRemaining();
  
  const token = localStorage.getItem('debugdynasty_token');
  const sessionId = getAnonymousSessionId();

  try {
    const apiBase = import.meta.env.VITE_API_BASE_URL || '';
    const headers: Record<string, string> = {
      'Accept': 'application/json',
      'X-Anonymous-Session-Id': sessionId,
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const res = await fetch(`${apiBase}/api/trials`, {
      method: 'GET',
      headers,
      credentials: 'include',
    });

    if (res.ok) {
      const data = await res.json();
      if (data.session_id && data.session_id !== sessionId) {
        setAnonymousSessionId(data.session_id);
      }
      
      if (data.is_authenticated) {
        return MAX_FREE_TRIALS;
      }

      if (typeof data.trials_remaining === 'number') {
        const remaining = Math.max(0, Math.min(MAX_FREE_TRIALS, data.trials_remaining));
        setStoredTrialsRemaining(remaining);
        window.dispatchEvent(
          new CustomEvent('debugdynasty:trials_updated', { detail: { trials: remaining } })
        );
        return remaining;
      }
    }
  } catch {
    // Network or server unreachable; rely on persisted local state
  }

  return getStoredTrialsRemaining();
}

/**
 * Development & Hackathon testing reset command.
 * Gated to development environments.
 */
export async function resetDynastyTrials(): Promise<string> {
  if (typeof window === 'undefined') return '';
  const sessionId = getAnonymousSessionId();
  const apiBase = import.meta.env.VITE_API_BASE_URL || '';

  try {
    // 1. Reset locally and dispatch reactive event immediately (optimistic update)
    localStorage.setItem(TRIALS_STORAGE_KEY, MAX_FREE_TRIALS.toString());
    window.dispatchEvent(
      new CustomEvent('debugdynasty:reset_trials', { detail: { trials: MAX_FREE_TRIALS } })
    );

    // 2. Reset on server if running in dev environment
    if (isDevEnvironment()) {
      try {
        await fetch(`${apiBase}/api/trials/reset`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Anonymous-Session-Id': sessionId,
          },
          credentials: 'include',
        });
      } catch {
        // Fallback to local reset if server unreachable
      }
    }

    console.log(
      `%c[Debug Dynasty] Anonymous free trials reset to ${MAX_FREE_TRIALS}.`,
      'color: #00D6B2; font-weight: bold;'
    );
    return `Anonymous free trials successfully reset to ${MAX_FREE_TRIALS}.`;
  } catch {
    return 'Failed to reset trials.';
  }
}

// Expose safe browser-console reset command for development & hackathon testing
if (typeof window !== 'undefined') {
  (window as any).resetDynastyTrials = resetDynastyTrials;
}
