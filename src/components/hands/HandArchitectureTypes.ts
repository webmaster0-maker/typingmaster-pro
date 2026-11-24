/**
 * Unified Architecture Definitions for Touch Typing Hands Visualization
 * Coordinates are mathematically mirrored around home row centers:
 *   Left Hand (A-S-D-F center = 223.25)  <-->  Right Hand (J-K-L-; center = 550.25)
 *   Mirror axis formula: xRight = 773.5 - xLeft
 */

export type HandThemeMode =
  | 'typing_com_pro'   // Default: Typing.com translucent outline with highlighted active finger
  | 'radiant_modern'   // Illustrated skin-tone hands with anatomical shading
  | 'glass_cyber';     // Minimalist frosted glass hands with glowing fingertip guides

export type SkinToneId =
  | 'warm_sand'
  | 'sunlit_amber'
  | 'fair_ivory'
  | 'golden_tan'
  | 'rich_bronze'
  | 'deep_espresso';

export interface SkinPalette {
  id: SkinToneId;
  label: string;
  palmGradStart: string;
  palmGradMid: string;
  palmGradEnd: string;
  fingerGradStart: string;
  fingerGradEnd: string;
  stroke: string;
  knuckleHighlight: string;
  creaseStroke: string;
  nailBed: string;
  nailLunula: string;
  activeAura: string;
  subdermalWarmth?: string;
  shadowColor?: string;
}

export const SKIN_PALETTES: Record<SkinToneId, SkinPalette> = {
  warm_sand: {
    id: 'warm_sand',
    label: 'Warm Sand',
    palmGradStart: '#FDE8DB',
    palmGradMid: '#F5CCA0',
    palmGradEnd: '#DFA77B',
    fingerGradStart: '#FDE4D2',
    fingerGradEnd: '#E6B690',
    stroke: '#B88258',
    knuckleHighlight: '#FFF5EE',
    creaseStroke: '#A06E46',
    nailBed: '#F5B8A8',
    nailLunula: '#FFF8F4',
    activeAura: '#0284C7',
    subdermalWarmth: '#FF8A65',
    shadowColor: '#1E120B',
  },
  sunlit_amber: {
    id: 'sunlit_amber',
    label: 'Sunlit Amber',
    palmGradStart: '#F5CCA0',
    palmGradMid: '#E6AD7A',
    palmGradEnd: '#C48352',
    fingerGradStart: '#F5CCA0',
    fingerGradEnd: '#D99862',
    stroke: '#A36534',
    knuckleHighlight: '#FDE3C8',
    creaseStroke: '#8F5122',
    nailBed: '#E59B88',
    nailLunula: '#FBECE7',
    activeAura: '#0EA5E9',
    subdermalWarmth: '#F97316',
    shadowColor: '#1C0D05',
  },
  fair_ivory: {
    id: 'fair_ivory',
    label: 'Fair Ivory',
    palmGradStart: '#FFF4ED',
    palmGradMid: '#FEDECF',
    palmGradEnd: '#EBBBB0',
    fingerGradStart: '#FFF4ED',
    fingerGradEnd: '#F2C8B8',
    stroke: '#C79075',
    knuckleHighlight: '#FFFFFF',
    creaseStroke: '#AF765C',
    nailBed: '#FFBABA',
    nailLunula: '#FFFFFF',
    activeAura: '#0284C7',
    subdermalWarmth: '#FB7185',
    shadowColor: '#1F1410',
  },
  golden_tan: {
    id: 'golden_tan',
    label: 'Golden Tan',
    palmGradStart: '#DEB088',
    palmGradMid: '#C58D5D',
    palmGradEnd: '#A06B3E',
    fingerGradStart: '#DEB088',
    fingerGradEnd: '#B57C4C',
    stroke: '#7E4D25',
    knuckleHighlight: '#EDC9A6',
    creaseStroke: '#6B3E19',
    nailBed: '#C88572',
    nailLunula: '#EFE1DA',
    activeAura: '#06B6D4',
    subdermalWarmth: '#EA580C',
    shadowColor: '#180B03',
  },
  rich_bronze: {
    id: 'rich_bronze',
    label: 'Rich Bronze',
    palmGradStart: '#AD7753',
    palmGradMid: '#8E5833',
    palmGradEnd: '#683B1A',
    fingerGradStart: '#AD7753',
    fingerGradEnd: '#7C4925',
    stroke: '#4D270F',
    knuckleHighlight: '#C49472',
    creaseStroke: '#3D1C08',
    nailBed: '#995847',
    nailLunula: '#DFC8BE',
    activeAura: '#38BDF8',
    subdermalWarmth: '#C2410C',
    shadowColor: '#120703',
  },
  deep_espresso: {
    id: 'deep_espresso',
    label: 'Deep Espresso',
    palmGradStart: '#684535',
    palmGradMid: '#4F2F20',
    palmGradEnd: '#331B10',
    fingerGradStart: '#684535',
    fingerGradEnd: '#432618',
    stroke: '#220F07',
    knuckleHighlight: '#7F5946',
    creaseStroke: '#1A0B05',
    nailBed: '#653B30',
    nailLunula: '#C7B2A8',
    activeAura: '#38BDF8',
    subdermalWarmth: '#9A3412',
    shadowColor: '#0A0402',
  },
};

export interface FingerAnchor {
  key: string;
  label: string;
  hand: 'left' | 'right';
  homeX: number;
  homeY: number;
  mcpX: number;
  mcpY: number;
  width: number;
  length: number;
  zoneColor: string;
  zoneColorDark: string;
  zoneLabel: string;
}

export const HAND_GEOMETRY = {
  left: {
    palmCenterX: 224.0,
    palmCenterY: 304.0,
    wristCenterX: 212.0,
    wristCenterY: 432.0,
    wristOuterX: 152.0,
    wristInnerX: 272.0,
  },
  right: {
    palmCenterX: 549.5,
    palmCenterY: 304.0,
    wristCenterX: 561.5,
    wristCenterY: 432.0,
    wristInnerX: 501.5,
    wristOuterX: 621.5,
  },
} as const;

export const FINGER_ANCHORS: Record<string, FingerAnchor> = {
  left_pinky: {
    key: 'left_pinky',
    label: 'Left Pinky',
    hand: 'left',
    homeX: 141.5,
    homeY: 160,
    mcpX: 158.0,
    mcpY: 248,
    width: 23.0,
    length: 90,
    zoneColor: '#EC4899',
    zoneColorDark: '#BE185D',
    zoneLabel: 'Pinky (1, Q, A, Z, Shift)',
  },
  left_ring: {
    key: 'left_ring',
    label: 'Left Ring',
    hand: 'left',
    homeX: 196.0,
    homeY: 156,
    mcpX: 198.0,
    mcpY: 236,
    width: 25.0,
    length: 80,
    zoneColor: '#F59E0B',
    zoneColorDark: '#D97706',
    zoneLabel: 'Ring (2, W, S, X)',
  },
  left_middle: {
    key: 'left_middle',
    label: 'Left Middle',
    hand: 'left',
    homeX: 250.5,
    homeY: 154,
    mcpX: 242.0,
    mcpY: 231,
    width: 26.0,
    length: 78,
    zoneColor: '#10B981',
    zoneColorDark: '#047857',
    zoneLabel: 'Middle (3, E, D, C)',
  },
  left_index: {
    key: 'left_index',
    label: 'Left Index',
    hand: 'left',
    homeX: 305.0,
    homeY: 156,
    mcpX: 285.0,
    mcpY: 238,
    width: 25.5,
    length: 84,
    zoneColor: '#3B82F6',
    zoneColorDark: '#1D4ED8',
    zoneLabel: 'Index (4, 5, R, T, F, G, V, B)',
  },
  left_thumb: {
    key: 'left_thumb',
    label: 'Left Thumb',
    hand: 'left',
    homeX: 352.0,
    homeY: 256,
    mcpX: 288.0,
    mcpY: 308,
    width: 29.0,
    length: 82,
    zoneColor: '#8B5CF6',
    zoneColorDark: '#6D28D9',
    zoneLabel: 'Space Bar',
  },

  right_thumb: {
    key: 'right_thumb',
    label: 'Right Thumb',
    hand: 'right',
    homeX: 421.5,
    homeY: 256,
    mcpX: 485.5,
    mcpY: 308,
    width: 29.0,
    length: 82,
    zoneColor: '#8B5CF6',
    zoneColorDark: '#6D28D9',
    zoneLabel: 'Space Bar',
  },
  right_index: {
    key: 'right_index',
    label: 'Right Index',
    hand: 'right',
    homeX: 468.5,
    homeY: 156,
    mcpX: 488.5,
    mcpY: 238,
    width: 25.5,
    length: 84,
    zoneColor: '#06B6D4',
    zoneColorDark: '#0E7490',
    zoneLabel: 'Index (6, 7, Y, U, H, J, N, M)',
  },
  right_middle: {
    key: 'right_middle',
    label: 'Right Middle',
    hand: 'right',
    homeX: 523.0,
    homeY: 154,
    mcpX: 531.5,
    mcpY: 231,
    width: 26.0,
    length: 78,
    zoneColor: '#10B981',
    zoneColorDark: '#047857',
    zoneLabel: 'Middle (8, I, K, ,)',
  },
  right_ring: {
    key: 'right_ring',
    label: 'Right Ring',
    hand: 'right',
    homeX: 577.5,
    homeY: 156,
    mcpX: 575.5,
    mcpY: 236,
    width: 25.0,
    length: 80,
    zoneColor: '#F59E0B',
    zoneColorDark: '#D97706',
    zoneLabel: 'Ring (9, O, L, .)',
  },
  right_pinky: {
    key: 'right_pinky',
    label: 'Right Pinky',
    hand: 'right',
    homeX: 632.0,
    homeY: 160,
    mcpX: 615.5,
    mcpY: 248,
    width: 23.0,
    length: 90,
    zoneColor: '#EC4899',
    zoneColorDark: '#BE185D',
    zoneLabel: 'Pinky (0, P, ;, /, Shift, Enter)',
  },
};

export type AnimationSpeedProfile = 'fluid_natural' | 'rapid_snappy' | 'cinematic_tutorial';

export interface JointPositions {
  mcp: { x: number; y: number };
  pip: { x: number; y: number };
  dip: { x: number; y: number };
  tip: { x: number; y: number };
}

export interface FingerRenderPose {
  key: string;
  tipX: number;
  tipY: number;
  mcpX: number;
  mcpY: number;
  pipX: number;
  pipY: number;
  dipX: number;
  dipY: number;
  joints: JointPositions;
  width: number;
  length: number;
  angleDeg: number;
  elevation: number;
  isPressed: boolean;
  isTarget: boolean;
  isShiftTarget?: boolean;
  squashFactor: number;
  reachDx: number;
  reachDy: number;
  shadowBlur: number;
  shadowOpacity: number;
}

export interface HandRenderPose {
  hand: 'left' | 'right';
  palmCenter: { x: number; y: number };
  wristCenter: { x: number; y: number };
  tiltDeg: number;
  palmOffsetX: number;
  palmOffsetY: number;
  fingers: Record<string, FingerRenderPose>;
}
