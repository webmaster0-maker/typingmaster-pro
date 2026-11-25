import React, { useMemo, useState } from 'react';
import { GrowthProfile } from '../../types';
import { PlantStageIllustration } from '../../components/GrowthPlantAvatar';
import {
  ArcadeModeId,
  ArcadePersonalRecord,
  ArcadeProfile,
  ArcadeSession,
} from '../arcadeTypes';
import {
  loadFightingProgress,
  saveFightingProgress,
} from '../games/fightingCombatEngine';
import {
  ArcadeCabinetArt,
  BossTypePixelArt,
  CyberDojoPixelArt,
  NeonWallArcadeSign,
  NeonWallGamepadSign,
  PixelInvaderIcon,
  PixelKeyboardEmblem,
  PixelStarIcon,
  SpeedChallengePixelArt,
  TypingVoyagePixelArt,
  WordFallPixelArt,
} from './NeonArcadeArt';
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Flame,
  Play,
  Trophy,
} from 'lucide-react';

interface NeonArcadeHubProps {
  profile: ArcadeProfile;
  growthProfile: GrowthProfile;
  records: ArcadePersonalRecord[];
  sessions: ArcadeSession[];
  onPlayModeDirect: (mode: ArcadeModeId, fightingLevel?: number) => void;
  onOpenAccount?: () => void;
  onOpenDaily: () => void;
  onOpenLeaderboards: () => void;
  onExitArcade: () => void;
}

interface HubCardDefinition {
  mode: ArcadeModeId;
  titleTop: string;
  titleBottom: string;
  tagline: string;
  ctaLabel: string;
  borderColor: string;
  glowShadow: string;
  hoverGlowShadow: string;
  titleColor: string;
  cardBg: string;
  btnGradient: string;
  btnGlow: string;
  motif: 'wings_cyan' | 'flags_pink' | 'arrows_amber' | 'swords_violet' | 'wings_emerald';
  renderArt: () => React.ReactNode;
}

const HUB_CARDS: HubCardDefinition[] = [
  {
    mode: 'accuracy_master',
    titleTop: 'TYPING',
    titleBottom: 'VOYAGE',
    tagline: 'Type the words and blast the asteroids!',
    ctaLabel: 'PLAY',
    borderColor: '#00E5FF',
    glowShadow: '0 0 22px rgba(0, 229, 255, 0.38), inset 0 0 18px rgba(0, 229, 255, 0.14)',
    hoverGlowShadow: '0 0 34px rgba(0, 229, 255, 0.65), inset 0 0 24px rgba(0, 229, 255, 0.22)',
    titleColor: 'text-[#67E8F9]',
    cardBg: 'from-[#071636]/95 via-[#06122D]/95 to-[#040B20]/98',
    btnGradient: 'from-[#38BDF8] via-[#06B6D4] to-[#0284C7]',
    btnGlow: '0 0 18px rgba(0, 229, 255, 0.65), inset 0 2px 1px rgba(255,255,255,0.45)',
    motif: 'wings_cyan',
    renderArt: () => <TypingVoyagePixelArt />,
  },
  {
    mode: 'speed_rush',
    titleTop: 'SPEED',
    titleBottom: 'CHALLENGE',
    tagline: 'How fast can you type? Beat the clock!',
    ctaLabel: 'PLAY',
    borderColor: '#FF2BD6',
    glowShadow: '0 0 22px rgba(255, 43, 214, 0.38), inset 0 0 18px rgba(255, 43, 214, 0.14)',
    hoverGlowShadow: '0 0 34px rgba(255, 43, 214, 0.65), inset 0 0 24px rgba(255, 43, 214, 0.22)',
    titleColor: 'text-[#F9A8D4]',
    cardBg: 'from-[#2A083E]/95 via-[#210734]/95 to-[#130421]/98',
    btnGradient: 'from-[#F472B6] via-[#EC4899] to-[#BE185D]',
    btnGlow: '0 0 18px rgba(255, 43, 214, 0.65), inset 0 2px 1px rgba(255,255,255,0.45)',
    motif: 'flags_pink',
    renderArt: () => <SpeedChallengePixelArt />,
  },
  {
    mode: 'rhythm',
    titleTop: 'WORD',
    titleBottom: 'FALL',
    tagline: 'Type the falling words on the beat!',
    ctaLabel: 'PLAY',
    borderColor: '#FFB000',
    glowShadow: '0 0 22px rgba(255, 176, 0, 0.38), inset 0 0 18px rgba(255, 176, 0, 0.14)',
    hoverGlowShadow: '0 0 34px rgba(255, 176, 0, 0.65), inset 0 0 24px rgba(255, 176, 0, 0.22)',
    titleColor: 'text-[#FDE047]',
    cardBg: 'from-[#331804]/95 via-[#271203]/95 to-[#160A02]/98',
    btnGradient: 'from-[#FDE047] via-[#F59E0B] to-[#D97706]',
    btnGlow: '0 0 18px rgba(255, 176, 0, 0.65), inset 0 2px 1px rgba(255,255,255,0.5)',
    motif: 'arrows_amber',
    renderArt: () => <WordFallPixelArt />,
  },
  {
    mode: 'classic',
    titleTop: 'CYBER',
    titleBottom: 'DOJO',
    tagline: 'Type combos to K.O. rival fighters!',
    ctaLabel: 'FIGHT',
    borderColor: '#A855F7',
    glowShadow: '0 0 22px rgba(168, 85, 247, 0.42), inset 0 0 18px rgba(168, 85, 247, 0.16)',
    hoverGlowShadow: '0 0 34px rgba(168, 85, 247, 0.7), inset 0 0 24px rgba(168, 85, 247, 0.24)',
    titleColor: 'text-[#D8B4FE]',
    cardBg: 'from-[#22093E]/95 via-[#180730]/95 to-[#0E0520]/98',
    btnGradient: 'from-[#C084FC] via-[#9333EA] to-[#6D28D9]',
    btnGlow: '0 0 18px rgba(168, 85, 247, 0.68), inset 0 2px 1px rgba(255,255,255,0.45)',
    motif: 'swords_violet',
    renderArt: () => <CyberDojoPixelArt />,
  },
  {
    mode: 'challenge',
    titleTop: 'BOSS',
    titleBottom: 'TYPE',
    tagline: 'Type, dodge, and defeat epic bosses!',
    ctaLabel: 'ENTER',
    borderColor: '#10F57A',
    glowShadow: '0 0 22px rgba(16, 245, 122, 0.38), inset 0 0 18px rgba(16, 245, 122, 0.14)',
    hoverGlowShadow: '0 0 34px rgba(16, 245, 122, 0.65), inset 0 0 24px rgba(16, 245, 122, 0.22)',
    titleColor: 'text-[#6EE7B7]',
    cardBg: 'from-[#042A20]/95 via-[#042119]/95 to-[#02140F]/98',
    btnGradient: 'from-[#4ADE80] via-[#10B981] to-[#059669]',
    btnGlow: '0 0 18px rgba(16, 245, 122, 0.65), inset 0 2px 1px rgba(255,255,255,0.45)',
    motif: 'wings_emerald',
    renderArt: () => <BossTypePixelArt />,
  },
];

const TitleSideMotif: React.FC<{ motif: HubCardDefinition['motif']; side: 'left' | 'right' }> = ({
  motif,
  side,
}) => {
  const flip = side === 'right' ? 'scaleX(-1)' : undefined;

  if (motif === 'wings_cyan' || motif === 'wings_emerald') {
    const fill = motif === 'wings_cyan' ? '#38BDF8' : '#34D399';
    return (
      <svg
        viewBox="0 0 22 14"
        shapeRendering="crispEdges"
        className="w-5 h-3.5 shrink-0"
        style={{ transform: flip }}
        aria-hidden="true"
      >
        <rect x="0" y="1" width="20" height="3" fill={fill} />
        <rect x="5" y="6" width="15" height="3" fill={fill} opacity="0.85" />
        <rect x="10" y="11" width="10" height="3" fill={fill} opacity="0.7" />
      </svg>
    );
  }

  if (motif === 'flags_pink') {
    return (
      <svg
        viewBox="0 0 16 14"
        shapeRendering="crispEdges"
        className="w-4 h-3.5 shrink-0"
        style={{ transform: flip }}
        aria-hidden="true"
      >
        <rect x="0" y="0" width="4" height="4" fill="#F472B6" />
        <rect x="4" y="0" width="4" height="4" fill="#FDF2F8" />
        <rect x="8" y="0" width="4" height="4" fill="#F472B6" />
        <rect x="4" y="4" width="4" height="4" fill="#F472B6" />
        <rect x="8" y="4" width="4" height="4" fill="#FDF2F8" />
        <rect x="12" y="4" width="4" height="4" fill="#F472B6" />
        <rect x="8" y="8" width="4" height="4" fill="#F472B6" />
        <rect x="12" y="8" width="4" height="4" fill="#FDF2F8" />
      </svg>
    );
  }

  if (motif === 'arrows_amber') {
    return (
      <svg
        viewBox="0 0 14 18"
        shapeRendering="crispEdges"
        className="w-3.5 h-4 shrink-0"
        aria-hidden="true"
      >
        <rect x="5" y="0" width="4" height="10" fill="#FACC15" />
        <rect x="1" y="9" width="12" height="3" fill="#FACC15" />
        <rect x="3" y="12" width="8" height="3" fill="#F59E0B" />
        <rect x="5" y="15" width="4" height="3" fill="#F59E0B" />
      </svg>
    );
  }

  // swords_violet
  return (
    <svg
      viewBox="0 0 16 16"
      shapeRendering="crispEdges"
      className="w-4 h-4 shrink-0"
      style={{ transform: flip }}
      aria-hidden="true"
    >
      <rect x="10" y="1" width="4" height="3" fill="#E9D5FF" />
      <rect x="7" y="4" width="4" height="3" fill="#C084FC" />
      <rect x="4" y="7" width="4" height="3" fill="#A855F7" />
      <rect x="2" y="10" width="5" height="2" fill="#FACC15" />
      <rect x="1" y="12" width="3" height="3" fill="#D8B4FE" />
    </svg>
  );
};

export const NeonArcadeHub: React.FC<NeonArcadeHubProps> = ({
  profile,
  growthProfile,
  records,
  sessions,
  onPlayModeDirect,
  onOpenAccount,
  onOpenDaily,
  onOpenLeaderboards,
  onExitArcade,
}) => {
  const [hoveredCard, setHoveredCard] = useState<ArcadeModeId | null>(null);

  // Sync unlocked Cyber-Dojo fighting level right on the card
  const [fightProg, setFightProg] = useState(() => loadFightingProgress());

  const adjustFighterLevel = (delta: number) => {
    const nextLvl = Math.max(
      1,
      Math.min(fightProg.highestUnlockedLevel, fightProg.selectedLevel + delta)
    );
    if (nextLvl === fightProg.selectedLevel) return;
    const updated = { ...fightProg, selectedLevel: nextLvl };
    setFightProg(updated);
    saveFightingProgress(updated);
  };

  // Compute live earned Arcade Stars from verified runs, unlocked fighter levels, and records
  const totalStars = useMemo(() => {
    const validRuns = sessions.filter((s) => s.validationStatus === 'valid').length;
    const recordStars = records.length * 3;
    const fighterStars = Math.max(0, fightProg.highestUnlockedLevel - 1) * 4;
    const streakStars = profile.dailyStreak * 2;
    return validRuns + recordStars + fighterStars + streakStars;
  }, [sessions, records.length, fightProg.highestUnlockedLevel, profile.dailyStreak]);

  const bestWpmByMode = useMemo(() => {
    const map: Partial<Record<ArcadeModeId, number>> = {};
    for (const r of records) {
      map[r.mode] = r.bestWpm;
    }
    return map;
  }, [records]);

  return (
    <div className="relative min-h-screen w-full overflow-x-hidden flex flex-col justify-between bg-[#060417] text-white select-none">
      {/* === LAYER 1: ATMOSPHERIC NEON PIXEL ARCADE ROOM BACKDROP === */}
      <div
        className="pointer-events-none fixed inset-0 z-0 overflow-hidden"
        aria-hidden="true"
      >
        {/* Deep radial synthwave ceiling & wall glow */}
        <div
          className="absolute inset-0"
          style={{
            background:
              'radial-gradient(ellipse 85% 60% at 50% 18%, rgba(76, 29, 149, 0.52) 0%, rgba(15, 10, 44, 0.92) 56%, #050312 100%)',
          }}
        />

        {/* Pixel City Skyline Window Silhouette behind Marquee */}
        <svg
          viewBox="0 0 1440 320"
          preserveAspectRatio="xMidYMin slice"
          shapeRendering="crispEdges"
          className="absolute top-12 left-0 right-0 w-full h-[290px] opacity-65"
        >
          {/* Pixel night clouds */}
          <rect x="180" y="34" width="90" height="16" fill="#2E1065" opacity="0.7" />
          <rect x="200" y="24" width="52" height="12" fill="#3B0764" opacity="0.8" />
          <rect x="1090" y="28" width="110" height="18" fill="#2E1065" opacity="0.7" />
          <rect x="1115" y="16" width="60" height="14" fill="#3B0764" opacity="0.8" />

          {/* Silhouetted skyscrapers */}
          {[
            { x: 110, y: 120, w: 68, h: 200 },
            { x: 190, y: 88, w: 76, h: 232 },
            { x: 280, y: 140, w: 60, h: 180 },
            { x: 356, y: 102, w: 72, h: 218 },
            { x: 444, y: 132, w: 64, h: 188 },
            { x: 936, y: 128, w: 66, h: 192 },
            { x: 1018, y: 94, w: 78, h: 226 },
            { x: 1110, y: 136, w: 64, h: 184 },
            { x: 1188, y: 84, w: 80, h: 236 },
            { x: 1282, y: 124, w: 68, h: 196 },
          ].map((b, idx) => (
            <g key={`bldg-${idx}`}>
              <rect x={b.x} y={b.y} width={b.w} height={b.h} fill="#120B33" />
              {/* Lit neon pixel windows */}
              <rect x={b.x + 10} y={b.y + 18} width="6" height="8" fill="#00E5FF" opacity="0.75" />
              <rect x={b.x + 26} y={b.y + 18} width="6" height="8" fill="#FACC15" opacity="0.7" />
              <rect x={b.x + 42} y={b.y + 34} width="6" height="8" fill="#FF2BD6" opacity="0.7" />
              <rect x={b.x + 14} y={b.y + 52} width="6" height="8" fill="#38BDF8" opacity="0.65" />
              <rect x={b.x + 36} y={b.y + 68} width="6" height="8" fill="#FDE047" opacity="0.6" />
              <rect x={b.x + 20} y={b.y + 92} width="6" height="8" fill="#FF2BD6" opacity="0.55" />
            </g>
          ))}
        </svg>

        {/* Left & Right Glowing Neon Wall Signs */}
        <div className="hidden lg:block absolute top-[106px] -left-2 w-40 xl:w-44 opacity-90">
          <NeonWallArcadeSign className="w-full h-auto" />
        </div>
        <div className="hidden lg:block absolute top-[102px] -right-1 w-36 xl:w-40 opacity-90">
          <NeonWallGamepadSign className="w-full h-auto" />
        </div>

        {/* Left & Right Flanking Pixel Arcade Cabinets (xl+ desktop) */}
        <div className="hidden 2xl:block absolute bottom-16 -left-3 w-[122px] opacity-85">
          <ArcadeCabinetArt side="left" className="w-full h-auto drop-shadow-[0_0_24px_rgba(255,43,214,0.3)]" />
        </div>
        <div className="hidden 2xl:block absolute bottom-16 -right-3 w-[122px] opacity-85">
          <ArcadeCabinetArt side="right" className="w-full h-auto drop-shadow-[0_0_24px_rgba(0,229,255,0.3)]" />
        </div>

        {/* Perspective Synthwave Neon Floor Grid */}
        <div
          className="absolute bottom-0 left-0 right-0 h-[185px]"
          style={{
            background:
              'linear-gradient(180deg, rgba(6,4,23,0) 0%, rgba(28,8,62,0.55) 45%, rgba(16,5,38,0.95) 100%)',
          }}
        >
          <svg
            viewBox="0 0 1440 185"
            preserveAspectRatio="none"
            className="w-full h-full opacity-75"
          >
            {/* Horizontal perspective neon grid lines */}
            <line x1="0" y1="36" x2="1440" y2="36" stroke="#FF2BD6" strokeOpacity="0.28" strokeWidth="1" />
            <line x1="0" y1="68" x2="1440" y2="68" stroke="#FF2BD6" strokeOpacity="0.4" strokeWidth="1.5" />
            <line x1="0" y1="108" x2="1440" y2="108" stroke="#FF2BD6" strokeOpacity="0.52" strokeWidth="1.8" />
            <line x1="0" y1="156" x2="1440" y2="156" stroke="#FF2BD6" strokeOpacity="0.65" strokeWidth="2" />
            {/* Radial perspective floor beams */}
            {[-420, -240, -90, 60, 210, 360, 510, 660, 810, 960, 1110, 1260, 1410, 1560, 1740, 1920].map(
              (bx, i) => (
                <line
                  key={`grid-${i}`}
                  x1="720"
                  y1="-40"
                  x2={bx}
                  y2="185"
                  stroke={i % 2 === 0 ? '#FF2BD6' : '#00E5FF'}
                  strokeOpacity={i % 2 === 0 ? '0.45' : '0.3'}
                  strokeWidth="1.5"
                />
              )
            )}
          </svg>
        </div>
      </div>

      {/* === LAYER 2: TOP ARCADE HUD BAR === */}
      <header className="relative z-20 w-full max-w-[1440px] mx-auto px-4 sm:px-6 pt-3.5 pb-1 flex flex-wrap items-center justify-between gap-3">
        {/* Left: Shared Plant Growth Stage, Level & Unified Growth XP Bar */}
        <div className="flex items-center gap-3">
          <div
            className="w-12 h-12 rounded-xl overflow-hidden border-2 border-[#34D399]/80 shadow-[0_0_16px_rgba(16,185,129,0.45)] bg-[#0A1428] p-0.5 shrink-0"
            title={`Stage ${growthProfile.stageLevel}: ${growthProfile.stageName}`}
          >
            <PlantStageIllustration stageLevel={growthProfile.stageLevel} />
          </div>
          <div className="min-w-0">
            <div className="flex items-baseline gap-2">
              {onOpenAccount ? (
                <button
                  type="button"
                  onClick={onOpenAccount}
                  title="Edit player name or account"
                  className="text-sm sm:text-base font-bold text-white hover:text-[#6EE7B7] truncate max-w-[150px] text-left transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 rounded"
                >
                  {profile.handle}
                </button>
              ) : (
                <span className="text-sm sm:text-base font-bold text-white truncate max-w-[145px]">
                  {profile.handle}
                </span>
              )}
              <span className="text-xs font-mono tabular-nums font-bold text-[#34D399] whitespace-nowrap">
                Stage {growthProfile.stageLevel}/{growthProfile.totalStages}
              </span>
              <span className="hidden md:inline text-xs text-slate-300 truncate max-w-[160px]">
                · {growthProfile.stageName}
              </span>
            </div>
            <div className="mt-1 flex items-center gap-2">
              <div
                className="w-28 sm:w-36 h-2.5 rounded-full bg-[#130E30] border border-[#10B981]/60 p-0.5 overflow-hidden shadow-[0_0_10px_rgba(16,185,129,0.3)]"
                title={`${growthProfile.dewdrops} / ${growthProfile.nextStageThreshold} Growth XP`}
              >
                <div
                  className="h-full rounded-full bg-gradient-to-r from-[#10B981] via-[#34D399] to-[#00E5FF] transition-all duration-300"
                  style={{ width: `${Math.max(8, growthProfile.progressPercent)}%` }}
                />
              </div>
              <span className="text-[11px] font-mono tabular-nums font-semibold text-[#6EE7B7] whitespace-nowrap">
                {growthProfile.isMaxStage
                  ? `${growthProfile.dewdrops} XP`
                  : `${growthProfile.dewdrops} / ${growthProfile.nextStageThreshold} XP`}
              </span>
            </div>
          </div>
        </div>

        {/* Right: Stars + Streamlined Arcade Controls (Daily, Ranks, Courses) */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
          {/* Stars Counter -> opens Leaderboards */}
          <button
            type="button"
            onClick={onOpenLeaderboards}
            title="Arcade Stars"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#150E36]/90 hover:bg-[#1E144C] border border-[#7C3AED]/70 shadow-[0_0_14px_rgba(139,92,246,0.3)] transition-all whitespace-nowrap"
          >
            <PixelStarIcon className="w-4 h-4 shrink-0" />
            <span className="font-mono tabular-nums text-sm font-extrabold text-white">
              {totalStars}
            </span>
          </button>

          <div className="flex items-center gap-1.5 pl-0.5">
            <button
              type="button"
              onClick={onOpenDaily}
              title="Daily Challenge"
              className="inline-flex items-center gap-1.5 px-2.5 py-2 rounded-full bg-[#150E36]/90 hover:bg-[#28175A] border border-[#FF2BD6]/55 hover:border-[#FF2BD6] text-xs font-bold text-[#F9A8D4] hover:text-white shadow-[0_0_12px_rgba(255,43,214,0.22)] transition-all whitespace-nowrap"
            >
              <Flame className="w-4 h-4 text-[#FB923C]" />
              <span className="hidden md:inline">Daily</span>
            </button>

            <button
              type="button"
              onClick={onOpenLeaderboards}
              title="Ranks"
              className="inline-flex items-center gap-1.5 px-2.5 py-2 rounded-full bg-[#150E36]/90 hover:bg-[#28175A] border border-[#FACC15]/55 hover:border-[#FACC15] text-xs font-bold text-[#FEF08A] hover:text-white shadow-[0_0_12px_rgba(250,204,21,0.2)] transition-all whitespace-nowrap"
            >
              <Trophy className="w-4 h-4 text-[#FACC15]" />
              <span className="hidden md:inline">Ranks</span>
            </button>

            <button
              type="button"
              onClick={onExitArcade}
              title="Courses"
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-full bg-[#150E36]/90 hover:bg-slate-800 border border-[#6D28D9]/70 hover:border-white/50 text-xs font-bold text-slate-200 hover:text-white transition-all whitespace-nowrap"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Courses</span>
            </button>
          </div>
        </div>
      </header>

      {/* === LAYER 3: CENTER NEON MARQUEE & 5 SIDE-BY-SIDE NEON GAME CARDS === */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 sm:px-6 lg:px-10 py-3 gap-5 sm:gap-6">
        {/* Neon Marquee Title Lockup */}
        <div className="flex flex-col items-center text-center">
          {/* Top ARCADE Pixel Strip */}
          <div className="flex items-center gap-3 sm:gap-4 mb-1">
            <PixelInvaderIcon className="w-5 h-4 sm:w-6 sm:h-5 drop-shadow-[0_0_8px_rgba(232,121,249,0.75)]" />
            <span className="text-[#F472B6] text-xs" aria-hidden="true">
              ✦
            </span>
            <span
              className="text-lg sm:text-2xl font-bold tracking-[0.28em] bg-gradient-to-b from-[#FEF08A] via-[#FB923C] to-[#F472B6] bg-clip-text text-transparent drop-shadow-[0_0_12px_rgba(244,114,182,0.5)]"
              style={{ fontFamily: 'var(--font-pixel)' }}
            >
              ARCADE
            </span>
            <span className="text-[#F472B6] text-xs" aria-hidden="true">
              ✦
            </span>
            <PixelInvaderIcon className="w-5 h-4 sm:w-6 sm:h-5 drop-shadow-[0_0_8px_rgba(232,121,249,0.75)]" />
          </div>

          {/* Main Glowing TYPECREST Sign */}
          <div className="relative flex items-center justify-center gap-2 sm:gap-4">
            {/* Left Electric Lightning Bolt */}
            <svg
              viewBox="0 0 24 44"
              className="w-5 h-9 sm:w-6 sm:h-11 shrink-0 drop-shadow-[0_0_10px_rgba(250,204,21,0.9)]"
              aria-hidden="true"
            >
              <polygon points="8,0 20,0 13,18 22,18 4,44 10,24 2,24" fill="#FDE047" />
            </svg>

            <div
              className="relative px-6 sm:px-12 py-2 sm:py-2.5 rounded-2xl border-2 border-[#E879F9] bg-[#140732]/90"
              style={{
                boxShadow:
                  '0 0 28px rgba(232, 121, 249, 0.55), 0 0 12px rgba(0, 229, 255, 0.45), inset 0 0 18px rgba(168, 85, 247, 0.35)',
              }}
            >
              <h1
                className="text-3xl sm:text-5xl lg:text-[52px] font-bold tracking-[0.06em] leading-none bg-gradient-to-b from-[#FFFFFF] via-[#7DD3FC] to-[#C084FC] bg-clip-text text-transparent drop-shadow-[0_3px_12px_rgba(56,189,248,0.55)]"
                style={{ fontFamily: 'var(--font-arcade)' }}
              >
                TYPECREST
              </h1>
            </div>

            {/* Right Electric Lightning Bolt */}
            <svg
              viewBox="0 0 24 44"
              className="w-5 h-9 sm:w-6 sm:h-11 shrink-0 scale-x-[-1] drop-shadow-[0_0_10px_rgba(250,204,21,0.9)]"
              aria-hidden="true"
            >
              <polygon points="8,0 20,0 13,18 22,18 4,44 10,24 2,24" fill="#FDE047" />
            </svg>
          </div>

          {/* Glowing Pixel Keyboard Emblem */}
          <div className="mt-2.5 drop-shadow-[0_0_10px_rgba(56,189,248,0.75)]">
            <PixelKeyboardEmblem className="w-12 h-6" />
          </div>
        </div>

        {/* === 5 SIDE-BY-SIDE NEON PIXEL ARCADE GAME CARDS === */}
        <section
          aria-label="Select a Typing Arcade Game"
          className="w-full max-w-[1380px] grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 items-stretch"
        >
          {HUB_CARDS.map((card) => {
            const isHovered = hoveredCard === card.mode;
            const bestWpm = bestWpmByMode[card.mode];
            const isFighting = card.mode === 'classic';

            return (
              <div
                key={card.mode}
                onMouseEnter={() => setHoveredCard(card.mode)}
                onMouseLeave={() => setHoveredCard(null)}
                onClick={() =>
                  onPlayModeDirect(
                    card.mode,
                    isFighting ? fightProg.selectedLevel : undefined
                  )
                }
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onPlayModeDirect(
                      card.mode,
                      isFighting ? fightProg.selectedLevel : undefined
                    );
                  }
                }}
                style={{
                  borderColor: card.borderColor,
                  boxShadow: isHovered ? card.hoverGlowShadow : card.glowShadow,
                }}
                className={`group relative flex flex-col justify-between rounded-[22px] border-[2.5px] bg-gradient-to-b ${card.cardBg} p-2.5 cursor-pointer transition-transform duration-200 hover:-translate-y-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white`}
              >
                {/* Top Pixel-Art Illustration Frame */}
                <div className="relative w-full aspect-[220/155] rounded-[14px] overflow-hidden border border-white/10 bg-[#050814]">
                  {card.renderArt()}

                  {/* Subtle Personal Best indicator if player has recorded a WPM */}
                  {bestWpm !== undefined && (
                    <div className="absolute top-2 right-2 px-2 py-0.5 rounded-md bg-black/70 backdrop-blur-xs text-[10px] font-mono tabular-nums font-bold text-white border border-white/15">
                      {bestWpm} WPM
                    </div>
                  )}
                </div>

                {/* Card Title, Side Pixel Motifs & Tagline */}
                <div className="px-1.5 pt-3 pb-2.5 flex-1 flex flex-col items-center text-center justify-between gap-2">
                  <div className="w-full">
                    <div className="flex items-center justify-center gap-2">
                      <TitleSideMotif motif={card.motif} side="left" />
                      <h2
                        className={`text-lg xl:text-[19px] font-bold leading-[1.08] tracking-wide ${card.titleColor}`}
                        style={{
                          fontFamily: 'var(--font-arcade)',
                          textShadow: `0 0 12px ${card.borderColor}66`,
                        }}
                      >
                        <span className="block">{card.titleTop}</span>
                        <span className="block">{card.titleBottom}</span>
                      </h2>
                      <TitleSideMotif motif={card.motif} side="right" />
                    </div>
                  </div>

                  {/* Inline Fighter Level Selector exclusively on CYBER DOJO card */}
                  {isFighting && (
                    <div
                      onClick={(e) => e.stopPropagation()}
                      className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-[#120726]/90 border border-[#A855F7]/55 text-[11px] font-mono tabular-nums text-[#E9D5FF]"
                    >
                      <button
                        type="button"
                        onClick={() => adjustFighterLevel(-1)}
                        disabled={fightProg.selectedLevel <= 1}
                        aria-label="Previous fighter level"
                        className="p-0.5 rounded hover:bg-[#A855F7]/30 disabled:opacity-35 disabled:cursor-not-allowed transition-colors"
                      >
                        <ChevronLeft className="w-3.5 h-3.5" />
                      </button>
                      <span className="font-bold px-1 whitespace-nowrap">
                        Lv.{fightProg.selectedLevel} / {fightProg.highestUnlockedLevel}
                      </span>
                      <button
                        type="button"
                        onClick={() => adjustFighterLevel(1)}
                        disabled={fightProg.selectedLevel >= fightProg.highestUnlockedLevel}
                        aria-label="Next fighter level"
                        className="p-0.5 rounded hover:bg-[#A855F7]/30 disabled:opacity-35 disabled:cursor-not-allowed transition-colors"
                      >
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}

                  {/* Glossy Neon Pill CTA Button */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onPlayModeDirect(
                        card.mode,
                        isFighting ? fightProg.selectedLevel : undefined
                      );
                    }}
                    style={{ boxShadow: card.btnGlow }}
                    className={`mt-1 w-full max-w-[172px] py-2 px-4 rounded-full bg-gradient-to-b ${card.btnGradient} border border-white/40 text-white font-extrabold text-sm tracking-[0.14em] inline-flex items-center justify-center gap-1.5 transition-transform duration-150 group-hover:scale-[1.03] active:scale-[0.98] whitespace-nowrap`}
                  >
                    <Play className="w-3.5 h-3.5 fill-white shrink-0" />
                    <span style={{ fontFamily: 'var(--font-arcade)' }}>{card.ctaLabel}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </section>
      </main>

      {/* === LAYER 4: BOTTOM 3-STAR NEON FLOOR DIVIDER === */}
      <footer className="relative z-10 w-full py-3.5 px-4 flex items-center justify-center gap-3 sm:gap-5">
        <div className="flex flex-col items-end gap-1 w-20 sm:w-32">
          <span className="h-[2.5px] w-full rounded-full bg-gradient-to-r from-transparent via-[#FF2BD6] to-[#00E5FF] shadow-[0_0_10px_#00E5FF]" />
          <span className="h-[2px] w-2/3 rounded-full bg-gradient-to-r from-transparent to-[#FF2BD6] shadow-[0_0_8px_#FF2BD6]" />
        </div>

        <div className="flex items-end gap-2">
          <PixelStarIcon className="w-6 h-6 sm:w-7 sm:h-7 drop-shadow-[0_0_10px_rgba(250,204,21,0.85)]" />
          <PixelStarIcon className="w-8 h-8 sm:w-10 sm:h-10 -mb-0.5 drop-shadow-[0_0_14px_rgba(250,204,21,0.95)]" />
          <PixelStarIcon className="w-6 h-6 sm:w-7 sm:h-7 drop-shadow-[0_0_10px_rgba(250,204,21,0.85)]" />
        </div>

        <div className="flex flex-col items-start gap-1 w-20 sm:w-32">
          <span className="h-[2.5px] w-full rounded-full bg-gradient-to-l from-transparent via-[#FF2BD6] to-[#00E5FF] shadow-[0_0_10px_#00E5FF]" />
          <span className="h-[2px] w-2/3 rounded-full bg-gradient-to-l from-transparent to-[#FF2BD6] shadow-[0_0_8px_#FF2BD6]" />
        </div>
      </footer>
    </div>
  );
};
