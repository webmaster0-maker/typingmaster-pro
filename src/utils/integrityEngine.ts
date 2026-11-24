import { UserStats, TypingCertificate } from '../types';

/**
 * Anti-Tamper & Cryptographic Checksum Engine.
 * Protects client-side state (UserStats, Certificates) against unauthorized
 * manual modification in browser Developer Tools or localStorage.
 */

const INTEGRITY_SALT = 'tmp-pro-v1-anti-tamper-hmac-salt-98741';

/**
 * Pure-JS FIPS 180-4 SHA-256 implementation for synchronous checksum calculations.
 */
function sha256Hex(input: string): string {
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

function constantTimeCompare(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

// ============================================================================
// 1. USER STATS INTEGRITY
// ============================================================================

export function computeUserStatsChecksum(stats: Omit<UserStats, '_integrity'>): string {
  const canonical = [
    stats.xp ?? 0,
    stats.streak ?? 1,
    stats.lessonsCompleted ?? 0,
    stats.avgWpm ?? 0,
    stats.avgAccuracy ?? 0,
    stats.totalPracticeTimeSeconds ?? 0,
    stats.lastPracticeDate ?? '',
  ].join('|');
  return sha256Hex(`${INTEGRITY_SALT}:stats:${canonical}`);
}

export function signUserStats(stats: UserStats): UserStats {
  const { _integrity, ...clean } = stats;
  const checksum = computeUserStatsChecksum(clean);
  return {
    ...clean,
    _integrity: checksum,
  };
}

export function verifyUserStats(stats: UserStats): { valid: boolean; wasUnsigned: boolean } {
  if (!stats._integrity) {
    return { valid: true, wasUnsigned: true };
  }
  const { _integrity, ...clean } = stats;
  const expected = computeUserStatsChecksum(clean);
  const valid = constantTimeCompare(_integrity, expected);
  return { valid, wasUnsigned: false };
}

// ============================================================================
// 2. CERTIFICATE INTEGRITY
// ============================================================================

export function computeCertificateChecksum(cert: Omit<TypingCertificate, '_integrity'>): string {
  const canonical = [
    cert.id ?? '',
    cert.certificateCode ?? '',
    cert.sessionId ?? '',
    cert.testId ?? '',
    cert.testTitle ?? '',
    cert.recipientName ?? '',
    cert.wpm ?? 0,
    cert.accuracy ?? 0,
    cert.errors ?? 0,
    cert.durationSeconds ?? 0,
    cert.scoring ?? 'standard',
    cert.issuedAt ?? '',
  ].join('|');
  return sha256Hex(`${INTEGRITY_SALT}:cert:${canonical}`);
}

export function signCertificate(cert: TypingCertificate): TypingCertificate {
  const { _integrity, ...clean } = cert;
  const checksum = computeCertificateChecksum(clean);
  return {
    ...clean,
    _integrity: checksum,
  };
}

export function verifyCertificate(cert: TypingCertificate): { valid: boolean; wasUnsigned: boolean } {
  if (!cert._integrity) {
    return { valid: true, wasUnsigned: true };
  }
  const { _integrity, ...clean } = cert;
  const expected = computeCertificateChecksum(clean);
  const valid = constantTimeCompare(_integrity, expected);
  return { valid, wasUnsigned: false };
}
