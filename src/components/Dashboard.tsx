import React, { useState } from 'react';
import { Lesson, PracticeItem, UserStats, SessionResult } from '../types';
import { calculateGrowthProfile, getLessonCompletionMeta } from '../utils/growthEngine';
import { ArrowRight, ChevronDown } from 'lucide-react';

interface DashboardProps {
  lessons: Lesson[];
  practiceItems: PracticeItem[];
  userStats: UserStats;
  sessionHistory?: SessionResult[];
  onStartLesson: (lesson: Lesson) => void;
  onStartPractice: (practice: PracticeItem) => void;
  onOpenNourishmentDrills: () => void;
  setActiveTab: (tab: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  lessons,
  practiceItems,
  userStats,
  sessionHistory = [],
  onStartLesson,
  onStartPractice,
  onOpenNourishmentDrills,
  setActiveTab,
}) => {
  const growthProfile = calculateGrowthProfile(userStats, sessionHistory);
  const [openFaq, setOpenFaq] = useState<number>(0);

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
      {/* Open Editorial Hero */}
      <section className="space-y-6 max-w-2xl">
        <div className="space-y-3">
          <p className="text-xs font-mono uppercase tracking-widest text-emerald-400">
            Touch Typing Studio
          </p>
          <h1 className="text-3xl sm:text-5xl font-semibold text-zinc-50 tracking-[-0.03em] leading-[1.1] text-balance">
            Master touch typing with 3D hand guidance.
          </h1>
          <p className="text-sm sm:text-base text-zinc-400 leading-relaxed max-w-xl">
            {lessons.length} structured lessons, themed speed tests, and adaptive weak-key drills. Free and local-first.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-4 pt-1">
          {nextLesson && (
            <button
              type="button"
              onClick={() => onStartLesson(nextLesson)}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-semibold text-sm transition-colors whitespace-nowrap"
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
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-zinc-300 hover:text-white border border-white/[0.1] hover:border-white/[0.2] font-medium text-sm transition-colors whitespace-nowrap"
          >
            <span>All lessons</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </a>
        </div>
      </section>

      {/* Flat Hairline Telemetry Strip */}
      <section aria-label="Your typing progress" className="border-y border-white/[0.08] py-6">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 sm:gap-8">
          <div>
            <p className="text-2xl sm:text-3xl font-semibold text-zinc-50 font-mono tabular-nums tracking-tight">
              {userStats.avgWpm}
            </p>
            <p className="text-xs text-zinc-500 mt-1">Average WPM</p>
          </div>

          <div>
            <p className="text-2xl sm:text-3xl font-semibold text-zinc-50 font-mono tabular-nums tracking-tight">
              {userStats.avgAccuracy}%
            </p>
            <p className="text-xs text-zinc-500 mt-1">Accuracy</p>
          </div>

          <div>
            <p className="text-2xl sm:text-3xl font-semibold text-zinc-50 font-mono tabular-nums tracking-tight">
              {growthProfile.totalBlooms}
              <span className="text-sm font-normal text-zinc-500">/{lessons.length}</span>
            </p>
            <p className="text-xs text-zinc-500 mt-1">Lessons done ({completionPct}%)</p>
          </div>

          <div>
            <p className="text-2xl sm:text-3xl font-semibold text-zinc-50 font-mono tabular-nums tracking-tight">
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
            <h2 className="text-base font-semibold text-zinc-100 tracking-tight">
              Recommended Lessons
            </h2>

            <a
              href="/lessons"
              onClick={(e) => {
                if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
                e.preventDefault();
                setActiveTab('lessons');
              }}
              className="text-xs font-medium text-zinc-400 hover:text-zinc-100 flex items-center gap-1 whitespace-nowrap transition-colors"
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

              return (
                <button
                  key={lesson.id}
                  type="button"
                  onClick={() => onStartLesson(lesson)}
                  className={`group text-left p-5 rounded-xl border transition-colors duration-150 flex flex-col justify-between gap-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 ${
                    isCompleted
                      ? 'bg-[#111113] border-emerald-500/30 hover:border-emerald-500/50'
                      : 'bg-[#111113] hover:bg-zinc-900 border-white/[0.08] hover:border-white/[0.16]'
                  }`}
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between gap-2 text-[11px]">
                      <span
                        className={`font-medium ${
                          isCompleted ? 'text-emerald-400' : 'text-zinc-500'
                        }`}
                      >
                        {isCompleted ? 'Completed' : `Module ${lesson.module}`}
                      </span>
                      <span className="font-mono text-zinc-500">
                        {lesson.targetKeys.slice(0, 4).join(' ').toUpperCase()}
                      </span>
                    </div>
                    <h3 className="text-sm font-medium text-zinc-100 group-hover:text-white transition-colors">
                      {lesson.title}
                    </h3>
                  </div>

                  <div className="pt-3 border-t border-white/[0.06] flex items-center justify-between text-xs text-zinc-400 group-hover:text-zinc-200">
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

        {/* Right Col: Weak-Key Practice */}
        <div className="space-y-5">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-base font-semibold text-zinc-100 tracking-tight">
              Weak-key practice
            </h2>

            <a
              href="/drills"
              onClick={(e) => {
                if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
                e.preventDefault();
                onOpenNourishmentDrills();
              }}
              className="text-xs font-medium text-zinc-400 hover:text-zinc-100 flex items-center gap-1 whitespace-nowrap shrink-0 transition-colors"
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
                className="w-full text-left bg-[#111113] hover:bg-zinc-900 border border-white/[0.08] hover:border-white/[0.16] p-5 rounded-xl transition-colors duration-150 flex items-center justify-between gap-3 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
              >
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-1.5 text-[11px] text-zinc-500">
                    <span className="capitalize">{prac.type.replace('_', ' ')}</span>
                    <span aria-hidden="true">·</span>
                    <span className="font-mono tabular-nums">{prac.durationMinutes} min</span>
                  </div>
                  <h3 className="text-sm font-medium text-zinc-100 group-hover:text-white transition-colors truncate">
                    {prac.title}
                  </h3>
                </div>
                <ArrowRight className="w-4 h-4 text-zinc-500 group-hover:text-zinc-200 group-hover:translate-x-0.5 transition-all shrink-0" />
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Curriculum Overview & Interactive FAQ */}
      <section
        aria-labelledby="typecrest-guide-heading"
        className="grid grid-cols-1 lg:grid-cols-12 gap-10 pt-10 border-t border-white/[0.08]"
      >
        <div className="lg:col-span-6 space-y-4">
          <h2 id="typecrest-guide-heading" className="text-base font-semibold text-zinc-100 tracking-tight">
            Curriculum
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-white/[0.08] text-zinc-500 uppercase tracking-wider text-[10px]">
                  <th className="py-2.5 pr-3 font-medium">Track</th>
                  <th className="py-2.5 px-3 font-medium">Focus Areas</th>
                  <th className="py-2.5 pl-3 font-medium text-right">Pass Target</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.06] text-zinc-300">
                <tr>
                  <td className="py-3 pr-3 font-medium text-zinc-100">Beginner</td>
                  <td className="py-3 px-3 text-zinc-400">F &amp; J anchors, home row, top &amp; bottom reaches</td>
                  <td className="py-3 pl-3 font-mono text-right text-zinc-300">90%+ Acc</td>
                </tr>
                <tr>
                  <td className="py-3 pr-3 font-medium text-zinc-100">Intermediate</td>
                  <td className="py-3 px-3 text-zinc-400">Digraph rhythm, Shift capitals, punctuation</td>
                  <td className="py-3 pl-3 font-mono text-right text-zinc-300">92%+ Acc</td>
                </tr>
                <tr>
                  <td className="py-3 pr-3 font-medium text-zinc-100">Advanced</td>
                  <td className="py-3 px-3 text-zinc-400">Code syntax, numbers, endurance passages</td>
                  <td className="py-3 pl-3 font-mono text-right text-zinc-300">95%+ Acc</td>
                </tr>
                <tr>
                  <td className="py-3 pr-3 font-medium text-emerald-400">Certification</td>
                  <td className="py-3 px-3 text-zinc-400">Timed speed tests &amp; PDF/PNG awards</td>
                  <td className="py-3 pl-3 font-mono text-right text-emerald-400">35+ WPM · 95%</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div className="lg:col-span-6 space-y-4">
          <h2 className="text-base font-semibold text-zinc-100 tracking-tight">
            Frequently Asked Questions
          </h2>
          <div className="divide-y divide-white/[0.06] border-t border-white/[0.06]">
            {faqItems.map((item, idx) => {
              const isOpen = openFaq === idx;
              return (
                <div key={item.q} className="py-3">
                  <button
                    type="button"
                    onClick={() => setOpenFaq(isOpen ? -1 : idx)}
                    aria-expanded={isOpen}
                    className="w-full flex items-center justify-between gap-3 text-left text-xs font-medium text-zinc-200 hover:text-white transition-colors"
                  >
                    <span>{item.q}</span>
                    <ChevronDown
                      className={`w-4 h-4 text-zinc-500 shrink-0 transition-transform duration-200 ${
                        isOpen ? 'rotate-180 text-zinc-200' : ''
                      }`}
                    />
                  </button>
                  {isOpen && (
                    <p className="text-xs text-zinc-400 leading-relaxed pt-2 pr-6">
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
