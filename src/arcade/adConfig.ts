export type ArcadeAdProvider = 'blank' | 'adsense' | 'custom_html';

export type ArcadeAdSlotKey = 'left_rail' | 'right_rail';

export interface ArcadeAdSlotConfig {
  /** Stable DOM element ID and data-ad-slot identifier for ad scripts */
  id: string;
  /** Rail placement flanking the fullscreen game stage */
  placement: 'left' | 'right';
  /** Toggle this individual ad rail on or off */
  enabled: boolean;
  /** Google AdSense data-ad-slot ID (used when provider === 'adsense') */
  adsenseSlotId: string;
  /** Standard IAB Wide Skyscraper width (px) on xl+ viewports (>= 1280px) */
  width: number;
  /** Standard IAB Skyscraper height (px) */
  height: number;
  /** Compact IAB Skyscraper width (px) on lg viewports (1024px–1279px) */
  compactWidth: number;
  /** Accessible region label */
  ariaLabel: string;
  /** Optional custom ad HTML/script snippet (rendered safely in sandboxed iframe when provider === 'custom_html') */
  customHtml: string;
}

export interface ArcadeAdConfig {
  /** Master switch to enable or disable fullscreen game ad rails */
  enabled: boolean;
  /**
   * 'blank'       -> Clean empty reserved spaces with stable slot IDs (default)
   * 'adsense'     -> Renders Google AdSense <ins class="adsbygoogle"> units
   * 'custom_html' -> Renders customHtml snippets inside sandboxed ad iframes
   */
  provider: ArcadeAdProvider;
  /** Google AdSense publisher ID, e.g. 'ca-pub-XXXXXXXXXXXXXXXX' */
  adsenseClientId: string;
  /** Optional setup guide overlay showing slot ID and pixel dimensions inside blank slots */
  showSlotGuides: boolean;
  slots: Record<ArcadeAdSlotKey, ArcadeAdSlotConfig>;
}

/**
 * Centralized ad configuration for all 5 fullscreen Typing Arcade game layouts
 * (Cyber-Dojo Showdown, Nitro Highway, Orbital Aegis, Synthwave Pulse, Titan Siege)
 * and their post-round results screens.
 *
 * To activate Google AdSense later:
 * 1. Load your AdSense script tag in index.html
 * 2. Set provider: 'adsense'
 * 3. Fill in adsenseClientId and each slot's adsenseSlotId below
 */
export const ARCADE_AD_CONFIG: ArcadeAdConfig = {
  enabled: true,
  provider: 'blank',
  adsenseClientId: '',
  showSlotGuides: false,
  slots: {
    left_rail: {
      id: 'arcade-game-left-rail',
      placement: 'left',
      enabled: true,
      adsenseSlotId: '',
      width: 160,
      height: 600,
      compactWidth: 120,
      ariaLabel: 'Left advertisement space',
      customHtml: '',
    },
    right_rail: {
      id: 'arcade-game-right-rail',
      placement: 'right',
      enabled: true,
      adsenseSlotId: '',
      width: 160,
      height: 600,
      compactWidth: 120,
      ariaLabel: 'Right advertisement space',
      customHtml: '',
    },
  },
};

export function getAdSlotConfig(
  slotKey: ArcadeAdSlotKey,
  config: ArcadeAdConfig = ARCADE_AD_CONFIG
): ArcadeAdSlotConfig {
  return config.slots[slotKey];
}

export function isAdRailActive(
  slotKey: ArcadeAdSlotKey,
  config: ArcadeAdConfig = ARCADE_AD_CONFIG
): boolean {
  const slot = config.slots[slotKey];
  return Boolean(config.enabled && slot && slot.enabled);
}

export function isAdSenseReady(
  slotKey: ArcadeAdSlotKey,
  config: ArcadeAdConfig = ARCADE_AD_CONFIG
): boolean {
  const slot = config.slots[slotKey];
  return Boolean(
    config.enabled &&
      config.provider === 'adsense' &&
      config.adsenseClientId.trim().length > 0 &&
      slot &&
      slot.enabled &&
      slot.adsenseSlotId.trim().length > 0
  );
}
