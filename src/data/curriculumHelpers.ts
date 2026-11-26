import { FingerType, GuidanceConfig, HandType, Lesson, SkillLevel } from '../types';

const ALL_FINGERS: FingerType[] = [
  'left_pinky',
  'left_ring',
  'left_middle',
  'left_index',
  'right_index',
  'right_middle',
  'right_ring',
  'right_pinky',
  'right_thumb',
];

export const GUIDANCE_FULL: GuidanceConfig = {
  keyboardVisible: true,
  handsVisible: true,
  fingerGuideVisible: true,
  targetKeyVisible: true,
  guidanceLevel: 'full',
};

export const GUIDANCE_BEGINNER: GuidanceConfig = {
  keyboardVisible: true,
  handsVisible: true,
  fingerGuideVisible: true,
  targetKeyVisible: true,
  guidanceLevel: 'beginner',
};

export const GUIDANCE_INTERMEDIATE: GuidanceConfig = {
  keyboardVisible: true,
  handsVisible: false,
  fingerGuideVisible: false,
  targetKeyVisible: true,
  guidanceLevel: 'intermediate',
};

export const GUIDANCE_NONE: GuidanceConfig = {
  keyboardVisible: false,
  handsVisible: false,
  fingerGuideVisible: false,
  targetKeyVisible: false,
  guidanceLevel: 'none',
};

export interface CompactLessonSpec {
  id: string;
  level: SkillLevel;
  module: number;
  moduleTitle: string;
  title: string;
  objective: string;
  targetKeys: string[];
  targetFingers?: FingerType[];
  targetHands?: HandType[];
  exercises: string[];
  assessmentRepetitions?: number;
  completionAccuracy?: number;
  guidanceConfig?: GuidanceConfig;
  description: string;
  isTest?: boolean;
}

/** Builds a complete Lesson entry with sensible defaults for expanded curriculum tracks. */
export function makeLesson(spec: CompactLessonSpec): Lesson {
  return {
    id: spec.id,
    level: spec.level,
    module: spec.module,
    moduleTitle: spec.moduleTitle,
    title: spec.title,
    objective: spec.objective,
    targetKeys: spec.targetKeys,
    targetFingers: spec.targetFingers ?? ALL_FINGERS,
    targetHands: spec.targetHands ?? ['left', 'right', 'both'],
    exercises: spec.exercises,
    assessmentRepetitions: spec.assessmentRepetitions ?? 30,
    completionAccuracy: spec.completionAccuracy ?? (spec.level === 'beginner' ? 91 : spec.level === 'intermediate' ? 94 : 96),
    guidanceConfig: spec.guidanceConfig ?? (spec.level === 'beginner' ? GUIDANCE_BEGINNER : spec.level === 'intermediate' ? GUIDANCE_INTERMEDIATE : GUIDANCE_NONE),
    description: spec.description,
    ...(spec.isTest ? { isTest: true } : {}),
  };
}
