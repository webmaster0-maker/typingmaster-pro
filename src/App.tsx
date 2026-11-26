import React, { useState, useCallback, useEffect, useMemo, useRef, Suspense } from 'react';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { Dashboard } from './components/Dashboard';
import { AccountModal, AccountModalContext } from './components/AccountModal';
const LessonList = React.lazy(() =>
  import('./components/LessonList').then((m) => ({ default: m.LessonList }))
);
const PracticeHub = React.lazy(() =>
  import('./components/PracticeHub').then((m) => ({ default: m.PracticeHub }))
);
const NourishmentDrillsPage = React.lazy(() =>
  import('./components/NourishmentDrillsPage').then((m) => ({ default: m.NourishmentDrillsPage }))
);
const TestExamHub = React.lazy(() =>
  import('./components/TestExamHub').then((m) => ({ default: m.TestExamHub }))
);
const AnalyticsDashboard = React.lazy(() =>
  import('./components/AnalyticsDashboard').then((m) => ({ default: m.AnalyticsDashboard }))
);
const TypingWorkspace = React.lazy(() =>
  import('./components/TypingWorkspace').then((m) => ({ default: m.TypingWorkspace }))
);
const AssessmentModal = React.lazy(() =>
  import('./components/AssessmentModal').then((m) => ({ default: m.AssessmentModal }))
);
const CertificateModal = React.lazy(() =>
  import('./components/CertificateModal').then((m) => ({ default: m.CertificateModal }))
);
const TypingArcadeApp = React.lazy(() =>
  import('./arcade/TypingArcadeApp').then((m) => ({ default: m.TypingArcadeApp }))
);
const AdminPortal = React.lazy(() =>
  import('./components/admin/AdminPortal').then((m) => ({ default: m.AdminPortal }))
);
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
  downloadCertificatePdf,
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
  isSiteAdSlotVisible,
  useAdVisibilitySettings,
} from './utils/adSettings';
import {
  signUserStats,
  verifyUserStats,
  signCertificate,
  verifyCertificate,
} from './utils/integrityEngine';
import { recordTelemetryVisit, recordTelemetryCompletion } from './utils/adminTelemetry';
import {
  extractGateTokenFromLocation,
  verifyAdminGateToken,
  getAdminSession,
} from './utils/adminAuth';
import {
  AppRouteView,
  VIEW_TO_PATH,
  resolveRouteFromLocation,
  syncHeadCanonicalAndUrl,
} from './utils/seoRouting';

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

export default function App() {
  const adSettings = useAdVisibilitySettings();
  const [isAdminPortalOpen, setIsAdminPortalOpen] = useState<boolean>(
    () => getAdminSession().authenticated
  );
  const [activeTab, setActiveTab] = useState<string>(() => {
    if (getAdminSession().authenticated) return 'dashboard';
    const { view } = resolveRouteFromLocation();
    return view === 'arcade' || view === 'assessment' ? 'dashboard' : view;
  });
  const [isArcadeOpen, setIsArcadeOpen] = useState<boolean>(() => {
    if (getAdminSession().authenticated) return false;
    return resolveRouteFromLocation().view === 'arcade';
  });
  const [showAssessment, setShowAssessment] = useState<boolean>(() => {
    if (getAdminSession().authenticated) return false;
    return resolveRouteFromLocation().view === 'assessment';
  });
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

  // Sync clean URL slugs, self-referencing canonicals, & browser Back/Forward history
  useEffect(() => {
    if (typeof window === 'undefined' || isAdminPortalOpen) return;

    if (activeWorkspace) {
      const parentView: AppRouteView =
        activeWorkspace.mode === 'practice'
          ? 'practice'
          : activeWorkspace.mode === 'test' || activeWorkspace.mode === 'exam'
          ? 'tests'
          : 'lessons';
      const parentPath = VIEW_TO_PATH[parentView];
      const slug = encodeURIComponent(activeWorkspace.itemId || activeWorkspace.title);
      const targetUrl = `${parentPath}#${activeWorkspace.mode}/${slug}`;
      if (window.location.pathname + window.location.hash !== targetUrl) {
        try {
          window.history.pushState({ workspace: true }, '', targetUrl);
        } catch {
          // Ignore restricted iframe history pushState errors
        }
      }
      syncHeadCanonicalAndUrl(parentPath, parentView);
      window.scrollTo(0, 0);
      return;
    }

    const currentView: AppRouteView = isArcadeOpen
      ? 'arcade'
      : showAssessment
      ? 'assessment'
      : (activeTab as AppRouteView) in VIEW_TO_PATH
      ? (activeTab as AppRouteView)
      : 'dashboard';

    const targetPath = VIEW_TO_PATH[currentView];
    if (window.location.pathname !== targetPath || window.location.hash) {
      try {
        window.history.pushState({ view: currentView }, '', targetPath);
      } catch {
        // Ignore restricted iframe history pushState errors
      }
    }
    syncHeadCanonicalAndUrl(targetPath, currentView);
    if (currentView !== 'dashboard') {
      window.scrollTo(0, 0);
    }
  }, [activeWorkspace, activeTab, isArcadeOpen, showAssessment, isAdminPortalOpen]);

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
      const { view, canonicalPath } = resolveRouteFromLocation();
      setShowAssessment(view === 'assessment');
      setIsArcadeOpen(view === 'arcade');
      if (view !== 'arcade' && view !== 'assessment') {
        setActiveTab(view);
      }
      syncHeadCanonicalAndUrl(canonicalPath, view);
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
    const checkGate = async () => {
      const token = extractGateTokenFromLocation();
      if (!token) return;
      const valid = await verifyAdminGateToken(token);
      if (valid) {
        setIsAdminPortalOpen(true);
        // Strip the secret gate token from the browser URL bar immediately
        try {
          window.history.replaceState(null, '', '/');
        } catch {
          // Ignore restricted history API errors
        }
      }
    };
    void checkGate();

    const handleUrlChange = () => {
      void checkGate();
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

  const routeFallback = (
    <div className="min-h-[60vh] flex items-center justify-center bg-slate-950 text-slate-400 text-sm">
      Loading TypeCrest workspace...
    </div>
  );

  if (activeWorkspace) {
    const isRemediation = Boolean(activeWorkspace.remediationTargetKeys?.length);
    return (
      <Suspense fallback={routeFallback}>
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
            onBackHome={() => {
              setActiveCertificateModal(null);
              setWorkspaceIssuedCertificate(null);
              setActiveWorkspace(null);
              setIsArcadeOpen(false);
              setShowAssessment(false);
              setActiveTab('dashboard');
            }}
          />
        )}
      </Suspense>
    );
  }

  if (isAdminPortalOpen) {
    return (
      <Suspense fallback={routeFallback}>
        <AdminPortal onExit={handleExitAdminPortal} />
      </Suspense>
    );
  }

  if (showAssessment) {
    return (
      <Suspense fallback={routeFallback}>
        <AssessmentModal
          onAssignLevel={handleAssignLevel}
          onClose={() => setShowAssessment(false)}
        />
      </Suspense>
    );
  }

  if (isArcadeOpen) {
    return (
      <Suspense fallback={routeFallback}>
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
      </Suspense>
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
        {isSiteAdSlotVisible(SITE_ADS_CONFIG.slots.topLeaderboard.id, adSettings) && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-2">
            <AdSlot slot={SITE_ADS_CONFIG.slots.topLeaderboard} />
          </div>
        )}

        <Suspense fallback={routeFallback}>
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
              onDownloadCertificatePdf={downloadCertificatePdf}
              onOpenAccount={() => openAccountModal('certificate')}
              onBackHome={() => setActiveTab('dashboard')}
            />
          )}
          {activeTab === 'analytics' && (
            <AnalyticsDashboard
              userStats={userStats}
              sessionHistory={sessionHistory}
              onStartRemediationLesson={handleStartRemediationLesson}
            />
          )}
        </Suspense>

        {/* Bottom Banner Ad Slot */}
        {isSiteAdSlotVisible(SITE_ADS_CONFIG.slots.bottomBanner.id, adSettings) && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-2">
            <AdSlot slot={SITE_ADS_CONFIG.slots.bottomBanner} />
          </div>
        )}
      </main>

      <Footer
        onNavigateTab={setActiveTab}
        onOpenArcade={() => setIsArcadeOpen(true)}
        onOpenAssessment={() => setShowAssessment(true)}
      />

      {accountModalNode}

      {activeCertificateModal && (
        <Suspense fallback={null}>
          <CertificateModal
            certificate={activeCertificateModal}
            onClose={() => setActiveCertificateModal(null)}
            onBackHome={() => {
              setActiveCertificateModal(null);
              setWorkspaceIssuedCertificate(null);
              setActiveWorkspace(null);
              setIsArcadeOpen(false);
              setShowAssessment(false);
              setActiveTab('dashboard');
            }}
          />
        </Suspense>
      )}
    </div>
  );
}
