import { useState, useEffect } from 'react';
import { safeStorage } from './safeStorage';

export type AdPlacementKey =
  | 'topLeaderboard'
  | 'bottomBanner'
  | 'workspaceRails'
  | 'resultsCard'
  | 'arcadeRails';

export interface CustomAdCreative {
  imageDataUrl: string;
  linkUrl: string;
}

export interface AdVisibilitySettings {
  /** Master switch: when false, ALL AdSense layouts across TypeCrest are hidden */
  adsEnabled: boolean;
  /** Individual placement switches (active when adsEnabled === true) */
  placements: Record<AdPlacementKey, boolean>;
  /** Optional custom uploaded banner image & click-through link per placement */
  creatives?: Partial<Record<AdPlacementKey, CustomAdCreative>>;
  updatedAt: string;
}

export const AD_SETTINGS_STORAGE_KEY = 'typecrest_ad_settings_v1';
export const AD_SETTINGS_EVENT = 'typecrest-ad-settings-changed';

export const DEFAULT_AD_VISIBILITY_SETTINGS: AdVisibilitySettings = {
  adsEnabled: true,
  placements: {
    topLeaderboard: true,
    bottomBanner: true,
    workspaceRails: true,
    resultsCard: true,
    arcadeRails: true,
  },
  creatives: {},
  updatedAt: '',
};

const SLOT_ID_TO_PLACEMENT: Record<string, AdPlacementKey> = {
  'ad-hub-top-leaderboard': 'topLeaderboard',
  'ad-hub-bottom-banner': 'bottomBanner',
  'ad-workspace-left-rail': 'workspaceRails',
  'ad-workspace-right-rail': 'workspaceRails',
  'ad-results-card': 'resultsCard',
};

const VALID_KEYS: AdPlacementKey[] = [
  'topLeaderboard',
  'bottomBanner',
  'workspaceRails',
  'resultsCard',
  'arcadeRails',
];

export function sanitizeAdLinkUrl(rawUrl: string): string {
  const trimmed = rawUrl.trim();
  if (!trimmed) return '';
  if (trimmed.startsWith('/')) return trimmed;
  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol === 'https:' || parsed.protocol === 'http:') {
      return parsed.toString();
    }
  } catch {
    if (/^[a-z0-9.-]+\.[a-z]{2,}(\/.*)?$/i.test(trimmed)) {
      return `https://${trimmed}`;
    }
  }
  return '';
}

function sanitizeImageDataUrl(rawImg: unknown): string {
  if (typeof rawImg !== 'string') return '';
  const trimmed = rawImg.trim();
  if (!trimmed) return '';
  if (
    trimmed.startsWith('data:image/') ||
    trimmed.startsWith('https://') ||
    trimmed.startsWith('/')
  ) {
    return trimmed;
  }
  return '';
}

function sanitizeCreatives(
  raw: unknown
): Partial<Record<AdPlacementKey, CustomAdCreative>> {
  if (!raw || typeof raw !== 'object') return {};
  const obj = raw as Record<string, unknown>;
  const out: Partial<Record<AdPlacementKey, CustomAdCreative>> = {};
  for (const key of VALID_KEYS) {
    const entry = obj[key];
    if (!entry || typeof entry !== 'object') continue;
    const rec = entry as Record<string, unknown>;
    const imageDataUrl = sanitizeImageDataUrl(rec.imageDataUrl);
    const linkUrl = typeof rec.linkUrl === 'string' ? sanitizeAdLinkUrl(rec.linkUrl) : '';
    if (imageDataUrl || linkUrl) {
      out[key] = { imageDataUrl, linkUrl };
    }
  }
  return out;
}

function sanitizeSettings(raw: unknown): AdVisibilitySettings {
  const fallback = DEFAULT_AD_VISIBILITY_SETTINGS;
  if (!raw || typeof raw !== 'object') {
    return {
      ...fallback,
      placements: { ...fallback.placements },
      creatives: {},
    };
  }
  const obj = raw as Record<string, unknown>;
  const placementsRaw =
    obj.placements && typeof obj.placements === 'object'
      ? (obj.placements as Record<string, unknown>)
      : {};

  return {
    adsEnabled: typeof obj.adsEnabled === 'boolean' ? obj.adsEnabled : fallback.adsEnabled,
    placements: {
      topLeaderboard:
        typeof placementsRaw.topLeaderboard === 'boolean'
          ? placementsRaw.topLeaderboard
          : fallback.placements.topLeaderboard,
      bottomBanner:
        typeof placementsRaw.bottomBanner === 'boolean'
          ? placementsRaw.bottomBanner
          : fallback.placements.bottomBanner,
      workspaceRails:
        typeof placementsRaw.workspaceRails === 'boolean'
          ? placementsRaw.workspaceRails
          : fallback.placements.workspaceRails,
      resultsCard:
        typeof placementsRaw.resultsCard === 'boolean'
          ? placementsRaw.resultsCard
          : fallback.placements.resultsCard,
      arcadeRails:
        typeof placementsRaw.arcadeRails === 'boolean'
          ? placementsRaw.arcadeRails
          : fallback.placements.arcadeRails,
    },
    creatives: sanitizeCreatives(obj.creatives),
    updatedAt: typeof obj.updatedAt === 'string' ? obj.updatedAt : '',
  };
}

export function getAdVisibilitySettings(): AdVisibilitySettings {
  try {
    const raw = safeStorage.getItem(AD_SETTINGS_STORAGE_KEY);
    if (!raw) {
      return sanitizeSettings(null);
    }
    return sanitizeSettings(JSON.parse(raw));
  } catch {
    return sanitizeSettings(null);
  }
}

function notifySettingsChanged(): void {
  if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function') {
    window.dispatchEvent(new Event(AD_SETTINGS_EVENT));
  }
}

export function saveAdVisibilitySettings(
  next: AdVisibilitySettings
): AdVisibilitySettings {
  const sanitized: AdVisibilitySettings = {
    ...sanitizeSettings(next),
    updatedAt: new Date().toISOString(),
  };
  safeStorage.setItem(AD_SETTINGS_STORAGE_KEY, JSON.stringify(sanitized));
  notifySettingsChanged();
  return sanitized;
}

export function setAllAdLayoutsVisible(visible: boolean): AdVisibilitySettings {
  const current = getAdVisibilitySettings();
  return saveAdVisibilitySettings({
    ...current,
    adsEnabled: visible,
  });
}

export function setAdPlacementVisible(
  placement: AdPlacementKey,
  visible: boolean
): AdVisibilitySettings {
  const current = getAdVisibilitySettings();
  return saveAdVisibilitySettings({
    ...current,
    placements: {
      ...current.placements,
      [placement]: visible,
    },
  });
}

export function setAdPlacementCreative(
  placement: AdPlacementKey,
  creative: CustomAdCreative | null
): AdVisibilitySettings {
  const current = getAdVisibilitySettings();
  const nextCreatives = { ...(current.creatives || {}) };
  if (!creative || (!creative.imageDataUrl.trim() && !creative.linkUrl.trim())) {
    delete nextCreatives[placement];
  } else {
    nextCreatives[placement] = {
      imageDataUrl: sanitizeImageDataUrl(creative.imageDataUrl),
      linkUrl: sanitizeAdLinkUrl(creative.linkUrl),
    };
  }
  return saveAdVisibilitySettings({
    ...current,
    creatives: nextCreatives,
  });
}

export function getSiteAdCreative(
  slotId: string,
  settings: AdVisibilitySettings = getAdVisibilitySettings()
): CustomAdCreative | null {
  const key = SLOT_ID_TO_PLACEMENT[slotId];
  if (!key) return null;
  const creative = settings.creatives?.[key];
  if (!creative || !creative.imageDataUrl) return null;
  return creative;
}

export function getArcadeAdCreative(
  settings: AdVisibilitySettings = getAdVisibilitySettings()
): CustomAdCreative | null {
  const creative = settings.creatives?.arcadeRails;
  if (!creative || !creative.imageDataUrl) return null;
  return creative;
}

export function resetAdVisibilitySettings(): AdVisibilitySettings {
  const reset = saveAdVisibilitySettings({
    ...DEFAULT_AD_VISIBILITY_SETTINGS,
    placements: { ...DEFAULT_AD_VISIBILITY_SETTINGS.placements },
    creatives: {},
    updatedAt: new Date().toISOString(),
  });
  return reset;
}

export function isSiteAdSlotVisible(
  slotId: string,
  settings: AdVisibilitySettings = getAdVisibilitySettings()
): boolean {
  if (!settings.adsEnabled) return false;
  const key = SLOT_ID_TO_PLACEMENT[slotId];
  if (!key) return true;
  return settings.placements[key] !== false;
}

export function isArcadeAdRailVisible(
  settings: AdVisibilitySettings = getAdVisibilitySettings()
): boolean {
  if (!settings.adsEnabled) return false;
  return settings.placements.arcadeRails !== false;
}

export function useAdVisibilitySettings(): AdVisibilitySettings {
  const [settings, setSettings] = useState<AdVisibilitySettings>(() =>
    getAdVisibilitySettings()
  );

  useEffect(() => {
    const sync = () => {
      setSettings(getAdVisibilitySettings());
    };

    const handleStorage = (e: StorageEvent) => {
      if (!e.key || e.key === AD_SETTINGS_STORAGE_KEY) {
        sync();
      }
    };

    window.addEventListener(AD_SETTINGS_EVENT, sync);
    window.addEventListener('storage', handleStorage);
    return () => {
      window.removeEventListener(AD_SETTINGS_EVENT, sync);
      window.removeEventListener('storage', handleStorage);
    };
  }, []);

  return settings;
}
