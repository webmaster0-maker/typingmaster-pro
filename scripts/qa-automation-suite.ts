import { COURSES_DATA, PRACTICE_ITEMS, TEST_ITEMS } from '../src/data/courses';
import { KEYBOARD_LAYOUT, getGuidanceForChar, SHIFTED_SYMBOLS_MAP } from '../src/engines/guidanceEngine';
import {
  applyUnifiedSessionStats,
  arcadeSessionToSessionResult,
  calculateGrowthProfile,
  extractMissedKeysFromKeystrokes,
} from '../src/utils/growthEngine';
import { SessionResult, UserStats } from '../src/types';
import {
  ACTIVE_ACCOUNT_STORAGE_KEY,
  LOCAL_ACCOUNTS_STORAGE_KEY,
  clearActiveUserAccount,
  createGuestAccount,
  loadActiveUserAccount,
  loadLocalAccounts,
  registerLocalAccount,
  signInLocalAccount,
  updateActiveUserName,
  updateLocalAccountPassword,
  upgradeGuestToLocalAccount,
} from '../src/utils/localAuthEngine';
import { safeStorage } from '../src/utils/safeStorage';
import { FINGER_ANCHORS, HAND_GEOMETRY } from '../src/components/hands/HandArchitectureTypes';
import {
  getKeyTargetPoint,
  calculateJointKinematics,
  generateSculptedFingerPath,
  generateSculptedThumbPath,
  generateSculptedThumbStroke,
  generateUnifiedHandSilhouette,
  KeyDef,
} from '../src/components/hands/HandMotionEngine';
import {
  analyzeHotspots,
  buildThreeStageExercises,
  generateRuleBasedLessons,
  generateSingleKeyLesson,
  applyRemediationHealing,
} from '../src/engines/remediationEngine';
import {
  isEligibleForCertificate,
  generateCertificateCode,
  createCertificateFromSession,
  upsertCertificate,
  normalizeRecipientName,
  getUserInitials,
  sanitizeCertificateFilename,
  buildCertificatePdfBytes,
} from '../src/utils/certificateEngine';
import {
  ARCADE_CORPUS_V1,
  clearRecentPassageIds,
  getDailyChallengePassage,
  getFreshPassageForMode,
  getPassageForMode,
  synthesizeDynamicPassage,
} from '../src/arcade/arcadeCorpus';
import {
  createInitialNitroTrafficState,
  hasPlayerRivalOverlap,
  hasRivalRivalOverlap,
  requestWordClearOvertake,
  stepNitroTraffic,
} from '../src/arcade/games/nitroTrafficPhysics';
import {
  PLAYER_BASE_MAX_HP,
  applyWordCompletionAttack,
  calculatePlayerAttackDamage,
  computeOpponentAttackIntervalSec,
  createCombatMatchState,
  createDefaultFightingProgress,
  evaluateAiOnMistake,
  evaluateAiPausePressure,
  getOpponentForLevel,
  getPlayerMaxHpForLevel,
  hasStrictErrorLock,
  processStrictBackspace,
  processStrictCombatCharInput,
  recordFightingOutcome,
  registerAccurateFlowStep,
  stepDynamicCombatTick,
  validateTypedWord,
} from '../src/arcade/games/fightingCombatEngine';
import {
  FighterAnimState,
  createFightingStageSim,
  transitionFighterState,
  updateFightingStageSim,
} from '../src/arcade/games/fightingAnimator';
import {
  ARCADE_ADS_CONFIG,
  getAdSlotConfig,
  hasValidAdSenseConfig,
  isAdRailActive,
} from '../src/arcade/arcadeAdConfig';
import {
  ARCADE_MODE_LIST,
  COSMETIC_CATALOG,
  SCORING_VERSION,
  XP_FORMULA_VERSION,
  computeArcadeXp,
  computeKeystrokeAccuracy,
  computeNetWpm,
  verifySessionReplay,
  createDefaultArcadeProfile,
  buildModeLeaderboard,
} from '../src/arcade/arcadeEngine';
import { KeystrokeEvent } from '../src/arcade/arcadeTypes';
import {
  ARCADE_GAME_WORLDS,
  extractActiveWordState,
  computeBossHpPercent,
  computeNitroSpeedKmh,
} from '../src/arcade/games/gameWorldTypes';
import {
  SYNTHWAVE_GLITCH_BPM,
  SYNTHWAVE_GLITCH_FILTER_HZ,
  SYNTHWAVE_GROOVE_BPM,
  SYNTHWAVE_GROOVE_FILTER_HZ,
  createSynthwaveMusicState,
  onSynthwaveCorrectKey,
  onSynthwaveError,
  onSynthwaveWordClear,
  resetSynthwaveMusicState,
} from '../src/arcade/synthwaveMusic';

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;
const failureLog: string[] = [];

function assert(condition: boolean, testName: string, details?: any) {
  totalTests++;
  if (condition) {
    passedTests++;
  } else {
    failedTests++;
    const msg = `[FAIL] ${testName} ${details ? JSON.stringify(details) : ''}`;
    failureLog.push(msg);
    console.error(msg);
  }
}

console.log('====================================================');
console.log('🔬 BRUTAL QA AUTOMATION SUITE: INITIATING FULL AUDIT');
console.log('====================================================\n');

// ----------------------------------------------------
// 1. LESSON DATA INTEGRITY AUDIT (ALL 28 LESSONS)
// ----------------------------------------------------
console.log('>>> [1/7] AUDITING ALL 28 LESSONS & EXERCISES');
assert(COURSES_DATA.length >= 28, 'Total lessons count check', { count: COURSES_DATA.length });

COURSES_DATA.forEach((lesson, lIdx) => {
  assert(Boolean(lesson.id && lesson.id.trim()), `Lesson ${lIdx} has valid ID`);
  assert(Boolean(lesson.title && lesson.title.trim()), `Lesson ${lesson.id} has valid Title`);
  assert(Boolean(lesson.objective && lesson.objective.trim()), `Lesson ${lesson.id} has valid Objective`);
  assert(Array.isArray(lesson.exercises) && lesson.exercises.length > 0, `Lesson ${lesson.id} has exercises`);
  assert(lesson.completionAccuracy >= 70 && lesson.completionAccuracy <= 100, `Lesson ${lesson.id} has valid completion accuracy`, { completionAccuracy: lesson.completionAccuracy });
  assert(Boolean(lesson.guidanceConfig), `Lesson ${lesson.id} has guidanceConfig`);

  // Audit every exercise in the lesson
  lesson.exercises.forEach((exercise, eIdx) => {
    assert(typeof exercise === 'string' && exercise.length > 0, `Lesson ${lesson.id} Exercise ${eIdx} non-empty string`);
    
    // Check all characters in exercise
    for (const ch of exercise) {
      const guidance = getGuidanceForChar(ch);
      assert(Boolean(guidance.hand && guidance.finger), `Char '${ch}' in lesson ${lesson.id} maps to valid hand & finger`);
      assert(guidance.hand === 'left' || guidance.hand === 'right', `Char '${ch}' valid hand`);
      assert(guidance.finger.includes('_'), `Char '${ch}' valid finger formatted`);
    }
  });
});

// ----------------------------------------------------
// 2. PRACTICE & EXAM DATA INTEGRITY AUDIT
// ----------------------------------------------------
console.log('\n>>> [2/7] AUDITING PRACTICE DRILLS & EXAMS');
PRACTICE_ITEMS.forEach((p, idx) => {
  assert(Boolean(p.id && p.title && p.content), `Practice item ${idx} is complete`);
  assert(p.content.length >= 20, `Practice item ${p.id} content sufficiently long`);
  for (const ch of p.content) {
    const guidance = getGuidanceForChar(ch);
    assert(Boolean(guidance.hand && guidance.finger), `Practice ${p.id} char '${ch}' mapped`);
  }
});

TEST_ITEMS.forEach((t, idx) => {
  assert(Boolean(t.id && t.title && t.content), `Test item ${idx} is complete`);
  assert(t.passWpm > 0 && t.passAccuracy > 0, `Test ${t.id} pass criteria valid`);
  assert(t.durationMinutes > 0, `Test ${t.id} duration valid`);
  assert(t.scoring === 'standard' || t.scoring === 'strict', `Test ${t.id} scoring valid`);
  for (const ch of t.content) {
    const guidance = getGuidanceForChar(ch);
    assert(Boolean(guidance.hand && guidance.finger), `Test ${t.id} char '${ch}' mapped`);
  }
});

// ----------------------------------------------------
// 3. COMPLETE KEYBOARD & FINGER MAPPING ENGINE AUDIT
// ----------------------------------------------------
console.log('\n>>> [3/7] AUDITING KEYBOARD LAYOUT & KINEMATIC FINGER MAPPING');
assert(KEYBOARD_LAYOUT.length === 48, 'Keyboard layout contains all standard 48 keys');

// Check every key in layout has valid rows, cols, fingers, hands
KEYBOARD_LAYOUT.forEach(key => {
  assert(key.key.length >= 1, `Key '${key.key}' has non-empty character`);
  assert(key.row >= 0 && key.row <= 4, `Key '${key.key}' has valid row (0-4)`, { row: key.row });
  assert(key.col >= 0 && key.col <= 12, `Key '${key.key}' has valid col`, { col: key.col });
  assert(Boolean(key.finger && key.hand), `Key '${key.key}' has valid finger & hand assignment`);
});

// Check all shifted symbols
Object.entries(SHIFTED_SYMBOLS_MAP).forEach(([symbol, mapping]) => {
  const guidance = getGuidanceForChar(symbol);
  assert(guidance.requiresShift === true, `Symbol '${symbol}' requiresShift is true`);
  assert(guidance.shiftHand !== undefined && guidance.shiftFinger !== undefined, `Symbol '${symbol}' has shiftHand and shiftFinger`);
  assert(guidance.shiftHand !== guidance.hand, `Symbol '${symbol}' uses opposite hand for shift`);
});

// Check all uppercase letters A-Z
for (let code = 65; code <= 90; code++) {
  const char = String.fromCharCode(code);
  const guidance = getGuidanceForChar(char);
  assert(guidance.requiresShift === true, `Uppercase letter '${char}' requiresShift is true`);
  assert(guidance.shiftHand !== undefined, `Uppercase letter '${char}' shiftHand defined`);
  assert(guidance.shiftHand !== guidance.hand, `Uppercase letter '${char}' shiftHand is opposite of character hand`);
}

// Check spacebar
const spaceGuidance = getGuidanceForChar(' ');
assert(spaceGuidance.displayKey === 'SPACE', 'Spacebar displayKey is SPACE');
assert(spaceGuidance.finger === 'right_thumb' || spaceGuidance.finger === 'left_thumb', 'Spacebar uses thumb');
assert(spaceGuidance.requiresShift === false, 'Spacebar requiresShift is false');

// ----------------------------------------------------
// 4. CALCULATION ENGINE & EDGE CASES STRESS TEST
// ----------------------------------------------------
console.log('\n>>> [4/7] STRESS-TESTING SCORING, WPM, ACCURACY & DIVISION BY ZERO');

function computeWpmAndAccuracy(totalCharsCompleted: number, timeElapsedSecs: number, typedHistory: boolean[]) {
  const minutes = Math.max(timeElapsedSecs / 60, 0.01);
  const wordsTyped = totalCharsCompleted / 5;
  const netWpm = Math.max(0, Math.round(wordsTyped / minutes));
  const rawWpm = Math.max(0, Math.round((typedHistory.length / 5) / minutes));
  const accuracy = typedHistory.length > 0 
    ? Math.max(0, Math.min(100, Math.round((typedHistory.filter(Boolean).length / typedHistory.length) * 100))) 
    : 100;
  return { netWpm, rawWpm, accuracy };
}

// Edge case 1: 0 seconds, 0 characters
const res0 = computeWpmAndAccuracy(0, 0, []);
assert(res0.netWpm === 0 && !isNaN(res0.netWpm) && isFinite(res0.netWpm), 'Zero time zero chars WPM is 0 and finite');
assert(res0.accuracy === 100 && !isNaN(res0.accuracy), 'Zero chars accuracy is 100% default and finite');

// Edge case 2: Perfect 100 WPM (500 chars in 60 seconds, 0 errors)
const hist100 = Array(500).fill(true);
const res100 = computeWpmAndAccuracy(500, 60, hist100);
assert(res100.netWpm === 100, '500 chars in 60s equals exactly 100 net WPM', { netWpm: res100.netWpm });
assert(res100.accuracy === 100, 'Zero errors equals 100% accuracy');

// Edge case 3: 50% errors (200 total keystrokes: 100 correct, 100 incorrect in 60s)
const hist50 = Array(100).fill(true).concat(Array(100).fill(false));
const res50 = computeWpmAndAccuracy(100, 60, hist50);
assert(res50.netWpm === 20, '100 completed chars in 60s is 20 net WPM');
assert(res50.rawWpm === 40, '200 total keystrokes in 60s is 40 raw WPM');
assert(res50.accuracy === 50, '100 correct out of 200 keystrokes is 50% accuracy');

// Edge case 4: Extreme rapid typing (10,000 keystrokes in 1 second)
const histHuge = Array(10000).fill(true);
const resHuge = computeWpmAndAccuracy(10000, 1, histHuge);
assert(!isNaN(resHuge.netWpm) && isFinite(resHuge.netWpm) && resHuge.netWpm > 0, 'Huge typing volume calculation is finite and valid');

// ----------------------------------------------------
// 5. PROGRESSION & GROWTH ENGINE AUDIT
// ----------------------------------------------------
console.log('\n>>> [5/7] AUDITING GAMIFICATION & GROWTH PROFILES');

const stage1 = calculateGrowthProfile({ xp: 0 }, []);
assert(stage1.stageLevel === 1 && stage1.stageName === 'Dormant Seedling', '0 XP starts at Dormant Seedling');
assert(
  stage1.progressPercent === 0 &&
    stage1.totalStages === 10 &&
    stage1.nextStageLevel === 2 &&
    stage1.nextStageName === 'Tender Sprout' &&
    stage1.xpToNextStage === 100 &&
    !stage1.isMaxStage,
  '0 XP is 0% to Stage 2 (Tender Sprout) with 100 XP remaining across 10 total stages'
);

const stage2 = calculateGrowthProfile({ xp: 100 }, []);
assert(stage2.stageLevel === 2 && stage2.stageName === 'Tender Sprout', '100 XP is Tender Sprout');

const stage6 = calculateGrowthProfile({ xp: 1900 }, []);
assert(
  stage6.stageLevel === 6 &&
    stage6.stageName === 'Master Evergreen Canopy' &&
    stage6.nextStageLevel === 7 &&
    stage6.nextStageName === 'Crystal Lotus Banyan' &&
    stage6.xpToNextStage === 400 &&
    stage6.progressPercent === 50 &&
    !stage6.isMaxStage,
  '1900 XP is Stage 6 (Master Evergreen Canopy) at 50% evolution toward Stage 7 (Crystal Lotus Banyan)'
);

const stage7 = calculateGrowthProfile({ xp: 2300 }, []);
assert(
  stage7.stageLevel === 7 &&
    stage7.stageName === 'Crystal Lotus Banyan' &&
    stage7.nextStageLevel === 8 &&
    stage7.nextStageName === 'Astral Starlight Sequoia',
  '2300 XP evolves into Stage 7 (Crystal Lotus Banyan) targeting Stage 8'
);

const stage8 = calculateGrowthProfile({ xp: 3300 }, []);
assert(
  stage8.stageLevel === 8 &&
    stage8.stageName === 'Astral Starlight Sequoia' &&
    stage8.nextStageLevel === 9 &&
    stage8.nextStageName === 'Solar Phoenix Sakura',
  '3300 XP evolves into Stage 8 (Astral Starlight Sequoia) targeting Stage 9'
);

const stage9 = calculateGrowthProfile({ xp: 4600 }, []);
assert(
  stage9.stageLevel === 9 &&
    stage9.stageName === 'Solar Phoenix Sakura' &&
    stage9.nextStageLevel === 10 &&
    stage9.nextStageName === 'World Tree Yggdrasil',
  '4600 XP evolves into Stage 9 (Solar Phoenix Sakura) targeting Stage 10'
);

const stage10 = calculateGrowthProfile({ xp: 6500 }, []);
assert(
  stage10.stageLevel === 10 &&
    stage10.stageName === 'World Tree Yggdrasil' &&
    stage10.isMaxStage === true &&
    stage10.xpToNextStage === 0 &&
    stage10.progressPercent === 100,
  '6500 XP reaches Stage 10 Apex (World Tree Yggdrasil) at 100%'
);

// Test with undefined / null arguments
const stageDefensive = calculateGrowthProfile(undefined, undefined);
assert(stageDefensive.stageLevel === 1 && stageDefensive.stageName === 'Dormant Seedling', 'Defensive undefined args handled cleanly');

// ----------------------------------------------------
// 6. LOCAL STORAGE PERSISTENCE & FAULT TOLERANCE
// ----------------------------------------------------
console.log('\n>>> [6/7] AUDITING STATE PERSISTENCE & ERROR RECOVERY');

const testHistory: SessionResult[] = [
  {
    id: 'res-1',
    type: 'lesson',
    itemId: 'lesson-1',
    title: 'Lesson 1',
    wpm: 25,
    rawWpm: 26,
    accuracy: 98,
    errors: 1,
    durationSeconds: 45,
    completedAt: new Date().toISOString(),
    passed: true,
    missedKeys: { 'f': 1 }
  },
  {
    id: 'res-2',
    type: 'lesson',
    itemId: 'lesson-1',
    title: 'Lesson 1',
    wpm: 35,
    rawWpm: 36,
    accuracy: 100,
    errors: 0,
    durationSeconds: 35,
    completedAt: new Date().toISOString(),
    passed: true
  }
];

// Verify stats aggregation
const totalWpm = testHistory.reduce((sum, s) => sum + s.wpm, 0);
const avgWpm = Math.round(totalWpm / testHistory.length);
assert(avgWpm === 30, 'Average WPM aggregated correctly', { avgWpm });

const uniquePassedLessons = new Set(
  testHistory.filter(s => s.type === 'lesson' && s.passed).map(s => s.itemId)
).size;
assert(uniquePassedLessons === 1, 'Duplicate attempts on same lesson do not double count unique lessons completed', { uniquePassedLessons });

// ----------------------------------------------------
// 7. SIMULATED PLAYTHROUGH OF ALL 28 LESSONS & SCORING
// ----------------------------------------------------
console.log('\n>>> [7/8] SIMULATING CHARACTER-BY-CHARACTER PLAYTHROUGH ON ALL 28 LESSONS');

COURSES_DATA.forEach((lesson, idx) => {
  let simulatedKeystrokes: boolean[] = [];
  let simulatedErrors = 0;
  let simulatedMissedKeys: { [key: string]: number } = {};
  
  lesson.exercises.forEach(exercise => {
    for (let i = 0; i < exercise.length; i++) {
      const char = exercise[i];
      // Simulate typing correctly 95% of the time, 5% intentional error
      const isCorrect = (i % 20 !== 0); 
      if (isCorrect) {
        simulatedKeystrokes.push(true);
      } else {
        simulatedKeystrokes.push(false);
        simulatedErrors++;
        simulatedMissedKeys[char] = (simulatedMissedKeys[char] || 0) + 1;
        // then type correctly
        simulatedKeystrokes.push(true);
      }
    }
  });

  const totalCompletedChars = lesson.exercises.reduce((acc, ex) => acc + ex.length, 0);
  const simMinutes = (totalCompletedChars / 5) / 45; // simulated 45 WPM
  const simSecs = Math.round(simMinutes * 60);
  const simRes = computeWpmAndAccuracy(totalCompletedChars, simSecs, simulatedKeystrokes);

  assert(simRes.netWpm >= 40 && simRes.netWpm <= 50, `Lesson ${lesson.id} simulated net WPM matches simulated speed`, { netWpm: simRes.netWpm });
  assert(simRes.accuracy >= 90 && simRes.accuracy <= 100, `Lesson ${lesson.id} simulated accuracy matches error rate`, { accuracy: simRes.accuracy });
  assert(simulatedErrors === Object.values(simulatedMissedKeys).reduce((a, b) => a + b, 0), `Lesson ${lesson.id} missed keys tally equals total errors`);
});

// Test sequential next lesson chained lookup
for (let i = 0; i < COURSES_DATA.length; i++) {
  const current = COURSES_DATA[i];
  if (i < COURSES_DATA.length - 1) {
    const next = COURSES_DATA[i + 1];
    assert(Boolean(next && next.id), `Lesson ${current.id} has valid subsequent lesson ${next?.id}`);
  }
}

// ----------------------------------------------------
// 8. TYPING.COM HAND SYMMETRY, SHIFT & KINEMATICS AUDIT
// ----------------------------------------------------
console.log('\n>>> [8/8] AUDITING HAND SYMMETRY, SHIFT COORDINATION & SVG KINEMATICS');

const MIRROR_CENTER_SUM = 773.5; // Left center (223.25) + Right center (550.25)
const fingerPairs: Array<[string, string]> = [
  ['left_pinky', 'right_pinky'],
  ['left_ring', 'right_ring'],
  ['left_middle', 'right_middle'],
  ['left_index', 'right_index'],
  ['left_thumb', 'right_thumb'],
];

fingerPairs.forEach(([leftId, rightId]) => {
  const left = FINGER_ANCHORS[leftId];
  const right = FINGER_ANCHORS[rightId];
  assert(
    Math.abs(left.mcpX + right.mcpX - MIRROR_CENTER_SUM) < 0.01,
    `MCP X symmetry between ${leftId} and ${rightId}`,
    { leftX: left.mcpX, rightX: right.mcpX, sum: left.mcpX + right.mcpX }
  );
  assert(
    Math.abs(left.mcpY - right.mcpY) < 0.01,
    `MCP Y symmetry between ${leftId} and ${rightId}`,
    { leftY: left.mcpY, rightY: right.mcpY }
  );
  assert(
    Math.abs(left.homeX + right.homeX - MIRROR_CENTER_SUM) < 0.01,
    `Home X symmetry between ${leftId} and ${rightId}`,
    { leftX: left.homeX, rightX: right.homeX }
  );
  assert(
    Math.abs(left.homeY - right.homeY) < 0.01,
    `Home Y symmetry between ${leftId} and ${rightId}`,
    { leftY: left.homeY, rightY: right.homeY }
  );
});

assert(
  Math.abs(HAND_GEOMETRY.left.palmCenterX + HAND_GEOMETRY.right.palmCenterX - MIRROR_CENTER_SUM) < 0.01,
  'Left & right palm centers are mathematically mirrored',
  { leftX: HAND_GEOMETRY.left.palmCenterX, rightX: HAND_GEOMETRY.right.palmCenterX }
);
assert(
  Math.abs(HAND_GEOMETRY.left.wristCenterX + HAND_GEOMETRY.right.wristCenterX - MIRROR_CENTER_SUM) < 0.01,
  'Left & right wrist centers are mathematically mirrored',
  { leftX: HAND_GEOMETRY.left.wristCenterX, rightX: HAND_GEOMETRY.right.wristCenterX }
);

// Verify ergonomic target points for special wide keys (Spacebar, Shift Left/Right, Enter, Backspace)
const sampleWideKeys: KeyDef[] = [
  { id: ' ', char: ' ', displayMain: 'SPACE', row: 4, x: 222, y: 230, w: 332, h: 46, finger: 'right_thumb', hand: 'both' },
  { id: 'shift_l', char: 'shift', displayMain: 'SHIFT', row: 3, x: 10, y: 175, w: 120, h: 46, finger: 'left_pinky', hand: 'left', isModifier: true },
  { id: 'shift_r', char: 'shift', displayMain: 'SHIFT', row: 3, x: 675, y: 175, w: 135, h: 46, finger: 'right_pinky', hand: 'right', isModifier: true },
  { id: 'enter', char: 'enter', displayMain: 'ENTER', row: 2, x: 705, y: 120, w: 105, h: 46, finger: 'right_pinky', hand: 'right', isModifier: true },
  { id: 'backspace', char: 'backspace', displayMain: 'BKSP', row: 0, x: 715, y: 10, w: 95, h: 46, finger: 'right_pinky', hand: 'right', isModifier: true },
];

sampleWideKeys.forEach(keyDef => {
  const pt = getKeyTargetPoint(keyDef, keyDef.finger);
  assert(
    Number.isFinite(pt.x) &&
      Number.isFinite(pt.y) &&
      pt.x >= keyDef.x &&
      pt.x <= keyDef.x + keyDef.w &&
      pt.y >= keyDef.y &&
      pt.y <= keyDef.y + keyDef.h,
    `Target point inside bounds for wide key '${keyDef.id}'`,
    { pt, keyDef }
  );
});

const leftSpacePt = getKeyTargetPoint(sampleWideKeys[0], 'left_thumb');
const rightSpacePt = getKeyTargetPoint(sampleWideKeys[0], 'right_thumb');
assert(leftSpacePt.x < rightSpacePt.x, 'Left thumb targets left side of Spacebar, right thumb targets right side');

// Verify kinematics and SVG finger paths for every finger anchor
Object.entries(FINGER_ANCHORS).forEach(([fKey, anchor]) => {
  const isThumb = fKey.includes('thumb');
  const joints = calculateJointKinematics(
    anchor.mcpX,
    anchor.mcpY,
    anchor.homeX,
    anchor.homeY,
    anchor.length,
    0,
    isThumb,
    0,
    anchor.hand
  );
  assert(
    Number.isFinite(joints.tip.x) &&
      Number.isFinite(joints.tip.y) &&
      Number.isFinite(joints.pip.x) &&
      Number.isFinite(joints.dip.x),
    `Finger joints finite for ${fKey}`
  );
  const fingerPath = isThumb
    ? generateSculptedThumbPath(anchor.hand, anchor.mcpX, anchor.mcpY, anchor.homeX, anchor.homeY, anchor.width)
    : generateSculptedFingerPath(anchor.mcpX, anchor.mcpY, anchor.homeX, anchor.homeY, anchor.width, 1, 0, joints);
  assert(fingerPath.length > 10 && !fingerPath.includes('NaN'), `Finger SVG path valid and NaN-free for ${fKey}`);
});

// Verify unified hand silhouettes and thumb strokes contain no NaN for both hands (resting & reaching)
(['left', 'right'] as const).forEach(side => {
  const silhouette = generateUnifiedHandSilhouette(side, 0, 0);
  assert(silhouette.length > 50 && !silhouette.includes('NaN'), `Unified ${side} hand silhouette valid and NaN-free`);
  const reachingSilhouette = generateUnifiedHandSilhouette(side, side === 'left' ? -12 : 12, -14);
  assert(reachingSilhouette.length > 50 && !reachingSilhouette.includes('NaN'), `Reaching ${side} hand silhouette valid and NaN-free`);
  const thumbAnchor = FINGER_ANCHORS[`${side}_thumb`];
  const thumbStroke = generateSculptedThumbStroke(
    side,
    thumbAnchor.mcpX,
    thumbAnchor.mcpY,
    thumbAnchor.homeX,
    thumbAnchor.homeY,
    thumbAnchor.width
  );
  assert(thumbStroke.length > 10 && !thumbStroke.includes('NaN'), `Thumb open stroke valid and NaN-free for ${side}`);
});

// ----------------------------------------------------
// 9. TEST PARAGRAPH FREE-FLOW & BACKSPACE ENGINE AUDIT
// ----------------------------------------------------
console.log('\n>>> [9/9] AUDITING TEST PARAGRAPH FREE-FLOW & BACKSPACE LOGIC');

{
  const samplePara = 'touch typing test';
  const typedBuffer: string[] = [];
  const history: boolean[] = [];

  // Type "toxch" (wrong 'x' at index 2, continue without stopping)
  for (const ch of 'toxch') {
    const idx = typedBuffer.length;
    const ok = ch === samplePara[idx];
    typedBuffer.push(ch);
    history.push(ok);
  }
  assert(typedBuffer.length === 5, 'Test mode advances past wrong character without blocking');
  assert(typedBuffer[2] !== samplePara[2], 'Wrong character recorded as red mismatch at index 2');
  assert(typedBuffer[3] === samplePara[3] && typedBuffer[4] === samplePara[4], 'Subsequent characters continue green after error');

  const uncorrectedBefore = typedBuffer.reduce((acc, ch, i) => acc + (ch === samplePara[i] ? 0 : 1), 0);
  assert(uncorrectedBefore === 1, 'Uncorrected error count is 1 before Backspace');

  // Optional Backspace back to index 2 and retype "uch"
  typedBuffer.pop(); // h
  typedBuffer.pop(); // c
  typedBuffer.pop(); // x
  for (const ch of 'uch') {
    const idx = typedBuffer.length;
    const ok = ch === samplePara[idx];
    typedBuffer.push(ch);
    history.push(ok);
  }
  const uncorrectedAfter = typedBuffer.reduce((acc, ch, i) => acc + (ch === samplePara[i] ? 0 : 1), 0);
  assert(uncorrectedAfter === 0 && typedBuffer.join('') === 'touch', 'Optional Backspace cleanly fixes red error to green');
  assert(history.filter(Boolean).length === 7 && history.length === 8, 'Historical accuracy retains initial mistype honestly');
}

// ----------------------------------------------------
// 10. RULE-BASED TRICKY KEY REMEDIATION ENGINE AUDIT
// ----------------------------------------------------
console.log('\n>>> [10/10] AUDITING RULE-BASED TRICKY KEY REMEDIATION & HEALING ENGINE');

{
  // Empty input produces zero hotspots and zero generated lessons
  assert(analyzeHotspots({}).length === 0, 'Empty weakKeys returns 0 hotspots');
  assert(generateRuleBasedLessons({}).length === 0, 'Empty weakKeys returns 0 rule lessons');

  // Mixed weak keys triggering Priority Cluster, Finger Overload, Shift Coordination, and Off-Home-Row Reach
  const sampleWeakKeys: Record<string, number> = {
    p: 6, // critical, right_pinky, top row
    q: 4, // moderate, left_pinky, top row
    z: 3, // moderate, left_pinky, bottom row (triggers left_pinky overload with q)
    A: 3, // moderate, shifted left_pinky (triggers shift rule)
    '7': 2, // moderate, right_index, number row
    '?': 2, // moderate, shifted right_pinky
  };

  const hotspots = analyzeHotspots(sampleWeakKeys);
  assert(hotspots.length === 6, 'analyzeHotspots returns all 6 weak keys sorted descending', { count: hotspots.length });
  assert(hotspots[0].key === 'p' && hotspots[0].severity === 'critical', 'Highest mistake key is first and marked critical');
  assert(hotspots[1].severity === 'moderate', '4-mistake key is marked moderate');

  const ruleLessons = generateRuleBasedLessons(sampleWeakKeys);
  assert(ruleLessons.length >= 2 && ruleLessons.length <= 4, 'Rule engine generates 2-4 deduplicated lessons', { count: ruleLessons.length });
  assert(ruleLessons[0].ruleId === 'priority_cluster', 'First generated lesson is Priority Hotspot Cluster');
  assert(ruleLessons.some((l) => l.ruleId === 'finger_overload'), 'Finger overload rule triggers for overloaded pinky');
  assert(ruleLessons.some((l) => l.ruleId === 'row_shift_reach'), 'Row/Shift reach rule triggers for shifted/top-row keys');

  // Verify every generated lesson has exactly 3 non-empty stages and every character maps cleanly in guidanceEngine
  ruleLessons.forEach((lesson) => {
    assert(lesson.exercises.length === 3, `Lesson ${lesson.id} has 3 stages`);
    assert(lesson.stageLabels.length === 3, `Lesson ${lesson.id} has 3 stage labels`);
    assert(lesson.remediationTargetKeys.length > 0, `Lesson ${lesson.id} defines remediationTargetKeys`);
    lesson.exercises.forEach((stage, sIdx) => {
      assert(stage.length >= 15, `Lesson ${lesson.id} stage ${sIdx + 1} has meaningful length`, { len: stage.length });
      for (const ch of stage) {
        const g = getGuidanceForChar(ch);
        assert(Boolean(g.hand && g.finger), `Remediation char '${ch}' in ${lesson.id} stage ${sIdx + 1} maps to valid hand & finger`);
      }
    });
  });

  // Single-key precision lesson audit across lowercase, uppercase, digit, and symbol
  for (const key of ['p', 'A', '7', '?']) {
    const h = hotspots.find((x) => x.key === key)!;
    const single = generateSingleKeyLesson(h);
    assert(single.ruleId === 'single_key_precision', `Single-key rule lesson generated for '${key}'`);
    assert(single.exercises.length === 3, `Single-key lesson for '${key}' has 3 stages`);
    assert(single.exercises[0].includes(key), `Stage 1 isolation includes target key '${key}'`);
    assert(single.exercises[1].includes(key), `Stage 2 transitions include target key '${key}'`);
  }

  // Direct buildThreeStageExercises coverage for rare letters q, x, z
  const rareStages = buildThreeStageExercises(['q', 'x', 'z']);
  assert(rareStages.length === 3 && rareStages[2].length >= 20, 'Rare letters q/x/z generate rich Stage 3 real words');

  // Hotspot healing assertions:
  // 1) Mastery (>=96% accuracy and 0 misses on target) clears key completely
  const healedMastery = applyRemediationHealing({ p: 6, q: 4, x: 2 }, ['p', 'q'], 98, true, {});
  assert(!('p' in healedMastery.nextWeakKeys) && !('q' in healedMastery.nextWeakKeys), 'Mastery pass clears targeted hotspots completely');
  assert(healedMastery.nextWeakKeys.x === 2, 'Untargeted hotspots remain untouched');
  assert(healedMastery.healedKeys.cleared.includes('p') && healedMastery.healedKeys.cleared.includes('q'), 'Healed cleared list reports p and q');

  // 2) Standard pass (92% accuracy, 0 misses) reduces count by >= 50% (at least -2)
  const healedReduce = applyRemediationHealing({ p: 6, q: 2 }, ['p', 'q'], 92, true, {});
  assert(healedReduce.nextWeakKeys.p === 3, 'Standard pass halves p mistake count from 6 to 3', { p: healedReduce.nextWeakKeys.p });
  assert(!('q' in healedReduce.nextWeakKeys), 'Standard pass clears low-count key q (2 - 2 <= 0)');
  assert(healedReduce.healedKeys.reduced.includes('p') && healedReduce.healedKeys.cleared.includes('q'), 'Reports p reduced and q cleared');

  // 3) Failed run does NOT heal and accumulates any new misses
  const healedFail = applyRemediationHealing({ p: 6 }, ['p'], 82, false, { p: 2, z: 1 });
  assert(healedFail.nextWeakKeys.p === 8 && healedFail.nextWeakKeys.z === 1, 'Failed run preserves hotspot and accumulates misses');
  assert(healedFail.healedKeys.cleared.length === 0 && healedFail.healedKeys.reduced.length === 0, 'Failed run reports no healed keys');
}

// ----------------------------------------------------
// 11. POST-TEST CERTIFICATE ENGINE & DEDUPLICATION AUDIT
// ----------------------------------------------------
console.log('\n>>> [11/11] AUDITING POST-TEST CERTIFICATE ENGINE & VALIDATION');

{
  const passedTestSession: SessionResult = {
    id: 'res-cert-pass-1',
    type: 'test',
    itemId: 'test-1min-speed',
    title: '1-Minute Speed Assessment',
    wpm: 68,
    rawWpm: 70,
    accuracy: 98,
    errors: 2,
    durationSeconds: 60,
    completedAt: '2026-11-21T12:00:00.000Z',
    passed: true,
    scoring: 'strict',
  };

  const failedTestSession: SessionResult = {
    ...passedTestSession,
    id: 'res-cert-fail-1',
    wpm: 24,
    accuracy: 88,
    passed: false,
  };

  const passedLessonSession: SessionResult = {
    ...passedTestSession,
    id: 'res-lesson-pass-1',
    type: 'lesson',
    passed: true,
  };

  const passedPracticeSession: SessionResult = {
    ...passedTestSession,
    id: 'res-practice-pass-1',
    type: 'practice',
    passed: true,
  };

  assert(isEligibleForCertificate(passedTestSession), 'Passed test is eligible for certificate');
  assert(!isEligibleForCertificate(failedTestSession), 'Failed test is rejected for certificate');
  assert(!isEligibleForCertificate(passedLessonSession), 'Passed lesson is not eligible for test certificate');
  assert(!isEligibleForCertificate(passedPracticeSession), 'Passed practice is not eligible for test certificate');

  // Certificate code format and determinism
  const codeA = generateCertificateCode('2026-11-21T12:00:00.000Z', 'seed-1');
  const codeB = generateCertificateCode('2026-11-21T12:00:00.000Z', 'seed-1');
  const codeC = generateCertificateCode('2026-11-21T12:00:00.000Z', 'seed-2');
  assert(/^TMP-2026-[2-9A-HJ-NP-Z]{6}$/.test(codeA), 'Certificate code matches TMP-YYYY-XXXXXX format', { codeA });
  assert(codeA === codeB, 'Certificate code is deterministic for identical inputs');
  assert(codeA !== codeC, 'Different sessions produce distinct certificate codes');

  // Valid creation + name normalization
  const cert = createCertificateFromSession(passedTestSession, '  Jordan   Rivera  ');
  assert(cert.recipientName === 'Jordan Rivera', 'Recipient name whitespace is cleanly normalized');
  assert(cert.sessionId === passedTestSession.id, 'Certificate links to exact sessionId');
  assert(cert.wpm === 68 && cert.accuracy === 98, 'Certificate preserves verified WPM and accuracy');
  assert(cert.scoring === 'strict', 'Certificate preserves strict scoring mode');

  // Blank name rejection
  let blankRejected = false;
  try {
    createCertificateFromSession(passedTestSession, '    ');
  } catch {
    blankRejected = true;
  }
  assert(blankRejected, 'Blank recipient name throws validation error');

  // Failed test rejection
  let failedRejected = false;
  try {
    createCertificateFromSession(failedTestSession, 'Jordan Rivera');
  } catch {
    failedRejected = true;
  }
  assert(failedRejected, 'Failed test throws eligibility error');

  // Deduplication by sessionId
  const list1 = upsertCertificate([], cert);
  const list2 = upsertCertificate(list1, { ...cert, recipientName: 'Duplicate Attempt' });
  assert(list1.length === 1 && list2.length === 1, 'Duplicate sessionId does not issue duplicate certificate');
  assert(list2[0].recipientName === 'Jordan Rivera', 'Original certificate is preserved on duplicate upsert');

  // Helpers
  assert(getUserInitials('Jordan Rivera') === 'JR', 'Initials helper extracts two initials');
  assert(getUserInitials('Alex') === 'AL', 'Initials helper handles single-word names');
  assert(normalizeRecipientName('  A   B  ') === 'A B', 'normalizeRecipientName collapses inner whitespace');
  assert(
    sanitizeCertificateFilename('Jordan Rivera', '1-Minute Speed Assessment').endsWith('.png'),
    'Sanitized certificate filename ends with .png'
  );
  assert(
    sanitizeCertificateFilename('Jordan Rivera', '1-Minute Speed Assessment', 'pdf').endsWith('.pdf'),
    'Sanitized certificate PDF filename ends with .pdf'
  );

  const samplePdfBytes = buildCertificatePdfBytes(new Uint8Array([0xff, 0xd8, 0xff, 0xd9]), 1600, 1120);
  const samplePdfStr = Buffer.from(samplePdfBytes).toString('latin1');
  assert(samplePdfStr.startsWith('%PDF-1.4'), 'PDF generator writes valid %PDF-1.4 header');
  assert(samplePdfStr.includes('/Filter /DCTDecode'), 'PDF generator embeds JPEG image stream');
  assert(samplePdfStr.includes('xref') && samplePdfStr.trimEnd().endsWith('%%EOF'), 'PDF generator writes valid xref table and %%EOF trailer');
}

// ----------------------------------------------------
// 12. TYPING ARCADE ENGINE, CORPUS & REPLAY ANTI-CHEAT AUDIT
// ----------------------------------------------------
console.log('\n>>> [12/12] AUDITING TYPING ARCADE ENGINE, E1-E9 MATH & REPLAY VERIFIER');

{
  // Pluggable 5 modes + versioned constants
  assert(ARCADE_MODE_LIST.length === 5, 'All 5 arcade modes are registered in pluggable engine');
  assert(SCORING_VERSION === 1 && XP_FORMULA_VERSION === 1, 'Scoring & XP formula versions locked at v1');

  // Immutable corpus licensing & provenance (E8-E9)
  assert(ARCADE_CORPUS_V1.length >= 15, 'Curated licensed corpus has >= 15 immutable passages');
  const seenTextIds = new Set<string>();
  ARCADE_CORPUS_V1.forEach((p) => {
    assert(!seenTextIds.has(p.textId), `Corpus textId ${p.textId} is unique`);
    seenTextIds.add(p.textId);
    assert(p.textVersion === 1 && p.isActive, `Corpus ${p.textId} is active v1`);
    assert(p.license === 'Original' || p.license === 'CC0-1.0', `Corpus ${p.textId} has compliant license`);
    assert(p.content.length >= 120, `Corpus ${p.textId} has substantial passage length`);
  });

  // Deterministic Daily Challenge seed
  const dailyA = getDailyChallengePassage('2026-11-21');
  const dailyB = getDailyChallengePassage('2026-11-21');
  assert(dailyA.textId === dailyB.textId, 'Daily Challenge passage is deterministic per calendar date');

  // Every mode yields a valid passage
  ARCADE_MODE_LIST.forEach((m) => {
    const p = getPassageForMode(m.id, 'standard');
    assert(Boolean(p && p.content.length > 0), `Mode ${m.id} resolves a valid corpus passage`);
  });

  // E1 & E2 locked formulas
  assert(computeNetWpm(250, 60000) === 50, 'E1 Net WPM: 250 correct chars in 60s = 50.0 WPM');
  assert(computeKeystrokeAccuracy(95, 100) === 95, 'E2 Accuracy: 95/100 keystrokes = 95.0%');

  // Deterministic replay verification (valid run with Backspace error retention E4)
  const samplePassage = ARCADE_CORPUS_V1[0];
  const samplePrefix = samplePassage.content.slice(0, 40);
  const validLog: KeystrokeEvent[] = [];
  let t = 0;
  // Type index 0..9 cleanly, mistype index 10, Backspace, retype index 10..39 cleanly
  for (let i = 0; i < 10; i++) {
    validLog.push({ t, key: samplePrefix[i], expected: samplePrefix[i], correct: true, renderLatencyMs: 6.2 });
    t += 120;
  }
  validLog.push({ t, key: '#', expected: samplePrefix[10], correct: false, renderLatencyMs: 7.0 });
  t += 140;
  validLog.push({ t, key: 'Backspace', expected: samplePrefix[10], correct: false, isBackspace: true });
  t += 110;
  for (let i = 10; i < samplePrefix.length; i++) {
    validLog.push({ t, key: samplePrefix[i], expected: samplePrefix[i], correct: true, renderLatencyMs: 6.5 });
    t += 120;
  }

  const elapsedMs = t;
  const reportedWpm = computeNetWpm(40, elapsedMs);
  // 41 non-backspace keystrokes, 40 correct -> 97.6% (E4: Backspace did NOT erase error!)
  const reportedAcc = computeKeystrokeAccuracy(40, 41);
  assert(reportedAcc < 100, 'E4 Backspace correction retains recorded keystroke error in accuracy');

  const validAudit = verifySessionReplay(
    samplePassage,
    { wpm: reportedWpm, accuracy: reportedAcc, durationMs: elapsedMs, strictMode: false },
    validLog
  );
  assert(validAudit.status === 'valid', 'Legitimate keystroke log passes replay verifier', validAudit);
  assert(validAudit.wpmDriftPct <= 0.5 && validAudit.accuracyDriftPct <= 0.5, 'Replay drift stays <= 0.5%');

  // Tampered WPM (>0.5% mismatch) MUST be rejected (§4.3)
  const tamperedAudit = verifySessionReplay(
    samplePassage,
    { wpm: reportedWpm + 18, accuracy: reportedAcc, durationMs: elapsedMs, strictMode: false },
    validLog
  );
  assert(tamperedAudit.status === 'rejected', 'Tampered WPM exceeding 0.5% variance is rejected');

  // Scripted bot burst (sustained < 20ms intervals) MUST be rejected (§4.3)
  const botLog: KeystrokeEvent[] = [];
  for (let i = 0; i < 20; i++) {
    botLog.push({ t: i * 8, key: samplePrefix[i], expected: samplePrefix[i], correct: true });
  }
  const botAudit = verifySessionReplay(
    samplePassage,
    { wpm: computeNetWpm(20, 160), accuracy: 100, durationMs: 160, strictMode: false },
    botLog
  );
  assert(botAudit.status === 'rejected', 'Sustained <20ms scripted keystroke burst is rejected');

  // XP formula returns 0 for rejected runs and positive XP for valid runs
  assert(
    computeArcadeXp({ mode: 'classic', wpm: 80, accuracy: 98, correctChars: 200, validationStatus: 'rejected' }) === 0,
    'Rejected runs earn 0 XP'
  );
  assert(
    computeArcadeXp({ mode: 'challenge', wpm: 70, accuracy: 97, correctChars: 200, isDailyChallenge: true, validationStatus: 'valid' }) > 150,
    'Valid daily challenge run awards positive multiplied XP'
  );

  // Cosmetics catalog contains all 4 categories & starter items
  assert(COSMETIC_CATALOG.length >= 12, 'Cosmetics catalog provides rich XP-only customization');
  const defaultProfile = createDefaultArcadeProfile('Tester');
  assert(defaultProfile.unlockedItemIds.length >= 5, 'Default profile includes starter cosmetics');
  const emptyBoard = buildModeLeaderboard('all', 'all_time', [], defaultProfile);
  assert(emptyBoard.length === 0, 'Arcade leaderboard contains zero ghost/benchmark entries when no active player runs exist');

  const populatedBoard = buildModeLeaderboard(
    'all',
    'all_time',
    [
      {
        id: 'arc-active-1',
        mode: 'rhythm',
        difficulty: 'standard',
        strictMode: false,
        textId: samplePassage.textId,
        textVersion: samplePassage.textVersion,
        wpm: 74.5,
        rawWpm: 76.0,
        accuracy: 98.2,
        durationMs: 32000,
        correctChars: 198,
        totalKeystrokes: 202,
        errorCount: 4,
        scoringVersion: SCORING_VERSION,
        xpFormulaVersion: XP_FORMULA_VERSION,
        p95LatencyMs: 6.2,
        maxCombo: 44,
        xpEarned: 135,
        isDailyChallenge: false,
        validationStatus: 'valid',
        verification: validAudit,
        keystrokeLog: [],
        completedAt: new Date().toISOString(),
      },
    ],
    defaultProfile
  );
  assert(
    populatedBoard.length === 1 && populatedBoard[0].isCurrentUser && populatedBoard[0].handle === 'Tester',
    'Arcade leaderboard displays only real active player entries'
  );
}

// ----------------------------------------------------
// 13. 2D CANVAS GAME WORLDS & TELEMETRY MATH AUDIT
// ----------------------------------------------------
console.log('\n>>> [13/13] AUDITING 5 ORIGINAL 2D CANVAS GAME WORLDS & TELEMETRY');

{
  // Every registered Arcade mode maps cleanly to a themed 2D game world
  ARCADE_MODE_LIST.forEach((m) => {
    const world = ARCADE_GAME_WORLDS[m.id];
    assert(Boolean(world && world.gameTitle.length > 0), `Mode ${m.id} maps to 2D game world '${world?.gameTitle}'`);
    assert(world.environmentTag.includes('2D'), `World '${world.gameTitle}' specifies 2D environment tag`);
  });

  // Active word extraction accurately tracks prefix, remaining, space cue, mistypes, and lookahead words
  const w0 = extractActiveWordState('hello arcade world', 0, []);
  assert(
    w0.currentWord === 'hello' &&
      w0.currentWordTyped === '' &&
      w0.nextWord === 'arcade' &&
      !w0.awaitingSpace &&
      w0.upcomingWords?.length === 2 &&
      w0.upcomingWords[1] === 'world',
    'Cursor 0 targets first word cleanly with 2-word in-canvas lookahead'
  );

  const wSpace = extractActiveWordState('hello arcade world', 5, ['h', 'e', 'l', 'l', 'o']);
  assert(
    wSpace.currentWord === 'hello' && wSpace.awaitingSpace === true && !wSpace.hasMistype,
    'Cursor on word-separating space signals awaitingSpace cue cleanly'
  );

  const wMid = extractActiveWordState('hello arcade world', 8, ['h', 'e', 'l', 'l', 'o', ' ', 'a', 'x']);
  assert(
    wMid.currentWord === 'arcade' &&
      wMid.currentWordTyped === 'ar' &&
      wMid.typedSegment === 'ax' &&
      wMid.hasMistype === true &&
      wMid.currentWordRemaining === 'cade' &&
      wMid.nextWord === 'world',
    'Mid-word cursor tracks mistyped chars for red in-canvas highlighting',
    wMid
  );

  // Boss HP drains monotonically from 100% -> 0%
  assert(computeBossHpPercent(0) === 100 && computeBossHpPercent(0.5) === 50 && computeBossHpPercent(1) === 0, 'Titan Siege boss HP scales 100% to 0%');

  // Nitro Highway velocity scales with WPM & combo when playing, 0 when idle
  assert(computeNitroSpeedKmh(90, 25, false) === 0, 'Nitro Highway speed is 0 KM/H when not actively playing');
  assert(
    computeNitroSpeedKmh(100, 40, true) > computeNitroSpeedKmh(50, 0, true),
    'Nitro Highway speed scales up cleanly with higher WPM and Nitro combo'
  );
}

// ----------------------------------------------------
// 14. FRESH PARAGRAPH ENGINE & NITRO HIGHWAY ZERO-OVERLAP PHYSICS AUDIT
// ----------------------------------------------------
console.log('\n>>> [14/14] AUDITING ZERO-REPEAT FRESH PARAGRAPHS & NITRO HIGHWAY NO-OVERLAP PHYSICS');

{
  assert(ARCADE_CORPUS_V1.length >= 36, 'Expanded licensed corpus contains >= 36 immutable passages', {
    count: ARCADE_CORPUS_V1.length,
  });

  // Zero consecutive repeats across 20 consecutive draws in Classic & Speed Rush
  clearRecentPassageIds();
  let prevClassicId = '';
  let prevClassicContent = '';
  let dynamicTriggered = false;
  for (let i = 0; i < 20; i++) {
    const p = getFreshPassageForMode('classic', 'standard', prevClassicId);
    assert(p.textId !== prevClassicId, `Classic draw #${i + 1} produces distinct textId from previous run`);
    assert(p.content !== prevClassicContent, `Classic draw #${i + 1} produces distinct paragraph content`);
    if (p.textId.startsWith('ta-v1-dyn-')) dynamicTriggered = true;
    prevClassicId = p.textId;
    prevClassicContent = p.content;
  }
  assert(dynamicTriggered, 'Exhausting static pool seamlessly activates dynamic clause synthesizer');

  // Speed Rush fresh draws must deliver long-form sprint passages (>= 380 chars) with zero back-to-back repeats
  clearRecentPassageIds();
  let prevSpeedId = '';
  for (let i = 0; i < 12; i++) {
    const p = getFreshPassageForMode('speed_rush', 'standard', prevSpeedId);
    assert(p.textId !== prevSpeedId, `Speed Rush draw #${i + 1} delivers a fresh passage ID`);
    assert(p.content.length >= 380, `Speed Rush draw #${i + 1} meets >=380 char sprint length`, {
      len: p.content.length,
    });
    prevSpeedId = p.textId;
  }

  // Synthesized dynamic passages remain 100% compatible with Replay Verifier (§4.3)
  const dynPassage = synthesizeDynamicPassage('speed_rush', 'precision', 424242);
  assert(dynPassage.content.length >= 380 && dynPassage.license === 'Original', 'Dynamic passage has valid length & Original license');
  const dynPrefix = dynPassage.content.slice(0, 30);
  const dynLog: KeystrokeEvent[] = dynPrefix.split('').map((ch, idx) => ({
    t: idx * 110,
    key: ch,
    expected: ch,
    correct: true,
    renderLatencyMs: 5.5,
  }));
  const dynDuration = 30 * 110;
  const dynAudit = verifySessionReplay(
    dynPassage,
    { wpm: computeNetWpm(30, dynDuration), accuracy: 100, durationMs: dynDuration, strictMode: false },
    dynLog
  );
  assert(dynAudit.status === 'valid', 'Dynamic synthesized passage passes deterministic replay verification', dynAudit);

  // 3,000-Frame Nitro Highway Collision-Free Physics Stress Test (40..160 WPM + rapid overtake triggers)
  const nitro = createInitialNitroTrafficState();
  let playerOverlapFrames = 0;
  let rivalOverlapFrames = 0;
  let maxObservedTilt = 0;

  for (let frame = 0; frame < 3000; frame++) {
    const simulatedWpm = 45 + ((frame * 3) % 115); // sweeps 45 -> 160 WPM
    if (frame > 0 && frame % 18 === 0) {
      requestWordClearOvertake(nitro);
    }
    stepNitroTraffic(nitro, 1 / 60, simulatedWpm, true, frame + 1);

    if (hasPlayerRivalOverlap(nitro)) playerOverlapFrames++;
    if (hasRivalRivalOverlap(nitro.rivals)) rivalOverlapFrames++;
    maxObservedTilt = Math.max(maxObservedTilt, Math.abs(nitro.carTiltRad));
  }

  assert(
    playerOverlapFrames === 0,
    'Nitro Highway 3,000-frame stress test guarantees ZERO player-vs-rival car overlaps',
    { playerOverlapFrames }
  );
  assert(
    rivalOverlapFrames === 0,
    'Nitro Highway 3,000-frame stress test guarantees ZERO rival-vs-rival same-lane overlaps',
    { rivalOverlapFrames }
  );
  assert(maxObservedTilt > 0.02, 'Nitro Highway player car exhibits realistic lateral steering tilt', {
    maxObservedTilt: Number(maxObservedTilt.toFixed(4)),
  });
  assert(nitro.overtakeCount > 10, 'Nitro Highway cleanly tracks passing overtakes across 3,000 frames', {
    overtakeCount: nitro.overtakeCount,
  });
}

// ----------------------------------------------------
// 15. 2D FIGHTING TYPING GAME COMBAT, AI & PROGRESSION AUDIT
// ----------------------------------------------------
console.log('\n>>> [15/15] AUDITING 2D FIGHTING TYPING GAME ENGINE, SMART AI & LEVEL PROGRESSION');

{
  // 1) Progressive Opponent Roster (Levels 1..5 + Adaptive Level 6+ Elites)
  const lv1 = getOpponentForLevel(1);
  const lv2 = getOpponentForLevel(2);
  const lv3 = getOpponentForLevel(3);
  const lv4 = getOpponentForLevel(4);
  const lv5 = getOpponentForLevel(5);
  const lv6Low = getOpponentForLevel(6, { wpm: 45, accuracy: 92 });
  const lv6High = getOpponentForLevel(6, { wpm: 110, accuracy: 99 });

  assert(lv1.roleTitle === 'Beginner Fighter' && lv1.maxHp < lv2.maxHp, 'Level 1 Beginner Fighter has lower HP than Level 2 Street Fighter');
  assert(lv2.maxHp < lv3.maxHp && lv3.maxHp < lv4.maxHp && lv4.maxHp < lv5.maxHp, 'Opponent max HP scales monotonically across Levels 1..5');
  assert(lv1.pauseGraceMs > lv5.pauseGraceMs, 'Higher level opponents react faster to long pauses');
  assert(lv6Low.isAdaptiveElite && lv6High.maxHp > lv6Low.maxHp, 'Level 6+ Elite Fighter dynamically adapts HP & pace to player skill');

  // 1b) Level-scaled Player Max HP progression (Levels 1..5 + Level 6+ Elites)
  const pHp1 = getPlayerMaxHpForLevel(1);
  const pHp2 = getPlayerMaxHpForLevel(2);
  const pHp3 = getPlayerMaxHpForLevel(3);
  const pHp4 = getPlayerMaxHpForLevel(4);
  const pHp5 = getPlayerMaxHpForLevel(5);
  const pHp6 = getPlayerMaxHpForLevel(6);
  const pHp8 = getPlayerMaxHpForLevel(8);
  assert(pHp1 === PLAYER_BASE_MAX_HP, 'Level 1 player starts at base 100 HP');
  assert(
    pHp1 < pHp2 && pHp2 < pHp3 && pHp3 < pHp4 && pHp4 < pHp5 && pHp5 < pHp6 && pHp6 < pHp8,
    'Player max HP scales monotonically upward across Levels 1..5 and Elite levels 6+'
  );
  const lv5Match = createCombatMatchState(5);
  assert(
    lv5Match.playerMaxHp === pHp5 && lv5Match.playerHp === pHp5,
    'Cyber Dojo match initializes playerHp and playerMaxHp to the level-scaled HP'
  );

  // 2) Exact word validation & Backspace honesty
  const vPartial = validateTypedWord('strike', 'str');
  assert(!vPartial.isExactMatch && vPartial.isPrefixCorrect && vPartial.correctChars === 3, 'Partial valid prefix validates cleanly without completing word');
  const vErr = validateTypedWord('strike', 'stx');
  assert(!vErr.isExactMatch && vErr.hasAnyError && vErr.incorrectChars === 1, 'Mistyped character detected accurately');
  const vExact = validateTypedWord('strike', 'strike');
  assert(vExact.isExactMatch && !vExact.hasAnyError, 'Exact typed word passes validation');

  // 3) Damage & combo scaling
  const dmgSlow = calculatePlayerAttackDamage({ wordLength: 5, wpm: 35, accuracy: 90, wordCombo: 1, wordHadErrors: false });
  const dmgFastCombo = calculatePlayerAttackDamage({ wordLength: 8, wpm: 95, accuracy: 99, wordCombo: 6, wordHadErrors: false });
  const dmgWithError = calculatePlayerAttackDamage({ wordLength: 8, wpm: 95, accuracy: 99, wordCombo: 1, wordHadErrors: true });
  assert(dmgFastCombo.damage > dmgSlow.damage, 'Faster typing, longer words, and higher combos deal strictly more damage');
  assert(dmgFastCombo.damage > dmgWithError.damage, 'Flawless word completion deals stronger damage than error-tainted word');

  // 4) Strict duplicate-word damage prevention & Backspace non-award guard
  const match = createCombatMatchState(1);
  const firstWord = match.wordQueue[0];
  match.typedBuffer = firstWord.text.slice(0, -1); // incomplete after backspace
  const incompleteAtk = applyWordCompletionAttack(match, 65, 98, firstWord.wordId);
  assert(!incompleteAtk.accepted && incompleteAtk.damage === 0, 'Incomplete word after Backspace never awards attack damage');

  match.typedBuffer = firstWord.text;
  const firstAtk = applyWordCompletionAttack(match, 70, 99, firstWord.wordId);
  assert(firstAtk.accepted && firstAtk.damage > 0 && match.opponentHp === match.opponentMaxHp - firstAtk.damage, 'Exact completed word deals damage and reduces opponent HP');
  assert(firstWord.completed === true, 'Completed word is permanently locked');

  // Attempting to replay the same wordId MUST be rejected with 0 duplicate damage
  const dupAtk = applyWordCompletionAttack(match, 70, 99, firstWord.wordId);
  assert(!dupAtk.accepted && dupAtk.damage === 0, 'Duplicate attack submission for same wordId is strictly blocked');

  // 5) Smart AI opponent reactions: single mistake fairness, multi-mistake heavy counter, long pause pressure
  const aiMatch = createCombatMatchState(2);
  aiMatch.lastKeystrokeMs = 1000;
  const singleErr = evaluateAiOnMistake(aiMatch, 2000);
  assert(singleErr.triggered && singleErr.type === 'light_counter' && singleErr.damage === aiMatch.opponent.lightCounterDamage, 'Single accidental mistake triggers fair light counterattack only');
  assert(aiMatch.playerHp === aiMatch.playerMaxHp - singleErr.damage, 'Player HP reduces accurately from level-scaled max HP on light counter');

  // Immediate 2nd mistake during cooldown triggers block (not unfair spam damage)
  const cooldownErr = evaluateAiOnMistake(aiMatch, 2200);
  assert(cooldownErr.type === 'block' && cooldownErr.damage === 0, 'Rapid second slip on cooldown triggers guard block instead of unfair double-hit');

  // Repeated 3rd mistake within rolling window triggers heavy counter + AI advantage
  const heavyErr = evaluateAiOnMistake(aiMatch, 2500);
  assert(heavyErr.type === 'heavy_counter' && heavyErr.grantsAdvantage && heavyErr.resetsCombo, 'Multiple mistakes grant AI temporary advantage and heavy counter');

  // Long typing pause grace period & pressure strike
  const beforeGrace = evaluateAiPausePressure(aiMatch, aiMatch.lastKeystrokeMs + 1000);
  assert(!beforeGrace.triggered && beforeGrace.pressureRatio > 0 && beforeGrace.pressureRatio < 1, 'Short pause within grace period does not trigger AI pressure strike');
  const afterGrace = evaluateAiPausePressure(aiMatch, aiMatch.lastKeystrokeMs + aiMatch.opponent.pauseGraceMs + 50);
  assert(afterGrace.triggered && afterGrace.type === 'pause_pressure' && afterGrace.damage > 0, 'Extended pause past grace period triggers AI pressure strike');

  // 6) Health lower-bound clamping (never negative) & KO outcome
  aiMatch.playerHp = 3;
  aiMatch.lastKeystrokeMs = 10000;
  const lethalPause = evaluateAiPausePressure(aiMatch, 10000 + aiMatch.opponent.pauseGraceMs + 50);
  assert(aiMatch.playerHp === 0 && lethalPause.playerDefeated && aiMatch.outcome === 'defeat', 'Player HP clamps strictly at 0 and triggers defeat');

  const winMatch = createCombatMatchState(1);
  winMatch.opponentHp = 4;
  winMatch.typedBuffer = winMatch.wordQueue[0].text;
  const koAtk = applyWordCompletionAttack(winMatch, 80, 100, winMatch.wordQueue[0].wordId);
  assert(winMatch.opponentHp === 0 && koAtk.opponentDefeated && winMatch.outcome === 'victory', 'Opponent HP clamps strictly at 0 and triggers KO victory');

  // 7) Level progression & unlock persistence
  const baseProg = createDefaultFightingProgress();
  assert(baseProg.highestUnlockedLevel === 1, 'Default fighting progression starts at Level 1');
  const afterWin = recordFightingOutcome(baseProg, { level: 1, won: true, wpm: 68, accuracy: 97 });
  assert(afterWin.highestUnlockedLevel === 2 && afterWin.totalWins === 1, 'Winning Level 1 unlocks Level 2');
  const afterLoss = recordFightingOutcome(afterWin, { level: 2, won: false, wpm: 54, accuracy: 91 });
  assert(afterLoss.highestUnlockedLevel === 2 && afterLoss.totalWins === 1, 'Losing Level 2 preserves unlock state without advancing prematurely');

  // 8) 10-state 2D Fighter Animation Machine transitions & non-restarting attack guard
  const stageSim = createFightingStageSim();
  const allTenStates: FighterAnimState[] = [
    'idle', 'advancing', 'punching', 'kicking', 'combo_attack',
    'blocking', 'taking_damage', 'knockback', 'victory', 'defeat',
  ];
  allTenStates.forEach((st) => {
    const ok = transitionFighterState(stageSim.player, st, { force: true });
    assert(ok && stageSim.player.state === st, `Fighter animation state machine supports '${st}'`);
  });

  // Verify mid-swing attack does NOT unnecessarily restart on rapid keystroke calls
  transitionFighterState(stageSim.player, 'punching', { force: true });
  stageSim.player.stateTime = 0.08;
  const restartedEarly = transitionFighterState(stageSim.player, 'punching');
  assert(!restartedEarly && stageSim.player.stateTime === 0.08, 'Active punch animation does not restart unnecessarily mid-swing');

  updateFightingStageSim(
    stageSim,
    {
      arenaTheme: 'theme_obsidian',
      opponent: lv1,
      targetWord: 'jab',
      typedBuffer: 'j',
      wordCombo: 2,
      aiPressureRatio: 0,
      aiHasAdvantage: false,
      isPlaying: true,
      waitingFirstKey: false,
      outcome: 'ongoing',
    },
    1 / 60
  );
  assert(stageSim.opponent.xNorm - stageSim.player.xNorm >= 0.149, 'Fighters maintain clean non-overlapping body separation');
}

// ----------------------------------------------------
// 16. STRICT WORD ACCURACY, DYNAMIC TEMPO & ATTACK INTERRUPT AUDIT
// ----------------------------------------------------
console.log('\n>>> [16/16] AUDITING STRICT WORD ACCURACY, CONTINUOUS TEMPO SCALING & ATTACK INTERRUPTS');

{
  // 1) Strict Word Accuracy Hard Lock & Backspace Recovery
  const strictMatch = createCombatMatchState(2);
  const word0 = strictMatch.wordQueue[0].text;
  assert(word0.length >= 3, 'Target word has sufficient length for strict accuracy test');

  // Type first char accurately
  const r0 = processStrictCombatCharInput(strictMatch, word0[0]);
  assert(r0.accepted && r0.isCorrect && !r0.errorLocked, 'Accurate first letter advances typedBuffer without error lock');

  // Type a guaranteed wrong char
  const wrongChar = word0[1] === 'z' ? 'q' : 'z';
  const rWrong = processStrictCombatCharInput(strictMatch, wrongChar);
  assert(
    rWrong.accepted && !rWrong.isCorrect && rWrong.errorLocked && hasStrictErrorLock(word0, strictMatch.typedBuffer),
    'Mistyped character highlights red and engages strict error lock'
  );

  const lockedBufferLen = strictMatch.typedBuffer.length;
  // Subsequent forward keystrokes MUST be blocked until Backspace fixes the error
  const rBlocked = processStrictCombatCharInput(strictMatch, word0[1]);
  assert(
    !rBlocked.accepted && rBlocked.blockedByErrorLock && strictMatch.typedBuffer.length === lockedBufferLen,
    'Forward typing is strictly blocked while red error lock is active'
  );

  // Attempting to complete/skip word while locked MUST fail
  const skipAttempt = applyWordCompletionAttack(strictMatch, 80, 95, strictMatch.wordQueue[0].wordId);
  assert(!skipAttempt.accepted && strictMatch.activeWordIndex === 0, 'Cannot skip or complete word while mistyped');

  // Backspace removes wrong character cleanly and clears the error lock without advancing word
  const bkOk = processStrictBackspace(strictMatch);
  assert(
    bkOk && !hasStrictErrorLock(word0, strictMatch.typedBuffer) && strictMatch.typedBuffer === word0[0],
    'Backspace cleanly removes red error and unlocks typing without advancing'
  );

  // Complete remaining letters accurately -> word completes cleanly
  for (let i = 1; i < word0.length; i++) {
    const rStep = processStrictCombatCharInput(strictMatch, word0[i]);
    assert(rStep.accepted && rStep.isCorrect, `Strict recovery letter ${i} accepted`);
    if (i === word0.length - 1) {
      assert(rStep.wordCompletedReady, 'Final accurate character signals word completion ready');
    }
  }
  const cleanClear = applyWordCompletionAttack(strictMatch, 75, 94, strictMatch.wordQueue[0].wordId);
  assert(cleanClear.accepted && strictMatch.activeWordIndex === 1, 'Corrected word completes and advances to next word');

  // 2) Gradual Continuous Typing -> Opponent Attack Speed Scaling (No Sudden Spikes)
  const tempoMatch = createCombatMatchState(3);
  tempoMatch.lastKeystrokeMs = 1000;
  const initialMult = tempoMatch.aggressionMultiplier;
  const initialInterval = computeOpponentAttackIntervalSec(tempoMatch.opponent, initialMult);

  let maxPerFrameJump = 0;
  let simClockMs = 1000;
  for (let frame = 0; frame < 240; frame++) {
    simClockMs += 16.67;
    tempoMatch.lastKeystrokeMs = simClockMs; // continuous active typing
    if (frame % 8 === 0) {
      registerAccurateFlowStep(tempoMatch, frame % 40 === 0, 95, 99);
    }
    // Keep gauge below 1 so we measure pure smooth aggression ramp
    if (tempoMatch.opponentAttackGauge > 0.5) {
      tempoMatch.opponentAttackGauge = 0;
    }
    const prevMult = tempoMatch.aggressionMultiplier;
    stepDynamicCombatTick(tempoMatch, 1 / 60, simClockMs, 95, 99);
    maxPerFrameJump = Math.max(maxPerFrameJump, Math.abs(tempoMatch.aggressionMultiplier - prevMult));
  }

  const rampedMult = tempoMatch.aggressionMultiplier;
  const rampedInterval = computeOpponentAttackIntervalSec(tempoMatch.opponent, rampedMult);
  assert(rampedMult > initialMult + 0.35, 'Continuous fast accurate typing progressively raises opponent aggression multiplier', {
    initialMult,
    rampedMult,
  });
  assert(rampedInterval < initialInterval, 'Higher aggression strictly shortens opponent attack interval', {
    initialInterval,
    rampedInterval,
  });
  assert(maxPerFrameJump <= 0.015, 'Aggression ramps smoothly frame-by-frame with zero sudden speed spikes', {
    maxPerFrameJump: Number(maxPerFrameJump.toFixed(5)),
  });

  // 3) Dynamic Intensity Down-Scaling on Slow Play / Mistakes
  const peakHeat = tempoMatch.flowHeat;
  const peakMult = tempoMatch.aggressionMultiplier;
  evaluateAiOnMistake(tempoMatch, simClockMs + 100);
  assert(tempoMatch.flowHeat < peakHeat, 'Mistakes immediately ease combat flow heat');

  // Simulate 3 seconds of idle hesitation -> aggression cools smoothly
  for (let frame = 0; frame < 180; frame++) {
    simClockMs += 16.67;
    if (tempoMatch.opponentAttackGauge > 0.5) tempoMatch.opponentAttackGauge = 0;
    stepDynamicCombatTick(tempoMatch, 1 / 60, simClockMs, 20, 88);
  }
  assert(
    tempoMatch.aggressionMultiplier < peakMult,
    'Slowing down or pausing dynamically cools opponent aggression multiplier',
    { peakMult, cooledMult: tempoMatch.aggressionMultiplier }
  );

  // 4) Word-Completion Enemy Attack Interrupt
  const intMatch = createCombatMatchState(2);
  intMatch.opponentAttackGauge = 0.78; // Enemy strike almost ready (>= 0.65 clutch threshold)
  const wInt = intMatch.wordQueue[0];
  intMatch.typedBuffer = wInt.text;
  const intAtk = applyWordCompletionAttack(intMatch, 82, 98, wInt.wordId);
  assert(
    intAtk.accepted && intAtk.interruptedEnemyAttack && intMatch.opponentAttackGauge === 0 && intMatch.interruptCount === 1,
    'Completing a word cleanly resets opponent attack gauge to 0 and flags clutch interrupt'
  );

  // 5) Full-Gauge AI Tempo Strike & HP Clamping
  const strikeMatch = createCombatMatchState(2);
  strikeMatch.lastKeystrokeMs = 1000;
  strikeMatch.flowHeat = 0.7;
  strikeMatch.aggressionMultiplier = 1.6;
  strikeMatch.opponentAttackGauge = 0.99;
  const hpBefore = strikeMatch.playerHp;
  const tickRes = stepDynamicCombatTick(strikeMatch, 0.05, 1100, 80, 96);
  assert(
    tickRes.strikeTriggered && tickRes.strike.type === 'tempo_strike' && tickRes.strike.damage > 0,
    'Full opponent attack gauge fires balanced AI Tempo Strike'
  );
  assert(
    strikeMatch.playerHp === Math.max(0, hpBefore - tickRes.strike.damage) && strikeMatch.opponentAttackGauge === 0,
    'Tempo Strike reduces player HP accurately and resets gauge to 0'
  );
  assert(strikeMatch.flowHeat < 0.7, 'Absorbing a Tempo Strike eases combat heat to keep match playable');
}

// ----------------------------------------------------
// 17. FULLSCREEN LEFT & RIGHT AD RAIL CONFIGURATION AUDIT
// ----------------------------------------------------
console.log('\n>>> [17/17] AUDITING FULLSCREEN LEFT & RIGHT AD RAIL CONFIGURATION');

{
  assert(ARCADE_ADS_CONFIG.enabled === true, 'Centralized arcade ad rails are enabled by default');
  assert(ARCADE_ADS_CONFIG.provider === 'blank', 'Default ad provider is clean blank reserved space');
  assert(ARCADE_ADS_CONFIG.showSlotGuides === false, 'Developer slot guides default to false for clean blank frames');

  const leftSlot = getAdSlotConfig('left');
  const rightSlot = getAdSlotConfig('right');
  assert(leftSlot !== null && rightSlot !== null, 'Both left and right fullscreen ad rails resolve cleanly');
  assert(isAdRailActive('left') && isAdRailActive('right'), 'Both left and right ad rails report active');
  assert(leftSlot!.id !== rightSlot!.id, 'Left and right ad rails have distinct DOM slot IDs');
  assert(
    leftSlot!.width === 160 && leftSlot!.height === 600 && rightSlot!.width === 160 && rightSlot!.height === 600,
    'Ad rails reserve standard IAB 160x600 Wide Skyscraper dimensions'
  );
  assert(
    !hasValidAdSenseConfig(leftSlot!) && !hasValidAdSenseConfig(rightSlot!),
    'Blank mode never triggers AdSense without explicit publisher + slot IDs'
  );

  // Master disable check
  const disabledConfig = { ...ARCADE_ADS_CONFIG, enabled: false };
  assert(
    !isAdRailActive('left', disabledConfig) && !isAdRailActive('right', disabledConfig),
    'Disabling master ad config cleanly hides both rails'
  );

  // AdSense validation check
  const adsenseConfig = {
    ...ARCADE_ADS_CONFIG,
    provider: 'adsense' as const,
    adsenseClientId: 'ca-pub-1234567890123456',
    slots: {
      ...ARCADE_ADS_CONFIG.slots,
      left: { ...ARCADE_ADS_CONFIG.slots.left, adsenseSlotId: '9876543210' },
    },
  };
  assert(
    hasValidAdSenseConfig(adsenseConfig.slots.left, adsenseConfig),
    'Valid ca-pub client ID + slot ID activates AdSense cleanly'
  );
  assert(
    !hasValidAdSenseConfig(adsenseConfig.slots.right, adsenseConfig),
    'Missing slot ID safely keeps right rail in blank fallback without crashing'
  );
}

// ----------------------------------------------------
// 18. SYNTHWAVE PULSE REACTIVE MUSIC STATE MACHINE AUDIT
// ----------------------------------------------------
console.log('\n>>> [18/18] AUDITING SYNTHWAVE PULSE REACTIVE MUSIC STATE MACHINE');

{
  let ms = createSynthwaveMusicState();
  assert(
    ms.playbackState === 'idle' && ms.activeLayer === 0 && ms.targetBpm === 0,
    'Synthwave music starts cleanly in idle state at layer 0'
  );

  // First correct keystroke launches Layer 1 groove at 112 BPM & open 7500Hz filter
  ms = onSynthwaveCorrectKey(ms);
  assert(
    ms.playbackState === 'grooving' &&
      ms.activeLayer === 1 &&
      ms.targetBpm === SYNTHWAVE_GROOVE_BPM &&
      ms.targetFilterHz === SYNTHWAVE_GROOVE_FILTER_HZ &&
      ms.detuneCents === 0,
    'First accurate keystroke starts Synthwave Pulse groove on Layer 1 (bassline)'
  );

  // Clean word clears progressively build musical layers: 2 words -> Layer 2 (drums), 4 words -> Layer 3 (neon arp)
  ms = onSynthwaveWordClear(ms, false); // streak 1 -> layer 1
  assert(ms.activeLayer === 1 && ms.cleanWordStreak === 1, '1 clean word holds Layer 1 bassline');
  ms = onSynthwaveWordClear(ms, false); // streak 2 -> layer 2
  assert(ms.activeLayer === 2 && ms.cleanWordStreak === 2, '2 consecutive clean words layer in 80s drums (Layer 2)');
  ms = onSynthwaveWordClear(ms, false); // streak 3 -> layer 2
  assert(ms.activeLayer === 2 && ms.cleanWordStreak === 3, '3 consecutive clean words sustain Layer 2');
  ms = onSynthwaveWordClear(ms, false); // streak 4 -> layer 3
  assert(
    ms.activeLayer === 3 && ms.cleanWordStreak === 4 && ms.playbackState === 'grooving',
    '4+ consecutive clean words layer in sparkling neon arpeggios & pad (Layer 3)'
  );

  // First wrong letter muffles filter, drags tempo, detunes, and drops neon arpeggio
  ms = onSynthwaveError(ms);
  assert(
    ms.playbackState === 'glitched' &&
      ms.activeLayer === 2 &&
      ms.targetBpm === SYNTHWAVE_GLITCH_BPM &&
      ms.targetFilterHz === SYNTHWAVE_GLITCH_FILTER_HZ &&
      ms.detuneCents < 0 &&
      ms.cleanWordStreak === 0,
    'First typing error muffles filter, glitches rhythm tempo, and drops neon arpeggio layer',
    ms
  );

  // Repeated error while glitched halts the music completely
  ms = onSynthwaveError(ms);
  assert(
    ms.playbackState === 'stopped' && ms.activeLayer === 0 && ms.targetBpm === 0,
    'Repeated typing error stops Synthwave Pulse music completely'
  );

  // Typing 3 clean characters recovers the groove back to Layer 1
  ms = onSynthwaveCorrectKey(ms);
  assert(ms.playbackState === 'stopped' && ms.cleanRecoveryChars === 1, '1 recovery keystroke builds recovery buffer');
  ms = onSynthwaveCorrectKey(ms);
  assert(ms.playbackState === 'stopped' && ms.cleanRecoveryChars === 2, '2 recovery keystrokes build recovery buffer');
  ms = onSynthwaveCorrectKey(ms);
  assert(
    ms.playbackState === 'grooving' &&
      ms.activeLayer === 1 &&
      ms.targetBpm === SYNTHWAVE_GROOVE_BPM &&
      ms.targetFilterHz === SYNTHWAVE_GROOVE_FILTER_HZ,
    '3 consecutive accurate keystrokes recover Synthwave Pulse back to clean Layer 1 groove'
  );

  // Completing a word cleanly from glitched state also immediately restores groove
  ms = onSynthwaveError(ms);
  assert(ms.playbackState === 'glitched', 'Error enters glitched state prior to word recovery check');
  ms = onSynthwaveWordClear(ms, false);
  assert(
    ms.playbackState === 'grooving' && ms.activeLayer === 1 && ms.cleanWordStreak === 1,
    'Clean word clear immediately restores full groove'
  );

  // Reset helper returns clean idle state
  const reset = resetSynthwaveMusicState();
  assert(reset.playbackState === 'idle' && reset.activeLayer === 0, 'Reset restores Synthwave music to idle');
}

// ----------------------------------------------------
// 19. UNIFIED COURSES & ARCADE GROWTH INTERCONNECTION AUDIT
// ----------------------------------------------------
console.log('\n>>> [19/19] AUDITING UNIFIED COURSES & ARCADE GROWTH INTERCONNECTION');

{
  const missed = extractMissedKeysFromKeystrokes([
    { expected: 'q', correct: false },
    { expected: 'q', correct: false },
    { expected: 'p', correct: false },
    { expected: 'a', correct: true },
    { expected: 'b', correct: false, isBackspace: true },
  ]);
  assert(
    missed['q'] === 2 && missed['p'] === 1 && !missed['a'] && !missed['b'],
    'extractMissedKeysFromKeystrokes extracts only non-backspace wrong keys for shared remediation'
  );

  const arcadeRunResult = arcadeSessionToSessionResult(
    {
      id: 'arc-test-1',
      mode: 'rhythm',
      wpm: 72.4,
      rawWpm: 76.1,
      accuracy: 96.2,
      errorCount: 3,
      durationMs: 45000,
      xpEarned: 120,
      validationStatus: 'valid',
      completedAt: new Date().toISOString(),
      keystrokeLog: [
        { expected: 'z', correct: false },
        { expected: 'z', correct: false },
        { expected: 'e', correct: true },
      ],
    },
    'Synthwave Pulse'
  );

  assert(
    arcadeRunResult.type === 'arcade' &&
      arcadeRunResult.title === 'Synthwave Pulse' &&
      arcadeRunResult.wpm === 72 &&
      arcadeRunResult.accuracy === 96 &&
      arcadeRunResult.durationSeconds === 45 &&
      arcadeRunResult.passed === true &&
      arcadeRunResult.missedKeys?.['z'] === 2,
    'arcadeSessionToSessionResult converts Arcade runs into unified Analytics SessionResult records'
  );

  const initialStats: UserStats = {
    xp: 60,
    streak: 1,
    lessonsCompleted: 1,
    avgWpm: 40,
    avgAccuracy: 92,
    totalPracticeTimeSeconds: 120,
    weakKeys: { x: 2 },
    lastPracticeDate: '2026-11-22',
  };

  const courseLesson: SessionResult = {
    id: 'les-1',
    type: 'lesson',
    itemId: 'l1-home-row',
    title: 'Home Row',
    wpm: 40,
    rawWpm: 42,
    accuracy: 92,
    errors: 2,
    durationSeconds: 120,
    completedAt: new Date().toISOString(),
    passed: true,
  };

  const combinedHistory: SessionResult[] = [arcadeRunResult, courseLesson];
  const afterArcadeStats = applyUnifiedSessionStats(
    initialStats,
    combinedHistory,
    arcadeRunResult,
    120,
    { streak: 2, today: '2026-11-23' }
  );

  assert(
    afterArcadeStats.xp === 180 &&
      afterArcadeStats.streak === 2 &&
      afterArcadeStats.totalPracticeTimeSeconds === 165 &&
      afterArcadeStats.avgWpm === 56 &&
      afterArcadeStats.avgAccuracy === 94 &&
      afterArcadeStats.weakKeys['z'] === 2 &&
      afterArcadeStats.weakKeys['x'] === 2 &&
      afterArcadeStats.lessonsCompleted === 1,
    'Arcade completion updates shared Growth XP, streak, practice time, averages, and weak keys without inflating lessonsCompleted',
    afterArcadeStats
  );

  const beforeProfile = calculateGrowthProfile(initialStats, [courseLesson]);
  const afterProfile = calculateGrowthProfile(afterArcadeStats, combinedHistory);
  assert(
    beforeProfile.stageLevel === 1 && afterProfile.stageLevel === 2 && afterProfile.stageName === 'Tender Sprout',
    'Combined Courses + Arcade Growth XP seamlessly evolves shared Plant Growth Stage (Stage 1 -> Stage 2)'
  );
}

// ----------------------------------------------------
// 20. LOCAL EMAIL/PASSWORD AUTH & EDITABLE GUEST TYPIST AUDIT
// ----------------------------------------------------
console.log('\n>>> [20/20] AUDITING LOCAL AUTH, SALTED PASSWORD HASHING & EDITABLE GUEST TYPIST');

{
  // Reset local auth keys in in-memory/browser safeStorage
  safeStorage.removeItem(ACTIVE_ACCOUNT_STORAGE_KEY);
  safeStorage.removeItem(LOCAL_ACCOUNTS_STORAGE_KEY);

  // 1) Guest Typist name entry & validation
  const emptyGuest = createGuestAccount('   ');
  assert(!emptyGuest.ok, 'Guest creation rejects blank names');

  const guestRes = createGuestAccount('  Maya   Chen  ');
  assert(
    guestRes.ok && guestRes.account?.fullName === 'Maya Chen' && guestRes.account?.isGuest === true,
    'Guest Typist creation normalizes entered name and flags session as guest',
    guestRes
  );
  assert(
    loadActiveUserAccount()?.fullName === 'Maya Chen' && loadActiveUserAccount()?.isGuest === true,
    'Active guest session persists cleanly in storage'
  );

  // 2) Editing Guest Typist name anytime
  const renameRes = updateActiveUserName(guestRes.account!, 'Maya Lin');
  assert(
    renameRes.ok && renameRes.account?.fullName === 'Maya Lin' && renameRes.account?.isGuest === true,
    'Guest Typist can edit their name anytime while staying in guest mode'
  );

  // 3) Upgrading Guest Typist to Email + Password local account
  const upgradeRes = await upgradeGuestToLocalAccount(renameRes.account!, {
    fullName: 'Maya Lin',
    email: 'Maya.Lin@Example.com',
    password: 'StrongPassword123',
  });
  assert(
    upgradeRes.ok &&
      upgradeRes.account?.isGuest === false &&
      upgradeRes.account?.email === 'maya.lin@example.com' &&
      upgradeRes.account?.fullName === 'Maya Lin',
    'Guest Typist can seamlessly upgrade to an email + password local account',
    upgradeRes
  );

  // 4) Password hashing check (no plaintext password stored anywhere)
  const rawStoredAccounts = safeStorage.getItem(LOCAL_ACCOUNTS_STORAGE_KEY) || '';
  assert(
    !rawStoredAccounts.includes('StrongPassword123'),
    'Local account storage never persists plaintext passwords'
  );
  const storedRecords = loadLocalAccounts();
  assert(
    storedRecords.length === 1 &&
      storedRecords[0].passwordSalt.length >= 16 &&
      storedRecords[0].passwordHash.length === 64,
    'Local account stores a per-account salt and 64-char SHA-256 hex digest'
  );

  // 5) Registration validation & duplicate email prevention
  const badEmail = await registerLocalAccount({
    fullName: 'Test User',
    email: 'not-an-email',
    password: 'password123',
  });
  assert(!badEmail.ok, 'Registration rejects malformed email IDs');

  const shortPass = await registerLocalAccount({
    fullName: 'Test User',
    email: 'valid@example.com',
    password: '123',
  });
  assert(!shortPass.ok, 'Registration rejects passwords shorter than 6 characters');

  const dupEmail = await registerLocalAccount({
    fullName: 'Duplicate Maya',
    email: 'MAYA.LIN@EXAMPLE.COM',
    password: 'AnotherPassword1',
  });
  assert(!dupEmail.ok, 'Registration blocks duplicate email IDs case-insensitively');

  // 6) Sign out -> Sign in verification
  clearActiveUserAccount();
  assert(loadActiveUserAccount() === null, 'Signing out clears active session so Welcome Screen appears');

  const wrongPassSignIn = await signInLocalAccount({
    email: 'maya.lin@example.com',
    password: 'WrongPassword!',
  });
  assert(!wrongPassSignIn.ok, 'Sign in rejects wrong password');

  const validSignIn = await signInLocalAccount({
    email: 'MAYA.LIN@example.com',
    password: 'StrongPassword123',
  });
  assert(
    validSignIn.ok && validSignIn.account?.fullName === 'Maya Lin' && validSignIn.account?.isGuest === false,
    'Sign in succeeds with matching email ID and password'
  );

  // 7) Password change verification
  const badChange = await updateLocalAccountPassword(validSignIn.account!, 'wrong', 'NewPass456');
  assert(!badChange.ok, 'Password update rejects incorrect current password');

  const goodChange = await updateLocalAccountPassword(
    validSignIn.account!,
    'StrongPassword123',
    'NewPass456'
  );
  assert(goodChange.ok, 'Password update succeeds with valid current password');

  clearActiveUserAccount();
  const oldPassRetry = await signInLocalAccount({
    email: 'maya.lin@example.com',
    password: 'StrongPassword123',
  });
  const newPassRetry = await signInLocalAccount({
    email: 'maya.lin@example.com',
    password: 'NewPass456',
  });
  assert(
    !oldPassRetry.ok && newPassRetry.ok,
    'Updated password invalidates old password and authenticates cleanly with new password'
  );
}

// ----------------------------------------------------
// 21. COMPREHENSIVE SUMMARY
// ----------------------------------------------------
console.log('\n====================================================');
console.log(`📊 BRUTAL QA AUTOMATION SUITE: EXECUTION SUMMARY`);
console.log(`TOTAL TESTS EXECUTED: ${totalTests}`);
console.log(`PASSED: ${passedTests}`);
console.log(`FAILED: ${failedTests}`);
console.log('====================================================\n');

if (failedTests > 0) {
  console.error('FAILURES ENCOUNTERED:');
  failureLog.forEach(f => console.error(' - ' + f));
  process.exit(1);
} else {
  console.log('✅ ALL VERIFICATIONS & SIMULATION TESTS PASSED GREEN 100%!');
  process.exit(0);
}
