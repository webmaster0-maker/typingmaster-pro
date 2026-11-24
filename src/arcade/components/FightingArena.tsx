import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ArcadeGameState,
  ArcadeModeId,
  ArcadeProfile,
  ArcadeSession,
  ArcadeTextPassage,
  ArenaThemeId,
  KeystrokeEvent,
} from '../arcadeTypes';
import {
  ARCADE_MODES,
  SCORING_VERSION,
  XP_FORMULA_VERSION,
  computeArcadeXp,
  computeKeystrokeAccuracy,
  computeNetWpm,
  computeP95Latency,
  computeRawWpm,
  verifySessionReplay,
} from '../arcadeEngine';
import { arcadeAudio } from '../arcadeAudio';
import {
  AggressionIntensityTier,
  CombatMatchState,
  FightingProgressionState,
  applyWordCompletionAttack,
  createCombatMatchState,
  evaluateAiOnMistake,
  getComboMultiplier,
  getOpponentForLevel,
  hasStrictErrorLock,
  loadFightingProgress,
  processStrictBackspace,
  processStrictCombatCharInput,
  recordFightingOutcome,
  registerAccurateFlowStep,
  saveFightingProgress,
  stepDynamicCombatTick,
} from '../games/fightingCombatEngine';
import {
  FightingRenderSnapshot,
  createFightingStageSim,
  renderFightingStage,
  triggerOpponentReactionVisuals,
  triggerPlayerKeyMomentum,
  triggerPlayerWordAttackVisuals,
  updateFightingStageSim,
} from '../games/fightingAnimator';
import {
  createSharedVfxState,
  renderSharedVfx,
  updateSharedVfx,
} from '../games/gameWorldVfx';
import { useFullscreenControl } from '../useFullscreenControl';
import { GameAdRail } from './GameAdRail';
import {
  ArrowRight,
  Check,
  Copy,
  Flame,
  Lock,
  LogOut,
  Maximize2,
  Minimize2,
  Pause,
  Play,
  RotateCcw,
  Shield,
  Sparkles,
  Swords,
  Trophy,
  Volume2,
  VolumeX,
} from 'lucide-react';

interface FightingArenaProps {
  profile: ArcadeProfile;
  personalBestWpm: number | null;
  autoStart?: boolean;
  initialLevel?: number;
  onSelectMode: (mode: ArcadeModeId) => void;
  onSessionComplete: (session: ArcadeSession) => { isNewBestWpm: boolean };
  onOpenModes: () => void;
  onExitToHub?: () => void;
  onImmersiveChange?: (immersive: boolean) => void;
}

const ARENA_THEME_CLASSES: Record<
  ArenaThemeId,
  { surface: string; border: string; well: string }
> = {
  theme_obsidian: {
    surface: 'bg-[#111622]',
    border: 'border-[#232C40]',
    well: 'bg-[#090C12]',
  },
  theme_carbon_amber: {
    surface: 'bg-[#15130F]',
    border: 'border-[#332B1D]',
    well: 'bg-[#0C0A08]',
  },
  theme_emerald_vault: {
    surface: 'bg-[#0C1714]',
    border: 'border-[#1B332B]',
    well: 'bg-[#070E0C]',
  },
  theme_midnight_slate: {
    surface: 'bg-[#101521]',
    border: 'border-[#253047]',
    well: 'bg-[#0A0E17]',
  },
};

export const FightingArena: React.FC<FightingArenaProps> = ({
  profile,
  personalBestWpm,
  autoStart = false,
  initialLevel,
  onSelectMode,
  onSessionComplete,
  onOpenModes,
  onExitToHub,
  onImmersiveChange,
}) => {
  const themeTokens =
    ARENA_THEME_CLASSES[profile.equipped.arenaTheme] || ARENA_THEME_CLASSES.theme_obsidian;

  const [progression, setProgression] = useState<FightingProgressionState>(() =>
    loadFightingProgress()
  );
  const [selectedLevel, setSelectedLevel] = useState<number>(() => {
    const saved = loadFightingProgress();
    if (typeof initialLevel === 'number') {
      return Math.max(1, Math.min(saved.highestUnlockedLevel, Math.floor(initialLevel)));
    }
    return saved.selectedLevel;
  });
  const [sfxEnabled, setSfxEnabled] = useState<boolean>(
    profile.equipped.soundPack !== 'sound_muted'
  );
  const [shakeEnabled, setShakeEnabled] = useState<boolean>(true);

  const [gameState, setGameState] = useState<ArcadeGameState>(() =>
    autoStart ? 'countdown' : 'idle'
  );
  const [countdownValue, setCountdownValue] = useState<number>(3);
  const [waitingFirstKey, setWaitingFirstKey] = useState<boolean>(false);
  const [completedSession, setCompletedSession] = useState<ArcadeSession | null>(null);
  const [isNewBest, setIsNewBest] = useState<boolean>(false);
  const [copiedCard, setCopiedCard] = useState<boolean>(false);
  const [newlyUnlockedLevel, setNewlyUnlockedLevel] = useState<number | null>(null);

  const isImmersive = gameState !== 'idle';
  const {
    isBrowserFullscreen,
    isFullscreenSupported,
    toggleBrowserFullscreen,
    exitBrowserFullscreen,
  } = useFullscreenControl(isImmersive);

  useEffect(() => {
    onImmersiveChange?.(isImmersive);
  }, [isImmersive, onImmersiveChange]);

  useEffect(() => {
    if (autoStart) {
      arcadeAudio.playCountdownTick(
        sfxEnabled ? profile.equipped.soundPack : 'sound_muted',
        false
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    return () => {
      onImmersiveChange?.(false);
    };
  }, [onImmersiveChange]);

  // HUD snapshot state synced cleanly on combat events & 120ms telemetry tick
  const initialMatch = useMemo(
    () =>
      createCombatMatchState(selectedLevel, {
        wpm: progression.rollingWpm,
        accuracy: progression.rollingAccuracy,
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  const matchRef = useRef<CombatMatchState>(initialMatch);
  const stageSimRef = useRef(createFightingStageSim());
  const vfxRef = useRef(createSharedVfxState());
  const canvasContainerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const canvasDimsRef = useRef<{ w: number; h: number }>({ w: 920, h: 350 });
  const mobileInputRef = useRef<HTMLInputElement | null>(null);

  // Precision E1-E4 typing refs
  const keystrokeLogRef = useRef<KeystrokeEvent[]>([]);
  const totalKeystrokesRef = useRef<number>(0);
  const correctKeystrokesRef = useRef<number>(0);
  const errorCountRef = useRef<number>(0);
  const completedCharsCountRef = useRef<number>(0);
  const completedTranscriptWordsRef = useRef<string[]>([]);
  const startPerfMsRef = useRef<number | null>(null);
  const pausedAtPerfMsRef = useRef<number | null>(null);
  const totalPausedMsRef = useRef<number>(0);
  const hasFinalizedRef = useRef<boolean>(false);

  const [hud, setHud] = useState(() => ({
    playerHp: initialMatch.playerHp,
    playerMaxHp: initialMatch.playerMaxHp,
    opponentHp: initialMatch.opponentHp,
    opponentMaxHp: initialMatch.opponentMaxHp,
    opponent: initialMatch.opponent,
    activeWord: initialMatch.wordQueue[0]?.text || '',
    typedBuffer: '',
    upcomingWords: initialMatch.wordQueue.slice(1, 6).map((w) => w.text),
    wpm: 0,
    accuracy: 100,
    wordCombo: 0,
    maxWordCombo: 0,
    wordsCompleted: 0,
    totalDamageDealt: 0,
    totalDamageTaken: 0,
    hasErrorLock: false,
    opponentAttackGauge: 0,
    aggressionMultiplier: initialMatch.aggressionMultiplier,
    intensityTier: initialMatch.intensityTier as AggressionIntensityTier,
    interruptCount: 0,
    aiHasAdvantage: false,
    outcome: initialMatch.outcome as 'ongoing' | 'victory' | 'defeat',
  }));

  const effectiveSoundPack = sfxEnabled ? profile.equipped.soundPack : 'sound_muted';
  const effectiveSoundPackRef = useRef(effectiveSoundPack);
  effectiveSoundPackRef.current = effectiveSoundPack;

  const shakeEnabledRef = useRef(shakeEnabled);
  shakeEnabledRef.current = shakeEnabled;

  const gameStateRef = useRef<ArcadeGameState>(gameState);
  gameStateRef.current = gameState;

  const waitingFirstKeyRef = useRef<boolean>(waitingFirstKey);
  waitingFirstKeyRef.current = waitingFirstKey;

  const arenaThemeRef = useRef<ArenaThemeId>(profile.equipped.arenaTheme);
  arenaThemeRef.current = profile.equipped.arenaTheme;

  const getActiveElapsedMs = useCallback((): number => {
    if (startPerfMsRef.current === null) return 0;
    const now = pausedAtPerfMsRef.current ?? performance.now();
    return Math.max(0, now - startPerfMsRef.current - totalPausedMsRef.current);
  }, []);

  const syncHudFromMatch = useCallback(() => {
    const m = matchRef.current;
    const elapsed = getActiveElapsedMs();
    const activeWord = m.wordQueue[m.activeWordIndex]?.text || '';
    // Count correct prefix chars in currently typed buffer for smooth live WPM
    let livePrefixCorrect = 0;
    for (let i = 0; i < m.typedBuffer.length; i++) {
      if (m.typedBuffer[i] === activeWord[i]) livePrefixCorrect++;
    }
    const totalCorrectChars = completedCharsCountRef.current + livePrefixCorrect;
    const liveWpm = elapsed > 200 ? computeNetWpm(totalCorrectChars, elapsed) : 0;
    const liveAcc = computeKeystrokeAccuracy(
      correctKeystrokesRef.current,
      totalKeystrokesRef.current
    );
    const nowPerf = performance.now();

    setHud({
      playerHp: m.playerHp,
      playerMaxHp: m.playerMaxHp,
      opponentHp: m.opponentHp,
      opponentMaxHp: m.opponentMaxHp,
      opponent: m.opponent,
      activeWord,
      typedBuffer: m.typedBuffer,
      upcomingWords: m.wordQueue
        .slice(m.activeWordIndex + 1, m.activeWordIndex + 6)
        .map((w) => w.text),
      wpm: liveWpm,
      accuracy: liveAcc,
      wordCombo: m.wordCombo,
      maxWordCombo: m.maxWordCombo,
      wordsCompleted: m.wordsCompleted,
      totalDamageDealt: m.totalDamageDealt,
      totalDamageTaken: m.totalDamageTaken,
      hasErrorLock: hasStrictErrorLock(activeWord, m.typedBuffer),
      opponentAttackGauge: m.opponentAttackGauge,
      aggressionMultiplier: m.aggressionMultiplier,
      intensityTier: m.intensityTier,
      interruptCount: m.interruptCount,
      aiHasAdvantage: nowPerf < m.aiAdvantageUntilMs || m.aggressionMultiplier >= 1.65,
      outcome: m.outcome,
    });
  }, [getActiveElapsedMs]);

  const resetCombatMatch = useCallback(
    (levelToLoad: number, nextState: ArcadeGameState = 'idle') => {
      const nextMatch = createCombatMatchState(levelToLoad, {
        wpm: progression.rollingWpm,
        accuracy: progression.rollingAccuracy,
      });
      matchRef.current = nextMatch;
      stageSimRef.current = createFightingStageSim();
      vfxRef.current = createSharedVfxState();

      keystrokeLogRef.current = [];
      totalKeystrokesRef.current = 0;
      correctKeystrokesRef.current = 0;
      errorCountRef.current = 0;
      completedCharsCountRef.current = 0;
      completedTranscriptWordsRef.current = [];
      startPerfMsRef.current = null;
      pausedAtPerfMsRef.current = null;
      totalPausedMsRef.current = 0;
      hasFinalizedRef.current = false;

      setSelectedLevel(levelToLoad);
      setCompletedSession(null);
      setIsNewBest(false);
      setCopiedCard(false);
      setNewlyUnlockedLevel(null);
      setCountdownValue(3);
      setWaitingFirstKey(nextState === 'playing');
      setGameState(nextState);
      syncHudFromMatch();
    },
    [progression.rollingWpm, progression.rollingAccuracy, syncHudFromMatch]
  );

  const finalizeCombatRound = useCallback(
    (outcome: 'victory' | 'defeat') => {
      if (hasFinalizedRef.current) return;
      hasFinalizedRef.current = true;

      const m = matchRef.current;
      m.outcome = outcome;
      const elapsedMs = Math.max(500, Math.round(getActiveElapsedMs()));

      // Build exact played transcript so deterministic Replay Verification stays 100% honest
      const activeWord = m.wordQueue[m.activeWordIndex]?.text || '';
      const fullWords = [...completedTranscriptWordsRef.current];
      if (m.typedBuffer.length > 0 && activeWord) {
        fullWords.push(activeWord);
      }
      const transcriptText = fullWords.join(' ') || activeWord || 'fight';

      let livePrefixCorrect = 0;
      for (let i = 0; i < m.typedBuffer.length; i++) {
        if (m.typedBuffer[i] === activeWord[i]) livePrefixCorrect++;
      }
      const correctChars = completedCharsCountRef.current + livePrefixCorrect;

      const wpm = computeNetWpm(correctChars, elapsedMs);
      const rawWpm = computeRawWpm(totalKeystrokesRef.current, elapsedMs);
      const accuracy = computeKeystrokeAccuracy(
        correctKeystrokesRef.current,
        totalKeystrokesRef.current
      );
      const p95LatencyMs = computeP95Latency(keystrokeLogRef.current);

      const syntheticPassage: ArcadeTextPassage = {
        textId: `ta-v1-fight-lv${m.level}-${Date.now()}`,
        textVersion: 1,
        title: `Lv.${m.level} ${m.opponent.name} (${m.opponent.roleTitle})`,
        content: transcriptText,
        difficultyAttrs: {
          avgWordLength: 5.5,
          punctuationDensity: m.level >= 5 ? 0.08 : 0.01,
          tier: m.level >= 5 ? 'master' : m.level >= 3 ? 'precision' : 'standard',
        },
        license: 'Original',
        source: 'Cyber-Dojo Fighting Combat Engine v1',
        isActive: true,
        recommendedModes: ['classic'],
      };

      const verification = verifySessionReplay(
        syntheticPassage,
        {
          wpm,
          accuracy,
          durationMs: elapsedMs,
          strictMode: false,
        },
        keystrokeLogRef.current
      );

      const baseXp = computeArcadeXp({
        mode: 'classic',
        wpm,
        accuracy,
        correctChars,
        validationStatus: verification.status,
      });
      const xpEarned =
        outcome === 'victory' ? Math.round(baseXp * (1 + m.level * 0.08)) : Math.round(baseXp * 0.5);

      const session: ArcadeSession = {
        id: `arc-fight-${Date.now()}`,
        mode: 'classic',
        difficulty: m.level >= 5 ? 'master' : m.level >= 3 ? 'precision' : 'standard',
        strictMode: false,
        textId: syntheticPassage.textId,
        textVersion: 1,
        wpm,
        rawWpm,
        accuracy,
        durationMs: elapsedMs,
        correctChars,
        totalKeystrokes: totalKeystrokesRef.current,
        errorCount: errorCountRef.current,
        scoringVersion: SCORING_VERSION,
        xpFormulaVersion: XP_FORMULA_VERSION,
        p95LatencyMs,
        maxCombo: m.maxWordCombo,
        xpEarned,
        isDailyChallenge: false,
        validationStatus: verification.status,
        verification,
        keystrokeLog: [...keystrokeLogRef.current],
        completedAt: new Date().toISOString(),
      };

      // Update local level unlocks & rolling adaptive skill
      const prevHighest = progression.highestUnlockedLevel;
      const nextProg = recordFightingOutcome(progression, {
        level: m.level,
        won: outcome === 'victory',
        wpm,
        accuracy,
      });
      setProgression(nextProg);
      if (outcome === 'victory' && nextProg.highestUnlockedLevel > prevHighest) {
        setNewlyUnlockedLevel(nextProg.highestUnlockedLevel);
      }

      const { isNewBestWpm } = onSessionComplete(session);
      setIsNewBest(isNewBestWpm);
      setCompletedSession(session);
      setWaitingFirstKey(false);
      setGameState('results');
      syncHudFromMatch();
      arcadeAudio.playFightKO(effectiveSoundPackRef.current, outcome === 'victory');
    },
    [getActiveElapsedMs, onSessionComplete, progression, syncHudFromMatch]
  );

  // Launch flows
  const startCountdown = useCallback(() => {
    resetCombatMatch(selectedLevel, 'countdown');
    arcadeAudio.playCountdownTick(effectiveSoundPackRef.current, false);
  }, [resetCombatMatch, selectedLevel]);

  const startInstantFight = useCallback(() => {
    resetCombatMatch(selectedLevel, 'playing');
  }, [resetCombatMatch, selectedLevel]);

  const handleExitToMenu = useCallback(() => {
    exitBrowserFullscreen();
    resetCombatMatch(selectedLevel, 'idle');
    onExitToHub?.();
  }, [exitBrowserFullscreen, onExitToHub, resetCombatMatch, selectedLevel]);

  const handleSelectLevel = useCallback(
    (lvl: number) => {
      if (lvl > progression.highestUnlockedLevel) return;
      const updated = { ...progression, selectedLevel: lvl };
      setProgression(updated);
      saveFightingProgress(updated);
      resetCombatMatch(lvl, 'idle');
    },
    [progression, resetCombatMatch]
  );

  const handleNextLevel = useCallback(() => {
    const nextLvl = selectedLevel + 1;
    const updated = {
      ...progression,
      highestUnlockedLevel: Math.max(progression.highestUnlockedLevel, nextLvl),
      selectedLevel: nextLvl,
    };
    setProgression(updated);
    saveFightingProgress(updated);
    resetCombatMatch(nextLvl, 'playing');
  }, [progression, resetCombatMatch, selectedLevel]);

  const togglePause = useCallback(() => {
    if (gameState === 'playing' && !waitingFirstKey) {
      pausedAtPerfMsRef.current = performance.now();
      setGameState('paused');
    } else if (gameState === 'paused') {
      if (pausedAtPerfMsRef.current !== null) {
        const pausedDuration = performance.now() - pausedAtPerfMsRef.current;
        totalPausedMsRef.current += pausedDuration;
        // Shift AI pause-pressure timestamp so resuming never triggers an instant unfair strike!
        if (matchRef.current.lastKeystrokeMs > 0) {
          matchRef.current.lastKeystrokeMs += pausedDuration;
        }
        pausedAtPerfMsRef.current = null;
      }
      setGameState('playing');
    }
  }, [gameState, waitingFirstKey]);

  // Countdown progression
  useEffect(() => {
    if (gameState !== 'countdown') return;
    const timer = setTimeout(() => {
      if (countdownValue > 1) {
        setCountdownValue((c) => c - 1);
        arcadeAudio.playCountdownTick(effectiveSoundPackRef.current, false);
      } else {
        arcadeAudio.playCountdownTick(effectiveSoundPackRef.current, true);
        setGameState('playing');
        setWaitingFirstKey(true);
      }
    }, 520);
    return () => clearTimeout(timer);
  }, [gameState, countdownValue]);

  // 60fps HiDPI Canvas Render + AI Pressure Tick Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = canvasContainerRef.current;
    if (!canvas || !container) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const reducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    let width = container.clientWidth || 920;
    let height = container.clientHeight || 350;
    let dpr = Math.min(window.devicePixelRatio || 1, 2);

    const resizeCanvas = () => {
      width = Math.max(320, container.clientWidth || 920);
      height = Math.max(260, container.clientHeight || 350);
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      canvasDimsRef.current = { w: width, h: height };
    };

    resizeCanvas();
    const resizeObserver = new ResizeObserver(resizeCanvas);
    resizeObserver.observe(container);

    let rafId = 0;
    let lastTime = performance.now();
    let lastHudSync = lastTime;

    const frame = (now: number) => {
      const dt = Math.min(0.05, Math.max(0.001, (now - lastTime) / 1000));
      lastTime = now;

      const curState = gameStateRef.current;
      const isPlayingActive = curState === 'playing' && !waitingFirstKeyRef.current;
      const m = matchRef.current;
      const activeWord = m.wordQueue[m.activeWordIndex]?.text || '';

      if (isPlayingActive && m.outcome === 'ongoing') {
        const elapsed = getActiveElapsedMs();
        let livePrefixCorrect = 0;
        for (let i = 0; i < m.typedBuffer.length; i++) {
          if (m.typedBuffer[i] === activeWord[i]) livePrefixCorrect++;
        }
        const liveWpm =
          elapsed > 200
            ? computeNetWpm(completedCharsCountRef.current + livePrefixCorrect, elapsed)
            : 0;
        const liveAcc = computeKeystrokeAccuracy(
          correctKeystrokesRef.current,
          totalKeystrokesRef.current
        );

        const tick = stepDynamicCombatTick(m, dt, now, liveWpm, liveAcc);
        if (tick.strikeTriggered) {
          triggerOpponentReactionVisuals(stageSimRef.current, vfxRef.current, {
            type: 'tempo_strike',
            damage: tick.strike.damage,
            callout: tick.strike.callout,
            playerDefeated: tick.strike.playerDefeated,
            w: width,
            h: height,
            reducedMotion,
            shakeEnabled: shakeEnabledRef.current,
          });
          arcadeAudio.playFightCounter(
            effectiveSoundPackRef.current,
            m.aggressionMultiplier >= 1.5
          );
          syncHudFromMatch();
          if (tick.strike.playerDefeated) {
            finalizeCombatRound('defeat');
          }
        }
      }

      const currentWord = m.wordQueue[m.activeWordIndex]?.text || '';
      const errorLocked = hasStrictErrorLock(currentWord, m.typedBuffer);
      const upcomingWords = m.wordQueue
        .slice(m.activeWordIndex + 1, m.activeWordIndex + 4)
        .map((w) => w.text);
      const snapshot: FightingRenderSnapshot = {
        arenaTheme: arenaThemeRef.current,
        opponent: m.opponent,
        targetWord: currentWord,
        typedBuffer: m.typedBuffer,
        upcomingWords,
        wordCombo: m.wordCombo,
        aiPressureRatio: m.opponentAttackGauge,
        aiHasAdvantage: now < m.aiAdvantageUntilMs || m.aggressionMultiplier >= 1.65,
        hasErrorLock: errorLocked,
        aggressionMultiplier: m.aggressionMultiplier,
        intensityTier: m.intensityTier,
        isPlaying: isPlayingActive,
        waitingFirstKey: waitingFirstKeyRef.current,
        outcome: m.outcome,
      };

      if (curState !== 'paused') {
        updateFightingStageSim(stageSimRef.current, snapshot, dt);
        updateSharedVfx(vfxRef.current, dt);
      }

      ctx.save();
      ctx.scale(dpr, dpr);
      if (vfxRef.current.shakeIntensity > 0.1 && !reducedMotion && shakeEnabledRef.current) {
        const sx = (Math.random() - 0.5) * vfxRef.current.shakeIntensity;
        const sy = (Math.random() - 0.5) * vfxRef.current.shakeIntensity;
        ctx.translate(sx, sy);
      }

      renderFightingStage(ctx, stageSimRef.current, snapshot, width, height);
      renderSharedVfx(ctx, vfxRef.current, width, height);
      ctx.restore();

      // Throttled 100ms HUD telemetry update for WPM, attack gauge, and dynamic aggression tier
      if (now - lastHudSync >= 100 && isPlayingActive) {
        lastHudSync = now;
        syncHudFromMatch();
      }

      rafId = requestAnimationFrame(frame);
    };

    rafId = requestAnimationFrame(frame);
    return () => {
      cancelAnimationFrame(rafId);
      resizeObserver.disconnect();
    };
  }, [finalizeCombatRound, getActiveElapsedMs, syncHudFromMatch]);

  // Core keystroke processing (shared by desktop window keydown & mobile virtual keyboard fallback)
  const processCombatKey = useCallback(
    (key: string) => {
      const curState = gameStateRef.current;
      if (curState !== 'playing') return;

      const m = matchRef.current;
      if (m.outcome !== 'ongoing') return;
      const activeEntry = m.wordQueue[m.activeWordIndex];
      if (!activeEntry) return;

      const reducedMotion =
        typeof window !== 'undefined' &&
        window.matchMedia &&
        window.matchMedia('(prefers-reduced-motion: reduce)').matches;

      const nowPerf = performance.now();

      // Backspace handling: clears strict error lock cleanly without erasing accuracy history (E4)
      if (key === 'Backspace') {
        const removed = processStrictBackspace(m);
        if (!removed) return;
        const tOffset =
          startPerfMsRef.current !== null
            ? Math.max(0, nowPerf - startPerfMsRef.current - totalPausedMsRef.current)
            : 0;
        m.lastKeystrokeMs = nowPerf;
        keystrokeLogRef.current.push({
          t: Number(tOffset.toFixed(2)),
          key: 'Backspace',
          expected: activeEntry.text[m.typedBuffer.length] || '',
          correct: false,
          isBackspace: true,
        });
        syncHudFromMatch();
        return;
      }

      if (key.length !== 1) return;

      // E3: Precision clock starts strictly on first keystroke
      if (startPerfMsRef.current === null) {
        startPerfMsRef.current = nowPerf;
        setWaitingFirstKey(false);
        waitingFirstKeyRef.current = false;
      }

      m.lastKeystrokeMs = nowPerf;
      if (activeEntry.startedAtMs === null) {
        activeEntry.startedAtMs = nowPerf;
      }

      // Strict Word Accuracy Engine: blocks forward input if a red typo is locked!
      const inputRes = processStrictCombatCharInput(m, key);
      if (inputRes.blockedByErrorLock) {
        arcadeAudio.playKeystroke(effectiveSoundPackRef.current, false, 'classic', 0);
        syncHudFromMatch();
        return;
      }
      if (!inputRes.accepted) {
        return;
      }

      const tOffset = Math.max(0, nowPerf - startPerfMsRef.current - totalPausedMsRef.current);
      const isCorrect = inputRes.isCorrect;
      totalKeystrokesRef.current += 1;
      if (isCorrect) {
        correctKeystrokesRef.current += 1;
      } else {
        errorCountRef.current += 1;
      }

      const evt: KeystrokeEvent = {
        t: Number(tOffset.toFixed(2)),
        key,
        expected: inputRes.expectedChar,
        correct: isCorrect,
      };
      keystrokeLogRef.current.push(evt);
      requestAnimationFrame(() => {
        evt.renderLatencyMs = Number(Math.max(0.4, performance.now() - nowPerf).toFixed(1));
      });

      const elapsed = Math.max(100, getActiveElapsedMs());
      const liveAcc = computeKeystrokeAccuracy(
        correctKeystrokesRef.current,
        totalKeystrokesRef.current
      );

      if (isCorrect) {
        const liveWpmNow = computeNetWpm(
          completedCharsCountRef.current + m.typedBuffer.length,
          elapsed
        );
        registerAccurateFlowStep(m, false, liveWpmNow, liveAcc);
        arcadeAudio.playKeystroke(effectiveSoundPackRef.current, true, 'classic', m.wordCombo);
        triggerPlayerKeyMomentum(stageSimRef.current, m.wordCombo);

        // Check exact validated word completion -> attack + interrupt enemy gauge!
        if (inputRes.wordCompletedReady) {
          const nextCompletedChars = completedCharsCountRef.current + activeEntry.text.length;
          const liveWpm = computeNetWpm(nextCompletedChars, elapsed);

          const atk = applyWordCompletionAttack(m, liveWpm, liveAcc, activeEntry.wordId);
          if (atk.accepted) {
            completedCharsCountRef.current = nextCompletedChars + 1; // +1 space separator in transcript
            completedTranscriptWordsRef.current.push(activeEntry.text);

            // Log virtual space separator so replay verification matches transcript cleanly
            if (!atk.opponentDefeated) {
              keystrokeLogRef.current.push({
                t: Number((tOffset + 25).toFixed(2)),
                key: ' ',
                expected: ' ',
                correct: true,
              });
            }

            const { w, h } = canvasDimsRef.current;
            triggerPlayerWordAttackVisuals(stageSimRef.current, vfxRef.current, {
              move: atk.move,
              damage: atk.damage,
              isCritical: atk.isCritical,
              interruptedEnemyAttack: atk.interruptedEnemyAttack,
              wordCombo: atk.nextWordCombo,
              opponentDefeated: atk.opponentDefeated,
              w,
              h,
              reducedMotion,
              shakeEnabled: shakeEnabledRef.current,
            });
            arcadeAudio.playFightHit(
              effectiveSoundPackRef.current,
              atk.move === 'combo_attack' || atk.isCritical || atk.interruptedEnemyAttack
            );

            if (atk.opponentDefeated) {
              finalizeCombatRound('victory');
              return;
            }
          }
        }
      } else {
        // Typing mistake -> engages strict red error lock & triggers responsive AI counter
        arcadeAudio.playKeystroke(effectiveSoundPackRef.current, false, 'classic', 0);
        const aiReact = evaluateAiOnMistake(m, nowPerf);
        if (aiReact.triggered && aiReact.type !== 'none') {
          const { w, h } = canvasDimsRef.current;
          triggerOpponentReactionVisuals(stageSimRef.current, vfxRef.current, {
            type: aiReact.type,
            damage: aiReact.damage,
            callout: aiReact.callout,
            playerDefeated: aiReact.playerDefeated,
            w,
            h,
            reducedMotion,
            shakeEnabled: shakeEnabledRef.current,
          });
          if (aiReact.type === 'block') {
            arcadeAudio.playFightBlock(effectiveSoundPackRef.current);
          } else {
            arcadeAudio.playFightCounter(
              effectiveSoundPackRef.current,
              aiReact.type === 'heavy_counter'
            );
          }
          if (aiReact.playerDefeated) {
            finalizeCombatRound('defeat');
            return;
          }
        }
      }

      syncHudFromMatch();
    },
    [finalizeCombatRound, getActiveElapsedMs, syncHudFromMatch]
  );

  // Global low-latency keyboard listener with strict scroll & shortcut prevention
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && target !== mobileInputRef.current && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) {
        return;
      }

      // Prevent browser shortcuts or stray tab/arrow scrolling during active fight
      if (e.ctrlKey || e.metaKey || e.altKey) {
        if (gameStateRef.current === 'playing' && !['r', 'R', 'c', 'C', 'v', 'V'].includes(e.key)) {
          return;
        }
        return;
      }

      if (e.key === 'Escape') {
        if (gameStateRef.current === 'playing' || gameStateRef.current === 'paused') {
          e.preventDefault();
          togglePause();
        }
        return;
      }

      if (gameStateRef.current === 'idle') {
        if (e.key === 'Enter') {
          e.preventDefault();
          startCountdown();
        }
        return;
      }

      if (gameStateRef.current === 'paused') {
        if (e.key === 'Enter') {
          e.preventDefault();
          togglePause();
        }
        return;
      }

      if (gameStateRef.current === 'results') {
        if (e.key === 'Enter') {
          e.preventDefault();
          if (matchRef.current.outcome === 'victory') {
            handleNextLevel();
          } else {
            startInstantFight();
          }
        }
        return;
      }

      if (gameStateRef.current !== 'playing') return;

      // Block page scroll & focus jumps from Space, Tab, Arrow keys, PageUp/Down
      if (
        e.key === ' ' ||
        e.key === 'Tab' ||
        e.key === 'ArrowUp' ||
        e.key === 'ArrowDown' ||
        e.key === 'ArrowLeft' ||
        e.key === 'ArrowRight' ||
        e.key === 'PageUp' ||
        e.key === 'PageDown'
      ) {
        e.preventDefault();
      }

      if (e.key === 'Backspace') {
        e.preventDefault();
        processCombatKey('Backspace');
        return;
      }

      if (e.key.length === 1 && !e.repeat) {
        e.preventDefault();
        processCombatKey(e.key);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleNextLevel, processCombatKey, startCountdown, startInstantFight, togglePause]);

  const handleCopyResultCard = () => {
    if (!completedSession) return;
    const summary = [
      `Cyber-Dojo Showdown — Level ${selectedLevel} (${hud.opponent.name} · ${hud.opponent.roleTitle})`,
      `Outcome: ${hud.outcome === 'victory' ? 'K.O. VICTORY' : 'DEFEAT'} | Fighter: ${profile.handle}`,
      `Net Speed: ${completedSession.wpm} WPM | Accuracy: ${completedSession.accuracy}% | Max Combo: x${hud.maxWordCombo}`,
      `Damage Dealt: ${hud.totalDamageDealt} | XP Earned: +${completedSession.xpEarned}`,
    ].join('\n');

    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(summary).catch(() => {});
    }
    setCopiedCard(true);
    setTimeout(() => setCopiedCard(false), 2000);
  };

  // Level selector buttons: Levels 1..max(6, highestUnlockedLevel + 1)
  const visibleLevels = useMemo(() => {
    const maxDisplay = Math.max(6, progression.highestUnlockedLevel + 1);
    return Array.from({ length: maxDisplay }, (_, i) => i + 1);
  }, [progression.highestUnlockedLevel]);

  const playerHpPct = Math.max(0, Math.min(100, (hud.playerHp / Math.max(1, hud.playerMaxHp)) * 100));
  const opponentHpPct = Math.max(
    0,
    Math.min(100, (hud.opponentHp / Math.max(1, hud.opponentMaxHp)) * 100)
  );
  const comboMult = getComboMultiplier(hud.wordCombo);

  return (
    <div
      className={
        isImmersive
          ? 'fixed inset-0 z-50 h-[100dvh] w-[100vw] bg-[#070A12] flex flex-col overflow-hidden select-none'
          : 'max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-5 animate-fadeIn'
      }
    >
      {/* Pre-Game Lobby Chrome (Hidden completely once the fight starts in fullscreen) */}
      {!isImmersive && (
        <>
          {/* Header & Quick Mode Switcher */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="text-xs font-mono tabular-nums text-amber-400 font-semibold">
                Unlocked Lv.{progression.highestUnlockedLevel}
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                Cyber-Dojo Showdown
              </h1>
            </div>

            {/* Segmented Quick Mode Switcher */}
            <div className="flex flex-wrap items-center gap-1 p-1 rounded-xl bg-[#111622] border border-[#232C40]">
              {(Object.keys(ARCADE_MODES) as ArcadeModeId[]).map((mId) => {
                const active = mId === 'classic';
                return (
                  <button
                    key={mId}
                    type="button"
                    onClick={() => onSelectMode(mId)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap ${
                      active
                        ? 'bg-amber-500 text-slate-950 font-bold'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800/70'
                    }`}
                  >
                    {ARCADE_MODES[mId].shortLabel}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Opponent Level Selector & Audio/Shake Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 py-2.5 px-4 rounded-xl bg-[#111622] border border-[#232C40]">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-xs text-slate-400 font-medium mr-1">Fighter Level:</span>
              {visibleLevels.map((lvl) => {
                const unlocked = lvl <= progression.highestUnlockedLevel;
                const active = lvl === selectedLevel;
                const opp = getOpponentForLevel(lvl, {
                  wpm: progression.rollingWpm,
                  accuracy: progression.rollingAccuracy,
                });
                return (
                  <button
                    key={lvl}
                    type="button"
                    disabled={!unlocked}
                    onClick={() => handleSelectLevel(lvl)}
                    title={
                      unlocked
                        ? `Level ${lvl}: ${opp.name} (${opp.roleTitle})`
                        : `Defeat Level ${lvl - 1} to unlock ${opp.roleTitle}`
                    }
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap ${
                      active
                        ? 'bg-amber-500 text-slate-950 font-bold'
                        : unlocked
                        ? 'bg-[#181F2E] text-slate-300 hover:text-white hover:bg-slate-800 border border-[#232C40]'
                        : 'bg-[#090C12] text-slate-600 border border-[#1A2130] cursor-not-allowed'
                    }`}
                  >
                    {!unlocked && <Lock className="w-3 h-3" />}
                    <span>Lv.{lvl}</span>
                  </button>
                );
              })}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setSfxEnabled((v) => !v)}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-medium transition-colors whitespace-nowrap ${
                  sfxEnabled
                    ? 'bg-[#181F2E] border-[#232C40] text-emerald-400 hover:text-emerald-300'
                    : 'bg-[#090C12] border-[#1F2738] text-slate-500 hover:text-slate-300'
                }`}
              >
                {sfxEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
                <span>{sfxEnabled ? 'SFX On' : 'SFX Off'}</span>
              </button>

              <button
                type="button"
                onClick={() => setShakeEnabled((v) => !v)}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-medium transition-colors whitespace-nowrap ${
                  shakeEnabled
                    ? 'bg-[#181F2E] border-[#232C40] text-amber-400 hover:text-amber-300'
                    : 'bg-[#090C12] border-[#1F2738] text-slate-500 hover:text-slate-300'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>{shakeEnabled ? 'Shake On' : 'Shake Off'}</span>
              </button>

              <span className="text-xs text-slate-400 font-mono tabular-nums pl-1">
                Best:{' '}
                <strong className="text-white">
                  {personalBestWpm !== null ? `${personalBestWpm} WPM` : '--'}
                </strong>
              </span>
            </div>
          </div>
        </>
      )}

      {/* Main Fighting Arena Surface (Lobby preview vs Full-Viewport Game Stage) */}
      <div
        className={
          isImmersive
            ? 'flex-1 min-h-0 flex flex-col bg-[#070A12]'
            : `relative rounded-2xl border ${themeTokens.surface} ${themeTokens.border} p-4 sm:p-6 shadow-2xl space-y-4`
        }
      >
        {/* MODERN COMBAT DASHBOARD HUD (Player HP Left | Live Telemetry Center | Opponent HP & Attack Gauge Right | Fullscreen Controls) */}
        <div
          className={
            isImmersive
              ? 'shrink-0 px-4 sm:px-6 py-2.5 bg-[#0D121D] border-b border-[#1E2638] flex flex-col lg:flex-row lg:items-center gap-3'
              : 'grid grid-cols-1 md:grid-cols-12 gap-3 items-center'
          }
        >
          <div className={isImmersive ? 'flex-1 grid grid-cols-1 md:grid-cols-12 gap-3 items-center' : 'contents'}>
            {/* LEFT: Player Health Bar */}
            <div className="md:col-span-4 space-y-1">
              <div className="flex items-baseline justify-between gap-2 text-xs">
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className="font-bold text-white truncate">{profile.handle}</span>
                  <span className="text-emerald-400 font-medium whitespace-nowrap">· You</span>
                </div>
                <span className="font-mono tabular-nums font-bold text-emerald-400 whitespace-nowrap">
                  {hud.playerHp} / {hud.playerMaxHp} HP
                </span>
              </div>
              <div className="h-3 w-full rounded-full bg-[#090C12] border border-[#232C40] overflow-hidden p-0.5">
                <div
                  className={`h-full rounded-full transition-all duration-200 ${
                    playerHpPct > 50
                      ? 'bg-gradient-to-r from-emerald-500 to-emerald-400'
                      : playerHpPct > 25
                      ? 'bg-gradient-to-r from-amber-500 to-amber-400'
                      : 'bg-gradient-to-r from-rose-600 to-rose-400'
                  }`}
                  style={{ width: `${playerHpPct}%` }}
                />
              </div>
              {isImmersive && (
                <div className="flex items-center justify-between text-[11px] font-mono tabular-nums text-slate-400">
                  <span>Power {comboMult.toFixed(2)}x</span>
                  <span>Interrupts {hud.interruptCount}</span>
                </div>
              )}
            </div>

            {/* CENTER: Level, WPM, Accuracy, Combo */}
            <div className="md:col-span-4 grid grid-cols-4 gap-2 text-center font-mono tabular-nums bg-[#090C12] border border-[#232C40] rounded-xl py-1.5 px-2">
              <div>
                <div className="text-[10px] font-sans text-slate-500">Level</div>
                <div className="text-sm font-bold text-amber-400">Lv.{selectedLevel}</div>
              </div>
              <div>
                <div className="text-[10px] font-sans text-slate-500">WPM</div>
                <div className="text-sm font-bold text-white">{hud.wpm.toFixed(0)}</div>
              </div>
              <div>
                <div className="text-[10px] font-sans text-slate-500">Acc</div>
                <div className="text-sm font-bold text-emerald-400">{hud.accuracy.toFixed(0)}%</div>
              </div>
              <div>
                <div className="text-[10px] font-sans text-slate-500">Combo</div>
                <div className="text-sm font-bold text-amber-300 flex items-center justify-center gap-0.5">
                  {hud.wordCombo >= 3 && <Flame className="w-3 h-3 text-amber-400" />}
                  <span>x{hud.wordCombo}</span>
                </div>
              </div>
            </div>

            {/* RIGHT: Opponent Health Bar + Dynamic Attack Gauge & Aggression Intensity */}
            <div className="md:col-span-4 space-y-1">
              <div className="flex items-baseline justify-between gap-2 text-xs">
                <span className="font-mono tabular-nums font-bold text-rose-400 whitespace-nowrap">
                  {hud.opponentHp} / {hud.opponentMaxHp} HP
                </span>
                <div className="flex items-center gap-1.5 min-w-0 justify-end">
                  <span className="text-slate-400 truncate">{hud.opponent.roleTitle}</span>
                  <span aria-hidden="true" className="text-slate-600">·</span>
                  <span className="font-bold text-white whitespace-nowrap">
                    {hud.opponent.name}
                  </span>
                </div>
              </div>
              <div className="h-3 w-full rounded-full bg-[#090C12] border border-[#232C40] overflow-hidden p-0.5 flex justify-end">
                <div
                  className="h-full rounded-full transition-all duration-200 bg-gradient-to-l from-rose-500 via-amber-500 to-rose-400"
                  style={{ width: `${opponentHpPct}%` }}
                />
              </div>

              {/* Opponent Attack Charge Gauge + Aggression Intensity Label */}
              <div className="space-y-0.5">
                <div className="flex items-center justify-between gap-2 text-[11px] font-mono tabular-nums">
                  <span
                    className={`font-semibold whitespace-nowrap ${
                      hud.intensityTier === 'Overdrive'
                        ? 'text-rose-400'
                        : hud.intensityTier === 'Fierce'
                        ? 'text-orange-400'
                        : hud.intensityTier === 'Pressing'
                        ? 'text-amber-400'
                        : hud.intensityTier === 'Engaged'
                        ? 'text-sky-400'
                        : 'text-slate-400'
                    }`}
                  >
                    {hud.intensityTier} · {hud.aggressionMultiplier.toFixed(2)}x
                  </span>
                  <span
                    className={`whitespace-nowrap ${
                      hud.opponentAttackGauge >= 0.72
                        ? 'text-rose-400 font-bold'
                        : 'text-slate-400'
                    }`}
                  >
                    {hud.opponentAttackGauge >= 0.72
                      ? `Incoming! ${Math.round(hud.opponentAttackGauge * 100)}%`
                      : `Attack Gauge ${Math.round(hud.opponentAttackGauge * 100)}%`}
                  </span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-[#090C12] border border-[#1E2638] overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-100 ${
                      hud.opponentAttackGauge >= 0.72
                        ? 'bg-rose-500'
                        : hud.opponentAttackGauge >= 0.42
                        ? 'bg-amber-400'
                        : 'bg-sky-400'
                    }`}
                    style={{ width: `${Math.min(100, Math.round(hud.opponentAttackGauge * 100))}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Compact In-Game Fullscreen Action Controls */}
          {isImmersive && (
            <div className="flex items-center justify-end gap-1.5 shrink-0 lg:pl-3 lg:border-l lg:border-[#1E2638]">
              <button
                type="button"
                onClick={() => setSfxEnabled((v) => !v)}
                title={sfxEnabled ? 'Mute sound effects' : 'Enable sound effects'}
                className="inline-flex items-center justify-center p-2 rounded-lg bg-[#141B2B] hover:bg-slate-800 border border-[#232C40] text-slate-300 hover:text-white transition-colors"
              >
                {sfxEnabled ? <Volume2 className="w-3.5 h-3.5 text-emerald-400" /> : <VolumeX className="w-3.5 h-3.5 text-slate-500" />}
              </button>

              {isFullscreenSupported && (
                <button
                  type="button"
                  onClick={toggleBrowserFullscreen}
                  title={isBrowserFullscreen ? 'Exit browser fullscreen' : 'Enter browser fullscreen'}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#141B2B] hover:bg-slate-800 border border-[#232C40] text-xs font-semibold text-slate-200 transition-colors whitespace-nowrap"
                >
                  {isBrowserFullscreen ? (
                    <Minimize2 className="w-3.5 h-3.5 text-amber-400" />
                  ) : (
                    <Maximize2 className="w-3.5 h-3.5 text-amber-400" />
                  )}
                  <span className="hidden xl:inline">
                    {isBrowserFullscreen ? 'Windowed' : 'Fullscreen'}
                  </span>
                </button>
              )}

              {(gameState === 'playing' || gameState === 'paused') && (
                <button
                  type="button"
                  onClick={togglePause}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#141B2B] hover:bg-slate-800 border border-[#232C40] text-xs font-semibold text-slate-200 transition-colors whitespace-nowrap"
                >
                  {gameState === 'paused' ? (
                    <>
                      <Play className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Resume</span>
                    </>
                  ) : (
                    <>
                      <Pause className="w-3.5 h-3.5 text-amber-400" />
                      <span>Pause</span>
                    </>
                  )}
                </button>
              )}

              <button
                type="button"
                onClick={startInstantFight}
                title="Restart match"
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#141B2B] hover:bg-slate-800 border border-[#232C40] text-xs font-semibold text-slate-200 transition-colors whitespace-nowrap"
              >
                <RotateCcw className="w-3.5 h-3.5 text-slate-300" />
                <span className="hidden xl:inline">Restart</span>
              </button>

              <button
                type="button"
                onClick={handleExitToMenu}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#141B2B] hover:bg-rose-500/20 border border-[#232C40] hover:border-rose-500/40 text-xs font-semibold text-slate-300 hover:text-rose-200 transition-colors whitespace-nowrap"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Exit</span>
              </button>
            </div>
          )}
        </div>

        {/* 60FPS 2D FIGHTING ARENA STAGE + LEFT/RIGHT FULLSCREEN AD RAILS */}
        <div
          className={
            isImmersive
              ? 'flex-1 min-h-0 flex flex-row overflow-hidden bg-[#070A12]'
              : 'contents'
          }
        >
          {isImmersive && <GameAdRail placement="left" gameMode="classic" />}

          <div
            className={
              isImmersive
                ? 'relative flex-1 min-w-0 min-h-0 flex flex-col'
                : 'relative'
            }
          >
            <div
              ref={canvasContainerRef}
              onClick={() => mobileInputRef.current?.focus()}
              className={
                isImmersive
                  ? 'relative flex-1 min-h-0 w-full overflow-hidden bg-[#070A12]'
                  : 'relative w-full h-[320px] sm:h-[380px] rounded-xl overflow-hidden border border-[#232C40] bg-[#070A12]'
              }
            >
              <canvas
                ref={canvasRef}
                className="block w-full h-full"
                aria-label="2D Cyber-Dojo Fighting Typing Arena"
              />
            </div>

          {/* IDLE PRE-FIGHT OVERLAY */}
          {gameState === 'idle' && (
            <div className="absolute inset-0 z-30 rounded-xl bg-[#090C12]/72 backdrop-blur-[2px] flex flex-col items-center justify-center p-6 text-center gap-4">
              <div className="space-y-1.5 max-w-lg">
                <div className="text-xs font-semibold text-amber-400">
                  Level {selectedLevel} · {hud.opponent.roleTitle}
                </div>
                <h2 className="text-2xl font-extrabold text-white">
                  {profile.handle} vs. {hud.opponent.name}
                </h2>
                <div className="text-xs font-mono tabular-nums text-slate-300">
                  {hud.playerMaxHp} HP vs {hud.opponent.maxHp} HP
                </div>
              </div>
              <div className="flex flex-wrap items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={startCountdown}
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm transition-colors whitespace-nowrap"
                >
                  <Swords className="w-4 h-4" />
                  <span>Start 3-2-1 Fight</span>
                </button>
                <button
                  type="button"
                  onClick={startInstantFight}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#181F2E]/90 hover:bg-slate-800 border border-[#232C40] text-slate-200 font-semibold text-sm transition-colors whitespace-nowrap"
                >
                  <Play className="w-4 h-4 text-emerald-400" />
                  <span>Instant Fight</span>
                </button>
              </div>
            </div>
          )}

          {/* COUNTDOWN OVERLAY */}
          {gameState === 'countdown' && (
            <div className="absolute inset-0 z-30 bg-[#090C12]/74 backdrop-blur-[2px] flex flex-col items-center justify-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-widest text-slate-300">
                Round Ready · Level {selectedLevel}
              </span>
              <span className="text-7xl font-black font-mono tabular-nums text-amber-400">
                {countdownValue}
              </span>
            </div>
          )}

          {/* PAUSED OVERLAY (Stays fullscreen with Resume, Restart, and Exit to Menu) */}
          {gameState === 'paused' && (
            <div className="absolute inset-0 z-30 bg-[#090C12]/84 backdrop-blur-sm flex flex-col items-center justify-center gap-4 p-6">
              <h3 className="text-2xl font-bold text-white">Fight Paused</h3>
              <div className="flex flex-wrap items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={togglePause}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm transition-colors whitespace-nowrap"
                >
                  <Play className="w-4 h-4 fill-slate-950" />
                  <span>Resume Fight</span>
                </button>
                <button
                  type="button"
                  onClick={startInstantFight}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#181F2E] hover:bg-slate-800 border border-[#232C40] text-slate-200 font-semibold text-sm transition-colors whitespace-nowrap"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Restart Match</span>
                </button>
                <button
                  type="button"
                  onClick={handleExitToMenu}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-transparent hover:bg-slate-800/70 border border-[#232C40] text-slate-300 hover:text-white font-semibold text-sm transition-colors whitespace-nowrap"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Exit to Menu</span>
                </button>
              </div>
            </div>
          )}

          {/* VICTORY / DEFEAT OVERLAY (Stays fullscreen with Next Level, Rematch, Share, Exit to Menu) */}
          {gameState === 'results' && completedSession && (
            <div className="absolute inset-0 z-30 bg-[#090C12]/88 backdrop-blur-sm flex flex-col items-center justify-center p-5 text-center gap-5 overflow-y-auto">
              <div className="space-y-1">
                <div className="flex flex-wrap items-center justify-center gap-2 text-xs font-semibold">
                  {hud.outcome === 'victory' ? (
                    <span className="inline-flex items-center gap-1.5 text-emerald-400">
                      <Trophy className="w-4 h-4" />
                      <span>K.O. Victory</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 text-rose-400">
                      <Shield className="w-4 h-4" />
                      <span>Knocked Out</span>
                    </span>
                  )}
                  {newlyUnlockedLevel && (
                    <>
                      <span className="text-slate-600">·</span>
                      <span className="text-amber-400 font-bold">
                        Level {newlyUnlockedLevel} Unlocked
                      </span>
                    </>
                  )}
                  {isNewBest && (
                    <>
                      <span className="text-slate-600">·</span>
                      <span className="text-amber-400 font-bold">New Best WPM</span>
                    </>
                  )}
                </div>

                <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
                  {hud.outcome === 'victory'
                    ? `${hud.opponent.name} Defeated!`
                    : `${hud.opponent.name} Wins the Round`}
                </h2>
              </div>

              {/* Compact Combat Telemetry Strip */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 w-full max-w-2xl font-mono tabular-nums">
                <div className="p-3 rounded-xl bg-[#111622] border border-[#232C40]">
                  <div className="text-[10px] font-sans text-slate-400">Net WPM</div>
                  <div className="text-lg font-bold text-amber-400">{completedSession.wpm}</div>
                </div>
                <div className="p-3 rounded-xl bg-[#111622] border border-[#232C40]">
                  <div className="text-[10px] font-sans text-slate-400">Accuracy</div>
                  <div className="text-lg font-bold text-emerald-400">
                    {completedSession.accuracy}%
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-[#111622] border border-[#232C40]">
                  <div className="text-[10px] font-sans text-slate-400">Max Combo</div>
                  <div className="text-lg font-bold text-white">x{hud.maxWordCombo}</div>
                </div>
                <div className="p-3 rounded-xl bg-[#111622] border border-[#232C40]">
                  <div className="text-[10px] font-sans text-slate-400">Interrupts</div>
                  <div className="text-lg font-bold text-sky-400">{hud.interruptCount}</div>
                </div>
                <div className="p-3 rounded-xl bg-[#111622] border border-[#232C40] col-span-2 sm:col-span-1">
                  <div className="text-[10px] font-sans text-slate-400">Growth XP</div>
                  <div className="text-lg font-bold text-emerald-400">
                    +{completedSession.xpEarned}
                  </div>
                </div>
              </div>

              {/* Post-Match Actions */}
              <div className="flex flex-wrap items-center justify-center gap-2.5">
                {hud.outcome === 'victory' && (
                  <button
                    type="button"
                    onClick={handleNextLevel}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm transition-colors whitespace-nowrap"
                  >
                    <span>Next Level (Lv.{selectedLevel + 1})</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                )}

                <button
                  type="button"
                  onClick={startInstantFight}
                  className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-colors whitespace-nowrap ${
                    hud.outcome === 'victory'
                      ? 'bg-[#181F2E] hover:bg-slate-800 border border-[#232C40] text-slate-200'
                      : 'bg-amber-500 hover:bg-amber-400 text-slate-950'
                  }`}
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Rematch Lv.{selectedLevel}</span>
                </button>

                <button
                  type="button"
                  onClick={handleCopyResultCard}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-[#181F2E] hover:bg-slate-800 border border-[#232C40] text-slate-200 font-semibold text-xs transition-colors whitespace-nowrap"
                >
                  {copiedCard ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-slate-400" />
                      <span>Share Card</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleExitToMenu}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-[#181F2E] hover:bg-slate-800 border border-[#232C40] text-slate-300 hover:text-white font-semibold text-xs transition-colors whitespace-nowrap"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Exit to Menu</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    exitBrowserFullscreen();
                    onOpenModes();
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-slate-400 hover:text-white font-semibold text-xs transition-colors whitespace-nowrap"
                >
                  <span>All Modes</span>
                </button>
              </div>
            </div>
          )}
          </div>

          {isImmersive && <GameAdRail placement="right" gameMode="classic" />}
        </div>

        {/* Mobile Virtual Keyboard Focus Trigger (only rendered on narrow touch screens while playing) */}
        {gameState === 'playing' && (
          <div className="sm:hidden shrink-0 p-2 bg-[#0D121D] border-t border-[#1E2638]">
            <input
              ref={mobileInputRef}
              type="text"
              value=""
              autoComplete="off"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              placeholder="Tap here to open mobile keyboard..."
              onChange={(e) => {
                const val = e.target.value;
                if (val.length > 0) {
                  const lastChar = val[val.length - 1];
                  processCombatKey(lastChar);
                }
              }}
              onKeyDown={(e) => {
                if (e.key === 'Backspace') {
                  e.preventDefault();
                  processCombatKey('Backspace');
                }
              }}
              className="w-full px-3.5 py-2 rounded-lg bg-[#090C12] border border-[#232C40] text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
            />
          </div>
        )}
      </div>
    </div>
  );
};
