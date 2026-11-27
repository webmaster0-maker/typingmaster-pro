import React from 'react';
import { Lesson, SessionResult } from '../types';
import { getLessonCompletionMeta } from '../utils/growthEngine';
import { ArrowRight } from 'lucide-react';

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

  return (
    <button
      type="button"
      onClick={() => onStartLesson(lesson)}
      className={`group text-left p-5 rounded-xl border transition-colors duration-150 flex flex-col justify-between gap-4 shadow-sm dark:shadow-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 ${
        isCompleted
          ? 'bg-white border-emerald-500/40 hover:border-emerald-500/60 dark:bg-[#111113] dark:border-emerald-500/30 dark:hover:border-emerald-500/50'
          : isNextToGrow
          ? 'bg-white hover:bg-zinc-50 border-zinc-300 hover:border-zinc-400 dark:bg-[#111113] dark:hover:bg-zinc-900 dark:border-white/[0.2] dark:hover:border-white/[0.3]'
          : 'bg-white hover:bg-zinc-50 border-zinc-200 hover:border-zinc-300 dark:bg-[#111113] dark:hover:bg-zinc-900 dark:border-white/[0.08] dark:hover:border-white/[0.16]'
      }`}
    >
      <div className="space-y-3 w-full">
        {/* Top Status & Lesson Number */}
        <div className="flex items-center justify-between gap-2 text-[11px]">
          <span
            className={`font-medium ${
              isCompleted || isNextToGrow
                ? 'text-emerald-600 dark:text-emerald-400'
                : lesson.isTest
                ? 'text-amber-600 dark:text-amber-400'
                : 'text-zinc-500'
            }`}
          >
            {isCompleted
              ? 'Completed'
              : isNextToGrow
              ? 'Next up'
              : lesson.isTest
              ? 'Checkpoint'
              : `Lesson ${String(index + 1).padStart(2, '0')}`}
          </span>

          <span className="font-mono text-zinc-500 tabular-nums">
            {lesson.completionAccuracy}% target
          </span>
        </div>

        {/* Title */}
        <h4 className="text-sm font-medium text-zinc-900 group-hover:text-zinc-950 dark:text-zinc-100 dark:group-hover:text-white transition-colors leading-snug">
          {lesson.title}
        </h4>

        {/* Target Keys Keycaps */}
        <div className="flex flex-wrap items-center gap-1">
          {lesson.targetKeys.slice(0, 6).map((k, i) => (
            <kbd
              key={i}
              className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded bg-zinc-100 border border-zinc-200 text-zinc-700 dark:bg-zinc-950 dark:border-white/[0.1] text-[10px] font-mono dark:text-zinc-400 uppercase"
            >
              {k === ' ' ? 'SPC' : k}
            </kbd>
          ))}
          {lesson.targetKeys.length > 6 && (
            <span className="text-[10px] font-mono text-zinc-500 pl-0.5">
              +{lesson.targetKeys.length - 6}
            </span>
          )}
        </div>
      </div>

      {/* Card Footer */}
      <div className="w-full pt-3 border-t border-zinc-100 dark:border-white/[0.06] flex items-center justify-between text-xs">
        {isCompleted ? (
          <span className="font-mono tabular-nums text-emerald-600 dark:text-emerald-400">
            {meta.bestWpm} WPM · {meta.bestAccuracy}%
          </span>
        ) : (
          <span className="text-zinc-500 font-mono tabular-nums">+50 XP</span>
        )}

        <span className="inline-flex items-center gap-1 font-medium text-zinc-500 group-hover:text-zinc-900 dark:text-zinc-400 dark:group-hover:text-zinc-100 transition-colors">
          <span>{isCompleted ? 'Practice' : 'Start'}</span>
          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
        </span>
      </div>
    </button>
  );
};
