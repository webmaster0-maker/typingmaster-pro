import React from 'react';
import { Keyboard, BookOpen, Dumbbell, Award, BarChart2, User, Gamepad2 } from 'lucide-react';
import { UserAccount } from '../types';
import { getUserInitials } from '../utils/certificateEngine';

interface HeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  userAccount: UserAccount | null;
  onOpenAccount: () => void;
  onOpenArcade: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  userAccount,
  onOpenAccount,
  onOpenArcade,
}) => {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Keyboard },
    { id: 'lessons', label: 'Lessons', icon: BookOpen },
    { id: 'practice', label: 'Practice', icon: Dumbbell },
    { id: 'tests', label: 'Tests', icon: Award },
    { id: 'games', label: 'Games', icon: Gamepad2 },
    { id: 'analytics', label: 'Analytics', icon: BarChart2 },
  ];

  const firstName = userAccount ? userAccount.fullName.split(' ')[0] : '';

  return (
    <header className="sticky top-0 z-50 bg-slate-950/90 backdrop-blur-md border-b border-slate-800/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-6">
        {/* Zone 1: Compact Single-Line Brand Mark */}
        <button
          type="button"
          onClick={() => setActiveTab('dashboard')}
          className="flex items-center gap-2.5 text-left shrink-0 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
        >
          <span className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-600 to-indigo-400 flex items-center justify-center text-white shadow-sm shadow-indigo-500/30 shrink-0">
            <Keyboard className="w-4 h-4" />
          </span>
          <span className="text-base font-bold text-white tracking-tight whitespace-nowrap">
            TypeCrest
          </span>
        </button>

        {/* Zone 2: Clean Single-Line Navigation Links */}
        <nav
          aria-label="Primary navigation"
          className="hidden md:flex items-center gap-1 lg:gap-2 min-w-0"
        >
          {navItems.map((item) => {
            const isGames = item.id === 'games';
            const isActive = !isGames && activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => (isGames ? onOpenArcade() : setActiveTab(item.id))}
                className={`
                  relative flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap shrink-0
                  transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400
                  ${
                    isActive
                      ? 'text-white font-semibold bg-slate-800/70'
                      : isGames
                      ? 'text-amber-300 hover:text-amber-200 hover:bg-amber-500/10'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
                  }
                `}
              >
                {isGames && <Gamepad2 className="w-4 h-4 shrink-0" />}
                <span>{item.label}</span>
                {isActive && (
                  <span
                    aria-hidden="true"
                    className="absolute inset-x-3 -bottom-[13px] h-0.5 rounded-full bg-indigo-400"
                  />
                )}
              </button>
            );
          })}
        </nav>

        {/* Zone 3: Single Account Action */}
        <div className="flex items-center shrink-0">
          <button
            type="button"
            onClick={onOpenAccount}
            className={`inline-flex items-center gap-2 h-10 px-4 rounded-lg border text-sm font-semibold whitespace-nowrap shrink-0 transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 ${
              userAccount
                ? 'bg-slate-900 hover:bg-slate-800 border-slate-700 hover:border-indigo-400/60 text-white'
                : 'bg-indigo-600 hover:bg-indigo-500 border-indigo-500 text-white shadow-sm shadow-indigo-600/25'
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
                <span className="w-5 h-5 rounded-md bg-indigo-600 text-white text-[10px] font-bold flex items-center justify-center shrink-0">
                  {getUserInitials(userAccount.fullName)}
                </span>
                <span className="max-w-[96px] truncate">{firstName}</span>
              </>
            ) : (
              <>
                <User className="w-4 h-4 shrink-0" />
                <span>Sign In</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Compact Mobile Navigation Bar */}
      <nav
        aria-label="Mobile navigation"
        className="flex md:hidden items-center justify-around bg-slate-950/95 border-t border-slate-800/80 py-1.5 px-1"
      >
        {navItems.map((item) => {
          const Icon = item.icon;
          const isGames = item.id === 'games';
          const isActive = !isGames && activeTab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => (isGames ? onOpenArcade() : setActiveTab(item.id))}
              className={`
                flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-lg text-[11px] whitespace-nowrap transition-colors
                ${
                  isActive
                    ? 'text-indigo-400 font-semibold bg-indigo-950/50'
                    : isGames
                    ? 'text-amber-400 font-medium'
                    : 'text-slate-400'
                }
              `}
            >
              <Icon className="w-4 h-4" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>
    </header>
  );
};
