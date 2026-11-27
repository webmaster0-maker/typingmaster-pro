import React, { useMemo, useState, useEffect, useCallback, Suspense } from 'react';
import { GuidanceState, FingerType } from '../types';
import {
  KEYBOARD_ROWS,
  KEY_LABELS,
  KEY_CENTERS,
  keyPose,
  FINGER_NAMES_MAP,
} from './hands/keyflowHands';
const ThreeHandsCanvas = React.lazy(() =>
  import('./hands/ThreeHandsCanvas').then((m) => ({ default: m.ThreeHandsCanvas }))
);
import { TypingComRenderer } from './hands/renderers/TypingComRenderer';
import { useHandMotion, KeyDef } from './hands/HandMotionEngine';
import { HandDefs } from './hands/HandDefs';
import { SKIN_PALETTES } from './hands/HandArchitectureTypes';
import { safeStorage } from '../utils/safeStorage';
import { Hand, Eye, EyeOff, Sparkles, Sliders } from 'lucide-react';

export interface TypingHandsKeyboardProps {
  guidanceState: GuidanceState | null;
  pressedKey: string | null;
  lastResult: 'correct' | 'incorrect' | null;
  targetKeyVisible?: boolean;
  handsVisible?: boolean;
  onVirtualKeyClick?: (key: string, shift?: string) => void;
}

type HandEngineMode = '3d' | 'vector';
type KeyboardTheme = 'light' | 'dark';

export const TypingHandsKeyboard: React.FC<TypingHandsKeyboardProps> = ({
  guidanceState,
  pressedKey,
  lastResult,
  targetKeyVisible = true,
  handsVisible = true,
  onVirtualKeyClick,
}) => {
  const [engineMode, setEngineMode] = useState<HandEngineMode>(() => {
    const saved = safeStorage.getItem('typing_master_hand_engine');
    return saved === 'vector' ? 'vector' : '3d';
  });

  const [keyboardTheme, setKeyboardTheme] = useState<KeyboardTheme>(() => {
    const saved = safeStorage.getItem('typing_master_keyboard_theme');
    return saved === 'dark' ? 'dark' : 'light';
  });

  const [handsEnabled, setHandsEnabled] = useState<boolean>(() => {
    const saved = safeStorage.getItem('typing_master_hands_enabled');
    return saved !== null ? saved === 'true' : handsVisible;
  });

  const toggleHands = useCallback(() => {
    setHandsEnabled((prev) => {
      const next = !prev;
      safeStorage.setItem('typing_master_hands_enabled', String(next));
      return next;
    });
  }, []);

  const toggleEngineMode = useCallback(() => {
    setEngineMode((prev) => {
      const next = prev === '3d' ? 'vector' : '3d';
      safeStorage.setItem('typing_master_hand_engine', next);
      return next;
    });
  }, []);

  const toggleKeyboardTheme = useCallback(() => {
    setKeyboardTheme((prev) => {
      const next = prev === 'light' ? 'dark' : 'light';
      safeStorage.setItem('typing_master_keyboard_theme', next);
      return next;
    });
  }, []);

  const expectedChar = guidanceState?.expectedKey || '';
  const { key: normalizedTargetKey, pose: targetPose, shift: needsShift } = useMemo(
    () => keyPose(expectedChar),
    [expectedChar]
  );

  // Determine active Shift side for opposite-hand coordination
  const activeShiftKey = useMemo(() => {
    if (!needsShift || !targetPose) return null;
    return targetPose.side === 'left' ? 'ShiftRight' : 'Shift';
  }, [needsShift, targetPose]);

  // Descriptive guidance text
  const guidancePrompt = useMemo(() => {
    if (!expectedChar) return 'Follow the highlighted key';
    const fingerName = targetPose?.finger
      ? FINGER_NAMES_MAP[targetPose.finger] || targetPose.finger
      : guidanceState?.fingerName || 'finger';
    const handName = targetPose?.side === 'left' ? 'Left' : 'Right';
    const charDisplay = expectedChar === ' ' ? 'Spacebar' : expectedChar.toUpperCase();

    if (needsShift) {
      const shiftHand = targetPose?.side === 'left' ? 'Right' : 'Left';
      return `Hold ${shiftHand} Shift + press ${handName} ${fingerName} for ${charDisplay}`;
    }
    return `Use your ${handName} ${fingerName} for ${charDisplay}`;
  }, [expectedChar, targetPose, needsShift, guidanceState]);

  // Legacy SVG vector hand setup (for Vector mode)
  const legacyKeys: KeyDef[] = useMemo(() => {
    const keyHeight = 44;
    const startY = 32;
    const rawDefs: Omit<KeyDef, 'displayMain'>[] = [
      { id: '`', char: '`', row: 0, x: 22, y: startY, w: 48, h: keyHeight, finger: 'left_pinky', hand: 'left' },
      { id: '1', char: '1', row: 0, x: 76.5, y: startY, w: 48, h: keyHeight, finger: 'left_pinky', hand: 'left' },
      { id: '2', char: '2', row: 0, x: 131, y: startY, w: 48, h: keyHeight, finger: 'left_ring', hand: 'left' },
      { id: '3', char: '3', row: 0, x: 185.5, y: startY, w: 48, h: keyHeight, finger: 'left_middle', hand: 'left' },
      { id: '4', char: '4', row: 0, x: 240, y: startY, w: 48, h: keyHeight, finger: 'left_index', hand: 'left' },
      { id: '5', char: '5', row: 0, x: 294.5, y: startY, w: 48, h: keyHeight, finger: 'left_index', hand: 'left' },
      { id: '6', char: '6', row: 0, x: 349, y: startY, w: 48, h: keyHeight, finger: 'right_index', hand: 'right' },
      { id: '7', char: '7', row: 0, x: 403.5, y: startY, w: 48, h: keyHeight, finger: 'right_index', hand: 'right' },
      { id: '8', char: '8', row: 0, x: 458, y: startY, w: 48, h: keyHeight, finger: 'right_middle', hand: 'right' },
      { id: '9', char: '9', row: 0, x: 512.5, y: startY, w: 48, h: keyHeight, finger: 'right_ring', hand: 'right' },
      { id: '0', char: '0', row: 0, x: 567, y: startY, w: 48, h: keyHeight, finger: 'right_pinky', hand: 'right' },
      { id: '-', char: '-', row: 0, x: 621.5, y: startY, w: 48, h: keyHeight, finger: 'right_pinky', hand: 'right' },
      { id: '=', char: '=', row: 0, x: 676, y: startY, w: 48, h: keyHeight, finger: 'right_pinky', hand: 'right' },
      { id: 'backspace', char: 'backspace', row: 0, x: 730.5, y: startY, w: 105.5, h: keyHeight, finger: 'right_pinky', hand: 'right' },

      { id: 'tab', char: 'tab', row: 1, x: 22, y: startY + 50.5, w: 75, h: keyHeight, finger: 'left_pinky', hand: 'left' },
      { id: 'q', char: 'q', row: 1, x: 103.5, y: startY + 50.5, w: 48, h: keyHeight, finger: 'left_pinky', hand: 'left' },
      { id: 'w', char: 'w', row: 1, x: 158, y: startY + 50.5, w: 48, h: keyHeight, finger: 'left_ring', hand: 'left' },
      { id: 'e', char: 'e', row: 1, x: 212.5, y: startY + 50.5, w: 48, h: keyHeight, finger: 'left_middle', hand: 'left' },
      { id: 'r', char: 'r', row: 1, x: 267, y: startY + 50.5, w: 48, h: keyHeight, finger: 'left_index', hand: 'left' },
      { id: 't', char: 't', row: 1, x: 321.5, y: startY + 50.5, w: 48, h: keyHeight, finger: 'left_index', hand: 'left' },
      { id: 'y', char: 'y', row: 1, x: 376, y: startY + 50.5, w: 48, h: keyHeight, finger: 'right_index', hand: 'right' },
      { id: 'u', char: 'u', row: 1, x: 430.5, y: startY + 50.5, w: 48, h: keyHeight, finger: 'right_index', hand: 'right' },
      { id: 'i', char: 'i', row: 1, x: 485, y: startY + 50.5, w: 48, h: keyHeight, finger: 'right_middle', hand: 'right' },
      { id: 'o', char: 'o', row: 1, x: 539.5, y: startY + 50.5, w: 48, h: keyHeight, finger: 'right_ring', hand: 'right' },
      { id: 'p', char: 'p', row: 1, x: 594, y: startY + 50.5, w: 48, h: keyHeight, finger: 'right_pinky', hand: 'right' },
      { id: '[', char: '[', row: 1, x: 648.5, y: startY + 50.5, w: 48, h: keyHeight, finger: 'right_pinky', hand: 'right' },
      { id: ']', char: ']', row: 1, x: 703, y: startY + 50.5, w: 48, h: keyHeight, finger: 'right_pinky', hand: 'right' },
      { id: '\\', char: '\\', row: 1, x: 757.5, y: startY + 50.5, w: 78.5, h: keyHeight, finger: 'right_pinky', hand: 'right' },

      { id: 'a', char: 'a', row: 2, x: 117.5, y: startY + 101, w: 48, h: keyHeight, finger: 'left_pinky', hand: 'left' },
      { id: 's', char: 's', row: 2, x: 172, y: startY + 101, w: 48, h: keyHeight, finger: 'left_ring', hand: 'left' },
      { id: 'd', char: 'd', row: 2, x: 226.5, y: startY + 101, w: 48, h: keyHeight, finger: 'left_middle', hand: 'left' },
      { id: 'f', char: 'f', row: 2, x: 281, y: startY + 101, w: 48, h: keyHeight, finger: 'left_index', hand: 'left' },
      { id: 'g', char: 'g', row: 2, x: 335.5, y: startY + 101, w: 48, h: keyHeight, finger: 'left_index', hand: 'left' },
      { id: 'h', char: 'h', row: 2, x: 390, y: startY + 101, w: 48, h: keyHeight, finger: 'right_index', hand: 'right' },
      { id: 'j', char: 'j', row: 2, x: 444.5, y: startY + 101, w: 48, h: keyHeight, finger: 'right_index', hand: 'right' },
      { id: 'k', char: 'k', row: 2, x: 499, y: startY + 101, w: 48, h: keyHeight, finger: 'right_middle', hand: 'right' },
      { id: 'l', char: 'l', row: 2, x: 553.5, y: startY + 101, w: 48, h: keyHeight, finger: 'right_ring', hand: 'right' },
      { id: ';', char: ';', row: 2, x: 608, y: startY + 101, w: 48, h: keyHeight, finger: 'right_pinky', hand: 'right' },
      { id: "'", char: "'", row: 2, x: 662.5, y: startY + 101, w: 48, h: keyHeight, finger: 'right_pinky', hand: 'right' },

      { id: 'z', char: 'z', row: 3, x: 140.5, y: startY + 151.5, w: 48, h: keyHeight, finger: 'left_pinky', hand: 'left' },
      { id: 'x', char: 'x', row: 3, x: 195, y: startY + 151.5, w: 48, h: keyHeight, finger: 'left_ring', hand: 'left' },
      { id: 'c', char: 'c', row: 3, x: 249.5, y: startY + 151.5, w: 48, h: keyHeight, finger: 'left_middle', hand: 'left' },
      { id: 'v', char: 'v', row: 3, x: 304, y: startY + 151.5, w: 48, h: keyHeight, finger: 'left_index', hand: 'left' },
      { id: 'b', char: 'b', row: 3, x: 358.5, y: startY + 151.5, w: 48, h: keyHeight, finger: 'left_index', hand: 'left' },
      { id: 'n', char: 'n', row: 3, x: 413, y: startY + 151.5, w: 48, h: keyHeight, finger: 'right_index', hand: 'right' },
      { id: 'm', char: 'm', row: 3, x: 467.5, y: startY + 151.5, w: 48, h: keyHeight, finger: 'right_index', hand: 'right' },
      { id: ',', char: ',', row: 3, x: 522, y: startY + 151.5, w: 48, h: keyHeight, finger: 'right_middle', hand: 'right' },
      { id: '.', char: '.', row: 3, x: 576.5, y: startY + 151.5, w: 48, h: keyHeight, finger: 'right_ring', hand: 'right' },
      { id: '/', char: '/', row: 3, x: 631, y: startY + 151.5, w: 48, h: keyHeight, finger: 'right_pinky', hand: 'right' },

      { id: ' ', char: ' ', row: 4, x: 209.5, y: startY + 202, w: 391, h: keyHeight, finger: 'right_thumb', hand: 'both' },
    ];

    return rawDefs.map((k) => ({
      ...k,
      displayMain: k.char.toUpperCase(),
    }));
  }, []);

  const legacyTargetKeyDef = useMemo(() => {
    if (!expectedChar) return null;
    return (
      legacyKeys.find((k) => {
        if (expectedChar === ' ') return k.id === ' ';
        return k.char.toLowerCase() === expectedChar.toLowerCase();
      }) || null
    );
  }, [legacyKeys, expectedChar]);

  const [keystrokeCount, setKeystrokeCount] = useState(0);
  useEffect(() => {
    if (pressedKey) setKeystrokeCount((c) => c + 1);
  }, [pressedKey, lastResult]);

  const { leftHand, rightHand } = useHandMotion({
    activeFinger: (guidanceState?.finger || 'none') as FingerType | 'none',
    targetKeyDef: legacyTargetKeyDef,
    requiresShift: Boolean(guidanceState?.requiresShift || needsShift),
    shiftFinger: (guidanceState?.shiftFinger || 'none') as FingerType | 'none',
    shiftKeyDef: null,
    pressedKey,
    lastResult,
    speedProfile: 'fluid_natural',
    keyStrokeCount: keystrokeCount,
    keys: legacyKeys,
    enabled: engineMode === 'vector' && handsEnabled,
  });

  return (
    <div className="w-full flex flex-col items-center select-none font-sans max-w-5xl mx-auto px-2">
      {/* 1. TOPLINE GUIDANCE & HANDS TOOLBAR */}
      <div className="w-full flex items-center justify-between pb-2.5 px-2 text-sm">
        <div className="flex items-center gap-2 text-zinc-700 dark:text-slate-300 font-medium">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 dark:bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)] animate-pulse" />
          <span className="tracking-wide text-zinc-800 dark:text-slate-200">
            {guidancePrompt}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Hand Engine Style Switcher (3D vs Vector) */}
          <button
            type="button"
            onClick={toggleEngineMode}
            title={engineMode === '3d' ? 'Switch to Vector SVG Hands' : 'Switch to 3D Articulated Hands'}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-zinc-200 bg-white hover:bg-zinc-100 text-zinc-700 hover:text-zinc-950 dark:border-slate-700 dark:bg-slate-800/80 dark:hover:bg-slate-700/80 dark:text-slate-300 dark:hover:text-white transition-all text-xs"
          >
            <Sparkles size={13} className={engineMode === '3d' ? 'text-amber-500 dark:text-amber-400' : 'text-sky-500 dark:text-sky-400'} />
            <span className="font-medium">{engineMode === '3d' ? '3D Hands' : 'Vector Hands'}</span>
          </button>

          {/* Keyboard Chassis Theme Switcher */}
          <button
            type="button"
            onClick={toggleKeyboardTheme}
            title={keyboardTheme === 'light' ? 'Switch to Dark Slate Keyboard' : 'Switch to Silver Keyboard'}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-zinc-200 bg-white hover:bg-zinc-100 text-zinc-700 hover:text-zinc-950 dark:border-slate-700 dark:bg-slate-800/80 dark:hover:bg-slate-700/80 dark:text-slate-300 dark:hover:text-white transition-all text-xs"
          >
            <Sliders size={13} />
            <span className="hidden sm:inline font-medium capitalize">{keyboardTheme}</span>
          </button>

          {/* Hands Visibility Toggle */}
          <button
            type="button"
            onClick={toggleHands}
            aria-pressed={handsEnabled}
            title={handsEnabled ? 'Hide hands guidance' : 'Show hands guidance'}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all ${
              handsEnabled
                ? 'border-emerald-500/40 bg-emerald-500/15 text-emerald-700 hover:bg-emerald-500/25 dark:text-emerald-300'
                : 'border-zinc-200 bg-zinc-100 text-zinc-500 hover:text-zinc-800 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            <Hand size={13} className={handsEnabled ? 'text-emerald-600 dark:text-emerald-400' : 'text-zinc-400 dark:text-slate-400'} />
            <span>{handsEnabled ? 'Hands On' : 'Hands Off'}</span>
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                handsEnabled ? 'bg-emerald-500 dark:bg-emerald-400 shadow-[0_0_6px_#34d399]' : 'bg-zinc-400 dark:bg-slate-500'
              }`}
            />
          </button>
        </div>
      </div>

      {/* 2. KEYFLOW KEYBOARD STAGE (900x420 aspect-ratio container) */}
      <div
        className={`keyboard-stage ${engineMode === '3d' ? 'mode-3d' : ''} relative w-full aspect-[900/420] max-h-[66vh] rounded-2xl overflow-hidden p-1 shadow-xl dark:shadow-2xl border border-zinc-200 bg-zinc-200/70 dark:border-slate-800/80 dark:bg-slate-950/60`}
      >
        {/* PHYSICAL KEYBOARD CHASSIS & KEYS */}
        <div className={`keyboard ${keyboardTheme === 'dark' ? 'dark-theme' : ''}`}>
          <div className="keyboard-rows">
            {KEYBOARD_ROWS.map((row, ri) => (
              <div className="key-row" key={ri}>
                {row.map(([key, shift, units = 1], i) => {
                  const isPrimaryTarget =
                    targetKeyVisible &&
                    expectedChar !== '' &&
                    (expectedChar === key ||
                      expectedChar === shift ||
                      (!shift && expectedChar.toLowerCase() === key.toLowerCase()));

                  const isShiftTarget = targetKeyVisible && activeShiftKey === key;

                  const isPressed =
                    Boolean(pressedKey) &&
                    (pressedKey === key ||
                      pressedKey === shift ||
                      (pressedKey!.length === 1 && pressedKey!.toLowerCase() === key.toLowerCase()) ||
                      (key === ' ' && pressedKey === ' '));

                  const isWrong = isPressed && lastResult === 'incorrect';

                  const isTarget = isPrimaryTarget || isShiftTarget;

                  return (
                    <button
                      key={key + i}
                      tabIndex={-1}
                      type="button"
                      style={{ flex: units }}
                      aria-label={KEY_LABELS[key] || key}
                      onClick={() => onVirtualKeyClick?.(key, shift)}
                      className={
                        'key ' +
                        (key.length > 1 ? 'utility ' : '') +
                        (key === ' ' ? 'space-key ' : '') +
                        (isPrimaryTarget ? 'target-key ' : '') +
                        (isShiftTarget ? 'shift-helper ' : '') +
                        (isPressed && !isWrong ? 'pressed ' : '') +
                        (isWrong ? 'wrong-key ' : '') +
                        (['f', 'j'].includes(key) ? 'home-key ' : '')
                      }
                    >
                      {shift && <span className="key-shift">{shift}</span>}
                      <span>{KEY_LABELS[key] || key.toUpperCase()}</span>
                      {['f', 'j'].includes(key) && <i />}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        </div>

        {/* 3D ARTICULATED HANDS (Three.js WebGL + glTF with finger highlights and pulse) */}
        {engineMode === '3d' && (
          <Suspense fallback={null}>
            <ThreeHandsCanvas
              activeKey={expectedChar}
              pressedKey={pressedKey}
              keyCenters={KEY_CENTERS}
              visible={handsEnabled}
            />
          </Suspense>
        )}

        {/* ALTERNATIVE VECTOR SVG HANDS (If user switches to Vector mode) */}
        {engineMode === 'vector' && (
          <div
            className="hands-layer absolute inset-0 w-full h-full pointer-events-none z-10"
            style={{
              opacity: handsEnabled ? 0.8 : 0,
              transition: 'opacity 220ms ease-in-out',
            }}
          >
            <svg
              viewBox="0 0 880 430"
              preserveAspectRatio="xMidYMid meet"
              className="w-full h-full block"
            >
              <HandDefs palette={SKIN_PALETTES.warm_sand} isDarkKeyboard={keyboardTheme === 'dark'} />
              <g id="hands-stage-vector" opacity={0.92}>
                <TypingComRenderer pose={leftHand} showColorZones={false} isDarkKeyboard={keyboardTheme === 'dark'} />
                <TypingComRenderer pose={rightHand} showColorZones={false} isDarkKeyboard={keyboardTheme === 'dark'} />
              </g>
            </svg>
          </div>
        )}
      </div>
    </div>
  );
};
