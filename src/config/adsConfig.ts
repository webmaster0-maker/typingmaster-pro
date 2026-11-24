// Centralized Google AdSense & Ad Space Layout Configuration
// Easily toggle between 'preview' (visual placeholder boxes), 'adsense' (real Google ads), and 'blank' (zero-CLS invisible reserved space).

export type AdProviderMode = 'preview' | 'adsense' | 'blank';

export type AdFormat = 'leaderboard' | 'skyscraper' | 'rectangle' | 'responsive';

export interface AdSlotConfig {
  id: string;
  slotId: string; // AdSense Data-Ad-Slot (e.g. '1234567890')
  name: string;
  format: AdFormat;
  width: number;
  height: number;
  enabled: boolean;
  label: string;
}

export interface SiteAdsConfig {
  enabled: boolean;
  provider: AdProviderMode;
  /** Your Google AdSense Publisher ID (e.g. 'ca-pub-1234567890123456') */
  clientId: string;
  /** Whether to show a subtle badge indicating the ad slot size */
  showDimensions: boolean;
  slots: {
    topLeaderboard: AdSlotConfig;
    bottomBanner: AdSlotConfig;
    workspaceLeftRail: AdSlotConfig;
    workspaceRightRail: AdSlotConfig;
    resultsCard: AdSlotConfig;
  };
}

export const SITE_ADS_CONFIG: SiteAdsConfig = {
  enabled: true,
  // 'preview': Shows clean visual placeholder boxes labeled with dimensions
  // 'adsense': Inserts real Google AdSense <ins class="adsbygoogle"> tags
  // 'blank':   Reserves the exact pixel space without visual borders
  provider: 'preview',
  clientId: '', // Paste your 'ca-pub-XXXXXXXXXXXXXXXX' here
  showDimensions: true,
  slots: {
    // Top Leaderboard below header on Hub pages (Dashboard, Courses, Practice, Tests, Drills, Analytics)
    topLeaderboard: {
      id: 'ad-hub-top-leaderboard',
      slotId: '',
      name: 'Hub Top Leaderboard',
      format: 'leaderboard',
      width: 728,
      height: 90,
      enabled: true,
      label: 'Google AdSense Leaderboard (728×90)',
    },
    // Bottom Banner above footer on Hub pages
    bottomBanner: {
      id: 'ad-hub-bottom-banner',
      slotId: '',
      name: 'Hub Bottom Banner',
      format: 'leaderboard',
      width: 728,
      height: 90,
      enabled: true,
      label: 'Google AdSense Banner (728×90)',
    },
    // Left Skyscraper flanking the typing workspace on wide desktop screens
    workspaceLeftRail: {
      id: 'ad-workspace-left-rail',
      slotId: '',
      name: 'Workspace Left Skyscraper',
      format: 'skyscraper',
      width: 160,
      height: 600,
      enabled: true,
      label: 'Google AdSense Skyscraper (160×600)',
    },
    // Right Skyscraper flanking the typing workspace on wide desktop screens
    workspaceRightRail: {
      id: 'ad-workspace-right-rail',
      slotId: '',
      name: 'Workspace Right Skyscraper',
      format: 'skyscraper',
      width: 160,
      height: 600,
      enabled: true,
      label: 'Google AdSense Skyscraper (160×600)',
    },
    // Medium Rectangle on Lesson & Test completion results screen
    resultsCard: {
      id: 'ad-results-card',
      slotId: '',
      name: 'Lesson Results Rectangle',
      format: 'rectangle',
      width: 300,
      height: 250,
      enabled: true,
      label: 'Google AdSense Rectangle (300×250)',
    },
  },
};
