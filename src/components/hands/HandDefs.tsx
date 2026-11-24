import React from 'react';
import { SkinPalette, FINGER_ANCHORS } from './HandArchitectureTypes';

interface HandDefsProps {
  palette: SkinPalette;
  isDarkKeyboard?: boolean;
}

export const HandDefs: React.FC<HandDefsProps> = ({ palette, isDarkKeyboard = false }) => {
  const warmth = palette.subdermalWarmth || '#F97316';
  const shadowCol = palette.shadowColor || '#0F172A';

  return (
    <defs>
      {/* 1. SOFT CONTACT SHADOWS */}
      <filter id="hand-natural-shadow" x="-25%" y="-25%" width="150%" height="150%">
        <feDropShadow dx="0" dy="5" stdDeviation="4.5" floodColor={shadowCol} floodOpacity="0.18" />
        <feDropShadow dx="0" dy="1.5" stdDeviation="1.5" floodColor={shadowCol} floodOpacity="0.12" />
      </filter>

      <filter id="crisp-hand-shadow" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="0" dy="4" stdDeviation="3.5" floodColor="#020617" floodOpacity="0.25" />
      </filter>

      <filter id="keycap-shadow" x="-10%" y="-10%" width="120%" height="130%">
        <feDropShadow dx="0" dy="1.5" stdDeviation="1" floodColor="#0F172A" floodOpacity="0.14" />
      </filter>

      {/* 2. ACTIVE TARGET TOUCH GLOW */}
      <filter id="active-touch-glow" x="-40%" y="-40%" width="180%" height="180%">
        <feGaussianBlur stdDeviation="3.5" result="blur" />
        <feMerge>
          <feMergeNode in="blur" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>

      <filter id="organic-skin-blend" x="-10%" y="-10%" width="120%" height="120%">
        <feGaussianBlur in="SourceGraphic" stdDeviation="0.35" result="blurredDermis" />
        <feMerge>
          <feMergeNode in="blurredDermis" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>

      <filter id="cyber-neon-glow" x="-40%" y="-40%" width="180%" height="180%">
        <feGaussianBlur stdDeviation="3" result="coloredBlur" />
        <feMerge>
          <feMergeNode in="coloredBlur" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>

      {/* 3. CLASSIC TYPING.COM TRANSLUCENT PALE-BLUE HAND GRADIENTS */}
      {/* Translucent pale sky-blue wash fading softly at the wrist so keycap legends stay razor sharp */}
      <linearGradient id="typingComTranslucentFill" x1="0%" y1="0%" x2="0%" y2="100%">
        {isDarkKeyboard ? (
          <>
            <stop offset="0%" stopColor="#BAE6FD" stopOpacity="0.28" />
            <stop offset="52%" stopColor="#93C5FD" stopOpacity="0.22" />
            <stop offset="86%" stopColor="#60A5FA" stopOpacity="0.14" />
            <stop offset="100%" stopColor="#60A5FA" stopOpacity="0.02" />
          </>
        ) : (
          <>
            <stop offset="0%" stopColor="#E0F2FE" stopOpacity="0.62" />
            <stop offset="48%" stopColor="#BAE6FD" stopOpacity="0.52" />
            <stop offset="84%" stopColor="#93C5FD" stopOpacity="0.34" />
            <stop offset="100%" stopColor="#93C5FD" stopOpacity="0.05" />
          </>
        )}
      </linearGradient>

      {/* Vibrant Typing.com Active Finger Fill — matches the #2596E8 target keycap */}
      <linearGradient id="typingComActiveFingerGrad" x1="0%" y1="100%" x2="0%" y2="0%">
        <stop offset="0%" stopColor="#2596E8" stopOpacity="0.24" />
        <stop offset="32%" stopColor="#2596E8" stopOpacity="0.66" />
        <stop offset="76%" stopColor="#38BDF8" stopOpacity="0.82" />
        <stop offset="100%" stopColor="#60C8FA" stopOpacity="0.88" />
      </linearGradient>

      {/* Coordinated Typing.com Opposite-Hand Shift Pinky Fill */}
      <linearGradient id="typingComShiftFingerGrad" x1="0%" y1="100%" x2="0%" y2="0%">
        <stop offset="0%" stopColor="#2563EB" stopOpacity="0.24" />
        <stop offset="32%" stopColor="#2563EB" stopOpacity="0.64" />
        <stop offset="78%" stopColor="#3B82F6" stopOpacity="0.80" />
        <stop offset="100%" stopColor="#60A5FA" stopOpacity="0.86" />
      </linearGradient>

      {/* Subtle tactile pad press bloom when active finger strikes a key */}
      <radialGradient id="typingComPressBloom" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.72" />
        <stop offset="55%" stopColor="#38BDF8" stopOpacity="0.32" />
        <stop offset="100%" stopColor="#2596E8" stopOpacity="0" />
      </radialGradient>

      {/* 4. REALISTIC HUMAN SKIN GRADIENTS */}
      <linearGradient id="humanPalmGradLeft" x1="15%" y1="0%" x2="85%" y2="100%">
        <stop offset="0%" stopColor={palette.palmGradStart} />
        <stop offset="45%" stopColor={palette.palmGradMid} />
        <stop offset="88%" stopColor={palette.palmGradEnd} />
        <stop offset="100%" stopColor={palette.palmGradEnd} stopOpacity="0.2" />
      </linearGradient>

      <linearGradient id="humanPalmGradRight" x1="85%" y1="0%" x2="15%" y2="100%">
        <stop offset="0%" stopColor={palette.palmGradStart} />
        <stop offset="45%" stopColor={palette.palmGradMid} />
        <stop offset="88%" stopColor={palette.palmGradEnd} />
        <stop offset="100%" stopColor={palette.palmGradEnd} stopOpacity="0.2" />
      </linearGradient>

      <radialGradient id="thenarWarmthLeft" cx="70%" cy="30%" r="75%">
        <stop offset="0%" stopColor={warmth} stopOpacity="0.20" />
        <stop offset="60%" stopColor={palette.palmGradMid} stopOpacity="0.06" />
        <stop offset="100%" stopColor={palette.palmGradEnd} stopOpacity="0" />
      </radialGradient>

      <radialGradient id="thenarWarmthRight" cx="30%" cy="30%" r="75%">
        <stop offset="0%" stopColor={warmth} stopOpacity="0.20" />
        <stop offset="60%" stopColor={palette.palmGradMid} stopOpacity="0.06" />
        <stop offset="100%" stopColor={palette.palmGradEnd} stopOpacity="0" />
      </radialGradient>

      <linearGradient id="humanActiveFingerSkinGrad" x1="0%" y1="100%" x2="0%" y2="0%">
        <stop offset="0%" stopColor={palette.activeAura} stopOpacity="0.12" />
        <stop offset="65%" stopColor={palette.activeAura} stopOpacity="0.45" />
        <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0.72" />
      </linearGradient>

      <linearGradient id="tendonSheenGrad" x1="0%" y1="100%" x2="0%" y2="0%">
        <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.0" />
        <stop offset="50%" stopColor="#FFFFFF" stopOpacity="0.28" />
        <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0.0" />
      </linearGradient>

      <linearGradient id="nailPlateGrad" x1="0%" y1="100%" x2="0%" y2="0%">
        <stop offset="0%" stopColor={palette.nailBed} stopOpacity="0.75" />
        <stop offset="65%" stopColor={palette.nailBed} stopOpacity="0.92" />
        <stop offset="92%" stopColor="#FFFFFF" stopOpacity="0.88" />
        <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0.96" />
      </linearGradient>

      <radialGradient id="nailLunulaGrad" cx="50%" cy="100%" r="65%">
        <stop offset="0%" stopColor={palette.nailLunula} stopOpacity="0.9" />
        <stop offset="100%" stopColor={palette.nailLunula} stopOpacity="0" />
      </radialGradient>

      <radialGradient id="touchPulseWave" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor={palette.activeAura} stopOpacity="0.85" />
        <stop offset="45%" stopColor={palette.activeAura} stopOpacity="0.32" />
        <stop offset="100%" stopColor={palette.activeAura} stopOpacity="0" />
      </radialGradient>

      {/* 5. HARMONIZED FINGER ZONE GRADIENTS (Synced 1:1 with FINGER_ANCHORS & Legend) */}
      {Object.values(FINGER_ANCHORS).map((anchor) => (
        <linearGradient
          key={anchor.key}
          id={`grad-finger-${anchor.key}`}
          x1="0%"
          y1="100%"
          x2="0%"
          y2="0%"
        >
          <stop offset="0%" stopColor={anchor.zoneColorDark} stopOpacity="0.22" />
          <stop offset="55%" stopColor={anchor.zoneColor} stopOpacity="0.52" />
          <stop offset="100%" stopColor={anchor.zoneColor} stopOpacity="0.82" />
        </linearGradient>
      ))}

      {/* 6. GLASS HAND GRADIENTS */}
      <linearGradient id="glassHandBodyGrad" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#38BDF8" stopOpacity="0.22" />
        <stop offset="45%" stopColor="#0284C7" stopOpacity="0.16" />
        <stop offset="85%" stopColor="#0F172A" stopOpacity="0.32" />
        <stop offset="100%" stopColor="#0369A1" stopOpacity="0.06" />
      </linearGradient>

      <linearGradient id="glassHandRimGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#38BDF8" stopOpacity="0.9" />
        <stop offset="50%" stopColor="#818CF8" stopOpacity="0.55" />
        <stop offset="100%" stopColor="#0284C7" stopOpacity="0.65" />
      </linearGradient>
    </defs>
  );
};
