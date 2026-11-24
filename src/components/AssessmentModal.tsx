import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { SkillLevel } from '../types';
import { Award, ArrowLeft, RotateCcw } from 'lucide-react';

interface AssessmentModalProps {
  onAssignLevel: (level: SkillLevel, wpm: number, accuracy: number) => void;
  onClose: () => void;
}

const ASSESSMENT_TEXT =
  'the quick brown fox jumps over the lazy dog touch typing empowers your mind';

export const AssessmentModal: React.FC<AssessmentModalProps> = ({
  onAssignLevel,
  onClose,
}) => {
  const [typed, setTyped] = useState('');
  const [startTime, setStartTime] = useState<number | null>(null);
  const [isDone, setIsDone] = useState(false);
  const [wpmResult, setWpmResult] = useState(0);
  const [accResult, setAccResult] = useState(100);
  const [controlsVisible, setControlsVisible] = useState(true);

  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fadeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Group into whole-word tokens so the target sentence wraps cleanly by word without clipping
  const passageTokens = useMemo(() => {
    const tokens: Array<{ chars: Array<{ char: string; index: number }>; isSpace: boolean }> = [];
    let idx = 0;
    while (idx < ASSESSMENT_TEXT.length) {
      if (ASSESSMENT_TEXT[idx] === ' ') {
        tokens.push({ chars: [{ char: ' ', index: idx }], isSpace: true });
        idx++;
      } else {
        const wordChars: Array<{ char: string; index: number }> = [];
        while (idx < ASSESSMENT_TEXT.length && ASSESSMENT_TEXT[idx] !== ' ') {
          wordChars.push({ char: ASSESSMENT_TEXT[idx], index: idx });
          idx++;
        }
        tokens.push({ chars: wordChars, isSpace: false });
      }
    }
    return tokens;
  }, []);

  const restartAssessment = useCallback(() => {
    setTyped('');
    setStartTime(null);
    setIsDone(false);
    setWpmResult(0);
    setAccResult(100);
    setControlsVisible(true);
    window.requestAnimationFrame(() => {
      inputRef.current?.focus({ preventScroll: true });
    });
  }, []);

  // Auto-focus centered input field on mount and when restarting
  useEffect(() => {
    if (!isDone) {
      inputRef.current?.focus({ preventScroll: true });
    }
  }, [isDone]);

  // Auto-resize multi-line input so the full typed sentence stays visible without clipping
  useEffect(() => {
    const el = inputRef.current;
    if (!el || isDone) return;
    el.style.height = 'auto';
    const maxHeight = Math.round(window.innerHeight * 0.3);
    el.style.height = `${Math.min(el.scrollHeight, maxHeight)}px`;
    el.scrollTop = el.scrollHeight;
  }, [typed, isDone]);

  useEffect(() => {
    return () => {
      if (fadeTimeoutRef.current) clearTimeout(fadeTimeoutRef.current);
    };
  }, []);

  // Global Escape to return cleanly
  useEffect(() => {
    const onGlobalKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', onGlobalKey);
    return () => window.removeEventListener('keydown', onGlobalKey);
  }, [onClose]);

  const handlePointerActivity = useCallback(() => {
    if (isDone) return;
    setControlsVisible(true);
    if (fadeTimeoutRef.current) clearTimeout(fadeTimeoutRef.current);
    if (startTime !== null) {
      fadeTimeoutRef.current = setTimeout(() => {
        setControlsVisible(false);
      }, 2200);
    }
  }, [isDone, startTime]);

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (isDone) return;
    const rawValue = e.target.value.replace(/\r?\n/g, ' ');
    const next = rawValue.slice(0, ASSESSMENT_TEXT.length);

    const now = Date.now();
    const effectiveStart = startTime ?? now;
    if (!startTime && next.length > 0) {
      setStartTime(now);
    }

    if (next.length > typed.length) {
      if (fadeTimeoutRef.current) clearTimeout(fadeTimeoutRef.current);
      setControlsVisible(false);
    }

    setTyped(next);

    if (next.length >= ASSESSMENT_TEXT.length) {
      setIsDone(true);
      setControlsVisible(true);
      const durationMin = Math.max((now - effectiveStart) / 60000, 1 / 60);
      const correctChars = next
        .split('')
        .filter((c, idx) => c === ASSESSMENT_TEXT[idx]).length;
      const calcWpm = Math.max(0, Math.round(correctChars / 5 / durationMin));
      const calcAcc =
        next.length > 0
          ? Math.max(
              0,
              Math.min(100, Math.round((correctChars / next.length) * 100))
            )
          : 100;
      setWpmResult(calcWpm);
      setAccResult(calcAcc);
    }
  };

  const hasCurrentMistake =
    typed.length > 0 && typed[typed.length - 1] !== ASSESSMENT_TEXT[typed.length - 1];

  const recommendedLevel: SkillLevel =
    wpmResult >= 55 && accResult >= 95
      ? 'advanced'
      : wpmResult >= 30 && accResult >= 90
      ? 'intermediate'
      : 'beginner';

  return (
    <div
      onMouseMove={handlePointerActivity}
      onClick={() => {
        if (!isDone) {
          inputRef.current?.focus({ preventScroll: true });
        }
      }}
      className="relative min-h-[100dvh] h-[100dvh] w-full bg-slate-950 text-slate-100 flex flex-col overflow-hidden select-none"
      role="main"
      aria-label="Skill Placement Assessment"
    >
      {/* Subtle auto-fading corner controls while typing */}
      {!isDone && (
        <>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
            aria-label="Back to lessons"
            className={`fixed top-5 left-5 z-20 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900/80 hover:bg-slate-800 border border-slate-800/80 text-slate-300 hover:text-white text-xs font-medium transition-opacity duration-300 ${
              controlsVisible
                ? 'opacity-90 pointer-events-auto'
                : 'opacity-0 pointer-events-none'
            }`}
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back</span>
          </button>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              restartAssessment();
            }}
            aria-label="Restart assessment"
            className={`fixed top-5 right-5 z-20 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900/80 hover:bg-slate-800 border border-slate-800/80 text-slate-300 hover:text-white text-xs font-medium transition-opacity duration-300 ${
              controlsVisible
                ? 'opacity-90 pointer-events-auto'
                : 'opacity-0 pointer-events-none'
            }`}
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Restart</span>
          </button>
        </>
      )}

      {!isDone ? (
        <div className="flex-1 w-full flex flex-col items-center justify-center px-6 sm:px-10 gap-8 sm:gap-10">
          {/* Target Assessment Passage — wraps cleanly by whole word without overflowing */}
          <div
            className="w-full max-w-4xl font-mono text-2xl sm:text-[28px] leading-[1.9] tracking-normal text-center break-words"
            aria-label="Assessment passage"
          >
            {passageTokens.map((token, tIdx) => {
              if (token.isSpace) {
                const { index: charIdx } = token.chars[0];
                const isActive = charIdx === typed.length;
                const isWrong = charIdx < typed.length && typed[charIdx] !== ' ';

                if (isActive) {
                  return (
                    <React.Fragment key={`sp-${charIdx}`}>
                      <span className="inline-block min-w-[0.55em] bg-sky-500/30 border-b-2 border-sky-400 rounded-[2px] align-baseline">
                        &nbsp;
                      </span>
                      <wbr />
                    </React.Fragment>
                  );
                }
                if (isWrong) {
                  return (
                    <React.Fragment key={`sp-${charIdx}`}>
                      <span className="inline-block min-w-[0.55em] bg-rose-500/35 border-b-2 border-rose-500 rounded-[2px] align-baseline">
                        &nbsp;
                      </span>
                      <wbr />
                    </React.Fragment>
                  );
                }
                return <React.Fragment key={`sp-${charIdx}`}> </React.Fragment>;
              }

              return (
                <span key={`w-${tIdx}`} className="inline-block whitespace-nowrap">
                  {token.chars.map(({ char, index: charIdx }) => {
                    let cls = 'text-slate-400 border-b-2 border-transparent';
                    if (charIdx < typed.length) {
                      cls =
                        typed[charIdx] === char
                          ? 'text-emerald-400 border-b-2 border-transparent'
                          : 'text-rose-300 bg-rose-500/25 border-b-2 border-rose-500 rounded-[2px]';
                    } else if (charIdx === typed.length) {
                      cls = 'text-white bg-sky-500/25 border-b-2 border-sky-400 rounded-[2px]';
                    }
                    return (
                      <span key={`c-${charIdx}`} className={`${cls} transition-colors duration-75`}>
                        {char}
                      </span>
                    );
                  })}
                </span>
              );
            })}
          </div>

          {/* Centered Multi-Line Typing Input Field — shows full typed sentence cleanly */}
          <div className="w-full max-w-4xl mx-auto">
            <textarea
              ref={inputRef}
              rows={2}
              value={typed}
              onChange={handleInputChange}
              onKeyDown={(e) => {
                if (e.key === 'Enter') e.preventDefault();
              }}
              autoFocus
              autoComplete="off"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              placeholder="Type the sentence above..."
              aria-label="Skill placement typing input"
              className={`w-full min-h-[76px] max-h-[30vh] px-6 py-4 rounded-2xl bg-slate-900/95 border-2 font-mono text-xl sm:text-2xl leading-[1.7] text-center tracking-wide text-emerald-300 placeholder:text-slate-500 focus:outline-none transition-colors shadow-xl resize-none overflow-y-auto ${
                hasCurrentMistake
                  ? 'border-rose-500 ring-2 ring-rose-500/25'
                  : 'border-sky-500/70 focus:border-sky-400 focus:ring-2 focus:ring-sky-500/25'
              }`}
            />
          </div>
        </div>
      ) : (
        <div className="flex-1 w-full overflow-y-auto flex items-center justify-center px-6 py-10">
          <div className="w-full max-w-3xl bg-slate-900/90 border border-slate-800 rounded-3xl p-8 sm:p-10 shadow-2xl space-y-8 text-center animate-fadeIn">
            <div className="space-y-3">
              <div className="w-14 h-14 bg-emerald-500/15 border border-emerald-500/35 text-emerald-400 rounded-2xl flex items-center justify-center mx-auto">
                <Award className="w-7 h-7" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                Skill Placement Complete
              </h1>
              <div className="flex items-center justify-center gap-4 text-sm text-slate-300 font-mono tabular-nums">
                <span className="text-sky-400 font-bold text-lg">{wpmResult} WPM</span>
                <span className="text-slate-600" aria-hidden="true">
                  ·
                </span>
                <span className="text-emerald-400 font-bold text-lg">
                  {accResult}% Accuracy
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {(
                [
                  {
                    id: 'beginner' as SkillLevel,
                    title: 'Beginner',
                    desc: 'Foundational home row & finger placement',
                    accent: 'text-emerald-400',
                  },
                  {
                    id: 'intermediate' as SkillLevel,
                    title: 'Intermediate',
                    desc: 'Fluency, Shift capitalization & punctuation',
                    accent: 'text-amber-400',
                  },
                  {
                    id: 'advanced' as SkillLevel,
                    title: 'Advanced',
                    desc: 'High-speed prose, code syntax & exams',
                    accent: 'text-rose-400',
                  },
                ] as const
              ).map((tier) => {
                const isRec = recommendedLevel === tier.id;
                return (
                  <button
                    key={tier.id}
                    type="button"
                    onClick={() => onAssignLevel(tier.id, wpmResult, accResult)}
                    className={`p-5 rounded-2xl border flex flex-col items-center justify-between text-center gap-3 transition-colors ${
                      isRec
                        ? 'bg-sky-950/60 hover:bg-sky-900/60 border-sky-500 shadow-lg'
                        : 'bg-slate-950/60 hover:bg-slate-800/80 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <span className={`text-sm font-bold ${tier.accent}`}>
                      {tier.title}
                      {isRec ? ' · Recommended' : ''}
                    </span>
                    <span className="text-xs font-semibold text-sky-400">
                      Start Track →
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={restartAssessment}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-semibold transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Retake Assessment</span>
              </button>
              <button
                type="button"
                onClick={onClose}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 text-xs font-semibold transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back to Lessons</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
