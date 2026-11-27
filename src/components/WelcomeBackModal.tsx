import React, { useEffect } from 'react';
import { Lesson, SessionResult, UserAccount, UserStats } from '../types';
import { getLessonCompletionMeta } from '../utils/growthEngine';
import { ArrowRight, CheckCircle2, X } from 'lucide-react';

interface WelcomeBackModalProps {
  userAccount: UserAccount;
  lessons: Lesson[];
  sessionHistory: SessionResult[];
  userStats: UserStats;
  onResumeLesson: (lesson: Lesson) => void;
  onClose: () => void;
}

export const WelcomeBackModal: React.FC<WelcomeBackModalProps> = ({
  userAccount,
  lessons,
  sessionHistory,
  userStats,
  onResumeLesson,
  onClose,
}) => {
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  const completedCount = lessons.filter(
    (l) => getLessonCompletionMeta(l.id, l.title, sessionHistory).isCompleted
  ).length;
  const totalCount = lessons.length;
  const remainingCount = Math.max(0, totalCount - completedCount);
  const progressPct = Math.round((completedCount / Math.max(1, totalCount)) * 100);

  const currentLesson =
    lessons.find(
      (l) => !getLessonCompletionMeta(l.id, l.title, sessionHistory).isCompleted
    ) || lessons[0];

  const firstName = userAccount.fullName.split(' ')[0] || userAccount.fullName;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/60 dark:bg-black/75 backdrop-blur-sm p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="welcome-back-title"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-white dark:bg-[#111113] border border-zinc-200 dark:border-white/[0.1] rounded-2xl p-6 shadow-2xl space-y-5 animate-fadeIn"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <p className="text-[11px] font-mono uppercase tracking-widest text-emerald-600 dark:text-emerald-400">
              Welcome Back
            </p>
            <h2 id="welcome-back-title" className="text-xl font-semibold text-zinc-950 dark:text-zinc-50 tracking-tight">
              Good to see you, {firstName}.
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close welcome dialog"
            className="p-1.5 rounded-lg text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:text-white dark:hover:bg-white/[0.06] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Progress Summary */}
        <div className="bg-zinc-50 dark:bg-[#09090B] border border-zinc-200 dark:border-white/[0.08] rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="text-zinc-600 dark:text-zinc-400 font-medium">Course Progress</span>
            <span className="font-mono tabular-nums text-emerald-600 dark:text-emerald-400 font-semibold">
              {progressPct}%
            </span>
          </div>

          <div className="h-1.5 w-full bg-zinc-200 dark:bg-white/[0.06] rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-500 dark:bg-emerald-400 transition-all duration-300"
              style={{ width: `${progressPct}%` }}
            />
          </div>

          <div className="grid grid-cols-3 gap-2 pt-1 text-center font-mono tabular-nums">
            <div className="bg-white dark:bg-[#111113] border border-zinc-200 dark:border-white/[0.06] rounded-lg py-2 px-2">
              <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{completedCount}</div>
              <div className="text-[10px] font-sans text-zinc-500">Completed</div>
            </div>
            <div className="bg-white dark:bg-[#111113] border border-zinc-200 dark:border-white/[0.06] rounded-lg py-2 px-2">
              <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{remainingCount}</div>
              <div className="text-[10px] font-sans text-zinc-500">Remaining</div>
            </div>
            <div className="bg-white dark:bg-[#111113] border border-zinc-200 dark:border-white/[0.06] rounded-lg py-2 px-2">
              <div className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">{userStats.avgWpm} WPM</div>
              <div className="text-[10px] font-sans text-zinc-500">Avg Speed</div>
            </div>
          </div>
        </div>

        {/* Current Lesson Card */}
        {currentLesson && (
          <div className="bg-zinc-50 dark:bg-[#09090B] border border-zinc-200 dark:border-white/[0.08] rounded-xl p-4 flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[11px] font-mono text-zinc-500">
                {remainingCount === 0
                  ? 'All lessons completed'
                  : `Current · Module ${currentLesson.module}`}
              </p>
              <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100 truncate mt-0.5">
                {currentLesson.title}
              </p>
            </div>
            {remainingCount === 0 && (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-end gap-2.5 pt-1">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-zinc-100 hover:bg-zinc-200 border border-zinc-200 text-zinc-700 dark:bg-zinc-900 dark:hover:bg-zinc-800 dark:border-white/[0.08] text-xs font-medium dark:text-zinc-300 transition-colors"
          >
            Later
          </button>
          {currentLesson && (
            <button
              type="button"
              onClick={() => onResumeLesson(currentLesson)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white dark:bg-emerald-500 dark:hover:bg-emerald-400 dark:text-zinc-950 text-xs font-semibold transition-colors"
            >
              <span>{remainingCount === 0 ? 'Practice Again' : 'Resume Lesson'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
