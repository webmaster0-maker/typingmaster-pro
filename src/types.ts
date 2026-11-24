export type WorkspaceMode = 'lesson' | 'practice' | 'test' | 'exam' | 'adaptive' | 'skill' | 'assessment';

export type GuidanceLevel = 'full' | 'beginner' | 'intermediate' | 'advanced' | 'none';

export type HandType = 'left' | 'right' | 'both' | 'none';

export type SkillLevel = 'beginner' | 'intermediate' | 'advanced' | 'master';

export type FingerType = 
  | 'left_pinky' 
  | 'left_ring' 
  | 'left_middle' 
  | 'left_index' 
  | 'left_thumb' 
  | 'right_thumb' 
  | 'right_index' 
  | 'right_middle' 
  | 'right_ring' 
  | 'right_pinky' 
  | 'none';

export type HandAnimationState = 'idle' | 'ready' | 'target' | 'correct' | 'error';

export interface KeyMapping {
  key: string;
  display: string;
  hand: HandType;
  finger: FingerType;
  row: number;
  col: number;
  shiftKey?: string;
}

export interface GuidanceState {
  expectedKey: string;
  displayKey: string;
  hand: HandType;
  finger: FingerType;
  fingerName: string;
  row: number;
  col: number;
  animationState: HandAnimationState;
  requiresShift?: boolean;
  shiftHand?: HandType;
  shiftFinger?: FingerType;
}

export interface GuidanceConfig {
  keyboardVisible: boolean;
  handsVisible: boolean;
  fingerGuideVisible: boolean;
  targetKeyVisible: boolean;
  guidanceLevel: GuidanceLevel;
}

export interface Lesson {
  id: string;
  level: SkillLevel;
  module: number;
  moduleTitle: string;
  title: string;
  objective: string;
  targetKeys: string[];
  targetFingers: FingerType[];
  targetHands: HandType[];
  exercises: string[];
  assessmentRepetitions: number;
  completionAccuracy: number;
  guidanceConfig: GuidanceConfig;
  description: string;
  isTest?: boolean;
  growthStage?: 'seed' | 'sprout' | 'branch' | 'bloom' | 'evergreen' | 'master_blossom';
  growthPoints?: number;
}

export interface GrowthProfile {
  stageName: string;
  stageLevel: number;
  totalStages: number;
  dewdrops: number;
  totalBlooms: number;
  currentStageMinXp: number;
  nextStageThreshold: number;
  nextStageLevel: number;
  nextStageName: string;
  xpToNextStage: number;
  isMaxStage: boolean;
  progressPercent: number;
}

export interface PracticeItem {
  id: string;
  title: string;
  type: 'weak_key' | 'speed' | 'stamina' | 'rhythm' | 'punctuation';
  language: string;
  layout: string;
  content: string;
  durationMinutes: number;
  guidanceConfig: GuidanceConfig;
  description: string;
}

export interface TestItem {
  id: string;
  title: string;
  durationMinutes: number;
  content: string;
  scoring: 'standard' | 'strict';
  guidanceConfig: GuidanceConfig;
  passWpm: number;
  passAccuracy: number;
  description: string;
}

export type HotspotSeverity = 'critical' | 'moderate' | 'minor';

export type RemediationRuleId =
  | 'priority_cluster'
  | 'finger_overload'
  | 'row_shift_reach'
  | 'single_key_precision';

export interface TrickyKeyHotspot {
  key: string;
  displayKey: string;
  mistakes: number;
  severity: HotspotSeverity;
  finger: FingerType;
  fingerName: string;
  hand: HandType;
  row: number;
  rowName: string;
  requiresShift: boolean;
  homeAnchor: string;
}

export interface GeneratedRemediationLesson extends Lesson {
  ruleId: RemediationRuleId;
  ruleName: string;
  ruleReason: string;
  severity: HotspotSeverity;
  totalMistakes: number;
  stageLabels: [string, string, string];
  remediationTargetKeys: string[];
}

export interface SessionResult {
  id: string;
  type: 'lesson' | 'practice' | 'test' | 'exam' | 'arcade';
  itemId: string;
  title: string;
  wpm: number;
  rawWpm: number;
  accuracy: number;
  errors: number;
  durationSeconds: number;
  completedAt: string;
  passed: boolean;
  missedKeys?: { [key: string]: number };
  scoring?: 'standard' | 'strict';
  remediationTargetKeys?: string[];
  healedKeys?: {
    cleared: string[];
    reduced: string[];
  };
}

export interface UserStats {
  xp: number;
  streak: number;
  lessonsCompleted: number;
  avgWpm: number;
  avgAccuracy: number;
  totalPracticeTimeSeconds: number;
  weakKeys: { [key: string]: number };
  lastPracticeDate?: string;
}

export interface UserAccount {
  id: string;
  fullName: string;
  email?: string;
  isGuest?: boolean;
  createdAt: string;
}

export interface LocalAccountRecord {
  id: string;
  fullName: string;
  email: string;
  passwordSalt: string;
  passwordHash: string;
  createdAt: string;
}

export interface TypingCertificate {
  id: string;
  certificateCode: string;
  sessionId: string;
  testId: string;
  testTitle: string;
  recipientName: string;
  wpm: number;
  accuracy: number;
  errors: number;
  durationSeconds: number;
  scoring: 'standard' | 'strict';
  issuedAt: string;
}

