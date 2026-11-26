import React, { useState } from 'react';
import { Lesson, PracticeItem, UserStats, SessionResult } from '../types';
import { GrowthPlantAvatar } from './GrowthPlantAvatar';
import { calculateGrowthProfile, getLessonCompletionMeta } from '../utils/growthEngine';
import {
  Dumbbell,
  ArrowRight,
  TrendingUp,
  Target,
  Sprout,
  ChevronDown,
} from 'lucide-react';

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

  // Find first unbloomed lesson as the next recommended lesson to nourish
  const nextLesson =
    lessons.find((l) => {
      const meta = getLessonCompletionMeta(l.id, l.title, sessionHistory);
      return !meta.isCompleted;
    }) || lessons[0];

  const featuredDrills = practiceItems.slice(0, 2);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fadeIn">
      {/* Top Banner with Growth Avatar */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        <div className="lg:col-span-5 flex">
          <GrowthPlantAvatar growthProfile={growthProfile} />
        </div>

        <div className="lg:col-span-7 relative overflow-hidden bg-gradient-to-r from-indigo-950/70 via-slate-900 to-slate-900 border border-indigo-500/30 p-6 sm:p-8 rounded-3xl shadow-2xl flex flex-col justify-between gap-6">
          <div className="space-y-3">
            <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight text-balance max-w-xl">
              {lessons.length} lessons. 3D hand guidance. Free.
            </h1>
          </div>

          <div className="flex flex-wrap gap-3">
            {nextLesson && (
              <button
                type="button"
                onClick={() => onStartLesson(nextLesson)}
                className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs sm:text-sm shadow-lg shadow-emerald-600/30 transition-all whitespace-nowrap"
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
              className="flex items-center gap-2 px-5 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs sm:text-sm border border-slate-700 transition-colors whitespace-nowrap"
            >
              <span>All lessons →</span>
            </a>
          </div>
        </div>
      </div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-slate-900/80 border border-slate-800 p-5 rounded-2xl flex flex-col items-center justify-center text-center">
          <span className="text-2xl font-black text-white font-mono tabular-nums">
            {userStats.avgWpm}
          </span>
          <span className="text-xs text-slate-400 font-medium mt-1">
            Average WPM
          </span>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 p-5 rounded-2xl flex flex-col items-center justify-center text-center">
          <span className="text-2xl font-black text-white font-mono tabular-nums">
            {userStats.avgAccuracy}%
          </span>
          <span className="text-xs text-slate-400 font-medium mt-1">
            Accuracy
          </span>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 p-5 rounded-2xl flex flex-col items-center justify-center text-center">
          <span className="text-2xl font-black text-white font-mono tabular-nums">
            {growthProfile.totalBlooms}
          </span>
          <span className="text-xs text-slate-400 font-medium mt-1">
            Lessons done
          </span>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 p-5 rounded-2xl flex flex-col items-center justify-center text-center">
          <span className="text-2xl font-black text-white font-mono tabular-nums">
            {userStats.xp}
          </span>
          <span className="text-xs text-slate-400 font-medium mt-1 tabular-nums">
            XP
          </span>
        </div>
      </div>

      {/* Main Two-Column Launch Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Left 2 Cols: Recommended Lessons */}
        <div className="lg:col-span-2 space-y-5">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-bold text-white">Recommended Lessons</h2>
            </div>

            <a
              href="/lessons"
              onClick={(e) => {
                if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
                e.preventDefault();
                setActiveTab('lessons');
              }}
              className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 whitespace-nowrap transition-colors"
            >
              <span>All lessons</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </a>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                  className={`group text-left p-5 rounded-2xl border transition-all duration-150 flex flex-col justify-between gap-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 ${
                    isCompleted
                      ? 'bg-slate-900/90 border-emerald-500/40 hover:border-emerald-400'
                      : 'bg-slate-900/80 hover:bg-slate-800/80 border-slate-800 hover:border-indigo-500/50'
                  }`}
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2 text-xs">
                      <span
                        className={`font-semibold ${
                          isCompleted ? 'text-emerald-400' : 'text-indigo-400'
                        }`}
                      >
                        {isCompleted ? 'Bloomed' : `Module ${lesson.module}`}
                      </span>
                      <span className="font-mono text-slate-400">
                        {lesson.targetKeys.slice(0, 4).join(', ').toUpperCase()}
                      </span>
                    </div>
                    <h3 className="text-base font-bold text-white group-hover:text-emerald-300 transition-colors">
                      {lesson.title}
                    </h3>
                  </div>

                  <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs font-semibold text-emerald-400">
                    <span className="tabular-nums">
                      {isCompleted ? `Best: ${meta.bestWpm} WPM` : 'Start Lesson'}
                    </span>
                    <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Col: Nourishment Drills (Preview of 2 Practice Drills + Dedicated Page Trigger) */}
        <div className="space-y-5">
          <div className="flex items-center justify-between gap-3">
            <a
              href="/drills"
              onClick={(e) => {
                if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
                e.preventDefault();
                onOpenNourishmentDrills();
              }}
              aria-label="Open Nourishment Drills page"
              className="group flex items-center gap-3 text-left rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-400"
            >
              <span className="w-9 h-9 rounded-xl bg-purple-600/20 group-hover:bg-purple-600 border border-purple-500/35 flex items-center justify-center text-purple-400 group-hover:text-white transition-colors shrink-0">
                <Dumbbell className="w-5 h-5" />
              </span>
              <h2 className="text-xl font-bold text-white group-hover:text-purple-300 transition-colors">
                Weak-key practice
              </h2>
            </a>

            <a
              href="/drills"
              onClick={(e) => {
                if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
                e.preventDefault();
                onOpenNourishmentDrills();
              }}
              className="text-xs font-semibold text-purple-400 hover:text-purple-300 flex items-center gap-1 whitespace-nowrap shrink-0 transition-colors"
            >
              <span>All Drills</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </a>
          </div>

          <div className="space-y-4">
            {featuredDrills.map((prac) => (
              <button
                key={prac.id}
                type="button"
                onClick={() => onStartPractice(prac)}
                className="w-full text-left bg-slate-900/80 hover:bg-slate-800/80 border border-slate-800 hover:border-purple-500/50 p-5 rounded-2xl transition-all duration-150 flex items-center justify-between gap-3 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-400"
              >
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-1.5 text-xs text-slate-400">
                    <span className="font-semibold text-purple-400 capitalize">
                      {prac.type.replace('_', ' ')} Drill
                    </span>
                    <span aria-hidden="true">·</span>
                    <span className="font-mono tabular-nums">
                      {prac.durationMinutes} min
                    </span>
                    <span aria-hidden="true">·</span>
                    <span className="font-mono tabular-nums">+35 XP</span>
                  </div>
                  <h3 className="text-base font-bold text-white group-hover:text-purple-300 transition-colors truncate">
                    {prac.title}
                  </h3>
                </div>
                <span className="w-8 h-8 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 group-hover:bg-purple-600 group-hover:text-white transition-colors shrink-0">
                  <ArrowRight className="w-4 h-4" />
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* GEO / AI-Search Ready Structured Overview & FAQ */}
      <section
        aria-labelledby="typecrest-guide-heading"
        className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-4 border-t border-slate-800/80"
      >
        <div className="lg:col-span-6 bg-slate-900/75 border border-slate-800 rounded-2xl p-6 space-y-4">
          <h2 id="typecrest-guide-heading" className="text-lg font-bold text-white">
            Curriculum
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 uppercase tracking-wider text-[10px]">
                  <th className="py-2 pr-3">Track</th>
                  <th className="py-2 px-3">Focus Areas</th>
                  <th className="py-2 pl-3">Pass Target</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/70 text-slate-300">
                <tr>
                  <td className="py-2.5 pr-3 font-semibold text-emerald-400">Beginner</td>
                  <td className="py-2.5 px-3">F &amp; J anchors, home row, top &amp; bottom reaches</td>
                  <td className="py-2.5 pl-3 font-mono">90%+ Accuracy</td>
                </tr>
                <tr>
                  <td className="py-2.5 pr-3 font-semibold text-amber-400">Intermediate</td>
                  <td className="py-2.5 px-3">Digraph rhythm, Shift capitals, punctuation</td>
                  <td className="py-2.5 pl-3 font-mono">92%+ Accuracy</td>
                </tr>
                <tr>
                  <td className="py-2.5 pr-3 font-semibold text-rose-400">Advanced</td>
                  <td className="py-2.5 px-3">Code syntax, numbers, endurance passages</td>
                  <td className="py-2.5 pl-3 font-mono">95%+ Accuracy</td>
                </tr>
                <tr>
                  <td className="py-2.5 pr-3 font-semibold text-sky-400">Certification</td>
                  <td className="py-2.5 px-3">Timed speed tests &amp; PDF/PNG awards</td>
                  <td className="py-2.5 pl-3 font-mono">35+ WPM · 95%</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div className="lg:col-span-6 bg-slate-900/75 border border-slate-800 rounded-2xl p-6 space-y-4">
          <h2 className="text-lg font-bold text-white">Frequently Asked Questions</h2>
          <div className="divide-y divide-slate-800/80">
            {faqItems.map((item, idx) => {
              const isOpen = openFaq === idx;
              return (
                <div key={item.q} className="py-2.5 first:pt-0 last:pb-0">
                  <button
                    type="button"
                    onClick={() => setOpenFaq(isOpen ? -1 : idx)}
                    aria-expanded={isOpen}
                    className="w-full flex items-center justify-between gap-3 text-left text-xs font-semibold text-slate-100 hover:text-emerald-300 transition-colors py-1"
                  >
                    <span>{item.q}</span>
                    <ChevronDown
                      className={`w-4 h-4 text-slate-400 shrink-0 transition-transform duration-200 ${
                        isOpen ? 'rotate-180 text-emerald-400' : ''
                      }`}
                    />
                  </button>
                  {isOpen && (
                    <p className="text-xs text-slate-400 leading-relaxed pt-1.5 pr-6">
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
