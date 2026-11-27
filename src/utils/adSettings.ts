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
const AD_SETTINGS_API_URL = '/api/ad-settings';
const IDB_NAME = 'typecrest_ad_db';
const IDB_STORE = 'settings';

let memoryCachedSettings: AdVisibilitySettings | null = null;
let hydrationPromise: Promise<AdVisibilitySettings> | null = null;

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

function openAdDb(): Promise<IDBDatabase | null> {
  if (typeof window === 'undefined' || !('indexedDB' in window)) {
    return Promise.resolve(null);
  }
  return new Promise((resolve) => {
    try {
      const req = window.indexedDB.open(IDB_NAME, 1);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains(IDB_STORE)) {
          db.createObjectStore(IDB_STORE);
        }
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
}

async function readFromIndexedDb(): Promise<AdVisibilitySettings | null> {
  const db = await openAdDb();
  if (!db) return null;
  return new Promise((resolve) => {
    try {
      const tx = db.transaction(IDB_STORE, 'readonly');
      const store = tx.objectStore(IDB_STORE);
      const req = store.get(AD_SETTINGS_STORAGE_KEY);
      req.onsuccess = () => {
        db.close();
        resolve(req.result ? sanitizeSettings(req.result) : null);
      };
      req.onerror = () => {
        db.close();
        resolve(null);
      };
    } catch {
      db.close();
      resolve(null);
    }
  });
}

async function writeToIndexedDb(settings: AdVisibilitySettings): Promise<void> {
  const db = await openAdDb();
  if (!db) return;
  await new Promise<void>((resolve) => {
    try {
      const tx = db.transaction(IDB_STORE, 'readwrite');
      const store = tx.objectStore(IDB_STORE);
      store.put(settings, AD_SETTINGS_STORAGE_KEY);
      tx.oncomplete = () => {
        db.close();
        resolve();
      };
      tx.onerror = () => {
        db.close();
        resolve();
      };
    } catch {
      db.close();
      resolve();
    }
  });
}

export function getAdVisibilitySettings(): AdVisibilitySettings {
  if (memoryCachedSettings) {
    return memoryCachedSettings;
  }
  try {
    const raw = safeStorage.getItem(AD_SETTINGS_STORAGE_KEY);
    if (!raw) {
      return sanitizeSettings(null);
    }
    const parsed = sanitizeSettings(JSON.parse(raw));
    memoryCachedSettings = parsed;
    return parsed;
  } catch {
    return sanitizeSettings(null);
  }
}

function notifySettingsChanged(): void {
  if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function') {
    window.dispatchEvent(new Event(AD_SETTINGS_EVENT));
  }
}

function persistLocally(sanitized: AdVisibilitySettings): void {
  memoryCachedSettings = sanitized;
  safeStorage.setItem(AD_SETTINGS_STORAGE_KEY, JSON.stringify(sanitized));
  void writeToIndexedDb(sanitized);
  notifySettingsChanged();
}

export function saveAdVisibilitySettings(
  next: AdVisibilitySettings
): AdVisibilitySettings {
  const sanitized: AdVisibilitySettings = {
    ...sanitizeSettings(next),
    updatedAt: new Date().toISOString(),
  };
  persistLocally(sanitized);
  return sanitized;
}

export async function syncAdSettingsToServer(
  settings: AdVisibilitySettings,
  adminEmail: string,
  adminToken: string
): Promise<{ synced: boolean; error?: string }> {
  if (typeof fetch !== 'function') {
    return { synced: false, error: 'Fetch unavailable.' };
  }
  try {
    const res = await fetch(AD_SETTINGS_API_URL, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'x-typecrest-admin-email': adminEmail,
        'x-typecrest-admin-token': adminToken,
      },
      body: JSON.stringify(settings),
    });
    if (!res.ok) {
      const errBody = (await res.json().catch(() => null)) as { error?: string } | null;
      return { synced: false, error: errBody?.error || `HTTP ${res.status}` };
    }
    const data = (await res.json()) as { ok?: boolean; settings?: unknown };
    if (data?.ok && data.settings) {
      persistLocally(sanitizeSettings(data.settings));
    }
    return { synced: true };
  } catch {
    return { synced: false, error: 'Network error while syncing.' };
  }
}

export function hydrateAdSettings(): Promise<AdVisibilitySettings> {
  if (hydrationPromise) return hydrationPromise;
  hydrationPromise = (async () => {
    const localCurrent = getAdVisibilitySettings();
    // 1. Try server-persisted global KV settings first
    if (typeof fetch === 'function' && typeof window !== 'undefined') {
      try {
        const res = await fetch(AD_SETTINGS_API_URL, { cache: 'no-store' });
        if (res.ok) {
          const data = (await res.json()) as { ok?: boolean; settings?: unknown };
          if (data?.ok && data.settings) {
            const serverSettings = sanitizeSettings(data.settings);
            const serverTime = Date.parse(serverSettings.updatedAt || '') || 0;
            const localTime = Date.parse(localCurrent.updatedAt || '') || 0;
            if (serverTime >= localTime || !localCurrent.updatedAt) {
              persistLocally(serverSettings);
              return serverSettings;
            }
          }
        }
      } catch {
        // Ignore network errors (e.g. offline or Vite dev without Pages Functions)
      }
    }

    // 2. Fall back to IndexedDB if localStorage was empty/truncated
    const idbSettings = await readFromIndexedDb();
    if (idbSettings) {
      const idbTime = Date.parse(idbSettings.updatedAt || '') || 0;
      const localTime = Date.parse(localCurrent.updatedAt || '') || 0;
      if (idbTime > localTime || !localCurrent.updatedAt) {
        persistLocally(idbSettings);
        return idbSettings;
      }
    }

    return localCurrent;
  })();
  return hydrationPromise;
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
    void hydrateAdSettings();

    const sync = () => {
      setSettings(getAdVisibilitySettings());
    };

    const handleStorage = (e: StorageEvent) => {
      if (!e.key || e.key === AD_SETTINGS_STORAGE_KEY) {
        memoryCachedSettings = null;
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
