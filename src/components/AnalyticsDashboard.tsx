import React, { useMemo } from 'react';
import { UserStats, SessionResult, GeneratedRemediationLesson, HotspotSeverity } from '../types';
import {
  analyzeHotspots,
  generateRuleBasedLessons,
  generateSingleKeyLesson,
  formatHotspotKeyLabel,
} from '../engines/remediationEngine';
import {
  Trophy,
  Flame,
  TrendingUp,
  Target,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  Info,
  ArrowRight,
  Play,
  Layers,
} from 'lucide-react';

interface AnalyticsDashboardProps {
  userStats: UserStats;
  sessionHistory: SessionResult[];
  onStartRemediationLesson: (lesson: GeneratedRemediationLesson) => void;
}

function getSeverityMeta(severity: HotspotSeverity) {
  if (severity === 'critical') {
    return {
      label: 'High Priority',
      icon: AlertTriangle,
      textClass: 'text-rose-400',
      borderClass: 'border-rose-500/35',
      keyBgClass: 'bg-rose-500/15 text-rose-300 border-rose-500/40',
    };
  }
  if (severity === 'moderate') {
    return {
      label: 'Moderate',
      icon: AlertCircle,
      textClass: 'text-amber-400',
      borderClass: 'border-amber-500/35',
      keyBgClass: 'bg-amber-500/15 text-amber-300 border-amber-500/40',
    };
  }
  return {
    label: 'Watch',
    icon: Info,
    textClass: 'text-sky-400',
    borderClass: 'border-slate-700',
    keyBgClass: 'bg-sky-500/15 text-sky-300 border-sky-500/35',
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fadeIn">
      <div className="space-y-2">
        <h1 className="text-3xl font-extrabold text-white">Performance Analytics &amp; History</h1>
        <p className="text-sm text-slate-300 max-w-3xl">
          Review your average net WPM, typing accuracy, daily practice streak, tricky-key mistake hotspots, and completed lesson or arcade history stored locally in your browser.
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-slate-900/80 border border-slate-800 p-6 rounded-2xl shadow-xl flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-slate-400 uppercase font-semibold">Average Speed</span>
            <div className="text-2xl font-black text-white font-mono tabular-nums">{userStats.avgWpm} WPM</div>
          </div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 p-6 rounded-2xl shadow-xl flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-600/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <Target className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-slate-400 uppercase font-semibold">Average Accuracy</span>
            <div className="text-2xl font-black text-white font-mono tabular-nums">{userStats.avgAccuracy}%</div>
          </div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 p-6 rounded-2xl shadow-xl flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-600/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <Flame className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-slate-400 uppercase font-semibold">Practice Streak</span>
            <div className="text-2xl font-black text-white font-mono tabular-nums">
              {userStats.streak} {userStats.streak === 1 ? 'Day' : 'Days'}
            </div>
          </div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 p-6 rounded-2xl shadow-xl flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center text-purple-400">
            <Trophy className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-slate-400 uppercase font-semibold">Total Growth XP</span>
            <div className="text-2xl font-black text-white font-mono tabular-nums">{userStats.xp} XP</div>
          </div>
        </div>
      </div>

      {/* Tricky Keys & Mistake Hotspots + Rule-Based Remediation Engine */}
      <div className="bg-slate-900/90 border border-slate-800 p-6 rounded-2xl shadow-xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h2 className="text-lg font-bold text-white">Tricky Keys & Mistake Hotspots</h2>
          {ruleLessons.length > 0 && (
            <button
              type="button"
              onClick={() => onStartRemediationLesson(ruleLessons[0])}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-colors whitespace-nowrap shrink-0"
            >
              <Play className="w-3.5 h-3.5" />
              <span>Start Priority Recovery</span>
            </button>
          )}
        </div>

        {hotspots.length === 0 ? (
          <div className="rounded-xl bg-slate-950/70 border border-slate-800 px-5 py-6 text-center">
            <div className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-400">
              <CheckCircle2 className="w-4 h-4" />
              <span>No active mistake hotspots</span>
            </div>
          </div>
        ) : (
          <>
            {/* Interactive Per-Key Hotspot Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {hotspots.map((hotspot) => {
                const sev = getSeverityMeta(hotspot.severity);
                const SevIcon = sev.icon;
                return (
                  <div
                    key={hotspot.key}
                    className={`flex items-center justify-between gap-3 bg-slate-950/80 border ${sev.borderClass} px-4 py-3 rounded-xl`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span
                        className={`w-10 h-10 shrink-0 rounded-lg font-mono font-bold text-base flex items-center justify-center border ${sev.keyBgClass}`}
                      >
                        {hotspot.displayKey}
                      </span>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 text-xs font-semibold text-slate-100 tabular-nums">
                          <span>
                            {hotspot.mistakes} {hotspot.mistakes === 1 ? 'mistake' : 'mistakes'}
                          </span>
                          <span className="text-slate-600">·</span>
                          <span className={`inline-flex items-center gap-1 ${sev.textClass}`}>
                            <SevIcon className="w-3 h-3 shrink-0" />
                            <span>{sev.label}</span>
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-400 truncate mt-0.5">
                          {hotspot.fingerName} · {hotspot.rowName}
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => onStartRemediationLesson(generateSingleKeyLesson(hotspot))}
                      className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-100 border border-slate-700 text-xs font-semibold transition-colors whitespace-nowrap shrink-0"
                    >
                      Train Key
                    </button>
                  </div>
                );
              })}
            </div>

            {/* Auto-Arranged Rule-Based Recovery Queue */}
            {ruleLessons.length > 0 && (
              <div className="pt-4 border-t border-slate-800 space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400">
                  <Layers className="w-3.5 h-3.5 text-sky-400" />
                  <span>Rule-Based Recovery Queue ({ruleLessons.length})</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {ruleLessons.map((lesson) => {
                    const sev = getSeverityMeta(lesson.severity);
                    const SevIcon = sev.icon;
                    return (
                      <div
                        key={lesson.id}
                        className="bg-slate-950/75 border border-slate-800 hover:border-sky-500/40 rounded-xl p-4 flex flex-col justify-between gap-4 transition-colors"
                      >
                        <div className="space-y-2">
                          <div className="flex items-center justify-between gap-2 text-[11px]">
                            <span className="font-semibold text-sky-400 uppercase tracking-wider">
                              {lesson.ruleName}
                            </span>
                            <span className={`inline-flex items-center gap-1 font-semibold ${sev.textClass}`}>
                              <SevIcon className="w-3 h-3" />
                              <span>{sev.label}</span>
                            </span>
                          </div>

                          <h3 className="text-sm font-bold text-white">{lesson.title}</h3>

                          <div className="flex flex-wrap items-center gap-1.5 pt-1">
                            {lesson.remediationTargetKeys.map((k) => (
                              <span
                                key={k}
                                className="px-2 py-0.5 rounded bg-slate-900 border border-slate-700 font-mono text-xs font-bold text-slate-200"
                              >
                                {formatHotspotKeyLabel(k)}
                              </span>
                            ))}
                          </div>
                        </div>

                        <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between gap-3">
                          <span className="text-[11px] text-slate-400 font-medium tabular-nums">
                            3 Stages · {lesson.completionAccuracy}% target
                          </span>
                          <button
                            type="button"
                            onClick={() => onStartRemediationLesson(lesson)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold transition-colors whitespace-nowrap"
                          >
                            <span>Start 3-Stage Lesson</span>
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
      </div>

      {/* Session History Table */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
        <div className="p-6 border-b border-slate-800">
          <h2 className="text-lg font-bold text-white">Recent Completed Sessions</h2>
        </div>

        {sessionHistory.length === 0 ? (
          <div className="p-10 text-center text-sm text-slate-400">
            No completed sessions yet
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950/50 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  <th className="p-4">Activity</th>
                  <th className="p-4">Type</th>
                  <th className="p-4">Speed</th>
                  <th className="p-4">Accuracy</th>
                  <th className="p-4">Errors</th>
                  <th className="p-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-sm">
                {sessionHistory.map(session => (
                  <tr key={session.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="p-4 font-semibold text-white">{session.title}</td>
                    <td
                      className={`p-4 uppercase text-xs font-bold ${
                        session.type === 'arcade'
                          ? 'text-fuchsia-400'
                          : session.type === 'test' || session.type === 'exam'
                          ? 'text-amber-400'
                          : session.type === 'practice'
                          ? 'text-emerald-400'
                          : 'text-indigo-400'
                      }`}
                    >
                      {session.type}
                    </td>
                    <td className="p-4 font-mono font-bold text-white tabular-nums">{session.wpm} WPM</td>
                    <td className="p-4 font-mono font-bold text-emerald-400 tabular-nums">{session.accuracy}%</td>
                    <td className="p-4 font-mono text-slate-400 tabular-nums">{session.errors}</td>
                    <td className="p-4">
                      {session.passed ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Passed
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                          Completed
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
