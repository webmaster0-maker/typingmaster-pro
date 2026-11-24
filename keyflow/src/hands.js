// Pose names correspond to the articulated reference hand's authored skeleton.
const entry = (side, row, n, finger, full = false) => ({
  side,
  pose: `${row}-row-${n}-${side}`,
  finger: finger + (full ? "-full" : ""),
});

export const HAND_KEYS = {};
function row(keys, side, type, columns, fingers, full = false) {
  [...keys].forEach((key, i) => {
    HAND_KEYS[key] = entry(side, type, columns[i], fingers[i], full);
  });
}
row(
  "qwert",
  "left",
  "top",
  [5, 4, 3, 2, 1],
  ["pinky", "ring", "middle", "index", "index"],
);
row(
  "yuiop[]\\",
  "right",
  "top",
  [1, 2, 3, 4, 5, 6, 7, 8],
  ["index", "index", "middle", "ring", "pinky", "pinky", "pinky", "pinky"],
);
row(
  "asdfg",
  "left",
  "home",
  [5, 4, 3, 2, 1],
  ["pinky", "ring", "middle", "index", "index"],
  true,
);
row(
  "hjkl;'",
  "right",
  "home",
  [1, 2, 3, 4, 5, 6],
  ["index", "index", "middle", "ring", "pinky", "pinky"],
  true,
);
HAND_KEYS[";"].pose = "default-right";
row(
  "zxcvb",
  "left",
  "bottom",
  [5, 4, 3, 2, 1],
  ["pinky", "ring", "middle", "index", "index"],
  true,
);
row(
  "nm,./",
  "right",
  "bottom",
  [1, 2, 3, 4, 5],
  ["index", "index", "middle", "ring", "pinky"],
  true,
);
row(
  "`12345",
  "left",
  "num",
  [7, 6, 5, 4, 3, 2],
  ["pinky", "pinky", "ring", "middle", "index", "index"],
);
row(
  "67890-=",
  "right",
  "num",
  [0, 2, 3, 4, 5, 6, 7],
  ["index", "index", "middle", "ring", "pinky", "pinky", "pinky"],
);
Object.assign(HAND_KEYS, {
  " ": { side: "right", pose: "default-right", finger: "thumb" },
  Enter: { side: "right", pose: "home-row-7-right", finger: "pinky-full" },
  Backspace: { side: "right", pose: "num-row-7-right", finger: "pinky" },
  Tab: { side: "left", pose: "top-row-7-left", finger: "pinky" },
  CapsLock: { side: "left", pose: "home-row-6-left", finger: "pinky-full" },
  Shift: { side: "left", pose: "bottom-row-6-left", finger: "pinky-full" },
  ShiftLeft: { side: "left", pose: "bottom-row-6-left", finger: "pinky-full" },
  ShiftRight: {
    side: "right",
    pose: "bottom-row-7-right",
    finger: "pinky-full",
  },
  Control: { side: "left", pose: "option-left", finger: "pinky" },
  ControlRight: { side: "right", pose: "option-right", finger: "pinky" },
  Alt: { side: "left", pose: "option-left", finger: "thumb" },
  AltRight: { side: "right", pose: "option-right", finger: "thumb" },
  Meta: { side: "left", pose: "option-left", finger: "thumb" },
  MetaRight: { side: "right", pose: "option-right", finger: "thumb" },
  Escape: { side: "left", pose: "num-row-7-left", finger: "pinky" },
});

const shifted = Object.fromEntries(
  [...'~!@#$%^&*()_+{}|:"<>?'].map((key, i) => [
    key,
    "`1234567890-=[]\\;',./"[i],
  ]),
);
export function keyPose(key) {
  if (key === "\n") key = "Enter";
  if (key === "\t") key = "Tab";
  if (key === "Space" || key === "Spacebar") key = " ";
  let shift = false;
  if (key?.length === 1 && /[A-Z]/.test(key)) {
    shift = true;
    key = key.toLowerCase();
  }
  if (shifted[key]) {
    shift = true;
    key = shifted[key];
  }
  const pose = HAND_KEYS[key] || null;
  return { key, pose, shift };
}

export const DEFAULT_CENTERS = Object.fromEntries(
  [
    ["`1234567890-=", 28, 40],
    ["qwertyuiop[]\\", 84, 97],
    ["asdfghjkl;'", 140, 111],
    ["zxcvbnm,./", 196, 140],
  ].flatMap(([keys, y, x]) =>
    [...keys].map((key, i) => [key, { x: x + i * 58.53, y }]),
  ),
);

export function easeInOut(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}
