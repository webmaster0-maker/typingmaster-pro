import React, { useMemo, useState } from 'react';
import {
  ArcadeModeId,
  ArcadePersonalRecord,
  ArcadeProfile,
  ArcadeSession,
  CosmeticCategory,
  LeaderboardPeriod,
} from '../arcadeTypes';
import {
  ARCADE_MODES,
  ARCADE_MODE_LIST,
  COSMETIC_CATALOG,
  buildModeLeaderboard,
  getLevelFromXp,
} from '../arcadeEngine';
import { getDailyChallengePassage, getTodayArcadeDate } from '../arcadeCorpus';
import { ARCADE_GAME_WORLDS } from '../games/gameWorldTypes';
import {
  Activity,
  ArrowRight,
  Calendar,
  Check,
  Flame,
  Lock,
  Palette,
  Shield,
  ShieldCheck,
  Swords,
  Target,
  Unlock,
  Volume2,
  Zap,
} from 'lucide-react';

/* ============================================================================
 * 1. ALL 5 MODES CATALOG VIEW (All modes 100% free — P2 locked)
 * ============================================================================ */
interface ArcadeModesViewProps {
  records: ArcadePersonalRecord[];
  sessions: ArcadeSession[];
  onPlayMode: (mode: ArcadeModeId) => void;
}

export const ArcadeModesView: React.FC<ArcadeModesViewProps> = ({
  records,
  sessions,
  onPlayMode,
}) => {
  const modeIcon = (id: ArcadeModeId) => {
    switch (id) {
      case 'speed_rush':
        return <Zap className="w-5 h-5 text-amber-400" />;
      case 'accuracy_master':
        return <Shield className="w-5 h-5 text-emerald-400" />;
      case 'rhythm':
        return <Activity className="w-5 h-5 text-emerald-400" />;
      case 'challenge':
        return <Target className="w-5 h-5 text-amber-400" />;
      case 'classic':
      default:
        return <Swords className="w-5 h-5 text-amber-400" />;
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fadeIn">
      <h1 className="text-3xl font-extrabold text-white tracking-tight">
        Arcade Modes
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {ARCADE_MODE_LIST.map((cfg) => {
          const world = ARCADE_GAME_WORLDS[cfg.id];
          const rec = records.find((r) => r.mode === cfg.id);
          const plays = sessions.filter((s) => s.mode === cfg.id).length;

          return (
            <div
              key={cfg.id}
              onClick={() => onPlayMode(cfg.id)}
              className="group bg-[#111622] hover:bg-[#151C2B] border border-[#232C40] hover:border-amber-500/50 rounded-2xl p-6 transition-colors cursor-pointer flex flex-col justify-between gap-5"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="w-10 h-10 rounded-xl bg-[#090C12] border border-[#232C40] flex items-center justify-center">
                    {modeIcon(cfg.id)}
                  </div>
                  <span className="text-xs font-mono tabular-nums text-slate-400">
                    {cfg.xpMultiplier.toFixed(2)}x XP · {cfg.durationSeconds ? `${cfg.durationSeconds}s` : 'Full Run'}
                  </span>
                </div>

                <h2 className="text-lg font-bold text-white group-hover:text-amber-300 transition-colors">
                  {world.gameTitle}
                </h2>
              </div>

              <div className="pt-4 border-t border-[#232C40] flex items-center justify-between gap-3">
                <div className="text-xs font-mono tabular-nums text-slate-400">
                  Best:{' '}
                  <strong className="text-white">
                    {rec ? `${rec.bestWpm} WPM` : '--'}
                  </strong>{' '}
                  · {plays} {plays === 1 ? 'run' : 'runs'}
                </div>

                <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-400 group-hover:translate-x-0.5 transition-transform whitespace-nowrap">
                  <span>Launch Game</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

/* ============================================================================
 * 2. DAILY CHALLENGE VIEW (Deterministic Date-Seeded Passage)
 * ============================================================================ */
interface ArcadeDailyChallengeViewProps {
  profile: ArcadeProfile;
  sessions: ArcadeSession[];
  onLaunchDaily: () => void;
}

export const ArcadeDailyChallengeView: React.FC<ArcadeDailyChallengeViewProps> = ({
  profile,
  sessions,
  onLaunchDaily,
}) => {
  const today = getTodayArcadeDate();
  const dailyPassage = useMemo(() => getDailyChallengePassage(today), [today]);

  const todayRuns = useMemo(
    () =>
      sessions.filter(
        (s) => s.isDailyChallenge && s.dailyDate === today && s.validationStatus !== 'rejected'
      ),
    [sessions, today]
  );

  const bestToday = useMemo(() => {
    if (todayRuns.length === 0) return null;
    return todayRuns.reduce((best, cur) => (cur.wpm > best.wpm ? cur : best), todayRuns[0]);
  }, [todayRuns]);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fadeIn">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 text-xs font-semibold text-amber-400 font-mono tabular-nums">
            <Calendar className="w-3.5 h-3.5" />
            <span>{today}</span>
            <span aria-hidden="true">·</span>
            <span>+60 XP</span>
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">
            Daily Titan Siege
          </h1>
        </div>

        <div className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#111622] border border-[#232C40] font-mono tabular-nums text-xs shrink-0">
          <Flame className="w-4 h-4 text-amber-400" />
          <span className="text-slate-300">
            Daily Streak: <strong className="text-amber-300">{profile.dailyStreak}</strong>
          </span>
        </div>
      </div>

      <div className="bg-[#111622] border border-[#232C40] rounded-2xl p-6 sm:p-8 space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-[#232C40]">
          <h2 className="text-xl font-bold text-white">{dailyPassage.title}</h2>
          <div className="text-xs font-mono tabular-nums text-slate-300">
            Target: <strong className="text-amber-400">55 WPM</strong> ·{' '}
            <strong className="text-emerald-400">96% Acc</strong>
          </div>
        </div>

        <p className="font-mono text-sm sm:text-base text-slate-300 bg-[#090C12] border border-[#232C40] rounded-xl p-5 leading-relaxed">
          &ldquo;{dailyPassage.content.slice(0, 155)}...&rdquo;
        </p>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="text-xs font-mono tabular-nums text-slate-400">
            {bestToday && (
              <span className="inline-flex items-center gap-2 text-emerald-400 font-semibold">
                <ShieldCheck className="w-4 h-4" />
                <span>
                  Today&apos;s Best: {bestToday.wpm} WPM · {bestToday.accuracy}% ({todayRuns.length})
                </span>
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={onLaunchDaily}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm transition-colors whitespace-nowrap"
          >
            <span>{bestToday ? 'Play Again' : 'Play Daily Challenge'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

/* ============================================================================
 * 3. LEADERBOARDS VIEW (Per-Mode + Time Window + Replay Trust Tiers)
 * ============================================================================ */
interface ArcadeLeaderboardsViewProps {
  sessions: ArcadeSession[];
  profile: ArcadeProfile;
  onPlayMode: (mode: ArcadeModeId) => void;
}

export const ArcadeLeaderboardsView: React.FC<ArcadeLeaderboardsViewProps> = ({
  sessions,
  profile,
  onPlayMode,
}) => {
  const [modeFilter, setModeFilter] = useState<ArcadeModeId | 'all'>('all');
  const [period, setPeriod] = useState<LeaderboardPeriod>('all_time');

  const rows = useMemo(
    () => buildModeLeaderboard(modeFilter, period, sessions, profile),
    [modeFilter, period, sessions, profile]
  );

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 animate-fadeIn">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <h1 className="text-3xl font-extrabold text-white tracking-tight">Arcade Leaderboards</h1>

        {/* Period Filter */}
        <div className="inline-flex items-center gap-1 p-1 rounded-xl bg-[#111622] border border-[#232C40] shrink-0 self-start sm:self-auto">
          {(
            [
              { id: 'daily', label: 'Daily' },
              { id: 'weekly', label: 'Weekly' },
              { id: 'all_time', label: 'All-Time' },
            ] as Array<{ id: LeaderboardPeriod; label: string }>
          ).map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => setPeriod(p.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap ${
                period === p.id
                  ? 'bg-emerald-500 text-slate-950 font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Mode Filter Tabs */}
      <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-xl bg-[#111622] border border-[#232C40] w-fit">
        <button
          type="button"
          onClick={() => setModeFilter('all')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap ${
            modeFilter === 'all'
              ? 'bg-amber-500 text-slate-950 font-bold'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          All Modes
        </button>
        {ARCADE_MODE_LIST.map((m) => (
          <button
            key={m.id}
            type="button"
            onClick={() => setModeFilter(m.id)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap ${
              modeFilter === m.id
                ? 'bg-amber-500 text-slate-950 font-bold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            {m.shortLabel}
          </button>
        ))}
      </div>

      {/* Standings Table */}
      <div className="bg-[#111622] border border-[#232C40] rounded-2xl overflow-hidden">
        {rows.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <div className="text-sm font-semibold text-slate-400">No scores yet</div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#232C40] bg-[#0D121D] text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  <th className="py-3.5 px-5">Rank</th>
                  <th className="py-3.5 px-5">Player</th>
                  <th className="py-3.5 px-5">Mode</th>
                  <th className="py-3.5 px-5 text-right">Net WPM</th>
                  <th className="py-3.5 px-5 text-right">Accuracy</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1C2436] text-sm">
                {rows.map((entry, idx) => (
                  <tr
                    key={entry.id}
                    className={
                      entry.isCurrentUser
                        ? 'bg-amber-500/10 text-white'
                        : 'hover:bg-[#161D2E]/60 text-slate-200'
                    }
                  >
                    <td className="py-3.5 px-5 font-mono tabular-nums font-bold text-slate-400">
                      #{idx + 1}
                    </td>
                    <td className="py-3.5 px-5">
                      <div className="font-semibold text-white flex items-center gap-2">
                        <span>{entry.handle}</span>
                        {entry.isCurrentUser && (
                          <span className="text-[11px] font-semibold text-amber-400">(You)</span>
                        )}
                      </div>
                    </td>
                    <td className="py-3.5 px-5 text-xs text-slate-300">
                      {ARCADE_MODES[entry.mode].shortLabel}
                    </td>
                    <td className="py-3.5 px-5 text-right font-mono tabular-nums font-bold text-amber-400">
                      {entry.wpm.toFixed(1)}
                    </td>
                    <td className="py-3.5 px-5 text-right font-mono tabular-nums font-semibold text-emerald-400">
                      {entry.accuracy.toFixed(1)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="px-5 py-3.5 border-t border-[#232C40] bg-[#0D121D] flex items-center justify-end text-xs">
          <button
            type="button"
            onClick={() => onPlayMode(modeFilter === 'all' ? 'classic' : modeFilter)}
            className="font-bold text-amber-400 hover:text-amber-300 transition-colors whitespace-nowrap"
          >
            Play {modeFilter === 'all' ? 'Classic' : ARCADE_MODES[modeFilter].shortLabel} →
          </button>
        </div>
      </div>
    </div>
  );
};

/* ============================================================================
 * 4. COSMETICS UNLOCK CATALOG (P1–P2: Cosmetics ONLY — Never Gates Modes)
 * ============================================================================ */
interface ArcadeCosmeticsViewProps {
  profile: ArcadeProfile;
  onUnlockItem: (itemId: string) => void;
  onEquipItem: (category: CosmeticCategory, itemId: string) => void;
}

export const ArcadeCosmeticsView: React.FC<ArcadeCosmeticsViewProps> = ({
  profile,
  onUnlockItem,
  onEquipItem,
}) => {
  const [category, setCategory] = useState<CosmeticCategory | 'all'>('all');
  const levelInfo = getLevelFromXp(profile.xp);

  const items = useMemo(
    () =>
      category === 'all'
        ? COSMETIC_CATALOG
        : COSMETIC_CATALOG.filter((item) => item.category === category),
    [category]
  );

  const isEquipped = (cat: CosmeticCategory, id: string) => {
    if (cat === 'caret') return profile.equipped.caretStyle === id;
    if (cat === 'theme') return profile.equipped.arenaTheme === id;
    if (cat === 'sound') return profile.equipped.soundPack === id;
    return profile.equipped.playerTitle === id;
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fadeIn">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <h1 className="text-3xl font-extrabold text-white tracking-tight">
          Cosmetics &amp; Customization
        </h1>

        <div className="bg-[#111622] border border-[#232C40] rounded-xl px-5 py-3 min-w-[240px]">
          <div className="flex items-center justify-between text-xs font-mono tabular-nums">
            <span className="text-slate-300 font-semibold">Level {levelInfo.level}</span>
            <span className="text-amber-400 font-bold">{profile.xp} XP</span>
          </div>
          <div className="mt-2 h-1.5 rounded-full bg-[#090C12] overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-amber-500 to-emerald-400"
              style={{ width: `${levelInfo.progressPct}%` }}
            />
          </div>
          <div className="mt-1 text-[11px] text-slate-500 font-mono tabular-nums">
            {levelInfo.currentLevelXp}/{levelInfo.nextLevelXp} XP to Level {levelInfo.level + 1}
          </div>
        </div>
      </div>

      {/* Category Filter */}
      <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-xl bg-[#111622] border border-[#232C40] w-fit">
        {(
          [
            { id: 'all', label: 'All Cosmetics' },
            { id: 'caret', label: 'Carets' },
            { id: 'theme', label: 'Arena Themes' },
            { id: 'sound', label: 'Sound Packs' },
            { id: 'title', label: 'Titles' },
          ] as Array<{ id: CosmeticCategory | 'all'; label: string }>
        ).map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => setCategory(c.id)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap ${
              category === c.id
                ? 'bg-amber-500 text-slate-950 font-bold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            {c.label}
          </button>
        ))}
      </div>

      {/* Cosmetics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {items.map((item) => {
          const unlocked =
            profile.unlockedItemIds.includes(item.id) || item.xpRequired === 0;
          const canUnlock = !unlocked && profile.xp >= item.xpRequired;
          const equipped = isEquipped(item.category, item.id);

          return (
            <div
              key={item.id}
              className={`bg-[#111622] border rounded-2xl p-5 flex flex-col justify-between gap-4 transition-colors ${
                equipped ? 'border-emerald-500/60' : 'border-[#232C40]'
              }`}
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <div
                    className="w-11 h-11 rounded-xl border border-white/10 flex items-center justify-center shrink-0"
                    style={{
                      background: `linear-gradient(135deg, ${item.previewPrimary}, ${item.previewSecondary})`,
                    }}
                  >
                    {item.category === 'sound' ? (
                      <Volume2 className="w-4 h-4 text-white" />
                    ) : (
                      <Palette className="w-4 h-4 text-white" />
                    )}
                  </div>

                  <span className="text-xs font-mono tabular-nums text-slate-400 capitalize">
                    {item.category} ·{' '}
                    {item.xpRequired === 0 ? 'Starter' : `${item.xpRequired} XP`}
                  </span>
                </div>

                <h3 className="text-base font-bold text-white">{item.name}</h3>
              </div>

              <div className="pt-3 border-t border-[#232C40] flex items-center justify-between gap-2">
                {equipped ? (
                  <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-400">
                    <Check className="w-4 h-4" />
                    <span>Equipped</span>
                  </span>
                ) : unlocked ? (
                  <button
                    type="button"
                    onClick={() => onEquipItem(item.category, item.id)}
                    className="w-full py-2 px-4 rounded-xl bg-[#181F2E] hover:bg-slate-800 border border-[#232C40] text-xs font-bold text-white transition-colors whitespace-nowrap"
                  >
                    Equip
                  </button>
                ) : canUnlock ? (
                  <button
                    type="button"
                    onClick={() => onUnlockItem(item.id)}
                    className="w-full inline-flex items-center justify-center gap-1.5 py-2 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition-colors whitespace-nowrap"
                  >
                    <Unlock className="w-3.5 h-3.5" />
                    <span>Unlock Cosmetic</span>
                  </button>
                ) : (
                  <span className="inline-flex items-center gap-1.5 text-xs text-slate-500 font-mono tabular-nums">
                    <Lock className="w-3.5 h-3.5" />
                    <span>Need {item.xpRequired - profile.xp} more XP</span>
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
