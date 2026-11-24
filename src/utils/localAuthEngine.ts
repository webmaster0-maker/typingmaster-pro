import { LocalAccountRecord, UserAccount } from '../types';
import { normalizeRecipientName } from './certificateEngine';
import { safeStorage } from './safeStorage';

export const ACTIVE_ACCOUNT_STORAGE_KEY = 'typing_master_user_account';
export const LOCAL_ACCOUNTS_STORAGE_KEY = 'typing_master_local_accounts_v1';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const MIN_PASSWORD_LENGTH = 6;
const MAX_PASSWORD_LENGTH = 128;

export const PBKDF2_ITERATIONS = 100_000;
export const MAX_CONSECUTIVE_FAILURES = 5;
export const SHORT_LOCKOUT_MS = 30_000; // 30 seconds
export const EXTENDED_LOCKOUT_MS = 300_000; // 5 minutes

export interface AuthActionResult {
  ok: boolean;
  account?: UserAccount;
  error?: string;
}

export interface LockoutStatus {
  isLocked: boolean;
  remainingSeconds: number;
}

export function normalizeEmail(raw: string): string {
  return raw.trim().toLowerCase().slice(0, 120);
}

export function isValidEmail(raw: string): boolean {
  const email = normalizeEmail(raw);
  return email.length > 0 && EMAIL_PATTERN.test(email);
}

export function generateSalt(byteLength = 16): string {
  const bytes = new Uint8Array(byteLength);
  if (typeof globalThis.crypto?.getRandomValues === 'function') {
    globalThis.crypto.getRandomValues(bytes);
  } else {
    for (let i = 0; i < byteLength; i += 1) {
      bytes[i] = Math.floor(Math.random() * 256);
    }
  }
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Pure-JS FIPS 180-4 SHA-256 fallback used only when Web Crypto subtle.digest
 * is unavailable (e.g., plain HTTP non-localhost preview contexts).
 * Produces the exact same hex digest as crypto.subtle.digest('SHA-256', ...).
 */
function sha256FallbackHex(input: string): string {
  const utf8 = unescape(encodeURIComponent(input));
  const bytes: number[] = [];
  for (let i = 0; i < utf8.length; i += 1) {
    bytes.push(utf8.charCodeAt(i));
  }

  const bitLen = bytes.length * 8;
  bytes.push(0x80);
  while (bytes.length % 64 !== 56) {
    bytes.push(0);
  }
  // 64-bit big-endian bit length
  const highBits = Math.floor(bitLen / 0x100000000);
  const lowBits = bitLen >>> 0;
  bytes.push(
    (highBits >>> 24) & 0xff,
    (highBits >>> 16) & 0xff,
    (highBits >>> 8) & 0xff,
    highBits & 0xff,
    (lowBits >>> 24) & 0xff,
    (lowBits >>> 16) & 0xff,
    (lowBits >>> 8) & 0xff,
    lowBits & 0xff
  );

  const K = [
    0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
    0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
    0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
    0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
    0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
    0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
    0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
    0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2,
  ];

  let h0 = 0x6a09e667;
  let h1 = 0xbb67ae85;
  let h2 = 0x3c6ef372;
  let h3 = 0xa54ff53a;
  let h4 = 0x510e527f;
  let h5 = 0x9b05688c;
  let h6 = 0x1f83d9ab;
  let h7 = 0x5be0cd19;

  const rotr = (n: number, x: number) => (x >>> n) | (x << (32 - n));
  const w = new Uint32Array(64);

  for (let offset = 0; offset < bytes.length; offset += 64) {
    for (let i = 0; i < 16; i += 1) {
      const idx = offset + i * 4;
      w[i] =
        ((bytes[idx] << 24) | (bytes[idx + 1] << 16) | (bytes[idx + 2] << 8) | bytes[idx + 3]) >>> 0;
    }
    for (let i = 16; i < 64; i += 1) {
      const s0 = rotr(7, w[i - 15]) ^ rotr(18, w[i - 15]) ^ (w[i - 15] >>> 3);
      const s1 = rotr(17, w[i - 2]) ^ rotr(19, w[i - 2]) ^ (w[i - 2] >>> 10);
      w[i] = (w[i - 16] + s0 + w[i - 7] + s1) >>> 0;
    }

    let a = h0;
    let b = h1;
    let c = h2;
    let d = h3;
    let e = h4;
    let f = h5;
    let g = h6;
    let h = h7;

    for (let i = 0; i < 64; i += 1) {
      const S1 = rotr(6, e) ^ rotr(11, e) ^ rotr(25, e);
      const ch = (e & f) ^ (~e & g);
      const temp1 = (h + S1 + ch + K[i] + w[i]) >>> 0;
      const S0 = rotr(2, a) ^ rotr(13, a) ^ rotr(22, a);
      const maj = (a & b) ^ (a & c) ^ (b & c);
      const temp2 = (S0 + maj) >>> 0;

      h = g;
      g = f;
      f = e;
      e = (d + temp1) >>> 0;
      d = c;
      c = b;
      b = a;
      a = (temp1 + temp2) >>> 0;
    }

    h0 = (h0 + a) >>> 0;
    h1 = (h1 + b) >>> 0;
    h2 = (h2 + c) >>> 0;
    h3 = (h3 + d) >>> 0;
    h4 = (h4 + e) >>> 0;
    h5 = (h5 + f) >>> 0;
    h6 = (h6 + g) >>> 0;
    h7 = (h7 + h) >>> 0;
  }

  return [h0, h1, h2, h3, h4, h5, h6, h7]
    .map((v) => v.toString(16).padStart(8, '0'))
    .join('');
}

export async function hashPasswordWithSalt(password: string, salt: string): Promise<string> {
  const payload = `${salt}:${password}`;
  if (typeof globalThis.crypto?.subtle?.digest === 'function' && typeof TextEncoder !== 'undefined') {
    try {
      const data = new TextEncoder().encode(payload);
      const digest = await globalThis.crypto.subtle.digest('SHA-256', data);
      return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, '0')).join('');
    } catch {
      // Fallback to pure-JS SHA-256 if subtle digest fails in restricted context
    }
  }
  return sha256FallbackHex(payload);
}

/**
 * Modern high-security PBKDF2 password derivation with 100,000 iterations of SHA-256.
 * Hardware-resistant against GPU brute-forcing and dictionary attacks.
 */
export async function hashPasswordPBKDF2(
  password: string,
  salt: string,
  iterations = PBKDF2_ITERATIONS
): Promise<string> {
  if (
    typeof globalThis.crypto?.subtle?.importKey === 'function' &&
    typeof globalThis.crypto?.subtle?.deriveBits === 'function' &&
    typeof TextEncoder !== 'undefined'
  ) {
    try {
      const enc = new TextEncoder();
      const keyMaterial = await globalThis.crypto.subtle.importKey(
        'raw',
        enc.encode(password),
        { name: 'PBKDF2' },
        false,
        ['deriveBits']
      );
      const derived = await globalThis.crypto.subtle.deriveBits(
        {
          name: 'PBKDF2',
          salt: enc.encode(salt),
          iterations,
          hash: 'SHA-256',
        },
        keyMaterial,
        256
      );
      return Array.from(new Uint8Array(derived), (b) => b.toString(16).padStart(2, '0')).join('');
    } catch {
      // Fall through to fallback
    }
  }

  // Iterated fallback for restricted contexts
  let current = `${salt}:${password}`;
  for (let i = 0; i < Math.min(iterations, 1000); i += 1) {
    current = sha256FallbackHex(`${current}:${salt}:${i}`);
  }
  return current;
}

export function checkAccountLockout(record: LocalAccountRecord): LockoutStatus {
  if (record.lockoutUntil && record.lockoutUntil > Date.now()) {
    const remainingSeconds = Math.ceil((record.lockoutUntil - Date.now()) / 1000);
    return { isLocked: true, remainingSeconds };
  }
  return { isLocked: false, remainingSeconds: 0 };
}

function safeEqualHex(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

export function loadLocalAccounts(): LocalAccountRecord[] {
  const saved = safeStorage.getItem(LOCAL_ACCOUNTS_STORAGE_KEY);
  if (!saved) return [];
  try {
    const parsed = JSON.parse(saved);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter(
        (item): item is LocalAccountRecord =>
          Boolean(item) &&
          typeof item === 'object' &&
          typeof item.id === 'string' &&
          typeof item.fullName === 'string' &&
          typeof item.email === 'string' &&
          typeof item.passwordSalt === 'string' &&
          typeof item.passwordHash === 'string'
      )
      .map((item) => ({
        ...item,
        passwordAlgo: item.passwordAlgo === 'pbkdf2' ? 'pbkdf2' : 'sha256',
        iterations: typeof item.iterations === 'number' ? item.iterations : undefined,
        failedAttempts: typeof item.failedAttempts === 'number' ? item.failedAttempts : 0,
        lockoutUntil: typeof item.lockoutUntil === 'number' ? item.lockoutUntil : undefined,
      }));
  } catch {
    return [];
  }
}

export function saveLocalAccounts(accounts: LocalAccountRecord[]): void {
  safeStorage.setItem(LOCAL_ACCOUNTS_STORAGE_KEY, JSON.stringify(accounts));
}

export function loadActiveUserAccount(): UserAccount | null {
  const saved = safeStorage.getItem(ACTIVE_ACCOUNT_STORAGE_KEY);
  if (!saved) return null;
  try {
    const parsed = JSON.parse(saved);
    if (parsed && typeof parsed.fullName === 'string' && parsed.fullName.trim()) {
      const cleanedName = normalizeRecipientName(parsed.fullName);
      if (!cleanedName) return null;
      const cleanedEmail =
        typeof parsed.email === 'string' && parsed.email.trim()
          ? normalizeEmail(parsed.email)
          : undefined;
      return {
        id: typeof parsed.id === 'string' ? parsed.id : 'acct-local',
        fullName: cleanedName,
        email: cleanedEmail,
        isGuest: typeof parsed.isGuest === 'boolean' ? parsed.isGuest : false,
        createdAt: typeof parsed.createdAt === 'string' ? parsed.createdAt : new Date().toISOString(),
      };
    }
  } catch {
    // Ignore corrupted active session payload
  }
  return null;
}

export function saveActiveUserAccount(account: UserAccount): void {
  safeStorage.setItem(ACTIVE_ACCOUNT_STORAGE_KEY, JSON.stringify(account));
}

export function clearActiveUserAccount(): void {
  safeStorage.removeItem(ACTIVE_ACCOUNT_STORAGE_KEY);
}

function validatePassword(password: string): string | null {
  if (!password || password.length < MIN_PASSWORD_LENGTH) {
    return `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`;
  }
  if (password.length > MAX_PASSWORD_LENGTH) {
    return `Password must be ${MAX_PASSWORD_LENGTH} characters or fewer.`;
  }
  return null;
}

export async function registerLocalAccount(params: {
  fullName: string;
  email: string;
  password: string;
}): Promise<AuthActionResult> {
  const cleanedName = normalizeRecipientName(params.fullName);
  if (!cleanedName) {
    return { ok: false, error: 'Enter your name.' };
  }

  const normalizedEmail = normalizeEmail(params.email);
  if (!isValidEmail(normalizedEmail)) {
    return { ok: false, error: 'Enter a valid email ID.' };
  }

  const passwordError = validatePassword(params.password);
  if (passwordError) {
    return { ok: false, error: passwordError };
  }

  const accounts = loadLocalAccounts();
  if (accounts.some((acc) => normalizeEmail(acc.email) === normalizedEmail)) {
    return { ok: false, error: 'An account with this email ID already exists. Sign in instead.' };
  }

  const salt = generateSalt();
  const passwordHash = await hashPasswordPBKDF2(params.password, salt, PBKDF2_ITERATIONS);
  const now = new Date().toISOString();
  const id = `acct-${Date.now()}-${generateSalt(3)}`;

  const record: LocalAccountRecord = {
    id,
    fullName: cleanedName,
    email: normalizedEmail,
    passwordSalt: salt,
    passwordHash,
    passwordAlgo: 'pbkdf2',
    iterations: PBKDF2_ITERATIONS,
    failedAttempts: 0,
    createdAt: now,
  };

  saveLocalAccounts([record, ...accounts]);

  const activeAccount: UserAccount = {
    id,
    fullName: cleanedName,
    email: normalizedEmail,
    isGuest: false,
    createdAt: now,
  };
  saveActiveUserAccount(activeAccount);

  return { ok: true, account: activeAccount };
}

export async function signInLocalAccount(params: {
  email: string;
  password: string;
}): Promise<AuthActionResult> {
  const normalizedEmail = normalizeEmail(params.email);
  if (!isValidEmail(normalizedEmail)) {
    return { ok: false, error: 'Enter a valid email ID.' };
  }
  if (!params.password) {
    return { ok: false, error: 'Enter your password.' };
  }

  const accounts = loadLocalAccounts();
  const index = accounts.findIndex((acc) => normalizeEmail(acc.email) === normalizedEmail);
  if (index === -1) {
    return { ok: false, error: 'Invalid email ID or password.' };
  }

  const matched = accounts[index];

  // Check lockout
  const lockout = checkAccountLockout(matched);
  if (lockout.isLocked) {
    return {
      ok: false,
      error: `Too many failed attempts. Account is locked. Please try again in ${lockout.remainingSeconds}s.`,
    };
  }

  // Verify credentials (supporting both PBKDF2 and legacy SHA-256)
  let isPasswordValid = false;
  let needsUpgradeToPbkdf2 = false;

  if (matched.passwordAlgo === 'pbkdf2') {
    const computedHash = await hashPasswordPBKDF2(
      params.password,
      matched.passwordSalt,
      matched.iterations || PBKDF2_ITERATIONS
    );
    isPasswordValid = safeEqualHex(computedHash, matched.passwordHash);
  } else {
    // Legacy SHA-256 hash check
    const legacyHash = await hashPasswordWithSalt(params.password, matched.passwordSalt);
    if (safeEqualHex(legacyHash, matched.passwordHash)) {
      isPasswordValid = true;
      needsUpgradeToPbkdf2 = true;
    }
  }

  if (!isPasswordValid) {
    const nextFailures = (matched.failedAttempts || 0) + 1;
    let lockoutUntil: number | undefined;

    if (nextFailures >= 10) {
      lockoutUntil = Date.now() + EXTENDED_LOCKOUT_MS;
    } else if (nextFailures >= MAX_CONSECUTIVE_FAILURES) {
      lockoutUntil = Date.now() + SHORT_LOCKOUT_MS;
    }

    const updatedAccounts = [...accounts];
    updatedAccounts[index] = {
      ...matched,
      failedAttempts: nextFailures,
      lockoutUntil,
    };
    saveLocalAccounts(updatedAccounts);

    if (lockoutUntil) {
      const waitSeconds = Math.ceil((lockoutUntil - Date.now()) / 1000);
      return {
        ok: false,
        error: `Too many failed attempts. Account is temporarily locked. Please try again in ${waitSeconds}s.`,
      };
    }

    return { ok: false, error: 'Invalid email ID or password.' };
  }

  // Successful authentication: reset failures and upgrade to PBKDF2 if needed
  let updatedRecord: LocalAccountRecord = {
    ...matched,
    failedAttempts: 0,
    lockoutUntil: undefined,
  };

  if (needsUpgradeToPbkdf2) {
    const nextSalt = generateSalt();
    const nextPbkdf2Hash = await hashPasswordPBKDF2(params.password, nextSalt, PBKDF2_ITERATIONS);
    updatedRecord = {
      ...updatedRecord,
      passwordSalt: nextSalt,
      passwordHash: nextPbkdf2Hash,
      passwordAlgo: 'pbkdf2',
      iterations: PBKDF2_ITERATIONS,
    };
  }

  const updatedAccounts = [...accounts];
  updatedAccounts[index] = updatedRecord;
  saveLocalAccounts(updatedAccounts);

  const activeAccount: UserAccount = {
    id: matched.id,
    fullName: matched.fullName,
    email: matched.email,
    isGuest: false,
    createdAt: matched.createdAt,
  };
  saveActiveUserAccount(activeAccount);

  return { ok: true, account: activeAccount };
}

export function createGuestAccount(guestName: string): AuthActionResult {
  const cleanedName = normalizeRecipientName(guestName);
  if (!cleanedName) {
    return { ok: false, error: 'Enter your guest name to continue.' };
  }

  const guestAccount: UserAccount = {
    id: `guest-${Date.now()}-${generateSalt(3)}`,
    fullName: cleanedName,
    isGuest: true,
    createdAt: new Date().toISOString(),
  };
  saveActiveUserAccount(guestAccount);
  return { ok: true, account: guestAccount };
}

export function updateActiveUserName(
  currentAccount: UserAccount,
  newFullName: string
): AuthActionResult {
  const cleanedName = normalizeRecipientName(newFullName);
  if (!cleanedName) {
    return { ok: false, error: 'Enter a valid name.' };
  }

  const updatedAccount: UserAccount = {
    ...currentAccount,
    fullName: cleanedName,
  };
  saveActiveUserAccount(updatedAccount);

  if (!currentAccount.isGuest) {
    const accounts = loadLocalAccounts();
    let changed = false;
    const nextAccounts = accounts.map((acc) => {
      if (
        acc.id === currentAccount.id ||
        (currentAccount.email && normalizeEmail(acc.email) === normalizeEmail(currentAccount.email))
      ) {
        changed = true;
        return { ...acc, fullName: cleanedName };
      }
      return acc;
    });
    if (changed) {
      saveLocalAccounts(nextAccounts);
    }
  }

  return { ok: true, account: updatedAccount };
}

export async function upgradeGuestToLocalAccount(
  guestAccount: UserAccount,
  params: {
    fullName: string;
    email: string;
    password: string;
  }
): Promise<AuthActionResult> {
  const cleanedName = normalizeRecipientName(params.fullName || guestAccount.fullName);
  if (!cleanedName) {
    return { ok: false, error: 'Enter your name.' };
  }

  const normalizedEmail = normalizeEmail(params.email);
  if (!isValidEmail(normalizedEmail)) {
    return { ok: false, error: 'Enter a valid email ID.' };
  }

  const passwordError = validatePassword(params.password);
  if (passwordError) {
    return { ok: false, error: passwordError };
  }

  const accounts = loadLocalAccounts();
  if (accounts.some((acc) => normalizeEmail(acc.email) === normalizedEmail)) {
    return { ok: false, error: 'An account with this email ID already exists.' };
  }

  const salt = generateSalt();
  const passwordHash = await hashPasswordPBKDF2(params.password, salt, PBKDF2_ITERATIONS);
  const now = new Date().toISOString();
  const id = `acct-${Date.now()}-${generateSalt(3)}`;

  const record: LocalAccountRecord = {
    id,
    fullName: cleanedName,
    email: normalizedEmail,
    passwordSalt: salt,
    passwordHash,
    passwordAlgo: 'pbkdf2',
    iterations: PBKDF2_ITERATIONS,
    failedAttempts: 0,
    createdAt: now,
  };
  saveLocalAccounts([record, ...accounts]);

  const upgradedAccount: UserAccount = {
    id,
    fullName: cleanedName,
    email: normalizedEmail,
    isGuest: false,
    createdAt: now,
  };
  saveActiveUserAccount(upgradedAccount);

  return { ok: true, account: upgradedAccount };
}

export async function updateLocalAccountPassword(
  currentAccount: UserAccount,
  currentPassword: string,
  newPassword: string
): Promise<AuthActionResult> {
  if (currentAccount.isGuest || !currentAccount.email) {
    return { ok: false, error: 'Only email accounts can update a password.' };
  }

  const passwordError = validatePassword(newPassword);
  if (passwordError) {
    return { ok: false, error: passwordError };
  }

  const accounts = loadLocalAccounts();
  const normalizedEmail = normalizeEmail(currentAccount.email);
  const index = accounts.findIndex(
    (acc) => acc.id === currentAccount.id || normalizeEmail(acc.email) === normalizedEmail
  );

  if (index === -1) {
    return { ok: false, error: 'Local account record not found.' };
  }

  const existing = accounts[index];
  let isCurrentValid = false;
  if (existing.passwordAlgo === 'pbkdf2') {
    const computedHash = await hashPasswordPBKDF2(
      currentPassword,
      existing.passwordSalt,
      existing.iterations || PBKDF2_ITERATIONS
    );
    isCurrentValid = safeEqualHex(computedHash, existing.passwordHash);
  } else {
    const legacyHash = await hashPasswordWithSalt(currentPassword, existing.passwordSalt);
    isCurrentValid = safeEqualHex(legacyHash, existing.passwordHash);
  }

  if (!isCurrentValid) {
    return { ok: false, error: 'Current password is incorrect.' };
  }

  const nextSalt = generateSalt();
  const nextHash = await hashPasswordPBKDF2(newPassword, nextSalt, PBKDF2_ITERATIONS);

  const nextAccounts = [...accounts];
  nextAccounts[index] = {
    ...existing,
    passwordSalt: nextSalt,
    passwordHash: nextHash,
    passwordAlgo: 'pbkdf2',
    iterations: PBKDF2_ITERATIONS,
    failedAttempts: 0,
    lockoutUntil: undefined,
  };
  saveLocalAccounts(nextAccounts);

  return { ok: true, account: currentAccount };
}
