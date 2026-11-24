export type ArcadeModeId =
  | 'classic'
  | 'speed_rush'
  | 'accuracy_master'
  | 'rhythm'
  | 'challenge';

export type ArcadeDifficulty = 'standard' | 'precision' | 'master';

export type ArcadeGameState = 'idle' | 'countdown' | 'playing' | 'paused' | 'results';

export type ValidationStatus = 'pending' | 'valid' | 'flagged' | 'rejected';

export type LeaderboardPeriod = 'daily' | 'weekly' | 'all_time';

export type CosmeticCategory = 'caret' | 'theme' | 'sound' | 'title';

export type CaretStyleId = 'caret_amber_beam' | 'caret_emerald_block' | 'caret_underline' | 'caret_pulse_bar';
export type ArenaThemeId = 'theme_obsidian' | 'theme_carbon_amber' | 'theme_emerald_vault' | 'theme_midnight_slate';
export type SoundPackId = 'sound_tactile' | 'sound_thock' | 'sound_crystal' | 'sound_muted';
export type TitleId = 'title_challenger' | 'title_velocity' | 'title_metronome' | 'title_grandmaster';

export interface DifficultyAttrs {
  avgWordLength: number;
  punctuationDensity: number;
  tier: ArcadeDifficulty;
}

export interface ArcadeTextPassage {
  textId: string;
  textVersion: number;
  title: string;
  content: string;
  difficultyAttrs: DifficultyAttrs;
  license: 'Original' | 'CC0-1.0';
  source: string;
  isActive: boolean;
  recommendedModes: ArcadeModeId[];
}

export interface ArcadeModeConfig {
  id: ArcadeModeId;
  name: string;
  shortLabel: string;
  tagline: string;
  description: string;
  durationSeconds: number | null;
  supportsDifficulty: boolean;
  allowStrictOption: boolean;
  defaultStrict: boolean;
  errorBudget: number | null;
  targetBpm: number | null;
  targetWpm: number | null;
  targetAccuracy: number | null;
  xpMultiplier: number;
  accent: 'amber' | 'emerald';
}

export interface KeystrokeEvent {
  t: number;
  key: string;
  expected: string;
  correct: boolean;
  isBackspace?: boolean;
  renderLatencyMs?: number;
}

export interface ReplayVerificationResult {
  status: ValidationStatus;
  recomputedWpm: number;
  recomputedAccuracy: number;
  wpmDriftPct: number;
  accuracyDriftPct: number;
  minSustainedIntervalMs: number | null;
  reasons: string[];
  nonce: string;
}

export interface ArcadeSession {
  id: string;
  mode: ArcadeModeId;
  difficulty: ArcadeDifficulty;
  strictMode: boolean;
  textId: string;
  textVersion: number;
  wpm: number;
  rawWpm: number;
  accuracy: number;
  durationMs: number;
  correctChars: number;
  totalKeystrokes: number;
  errorCount: number;
  scoringVersion: number;
  xpFormulaVersion: number;
  p95LatencyMs: number;
  rhythmScore?: number;
  maxCombo?: number;
  xpEarned: number;
  isDailyChallenge?: boolean;
  dailyDate?: string;
  validationStatus: ValidationStatus;
  verification: ReplayVerificationResult;
  keystrokeLog: KeystrokeEvent[];
  completedAt: string;
}

export interface ArcadePersonalRecord {
  mode: ArcadeModeId;
  scoringVersion: number;
  bestWpm: number;
  bestAccuracy: number;
  achievedAt: string;
}

export interface CosmeticItem {
  id: string;
  category: CosmeticCategory;
  name: string;
  description: string;
  xpRequired: number;
  previewPrimary: string;
  previewSecondary: string;
}

export interface EquippedCosmetics {
  caretStyle: CaretStyleId;
  arenaTheme: ArenaThemeId;
  soundPack: SoundPackId;
  playerTitle: TitleId;
}

export interface ArcadeProfile {
  handle: string;
  xp: number;
  level: number;
  xpFormulaVersion: number;
  dailyStreak: number;
  lastDailyDate?: string;
  unlockedItemIds: string[];
  equipped: EquippedCosmetics;
  createdAt: string;
}

export interface LeaderboardEntry {
  id: string;
  handle: string;
  titleLabel: string;
  mode: ArcadeModeId;
  wpm: number;
  accuracy: number;
  scoringVersion: number;
  validationStatus: ValidationStatus;
  trustTier: 'verified' | 'provisional';
  isCurrentUser: boolean;
  achievedAt: string;
}
