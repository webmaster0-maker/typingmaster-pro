interface KVNamespaceLike {
  get(key: string): Promise<string | null>;
  put(key: string, value: string): Promise<void>;
}

interface Env {
  TYPECREST_AD_SETTINGS?: KVNamespaceLike;
}

interface PagesContext {
  request: Request;
  env: Env;
}

const KV_KEY = 'ad_settings_v1';
const EMAIL_SALT = 'email-salt-3b8f1a6d';
const ALLOWED_EMAIL_HASHES = [
  '12079dac251023caf3867d930b674963062aeb6bf1727126d72be88e977a193d',
  'd6a7adb14229a7e1ee1645f737941a1e2ed60675e20b04cab5d7df2438c787f3',
];

const VALID_KEYS = [
  'topLeaderboard',
  'bottomBanner',
  'workspaceRails',
  'resultsCard',
  'arcadeRails',
] as const;

type AdPlacementKey = (typeof VALID_KEYS)[number];

interface CustomAdCreative {
  imageDataUrl: string;
  linkUrl: string;
}

interface AdVisibilitySettings {
  adsEnabled: boolean;
  placements: Record<AdPlacementKey, boolean>;
  creatives: Partial<Record<AdPlacementKey, CustomAdCreative>>;
  updatedAt: string;
}

async function sha256Hex(input: string): Promise<string> {
  const bytes = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

async function isAuthorizedAdmin(request: Request): Promise<boolean> {
  const email = request.headers.get('x-typecrest-admin-email')?.trim().toLowerCase() || '';
  const token = request.headers.get('x-typecrest-admin-token')?.trim() || '';
  if (!email || !token || token.length < 8) return false;
  const emailHash = await sha256Hex(`${EMAIL_SALT}:${email}`);
  return ALLOWED_EMAIL_HASHES.includes(emailHash);
}

function sanitizeLinkUrl(rawUrl: unknown): string {
  if (typeof rawUrl !== 'string') return '';
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

function sanitizePayload(raw: unknown): AdVisibilitySettings | null {
  if (!raw || typeof raw !== 'object') return null;
  const obj = raw as Record<string, unknown>;
  const placementsRaw =
    obj.placements && typeof obj.placements === 'object'
      ? (obj.placements as Record<string, unknown>)
      : {};

  const placements: Record<AdPlacementKey, boolean> = {
    topLeaderboard: typeof placementsRaw.topLeaderboard === 'boolean' ? placementsRaw.topLeaderboard : true,
    bottomBanner: typeof placementsRaw.bottomBanner === 'boolean' ? placementsRaw.bottomBanner : true,
    workspaceRails: typeof placementsRaw.workspaceRails === 'boolean' ? placementsRaw.workspaceRails : true,
    resultsCard: typeof placementsRaw.resultsCard === 'boolean' ? placementsRaw.resultsCard : true,
    arcadeRails: typeof placementsRaw.arcadeRails === 'boolean' ? placementsRaw.arcadeRails : true,
  };

  const creatives: Partial<Record<AdPlacementKey, CustomAdCreative>> = {};
  if (obj.creatives && typeof obj.creatives === 'object') {
    const rawCreatives = obj.creatives as Record<string, unknown>;
    for (const key of VALID_KEYS) {
      const entry = rawCreatives[key];
      if (!entry || typeof entry !== 'object') continue;
      const rec = entry as Record<string, unknown>;
      const imageDataUrl = sanitizeImageDataUrl(rec.imageDataUrl);
      const linkUrl = sanitizeLinkUrl(rec.linkUrl);
      if (imageDataUrl || linkUrl) {
        creatives[key] = { imageDataUrl, linkUrl };
      }
    }
  }

  return {
    adsEnabled: typeof obj.adsEnabled === 'boolean' ? obj.adsEnabled : true,
    placements,
    creatives,
    updatedAt: new Date().toISOString(),
  };
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store, max-age=0',
    },
  });
}

export async function onRequestGet(context: PagesContext): Promise<Response> {
  const kv = context.env.TYPECREST_AD_SETTINGS;
  if (!kv) {
    return jsonResponse({ ok: true, settings: null, storage: 'unavailable' });
  }
  try {
    const raw = await kv.get(KV_KEY);
    if (!raw) {
      return jsonResponse({ ok: true, settings: null, storage: 'kv' });
    }
    const parsed = JSON.parse(raw);
    return jsonResponse({ ok: true, settings: parsed, storage: 'kv' });
  } catch {
    return jsonResponse({ ok: false, settings: null, error: 'Failed to read ad settings.' }, 500);
  }
}

export async function onRequestPut(context: PagesContext): Promise<Response> {
  if (!(await isAuthorizedAdmin(context.request))) {
    return jsonResponse({ ok: false, error: 'Unauthorized admin request.' }, 401);
  }

  const kv = context.env.TYPECREST_AD_SETTINGS;
  if (!kv) {
    return jsonResponse({ ok: false, error: 'KV binding not configured.' }, 503);
  }

  try {
    const text = await context.request.text();
    if (text.length > 8 * 1024 * 1024) {
      return jsonResponse({ ok: false, error: 'Payload too large (max 8 MB).' }, 413);
    }
    const parsed = JSON.parse(text);
    const sanitized = sanitizePayload(parsed);
    if (!sanitized) {
      return jsonResponse({ ok: false, error: 'Invalid ad settings payload.' }, 400);
    }
    await kv.put(KV_KEY, JSON.stringify(sanitized));
    return jsonResponse({ ok: true, settings: sanitized, storage: 'kv' });
  } catch {
    return jsonResponse({ ok: false, error: 'Failed to persist ad settings.' }, 500);
  }
}
