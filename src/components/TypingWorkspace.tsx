import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  WorkspaceMode,
  GuidanceConfig,
  GuidanceState,
  SessionResult,
  Lesson,
  TypingCertificate,
  UserAccount,
} from '../types';
import { getGuidanceForChar } from '../engines/guidanceEngine';
import { applyRemediationHealing, formatHotspotKeyLabel } from '../engines/remediationEngine';
import { TypingHandsKeyboard } from './TypingHandsKeyboard';
import { soundManager } from '../utils/audio';
import { ArrowLeft, RotateCcw, ChevronRight, AlertCircle, CheckCircle2, Award } from 'lucide-react';
import { AdSlot } from './ads/AdSlot';
import { SITE_ADS_CONFIG } from '../config/adsConfig';
import {
  isSiteAdSlotVisible,
  useAdVisibilitySettings,
} from '../utils/adSettings';

interface TypingWorkspaceProps {
  mode: WorkspaceMode;
  title: string;
  subtitle: string;
  targetContent: string;
  guidanceConfig: GuidanceConfig;
  onComplete: (result: SessionResult) => void;
  onBack: () => void;
  itemId?: string;
  lessonData?: Lesson;
  exercises?: string[];
  onNextLesson?: () => void;
  durationMinutes?: number;
  passWpm?: number;
  passAccuracy?: number;
  scoring?: 'standard' | 'strict';
  completionAccuracy?: number;
  remediationTargetKeys?: string[];
  initialWeakKeys?: Record<string, number>;
  userAccount?: UserAccount | null;
  issuedCertificate?: TypingCertificate | null;
  isCertificateModalOpen?: boolean;
  onViewCertificate?: (cert: TypingCertificate) => void;
  onRequestCertificateAuth?: (session: SessionResult) => void;
}

export const TypingWorkspace: React.FC<TypingWorkspaceProps> = ({
  mode,
  title,
  subtitle,
  targetContent: initialTargetContent,
  guidanceConfig = {
    keyboardVisible: true,
    handsVisible: true,
    fingerGuideVisible: true,
    targetKeyVisible: true,
    guidanceLevel: 'full',
  },
  onComplete,
  onBack,
  itemId,
  lessonData,
  exercises,
  onNextLesson,
  durationMinutes,
  passWpm,
  passAccuracy,
  scoring,
  completionAccuracy,
  remediationTargetKeys,
  initialWeakKeys,
  userAccount,
  issuedCertificate,
  isCertificateModalOpen = false,
  onViewCertificate,
  onRequestCertificateAuth,
}) => {
  const adSettings = useAdVisibilitySettings();
  const isTestMode = mode === 'test' || mode === 'exam' || Boolean(lessonData?.isTest);
  const isCertificateEligibleMode = mode === 'test' || mode === 'exam';
  const exerciseList = exercises && exercises.length > 0 ? exercises : [initialTargetContent];
  const [exerciseIndex, setExerciseIndex] = useState(0);
  const currentExerciseContent = exerciseList[exerciseIndex] || initialTargetContent;

  const [currentIndex, setCurrentIndex] = useState(0);
  const [typedChars, setTypedChars] = useState<string[]>([]);
  const [completedCorrectChars, setCompletedCorrectChars] = useState(0);
  const [typedHistory, setTypedHistory] = useState<boolean[]>([]);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [errors, setErrors] = useState(0);
  const [missedKeys, setMissedKeys] = useState<{ [key: string]: number }>({});
  const [isFinished, setIsFinished] = useState(false);
  const [completedSession, setCompletedSession] = useState<SessionResult | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [pressedKey, setPressedKey] = useState<string | null>(null);
  const [errorShakeCount, setErrorShakeCount] = useState(0);
  const [lastResult, setLastResult] = useState<'correct' | 'incorrect' | null>(null);
  const [controlsVisible, setControlsVisible] = useState(true);

  const activeCharRef = useRef<HTMLSpanElement | null>(null);
  const typingInputRef = useRef<HTMLTextAreaElement | null>(null);
  const pressedTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const transitionTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const controlsFadeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasSubmittedRef = useRef(false);

  const totalDurationSeconds = durationMinutes ? durationMinutes * 60 : null;

  // Auto-focus the centered input text field when the lesson/practice/test page opens or resets
  useEffect(() => {
    if (!isFinished) {
      typingInputRef.current?.focus({ preventScroll: true });
    }
  }, [isFinished, exerciseIndex]);

  // Auto-resize and keep the centered multi-line input field showing the full typed text cleanly
  useEffect(() => {
    const inputEl = typingInputRef.current;
    if (inputEl && !isFinished) {
      inputEl.style.height = 'auto';
      const maxRatio = mode !== 'test' && mode !== 'exam' ? 0.16 : 0.28;
      const maxHeight = Math.max(72, Math.round(window.innerHeight * maxRatio));
      inputEl.style.height = `${Math.min(inputEl.scrollHeight, maxHeight)}px`;
      inputEl.scrollTop = inputEl.scrollHeight;
    }
  }, [typedChars, isFinished, mode]);

  // Cleanup active timers on unmount
  useEffect(() => {
    return () => {
      if (pressedTimeoutRef.current) clearTimeout(pressedTimeoutRef.current);
      if (transitionTimeoutRef.current) clearTimeout(transitionTimeoutRef.current);
      if (controlsFadeTimeoutRef.current) clearTimeout(controlsFadeTimeoutRef.current);
    };
  }, []);

  // High-precision background timer (250ms tick) with duration limit check
  useEffect(() => {
    if (!startTime || isFinished) return;
    const interval = setInterval(() => {
      const nowElapsed = Date.now() - startTime;
      setElapsedMs(nowElapsed);
      if (totalDurationSeconds && nowElapsed >= totalDurationSeconds * 1000) {
        setElapsedMs(totalDurationSeconds * 1000);
        setIsFinished(true);
        soundManager.playSuccessChime();
      }
    }, 250);
    return () => clearInterval(interval);
  }, [startTime, isFinished, totalDurationSeconds]);

  // Calculations for WPM, Accuracy & Pass Criteria (preserved for completion screen & persistence)
  const exactMinutes = Math.max(elapsedMs / 60000, 1 / 60);
  const totalCharsCompleted =
    exerciseList.slice(0, exerciseIndex).reduce((acc, ex) => acc + ex.length, 0) + currentIndex;

  const currentParagraphCorrectChars = isTestMode
    ? typedChars.reduce((acc, ch, i) => acc + (ch === currentExerciseContent[i] ? 1 : 0), 0)
    : currentIndex;
  const effectiveCorrectChars = isTestMode
    ? completedCorrectChars + currentParagraphCorrectChars
    : totalCharsCompleted;

  const wordsTyped = effectiveCorrectChars / 5;
  const wpm = startTime ? Math.max(0, Math.round(wordsTyped / exactMinutes)) : 0;
  const rawWpm = startTime ? Math.max(0, Math.round((typedHistory.length / 5) / exactMinutes)) : 0;
  const accuracy =
    typedHistory.length > 0
      ? Math.max(0, Math.min(100, Math.round((typedHistory.filter(Boolean).length / typedHistory.length) * 100)))
      : 100;

  let isPassed = false;
  if (mode === 'lesson') {
    const reqAcc = lessonData?.completionAccuracy ?? completionAccuracy ?? 90;
    isPassed = accuracy >= reqAcc;
  } else if (mode === 'test') {
    const reqWpm = passWpm ?? 35;
    const reqAcc = passAccuracy ?? 95;
    isPassed = wpm >= reqWpm && accuracy >= reqAcc;
  } else {
    isPassed = accuracy >= 85;
  }

  const xpEarned = 50 + (isPassed ? 50 : 10) + Math.min(Math.round(wpm / 2), 50);

  const restartSession = useCallback(() => {
    if (pressedTimeoutRef.current) clearTimeout(pressedTimeoutRef.current);
    if (transitionTimeoutRef.current) clearTimeout(transitionTimeoutRef.current);
    if (controlsFadeTimeoutRef.current) clearTimeout(controlsFadeTimeoutRef.current);
    hasSubmittedRef.current = false;
    setExerciseIndex(0);
    setCurrentIndex(0);
    setTypedChars([]);
    setCompletedCorrectChars(0);
    setTypedHistory([]);
    setStartTime(null);
    setElapsedMs(0);
    setErrors(0);
    setMissedKeys({});
    setIsFinished(false);
    setCompletedSession(null);
    setIsTransitioning(false);
    setPressedKey(null);
    setErrorShakeCount(0);
    setLastResult(null);
    setControlsVisible(true);
    requestAnimationFrame(() => {
      typingInputRef.current?.focus({ preventScroll: true });
    });
  }, []);

  // Reveal subtle Back/Restart buttons on mouse movement, then fade them out again if actively typing
  const handleWorkspacePointerActivity = useCallback(() => {
    if (isFinished) return;
    setControlsVisible(true);
    if (controlsFadeTimeoutRef.current) {
      clearTimeout(controlsFadeTimeoutRef.current);
    }
    if (startTime !== null) {
      controlsFadeTimeoutRef.current = setTimeout(() => {
        setControlsVisible(false);
      }, 2200);
    }
  }, [isFinished, startTime]);

  // Keep the active character smoothly scrolled into view inside the paragraph
  useEffect(() => {
    if (!isFinished && activeCharRef.current) {
      activeCharRef.current.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  }, [currentIndex, isFinished]);

  // Split text into word-grouped tokens so words wrap naturally without mid-word breaks
  const paragraphTokens = useMemo(() => {
    const tokens: Array<{ chars: Array<{ char: string; index: number }>; isSpace: boolean }> = [];
    let idx = 0;
    const text = currentExerciseContent;
    while (idx < text.length) {
      if (text[idx] === ' ') {
        tokens.push({ chars: [{ char: ' ', index: idx }], isSpace: true });
        idx++;
      } else {
        const wordChars: Array<{ char: string; index: number }> = [];
        while (idx < text.length && text[idx] !== ' ') {
          wordChars.push({ char: text[idx], index: idx });
          idx++;
        }
        tokens.push({ chars: wordChars, isSpace: false });
      }
    }
    return tokens;
  }, [currentExerciseContent]);

  // Current expected character & hand/key guidance (always active across Lesson, Practice, and Exam)
  const currentChar = currentExerciseContent[currentIndex] || '';
  const guidanceState: GuidanceState | null = !isFinished
    ? getGuidanceForChar(
        currentChar,
        lastResult === 'incorrect' ? 'error' : lastResult === 'correct' ? 'correct' : 'target'
      )
    : null;

  // Handle keydown input: free-flow + optional Backspace in Tests, strict red-shake blocking in Lessons/Practice
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isCertificateModalOpen) return;

      const target = e.target as HTMLElement | null;
      if (
        target &&
        target !== typingInputRef.current &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable)
      ) {
        return;
      }

      if (e.key === 'Escape') {
        e.preventDefault();
        onBack();
        return;
      }

      if (e.ctrlKey || e.metaKey || e.altKey) return;

      if (isFinished) {
        if (e.key === 'Enter') {
          e.preventDefault();
          if (isPassed && onNextLesson) {
            onNextLesson();
          } else if (!isPassed) {
            restartSession();
          } else if (!isCertificateEligibleMode) {
            onBack();
          }
        }
        return;
      }

      if (isTransitioning) {
        if (e.key === ' ' || e.key.length === 1 || e.key === 'Backspace') e.preventDefault();
        return;
      }

      // Optional Backspace correction in Test & Exam mode
      if (e.key === 'Backspace') {
        if (isTestMode) {
          e.preventDefault();
          if (currentIndex > 0) {
            setCurrentIndex((prev) => Math.max(0, prev - 1));
            setTypedChars((prev) => prev.slice(0, -1));
            setLastResult(null);
          }
        }
        return;
      }

      if (
        [
          'Shift',
          'Control',
          'Alt',
          'Meta',
          'CapsLock',
          'Tab',
          'ArrowUp',
          'ArrowDown',
          'ArrowLeft',
          'ArrowRight',
          'Dead',
        ].includes(e.key)
      ) {
        return;
      }

      if (e.key.length !== 1) return;

      // Prevent Spacebar from activating buttons/scrolling and ' or / from opening browser quick find
      e.preventDefault();

      if (e.repeat) return;

      const now = Date.now();
      const effectiveStart = startTime ?? now;
      if (!startTime) {
        setStartTime(now);
      }

      // Immediately fade out utility controls while typing so only text & keyboard remain
      if (controlsFadeTimeoutRef.current) {
        clearTimeout(controlsFadeTimeoutRef.current);
      }
      setControlsVisible(false);

      const keyTyped = e.key;
      setPressedKey(keyTyped);
      if (pressedTimeoutRef.current) clearTimeout(pressedTimeoutRef.current);
      pressedTimeoutRef.current = setTimeout(() => setPressedKey(null), 160);

      const expected = currentExerciseContent[currentIndex];
      if (!expected) return;

      const isCorrectKey = keyTyped === expected;

      if (isTestMode) {
        // Free-flow Test & Exam mode: advance cursor on both correct (green) and wrong (red) keystrokes
        soundManager.playKeyClick(isCorrectKey);
        setLastResult(isCorrectKey ? 'correct' : 'incorrect');

        const nextIdx = currentIndex + 1;
        setCurrentIndex(nextIdx);
        setTypedChars((prev) => [...prev, keyTyped]);
        setTypedHistory((prev) => [...prev, isCorrectKey]);

        if (!isCorrectKey) {
          setErrors((prev) => prev + 1);
          setMissedKeys((prev) => ({
            ...prev,
            [expected]: (prev[expected] || 0) + 1,
          }));
        }

        if (nextIdx >= currentExerciseContent.length) {
          if (exerciseIndex < exerciseList.length - 1) {
            const thisExerciseCorrect =
              typedChars.reduce((acc, ch, i) => acc + (ch === currentExerciseContent[i] ? 1 : 0), 0) +
              (isCorrectKey ? 1 : 0);
            setIsTransitioning(true);
            soundManager.playSuccessChime();
            transitionTimeoutRef.current = setTimeout(() => {
              setCompletedCorrectChars((prev) => prev + thisExerciseCorrect);
              setExerciseIndex((prev) => prev + 1);
              setCurrentIndex(0);
              setTypedChars([]);
              setLastResult(null);
              setIsTransitioning(false);
            }, 220);
          } else {
            setElapsedMs(Math.max(1000, now - effectiveStart));
            setIsFinished(true);
            soundManager.playSuccessChime();
          }
        }
        return;
      }

      // Guided Lesson & Practice strict blocking mode
      if (isCorrectKey) {
        soundManager.playKeyClick(true);
        setLastResult('correct');
        const nextIdx = currentIndex + 1;
        setCurrentIndex(nextIdx);
        setTypedChars((prev) => [...prev, keyTyped]);
        setTypedHistory((prev) => [...prev, true]);

        if (nextIdx >= currentExerciseContent.length) {
          if (exerciseIndex < exerciseList.length - 1) {
            setIsTransitioning(true);
            soundManager.playSuccessChime();
            transitionTimeoutRef.current = setTimeout(() => {
              setExerciseIndex((prev) => prev + 1);
              setCurrentIndex(0);
              setTypedChars([]);
              setLastResult(null);
              setIsTransitioning(false);
            }, 220);
          } else {
            setElapsedMs(Math.max(1000, now - effectiveStart));
            setIsFinished(true);
            soundManager.playSuccessChime();
          }
        }
      } else {
        soundManager.playKeyClick(false);
        setLastResult('incorrect');
        setErrorShakeCount((c) => c + 1);
        setErrors((prev) => prev + 1);
        setTypedHistory((prev) => [...prev, false]);
        setMissedKeys((prev) => ({
          ...prev,
          [expected]: (prev[expected] || 0) + 1,
        }));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    isTestMode,
    currentIndex,
    currentExerciseContent,
    typedChars,
    isFinished,
    isTransitioning,
    startTime,
    exerciseIndex,
    exerciseList,
    onBack,
    onNextLesson,
    isPassed,
    restartSession,
    isCertificateModalOpen,
    isCertificateEligibleMode,
  ]);

  const handleVirtualKeyClick = useCallback(
    (key: string, shift?: string) => {
      if (isFinished || isTransitioning) return;
      let keyToEmit = key;
      if (key === ' ' || key === 'Space') keyToEmit = ' ';
      else if (key === 'Backspace' || key === 'Enter') keyToEmit = key;
      else if (key === 'Tab') keyToEmit = '\t';
      else if (key.length === 1) {
        const expected = currentExerciseContent[currentIndex];
        if (shift && expected === shift) {
          keyToEmit = shift;
        } else if (expected && expected.toUpperCase() === key.toUpperCase() && /[A-Z]/.test(expected)) {
          keyToEmit = expected;
        }
      } else {
        return;
      }

      const event = new KeyboardEvent('keydown', {
        key: keyToEmit,
        bubbles: true,
        cancelable: true,
      });
      window.dispatchEvent(event);
    },
    [isFinished, isTransitioning, currentExerciseContent, currentIndex]
  );

  const healingSummary = useMemo(() => {
    if (!isFinished || !remediationTargetKeys || remediationTargetKeys.length === 0) return null;
    const { healedKeys } = applyRemediationHealing(
      initialWeakKeys || {},
      remediationTargetKeys,
      accuracy,
      isPassed,
      missedKeys
    );
    return healedKeys;
  }, [isFinished, remediationTargetKeys, initialWeakKeys, accuracy, isPassed, missedKeys]);

  // Submit completion result exactly once per finished run
  useEffect(() => {
    if (isFinished && !hasSubmittedRef.current) {
      hasSubmittedRef.current = true;
      const result: SessionResult = {
        id: 'res-' + Date.now(),
        type: mode === 'lesson' ? 'lesson' : mode === 'practice' ? 'practice' : 'test',
        itemId: itemId || title,
        title,
        wpm,
        rawWpm,
        accuracy,
        errors,
        durationSeconds: Math.max(1, Math.round(elapsedMs / 1000)),
        completedAt: new Date().toISOString(),
        passed: isPassed,
        missedKeys,
        scoring: scoring || (mode === 'test' ? 'strict' : 'standard'),
        remediationTargetKeys,
        healedKeys: healingSummary || undefined,
      };
      setCompletedSession(result);
      onComplete(result);
    }
  }, [
    isFinished,
    mode,
    itemId,
    title,
    wpm,
    rawWpm,
    accuracy,
    errors,
    elapsedMs,
    isPassed,
    missedKeys,
    scoring,
    remediationTargetKeys,
    healingSummary,
    onComplete,
  ]);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const noFocus = (e: React.MouseEvent) => e.preventDefault();
  const isErrorState = lastResult === 'incorrect';
  const showKeyboardStage = !isFinished && mode !== 'test' && mode !== 'exam';
  const isShortPrompt =
    currentExerciseContent.length <= 58 && !currentExerciseContent.includes('\n');
  const typedInputValue = typedChars.join('');

  // Fallback handler for mobile/IME virtual keyboards where keydown may not intercept printable chars
  const handleMobileInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (isFinished || isTransitioning) return;
    const nextVal = e.target.value;
    if (nextVal.length < typedInputValue.length) {
      if (isTestMode && currentIndex > 0) {
        setCurrentIndex((prev) => Math.max(0, prev - 1));
        setTypedChars((prev) => prev.slice(0, -1));
        setLastResult(null);
      }
      return;
    }
    if (nextVal.length > typedInputValue.length) {
      const addedChar = nextVal[nextVal.length - 1];
      if (addedChar) {
        const synthEvent = new KeyboardEvent('keydown', { key: addedChar, bubbles: true });
        window.dispatchEvent(synthEvent);
      }
    }
  };

  const renderTypingParagraph = () => (
    <div
      className={`w-full overflow-y-auto pr-1.5 font-mono text-2xl sm:text-[32px] leading-[1.85] tracking-normal select-none ${
        showKeyboardStage
          ? 'max-h-[19vh] min-h-[64px]'
          : 'max-h-[66vh] min-h-[180px]'
      } ${isShortPrompt ? 'text-center py-1' : 'text-left'}`}
      aria-label="Typing paragraph"
    >
      {paragraphTokens.map((token, tIdx) => {
        if (token.isSpace) {
          const { index: charIdx } = token.chars[0];
          const isTyped = charIdx < currentIndex;
          const isActive = charIdx === currentIndex;
          const isWrong = isTestMode && isTyped && typedChars[charIdx] !== ' ';

          if (isActive) {
            const isBlockedError = !isTestMode && isErrorState;
            return (
              <React.Fragment key={`sp-${charIdx}-${isBlockedError ? errorShakeCount : 'ok'}`}>
                <span
                  ref={activeCharRef}
                  className={`inline-block w-[1ch] border-b-2 rounded-[2px] align-baseline transition-colors duration-75 ${
                    isBlockedError
                      ? 'bg-rose-500/45 border-rose-400 animate-error-shake'
                      : 'bg-sky-500/30 border-sky-400'
                  }`}
                >
                  &nbsp;
                </span>
                <wbr />
              </React.Fragment>
            );
          }
          if (isWrong) {
            return (
              <React.Fragment key={`sp-${charIdx}`}>
                <span className="inline-block w-[1ch] bg-rose-500/35 border-b-2 border-rose-500 rounded-[2px] align-baseline">
                  &nbsp;
                </span>
                <wbr />
              </React.Fragment>
            );
          }
          return (
            <React.Fragment key={`sp-${charIdx}`}>
              <span
                className={`inline-block w-[1ch] border-b-2 rounded-[2px] align-baseline transition-colors duration-75 ${
                  !isTestMode && !isTyped ? 'border-slate-600/65' : 'border-transparent'
                }`}
              >
                &nbsp;
              </span>
              <wbr />
            </React.Fragment>
          );
        }

        return (
          <span key={`w-${tIdx}`} className="inline-block whitespace-nowrap">
            {token.chars.map(({ char, index: charIdx }) => {
              const isTyped = charIdx < currentIndex;
              const isActive = charIdx === currentIndex;
              const isCorrect = isTyped && (!isTestMode || typedChars[charIdx] === char);
              const isWrong = isTestMode && isTyped && typedChars[charIdx] !== char;
              const isBlockedError = isActive && !isTestMode && isErrorState;

              let charClasses = 'border-b-2 transition-colors duration-75 ';
              if (isBlockedError) {
                charClasses +=
                  'inline-block bg-rose-600/90 text-white border-rose-400 rounded-[3px] animate-error-shake';
              } else if (isActive) {
                charClasses += 'bg-sky-500/20 text-zinc-950 dark:bg-sky-500/25 dark:text-white border-sky-500 dark:border-sky-400 rounded-[2px]';
              } else if (isCorrect) {
                charClasses += 'text-emerald-600 dark:text-emerald-400 border-transparent';
              } else if (isWrong) {
                charClasses += 'text-rose-600 dark:text-rose-400 bg-rose-500/15 dark:bg-rose-500/20 border-rose-500 rounded-[2px]';
              } else {
                charClasses += 'text-zinc-400 dark:text-slate-400 border-transparent';
              }

              return (
                <span
                  key={`c-${charIdx}-${isBlockedError ? errorShakeCount : 'ok'}`}
                  ref={isActive ? activeCharRef : undefined}
                  className={charClasses}
                >
                  {char}
                </span>
              );
            })}
          </span>
        );
      })}
    </div>
  );

  const renderHiddenInputCapture = () => (
    <textarea
      ref={typingInputRef}
      value={typedInputValue}
      onChange={handleMobileInputChange}
      onKeyDown={(e) => {
        if (e.key === 'Enter') e.preventDefault();
      }}
      autoFocus
      autoComplete="off"
      autoCapitalize="none"
      autoCorrect="off"
      spellCheck={false}
      aria-label="Typing input"
      className="sr-only"
    />
  );

  return (
    <div
      onMouseMove={handleWorkspacePointerActivity}
      onTouchStart={handleWorkspacePointerActivity}
      onClick={() => {
        if (!isFinished) {
          typingInputRef.current?.focus({ preventScroll: true });
        }
      }}
      className="min-h-[100dvh] h-[100dvh] w-full bg-zinc-50 dark:bg-[#09090B] text-zinc-900 dark:text-zinc-100 flex flex-col overflow-hidden select-none font-sans transition-colors duration-150"
    >
      {/* AUTO-FADING CORNER UTILITY CONTROLS (Zero layout space · Hidden while typing · Revealed on pointer move) */}
      {!isFinished && (
        <div
          className={`fixed top-4 left-4 right-4 z-30 flex items-center justify-between transition-opacity duration-200 ${
            controlsVisible ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
          }`}
        >
          <button
            type="button"
            onMouseDown={noFocus}
            onClick={(e) => {
              e.stopPropagation();
              onBack();
            }}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-white/90 hover:bg-zinc-100 text-zinc-700 hover:text-zinc-950 border border-zinc-200 dark:bg-slate-900/90 dark:hover:bg-slate-800 dark:text-slate-300 dark:hover:text-white dark:border-slate-800 text-sm font-medium backdrop-blur-sm transition-colors whitespace-nowrap shadow-sm dark:shadow-none"
            title="Back (Esc)"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back</span>
          </button>

          <button
            type="button"
            onMouseDown={noFocus}
            onClick={(e) => {
              e.stopPropagation();
              restartSession();
            }}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-white/90 hover:bg-zinc-100 text-zinc-700 hover:text-zinc-950 border border-zinc-200 dark:bg-slate-900/90 dark:hover:bg-slate-800 dark:text-slate-300 dark:hover:text-white dark:border-slate-800 text-sm font-medium backdrop-blur-sm transition-colors whitespace-nowrap shadow-sm dark:shadow-none"
            title="Restart"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Restart</span>
          </button>
        </div>
      )}

      {/* POST-COMPLETION DETAILS SCREEN (Compact Single-Screen Results · Zero Scroll) */}
      {isFinished ? (
        <main className="flex-1 min-h-0 w-full flex items-center justify-center p-4 overflow-y-auto">
          <div className="w-full max-w-lg bg-white dark:bg-[#111113] border border-zinc-200 dark:border-white/[0.08] rounded-2xl p-5 shadow-2xl flex flex-col items-center text-center gap-3.5 animate-fadeIn">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 text-[11px] font-semibold">
                {isPassed ? (
                  <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>{mode === 'test' ? 'Test Passed' : 'Completed'}</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-amber-600 dark:text-amber-400">
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>{mode === 'test' ? 'Target Not Reached' : 'Below Accuracy Target'}</span>
                  </span>
                )}
              </div>
              <h2 className="text-base sm:text-lg font-semibold text-zinc-900 dark:text-zinc-100 tracking-tight leading-snug">{title}</h2>
            </div>

            {/* Compact Hero WPM Spotlight */}
            <div className="py-1">
              <div className="text-4xl font-semibold font-mono tabular-nums text-zinc-950 dark:text-zinc-50 tracking-tight leading-none">
                {wpm} <span className="text-base font-normal text-zinc-500 dark:text-zinc-400">WPM</span>
              </div>
              <p className={`text-xs font-mono tabular-nums mt-1 ${isPassed ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`}>
                {accuracy}% accuracy
              </p>
            </div>

            <div className="w-full grid grid-cols-3 gap-2 font-mono tabular-nums">
              <div className="bg-zinc-50 dark:bg-[#09090B] border border-zinc-200 dark:border-white/[0.07] rounded-lg px-2.5 py-2">
                <div className="text-[10px] font-sans text-zinc-500">Errors</div>
                <div className="mt-0.5 text-sm font-semibold text-rose-600 dark:text-rose-400">{errors}</div>
              </div>
              <div className="bg-zinc-50 dark:bg-[#09090B] border border-zinc-200 dark:border-white/[0.07] rounded-lg px-2.5 py-2">
                <div className="text-[10px] font-sans text-zinc-500">Time</div>
                <div className="mt-0.5 text-sm font-semibold text-zinc-800 dark:text-zinc-200">
                  {formatTime(Math.max(1, Math.round(elapsedMs / 1000)))}
                </div>
              </div>
              <div className="bg-zinc-50 dark:bg-[#09090B] border border-zinc-200 dark:border-white/[0.07] rounded-lg px-2.5 py-2">
                <div className="text-[10px] font-sans text-zinc-500">Earned</div>
                <div className="mt-0.5 text-sm font-semibold text-emerald-600 dark:text-emerald-400">+{xpEarned} XP</div>
              </div>
            </div>

            {healingSummary && (
              <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-xs">
                {healingSummary.cleared.length > 0 && (
                  <span className="inline-flex items-center gap-1.5 text-emerald-400 font-semibold">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>
                      Hotspots cleared:{' '}
                      <span className="font-mono">
                        {healingSummary.cleared.map((k) => formatHotspotKeyLabel(k)).join(', ')}
                      </span>
                    </span>
                  </span>
                )}
                {healingSummary.reduced.length > 0 && (
                  <span className="inline-flex items-center gap-1.5 text-sky-400 font-semibold">
                    <span>
                      Mistake count reduced:{' '}
                      <span className="font-mono">
                        {healingSummary.reduced.map((k) => formatHotspotKeyLabel(k)).join(', ')}
                      </span>
                    </span>
                  </span>
                )}
                {!isPassed && (
                  <span className="text-amber-400 font-medium">
                    Reach {lessonData?.completionAccuracy ?? completionAccuracy ?? 90}% accuracy to reduce hotspot counts.
                  </span>
                )}
              </div>
            )}

            {isCertificateEligibleMode && isPassed && (() => {
              const currentRunCert =
                issuedCertificate &&
                completedSession &&
                issuedCertificate.sessionId === completedSession.id
                  ? issuedCertificate
                  : null;

              if (currentRunCert) {
                return (
                  <div className="w-full bg-amber-500/10 border border-amber-500/35 rounded-xl px-4 py-3.5 flex flex-col sm:flex-row items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5 text-left min-w-0">
                      <Award className="w-5 h-5 text-amber-400 shrink-0" />
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-amber-200 truncate">
                          Certificate issued for {currentRunCert.recipientName}
                        </div>
                        <div className="text-[11px] text-amber-300/80 font-mono tabular-nums">
                          ID: {currentRunCert.certificateCode}
                        </div>
                      </div>
                    </div>

                    {onViewCertificate && (
                      <button
                        type="button"
                        onClick={() => onViewCertificate(currentRunCert)}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold transition-colors whitespace-nowrap shrink-0"
                      >
                        <Award className="w-3.5 h-3.5" />
                        <span>View Certificate</span>
                      </button>
                    )}
                  </div>
                );
              }

              if (!userAccount && completedSession && onRequestCertificateAuth) {
                return (
                  <div className="w-full bg-amber-950/35 border border-amber-500/35 rounded-xl px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-left">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Award className="w-5 h-5 text-amber-400 shrink-0" />
                      <span className="text-xs font-bold text-amber-200 truncate">
                        Certificate ready to claim
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => onRequestCertificateAuth(completedSession)}
                      className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold transition-colors whitespace-nowrap shrink-0"
                    >
                      <Award className="w-3.5 h-3.5" />
                      <span>Claim Certificate</span>
                    </button>
                  </div>
                );
              }

              return null;
            })()}

            {isCertificateEligibleMode && !isPassed && (
              <p className="text-xs text-zinc-500 dark:text-slate-400 font-mono tabular-nums">
                Pass target for certificate:{' '}
                <strong className="text-zinc-800 dark:text-slate-200">{passWpm ?? 35} WPM</strong> &amp;{' '}
                <strong className="text-zinc-800 dark:text-slate-200">{passAccuracy ?? 95}%</strong> accuracy.
              </p>
            )}

            <div className="flex flex-wrap items-center justify-center gap-2.5 pt-1">
              <button
                type="button"
                onClick={restartSession}
                className={`px-4 py-2 rounded-lg font-semibold text-xs transition-colors flex items-center gap-1.5 whitespace-nowrap ${
                  !isPassed
                    ? 'bg-amber-600 hover:bg-amber-500 text-white'
                    : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-800 border border-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 dark:text-zinc-100 dark:border-white/[0.1]'
                }`}
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>{isPassed ? 'Try Again' : 'Retry'}</span>
              </button>

              {onNextLesson && (
                <button
                  type="button"
                  onClick={onNextLesson}
                  className={`px-4 py-2 rounded-lg font-semibold text-xs transition-colors flex items-center gap-1.5 whitespace-nowrap ${
                    isPassed
                      ? 'bg-emerald-600 hover:bg-emerald-500 text-white dark:bg-emerald-500 dark:hover:bg-emerald-400 dark:text-zinc-950'
                      : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-800 border border-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 dark:text-zinc-200 dark:border-white/[0.1]'
                  }`}
                >
                  <span>Next Lesson</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              )}

              <button
                type="button"
                onClick={onBack}
                className="px-4 py-2 rounded-lg bg-zinc-100 hover:bg-zinc-200 border border-zinc-200 text-zinc-700 dark:bg-zinc-900 dark:hover:bg-zinc-800 dark:border-white/[0.08] dark:text-zinc-300 font-medium text-xs transition-colors whitespace-nowrap"
              >
                {mode === 'test'
                  ? 'Back to Tests'
                  : mode === 'practice'
                  ? 'Back to Practice'
                  : 'Back to Lessons'}
              </button>
            </div>
          </div>
        </main>
      ) : (
        <div className="flex-1 min-h-0 w-full flex items-center justify-center overflow-hidden">
          {/* Left Skyscraper Rail (Visible on wide screens) */}
          {isSiteAdSlotVisible(SITE_ADS_CONFIG.slots.workspaceLeftRail.id, adSettings) && (
            <div className="hidden xl:flex flex-none items-center justify-center px-2 py-4 z-10">
              <AdSlot slot={SITE_ADS_CONFIG.slots.workspaceLeftRail} />
            </div>
          )}

          {showKeyboardStage ? (
            /* LESSONS & PRACTICE: SINGLE DIRECT-TYPING TEXT BOX + ENLARGED KEYBOARD & HANDS */
            <main className="flex-1 min-h-0 w-full max-w-7xl mx-auto flex flex-col justify-center gap-4 sm:gap-5 px-4 sm:px-8 pt-14 pb-4 sm:pt-12 sm:pb-5 overflow-hidden">
              {renderHiddenInputCapture()}

              <div
                className={`w-full max-w-5xl mx-auto flex-none bg-white dark:bg-slate-900/95 border rounded-2xl px-6 py-4 sm:px-10 sm:py-5 shadow-md dark:shadow-xl transition-colors ${
                  isErrorState
                    ? 'border-rose-500/80 ring-2 ring-rose-500/20'
                    : 'border-zinc-200 dark:border-slate-800'
                }`}
              >
                {renderTypingParagraph()}
              </div>

              <div className="w-full flex-1 min-h-[280px] max-h-[72vh] flex items-center justify-center">
                <TypingHandsKeyboard
                  guidanceState={guidanceState}
                  pressedKey={pressedKey}
                  lastResult={lastResult}
                  targetKeyVisible={guidanceConfig.targetKeyVisible}
                  handsVisible={guidanceConfig.handsVisible}
                  onVirtualKeyClick={handleVirtualKeyClick}
                />
              </div>
            </main>
          ) : (
            /* TESTS & EXAMS: SINGLE CENTERED DIRECT-TYPING TEXT SURFACE (No Keyboard) */
            <main className="flex-1 min-h-0 w-full max-w-5xl mx-auto flex flex-col items-center justify-center px-6 sm:px-10 py-10 overflow-hidden">
              {renderHiddenInputCapture()}

              <div
                className={`w-full bg-white dark:bg-slate-900/95 border rounded-2xl px-7 py-8 sm:px-12 sm:py-10 shadow-lg dark:shadow-2xl transition-colors ${
                  isErrorState
                    ? 'border-rose-500/80 ring-2 ring-rose-500/20'
                    : 'border-zinc-200 dark:border-slate-800'
                }`}
              >
                {renderTypingParagraph()}
              </div>
            </main>
          )}

          {/* Right Skyscraper Rail (Visible on wide screens) */}
          {isSiteAdSlotVisible(SITE_ADS_CONFIG.slots.workspaceRightRail.id, adSettings) && (
            <div className="hidden xl:flex flex-none items-center justify-center px-2 py-4 z-10">
              <AdSlot slot={SITE_ADS_CONFIG.slots.workspaceRightRail} />
            </div>
          )}
        </div>
      )}
    </div>
  );
};
