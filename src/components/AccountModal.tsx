import React, { useEffect, useState } from 'react';
import { UserAccount } from '../types';
import { getUserInitials } from '../utils/certificateEngine';
import {
  createGuestAccount,
  registerLocalAccount,
  signInLocalAccount,
  updateActiveUserName,
  updateLocalAccountPassword,
  upgradeGuestToLocalAccount,
} from '../utils/localAuthEngine';
import {
  AlertCircle,
  ArrowRight,
  Award,
  Check,
  Eye,
  EyeOff,
  Lock,
  LogOut,
  Mail,
  Trophy,
  User,
  UserCheck,
  X,
} from 'lucide-react';

export type AccountModalContext = 'default' | 'leaderboard' | 'certificate';
export type AccountAuthTab = 'guest' | 'create' | 'signin';

interface AccountModalProps {
  userAccount: UserAccount | null;
  certificateCount: number;
  context?: AccountModalContext;
  initialTab?: AccountAuthTab;
  hasSavedLocalAccounts?: boolean;
  onAccountUpdated: (account: UserAccount, isReturningSignIn?: boolean) => void;
  onSignOut: () => void;
  onViewCertificates: () => void;
  onClose: () => void;
}

export const AccountModal: React.FC<AccountModalProps> = ({
  userAccount,
  certificateCount,
  context = 'default',
  initialTab,
  hasSavedLocalAccounts = false,
  onAccountUpdated,
  onSignOut,
  onViewCertificates,
  onClose,
}) => {
  const defaultAuthTab: AccountAuthTab =
    initialTab ||
    (context === 'leaderboard' || context === 'certificate'
      ? 'guest'
      : hasSavedLocalAccounts
      ? 'signin'
      : 'create');

  // Unnamed auth tabs state
  const [authTab, setAuthTab] = useState<AccountAuthTab>(defaultAuthTab);
  const [guestNameInput, setGuestNameInput] = useState('');
  const [createName, setCreateName] = useState('');
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [showAuthPassword, setShowAuthPassword] = useState(false);

  // Active account / guest edit state
  const isGuest = Boolean(userAccount?.isGuest);
  const [guestTab, setGuestTab] = useState<'name' | 'upgrade'>('name');
  const [fullName, setFullName] = useState(userAccount?.fullName || '');
  const [upgradeEmail, setUpgradeEmail] = useState('');
  const [upgradePassword, setUpgradePassword] = useState('');
  const [showUpgradePassword, setShowUpgradePassword] = useState(false);

  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showPasswordFields, setShowPasswordFields] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [savedLabel, setSavedLabel] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setFullName(userAccount?.fullName || '');
  }, [userAccount?.fullName]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const showSavedToast = (label: string) => {
    setSavedLabel(label);
    setTimeout(() => setSavedLabel(null), 1800);
  };

  // --- Handlers when userAccount === null ---
  const handleGuestEntry = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const result = createGuestAccount(guestNameInput);
    if (!result.ok || !result.account) {
      setError(result.error || 'Enter your guest name.');
      return;
    }
    onAccountUpdated(result.account);
  };

  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const result = await registerLocalAccount({
        fullName: createName,
        email: authEmail,
        password: authPassword,
      });
      if (!result.ok || !result.account) {
        setError(result.error || 'Unable to create account.');
        return;
      }
      onAccountUpdated(result.account);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const result = await signInLocalAccount({
        email: authEmail,
        password: authPassword,
      });
      if (!result.ok || !result.account) {
        setError(result.error || 'Unable to sign in.');
        return;
      }
      onAccountUpdated(result.account, true);
    } finally {
      setSubmitting(false);
    }
  };

  // --- Handlers when userAccount !== null ---
  const handleSaveName = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userAccount) return;
    setError(null);
    const result = updateActiveUserName(userAccount, fullName);
    if (!result.ok || !result.account) {
      setError(result.error || 'Enter a valid name.');
      return;
    }
    onAccountUpdated(result.account);
    showSavedToast('Saved');
  };

  const handleUpgradeGuest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userAccount) return;
    setSubmitting(true);
    setError(null);
    try {
      const result = await upgradeGuestToLocalAccount(userAccount, {
        fullName,
        email: upgradeEmail,
        password: upgradePassword,
      });
      if (!result.ok || !result.account) {
        setError(result.error || 'Unable to create account.');
        return;
      }
      onAccountUpdated(result.account);
      setUpgradeEmail('');
      setUpgradePassword('');
      setGuestTab('name');
      showSavedToast('Account Created');
    } finally {
      setSubmitting(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userAccount) return;
    setSubmitting(true);
    setError(null);
    try {
      const result = await updateLocalAccountPassword(
        userAccount,
        currentPassword,
        newPassword
      );
      if (!result.ok) {
        setError(result.error || 'Unable to update password.');
        return;
      }
      setCurrentPassword('');
      setNewPassword('');
      setShowPasswordForm(false);
      showSavedToast('Password Updated');
    } finally {
      setSubmitting(false);
    }
  };

  const unnamedTitle =
    context === 'certificate'
      ? 'Claim Certificate'
      : context === 'leaderboard'
      ? 'Arcade Leaderboards'
      : 'Sign In';

  const unnamedHeaderIcon =
    context === 'certificate' ? (
      <Award className="w-5 h-5 text-amber-300" />
    ) : context === 'leaderboard' ? (
      <Trophy className="w-5 h-5 text-amber-300" />
    ) : (
      <User className="w-5 h-5 text-indigo-300" />
    );

  const unnamedTabs: { id: AccountAuthTab; label: string }[] = [
    { id: 'guest', label: 'Guest User' },
    { id: 'create', label: 'Create Account' },
    { id: 'signin', label: 'Sign In' },
  ];

  const guestSubmitLabel =
    context === 'certificate'
      ? 'Generate Certificate'
      : context === 'leaderboard'
      ? 'View Leaderboards'
      : 'Continue as Guest';

  return (
    <div
      className="fixed inset-0 z-[70] bg-zinc-950/60 dark:bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn"
      role="dialog"
      aria-modal="true"
      aria-label={userAccount ? (isGuest ? 'Guest Typist' : 'Local Account') : unnamedTitle}
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-white dark:bg-slate-900 border border-zinc-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200 dark:border-slate-800">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-600 dark:bg-indigo-500/20 dark:border-indigo-500/30 flex items-center justify-center dark:text-indigo-300 font-bold text-sm shrink-0">
              {userAccount ? getUserInitials(userAccount.fullName) : unnamedHeaderIcon}
            </div>
            <div className="min-w-0">
              <h2 className="text-base font-bold text-zinc-950 dark:text-white truncate">
                {userAccount ? (isGuest ? 'Guest Typist' : 'Local Account') : unnamedTitle}
              </h2>
              {userAccount?.email && (
                <p className="text-xs text-zinc-500 dark:text-slate-400 truncate">{userAccount.email}</p>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800 transition-colors shrink-0"
            aria-label="Close modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5">
          {!userAccount ? (
            /* UNNAMED VISITOR: Guest User | Create Account | Sign In */
            <>
              <div
                role="tablist"
                aria-label="Choose how to continue"
                className="grid grid-cols-3 gap-1 p-1 rounded-xl bg-zinc-100 border border-zinc-200 dark:bg-slate-950 dark:border-slate-800"
              >
                {unnamedTabs.map((tab) => {
                  const isActive = authTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      role="tab"
                      aria-selected={isActive}
                      onClick={() => {
                        setAuthTab(tab.id);
                        setError(null);
                        setShowAuthPassword(false);
                      }}
                      className={`px-2.5 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 ${
                        isActive
                          ? 'bg-indigo-600 text-white shadow-sm'
                          : 'text-zinc-600 hover:text-zinc-950 dark:text-slate-400 dark:hover:text-white'
                      }`}
                    >
                      {tab.label}
                    </button>
                  );
                })}
              </div>

              {error && (
                <div
                  role="alert"
                  className="flex items-start gap-2 rounded-xl bg-rose-950/50 border border-rose-500/40 px-3.5 py-2.5 text-xs text-rose-200"
                >
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              {authTab === 'guest' && (
                <form onSubmit={handleGuestEntry} className="space-y-4">
                  <div>
                    <label
                      htmlFor="modal-guest-name"
                      className="block text-xs font-semibold text-slate-300 mb-1.5"
                    >
                      Guest Typist Name
                    </label>
                    <div className="relative">
                      <UserCheck className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        id="modal-guest-name"
                        type="text"
                        autoFocus
                        required
                        maxLength={80}
                        value={guestNameInput}
                        onChange={(e) => {
                          setGuestNameInput(e.target.value);
                          if (error) setError(null);
                        }}
                        placeholder="Enter your name"
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 focus:border-indigo-500 focus:outline-none text-sm text-white placeholder:text-slate-500"
                      />
                    </div>
                  </div>

                  <div className="pt-1 flex items-center justify-between gap-3">
                    <button
                      type="button"
                      onClick={onClose}
                      className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors whitespace-nowrap"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-colors whitespace-nowrap shadow-lg shadow-indigo-600/25"
                    >
                      <span>{guestSubmitLabel}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </form>
              )}

              {authTab === 'create' && (
                <form onSubmit={handleCreateAccount} className="space-y-4">
                  <div>
                    <label
                      htmlFor="modal-create-name"
                      className="block text-xs font-semibold text-slate-300 mb-1.5"
                    >
                      Full Name
                    </label>
                    <div className="relative">
                      <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        id="modal-create-name"
                        type="text"
                        autoFocus
                        required
                        maxLength={80}
                        value={createName}
                        onChange={(e) => {
                          setCreateName(e.target.value);
                          if (error) setError(null);
                        }}
                        placeholder="Jordan Rivera"
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 focus:border-indigo-500 focus:outline-none text-sm text-white placeholder:text-slate-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="modal-create-email"
                      className="block text-xs font-semibold text-slate-300 mb-1.5"
                    >
                      Email ID
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        id="modal-create-email"
                        type="email"
                        required
                        maxLength={120}
                        autoComplete="email"
                        value={authEmail}
                        onChange={(e) => {
                          setAuthEmail(e.target.value);
                          if (error) setError(null);
                        }}
                        placeholder="jordan@example.com"
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 focus:border-indigo-500 focus:outline-none text-sm text-white placeholder:text-slate-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="modal-create-password"
                      className="block text-xs font-semibold text-slate-300 mb-1.5"
                    >
                      Password
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        id="modal-create-password"
                        type={showAuthPassword ? 'text' : 'password'}
                        required
                        minLength={6}
                        maxLength={128}
                        autoComplete="new-password"
                        value={authPassword}
                        onChange={(e) => {
                          setAuthPassword(e.target.value);
                          if (error) setError(null);
                        }}
                        placeholder="Minimum 6 characters"
                        className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-slate-950 border border-slate-700 focus:border-indigo-500 focus:outline-none text-sm text-white placeholder:text-slate-500"
                      />
                      <button
                        type="button"
                        onClick={() => setShowAuthPassword((prev) => !prev)}
                        aria-label={showAuthPassword ? 'Hide password' : 'Show password'}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 rounded-lg text-slate-400 hover:text-white"
                      >
                        {showAuthPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="pt-1 flex items-center justify-between gap-3">
                    <button
                      type="button"
                      onClick={onClose}
                      className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors whitespace-nowrap"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 text-white text-xs font-bold transition-colors whitespace-nowrap shadow-lg shadow-indigo-600/25"
                    >
                      <span>{submitting ? 'Creating...' : 'Create Account'}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </form>
              )}

              {authTab === 'signin' && (
                <form onSubmit={handleSignIn} className="space-y-4">
                  <div>
                    <label
                      htmlFor="modal-signin-email"
                      className="block text-xs font-semibold text-slate-300 mb-1.5"
                    >
                      Email ID
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        id="modal-signin-email"
                        type="email"
                        autoFocus
                        required
                        maxLength={120}
                        autoComplete="email"
                        value={authEmail}
                        onChange={(e) => {
                          setAuthEmail(e.target.value);
                          if (error) setError(null);
                        }}
                        placeholder="jordan@example.com"
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 focus:border-indigo-500 focus:outline-none text-sm text-white placeholder:text-slate-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="modal-signin-password"
                      className="block text-xs font-semibold text-slate-300 mb-1.5"
                    >
                      Password
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        id="modal-signin-password"
                        type={showAuthPassword ? 'text' : 'password'}
                        required
                        maxLength={128}
                        autoComplete="current-password"
                        value={authPassword}
                        onChange={(e) => {
                          setAuthPassword(e.target.value);
                          if (error) setError(null);
                        }}
                        placeholder="Enter password"
                        className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-slate-950 border border-slate-700 focus:border-indigo-500 focus:outline-none text-sm text-white placeholder:text-slate-500"
                      />
                      <button
                        type="button"
                        onClick={() => setShowAuthPassword((prev) => !prev)}
                        aria-label={showAuthPassword ? 'Hide password' : 'Show password'}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 rounded-lg text-slate-400 hover:text-white"
                      >
                        {showAuthPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="pt-1 flex items-center justify-between gap-3">
                    <button
                      type="button"
                      onClick={onClose}
                      className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors whitespace-nowrap"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 text-white text-xs font-bold transition-colors whitespace-nowrap shadow-lg shadow-indigo-600/25"
                    >
                      <span>{submitting ? 'Signing In...' : 'Sign In'}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </form>
              )}
            </>
          ) : (
            /* SIGNED-IN ACCOUNT OR NAMED GUEST PROFILE */
            <>
              <div className="flex items-center justify-between bg-slate-950/70 border border-slate-800 rounded-xl px-4 py-3">
                <div className="flex items-center gap-2.5">
                  <Award className="w-4 h-4 text-amber-400 shrink-0" />
                  <span className="text-xs text-slate-300">
                    Earned Certificates:{' '}
                    <strong className="text-white font-mono tabular-nums">{certificateCount}</strong>
                  </span>
                </div>
                <button
                  type="button"
                  onClick={onViewCertificates}
                  className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition-colors whitespace-nowrap"
                >
                  View All
                </button>
              </div>

              {isGuest && (
                <div
                  role="tablist"
                  aria-label="Guest profile options"
                  className="grid grid-cols-2 gap-1 p-1 rounded-xl bg-slate-950 border border-slate-800"
                >
                  <button
                    type="button"
                    role="tab"
                    aria-selected={guestTab === 'name'}
                    onClick={() => {
                      setGuestTab('name');
                      setError(null);
                    }}
                    className={`px-3 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                      guestTab === 'name'
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Guest Name
                  </button>
                  <button
                    type="button"
                    role="tab"
                    aria-selected={guestTab === 'upgrade'}
                    onClick={() => {
                      setGuestTab('upgrade');
                      setError(null);
                    }}
                    className={`px-3 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                      guestTab === 'upgrade'
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Create Account
                  </button>
                </div>
              )}

              {error && (
                <div
                  role="alert"
                  className="flex items-start gap-2 rounded-xl bg-rose-950/50 border border-rose-500/40 px-3.5 py-2.5 text-xs text-rose-200"
                >
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              {isGuest && guestTab === 'upgrade' ? (
                <form onSubmit={handleUpgradeGuest} className="space-y-4">
                  <div>
                    <label
                      htmlFor="upgrade-account-fullname"
                      className="block text-xs font-semibold text-slate-300 mb-1.5"
                    >
                      Full Name
                    </label>
                    <div className="relative">
                      <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        id="upgrade-account-fullname"
                        type="text"
                        required
                        maxLength={80}
                        value={fullName}
                        onChange={(e) => {
                          setFullName(e.target.value);
                          if (error) setError(null);
                        }}
                        placeholder="Jordan Rivera"
                        className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 focus:border-indigo-500 focus:outline-none text-sm text-white placeholder:text-slate-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="upgrade-account-email"
                      className="block text-xs font-semibold text-slate-300 mb-1.5"
                    >
                      Email ID
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        id="upgrade-account-email"
                        type="email"
                        autoFocus
                        required
                        maxLength={120}
                        autoComplete="email"
                        value={upgradeEmail}
                        onChange={(e) => {
                          setUpgradeEmail(e.target.value);
                          if (error) setError(null);
                        }}
                        placeholder="jordan@example.com"
                        className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 focus:border-indigo-500 focus:outline-none text-sm text-white placeholder:text-slate-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="upgrade-account-password"
                      className="block text-xs font-semibold text-slate-300 mb-1.5"
                    >
                      Password
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        id="upgrade-account-password"
                        type={showUpgradePassword ? 'text' : 'password'}
                        required
                        minLength={6}
                        maxLength={128}
                        autoComplete="new-password"
                        value={upgradePassword}
                        onChange={(e) => {
                          setUpgradePassword(e.target.value);
                          if (error) setError(null);
                        }}
                        placeholder="Minimum 6 characters"
                        className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-slate-950 border border-slate-700 focus:border-indigo-500 focus:outline-none text-sm text-white placeholder:text-slate-500"
                      />
                      <button
                        type="button"
                        onClick={() => setShowUpgradePassword((prev) => !prev)}
                        aria-label={showUpgradePassword ? 'Hide password' : 'Show password'}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 rounded-lg text-slate-400 hover:text-white"
                      >
                        {showUpgradePassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="pt-2 flex items-center justify-between gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        onSignOut();
                        onClose();
                      }}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800/80 hover:bg-rose-950/60 text-slate-300 hover:text-rose-300 border border-slate-700 hover:border-rose-500/40 text-xs font-semibold transition-colors whitespace-nowrap"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Sign Out</span>
                    </button>

                    <button
                      type="submit"
                      disabled={submitting}
                      className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 text-white text-xs font-bold transition-colors whitespace-nowrap shadow-lg shadow-indigo-600/25"
                    >
                      <span>{submitting ? 'Saving...' : 'Create Account'}</span>
                    </button>
                  </div>
                </form>
              ) : (
                <div className="space-y-4">
                  <form onSubmit={handleSaveName} className="space-y-4">
                    <div>
                      <label
                        htmlFor="profile-account-fullname"
                        className="block text-xs font-semibold text-slate-300 mb-1.5"
                      >
                        {isGuest ? 'Guest Typist Name' : 'Full Name'}
                      </label>
                      <input
                        id="profile-account-fullname"
                        type="text"
                        autoFocus
                        required
                        maxLength={80}
                        value={fullName}
                        onChange={(e) => {
                          setFullName(e.target.value);
                          if (error) setError(null);
                        }}
                        placeholder="Enter your name"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 focus:border-indigo-500 focus:outline-none text-sm text-white placeholder:text-slate-500"
                      />
                    </div>

                    {!isGuest && userAccount.email && (
                      <div>
                        <label
                          htmlFor="profile-account-email"
                          className="block text-xs font-semibold text-slate-300 mb-1.5"
                        >
                          Email ID
                        </label>
                        <input
                          id="profile-account-email"
                          type="email"
                          readOnly
                          value={userAccount.email}
                          className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/60 border border-slate-800 text-sm text-slate-400 cursor-default focus:outline-none"
                        />
                      </div>
                    )}

                    <div className="pt-1 flex items-center justify-between gap-3">
                      <button
                        type="button"
                        onClick={() => {
                          onSignOut();
                          onClose();
                        }}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800/80 hover:bg-rose-950/60 text-slate-300 hover:text-rose-300 border border-slate-700 hover:border-rose-500/40 text-xs font-semibold transition-colors whitespace-nowrap"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>Sign Out</span>
                      </button>

                      <button
                        type="submit"
                        className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-colors whitespace-nowrap shadow-lg shadow-indigo-600/25"
                      >
                        {savedLabel ? (
                          <>
                            <Check className="w-3.5 h-3.5" />
                            <span>{savedLabel}</span>
                          </>
                        ) : (
                          <span>{isGuest ? 'Save Name' : 'Save Changes'}</span>
                        )}
                      </button>
                    </div>
                  </form>

                  {!isGuest && userAccount.email && (
                    <div className="pt-3 border-t border-slate-800">
                      {!showPasswordForm ? (
                        <button
                          type="button"
                          onClick={() => {
                            setShowPasswordForm(true);
                            setError(null);
                          }}
                          className="text-xs font-semibold text-slate-400 hover:text-indigo-300 transition-colors"
                        >
                          Change Password
                        </button>
                      ) : (
                        <form onSubmit={handleChangePassword} className="space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-slate-300">Change Password</span>
                            <button
                              type="button"
                              onClick={() => {
                                setShowPasswordForm(false);
                                setCurrentPassword('');
                                setNewPassword('');
                                setError(null);
                              }}
                              className="text-xs text-slate-400 hover:text-white"
                            >
                              Cancel
                            </button>
                          </div>

                          <div className="relative">
                            <input
                              type={showPasswordFields ? 'text' : 'password'}
                              required
                              autoComplete="current-password"
                              value={currentPassword}
                              onChange={(e) => {
                                setCurrentPassword(e.target.value);
                                if (error) setError(null);
                              }}
                              placeholder="Current password"
                              aria-label="Current password"
                              className="w-full px-3.5 py-2 pr-10 rounded-xl bg-slate-950 border border-slate-700 focus:border-indigo-500 focus:outline-none text-xs text-white placeholder:text-slate-500"
                            />
                            <button
                              type="button"
                              onClick={() => setShowPasswordFields((prev) => !prev)}
                              aria-label={showPasswordFields ? 'Hide passwords' : 'Show passwords'}
                              className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 rounded text-slate-400 hover:text-white"
                            >
                              {showPasswordFields ? (
                                <EyeOff className="w-3.5 h-3.5" />
                              ) : (
                                <Eye className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </div>

                          <input
                            type={showPasswordFields ? 'text' : 'password'}
                            required
                            minLength={6}
                            maxLength={128}
                            autoComplete="new-password"
                            value={newPassword}
                            onChange={(e) => {
                              setNewPassword(e.target.value);
                              if (error) setError(null);
                            }}
                            placeholder="New password (min 6 characters)"
                            aria-label="New password"
                            className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-700 focus:border-indigo-500 focus:outline-none text-xs text-white placeholder:text-slate-500"
                          />

                          <button
                            type="submit"
                            disabled={submitting}
                            className="w-full py-2 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-semibold text-white transition-colors whitespace-nowrap"
                          >
                            {submitting ? 'Updating...' : 'Update Password'}
                          </button>
                        </form>
                      )}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
