import React, { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { Header } from './components/Header';
import { Dashboard } from './components/Dashboard';
import { LessonList } from './components/LessonList';
import { PracticeHub } from './components/PracticeHub';
import { NourishmentDrillsPage } from './components/NourishmentDrillsPage';
import { TestExamHub } from './components/TestExamHub';
import { AnalyticsDashboard } from './components/AnalyticsDashboard';
import { TypingWorkspace } from './components/TypingWorkspace';
import { AssessmentModal } from './components/AssessmentModal';
import { AccountModal, AccountModalContext } from './components/AccountModal';
import { CertificateModal } from './components/CertificateModal';
import { TypingArcadeApp } from './arcade/TypingArcadeApp';
import { COURSES_DATA, PRACTICE_ITEMS, TEST_ITEMS } from './data/courses';
import {
  Lesson,
  PracticeItem,
  TestItem,
  WorkspaceMode,
  GuidanceConfig,
  SessionResult,
  UserStats,
  SkillLevel,
  GeneratedRemediationLesson,
  UserAccount,
  TypingCertificate,
} from './types';
import { applyRemediationHealing, generateRuleBasedLessons } from './engines/remediationEngine';
import {
  createCertificateFromSession,
  downloadCertificatePng,
  isEligibleForCertificate,
  upsertCertificate,
} from './utils/certificateEngine';
import {
  applyUnifiedSessionStats,
  arcadeSessionToSessionResult,
  calculateGrowthProfile,
} from './utils/growthEngine';
import { ArcadeSession } from './arcade/arcadeTypes';
import { ARCADE_GAME_WORLDS } from './arcade/games/gameWorldTypes';
import { safeStorage } from './utils/safeStorage';
import {
  clearActiveUserAccount,
  loadActiveUserAccount,
  loadLocalAccounts,
  saveActiveUserAccount,
} from './utils/localAuthEngine';
import { AdSlot } from './components/ads/AdSlot';
import { SITE_ADS_CONFIG } from './config/adsConfig';
import {
  signUserStats,
  verifyUserStats,
  signCertificate,
  verifyCertificate,
} from './utils/integrityEngine';
import { AdminPortal } from './components/admin/AdminPortal';
import { recordTelemetryVisit, recordTelemetryCompletion } from './utils/adminTelemetry';

function getTodayIsoDate(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function computeNextStreak(prevStreak: number, lastPracticeDate?: string): { streak: number; today: string } {
  const today = getTodayIsoDate();
  if (!lastPracticeDate) {
    return { streak: Math.max(1, prevStreak), today };
  }
  if (lastPracticeDate === today) {
    return { streak: Math.max(1, prevStreak), today };
  }
  const prevMs = new Date(`${lastPracticeDate}T00:00:00`).getTime();
  const todayMs = new Date(`${today}T00:00:00`).getTime();
  const diffDays = Math.round((todayMs - prevMs) / 86400000);
  if (diffDays === 1) {
    return { streak: Math.max(1, prevStreak) + 1, today };
  }
  return { streak: 1, today };
}

function isDirectAdminUrl(): boolean {
  if (typeof window === 'undefined') return false;
  const hash = window.location.hash.toLowerCase();
  const search = window.location.search.toLowerCase();
  const path = window.location.pathname.toLowerCase();
  return (
    hash === '#admin' ||
    hash === '#/admin' ||
    search.includes('portal=admin') ||
    search.includes('admin=true') ||
    path === '/admin' ||
    path.endsWith('/admin')
  );
}

export default function App() {
  const [isAdminPortalOpen, setIsAdminPortalOpen] = useState<boolean>(() => isDirectAdminUrl());
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [isArcadeOpen, setIsArcadeOpen] = useState<boolean>(false);
  const [showAssessment, setShowAssessment] = useState<boolean>(false);
  const [userLevel, setUserLevel] = useState<SkillLevel>(() => {
    const saved = safeStorage.getItem('typing_master_user_level');
    if (saved === 'beginner' || saved === 'intermediate' || saved === 'advanced') {
      return saved;
    }
    return 'beginner';
  });

  const [activeWorkspace, setActiveWorkspace] = useState<{
    mode: WorkspaceMode;
    itemId?: string;
    title: string;
    subtitle: string;
    targetContent: string;
    guidanceConfig: GuidanceConfig;
    lessonData?: Lesson;
    exercises?: string[];
    durationMinutes?: number;
    passWpm?: number;
    passAccuracy?: number;
    scoring?: 'standard' | 'strict';
    completionAccuracy?: number;
    remediationTargetKeys?: string[];
    initialWeakKeys?: Record<string, number>;
  } | null>(null);

  // Sync dedicated Lesson/Practice/Test page state with URL hash & browser Back button
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (activeWorkspace) {
      const slug = encodeURIComponent(activeWorkspace.itemId || activeWorkspace.title);
      const targetHash = `#${activeWorkspace.mode}/${slug}`;
      if (window.location.hash !== targetHash) {
        try {
          window.history.pushState({ workspace: true }, '', targetHash);
        } catch {
          // Ignore restricted iframe history pushState errors
        }
      }
      window.scrollTo(0, 0);
    } else if (showAssessment) {
      if (window.location.hash !== '#assessment') {
        try {
          window.history.pushState({ assessment: true }, '', '#assessment');
        } catch {
          // Ignore restricted iframe history pushState errors
        }
      }
      window.scrollTo(0, 0);
    } else if (activeTab === 'drills') {
      if (window.location.hash !== '#drills') {
        try {
          window.history.pushState({ tab: 'drills' }, '', '#drills');
        } catch {
          // Ignore restricted iframe history pushState errors
        }
      }
      window.scrollTo(0, 0);
    } else if (
      window.location.hash === '#drills' ||
      window.location.hash === '#assessment' ||
      window.location.hash.startsWith('#lesson/') ||
      window.location.hash.startsWith('#practice/') ||
      window.location.hash.startsWith('#test/') ||
      window.location.hash.startsWith('#exam/')
    ) {
      try {
        window.history.replaceState(null, '', window.location.pathname + window.location.search);
      } catch {
        // Ignore restricted iframe history errors
      }
    }
  }, [activeWorkspace, activeTab, showAssessment]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handlePopState = () => {
      if (
        !window.location.hash.startsWith('#lesson/') &&
        !window.location.hash.startsWith('#practice/') &&
        !window.location.hash.startsWith('#test/') &&
        !window.location.hash.startsWith('#exam/')
      ) {
        setWorkspaceIssuedCertificate(null);
        setActiveWorkspace(null);
      }
      if (window.location.hash !== '#assessment') {
        setShowAssessment(false);
      }
      if (window.location.hash === '#drills') {
        setActiveTab('drills');
      } else if (!window.location.hash) {
        setActiveTab((prev) => (prev === 'drills' ? 'dashboard' : prev));
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const [userStats, setUserStats] = useState<UserStats>(() => {
    let baseStats: UserStats = {
      xp: 0,
      streak: 1,
      lessonsCompleted: 0,
      avgWpm: 0,
      avgAccuracy: 0,
      totalPracticeTimeSeconds: 0,
      weakKeys: {},
    };

    const saved = safeStorage.getItem('typing_master_user_stats');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object') {
          const verification = verifyUserStats(parsed);
          if (verification.valid) {
            baseStats = {
              xp: Number(parsed.xp) || 0,
              streak: Number(parsed.streak) || 1,
              lessonsCompleted: Number(parsed.lessonsCompleted) || 0,
              avgWpm: Number(parsed.avgWpm) || 0,
              avgAccuracy: Number(parsed.avgAccuracy) || 0,
              totalPracticeTimeSeconds: Number(parsed.totalPracticeTimeSeconds) || 0,
              weakKeys: parsed.weakKeys && typeof parsed.weakKeys === 'object' ? parsed.weakKeys : {},
              lastPracticeDate: typeof parsed.lastPracticeDate === 'string' ? parsed.lastPracticeDate : undefined,
              _integrity: parsed._integrity,
            };
            if (verification.wasUnsigned) {
              baseStats = signUserStats(baseStats);
              safeStorage.setItem('typing_master_user_stats', JSON.stringify(baseStats));
            }
          } else {
            console.warn('[Security] Detected manual tampering with user stats. Resetting stats to defaults.');
            baseStats = signUserStats(baseStats);
            safeStorage.setItem('typing_master_user_stats', JSON.stringify(baseStats));
          }
        }
      } catch {
        // Fallback to defaults if stored JSON is corrupted
      }
    }

    // One-time safe migration: fold any pre-existing standalone Arcade XP into unified Growth XP
    if (!safeStorage.getItem('typing_master_arcade_xp_migrated_v1')) {
      const legacyArcade = safeStorage.getItem('typing_arcade_profile_v1');
      if (legacyArcade) {
        try {
          const parsedArcade = JSON.parse(legacyArcade);
          const legacyXp = Number(parsedArcade?.xp) || 0;
          if (legacyXp > 0) {
            baseStats = {
              ...baseStats,
              xp: baseStats.xp + legacyXp,
            };
            safeStorage.setItem('typing_master_user_stats', JSON.stringify(signUserStats(baseStats)));
          }
        } catch {
          // Ignore malformed legacy arcade profile
        }
      }
      safeStorage.setItem('typing_master_arcade_xp_migrated_v1', '1');
    }

    return baseStats;
  });

  const [sessionHistory, setSessionHistory] = useState<SessionResult[]>(() => {
    const saved = safeStorage.getItem('typing_master_session_history');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      } catch {
        // Fallback to empty history if corrupted
      }
    }
    return [];
  });

  const [userAccount, setUserAccount] = useState<UserAccount | null>(() => loadActiveUserAccount());

  const [certificates, setCertificates] = useState<TypingCertificate[]>(() => {
    const saved = safeStorage.getItem('typing_master_certificates');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          const validCerts: TypingCertificate[] = [];
          for (const item of parsed) {
            const ver = verifyCertificate(item);
            if (ver.valid) {
              validCerts.push(ver.wasUnsigned ? signCertificate(item) : item);
            } else {
              console.warn('[Security] Quarantining tampered certificate:', item.id);
            }
          }
          return validCerts;
        }
      } catch {
        // Ignore corrupted certificate list
      }
    }
    return [];
  });

  const [accountModalState, setAccountModalState] = useState<{
    open: boolean;
    context: AccountModalContext;
    pendingCertificateSession: SessionResult | null;
  }>({
    open: false,
    context: 'default',
    pendingCertificateSession: null,
  });
  const pendingLeaderboardCallbackRef = useRef<(() => void) | null>(null);

  const [activeCertificateModal, setActiveCertificateModal] = useState<TypingCertificate | null>(null);
  const [workspaceIssuedCertificate, setWorkspaceIssuedCertificate] = useState<TypingCertificate | null>(null);

  useEffect(() => {
    recordTelemetryVisit();
    const handleUrlChange = () => {
      setIsAdminPortalOpen(isDirectAdminUrl());
    };
    window.addEventListener('hashchange', handleUrlChange);
    window.addEventListener('popstate', handleUrlChange);
    return () => {
      window.removeEventListener('hashchange', handleUrlChange);
      window.removeEventListener('popstate', handleUrlChange);
    };
  }, []);

  const handleExitAdminPortal = useCallback(() => {
    setIsAdminPortalOpen(false);
    if (typeof window !== 'undefined') {
      if (window.location.hash) {
        window.history.replaceState(null, '', window.location.pathname + window.location.search);
      }
      if (window.location.search.includes('admin')) {
        window.history.replaceState(null, '', window.location.pathname);
      }
    }
  }, []);

  const openAccountModal = useCallback(
    (
      context: AccountModalContext = 'default',
      pendingCertificateSession: SessionResult | null = null,
      onLeaderboardAuthorized?: () => void
    ) => {
      pendingLeaderboardCallbackRef.current = onLeaderboardAuthorized || null;
      setAccountModalState({
        open: true,
        context,
        pendingCertificateSession,
      });
    },
    []
  );

  const closeAccountModal = useCallback(() => {
    pendingLeaderboardCallbackRef.current = null;
    setAccountModalState({
      open: false,
      context: 'default',
      pendingCertificateSession: null,
    });
  }, []);

  const issueCertificateForAccount = useCallback(
    (result: SessionResult, recipientName: string, openModalImmediately: boolean) => {
      if (!isEligibleForCertificate(result)) return;
      try {
        const cert = createCertificateFromSession(result, recipientName);
        setCertificates((prev) => {
          const updated = upsertCertificate(prev, cert);
          safeStorage.setItem('typing_master_certificates', JSON.stringify(updated));
          return updated;
        });
        setWorkspaceIssuedCertificate(cert);
        if (openModalImmediately) {
          setActiveCertificateModal(cert);
        }
      } catch {
        // Ignore if session does not meet eligibility constraints
      }
    },
    []
  );

  const handleAccountUpdated = useCallback(
    (account: UserAccount) => {
      const wasUnnamed = !userAccount;
      saveActiveUserAccount(account);
      setUserAccount(account);

      if (accountModalState.pendingCertificateSession) {
        issueCertificateForAccount(accountModalState.pendingCertificateSession, account.fullName, true);
        closeAccountModal();
        return;
      }

      if (pendingLeaderboardCallbackRef.current) {
        const cb = pendingLeaderboardCallbackRef.current;
        closeAccountModal();
        cb();
        return;
      }

      if (wasUnnamed) {
        closeAccountModal();
      }
    },
    [userAccount, accountModalState.pendingCertificateSession, issueCertificateForAccount, closeAccountModal]
  );

  const handleSignOutAccount = useCallback(() => {
    clearActiveUserAccount();
    setUserAccount(null);
    closeAccountModal();
  }, [closeAccountModal]);

  const handleStartLesson = useCallback((lesson: Lesson) => {
    setActiveWorkspace({
      mode: 'lesson',
      itemId: lesson.id,
      title: lesson.title,
      subtitle: lesson.objective,
      targetContent: lesson.exercises.join('   '),
      guidanceConfig: lesson.guidanceConfig,
      lessonData: lesson,
      exercises: lesson.exercises,
      completionAccuracy: lesson.completionAccuracy,
    });
  }, []);

  const handleStartRemediationLesson = useCallback(
    (lesson: GeneratedRemediationLesson) => {
      setActiveWorkspace({
        mode: 'lesson',
        itemId: lesson.id,
        title: lesson.title,
        subtitle: lesson.objective,
        targetContent: lesson.exercises.join('   '),
        guidanceConfig: lesson.guidanceConfig,
        lessonData: lesson,
        exercises: lesson.exercises,
        completionAccuracy: lesson.completionAccuracy,
        remediationTargetKeys: lesson.remediationTargetKeys,
        initialWeakKeys: { ...(userStats.weakKeys || {}) },
      });
    },
    [userStats.weakKeys]
  );

  const handleNextLesson = useCallback(() => {
    if (!activeWorkspace) return;
    const currentId = activeWorkspace.itemId;
    const currentIndex = COURSES_DATA.findIndex(
      (l) => l.id === currentId || l.title === activeWorkspace.title
    );
    if (currentIndex >= 0 && currentIndex < COURSES_DATA.length - 1) {
      handleStartLesson(COURSES_DATA[currentIndex + 1]);
    } else {
      setActiveTab('lessons');
      setActiveWorkspace(null);
    }
  }, [activeWorkspace, handleStartLesson]);

  const handleStartPractice = useCallback(
    (practice: PracticeItem) => {
      if (practice.type === 'weak_key') {
        const generated = generateRuleBasedLessons(userStats.weakKeys);
        if (generated.length > 0) {
          handleStartRemediationLesson(generated[0]);
          return;
        }
      }

      setActiveWorkspace({
        mode: 'practice',
        itemId: practice.id,
        title: practice.title,
        subtitle: practice.description,
        targetContent: practice.content,
        guidanceConfig: practice.guidanceConfig,
        durationMinutes: practice.durationMinutes,
      });
    },
    [userStats.weakKeys, handleStartRemediationLesson]
  );

  const handleStartTest = useCallback((test: TestItem) => {
    setWorkspaceIssuedCertificate(null);
    setActiveWorkspace({
      mode: 'test',
      itemId: test.id,
      title: test.title,
      subtitle: test.description,
      targetContent: test.content,
      guidanceConfig: test.guidanceConfig,
      durationMinutes: test.durationMinutes,
      passWpm: test.passWpm,
      passAccuracy: test.passAccuracy,
      scoring: test.scoring,
    });
  }, []);

  const handleCompleteSession = useCallback((result: SessionResult) => {
    setSessionHistory((prevHistory) => {
      const updatedHistory = [result, ...prevHistory];
      safeStorage.setItem('typing_master_session_history', JSON.stringify(updatedHistory));

      setUserStats((prev) => {
        let overrideWeakKeys: Record<string, number> | undefined;
        if (result.remediationTargetKeys && result.remediationTargetKeys.length > 0) {
          const { nextWeakKeys } = applyRemediationHealing(
            prev.weakKeys || {},
            result.remediationTargetKeys,
            result.accuracy,
            result.passed,
            result.missedKeys
          );
          overrideWeakKeys = nextWeakKeys;
        }

        const xpEarned = 50 + (result.passed ? 50 : 10) + Math.min(Math.round(result.wpm / 2), 50);
        const streakInfo = computeNextStreak(prev.streak, prev.lastPracticeDate);
        const nextStats = applyUnifiedSessionStats(
          prev,
          updatedHistory,
          result,
          xpEarned,
          streakInfo,
          overrideWeakKeys
        );
        safeStorage.setItem('typing_master_user_stats', JSON.stringify(signUserStats(nextStats)));
        return nextStats;
      });

      return updatedHistory;
    });

    recordTelemetryCompletion({
      type: result.type,
      title: result.title,
      wpm: result.wpm,
      accuracy: result.accuracy,
      charsTyped: Math.round(result.wpm * 5 * (result.durationSeconds / 60)) || 100,
      userName: userAccount?.fullName,
    });

    // Automatically generate & save certificate on passed test, or prompt unnamed visitor at certificate time
    if (isEligibleForCertificate(result)) {
      if (userAccount) {
        issueCertificateForAccount(result, userAccount.fullName, false);
      } else {
        openAccountModal('certificate', result);
      }
    }
  }, [userAccount, issueCertificateForAccount, openAccountModal]);

  const handleCompleteArcadeSession = useCallback((arcadeSession: ArcadeSession) => {
    const gameTitle = ARCADE_GAME_WORLDS[arcadeSession.mode]?.gameTitle || arcadeSession.mode;
    const unifiedResult = arcadeSessionToSessionResult(arcadeSession, gameTitle);

    setSessionHistory((prevHistory) => {
      const updatedHistory = [unifiedResult, ...prevHistory];
      safeStorage.setItem('typing_master_session_history', JSON.stringify(updatedHistory));

      setUserStats((prev) => {
        const streakInfo = computeNextStreak(prev.streak, prev.lastPracticeDate);
        const nextStats = applyUnifiedSessionStats(
          prev,
          updatedHistory,
          unifiedResult,
          arcadeSession.xpEarned,
          streakInfo
        );
        safeStorage.setItem('typing_master_user_stats', JSON.stringify(signUserStats(nextStats)));
        return nextStats;
      });

      return updatedHistory;
    });
  }, []);

  const growthProfile = useMemo(
    () => calculateGrowthProfile(userStats, sessionHistory),
    [userStats, sessionHistory]
  );

  const handleAssignLevel = useCallback((level: SkillLevel, wpm: number, accuracy: number) => {
    setUserLevel(level);
    safeStorage.setItem('typing_master_user_level', level);
    setUserStats((prev) => {
      const nextStats: UserStats = {
        ...prev,
        avgWpm: prev.avgWpm > 0 ? prev.avgWpm : wpm,
        avgAccuracy: prev.avgAccuracy > 0 ? prev.avgAccuracy : accuracy,
      };
      safeStorage.setItem('typing_master_user_stats', JSON.stringify(signUserStats(nextStats)));
      return nextStats;
    });
    setShowAssessment(false);
    setActiveTab('lessons');
  }, []);

  const accountModalNode = accountModalState.open ? (
    <AccountModal
      userAccount={userAccount}
      certificateCount={certificates.length}
      context={accountModalState.context}
      hasSavedLocalAccounts={loadLocalAccounts().length > 0}
      onAccountUpdated={handleAccountUpdated}
      onSignOut={handleSignOutAccount}
      onViewCertificates={() => {
        closeAccountModal();
        setIsArcadeOpen(false);
        setActiveWorkspace(null);
        setActiveTab('tests');
      }}
      onClose={closeAccountModal}
    />
  ) : null;

  if (activeWorkspace) {
    const isRemediation = Boolean(activeWorkspace.remediationTargetKeys?.length);
    return (
      <>
        <TypingWorkspace
          key={`${activeWorkspace.mode}-${activeWorkspace.itemId || activeWorkspace.title}`}
          mode={activeWorkspace.mode}
          itemId={activeWorkspace.itemId}
          title={activeWorkspace.title}
          subtitle={activeWorkspace.subtitle}
          targetContent={activeWorkspace.targetContent}
          guidanceConfig={activeWorkspace.guidanceConfig}
          lessonData={activeWorkspace.lessonData}
          exercises={activeWorkspace.exercises}
          durationMinutes={activeWorkspace.durationMinutes}
          passWpm={activeWorkspace.passWpm}
          passAccuracy={activeWorkspace.passAccuracy}
          scoring={activeWorkspace.scoring}
          completionAccuracy={activeWorkspace.completionAccuracy}
          remediationTargetKeys={activeWorkspace.remediationTargetKeys}
          initialWeakKeys={activeWorkspace.initialWeakKeys}
          userAccount={userAccount}
          issuedCertificate={workspaceIssuedCertificate}
          isCertificateModalOpen={Boolean(activeCertificateModal || accountModalState.open)}
          onViewCertificate={(cert) => setActiveCertificateModal(cert)}
          onRequestCertificateAuth={(session) => openAccountModal('certificate', session)}
          onNextLesson={activeWorkspace.mode === 'lesson' && !isRemediation ? handleNextLesson : undefined}
          onComplete={handleCompleteSession}
          onBack={() => {
            setWorkspaceIssuedCertificate(null);
            setActiveWorkspace(null);
          }}
        />

        {accountModalNode}

        {activeCertificateModal && (
          <CertificateModal
            certificate={activeCertificateModal}
            onClose={() => setActiveCertificateModal(null)}
          />
        )}
      </>
    );
  }

  if (isAdminPortalOpen) {
    return <AdminPortal onExit={handleExitAdminPortal} />;
  }

  if (showAssessment) {
    return (
      <AssessmentModal
        onAssignLevel={handleAssignLevel}
        onClose={() => setShowAssessment(false)}
      />
    );
  }

  if (isArcadeOpen) {
    return (
      <>
        <TypingArcadeApp
          userAccount={userAccount}
          userStats={userStats}
          growthProfile={growthProfile}
          onOpenAccount={() => openAccountModal('default')}
          onRequireAuthForLeaderboard={(onAuthorized) =>
            openAccountModal('leaderboard', null, onAuthorized)
          }
          onArcadeSessionComplete={handleCompleteArcadeSession}
          onExitArcade={() => setIsArcadeOpen(false)}
        />

        {accountModalNode}
      </>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-sky-500 selection:text-white">
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        userAccount={userAccount}
        onOpenAccount={() => openAccountModal('default')}
        onOpenArcade={() => setIsArcadeOpen(true)}
      />

      <main className="flex-1 pb-16">
        {/* Top Leaderboard Ad Slot */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-2">
          <AdSlot slot={SITE_ADS_CONFIG.slots.topLeaderboard} />
        </div>

        {activeTab === 'dashboard' && (
          <Dashboard
            lessons={COURSES_DATA}
            practiceItems={PRACTICE_ITEMS}
            userStats={userStats}
            sessionHistory={sessionHistory}
            onStartLesson={handleStartLesson}
            onStartPractice={handleStartPractice}
            onOpenNourishmentDrills={() => setActiveTab('drills')}
            setActiveTab={setActiveTab}
          />
        )}
        {activeTab === 'drills' && (
          <NourishmentDrillsPage
            practiceItems={PRACTICE_ITEMS}
            testItems={TEST_ITEMS}
            weakKeys={userStats.weakKeys}
            onStartPractice={handleStartPractice}
            onStartTest={handleStartTest}
            onStartRemediationLesson={handleStartRemediationLesson}
            onBack={() => setActiveTab('dashboard')}
          />
        )}
        {activeTab === 'lessons' && (
          <LessonList
            lessons={COURSES_DATA}
            sessionHistory={sessionHistory}
            userStats={userStats}
            initialLevel={userLevel}
            onStartLesson={handleStartLesson}
            onOpenAssessment={() => setShowAssessment(true)}
          />
        )}
        {activeTab === 'practice' && (
          <PracticeHub
            practiceItems={PRACTICE_ITEMS}
            weakKeys={userStats.weakKeys}
            onStartPractice={handleStartPractice}
            onStartRemediationLesson={handleStartRemediationLesson}
          />
        )}
        {activeTab === 'tests' && (
          <TestExamHub
            testItems={TEST_ITEMS}
            onStartTest={handleStartTest}
            certificates={certificates}
            userAccount={userAccount}
            onViewCertificate={(cert) => setActiveCertificateModal(cert)}
            onDownloadCertificate={downloadCertificatePng}
            onOpenAccount={() => openAccountModal('certificate')}
          />
        )}
        {activeTab === 'analytics' && (
          <AnalyticsDashboard
            userStats={userStats}
            sessionHistory={sessionHistory}
            onStartRemediationLesson={handleStartRemediationLesson}
          />
        )}

        {/* Bottom Banner Ad Slot */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-2">
          <AdSlot slot={SITE_ADS_CONFIG.slots.bottomBanner} />
        </div>
      </main>

      {accountModalNode}

      {activeCertificateModal && (
        <CertificateModal
          certificate={activeCertificateModal}
          onClose={() => setActiveCertificateModal(null)}
        />
      )}
    </div>
  );
}
