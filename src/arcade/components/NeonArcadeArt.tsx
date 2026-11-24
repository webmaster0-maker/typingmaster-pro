import React from 'react';

/**
 * Crisp 16-bit Pixel-Art SVG illustrations for the Neon Pixel Arcade Main Hub.
 * Built with shapeRendering="crispEdges" for razor-sharp retina fidelity and zero broken images.
 */

export const PixelPlayerAvatar: React.FC<{ className?: string }> = ({ className = 'w-11 h-11' }) => (
  <svg
    viewBox="0 0 16 16"
    shapeRendering="crispEdges"
    className={className}
    aria-hidden="true"
  >
    {/* Deep purple pixel frame background */}
    <rect width="16" height="16" fill="#181236" />
    {/* Headphone band */}
    <rect x="4" y="1" width="8" height="1" fill="#E2E8F0" />
    <rect x="3" y="2" width="1" height="4" fill="#CBD5E1" />
    <rect x="12" y="2" width="1" height="4" fill="#CBD5E1" />
    {/* Hair */}
    <rect x="4" y="2" width="8" height="2" fill="#7C2D12" />
    <rect x="4" y="3" width="2" height="2" fill="#9A3412" />
    <rect x="10" y="3" width="2" height="1" fill="#9A3412" />
    {/* Headphone ear cups */}
    <rect x="2" y="5" width="2" height="4" fill="#F8FAFC" />
    <rect x="12" y="5" width="2" height="4" fill="#F8FAFC" />
    <rect x="2" y="6" width="1" height="2" fill="#00E5FF" />
    <rect x="13" y="6" width="1" height="2" fill="#FF2BD6" />
    {/* Face */}
    <rect x="4" y="4" width="8" height="6" fill="#FDBA74" />
    <rect x="4" y="9" width="8" height="1" fill="#FB923C" />
    {/* Eyes */}
    <rect x="5" y="6" width="2" height="2" fill="#0F172A" />
    <rect x="9" y="6" width="2" height="2" fill="#0F172A" />
    <rect x="5" y="6" width="1" height="1" fill="#FFFFFF" />
    <rect x="9" y="6" width="1" height="1" fill="#FFFFFF" />
    {/* Smile */}
    <rect x="7" y="8" width="2" height="1" fill="#9A3412" />
    {/* Neck & Neon Gamer Jacket */}
    <rect x="6" y="10" width="4" height="1" fill="#FB923C" />
    <rect x="3" y="11" width="10" height="5" fill="#4F46E5" />
    <rect x="6" y="11" width="4" height="5" fill="#00E5FF" />
    <rect x="7" y="12" width="2" height="4" fill="#0F172A" />
    <rect x="3" y="11" width="1" height="5" fill="#FF2BD6" />
    <rect x="12" y="11" width="1" height="5" fill="#FF2BD6" />
  </svg>
);

export const PixelInvaderIcon: React.FC<{ className?: string }> = ({ className = 'w-6 h-5' }) => (
  <svg viewBox="0 0 11 8" shapeRendering="crispEdges" className={className} aria-hidden="true">
    <rect x="2" y="0" width="1" height="1" fill="#F472B6" />
    <rect x="8" y="0" width="1" height="1" fill="#F472B6" />
    <rect x="3" y="1" width="1" height="1" fill="#F472B6" />
    <rect x="7" y="1" width="1" height="1" fill="#F472B6" />
    <rect x="2" y="2" width="7" height="1" fill="#E879F9" />
    <rect x="1" y="3" width="2" height="1" fill="#E879F9" />
    <rect x="4" y="3" width="3" height="1" fill="#E879F9" />
    <rect x="8" y="3" width="2" height="1" fill="#E879F9" />
    <rect x="0" y="4" width="11" height="1" fill="#C084FC" />
    <rect x="0" y="5" width="1" height="2" fill="#C084FC" />
    <rect x="2" y="5" width="7" height="1" fill="#C084FC" />
    <rect x="10" y="5" width="1" height="2" fill="#C084FC" />
    <rect x="2" y="6" width="1" height="1" fill="#A855F7" />
    <rect x="8" y="6" width="1" height="1" fill="#A855F7" />
    <rect x="3" y="7" width="2" height="1" fill="#A855F7" />
    <rect x="6" y="7" width="2" height="1" fill="#A855F7" />
  </svg>
);

export const PixelKeyboardEmblem: React.FC<{ className?: string }> = ({
  className = 'w-12 h-6',
}) => (
  <svg viewBox="0 0 28 14" shapeRendering="crispEdges" className={className} aria-hidden="true">
    <rect x="2" y="1" width="24" height="12" fill="#1E1B4B" />
    <rect x="1" y="2" width="26" height="10" fill="#1E1B4B" />
    {/* Cyan neon perimeter */}
    <rect x="2" y="0" width="24" height="1" fill="#38BDF8" />
    <rect x="2" y="13" width="24" height="1" fill="#38BDF8" />
    <rect x="0" y="2" width="1" height="10" fill="#38BDF8" />
    <rect x="27" y="2" width="1" height="10" fill="#38BDF8" />
    <rect x="1" y="1" width="1" height="1" fill="#38BDF8" />
    <rect x="26" y="1" width="1" height="1" fill="#38BDF8" />
    <rect x="1" y="12" width="1" height="1" fill="#38BDF8" />
    <rect x="26" y="12" width="1" height="1" fill="#38BDF8" />
    {/* Glowing keys row 1 */}
    {[3, 6, 9, 12, 15, 18, 21, 24].map((x) => (
      <rect key={`r1-${x}`} x={x} y="3" width="2" height="2" fill="#7DD3FC" />
    ))}
    {/* Glowing keys row 2 */}
    {[4, 7, 10, 13, 16, 19, 22].map((x) => (
      <rect key={`r2-${x}`} x={x} y="6" width="2" height="2" fill="#BAE6FD" />
    ))}
    {/* Spacebar row */}
    <rect x="3" y="9" width="3" height="2" fill="#60A5FA" />
    <rect x="8" y="9" width="12" height="2" fill="#E0F2FE" />
    <rect x="22" y="9" width="3" height="2" fill="#60A5FA" />
  </svg>
);

export const PixelStarIcon: React.FC<{ className?: string }> = ({ className = 'w-6 h-6' }) => (
  <svg viewBox="0 0 13 13" shapeRendering="crispEdges" className={className} aria-hidden="true">
    <rect x="6" y="0" width="1" height="2" fill="#FEF08A" />
    <rect x="5" y="2" width="3" height="2" fill="#FDE047" />
    <rect x="0" y="4" width="13" height="2" fill="#FACC15" />
    <rect x="1" y="5" width="11" height="1" fill="#FEF08A" />
    <rect x="2" y="6" width="9" height="2" fill="#F59E0B" />
    <rect x="3" y="6" width="7" height="1" fill="#FACC15" />
    <rect x="2" y="8" width="4" height="2" fill="#D97706" />
    <rect x="7" y="8" width="4" height="2" fill="#D97706" />
    <rect x="1" y="10" width="3" height="2" fill="#B45309" />
    <rect x="9" y="10" width="3" height="2" fill="#B45309" />
    <rect x="5" y="4" width="3" height="2" fill="#FFFFFF" opacity="0.65" />
  </svg>
);

export const PixelCoinIcon: React.FC<{ className?: string }> = ({ className = 'w-5 h-5' }) => (
  <svg viewBox="0 0 12 12" shapeRendering="crispEdges" className={className} aria-hidden="true">
    <rect x="3" y="0" width="6" height="12" fill="#F59E0B" />
    <rect x="1" y="2" width="10" height="8" fill="#F59E0B" />
    <rect x="2" y="1" width="8" height="10" fill="#FACC15" />
    <rect x="3" y="2" width="6" height="8" fill="#FEF08A" />
    <rect x="5" y="3" width="2" height="6" fill="#D97706" />
    <rect x="4" y="4" width="1" height="1" fill="#D97706" />
    <rect x="7" y="7" width="1" height="1" fill="#D97706" />
  </svg>
);

export const ArcadeCabinetArt: React.FC<{ side: 'left' | 'right'; className?: string }> = ({
  side,
  className = '',
}) => (
  <svg
    viewBox="0 0 120 260"
    shapeRendering="crispEdges"
    className={className}
    style={{ transform: side === 'right' ? 'scaleX(-1)' : undefined }}
    aria-hidden="true"
  >
    {/* Cabinet dark silhouette */}
    <polygon points="8,14 96,36 106,120 116,136 112,158 96,164 96,256 8,256" fill="#140D32" />
    {/* Neon pink side trim */}
    <rect x="8" y="14" width="6" height="242" fill="#FF2BD6" opacity="0.7" />
    <rect x="14" y="18" width="4" height="238" fill="#3B1A6B" />
    {/* Lit top marquee */}
    <polygon points="20,24 92,40 92,56 20,44" fill="#F59E0B" />
    <polygon points="24,28 88,42 88,52 24,41" fill="#FEF08A" />
    <rect x="32" y="34" width="42" height="5" fill="#7C3AED" />
    {/* CRT Screen bezel */}
    <polygon points="22,54 90,66 94,122 22,118" fill="#0B0920" />
    {/* Glowing attract screen */}
    <polygon points="28,60 84,70 87,114 28,112" fill="#0E2954" />
    <rect x="38" y="74" width="16" height="10" fill="#00E5FF" opacity="0.85" />
    <rect x="58" y="84" width="18" height="8" fill="#FF2BD6" opacity="0.85" />
    <rect x="44" y="96" width="28" height="6" fill="#10F57A" opacity="0.85" />
    <rect x="34" y="68" width="4" height="4" fill="#FEF08A" />
    <rect x="74" y="74" width="4" height="4" fill="#FEF08A" />
    {/* Control deck */}
    <polygon points="20,122 98,126 112,142 24,142" fill="#2A1B59" />
    <rect x="40" y="128" width="4" height="10" fill="#94A3B8" />
    <rect x="38" y="124" width="8" height="6" fill="#FF2BD6" />
    <rect x="64" y="132" width="8" height="4" fill="#00E5FF" />
    <rect x="78" y="132" width="8" height="4" fill="#10F57A" />
    {/* Lower body & glowing coin slots */}
    <rect x="24" y="150" width="66" height="98" fill="#1B1142" />
    <rect x="36" y="168" width="38" height="44" fill="#0F092A" />
    <rect x="44" y="178" width="8" height="12" fill="#EF4444" />
    <rect x="58" y="178" width="8" height="12" fill="#EF4444" />
    <rect x="46" y="182" width="4" height="4" fill="#FEF08A" />
    <rect x="60" y="182" width="4" height="4" fill="#FEF08A" />
  </svg>
);

export const NeonWallArcadeSign: React.FC<{ className?: string }> = ({ className = '' }) => (
  <svg viewBox="0 0 180 95" className={className} aria-hidden="true">
    <defs>
      <filter id="neonPinkGlow" x="-30%" y="-30%" width="160%" height="160%">
        <feGaussianBlur stdDeviation="4" result="blur" />
        <feMerge>
          <feMergeNode in="blur" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
    </defs>
    <g transform="skewY(12)" filter="url(#neonPinkGlow)">
      <rect
        x="12"
        y="12"
        width="150"
        height="54"
        rx="10"
        fill="#240836"
        fillOpacity="0.45"
        stroke="#FF2BD6"
        strokeWidth="4"
      />
      <text
        x="87"
        y="48"
        textAnchor="middle"
        fill="#FFE4FA"
        stroke="#FF2BD6"
        strokeWidth="1"
        fontFamily="var(--font-arcade)"
        fontWeight="700"
        fontSize="26"
        letterSpacing="4"
      >
        ARCADE
      </text>
    </g>
  </svg>
);

export const NeonWallGamepadSign: React.FC<{ className?: string }> = ({ className = '' }) => (
  <svg viewBox="0 0 160 110" className={className} aria-hidden="true">
    <defs>
      <filter id="neonGamepadGlow" x="-30%" y="-30%" width="160%" height="160%">
        <feGaussianBlur stdDeviation="4" result="blur" />
        <feMerge>
          <feMergeNode in="blur" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
    </defs>
    <g transform="rotate(-14 80 55)" filter="url(#neonGamepadGlow)">
      <path
        d="M36 42 C36 28 52 24 68 28 L92 28 C108 24 124 28 124 42 L132 72 C135 84 122 92 110 86 L96 76 L64 76 L50 86 C38 92 25 84 28 72 Z"
        fill="#240836"
        fillOpacity="0.4"
        stroke="#FF2BD6"
        strokeWidth="4.5"
        strokeLinejoin="round"
      />
      {/* D-pad */}
      <path d="M52 46 V62 M44 54 H60" stroke="#FFE4FA" strokeWidth="4" strokeLinecap="round" />
      {/* Buttons */}
      <circle cx="104" cy="48" r="3.5" fill="#FFE4FA" />
      <circle cx="114" cy="54" r="3.5" fill="#00E5FF" />
      <circle cx="96" cy="56" r="3.5" fill="#FFE4FA" />
      <circle cx="106" cy="62" r="3.5" fill="#FF2BD6" />
    </g>
  </svg>
);

/**
 * CARD 1 ART (CYAN): TYPING VOYAGE — Rocket blasting word asteroids over glowing planet
 */
export const TypingVoyagePixelArt: React.FC = () => (
  <svg viewBox="0 0 220 155" className="w-full h-full block" aria-hidden="true">
    <defs>
      <linearGradient id="voyageBg" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#04081B" />
        <stop offset="72%" stopColor="#08153A" />
        <stop offset="100%" stopColor="#0C2A6B" />
      </linearGradient>
      <radialGradient id="planetGlow" cx="50%" cy="100%" r="75%">
        <stop offset="0%" stopColor="#00E5FF" stopOpacity="0.65" />
        <stop offset="55%" stopColor="#2563EB" stopOpacity="0.45" />
        <stop offset="100%" stopColor="#04081B" stopOpacity="0" />
      </radialGradient>
    </defs>
    <rect width="220" height="155" fill="url(#voyageBg)" />

    {/* Twinkling pixel stars */}
    <g shapeRendering="crispEdges">
      <rect x="18" y="18" width="3" height="3" fill="#38BDF8" />
      <rect x="44" y="22" width="4" height="12" fill="#FEF08A" className="animate-arcade-twinkle" />
      <rect x="40" y="26" width="12" height="4" fill="#FEF08A" className="animate-arcade-twinkle" />
      <rect x="92" y="14" width="3" height="3" fill="#FFFFFF" />
      <rect x="184" y="18" width="3" height="3" fill="#38BDF8" />
      <rect x="196" y="76" width="3" height="3" fill="#FEF08A" />
      <rect x="26" y="70" width="3" height="3" fill="#FFFFFF" />
      <rect x="78" y="110" width="3" height="3" fill="#7DD3FC" />
    </g>

    {/* Curved glowing blue planet horizon */}
    <ellipse cx="110" cy="168" rx="140" ry="44" fill="url(#planetGlow)" />
    <ellipse cx="110" cy="172" rx="126" ry="38" fill="#1D4ED8" stroke="#38BDF8" strokeWidth="3" />
    <ellipse cx="110" cy="176" rx="116" ry="30" fill="#1E3A8A" />

    {/* Pixel Space Rocket blasting diagonally */}
    <g transform="translate(26 34) rotate(-42 42 48)" shapeRendering="crispEdges" className="animate-arcade-float">
      {/* Exhaust flames */}
      <rect x="34" y="74" width="16" height="12" fill="#F97316" />
      <rect x="38" y="84" width="8" height="12" fill="#FACC15" />
      <rect x="40" y="74" width="4" height="14" fill="#FEF08A" />
      {/* Side fins */}
      <rect x="22" y="54" width="10" height="20" fill="#EF4444" />
      <rect x="52" y="54" width="10" height="20" fill="#EF4444" />
      <rect x="24" y="58" width="4" height="12" fill="#F87171" />
      {/* Rocket hull */}
      <rect x="30" y="24" width="24" height="48" fill="#F1F5F9" />
      <rect x="48" y="24" width="6" height="48" fill="#CBD5E1" />
      <rect x="34" y="14" width="16" height="12" fill="#EF4444" />
      <rect x="38" y="6" width="8" height="10" fill="#DC2626" />
      {/* Cockpit window */}
      <rect x="36" y="34" width="12" height="12" fill="#0EA5E9" />
      <rect x="38" y="36" width="8" height="8" fill="#38BDF8" />
      <rect x="38" y="36" width="4" height="4" fill="#E0F2FE" />
      {/* Base engine */}
      <rect x="32" y="70" width="20" height="5" fill="#475569" />
    </g>

    {/* Floating Pixel Word Asteroids */}
    <g shapeRendering="crispEdges">
      {/* Asteroid 1: type */}
      <g transform="translate(114 14)">
        <rect x="4" y="0" width="48" height="26" fill="#6D28D9" />
        <rect x="0" y="4" width="56" height="18" fill="#7C3AED" />
        <rect x="4" y="4" width="48" height="18" fill="#A78BFA" />
        <rect x="4" y="18" width="48" height="4" fill="#6D28D9" />
        <text x="28" y="16" textAnchor="middle" fill="#0F0728" fontFamily="var(--font-mono)" fontWeight="800" fontSize="12">
          type
        </text>
      </g>
      {/* Asteroid 2: fast */}
      <g transform="translate(152 50)">
        <rect x="4" y="0" width="48" height="26" fill="#5B21B6" />
        <rect x="0" y="4" width="56" height="18" fill="#6D28D9" />
        <rect x="4" y="4" width="48" height="18" fill="#C4B5FD" />
        <rect x="4" y="18" width="48" height="4" fill="#5B21B6" />
        <text x="28" y="16" textAnchor="middle" fill="#0F0728" fontFamily="var(--font-mono)" fontWeight="800" fontSize="12">
          fast
        </text>
      </g>
      {/* Asteroid 3: speed */}
      <g transform="translate(112 84)">
        <rect x="4" y="0" width="60" height="26" fill="#5B21B6" />
        <rect x="0" y="4" width="68" height="18" fill="#7C3AED" />
        <rect x="4" y="4" width="60" height="18" fill="#A78BFA" />
        <rect x="4" y="18" width="60" height="4" fill="#4C1D95" />
        <text x="34" y="16" textAnchor="middle" fill="#0F0728" fontFamily="var(--font-mono)" fontWeight="800" fontSize="12">
          speed
        </text>
      </g>
    </g>
  </svg>
);

/**
 * CARD 2 ART (MAGENTA): SPEED CHALLENGE — Stopwatch + blazing pixel keyboard & typist hands
 */
export const SpeedChallengePixelArt: React.FC = () => (
  <svg viewBox="0 0 220 155" className="w-full h-full block" aria-hidden="true">
    <defs>
      <linearGradient id="speedBg" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#1B052B" />
        <stop offset="65%" stopColor="#32094D" />
        <stop offset="100%" stopColor="#1E0836" />
      </linearGradient>
    </defs>
    <rect width="220" height="155" fill="url(#speedBg)" />

    {/* Neon speed lines */}
    <g shapeRendering="crispEdges">
      <rect x="16" y="34" width="42" height="3" fill="#FF2BD6" opacity="0.7" />
      <rect x="28" y="48" width="28" height="3" fill="#F472B6" opacity="0.85" />
      <rect x="12" y="64" width="38" height="3" fill="#FF2BD6" opacity="0.55" />
      <rect x="160" y="36" width="34" height="3" fill="#F472B6" opacity="0.7" />
      <rect x="172" y="54" width="28" height="3" fill="#FF2BD6" opacity="0.6" />
    </g>

    {/* Lightning bolts */}
    <polygon points="32,76 42,76 36,88 46,88 30,106 36,92 26,92" fill="#FDE047" />
    <polygon points="184,66 196,66 188,80 198,80 180,100 186,84 176,84" fill="#FDE047" />

    {/* Pixel Stopwatch */}
    <g transform="translate(72 8)">
      {/* Top plunger */}
      <rect x="28" y="0" width="20" height="7" fill="#E2E8F0" shapeRendering="crispEdges" />
      <rect x="34" y="7" width="8" height="6" fill="#C084FC" shapeRendering="crispEdges" />
      <rect x="58" y="10" width="10" height="6" transform="rotate(35 58 10)" fill="#F472B6" />
      {/* Outer ring */}
      <circle cx="38" cy="44" r="32" fill="#3B0764" stroke="#E879F9" strokeWidth="5" />
      <circle cx="38" cy="44" r="25" fill="#1E1038" stroke="#A855F7" strokeWidth="2" />
      {/* Clock ticks */}
      <rect x="36.5" y="22" width="3" height="5" fill="#F8FAFC" />
      <rect x="36.5" y="61" width="3" height="5" fill="#F8FAFC" />
      <rect x="16" y="42.5" width="5" height="3" fill="#F8FAFC" />
      <rect x="55" y="42.5" width="5" height="3" fill="#F8FAFC" />
      {/* Hands */}
      <line x1="38" y1="44" x2="38" y2="27" stroke="#F472B6" strokeWidth="3.5" strokeLinecap="round" />
      <line x1="38" y1="44" x2="52" y2="35" stroke="#FEF08A" strokeWidth="3" strokeLinecap="round" />
      <circle cx="38" cy="44" r="3.5" fill="#FFFFFF" />
    </g>

    {/* Pixel Backlit Keyboard */}
    <g shapeRendering="crispEdges" transform="translate(36 86)">
      <rect x="0" y="6" width="148" height="46" fill="#1E1B4B" />
      <rect x="4" y="2" width="140" height="50" fill="#312E81" />
      <rect x="6" y="4" width="136" height="46" fill="#17153B" />
      {/* Key rows */}
      {[12, 26, 40, 54, 68, 82, 96, 110, 124].map((x) => (
        <rect key={`sk1-${x}`} x={x} y="10" width="10" height="8" fill="#818CF8" />
      ))}
      {[16, 30, 44, 58, 72, 86, 100, 114].map((x) => (
        <rect key={`sk2-${x}`} x={x} y="22" width="10" height="8" fill="#A5B4FC" />
      ))}
      <rect x="44" y="34" width="60" height="9" fill="#E879F9" />
      <rect x="16" y="34" width="22" height="9" fill="#6366F1" />
      <rect x="110" y="34" width="22" height="9" fill="#6366F1" />
    </g>

    {/* Pixel Typist Hands */}
    <g shapeRendering="crispEdges">
      {/* Left hand + sleeve */}
      <rect x="44" y="138" width="28" height="17" fill="#6366F1" />
      <rect x="48" y="134" width="22" height="6" fill="#F8FAFC" />
      <rect x="48" y="114" width="26" height="20" fill="#FDBA74" />
      <rect x="52" y="104" width="6" height="12" fill="#FDBA74" />
      <rect x="60" y="100" width="6" height="16" fill="#FED7AA" />
      <rect x="68" y="106" width="6" height="12" fill="#FDBA74" />
      <rect x="74" y="118" width="8" height="8" fill="#FB923C" />
      {/* Right hand + sleeve */}
      <rect x="148" y="138" width="28" height="17" fill="#6366F1" />
      <rect x="150" y="134" width="22" height="6" fill="#F8FAFC" />
      <rect x="146" y="114" width="26" height="20" fill="#FDBA74" />
      <rect x="162" y="104" width="6" height="12" fill="#FDBA74" />
      <rect x="154" y="100" width="6" height="16" fill="#FED7AA" />
      <rect x="146" y="106" width="6" height="12" fill="#FDBA74" />
      <rect x="138" y="118" width="8" height="8" fill="#FB923C" />
    </g>
  </svg>
);

/**
 * CARD 3 ART (AMBER): WORD FALL — Falling glowing pixel word tiles over golden keyboard bar
 */
export const WordFallPixelArt: React.FC = () => (
  <svg viewBox="0 0 220 155" className="w-full h-full block" aria-hidden="true">
    <defs>
      <linearGradient id="fallBg" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#261202" />
        <stop offset="65%" stopColor="#422006" />
        <stop offset="100%" stopColor="#1C0E03" />
      </linearGradient>
    </defs>
    <rect width="220" height="155" fill="url(#fallBg)" />

    {/* Vertical golden rain streaks */}
    <g shapeRendering="crispEdges">
      <rect x="34" y="0" width="3" height="68" fill="#F59E0B" opacity="0.45" />
      <rect x="66" y="0" width="3" height="44" fill="#FDE047" opacity="0.55" />
      <rect x="128" y="0" width="3" height="58" fill="#F59E0B" opacity="0.45" />
      <rect x="176" y="0" width="3" height="72" fill="#FDE047" opacity="0.5" />
      <rect x="32" y="68" width="7" height="7" fill="#FEF08A" opacity="0.7" />
      <rect x="174" y="72" width="7" height="7" fill="#FEF08A" opacity="0.7" />
    </g>

    {/* Falling Pixel Word Tiles */}
    <g shapeRendering="crispEdges" className="animate-arcade-float">
      {/* Tile 1: typing (Cyan glow) */}
      <g transform="translate(52 16)">
        <rect x="0" y="0" width="84" height="26" fill="#0284C7" />
        <rect x="3" y="3" width="78" height="20" fill="#38BDF8" />
        <rect x="3" y="3" width="78" height="4" fill="#BAE6FD" />
        <text x="42" y="17" textAnchor="middle" fill="#082F49" fontFamily="var(--font-mono)" fontWeight="800" fontSize="13">
          typing
        </text>
      </g>

      {/* Tile 2: keyboard (Gold glow) */}
      <g transform="translate(106 54)">
        <rect x="0" y="0" width="96" height="26" fill="#D97706" />
        <rect x="3" y="3" width="90" height="20" fill="#FDE047" />
        <rect x="3" y="3" width="90" height="4" fill="#FEF9C3" />
        <text x="48" y="17" textAnchor="middle" fill="#451A03" fontFamily="var(--font-mono)" fontWeight="800" fontSize="12">
          keyboard
        </text>
      </g>

      {/* Tile 3: challenge (Warm cream-gold) */}
      <g transform="translate(26 90)">
        <rect x="0" y="0" width="104" height="26" fill="#B45309" />
        <rect x="3" y="3" width="98" height="20" fill="#FEF08A" />
        <rect x="3" y="3" width="98" height="4" fill="#FFFFFF" />
        <text x="52" y="17" textAnchor="middle" fill="#451A03" fontFamily="var(--font-mono)" fontWeight="800" fontSize="12">
          challenge
        </text>
      </g>
    </g>

    {/* Glowing Golden Arcade Key Row Base */}
    <g shapeRendering="crispEdges">
      <rect x="0" y="128" width="220" height="27" fill="#2A1203" />
      {[8, 29, 50, 71, 92, 113, 134, 155, 176, 197].map((x) => (
        <g key={`gk-${x}`}>
          <rect x={x} y="132" width="17" height="17" fill="#D97706" />
          <rect x={x + 2} y="132" width="13" height="13" fill="#FACC15" />
          <rect x={x + 2} y="132" width="13" height="3" fill="#FEF9C3" />
        </g>
      ))}
    </g>
  </svg>
);

/**
 * CARD 4 ART (VIOLET): CYBER DOJO — 2D Pixel Martial Arts Fighting Arena with HP Bars & Hit Clash
 */
export const CyberDojoPixelArt: React.FC = () => (
  <svg viewBox="0 0 220 155" className="w-full h-full block" aria-hidden="true">
    <defs>
      <linearGradient id="dojoBg" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#130529" />
        <stop offset="68%" stopColor="#260A4A" />
        <stop offset="100%" stopColor="#0E0720" />
      </linearGradient>
    </defs>
    <rect width="220" height="155" fill="url(#dojoBg)" />

    {/* Dojo Neon Torii Silhouette */}
    <g shapeRendering="crispEdges" opacity="0.45">
      <rect x="46" y="34" width="128" height="8" fill="#7E22CE" />
      <rect x="58" y="46" width="104" height="5" fill="#7E22CE" />
      <rect x="66" y="42" width="10" height="86" fill="#581C87" />
      <rect x="144" y="42" width="10" height="86" fill="#581C87" />
    </g>

    {/* Mini Overhead Fighting HP Bars */}
    <g shapeRendering="crispEdges">
      {/* Player HP (Left) */}
      <rect x="14" y="12" width="76" height="10" fill="#0F172A" />
      <rect x="16" y="14" width="60" height="6" fill="#10F57A" />
      {/* VS Badge */}
      <rect x="97" y="10" width="26" height="14" fill="#A855F7" />
      <text x="110" y="20" textAnchor="middle" fill="#FFFFFF" fontFamily="var(--font-mono)" fontWeight="800" fontSize="9">
        VS
      </text>
      {/* Opponent HP (Right) */}
      <rect x="130" y="12" width="76" height="10" fill="#0F172A" />
      <rect x="150" y="14" width="54" height="6" fill="#F43F5E" />
    </g>

    {/* Floating word bubble above opponent */}
    <g shapeRendering="crispEdges">
      <rect x="128" y="30" width="64" height="20" fill="#1E1038" />
      <rect x="128" y="30" width="64" height="2" fill="#A855F7" />
      <rect x="128" y="48" width="64" height="2" fill="#A855F7" />
      <text x="160" y="43" textAnchor="middle" fill="#38BDF8" fontFamily="var(--font-mono)" fontWeight="800" fontSize="11">
        combo
      </text>
    </g>

    {/* Neon Dojo Floor */}
    <g shapeRendering="crispEdges">
      <rect x="0" y="126" width="220" height="29" fill="#14092B" />
      <rect x="0" y="126" width="220" height="3" fill="#C084FC" />
      <rect x="20" y="138" width="180" height="2" fill="#7E22CE" opacity="0.6" />
    </g>

    {/* Left Fighter (Player — Cyan Cyber Martial Artist lunging) */}
    <g shapeRendering="crispEdges" transform="translate(28 60)">
      {/* Headband */}
      <rect x="18" y="8" width="18" height="5" fill="#00E5FF" />
      <rect x="6" y="10" width="12" height="4" fill="#38BDF8" />
      {/* Head */}
      <rect x="20" y="13" width="16" height="13" fill="#FDBA74" />
      <rect x="30" y="16" width="5" height="3" fill="#0F172A" />
      {/* Torso */}
      <rect x="16" y="26" width="22" height="22" fill="#0F172A" />
      <rect x="22" y="28" width="14" height="16" fill="#0EA5E9" />
      {/* Punching arm */}
      <rect x="38" y="30" width="24" height="8" fill="#00E5FF" />
      <rect x="58" y="28" width="10" height="12" fill="#FEF08A" />
      {/* Legs */}
      <rect x="14" y="48" width="10" height="18" fill="#1E293B" />
      <rect x="30" y="48" width="12" height="18" fill="#1E293B" />
      <rect x="12" y="62" width="12" height="5" fill="#00E5FF" />
      <rect x="30" y="62" width="14" height="5" fill="#00E5FF" />
    </g>

    {/* Right Fighter (Rival — Crimson/Violet Cyber Boxer) */}
    <g shapeRendering="crispEdges" transform="translate(132 60)">
      {/* Helmet + Glowing Visor */}
      <rect x="18" y="6" width="20" height="18" fill="#581C87" />
      <rect x="16" y="12" width="14" height="5" fill="#F43F5E" />
      {/* Torso */}
      <rect x="16" y="24" width="24" height="24" fill="#3B0764" />
      <rect x="18" y="28" width="14" height="14" fill="#E11D48" />
      {/* Guarding arm */}
      <rect x="4" y="30" width="14" height="10" fill="#F43F5E" />
      {/* Legs */}
      <rect x="16" y="48" width="10" height="18" fill="#1E1B4B" />
      <rect x="32" y="48" width="10" height="18" fill="#1E1B4B" />
      <rect x="14" y="62" width="12" height="5" fill="#F43F5E" />
      <rect x="32" y="62" width="12" height="5" fill="#F43F5E" />
    </g>

    {/* Electric Hit-Spark Clash in Center */}
    <g shapeRendering="crispEdges" className="animate-arcade-twinkle">
      <rect x="104" y="84" width="16" height="16" fill="#FEF08A" />
      <rect x="108" y="76" width="8" height="32" fill="#FFFFFF" />
      <rect x="96" y="88" width="32" height="8" fill="#00E5FF" />
      <rect x="98" y="78" width="6" height="6" fill="#FF2BD6" />
      <rect x="120" y="100" width="6" height="6" fill="#FF2BD6" />
    </g>
  </svg>
);

/**
 * CARD 5 ART (EMERALD): BOSS TYPE — Caped Hero with Glowing Keyboard Sword vs Crowned Pixel Mech Boss
 */
export const BossTypePixelArt: React.FC = () => (
  <svg viewBox="0 0 220 155" className="w-full h-full block" aria-hidden="true">
    <defs>
      <linearGradient id="bossBg" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#031D18" />
        <stop offset="68%" stopColor="#063D31" />
        <stop offset="100%" stopColor="#052E24" />
      </linearGradient>
    </defs>
    <rect width="220" height="155" fill="url(#bossBg)" />

    {/* Pixel cavern stone silhouettes */}
    <g shapeRendering="crispEdges" opacity="0.55">
      <rect x="0" y="34" width="38" height="86" fill="#064E3B" />
      <rect x="38" y="54" width="24" height="66" fill="#065F46" />
      <rect x="176" y="42" width="44" height="78" fill="#064E3B" />
    </g>

    {/* Boss Segmented Health Bar */}
    <g shapeRendering="crispEdges">
      <rect x="52" y="12" width="116" height="12" fill="#052E24" />
      <rect x="50" y="10" width="120" height="2" fill="#A7F3D0" />
      <rect x="50" y="24" width="120" height="2" fill="#A7F3D0" />
      <rect x="54" y="14" width="54" height="8" fill="#EF4444" />
      <rect x="108" y="14" width="30" height="8" fill="#FACC15" />
      <rect x="138" y="14" width="26" height="8" fill="#10F57A" />
    </g>

    {/* Giant Crowned Pixel Mech Boss (Right) */}
    <g shapeRendering="crispEdges" transform="translate(106 28)" className="animate-arcade-float">
      {/* Golden Crown */}
      <rect x="32" y="0" width="6" height="8" fill="#FACC15" />
      <rect x="44" y="0" width="6" height="10" fill="#FEF08A" />
      <rect x="56" y="0" width="6" height="8" fill="#FACC15" />
      <rect x="32" y="6" width="30" height="6" fill="#F59E0B" />
      {/* Boss Head */}
      <rect x="20" y="12" width="54" height="36" fill="#7C3AED" />
      <rect x="24" y="16" width="46" height="28" fill="#A855F7" />
      <rect x="28" y="20" width="38" height="20" fill="#1E1038" />
      {/* Glowing Green Eyes & Grin */}
      <rect x="33" y="24" width="10" height="6" fill="#10F57A" />
      <rect x="51" y="24" width="10" height="6" fill="#10F57A" />
      <rect x="35" y="34" width="24" height="4" fill="#34D399" />
      <rect x="39" y="34" width="3" height="4" fill="#1E1038" />
      <rect x="46" y="34" width="3" height="4" fill="#1E1038" />
      <rect x="53" y="34" width="3" height="4" fill="#1E1038" />
      {/* Arms & Body */}
      <rect x="26" y="48" width="42" height="26" fill="#6D28D9" />
      <rect x="34" y="54" width="26" height="12" fill="#10F57A" opacity="0.85" />
      <rect x="6" y="42" width="20" height="14" fill="#9333EA" />
      <rect x="0" y="54" width="14" height="16" fill="#C084FC" />
      <rect x="68" y="42" width="20" height="14" fill="#9333EA" />
      <rect x="78" y="54" width="14" height="16" fill="#C084FC" />
    </g>

    {/* Pixel Floor */}
    <g shapeRendering="crispEdges">
      <rect x="0" y="126" width="220" height="29" fill="#04241D" />
      <rect x="0" y="126" width="220" height="4" fill="#10F57A" />
    </g>

    {/* Hero Knight with Glowing Keyboard Sword (Left) */}
    <g shapeRendering="crispEdges" transform="translate(18 68)">
      {/* Flowing Magenta Cape */}
      <rect x="0" y="30" width="22" height="18" fill="#EC4899" />
      <rect x="6" y="26" width="18" height="16" fill="#F472B6" />
      {/* Hero Hair & Head */}
      <rect x="22" y="6" width="20" height="10" fill="#92400E" />
      <rect x="16" y="10" width="6" height="6" fill="#38BDF8" />
      <rect x="24" y="14" width="16" height="12" fill="#FDBA74" />
      <rect x="34" y="16" width="4" height="4" fill="#0F172A" />
      {/* Tunic & Legs */}
      <rect x="22" y="26" width="20" height="20" fill="#1D4ED8" />
      <rect x="22" y="46" width="8" height="14" fill="#0F172A" />
      <rect x="34" y="46" width="8" height="14" fill="#0F172A" />
      <rect x="20" y="56" width="10" height="4" fill="#38BDF8" />
      <rect x="34" y="56" width="10" height="4" fill="#38BDF8" />
      {/* Glowing Cyan Pixel-Keyboard Sword */}
      <g transform="translate(42 26) rotate(-32)">
        <rect x="0" y="8" width="10" height="6" fill="#FACC15" />
        <rect x="8" y="2" width="42" height="18" fill="#00E5FF" />
        <rect x="12" y="5" width="34" height="12" fill="#E0F2FE" />
        {/* Tiny pixel keys along the blade */}
        {[15, 21, 27, 33, 39].map((kx) => (
          <g key={`sw-${kx}`}>
            <rect x={kx} y="7" width="4" height="3" fill="#0284C7" />
            <rect x={kx} y="12" width="4" height="3" fill="#0284C7" />
          </g>
        ))}
      </g>
    </g>
  </svg>
);
