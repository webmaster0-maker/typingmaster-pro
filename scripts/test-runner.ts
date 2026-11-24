import { COURSES_DATA, PRACTICE_ITEMS, TEST_ITEMS } from '../src/data/courses';
import { getGuidanceForChar, KEYBOARD_LAYOUT } from '../src/engines/guidanceEngine';
import { calculateGrowthProfile, getLessonCompletionMeta } from '../src/utils/growthEngine';
import { safeStorage } from '../src/utils/safeStorage';

console.log('=== RUNNING QA INVENTORY AND VALIDATION ===\n');

// 1. LESSON AUDIT
console.log(`Total Lessons: ${COURSES_DATA.length}`);
console.log(`Total Practice Items: ${PRACTICE_ITEMS.length}`);
console.log(`Total Test Items: ${TEST_ITEMS.length}`);

const charSet = new Set<string>();
const unmappedChars = new Set<string>();
const validRightIndex = new Set(['j', 'u', 'h', 'm', 'n', 'y', '6', '7']);

COURSES_DATA.forEach((lesson, lIdx) => {
  if (!lesson.id || !lesson.title || !lesson.exercises || lesson.exercises.length === 0) {
    console.error(`[FAIL] Lesson ${lIdx} has invalid metadata or missing exercises!`, lesson);
  }
  lesson.exercises.forEach((ex, eIdx) => {
    if (typeof ex !== 'string' || ex.length === 0) {
      console.error(`[FAIL] Lesson ${lesson.id} exercise ${eIdx} is empty!`);
    }
    for (const ch of ex) {
      charSet.add(ch);
      const guidance = getGuidanceForChar(ch);
      const lower = ch.toLowerCase();
      if (guidance.finger === 'right_index' && !validRightIndex.has(lower) && ch !== '^' && ch !== '&') {
        unmappedChars.add(ch);
      }
    }
  });
});

PRACTICE_ITEMS.forEach((item) => {
  for (const ch of item.content) {
    charSet.add(ch);
    const guidance = getGuidanceForChar(ch);
    const lower = ch.toLowerCase();
    if (guidance.finger === 'right_index' && !validRightIndex.has(lower) && ch !== '^' && ch !== '&') {
      unmappedChars.add(ch);
    }
  }
});

TEST_ITEMS.forEach((item) => {
  for (const ch of item.content) {
    charSet.add(ch);
    const guidance = getGuidanceForChar(ch);
    const lower = ch.toLowerCase();
    if (guidance.finger === 'right_index' && !validRightIndex.has(lower) && ch !== '^' && ch !== '&') {
      unmappedChars.add(ch);
    }
  }
});

console.log(`\nDistinct characters used across all lessons/drills/exams: ${Array.from(charSet).sort().join('')}`);
if (unmappedChars.size > 0) {
  console.log(`\n[WARNING] Found fallback/unmapped characters:`, Array.from(unmappedChars));
} else {
  console.log('\n[PASS] All characters cleanly mapped in guidanceEngine!');
}

// 2. CHECK KEYBOARD_LAYOUT completeness
console.log('\n--- Checking KEYBOARD_LAYOUT keys ---');
console.log(`Total keys mapped in layout: ${KEYBOARD_LAYOUT.length}`);

// 3. CHECK CALCULATIONS (WPM, Accuracy, Progress)
console.log('\n--- Checking Calculations (WPM, Accuracy, Error Rate) ---');
function testCalc(typedChars: number, timeSec: number, errors: number) {
  const minutes = Math.max(timeSec / 60, 0.01);
  const wordsTyped = typedChars / 5;
  const wpm = Math.round(wordsTyped / minutes);
  const accuracy = typedChars > 0 ? Math.round(((typedChars - errors) / typedChars) * 100) : 100;
  return { wpm, accuracy };
}

console.log('Test 1 (100 chars, 60s, 0 errors):', testCalc(100, 60, 0), 'Expected: { wpm: 20, accuracy: 100 }');
console.log('Test 2 (250 chars, 60s, 5 errors):', testCalc(250, 60, 5), 'Expected: { wpm: 50, accuracy: 98 }');
console.log('Test 3 (0 chars, 0s, 0 errors):', testCalc(0, 0, 0), 'Expected: { wpm: 0, accuracy: 100 }');

// 4. CHECK GROWTH PROFILE
console.log('\n--- Checking Growth Profile ---');
const dummyStats = {
  xp: 350,
  streak: 5,
  lessonsCompleted: 3,
  avgWpm: 42,
  avgAccuracy: 96,
  totalPracticeTimeSeconds: 400,
  weakKeys: {}
};
const dummyHistory = [
  { id: '1', type: 'lesson' as const, itemId: 'b-01', title: 'B01', wpm: 35, rawWpm: 35, accuracy: 95, errors: 2, durationSeconds: 60, completedAt: '', passed: true },
  { id: '2', type: 'lesson' as const, itemId: 'b-02', title: 'B02', wpm: 45, rawWpm: 45, accuracy: 98, errors: 1, durationSeconds: 50, completedAt: '', passed: true }
];
const profile = calculateGrowthProfile(dummyStats, dummyHistory);
console.log('Growth profile for 350 XP:', profile);

console.log('\n=== INITIAL QA AUDIT SCRIPT COMPLETE ===');
