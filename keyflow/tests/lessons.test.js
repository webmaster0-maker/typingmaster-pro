import test from "node:test";
import assert from "node:assert/strict";
import {
  LETTERS,
  FINGER_MAP,
  LESSONS,
  fingerForKey,
  makeSequence,
  computeStats,
  formatTime,
} from "../src/lessons.js";

test("every A–Z lesson has the conventional QWERTY finger and uppercase support", () => {
  const groups = {
    "left-pinky": "qaz",
    "left-ring": "wsx",
    "left-middle": "edc",
    "left-index": "rtfgvb",
    "right-index": "yuhjnm",
    "right-middle": "ik",
    "right-ring": "ol",
    "right-pinky": "p",
  };
  assert.equal(LETTERS.length, 26);
  assert.equal(LESSONS.length, 26);
  assert.equal(new Set(LESSONS.map((lesson) => lesson.id)).size, 26);
  for (const [finger, keys] of Object.entries(groups))
    for (const key of keys) {
      assert.equal(fingerForKey(key).id, finger);
      assert.equal(fingerForKey(key.toUpperCase()).id, finger);
    }
});

test("the complete printable US keyboard and physical modifiers are mapped", () => {
  for (let charCode = 32; charCode <= 126; charCode++) {
    assert.ok(
      fingerForKey(String.fromCharCode(charCode)),
      `Missing ${String.fromCharCode(charCode)}`,
    );
  }
  for (const key of [
    "Shift",
    "ShiftLeft",
    "ShiftRight",
    "Backspace",
    "Enter",
    "Tab",
    "CapsLock",
    "Control",
    "Alt",
    "Meta",
    "Escape",
    "Space",
  ]) {
    assert.ok(fingerForKey(key), `Missing ${key}`);
  }
  assert.equal(FINGER_MAP[" "].id, "right-thumb");
  assert.equal(fingerForKey("ArrowUp"), null);
  assert.equal(fingerForKey(null), null);
});

test("letter lessons repeatedly practice the selected key with return-key combinations", () => {
  for (const lesson of LESSONS) {
    assert.equal(lesson.sequence, makeSequence("letter", lesson.id));
    assert.ok(lesson.sequence.length >= 30 && lesson.sequence.length <= 40);
    assert.ok(
      [...lesson.sequence].filter((key) => key === lesson.id).length >= 12,
    );
    assert.equal(lesson.group, fingerForKey(lesson.id).hand.toLowerCase());
    assert.ok(lesson.description.includes(fingerForKey(lesson.id).home));
  }
});

test("every exercise uses supported typing keys; alphabet practice covers A–Z", () => {
  for (const mode of ["letter", "words", "all", "numbers"])
    for (const letter of LETTERS) {
      const sequence = makeSequence(mode, letter);
      assert.ok(sequence.length > 0);
      for (const key of sequence)
        assert.ok(fingerForKey(key), `Unsupported ${key} in ${mode}`);
    }
  for (const key of LETTERS) assert.ok(makeSequence("all").includes(key));
  for (const key of "0123456789")
    assert.ok(makeSequence("numbers").includes(key));
  assert.equal(makeSequence("letter", "invalid"), makeSequence("letter", "a"));
  assert.equal(makeSequence("letter", "Z"), makeSequence("letter", "z"));
});

test("word practice remains short and includes the focus letter", () => {
  for (const letter of LETTERS) {
    const sequence = makeSequence("words", letter);
    assert.ok(sequence.length >= 70 && sequence.length <= 92);
    assert.ok(sequence.includes(letter));
    assert.equal(sequence, sequence.trim());
  }
});

test("metrics use five-character words and all attempts for accuracy", () => {
  assert.deepEqual(
    computeStats({ correct: 100, total: 125, elapsedMs: 60000 }),
    { wpm: 20, accuracy: 80 },
  );
  assert.deepEqual(
    computeStats({ correct: 125, total: 125, elapsedMs: 30000 }),
    { wpm: 50, accuracy: 100 },
  );
  assert.deepEqual(computeStats({ correct: 1, total: 3, elapsedMs: 60000 }), {
    wpm: 0,
    accuracy: 33,
  });
});

test("metrics have stable zero, negative and non-finite behavior", () => {
  assert.deepEqual(computeStats(), { wpm: 0, accuracy: 100 });
  assert.deepEqual(computeStats({ correct: 9, total: 10, elapsedMs: 0 }), {
    wpm: 0,
    accuracy: 90,
  });
  assert.deepEqual(computeStats({ correct: -2, total: -1, elapsedMs: -1 }), {
    wpm: 0,
    accuracy: 100,
  });
  assert.deepEqual(
    computeStats({ correct: Infinity, total: NaN, elapsedMs: Infinity }),
    { wpm: 0, accuracy: 100 },
  );
  assert.deepEqual(
    computeStats({ correct: 200, total: 100, elapsedMs: 60000 }),
    { wpm: 20, accuracy: 100 },
  );
});

test("elapsed time formatting crosses minute boundaries without rounding", () => {
  assert.equal(formatTime(0), "0:00");
  assert.equal(formatTime(59999), "0:59");
  assert.equal(formatTime(60000), "1:00");
  assert.equal(formatTime(125999), "2:05");
  assert.equal(formatTime(-10), "0:00");
  assert.equal(formatTime(Infinity), "0:00");
});
