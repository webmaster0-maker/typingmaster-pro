import React from 'react';
import { Lesson, PracticeItem, UserStats, SessionResult } from '../types';
import { GrowthPlantAvatar } from './GrowthPlantAvatar';
import { calculateGrowthProfile, getLessonCompletionMeta } from '../utils/growthEngine';
import {
  BookOpen,
  Dumbbell,
  ArrowRight,
  TrendingUp,
  Target,
  Sprout,
  Droplets,
  Sparkles,
  Leaf,
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
          <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight text-balance max-w-xl">
            Watch Your Typing Skills Flourish
          </h1>

          <div className="flex flex-wrap gap-3">
            {nextLesson && (
              <button
                type="button"
                onClick={() => onStartLesson(nextLesson)}
                className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs sm:text-sm shadow-lg shadow-emerald-600/30 transition-all whitespace-nowrap"
              >
                <Sparkles className="w-4 h-4 text-emerald-200 shrink-0" />
                <span>Next: {nextLesson.title.split('—')[0].trim()}</span>
                <ArrowRight className="w-4 h-4 shrink-0" />
              </button>
            )}
            <button
              type="button"
              onClick={() => setActiveTab('lessons')}
              className="flex items-center gap-2 px-5 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs sm:text-sm border border-slate-700 transition-colors whitespace-nowrap"
            >
              <BookOpen className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>All Lessons</span>
            </button>
          </div>
        </div>
      </div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-slate-900/80 border border-slate-800 p-5 rounded-2xl flex flex-col items-center justify-center text-center">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/20 flex items-center justify-center text-indigo-400 mb-2">
            <TrendingUp className="w-5 h-5" />
          </div>
          <span className="text-2xl font-black text-white font-mono tabular-nums">
            {userStats.avgWpm}
          </span>
          <span className="text-xs text-slate-400 font-medium mt-1">
            Average WPM
          </span>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 p-5 rounded-2xl flex flex-col items-center justify-center text-center">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-400 mb-2">
            <Target className="w-5 h-5" />
          </div>
          <span className="text-2xl font-black text-white font-mono tabular-nums">
            {userStats.avgAccuracy}%
          </span>
          <span className="text-xs text-slate-400 font-medium mt-1">
            Accuracy
          </span>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 p-5 rounded-2xl flex flex-col items-center justify-center text-center">
          <div className="w-10 h-10 rounded-xl bg-teal-500/20 flex items-center justify-center text-teal-400 mb-2">
            <Sprout className="w-5 h-5" />
          </div>
          <span className="text-2xl font-black text-white font-mono tabular-nums">
            {growthProfile.totalBlooms}
          </span>
          <span className="text-xs text-slate-400 font-medium mt-1">
            Bloomed Lessons
          </span>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 p-5 rounded-2xl flex flex-col items-center justify-center text-center">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center text-amber-400 mb-2">
            <Droplets className="w-5 h-5" />
          </div>
          <span className="text-2xl font-black text-white font-mono tabular-nums">
            {userStats.xp}
          </span>
          <span className="text-xs text-slate-400 font-medium mt-1 tabular-nums">
            XP · {userStats.streak} {userStats.streak === 1 ? 'Day' : 'Days'} Streak
          </span>
        </div>
      </div>

      {/* Main Two-Column Launch Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Left 2 Cols: Recommended Lessons */}
        <div className="lg:col-span-2 space-y-5">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-600/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
                <Leaf className="w-5 h-5" />
              </div>
              <h2 className="text-xl font-bold text-white">Recommended Lessons</h2>
            </div>

            <button
              type="button"
              onClick={() => setActiveTab('lessons')}
              className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 whitespace-nowrap transition-colors"
            >
              <span>View All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
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
            <button
              type="button"
              onClick={onOpenNourishmentDrills}
              aria-label="Open Nourishment Drills page"
              className="group flex items-center gap-3 text-left rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-400"
            >
              <span className="w-9 h-9 rounded-xl bg-purple-600/20 group-hover:bg-purple-600 border border-purple-500/35 flex items-center justify-center text-purple-400 group-hover:text-white transition-colors shrink-0">
                <Dumbbell className="w-5 h-5" />
              </span>
              <span className="text-xl font-bold text-white group-hover:text-purple-300 transition-colors">
                Nourishment Drills
              </span>
            </button>

            <button
              type="button"
              onClick={onOpenNourishmentDrills}
              className="text-xs font-semibold text-purple-400 hover:text-purple-300 flex items-center gap-1 whitespace-nowrap shrink-0 transition-colors"
            >
              <span>View All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
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
                  <h4 className="text-base font-bold text-white group-hover:text-purple-300 transition-colors truncate">
                    {prac.title}
                  </h4>
                </div>
                <span className="w-8 h-8 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 group-hover:bg-purple-600 group-hover:text-white transition-colors shrink-0">
                  <ArrowRight className="w-4 h-4" />
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
