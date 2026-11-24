import { safeStorage } from '../../utils/safeStorage';

export const FIGHTING_PROGRESS_STORAGE_KEY = 'typing_arcade_fighting_progress_v1';
export const PLAYER_BASE_MAX_HP = 100;

const PLAYER_SIGNATURE_LEVEL_MAX_HP = [100, 120, 140, 160, 185] as const;

export function getPlayerMaxHpForLevel(level: number): number {
  const safeLevel = Math.max(1, Math.floor(level));
  if (safeLevel <= PLAYER_SIGNATURE_LEVEL_MAX_HP.length) {
    return PLAYER_SIGNATURE_LEVEL_MAX_HP[safeLevel - 1];
  }
  const eliteTier = safeLevel - PLAYER_SIGNATURE_LEVEL_MAX_HP.length;
  return PLAYER_SIGNATURE_LEVEL_MAX_HP[PLAYER_SIGNATURE_LEVEL_MAX_HP.length - 1] + eliteTier * 20;
}

export type FightingAttackMove = 'punching' | 'kicking' | 'combo_attack';

export type AggressionIntensityTier =
  | 'Calm'
  | 'Engaged'
  | 'Pressing'
  | 'Fierce'
  | 'Overdrive';

export type OpponentStyleId =
  | 'beginner'
  | 'street'
  | 'boxer'
  | 'martial_arts'
  | 'champion'
  | 'elite';

export interface OpponentPalette {
  primary: string;
  secondary: string;
  accent: string;
  glow: string;
  skin: string;
}

export interface OpponentProfile {
  level: number;
  name: string;
  epithet: string;
  roleTitle: string;
  style: OpponentStyleId;
  maxHp: number;
  lightCounterDamage: number;
  heavyCounterDamage: number;
  pressureDamage: number;
  pauseGraceMs: number;
  baseAttackIntervalSec: number;
  minAttackIntervalSec: number;
  counterCooldownMs: number;
  mistakesForHeavy: number;
  wordDifficultyLabel: string;
  palette: OpponentPalette;
  isAdaptiveElite: boolean;
}

export interface CombatWordEntry {
  wordId: number;
  text: string;
  completed: boolean;
  errorCount: number;
  startedAtMs: number | null;
}

export interface FightingLevelRecord {
  wins: number;
  bestWpm: number;
  bestAccuracy: number;
}

export interface FightingProgressionState {
  highestUnlockedLevel: number;
  selectedLevel: number;
  totalWins: number;
  totalMatches: number;
  rollingWpm: number;
  rollingAccuracy: number;
  levelRecords: Record<number, FightingLevelRecord>;
}

export interface AdaptiveSkillSnapshot {
  wpm: number;
  accuracy: number;
}

export interface WordValidationResult {
  isExactMatch: boolean;
  correctChars: number;
  incorrectChars: number;
  hasAnyError: boolean;
  isPrefixCorrect: boolean;
}

export interface StrictCharInputResult {
  accepted: boolean;
  isCorrect: boolean;
  blockedByErrorLock: boolean;
  errorLocked: boolean;
  wordCompletedReady: boolean;
  expectedChar: string;
}

export interface AttackCalculationResult {
  accepted: boolean;
  damage: number;
  move: FightingAttackMove;
  isCritical: boolean;
  interruptedEnemyAttack: boolean;
  comboMultiplier: number;
  nextWordCombo: number;
  nextOpponentHp: number;
  opponentDefeated: boolean;
}

export interface AiReactionResult {
  triggered: boolean;
  type: 'none' | 'block' | 'light_counter' | 'heavy_counter' | 'pause_pressure' | 'tempo_strike';
  damage: number;
  nextPlayerHp: number;
  playerDefeated: boolean;
  grantsAdvantage: boolean;
  resetsCombo: boolean;
  callout: string;
}

export interface DynamicCombatTickResult {
  strikeTriggered: boolean;
  strike: AiReactionResult;
  opponentAttackGauge: number;
  aggressionMultiplier: number;
  intensityTier: AggressionIntensityTier;
  flowHeat: number;
  currentAttackIntervalSec: number;
}

export interface CombatMatchState {
  level: number;
  opponent: OpponentProfile;
  playerHp: number;
  playerMaxHp: number;
  opponentHp: number;
  opponentMaxHp: number;
  wordQueue: CombatWordEntry[];
  activeWordIndex: number;
  nextWordId: number;
  typedBuffer: string;
  wordCombo: number;
  maxWordCombo: number;
  wordsCompleted: number;
  totalDamageDealt: number;
  totalDamageTaken: number;
  recentMistakeTimestamps: number[];
  lastAiAttackMs: number;
  lastKeystrokeMs: number;
  aiAdvantageUntilMs: number;
  // Enhanced Dynamic Combat Difficulty & Flow Scaling
  flowHeat: number; // 0.0 -> 1.0 smooth continuous-typing momentum
  aggressionMultiplier: number; // 1.00x -> 2.10x gradually slewed
  intensityTier: AggressionIntensityTier;
  opponentAttackGauge: number; // 0.0 -> 1.0 (1.0 triggers AI Tempo Strike; word finish interrupts to 0)
  continuousAccurateStreak: number;
  interruptCount: number;
  outcome: 'ongoing' | 'victory' | 'defeat';
}

// ============================================================================
// PROGRESSIVE OPPONENT ROSTER (LEVELS 1-5 + INFINITE ADAPTIVE LEVEL 6+ ELITES)
// ============================================================================
const SIGNATURE_OPPONENTS: Omit<OpponentProfile, 'isAdaptiveElite'>[] = [
  {
    level: 1,
    name: 'Kenji',
    epithet: 'Spark',
    roleTitle: 'Beginner Fighter',
    style: 'beginner',
    maxHp: 100,
    lightCounterDamage: 4,
    heavyCounterDamage: 8,
    pressureDamage: 6,
    pauseGraceMs: 3600,
    baseAttackIntervalSec: 4.1,
    minAttackIntervalSec: 2.05,
    counterCooldownMs: 1600,
    mistakesForHeavy: 3,
    wordDifficultyLabel: 'Easy short words · Slow telegraphed counters',
    palette: {
      primary: '#1E293B',
      secondary: '#38BDF8',
      accent: '#7DD3FC',
      glow: 'rgba(56, 189, 248, 0.45)',
      skin: '#F1C29B',
    },
  },
  {
    level: 2,
    name: 'Rico',
    epithet: 'Viper',
    roleTitle: 'Street Fighter',
    style: 'street',
    maxHp: 125,
    lightCounterDamage: 6,
    heavyCounterDamage: 11,
    pressureDamage: 8,
    pauseGraceMs: 3100,
    baseAttackIntervalSec: 3.65,
    minAttackIntervalSec: 1.82,
    counterCooldownMs: 1350,
    mistakesForHeavy: 3,
    wordDifficultyLabel: 'Medium action words · Faster street jabs',
    palette: {
      primary: '#2B1622',
      secondary: '#F43F5E',
      accent: '#FDA4AF',
      glow: 'rgba(244, 63, 94, 0.45)',
      skin: '#D99B72',
    },
  },
  {
    level: 3,
    name: 'Marcus',
    epithet: 'Ironclad',
    roleTitle: 'Skilled Boxer',
    style: 'boxer',
    maxHp: 150,
    lightCounterDamage: 7,
    heavyCounterDamage: 14,
    pressureDamage: 10,
    pauseGraceMs: 2700,
    baseAttackIntervalSec: 3.3,
    minAttackIntervalSec: 1.65,
    counterCooldownMs: 1200,
    mistakesForHeavy: 2,
    wordDifficultyLabel: 'Challenging words · Tight guard & heavy hooks',
    palette: {
      primary: '#231C12',
      secondary: '#F59E0B',
      accent: '#FDE68A',
      glow: 'rgba(245, 158, 11, 0.45)',
      skin: '#A56A46',
    },
  },
  {
    level: 4,
    name: 'Sora',
    epithet: 'Tempest',
    roleTitle: 'Martial Arts Expert',
    style: 'martial_arts',
    maxHp: 175,
    lightCounterDamage: 8,
    heavyCounterDamage: 16,
    pressureDamage: 11,
    pauseGraceMs: 2350,
    baseAttackIntervalSec: 2.95,
    minAttackIntervalSec: 1.48,
    counterCooldownMs: 1050,
    mistakesForHeavy: 2,
    wordDifficultyLabel: 'Complex words & two-word strikes · Rapid kicks',
    palette: {
      primary: '#1E1533',
      secondary: '#A855F7',
      accent: '#D8B4FE',
      glow: 'rgba(168, 85, 247, 0.45)',
      skin: '#EBC09C',
    },
  },
  {
    level: 5,
    name: 'Kuro',
    epithet: 'Apex',
    roleTitle: 'Champion Fighter',
    style: 'champion',
    maxHp: 210,
    lightCounterDamage: 10,
    heavyCounterDamage: 18,
    pressureDamage: 13,
    pauseGraceMs: 2050,
    baseAttackIntervalSec: 2.7,
    minAttackIntervalSec: 1.35,
    counterCooldownMs: 950,
    mistakesForHeavy: 2,
    wordDifficultyLabel: 'Advanced words & punctuation · Smart combos',
    palette: {
      primary: '#1A1318',
      secondary: '#FB7185',
      accent: '#FBBF24',
      glow: 'rgba(251, 113, 133, 0.5)',
      skin: '#DFB08C',
    },
  },
];

const ELITE_ROSTER_META: Array<{ name: string; epithet: string; palette: OpponentPalette }> = [
  {
    name: 'Valkyrie',
    epithet: 'Zero',
    palette: {
      primary: '#111E2E',
      secondary: '#22D3EE',
      accent: '#FDE68A',
      glow: 'rgba(34, 211, 238, 0.52)',
      skin: '#E8BC96',
    },
  },
  {
    name: 'Raiden',
    epithet: 'Phantom',
    palette: {
      primary: '#1C142B',
      secondary: '#C084FC',
      accent: '#34D399',
      glow: 'rgba(192, 132, 252, 0.52)',
      skin: '#D6A17A',
    },
  },
  {
    name: 'Shogun',
    epithet: 'Omega',
    palette: {
      primary: '#261317',
      secondary: '#F43F5E',
      accent: '#F59E0B',
      glow: 'rgba(244, 63, 94, 0.55)',
      skin: '#C48A62',
    },
  },
];

export function getOpponentForLevel(
  level: number,
  adaptiveSkill?: AdaptiveSkillSnapshot
): OpponentProfile {
  const safeLevel = Math.max(1, Math.floor(level));
  if (safeLevel <= SIGNATURE_OPPONENTS.length) {
    return {
      ...SIGNATURE_OPPONENTS[safeLevel - 1],
      isAdaptiveElite: false,
    };
  }

  // Level 6+ Adaptive Elite Fighters scale cleanly with level & player performance
  const eliteTier = safeLevel - 5;
  const meta = ELITE_ROSTER_META[(eliteTier - 1) % ELITE_ROSTER_META.length];

  const skillWpm = Math.max(30, Math.min(130, adaptiveSkill?.wpm ?? 65));
  const skillAcc = Math.max(80, Math.min(100, adaptiveSkill?.accuracy ?? 95));
  const wpmFactor = Math.max(0, (skillWpm - 55) / 50);
  const accFactor = Math.max(0, (skillAcc - 92) / 8);

  const maxHp = Math.round(220 + eliteTier * 22 + wpmFactor * 35);
  const lightCounterDamage = Math.min(15, Math.round(10 + eliteTier * 0.8 + accFactor * 1.5));
  const heavyCounterDamage = Math.min(24, Math.round(18 + eliteTier * 1.1 + wpmFactor * 2));
  const pressureDamage = Math.min(18, Math.round(13 + eliteTier * 0.8));
  const pauseGraceMs = Math.max(1550, Math.round(1980 - eliteTier * 70 - wpmFactor * 140));
  const baseAttackIntervalSec = Math.max(2.15, Number((2.55 - eliteTier * 0.08).toFixed(2)));
  const minAttackIntervalSec = Math.max(1.18, Number((1.3 - eliteTier * 0.03).toFixed(2)));
  const counterCooldownMs = Math.max(760, Math.round(920 - eliteTier * 25));

  return {
    level: safeLevel,
    name: meta.name,
    epithet: `${meta.epithet}-${String(safeLevel).padStart(2, '0')}`,
    roleTitle: `Elite Fighter · Tier ${eliteTier}`,
    style: 'elite',
    maxHp,
    lightCounterDamage,
    heavyCounterDamage,
    pressureDamage,
    pauseGraceMs,
    baseAttackIntervalSec,
    minAttackIntervalSec,
    counterCooldownMs,
    mistakesForHeavy: 2,
    wordDifficultyLabel: `Adaptive Elite · Scaled for ${Math.round(skillWpm)} WPM`,
    palette: meta.palette,
    isAdaptiveElite: true,
  };
}

// ============================================================================
// LEVEL-CALIBRATED COMBAT WORD & PHRASE POOLS
// ============================================================================
const LEVEL_WORD_POOLS: Record<number, string[]> = {
  1: [
    'jab', 'kick', 'dash', 'fast', 'calm', 'hand', 'step', 'move', 'hit', 'flow',
    'snap', 'grip', 'glow', 'beat', 'rush', 'push', 'lean', 'spin', 'bold', 'pure',
    'drop', 'rise', 'fire', 'wind', 'iron', 'edge', 'core', 'pace', 'peak', 'zone',
    'wave', 'form', 'lock', 'ring', 'mark', 'turn', 'flip', 'skip', 'bolt', 'beam',
  ],
  2: [
    'strike', 'block', 'guard', 'dodge', 'swift', 'combo', 'punch', 'sweep', 'flash', 'focus',
    'charge', 'sprint', 'reflex', 'impact', 'stance', 'frenzy', 'launch', 'clutch', 'parry', 'thrust',
    'breaker', 'kinetic', 'counter', 'advance', 'shatter', 'agility', 'stamina', 'blazing', 'phantom', 'flicker',
    'crusher', 'rhythm', 'victory', 'balance', 'tension', 'channel', 'fighter', 'sparkle', 'cyclone', 'tempo',
  ],
  3: [
    'uppercut', 'footwork', 'knockout', 'pressure', 'momentum', 'deflect', 'crossfire', 'disciplined',
    'titanium', 'accuracy', 'overload', 'velocity', 'shockwave', 'champion', 'resilient', 'precision',
    'tactical', 'dominant', 'defender', 'interval', 'catalyst', 'stagger', 'fortress', 'unbroken',
    'cadence', 'sequence', 'heavyweight', 'intercept', 'reactive', 'gauntlet', 'vanguard', 'relentless',
  ],
  4: [
    'dragon kick', 'iron guard', 'shadow step', 'rapid strike', 'clean parry', 'focus burst',
    'cyber dojo', 'steel reflex', 'lightning jab', 'rising storm', 'zero hesitation', 'double sweep',
    'equilibrium', 'acceleration', 'counterattack', 'synchronization', 'thunderbolt', 'unstoppable',
    'phoenix dash', 'crimson arc', 'blade stance', 'tiger lunge', 'vortex spin', 'perfect timing',
    'kinetic surge', 'phantom strike', 'mirror block', 'silent strike', 'pulse breaker', 'wind slash',
  ],
  5: [
    'Apex-Strike!', 'Hyper-Combo', 'Guard Break!', 'Zero-Drift', 'Cyber-Dojo', 'Shadow-Kick',
    'Overdrive x3', 'Iron-Fist', 'Counter-Hit!', 'Precision: 100%', 'Phase-Shift', 'Storm-Breaker',
    'Tempo-Lock', 'Titanium-Core', 'Ultra-Focus', 'Vortex-Slash', 'Master-Tier', 'Final-Salvo!',
    'Pulse-Engine', 'Reflex-Check', 'No-Mistakes!', 'Dragon-Fang', 'Velocity-Max', 'Strike-Zone',
    'Combo-Chain!', 'Aegis-Shield', 'Kinetic-Wave', 'Apex-Finish!',
  ],
  6: [
    'Elite-Overdrive!', 'Cyber-Kenshi #1', 'Zero-Latency', 'Hyper-Parry!', 'Quantum-Strike',
    'Phantom-Combo x5', 'Precision: 99%', 'Apex-Velocity', 'Thunder-Vault!', 'Shogun-Protocol',
    'Kinetic-Barrage', 'Shadow-Breaker!', 'Chrono-Reflex', 'Valkyrie-Rush', 'Titanium-Guard',
    'Pulse-Detonation', 'Sync-Mastery!', 'Vector-Uppercut', 'Crimson-Tempest', 'Flawless-Chain!',
    'Omega-Finisher!', 'Neural-Cadence', 'Aero-Cyclone', 'Iron-Discipline', 'Strike-Vector #4',
  ],
};

export function generateCombatWordQueue(
  level: number,
  count: number = 28,
  startWordId: number = 1,
  excludeLastText?: string
): CombatWordEntry[] {
  const poolKey = Math.max(1, Math.min(6, Math.floor(level)));
  const rawPool = LEVEL_WORD_POOLS[poolKey] || LEVEL_WORD_POOLS[1];
  const uniquePool = Array.from(new Set(rawPool));

  const queue: CombatWordEntry[] = [];
  let prev = excludeLastText || '';
  let nextId = startWordId;

  while (queue.length < count) {
    const shuffled = [...uniquePool];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    for (const text of shuffled) {
      if (queue.length >= count) break;
      if (text === prev && uniquePool.length > 1) continue;
      queue.push({
        wordId: nextId++,
        text,
        completed: false,
        errorCount: 0,
        startedAtMs: null,
      });
      prev = text;
    }
  }

  return queue;
}

// ============================================================================
// STRICT WORD ACCURACY SYSTEM (RED HIGHLIGHT + MANDATORY BACKSPACE LOCK)
// ============================================================================
export function validateTypedWord(targetWord: string, typedBuffer: string): WordValidationResult {
  let correctChars = 0;
  let incorrectChars = 0;

  for (let i = 0; i < typedBuffer.length; i++) {
    if (i < targetWord.length && typedBuffer[i] === targetWord[i]) {
      correctChars++;
    } else {
      incorrectChars++;
    }
  }

  const hasAnyError = incorrectChars > 0;
  const isPrefixCorrect = !hasAnyError && typedBuffer.length <= targetWord.length;
  const isExactMatch = !hasAnyError && typedBuffer.length === targetWord.length && targetWord.length > 0;

  return {
    isExactMatch,
    correctChars,
    incorrectChars,
    hasAnyError,
    isPrefixCorrect,
  };
}

/**
 * Returns true if the current typed buffer contains an uncorrected mistake that locks forward typing.
 */
export function hasStrictErrorLock(targetWord: string, typedBuffer: string): boolean {
  return validateTypedWord(targetWord, typedBuffer).hasAnyError;
}

/**
 * Enforces strict word accuracy on printable character input:
 * - If an uncorrected red error already exists, blocks ALL forward input until Backspace clears it.
 * - If the newly typed character is wrong, appends that single red char and locks the cursor.
 * - Never allows skipping words or advancing past wrong letters.
 */
export function processStrictCombatCharInput(
  state: CombatMatchState,
  key: string
): StrictCharInputResult {
  const activeEntry = state.wordQueue[state.activeWordIndex];
  if (!activeEntry || state.outcome !== 'ongoing' || key.length !== 1) {
    return {
      accepted: false,
      isCorrect: false,
      blockedByErrorLock: false,
      errorLocked: false,
      wordCompletedReady: false,
      expectedChar: '',
    };
  }

  // Hard Lock: cannot type ahead or skip while a red error remains uncorrected
  if (hasStrictErrorLock(activeEntry.text, state.typedBuffer)) {
    const errorIdx = Math.max(0, state.typedBuffer.length - 1);
    return {
      accepted: false,
      isCorrect: false,
      blockedByErrorLock: true,
      errorLocked: true,
      wordCompletedReady: false,
      expectedChar: activeEntry.text[errorIdx] || '',
    };
  }

  const charIdx = state.typedBuffer.length;
  const expected = activeEntry.text[charIdx];
  if (expected === undefined) {
    return {
      accepted: false,
      isCorrect: false,
      blockedByErrorLock: false,
      errorLocked: false,
      wordCompletedReady: false,
      expectedChar: '',
    };
  }

  const isCorrect = key === expected;
  state.typedBuffer += key;

  if (isCorrect) {
    state.continuousAccurateStreak += 1;
    const isExact = state.typedBuffer === activeEntry.text;
    return {
      accepted: true,
      isCorrect: true,
      blockedByErrorLock: false,
      errorLocked: false,
      wordCompletedReady: isExact,
      expectedChar: expected,
    };
  }

  // Mistype -> show red letter & engage strict Backspace error lock immediately
  state.continuousAccurateStreak = 0;
  return {
    accepted: true,
    isCorrect: false,
    blockedByErrorLock: false,
    errorLocked: true,
    wordCompletedReady: false,
    expectedChar: expected,
  };
}

/**
 * Removes the last typed character cleanly (clearing red error locks without awarding progress).
 */
export function processStrictBackspace(state: CombatMatchState): boolean {
  if (state.outcome !== 'ongoing' || state.typedBuffer.length === 0) {
    return false;
  }
  state.typedBuffer = state.typedBuffer.slice(0, -1);
  return true;
}

// ============================================================================
// DYNAMIC COMBAT DIFFICULTY & GRADUAL OPPONENT ATTACK SPEED SCALING
// ============================================================================
export function getAggressionTier(multiplier: number): AggressionIntensityTier {
  if (multiplier >= 1.92) return 'Overdrive';
  if (multiplier >= 1.66) return 'Fierce';
  if (multiplier >= 1.4) return 'Pressing';
  if (multiplier >= 1.16) return 'Engaged';
  return 'Calm';
}

export function computeTargetAggressionMultiplier(
  flowHeat: number,
  liveWpm: number,
  liveAccuracy: number,
  level: number
): number {
  const clampedHeat = Math.max(0, Math.min(1, flowHeat));
  const wpmBoost = Math.max(0, Math.min(0.45, (liveWpm - 32) / 145));
  const accBoost = liveAccuracy >= 94 ? ((liveAccuracy - 94) / 6) * 0.16 : 0;
  const levelCap = Math.min(2.15, 1.85 + Math.max(0, level - 1) * 0.06);

  // Smooth curve: baseline 1.0x -> up to levelCap as continuous accurate flow & speed rise
  const target = 1.0 + clampedHeat * (0.62 + wpmBoost + accBoost);
  return Number(Math.max(1.0, Math.min(levelCap, target)).toFixed(3));
}

export function computeOpponentAttackIntervalSec(
  opponent: OpponentProfile,
  aggressionMultiplier: number
): number {
  const mult = Math.max(1.0, aggressionMultiplier);
  const scaled = opponent.baseAttackIntervalSec / mult;
  return Number(Math.max(opponent.minAttackIntervalSec, scaled).toFixed(3));
}

/**
 * Gradually nudges continuous typing flow heat upward on accurate input/word clears (zero abrupt spikes).
 */
export function registerAccurateFlowStep(
  state: CombatMatchState,
  isWordComplete: boolean,
  liveWpm: number,
  liveAccuracy: number
): void {
  const speedWeight = 0.8 + Math.min(0.65, Math.max(0, (liveWpm - 30) / 120));
  const accWeight = liveAccuracy >= 95 ? 1.12 : liveAccuracy >= 88 ? 0.95 : 0.72;
  const baseStep = isWordComplete ? 0.068 : 0.018;
  state.flowHeat = Math.min(1, state.flowHeat + baseStep * speedWeight * accWeight);
}

/**
 * Smoothly cools flow heat downward on mistypes, slow play, or absorbed strikes so combat stays balanced.
 */
export function coolCombatIntensity(state: CombatMatchState, amount: number): void {
  state.flowHeat = Math.max(0, state.flowHeat - Math.max(0, amount));
}

/**
 * 60fps dynamic combat tick:
 * - Gradually slews aggressionMultiplier toward live target (never sudden jumps).
 * - Cools aggression naturally if the player slows down or hesitates.
 * - Charges opponentAttackGauge continuously; at 100%, triggers a balanced AI Tempo Strike.
 */
export function stepDynamicCombatTick(
  state: CombatMatchState,
  dt: number,
  nowMs: number,
  liveWpm: number,
  liveAccuracy: number
): DynamicCombatTickResult {
  const clampedDt = Math.min(0.05, Math.max(0.001, dt));
  const idleMs = state.lastKeystrokeMs > 0 ? Math.max(0, nowMs - state.lastKeystrokeMs) : 0;

  if (state.outcome !== 'ongoing' || state.lastKeystrokeMs <= 0) {
    return {
      strikeTriggered: false,
      strike: {
        triggered: false,
        type: 'none',
        damage: 0,
        nextPlayerHp: state.playerHp,
        playerDefeated: false,
        grantsAdvantage: false,
        resetsCombo: false,
        callout: '',
      },
      opponentAttackGauge: state.opponentAttackGauge,
      aggressionMultiplier: state.aggressionMultiplier,
      intensityTier: state.intensityTier,
      flowHeat: state.flowHeat,
      currentAttackIntervalSec: computeOpponentAttackIntervalSec(
        state.opponent,
        state.aggressionMultiplier
      ),
    };
  }

  // Dynamic down-scaling when player slows down or pauses
  if (idleMs > 1100) {
    const decayRate = idleMs > 2200 ? 0.16 : 0.08;
    coolCombatIntensity(state, clampedDt * decayRate);
  } else if (liveWpm > 0 && liveWpm < 26) {
    coolCombatIntensity(state, clampedDt * 0.06);
  }

  // Smooth bounded slew for aggressionMultiplier (max ±0.26x per second -> gradual, playable ramp)
  const targetMult = computeTargetAggressionMultiplier(
    state.flowHeat,
    liveWpm,
    liveAccuracy,
    state.level
  );
  const maxStep = clampedDt * 0.26;
  const diff = targetMult - state.aggressionMultiplier;
  if (Math.abs(diff) <= maxStep) {
    state.aggressionMultiplier = targetMult;
  } else {
    state.aggressionMultiplier = Number(
      (state.aggressionMultiplier + Math.sign(diff) * maxStep).toFixed(4)
    );
  }
  state.intensityTier = getAggressionTier(state.aggressionMultiplier);

  // Charge Opponent Attack Gauge smoothly based on dynamic attack interval
  const activeWord = state.wordQueue[state.activeWordIndex]?.text || '';
  const errorLocked = hasStrictErrorLock(activeWord, state.typedBuffer);
  const currentIntervalSec = computeOpponentAttackIntervalSec(
    state.opponent,
    state.aggressionMultiplier
  );

  // Modest pressure boost if stalled on an uncorrected mistake or long pause
  const stallBoost = errorLocked ? 1.24 : idleMs > 1800 ? 1.18 : 1.0;
  state.opponentAttackGauge = Math.min(
    1,
    state.opponentAttackGauge + (clampedDt / currentIntervalSec) * stallBoost
  );

  if (state.opponentAttackGauge >= 1) {
    // AI Tempo Strike lands!
    const aggrBonus = Math.round((state.aggressionMultiplier - 1) * 3.5);
    const damage = Math.min(20, Math.max(4, state.opponent.pressureDamage + aggrBonus));
    state.playerHp = Math.max(0, state.playerHp - damage);
    state.totalDamageTaken += damage;
    state.opponentAttackGauge = 0;
    state.lastAiAttackMs = nowMs;
    // Slightly ease heat after player absorbs a strike so combat stays recoverable
    coolCombatIntensity(state, 0.18);
    state.wordCombo = Math.max(0, Math.floor(state.wordCombo / 2));

    const playerDefeated = state.playerHp <= 0;
    if (playerDefeated) {
      state.outcome = 'defeat';
    }

    const callout =
      state.intensityTier === 'Overdrive' || state.intensityTier === 'Fierce'
        ? `RUSH -${damage}`
        : `STRIKE -${damage}`;

    return {
      strikeTriggered: true,
      strike: {
        triggered: true,
        type: 'tempo_strike',
        damage,
        nextPlayerHp: state.playerHp,
        playerDefeated,
        grantsAdvantage: state.aggressionMultiplier >= 1.5,
        resetsCombo: false,
        callout,
      },
      opponentAttackGauge: 0,
      aggressionMultiplier: state.aggressionMultiplier,
      intensityTier: state.intensityTier,
      flowHeat: state.flowHeat,
      currentAttackIntervalSec: currentIntervalSec,
    };
  }

  return {
    strikeTriggered: false,
    strike: {
      triggered: false,
      type: 'none',
      damage: 0,
      nextPlayerHp: state.playerHp,
      playerDefeated: false,
      grantsAdvantage: false,
      resetsCombo: false,
      callout: '',
    },
    opponentAttackGauge: state.opponentAttackGauge,
    aggressionMultiplier: state.aggressionMultiplier,
    intensityTier: state.intensityTier,
    flowHeat: state.flowHeat,
    currentAttackIntervalSec: currentIntervalSec,
  };
}

// ============================================================================
// COMBAT DAMAGE & WORD-COMPLETION INTERRUPT MATH
// ============================================================================
export function getComboMultiplier(wordCombo: number): number {
  if (wordCombo >= 10) return 1.75;
  if (wordCombo >= 7) return 1.55;
  if (wordCombo >= 5) return 1.4;
  if (wordCombo >= 3) return 1.25;
  if (wordCombo >= 2) return 1.12;
  return 1.0;
}

export function calculatePlayerAttackDamage(params: {
  wordLength: number;
  wpm: number;
  accuracy: number;
  wordCombo: number;
  wordHadErrors: boolean;
}): { damage: number; move: FightingAttackMove; isCritical: boolean; comboMultiplier: number } {
  const { wordLength, wpm, accuracy, wordCombo, wordHadErrors } = params;

  const baseDamage = 7 + Math.min(18, wordLength * 1.45);
  const speedMultiplier = 0.92 + Math.min(0.48, Math.max(0, (wpm - 25) / 170));
  const accuracyMultiplier = wordHadErrors
    ? 0.84
    : accuracy >= 97
    ? 1.15
    : accuracy >= 92
    ? 1.06
    : 0.98;
  const comboMultiplier = getComboMultiplier(wordCombo);

  const isSpecialCombo = !wordHadErrors && wordCombo >= 4 && wordCombo % 3 === 1;
  const isCritical = isSpecialCombo || (!wordHadErrors && wpm >= 75 && wordCombo >= 3);
  const specialBonus = isSpecialCombo ? 1.25 : 1.0;

  const rawDamage = baseDamage * speedMultiplier * accuracyMultiplier * comboMultiplier * specialBonus;
  const damage = Math.max(5, Math.min(62, Math.round(rawDamage)));

  let move: FightingAttackMove = 'punching';
  if (isSpecialCombo) {
    move = 'combo_attack';
  } else if (wordCombo >= 2 && wordCombo % 2 === 0) {
    move = 'kicking';
  }

  return {
    damage,
    move,
    isCritical,
    comboMultiplier,
  };
}

export function createCombatMatchState(
  level: number,
  adaptiveSkill?: AdaptiveSkillSnapshot
): CombatMatchState {
  const opponent = getOpponentForLevel(level, adaptiveSkill);
  const playerMaxHp = getPlayerMaxHpForLevel(opponent.level);
  const wordQueue = generateCombatWordQueue(opponent.level, 32, 1);

  return {
    level: opponent.level,
    opponent,
    playerHp: playerMaxHp,
    playerMaxHp,
    opponentHp: opponent.maxHp,
    opponentMaxHp: opponent.maxHp,
    wordQueue,
    activeWordIndex: 0,
    nextWordId: wordQueue.length + 1,
    typedBuffer: '',
    wordCombo: 0,
    maxWordCombo: 0,
    wordsCompleted: 0,
    totalDamageDealt: 0,
    totalDamageTaken: 0,
    recentMistakeTimestamps: [],
    lastAiAttackMs: -5000,
    lastKeystrokeMs: 0,
    aiAdvantageUntilMs: 0,
    flowHeat: 0,
    aggressionMultiplier: 1.0,
    intensityTier: 'Calm',
    opponentAttackGauge: 0,
    continuousAccurateStreak: 0,
    interruptCount: 0,
    outcome: 'ongoing',
  };
}

export function ensureWordQueueRefilled(state: CombatMatchState): void {
  if (state.wordQueue.length - state.activeWordIndex < 10) {
    const lastText = state.wordQueue[state.wordQueue.length - 1]?.text;
    const more = generateCombatWordQueue(state.level, 24, state.nextWordId, lastText);
    state.wordQueue.push(...more);
    state.nextWordId += more.length;
  }
}

/**
 * Validates and applies word-completion attack damage with strict duplicate-word prevention
 * AND interrupts/resets the opponent's charging attack gauge cleanly!
 */
export function applyWordCompletionAttack(
  state: CombatMatchState,
  wpm: number,
  accuracy: number,
  wordIdOverride?: number
): AttackCalculationResult {
  if (state.outcome !== 'ongoing') {
    return {
      accepted: false,
      damage: 0,
      move: 'punching',
      isCritical: false,
      interruptedEnemyAttack: false,
      comboMultiplier: 1,
      nextWordCombo: state.wordCombo,
      nextOpponentHp: state.opponentHp,
      opponentDefeated: state.opponentHp <= 0,
    };
  }

  const activeWord = state.wordQueue[state.activeWordIndex];
  if (!activeWord) {
    return {
      accepted: false,
      damage: 0,
      move: 'punching',
      isCritical: false,
      interruptedEnemyAttack: false,
      comboMultiplier: 1,
      nextWordCombo: state.wordCombo,
      nextOpponentHp: state.opponentHp,
      opponentDefeated: false,
    };
  }

  if (wordIdOverride !== undefined && activeWord.wordId !== wordIdOverride) {
    return {
      accepted: false,
      damage: 0,
      move: 'punching',
      isCritical: false,
      interruptedEnemyAttack: false,
      comboMultiplier: 1,
      nextWordCombo: state.wordCombo,
      nextOpponentHp: state.opponentHp,
      opponentDefeated: false,
    };
  }

  if (activeWord.completed) {
    return {
      accepted: false,
      damage: 0,
      move: 'punching',
      isCritical: false,
      interruptedEnemyAttack: false,
      comboMultiplier: 1,
      nextWordCombo: state.wordCombo,
      nextOpponentHp: state.opponentHp,
      opponentDefeated: false,
    };
  }

  const validation = validateTypedWord(activeWord.text, state.typedBuffer);
  if (!validation.isExactMatch) {
    return {
      accepted: false,
      damage: 0,
      move: 'punching',
      isCritical: false,
      interruptedEnemyAttack: false,
      comboMultiplier: 1,
      nextWordCombo: state.wordCombo,
      nextOpponentHp: state.opponentHp,
      opponentDefeated: false,
    };
  }

  // Lock word as completed so it can NEVER award damage twice
  activeWord.completed = true;
  const wordHadErrors = activeWord.errorCount > 0;
  const nextWordCombo = wordHadErrors ? 1 : state.wordCombo + 1;

  // Interrupt enemy attack charge cleanly on exact word completion!
  const prevGauge = state.opponentAttackGauge;
  const interruptedEnemyAttack = prevGauge >= 0.65;
  state.opponentAttackGauge = 0;
  if (interruptedEnemyAttack) {
    state.interruptCount += 1;
  }

  // Advance continuous flow heat smoothly when accurate words keep flowing
  if (!wordHadErrors) {
    registerAccurateFlowStep(state, true, wpm, accuracy);
  }

  const calc = calculatePlayerAttackDamage({
    wordLength: activeWord.text.length,
    wpm,
    accuracy,
    wordCombo: nextWordCombo,
    wordHadErrors,
  });

  // Small skill bonus (+10%) for clutch late interrupts
  const finalDamage = interruptedEnemyAttack ? Math.min(64, Math.round(calc.damage * 1.1)) : calc.damage;

  state.wordCombo = nextWordCombo;
  state.maxWordCombo = Math.max(state.maxWordCombo, nextWordCombo);
  state.wordsCompleted += 1;
  state.opponentHp = Math.max(0, state.opponentHp - finalDamage);
  state.totalDamageDealt += finalDamage;
  state.typedBuffer = '';
  state.activeWordIndex += 1;
  ensureWordQueueRefilled(state);

  const opponentDefeated = state.opponentHp <= 0;
  if (opponentDefeated) {
    state.outcome = 'victory';
  }

  return {
    accepted: true,
    damage: finalDamage,
    move: calc.move,
    isCritical: calc.isCritical || interruptedEnemyAttack,
    interruptedEnemyAttack,
    comboMultiplier: calc.comboMultiplier,
    nextWordCombo,
    nextOpponentHp: state.opponentHp,
    opponentDefeated,
  };
}

// ============================================================================
// SMART AI OPPONENT DECISION ENGINE
// ============================================================================
export function evaluateAiOnMistake(state: CombatMatchState, nowMs: number): AiReactionResult {
  if (state.outcome !== 'ongoing') {
    return {
      triggered: false,
      type: 'none',
      damage: 0,
      nextPlayerHp: state.playerHp,
      playerDefeated: state.playerHp <= 0,
      grantsAdvantage: false,
      resetsCombo: false,
      callout: '',
    };
  }

  const activeWord = state.wordQueue[state.activeWordIndex];
  if (activeWord) {
    activeWord.errorCount += 1;
  }

  // Cool flow slightly on mistakes so dynamic combat difficulty adjusts responsively
  coolCombatIntensity(state, 0.1);

  const windowMs = 2800;
  state.recentMistakeTimestamps.push(nowMs);
  state.recentMistakeTimestamps = state.recentMistakeTimestamps.filter((ts) => nowMs - ts <= windowMs);

  const recentCount = state.recentMistakeTimestamps.length;
  const offCooldown = nowMs - state.lastAiAttackMs >= state.opponent.counterCooldownMs;
  const hasAdvantage = nowMs < state.aiAdvantageUntilMs;

  if (!offCooldown && recentCount < state.opponent.mistakesForHeavy) {
    return {
      triggered: true,
      type: 'block',
      damage: 0,
      nextPlayerHp: state.playerHp,
      playerDefeated: false,
      grantsAdvantage: false,
      resetsCombo: false,
      callout: 'GUARDED',
    };
  }

  if (recentCount >= state.opponent.mistakesForHeavy) {
    const rawDamage = hasAdvantage
      ? Math.round(state.opponent.heavyCounterDamage * 1.15)
      : state.opponent.heavyCounterDamage;
    const damage = Math.min(26, Math.max(4, rawDamage));
    state.playerHp = Math.max(0, state.playerHp - damage);
    state.totalDamageTaken += damage;
    state.wordCombo = 0;
    state.lastAiAttackMs = nowMs;
    state.aiAdvantageUntilMs = nowMs + 3200;
    state.recentMistakeTimestamps = [nowMs];
    coolCombatIntensity(state, 0.14);

    const playerDefeated = state.playerHp <= 0;
    if (playerDefeated) state.outcome = 'defeat';

    return {
      triggered: true,
      type: 'heavy_counter',
      damage,
      nextPlayerHp: state.playerHp,
      playerDefeated,
      grantsAdvantage: true,
      resetsCombo: true,
      callout: `COUNTER -${damage}`,
    };
  }

  const damage = Math.max(3, state.opponent.lightCounterDamage);
  state.playerHp = Math.max(0, state.playerHp - damage);
  state.totalDamageTaken += damage;
  state.wordCombo = Math.max(0, Math.floor(state.wordCombo / 2));
  state.lastAiAttackMs = nowMs;

  const playerDefeated = state.playerHp <= 0;
  if (playerDefeated) state.outcome = 'defeat';

  return {
    triggered: true,
    type: 'light_counter',
    damage,
    nextPlayerHp: state.playerHp,
    playerDefeated,
    grantsAdvantage: false,
    resetsCombo: false,
    callout: `JAB -${damage}`,
  };
}

/**
 * Evaluates whether the player has paused long enough for the AI to apply pressure.
 */
export function evaluateAiPausePressure(
  state: CombatMatchState,
  nowMs: number
): AiReactionResult & { pressureRatio: number } {
  if (state.outcome !== 'ongoing' || state.lastKeystrokeMs <= 0) {
    return {
      triggered: false,
      type: 'none',
      damage: 0,
      nextPlayerHp: state.playerHp,
      playerDefeated: false,
      grantsAdvantage: false,
      resetsCombo: false,
      callout: '',
      pressureRatio: 0,
    };
  }

  const idleMs = Math.max(0, nowMs - state.lastKeystrokeMs);
  const graceMs = state.opponent.pauseGraceMs;
  const pressureRatio = Math.min(1, idleMs / Math.max(1, graceMs));

  if (idleMs < graceMs) {
    return {
      triggered: false,
      type: 'none',
      damage: 0,
      nextPlayerHp: state.playerHp,
      playerDefeated: false,
      grantsAdvantage: false,
      resetsCombo: false,
      callout: '',
      pressureRatio,
    };
  }

  const damage = state.opponent.pressureDamage;
  state.playerHp = Math.max(0, state.playerHp - damage);
  state.totalDamageTaken += damage;
  state.wordCombo = 0;
  state.lastAiAttackMs = nowMs;
  state.lastKeystrokeMs = nowMs;
  coolCombatIntensity(state, 0.16);

  const playerDefeated = state.playerHp <= 0;
  if (playerDefeated) state.outcome = 'defeat';

  return {
    triggered: true,
    type: 'pause_pressure',
    damage,
    nextPlayerHp: state.playerHp,
    playerDefeated,
    grantsAdvantage: true,
    resetsCombo: true,
    callout: `PRESSURE -${damage}`,
    pressureRatio: 1,
  };
}

// ============================================================================
// LOCAL LEVEL PROGRESSION PERSISTENCE
// ============================================================================
export function createDefaultFightingProgress(): FightingProgressionState {
  return {
    highestUnlockedLevel: 1,
    selectedLevel: 1,
    totalWins: 0,
    totalMatches: 0,
    rollingWpm: 50,
    rollingAccuracy: 95,
    levelRecords: {},
  };
}

export function loadFightingProgress(): FightingProgressionState {
  const saved = safeStorage.getItem(FIGHTING_PROGRESS_STORAGE_KEY);
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      if (parsed && typeof parsed === 'object') {
        const base = createDefaultFightingProgress();
        return {
          ...base,
          ...parsed,
          highestUnlockedLevel: Math.max(1, Number(parsed.highestUnlockedLevel) || 1),
          selectedLevel: Math.max(
            1,
            Math.min(
              Math.max(1, Number(parsed.highestUnlockedLevel) || 1),
              Number(parsed.selectedLevel) || 1
            )
          ),
          levelRecords:
            parsed.levelRecords && typeof parsed.levelRecords === 'object' ? parsed.levelRecords : {},
        };
      }
    } catch {
      // Fall back safely
    }
  }
  return createDefaultFightingProgress();
}

export function saveFightingProgress(progress: FightingProgressionState): void {
  safeStorage.setItem(FIGHTING_PROGRESS_STORAGE_KEY, JSON.stringify(progress));
}

export function recordFightingOutcome(
  current: FightingProgressionState,
  params: { level: number; won: boolean; wpm: number; accuracy: number }
): FightingProgressionState {
  const { level, won, wpm, accuracy } = params;
  const nextTotalMatches = current.totalMatches + 1;
  const nextRollingWpm = Math.round(current.rollingWpm * 0.65 + wpm * 0.35);
  const nextRollingAcc = Number((current.rollingAccuracy * 0.65 + accuracy * 0.35).toFixed(1));

  const prevRecord = current.levelRecords[level];
  const nextRecords: Record<number, FightingLevelRecord> = {
    ...current.levelRecords,
    [level]: {
      wins: (prevRecord?.wins ?? 0) + (won ? 1 : 0),
      bestWpm: Math.max(prevRecord?.bestWpm ?? 0, wpm),
      bestAccuracy: Math.max(prevRecord?.bestAccuracy ?? 0, accuracy),
    },
  };

  const nextHighest = won
    ? Math.max(current.highestUnlockedLevel, level + 1)
    : current.highestUnlockedLevel;

  const updated: FightingProgressionState = {
    highestUnlockedLevel: nextHighest,
    selectedLevel: level,
    totalWins: current.totalWins + (won ? 1 : 0),
    totalMatches: nextTotalMatches,
    rollingWpm: nextRollingWpm,
    rollingAccuracy: nextRollingAcc,
    levelRecords: nextRecords,
  };

  saveFightingProgress(updated);
  return updated;
}
