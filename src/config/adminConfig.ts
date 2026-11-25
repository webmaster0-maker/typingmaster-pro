/**
 * TypeCrest - Master Admin Configuration
 * Stores admin credentials, security settings, and direct URL entry routes.
 */

export const ADMIN_CONFIG = {
  // Master Admin Account
  defaultAdminEmail: 'admin@typecrest.pro',
  legacyAdminEmails: ['admin@typingmaster.pro'],

  // Master Admin PBKDF2 Password Credentials (default: AdminMaster2026!)
  // Salt and PBKDF2 (100,000 iterations SHA-256) hash for "AdminMaster2026!"
  masterPasswordSalt: '4f8d9b1a7c3e52f08a6b4c2e1d0f3a5b',
  masterPasswordPbkdf2Hash: '45edb3bb8ed2a686fbc04bc5f32f6fe07a8747ffc6c077092ded6cdd6651ea55',

  // Direct URL access routes (no visible button on public website)
  directRoutes: ['#admin', '#/admin', '?portal=admin', '?admin=true'],

  // Admin security policies
  maxFailedAttempts: 5,
  lockoutDurationSeconds: 60,
  sessionDurationMinutes: 120, // 2 hours

  // Storage keys (uses sessionStorage so credentials clear on tab close)
  sessionStorageKey: 'typing_master_admin_session_v1',
  lockoutStorageKey: 'typing_master_admin_lockout_v1',
  telemetryStorageKey: 'typing_master_telemetry_store_v1',
};
