import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { GrowthProfile, UserAccount, UserStats } from '../types';
import { safeStorage } from '../utils/safeStorage';
import {
  ArcadeModeId,
  ArcadePersonalRecord,
  ArcadeProfile,
  ArcadeSession,
} from './arcadeTypes';
import {
  createDefaultArcadeProfile,
  upsertPersonalRecord,
} from './arcadeEngine';
import { ArcadeArena } from './components/ArcadeArena';
import { FightingArena } from './components/FightingArena';
import { NeonArcadeHub } from './components/NeonArcadeHub';
import {
  ArcadeDailyChallengeView,
  ArcadeLeaderboardsView,
} from './components/ArcadeSubViews';
import { ArrowLeft, Gamepad2 } from 'lucide-react';

type ArcadeNavTab = 'hub' | 'play' | 'daily' | 'leaderboards';

interface TypingArcadeAppProps {
  userAccount: UserAccount | null;
  userStats: UserStats;
  growthProfile: GrowthProfile;
  onOpenAccount?: () => void;
  onRequireAuthForLeaderboard?: (onAuthorized: () => void) => void;
  onArcadeSessionComplete: (session: ArcadeSession) => void;
  onExitArcade: () => void;
}

const STORAGE_KEYS = {
  profile: 'typing_arcade_profile_v1',
  sessions: 'typing_arcade_sessions_v1',
  records: 'typing_arcade_records_v1',
};

export const TypingArcadeApp: React.FC<TypingArcadeAppProps> = ({
  userAccount,
  userStats,
  growthProfile,
  onOpenAccount,
  onRequireAuthForLeaderboard,
  onArcadeSessionComplete,
  onExitArcade,
}) => {
  const [activeTab, setActiveTab] = useState<ArcadeNavTab>('hub');
  const [activeMode, setActiveMode] = useState<ArcadeModeId>('classic');
  const [fightingLaunchLevel, setFightingLaunchLevel] = useState<number | undefined>(undefined);
  const [launchKey, setLaunchKey] = useState<number>(0);
  const [playingDaily, setPlayingDaily] = useState<boolean>(false);
  const [isImmersivePlay, setIsImmersivePlay] = useState<boolean>(false);

  const [profile, setProfile] = useState<ArcadeProfile>(() => {
    const fallbackHandle = userAccount?.fullName || 'Guest Typist';
    const saved = safeStorage.getItem(STORAGE_KEYS.profile);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object') {
          const base = createDefaultArcadeProfile(fallbackHandle);
          return {
            ...base,
            ...parsed,
            handle: userAccount?.fullName || parsed.handle || base.handle,
            unlockedItemIds: Array.isArray(parsed.unlockedItemIds)
              ? Array.from(new Set([...base.unlockedItemIds, ...parsed.unlockedItemIds]))
              : base.unlockedItemIds,
            equipped: {
              ...base.equipped,
              ...(parsed.equipped || {}),
            },
          };
        }
      } catch {
        // Fallback to defaults
      }
    }
    return createDefaultArcadeProfile(fallbackHandle);
  });

  // Keep persisted arcade handle synced with active user or default Guest Typist
  useEffect(() => {
    const targetHandle = userAccount?.fullName || 'Guest Typist';
    if (targetHandle !== profile.handle) {
      setProfile((prev) => {
        const next = { ...prev, handle: targetHandle };
        safeStorage.setItem(STORAGE_KEYS.profile, JSON.stringify(next));
        return next;
      });
    }
  }, [userAccount?.fullName, profile.handle]);

  // If user signs out while on leaderboards, return cleanly to Arcade Hub
  useEffect(() => {
    if (!userAccount && activeTab === 'leaderboards') {
      setActiveTab('hub');
    }
  }, [userAccount, activeTab]);

  const [sessions, setSessions] = useState<ArcadeSession[]>(() => {
    const saved = safeStorage.getItem(STORAGE_KEYS.sessions);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      } catch {
        // Ignore corrupted JSON
      }
    }
    return [];
  });

  const [records, setRecords] = useState<ArcadePersonalRecord[]>(() => {
    const saved = safeStorage.getItem(STORAGE_KEYS.records);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      } catch {
        // Ignore corrupted JSON
      }
    }
    return [];
  });

  const unifiedProfile = useMemo<ArcadeProfile>(
    () => ({
      ...profile,
      handle: userAccount?.fullName || 'Guest Typist',
      xp: userStats.xp,
      level: growthProfile.stageLevel,
      dailyStreak: userStats.streak,
    }),
    [profile, userAccount?.fullName, userStats.xp, growthProfile.stageLevel, userStats.streak]
  );

  const handleSessionComplete = useCallback(
    (session: ArcadeSession): { isNewBestWpm: boolean } => {
      // Persist last 80 arcade sessions (strip huge logs on older sessions to stay lean)
      setSessions((prev) => {
        const next = [session, ...prev].slice(0, 80);
        const compact = next.map((s, idx) =>
          idx < 15 ? s : { ...s, keystrokeLog: s.keystrokeLog.slice(0, 10) }
        );
        safeStorage.setItem(STORAGE_KEYS.sessions, JSON.stringify(compact));
        return next;
      });

      let isNewBestWpm = false;
      setRecords((prev) => {
        const res = upsertPersonalRecord(prev, session);
        isNewBestWpm = res.isNewBestWpm;
        safeStorage.setItem(STORAGE_KEYS.records, JSON.stringify(res.nextRecords));
        return res.nextRecords;
      });

      // Feed directly into the unified Courses & Arcade growth system
      onArcadeSessionComplete(session);

      return { isNewBestWpm };
    },
    [onArcadeSessionComplete]
  );

  const handleLaunchMode = useCallback((mode: ArcadeModeId, fightingLevel?: number) => {
    setPlayingDaily(false);
    setActiveMode(mode);
    setFightingLaunchLevel(fightingLevel);
    setLaunchKey((k) => k + 1);
    setActiveTab('play');
  }, []);

  const handleLaunchDaily = useCallback(() => {
    setPlayingDaily(true);
    setActiveMode('challenge');
    setFightingLaunchLevel(undefined);
    setLaunchKey((k) => k + 1);
    setActiveTab('play');
  }, []);

  const handleReturnToHub = useCallback(() => {
    setIsImmersivePlay(false);
    setPlayingDaily(false);
    setActiveTab('hub');
  }, []);

  const handleSelectTab = useCallback(
    (tab: ArcadeNavTab) => {
      if (tab === 'leaderboards' && !userAccount && onRequireAuthForLeaderboard) {
        onRequireAuthForLeaderboard(() => setActiveTab('leaderboards'));
        return;
      }
      setActiveTab(tab);
    },
    [userAccount, onRequireAuthForLeaderboard]
  );

  const personalBestForActiveMode = useMemo(() => {
    const rec = records.find((r) => r.mode === activeMode);
    return rec ? rec.bestWpm : null;
  }, [records, activeMode]);

  const navItems: Array<{ id: ArcadeNavTab; label: string }> = [
    { id: 'hub', label: 'Arcade Hub' },
    { id: 'daily', label: 'Daily' },
    { id: 'leaderboards', label: 'Ranks' },
  ];

  const hideOuterChrome = isImmersivePlay || activeTab === 'hub';

  return (
    <div className="min-h-screen bg-[#060417] text-slate-100 flex flex-col font-sans selection:bg-amber-500 selection:text-slate-950">
      {/* Sub-view Top Bar (Hidden on the Neon Pixel Arcade Hub and during fullscreen gameplay) */}
      {!hideOuterChrome && (
        <header className="sticky top-0 z-50 bg-[#09061E]/95 backdrop-blur-md border-b border-[#261B4A]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-6">
          {/* Zone 1: Brand Wordmark -> Back to Arcade Hub */}
          <button
            type="button"
            onClick={handleReturnToHub}
            className="inline-flex items-center gap-2.5 text-left shrink-0 whitespace-nowrap"
          >
            <span className="w-8 h-8 rounded-lg bg-amber-500 text-slate-950 flex items-center justify-center shadow-lg shadow-amber-500/20">
              <Gamepad2 className="w-4 h-4" />
            </span>
            <span className="text-base font-extrabold tracking-tight text-white">
              Typing Arcade
            </span>
          </button>

          {/* Zone 2: Clean Single-Line Nav Links */}
          <nav className="hidden md:flex items-center gap-6">
            {navItems.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleSelectTab(item.id)}
                  className={`py-1 text-sm font-semibold transition-colors whitespace-nowrap shrink-0 border-b-2 ${
                    isActive
                      ? 'text-amber-400 border-amber-400'
                      : 'text-slate-400 hover:text-white border-transparent'
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </nav>

          {/* Zone 3: Shared Growth Stage & Exit Back to Courses */}
          <div className="flex items-center gap-4 shrink-0">
            <div className="hidden sm:flex items-center gap-2 text-xs font-mono tabular-nums text-slate-400 whitespace-nowrap">
              {onOpenAccount ? (
                <button
                  type="button"
                  onClick={onOpenAccount}
                  title="Edit player name or sign in"
                  className="text-slate-200 hover:text-emerald-300 font-semibold max-w-[110px] truncate font-sans transition-colors cursor-pointer"
                >
                  {unifiedProfile.handle}
                </button>
              ) : (
                <span className="text-slate-200 font-semibold max-w-[110px] truncate font-sans">
                  {unifiedProfile.handle}
                </span>
              )}
              <span aria-hidden="true">·</span>
              <span className="text-emerald-400 font-bold">
                Stage {growthProfile.stageLevel}
              </span>
              <span aria-hidden="true">·</span>
              <span>{userStats.xp} XP</span>
            </div>

            <button
              type="button"
              onClick={onExitArcade}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#111622] hover:bg-[#181F2E] border border-[#232C40] text-xs font-semibold text-slate-200 hover:text-white transition-colors whitespace-nowrap shrink-0"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Courses</span>
            </button>
          </div>
        </div>

        {/* Mobile Nav Strip */}
        <div className="flex md:hidden items-center justify-around border-t border-[#1D2536] px-2 py-2 bg-[#090C12]">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleSelectTab(item.id)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap ${
                  isActive ? 'text-amber-400 bg-amber-500/10' : 'text-slate-400'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </div>
      </header>
      )}

      {/* Active Arcade Page Content */}
      <main className={hideOuterChrome ? 'flex-1' : 'flex-1 pb-16'}>
        {activeTab === 'hub' && (
          <NeonArcadeHub
            profile={unifiedProfile}
            growthProfile={growthProfile}
            records={records}
            sessions={sessions}
            onPlayModeDirect={handleLaunchMode}
            onOpenAccount={onOpenAccount}
            onOpenDaily={() => handleSelectTab('daily')}
            onOpenLeaderboards={() => handleSelectTab('leaderboards')}
            onExitArcade={onExitArcade}
          />
        )}

        {activeTab === 'play' &&
          (activeMode === 'classic' && !playingDaily ? (
            <FightingArena
              key={`fight-${launchKey}`}
              profile={unifiedProfile}
              personalBestWpm={personalBestForActiveMode}
              autoStart
              initialLevel={fightingLaunchLevel}
              onSelectMode={(m) => handleLaunchMode(m)}
              onSessionComplete={handleSessionComplete}
              onOpenModes={handleReturnToHub}
              onExitToHub={handleReturnToHub}
              onImmersiveChange={setIsImmersivePlay}
            />
          ) : (
            <ArcadeArena
              key={`arena-${activeMode}-${playingDaily ? 'daily' : 'std'}-${launchKey}`}
              mode={activeMode}
              isDailyChallenge={playingDaily}
              autoStart
              profile={unifiedProfile}
              personalBestWpm={personalBestForActiveMode}
              onSelectMode={(m) => handleLaunchMode(m)}
              onSessionComplete={handleSessionComplete}
              onOpenModes={handleReturnToHub}
              onExitToHub={handleReturnToHub}
              onImmersiveChange={setIsImmersivePlay}
            />
          ))}

        {activeTab === 'daily' && (
          <ArcadeDailyChallengeView
            profile={unifiedProfile}
            sessions={sessions}
            onLaunchDaily={handleLaunchDaily}
          />
        )}

        {activeTab === 'leaderboards' && (
          <ArcadeLeaderboardsView
            sessions={sessions}
            profile={unifiedProfile}
            onPlayMode={(m) => handleLaunchMode(m)}
          />
        )}
      </main>

    </div>
  );
};
