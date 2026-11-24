import { SessionResult, UserStats, GrowthProfile } from '../types';

export interface GrowthStageMeta {
  level: number;
  name: string;
  subhead: string;
  icon: string;
  color: string;
  minXp: number;
  bloomTitle: string;
}

export const GROWTH_STAGES: GrowthStageMeta[] = [
  {
    level: 1,
    name: 'Dormant Seedling',
    subhead: 'Planted in fertile soil, ready to sprout',
    icon: '🌱',
    color: '#10B981',
    minXp: 0,
    bloomTitle: 'First Sprout'
  },
  {
    level: 2,
    name: 'Tender Sprout',
    subhead: 'Sprouting two vibrant leaves towards the light',
    icon: '🌿',
    color: '#34D399',
    minXp: 100,
    bloomTitle: 'Stem Growth'
  },
  {
    level: 3,
    name: 'Branching Sapling',
    subhead: 'Sturdy stems and expanding touch typing canopy',
    icon: '🍃',
    color: '#2DD4BF',
    minXp: 250,
    bloomTitle: 'Branching Canopy'
  },
  {
    level: 4,
    name: 'Flourishing Bonsai',
    subhead: 'Lush green foliage and budding master blossoms',
    icon: '🌾',
    color: '#6366F1',
    minXp: 500,
    bloomTitle: 'Flower Buds'
  },
  {
    level: 5,
    name: 'Radiant Bloom Tree',
    subhead: 'Abundant golden flowers and effortless typing flow',
    icon: '🌸',
    color: '#EC4899',
    minXp: 900,
    bloomTitle: 'Full Bloom'
  },
  {
    level: 6,
    name: 'Master Evergreen Canopy',
    subhead: 'Legendary mastery, deep roots, and lightning velocity',
    icon: '🌳',
    color: '#F59E0B',
    minXp: 1500,
    bloomTitle: 'Evergreen Mastery'
  },
  {
    level: 7,
    name: 'Crystal Lotus Banyan',
    subhead: 'Bioluminescent prism roots and crystalline lotus blossoms',
    icon: '🪷',
    color: '#06B6D4',
    minXp: 2300,
    bloomTitle: 'Prism Roots'
  },
  {
    level: 8,
    name: 'Astral Starlight Sequoia',
    subhead: 'Towering twilight canopy woven with orbiting starlight',
    icon: '✨',
    color: '#818CF8',
    minXp: 3300,
    bloomTitle: 'Starlight Crown'
  },
  {
    level: 9,
    name: 'Solar Phoenix Sakura',
    subhead: 'Radiant sunfire blossoms and golden harmonic flow',
    icon: '🌺',
    color: '#FB7185',
    minXp: 4600,
    bloomTitle: 'Sunfire Blossom'
  },
  {
    level: 10,
    name: 'World Tree Yggdrasil',
    subhead: 'Mythic cosmic sovereign uniting earth, stars, and light',
    icon: '👑',
    color: '#FBBF24',
    minXp: 6200,
    bloomTitle: 'Apex Sovereign'
  }
];

export function calculateGrowthProfile(
  stats?: Partial<UserStats> | null,
  sessionHistory: SessionResult[] = []
): GrowthProfile {
  const dewdrops = Math.max(0, Number(stats?.xp) || 0);
  const historyList = Array.isArray(sessionHistory) ? sessionHistory : [];
  const completedLessonResults = historyList.filter(s => s && s.type === 'lesson' && s.passed);
  const uniqueBlooms = new Set(completedLessonResults.map(s => s.itemId)).size;

  let currentStageIndex = 0;
  for (let i = 0; i < GROWTH_STAGES.length; i++) {
    if (dewdrops >= GROWTH_STAGES[i].minXp) {
      currentStageIndex = i;
    }
  }

  const currentStage = GROWTH_STAGES[currentStageIndex];
  const isMaxStage = currentStageIndex >= GROWTH_STAGES.length - 1;
  const nextStage = isMaxStage ? currentStage : GROWTH_STAGES[currentStageIndex + 1];

  const currentMin = currentStage.minXp;
  const nextMin = nextStage.minXp;
  const range = Math.max(nextMin - currentMin, 1);
  const progressPercent = isMaxStage
    ? 100
    : Math.min(Math.round(((dewdrops - currentMin) / range) * 100), 100);
  const xpToNextStage = isMaxStage ? 0 : Math.max(0, nextMin - dewdrops);

  return {
    stageName: currentStage.name,
    stageLevel: currentStage.level,
    totalStages: GROWTH_STAGES.length,
    dewdrops,
    totalBlooms: uniqueBlooms,
    currentStageMinXp: currentMin,
    nextStageThreshold: nextMin,
    nextStageLevel: nextStage.level,
    nextStageName: nextStage.name,
    xpToNextStage,
    isMaxStage,
    progressPercent: Math.max(progressPercent, 0)
  };
}

export function getLessonCompletionMeta(
  lessonId: string,
  lessonTitle: string,
  sessionHistory: SessionResult[] = []
) {
  const historyList = Array.isArray(sessionHistory) ? sessionHistory : [];
  // Find all passed runs for this lesson
  const matches = historyList.filter(s => 
    s && s.type === 'lesson' && (s.itemId === lessonId || s.title === lessonTitle || s.itemId === lessonTitle) && s.passed
  );

  if (matches.length === 0) {
    return {
      isCompleted: false,
      leaves: 0,
      bestWpm: 0,
      bestAccuracy: 0,
      runsCount: 0
    };
  }

  const bestWpm = Math.max(...matches.map(m => m.wpm));
  const bestAccuracy = Math.max(...matches.map(m => m.accuracy));
  
  // 1-3 leaf rating
  let leaves = 1;
  if (bestAccuracy >= 96 && bestWpm >= 30) {
    leaves = 3;
  } else if (bestAccuracy >= 92) {
    leaves = 2;
  }

  return {
    isCompleted: true,
    leaves,
    bestWpm,
    bestAccuracy,
    runsCount: matches.length
  };
}

export interface ArcadeSessionLike {
  id: string;
  mode: string;
  wpm: number;
  rawWpm: number;
  accuracy: number;
  errorCount: number;
  durationMs: number;
  xpEarned: number;
  isDailyChallenge?: boolean;
  validationStatus?: 'pending' | 'valid' | 'flagged' | 'rejected';
  completedAt: string;
  keystrokeLog?: Array<{
    expected: string;
    correct: boolean;
    isBackspace?: boolean;
  }>;
}

/**
 * Extracts per-character missed key counts from an Arcade keystroke log so
 * Arcade mistakes automatically feed the shared Tricky Keys remediation engine.
 */
export function extractMissedKeysFromKeystrokes(
  keystrokeLog?: Array<{ expected: string; correct: boolean; isBackspace?: boolean }>
): Record<string, number> {
  const missed: Record<string, number> = {};
  if (!Array.isArray(keystrokeLog)) return missed;
  for (const evt of keystrokeLog) {
    if (!evt || evt.correct || evt.isBackspace) continue;
    const expected = typeof evt.expected === 'string' ? evt.expected : '';
    if (expected && expected.trim() !== '') {
      missed[expected] = (missed[expected] || 0) + 1;
    }
  }
  return missed;
}

/**
 * Converts a completed Typing Arcade run into a unified SessionResult for
 * shared Performance Analytics, History, and weak-key remediation.
 */
export function arcadeSessionToSessionResult(
  session: ArcadeSessionLike,
  gameTitle: string
): SessionResult {
  const missedKeys = extractMissedKeysFromKeystrokes(session.keystrokeLog);
  return {
    id: session.id,
    type: 'arcade',
    itemId: `arcade-${session.mode}`,
    title: session.isDailyChallenge ? `${gameTitle} (Daily)` : gameTitle,
    wpm: Math.round(session.wpm),
    rawWpm: Math.round(session.rawWpm),
    accuracy: Math.round(session.accuracy),
    errors: Math.max(0, Math.round(session.errorCount)),
    durationSeconds: Math.max(1, Math.round(session.durationMs / 1000)),
    completedAt: session.completedAt,
    passed: session.accuracy >= 90 && session.validationStatus !== 'rejected',
    missedKeys: Object.keys(missedKeys).length > 0 ? missedKeys : undefined,
  };
}

/**
 * Computes updated unified UserStats after any Courses or Arcade session completes,
 * sharing Growth XP, daily streak, total practice time, weak keys, and rolling averages
 * while keeping lessonsCompleted strictly scoped to passed core curriculum lessons.
 */
export function applyUnifiedSessionStats(
  prevStats: UserStats,
  updatedHistory: SessionResult[],
  result: SessionResult,
  xpEarned: number,
  streakInfo: { streak: number; today: string },
  overrideWeakKeys?: Record<string, number>
): UserStats {
  const totalWpm = updatedHistory.reduce((sum, s) => sum + s.wpm, 0);
  const totalAcc = updatedHistory.reduce((sum, s) => sum + s.accuracy, 0);
  const avgWpm = updatedHistory.length > 0 ? Math.round(totalWpm / updatedHistory.length) : prevStats.avgWpm;
  const avgAccuracy = updatedHistory.length > 0 ? Math.round(totalAcc / updatedHistory.length) : prevStats.avgAccuracy;
  const uniquePassedLessons = new Set(
    updatedHistory
      .filter((s) => s.type === 'lesson' && s.passed && !s.remediationTargetKeys?.length)
      .map((s) => s.itemId)
  ).size;

  let nextWeakKeys: Record<string, number>;
  if (overrideWeakKeys) {
    nextWeakKeys = overrideWeakKeys;
  } else {
    nextWeakKeys = { ...(prevStats.weakKeys || {}) };
    if (result.missedKeys) {
      Object.entries(result.missedKeys).forEach(([key, count]) => {
        if (key && key.trim() !== '') {
          nextWeakKeys[key] = (nextWeakKeys[key] || 0) + count;
        }
      });
    }
  }

  return {
    ...prevStats,
    xp: prevStats.xp + Math.max(0, Math.round(xpEarned)),
    streak: streakInfo.streak,
    lastPracticeDate: streakInfo.today,
    lessonsCompleted: uniquePassedLessons,
    avgWpm,
    avgAccuracy,
    totalPracticeTimeSeconds:
      prevStats.totalPracticeTimeSeconds + Math.max(1, Math.round(result.durationSeconds || 1)),
    weakKeys: nextWeakKeys,
  };
}

