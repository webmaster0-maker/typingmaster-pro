import React, { useMemo } from 'react';
import { UserStats, SessionResult, GeneratedRemediationLesson, HotspotSeverity } from '../types';
import {
  analyzeHotspots,
  generateRuleBasedLessons,
  generateSingleKeyLesson,
  formatHotspotKeyLabel,
} from '../engines/remediationEngine';
import {
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  Info,
  ArrowRight,
  Play,
} from 'lucide-react';

interface AnalyticsDashboardProps {
  userStats: UserStats;
  sessionHistory: SessionResult[];
  onStartRemediationLesson: (lesson: GeneratedRemediationLesson) => void;
}

function getSeverityMeta(severity: HotspotSeverity) {
  if (severity === 'critical') {
    return {
      label: 'High',
      icon: AlertTriangle,
      textClass: 'text-rose-400',
      borderClass: 'border-rose-500/30',
      keyBgClass: 'bg-rose-500/10 text-rose-300 border-rose-500/30',
    };
  }
  if (severity === 'moderate') {
    return {
      label: 'Moderate',
      icon: AlertCircle,
      textClass: 'text-amber-400',
      borderClass: 'border-amber-500/30',
      keyBgClass: 'bg-amber-500/10 text-amber-300 border-amber-500/30',
    };
  }
  return {
    label: 'Watch',
    icon: Info,
    textClass: 'text-zinc-400',
    borderClass: 'border-white/[0.08]',
    keyBgClass: 'bg-zinc-950 text-zinc-300 border-white/[0.1]',
  };
}

export const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({
  userStats,
  sessionHistory,
  onStartRemediationLesson,
}) => {
  const hotspots = useMemo(() => analyzeHotspots(userStats.weakKeys), [userStats.weakKeys]);
  const ruleLessons = useMemo(() => generateRuleBasedLessons(userStats.weakKeys), [userStats.weakKeys]);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10 animate-fadeIn">
      <div className="pb-6 border-b border-white/[0.08]">
        <p className="text-xs font-mono uppercase tracking-widest text-emerald-400 mb-1.5">
          Local Telemetry
        </p>
        <h1 className="text-2xl sm:text-3xl font-semibold text-zinc-50 tracking-tight">
          Analytics
        </h1>
      </div>

      {/* Flat Hairline Telemetry Strip */}
      <section aria-label="Performance summary" className="border-b border-white/[0.08] pb-8">
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
              {userStats.streak}
              <span className="text-sm font-normal text-zinc-500">
                {' '}{userStats.streak === 1 ? 'day' : 'days'}
              </span>
            </p>
            <p className="text-xs text-zinc-500 mt-1">Practice streak</p>
          </div>
          <div>
            <p className="text-2xl sm:text-3xl font-semibold text-zinc-50 font-mono tabular-nums tracking-tight">
              {userStats.xp}
            </p>
            <p className="text-xs text-zinc-500 mt-1">Total XP</p>
          </div>
        </div>
      </section>

      {/* Weak Keys & Mistake Hotspots */}
      <section className="space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h2 className="text-base font-semibold text-zinc-100 tracking-tight">
            Weak-key hotspots
          </h2>
          {ruleLessons.length > 0 && (
            <button
              type="button"
              onClick={() => onStartRemediationLesson(ruleLessons[0])}
              className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-zinc-950 text-xs font-semibold transition-colors whitespace-nowrap shrink-0"
            >
              <Play className="w-3.5 h-3.5" />
              <span>Practice weak keys</span>
            </button>
          )}
        </div>

        {hotspots.length === 0 ? (
          <div className="rounded-xl bg-[#111113] border border-white/[0.08] px-5 py-6 text-center">
            <div className="inline-flex items-center gap-2 text-xs font-medium text-emerald-400">
              <CheckCircle2 className="w-4 h-4" />
              <span>No active mistake hotspots</span>
            </div>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {hotspots.map((hotspot) => {
                const sev = getSeverityMeta(hotspot.severity);
                const SevIcon = sev.icon;
                return (
                  <div
                    key={hotspot.key}
                    className={`flex items-center justify-between gap-3 bg-[#111113] border ${sev.borderClass} px-4 py-3 rounded-xl`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <kbd
                        className={`w-9 h-9 shrink-0 rounded-lg font-mono font-semibold text-sm flex items-center justify-center border ${sev.keyBgClass}`}
                      >
                        {hotspot.displayKey}
                      </kbd>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 text-xs font-medium text-zinc-200 tabular-nums">
                          <span>
                            {hotspot.mistakes} {hotspot.mistakes === 1 ? 'miss' : 'misses'}
                          </span>
                          <span className="text-zinc-600">·</span>
                          <span className={`inline-flex items-center gap-1 ${sev.textClass}`}>
                            <SevIcon className="w-3 h-3 shrink-0" />
                            <span>{sev.label}</span>
                          </span>
                        </div>
                        <div className="text-[11px] text-zinc-500 truncate mt-0.5">
                          {hotspot.fingerName} · {hotspot.rowName}
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => onStartRemediationLesson(generateSingleKeyLesson(hotspot))}
                      className="px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-white/[0.08] text-xs font-medium transition-colors whitespace-nowrap shrink-0"
                    >
                      Train
                    </button>
                  </div>
                );
              })}
            </div>

            {ruleLessons.length > 0 && (
              <div className="pt-4 space-y-3">
                <p className="text-xs font-medium text-zinc-400">
                  Recovery queue ({ruleLessons.length})
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  {ruleLessons.map((lesson) => {
                    const sev = getSeverityMeta(lesson.severity);
                    const SevIcon = sev.icon;
                    return (
                      <div
                        key={lesson.id}
                        className="bg-[#111113] border border-white/[0.08] hover:border-white/[0.16] rounded-xl p-4 flex flex-col justify-between gap-4 transition-colors"
                      >
                        <div className="space-y-2">
                          <div className="flex items-center justify-between gap-2 text-[11px]">
                            <span className="font-medium text-zinc-400">
                              {lesson.ruleName}
                            </span>
                            <span className={`inline-flex items-center gap-1 font-medium ${sev.textClass}`}>
                              <SevIcon className="w-3 h-3" />
                              <span>{sev.label}</span>
                            </span>
                          </div>

                          <h3 className="text-sm font-medium text-zinc-100">{lesson.title}</h3>

                          <div className="flex flex-wrap items-center gap-1 pt-0.5">
                            {lesson.remediationTargetKeys.map((k) => (
                              <kbd
                                key={k}
                                className="px-1.5 py-0.5 rounded bg-zinc-950 border border-white/[0.1] font-mono text-[11px] text-zinc-300"
                              >
                                {formatHotspotKeyLabel(k)}
                              </kbd>
                            ))}
                          </div>
                        </div>

                        <div className="pt-3 border-t border-white/[0.06] flex items-center justify-between gap-3">
                          <span className="text-[11px] text-zinc-500 font-mono tabular-nums">
                            {lesson.completionAccuracy}% target
                          </span>
                          <button
                            type="button"
                            onClick={() => onStartRemediationLesson(lesson)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-100 text-xs font-medium transition-colors whitespace-nowrap"
                          >
                            <span>Start</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </>
        )}
      </section>

      {/* Session History Table */}
      <section className="space-y-4">
        <h2 className="text-base font-semibold text-zinc-100 tracking-tight">
          Recent sessions
        </h2>

        <div className="bg-[#111113] border border-white/[0.08] rounded-xl overflow-hidden">
          {sessionHistory.length === 0 ? (
            <div className="p-8 text-center text-xs text-zinc-500">
              No completed sessions yet
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-white/[0.08] bg-[#09090B] text-[11px] font-medium text-zinc-500 uppercase tracking-wider">
                    <th className="py-3 px-4">Activity</th>
                    <th className="py-3 px-4">Type</th>
                    <th className="py-3 px-4">Speed</th>
                    <th className="py-3 px-4">Accuracy</th>
                    <th className="py-3 px-4">Errors</th>
                    <th className="py-3 px-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.06]">
                  {sessionHistory.map((session) => (
                    <tr key={session.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="py-3 px-4 font-medium text-zinc-100">{session.title}</td>
                      <td className="py-3 px-4 capitalize text-zinc-400">{session.type}</td>
                      <td className="py-3 px-4 font-mono text-zinc-100 tabular-nums">{session.wpm} WPM</td>
                      <td className="py-3 px-4 font-mono text-emerald-400 tabular-nums">{session.accuracy}%</td>
                      <td className="py-3 px-4 font-mono text-zinc-500 tabular-nums">{session.errors}</td>
                      <td className="py-3 px-4">
                        {session.passed ? (
                          <span className="inline-flex items-center gap-1 text-emerald-400 font-medium">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Passed
                          </span>
                        ) : (
                          <span className="text-zinc-400">Completed</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};
