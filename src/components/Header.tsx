import React from 'react';
import { Keyboard, BookOpen, Dumbbell, Award, BarChart2, User, Gamepad2, Sun, Moon } from 'lucide-react';
import { UserAccount } from '../types';
import { getUserInitials } from '../utils/certificateEngine';
import { ThemeMode } from '../utils/theme';

interface HeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  userAccount: UserAccount | null;
  onOpenAccount: () => void;
  onOpenArcade: () => void;
  theme: ThemeMode;
  onToggleTheme: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  userAccount,
  onOpenAccount,
  onOpenArcade,
  theme,
  onToggleTheme,
}) => {
  const navItems = [
    { id: 'dashboard', href: '/', label: 'Dashboard', icon: Keyboard },
    { id: 'lessons', href: '/lessons', label: 'Lessons', icon: BookOpen },
    { id: 'practice', href: '/practice', label: 'Practice', icon: Dumbbell },
    { id: 'tests', href: '/tests', label: 'Tests', icon: Award },
    { id: 'games', href: '/arcade', label: 'Games', icon: Gamepad2 },
    { id: 'analytics', href: '/analytics', label: 'Analytics', icon: BarChart2 },
  ];

  const firstName = userAccount ? userAccount.fullName.split(' ')[0] : '';

  const handleNavClick = (
    e: React.MouseEvent<HTMLAnchorElement>,
    itemId: string
  ) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) {
      return;
    }
    e.preventDefault();
    if (itemId === 'games') {
      onOpenArcade();
    } else {
      setActiveTab(itemId);
    }
  };

  return (
    <header className="sticky top-0 z-50 bg-white/90 dark:bg-[#09090B]/90 backdrop-blur-md border-b border-zinc-200 dark:border-white/[0.08] transition-colors duration-150">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between gap-6">
        {/* Zone 1: Compact Single-Line Brand Mark */}
        <a
          href="/"
          onClick={(e) => handleNavClick(e, 'dashboard')}
          className="flex items-center gap-2.5 text-left shrink-0 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
        >
          <span className="w-7 h-7 rounded-md bg-zinc-900 dark:bg-zinc-100 flex items-center justify-center text-white dark:text-zinc-950 shrink-0">
            <Keyboard className="w-4 h-4" />
          </span>
          <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 tracking-tight whitespace-nowrap">
            TypeCrest
          </span>
        </a>

        {/* Zone 2: Clean Single-Line Navigation Links */}
        <nav
          aria-label="Primary navigation"
          className="hidden md:flex items-center gap-1 min-w-0"
        >
          {navItems.map((item) => {
            const isGames = item.id === 'games';
            const isActive = !isGames && activeTab === item.id;
            return (
              <a
                key={item.id}
                href={item.href}
                onClick={(e) => handleNavClick(e, item.id)}
                className={`
                  relative flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap shrink-0
                  transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500
                  ${
                    isActive
                      ? 'text-zinc-950 bg-zinc-100 dark:text-zinc-50 dark:bg-white/[0.07]'
                      : isGames
                      ? 'text-amber-700 hover:text-amber-800 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 dark:text-amber-300 dark:hover:text-amber-200 dark:bg-amber-500/[0.08] dark:hover:bg-amber-500/[0.15] dark:border-amber-500/25'
                      : 'text-zinc-600 hover:text-zinc-950 hover:bg-zinc-100/80 dark:text-zinc-400 dark:hover:text-zinc-100 dark:hover:bg-white/[0.04]'
                  }
                `}
              >
                {isGames && <Gamepad2 className="w-3.5 h-3.5 shrink-0 text-amber-500 dark:text-amber-400" />}
                <span>{item.label}</span>
                {isActive && (
                  <span
                    aria-hidden="true"
                    className="absolute inset-x-3 -bottom-[11px] h-px bg-emerald-500 dark:bg-emerald-400"
                  />
                )}
              </a>
            );
          })}
        </nav>

        {/* Zone 3: Theme Toggle + Account Action */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={onToggleTheme}
            aria-label={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
            title={theme === 'light' ? 'Light mode (click for dark mode)' : 'Dark mode (click for light mode)'}
            className="inline-flex items-center justify-center w-8 h-8 rounded-lg border border-zinc-200 dark:border-white/[0.1] bg-zinc-50 hover:bg-zinc-100 dark:bg-zinc-900 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-200 transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
          >
            {theme === 'light' ? (
              <Sun className="w-4 h-4 text-amber-500" />
            ) : (
              <Moon className="w-4 h-4 text-sky-300" />
            )}
          </button>

          <button
            type="button"
            onClick={onOpenAccount}
            className={`inline-flex items-center gap-2 h-8 px-3.5 rounded-lg border text-xs font-medium whitespace-nowrap shrink-0 transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 ${
              userAccount
                ? 'bg-white hover:bg-zinc-100 border-zinc-200 text-zinc-900 dark:bg-zinc-900 dark:hover:bg-zinc-800 dark:border-white/[0.1] dark:text-zinc-100'
                : 'bg-zinc-900 hover:bg-zinc-800 border-transparent text-white dark:bg-zinc-100 dark:hover:bg-white dark:text-zinc-950 font-semibold'
            }`}
            title={
              userAccount
                ? userAccount.isGuest
                  ? `Guest Typist: ${userAccount.fullName} (click to edit name or create account)`
                  : `Signed in as ${userAccount.fullName}`
                : 'Sign in, create an account, or set a guest name'
            }
          >
            {userAccount ? (
              <>
                <span className="w-4 h-4 rounded bg-emerald-500 text-white dark:text-zinc-950 text-[9px] font-bold flex items-center justify-center shrink-0">
                  {getUserInitials(userAccount.fullName)}
                </span>
                <span className="max-w-[96px] truncate">{firstName}</span>
              </>
            ) : (
              <>
                <User className="w-3.5 h-3.5 shrink-0" />
                <span>Sign In</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Compact Mobile Navigation Bar */}
      <nav
        aria-label="Mobile navigation"
        className="flex md:hidden items-center justify-around bg-white/95 dark:bg-[#09090B]/95 border-t border-zinc-200 dark:border-white/[0.08] py-1.5 px-1"
      >
        {navItems.map((item) => {
          const Icon = item.icon;
          const isGames = item.id === 'games';
          const isActive = !isGames && activeTab === item.id;
          return (
            <a
              key={item.id}
              href={item.href}
              onClick={(e) => handleNavClick(e, item.id)}
              className={`
                flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-md text-[11px] whitespace-nowrap transition-colors
                ${
                  isActive
                    ? 'text-emerald-600 dark:text-emerald-400 font-medium bg-zinc-100 dark:bg-white/[0.06]'
                    : isGames
                    ? 'text-amber-600 dark:text-amber-400 font-medium'
                    : 'text-zinc-500 dark:text-zinc-400'
                }
              `}
            >
              <Icon className="w-4 h-4" />
              <span>{item.label}</span>
            </a>
          );
        })}
      </nav>
    </header>
  );
};
