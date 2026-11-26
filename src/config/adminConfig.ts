/**
 * TypeCrest - Master Admin Configuration
 * All sensitive gate keys, admin emails, and master passwords are stored exclusively
 * as salted cryptographic digests (zero plaintext credentials or paths in client bundles).
 */

export const ADMIN_CONFIG = {
  // Hashed Secret URL Gate Token (?gate=<token> or #gate=<token>)
  gateSalt: 'gate-salt-7d2a9c4e',
  gateHash: 'f62227069559957427510f57916f60737c14cd970816997b79bd3416ffb42991',

  // Salted SHA-256 hashes of authorized administrator emails
  emailSalt: 'email-salt-3b8f1a6d',
  allowedEmailHashes: [
    '12079dac251023caf3867d930b674963062aeb6bf1727126d72be88e977a193d',
    'd6a7adb14229a7e1ee1645f737941a1e2ed60675e20b04cab5d7df2438c787f3',
  ],

  // Master Admin PBKDF2 Password Hash (100,000 iterations SHA-256)
  masterPasswordSalt: '4f8d9b1a7c3e52f08a6b4c2e1d0f3a5b',
  masterPasswordPbkdf2Hash: '45edb3bb8ed2a686fbc04bc5f32f6fe07a8747ffc6c077092ded6cdd6651ea55',

  // Admin security policies
  maxFailedAttempts: 5,
  lockoutDurationSeconds: 60,
  sessionDurationMinutes: 120, // 2 hours

  // Storage keys (session uses sessionStorage so credentials clear on tab close)
  sessionStorageKey: 'typing_master_admin_session_v1',
  lockoutStorageKey: 'typing_master_admin_lockout_v1',
  telemetryStorageKey: 'typing_master_telemetry_store_v1',
};
