export const LETTERS = "abcdefghijklmnopqrstuvwxyz";

const fingers = {
  "left-pinky": {
    id: "left-pinky",
    hand: "Left",
    name: "pinky",
    label: "Left pinky",
    home: "A",
  },
  "left-ring": {
    id: "left-ring",
    hand: "Left",
    name: "ring finger",
    label: "Left ring finger",
    home: "S",
  },
  "left-middle": {
    id: "left-middle",
    hand: "Left",
    name: "middle finger",
    label: "Left middle finger",
    home: "D",
  },
  "left-index": {
    id: "left-index",
    hand: "Left",
    name: "index finger",
    label: "Left index finger",
    home: "F",
  },
  "right-index": {
    id: "right-index",
    hand: "Right",
    name: "index finger",
    label: "Right index finger",
    home: "J",
  },
  "right-middle": {
    id: "right-middle",
    hand: "Right",
    name: "middle finger",
    label: "Right middle finger",
    home: "K",
  },
  "right-ring": {
    id: "right-ring",
    hand: "Right",
    name: "ring finger",
    label: "Right ring finger",
    home: "L",
  },
  "right-pinky": {
    id: "right-pinky",
    hand: "Right",
    name: "pinky",
    label: "Right pinky",
    home: ";",
  },
  "left-thumb": {
    id: "left-thumb",
    hand: "Left",
    name: "thumb",
    label: "Left thumb",
    home: "Space",
  },
  "right-thumb": {
    id: "right-thumb",
    hand: "Right",
    name: "thumb",
    label: "Right thumb",
    home: "Space",
  },
};

const keyGroups = {
  "left-pinky": "`~1!qaz",
  "left-ring": "2@wsx",
  "left-middle": "3#edc",
  "left-index": "4$5%rtfgvb",
  "right-index": "6^7&yuhjnm",
  "right-middle": "8*ik,<",
  "right-ring": "9(ol.>",
  "right-pinky": "0)-_=+p[{]}\\|;:'\"/?",
  "right-thumb": " ",
};

const mapped = {};
for (const [id, keys] of Object.entries(keyGroups)) {
  for (const key of keys) mapped[key] = fingers[id];
}
Object.assign(mapped, {
  shift: fingers["left-pinky"],
  shiftleft: fingers["left-pinky"],
  shiftright: fingers["right-pinky"],
  backspace: fingers["right-pinky"],
  enter: fingers["right-pinky"],
  tab: fingers["left-pinky"],
  capslock: fingers["left-pinky"],
  control: fingers["left-pinky"],
  controlleft: fingers["left-pinky"],
  controlright: fingers["right-pinky"],
  alt: fingers["left-thumb"],
  altleft: fingers["left-thumb"],
  altright: fingers["right-thumb"],
  meta: fingers["left-thumb"],
  metaleft: fingers["left-thumb"],
  metaright: fingers["right-thumb"],
  escape: fingers["left-pinky"],
  space: fingers["right-thumb"],
  spacebar: fingers["right-thumb"],
  "\n": fingers["right-pinky"],
  "\t": fingers["left-pinky"],
});

export const FINGER_MAP = Object.freeze(mapped);

/** Unknown non-typing keys have no finger; callers may leave the hands at rest. */
export function fingerForKey(key) {
  return typeof key === "string"
    ? (FINGER_MAP[key.toLowerCase()] ?? null)
    : null;
}

const wordBanks = {
  a: "a calm day a small lake a warm place a happy start",
  b: "big blue bird best book bright beach bring back balance",
  c: "calm clear coast cool cloud clean code coffee cup",
  d: "day dream deep dive daily dose do good dance",
  e: "every little step feels better keep the evening free",
  f: "feel free find flow fresh fruit five fluffy feathers",
  g: "go gently green grass good game grow together",
  h: "happy hands head home hold hope have a hug",
  i: "find a little time sit still in the morning light",
  j: "joy just join jump jazz enjoy a gentle journey",
  k: "keep kind take a break look at the quiet lake",
  l: "little leaves fall slowly lovely light fills the valley",
  m: "make more moments moon milk music move calmly",
  n: "new notes nice name nine nights near the ocean",
  o: "one good book slow down look for a soft glow",
  p: "pause play paper place piano practice perfect pace",
  q: "quiet queen quick question quilt quite a quest",
  r: "rest relax river read rain rhythm reach for stars",
  s: "slow steady steps soft skies small smiles sunshine",
  t: "take time to try the tiny things that matter",
  u: "under blue skies use your time trust your journey",
  v: "very vivid view velvet valley live love give value",
  w: "warm water wild waves walk with wonder we will",
  x: "six extra boxes mix wax relax next exit fox",
  y: "your day your way yellow sky happy easy rhythm",
  z: "zero rush lazy zebra cozy jazz breeze zigzag",
};

export const MODES = Object.freeze({
  letter: {
    label: "Key practice",
    description: "Build muscle memory, one key at a time.",
  },
  words: {
    label: "Word flow",
    description: "Find your rhythm with simple words.",
  },
  all: {
    label: "All letters",
    description: "Put the entire alphabet into practice.",
  },
  numbers: {
    label: "Numbers & symbols",
    description: "Get comfortable with the top row.",
  },
});

export function makeSequence(mode = "letter", letter = "a") {
  const key =
    typeof letter === "string" &&
    LETTERS.includes(letter.toLowerCase()) &&
    letter.length === 1
      ? letter.toLowerCase()
      : "a";
  if (mode === "words") {
    const words = wordBanks[key];
    return `${words} ${words}`.slice(0, 92).trim();
  }
  if (mode === "all")
    return "the quick brown fox jumps over the lazy dog pack my box with five dozen liquor jugs";
  if (mode === "numbers")
    return "12345 67890 2468 13579 10 + 20 = 30 50% 9*3 8/2 100!";
  const otherHome = fingerForKey(key).hand === "Left" ? "j" : "f";
  return `${key} ${key} ${key} ${key} ${key}${otherHome} ${otherHome}${key} ${key}${key} ${key} ${key} ${key} ${key}${otherHome} ${otherHome}${key} ${key}${key}`;
}

export const LESSONS = Array.from(LETTERS, (letter) => {
  const finger = fingerForKey(letter);
  return {
    id: letter,
    title: `The ${letter.toUpperCase()} key`,
    label: letter.toUpperCase(),
    description: `Use your ${finger.label.toLowerCase()}. Return to ${finger.home} after each reach.`,
    sequence: makeSequence("letter", letter),
    group: finger.hand.toLowerCase(),
  };
});

const nonnegative = (value) =>
  Number.isFinite(value) ? Math.max(0, value) : 0;

export function computeStats({ correct = 0, total = 0, elapsedMs = 0 } = {}) {
  const attempts = nonnegative(total);
  const hits = Math.min(nonnegative(correct), attempts);
  const elapsed = nonnegative(elapsedMs);
  return {
    wpm: elapsed > 0 ? Math.round((hits / 5) * (60000 / elapsed)) : 0,
    accuracy: attempts > 0 ? Math.round((hits / attempts) * 100) : 100,
  };
}

export function formatTime(ms = 0) {
  const seconds = Math.floor(nonnegative(ms) / 1000);
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
}
