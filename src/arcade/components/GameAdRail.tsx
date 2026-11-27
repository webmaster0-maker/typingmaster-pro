import React, { useEffect, useRef } from 'react';
import { ArcadeModeId } from '../arcadeTypes';
import {
  ARCADE_ADS_CONFIG,
  AdRailPlacement,
  ArcadeAdsConfig,
  getAdSlotConfig,
  hasValidAdSenseConfig,
} from '../arcadeAdConfig';
import {
  getArcadeAdCreative,
  isArcadeAdRailVisible,
  useAdVisibilitySettings,
} from '../../utils/adSettings';

declare global {
  interface Window {
    adsbygoogle?: Array<Record<string, unknown>>;
  }
}

interface GameAdRailProps {
  placement: AdRailPlacement;
  gameMode: ArcadeModeId;
  config?: ArcadeAdsConfig;
}

/**
 * Symmetrical vertical sidebar container flanking the fullscreen 2D game stage.
 * Renders a clean, zero-CLS blank reserved ad space by default and supports
 * one-place switching to Google AdSense or sandboxed custom HTML ads via ARCADE_ADS_CONFIG.
 */
export const GameAdRail: React.FC<GameAdRailProps> = ({
  placement,
  gameMode,
  config = ARCADE_ADS_CONFIG,
}) => {
  const adSettings = useAdVisibilitySettings();
  const isVisibleByAdmin = isArcadeAdRailVisible(adSettings);
  const customCreative = getArcadeAdCreative(adSettings);
  const slot = isVisibleByAdmin ? getAdSlotConfig(placement, config) : null;
  const pushedRef = useRef<boolean>(false);

  const shouldRenderAdSense = slot && !customCreative ? hasValidAdSenseConfig(slot, config) : false;
  const customHtml =
    slot && config.provider === 'custom_html' ? slot.customHtml?.trim() || '' : '';

  useEffect(() => {
    if (!shouldRenderAdSense || pushedRef.current) return;
    pushedRef.current = true;
    try {
      window.adsbygoogle = window.adsbygoogle || [];
      window.adsbygoogle.push({});
    } catch {
      // Ignore ad blocker or uninitialized AdSense script errors safely
    }
  }, [shouldRenderAdSense]);

  if (!slot) return null;

  const dividerClass =
    placement === 'left'
      ? 'border-r border-[#182032]'
      : 'border-l border-[#182032]';

  return (
    <aside
      aria-label={slot.ariaLabel}
      tabIndex={-1}
      data-ad-rail={placement}
      data-ad-slot={slot.id}
      data-ad-game-mode={gameMode}
      data-ad-provider={config.provider}
      className={`hidden lg:flex shrink-0 flex-col items-center justify-center bg-[#0A0F1A] ${dividerClass} lg:w-[136px] xl:w-[176px] p-2 overflow-hidden select-none`}
    >
      <div
        id={slot.id}
        data-ad-ready="true"
        data-ad-width={slot.width}
        data-ad-height={slot.height}
        className="w-[120px] xl:w-[160px] h-[min(600px,calc(100%-8px))] min-h-[320px] rounded-lg bg-[#0C1220] border border-[#1A2438]/70 flex items-center justify-center overflow-hidden"
      >
        {customCreative ? (
          customCreative.linkUrl ? (
            <a
              href={customCreative.linkUrl}
              target="_blank"
              rel="noopener noreferrer sponsored"
              className="block w-full h-full cursor-pointer"
            >
              <img
                src={customCreative.imageDataUrl}
                alt={slot.ariaLabel}
                className="w-full h-full object-cover block"
              />
            </a>
          ) : (
            <img
              src={customCreative.imageDataUrl}
              alt={slot.ariaLabel}
              className="w-full h-full object-cover block"
            />
          )
        ) : shouldRenderAdSense ? (
          <ins
            className="adsbygoogle block w-full h-full"
            data-ad-client={config.adsenseClientId}
            data-ad-slot={slot.adsenseSlotId}
            data-ad-format="vertical"
            data-full-width-responsive="false"
          />
        ) : customHtml ? (
          <iframe
            title={slot.ariaLabel}
            srcDoc={customHtml}
            sandbox="allow-scripts allow-popups allow-popups-to-escape-sandbox"
            tabIndex={-1}
            className="w-full h-full border-0 bg-transparent"
          />
        ) : (
          <div className="px-2 text-center font-mono tabular-nums text-[10px] text-zinc-600 space-y-1 pointer-events-none">
            <div className="text-zinc-500">Sponsored</div>
            <div>
              {slot.width}×{slot.height}
            </div>
          </div>
        )}
      </div>
    </aside>
  );
};
