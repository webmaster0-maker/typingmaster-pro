export type AdProviderMode = 'blank' | 'adsense' | 'custom_html';
export type AdRailPlacement = 'left' | 'right';

export interface AdSlotConfig {
  id: string;
  placement: AdRailPlacement;
  enabled: boolean;
  adsenseSlotId: string;
  /** Standard desktop IAB Wide Skyscraper width (px) */
  width: number;
  /** Standard desktop IAB Skyscraper height (px) */
  height: number;
  /** Compact laptop IAB Skyscraper width (px) */
  compactWidth: number;
  ariaLabel: string;
  /** Optional custom ad snippet rendered inside a sandboxed iframe when provider === 'custom_html' */
  customHtml?: string;
}

export interface ArcadeAdsConfig {
  /** Master toggle for fullscreen left and right ad rails across all 5 games */
  enabled: boolean;
  /**
   * 'blank'       -> Clean empty reserved space ready for ad injection (default)
   * 'adsense'     -> Renders Google AdSense <ins class="adsbygoogle"> using adsenseClientId + slot IDs
   * 'custom_html' -> Renders each slot's customHtml inside an isolated iframe
   */
  provider: AdProviderMode;
  /** Paste your Google AdSense publisher ID here (e.g. 'ca-pub-1234567890123456') when switching provider to 'adsense' */
  adsenseClientId: string;
  /** Set to true temporarily during ad setup to display faint slot IDs and pixel guides inside blank containers */
  showSlotGuides: boolean;
  slots: Record<AdRailPlacement, AdSlotConfig>;
}

/**
 * Centralized ad configuration for all 5 Typing Arcade fullscreen game layouts
 * (Cyber-Dojo Showdown, Nitro Highway, Orbital Aegis, Synthwave Pulse, and Titan Siege)
 * and their post-round results screens.
 */
export const ARCADE_ADS_CONFIG: ArcadeAdsConfig = {
  enabled: true,
  provider: 'blank',
  adsenseClientId: '',
  showSlotGuides: false,
  slots: {
    left: {
      id: 'arcade-game-left-rail',
      placement: 'left',
      enabled: true,
      adsenseSlotId: '',
      width: 160,
      height: 600,
      compactWidth: 120,
      ariaLabel: 'Left sidebar ad space',
      customHtml: '',
    },
    right: {
      id: 'arcade-game-right-rail',
      placement: 'right',
      enabled: true,
      adsenseSlotId: '',
      width: 160,
      height: 600,
      compactWidth: 120,
      ariaLabel: 'Right sidebar ad space',
      customHtml: '',
    },
  },
};

export function getAdSlotConfig(
  placement: AdRailPlacement,
  config: ArcadeAdsConfig = ARCADE_ADS_CONFIG
): AdSlotConfig | null {
  if (!config.enabled) return null;
  const slot = config.slots[placement];
  if (!slot || !slot.enabled) return null;
  return slot;
}

export function isAdRailActive(
  placement: AdRailPlacement,
  config: ArcadeAdsConfig = ARCADE_ADS_CONFIG
): boolean {
  return getAdSlotConfig(placement, config) !== null;
}

export function hasValidAdSenseConfig(
  slot: AdSlotConfig,
  config: ArcadeAdsConfig = ARCADE_ADS_CONFIG
): boolean {
  return (
    config.provider === 'adsense' &&
    config.adsenseClientId.trim().startsWith('ca-pub-') &&
    slot.adsenseSlotId.trim().length > 0
  );
}
