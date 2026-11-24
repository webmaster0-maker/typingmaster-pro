import React, { useEffect, useRef, useState } from 'react';
import { GrowthProfile } from '../types';
import { GROWTH_STAGES } from '../utils/growthEngine';
import { ArrowRight, Check, Crown, Droplets, Lock, Sparkles } from 'lucide-react';

interface GrowthPlantAvatarProps {
  growthProfile: GrowthProfile;
  compact?: boolean;
}

export const PlantStageIllustration: React.FC<{ stageLevel: number }> = ({ stageLevel }) => {
  switch (stageLevel) {
    case 1: // Dormant Seedling
      return (
        <svg viewBox="0 0 160 160" className="w-full h-full drop-shadow-md">
          <defs>
            <radialGradient id="s1Glow" cx="50%" cy="65%" r="45%">
              <stop offset="0%" stopColor="#10B981" stopOpacity="0.28" />
              <stop offset="100%" stopColor="#0F172A" stopOpacity="0" />
            </radialGradient>
          </defs>
          <circle cx="80" cy="108" r="46" fill="url(#s1Glow)" />
          {/* Layered fertile soil mound */}
          <path d="M18 136 Q80 112 142 136 L142 155 L18 155 Z" fill="#3D2817" />
          <path d="M28 139 Q80 120 132 139" stroke="#5C3D24" strokeWidth="3" strokeLinecap="round" fill="none" />
          {/* Root threads */}
          <path d="M80 133 Q74 142 66 147" stroke="#8D5B33" strokeWidth="1.8" strokeLinecap="round" fill="none" />
          <path d="M82 134 Q89 143 96 147" stroke="#8D5B33" strokeWidth="1.8" strokeLinecap="round" fill="none" />
          {/* Golden-brown seed shell & emerging emerald cotyledon */}
          <ellipse cx="80" cy="125" rx="9" ry="12.5" fill="#9A6338" transform="rotate(-12 80 125)" />
          <ellipse cx="78" cy="124" rx="4" ry="8" fill="#B57B4C" opacity="0.55" transform="rotate(-12 78 124)" />
          <path d="M80 116 C79 104 86 96 92 98 C90 107 85 113 80 116 Z" fill="#10B981" />
          <path d="M80 116 C75 107 71 102 67 104 C69 111 74 115 80 116 Z" fill="#34D399" />
          <circle cx="91" cy="95" r="2" fill="#6EE7B7" />
        </svg>
      );

    case 2: // Tender Sprout
      return (
        <svg viewBox="0 0 160 160" className="w-full h-full drop-shadow-md">
          <defs>
            <radialGradient id="s2Glow" cx="50%" cy="55%" r="48%">
              <stop offset="0%" stopColor="#34D399" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#0F172A" stopOpacity="0" />
            </radialGradient>
          </defs>
          <circle cx="80" cy="92" r="52" fill="url(#s2Glow)" />
          <path d="M22 136 Q80 116 138 136 L138 155 L22 155 Z" fill="#3D2817" />
          <path d="M32 139 Q80 122 128 139" stroke="#5C3D24" strokeWidth="2.5" fill="none" />
          {/* Vibrant curving stem */}
          <path d="M80 132 Q77 96 82 68" stroke="#10B981" strokeWidth="5" strokeLinecap="round" fill="none" />
          {/* Twin unfurling leaves */}
          <path d="M80 96 C56 90 44 68 73 73 C79 80 80 88 80 96 Z" fill="#34D399" />
          <path d="M80 96 Q66 85 59 77" stroke="#047857" strokeWidth="1.3" fill="none" />
          <path d="M82 82 C106 76 116 54 88 60 C83 67 82 75 82 82 Z" fill="#10B981" />
          <path d="M82 82 Q96 72 103 63" stroke="#065F46" strokeWidth="1.3" fill="none" />
          {/* Center apical bud */}
          <path d="M82 68 C77 56 88 56 82 68 Z" fill="#A7F3D0" />
          {/* Luminous dewdrop */}
          <circle cx="101" cy="63" r="3" fill="#67E8F9" />
          <circle cx="100" cy="62" r="1" fill="#FFFFFF" />
        </svg>
      );

    case 3: // Branching Sapling
      return (
        <svg viewBox="0 0 160 160" className="w-full h-full drop-shadow-md">
          <defs>
            <radialGradient id="s3Glow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#2DD4BF" stopOpacity="0.32" />
              <stop offset="100%" stopColor="#0F172A" stopOpacity="0" />
            </radialGradient>
          </defs>
          <circle cx="80" cy="80" r="56" fill="url(#s3Glow)" />
          <path d="M22 136 Q80 118 138 136 L138 155 L22 155 Z" fill="#3D2817" />
          {/* Young woody-emerald stem & branches */}
          <path d="M80 133 Q77 90 80 44" stroke="#059669" strokeWidth="6.5" strokeLinecap="round" fill="none" />
          <path d="M78 98 Q54 88 43 70" stroke="#10B981" strokeWidth="3.8" strokeLinecap="round" fill="none" />
          <path d="M81 80 Q106 68 117 50" stroke="#10B981" strokeWidth="3.8" strokeLinecap="round" fill="none" />
          <path d="M79 64 Q60 54 54 40" stroke="#34D399" strokeWidth="2.8" strokeLinecap="round" fill="none" />
          {/* Leaf clusters */}
          <path d="M43 70 C25 65 30 45 50 54 C48 62 45 67 43 70 Z" fill="#34D399" />
          <path d="M117 50 C134 45 128 25 109 34 C111 42 114 47 117 50 Z" fill="#34D399" />
          <path d="M54 40 C40 33 48 18 62 28 C60 34 57 38 54 40 Z" fill="#2DD4BF" />
          <path d="M80 44 C64 25 96 25 80 44 Z" fill="#6EE7B7" />
          <circle cx="48" cy="50" r="2.2" fill="#67E8F9" />
          <circle cx="113" cy="31" r="2.2" fill="#FDE047" />
        </svg>
      );

    case 4: // Flourishing Bonsai
      return (
        <svg viewBox="0 0 160 160" className="w-full h-full drop-shadow-md">
          <defs>
            <radialGradient id="s4Glow" cx="50%" cy="48%" r="50%">
              <stop offset="0%" stopColor="#6366F1" stopOpacity="0.32" />
              <stop offset="100%" stopColor="#0F172A" stopOpacity="0" />
            </radialGradient>
          </defs>
          <circle cx="80" cy="76" r="58" fill="url(#s4Glow)" />
          {/* Ceramic Bonsai Vessel */}
          <path d="M38 131 L122 131 L113 149 L47 149 Z" fill="#334155" stroke="#64748B" strokeWidth="1.5" />
          <rect x="34" y="127" width="92" height="5" rx="2.5" fill="#475569" />
          {/* Sculpted S-curve trunk */}
          <path d="M80 128 Q66 102 85 84 Q96 68 78 46" stroke="#78350F" strokeWidth="8.5" strokeLinecap="round" fill="none" />
          <path d="M77 95 Q55 86 48 72" stroke="#92400E" strokeWidth="4.5" strokeLinecap="round" fill="none" />
          <path d="M86 78 Q106 70 112 58" stroke="#92400E" strokeWidth="4.5" strokeLinecap="round" fill="none" />
          {/* Layered bonsai foliage pads */}
          <ellipse cx="48" cy="68" rx="21" ry="13" fill="#047857" />
          <ellipse cx="52" cy="64" rx="17" ry="10" fill="#10B981" />
          <ellipse cx="110" cy="56" rx="21" ry="13" fill="#047857" />
          <ellipse cx="108" cy="52" rx="17" ry="10" fill="#10B981" />
          <ellipse cx="80" cy="40" rx="26" ry="16" fill="#059669" />
          <ellipse cx="80" cy="36" rx="20" ry="12" fill="#34D399" />
          {/* Early blossom buds */}
          <circle cx="54" cy="60" r="3.8" fill="#F472B6" />
          <circle cx="106" cy="49" r="3.8" fill="#F472B6" />
          <circle cx="80" cy="32" r="4.2" fill="#FBBF24" />
        </svg>
      );

    case 5: // Radiant Bloom Tree
      return (
        <svg viewBox="0 0 160 160" className="w-full h-full drop-shadow-lg">
          <defs>
            <radialGradient id="s5Glow" cx="50%" cy="46%" r="52%">
              <stop offset="0%" stopColor="#EC4899" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#0F172A" stopOpacity="0" />
            </radialGradient>
          </defs>
          <circle cx="80" cy="70" r="60" fill="url(#s5Glow)" />
          <path d="M18 136 Q80 115 142 136 L142 155 L18 155 Z" fill="#065F46" />
          {/* Trunk & sweeping roots */}
          <path d="M75 134 Q63 145 50 149" stroke="#78350F" strokeWidth="3.5" strokeLinecap="round" fill="none" />
          <path d="M85 134 Q97 145 110 149" stroke="#78350F" strokeWidth="3.5" strokeLinecap="round" fill="none" />
          <path d="M80 135 Q75 100 81 74" stroke="#78350F" strokeWidth="10" strokeLinecap="round" fill="none" />
          <path d="M78 90 Q54 75 46 62" stroke="#92400E" strokeWidth="5" strokeLinecap="round" fill="none" />
          <path d="M82 86 Q106 73 114 60" stroke="#92400E" strokeWidth="5" strokeLinecap="round" fill="none" />
          {/* Lush emerald-sakura canopy */}
          <circle cx="48" cy="62" r="22" fill="#047857" />
          <circle cx="112" cy="62" r="22" fill="#047857" />
          <circle cx="80" cy="48" r="29" fill="#10B981" />
          <circle cx="63" cy="38" r="20" fill="#34D399" />
          <circle cx="97" cy="38" r="20" fill="#34D399" />
          {/* Full Sakura & Golden Blooms */}
          <circle cx="48" cy="58" r="6.5" fill="#F472B6" />
          <circle cx="48" cy="58" r="2.5" fill="#FEF08A" />
          <circle cx="112" cy="58" r="6.5" fill="#F472B6" />
          <circle cx="112" cy="58" r="2.5" fill="#FEF08A" />
          <circle cx="80" cy="33" r="7.5" fill="#FB7185" />
          <circle cx="80" cy="33" r="3" fill="#FEF08A" />
          <circle cx="64" cy="48" r="5.5" fill="#EC4899" />
          <circle cx="96" cy="48" r="5.5" fill="#EC4899" />
          <ellipse cx="36" cy="88" rx="3.2" ry="1.6" fill="#F472B6" transform="rotate(28 36 88)" />
          <ellipse cx="124" cy="84" rx="3.2" ry="1.6" fill="#F472B6" transform="rotate(-22 124 84)" />
        </svg>
      );

    case 6: // Master Evergreen Canopy
      return (
        <svg viewBox="0 0 160 160" className="w-full h-full drop-shadow-xl">
          <defs>
            <radialGradient id="s6Glow" cx="50%" cy="48%" r="52%">
              <stop offset="0%" stopColor="#F59E0B" stopOpacity="0.42" />
              <stop offset="100%" stopColor="#312E81" stopOpacity="0" />
            </radialGradient>
          </defs>
          <circle cx="80" cy="65" r="58" fill="url(#s6Glow)" />
          <path d="M15 135 Q80 110 145 135 L145 155 L15 155 Z" fill="#064E3B" />
          {/* Ancient gnarled trunk */}
          <path d="M80 135 Q67 95 80 68" stroke="#92400E" strokeWidth="11.5" strokeLinecap="round" fill="none" />
          <path d="M78 86 Q50 66 35 50" stroke="#B45309" strokeWidth="5.5" strokeLinecap="round" fill="none" />
          <path d="M82 82 Q110 66 125 50" stroke="#B45309" strokeWidth="5.5" strokeLinecap="round" fill="none" />
          {/* Multi-tiered royal evergreen crown */}
          <circle cx="35" cy="50" r="22" fill="#047857" />
          <circle cx="125" cy="50" r="22" fill="#047857" />
          <circle cx="80" cy="42" r="30" fill="#059669" />
          <circle cx="80" cy="28" r="22" fill="#10B981" />
          {/* Golden Star Crest & Amber Fruit */}
          <polygon points="80,10 83,19 92,19 85,24 88,33 80,28 72,33 75,24 68,19 77,19" fill="#FBBF24" />
          <circle cx="44" cy="45" r="5" fill="#F59E0B" />
          <circle cx="116" cy="45" r="5" fill="#F59E0B" />
          <circle cx="64" cy="54" r="4.5" fill="#FDE047" />
          <circle cx="96" cy="54" r="4.5" fill="#FDE047" />
        </svg>
      );

    case 7: // Crystal Lotus Banyan
      return (
        <svg viewBox="0 0 160 160" className="w-full h-full drop-shadow-2xl">
          <defs>
            <radialGradient id="s7Glow" cx="50%" cy="46%" r="55%">
              <stop offset="0%" stopColor="#06B6D4" stopOpacity="0.48" />
              <stop offset="65%" stopColor="#10B981" stopOpacity="0.18" />
              <stop offset="100%" stopColor="#0F172A" stopOpacity="0" />
            </radialGradient>
          </defs>
          <circle cx="80" cy="66" r="62" fill="url(#s7Glow)" />
          {/* Reflecting Pool & Moss Sanctuary */}
          <ellipse cx="80" cy="144" rx="62" ry="11" fill="#083344" stroke="#06B6D4" strokeWidth="1.2" opacity="0.85" />
          <path d="M26 136 Q80 116 134 136 L126 145 L34 145 Z" fill="#065F46" />
          {/* Banyan Core Trunk & Hanging Prism Aerial Roots */}
          <path d="M80 135 Q72 95 80 62" stroke="#0E7490" strokeWidth="12" strokeLinecap="round" fill="none" />
          <path d="M76 82 Q46 66 32 54" stroke="#0891B2" strokeWidth="6" strokeLinecap="round" fill="none" />
          <path d="M84 82 Q114 66 128 54" stroke="#0891B2" strokeWidth="6" strokeLinecap="round" fill="none" />
          {/* Hanging Bioluminescent Aerial Roots */}
          <path d="M44 68 L42 128" stroke="#22D3EE" strokeWidth="2" strokeDasharray="3 2" opacity="0.85" />
          <path d="M56 74 L55 130" stroke="#34D399" strokeWidth="1.8" opacity="0.75" />
          <path d="M104 74 L105 130" stroke="#34D399" strokeWidth="1.8" opacity="0.75" />
          <path d="M116 68 L118 128" stroke="#22D3EE" strokeWidth="2" strokeDasharray="3 2" opacity="0.85" />
          {/* Teal-Cyan Canopy */}
          <circle cx="34" cy="52" r="22" fill="#0F766E" />
          <circle cx="126" cy="52" r="22" fill="#0F766E" />
          <circle cx="80" cy="42" r="32" fill="#0D9488" />
          <circle cx="62" cy="34" r="21" fill="#14B8A6" />
          <circle cx="98" cy="34" r="21" fill="#14B8A6" />
          {/* Crystalline Lotus Crown & Prism Gems */}
          <polygon points="80,12 88,26 80,36 72,26" fill="#67E8F9" />
          <polygon points="80,18 94,28 84,36 76,36 66,28" fill="#A5F3FC" opacity="0.85" />
          <polygon points="36,42 41,50 36,58 31,50" fill="#A5F3FC" />
          <polygon points="124,42 129,50 124,58 119,50" fill="#A5F3FC" />
          <circle cx="64" cy="48" r="4" fill="#F0FDFA" />
          <circle cx="96" cy="48" r="4" fill="#F0FDFA" />
        </svg>
      );

    case 8: // Astral Starlight Sequoia
      return (
        <svg viewBox="0 0 160 160" className="w-full h-full drop-shadow-2xl">
          <defs>
            <radialGradient id="s8Glow" cx="50%" cy="44%" r="56%">
              <stop offset="0%" stopColor="#818CF8" stopOpacity="0.5" />
              <stop offset="60%" stopColor="#38BDF8" stopOpacity="0.2" />
              <stop offset="100%" stopColor="#0F172A" stopOpacity="0" />
            </radialGradient>
          </defs>
          <circle cx="80" cy="64" r="64" fill="url(#s8Glow)" />
          {/* Orbital Starlight Ring */}
          <ellipse
            cx="80"
            cy="60"
            rx="62"
            ry="18"
            fill="none"
            stroke="#A5B4FC"
            strokeWidth="1.4"
            strokeDasharray="5 4"
            transform="rotate(-14 80 60)"
            opacity="0.8"
          />
          <path d="M18 137 Q80 114 142 137 L142 155 L18 155 Z" fill="#1E1B4B" />
          {/* Spire Sequoia Trunk */}
          <path d="M80 138 L80 46" stroke="#4338CA" strokeWidth="12" strokeLinecap="round" />
          <path d="M80 138 L80 46" stroke="#818CF8" strokeWidth="4" strokeLinecap="round" opacity="0.6" />
          {/* Tiered Astral Spire Needles */}
          <polygon points="80,14 44,54 116,54" fill="#312E81" stroke="#6366F1" strokeWidth="1.2" />
          <polygon points="80,28 36,74 124,74" fill="#3730A3" stroke="#818CF8" strokeWidth="1.2" />
          <polygon points="80,46 28,96 132,96" fill="#4338CA" stroke="#A5B4FC" strokeWidth="1.2" />
          {/* Constellation Nodes & Lines */}
          <polyline
            points="54,78 80,58 106,78 80,38 54,78"
            fill="none"
            stroke="#E0E7FF"
            strokeWidth="1"
            opacity="0.65"
          />
          <circle cx="80" cy="14" r="5" fill="#FEF08A" />
          <circle cx="80" cy="38" r="3.5" fill="#E0F2FE" />
          <circle cx="54" cy="78" r="3.5" fill="#C7D2FE" />
          <circle cx="106" cy="78" r="3.5" fill="#C7D2FE" />
          <circle cx="80" cy="58" r="4" fill="#38BDF8" />
          <circle cx="26" cy="50" r="2.5" fill="#FEF08A" />
          <circle cx="134" cy="44" r="2.5" fill="#FEF08A" />
        </svg>
      );

    case 9: // Solar Phoenix Sakura
      return (
        <svg viewBox="0 0 160 160" className="w-full h-full drop-shadow-2xl">
          <defs>
            <radialGradient id="s9Glow" cx="50%" cy="45%" r="56%">
              <stop offset="0%" stopColor="#FB7185" stopOpacity="0.52" />
              <stop offset="55%" stopColor="#F59E0B" stopOpacity="0.28" />
              <stop offset="100%" stopColor="#0F172A" stopOpacity="0" />
            </radialGradient>
          </defs>
          <circle cx="80" cy="64" r="64" fill="url(#s9Glow)" />
          {/* Solar Halo */}
          <circle cx="80" cy="54" r="46" fill="none" stroke="#FBBF24" strokeWidth="1.6" strokeDasharray="6 4" opacity="0.8" />
          <path d="M16 136 Q80 112 144 136 L144 155 L16 155 Z" fill="#4C0519" />
          {/* Golden-Crimson Trunk & Sweeping Boughs */}
          <path d="M80 136 Q73 96 80 62" stroke="#B45309" strokeWidth="12" strokeLinecap="round" fill="none" />
          <path d="M77 86 Q44 68 26 48" stroke="#D97706" strokeWidth="6" strokeLinecap="round" fill="none" />
          <path d="M83 86 Q116 68 134 48" stroke="#D97706" strokeWidth="6" strokeLinecap="round" fill="none" />
          {/* Sunfire Blossom Clouds */}
          <circle cx="32" cy="50" r="23" fill="#BE123C" />
          <circle cx="128" cy="50" r="23" fill="#BE123C" />
          <circle cx="80" cy="44" r="32" fill="#E11D48" />
          <circle cx="58" cy="34" r="22" fill="#FB7185" />
          <circle cx="102" cy="34" r="22" fill="#FB7185" />
          <circle cx="80" cy="28" r="20" fill="#F43F5E" />
          {/* Phoenix Crest & Radiant Blooms */}
          <polygon points="80,6 86,20 100,16 90,28 80,24 70,28 60,16 74,20" fill="#FDE047" />
          <circle cx="54" cy="38" r="5.5" fill="#FEF08A" />
          <circle cx="106" cy="38" r="5.5" fill="#FEF08A" />
          <circle cx="34" cy="50" r="5" fill="#FBBF24" />
          <circle cx="126" cy="50" r="5" fill="#FBBF24" />
          <circle cx="80" cy="48" r="6" fill="#FEF08A" />
        </svg>
      );

    case 10: // World Tree Yggdrasil
    default:
      return (
        <svg viewBox="0 0 160 160" className="w-full h-full drop-shadow-2xl">
          <defs>
            <radialGradient id="s10Glow" cx="50%" cy="46%" r="58%">
              <stop offset="0%" stopColor="#FBBF24" stopOpacity="0.55" />
              <stop offset="50%" stopColor="#10B981" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#312E81" stopOpacity="0" />
            </radialGradient>
          </defs>
          <circle cx="80" cy="66" r="66" fill="url(#s10Glow)" />
          {/* Dual Sovereign Halo Rings */}
          <circle cx="80" cy="56" r="52" fill="none" stroke="#FDE047" strokeWidth="1.5" opacity="0.7" />
          <ellipse
            cx="80"
            cy="58"
            rx="64"
            ry="20"
            fill="none"
            stroke="#34D399"
            strokeWidth="1.5"
            strokeDasharray="6 3"
            transform="rotate(-12 80 58)"
          />
          {/* Cosmic Sanctuary Base & Golden Roots */}
          <path d="M12 136 Q80 108 148 136 L148 155 L12 155 Z" fill="#064E3B" />
          <path d="M74 132 Q58 146 38 150" stroke="#F59E0B" strokeWidth="4" strokeLinecap="round" fill="none" />
          <path d="M86 132 Q102 146 122 150" stroke="#F59E0B" strokeWidth="4" strokeLinecap="round" fill="none" />
          <path d="M80 134 L80 152" stroke="#FBBF24" strokeWidth="4" strokeLinecap="round" />
          {/* World Tree Sovereign Trunk */}
          <path d="M80 135 Q68 94 80 58" stroke="#B45309" strokeWidth="14" strokeLinecap="round" fill="none" />
          <path d="M80 132 Q74 96 80 60" stroke="#FDE047" strokeWidth="3.5" strokeLinecap="round" fill="none" opacity="0.8" />
          <path d="M76 84 Q44 64 26 46" stroke="#D97706" strokeWidth="6.5" strokeLinecap="round" fill="none" />
          <path d="M84 84 Q116 64 134 46" stroke="#D97706" strokeWidth="6.5" strokeLinecap="round" fill="none" />
          {/* Emerald, Cyan & Gold Sovereign Canopy */}
          <circle cx="28" cy="48" r="23" fill="#047857" />
          <circle cx="132" cy="48" r="23" fill="#047857" />
          <circle cx="80" cy="42" r="35" fill="#059669" />
          <circle cx="56" cy="32" r="23" fill="#10B981" />
          <circle cx="104" cy="32" r="23" fill="#10B981" />
          <circle cx="80" cy="26" r="23" fill="#34D399" />
          {/* Sovereign Crown Crest & Realm Jewels */}
          <polygon points="80,4 85,16 98,12 91,24 69,24 62,12 75,16" fill="#FDE047" stroke="#F59E0B" strokeWidth="1" />
          <circle cx="80" cy="38" r="6" fill="#FEF08A" />
          <circle cx="54" cy="36" r="5" fill="#67E8F9" />
          <circle cx="106" cy="36" r="5" fill="#67E8F9" />
          <circle cx="30" cy="48" r="5" fill="#FBBF24" />
          <circle cx="130" cy="48" r="5" fill="#FBBF24" />
          <circle cx="66" cy="54" r="4.5" fill="#FB7185" />
          <circle cx="94" cy="54" r="4.5" fill="#FB7185" />
        </svg>
      );
  }
};

export const GrowthPlantAvatar: React.FC<GrowthPlantAvatarProps> = ({
  growthProfile,
  compact = false,
}) => {
  const totalStages = growthProfile.totalStages || GROWTH_STAGES.length;
  const currentStageMeta =
    GROWTH_STAGES.find((s) => s.level === growthProfile.stageLevel) || GROWTH_STAGES[0];
  const nextStageMeta =
    GROWTH_STAGES.find((s) => s.level === growthProfile.nextStageLevel) ||
    GROWTH_STAGES[Math.min(currentStageMeta.level, GROWTH_STAGES.length - 1)];

  const [inspectedStageLevel, setInspectedStageLevel] = useState<number>(growthProfile.stageLevel);
  const [justEvolved, setJustEvolved] = useState<boolean>(false);
  const prevStageLevelRef = useRef<number>(growthProfile.stageLevel);

  useEffect(() => {
    setInspectedStageLevel(growthProfile.stageLevel);
    if (growthProfile.stageLevel > prevStageLevelRef.current) {
      setJustEvolved(true);
      const timer = setTimeout(() => setJustEvolved(false), 3800);
      prevStageLevelRef.current = growthProfile.stageLevel;
      return () => clearTimeout(timer);
    }
    prevStageLevelRef.current = growthProfile.stageLevel;
  }, [growthProfile.stageLevel]);

  const displayedStageMeta =
    GROWTH_STAGES.find((s) => s.level === inspectedStageLevel) || currentStageMeta;
  const isInspectingOtherStage = displayedStageMeta.level !== currentStageMeta.level;
  const isDisplayedStageUnlocked = displayedStageMeta.level <= currentStageMeta.level;

  if (compact) {
    return (
      <div className="flex items-center gap-3 bg-slate-900/90 border border-emerald-500/30 p-2.5 rounded-2xl shadow-lg">
        <div className="w-12 h-12 rounded-xl bg-slate-950/80 border border-emerald-500/20 p-1 flex items-center justify-center relative overflow-hidden">
          <PlantStageIllustration stageLevel={growthProfile.stageLevel} />
        </div>
        <div className="space-y-0.5">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-bold text-white flex items-center gap-1">
              <span>{currentStageMeta.icon}</span>
              <span>{currentStageMeta.name}</span>
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-20 h-1.5 rounded-full bg-slate-800 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-500"
                style={{ width: `${growthProfile.progressPercent}%` }}
              />
            </div>
            <span className="text-[10px] font-mono tabular-nums text-emerald-400 font-semibold">
              {growthProfile.progressPercent}%
            </span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`w-full relative overflow-hidden bg-gradient-to-br from-slate-900/95 via-slate-900 to-emerald-950/40 border rounded-3xl p-5 sm:p-6 shadow-2xl flex flex-col justify-between gap-5 transition-colors duration-300 ${
        justEvolved
          ? 'border-amber-400/80 ring-2 ring-amber-400/25'
          : 'border-emerald-500/30'
      }`}
    >
      {/* Ambient stage glow */}
      <div
        className="absolute -top-14 -right-14 w-52 h-52 rounded-full blur-3xl pointer-events-none opacity-20"
        style={{ backgroundColor: displayedStageMeta.color }}
      />

      {/* TOP HEADER: Redesigned Stage X of 10 + Active Form & Telemetry */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-xs font-semibold">
            <span className="font-mono tabular-nums text-emerald-400">
              Stage {displayedStageMeta.level} of {totalStages}
            </span>
            <span aria-hidden="true" className="text-slate-600">
              ·
            </span>
            <span className="text-slate-300 truncate">{displayedStageMeta.bloomTitle}</span>
            {isInspectingOtherStage && (
              <button
                type="button"
                onClick={() => setInspectedStageLevel(currentStageMeta.level)}
                className="ml-1 text-[11px] font-semibold text-sky-400 hover:text-sky-300 underline underline-offset-2 whitespace-nowrap"
              >
                 Active Stage
              </button>
            )}
          </div>

          <h3 className="text-xl sm:text-2xl font-extrabold text-white mt-1 flex items-center gap-2 truncate">
            <span>{displayedStageMeta.icon}</span>
            <span className="truncate">{displayedStageMeta.name}</span>
          </h3>
        </div>

        <div className="flex flex-col items-end gap-0.5 shrink-0 font-mono tabular-nums">
          <div className="flex items-center gap-1.5 text-emerald-300 text-xs sm:text-sm font-bold">
            <Droplets className="w-4 h-4 text-cyan-400 shrink-0" />
            <span>{growthProfile.dewdrops} XP</span>
          </div>
          <span className="text-[11px] text-slate-400">
            {growthProfile.totalBlooms} Blooms
          </span>
        </div>
      </div>

      {/* CENTER STAGE: Hero Illustration + Visual Current-to-Next Form Evolution Panel */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 sm:gap-5 items-stretch">
        {/* Left: Hero Botanical Stage Canvas */}
        <div className="sm:col-span-5 flex flex-col items-center justify-center">
          <div
            className={`w-full max-w-[172px] aspect-square rounded-2xl bg-slate-950/90 border p-3 shadow-inner relative flex items-center justify-center transition-all duration-300 ${
              justEvolved
                ? 'border-amber-400/70 shadow-[0_0_24px_rgba(251,191,36,0.28)]'
                : isDisplayedStageUnlocked
                ? 'border-emerald-500/35'
                : 'border-slate-800 opacity-80'
            }`}
          >
            <PlantStageIllustration stageLevel={displayedStageMeta.level} />

            {!isDisplayedStageUnlocked && (
              <div className="absolute top-2.5 right-2.5 flex items-center gap-1 text-[10px] font-mono tabular-nums font-semibold text-slate-300 bg-slate-900/90 border border-slate-700 rounded-lg px-2 py-0.5">
                <Lock className="w-2.5 h-2.5 text-amber-400" />
                <span>{displayedStageMeta.minXp} XP</span>
              </div>
            )}

            {justEvolved && (
              <div className="absolute top-2.5 left-2.5 flex items-center gap-1 text-[10px] font-bold text-amber-300 bg-amber-950/90 border border-amber-400/50 rounded-lg px-2 py-0.5">
                <Sparkles className="w-2.5 h-2.5" />
                <span>Evolved</span>
              </div>
            )}
          </div>
        </div>

        {/* Right: Redesigned Evolution to Next Form Deck */}
        <div className="sm:col-span-7 flex flex-col justify-between bg-slate-950/75 border border-slate-800/90 rounded-2xl p-4 space-y-3.5">
          {/* Top Row: Label + Live Percentage */}
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-bold text-slate-200 tracking-tight">
              {growthProfile.isMaxStage ? 'Apex Evolution Reached' : 'Evolution to Next Form'}
            </span>
            <span className="text-xs font-mono font-bold tabular-nums text-emerald-400">
              {growthProfile.progressPercent}%
            </span>
          </div>

          {/* Visual Current -> Next Form Preview Card */}
          {growthProfile.isMaxStage ? (
            <div className="flex items-center gap-3 bg-slate-900/90 border border-amber-500/35 rounded-xl p-2.5">
              <div className="w-11 h-11 rounded-xl bg-slate-950 border border-amber-500/40 p-1 shrink-0">
                <PlantStageIllustration stageLevel={currentStageMeta.level} />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 text-xs font-bold text-amber-300">
                  <Crown className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">{currentStageMeta.name}</span>
                </div>
                <div className="text-[11px] font-mono tabular-nums text-slate-400 mt-0.5">
                  All {totalStages} Forms Unlocked · {growthProfile.dewdrops} XP
                </div>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() =>
                setInspectedStageLevel((prev) =>
                  prev === nextStageMeta.level ? currentStageMeta.level : nextStageMeta.level
                )
              }
              title={`Preview Stage ${nextStageMeta.level}: ${nextStageMeta.name}`}
              className="w-full text-left flex items-center justify-between gap-2.5 bg-slate-900/90 hover:bg-slate-900 border border-slate-800 hover:border-emerald-500/40 rounded-xl p-2.5 transition-colors group"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                {/* Mini Current -> Next Form Visual Pair */}
                <div className="flex items-center gap-1 shrink-0">
                  <div className="w-9 h-9 rounded-lg bg-slate-950 border border-emerald-500/30 p-0.5">
                    <PlantStageIllustration stageLevel={currentStageMeta.level} />
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-emerald-400 group-hover:translate-x-0.5 transition-transform shrink-0" />
                  <div className="w-10 h-10 rounded-lg bg-slate-950 border border-cyan-500/40 p-0.5 relative">
                    <PlantStageIllustration stageLevel={nextStageMeta.level} />
                  </div>
                </div>

                <div className="min-w-0">
                  <div className="text-[11px] font-mono tabular-nums text-emerald-400 font-semibold">
                    Next · Stage {nextStageMeta.level}
                  </div>
                  <div className="text-xs font-bold text-white truncate">
                    {nextStageMeta.icon} {nextStageMeta.name}
                  </div>
                </div>
              </div>

              <div className="text-right shrink-0 font-mono tabular-nums">
                <div className="text-xs font-bold text-cyan-300">
                  +{growthProfile.xpToNextStage} XP
                </div>
                <div className="text-[10px] text-slate-400">to evolve</div>
              </div>
            </button>
          )}

          {/* Progress Bar + Thresholds */}
          <div className="space-y-1.5">
            <div className="h-2.5 rounded-full bg-slate-900 border border-slate-800 overflow-hidden p-0.5">
              <div
                className="h-full bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-400 rounded-full transition-all duration-500"
                style={{ width: `${Math.max(6, growthProfile.progressPercent)}%` }}
              />
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono tabular-nums">
              <span>{growthProfile.dewdrops} XP</span>
              <span>
                {growthProfile.isMaxStage
                  ? `Stage ${totalStages} Max`
                  : `Target: ${growthProfile.nextStageThreshold} XP`}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* BOTTOM EVOLUTION TRACK: Interactive 10-Stage Progression Bar */}
      <div className="pt-1 border-t border-slate-800/80 space-y-2">
        <div className="flex items-center justify-between text-[11px] font-mono tabular-nums text-slate-400">
          <span>Evolution Lineage (Stages 1–{totalStages})</span>
          <span>
            {currentStageMeta.level}/{totalStages} Unlocked
          </span>
        </div>

        <div
          role="tablist"
          aria-label="Plant evolution stages"
          className="grid grid-cols-10 gap-1.5"
        >
          {GROWTH_STAGES.map((stage) => {
            const isUnlocked = stage.level <= currentStageMeta.level;
            const isCurrent = stage.level === currentStageMeta.level;
            const isInspected = stage.level === displayedStageMeta.level;

            return (
              <button
                key={stage.level}
                type="button"
                role="tab"
                aria-selected={isInspected}
                onClick={() => setInspectedStageLevel(stage.level)}
                title={`Stage ${stage.level}: ${stage.name} (${stage.minXp} XP)`}
                className={`h-8 rounded-lg border text-[11px] font-mono tabular-nums font-bold flex items-center justify-center transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 ${
                  isInspected
                    ? 'bg-emerald-500/25 border-emerald-400 text-white shadow-sm'
                    : isCurrent
                    ? 'bg-emerald-950/80 border-emerald-500/60 text-emerald-300'
                    : isUnlocked
                    ? 'bg-slate-950/90 border-emerald-500/30 text-emerald-400/90 hover:border-emerald-400'
                    : 'bg-slate-950/50 border-slate-800 text-slate-500 hover:text-slate-300 hover:border-slate-700'
                }`}
              >
                {isUnlocked && !isCurrent && !isInspected ? (
                  <Check className="w-3 h-3 text-emerald-400" />
                ) : (
                  <span>{stage.level}</span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
