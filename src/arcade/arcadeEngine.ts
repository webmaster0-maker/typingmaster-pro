import {
  ArcadeModeConfig,
  ArcadeModeId,
  ArcadePersonalRecord,
  ArcadeProfile,
  ArcadeSession,
  ArcadeTextPassage,
  CosmeticItem,
  KeystrokeEvent,
  LeaderboardEntry,
  LeaderboardPeriod,
  ReplayVerificationResult,
} from './arcadeTypes';

export const SCORING_VERSION = 1;
export const XP_FORMULA_VERSION = 1;

/**
 * Pluggable 5-Mode Arcade Registry (Phase 3 abstraction).
 * Adding a 6th mode requires only adding an entry here — zero core engine edits.
 */
export const ARCADE_MODES: Record<ArcadeModeId, ArcadeModeConfig> = {
  classic: {
    id: 'classic',
    name: 'Classic',
    shortLabel: 'Classic',
    tagline: '2D cyber-dojo fighting against progressive AI opponents',
    description:
      'Control a 2D arcade fighter through accurate typing. Clear words above your opponent to land punches, kicks, and combos across 6+ progressive AI levels.',
    durationSeconds: null,
    supportsDifficulty: false,
    allowStrictOption: false,
    defaultStrict: false,
    errorBudget: null,
    targetBpm: null,
    targetWpm: null,
    targetAccuracy: 95,
    xpMultiplier: 1.0,
    accent: 'amber',
  },
  speed_rush: {
    id: 'speed_rush',
    name: 'Speed Rush',
    shortLabel: 'Speed Rush',
    tagline: '60-second high-velocity burst & streak combo',
    description:
      'Race a 60-second sprint clock. Chain flawless keystrokes to climb streak tiers while pushing maximum sustainable Net WPM.',
    durationSeconds: 60,
    supportsDifficulty: true,
    allowStrictOption: false,
    defaultStrict: false,
    errorBudget: null,
    targetBpm: null,
    targetWpm: 65,
    targetAccuracy: 94,
    xpMultiplier: 1.15,
    accent: 'amber',
  },
  accuracy_master: {
    id: 'accuracy_master',
    name: 'Accuracy Master',
    shortLabel: 'Accuracy Master',
    tagline: 'Precision shield with strict stop-on-error option',
    description:
      'Protect a 5-error integrity shield while holding 98%+ keystroke accuracy. Toggle Strict Lock to require correcting every single mistype.',
    durationSeconds: null,
    supportsDifficulty: true,
    allowStrictOption: true,
    defaultStrict: false,
    errorBudget: 5,
    targetBpm: null,
    targetWpm: null,
    targetAccuracy: 98,
    xpMultiplier: 1.2,
    accent: 'emerald',
  },
  rhythm: {
    id: 'rhythm',
    name: 'Rhythm Mode',
    shortLabel: 'Rhythm',
    tagline: 'Even keystroke cadence & tempo consistency',
    description:
      'Eliminate stop-and-start bursts. Track your live inter-keystroke cadence stability against a smooth rhythmic beat alongside Net WPM.',
    durationSeconds: null,
    supportsDifficulty: false,
    allowStrictOption: false,
    defaultStrict: false,
    errorBudget: null,
    targetBpm: 300,
    targetWpm: 60,
    targetAccuracy: 96,
    xpMultiplier: 1.15,
    accent: 'emerald',
  },
  challenge: {
    id: 'challenge',
    name: 'Challenge Mode',
    shortLabel: 'Challenge',
    tagline: 'High-difficulty punctuation & benchmark gauntlet',
    description:
      'Tackle Master-tier passages loaded with numerals, punctuation, and technical terms against a 55 WPM / 96% accuracy arcade benchmark.',
    durationSeconds: 90,
    supportsDifficulty: false,
    allowStrictOption: true,
    defaultStrict: false,
    errorBudget: null,
    targetBpm: null,
    targetWpm: 55,
    targetAccuracy: 96,
    xpMultiplier: 1.35,
    accent: 'amber',
  },
};

export const ARCADE_MODE_LIST: ArcadeModeConfig[] = [
  ARCADE_MODES.classic,
  ARCADE_MODES.speed_rush,
  ARCADE_MODES.accuracy_master,
  ARCADE_MODES.rhythm,
  ARCADE_MODES.challenge,
];

/**
 * Cosmetics Catalog (P1–P2: XP unlocks cosmetics ONLY — all 5 game modes are 100% free).
 */
export const COSMETIC_CATALOG: CosmeticItem[] = [
  // Caret Styles
  {
    id: 'caret_amber_beam',
    category: 'caret',
    name: 'Amber Telemetry Beam',
    description: 'Razor-sharp 2px amber cursor engineered for instant visual tracking.',
    xpRequired: 0,
    previewPrimary: '#F59E0B',
    previewSecondary: '#181F2E',
  },
  {
    id: 'caret_emerald_block',
    category: 'caret',
    name: 'Emerald Highlight Block',
    description: 'Translucent emerald character block highlighting the active glyph.',
    xpRequired: 250,
    previewPrimary: '#10B981',
    previewSecondary: '#064E3B',
  },
  {
    id: 'caret_underline',
    category: 'caret',
    name: 'Precision Gold Underline',
    description: 'Clean bottom-edge underline keeping full character legibility unobstructed.',
    xpRequired: 600,
    previewPrimary: '#FBBF24',
    previewSecondary: '#111622',
  },
  {
    id: 'caret_pulse_bar',
    category: 'caret',
    name: 'Dual-Edge Focus Rail',
    description: 'High-contrast vertical guide with emerald apex indicator.',
    xpRequired: 1200,
    previewPrimary: '#34D399',
    previewSecondary: '#F59E0B',
  },

  // Arena Surface Themes
  {
    id: 'theme_obsidian',
    category: 'theme',
    name: 'Obsidian Arcade',
    description: 'Signature deep obsidian surface with crisp amber and emerald accents.',
    xpRequired: 0,
    previewPrimary: '#090C12',
    previewSecondary: '#F59E0B',
  },
  {
    id: 'theme_carbon_amber',
    category: 'theme',
    name: 'Carbon Amber Deck',
    description: 'Warm charcoal chassis tuned for high-contrast amber readability.',
    xpRequired: 350,
    previewPrimary: '#12110E',
    previewSecondary: '#F59E0B',
  },
  {
    id: 'theme_emerald_vault',
    category: 'theme',
    name: 'Emerald Vault',
    description: 'Deep pine-obsidian typing deck inspired by precision instruments.',
    xpRequired: 850,
    previewPrimary: '#08120F',
    previewSecondary: '#10B981',
  },
  {
    id: 'theme_midnight_slate',
    category: 'theme',
    name: 'Midnight Graphite',
    description: 'Ultra-neutral graphite deck minimizing glare during marathon runs.',
    xpRequired: 1500,
    previewPrimary: '#0B101B',
    previewSecondary: '#94A3B8',
  },

  // Sound Packs
  {
    id: 'sound_tactile',
    category: 'sound',
    name: 'Tactile Switch',
    description: 'Crisp mid-frequency mechanical click with low-end error thud.',
    xpRequired: 0,
    previewPrimary: '#F59E0B',
    previewSecondary: '#334155',
  },
  {
    id: 'sound_thock',
    category: 'sound',
    name: 'Deep Thock',
    description: 'Warm damped keycap resonance for relaxed, rhythmic speed runs.',
    xpRequired: 300,
    previewPrimary: '#10B981',
    previewSecondary: '#1E293B',
  },
  {
    id: 'sound_crystal',
    category: 'sound',
    name: 'Crystal Pulse',
    description: 'Light high-clarity sine ticks crafted for Rhythm Mode cadence.',
    xpRequired: 900,
    previewPrimary: '#38BDF8',
    previewSecondary: '#1E293B',
  },
  {
    id: 'sound_muted',
    category: 'sound',
    name: 'Silent Focus',
    description: 'Zero audio synthesis for distraction-free competitive sessions.',
    xpRequired: 0,
    previewPrimary: '#64748B',
    previewSecondary: '#0F172A',
  },

  // Player Titles
  {
    id: 'title_challenger',
    category: 'title',
    name: 'Arcade Challenger',
    description: 'Default competitive title displayed on verified leaderboard rows.',
    xpRequired: 0,
    previewPrimary: '#94A3B8',
    previewSecondary: '#1E293B',
  },
  {
    id: 'title_velocity',
    category: 'title',
    name: 'Velocity Runner',
    description: 'Unlocked once you build momentum across Arcade runs.',
    xpRequired: 500,
    previewPrimary: '#F59E0B',
    previewSecondary: '#451A03',
  },
  {
    id: 'title_metronome',
    category: 'title',
    name: 'Cadence Master',
    description: 'Badge of honor for disciplined rhythm and precision.',
    xpRequired: 1100,
    previewPrimary: '#10B981',
    previewSecondary: '#064E3B',
  },
  {
    id: 'title_grandmaster',
    category: 'title',
    name: 'Arcade Grandmaster',
    description: 'Prestigious title reserved for veteran Typing Arcade competitors.',
    xpRequired: 2200,
    previewPrimary: '#FBBF24',
    previewSecondary: '#0F172A',
  },
];

export function getTitleLabel(titleId: string): string {
  return COSMETIC_CATALOG.find((item) => item.id === titleId)?.name || 'Arcade Challenger';
}

export function createDefaultArcadeProfile(handle: string = 'Guest Typist'): ArcadeProfile {
  return {
    handle: handle.trim() || 'Guest Typist',
    xp: 0,
    level: 1,
    xpFormulaVersion: XP_FORMULA_VERSION,
    dailyStreak: 0,
    unlockedItemIds: [
      'caret_amber_beam',
      'theme_obsidian',
      'sound_tactile',
      'sound_muted',
      'title_challenger',
    ],
    equipped: {
      caretStyle: 'caret_amber_beam',
      arenaTheme: 'theme_obsidian',
      soundPack: 'sound_tactile',
      playerTitle: 'title_challenger',
    },
    createdAt: new Date().toISOString(),
  };
}

/**
 * E1 (Locked): Net WPM = (correct_chars / 5) / elapsed_minutes
 */
export function computeNetWpm(correctChars: number, elapsedMs: number): number {
  if (correctChars <= 0 || elapsedMs <= 0) return 0;
  const elapsedMinutes = Math.max(elapsedMs / 60000, 1 / 600); // floor 100ms to prevent Infinity
  return Number(((correctChars / 5) / elapsedMinutes).toFixed(1));
}

export function computeRawWpm(totalNonBackspaceKeys: number, elapsedMs: number): number {
  if (totalNonBackspaceKeys <= 0 || elapsedMs <= 0) return 0;
  const elapsedMinutes = Math.max(elapsedMs / 60000, 1 / 600);
  return Number(((totalNonBackspaceKeys / 5) / elapsedMinutes).toFixed(1));
}

/**
 * E2 & E4 (Locked): Accuracy = correct_keystrokes / total_keystrokes (keystroke-level; Backspace does not erase errors)
 */
export function computeKeystrokeAccuracy(
  correctKeystrokes: number,
  totalKeystrokes: number
): number {
  if (totalKeystrokes <= 0) return 100;
  const pct = (correctKeystrokes / totalKeystrokes) * 100;
  return Number(Math.max(0, Math.min(100, pct)).toFixed(1));
}

/**
 * Rhythm cadence score (0-100) from coefficient of variation of inter-keystroke intervals
 */
export function computeRhythmScore(keystrokeLog: KeystrokeEvent[]): number {
  const typingEvents = keystrokeLog.filter((k) => !k.isBackspace);
  if (typingEvents.length < 4) return 100;

  const intervals: number[] = [];
  for (let i = 1; i < typingEvents.length; i++) {
    const dt = typingEvents[i].t - typingEvents[i - 1].t;
    if (dt > 0 && dt < 2500) {
      intervals.push(dt);
    }
  }
  if (intervals.length < 3) return 100;

  const mean = intervals.reduce((a, b) => a + b, 0) / intervals.length;
  if (mean <= 0) return 100;

  const variance = intervals.reduce((sum, x) => sum + (x - mean) ** 2, 0) / intervals.length;
  const stdDev = Math.sqrt(variance);
  const cv = stdDev / mean; // lower is steadier rhythm

  const score = Math.round(Math.max(25, Math.min(100, 100 - cv * 78)));
  return score;
}

export function computeP95Latency(keystrokeLog: KeystrokeEvent[]): number {
  const latencies = keystrokeLog
    .map((k) => k.renderLatencyMs)
    .filter((v): v is number => typeof v === 'number' && Number.isFinite(v) && v >= 0)
    .sort((a, b) => a - b);

  if (latencies.length === 0) return 0;
  const idx = Math.min(latencies.length - 1, Math.floor(latencies.length * 0.95));
  return Number(latencies[idx].toFixed(1));
}

export function getLevelFromXp(xp: number): {
  level: number;
  currentLevelXp: number;
  nextLevelXp: number;
  progressPct: number;
} {
  const safeXp = Math.max(0, Math.floor(xp));
  const xpPerLevel = 300;
  const level = Math.floor(safeXp / xpPerLevel) + 1;
  const currentLevelXp = safeXp % xpPerLevel;
  return {
    level,
    currentLevelXp,
    nextLevelXp: xpPerLevel,
    progressPct: Math.round((currentLevelXp / xpPerLevel) * 100),
  };
}

/**
 * Versioned XP Formula (xp_formula_version = 1)
 */
export function computeArcadeXp(params: {
  mode: ArcadeModeId;
  wpm: number;
  accuracy: number;
  correctChars: number;
  isDailyChallenge?: boolean;
  validationStatus: ReplayVerificationResult['status'];
}): number {
  if (params.validationStatus === 'rejected') return 0;

  const modeConfig = ARCADE_MODES[params.mode];
  const baseCompletion = 45;
  const speedBonus = Math.min(90, Math.round(params.wpm * 0.85));
  const accuracyBonus = params.accuracy >= 98 ? 45 : params.accuracy >= 95 ? 30 : params.accuracy >= 90 ? 15 : 5;
  const volumeBonus = Math.min(40, Math.round(params.correctChars / 15));
  const dailyBonus = params.isDailyChallenge ? 60 : 0;

  return Math.round(
    (baseCompletion + speedBonus + accuracyBonus + volumeBonus) * modeConfig.xpMultiplier + dailyBonus
  );
}

export function signSessionNonce(
  textId: string,
  textVersion: number,
  keystrokeCount: number,
  durationMs: number
): string {
  const raw = `${textId}|v${textVersion}|k${keystrokeCount}|d${Math.round(durationMs)}|sv${SCORING_VERSION}`;
  let h = 0x811c9dc5;
  for (let i = 0; i < raw.length; i++) {
    h ^= raw.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return `ARC-${(h >>> 0).toString(16).toUpperCase().padStart(8, '0')}`;
}

/**
 * §4.3 Anti-Cheat & Deterministic Replay Verifier.
 * Replays keystrokeLog against immutable passage.content, enforces E1–E4 semantics,
 * checks sustained < 20ms inhuman intervals, and rejects > 0.5% WPM/accuracy mismatch.
 */
export function verifySessionReplay(
  passage: ArcadeTextPassage,
  reported: {
    wpm: number;
    accuracy: number;
    durationMs: number;
    strictMode?: boolean;
  },
  keystrokeLog: KeystrokeEvent[]
): ReplayVerificationResult {
  const reasons: string[] = [];
  const nonce = signSessionNonce(
    passage.textId,
    passage.textVersion,
    keystrokeLog.length,
    reported.durationMs
  );

  if (keystrokeLog.length === 0 || reported.durationMs <= 0) {
    return {
      status: 'rejected',
      recomputedWpm: 0,
      recomputedAccuracy: 0,
      wpmDriftPct: 100,
      accuracyDriftPct: 100,
      minSustainedIntervalMs: null,
      reasons: ['Empty keystroke log or invalid elapsed duration.'],
      nonce,
    };
  }

  // 1. Replay buffer against immutable passage content
  const typedBuffer: string[] = [];
  let totalKeystrokes = 0;
  let correctKeystrokes = 0;

  // Track sustained < 20ms inter-keystroke intervals
  let consecutiveFast = 0;
  let maxConsecutiveFast = 0;
  let minSustainedIntervalMs: number | null = null;
  let prevTimestamp: number | null = null;

  for (let i = 0; i < keystrokeLog.length; i++) {
    const evt = keystrokeLog[i];
    if (prevTimestamp !== null) {
      const dt = evt.t - prevTimestamp;
      if (dt < 0) {
        reasons.push('Non-monotonic keystroke timestamp detected.');
      } else if (dt < 20) {
        consecutiveFast++;
        if (consecutiveFast > maxConsecutiveFast) {
          maxConsecutiveFast = consecutiveFast;
        }
        if (consecutiveFast >= 5) {
          minSustainedIntervalMs =
            minSustainedIntervalMs === null ? dt : Math.min(minSustainedIntervalMs, dt);
        }
      } else {
        consecutiveFast = 0;
      }
    }
    prevTimestamp = evt.t;

    if (evt.isBackspace) {
      // E4: Backspace moves buffer back but NEVER erases recorded keystroke errors
      if (typedBuffer.length > 0) {
        typedBuffer.pop();
      }
      continue;
    }

    const expectedChar = passage.content[typedBuffer.length] ?? '';
    const isCorrect = evt.key === expectedChar;
    totalKeystrokes++;
    if (isCorrect) {
      correctKeystrokes++;
    }

    if (reported.strictMode) {
      if (isCorrect) {
        typedBuffer.push(evt.key);
      }
    } else {
      if (typedBuffer.length < passage.content.length) {
        typedBuffer.push(evt.key);
      }
    }
  }

  // Count final net correct characters in buffer (E1)
  let correctChars = 0;
  for (let i = 0; i < typedBuffer.length; i++) {
    if (typedBuffer[i] === passage.content[i]) {
      correctChars++;
    }
  }

  const recomputedWpm = computeNetWpm(correctChars, reported.durationMs);
  const recomputedAccuracy = computeKeystrokeAccuracy(correctKeystrokes, totalKeystrokes);

  const wpmDriftPct =
    recomputedWpm === 0 && reported.wpm === 0
      ? 0
      : Number(
          (
            (Math.abs(reported.wpm - recomputedWpm) / Math.max(recomputedWpm, reported.wpm, 1)) *
            100
          ).toFixed(2)
        );
  const accuracyDriftPct = Number(Math.abs(reported.accuracy - recomputedAccuracy).toFixed(2));

  let status: ReplayVerificationResult['status'] = 'valid';

  if (maxConsecutiveFast >= 5) {
    status = 'rejected';
    reasons.push(
      `Sustained inhuman keystroke cadence detected (${maxConsecutiveFast} consecutive intervals < 20ms).`
    );
  }

  if (wpmDriftPct > 0.5 || accuracyDriftPct > 0.5) {
    status = 'rejected';
    reasons.push(
      `Replay variance exceeded 0.5% tolerance (WPM drift ${wpmDriftPct}%, Accuracy drift ${accuracyDriftPct}%).`
    );
  }

  if (reasons.some((r) => r.includes('Non-monotonic'))) {
    status = 'rejected';
  }

  if (status === 'valid' && recomputedWpm > 220) {
    status = 'flagged';
    reasons.push('99.9th percentile WPM anomaly flagged for manual review.');
  }

  if (status === 'valid' && reasons.length === 0) {
    reasons.push('Keystroke log replayed cleanly against immutable passage with < 0.5% variance.');
  }

  return {
    status,
    recomputedWpm,
    recomputedAccuracy,
    wpmDriftPct,
    accuracyDriftPct,
    minSustainedIntervalMs,
    reasons,
    nonce,
  };
}

export function upsertPersonalRecord(
  records: ArcadePersonalRecord[],
  session: ArcadeSession
): { nextRecords: ArcadePersonalRecord[]; isNewBestWpm: boolean } {
  if (session.validationStatus === 'rejected') {
    return { nextRecords: records, isNewBestWpm: false };
  }

  const existingIdx = records.findIndex(
    (r) => r.mode === session.mode && r.scoringVersion === session.scoringVersion
  );

  if (existingIdx === -1) {
    const newRec: ArcadePersonalRecord = {
      mode: session.mode,
      scoringVersion: session.scoringVersion,
      bestWpm: session.wpm,
      bestAccuracy: session.accuracy,
      achievedAt: session.completedAt,
    };
    return { nextRecords: [...records, newRec], isNewBestWpm: true };
  }

  const existing = records[existingIdx];
  const isNewBestWpm = session.wpm > existing.bestWpm;
  const updated: ArcadePersonalRecord = {
    ...existing,
    bestWpm: Math.max(existing.bestWpm, session.wpm),
    bestAccuracy: Math.max(existing.bestAccuracy, session.accuracy),
    achievedAt: isNewBestWpm ? session.completedAt : existing.achievedAt,
  };

  const nextRecords = [...records];
  nextRecords[existingIdx] = updated;
  return { nextRecords, isNewBestWpm };
}

/**
 * Active Player Arcade Standings (real player runs only, no ghost/mock data)
 */
export function buildModeLeaderboard(
  modeFilter: ArcadeModeId | 'all',
  period: LeaderboardPeriod,
  sessions: ArcadeSession[],
  profile: ArcadeProfile
): LeaderboardEntry[] {
  const nowMs = Date.now();
  const maxAgeDays = period === 'daily' ? 1 : period === 'weekly' ? 7 : 3650;

  // Take active player's best non-rejected run per mode within the selected time window
  const playerBestByMode = new Map<ArcadeModeId, ArcadeSession>();
  for (const s of sessions) {
    if (s.validationStatus === 'rejected') continue;
    if (modeFilter !== 'all' && s.mode !== modeFilter) continue;
    const ageDays = (nowMs - new Date(s.completedAt).getTime()) / 86400000;
    if (ageDays > maxAgeDays) continue;

    const existing = playerBestByMode.get(s.mode);
    if (!existing || s.wpm > existing.wpm) {
      playerBestByMode.set(s.mode, s);
    }
  }

  const profileAgeDays = (nowMs - new Date(profile.createdAt).getTime()) / 86400000;
  const userTrustTier: 'verified' | 'provisional' = profileAgeDays >= 7 ? 'verified' : 'provisional';

  const playerRows: LeaderboardEntry[] = Array.from(playerBestByMode.values()).map((s) => ({
    id: `user-${s.id}`,
    handle: profile.handle,
    titleLabel: getTitleLabel(profile.equipped.playerTitle),
    mode: s.mode,
    wpm: s.wpm,
    accuracy: s.accuracy,
    scoringVersion: s.scoringVersion,
    validationStatus: s.validationStatus,
    trustTier: userTrustTier,
    isCurrentUser: true,
    achievedAt: s.completedAt,
  }));

  return playerRows.sort((a, b) => {
    if (b.wpm !== a.wpm) return b.wpm - a.wpm;
    return b.accuracy - a.accuracy;
  });
}
