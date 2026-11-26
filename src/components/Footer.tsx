import React from 'react';
import { Keyboard } from 'lucide-react';

interface FooterProps {
  onNavigateTab: (tab: string) => void;
  onOpenArcade: () => void;
  onOpenAssessment: () => void;
}

export const Footer: React.FC<FooterProps> = ({
  onNavigateTab,
  onOpenArcade,
  onOpenAssessment,
}) => {
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

  return (
    <footer className="border-t border-slate-800/80 bg-slate-950/90 text-slate-400">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="space-y-3">
            <a
              href="/"
              onClick={(e) => handleLinkClick(e, () => onNavigateTab('dashboard'))}
              className="inline-flex items-center gap-2.5 text-white font-bold text-base tracking-tight hover:text-indigo-300 transition-colors"
            >
              <span className="w-7 h-7 rounded-lg bg-gradient-to-tr from-indigo-600 to-indigo-400 flex items-center justify-center text-white">
                <Keyboard className="w-4 h-4" />
              </span>
              <span>TypeCrest</span>
            </a>
            <p className="text-xs leading-relaxed text-slate-400 max-w-sm">
              Guided touch typing instructor with real-time 3D articulated hands, 28 progressive lessons, adaptive weak-key remediation, WPM speed tests, and retro typing arcade games.
            </p>
          </div>

          <nav aria-label="Touch typing curriculum links" className="space-y-2.5">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-200">
              Curriculum &amp; Practice
            </p>
            <ul className="space-y-2 text-xs">
              <li>
                <a
                  href="/lessons"
                  onClick={(e) => handleLinkClick(e, () => onNavigateTab('lessons'))}
                  className="hover:text-emerald-400 transition-colors"
                >
                  28 Touch Typing Lessons
                </a>
              </li>
              <li>
                <a
                  href="/practice"
                  onClick={(e) => handleLinkClick(e, () => onNavigateTab('practice'))}
                  className="hover:text-sky-400 transition-colors"
                >
                  Adaptive Weak-Key Practice Hub
                </a>
              </li>
              <li>
                <a
                  href="/drills"
                  onClick={(e) => handleLinkClick(e, () => onNavigateTab('drills'))}
                  className="hover:text-purple-400 transition-colors"
                >
                  Nourishment &amp; Accuracy Drills
                </a>
              </li>
              <li>
                <a
                  href="/assessment"
                  onClick={(e) => handleLinkClick(e, onOpenAssessment)}
                  className="hover:text-indigo-400 transition-colors"
                >
                  Skill Placement Assessment
                </a>
              </li>
            </ul>
          </nav>

          <nav aria-label="Typing tests and analytics links" className="space-y-2.5">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-200">
              Tests, Arcade &amp; Telemetry
            </p>
            <ul className="space-y-2 text-xs">
              <li>
                <a
                  href="/tests"
                  onClick={(e) => handleLinkClick(e, () => onNavigateTab('tests'))}
                  className="hover:text-emerald-400 transition-colors"
                >
                  WPM Speed Tests &amp; Certificates
                </a>
              </li>
              <li>
                <a
                  href="/arcade"
                  onClick={(e) => handleLinkClick(e, onOpenArcade)}
                  className="hover:text-amber-400 transition-colors"
                >
                  Retro Typing Arcade Games
                </a>
              </li>
              <li>
                <a
                  href="/analytics"
                  onClick={(e) => handleLinkClick(e, () => onNavigateTab('analytics'))}
                  className="hover:text-sky-400 transition-colors"
                >
                  WPM Speed Analytics &amp; Hotspots
                </a>
              </li>
            </ul>
          </nav>
        </div>

        <div className="mt-8 pt-6 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-slate-500">
          <span>TypeCrest · Guided Touch Typing Instructor</span>
          <span>Local-First Privacy · 3D Hand Kinematics · Verified WPM Certificates</span>
        </div>
      </div>
    </footer>
  );
};
