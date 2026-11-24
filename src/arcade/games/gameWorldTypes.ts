import { ArcadeGameState, ArcadeModeId, ArenaThemeId } from '../arcadeTypes';

export interface GameWorldMeta {
  modeId: ArcadeModeId;
  gameTitle: string;
  worldSubtitle: string;
  environmentTag: string;
  objectiveHint: string;
  accentHex: string;
  secondaryHex: string;
}

export const ARCADE_GAME_WORLDS: Record<ArcadeModeId, GameWorldMeta> = {
  classic: {
    modeId: 'classic',
    gameTitle: 'Cyber-Dojo Showdown',
    worldSubtitle: '2-Character 2D Arcade Fighting Typing Game',
    environmentTag: '2D Fighting Arena',
    objectiveHint:
      'Type words above your opponent to unleash punches, kicks, and combos across progressive AI fighter levels.',
    accentHex: '#F59E0B',
    secondaryHex: '#10B981',
  },
  speed_rush: {
    modeId: 'speed_rush',
    gameTitle: 'Nitro Highway',
    worldSubtitle: '60-Second 3-Lane Arcade Turbo Racer',
    environmentTag: '2D Turbo Racer',
    objectiveHint: 'Build WPM and combos to ignite Nitro Overdrive and weave past rivals.',
    accentHex: '#F59E0B',
    secondaryHex: '#38BDF8',
  },
  accuracy_master: {
    modeId: 'accuracy_master',
    gameTitle: 'Orbital Aegis',
    worldSubtitle: 'Starfield Laser Defense & Hex-Shield Turret',
    environmentTag: '2D Orbital Shooter',
    objectiveHint: 'Blast incoming word drones with precision lasers without breaking your 5-hit shield.',
    accentHex: '#10B981',
    secondaryHex: '#34D399',
  },
  rhythm: {
    modeId: 'rhythm',
    gameTitle: 'Synthwave Pulse',
    worldSubtitle: '4-Lane Cadence Beat Highway & Equalizer',
    environmentTag: '2D Rhythm Highway',
    objectiveHint: 'Hold an even keystroke tempo to charge harmonic beat rings and equalizer waves.',
    accentHex: '#10B981',
    secondaryHex: '#F59E0B',
  },
  challenge: {
    modeId: 'challenge',
    gameTitle: 'Titan Siege',
    worldSubtitle: 'Armored Dreadnought Boss Raid & Railgun Storm',
    environmentTag: '2D Boss Raid',
    objectiveHint: 'Fire Master-tier punctuation salvos to shatter boss armor plates before time expires.',
    accentHex: '#F59E0B',
    secondaryHex: '#F43F5E',
  },
};

export interface ActiveWordState {
  currentWord: string;
  currentWordTyped: string;
  currentWordRemaining: string;
  nextWord: string;
  wordIndex: number;
  totalWords: number;
  /** Exact characters the player typed for the current word (enables red mistype rendering on canvas). */
  typedSegment?: string;
  /** True when the cursor sits directly on the space separator after completing currentWord. */
  awaitingSpace?: boolean;
  /** Up to 2 upcoming words for high-WPM lookahead inside the 2D game world. */
  upcomingWords?: string[];
  /** True if any character in typedSegment differs from currentWord. */
  hasMistype?: boolean;
}

/**
 * Deterministically extracts the active word under the typing cursor and upcoming lookahead words
 * so 2D Canvas entities stay tightly synced with the immutable passage without needing a separate paragraph box.
 */
export function extractActiveWordState(
  content: string,
  cursorIndex: number,
  typedChars?: string[]
): ActiveWordState {
  if (!content) {
    return {
      currentWord: '',
      currentWordTyped: '',
      currentWordRemaining: '',
      nextWord: '',
      wordIndex: 0,
      totalWords: 0,
      typedSegment: '',
      awaitingSpace: false,
      upcomingWords: [],
      hasMistype: false,
    };
  }

  const clamped = Math.max(0, Math.min(cursorIndex, content.length));
  const words: Array<{ text: string; start: number; end: number }> = [];

  let i = 0;
  while (i < content.length) {
    while (i < content.length && content[i] === ' ') i++;
    if (i >= content.length) break;
    const start = i;
    while (i < content.length && content[i] !== ' ') i++;
    words.push({ text: content.slice(start, i), start, end: i });
  }

  if (words.length === 0) {
    return {
      currentWord: '',
      currentWordTyped: '',
      currentWordRemaining: '',
      nextWord: '',
      wordIndex: 0,
      totalWords: 0,
      typedSegment: '',
      awaitingSpace: false,
      upcomingWords: [],
      hasMistype: false,
    };
  }

  // Locate word containing or immediately following cursorIndex
  let activeIdx = words.length - 1;
  for (let w = 0; w < words.length; w++) {
    if (clamped <= words[w].end) {
      activeIdx = w;
      break;
    }
  }

  const active = words[activeIdx];
  const typedLen = Math.max(0, Math.min(active.text.length, clamped - active.start));
  const next = words[activeIdx + 1]?.text || '';
  const next2 = words[activeIdx + 2]?.text || '';
  const upcomingWords = [next, next2].filter(Boolean);
  const awaitingSpace =
    clamped < content.length && content[clamped] === ' ' && clamped === active.end;

  const expectedTyped = active.text.slice(0, typedLen);
  const typedSegment =
    typedChars && typedChars.length >= active.start + typedLen
      ? typedChars.slice(active.start, active.start + typedLen).join('')
      : expectedTyped;

  let hasMistype = false;
  for (let k = 0; k < typedSegment.length; k++) {
    if (typedSegment[k] !== active.text[k]) {
      hasMistype = true;
      break;
    }
  }

  return {
    currentWord: active.text,
    currentWordTyped: expectedTyped,
    currentWordRemaining: active.text.slice(typedLen),
    nextWord: next,
    wordIndex: activeIdx,
    totalWords: words.length,
    typedSegment,
    awaitingSpace,
    upcomingWords,
    hasMistype,
  };
}

export function computeBossHpPercent(progress: number): number {
  const clamped = Math.max(0, Math.min(1, progress));
  return Math.max(0, Math.round((1 - clamped) * 100));
}

export function computeNitroSpeedKmh(wpm: number, combo: number, isPlaying: boolean): number {
  if (!isPlaying) return 0;
  const base = 75 + Math.min(165, wpm * 1.45);
  const nitroBonus = combo >= 40 ? 45 : combo >= 20 ? 28 : combo >= 10 ? 14 : 0;
  return Math.round(Math.min(320, base + nitroBonus));
}

export type GameBridgeEventType =
  | 'key_hit'
  | 'key_miss'
  | 'word_clear'
  | 'shield_break'
  | 'victory';

export interface GameBridgeEvent {
  type: GameBridgeEventType;
  word?: string;
  combo?: number;
  wpm?: number;
}

export interface GameVisualBridge {
  mode: ArcadeModeId;
  gameState: ArcadeGameState;
  waitingFirstKey: boolean;
  countdownValue: number;
  arenaTheme: ArenaThemeId;
  wpm: number;
  accuracy: number;
  progress: number;
  combo: number;
  errors: number;
  errorBudget: number | null;
  rhythmScore: number;
  activeWord: ActiveWordState;
  events: GameBridgeEvent[];
}
