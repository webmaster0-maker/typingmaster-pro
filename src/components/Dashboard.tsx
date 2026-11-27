import React, { useRef, useState } from 'react';
import { Lesson, PracticeItem, UserStats, SessionResult } from '../types';
import { calculateGrowthProfile, getLessonCompletionMeta } from '../utils/growthEngine';
import { ArrowRight, ChevronDown, Gamepad2, RotateCcw } from 'lucide-react';

interface DashboardProps {
  lessons: Lesson[];
  practiceItems: PracticeItem[];
  userStats: UserStats;
  sessionHistory?: SessionResult[];
  onStartLesson: (lesson: Lesson) => void;
  onStartPractice: (practice: PracticeItem) => void;
  onOpenNourishmentDrills: () => void;
  onOpenArcade?: () => void;
  setActiveTab: (tab: string) => void;
}

const PREVIEW_TEXT = 'calm fingers glide smoothly across every key';

export const Dashboard: React.FC<DashboardProps> = ({
  lessons,
  practiceItems,
  userStats,
  sessionHistory = [],
  onStartLesson,
  onStartPractice,
  onOpenNourishmentDrills,
  onOpenArcade,
  setActiveTab,
}) => {
  const growthProfile = calculateGrowthProfile(userStats, sessionHistory);
  const [openFaq, setOpenFaq] = useState<number>(0);

  // Interactive 1-line hero typing preview state (no persistence, instant tactile engagement)
  const [previewTyped, setPreviewTyped] = useState('');
  const [previewStart, setPreviewStart] = useState<number | null>(null);
  const [previewEnd, setPreviewEnd] = useState<number | null>(null);
  const previewInputRef = useRef<HTMLInputElement>(null);

  const handlePreviewChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.slice(0, PREVIEW_TEXT.length);
    if (!previewStart && val.length > 0) {
      setPreviewStart(Date.now());
    }
    if (val.length === PREVIEW_TEXT.length && !previewEnd) {
      setPreviewEnd(Date.now());
    } else if (val.length < PREVIEW_TEXT.length && previewEnd) {
      setPreviewEnd(null);
    }
    setPreviewTyped(val);
  };

  const resetPreview = () => {
    setPreviewTyped('');
    setPreviewStart(null);
    setPreviewEnd(null);
    previewInputRef.current?.focus();
  };

  const previewCorrect = previewTyped
    .split('')
    .filter((ch, idx) => ch === PREVIEW_TEXT[idx]).length;
  const previewElapsedMin = previewStart
    ? Math.max(0.02, ((previewEnd ?? Date.now()) - previewStart) / 60000)
    : 0;
  const previewWpm = previewStart && previewTyped.length > 1
    ? Math.round(previewCorrect / 5 / previewElapsedMin)
    : 0;

  const faqItems = [
    {
      q: 'How does TypeCrest teach touch typing with 3D hands?',
      a: 'TypeCrest renders interactive 3D articulated hands and a synchronized QWERTY keyboard that highlight the exact key and finger needed for every character, including opposite-hand Shift coordination.',
    },
    {
      q: 'Is TypeCrest really free to use?',
      a: `Yes. TypeCrest is 100% free ($0 USD) with no paid tiers. All ${lessons.length} touch typing lessons, 24 themed practice and test paragraphs, weak-key drills, PDF/PNG certificates, and arcade games run in your browser.`,
    },
    {
      q: 'How do I earn a typing speed certificate?',
      a: 'Pass any timed speed test or certification exam on the Speed tests page with at least 35 WPM net speed and 95% accuracy to download an official PDF or PNG certificate with a unique verification code.',
    },
    {
      q: 'How do weak-key drills work?',
      a: 'TypeCrest automatically tracks missed keys during lessons and tests, identifies hotspot patterns, and generates 3-stage recovery drills (isolated taps, transitions, and real words) to eliminate mistakes.',
    },
    {
      q: 'Do I need an account, and where is my data stored?',
      a: 'No sign-up is required. TypeCrest is local-first: your WPM stats, lesson progress, weak-key history, and earned certificates stay privately in your browser.',
    },
    {
      q: 'What devices and keyboards are supported?',
      a: 'TypeCrest is designed for desktop and laptop computers with a physical QWERTY keyboard. You can toggle between 3D Articulated Hands, 2D Vector Hands, and light or dark keyboard themes.',
    },
  ];

  const nextLesson =
    lessons.find((l) => {
      const meta = getLessonCompletionMeta(l.id, l.title, sessionHistory);
      return !meta.isCompleted;
    }) || lessons[0];

  const featuredDrills = practiceItems.slice(0, 2);
  const completionPct = Math.round((growthProfile.totalBlooms / Math.max(1, lessons.length)) * 100);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14 space-y-14 animate-fadeIn">
      {/* Open Editorial Hero + Instant Typing Preview */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
        <div className="lg:col-span-7 space-y-6">
          <div className="space-y-3">
            <p className="text-xs font-mono uppercase tracking-widest text-emerald-600 dark:text-emerald-400">
              Touch Typing Studio
            </p>
            <h1 className="text-3xl sm:text-5xl font-semibold text-zinc-950 dark:text-zinc-50 tracking-[-0.03em] leading-[1.1] text-balance">
              Stop looking at your keyboard.
            </h1>
            <p className="text-sm sm:text-base text-zinc-600 dark:text-zinc-400 leading-relaxed max-w-xl">
              Learn touch typing through short lessons, real paragraphs, and speed tests.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-1">
            {nextLesson && (
              <button
                type="button"
                onClick={() => onStartLesson(nextLesson)}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 dark:bg-emerald-500 dark:hover:bg-emerald-400 text-white dark:text-zinc-950 font-semibold text-sm transition-colors whitespace-nowrap"
              >
                <span>Start typing</span>
              </button>
            )}
            <a
              href="/lessons"
              onClick={(e) => {
                if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
                e.preventDefault();
                setActiveTab('lessons');
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-zinc-700 hover:text-zinc-950 border border-zinc-200 hover:border-zinc-300 bg-white dark:bg-transparent dark:text-zinc-300 dark:hover:text-white dark:border-white/[0.1] dark:hover:border-white/[0.2] font-medium text-sm transition-colors whitespace-nowrap"
            >
              <span>All lessons</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>

        {/* Live 1-Line Try-It Typing Card */}
        <div
          onClick={() => previewInputRef.current?.focus()}
          className="lg:col-span-5 bg-white dark:bg-[#111113] border border-zinc-200 hover:border-zinc-300 dark:border-white/[0.08] dark:hover:border-white/[0.15] rounded-xl p-5 space-y-4 cursor-text transition-colors shadow-sm dark:shadow-none"
        >
          <div className="flex items-center justify-between text-[11px]">
            <span className="font-mono text-zinc-500 dark:text-zinc-400">
              {previewEnd ? 'Completed' : 'Click & type to test'}
            </span>
            <div className="flex items-center gap-3 font-mono tabular-nums">
              <span className="text-emerald-600 dark:text-emerald-400">{previewWpm} WPM</span>
              {previewTyped.length > 0 && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    resetPreview();
                  }}
                  aria-label="Reset preview"
                  className="text-zinc-400 hover:text-zinc-700 dark:text-zinc-500 dark:hover:text-zinc-200 transition-colors"
                >
                  <RotateCcw className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>

          <div className="font-mono text-base sm:text-lg leading-relaxed tracking-wide select-none break-words">
            {PREVIEW_TEXT.split('').map((char, idx) => {
              const typed = previewTyped[idx];
              const isCursor = idx === previewTyped.length;
              let cls = 'text-zinc-400 dark:text-zinc-600';
              if (typed !== undefined) {
                cls = typed === char ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 bg-rose-500/15 dark:text-rose-400 rounded-sm';
              } else if (isCursor) {
                cls = 'text-zinc-950 dark:text-zinc-100 border-b-2 border-emerald-500 dark:border-emerald-400';
              }
              return (
                <span key={idx} className={cls}>
                  {char}
                </span>
              );
            })}
          </div>

          <input
            ref={previewInputRef}
            type="text"
            value={previewTyped}
            onChange={handlePreviewChange}
            aria-label="Quick typing preview"
            spellCheck={false}
            autoComplete="off"
            autoCapitalize="off"
            className="sr-only"
          />

          <div className="h-0.5 w-full bg-zinc-200 dark:bg-white/[0.06] rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-500 dark:bg-emerald-400 transition-all duration-100"
              style={{ width: `${(previewTyped.length / PREVIEW_TEXT.length) * 100}%` }}
            />
          </div>
        </div>
      </section>

      {/* Flat Hairline Telemetry Strip with 2px Progress Bar */}
      <section aria-label="Your typing progress" className="border-y border-zinc-200 dark:border-white/[0.08] py-6">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 sm:gap-8">
          <div>
            <p className="text-2xl sm:text-3xl font-semibold text-zinc-950 dark:text-zinc-50 font-mono tabular-nums tracking-tight">
              {userStats.avgWpm}
            </p>
            <p className="text-xs text-zinc-500 mt-1">Average WPM</p>
          </div>

          <div>
            <p className="text-2xl sm:text-3xl font-semibold text-zinc-950 dark:text-zinc-50 font-mono tabular-nums tracking-tight">
              {userStats.avgAccuracy}%
            </p>
            <p className="text-xs text-zinc-500 mt-1">Accuracy</p>
          </div>

          <div className="space-y-1.5">
            <p className="text-2xl sm:text-3xl font-semibold text-zinc-950 dark:text-zinc-50 font-mono tabular-nums tracking-tight">
              {growthProfile.totalBlooms}
              <span className="text-sm font-normal text-zinc-500">/{lessons.length}</span>
            </p>
            <p className="text-xs text-zinc-500">Lessons done ({completionPct}%)</p>
            <div className="h-0.5 w-full max-w-[140px] bg-zinc-200 dark:bg-white/[0.06] rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-500 dark:bg-emerald-400 transition-all duration-300"
                style={{ width: `${completionPct}%` }}
              />
            </div>
          </div>

          <div>
            <p className="text-2xl sm:text-3xl font-semibold text-zinc-950 dark:text-zinc-50 font-mono tabular-nums tracking-tight">
              {userStats.xp}
            </p>
            <p className="text-xs text-zinc-500 mt-1">XP earned</p>
          </div>
        </div>
      </section>

      {/* Main Two-Column Launch Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 items-start">
        {/* Left 2 Cols: Recommended Lessons */}
        <div className="lg:col-span-2 space-y-5">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100 tracking-tight">
              Recommended Lessons
            </h2>

            <a
              href="/lessons"
              onClick={(e) => {
                if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
                e.preventDefault();
                setActiveTab('lessons');
              }}
              className="text-xs font-medium text-zinc-500 hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-zinc-100 flex items-center gap-1 whitespace-nowrap transition-colors"
            >
              <span>All lessons</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </a>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {lessons.slice(0, 4).map((lesson) => {
              const meta = getLessonCompletionMeta(
                lesson.id,
                lesson.title,
                sessionHistory
              );
              const isCompleted = meta.isCompleted;
              const isNextUp = nextLesson?.id === lesson.id && !isCompleted;

              return (
                <button
                  key={lesson.id}
                  type="button"
                  onClick={() => onStartLesson(lesson)}
                  className={`group text-left p-5 rounded-xl border transition-colors duration-150 flex flex-col justify-between gap-4 shadow-sm dark:shadow-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 ${
                    isCompleted
                      ? 'bg-white border-emerald-500/40 hover:border-emerald-500/60 dark:bg-[#111113] dark:border-emerald-500/30 dark:hover:border-emerald-500/50'
                      : isNextUp
                      ? 'bg-white hover:bg-zinc-50 border-zinc-300 dark:bg-[#111113] dark:hover:bg-zinc-900 dark:border-white/[0.18]'
                      : 'bg-white hover:bg-zinc-50 border-zinc-200 hover:border-zinc-300 dark:bg-[#111113] dark:hover:bg-zinc-900 dark:border-white/[0.08] dark:hover:border-white/[0.16]'
                  }`}
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2 text-[11px]">
                      <span
                        className={`font-medium ${
                          isCompleted
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : isNextUp
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : 'text-zinc-500'
                        }`}
                      >
                        {isCompleted ? 'Completed' : isNextUp ? 'Next up' : `Module ${lesson.module}`}
                      </span>
                      <div className="flex items-center gap-1">
                        {lesson.targetKeys.slice(0, 4).map((k) => (
                          <kbd
                            key={k}
                            className="inline-flex items-center justify-center min-w-[18px] h-5 px-1 rounded bg-zinc-100 border border-zinc-200 text-zinc-700 dark:bg-zinc-950 dark:border-white/[0.1] text-[10px] font-mono dark:text-zinc-400 uppercase"
                          >
                            {k === ' ' ? 'SPC' : k}
                          </kbd>
                        ))}
                      </div>
                    </div>
                    <h3 className="text-sm font-medium text-zinc-900 group-hover:text-zinc-950 dark:text-zinc-100 dark:group-hover:text-white transition-colors">
                      {lesson.title}
                    </h3>
                  </div>

                  <div className="pt-3 border-t border-zinc-100 dark:border-white/[0.06] flex items-center justify-between text-xs text-zinc-500 group-hover:text-zinc-900 dark:text-zinc-400 dark:group-hover:text-zinc-200">
                    <span className="tabular-nums font-mono">
                      {isCompleted ? `${meta.bestWpm} WPM` : 'Start'}
                    </span>
                    <ArrowRight className="w-3.5 h-3.5 transform group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Col: Weak-Key Practice + Arcade Quick Entry */}
        <div className="space-y-5">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100 tracking-tight">
              Weak-key practice
            </h2>

            <a
              href="/drills"
              onClick={(e) => {
                if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
                e.preventDefault();
                onOpenNourishmentDrills();
              }}
              className="text-xs font-medium text-zinc-500 hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-zinc-100 flex items-center gap-1 whitespace-nowrap shrink-0 transition-colors"
            >
              <span>All drills</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </a>
          </div>

          <div className="space-y-3.5">
            {featuredDrills.map((prac) => (
              <button
                key={prac.id}
                type="button"
                onClick={() => onStartPractice(prac)}
                className="w-full text-left bg-white hover:bg-zinc-50 border border-zinc-200 hover:border-zinc-300 dark:bg-[#111113] dark:hover:bg-zinc-900 dark:border-white/[0.08] dark:hover:border-white/[0.16] p-5 rounded-xl shadow-sm dark:shadow-none transition-colors duration-150 flex items-center justify-between gap-3 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
              >
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-1.5 text-[11px] text-zinc-500">
                    <span className="capitalize">{prac.type.replace('_', ' ')}</span>
                    <span aria-hidden="true">·</span>
                    <span className="font-mono tabular-nums">{prac.durationMinutes} min</span>
                  </div>
                  <h3 className="text-sm font-medium text-zinc-900 group-hover:text-zinc-950 dark:text-zinc-100 dark:group-hover:text-white transition-colors truncate">
                    {prac.title}
                  </h3>
                </div>
                <ArrowRight className="w-4 h-4 text-zinc-400 group-hover:text-zinc-700 dark:text-zinc-500 dark:group-hover:text-zinc-200 group-hover:translate-x-0.5 transition-all shrink-0" />
              </button>
            ))}

            {onOpenArcade && (
              <button
                type="button"
                onClick={onOpenArcade}
                className="w-full text-left bg-amber-50 hover:bg-amber-100/80 border border-amber-300 hover:border-amber-400 dark:bg-amber-500/[0.06] dark:hover:bg-amber-500/[0.12] dark:border-amber-500/25 dark:hover:border-amber-400/45 p-5 rounded-xl transition-colors duration-150 flex items-center justify-between gap-3 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <Gamepad2 className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-[11px] font-mono text-amber-700 dark:text-amber-400">6 Modes</p>
                    <h3 className="text-sm font-medium text-amber-950 group-hover:text-amber-950 dark:text-amber-100 dark:group-hover:text-white transition-colors truncate">
                      Play Typing Arcade
                    </h3>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-amber-600 dark:text-amber-400 group-hover:translate-x-0.5 transition-transform shrink-0" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Curriculum Overview & Interactive FAQ */}
      <section
        aria-labelledby="typecrest-guide-heading"
        className="grid grid-cols-1 lg:grid-cols-12 gap-10 pt-10 border-t border-zinc-200 dark:border-white/[0.08]"
      >
        <div className="lg:col-span-6 space-y-4">
          <h2 id="typecrest-guide-heading" className="text-base font-semibold text-zinc-900 dark:text-zinc-100 tracking-tight">
            Curriculum
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-zinc-200 dark:border-white/[0.08] text-zinc-500 uppercase tracking-wider text-[10px]">
                  <th className="py-2.5 pr-3 font-medium">Track</th>
                  <th className="py-2.5 px-3 font-medium">Focus Areas</th>
                  <th className="py-2.5 pl-3 font-medium text-right">Pass Target</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 dark:divide-white/[0.06] text-zinc-700 dark:text-zinc-300">
                <tr>
                  <td className="py-3 pr-3 font-medium text-zinc-900 dark:text-zinc-100">Beginner</td>
                  <td className="py-3 px-3 text-zinc-600 dark:text-zinc-400">F &amp; J anchors, home row, top &amp; bottom reaches</td>
                  <td className="py-3 pl-3 font-mono text-right text-zinc-700 dark:text-zinc-300">90%+ Acc</td>
                </tr>
                <tr>
                  <td className="py-3 pr-3 font-medium text-zinc-900 dark:text-zinc-100">Intermediate</td>
                  <td className="py-3 px-3 text-zinc-600 dark:text-zinc-400">Digraph rhythm, Shift capitals, punctuation</td>
                  <td className="py-3 pl-3 font-mono text-right text-zinc-700 dark:text-zinc-300">92%+ Acc</td>
                </tr>
                <tr>
                  <td className="py-3 pr-3 font-medium text-zinc-900 dark:text-zinc-100">Advanced</td>
                  <td className="py-3 px-3 text-zinc-600 dark:text-zinc-400">Code syntax, numbers, endurance passages</td>
                  <td className="py-3 pl-3 font-mono text-right text-zinc-700 dark:text-zinc-300">95%+ Acc</td>
                </tr>
                <tr>
                  <td className="py-3 pr-3 font-medium text-emerald-600 dark:text-emerald-400">Certification</td>
                  <td className="py-3 px-3 text-zinc-600 dark:text-zinc-400">Timed speed tests &amp; PDF/PNG awards</td>
                  <td className="py-3 pl-3 font-mono text-right text-emerald-600 dark:text-emerald-400">35+ WPM · 95%</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div className="lg:col-span-6 space-y-4">
          <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100 tracking-tight">
            Frequently Asked Questions
          </h2>
          <div className="divide-y divide-zinc-200 dark:divide-white/[0.06] border-t border-zinc-200 dark:border-white/[0.06]">
            {faqItems.map((item, idx) => {
              const isOpen = openFaq === idx;
              return (
                <div key={item.q} className="py-3">
                  <button
                    type="button"
                    onClick={() => setOpenFaq(isOpen ? -1 : idx)}
                    aria-expanded={isOpen}
                    className="w-full flex items-center justify-between gap-3 text-left text-xs font-medium text-zinc-800 hover:text-zinc-950 dark:text-zinc-200 dark:hover:text-white transition-colors"
                  >
                    <span>{item.q}</span>
                    <ChevronDown
                      className={`w-4 h-4 text-zinc-400 dark:text-zinc-500 shrink-0 transition-transform duration-200 ${
                        isOpen ? 'rotate-180 text-zinc-700 dark:text-zinc-200' : ''
                      }`}
                    />
                  </button>
                  {isOpen && (
                    <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed pt-2 pr-6">
                      {item.a}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
};
