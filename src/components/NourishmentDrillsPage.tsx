import React, { useMemo, useState } from 'react';
import {
  PracticeItem,
  TestItem,
  GeneratedRemediationLesson,
  HotspotSeverity,
} from '../types';
import {
  generateRuleBasedLessons,
  formatHotspotKeyLabel,
} from '../engines/remediationEngine';
import {
  ArrowLeft,
  ArrowRight,
  Award,
  Clock,
  Dumbbell,
  AlertTriangle,
  AlertCircle,
  Info,
  Layers,
} from 'lucide-react';

interface NourishmentDrillsPageProps {
  practiceItems: PracticeItem[];
  testItems: TestItem[];
  weakKeys: Record<string, number>;
  onStartPractice: (practice: PracticeItem) => void;
  onStartTest: (test: TestItem) => void;
  onStartRemediationLesson: (lesson: GeneratedRemediationLesson) => void;
  onBack: () => void;
}

type DrillFilter = 'all' | 'practice' | 'exams' | 'recovery';

function getSeverityMeta(severity: HotspotSeverity) {
  if (severity === 'critical') {
    return { label: 'High Priority', icon: AlertTriangle, cls: 'text-rose-400' };
  }
  if (severity === 'moderate') {
    return { label: 'Moderate', icon: AlertCircle, cls: 'text-amber-400' };
  }
  return { label: 'Watch', icon: Info, cls: 'text-sky-400' };
}

export const NourishmentDrillsPage: React.FC<NourishmentDrillsPageProps> = ({
  practiceItems,
  testItems,
  weakKeys,
  onStartPractice,
  onStartTest,
  onStartRemediationLesson,
  onBack,
}) => {
  const [filter, setFilter] = useState<DrillFilter>('all');
  const recoveryLessons = useMemo(
    () => generateRuleBasedLessons(weakKeys),
    [weakKeys]
  );

  const showPractice = filter === 'all' || filter === 'practice';
  const showExams = filter === 'all' || filter === 'exams';
  const showRecovery =
    recoveryLessons.length > 0 && (filter === 'all' || filter === 'recovery');

  const filterTabs: Array<{ id: DrillFilter; label: string; count: number }> = [
    {
      id: 'all',
      label: 'All',
      count: practiceItems.length + testItems.length + recoveryLessons.length,
    },
    { id: 'practice', label: 'Practice Drills', count: practiceItems.length },
    { id: 'exams', label: 'Mastery Exams', count: testItems.length },
    ...(recoveryLessons.length > 0
      ? [
          {
            id: 'recovery' as const,
            label: 'Recovery',
            count: recoveryLessons.length,
          },
        ]
      : []),
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fadeIn">
      {/* Top Bar: Back + Title + Filter Tabs */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-white/[0.08]">
        <div className="space-y-3">
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-white transition-colors whitespace-nowrap"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Dashboard</span>
          </button>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center text-purple-400 shrink-0">
              <Dumbbell className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                Practice drills
              </h1>
            </div>
          </div>
        </div>

        {/* Interactive Category Filter */}
        <div
          role="tablist"
          aria-label="Filter nourishment drills"
          className="flex flex-wrap items-center gap-1 p-1 rounded-xl bg-[#111113] border border-white/[0.08] self-start md:self-end"
        >
          {filterTabs.map((tab) => {
            const isActive = filter === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => setFilter(tab.id)}
                className={`px-3.5 py-2 rounded-lg text-xs font-semibold whitespace-nowrap shrink-0 transition-colors ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white hover:bg-zinc-900'
                }`}
              >
                <span>{tab.label}</span>
                <span className="ml-1.5 opacity-75 font-mono tabular-nums">
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Practice Drills Section */}
      {showPractice && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-white">Practice Drills</h2>
            <span className="text-xs text-slate-400 font-mono tabular-nums">
              {practiceItems.length} drills
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {practiceItems.map((prac) => (
              <button
                key={prac.id}
                type="button"
                onClick={() => onStartPractice(prac)}
                className="group text-left bg-[#111113] hover:bg-zinc-900 border border-white/[0.08] hover:border-purple-500/50 p-6 rounded-xl transition-all duration-150 flex flex-col justify-between gap-5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-400"
              >
                <div className="space-y-2.5">
                  <div className="flex items-center gap-2 text-xs text-slate-400">
                    <span className="font-semibold text-purple-400 capitalize">
                      {prac.type.replace('_', ' ')} Drill
                    </span>
                    <span aria-hidden="true">·</span>
                    <span className="inline-flex items-center gap-1 font-mono tabular-nums">
                      <Clock className="w-3.5 h-3.5" />
                      {prac.durationMinutes} min
                    </span>
                    <span aria-hidden="true">·</span>
                    <span className="font-mono tabular-nums">+35 XP</span>
                  </div>

                  <h3 className="text-lg font-bold text-white group-hover:text-purple-300 transition-colors">
                    {prac.title}
                  </h3>
                </div>

                <div className="pt-4 border-t border-white/[0.08] flex items-center justify-between text-xs font-semibold text-purple-400">
                  <span>Start Drill</span>
                  <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
                </div>
              </button>
            ))}
          </div>
        </section>
      )}

      {/* Mastery Exams Section */}
      {showExams && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-white">Mastery Exams</h2>
            <span className="text-xs text-slate-400 font-mono tabular-nums">
              {testItems.length} exams
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {testItems.map((test) => (
              <button
                key={test.id}
                type="button"
                onClick={() => onStartTest(test)}
                className="group text-left bg-[#111113] hover:bg-zinc-900 border border-white/[0.08] hover:border-amber-500/50 p-6 rounded-xl transition-all duration-150 flex flex-col justify-between gap-5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
              >
                <div className="space-y-2.5">
                  <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
                    <span className="inline-flex items-center gap-1 font-semibold text-amber-400">
                      <Award className="w-3.5 h-3.5" />
                      Mastery Exam
                    </span>
                    <span aria-hidden="true">·</span>
                    <span className="font-mono tabular-nums">
                      Target {test.passWpm} WPM
                    </span>
                    <span aria-hidden="true">·</span>
                    <span className="font-mono tabular-nums">
                      {test.passAccuracy}% Acc
                    </span>
                    <span aria-hidden="true">·</span>
                    <span className="font-mono tabular-nums">+75 XP</span>
                  </div>

                  <h3 className="text-lg font-bold text-white group-hover:text-amber-300 transition-colors">
                    {test.title}
                  </h3>
                </div>

                <div className="pt-4 border-t border-white/[0.08] flex items-center justify-between text-xs font-semibold text-amber-400">
                  <span>Start Exam</span>
                  <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
                </div>
              </button>
            ))}
          </div>
        </section>
      )}

      {/* Tricky Key Recovery Section (only rendered when hotspots exist) */}
      {showRecovery && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-rose-400" />
              <h2 className="text-lg font-bold text-white">
                Tricky Key Recovery
              </h2>
            </div>
            <span className="text-xs text-slate-400 font-mono tabular-nums">
              {recoveryLessons.length} active
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {recoveryLessons.map((lesson) => {
              const sev = getSeverityMeta(lesson.severity);
              const SevIcon = sev.icon;
              return (
                <button
                  key={lesson.id}
                  type="button"
                  onClick={() => onStartRemediationLesson(lesson)}
                  className="group text-left bg-[#111113] hover:bg-zinc-900 border border-white/[0.08] hover:border-rose-500/50 p-6 rounded-xl transition-all duration-150 flex flex-col justify-between gap-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-2 text-xs">
                      <span className="font-semibold text-rose-400">
                        {lesson.ruleName}
                      </span>
                      <span
                        className={`inline-flex items-center gap-1 font-semibold ${sev.cls}`}
                      >
                        <SevIcon className="w-3.5 h-3.5" />
                        <span>{sev.label}</span>
                      </span>
                    </div>

                    <h3 className="text-lg font-bold text-white group-hover:text-rose-300 transition-colors">
                      {lesson.title}
                    </h3>

                    <div className="flex flex-wrap items-center gap-1.5">
                      {lesson.remediationTargetKeys.map((k) => (
                        <span
                          key={k}
                          className="px-2 py-0.5 rounded bg-[#09090B] border border-slate-700 font-mono text-xs font-bold text-slate-100"
                        >
                          {formatHotspotKeyLabel(k)}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="pt-4 border-t border-white/[0.08] flex items-center justify-between text-xs font-semibold text-rose-400">
                    <span className="font-mono tabular-nums text-slate-400">
                      Pass target: {lesson.completionAccuracy}%
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <span>Start 3-Stage Recovery</span>
                      <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
};
