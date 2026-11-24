import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ArrowUpRight,
  ArrowRight,
  ArrowLeft,
  RotateCcw,
  Settings2,
  Volume2,
  VolumeX,
  ChevronRight,
  Check,
  X,
  Hand,
  Keyboard,
  BookOpen,
  ChartNoAxesColumnIncreasing,
  Flame,
  Sun,
  Moon,
  Play,
  Pause,
  Sparkles,
  Target,
  Timer,
  Zap,
  Trophy,
  Info,
  CircleHelp,
} from "lucide-react";
import Hands from "./Hands.jsx";
import {
  LETTERS,
  LESSONS,
  fingerForKey,
  makeSequence,
  computeStats,
  formatTime,
} from "./lessons.js";

const ROWS = [
  [
    ["`", "~"],
    ["1", "!"],
    ["2", "@"],
    ["3", "#"],
    ["4", "$"],
    ["5", "%"],
    ["6", "^"],
    ["7", "&"],
    ["8", "*"],
    ["9", "("],
    ["0", ")"],
    ["-", "_"],
    ["=", "+"],
    ["Backspace", "", 2],
  ],
  [
    ["Tab", "", 1.5],
    ...Array.from("qwertyuiop", (x) => [x]),
    ["[", "{"],
    ["]", "}"],
    ["\\", "|", 1.5],
  ],
  [
    ["CapsLock", "", 1.75],
    ...Array.from("asdfghjkl", (x) => [x]),
    [";", ":"],
    ["'", '"'],
    ["Enter", "", 2.25],
  ],
  [
    ["Shift", "", 2.25],
    ...Array.from("zxcvbnm", (x) => [x]),
    [",", "<"],
    [".", ">"],
    ["/", "?"],
    ["ShiftRight", "", 2.75],
  ],
  [
    ["Control", "", 1.25],
    ["Alt", "", 1.25],
    ["Meta", "", 1.25],
    [" ", "", 6.25],
    ["MetaRight", "", 1.25],
    ["AltRight", "", 1.25],
    ["ControlRight", "", 1.25],
  ],
];
const LABELS = {
  Backspace: "delete",
  Tab: "tab",
  CapsLock: "caps lock",
  Enter: "enter",
  Shift: "shift",
  ShiftRight: "shift",
  Control: "ctrl",
  ControlRight: "ctrl",
  Alt: "alt",
  AltRight: "alt",
  Meta: "⌘",
  MetaRight: "⌘",
  " ": "space",
};
const MODES = [
  { id: "letter", label: "Alphabet", icon: BookOpen },
  { id: "words", label: "Words", icon: Keyboard },
  { id: "all", label: "A–Z flow", icon: Sparkles },
  { id: "numbers", label: "Numbers & symbols", icon: Target },
];
const KEY_CENTERS = {};
ROWS.forEach((row, ri) => {
  let x = 14;
  const units = row.reduce((t, k) => t + (k[2] || 1), 0);
  const unit = (872 - 6 * (row.length - 1)) / units;
  row.forEach(([k, s, u = 1]) => {
    KEY_CENTERS[k] = { x: x + (unit * u) / 2, y: 28 + ri * 56 };
    if (s) KEY_CENTERS[s] = KEY_CENTERS[k];
    x += unit * u + 6;
  });
});
const readSaved = () => {
  try {
    return JSON.parse(localStorage.getItem("keyflow-sessions") || "[]");
  } catch {
    return [];
  }
};
const settingSaved = () => {
  try {
    return {
      ...{ hands: true, sound: false, hints: true, dark: false },
      ...JSON.parse(localStorage.getItem("keyflow-settings") || "{}"),
    };
  } catch {
    return { hands: true, sound: false, hints: true, dark: false };
  }
};

const dayKey = (value) => {
  const date = new Date(value);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
};

function Brand() {
  return (
    <a
      className="brand"
      href="#"
      onClick={(e) => e.preventDefault()}
      aria-label="Keyflow home"
    >
      <span className="brand-mark">
        <span>k</span>
        <i />
      </span>
      keyflow<span className="brand-dot">.</span>
    </a>
  );
}
function Toggle({ value, onChange, label, description }) {
  return (
    <label className="setting-row">
      <span>
        <strong>{label}</strong>
        <small>{description}</small>
      </span>
      <input
        type="checkbox"
        checked={value}
        onChange={(e) => onChange(e.target.checked)}
      />
      <span className="switch" />
    </label>
  );
}

export default function App() {
  const [tab, setTab] = useState("practice");
  const [letter, setLetter] = useState("a");
  const [mode, setMode] = useState("letter");
  const [sequence, setSequence] = useState(() => makeSequence("letter", "a"));
  const [cursor, setCursor] = useState(0);
  const [errors, setErrors] = useState(0);
  const [running, setRunning] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [completed, setCompleted] = useState(false);
  const [pressed, setPressed] = useState(null);
  const [wrong, setWrong] = useState(null);
  const [virtualShift, setVirtualShift] = useState(false);
  const [capsLock, setCapsLock] = useState(false);
  const [settings, setSettings] = useState(settingSaved);
  const [showSettings, setShowSettings] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [sessions, setSessions] = useState(readSaved);
  const inputRef = useRef(null),
    trackRef = useRef(null),
    modalRef = useRef(null),
    startRef = useRef(null),
    elapsedRef = useRef(0),
    soundRef = useRef(null),
    pressedTimer = useRef(null),
    wrongTimer = useRef(null);
  const current = sequence[cursor] || " ";
  const finger = fingerForKey(current);
  const stats = computeStats({
    correct: cursor,
    total: cursor + errors,
    elapsedMs: elapsed,
  });
  const lessonIndex = LETTERS.indexOf(letter);
  const completedLetters = new Set(
    sessions.filter((s) => s.mode === "letter").map((s) => s.letter),
  );
  const progress = Math.round((cursor / sequence.length) * 100);

  useEffect(() => {
    document.documentElement.dataset.theme = settings.dark ? "dark" : "light";
    localStorage.setItem("keyflow-settings", JSON.stringify(settings));
  }, [settings]);
  useEffect(() => {
    if (!running) return;
    startRef.current = performance.now() - elapsedRef.current;
    const t = setInterval(() => {
      const time = performance.now() - startRef.current;
      elapsedRef.current = time;
      setElapsed(time);
    }, 100);
    return () => clearInterval(t);
  }, [running]);
  useEffect(() => {
    return () => {
      clearTimeout(pressedTimer.current);
      clearTimeout(wrongTimer.current);
    };
  }, []);
  useEffect(() => {
    if (!showSettings && !showHelp) return;
    const previous = document.activeElement;
    const modal = modalRef.current;
    modal?.querySelector("button")?.focus();
    const trap = (e) => {
      if (e.key !== "Tab") return;
      const all = modal?.querySelectorAll("button,input");
      if (!all?.length) return;
      const first = all[0],
        last = all[all.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", trap);
    return () => {
      document.removeEventListener("keydown", trap);
      if (previous instanceof HTMLElement)
        previous.focus({ preventScroll: true });
    };
  }, [showSettings, showHelp]);
  useEffect(() => {
    const track = trackRef.current,
      active = track?.querySelector(".current");
    if (track && active) {
      if (mode === "letter")
        track.scrollTo({
          left: Math.max(
            0,
            active.offsetLeft - track.clientWidth / 2 + active.clientWidth / 2,
          ),
          behavior: "smooth",
        });
      else track.scrollTop = Math.max(0, active.offsetTop - 40);
    }
  }, [cursor, sequence, mode]);
  const focusInput = () => {
    inputRef.current?.focus({ preventScroll: true });
  };
  const reset = useCallback(
    (nextLetter = letter, nextMode = mode) => {
      setLetter(nextLetter);
      setMode(nextMode);
      setSequence(makeSequence(nextMode, nextLetter));
      setCursor(0);
      setErrors(0);
      setElapsed(0);
      elapsedRef.current = 0;
      startRef.current = null;
      setRunning(false);
      setCompleted(false);
      setWrong(null);
      setPressed(null);
    },
    [letter, mode],
  );
  const playSound = (error) => {
    if (!settings.sound) return;
    try {
      const ctx =
        soundRef.current ||
        (soundRef.current = new (
          window.AudioContext || window.webkitAudioContext
        )());
      if (ctx.state === "suspended") ctx.resume();
      const osc = ctx.createOscillator(),
        g = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = error ? 180 : 440;
      g.gain.setValueAtTime(0.035, ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.06);
      osc.connect(g);
      g.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.065);
    } catch {}
  };
  const typeKey = useCallback(
    (key, batch = false) => {
      if (tab !== "practice" || showSettings || showHelp || completed) return;
      if (key === "Backspace") {
        setCursor((c) => Math.max(0, c - 1));
        return;
      }
      if (
        !key ||
        (!batch && key.length !== 1 && key !== "Enter" && key !== "Tab")
      )
        return;
      const actual = key === "Enter" ? "\n" : key === "Tab" ? "\t" : key;
      if (!running) {
        startRef.current = performance.now() - elapsedRef.current;
        setRunning(true);
      }
      setPressed(actual.at(-1));
      clearTimeout(pressedTimer.current);
      pressedTimer.current = setTimeout(() => setPressed(null), 160);
      let next = cursor;
      let nextErrors = errors;
      let lastWrong = null;
      for (const character of actual) {
        if (next === sequence.length) break;
        if (character === sequence[next]) {
          next++;
          lastWrong = null;
        } else {
          nextErrors++;
          lastWrong = character;
        }
      }
      setCursor(next);
      setErrors(nextErrors);
      setWrong(lastWrong);
      playSound(Boolean(lastWrong));
      clearTimeout(wrongTimer.current);
      if (lastWrong) wrongTimer.current = setTimeout(() => setWrong(null), 500);
      if (next === sequence.length) {
        const duration = Math.max(1, performance.now() - startRef.current);
        elapsedRef.current = duration;
        setElapsed(duration);
        setRunning(false);
        setCompleted(true);
        const score = computeStats({
          correct: next,
          total: next + nextErrors,
          elapsedMs: duration,
        });
        const session = {
          id: Date.now(),
          date: new Date().toISOString(),
          letter,
          mode,
          ...score,
          duration,
        };
        setSessions((previous) => {
          const updated = [session, ...previous].slice(0, 200);
          localStorage.setItem("keyflow-sessions", JSON.stringify(updated));
          return updated;
        });
      }
    },
    [
      tab,
      showSettings,
      showHelp,
      completed,
      running,
      current,
      cursor,
      sequence,
      errors,
      letter,
      mode,
      settings.sound,
    ],
  );
  useEffect(() => {
    const down = (e) => {
      if (e.key === "Escape") {
        setShowSettings(false);
        setShowHelp(false);
        setRunning(false);
        inputRef.current?.blur();
        return;
      }
      if (e.ctrlKey || e.metaKey || e.altKey || e.repeat) return;
      if (e.target instanceof HTMLElement && e.target.closest("[data-no-type]"))
        return;
      if (e.key === "Tab" && current !== "\t") return;
      if (
        e.target instanceof HTMLButtonElement &&
        ["Enter", " "].includes(e.key)
      )
        return;
      if (
        tab === "practice" &&
        !showSettings &&
        !showHelp &&
        (e.key.length === 1 || ["Backspace", "Tab", "Enter"].includes(e.key))
      ) {
        e.preventDefault();
        typeKey(e.key);
      }
    };
    const up = () => setPressed(null);
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
    };
  }, [typeKey, tab, showSettings, showHelp, current]);
  const updateSetting = (name, value) =>
    setSettings((s) => ({ ...s, [name]: value }));
  const chooseLetter = (l) => {
    reset(l, "letter");
    setTab("practice");
  };
  const nextLesson = () => {
    reset(LETTERS[(lessonIndex + 1) % 26], "letter");
    focusInput();
  };
  const toggleRunning = () => {
    if (completed) {
      reset();
      return;
    }
    setRunning((r) => !r);
    if (!running) focusInput();
  };
  const virtualKey = (key, shift) => {
    if (key === "Shift" || key === "ShiftRight") {
      setVirtualShift((s) => !s);
      return;
    }
    if (key === "CapsLock") {
      setCapsLock((c) => !c);
      return;
    }
    let actual = key;
    if (key.length === 1) {
      if (virtualShift && shift) actual = shift;
      else if (/[a-z]/.test(key) && virtualShift !== capsLock)
        actual = key.toUpperCase();
    }
    typeKey(actual);
    setVirtualShift(false);
    focusInput();
  };
  const needsShift = /[A-Z~!@#$%^&*()_+{}|:"<>?]/.test(current);
  const shiftSide = finger?.hand === "Left" ? "ShiftRight" : "Shift";
  const todaySessions = sessions.filter(
    (s) => dayKey(s.date) === dayKey(new Date()),
  );
  const streak = (() => {
    const days = new Set(sessions.map((s) => dayKey(s.date)));
    let count = 0,
      d = new Date();
    if (!days.has(dayKey(d))) d.setDate(d.getDate() - 1);
    while (days.has(dayKey(d))) {
      count++;
      d.setDate(d.getDate() - 1);
    }
    return count;
  })();

  return (
    <div className="app-shell">
      <header className="site-header">
        <div className="header-inner">
          <Brand />
          <nav aria-label="Main navigation">
            {[
              ["practice", "Practice", Keyboard],
              ["lessons", "Lessons", BookOpen],
              ["progress", "Progress", ChartNoAxesColumnIncreasing],
            ].map(([id, label, Icon]) => (
              <button
                key={id}
                className={tab === id ? "nav-item active" : "nav-item"}
                onClick={() => {
                  setTab(id);
                  setRunning(false);
                }}
              >
                <Icon size={16} />
                {label}
              </button>
            ))}
          </nav>
          <div className="header-right">
            <span className="streak">
              <Flame size={17} />
              <strong>{streak}</strong>
              <span>day streak</span>
            </span>
            <span className="header-divider" />
            <button
              className="icon-button"
              aria-label={
                settings.dark ? "Switch to light mode" : "Switch to dark mode"
              }
              onClick={() => updateSetting("dark", !settings.dark)}
            >
              {settings.dark ? <Sun size={19} /> : <Moon size={18} />}
            </button>
            <button
              className="avatar"
              onClick={() => {
                setTab("progress");
                setRunning(false);
              }}
              aria-label="Your progress"
            >
              Y
            </button>
          </div>
        </div>
      </header>
      <main>
        <section className="page-heading">
          <div>
            <div className="eyebrow">
              <span /> A LITTLE PRACTICE. A LOT OF PROGRESS.
            </div>
            <h1>
              {tab === "practice" ? (
                <>
                  Find your typing <span>rhythm.</span>
                </>
              ) : tab === "lessons" ? (
                <>
                  One key at a <span>time.</span>
                </>
              ) : (
                <>
                  Look how far you’ve <span>come.</span>
                </>
              )}
            </h1>
            <p>
              {tab === "practice"
                ? "Build muscle memory, one keystroke at a time. You’ve got this."
                : tab === "lessons"
                  ? "Get to know your keyboard. Start anywhere, and make every key feel natural."
                  : "Small moments of practice add up. Here’s your journey so far."}
            </p>
          </div>
          <div className="daily-note">
            <span className="tiny-sun">
              <Sun size={24} />
            </span>
            <div>
              <strong>Your daily dose of focus</strong>
              <span>Just 5 minutes makes a difference.</span>
            </div>
          </div>
        </section>
        {tab === "practice" ? (
          <div className="workspace">
            <section className="practice-card" aria-label="Typing practice">
              <div className="practice-toolbar">
                <div className="lesson-name">
                  <span className="lesson-number">
                    {mode === "letter"
                      ? String(lessonIndex + 1).padStart(2, "0")
                      : "✦"}
                  </span>
                  <div>
                    <span className="section-kicker">
                      {mode === "letter"
                        ? "ALPHABET ESSENTIALS"
                        : "FIND YOUR FLOW"}
                    </span>
                    <h2>
                      {mode === "letter"
                        ? `The ${letter.toUpperCase()} key`
                        : MODES.find((m) => m.id === mode)?.label}
                    </h2>
                  </div>
                  <span className="level-badge">Beginner</span>
                </div>
                <button
                  className="text-button settings-button"
                  onClick={() => {
                    setShowSettings(true);
                    setRunning(false);
                  }}
                >
                  <Settings2 size={16} />
                  <span>Keyboard settings</span>
                </button>
              </div>
              <div className="stats-bar">
                <div className="metric">
                  <span>
                    <Zap size={15} /> Speed
                  </span>
                  <strong>
                    {stats.wpm || "—"}
                    <small>WPM</small>
                  </strong>
                </div>
                <div className="metric">
                  <span>
                    <Target size={15} /> Accuracy
                  </span>
                  <strong>
                    {cursor + errors ? stats.accuracy : "—"}
                    <small>%</small>
                  </strong>
                </div>
                <div className="metric">
                  <span>
                    <Timer size={15} /> Time
                  </span>
                  <strong>{formatTime(elapsed)}</strong>
                </div>
                <div className="session-state">
                  <span
                    className={running ? "status-dot live" : "status-dot"}
                  />
                  {completed
                    ? "Session complete"
                    : running
                      ? "In your flow"
                      : elapsed > 0
                        ? "Paused"
                        : "Ready when you are"}
                </div>
              </div>
              <div
                className={"exercise-area " + (wrong ? "has-error" : "")}
                onClick={focusInput}
              >
                <div className="exercise-heading">
                  <span>
                    {completed ? (
                      <>
                        <Check size={15} /> Beautifully done. Keep that rhythm.
                      </>
                    ) : (
                      <>
                        {mode === "letter"
                          ? `Let’s get comfortable with ${letter.toUpperCase()}.`
                          : "Keep your eyes here. Let your fingers do the work."}
                      </>
                    )}
                  </span>
                  <span>
                    {cursor}
                    <span className="muted"> / {sequence.length}</span>
                  </span>
                </div>
                <div
                  ref={trackRef}
                  className={
                    "type-track " +
                    (mode === "letter" ? "letter-track" : "word-track")
                  }
                  aria-label="Text to type"
                >
                  {sequence.split("").map((char, i) => (
                    <span
                      key={i}
                      className={
                        "type-char " +
                        (i < cursor
                          ? "typed "
                          : i === cursor
                            ? "current "
                            : "") +
                        (i === cursor && wrong ? "incorrect" : "")
                      }
                    >
                      {char === " " ? (
                        <span className="space-char">
                          {mode === "letter" ? "␣" : " "}
                        </span>
                      ) : (
                        char
                      )}
                      {i === cursor && cursor === 0 && !running && (
                        <span className="start-tooltip">
                          Start typing <ArrowRight size={12} />
                        </span>
                      )}
                    </span>
                  ))}
                </div>
                <textarea
                  ref={inputRef}
                  className="mobile-input"
                  aria-label="Type the highlighted characters"
                  autoCapitalize="off"
                  autoComplete="off"
                  autoCorrect="off"
                  spellCheck={false}
                  onPaste={(e) => e.preventDefault()}
                  value=""
                  onChange={(e) => {
                    typeKey(e.target.value, true);
                  }}
                  onKeyDown={(e) => {
                    if (e.nativeEvent.isComposing) e.stopPropagation();
                  }}
                />
                <div className="exercise-progress">
                  <span style={{ width: progress + "%" }} />
                </div>
              </div>
              <div className="keyboard-section">
                <div className="keyboard-topline">
                  <span>
                    <span className="guide-dot" />{" "}
                    {completed
                      ? "Every keystroke counts."
                      : settings.hints
                        ? `Use your ${finger?.label?.toLowerCase() || "finger"}`
                        : "Follow the highlighted key"}
                  </span>
                  <button
                    className={
                      "hands-toggle " + (settings.hands ? "enabled" : "")
                    }
                    onClick={() => updateSetting("hands", !settings.hands)}
                    aria-pressed={settings.hands}
                  >
                    <Hand size={14} />
                    {settings.hands ? "Hands on" : "Hands off"}
                    <span className="mini-toggle" />
                  </button>
                </div>
                <div className="keyboard-stage">
                  <div className="keyboard">
                    <div className="keyboard-rows">
                      {ROWS.map((row, ri) => (
                        <div className="key-row" key={ri}>
                          {row.map(([key, shift, units = 1], i) => {
                            const active =
                              !completed &&
                              (current === key ||
                                current === shift ||
                                (needsShift && key === shiftSide));
                            return (
                              <button
                                key={key + i}
                                tabIndex={-1}
                                style={{ flex: units }}
                                aria-label={LABELS[key] || key}
                                className={
                                  "key " +
                                  (key.length > 1 ? "utility " : "") +
                                  (key === " " ? "space-key " : "") +
                                  (active ? "target-key " : "") +
                                  ((virtualShift && key.startsWith("Shift")) ||
                                  (capsLock && key === "CapsLock")
                                    ? "pressed "
                                    : "") +
                                  (pressed === key || pressed === shift
                                    ? "pressed "
                                    : "") +
                                  (wrong === key || wrong === shift
                                    ? "wrong-key "
                                    : "") +
                                  (["f", "j"].includes(key) ? "home-key" : "")
                                }
                                onClick={() => virtualKey(key, shift)}
                              >
                                {shift && (
                                  <span className="key-shift">{shift}</span>
                                )}
                                <span>{LABELS[key] || key.toUpperCase()}</span>
                                {["f", "j"].includes(key) && <i />}
                              </button>
                            );
                          })}
                        </div>
                      ))}
                    </div>
                  </div>
                  <Hands
                    activeKey={completed ? "" : current}
                    pressedKey={pressed}
                    keyCenters={KEY_CENTERS}
                    visible={settings.hands}
                  />
                  <span className="stage-watermark">
                    Make yourself at home.
                  </span>
                </div>
                <div className="practice-footer">
                  <span>
                    <Info size={14} />
                    {wrong ? (
                      <>Try again. Accuracy comes before speed.</>
                    ) : (
                      <>
                        Rest your index fingers on <kbd>F</kbd> and <kbd>J</kbd>
                      </>
                    )}
                  </span>
                  <div>
                    <button
                      className="icon-button"
                      title="Restart lesson"
                      aria-label="Restart lesson"
                      onClick={() => reset()}
                    >
                      <RotateCcw size={16} />
                    </button>
                    <button
                      className="icon-button"
                      aria-label={
                        settings.sound
                          ? "Mute typing sound"
                          : "Enable typing sound"
                      }
                      onClick={() => updateSetting("sound", !settings.sound)}
                    >
                      {settings.sound ? (
                        <Volume2 size={17} />
                      ) : (
                        <VolumeX size={17} />
                      )}
                    </button>
                  </div>
                </div>
              </div>
              {completed ? (
                <div className="completion-bar">
                  <span className="completion-icon">
                    <Trophy size={21} />
                  </span>
                  <div>
                    <strong>Another little win.</strong>
                    <span>
                      {stats.wpm} WPM · {stats.accuracy}% accuracy · Progress
                      saved
                    </span>
                  </div>
                  <button className="primary-button" onClick={nextLesson}>
                    Next lesson <ArrowRight size={16} />
                  </button>
                </div>
              ) : (
                <div className="session-controls">
                  <button className="text-button" onClick={() => reset()}>
                    <RotateCcw size={14} /> Restart
                  </button>
                  <span>
                    <kbd>esc</kbd> to pause · <kbd>⌫</kbd> to go back
                  </span>
                  <button
                    className={
                      "primary-button " + (running ? "is-running" : "")
                    }
                    onClick={toggleRunning}
                  >
                    {running ? <Pause size={14} /> : <Play size={14} />}{" "}
                    {running
                      ? "Pause practice"
                      : elapsed
                        ? "Resume practice"
                        : "Start practice"}
                  </button>
                </div>
              )}
            </section>
            <aside className="lesson-sidebar">
              <div className="path-card">
                <div className="sidebar-eyebrow">
                  YOUR LEARNING PATH <BookOpen size={15} />
                </div>
                <h2>
                  A small step.
                  <br />A new superpower.
                </h2>
                <p>Good habits start with the basics.</p>
                <div className="mode-options">
                  {MODES.map(({ id, label, icon: Icon }) => (
                    <button
                      key={id}
                      className={
                        "mode-option " + (mode === id ? "selected" : "")
                      }
                      onClick={() => reset(letter, id)}
                    >
                      <Icon size={17} />
                      <span>{label}</span>
                      {mode === id ? (
                        <span className="selected-dot" />
                      ) : (
                        <ChevronRight size={14} />
                      )}
                    </button>
                  ))}
                </div>
                <div className="alphabet-heading">
                  <span>EXPLORE THE ALPHABET</span>
                  <span>{completedLetters.size}/26</span>
                </div>
                <div className="alphabet-grid">
                  {Array.from(LETTERS).map((l) => (
                    <button
                      key={l}
                      className={
                        (letter === l && mode === "letter" ? "chosen " : "") +
                        (completedLetters.has(l) ? "finished" : "")
                      }
                      onClick={() => chooseLetter(l)}
                      aria-label={`Practice ${l.toUpperCase()} key`}
                      aria-pressed={letter === l && mode === "letter"}
                    >
                      {l.toUpperCase()}
                      {completedLetters.has(l) && <i />}
                    </button>
                  ))}
                </div>
                <div className="path-progress">
                  <span
                    style={{ width: (completedLetters.size / 26) * 100 + "%" }}
                  />
                </div>
                <p className="path-caption">
                  A little better, every single day.
                </p>
              </div>
              <div className="tip-card">
                <span className="tip-icon">
                  <Sparkles size={19} />
                </span>
                <div className="sidebar-eyebrow">THE KEY TO BETTER TYPING</div>
                <h3>
                  Slow is smooth.
                  <br />
                  Smooth is fast.
                </h3>
                <p>
                  Focus on the right fingers first.
                  <br />
                  The speed will follow.
                </p>
                <span className="tip-decoration">✳</span>
              </div>
              <button
                className="help-link"
                onClick={() => {
                  setShowHelp(true);
                  setRunning(false);
                }}
              >
                <CircleHelp size={15} /> A little help getting started{" "}
                <ArrowUpRight size={14} />
              </button>
            </aside>
          </div>
        ) : tab === "lessons" ? (
          <section className="lessons-view">
            <div className="view-top">
              <div>
                <span className="section-kicker">
                  26 KEYS. ENDLESS POSSIBILITIES.
                </span>
                <h2>Your alphabet adventure</h2>
              </div>
              <span className="pill">
                <Check size={14} /> {completedLetters.size} of 26 completed
              </span>
            </div>
            <div className="lessons-grid">
              {LESSONS.map((l, i) => {
                const f = fingerForKey(l.id);
                return (
                  <button
                    className={
                      "lesson-tile " +
                      (completedLetters.has(l.id) ? "done" : "")
                    }
                    key={l.id}
                    onClick={() => chooseLetter(l.id)}
                  >
                    <div className="tile-top">
                      <span>LESSON {String(i + 1).padStart(2, "0")}</span>
                      {completedLetters.has(l.id) ? (
                        <Check size={16} />
                      ) : (
                        <ArrowUpRight size={16} />
                      )}
                    </div>
                    <span className="tile-letter">{l.id.toUpperCase()}</span>
                    <strong>The {l.id.toUpperCase()} key</strong>
                    <span className="tile-finger">{f?.label}</span>
                  </button>
                );
              })}
            </div>
          </section>
        ) : (
          <ProgressView
            sessions={sessions}
            completedLetters={completedLetters}
            todaySessions={todaySessions}
            onPractice={() => setTab("practice")}
          />
        )}
        <footer className="site-footer">
          <span>Made for your next little breakthrough.</span>
          <span>
            <span className="footer-dot" /> A calmer way to learn to type
          </span>
          <button
            onClick={() => {
              setShowHelp(true);
              setRunning(false);
            }}
          >
            How it works <ArrowUpRight size={12} />
          </button>
        </footer>
      </main>
      {(showSettings || showHelp) && (
        <div
          className="modal-backdrop"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) {
              setShowSettings(false);
              setShowHelp(false);
            }
          }}
        >
          <section
            ref={modalRef}
            className="modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-title"
            data-no-type
          >
            <button
              className="modal-close icon-button"
              onClick={() => {
                setShowSettings(false);
                setShowHelp(false);
              }}
              aria-label="Close dialog"
            >
              <X size={20} />
            </button>
            <span className="modal-symbol">
              {showSettings ? <Settings2 size={24} /> : <Hand size={24} />}
            </span>
            <h2 id="modal-title">
              {showSettings
                ? "Make yourself comfortable."
                : "Find your home row."}
            </h2>
            <p>
              {showSettings
                ? "A few little adjustments for your perfect flow."
                : "Your hands already know more than you think."}
            </p>
            {showSettings ? (
              <>
                <Toggle
                  label="Show hand guide"
                  description="See which finger reaches for each key."
                  value={settings.hands}
                  onChange={(v) => updateSetting("hands", v)}
                />
                <Toggle
                  label="Finger hints"
                  description="A gentle reminder above your keyboard."
                  value={settings.hints}
                  onChange={(v) => updateSetting("hints", v)}
                />
                <Toggle
                  label="Typing sounds"
                  description="A soft click for every keystroke."
                  value={settings.sound}
                  onChange={(v) => updateSetting("sound", v)}
                />
                <Toggle
                  label="Dark appearance"
                  description="A little easier on the eyes after hours."
                  value={settings.dark}
                  onChange={(v) => updateSetting("dark", v)}
                />
                <button
                  className="primary-button modal-done"
                  onClick={() => setShowSettings(false)}
                >
                  Back to practice <ArrowRight size={16} />
                </button>
              </>
            ) : (
              <>
                <div className="help-steps">
                  <div>
                    <span>1</span>
                    <p>
                      <strong>Get into position.</strong> Rest your left fingers
                      on A S D F and your right fingers on J K L ;. Feel the
                      little bumps on F and J.
                    </p>
                  </div>
                  <div>
                    <span>2</span>
                    <p>
                      <strong>Follow the green key.</strong> The hand guide
                      moves the correct finger to your next key. Use your thumb
                      for the space bar.
                    </p>
                  </div>
                  <div>
                    <span>3</span>
                    <p>
                      <strong>Find a comfortable pace.</strong> Mistakes are
                      part of learning. A wrong key stays in place so you can
                      try again. Complete a lesson to save your progress.
                    </p>
                  </div>
                </div>
                <button
                  className="primary-button modal-done"
                  onClick={() => setShowHelp(false)}
                >
                  Let’s give it a try <ArrowRight size={16} />
                </button>
              </>
            )}
          </section>
        </div>
      )}
    </div>
  );
}

function ProgressView({
  sessions,
  completedLetters,
  todaySessions,
  onPractice,
}) {
  const best = sessions.length ? Math.max(...sessions.map((s) => s.wpm)) : 0;
  const average = sessions.length
    ? Math.round(sessions.reduce((a, s) => a + s.accuracy, 0) / sessions.length)
    : 0;
  const recent = sessions.slice(0, 10).reverse();
  return (
    <section className="progress-view">
      <div className="progress-stats">
        {[
          [Zap, "Personal best", best, "WPM"],
          [Target, "Average accuracy", average, "%"],
          [BookOpen, "Keys mastered", completedLetters.size, "/ 26"],
          [Flame, "Practiced today", todaySessions.length, "sessions"],
        ].map(([Icon, label, value, unit]) => (
          <div className="progress-stat" key={label}>
            <Icon size={20} />
            <span>{label}</span>
            <strong>
              {value}
              <small>{unit}</small>
            </strong>
          </div>
        ))}
      </div>
      <div className="progress-panel">
        <div className="view-top">
          <div>
            <span className="section-kicker">
              EVERY SESSION IS A STEP FORWARD
            </span>
            <h2>Your typing rhythm</h2>
          </div>
          <span className="pill">Last 10 sessions</span>
        </div>
        {sessions.length ? (
          <>
            <div className="chart">
              {recent.map((s, i) => (
                <div className="chart-column" key={s.id}>
                  <span>{s.wpm}</span>
                  <div
                    style={{
                      height:
                        Math.max(8, (s.wpm / Math.max(best, 1)) * 150) + "px",
                    }}
                  />
                  <small>{i + 1}</small>
                </div>
              ))}
            </div>
            <div className="history-list">
              {sessions.slice(0, 6).map((s) => (
                <div className="history-row" key={s.id}>
                  <span className="history-key">
                    {s.mode === "letter"
                      ? s.letter.toUpperCase()
                      : s.mode === "numbers"
                        ? "#"
                        : "Aa"}
                  </span>
                  <div>
                    <strong>
                      {s.mode === "letter"
                        ? `The ${s.letter.toUpperCase()} key`
                        : s.mode === "all"
                          ? "A–Z flow"
                          : s.mode === "words"
                            ? "Word practice"
                            : "Numbers & symbols"}
                    </strong>
                    <span>
                      {new Date(s.date).toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                  </div>
                  <strong>
                    {s.wpm} <small>WPM</small>
                  </strong>
                  <span className="history-accuracy">
                    {s.accuracy}% accuracy
                  </span>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="empty-state">
            <span>
              <ChartNoAxesColumnIncreasing size={36} />
            </span>
            <h3>Your story starts with a keystroke.</h3>
            <p>Finish your first lesson and watch your progress grow here.</p>
            <button className="primary-button" onClick={onPractice}>
              Start your first lesson <ArrowRight size={16} />
            </button>
          </div>
        )}
      </div>
      <p className="local-note">
        Your practice history is saved on this device.
      </p>
    </section>
  );
}
