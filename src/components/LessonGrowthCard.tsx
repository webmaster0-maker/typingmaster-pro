import React from 'react';
import { Lesson, SessionResult } from '../types';
import { getLessonCompletionMeta } from '../utils/growthEngine';
import { Sparkles, ArrowRight, Droplets, Leaf, Award, Sprout } from 'lucide-react';

interface LessonGrowthCardProps {
  lesson: Lesson;
  index: number;
  sessionHistory: SessionResult[];
  onStartLesson: (lesson: Lesson) => void;
  isNextToGrow?: boolean;
}

export const LessonGrowthCard: React.FC<LessonGrowthCardProps> = ({
  lesson,
  index,
  sessionHistory,
  onStartLesson,
  isNextToGrow = false,
}) => {
  const meta = getLessonCompletionMeta(lesson.id, lesson.title, sessionHistory);
  const isCompleted = meta.isCompleted;

  // Determine botanical icon & theme based on lesson type & module
  const getGrowthVisual = () => {
    if (lesson.isTest) {
      return {
        icon: Award,
        stageLabel: isCompleted ? 'Mastered Blossom' : 'Growth Milestone',
        colorClass: 'amber',
        symbol: '🏆'
      };
    }
    if (lesson.module === 1) {
      return {
        icon: Sprout,
        stageLabel: isCompleted ? 'Root Anchored' : 'Seedling Plot',
        colorClass: 'emerald',
        symbol: '🌱'
      };
    }
    if (lesson.module === 2) {
      return {
        icon: Leaf,
        stageLabel: isCompleted ? 'Stem Flourished' : 'Sprouting Stem',
        colorClass: 'teal',
        symbol: '🌿'
      };
    }
    if (lesson.module === 3) {
      return {
        icon: Leaf,
        stageLabel: isCompleted ? 'Canopy Bloomed' : 'Branching Reach',
        colorClass: 'indigo',
        symbol: '🍃'
      };
    }
    return {
      icon: Sparkles,
      stageLabel: isCompleted ? 'Full Bloom' : 'Blossom Stage',
      colorClass: 'rose',
      symbol: '🌸'
    };
  };

  const visual = getGrowthVisual();

  return (
    <div
      onClick={() => onStartLesson(lesson)}
      className={`group relative overflow-hidden p-6 rounded-3xl border cursor-pointer transition-all duration-300 flex flex-col justify-between ${
        isCompleted
          ? 'bg-gradient-to-br from-slate-900/95 via-slate-900 to-emerald-950/40 border-emerald-500/50 shadow-xl shadow-emerald-950/30 hover:border-emerald-400 hover:scale-[1.02]'
          : isNextToGrow
          ? 'bg-gradient-to-br from-slate-900/95 via-slate-900 to-indigo-950/40 border-indigo-500/60 ring-2 ring-indigo-500/20 shadow-2xl hover:border-indigo-400 hover:scale-[1.02]'
          : 'bg-slate-900/70 hover:bg-slate-800/80 border-slate-800 hover:border-slate-700'
      }`}
    >
      {/* Decorative leaf water drop background badge */}
      <div className="absolute top-0 right-0 -mr-6 -mt-6 w-24 h-24 rounded-full bg-emerald-500/5 blur-xl pointer-events-none group-hover:bg-emerald-500/10 transition-colors" />

      <div>
        {/* Top Growth Status Pill & Dewdrops */}
        <div className="flex items-center justify-between gap-2 mb-4">
          <div className="flex items-center gap-1.5">
            <span
              className={`text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-1 rounded-xl border flex items-center gap-1 ${
                isCompleted
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                  : isNextToGrow
                  ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40'
                  : lesson.isTest
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                  : 'bg-slate-800 text-slate-400 border-slate-700'
              }`}
            >
              <span>{visual.symbol}</span>
              <span>{isCompleted ? 'Bloomed' : visual.stageLabel}</span>
            </span>
            
            {lesson.isTest && (
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/30">
                Test
              </span>
            )}
          </div>

          <div className="flex items-center gap-1 text-[11px] font-mono font-bold tabular-nums text-slate-400">
            <Droplets className="w-3.5 h-3.5 text-cyan-400" />
            <span className={isCompleted ? 'text-emerald-300' : 'text-slate-400'}>
              {isCompleted ? 'Earned' : '+50 XP'}
            </span>
          </div>
        </div>

        {/* Title */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono font-semibold tabular-nums text-slate-400">
            #{String(index + 1).padStart(2, '0')}
          </span>
          <h4 className="text-base sm:text-lg font-bold text-white group-hover:text-emerald-300 transition-colors">
            {lesson.title}
          </h4>
        </div>

        {/* Target Keys Tags */}
        <div className="mt-3 flex flex-wrap items-center gap-1.5">
          <span className="text-[10px] uppercase font-semibold text-slate-500">Keys:</span>
          {lesson.targetKeys.slice(0, 6).map((k, i) => (
            <span
              key={i}
              className="text-[11px] font-mono font-bold px-2 py-0.5 rounded-lg bg-slate-950/80 border border-slate-800 text-slate-300 group-hover:border-slate-700"
            >
              {k === ' ' ? 'SPACE' : k.toUpperCase()}
            </span>
          ))}
          {lesson.targetKeys.length > 6 && (
            <span className="text-[10px] font-mono text-slate-500">
              +{lesson.targetKeys.length - 6} more
            </span>
          )}
        </div>
      </div>

      {/* Card Footer: Growth Result or CTA */}
      <div className="mt-5 pt-3.5 border-t border-slate-800/80 flex items-center justify-between">
        {isCompleted ? (
          <div className="flex items-center gap-3">
            {/* 3 Leaves rating */}
            <div className="flex items-center gap-0.5" title={`${meta.leaves} of 3 Leaves Mastery`}>
              {[1, 2, 3].map(leafIdx => (
                <span
                  key={leafIdx}
                  className={`text-xs ${
                    leafIdx <= meta.leaves ? 'text-emerald-400 scale-110' : 'text-slate-700'
                  }`}
                >
                  🌿
                </span>
              ))}
            </div>
            <div className="text-[11px] font-mono tabular-nums text-emerald-400 font-bold">
              {meta.bestWpm} WPM • {meta.bestAccuracy}%
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <span className="w-2 h-2 rounded-full bg-slate-600 group-hover:bg-emerald-400 transition-colors" />
            <span className="text-[11px]">Pass: {lesson.completionAccuracy}% Accuracy</span>
          </div>
        )}

        <div className="flex items-center gap-1 text-xs font-bold text-emerald-400 group-hover:translate-x-1 transition-all">
          <span>{isCompleted ? 'Re-Nourish' : isNextToGrow ? 'Sprout Now' : 'Cultivate'}</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </div>
      </div>
    </div>
  );
};
