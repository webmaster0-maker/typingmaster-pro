import { Lesson } from '../types';
import { BEGINNER_LESSONS } from './curriculumBeginner';
import { INTERMEDIATE_LESSONS } from './curriculumIntermediate';
import { ADVANCED_LESSONS } from './curriculumAdvanced';

export { PRACTICE_ITEMS, TEST_ITEMS } from './curriculumParagraphs';

export const COURSES_DATA: Lesson[] = [
  ...BEGINNER_LESSONS,
  ...INTERMEDIATE_LESSONS,
  ...ADVANCED_LESSONS,
];
