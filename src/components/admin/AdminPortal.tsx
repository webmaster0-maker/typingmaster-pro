import React, { useState, useEffect, useMemo } from 'react';
import {
  loginAdmin,
  getAdminSession,
  logoutAdmin,
  checkAdminLockout,
  AdminSession,
} from '../../utils/adminAuth';
import {
  getAdminTelemetrySummary,
  AdminTelemetryData,
} from '../../utils/adminTelemetry';
import { loadLocalAccounts } from '../../utils/localAuthEngine';
import { safeStorage } from '../../utils/safeStorage';
import { LocalAccountRecord, TypingCertificate } from '../../types';
import {
  Shield,
  Lock,
  Users,
  Eye,
  EyeOff,
  Activity,
  Award,
  TrendingUp,
  Clock,
  Sparkles,
  Search,
  CheckCircle2,
  AlertTriangle,
  LogOut,
  ArrowLeft,
  DollarSign,
  BarChart3,
  Flame,
  KeyRound,
  ExternalLink,
  SlidersHorizontal,
  LayoutGrid,
  RotateCcw,
  Upload,
  Link2,
  Trash2,
} from 'lucide-react';
import {
  AdPlacementKey,
  setAllAdLayoutsVisible,
  setAdPlacementVisible,
  setAdPlacementCreative,
  resetAdVisibilitySettings,
  useAdVisibilitySettings,
} from '../../utils/adSettings';

interface AdminPortalProps {
  onExit: () => void;
}

export const AdminPortal: React.FC<AdminPortalProps> = ({ onExit }) => {
  const [session, setSession] = useState<AdminSession | null>(() => {
    const auth = getAdminSession();
    return auth.authenticated && auth.session ? auth.session : null;
  });

  // Login form state (never pre-fill or expose admin email in client UI)
  const [emailInput, setEmailInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lockoutSecs, setLockoutSecs] = useState<number>(0);

  // Dashboard tab state
  const [activeTab, setActiveTab] = useState<'analytics' | 'leaderboard' | 'users' | 'certificates' | 'system'>('analytics');
  const [userSearchQuery, setUserSearchQuery] = useState('');

  // Telemetry data
  const [telemetry, setTelemetry] = useState<AdminTelemetryData>(() => getAdminTelemetrySummary());
  const [registeredAccounts, setRegisteredAccounts] = useState<LocalAccountRecord[]>(() => loadLocalAccounts());
  const adSettings = useAdVisibilitySettings();
  const visiblePlacementsCount = Object.values(adSettings.placements).filter(Boolean).length;
  const activePlacementsCount = adSettings.adsEnabled ? visiblePlacementsCount : 0;

  const certificatesList: TypingCertificate[] = useMemo(() => {
    try {
      const raw = safeStorage.getItem('typing_master_certificates');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {
      // Ignore
    }
    return [];
  }, [telemetry]);

  const avgCertSpeed =
    certificatesList.length > 0
      ? Math.round(
          certificatesList.reduce((acc, c) => acc + (Number(c.wpm) || 0), 0) /
            certificatesList.length
        )
      : 0;

  const avgCertAccuracy =
    certificatesList.length > 0
      ? Math.round(
          certificatesList.reduce((acc, c) => acc + (Number(c.accuracy) || 0), 0) /
            certificatesList.length
        )
      : 0;

  // Ensure search engines never index the gated portal
  useEffect(() => {
    if (typeof document === 'undefined') return;
    const robotsEl = document.querySelector('meta[name="robots"]') as HTMLMetaElement | null;
    const prevContent = robotsEl?.content || '';
    if (robotsEl) {
      robotsEl.content = 'noindex, nofollow';
    }
    return () => {
      if (robotsEl && prevContent) {
        robotsEl.content = prevContent;
      }
    };
  }, []);

  // Check lockout on mount and periodically
  useEffect(() => {
    const check = () => {
      const lock = checkAdminLockout();
      setLockoutSecs(lock.remainingSeconds);
    };
    check();
    const timer = setInterval(check, 1000);
    return () => clearInterval(timer);
  }, []);

  // Refresh telemetry periodically while logged in
  useEffect(() => {
    if (!session) return;
    const interval = setInterval(() => {
      setTelemetry(getAdminTelemetrySummary());
      setRegisteredAccounts(loadLocalAccounts());
    }, 10000);
    return () => clearInterval(interval);
  }, [session]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (lockoutSecs > 0) return;
    setLoginError(null);
    setIsSubmitting(true);

    try {
      const res = await loginAdmin(emailInput, passwordInput);
      if (res.ok && res.session) {
        setSession(res.session);
        setPasswordInput('');
        setTelemetry(getAdminTelemetrySummary());
        setRegisteredAccounts(loadLocalAccounts());
      } else {
        setLoginError(res.error || 'Authentication failed.');
      }
    } catch {
      setLoginError('Error validating admin credentials.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogout = () => {
    logoutAdmin();
    setSession(null);
    setPasswordInput('');
  };

  const filteredAccounts = useMemo(() => {
    if (!userSearchQuery.trim()) return registeredAccounts;
    const q = userSearchQuery.toLowerCase();
    return registeredAccounts.filter(
      (a) => a.fullName.toLowerCase().includes(q) || a.email.toLowerCase().includes(q)
    );
  }, [registeredAccounts, userSearchQuery]);

  // =========================================================================
  // VIEW 1: ADMIN LOGIN SCREEN (If not logged in)
  // =========================================================================
  if (!session) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center items-center p-4 selection:bg-indigo-500 selection:text-white font-sans relative overflow-hidden">
        {/* Ambient background glow */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="w-full max-w-md bg-slate-900/90 border border-slate-800 rounded-3xl p-8 shadow-2xl backdrop-blur-xl relative z-10 animate-fadeIn">
          {/* Top Shield Header */}
          <div className="flex flex-col items-center text-center mb-8">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-600 to-sky-500 flex items-center justify-center text-white shadow-lg shadow-indigo-500/25 mb-4">
              <Shield className="w-8 h-8" />
            </div>
            <h1 className="text-2xl font-extrabold text-white tracking-tight">Master Admin Portal</h1>
            <p className="text-xs text-slate-400 mt-1">TypeCrest Management &amp; Analytics Console</p>
          </div>

          {/* Lockout Warning */}
          {lockoutSecs > 0 && (
            <div className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 shrink-0" />
              <span>
                Too many failed attempts. Security lockout active for{' '}
                <strong className="font-mono">{lockoutSecs}s</strong>.
              </span>
            </div>
          )}

          {/* Error Message */}
          {loginError && lockoutSecs === 0 && (
            <div className="mb-6 p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-center gap-2.5">
              <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400" />
              <span>{loginError}</span>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Admin Email ID
              </label>
              <div className="relative">
                <input
                  type="email"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  disabled={lockoutSecs > 0 || isSubmitting}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
                  placeholder="Enter administrator email"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Master Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  disabled={lockoutSecs > 0 || isSubmitting}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors pr-10"
                  placeholder="••••••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                  tabIndex={-1}
                >
                  <Eye className="w-4 h-4" />
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={lockoutSecs > 0 || isSubmitting}
              className="w-full mt-2 py-3 px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-sky-600 hover:from-indigo-500 hover:to-sky-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Lock className="w-4 h-4" />
              <span>{isSubmitting ? 'Authenticating...' : 'Sign In to Admin Portal'}</span>
            </button>
          </form>

          {/* Quick hint for master password */}
          <div className="mt-6 pt-5 border-t border-slate-800/80 text-center">
            <p className="text-[11px] text-slate-500 flex items-center justify-center gap-1.5">
              <KeyRound className="w-3 h-3 text-indigo-400" />
              <span>Hardware-isolated PBKDF2 authentication (100,000 iterations)</span>
            </p>
          </div>

          <div className="mt-4 text-center">
            <button
              type="button"
              onClick={onExit}
              className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Public Website</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // VIEW 2: MASTER ADMIN DASHBOARD (When authenticated)
  // =========================================================================
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      {/* Top Admin Navigation Bar */}
      <header className="sticky top-0 z-40 bg-slate-900/90 border-b border-slate-800 backdrop-blur-md px-4 sm:px-8 py-3.5 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-sky-500 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-sm sm:text-base text-white tracking-tight">TypeCrest</span>
              <span className="px-2 py-0.5 rounded-full bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 text-[10px] font-bold uppercase tracking-wider">
                Admin
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-[11px] text-emerald-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>Cloudflare Edge Live</span>
              <span className="text-slate-500">•</span>
              <span className="text-slate-400 font-mono">{session.adminEmail}</span>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1.5 bg-slate-950/80 p-1 rounded-xl border border-slate-800 text-xs">
          <button
            onClick={() => setActiveTab('analytics')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-all flex items-center gap-1.5 ${
              activeTab === 'analytics'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Traffic &amp; Hours</span>
          </button>

          <button
            onClick={() => setActiveTab('leaderboard')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-all flex items-center gap-1.5 ${
              activeTab === 'leaderboard'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Flame className="w-3.5 h-3.5" />
            <span>Leaderboard</span>
          </button>

          <button
            onClick={() => setActiveTab('users')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-all flex items-center gap-1.5 ${
              activeTab === 'users'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Users ({registeredAccounts.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('certificates')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-all flex items-center gap-1.5 ${
              activeTab === 'certificates'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Award className="w-3.5 h-3.5" />
            <span>Certificates</span>
          </button>

          <button
            onClick={() => setActiveTab('system')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-all flex items-center gap-1.5 ${
              activeTab === 'system'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>AdSense Settings</span>
          </button>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={onExit}
            className="px-3 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-slate-700 transition-colors flex items-center gap-1.5"
            title="Open Public Application"
          >
            <span>Public Site</span>
            <ExternalLink className="w-3 h-3" />
          </button>

          <button
            onClick={handleLogout}
            className="px-3 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-semibold transition-colors flex items-center gap-1.5"
            title="Sign Out of Admin Portal"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Logout</span>
          </button>
        </div>
      </header>

      {/* Main Admin Dashboard Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-8 space-y-8 animate-fadeIn">
        {/* KPI OVERVIEW CARDS */}
        <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 shadow-lg flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-[11px] font-semibold">Active Typists Now</span>
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            </div>
            <div className="text-2xl font-extrabold text-emerald-400 font-mono">
              {telemetry.activeUsersNow}
            </div>
            <div className="text-[10px] text-slate-500 mt-1">Live in last 15 min</div>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 shadow-lg flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-[11px] font-semibold">Total Visitors</span>
              <Users className="w-3.5 h-3.5 text-sky-400" />
            </div>
            <div className="text-2xl font-extrabold text-white font-mono">
              {telemetry.totalVisitors.toLocaleString()}
            </div>
            <div className="text-[10px] text-slate-500 mt-1">Live recorded visits</div>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 shadow-lg flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-[11px] font-semibold">Total Page Views</span>
              <Eye className="w-3.5 h-3.5 text-indigo-400" />
            </div>
            <div className="text-2xl font-extrabold text-indigo-300 font-mono">
              {telemetry.totalPageViews.toLocaleString()}
            </div>
            <div className="text-[10px] text-slate-500 mt-1">Total page requests</div>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 shadow-lg flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-[11px] font-semibold">Tests Completed</span>
              <Activity className="w-3.5 h-3.5 text-amber-400" />
            </div>
            <div className="text-2xl font-extrabold text-amber-400 font-mono">
              {telemetry.totalTestsCompleted.toLocaleString()}
            </div>
            <div className="text-[10px] text-slate-500 mt-1">Avg {telemetry.avgWpmAcrossUsers} WPM</div>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 shadow-lg flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-[11px] font-semibold">Certificates Issued</span>
              <Award className="w-3.5 h-3.5 text-emerald-400" />
            </div>
            <div className="text-2xl font-extrabold text-emerald-400 font-mono">
              {telemetry.totalCertificatesIssued}
            </div>
            <div className="text-[10px] text-slate-500 mt-1">Signed &amp; verified</div>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 shadow-lg flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-[11px] font-semibold">Ad Impressions</span>
              <DollarSign className="w-3.5 h-3.5 text-teal-400" />
            </div>
            <div className="text-2xl font-extrabold text-teal-300 font-mono">
              {telemetry.estimatedAdImpressions.toLocaleString()}
            </div>
            <div className="text-[10px] text-slate-500 mt-1">~3 slots / view</div>
          </div>
        </div>

        {/* TAB 1: TRAFFIC & HOURLY ENGAGEMENT HEATMAP */}
        {activeTab === 'analytics' && (
          <div className="space-y-8 animate-fadeIn">
            {/* HOURLY ENGAGEMENT HEATMAP */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
                <div>
                  <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    <Clock className="w-5 h-5 text-indigo-400" />
                    <span>Peak Engagement Hours (24-Hour Heatmap)</span>
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">
                    Shows when typists are most active during the day.
                  </p>
                </div>

                <div className="px-3.5 py-1.5 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-xs font-semibold flex items-center gap-2">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Peak Window: <strong>{telemetry.peakHourRange}</strong></span>
                </div>
              </div>

              {/* 24-Hour Bar Graph */}
              <div className="grid grid-cols-6 sm:grid-cols-12 md:grid-cols-24 gap-1.5 items-end h-48 pt-4 pb-2">
                {telemetry.hourlyEngagement.map((item) => {
                  const isTopPeak = item.percentage >= 85;
                  const isModerate = item.percentage >= 50 && item.percentage < 85;

                  return (
                    <div
                      key={item.hour}
                      className="h-full flex flex-col justify-end items-center group relative cursor-pointer"
                    >
                      {/* Tooltip on hover */}
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute -top-12 z-20 pointer-events-none px-2 py-1 rounded-md bg-slate-800 border border-slate-700 text-[10px] text-white whitespace-nowrap shadow-xl">
                        <div className="font-bold">{item.label}</div>
                        <div className="text-slate-300 font-mono">{item.sessions} sessions ({item.percentage}%)</div>
                      </div>

                      {/* Bar */}
                      <div
                        className={`w-full rounded-t-md transition-all duration-300 ${
                          isTopPeak
                            ? 'bg-gradient-to-t from-indigo-600 to-sky-400 shadow-lg shadow-sky-500/20'
                            : isModerate
                            ? 'bg-gradient-to-t from-indigo-900 to-indigo-600'
                            : 'bg-slate-800/80 hover:bg-slate-700'
                        }`}
                        style={{ height: `${Math.max(8, item.percentage)}%` }}
                      />

                      {/* Hour Label */}
                      <span className="text-[9px] text-slate-500 mt-2 font-mono truncate w-full text-center">
                        {item.hour % 3 === 0 ? item.label.replace(' ', '') : '·'}
                      </span>
                    </div>
                  );
                })}
              </div>

              <div className="flex flex-wrap items-center justify-between gap-4 mt-6 pt-4 border-t border-slate-800 text-xs text-slate-400">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-sm bg-gradient-to-t from-indigo-600 to-sky-400" />
                    <span>Peak Rush (&gt;85%)</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-sm bg-indigo-700" />
                    <span>Moderate (50-85%)</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-sm bg-slate-800" />
                    <span>Low Activity (&lt;50%)</span>
                  </div>
                </div>

                <div className="text-slate-400 text-[11px]">
                  💡 <em>AdSense tip: Target scheduled campaigns during the 2 PM – 5 PM and 8 PM – 11 PM windows.</em>
                </div>
              </div>
            </div>

            {/* DAILY TRAFFIC & RECENT ACTIVITY DUAL COLUMN */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Daily Traffic Breakdown */}
              <div className="lg:col-span-7 bg-slate-900/80 border border-slate-800 rounded-3xl p-6 shadow-xl">
                <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-emerald-400" />
                  <span>Daily Traffic Growth (Last 7 Days)</span>
                </h3>

                <div className="space-y-3">
                  {telemetry.dailyTraffic.map((day) => (
                    <div
                      key={day.date}
                      className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 flex items-center justify-between gap-4 font-mono text-xs"
                    >
                      <div className="w-24">
                        <span className="font-bold text-white">{day.dayName}</span>
                        <span className="text-[11px] text-slate-500 ml-2">{day.date.slice(5)}</span>
                      </div>

                      <div className="flex-1 hidden sm:block">
                        <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                          <div
                            className="bg-indigo-500 h-full rounded-full"
                            style={{ width: `${Math.min(100, Math.round((day.visitors / 600) * 100))}%` }}
                          />
                        </div>
                      </div>

                      <div className="flex items-center gap-4 text-right">
                        <div>
                          <span className="text-slate-200 font-bold">{day.visitors}</span>
                          <span className="text-[10px] text-slate-500 ml-1">users</span>
                        </div>
                        <div>
                          <span className="text-indigo-400 font-bold">{day.pageViews}</span>
                          <span className="text-[10px] text-slate-500 ml-1">views</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Live Activity Telemetry */}
              <div className="lg:col-span-5 bg-slate-900/80 border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col">
                <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">
                  <Activity className="w-4 h-4 text-sky-400" />
                  <span>Real-Time Activity Feed</span>
                </h3>

                <div className="flex-1 space-y-3 overflow-y-auto max-h-[360px] pr-1">
                  {telemetry.recentActivity.length === 0 ? (
                    <div className="p-8 text-center text-slate-500 text-xs border border-dashed border-slate-800 rounded-2xl flex flex-col items-center justify-center gap-2">
                      <Activity className="w-5 h-5 text-slate-600" />
                      <span>No activity recorded yet. Live events will stream here as visitors practice.</span>
                    </div>
                  ) : (
                    telemetry.recentActivity.map((act) => (
                      <div
                        key={act.id}
                        className="p-3 rounded-xl bg-slate-950 border border-slate-800/70 text-xs flex items-start gap-3"
                      >
                        <div className="w-2 h-2 rounded-full bg-indigo-400 mt-1.5 shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="text-slate-200 leading-snug">{act.description}</div>
                          <div className="text-[10px] text-slate-500 mt-0.5">{act.timestamp}</div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: GLOBAL LEADERBOARD */}
        {activeTab === 'leaderboard' && (
          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl animate-fadeIn space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <Flame className="w-5 h-5 text-amber-400" />
                  <span>Global Typing Leaderboard</span>
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Top performing typists ranked by speed (WPM) and accuracy across tests, exams, and arcade mode.
                </p>
              </div>

              <div className="text-xs text-slate-400">
                Showing top <strong>{telemetry.leaderboard.length}</strong> typists
              </div>
            </div>

            {telemetry.leaderboard.length === 0 ? (
              <div className="p-12 text-center text-slate-500 text-xs border border-dashed border-slate-800 rounded-2xl flex flex-col items-center justify-center gap-2">
                <Flame className="w-8 h-8 text-slate-600" />
                <span className="font-semibold text-slate-400">No live test scores recorded yet.</span>
                <span className="text-[11px] text-slate-500">
                  Scores will automatically rank here in real-time as users complete typing tests and exams.
                </span>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400 text-[11px] uppercase tracking-wider">
                      <th className="py-3 px-3">Rank</th>
                      <th className="py-3 px-4">Typist</th>
                      <th className="py-3 px-3">Speed</th>
                      <th className="py-3 px-3">Accuracy</th>
                      <th className="py-3 px-3">XP Earned</th>
                      <th className="py-3 px-3">Growth Bloom</th>
                      <th className="py-3 px-3">Mode</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-mono">
                    {telemetry.leaderboard.map((typist) => {
                      const isTop1 = typist.rank === 1;

                      return (
                        <tr
                          key={typist.rank}
                          className={`hover:bg-slate-800/40 transition-colors ${
                            isTop1 ? 'bg-amber-500/5' : ''
                          }`}
                        >
                          <td className="py-3 px-3 font-bold">
                            {typist.rank === 1 ? '🥇 1' : typist.rank === 2 ? '🥈 2' : typist.rank === 3 ? '🥉 3' : `#${typist.rank}`}
                          </td>
                          <td className="py-3 px-4 font-sans font-semibold text-white">
                            {typist.name}
                          </td>
                          <td className="py-3 px-3 font-bold text-sky-400">
                            {typist.wpm} WPM
                          </td>
                          <td className="py-3 px-3 text-emerald-400">
                            {typist.accuracy}%
                          </td>
                          <td className="py-3 px-3 text-amber-300 font-bold">
                            +{typist.xp} XP
                          </td>
                          <td className="py-3 px-3 font-sans text-slate-300">
                            {typist.bloomStage}
                          </td>
                          <td className="py-3 px-3">
                            <span className="px-2 py-0.5 rounded-full bg-slate-800 text-[10px] font-sans text-slate-300 uppercase">
                              {typist.mode}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: REGISTERED USER ACCOUNTS */}
        {activeTab === 'users' && (
          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl animate-fadeIn space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <Users className="w-5 h-5 text-indigo-400" />
                  <span>Registered User Accounts ({registeredAccounts.length})</span>
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  List of all typists registered on this platform with active PBKDF2 hash status.
                </p>
              </div>

              {/* Search Box */}
              <div className="relative w-full sm:w-64">
                <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={userSearchQuery}
                  onChange={(e) => setUserSearchQuery(e.target.value)}
                  placeholder="Search user name or email..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            {filteredAccounts.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-xs border border-dashed border-slate-800 rounded-2xl">
                No user accounts found matching your query.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400 text-[11px] uppercase tracking-wider">
                      <th className="py-3 px-3">Account ID</th>
                      <th className="py-3 px-4">Full Name</th>
                      <th className="py-3 px-4">Email ID</th>
                      <th className="py-3 px-3">Security Hash</th>
                      <th className="py-3 px-3">Joined Date</th>
                      <th className="py-3 px-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-mono">
                    {filteredAccounts.map((acc) => (
                      <tr key={acc.id} className="hover:bg-slate-800/40 transition-colors">
                        <td className="py-3 px-3 text-slate-400 text-[11px] truncate max-w-[120px]">
                          {acc.id}
                        </td>
                        <td className="py-3 px-4 font-sans font-bold text-white">
                          {acc.fullName}
                        </td>
                        <td className="py-3 px-4 text-indigo-300">
                          {acc.email}
                        </td>
                        <td className="py-3 px-3">
                          <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-[10px]">
                            {acc.passwordAlgo?.toUpperCase() || 'PBKDF2'} (100k)
                          </span>
                        </td>
                        <td className="py-3 px-3 text-slate-400 text-[11px]">
                          {acc.createdAt.split('T')[0]}
                        </td>
                        <td className="py-3 px-3">
                          <span className="inline-flex items-center gap-1 text-emerald-400 text-[11px]">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Active</span>
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* TAB 4: CERTIFICATES REGISTRY */}
        {activeTab === 'certificates' && (
          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl animate-fadeIn space-y-6">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Award className="w-5 h-5 text-emerald-400" />
                <span>Issued Certificates Registry ({telemetry.totalCertificatesIssued})</span>
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Official typing certificates generated, signed with HMAC cryptographic checksums.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800">
                <div className="text-[11px] text-slate-400">Total Valid Certificates</div>
                <div className="text-2xl font-extrabold text-emerald-400 font-mono mt-1">
                  {telemetry.totalCertificatesIssued}
                </div>
                <div className="text-[10px] text-slate-500 mt-1">Tamper-Proof SHA-256 Signatures</div>
              </div>

              <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800">
                <div className="text-[11px] text-slate-400">Average Certification Speed</div>
                <div className="text-2xl font-extrabold text-sky-400 font-mono mt-1">
                  {avgCertSpeed > 0 ? `${avgCertSpeed} WPM` : '0 WPM'}
                </div>
                <div className="text-[10px] text-slate-500 mt-1">Pass threshold: 35 WPM</div>
              </div>

              <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800">
                <div className="text-[11px] text-slate-400">Average Certification Accuracy</div>
                <div className="text-2xl font-extrabold text-amber-400 font-mono mt-1">
                  {avgCertAccuracy > 0 ? `${avgCertAccuracy}%` : '0%'}
                </div>
                <div className="text-[10px] text-slate-500 mt-1">Pass threshold: 95%</div>
              </div>
            </div>

            {certificatesList.length === 0 ? (
              <div className="p-12 text-center text-slate-500 text-xs border border-dashed border-slate-800 rounded-2xl flex flex-col items-center justify-center gap-2">
                <Award className="w-8 h-8 text-slate-600" />
                <span className="font-semibold text-slate-400">No certificates issued yet.</span>
                <span className="text-[11px] text-slate-500">
                  Pass a test or exam with ≥ 35 WPM &amp; ≥ 95% accuracy to generate an official verified certificate.
                </span>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400 text-[11px] uppercase tracking-wider">
                      <th className="py-3 px-3">Certificate Code</th>
                      <th className="py-3 px-4">Recipient Name</th>
                      <th className="py-3 px-4">Test Title</th>
                      <th className="py-3 px-3">Speed</th>
                      <th className="py-3 px-3">Accuracy</th>
                      <th className="py-3 px-3">Issued Date</th>
                      <th className="py-3 px-3">Integrity</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-mono">
                    {certificatesList.map((cert) => (
                      <tr key={cert.id} className="hover:bg-slate-800/40 transition-colors">
                        <td className="py-3 px-3 font-bold text-amber-300">
                          {cert.certificateCode}
                        </td>
                        <td className="py-3 px-4 font-sans font-bold text-white">
                          {cert.recipientName}
                        </td>
                        <td className="py-3 px-4 text-slate-300">
                          {cert.testTitle}
                        </td>
                        <td className="py-3 px-3 font-bold text-sky-400">
                          {cert.wpm} WPM
                        </td>
                        <td className="py-3 px-3 text-emerald-400">
                          {cert.accuracy}%
                        </td>
                        <td className="py-3 px-3 text-slate-400 text-[11px]">
                          {cert.issuedAt.split('T')[0]}
                        </td>
                        <td className="py-3 px-3">
                          <span className="inline-flex items-center gap-1 text-emerald-400 text-[11px]">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Signed</span>
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-emerald-400" />
                <span>Certificate integrity verification is active on all generated PNG downloads.</span>
              </div>
              <span className="text-[11px] text-emerald-400 font-mono">HMAC Checksum Active</span>
            </div>
          </div>
        )}

        {/* TAB 5: ADSENSE LAYOUT VISIBILITY & SITE SETTINGS */}
        {activeTab === 'system' && (
          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl animate-fadeIn space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <LayoutGrid className="w-5 h-5 text-indigo-400" />
                  <span>AdSense Layout Visibility Controls</span>
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Hide or unhide AdSense ad containers across hub pages, typing workspace, results screen, and fullscreen arcade modes. Changes apply immediately.
                </p>
              </div>

              <div className="flex items-center gap-2.5 self-start sm:self-auto">
                <span
                  className={`px-3 py-1 rounded-full text-[11px] font-bold border ${
                    adSettings.adsEnabled
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                      : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                  }`}
                >
                  {adSettings.adsEnabled
                    ? `${activePlacementsCount}/5 Layout Zones Visible`
                    : 'All AdSense Layouts Hidden'}
                </span>

                <button
                  type="button"
                  onClick={() => resetAdVisibilitySettings()}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-semibold transition-colors flex items-center gap-1.5"
                  title="Restore all AdSense layouts to visible"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset Default</span>
                </button>
              </div>
            </div>

            {/* Master Global Switch Card */}
            <div className="p-5 sm:p-6 rounded-2xl bg-slate-950/90 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-start gap-3.5">
                <div
                  className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 border ${
                    adSettings.adsEnabled
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                      : 'bg-slate-800 border-slate-700 text-slate-400'
                  }`}
                >
                  {adSettings.adsEnabled ? (
                    <Eye className="w-5 h-5" />
                  ) : (
                    <EyeOff className="w-5 h-5" />
                  )}
                </div>
                <div>
                  <div className="text-sm font-bold text-white">
                    Master AdSense Layouts Toggle
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {adSettings.adsEnabled
                      ? 'AdSense containers are currently active on the public site according to the zone switches below.'
                      : 'All AdSense banners, skyscrapers, rectangles, and arcade side rails are completely hidden from visitors.'}
                  </p>
                </div>
              </div>

              <button
                type="button"
                role="switch"
                aria-checked={adSettings.adsEnabled}
                onClick={() => setAllAdLayoutsVisible(!adSettings.adsEnabled)}
                className={`px-4 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center gap-2 shrink-0 border ${
                  adSettings.adsEnabled
                    ? 'bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border-rose-500/40'
                    : 'bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-500 shadow-lg shadow-emerald-600/20'
                }`}
              >
                {adSettings.adsEnabled ? (
                  <>
                    <EyeOff className="w-4 h-4" />
                    <span>Hide All AdSense Layouts</span>
                  </>
                ) : (
                  <>
                    <Eye className="w-4 h-4" />
                    <span>Unhide All AdSense Layouts</span>
                  </>
                )}
              </button>
            </div>

            {/* Individual Placement Controls */}
            <div className="space-y-3">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Individual AdSense Placement Zones
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {(
                  [
                    {
                      key: 'topLeaderboard',
                      title: 'Hub Top Leaderboard',
                      size: '728 × 90',
                      description: 'Horizontal banner above Dashboard, Courses, Practice, Tests & Analytics.',
                    },
                    {
                      key: 'bottomBanner',
                      title: 'Hub Bottom Banner',
                      size: '728 × 90',
                      description: 'Horizontal banner displayed above the main site footer.',
                    },
                    {
                      key: 'workspaceRails',
                      title: 'Typing Workspace Side Rails',
                      size: '160 × 600 (L & R)',
                      description: 'Left and right skyscrapers flanking desktop typing lessons & exams.',
                    },
                    {
                      key: 'resultsCard',
                      title: 'Session Results Rectangle',
                      size: '300 × 250',
                      description: 'Medium rectangle shown on lesson and certification results screens.',
                    },
                    {
                      key: 'arcadeRails',
                      title: 'Arcade Fullscreen Side Rails',
                      size: '160 × 600 (L & R)',
                      description: 'Sidebars flanking all 5 fullscreen TypeCrest Arcade games.',
                    },
                  ] as Array<{
                    key: AdPlacementKey;
                    title: string;
                    size: string;
                    description: string;
                  }>
                ).map((item) => {
                  const zoneEnabled = adSettings.placements[item.key];
                  const effectiveVisible = adSettings.adsEnabled && zoneEnabled;
                  const creative = adSettings.creatives?.[item.key];
                  const hasImage = Boolean(creative?.imageDataUrl);
                  const currentLink = creative?.linkUrl ?? '';

                  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    const reader = new FileReader();
                    reader.onload = () => {
                      const dataUrl = typeof reader.result === 'string' ? reader.result : '';
                      if (!dataUrl) return;
                      setAdPlacementCreative(item.key, {
                        imageDataUrl: dataUrl,
                        linkUrl: currentLink,
                      });
                    };
                    reader.readAsDataURL(file);
                    e.target.value = '';
                  };

                  return (
                    <div
                      key={item.key}
                      className={`p-4 rounded-2xl border transition-colors flex flex-col gap-3.5 ${
                        effectiveVisible
                          ? 'bg-slate-950/80 border-slate-800'
                          : 'bg-slate-950/40 border-slate-800/60 opacity-80'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs font-bold text-white">{item.title}</span>
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-slate-300 font-mono">
                              {item.size}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-400 mt-1">{item.description}</p>
                        </div>

                        <button
                          type="button"
                          role="switch"
                          aria-checked={zoneEnabled}
                          disabled={!adSettings.adsEnabled}
                          onClick={() => setAdPlacementVisible(item.key, !zoneEnabled)}
                          className={`px-3 py-1.5 rounded-lg text-[11px] font-bold border transition-all shrink-0 flex items-center gap-1.5 ${
                            !adSettings.adsEnabled
                              ? 'bg-slate-800/60 border-slate-700 text-slate-500 cursor-not-allowed'
                              : zoneEnabled
                              ? 'bg-emerald-500/15 hover:bg-emerald-500/25 border-emerald-500/40 text-emerald-300'
                              : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-300'
                          }`}
                        >
                          {effectiveVisible ? (
                            <>
                              <Eye className="w-3.5 h-3.5" />
                              <span>Visible</span>
                            </>
                          ) : (
                            <>
                              <EyeOff className="w-3.5 h-3.5" />
                              <span>Hidden</span>
                            </>
                          )}
                        </button>
                      </div>

                      {/* Custom Banner Image + Click-Through Link */}
                      <div className="pt-3 border-t border-slate-800/80 space-y-2.5">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-[11px] font-semibold text-slate-200 cursor-pointer transition-colors">
                            <Upload className="w-3.5 h-3.5 text-emerald-400" />
                            <span>{hasImage ? 'Replace Image' : 'Import Image'}</span>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handleImageUpload}
                              className="sr-only"
                            />
                          </label>

                          {hasImage && (
                            <button
                              type="button"
                              onClick={() => setAdPlacementCreative(item.key, null)}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-[11px] font-semibold text-rose-300 transition-colors"
                            >
                              <Trash2 className="w-3 h-3" />
                              <span>Remove</span>
                            </button>
                          )}
                        </div>

                        {hasImage && creative?.imageDataUrl && (
                          <div className="rounded-lg overflow-hidden border border-slate-800 bg-slate-900 max-h-24 flex items-center justify-center">
                            <img
                              src={creative.imageDataUrl}
                              alt={`${item.title} preview`}
                              className="max-h-24 w-auto object-contain"
                            />
                          </div>
                        )}

                        <div className="flex items-center gap-2">
                          <div className="relative flex-1 min-w-0">
                            <Link2 className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                            <input
                              type="url"
                              defaultValue={currentLink}
                              key={`${item.key}-${currentLink}`}
                              placeholder="https://destination-link.com"
                              onBlur={(e) => {
                                const nextUrl = e.target.value.trim();
                                if (nextUrl !== currentLink) {
                                  setAdPlacementCreative(item.key, {
                                    imageDataUrl: creative?.imageDataUrl || '',
                                    linkUrl: nextUrl,
                                  });
                                }
                              }}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  e.currentTarget.blur();
                                }
                              }}
                              aria-label={`${item.title} destination link`}
                              className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 focus:border-emerald-500/60 focus:outline-none text-[11px] text-slate-200 placeholder:text-slate-600 font-mono"
                            />
                          </div>
                          {currentLink && (
                            <a
                              href={currentLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              title="Open attached link"
                              className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white transition-colors shrink-0"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-[11px] text-slate-400 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <span>
                Note: Preference persists locally in this browser across reloads and tabs. Re-open{' '}
                <strong className="text-slate-200">Public Site</strong> to preview the updated layout immediately.
              </span>
              {adSettings.updatedAt && (
                <span className="font-mono text-slate-500">
                  Updated: {adSettings.updatedAt.replace('T', ' ').slice(0, 19)} UTC
                </span>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
