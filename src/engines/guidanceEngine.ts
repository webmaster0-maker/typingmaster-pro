import { KeyMapping, FingerType, HandType, GuidanceState, HandAnimationState } from '../types';

export const KEYBOARD_LAYOUT: KeyMapping[] = [
  // Row 0 (Number row)
  { key: '`', display: '~', hand: 'left', finger: 'left_pinky', row: 0, col: 0 },
  { key: '1', display: '1', hand: 'left', finger: 'left_pinky', row: 0, col: 1 },
  { key: '2', display: '2', hand: 'left', finger: 'left_ring', row: 0, col: 2 },
  { key: '3', display: '3', hand: 'left', finger: 'left_middle', row: 0, col: 3 },
  { key: '4', display: '4', hand: 'left', finger: 'left_index', row: 0, col: 4 },
  { key: '5', display: '5', hand: 'left', finger: 'left_index', row: 0, col: 5 },
  { key: '6', display: '6', hand: 'right', finger: 'right_index', row: 0, col: 6 },
  { key: '7', display: '7', hand: 'right', finger: 'right_index', row: 0, col: 7 },
  { key: '8', display: '8', hand: 'right', finger: 'right_middle', row: 0, col: 8 },
  { key: '9', display: '9', hand: 'right', finger: 'right_ring', row: 0, col: 9 },
  { key: '0', display: '0', hand: 'right', finger: 'right_pinky', row: 0, col: 10 },
  { key: '-', display: '_', hand: 'right', finger: 'right_pinky', row: 0, col: 11 },
  { key: '=', display: '+', hand: 'right', finger: 'right_pinky', row: 0, col: 12 },

  // Row 1 (Top row)
  { key: 'q', display: 'Q', hand: 'left', finger: 'left_pinky', row: 1, col: 0 },
  { key: 'w', display: 'W', hand: 'left', finger: 'left_ring', row: 1, col: 1 },
  { key: 'e', display: 'E', hand: 'left', finger: 'left_middle', row: 1, col: 2 },
  { key: 'r', display: 'R', hand: 'left', finger: 'left_index', row: 1, col: 3 },
  { key: 't', display: 'T', hand: 'left', finger: 'left_index', row: 1, col: 4 },
  { key: 'y', display: 'Y', hand: 'right', finger: 'right_index', row: 1, col: 5 },
  { key: 'u', display: 'U', hand: 'right', finger: 'right_index', row: 1, col: 6 },
  { key: 'i', display: 'I', hand: 'right', finger: 'right_middle', row: 1, col: 7 },
  { key: 'o', display: 'O', hand: 'right', finger: 'right_ring', row: 1, col: 8 },
  { key: 'p', display: 'P', hand: 'right', finger: 'right_pinky', row: 1, col: 9 },
  { key: '[', display: '{', hand: 'right', finger: 'right_pinky', row: 1, col: 10 },
  { key: ']', display: '}', hand: 'right', finger: 'right_pinky', row: 1, col: 11 },
  { key: '\\', display: '|', hand: 'right', finger: 'right_pinky', row: 1, col: 12 },

  // Row 2 (Home row)
  { key: 'a', display: 'A', hand: 'left', finger: 'left_pinky', row: 2, col: 0 },
  { key: 's', display: 'S', hand: 'left', finger: 'left_ring', row: 2, col: 1 },
  { key: 'd', display: 'D', hand: 'left', finger: 'left_middle', row: 2, col: 2 },
  { key: 'f', display: 'F', hand: 'left', finger: 'left_index', row: 2, col: 3 },
  { key: 'g', display: 'G', hand: 'left', finger: 'left_index', row: 2, col: 4 },
  { key: 'h', display: 'H', hand: 'right', finger: 'right_index', row: 2, col: 5 },
  { key: 'j', display: 'J', hand: 'right', finger: 'right_index', row: 2, col: 6 },
  { key: 'k', display: 'K', hand: 'right', finger: 'right_middle', row: 2, col: 7 },
  { key: 'l', display: 'L', hand: 'right', finger: 'right_ring', row: 2, col: 8 },
  { key: ';', display: ':', hand: 'right', finger: 'right_pinky', row: 2, col: 9 },
  { key: "'", display: '"', hand: 'right', finger: 'right_pinky', row: 2, col: 10 },

  // Row 3 (Bottom row)
  { key: 'z', display: 'Z', hand: 'left', finger: 'left_pinky', row: 3, col: 0 },
  { key: 'x', display: 'X', hand: 'left', finger: 'left_ring', row: 3, col: 1 },
  { key: 'c', display: 'C', hand: 'left', finger: 'left_middle', row: 3, col: 2 },
  { key: 'v', display: 'V', hand: 'left', finger: 'left_index', row: 3, col: 3 },
  { key: 'b', display: 'B', hand: 'left', finger: 'left_index', row: 3, col: 4 },
  { key: 'n', display: 'N', hand: 'right', finger: 'right_index', row: 3, col: 5 },
  { key: 'm', display: 'M', hand: 'right', finger: 'right_index', row: 3, col: 6 },
  { key: ',', display: '<', hand: 'right', finger: 'right_middle', row: 3, col: 7 },
  { key: '.', display: '>', hand: 'right', finger: 'right_ring', row: 3, col: 8 },
  { key: '/', display: '?', hand: 'right', finger: 'right_pinky', row: 3, col: 9 },

  // Row 4 (Space)
  { key: ' ', display: 'SPACE', hand: 'both', finger: 'right_thumb', row: 4, col: 0 }
];

export const FINGER_DISPLAY_NAMES: Record<FingerType, string> = {
  left_pinky: 'Left Pinky',
  left_ring: 'Left Ring Finger',
  left_middle: 'Left Middle Finger',
  left_index: 'Left Index Finger',
  left_thumb: 'Left Thumb',
  right_thumb: 'Right Thumb',
  right_index: 'Right Index Finger',
  right_middle: 'Right Middle Finger',
  right_ring: 'Right Ring Finger',
  right_pinky: 'Right Pinky',
  none: 'None'
};

// Comprehensive map of shifted symbols to their physical base key and hand/finger assignment
export const SHIFTED_SYMBOLS_MAP: Record<string, { baseKey: string; hand: HandType; finger: FingerType; shiftHand: HandType; shiftFinger: FingerType }> = {
  '~': { baseKey: '`', hand: 'left', finger: 'left_pinky', shiftHand: 'right', shiftFinger: 'right_pinky' },
  '!': { baseKey: '1', hand: 'left', finger: 'left_pinky', shiftHand: 'right', shiftFinger: 'right_pinky' },
  '@': { baseKey: '2', hand: 'left', finger: 'left_ring', shiftHand: 'right', shiftFinger: 'right_pinky' },
  '#': { baseKey: '3', hand: 'left', finger: 'left_middle', shiftHand: 'right', shiftFinger: 'right_pinky' },
  '$': { baseKey: '4', hand: 'left', finger: 'left_index', shiftHand: 'right', shiftFinger: 'right_pinky' },
  '%': { baseKey: '5', hand: 'left', finger: 'left_index', shiftHand: 'right', shiftFinger: 'right_pinky' },
  '^': { baseKey: '6', hand: 'right', finger: 'right_index', shiftHand: 'left', shiftFinger: 'left_pinky' },
  '&': { baseKey: '7', hand: 'right', finger: 'right_index', shiftHand: 'left', shiftFinger: 'left_pinky' },
  '*': { baseKey: '8', hand: 'right', finger: 'right_middle', shiftHand: 'left', shiftFinger: 'left_pinky' },
  '(': { baseKey: '9', hand: 'right', finger: 'right_ring', shiftHand: 'left', shiftFinger: 'left_pinky' },
  ')': { baseKey: '0', hand: 'right', finger: 'right_pinky', shiftHand: 'left', shiftFinger: 'left_pinky' },
  '_': { baseKey: '-', hand: 'right', finger: 'right_pinky', shiftHand: 'left', shiftFinger: 'left_pinky' },
  '+': { baseKey: '=', hand: 'right', finger: 'right_pinky', shiftHand: 'left', shiftFinger: 'left_pinky' },
  '{': { baseKey: '[', hand: 'right', finger: 'right_pinky', shiftHand: 'left', shiftFinger: 'left_pinky' },
  '}': { baseKey: ']', hand: 'right', finger: 'right_pinky', shiftHand: 'left', shiftFinger: 'left_pinky' },
  '|': { baseKey: '\\', hand: 'right', finger: 'right_pinky', shiftHand: 'left', shiftFinger: 'left_pinky' },
  ':': { baseKey: ';', hand: 'right', finger: 'right_pinky', shiftHand: 'left', shiftFinger: 'left_pinky' },
  '"': { baseKey: "'", hand: 'right', finger: 'right_pinky', shiftHand: 'left', shiftFinger: 'left_pinky' },
  '<': { baseKey: ',', hand: 'right', finger: 'right_middle', shiftHand: 'left', shiftFinger: 'left_pinky' },
  '>': { baseKey: '.', hand: 'right', finger: 'right_ring', shiftHand: 'left', shiftFinger: 'left_pinky' },
  '?': { baseKey: '/', hand: 'right', finger: 'right_pinky', shiftHand: 'left', shiftFinger: 'left_pinky' },
};

export function getGuidanceForChar(char: string, animState: HandAnimationState = 'target'): GuidanceState {
  if (char === ' ') {
    return {
      expectedKey: ' ',
      displayKey: 'SPACE',
      hand: 'right',
      finger: 'right_thumb',
      fingerName: 'Right Thumb',
      row: 4,
      col: 0,
      animationState: animState,
      requiresShift: false
    };
  }

  // Check shifted symbols first
  if (SHIFTED_SYMBOLS_MAP[char]) {
    const symbolInfo = SHIFTED_SYMBOLS_MAP[char];
    const baseKeyDef = KEYBOARD_LAYOUT.find(k => k.key === symbolInfo.baseKey);
    return {
      expectedKey: char,
      displayKey: char,
      hand: symbolInfo.hand,
      finger: symbolInfo.finger,
      fingerName: FINGER_DISPLAY_NAMES[symbolInfo.finger] || 'Index Finger',
      row: baseKeyDef?.row ?? 0,
      col: baseKeyDef?.col ?? 0,
      animationState: animState,
      requiresShift: true,
      shiftHand: symbolInfo.shiftHand,
      shiftFinger: symbolInfo.shiftFinger
    };
  }

  // Check if uppercase letter A-Z
  const isUpperLetter = char >= 'A' && char <= 'Z';
  const lookupKey = char.toLowerCase();
  const found = KEYBOARD_LAYOUT.find(k => k.key === lookupKey || k.display.toLowerCase() === lookupKey);

  if (!found) {
    return {
      expectedKey: char,
      displayKey: char.toUpperCase(),
      hand: 'right',
      finger: 'right_index',
      fingerName: 'Right Index Finger',
      row: 2,
      col: 6,
      animationState: animState,
      requiresShift: false
    };
  }

  // If uppercase letter, opposite shift hand is used
  const requiresShift = isUpperLetter;
  const shiftHand: HandType = found.hand === 'left' ? 'right' : 'left';
  const shiftFinger: FingerType = found.hand === 'left' ? 'right_pinky' : 'left_pinky';

  return {
    expectedKey: char,
    displayKey: isUpperLetter ? char : found.display,
    hand: found.hand,
    finger: found.finger,
    fingerName: FINGER_DISPLAY_NAMES[found.finger] || 'Index Finger',
    row: found.row,
    col: found.col,
    animationState: animState,
    requiresShift,
    shiftHand: requiresShift ? shiftHand : undefined,
    shiftFinger: requiresShift ? shiftFinger : undefined
  };
}
