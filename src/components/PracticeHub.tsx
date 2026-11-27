import React, { useMemo } from 'react';
import { PracticeItem, GeneratedRemediationLesson, HotspotSeverity } from '../types';
import { generateRuleBasedLessons, formatHotspotKeyLabel } from '../engines/remediationEngine';
import {
  ArrowRight,
  Clock,
  AlertTriangle,
  AlertCircle,
  Info,
  CheckCircle2,
  Layers,
  Shuffle,
} from 'lucide-react';

interface PracticeHubProps {
  practiceItems: PracticeItem[];
  weakKeys: Record<string, number>;
  onStartPractice: (practice: PracticeItem) => void;
  onStartRemediationLesson: (lesson: GeneratedRemediationLesson) => void;
}

function getSeverityDisplay(severity: HotspotSeverity) {
  if (severity === 'critical') {
    return { label: 'High Priority', icon: AlertTriangle, cls: 'text-rose-400' };
  }
  if (severity === 'moderate') {
    return { label: 'Moderate', icon: AlertCircle, cls: 'text-amber-400' };
  }
  return { label: 'Watch', icon: Info, cls: 'text-sky-400' };
}

export const PracticeHub: React.FC<PracticeHubProps> = ({
  practiceItems,
  weakKeys,
  onStartPractice,
  onStartRemediationLesson,
}) => {
  const ruleLessons = useMemo(() => generateRuleBasedLessons(weakKeys), [weakKeys]);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10 animate-fadeIn">
      <div className="pb-6 border-b border-zinc-200 dark:border-white/[0.08]">
        <p className="text-xs font-mono uppercase tracking-widest text-emerald-600 dark:text-emerald-400 mb-1.5">
          Targeted Drills
        </p>
        <h1 className="text-2xl sm:text-3xl font-semibold text-zinc-950 dark:text-zinc-50 tracking-tight">Practice</h1>
      </div>

      {/* Featured Section: Rule-Based Tricky Key Lessons */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-sky-600 dark:text-sky-400" />
          <h2 className="text-xl font-bold text-zinc-950 dark:text-white">Weak-key recovery</h2>
        </div>

        {ruleLessons.length === 0 ? (
          <div className="bg-white dark:bg-[#111113] border border-zinc-200 dark:border-white/[0.08] rounded-xl p-6 shadow-sm dark:shadow-none">
            <div className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="w-4 h-4" />
              <span>All clear — no tricky keys detected</span>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {ruleLessons.map((lesson) => {
              const sev = getSeverityDisplay(lesson.severity);
              const SevIcon = sev.icon;
              return (
                <div
                  key={lesson.id}
                  onClick={() => onStartRemediationLesson(lesson)}
                  className="group bg-white hover:bg-zinc-50 dark:bg-[#111113] dark:hover:bg-zinc-900 border border-zinc-200 hover:border-sky-500/50 dark:border-white/[0.08] p-6 rounded-xl shadow-sm dark:shadow-xl transition-all duration-200 cursor-pointer flex flex-col justify-between gap-5"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-3 text-xs">
                      <span className="font-bold uppercase tracking-wider text-sky-600 dark:text-sky-400">
                        {lesson.ruleName}
                      </span>
                      <span className={`inline-flex items-center gap-1 font-semibold ${sev.cls}`}>
                        <SevIcon className="w-3.5 h-3.5" />
                        <span>{sev.label}</span>
                      </span>
                    </div>

                    <h3 className="text-lg font-bold text-zinc-900 group-hover:text-sky-600 dark:text-white dark:group-hover:text-sky-300 transition-colors">
                      {lesson.title}
                    </h3>

                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      {lesson.remediationTargetKeys.map((k) => (
                        <span
                          key={k}
                          className="px-2.5 py-1 rounded-lg bg-zinc-100 border border-zinc-200 text-zinc-800 dark:bg-[#09090B] dark:border-slate-700 font-mono text-xs font-bold dark:text-slate-100"
                        >
                          {formatHotspotKeyLabel(k)}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="pt-4 border-t border-zinc-100 dark:border-white/[0.08] flex items-center justify-between gap-3">
                    <span className="text-xs font-medium text-zinc-500 dark:text-slate-400 tabular-nums">
                      Pass target: {lesson.completionAccuracy}% accuracy
                    </span>
                    <span className="inline-flex items-center gap-1.5 text-xs font-bold text-sky-600 dark:text-sky-400 group-hover:translate-x-1 transition-transform whitespace-nowrap">
                      <span>Start 3-Stage Lesson</span>
                      <ArrowRight className="w-4 h-4" />
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Standard Practice Drills */}
      <section className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-xl font-bold text-zinc-950 dark:text-white">Standard Practice Drills</h2>
          {practiceItems.length > 1 && (
            <button
              type="button"
              onClick={() => {
                const pick = practiceItems[Math.floor(Math.random() * practiceItems.length)];
                if (pick) onStartPractice(pick);
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-purple-50 hover:bg-purple-100 border border-purple-200 text-purple-700 dark:bg-purple-600/20 dark:hover:bg-purple-600/30 dark:border-purple-500/40 text-xs font-semibold dark:text-purple-300 transition-colors whitespace-nowrap"
            >
              <Shuffle className="w-3.5 h-3.5 shrink-0" />
              <span>Random drill</span>
            </button>
          )}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {practiceItems.map((prac) => (
            <div
              key={prac.id}
              onClick={() => onStartPractice(prac)}
              className="group bg-white hover:bg-zinc-50 border border-zinc-200 hover:border-zinc-300 dark:bg-[#111113] dark:hover:bg-zinc-900 dark:border-white/[0.08] dark:hover:border-white/[0.16] p-5 rounded-xl shadow-sm dark:shadow-none transition-colors duration-150 cursor-pointer flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-2.5 text-[11px]">
                  <span className="font-medium capitalize text-zinc-500">
                    {prac.type.replace('_', ' ')}
                  </span>
                  <div className="flex items-center gap-1 text-zinc-500 font-mono tabular-nums">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{prac.durationMinutes} min</span>
                  </div>
                </div>
                <h3 className="text-base font-medium text-zinc-900 group-hover:text-zinc-950 dark:text-zinc-100 dark:group-hover:text-white transition-colors">
                  {prac.title}
                </h3>
              </div>

              <div className="mt-5 pt-3.5 border-t border-zinc-100 dark:border-white/[0.06] flex items-center justify-between text-xs">
                <span className="text-zinc-500 capitalize">
                  {prac.guidanceConfig.guidanceLevel === 'none' ? 'No hints' : `${prac.guidanceConfig.guidanceLevel} hints`}
                </span>
                <div className="flex items-center gap-1 font-medium text-zinc-500 group-hover:text-zinc-900 dark:text-zinc-400 dark:group-hover:text-zinc-100 transition-colors whitespace-nowrap">
                  <span>Start</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};
