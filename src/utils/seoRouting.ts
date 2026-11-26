/**
 * Clean URL, Dynamic SEO Metadata, JSON-LD Schema & Canonical Manager for TypeCrest.
 * Keeps browser URLs lowercase, hyphenated, and indexable for Google & AI crawlers.
 */

export const SITE_ORIGIN = 'https://typecrest.pages.dev';
export const OG_IMAGE_URL = `${SITE_ORIGIN}/og-image.png`;
export const BRAND_LOGO_URL = `${SITE_ORIGIN}/favicon.svg`;
export const BRAND_EMAIL = 'webmaster.central0@gmail.com';

export type AppRouteView =
  | 'dashboard'
  | 'lessons'
  | 'practice'
  | 'tests'
  | 'drills'
  | 'analytics'
  | 'arcade'
  | 'assessment';

export const VIEW_TO_PATH: Record<AppRouteView, string> = {
  dashboard: '/',
  lessons: '/lessons',
  practice: '/practice',
  tests: '/tests',
  drills: '/drills',
  analytics: '/analytics',
  arcade: '/arcade',
  assessment: '/assessment',
};

export interface RouteSeoMeta {
  title: string; // 50-60 characters target
  description: string; // 140-155 characters target
  breadcrumbLabel: string;
}

export const ROUTE_SEO_META: Record<AppRouteView, RouteSeoMeta> = {
  dashboard: {
    title: 'Touch Typing Tutor with 3D Hands & Speed Tests | TypeCrest',
    description:
      'Master touch typing on TypeCrest with 3D articulated hands, 120 guided lessons, adaptive weak-key drills, timed WPM speed tests, and retro arcade games.',
    breadcrumbLabel: 'Home',
  },
  lessons: {
    title: 'Touch Typing Lessons & 3D Hand Courses | TypeCrest',
    description:
      'Practice 120 structured touch typing lessons from home row to coding syntax and themed paragraphs. Real-time 3D hand kinematics guide every finger on your QWERTY keyboard.',
    breadcrumbLabel: 'Touch Typing Lessons',
  },
  practice: {
    title: 'Adaptive Typing Practice & Weak-Key Drills | TypeCrest',
    description:
      'Fix typing mistakes faster with adaptive weak-key lessons, accuracy drills, and real-time 3D finger guidance tailored to your slowest keyboard reaches.',
    breadcrumbLabel: 'Practice Hub',
  },
  tests: {
    title: 'Free WPM Typing Speed Test & Certificates | TypeCrest',
    description:
      'Take standardized and strict WPM typing speed tests on TypeCrest. Measure net WPM, track accuracy, and earn downloadable PNG typing certificates.',
    breadcrumbLabel: 'Tests & Certificates',
  },
  drills: {
    title: 'Targeted Typing Drills & Speed Recovery | TypeCrest',
    description:
      'Improve finger precision and typing rhythm with targeted nourishment drills, speed endurance exams, and automatic weak-key recovery exercises.',
    breadcrumbLabel: 'Nourishment Drills',
  },
  arcade: {
    title: 'Retro Typing Arcade Games & Speed Battles | TypeCrest',
    description:
      'Play 5 free retro typing games on TypeCrest: Cyber-Dojo Showdown, Nitro Highway, Orbital Aegis, Synthwave Pulse, and Titan Siege boss battles.',
    breadcrumbLabel: 'Typing Arcade',
  },
  analytics: {
    title: 'Typing Speed Analytics, WPM & Hotspots | TypeCrest',
    description:
      'Track your touch typing progress with net WPM trends, accuracy metrics, practice streaks, tricky-key mistake hotspots, and recent session history.',
    breadcrumbLabel: 'Analytics & Hotspots',
  },
  assessment: {
    title: 'Typing Skill Assessment & Placement Test | TypeCrest',
    description:
      'Take a quick typing placement test on TypeCrest to benchmark your current WPM speed and accuracy and unlock personalized beginner or advanced lessons.',
    breadcrumbLabel: 'Skill Assessment',
  },
};

const PATH_TO_VIEW: Record<string, AppRouteView> = {
  '/': 'dashboard',
  '/index.html': 'dashboard',
  '/lessons': 'lessons',
  '/practice': 'practice',
  '/tests': 'tests',
  '/drills': 'drills',
  '/analytics': 'analytics',
  '/arcade': 'arcade',
  '/assessment': 'assessment',
};

export function normalizePathname(rawPathname: string): string {
  const cleaned = rawPathname.trim().toLowerCase().replace(/\/+$/, '');
  if (!cleaned || cleaned === '/index.html') return '/';
  return cleaned;
}

export function resolveRouteFromLocation(): {
  view: AppRouteView;
  canonicalPath: string;
  needsPathNormalization: boolean;
} {
  if (typeof window === 'undefined') {
    return { view: 'dashboard', canonicalPath: '/', needsPathNormalization: false };
  }

  const normalized = normalizePathname(window.location.pathname);
  const hash = window.location.hash.toLowerCase();

  if (hash === '#drills') {
    return { view: 'drills', canonicalPath: '/drills', needsPathNormalization: true };
  }
  if (hash === '#assessment') {
    return { view: 'assessment', canonicalPath: '/assessment', needsPathNormalization: true };
  }

  const matchedView = PATH_TO_VIEW[normalized] || 'dashboard';
  const canonicalPath = VIEW_TO_PATH[matchedView];
  const needsPathNormalization =
    window.location.pathname !== canonicalPath &&
    !hash.startsWith('#lesson/') &&
    !hash.startsWith('#practice/') &&
    !hash.startsWith('#test/') &&
    !hash.startsWith('#exam/');

  return { view: matchedView, canonicalPath, needsPathNormalization };
}

function upsertMetaTag(attrName: 'name' | 'property', attrValue: string, content: string): void {
  let el = document.querySelector(`meta[${attrName}="${attrValue}"]`) as HTMLMetaElement | null;
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attrName, attrValue);
    document.head.appendChild(el);
  }
  el.content = content;
}

function buildRouteJsonLd(fullUrl: string, view: AppRouteView, meta: RouteSeoMeta) {
  const orgNode = {
    '@type': 'Organization',
    '@id': `${SITE_ORIGIN}/#organization`,
    name: 'TypeCrest',
    url: `${SITE_ORIGIN}/`,
    logo: {
      '@type': 'ImageObject',
      url: BRAND_LOGO_URL,
    },
    email: BRAND_EMAIL,
  };

  const breadcrumbItems = [
    {
      '@type': 'ListItem',
      position: 1,
      name: 'Home',
      item: `${SITE_ORIGIN}/`,
    },
  ];

  if (view !== 'dashboard') {
    breadcrumbItems.push({
      '@type': 'ListItem',
      position: 2,
      name: meta.breadcrumbLabel,
      item: fullUrl,
    });
  }

  const graph: Array<Record<string, unknown>> = [
    orgNode,
    {
      '@type': 'BreadcrumbList',
      itemListElement: breadcrumbItems,
    },
  ];

  if (view === 'lessons' || view === 'practice' || view === 'drills') {
    graph.push({
      '@type': 'Course',
      name: meta.breadcrumbLabel,
      description: meta.description,
      url: fullUrl,
      provider: { '@id': `${SITE_ORIGIN}/#organization` },
      offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'USD',
        category: 'Free',
      },
    });
  } else if (view === 'tests' || view === 'arcade' || view === 'assessment') {
    graph.push({
      '@type': 'Service',
      name: `TypeCrest ${meta.breadcrumbLabel}`,
      description: meta.description,
      url: fullUrl,
      provider: { '@id': `${SITE_ORIGIN}/#organization` },
      offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'USD',
      },
    });
  }

  return {
    '@context': 'https://schema.org',
    '@graph': graph,
  };
}

export function syncHeadCanonicalAndUrl(canonicalPath: string, view: AppRouteView = 'dashboard'): void {
  if (typeof document === 'undefined') return;
  const fullUrl = `${SITE_ORIGIN}${canonicalPath === '/' ? '/' : canonicalPath}`;
  const meta = ROUTE_SEO_META[view] || ROUTE_SEO_META.dashboard;

  document.title = meta.title;
  upsertMetaTag('name', 'description', meta.description);

  let canonicalEl = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
  if (!canonicalEl) {
    canonicalEl = document.createElement('link');
    canonicalEl.rel = 'canonical';
    document.head.appendChild(canonicalEl);
  }
  canonicalEl.href = fullUrl;

  upsertMetaTag('property', 'og:title', meta.title);
  upsertMetaTag('property', 'og:description', meta.description);
  upsertMetaTag('property', 'og:url', fullUrl);
  upsertMetaTag('property', 'og:image', OG_IMAGE_URL);

  upsertMetaTag('name', 'twitter:title', meta.title);
  upsertMetaTag('name', 'twitter:description', meta.description);
  upsertMetaTag('name', 'twitter:image', OG_IMAGE_URL);

  if (view !== 'dashboard') {
    let routeSchemaEl = document.getElementById('typecrest-route-jsonld') as HTMLScriptElement | null;
    if (!routeSchemaEl) {
      routeSchemaEl = document.createElement('script');
      routeSchemaEl.id = 'typecrest-route-jsonld';
      routeSchemaEl.type = 'application/ld+json';
      document.head.appendChild(routeSchemaEl);
    }
    routeSchemaEl.textContent = JSON.stringify(buildRouteJsonLd(fullUrl, view, meta));
  } else {
    document.getElementById('typecrest-route-jsonld')?.remove();
  }
}
