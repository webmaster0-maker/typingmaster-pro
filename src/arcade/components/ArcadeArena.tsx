import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ArcadeDifficulty,
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
  computeRhythmScore,
  verifySessionReplay,
} from '../arcadeEngine';
import {
  getDailyChallengePassage,
  getFreshPassageForMode,
  getTodayArcadeDate,
} from '../arcadeCorpus';
import { arcadeAudio } from '../arcadeAudio';
import {
  SynthwaveMusicState,
  SynthwavePlaybackState,
  createSynthwaveMusicState,
  onSynthwaveCorrectKey,
  onSynthwaveError,
  onSynthwaveWordClear,
  resetSynthwaveMusicState,
  synthwaveMusic,
} from '../synthwaveMusic';
import { ArcadeGameCanvas } from './ArcadeGameCanvas';
import { GameAdRail } from './GameAdRail';
import { useFullscreenControl } from '../useFullscreenControl';
import {
  ARCADE_GAME_WORLDS,
  GameVisualBridge,
  computeBossHpPercent,
  extractActiveWordState,
} from '../games/gameWorldTypes';
import {
  Activity,
  Check,
  Copy,
  LogOut,
  Maximize2,
  Minimize2,
  Pause,
  Play,
  RotateCcw,
  Shield,
  Shuffle,
  Timer,
  Volume2,
  VolumeX,
  Zap,
} from 'lucide-react';

interface ArcadeArenaProps {
  mode: ArcadeModeId;
  initialDifficulty?: ArcadeDifficulty;
  isDailyChallenge?: boolean;
  autoStart?: boolean;
  profile: ArcadeProfile;
  personalBestWpm: number | null;
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

export const ArcadeArena: React.FC<ArcadeArenaProps> = ({
  mode,
  initialDifficulty = 'standard',
  isDailyChallenge = false,
  autoStart = false,
  profile,
  personalBestWpm,
  onSelectMode,
  onSessionComplete,
  onOpenModes,
  onExitToHub,
  onImmersiveChange,
}) => {
  const modeConfig = ARCADE_MODES[mode];
  const worldMeta = ARCADE_GAME_WORLDS[mode];
  const themeTokens = ARENA_THEME_CLASSES[profile.equipped.arenaTheme] || ARENA_THEME_CLASSES.theme_obsidian;

  const [difficulty, setDifficulty] = useState<ArcadeDifficulty>(
    mode === 'challenge' ? 'master' : initialDifficulty
  );
  const [strictMode, setStrictMode] = useState<boolean>(modeConfig.defaultStrict);
  const [passage, setPassage] = useState<ArcadeTextPassage>(() =>
    isDailyChallenge
      ? getDailyChallengePassage()
      : getFreshPassageForMode(mode, mode === 'challenge' ? 'master' : initialDifficulty)
  );
  const passageRef = useRef<ArcadeTextPassage>(passage);
  passageRef.current = passage;

  const [gameState, setGameState] = useState<ArcadeGameState>(() =>
    autoStart ? 'countdown' : 'idle'
  );
  const [countdownValue, setCountdownValue] = useState<number>(3);
  const [waitingFirstKey, setWaitingFirstKey] = useState<boolean>(false);
  const [runVersion, setRunVersion] = useState<number>(0);

  // Rendered typing buffer state (updated cleanly without heavy animation on surface)
  const [typedChars, setTypedChars] = useState<string[]>([]);
  const [hudStats, setHudStats] = useState({
    wpm: 0,
    rawWpm: 0,
    accuracy: 100,
    elapsedMs: 0,
    errors: 0,
    combo: 0,
    maxCombo: 0,
    rhythmScore: 100,
    lastLatencyMs: 0,
  });

  const [completedSession, setCompletedSession] = useState<ArcadeSession | null>(null);
  const [isNewBest, setIsNewBest] = useState<boolean>(false);
  const [copiedCard, setCopiedCard] = useState<boolean>(false);
  const [shieldBroken, setShieldBroken] = useState<boolean>(false);
  const [rhythmBeatPhase, setRhythmBeatPhase] = useState<boolean>(false);
  const [musicEnabled, setMusicEnabled] = useState<boolean>(true);
  const [musicUiState, setMusicUiState] = useState<{
    playbackState: SynthwavePlaybackState;
    activeLayer: 0 | 1 | 2 | 3;
  }>({ playbackState: 'idle', activeLayer: 0 });

  const isSynthMuted = !musicEnabled || profile.equipped.soundPack === 'sound_muted';

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
      arcadeAudio.playCountdownTick(profile.equipped.soundPack, false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    return () => {
      synthwaveMusic.stop();
      onImmersiveChange?.(false);
    };
  }, [onImmersiveChange]);

  // Ref-driven high-precision engine state (E3, E7)
  const typedBufferRef = useRef<string[]>([]);
  const keystrokeLogRef = useRef<KeystrokeEvent[]>([]);
  const totalKeystrokesRef = useRef<number>(0);
  const correctKeystrokesRef = useRef<number>(0);
  const errorCountRef = useRef<number>(0);
  const comboRef = useRef<number>(0);
  const maxComboRef = useRef<number>(0);
  const startPerfMsRef = useRef<number | null>(null);
  const pausedAtPerfMsRef = useRef<number | null>(null);
  const totalPausedMsRef = useRef<number>(0);
  const hasFinalizedRef = useRef<boolean>(false);
  const musicStateRef = useRef<SynthwaveMusicState>(createSynthwaveMusicState());
  const currentWordHadErrorRef = useRef<boolean>(false);

  // Ref-driven 60fps 2D Canvas Visual Bridge (zero per-frame React re-renders)
  const visualBridgeRef = useRef<GameVisualBridge>({
    mode,
    gameState: 'idle',
    waitingFirstKey: false,
    countdownValue: 3,
    arenaTheme: profile.equipped.arenaTheme,
    wpm: 0,
    accuracy: 100,
    progress: 0,
    combo: 0,
    errors: 0,
    errorBudget: modeConfig.errorBudget,
    rhythmScore: 100,
    activeWord: extractActiveWordState(passage.content, 0),
    events: [],
  });

  // Sync non-hot state into the visual bridge cleanly
  useEffect(() => {
    const b = visualBridgeRef.current;
    b.mode = mode;
    b.gameState = gameState;
    b.waitingFirstKey = waitingFirstKey;
    b.countdownValue = countdownValue;
    b.arenaTheme = profile.equipped.arenaTheme;
    b.errorBudget = modeConfig.errorBudget;
    b.activeWord = extractActiveWordState(
      passage.content,
      typedBufferRef.current.length,
      typedBufferRef.current
    );
  }, [
    mode,
    gameState,
    waitingFirstKey,
    countdownValue,
    profile.equipped.arenaTheme,
    modeConfig.errorBudget,
    passage.content,
  ]);

  // Sync passage when mode / daily changes
  useEffect(() => {
    const nextDiff = mode === 'challenge' ? 'master' : difficulty;
    const nextPassage = isDailyChallenge
      ? getDailyChallengePassage()
      : getFreshPassageForMode(mode, nextDiff, passageRef.current.textId);
    passageRef.current = nextPassage;
    setPassage(nextPassage);
    setStrictMode(ARCADE_MODES[mode].defaultStrict);
    resetRunState(nextPassage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, isDailyChallenge]);

  const resetRunState = useCallback((overridePassage?: ArcadeTextPassage) => {
    const activeP = overridePassage ?? passageRef.current;
    typedBufferRef.current = [];
    keystrokeLogRef.current = [];
    totalKeystrokesRef.current = 0;
    correctKeystrokesRef.current = 0;
    errorCountRef.current = 0;
    comboRef.current = 0;
    maxComboRef.current = 0;
    startPerfMsRef.current = null;
    pausedAtPerfMsRef.current = null;
    totalPausedMsRef.current = 0;
    hasFinalizedRef.current = false;
    currentWordHadErrorRef.current = false;
    musicStateRef.current = resetSynthwaveMusicState();
    synthwaveMusic.stop();
    setMusicUiState({ playbackState: 'idle', activeLayer: 0 });

    setTypedChars([]);
    setCompletedSession(null);
    setIsNewBest(false);
    setCopiedCard(false);
    setShieldBroken(false);
    setWaitingFirstKey(false);
    setGameState('idle');
    setCountdownValue(3);
    setRunVersion((v) => v + 1);
    visualBridgeRef.current.wpm = 0;
    visualBridgeRef.current.accuracy = 100;
    visualBridgeRef.current.progress = 0;
    visualBridgeRef.current.combo = 0;
    visualBridgeRef.current.errors = 0;
    visualBridgeRef.current.rhythmScore = 100;
    visualBridgeRef.current.activeWord = extractActiveWordState(activeP.content, 0);
    visualBridgeRef.current.events = [];
    setHudStats({
      wpm: 0,
      rawWpm: 0,
      accuracy: 100,
      elapsedMs: 0,
      errors: 0,
      combo: 0,
      maxCombo: 0,
      rhythmScore: 100,
      lastLatencyMs: 0,
    });
  }, []);

  const loadFreshPassageIfAllowed = useCallback(
    (targetDiff?: ArcadeDifficulty): ArcadeTextPassage => {
      if (isDailyChallenge) {
        return passageRef.current;
      }
      const effDiff = targetDiff ?? (mode === 'challenge' ? 'master' : difficulty);
      const next = getFreshPassageForMode(mode, effDiff, passageRef.current.textId);
      passageRef.current = next;
      setPassage(next);
      return next;
    },
    [isDailyChallenge, mode, difficulty]
  );

  const handleChangeDifficulty = (nextDiff: ArcadeDifficulty) => {
    setDifficulty(nextDiff);
    const next = loadFreshPassageIfAllowed(nextDiff);
    resetRunState(next);
  };

  const handleShufflePassage = () => {
    if (isDailyChallenge) return;
    const next = loadFreshPassageIfAllowed();
    resetRunState(next);
  };

  // Starting from Idle uses the freshly loaded preview passage; starting from any other state loads a brand-new unseen passage
  const startCountdown = useCallback(() => {
    const next = gameState === 'idle' ? passageRef.current : loadFreshPassageIfAllowed();
    resetRunState(next);
    setGameState('countdown');
    setCountdownValue(3);
    arcadeAudio.playCountdownTick(profile.equipped.soundPack, false);
  }, [gameState, loadFreshPassageIfAllowed, resetRunState, profile.equipped.soundPack]);

  const startInstantReady = useCallback(() => {
    const next = gameState === 'idle' ? passageRef.current : loadFreshPassageIfAllowed();
    resetRunState(next);
    setGameState('playing');
    setWaitingFirstKey(true);
  }, [gameState, loadFreshPassageIfAllowed, resetRunState]);

  // Guaranteed fresh paragraph on Restart & Play Again (Daily stays fixed per calendar seed)
  const restartWithFreshPassage = useCallback(() => {
    const next = loadFreshPassageIfAllowed();
    resetRunState(next);
    setGameState('playing');
    setWaitingFirstKey(true);
  }, [loadFreshPassageIfAllowed, resetRunState]);

  const handleExitToMenu = useCallback(() => {
    synthwaveMusic.stop();
    exitBrowserFullscreen();
    resetRunState();
    onExitToHub?.();
  }, [exitBrowserFullscreen, onExitToHub, resetRunState]);

  // Countdown progression (snappy 550ms per tick -> transitions to playing awaiting first keystroke per E3)
  useEffect(() => {
    if (gameState !== 'countdown') return;
    const timer = setTimeout(() => {
      if (countdownValue > 1) {
        setCountdownValue((c) => c - 1);
        arcadeAudio.playCountdownTick(profile.equipped.soundPack, false);
      } else {
        arcadeAudio.playCountdownTick(profile.equipped.soundPack, true);
        setGameState('playing');
        setWaitingFirstKey(true);
      }
    }, 520);
    return () => clearTimeout(timer);
  }, [gameState, countdownValue, profile.equipped.soundPack]);

  const getActiveElapsedMs = useCallback((): number => {
    if (startPerfMsRef.current === null) return 0;
    const now = pausedAtPerfMsRef.current ?? performance.now();
    return Math.max(0, now - startPerfMsRef.current - totalPausedMsRef.current);
  }, []);

  const finalizeRun = useCallback(
    (forcedElapsedMs?: number, didBreakShield: boolean = false) => {
      if (hasFinalizedRef.current) return;
      hasFinalizedRef.current = true;

      const elapsedMs = Math.max(
        100,
        Math.round(forcedElapsedMs ?? getActiveElapsedMs())
      );

      // E1: Net correct characters in final typed buffer
      const buf = typedBufferRef.current;
      let correctChars = 0;
      for (let i = 0; i < buf.length; i++) {
        if (buf[i] === passage.content[i]) {
          correctChars++;
        }
      }

      const wpm = computeNetWpm(correctChars, elapsedMs);
      const rawWpm = computeRawWpm(totalKeystrokesRef.current, elapsedMs);
      const accuracy = computeKeystrokeAccuracy(
        correctKeystrokesRef.current,
        totalKeystrokesRef.current
      );
      const rhythmScore = computeRhythmScore(keystrokeLogRef.current);
      const p95LatencyMs = computeP95Latency(keystrokeLogRef.current);

      // §4.3 Deterministic Replay Verification
      const verification = verifySessionReplay(
        passage,
        {
          wpm,
          accuracy,
          durationMs: elapsedMs,
          strictMode,
        },
        keystrokeLogRef.current
      );

      const xpEarned = didBreakShield
        ? Math.round(
            computeArcadeXp({
              mode,
              wpm,
              accuracy,
              correctChars,
              isDailyChallenge,
              validationStatus: verification.status,
            }) * 0.45
          )
        : computeArcadeXp({
            mode,
            wpm,
            accuracy,
            correctChars,
            isDailyChallenge,
            validationStatus: verification.status,
          });

      const session: ArcadeSession = {
        id: `arc-${Date.now()}`,
        mode,
        difficulty: mode === 'challenge' ? 'master' : difficulty,
        strictMode,
        textId: passage.textId,
        textVersion: passage.textVersion,
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
        rhythmScore: mode === 'rhythm' ? rhythmScore : undefined,
        maxCombo: maxComboRef.current,
        xpEarned,
        isDailyChallenge,
        dailyDate: isDailyChallenge ? getTodayArcadeDate() : undefined,
        validationStatus: verification.status,
        verification,
        keystrokeLog: [...keystrokeLogRef.current],
        completedAt: new Date().toISOString(),
      };

      setShieldBroken(didBreakShield);
      setCompletedSession(session);
      setGameState('results');
      setWaitingFirstKey(false);

      visualBridgeRef.current.progress = Math.min(
        1,
        typedBufferRef.current.length / Math.max(1, passage.content.length)
      );
      visualBridgeRef.current.events.push({
        type: didBreakShield ? 'shield_break' : 'victory',
        wpm,
        combo: maxComboRef.current,
      });

      synthwaveMusic.stop();
      musicStateRef.current = resetSynthwaveMusicState();
      setMusicUiState({ playbackState: 'idle', activeLayer: 0 });

      const { isNewBestWpm } = onSessionComplete(session);
      setIsNewBest(isNewBestWpm);
      arcadeAudio.playVictory(profile.equipped.soundPack);
    },
    [
      getActiveElapsedMs,
      passage,
      strictMode,
      mode,
      difficulty,
      isDailyChallenge,
      onSessionComplete,
      profile.equipped.soundPack,
    ]
  );

  // Throttled HUD refresh loop (120ms) + timed mode clock enforcement
  useEffect(() => {
    if (gameState !== 'playing' || waitingFirstKey) return;

    const interval = setInterval(() => {
      const elapsed = getActiveElapsedMs();
      if (modeConfig.durationSeconds && elapsed >= modeConfig.durationSeconds * 1000) {
        finalizeRun(modeConfig.durationSeconds * 1000, false);
        return;
      }

      const buf = typedBufferRef.current;
      let correctChars = 0;
      for (let i = 0; i < buf.length; i++) {
        if (buf[i] === passage.content[i]) correctChars++;
      }

      const liveWpm = computeNetWpm(correctChars, elapsed);
      const liveAcc = computeKeystrokeAccuracy(
        correctKeystrokesRef.current,
        totalKeystrokesRef.current
      );
      const liveRhythm =
        mode === 'rhythm' ? computeRhythmScore(keystrokeLogRef.current) : visualBridgeRef.current.rhythmScore;

      visualBridgeRef.current.wpm = liveWpm;
      visualBridgeRef.current.accuracy = liveAcc;
      visualBridgeRef.current.rhythmScore = liveRhythm;

      setHudStats((prev) => ({
        ...prev,
        wpm: liveWpm,
        rawWpm: computeRawWpm(totalKeystrokesRef.current, elapsed),
        accuracy: liveAcc,
        elapsedMs: elapsed,
        errors: errorCountRef.current,
        combo: comboRef.current,
        maxCombo: maxComboRef.current,
        rhythmScore: liveRhythm,
      }));
    }, 120);

    return () => clearInterval(interval);
  }, [gameState, waitingFirstKey, getActiveElapsedMs, modeConfig.durationSeconds, passage.content, mode, finalizeRun]);

  // Sync reactive Synthwave Pulse music with mute toggle, pause, and active gameplay
  useEffect(() => {
    if (mode !== 'rhythm' || gameState !== 'playing' || waitingFirstKey) {
      synthwaveMusic.sync(resetSynthwaveMusicState(), true);
      return;
    }
    synthwaveMusic.sync(musicStateRef.current, isSynthMuted);
  }, [mode, gameState, waitingFirstKey, isSynthMuted]);

  // Rhythm Mode visual beat pulse synced with Synthwave Pulse tempo
  useEffect(() => {
    if (
      mode !== 'rhythm' ||
      gameState !== 'playing' ||
      waitingFirstKey ||
      isSynthMuted ||
      musicUiState.playbackState === 'stopped'
    ) {
      setRhythmBeatPhase(false);
      return;
    }
    const beatMs = musicUiState.playbackState === 'glitched' ? 385 : 268;
    const pulse = setInterval(() => {
      setRhythmBeatPhase((p) => !p);
    }, beatMs);
    return () => clearInterval(pulse);
  }, [mode, gameState, waitingFirstKey, isSynthMuted, musicUiState.playbackState]);

  const togglePause = useCallback(() => {
    if (gameState === 'playing' && !waitingFirstKey) {
      pausedAtPerfMsRef.current = performance.now();
      synthwaveMusic.sync(musicStateRef.current, true);
      setGameState('paused');
    } else if (gameState === 'paused') {
      if (pausedAtPerfMsRef.current !== null) {
        totalPausedMsRef.current += performance.now() - pausedAtPerfMsRef.current;
        pausedAtPerfMsRef.current = null;
      }
      setGameState('playing');
    }
  }, [gameState, waitingFirstKey]);

  // Low-latency keydown input loop (E3, E4, E5, E7)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable)
      ) {
        return;
      }

      if (e.ctrlKey || e.metaKey || e.altKey) return;

      if (e.key === 'Escape') {
        if (gameState === 'playing' || gameState === 'paused') {
          e.preventDefault();
          togglePause();
        }
        return;
      }

      if (gameState === 'idle') {
        if (e.key === 'Enter') {
          e.preventDefault();
          startCountdown();
        }
        return;
      }

      if (gameState === 'paused') {
        if (e.key === 'Enter') {
          e.preventDefault();
          togglePause();
        }
        return;
      }

      if (gameState === 'results') {
        if (e.key === 'Enter') {
          e.preventDefault();
          restartWithFreshPassage();
        }
        return;
      }

      if (gameState !== 'playing') return;

      const ignored = [
        'Shift',
        'Control',
        'Alt',
        'Meta',
        'CapsLock',
        'Tab',
        'ArrowUp',
        'ArrowDown',
        'ArrowLeft',
        'ArrowRight',
        'Dead',
      ];
      if (ignored.includes(e.key)) return;

      if (e.key === 'Backspace') {
        e.preventDefault();
        if (typedBufferRef.current.length === 0) return;

        const keyPerf = performance.now();
        const tOffset =
          startPerfMsRef.current !== null
            ? Math.max(0, keyPerf - startPerfMsRef.current - totalPausedMsRef.current)
            : 0;

        // E4: Backspace moves buffer back but NEVER erases recorded keystroke errors
        typedBufferRef.current.pop();
        comboRef.current = 0;

        const evt: KeystrokeEvent = {
          t: Number(tOffset.toFixed(2)),
          key: 'Backspace',
          expected: passage.content[typedBufferRef.current.length] || '',
          correct: false,
          isBackspace: true,
        };
        keystrokeLogRef.current.push(evt);
        visualBridgeRef.current.combo = 0;
        visualBridgeRef.current.progress = typedBufferRef.current.length / Math.max(1, passage.content.length);
        visualBridgeRef.current.activeWord = extractActiveWordState(
          passage.content,
          typedBufferRef.current.length,
          typedBufferRef.current
        );
        setTypedChars([...typedBufferRef.current]);
        return;
      }

      if (e.key.length !== 1) return;
      e.preventDefault();
      if (e.repeat) return;

      const keyPerf = performance.now();

      // E3: Timing starts strictly on the first keystroke after countdown completes
      if (startPerfMsRef.current === null) {
        startPerfMsRef.current = keyPerf;
        setWaitingFirstKey(false);
        visualBridgeRef.current.waitingFirstKey = false;
      }

      const tOffset = Math.max(0, keyPerf - startPerfMsRef.current - totalPausedMsRef.current);
      const currentIdx = typedBufferRef.current.length;
      const expected = passage.content[currentIdx];
      if (!expected) return;

      const isCorrect = e.key === expected;
      totalKeystrokesRef.current += 1;

      if (isCorrect) {
        correctKeystrokesRef.current += 1;
        comboRef.current += 1;
        if (comboRef.current > maxComboRef.current) {
          maxComboRef.current = comboRef.current;
        }
      } else {
        errorCountRef.current += 1;
        comboRef.current = 0;
      }

      arcadeAudio.playKeystroke(profile.equipped.soundPack, isCorrect, mode, comboRef.current);

      const evt: KeystrokeEvent = {
        t: Number(tOffset.toFixed(2)),
        key: e.key,
        expected,
        correct: isCorrect,
      };
      keystrokeLogRef.current.push(evt);

      const prevWordIdx = extractActiveWordState(passage.content, currentIdx).wordIndex;

      // E5: Progress continues past errors unless strictMode is active
      if (!strictMode || isCorrect) {
        typedBufferRef.current.push(e.key);
      }

      const nextLen = typedBufferRef.current.length;
      const nextWordState = extractActiveWordState(
        passage.content,
        nextLen,
        typedBufferRef.current
      );

      // Feed 60fps 2D Canvas World synchronously (zero React delay)
      const b = visualBridgeRef.current;
      b.combo = comboRef.current;
      b.errors = errorCountRef.current;
      b.progress = nextLen / Math.max(1, passage.content.length);
      b.activeWord = nextWordState;

      const completedWord =
        isCorrect &&
        (expected === ' ' ||
          nextLen >= passage.content.length ||
          nextWordState.wordIndex > prevWordIdx);

      if (!isCorrect) {
        b.events.push({ type: 'key_miss' });
        if (mode === 'rhythm') {
          currentWordHadErrorRef.current = true;
          const prevPlayback = musicStateRef.current.playbackState;
          const nextMusic = onSynthwaveError(musicStateRef.current);
          musicStateRef.current = nextMusic;
          setMusicUiState({
            playbackState: nextMusic.playbackState,
            activeLayer: nextMusic.activeLayer,
          });
          if (nextMusic.playbackState === 'stopped' && prevPlayback !== 'stopped') {
            synthwaveMusic.triggerTapeStopFx(isSynthMuted);
          } else if (nextMusic.playbackState === 'glitched') {
            synthwaveMusic.triggerGlitchFx(isSynthMuted);
            synthwaveMusic.sync(nextMusic, isSynthMuted);
          }
        }
      } else if (completedWord) {
        b.events.push({ type: 'word_clear', combo: comboRef.current });
        arcadeAudio.playWordClear(profile.equipped.soundPack, mode);
        if (mode === 'rhythm') {
          const nextMusic = onSynthwaveWordClear(
            musicStateRef.current,
            currentWordHadErrorRef.current
          );
          currentWordHadErrorRef.current = false;
          musicStateRef.current = nextMusic;
          setMusicUiState({
            playbackState: nextMusic.playbackState,
            activeLayer: nextMusic.activeLayer,
          });
          synthwaveMusic.sync(nextMusic, isSynthMuted);
        }
      } else {
        b.events.push({ type: 'key_hit', combo: comboRef.current });
        if (mode === 'rhythm') {
          const nextMusic = onSynthwaveCorrectKey(musicStateRef.current);
          musicStateRef.current = nextMusic;
          setMusicUiState({
            playbackState: nextMusic.playbackState,
            activeLayer: nextMusic.activeLayer,
          });
          synthwaveMusic.sync(nextMusic, isSynthMuted);
        }
      }

      const nextBuf = [...typedBufferRef.current];
      setTypedChars(nextBuf);

      // Measure keystroke -> paint latency via rAF (E7 budget < 50ms, target < 16ms)
      requestAnimationFrame(() => {
        const latency = Math.max(0.4, performance.now() - keyPerf);
        evt.renderLatencyMs = Number(latency.toFixed(1));
        setHudStats((prev) => ({
          ...prev,
          errors: errorCountRef.current,
          combo: comboRef.current,
          maxCombo: maxComboRef.current,
          lastLatencyMs: evt.renderLatencyMs ?? prev.lastLatencyMs,
        }));
      });

      // Check Accuracy Master error budget shield
      if (
        modeConfig.errorBudget !== null &&
        errorCountRef.current > modeConfig.errorBudget
      ) {
        finalizeRun(tOffset, true);
        return;
      }

      // Completion when full passage is reached
      if (typedBufferRef.current.length >= passage.content.length) {
        finalizeRun(tOffset, false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    gameState,
    passage.content,
    strictMode,
    mode,
    isSynthMuted,
    modeConfig.errorBudget,
    profile.equipped.soundPack,
    togglePause,
    startCountdown,
    restartWithFreshPassage,
    finalizeRun,
  ]);

  const progressPct = Math.min(
    100,
    Math.round((typedChars.length / Math.max(1, passage.content.length)) * 100)
  );

  const remainingSeconds = modeConfig.durationSeconds
    ? Math.max(0, Math.ceil(modeConfig.durationSeconds - hudStats.elapsedMs / 1000))
    : null;

  const formatClock = (ms: number) => {
    const totalSec = Math.floor(ms / 1000);
    const m = Math.floor(totalSec / 60);
    const s = totalSec % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const handleCopyResultCard = () => {
    if (!completedSession) return;
    const summary = [
      `Typing Arcade — ${modeConfig.name}${completedSession.isDailyChallenge ? ` (Daily ${completedSession.dailyDate})` : ''}`,
      `Player: ${profile.handle}`,
      `Net Speed: ${completedSession.wpm} WPM | Accuracy: ${completedSession.accuracy}% | Errors: ${completedSession.errorCount}`,
      `Replay Status: ${completedSession.validationStatus.toUpperCase()} (${completedSession.verification.nonce})`,
    ].join('\n');

    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(summary).catch(() => {});
    }
    setCopiedCard(true);
    setTimeout(() => setCopiedCard(false), 2000);
  };

  const comboTier =
    hudStats.combo >= 40 ? '2.0x' : hudStats.combo >= 20 ? '1.5x' : hudStats.combo >= 10 ? '1.2x' : '1.0x';

  return (
    <div
      className={
        isImmersive
          ? 'fixed inset-0 z-50 h-[100dvh] w-[100vw] bg-[#070A12] flex flex-col overflow-hidden select-none'
          : 'max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6 animate-fadeIn'
      }
    >
      {/* Pre-Game Lobby Chrome (Hidden completely during active fullscreen gameplay) */}
      {!isImmersive && (
        <>
          {/* Mode Selector Bar & Controls */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              {worldMeta.gameTitle}
            </h1>

            {/* Segmented Quick Mode Switcher */}
            {!isDailyChallenge && (
              <div className="flex flex-wrap items-center gap-1 p-1 rounded-xl bg-[#111622] border border-[#232C40]">
                {(Object.keys(ARCADE_MODES) as ArcadeModeId[]).map((mId) => {
                  const active = mId === mode;
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
            )}
          </div>

          {/* Pre-Run Configuration Strip (Difficulty / Strict Mode / Passage Shuffle) */}
          <div className="flex flex-wrap items-center justify-between gap-3 py-2.5 px-4 rounded-xl bg-[#111622] border border-[#232C40]">
            <div className="flex flex-wrap items-center gap-3">
              {modeConfig.supportsDifficulty && !isDailyChallenge && (
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-slate-400 font-medium">Tier:</span>
                  <div className="inline-flex items-center gap-1 p-0.5 rounded-lg bg-[#090C12] border border-[#232C40]">
                    {(['standard', 'precision', 'master'] as ArcadeDifficulty[]).map((tier) => (
                      <button
                        key={tier}
                        type="button"
                        onClick={() => handleChangeDifficulty(tier)}
                        className={`px-2.5 py-1 rounded-md text-xs font-semibold capitalize transition-colors whitespace-nowrap ${
                          difficulty === tier
                            ? 'bg-slate-800 text-amber-400'
                            : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        {tier}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {modeConfig.allowStrictOption && (
                <label className="inline-flex items-center gap-2 text-xs text-slate-300 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={strictMode}
                    onChange={(e) => {
                      setStrictMode(e.target.checked);
                      resetRunState();
                    }}
                    className="rounded border-slate-700 bg-[#090C12] text-emerald-500 focus:ring-emerald-500"
                  />
                  <span>Strict Lock (stop on error)</span>
                </label>
              )}

              {!isDailyChallenge && (
                <button
                  type="button"
                  onClick={handleShufflePassage}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[#181F2E] hover:bg-slate-800 border border-[#232C40] text-xs font-medium text-slate-300 hover:text-white transition-colors whitespace-nowrap"
                >
                  <Shuffle className="w-3.5 h-3.5 text-amber-400" />
                  <span>New Passage</span>
                </button>
              )}
            </div>

            <div className="flex items-center gap-4 text-xs text-slate-400 font-mono tabular-nums">
              <span>
                Best:{' '}
                <strong className="text-amber-400">
                  {personalBestWpm !== null ? `${personalBestWpm} WPM` : '--'}
                </strong>
              </span>
            </div>
          </div>
        </>
      )}

      {/* Slim In-Game Fullscreen Telemetry & Controls Bar */}
      {isImmersive && (
        <div className="shrink-0 bg-[#0D121D] border-b border-[#1E2638] px-4 sm:px-6 py-2.5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            {/* Left: World Name & Progress */}
            <div className="flex items-center gap-3 min-w-0">
              <div className="min-w-0">
                <div className="text-sm font-extrabold text-white truncate">
                  {worldMeta.gameTitle}
                </div>
                <div className="text-[11px] font-mono tabular-nums text-slate-400 whitespace-nowrap">
                  {progressPct}%
                </div>
              </div>
            </div>

            {/* Center: Compact Live Metrics */}
            <div className="flex flex-wrap items-center gap-4 sm:gap-6 font-mono tabular-nums">
              <div>
                <div className="text-[10px] font-sans text-slate-500">Speed</div>
                <div className="text-base font-bold text-amber-400">
                  {hudStats.wpm.toFixed(1)} <span className="text-[10px] text-slate-500">WPM</span>
                </div>
              </div>

              <div>
                <div className="text-[10px] font-sans text-slate-500">Accuracy</div>
                <div className="text-base font-bold text-emerald-400">
                  {hudStats.accuracy.toFixed(1)}%
                </div>
              </div>

              <div>
                <div className="text-[10px] font-sans text-slate-500">
                  {remainingSeconds !== null ? 'Time' : 'Elapsed'}
                </div>
                <div className="text-base font-bold text-white">
                  {remainingSeconds !== null ? (
                    <span className={remainingSeconds <= 10 ? 'text-rose-400' : 'text-white'}>
                      {remainingSeconds}s
                    </span>
                  ) : (
                    formatClock(hudStats.elapsedMs)
                  )}
                </div>
              </div>

              {/* Mode-Specific 4th Meter */}
              <div>
                {mode === 'speed_rush' && (
                  <>
                    <div className="text-[10px] font-sans text-slate-500">
                      Surge ({comboTier})
                    </div>
                    <div className="text-base font-bold text-amber-300 flex items-center gap-1">
                      <Zap className="w-3.5 h-3.5 text-amber-400" />
                      <span>{hudStats.combo}</span>
                    </div>
                  </>
                )}
                {mode === 'accuracy_master' && (
                  <>
                    <div className="text-[10px] font-sans text-slate-500">Shield</div>
                    <div className="text-base font-bold flex items-center gap-1">
                      <Shield
                        className={`w-3.5 h-3.5 ${
                          hudStats.errors >= 4 ? 'text-rose-400' : 'text-emerald-400'
                        }`}
                      />
                      <span className={hudStats.errors >= 4 ? 'text-rose-400' : 'text-emerald-400'}>
                        {Math.max(0, (modeConfig.errorBudget ?? 5) - hudStats.errors)}/
                        {modeConfig.errorBudget}
                      </span>
                    </div>
                  </>
                )}
                {mode === 'rhythm' && (
                  <>
                    <div className="text-[10px] font-sans text-slate-500 flex items-center gap-1.5">
                      <span>Cadence</span>
                      <span
                        className={
                          isSynthMuted
                            ? 'text-slate-500'
                            : musicUiState.playbackState === 'stopped'
                            ? 'text-rose-400 font-bold'
                            : musicUiState.playbackState === 'glitched'
                            ? 'text-amber-400 font-bold'
                            : gameState === 'playing' && !waitingFirstKey
                            ? rhythmBeatPhase
                              ? 'text-emerald-400 font-bold'
                              : 'text-emerald-600'
                            : 'text-slate-500'
                        }
                      >
                        {isSynthMuted
                          ? 'MUTED'
                          : musicUiState.playbackState === 'stopped'
                          ? 'STOPPED'
                          : musicUiState.playbackState === 'glitched'
                          ? 'GLITCH'
                          : gameState === 'playing' && !waitingFirstKey
                          ? 'GROOVE'
                          : 'READY'}
                      </span>
                    </div>
                    <div className="text-base font-bold text-emerald-400 flex items-center gap-1.5">
                      <Activity
                        className={`w-3.5 h-3.5 ${
                          musicUiState.playbackState === 'stopped'
                            ? 'text-rose-400'
                            : musicUiState.playbackState === 'glitched'
                            ? 'text-amber-400'
                            : 'text-emerald-400'
                        }`}
                      />
                      <span>{hudStats.rhythmScore}%</span>
                      <span className="inline-flex items-end gap-0.5 ml-0.5 h-3" aria-hidden="true">
                        {[1, 2, 3].map((lvl) => (
                          <span
                            key={lvl}
                            className={`w-1 rounded-xs transition-colors ${
                              lvl === 1 ? 'h-1.5' : lvl === 2 ? 'h-2.5' : 'h-3'
                            } ${
                              !isSynthMuted && musicUiState.activeLayer >= lvl
                                ? musicUiState.playbackState === 'glitched'
                                  ? 'bg-amber-400'
                                  : 'bg-emerald-400'
                                : 'bg-slate-700'
                            }`}
                          />
                        ))}
                      </span>
                    </div>
                  </>
                )}
                {(mode === 'classic' || mode === 'challenge') && (
                  <>
                    <div className="text-[10px] font-sans text-slate-500">
                      {mode === 'challenge' ? 'Boss Hull' : 'Errors'}
                    </div>
                    <div className="text-base font-bold text-amber-300">
                      {mode === 'challenge'
                        ? `${computeBossHpPercent(progressPct / 100)}% HP`
                        : `${hudStats.errors} err`}
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Right: Fullscreen & Game Action Controls */}
            <div className="flex items-center gap-1.5 shrink-0">
              {mode === 'rhythm' && (
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => setMusicEnabled((prev) => !prev)}
                  title={musicEnabled ? 'Mute Synthwave Music' : 'Enable Synthwave Music'}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-semibold transition-colors whitespace-nowrap ${
                    !isSynthMuted
                      ? 'bg-[#141B2B] hover:bg-slate-800 border-emerald-500/40 text-emerald-300'
                      : 'bg-[#141B2B] hover:bg-slate-800 border-[#232C40] text-slate-400'
                  }`}
                >
                  {!isSynthMuted ? (
                    <Volume2 className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <VolumeX className="w-3.5 h-3.5 text-slate-500" />
                  )}
                  <span className="hidden sm:inline">
                    {!isSynthMuted ? 'Music On' : 'Music Off'}
                  </span>
                </button>
              )}

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
                onClick={restartWithFreshPassage}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#141B2B] hover:bg-slate-800 border border-[#232C40] text-xs font-semibold text-slate-200 transition-colors whitespace-nowrap"
              >
                <RotateCcw className="w-3.5 h-3.5 text-slate-300" />
                <span className="hidden lg:inline">
                  {isDailyChallenge ? 'Restart' : 'New Text'}
                </span>
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
          </div>

          {/* Slim Progress Hairline integrated right along the HUD bar */}
          <div className="mt-2 h-1 w-full rounded-full bg-[#090C12] overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-amber-500 to-emerald-400 transition-all duration-150"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>
      )}

      {/* Main 2D Game World Stage + Left/Right Ad Rails */}
      <div
        className={
          isImmersive
            ? 'relative flex-1 min-h-0 flex flex-row overflow-hidden bg-[#070A12]'
            : `relative flex flex-row items-stretch gap-3 rounded-2xl border ${themeTokens.surface} ${themeTokens.border} p-4 sm:p-6 shadow-2xl`
        }
      >
        <GameAdRail placement="left" gameMode={mode} />

        <div
          className={
            isImmersive
              ? 'relative flex-1 min-w-0 min-h-0 flex flex-col'
              : 'relative flex-1 min-w-0'
          }
        >
          <ArcadeGameCanvas
            bridgeRef={visualBridgeRef}
            worldKey={`${mode}-${runVersion}`}
            fullscreen={isImmersive}
          />

          {/* IDLE OVERLAY OVER LIVE ATTRACT-MODE CANVAS */}
          {gameState === 'idle' && (
            <div className="absolute inset-0 z-30 rounded-xl bg-[#090C12]/65 backdrop-blur-[2px] flex flex-col items-center justify-center p-6 text-center gap-5">
              <h2 className="text-2xl font-extrabold text-white">{worldMeta.gameTitle}</h2>
              <div className="flex flex-wrap items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={startCountdown}
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm transition-colors whitespace-nowrap"
                >
                  <Play className="w-4 h-4 fill-slate-950" />
                  <span>Start 3-2-1 Game</span>
                </button>
                <button
                  type="button"
                  onClick={startInstantReady}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#181F2E]/90 hover:bg-slate-800 border border-[#232C40] text-slate-200 font-semibold text-sm transition-colors whitespace-nowrap"
                >
                  <Timer className="w-4 h-4 text-emerald-400" />
                  <span>Instant Launch</span>
                </button>
              </div>
            </div>
          )}

          {/* COUNTDOWN OVERLAY */}
          {gameState === 'countdown' && (
            <div className="absolute inset-0 z-30 bg-[#090C12]/72 backdrop-blur-[2px] flex flex-col items-center justify-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-widest text-slate-300">
                {worldMeta.gameTitle}
              </span>
              <span className="text-7xl font-black font-mono tabular-nums text-amber-400">
                {countdownValue}
              </span>
            </div>
          )}

          {/* PAUSED OVERLAY (Stays fullscreen with Resume, Restart, Exit to Menu) */}
          {gameState === 'paused' && (
            <div className="absolute inset-0 z-30 bg-[#090C12]/84 backdrop-blur-sm flex flex-col items-center justify-center gap-4 p-6">
              <h2 className="text-2xl font-bold text-white">{worldMeta.gameTitle} Paused</h2>
              <div className="flex flex-wrap items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={togglePause}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm transition-colors whitespace-nowrap"
                >
                  <Play className="w-4 h-4 fill-slate-950" />
                  <span>Resume</span>
                </button>
                <button
                  type="button"
                  onClick={restartWithFreshPassage}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#181F2E] hover:bg-slate-800 border border-[#232C40] text-slate-200 font-semibold text-sm transition-colors whitespace-nowrap"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>{isDailyChallenge ? 'Restart Daily' : 'Restart · New Text'}</span>
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

          {/* RESULTS OVERLAY (Stays fullscreen over the 2D stage with Restart, Fresh Run, and Exit) */}
          {gameState === 'results' && completedSession && (
            <div className="absolute inset-0 z-30 bg-[#090C12]/88 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
              <div className="w-full max-w-2xl rounded-2xl bg-[#111622]/95 border border-[#232C40] p-5 sm:p-7 space-y-5 shadow-2xl animate-fadeIn">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    {isNewBest && (
                      <div className="text-xs font-bold text-amber-400 mb-1">
                        New Personal Best
                      </div>
                    )}

                    <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
                      {shieldBroken ? 'Integrity Shield Depleted' : `${worldMeta.gameTitle} Complete`}
                    </h2>
                  </div>

                  <div className="text-left sm:text-right font-mono tabular-nums">
                    <div className="text-xs text-slate-400">Growth XP</div>
                    <div className="text-2xl font-extrabold text-emerald-400">
                      +{completedSession.xpEarned} XP
                    </div>
                  </div>
                </div>

                {/* Results Metric Strip */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 font-mono tabular-nums">
                  <div className={`p-3.5 rounded-xl ${themeTokens.well} border ${themeTokens.border}`}>
                    <div className="text-[11px] font-sans text-slate-400">Net WPM</div>
                    <div className="mt-1 text-xl font-bold text-amber-400">{completedSession.wpm}</div>
                  </div>
                  <div className={`p-3.5 rounded-xl ${themeTokens.well} border ${themeTokens.border}`}>
                    <div className="text-[11px] font-sans text-slate-400">Accuracy</div>
                    <div className="mt-1 text-xl font-bold text-emerald-400">
                      {completedSession.accuracy}%
                    </div>
                  </div>
                  <div className={`p-3.5 rounded-xl ${themeTokens.well} border ${themeTokens.border}`}>
                    <div className="text-[11px] font-sans text-slate-400">Raw WPM</div>
                    <div className="mt-1 text-xl font-bold text-slate-200">
                      {completedSession.rawWpm}
                    </div>
                  </div>
                  <div className={`p-3.5 rounded-xl ${themeTokens.well} border ${themeTokens.border}`}>
                    <div className="text-[11px] font-sans text-slate-400">Errors</div>
                    <div className="mt-1 text-xl font-bold text-rose-400">
                      {completedSession.errorCount}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-wrap items-center gap-2.5">
                  <button
                    type="button"
                    onClick={restartWithFreshPassage}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm transition-colors whitespace-nowrap"
                  >
                    <RotateCcw className="w-4 h-4" />
                    <span>{isDailyChallenge ? 'Retry Daily Seed' : 'Play Again · New Text'}</span>
                  </button>

                  {!isDailyChallenge && (
                    <button
                      type="button"
                      onClick={() => {
                        const next = loadFreshPassageIfAllowed();
                        resetRunState(next);
                        setGameState('countdown');
                        setCountdownValue(3);
                        arcadeAudio.playCountdownTick(profile.equipped.soundPack, false);
                      }}
                      className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#181F2E] hover:bg-slate-800 border border-[#232C40] text-slate-200 font-semibold text-sm transition-colors whitespace-nowrap"
                    >
                      <Shuffle className="w-4 h-4 text-amber-400" />
                      <span>3-2-1 Fresh Run</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={handleCopyResultCard}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#181F2E] hover:bg-slate-800 border border-[#232C40] text-slate-200 font-semibold text-sm transition-colors whitespace-nowrap"
                  >
                    {copiedCard ? (
                      <>
                        <Check className="w-4 h-4 text-emerald-400" />
                        <span>Result Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4 text-slate-400" />
                        <span>Copy Result Card</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={handleExitToMenu}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#181F2E] hover:bg-slate-800 border border-[#232C40] text-slate-300 hover:text-white font-semibold text-sm transition-colors whitespace-nowrap"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Exit to Menu</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      exitBrowserFullscreen();
                      onOpenModes();
                    }}
                    className="inline-flex items-center gap-2 px-3 py-2.5 rounded-xl bg-transparent hover:bg-slate-800/60 text-slate-400 hover:text-white font-semibold text-sm transition-colors whitespace-nowrap ml-auto"
                  >
                    <span>All Modes</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        <GameAdRail placement="right" gameMode={mode} />
      </div>
    </div>
  );
};
