// Keyflow 3D Hand Key Mappings and Kinematic Coordinate Definitions
// Ported from keyflow/src/hands.js & keyflow/src/App.jsx

export interface HandKeyEntry {
  side: 'left' | 'right';
  pose: string;
  finger: string;
}

export interface KeyPoseResult {
  key: string;
  pose: HandKeyEntry | null;
  shift: boolean;
}

export type KeyRowItem = [string, string, number?];

export const KEYBOARD_ROWS: KeyRowItem[][] = [
  [
    ['`', '~'],
    ['1', '!'],
    ['2', '@'],
    ['3', '#'],
    ['4', '$'],
    ['5', '%'],
    ['6', '^'],
    ['7', '&'],
    ['8', '*'],
    ['9', '('],
    ['0', ')'],
    ['-', '_'],
    ['=', '+'],
    ['Backspace', '', 2],
  ],
  [
    ['Tab', '', 1.5],
    ['q', ''],
    ['w', ''],
    ['e', ''],
    ['r', ''],
    ['t', ''],
    ['y', ''],
    ['u', ''],
    ['i', ''],
    ['o', ''],
    ['p', ''],
    ['[', '{'],
    [']', '}'],
    ['\\', '|', 1.5],
  ],
  [
    ['CapsLock', '', 1.75],
    ['a', ''],
    ['s', ''],
    ['d', ''],
    ['f', ''],
    ['g', ''],
    ['h', ''],
    ['j', ''],
    ['k', ''],
    ['l', ''],
    [';', ':'],
    ["'", '"'],
    ['Enter', '', 2.25],
  ],
  [
    ['Shift', '', 2.25],
    ['z', ''],
    ['x', ''],
    ['c', ''],
    ['v', ''],
    ['b', ''],
    ['n', ''],
    ['m', ''],
    [',', '<'],
    ['.', '>'],
    ['/', '?'],
    ['ShiftRight', '', 2.75],
  ],
  [
    ['Control', '', 1.25],
    ['Alt', '', 1.25],
    ['Meta', '', 1.25],
    [' ', '', 6.25],
    ['MetaRight', '', 1.25],
    ['AltRight', '', 1.25],
    ['ControlRight', '', 1.25],
  ],
];

export const KEY_LABELS: Record<string, string> = {
  Backspace: 'delete',
  Tab: 'tab',
  CapsLock: 'caps lock',
  Enter: 'enter',
  Shift: 'shift',
  ShiftRight: 'shift',
  Control: 'ctrl',
  ControlRight: 'ctrl',
  Alt: 'alt',
  AltRight: 'alt',
  Meta: '⌘',
  MetaRight: '⌘',
  ' ': 'space',
};

const entry = (
  side: 'left' | 'right',
  row: string,
  n: number,
  finger: string,
  full = false
): HandKeyEntry => ({
  side,
  pose: `${row}-row-${n}-${side}`,
  finger: finger + (full ? '-full' : ''),
});

export const HAND_KEYS: Record<string, HandKeyEntry> = {};

function registerRow(
  keys: string,
  side: 'left' | 'right',
  type: string,
  columns: number[],
  fingers: string[],
  full = false
) {
  Array.from(keys).forEach((key, i) => {
    HAND_KEYS[key] = entry(side, type, columns[i], fingers[i], full);
  });
}

registerRow(
  'qwert',
  'left',
  'top',
  [5, 4, 3, 2, 1],
  ['pinky', 'ring', 'middle', 'index', 'index']
);

registerRow(
  'yuiop[]\\',
  'right',
  'top',
  [1, 2, 3, 4, 5, 6, 7, 8],
  ['index', 'index', 'middle', 'ring', 'pinky', 'pinky', 'pinky', 'pinky']
);

registerRow(
  'asdfg',
  'left',
  'home',
  [5, 4, 3, 2, 1],
  ['pinky', 'ring', 'middle', 'index', 'index'],
  true
);

registerRow(
  "hjkl;'",
  'right',
  'home',
  [1, 2, 3, 4, 5, 6],
  ['index', 'index', 'middle', 'ring', 'pinky', 'pinky'],
  true
);

HAND_KEYS[';'].pose = 'default-right';

registerRow(
  'zxcvb',
  'left',
  'bottom',
  [5, 4, 3, 2, 1],
  ['pinky', 'ring', 'middle', 'index', 'index'],
  true
);

registerRow(
  'nm,./',
  'right',
  'bottom',
  [1, 2, 3, 4, 5],
  ['index', 'index', 'middle', 'ring', 'pinky'],
  true
);

registerRow(
  '`12345',
  'left',
  'num',
  [7, 6, 5, 4, 3, 2],
  ['pinky', 'pinky', 'ring', 'middle', 'index', 'index']
);

registerRow(
  '67890-=',
  'right',
  'num',
  [0, 2, 3, 4, 5, 6, 7],
  ['index', 'index', 'middle', 'ring', 'pinky', 'pinky', 'pinky']
);

Object.assign(HAND_KEYS, {
  ' ': { side: 'right', pose: 'default-right', finger: 'thumb' },
  Enter: { side: 'right', pose: 'home-row-7-right', finger: 'pinky-full' },
  Backspace: { side: 'right', pose: 'num-row-7-right', finger: 'pinky' },
  Tab: { side: 'left', pose: 'top-row-7-left', finger: 'pinky' },
  CapsLock: { side: 'left', pose: 'home-row-6-left', finger: 'pinky-full' },
  Shift: { side: 'left', pose: 'bottom-row-6-left', finger: 'pinky-full' },
  ShiftLeft: { side: 'left', pose: 'bottom-row-6-left', finger: 'pinky-full' },
  ShiftRight: { side: 'right', pose: 'bottom-row-7-right', finger: 'pinky-full' },
  Control: { side: 'left', pose: 'option-left', finger: 'pinky' },
  ControlRight: { side: 'right', pose: 'option-right', finger: 'pinky' },
  Alt: { side: 'left', pose: 'option-left', finger: 'thumb' },
  AltRight: { side: 'right', pose: 'option-right', finger: 'thumb' },
  Meta: { side: 'left', pose: 'option-left', finger: 'thumb' },
  MetaRight: { side: 'right', pose: 'option-right', finger: 'thumb' },
  Escape: { side: 'left', pose: 'num-row-7-left', finger: 'pinky' },
});

const SHIFTED_KEYS_MAP: Record<string, string> = Object.fromEntries(
  Array.from('~!@#$%^&*()_+{}|:"<>?').map((key, i) => [
    key,
    "`1234567890-=[]\\;',./"[i],
  ])
);

export function keyPose(rawKey: string | null | undefined): KeyPoseResult {
  if (!rawKey) return { key: '', pose: null, shift: false };
  let key = rawKey;
  if (key === '\n') key = 'Enter';
  if (key === '\t') key = 'Tab';
  if (key === 'Space' || key === 'Spacebar') key = ' ';
  let shift = false;
  if (key.length === 1 && /[A-Z]/.test(key)) {
    shift = true;
    key = key.toLowerCase();
  }
  if (SHIFTED_KEYS_MAP[key]) {
    shift = true;
    key = SHIFTED_KEYS_MAP[key];
  }
  const pose = HAND_KEYS[key] || null;
  return { key, pose, shift };
}

export const DEFAULT_CENTERS: Record<string, { x: number; y: number }> = Object.fromEntries(
  (
    [
      ['`1234567890-=', 28, 40],
      ['qwertyuiop[]\\', 84, 97],
      ["asdfghjkl;'", 140, 111],
      ['zxcvbnm,./', 196, 140],
    ] as [string, number, number][]
  ).flatMap(([keys, y, x]) =>
    Array.from(keys).map((key, i) => [key, { x: x + i * 58.53, y }])
  )
);

export const KEY_CENTERS: Record<string, { x: number; y: number }> = {};
KEYBOARD_ROWS.forEach((row, ri) => {
  let x = 14;
  const units = row.reduce((t, k) => t + (k[2] || 1), 0);
  const unit = (872 - 6 * (row.length - 1)) / units;
  row.forEach(([k, s, u = 1]) => {
    KEY_CENTERS[k] = { x: x + (unit * u) / 2, y: 28 + ri * 56 };
    if (s) KEY_CENTERS[s] = KEY_CENTERS[k];
    x += unit * u + 6;
  });
});

export function easeInOut(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

export const FINGER_NAMES_MAP: Record<string, string> = {
  'index': 'Index finger',
  'index-full': 'Index finger',
  'middle': 'Middle finger',
  'middle-full': 'Middle finger',
  'ring': 'Ring finger',
  'ring-full': 'Ring finger',
  'pinky': 'Pinky finger',
  'pinky-full': 'Pinky finger',
  'thumb': 'Thumb',
  'thumb-full': 'Thumb',
};
