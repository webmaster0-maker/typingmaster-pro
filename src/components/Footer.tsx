import React, { useEffect, useState } from 'react';
import { Keyboard, ShieldCheck, X } from 'lucide-react';

interface FooterProps {
  onNavigateTab: (tab: string) => void;
  onOpenArcade: () => void;
  onOpenAssessment: () => void;
}

type LegalTopicId = 'privacy' | 'terms' | 'cookies' | 'accessibility' | 'contact';

interface LegalTopic {
  id: LegalTopicId;
  title: string;
  updated: string;
  sections: { heading: string; body: string }[];
}

const LEGAL_TOPICS: Record<LegalTopicId, LegalTopic> = {
  privacy: {
    id: 'privacy',
    title: 'Privacy Policy',
    updated: 'Last updated: November 26, 2026',
    sections: [
      {
        heading: '1. Local-First Data Storage',
        body: 'TypeCrest is designed with local-first privacy. Your typing speed (WPM), accuracy history, weak-key metrics, earned certificates, and optional local profile are stored directly in your browser (localStorage / sessionStorage) and never sold or uploaded to external tracking servers.',
      },
      {
        heading: '2. Local Accounts & Security',
        body: 'If you create an optional local typist profile, your password is salted and hashed client-side using PBKDF2-SHA256 (100,000 iterations), and stats/certificates are signed with integrity checksums.',
      },
      {
        heading: '3. Third-Party Services & Ads',
        body: 'TypeCrest is hosted on Cloudflare Pages and may display Google AdSense placements. AdSense may use cookies or device identifiers subject to your browser settings and regional consent.',
      },
    ],
  },
  terms: {
    id: 'terms',
    title: 'Terms of Service',
    updated: 'Last updated: November 26, 2026',
    sections: [
      {
        heading: '1. Free Educational Use',
        body: 'TypeCrest is provided free of charge ($0 USD) for personal, classroom, and self-paced touch typing practice, speed testing, and skill assessment.',
      },
      {
        heading: '2. Certificates & Verification',
        body: 'Downloadable PDF and PNG certificates reflect the WPM and accuracy recorded during your browser session. TypeCrest makes no warranty regarding employer or academic acceptance of self-proctored online certificates.',
      },
      {
        heading: '3. Acceptable Use',
        body: 'Automated scripting, tampering with local verification checksums, or attempting unauthorized access to administrative interfaces is prohibited.',
      },
    ],
  },
  cookies: {
    id: 'cookies',
    title: 'Cookie & Ad Disclosure',
    updated: 'Last updated: November 26, 2026',
    sections: [
      {
        heading: '1. Essential Browser Storage',
        body: 'We use localStorage to remember your completed lessons, keyboard theme, 3D/Vector hand preference, and earned certificates across visits.',
      },
      {
        heading: '2. Google AdSense',
        body: 'To keep TypeCrest 100% free, Google AdSense may serve contextual or personalized ads and set third-party cookies. You can manage or disable ad personalization in your Google Ad Settings or browser privacy controls.',
      },
    ],
  },
  accessibility: {
    id: 'accessibility',
    title: 'Accessibility & Keyboard Support',
    updated: 'Last updated: November 26, 2026',
    sections: [
      {
        heading: '1. Physical Keyboard Recommended',
        body: 'TypeCrest is built for physical QWERTY keyboards on desktop and laptop computers. Touch devices can browse lessons and click virtual keys, though full touch-typing drills require a hardware keyboard.',
      },
      {
        heading: '2. Keyboard Navigation & Reduced Motion',
        body: 'All primary controls support keyboard focus rings, ARIA labels, and light/dark keyboard themes. You can switch between 3D Articulated Hands and 2D Vector Hands at any time in the lesson toolbar.',
      },
    ],
  },
  contact: {
    id: 'contact',
    title: 'Contact & Support',
    updated: 'TypeCrest Support',
    sections: [
      {
        heading: 'General Inquiries & Bug Reports',
        body: 'For feedback, curriculum suggestions, accessibility requests, or legal/privacy questions, reach out via our GitHub repository issues page (webmaster0-maker/typingmaster-pro) or email webmaster.central0@gmail.com.',
      },
      {
        heading: 'Data Deletion',
        body: 'Because your typing data is stored locally in your browser, you can erase all stored progress and certificates at any time by clearing site data in your browser settings.',
      },
    ],
  },
};

export const Footer: React.FC<FooterProps> = ({
  onNavigateTab,
  onOpenArcade,
  onOpenAssessment,
}) => {
  const [activeLegal, setActiveLegal] = useState<LegalTopicId | null>(null);

  useEffect(() => {
    if (!activeLegal) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setActiveLegal(null);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [activeLegal]);

  const handleLinkClick = (
    e: React.MouseEvent<HTMLAnchorElement>,
    action: () => void
  ) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) {
      return;
    }
    e.preventDefault();
    action();
    window.scrollTo(0, 0);
  };

  const currentTopic = activeLegal ? LEGAL_TOPICS[activeLegal] : null;

  return (
    <footer className="border-t border-zinc-200 dark:border-white/[0.08] bg-zinc-50 dark:bg-[#09090B] text-zinc-600 dark:text-zinc-400 transition-colors duration-150">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand & Trust Summary */}
          <div className="space-y-3">
            <a
              href="/"
              onClick={(e) => handleLinkClick(e, () => onNavigateTab('dashboard'))}
              className="inline-flex items-center gap-2.5 text-zinc-900 dark:text-zinc-100 font-semibold text-sm tracking-tight hover:text-zinc-950 dark:hover:text-white transition-colors"
            >
              <span className="w-6 h-6 rounded-md bg-zinc-900 dark:bg-zinc-100 flex items-center justify-center text-white dark:text-zinc-950">
                <Keyboard className="w-3.5 h-3.5" />
              </span>
              <span>TypeCrest</span>
            </a>
            <p className="text-xs leading-relaxed text-zinc-500 dark:text-zinc-500 max-w-xs">
              Free 3D touch typing tutor with 120 lessons, themed speed tests, and local-first privacy.
            </p>
            <div className="inline-flex items-center gap-1.5 text-[11px] text-zinc-600 dark:text-zinc-400 font-medium">
              <ShieldCheck className="w-3.5 h-3.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
              <span>Local-First · No Sign-Up Required</span>
            </div>
          </div>

          {/* Curriculum & Practice */}
          <nav aria-label="Touch typing curriculum links" className="space-y-2.5">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-800 dark:text-zinc-300">
              Curriculum &amp; Practice
            </p>
            <ul className="space-y-2 text-xs">
              <li>
                <a
                  href="/lessons"
                  onClick={(e) => handleLinkClick(e, () => onNavigateTab('lessons'))}
                  className="hover:text-zinc-950 dark:hover:text-zinc-100 transition-colors"
                >
                  120 Touch Typing Lessons
                </a>
              </li>
              <li>
                <a
                  href="/practice"
                  onClick={(e) => handleLinkClick(e, () => onNavigateTab('practice'))}
                  className="hover:text-zinc-950 dark:hover:text-zinc-100 transition-colors"
                >
                  Weak-key practice
                </a>
              </li>
              <li>
                <a
                  href="/drills"
                  onClick={(e) => handleLinkClick(e, () => onNavigateTab('drills'))}
                  className="hover:text-zinc-950 dark:hover:text-zinc-100 transition-colors"
                >
                  Practice drills
                </a>
              </li>
              <li>
                <a
                  href="/assessment"
                  onClick={(e) => handleLinkClick(e, onOpenAssessment)}
                  className="hover:text-zinc-950 dark:hover:text-zinc-100 transition-colors"
                >
                  Skill Placement Assessment
                </a>
              </li>
            </ul>
          </nav>

          {/* Tests & Arcade */}
          <nav aria-label="Typing tests and analytics links" className="space-y-2.5">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-800 dark:text-zinc-300">
              Tests, Arcade &amp; Telemetry
            </p>
            <ul className="space-y-2 text-xs">
              <li>
                <a
                  href="/tests"
                  onClick={(e) => handleLinkClick(e, () => onNavigateTab('tests'))}
                  className="hover:text-zinc-950 dark:hover:text-zinc-100 transition-colors"
                >
                  Speed tests &amp; Certificates
                </a>
              </li>
              <li>
                <a
                  href="/arcade"
                  onClick={(e) => handleLinkClick(e, onOpenArcade)}
                  className="hover:text-zinc-950 dark:hover:text-zinc-100 transition-colors"
                >
                  Retro Typing Arcade Games
                </a>
              </li>
              <li>
                <a
                  href="/analytics"
                  onClick={(e) => handleLinkClick(e, () => onNavigateTab('analytics'))}
                  className="hover:text-zinc-950 dark:hover:text-zinc-100 transition-colors"
                >
                  Analytics &amp; Key Hotspots
                </a>
              </li>
            </ul>
          </nav>

          {/* Legal & Support */}
          <nav aria-label="Legal and support links" className="space-y-2.5">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-800 dark:text-zinc-300">
              Legal &amp; Support
            </p>
            <ul className="space-y-2 text-xs">
              <li>
                <button
                  type="button"
                  onClick={() => setActiveLegal('privacy')}
                  className="hover:text-zinc-950 dark:hover:text-zinc-100 transition-colors text-left"
                >
                  Privacy Policy
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => setActiveLegal('terms')}
                  className="hover:text-zinc-950 dark:hover:text-zinc-100 transition-colors text-left"
                >
                  Terms of Service
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => setActiveLegal('cookies')}
                  className="hover:text-zinc-950 dark:hover:text-zinc-100 transition-colors text-left"
                >
                  Cookie &amp; Ad Disclosure
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => setActiveLegal('accessibility')}
                  className="hover:text-zinc-950 dark:hover:text-zinc-100 transition-colors text-left"
                >
                  Accessibility &amp; Keyboard Help
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => setActiveLegal('contact')}
                  className="hover:text-zinc-950 dark:hover:text-zinc-100 transition-colors text-left"
                >
                  Contact &amp; Support
                </button>
              </li>
            </ul>
          </nav>
        </div>

        <div className="mt-10 pt-6 border-t border-zinc-200 dark:border-white/[0.06] flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-zinc-500">
          <span>© 2026 TypeCrest. All rights reserved.</span>
          <span>QWERTY 3D Tutor · PDF &amp; PNG Certificates · 100% Free ($0)</span>
        </div>
      </div>

      {/* Legal / Info Modal */}
      {currentTopic && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/60 dark:bg-slate-950/80 backdrop-blur-sm p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="legal-modal-title"
          onClick={() => setActiveLegal(null)}
        >
          <div
            className="w-full max-w-lg rounded-2xl bg-white dark:bg-slate-900 border border-zinc-200 dark:border-slate-800 shadow-2xl p-6 space-y-4 text-zinc-700 dark:text-slate-300"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4 border-b border-zinc-200 dark:border-slate-800 pb-3">
              <div>
                <h2 id="legal-modal-title" className="text-lg font-bold text-zinc-950 dark:text-white">
                  {currentTopic.title}
                </h2>
                <p className="text-[11px] text-zinc-500 dark:text-slate-400 mt-0.5">{currentTopic.updated}</p>
              </div>
              <button
                type="button"
                onClick={() => setActiveLegal(null)}
                aria-label="Close legal details"
                className="p-1.5 rounded-lg text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3.5 max-h-[60vh] overflow-y-auto pr-1 text-xs leading-relaxed">
              {currentTopic.sections.map((sec) => (
                <div key={sec.heading} className="space-y-1">
                  <h3 className="font-semibold text-zinc-900 dark:text-slate-100">{sec.heading}</h3>
                  <p className="text-zinc-600 dark:text-slate-400">{sec.body}</p>
                </div>
              ))}
            </div>

            <div className="pt-2 border-t border-zinc-200 dark:border-slate-800 flex justify-end">
              <button
                type="button"
                onClick={() => setActiveLegal(null)}
                className="px-4 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-xs font-semibold text-white transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </footer>
  );
};
