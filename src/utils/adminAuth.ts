import { ADMIN_CONFIG } from '../config/adminConfig';
import { hashPasswordPBKDF2, hashPasswordWithSalt, PBKDF2_ITERATIONS } from './localAuthEngine';
import { safeStorage } from './safeStorage';

export interface AdminSession {
  token: string;
  adminEmail: string;
  loginTime: string;
  expiresAt: number;
}

export interface AdminAuthResult {
  ok: boolean;
  error?: string;
  session?: AdminSession;
}

function constantTimeCompare(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

/**
 * Extracts a secret gate token from ?gate=<token> or #gate=<token>.
 * Predictable paths like /admin or ?portal=admin are intentionally ignored.
 */
export function extractGateTokenFromLocation(): string | null {
  if (typeof window === 'undefined') return null;
  const searchParams = new URLSearchParams(window.location.search);
  const queryGate = searchParams.get('gate');
  if (queryGate && queryGate.trim()) {
    return queryGate.trim();
  }
  const hash = window.location.hash;
  if (hash.startsWith('#gate=')) {
    const val = decodeURIComponent(hash.slice('#gate='.length)).trim();
    return val || null;
  }
  return null;
}

/**
 * Verifies a secret gate token against the salted SHA-256 digest in ADMIN_CONFIG.
 */
export async function verifyAdminGateToken(token: string | null): Promise<boolean> {
  if (!token || !token.trim()) return false;
  const computed = await hashPasswordWithSalt(token.trim(), ADMIN_CONFIG.gateSalt);
  return constantTimeCompare(computed, ADMIN_CONFIG.gateHash);
}

function getLockoutState(): { attempts: number; lockoutUntil: number } {
  try {
    const raw = safeStorage.getItem(ADMIN_CONFIG.lockoutStorageKey);
    if (!raw) return { attempts: 0, lockoutUntil: 0 };
    const parsed = JSON.parse(raw);
    return {
      attempts: Number(parsed?.attempts) || 0,
      lockoutUntil: Number(parsed?.lockoutUntil) || 0,
    };
  } catch {
    return { attempts: 0, lockoutUntil: 0 };
  }
}

function setLockoutState(attempts: number, lockoutUntil: number): void {
  safeStorage.setItem(
    ADMIN_CONFIG.lockoutStorageKey,
    JSON.stringify({ attempts, lockoutUntil })
  );
}

export function checkAdminLockout(): { isLocked: boolean; remainingSeconds: number } {
  const { lockoutUntil } = getLockoutState();
  const now = Date.now();
  if (lockoutUntil > now) {
    const remainingSeconds = Math.ceil((lockoutUntil - now) / 1000);
    return { isLocked: true, remainingSeconds };
  }
  return { isLocked: false, remainingSeconds: 0 };
}

export async function loginAdmin(email: string, password: string): Promise<AdminAuthResult> {
  const lockout = checkAdminLockout();
  if (lockout.isLocked) {
    return {
      ok: false,
      error: `Too many failed attempts. Admin portal is locked for ${lockout.remainingSeconds}s.`,
    };
  }

  const normalizedEmail = email.trim().toLowerCase();
  const computedEmailHash = await hashPasswordWithSalt(normalizedEmail, ADMIN_CONFIG.emailSalt);
  const isEmailValid = ADMIN_CONFIG.allowedEmailHashes.some((h) =>
    constantTimeCompare(computedEmailHash, h)
  );

  const computedPassHash = await hashPasswordPBKDF2(
    password,
    ADMIN_CONFIG.masterPasswordSalt,
    PBKDF2_ITERATIONS
  );
  const isPassValid = constantTimeCompare(
    computedPassHash,
    ADMIN_CONFIG.masterPasswordPbkdf2Hash
  );

  if (!isEmailValid || !isPassValid) {
    const state = getLockoutState();
    const nextAttempts = state.attempts + 1;
    let nextLockoutUntil = 0;

    if (nextAttempts >= ADMIN_CONFIG.maxFailedAttempts) {
      nextLockoutUntil = Date.now() + ADMIN_CONFIG.lockoutDurationSeconds * 1000;
    }

    setLockoutState(nextAttempts, nextLockoutUntil);

    if (nextLockoutUntil > 0) {
      return {
        ok: false,
        error: `Invalid credentials. Lockout activated for ${ADMIN_CONFIG.lockoutDurationSeconds}s.`,
      };
    }

    const remaining = ADMIN_CONFIG.maxFailedAttempts - nextAttempts;
    return {
      ok: false,
      error: `Invalid email or password. (${remaining} attempt${remaining === 1 ? '' : 's'} remaining before lockout)`,
    };
  }

  // Clear lockout state on success
  setLockoutState(0, 0);

  const now = Date.now();
  const session: AdminSession = {
    token: `adm_${now}_${Math.random().toString(36).substring(2, 10)}`,
    adminEmail: normalizedEmail,
    loginTime: new Date(now).toISOString(),
    expiresAt: now + ADMIN_CONFIG.sessionDurationMinutes * 60 * 1000,
  };

  try {
    if (typeof window !== 'undefined' && 'sessionStorage' in window) {
      window.sessionStorage.setItem(ADMIN_CONFIG.sessionStorageKey, JSON.stringify(session));
    } else {
      safeStorage.setItem(ADMIN_CONFIG.sessionStorageKey, JSON.stringify(session));
    }
  } catch {
    safeStorage.setItem(ADMIN_CONFIG.sessionStorageKey, JSON.stringify(session));
  }

  return { ok: true, session };
}

export function getAdminSession(): { authenticated: boolean; session?: AdminSession } {
  try {
    let raw: string | null = null;
    if (typeof window !== 'undefined' && 'sessionStorage' in window) {
      raw = window.sessionStorage.getItem(ADMIN_CONFIG.sessionStorageKey);
    }
    if (!raw) {
      raw = safeStorage.getItem(ADMIN_CONFIG.sessionStorageKey);
    }
    if (!raw) return { authenticated: false };

    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed.expiresAt !== 'number') {
      return { authenticated: false };
    }

    if (Date.now() > parsed.expiresAt) {
      logoutAdmin();
      return { authenticated: false };
    }

    return { authenticated: true, session: parsed as AdminSession };
  } catch {
    return { authenticated: false };
  }
}

export function logoutAdmin(): void {
  try {
    if (typeof window !== 'undefined' && 'sessionStorage' in window) {
      window.sessionStorage.removeItem(ADMIN_CONFIG.sessionStorageKey);
    }
  } catch {
    // Ignore
  }
  safeStorage.removeItem(ADMIN_CONFIG.sessionStorageKey);
}
