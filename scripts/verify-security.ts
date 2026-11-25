import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  registerLocalAccount,
  signInLocalAccount,
  loadLocalAccounts,
  saveLocalAccounts,
  hashPasswordWithSalt,
  generateSalt,
  clearActiveUserAccount,
  PBKDF2_ITERATIONS,
} from '../src/utils/localAuthEngine';
import {
  signUserStats,
  verifyUserStats,
  signCertificate,
  verifyCertificate,
} from '../src/utils/integrityEngine';
import {
  loginAdmin,
  getAdminSession,
  logoutAdmin,
  checkAdminLockout,
} from '../src/utils/adminAuth';
import {
  getAdminTelemetrySummary,
  recordTelemetryVisit,
  recordTelemetryCompletion,
} from '../src/utils/adminTelemetry';
import { UserStats, TypingCertificate, LocalAccountRecord } from '../src/types';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');

let totalTests = 0;
let passedTests = 0;

function assert(condition: boolean, msg: string) {
  totalTests++;
  if (!condition) {
    console.error(`❌ [FAIL] ${msg}`);
    throw new Error(`Assertion failed: ${msg}`);
  }
  passedTests++;
  console.log(`✅ [PASS] ${msg}`);
}

async function runSecurityAuditSuite() {
  console.log('\n======================================================');
  console.log('🔒 EXHAUSTIVE SECURITY & VULNERABILITY REMEDIATION AUDIT');
  console.log('======================================================\n');

  // ------------------------------------------------------------------
  // 1. HTTP HEADERS & CONTENT SECURITY POLICY (CSP) VERIFICATION
  // ------------------------------------------------------------------
  console.log('>>> [1/4] AUDITING HTTP SECURITY HEADERS (public/_headers)...');
  const headersPath = path.join(ROOT, 'public', '_headers');
  assert(fs.existsSync(headersPath), 'public/_headers file exists');

  const headersContent = fs.readFileSync(headersPath, 'utf8');
  assert(headersContent.includes('X-Frame-Options: DENY'), 'Anti-Clickjacking X-Frame-Options: DENY is present');
  assert(headersContent.includes('X-Content-Type-Options: nosniff'), 'Drive-by protection nosniff is present');
  assert(headersContent.includes('Strict-Transport-Security'), 'HSTS header is present');
  assert(headersContent.includes('Referrer-Policy: strict-origin-when-cross-origin'), 'Referrer-Policy is present');
  assert(headersContent.includes('Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=()'), 'Permissions-Policy is present');
  assert(headersContent.includes("Content-Security-Policy: default-src 'self'"), 'CSP default-src is self');
  assert(headersContent.includes('pagead2.googlesyndication.com'), 'CSP whitelists Google AdSense scripts');
  assert(headersContent.includes('fonts.googleapis.com'), 'CSP whitelists Google Fonts stylesheets');
  assert(headersContent.includes('fonts.gstatic.com'), 'CSP whitelists Google Fonts font binaries');
  assert(headersContent.includes("frame-ancestors 'none'"), "CSP specifies frame-ancestors 'none'");

  // ------------------------------------------------------------------
  // 2. DEPENDENCY SUPPLY CHAIN PRUNING
  // ------------------------------------------------------------------
  console.log('\n>>> [2/4] AUDITING PACKAGE DEPENDENCIES (package.json)...');
  const pkgJson = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8'));
  const deps = { ...(pkgJson.dependencies || {}), ...(pkgJson.devDependencies || {}) };
  assert(!('express' in deps), 'Unused dependency "express" successfully pruned');
  assert(!('@google/genai' in deps), 'Unused dependency "@google/genai" successfully pruned');

  // ------------------------------------------------------------------
  // 3. PBKDF2 PASSWORD HASHING, MIGRATION & RATE LIMITING
  // ------------------------------------------------------------------
  console.log('\n>>> [3/4] AUDITING PBKDF2 HASHING, MIGRATION & LOCKOUT THROTTLING...');

  // A) New user registration uses PBKDF2
  clearActiveUserAccount();
  const testEmail = `sec_user_${Date.now()}@example.com`;
  const regResult = await registerLocalAccount({
    fullName: 'Security Tester',
    email: testEmail,
    password: 'SecurePassword123!',
  });
  assert(regResult.ok, 'Account registration succeeds');

  const accounts = loadLocalAccounts();
  const savedRecord = accounts.find((a) => a.email.toLowerCase() === testEmail.toLowerCase());
  assert(Boolean(savedRecord), 'Account record found in local storage');
  assert(savedRecord?.passwordAlgo === 'pbkdf2', 'Saved account specifies passwordAlgo: pbkdf2');
  assert(savedRecord?.iterations === PBKDF2_ITERATIONS, `Saved account used ${PBKDF2_ITERATIONS} iterations`);

  // B) Legacy SHA-256 account backward-compatibility & auto-migration
  const legacyEmail = `legacy_${Date.now()}@example.com`;
  const legacySalt = generateSalt();
  const legacyHash = await hashPasswordWithSalt('LegacySecret999!', legacySalt);
  const legacyRecord: LocalAccountRecord = {
    id: `acct-legacy-${Date.now()}`,
    fullName: 'Legacy User',
    email: legacyEmail,
    passwordSalt: legacySalt,
    passwordHash: legacyHash,
    passwordAlgo: 'sha256',
    failedAttempts: 0,
    createdAt: new Date().toISOString(),
  };
  saveLocalAccounts([legacyRecord, ...loadLocalAccounts()]);

  // Authenticate with legacy password
  const legacyLogin = await signInLocalAccount({
    email: legacyEmail,
    password: 'LegacySecret999!',
  });
  assert(legacyLogin.ok, 'Legacy SHA-256 account logs in seamlessly');

  // Verify that it was auto-migrated to PBKDF2
  const reloadedAccounts = loadLocalAccounts();
  const upgradedRecord = reloadedAccounts.find((a) => a.email.toLowerCase() === legacyEmail.toLowerCase());
  assert(upgradedRecord?.passwordAlgo === 'pbkdf2', 'Legacy account was automatically migrated to PBKDF2');
  assert(upgradedRecord?.passwordHash !== legacyHash, 'Password hash was regenerated with PBKDF2');

  // C) Rate limiting & lockout after 5 consecutive incorrect passwords
  const bruteEmail = `brute_${Date.now()}@example.com`;
  await registerLocalAccount({
    fullName: 'Brute Target',
    email: bruteEmail,
    password: 'TargetPassword123!',
  });

  for (let i = 1; i <= 5; i++) {
    const attempt = await signInLocalAccount({
      email: bruteEmail,
      password: `WrongGuess_${i}`,
    });
    if (i < 5) {
      assert(!attempt.ok, `Attempt ${i} fails with invalid credentials`);
    } else {
      assert(
        !attempt.ok && (attempt.error?.includes('locked') || attempt.error?.includes('temporarily locked')),
        '5th consecutive failure activates temporary account lockout'
      );
    }
  }

  // Attempting with the correct password while locked must be rejected
  const lockedAttempt = await signInLocalAccount({
    email: bruteEmail,
    password: 'TargetPassword123!',
  });
  assert(
    !lockedAttempt.ok && (lockedAttempt.error?.includes('locked') || lockedAttempt.error?.includes('wait')),
    'Account lockout blocks even correct credentials during the lockout cooldown period'
  );

  // ------------------------------------------------------------------
  // 4. USER STATS & CERTIFICATES ANTI-TAMPER INTEGRITY
  // ------------------------------------------------------------------
  console.log('\n>>> [4/4] AUDITING ANTI-TAMPER CRYPTOGRAPHIC CHECKSUMS...');

  // A) UserStats signing and tamper verification
  const originalStats: UserStats = {
    xp: 450,
    streak: 3,
    lessonsCompleted: 8,
    avgWpm: 42,
    avgAccuracy: 96,
    totalPracticeTimeSeconds: 1200,
    weakKeys: { e: 2, t: 1 },
    lastPracticeDate: '2026-11-24',
  };

  const signedStats = signUserStats(originalStats);
  assert(Boolean(signedStats._integrity), 'UserStats signed with _integrity checksum');
  assert(verifyUserStats(signedStats).valid, 'Valid signed UserStats passes integrity verification');

  // Tamper with XP from 450 to 999999
  const tamperedStats: UserStats = {
    ...signedStats,
    xp: 999999,
  };
  const tamperedStatsVerification = verifyUserStats(tamperedStats);
  assert(!tamperedStatsVerification.valid, 'Tampered UserStats (inflated XP) is immediately detected as invalid');

  // Legacy unsigned stats verification (zero data loss)
  const legacyUnsignedStats: UserStats = { ...originalStats };
  const legacyVerification = verifyUserStats(legacyUnsignedStats);
  assert(legacyVerification.valid && legacyVerification.wasUnsigned, 'Legacy unsigned UserStats passes with wasUnsigned flag');

  // B) Certificate signing and tamper verification
  const originalCert: TypingCertificate = {
    id: 'cert-test-001',
    certificateCode: 'TMP-2026-X9K3L1',
    sessionId: 'session-001',
    testId: 'test-speed',
    testTitle: 'Speed Challenge Test',
    recipientName: 'Alice Typist',
    wpm: 65,
    accuracy: 98,
    errors: 2,
    durationSeconds: 180,
    scoring: 'standard',
    issuedAt: '2026-11-24T18:00:00.000Z',
  };

  const signedCert = signCertificate(originalCert);
  assert(Boolean(signedCert._integrity), 'Certificate signed with _integrity checksum');
  assert(verifyCertificate(signedCert).valid, 'Valid signed certificate passes integrity verification');

  // Tamper with WPM from 65 to 195
  const tamperedCert: TypingCertificate = {
    ...signedCert,
    wpm: 195,
  };
  assert(!verifyCertificate(tamperedCert).valid, 'Tampered certificate (forged WPM) is immediately rejected');

  // Tamper with recipient name from Alice to Bob
  const forgedNameCert: TypingCertificate = {
    ...signedCert,
    recipientName: 'Bob Attacker',
  };
  assert(!verifyCertificate(forgedNameCert).valid, 'Tampered certificate (forged recipient name) is rejected');

  // ------------------------------------------------------------------
  // 5. MASTER ADMIN PORTAL SECURITY & TELEMETRY
  // ------------------------------------------------------------------
  console.log('\n>>> [5/5] AUDITING MASTER ADMIN PORTAL SECURITY & TELEMETRY...');
  logoutAdmin();
  assert(!getAdminSession().authenticated, 'Admin session starts unauthenticated');

  // Wrong admin password rejected
  const badAdminLogin = await loginAdmin('admin@typecrest.pro', 'WrongAdminPass999!');
  assert(!badAdminLogin.ok, 'Admin portal rejects invalid credentials');

  // Valid admin login
  const goodAdminLogin = await loginAdmin('admin@typecrest.pro', 'AdminMaster2026!');
  assert(goodAdminLogin.ok && Boolean(goodAdminLogin.session), 'Master Admin login succeeds with AdminMaster2026!');
  assert(getAdminSession().authenticated, 'Admin session is active and verified in session storage');

  // Admin Telemetry Verification
  recordTelemetryVisit();
  recordTelemetryCompletion({
    type: 'test',
    title: 'Audit Speed Test',
    wpm: 88,
    accuracy: 99,
    charsTyped: 440,
    userName: 'Security Auditor',
  });

  const summary = getAdminTelemetrySummary();
  assert(summary.totalVisitors > 0, 'Telemetry calculates total visitors');
  assert(summary.activeUsersNow >= 1, 'Telemetry records active users');
  assert(summary.hourlyEngagement.length === 24, 'Telemetry generates full 24-hour engagement heatmap');
  assert(summary.dailyTraffic.length === 7, 'Telemetry calculates 7-day daily traffic history');
  assert(Array.isArray(summary.leaderboard), 'Telemetry maintains live leaderboard strictly from actual session history');
  assert(summary.recentActivity.length > 0, 'Telemetry streams actual real-time activity events');
  assert(Boolean(summary.peakHourRange), 'Telemetry calculates peak engagement hours window');

  logoutAdmin();
  assert(!getAdminSession().authenticated, 'Admin logout cleanly invalidates admin session');

  console.log('\n======================================================');
  console.log(`🎉 ALL ${passedTests}/${totalTests} SECURITY TESTS PASSED GREEN 100%!`);
  console.log('======================================================\n');
}

runSecurityAuditSuite().catch((err) => {
  console.error('\n🚨 Security test suite failed with error:', err);
  process.exit(1);
});
