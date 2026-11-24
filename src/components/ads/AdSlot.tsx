import React, { useEffect, useRef } from 'react';
import {
  SITE_ADS_CONFIG,
  AdSlotConfig,
  SiteAdsConfig,
} from '../../config/adsConfig';
import { LayoutGrid, Sparkles } from 'lucide-react';

declare global {
  interface Window {
    adsbygoogle?: Array<Record<string, unknown>>;
  }
}

interface AdSlotProps {
  slot: AdSlotConfig;
  className?: string;
  config?: SiteAdsConfig;
}

export const AdSlot: React.FC<AdSlotProps> = ({
  slot,
  className = '',
  config = SITE_ADS_CONFIG,
}) => {
  const isPushedRef = useRef(false);

  const isEnabled = config.enabled && slot.enabled;
  const isAdSense = config.provider === 'adsense' && Boolean(config.clientId) && Boolean(slot.slotId);
  const isPreview = config.provider === 'preview';

  useEffect(() => {
    if (!isAdSense || isPushedRef.current) return;
    isPushedRef.current = true;
    try {
      window.adsbygoogle = window.adsbygoogle || [];
      window.adsbygoogle.push({});
    } catch {
      // Safely ignore ad-blocker or script block
    }
  }, [isAdSense]);

  if (!isEnabled) return null;

  // 1. REAL GOOGLE ADSENSE INJECTION
  if (isAdSense) {
    return (
      <div
        className={`flex items-center justify-center overflow-hidden my-3 ${className}`}
        style={{ minWidth: `${slot.width}px`, minHeight: `${slot.height}px` }}
      >
        <ins
          className="adsbygoogle"
          style={{ display: 'inline-block', width: `${slot.width}px`, height: `${slot.height}px` }}
          data-ad-client={config.clientId}
          data-ad-slot={slot.slotId}
          data-ad-format={slot.format === 'responsive' ? 'auto' : undefined}
          data-full-width-responsive="true"
        />
      </div>
    );
  }

  // 2. BLANK RESERVED SPACE (Zero-CLS)
  if (config.provider === 'blank') {
    return (
      <div
        className={`overflow-hidden select-none pointer-events-none ${className}`}
        style={{ minWidth: `${slot.width}px`, minHeight: `${slot.height}px` }}
        aria-hidden="true"
      />
    );
  }

  // 3. PREVIEW PLACEHOLDER BOX (Visual Layout Shift Inspection)
  if (slot.format === 'skyscraper') {
    return (
      <aside
        className={`hidden xl:flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-700/80 bg-gradient-to-b from-slate-900/60 to-slate-950/80 p-3 text-center text-slate-400 select-none shadow-lg ${className}`}
        style={{ width: `${slot.width}px`, minHeight: `${slot.height}px` }}
        aria-label={slot.label}
      >
        <div className="w-8 h-8 rounded-xl bg-slate-800/90 border border-slate-700/80 flex items-center justify-center mb-3 text-sky-400">
          <LayoutGrid size={16} />
        </div>
        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
          AdSense Space
        </span>
        <span className="text-xs font-semibold text-slate-300">
          Skyscraper
        </span>
        <span className="mt-2 text-[10px] px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-slate-400 font-mono">
          {slot.width} × {slot.height}
        </span>
        <div className="mt-4 flex flex-col items-center gap-1 text-[10px] text-slate-500 max-w-[130px]">
          <span>Non-intrusive side rail</span>
          <span className="text-[9px] text-emerald-400/80 flex items-center gap-1">
            <Sparkles size={10} /> Auto-centered stage
          </span>
        </div>
      </aside>
    );
  }

  if (slot.format === 'rectangle') {
    return (
      <div
        className={`flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-700/80 bg-slate-900/70 p-4 text-center text-slate-400 select-none shadow-md ${className}`}
        style={{ width: `${slot.width}px`, minHeight: `${slot.height}px` }}
        aria-label={slot.label}
      >
        <div className="w-7 h-7 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center mb-2 text-amber-400">
          <LayoutGrid size={15} />
        </div>
        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-0.5">
          AdSense Space
        </span>
        <span className="text-xs font-semibold text-slate-300">
          Medium Rectangle
        </span>
        <span className="mt-1.5 text-[10px] px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-slate-400 font-mono">
          {slot.width} × {slot.height}
        </span>
        <span className="mt-2 text-[10px] text-slate-500">
          High-engagement completion placement
        </span>
      </div>
    );
  }

  // Standard Leaderboard / Horizontal Banner (728x90)
  return (
    <div
      className={`w-full max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 rounded-2xl border-2 border-dashed border-slate-700/70 bg-gradient-to-r from-slate-900/60 via-slate-900/80 to-slate-900/60 px-6 py-3 my-4 text-slate-400 select-none shadow-md ${className}`}
      style={{ minHeight: `${slot.height}px` }}
      aria-label={slot.label}
    >
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-xl bg-slate-800/90 border border-slate-700/80 flex items-center justify-center text-sky-400 shrink-0">
          <LayoutGrid size={16} />
        </div>
        <div className="flex flex-col text-left">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
            AdSense Space · {slot.name}
          </span>
          <span className="text-xs font-semibold text-slate-300">
            Horizontal Leaderboard Banner
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <span className="text-[10px] px-2.5 py-1 rounded-full bg-slate-800/90 border border-slate-700 text-slate-300 font-mono">
          {slot.width} × {slot.height}
        </span>
        <span className="hidden md:inline text-[10px] text-slate-500">
          Responsive Desktop & Mobile
        </span>
      </div>
    </div>
  );
};
