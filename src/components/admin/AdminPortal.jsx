import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Users,
  Mail,
  Lock,
  AlertCircle,
  CheckCircle,
  Clock,
  XCircle,
  ArrowRight,
  Inbox,
  Shield,
  Eye,
  Settings,
} from 'lucide-react';
import { authApi } from '../../apis/api/authApi';
import { mentorApi } from '../../apis/api/mentorApi';
import { settingsApi } from '../../apis/api/settingsApi';
import {
  clearAuthSession,
  decodeJwtPayload,
  getAuthSession,
  setAuthSession,
} from '../../apis/api/storage';

/* ───────── helpers ───────── */

const normalizeList = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.results)) return payload.results;
  return [];
};

const formatDateTime = (value) => {
  if (!value) return 'Not available';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Not available';
  return date.toLocaleString([], {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const formatStatusLabel = (value) => String(value || 'pending').replace(/_/g, ' ');

const getStatusChipClass = (status) => {
  if (status === 'completed' || status === 'verified')
    return 'bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-500/30';
  if (status === 'rejected')
    return 'bg-rose-500/15 text-rose-400 ring-1 ring-rose-500/30';
  if (status === 'in_review')
    return 'bg-amber-500/15 text-amber-400 ring-1 ring-amber-500/30';
  return 'bg-violet-500/15 text-violet-400 ring-1 ring-violet-500/30';
};

const inputClass =
  'mt-1.5 w-full rounded-xl border border-slate-700 bg-slate-800/60 px-4 py-3 text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500/50 transition-all duration-200';

/* ───────── component ───────── */

const AdminPortal = () => {
  const navigate = useNavigate();
  const [session, setSession] = useState(() => getAuthSession());
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState('');
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });

  const [mentors, setMentors] = useState([]);
  const [statusMap, setStatusMap] = useState({});
  const [mentorLoading, setMentorLoading] = useState(false);
  const [mentorError, setMentorError] = useState('');

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [sortBy, setSortBy] = useState('newest');
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [donateLinkEnabled, setDonateLinkEnabledState] = useState(false);
  const [settingsSaving, setSettingsSaving] = useState(false);
  const [settingsError, setSettingsError] = useState('');

  const isAdmin = session?.role === 'admin';
  const isOtherRoleLoggedIn = Boolean(
    session?.accessToken && session?.role && session?.role !== 'admin',
  );

  const applySession = (tokens, fallbackEmail) => {
    const payload = decodeJwtPayload(tokens?.access);
    const role = payload?.role || '';
    if (role !== 'admin') throw new Error('This account is not an admin account.');
    const nextSession = setAuthSession({
      accessToken: tokens?.access,
      refreshToken: tokens?.refresh,
      role,
      email: payload?.email || fallbackEmail || '',
    });
    setSession(nextSession);
  };

  const loadMentorRows = useCallback(async () => {
    if (!isAdmin) return;
    setMentorLoading(true);
    setMentorError('');
    try {
      const [mentorResponse, onboardingResponse] = await Promise.all([
        mentorApi.getMentors(),
        mentorApi.listOnboardingStatuses(),
      ]);
      const mentorList = normalizeList(mentorResponse);
      const onboardingList = normalizeList(onboardingResponse);
      const nextStatusMap = onboardingList.reduce((acc, item) => {
        acc[item.mentor] = item;
        return acc;
      }, {});
      setMentors(mentorList);
      setStatusMap(nextStatusMap);
    } catch (err) {
      setMentorError(err?.message || 'Unable to load mentors.');
      setMentors([]);
      setStatusMap({});
    } finally {
      setMentorLoading(false);
    }
  }, [isAdmin]);

  useEffect(() => {
    if (!isAdmin) return;
    loadMentorRows();
  }, [isAdmin, loadMentorRows]);

  const handleLogin = async (event) => {
    event.preventDefault();
    setAuthError('');
    if (!loginForm.email.trim() || !loginForm.password) {
      setAuthError('Email and password are required.');
      return;
    }
    setAuthLoading(true);
    try {
      const tokens = await authApi.adminLogin({
        email: loginForm.email.trim().toLowerCase(),
        password: loginForm.password,
      });
      applySession(tokens, loginForm.email.trim().toLowerCase());
      setLoginForm({ email: '', password: '' });
    } catch (err) {
      setAuthError(err?.message || 'Unable to login as admin.');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = () => {
    clearAuthSession();
    setSession(null);
  };

  const loadDonateSetting = useCallback(async () => {
    setSettingsError('');
    try {
      const payload = await settingsApi.getPublicDonateLinkSetting();
      setDonateLinkEnabledState(Boolean(payload?.enabled));
    } catch (err) {
      setDonateLinkEnabledState(false);
      setSettingsError(err?.message || 'Unable to load donate link setting.');
    }
  }, []);

  useEffect(() => {
    if (!isAdmin) return;
    loadDonateSetting();
  }, [isAdmin, loadDonateSetting]);

  const handleToggleDonateLink = async () => {
    if (settingsSaving) return;
    const next = !donateLinkEnabled;
    setSettingsSaving(true);
    setSettingsError('');
    try {
      const payload = await settingsApi.updateAdminDonateLinkSetting(next);
      setDonateLinkEnabledState(Boolean(payload?.enabled));
    } catch (err) {
      setSettingsError(err?.message || 'Unable to update donate link setting.');
    } finally {
      setSettingsSaving(false);
    }
  };

  const filteredAndSortedMentors = useMemo(() => {
    let result = [...mentors];

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (mentor) =>
          mentor.first_name?.toLowerCase().includes(query) ||
          mentor.last_name?.toLowerCase().includes(query) ||
          mentor.email?.toLowerCase().includes(query) ||
          String(mentor.id).includes(query),
      );
    }

    if (statusFilter !== 'all') {
      result = result.filter((mentor) => {
        const status = statusMap[mentor.id]?.current_status || 'pending';
        return status === statusFilter;
      });
    }

    result.sort((a, b) => {
      if (sortBy === 'newest') return Number(b?.id || 0) - Number(a?.id || 0);
      if (sortBy === 'oldest') return Number(a?.id || 0) - Number(b?.id || 0);
      if (sortBy === 'name') {
        const nameA = [a.first_name, a.last_name].filter(Boolean).join(' ').toLowerCase();
        const nameB = [b.first_name, b.last_name].filter(Boolean).join(' ').toLowerCase();
        return nameA.localeCompare(nameB);
      }
      return 0;
    });

    return result;
  }, [mentors, searchQuery, statusFilter, statusMap, sortBy]);

  const totalPages = Math.ceil(filteredAndSortedMentors.length / itemsPerPage);
  const paginatedMentors = filteredAndSortedMentors.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );

  const stats = useMemo(() => {
    const total = mentors.length;
    const pending = mentors.filter((m) => {
      const s = statusMap[m.id]?.current_status || 'pending';
      return s === 'pending' || s === 'in_review';
    }).length;
    const verified = mentors.filter((m) => {
      const s = statusMap[m.id]?.current_status || 'pending';
      return s === 'completed' || s === 'verified';
    }).length;
    const rejected = mentors.filter((m) => {
      const s = statusMap[m.id]?.current_status || 'pending';
      return s === 'rejected';
    }).length;
    return { total, pending, verified, rejected };
  }, [mentors, statusMap]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter, sortBy]);

  /* ───────── other-role gate ───────── */

  if (isOtherRoleLoggedIn) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0b0f1a] p-6">
        <div className="w-full max-w-lg animate-fade-in rounded-2xl border border-slate-800 bg-slate-900/80 p-8 shadow-2xl backdrop-blur-sm">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-rose-500/15 border border-rose-500/30">
            <AlertCircle className="h-8 w-8 text-rose-400" />
          </div>
          <h1 className="text-center text-2xl font-bold text-white">Admin Access Required</h1>
          <p className="mt-3 text-center text-sm text-slate-400">
            Please logout and continue with an admin account.
          </p>
          <button
            type="button"
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-4 py-3 text-sm font-bold text-white shadow-lg shadow-violet-500/25 transition-all hover:from-violet-500 hover:to-indigo-500 hover:shadow-violet-500/40"
            onClick={handleLogout}
          >
            <LogOut className="h-5 w-5" />
            Logout
          </button>
        </div>
      </div>
    );
  }

  /* ───────── login page ───────── */

  if (!isAdmin) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0b0f1a] bg-[radial-gradient(ellipse_80%_60%_at_50%_-20%,_#1e1b4b33,_transparent)] p-4 sm:p-6">
        <div className="w-full max-w-5xl animate-fade-in-up overflow-hidden rounded-3xl border border-slate-800 bg-slate-900/80 shadow-2xl backdrop-blur-sm">
          <div className="grid md:grid-cols-[1fr_1.2fr]">
            {/* Left — branding */}
            <div className="relative overflow-hidden bg-gradient-to-br from-violet-700 via-violet-800 to-indigo-900 p-8 text-white sm:p-12">
              <div className="absolute -right-16 -top-16 h-64 w-64 rounded-full bg-white/5 blur-3xl" />
              <div className="absolute -bottom-12 -left-12 h-48 w-48 rounded-full bg-white/5 blur-2xl" />

              <div className="relative z-10">
                <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-2 text-xs font-bold backdrop-blur-sm">
                  <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
                  Admin Portal
                </div>
                <h1 className="mt-6 text-4xl font-black leading-tight">
                  Mentor Review Console
                </h1>
                <p className="mt-4 text-base leading-relaxed text-white/80">
                  Review identity documents, training status, and onboarding decisions with our
                  powerful admin dashboard.
                </p>

                <div className="mt-8 space-y-3">
                  {[
                    { text: 'Verify KYC documents', Icon: CheckCircle },
                    { text: 'Track onboarding status', Icon: Clock },
                    { text: 'Manage mentor approvals', Icon: Users },
                  ].map(({ text, Icon }) => (
                    <div key={text} className="flex items-center gap-3">
                      <Icon className="h-5 w-5 text-emerald-300" />
                      <span className="text-sm text-white/90">{text}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right — form */}
            <div className="p-8 sm:p-12">
              <div className="mb-8 flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 shadow-lg shadow-violet-500/25">
                  <Lock className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white">Sign in</h2>
                  <p className="text-sm text-slate-400">Access your admin account</p>
                </div>
              </div>

              <form className="space-y-5" onSubmit={handleLogin}>
                <div className="space-y-2">
                  <label
                    htmlFor="adminLoginEmail"
                    className="flex items-center gap-2 text-sm font-medium text-slate-300"
                  >
                    <Mail className="h-4 w-4 text-slate-500" />
                    Email Address
                  </label>
                  <input
                    id="adminLoginEmail"
                    type="email"
                    placeholder="admin@example.com"
                    className={inputClass}
                    value={loginForm.email}
                    onChange={(e) => setLoginForm((p) => ({ ...p, email: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <label
                    htmlFor="adminLoginPassword"
                    className="flex items-center gap-2 text-sm font-medium text-slate-300"
                  >
                    <Lock className="h-4 w-4 text-slate-500" />
                    Password
                  </label>
                  <input
                    id="adminLoginPassword"
                    type="password"
                    placeholder="Enter your password"
                    className={inputClass}
                    value={loginForm.password}
                    onChange={(e) => setLoginForm((p) => ({ ...p, password: e.target.value }))}
                  />
                </div>

                {authError && (
                  <div className="flex items-start gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm font-medium text-rose-400 animate-shake">
                    <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0" />
                    <span>{authError}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={authLoading}
                  className="w-full rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-4 py-3.5 text-sm font-bold text-white shadow-lg shadow-violet-500/25 transition-all hover:from-violet-500 hover:to-indigo-500 hover:shadow-violet-500/40 focus:outline-none focus:ring-4 focus:ring-violet-500/30 disabled:cursor-not-allowed disabled:opacity-50 active:scale-[0.98]"
                >
                  {authLoading ? (
                    <span className="flex items-center justify-center gap-2">
                      <RefreshCw className="h-5 w-5 animate-spin" />
                      Signing in…
                    </span>
                  ) : (
                    'Sign in to Dashboard'
                  )}
                </button>
              </form>

              <div className="mt-6 border-t border-slate-800 pt-6">
                <div className="flex items-center justify-center gap-2 text-xs text-slate-600">
                  <Shield className="h-3.5 w-3.5" />
                  Protected by enterprise-grade security
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ───────── dashboard ───────── */

  return (
    <div className="min-h-screen bg-[#0b0f1a] bg-[radial-gradient(ellipse_80%_60%_at_50%_-20%,_#1e1b4b33,_transparent)] p-3 sm:p-6">
      <div className="mx-auto max-w-[1440px]">
        {/* ── header ── */}
        <div className="mb-6 rounded-2xl border border-slate-800 bg-slate-900/80 p-6 shadow-2xl backdrop-blur-sm animate-fade-in-down">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-600 shadow-lg shadow-violet-500/25">
                <Users className="h-7 w-7 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-black tracking-tight text-white">Mentor Dashboard</h1>
                <p className="mt-1 text-sm text-slate-400">
                  Manage and review mentor applications
                </p>
                <button
                  type="button"
                  onClick={() => navigate('/admin/activity')}
                  className="mt-3 inline-flex items-center gap-2 rounded-full border border-violet-500/30 bg-violet-500/10 px-3.5 py-1.5 text-xs font-bold text-violet-400 transition-colors hover:border-violet-400/50 hover:bg-violet-500/20"
                >
                  Open Activity Analytics
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setSettingsOpen(true)}
                className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-800/60 px-4 py-2.5 text-sm font-semibold text-slate-300 shadow-sm transition-all hover:border-slate-600 hover:bg-slate-800 hover:text-white"
              >
                <Settings className="h-4 w-4" />
                Settings
              </button>
              <button
                type="button"
                onClick={loadMentorRows}
                disabled={mentorLoading}
                className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-800/60 px-4 py-2.5 text-sm font-semibold text-slate-300 shadow-sm transition-all hover:border-slate-600 hover:bg-slate-800 hover:text-white"
              >
                <RefreshCw className={`h-4 w-4 ${mentorLoading ? 'animate-spin' : ''}`} />
                Refresh
              </button>
              <button
                type="button"
                onClick={handleLogout}
                className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-800/60 px-4 py-2.5 text-sm font-semibold text-slate-300 shadow-sm transition-all hover:border-rose-500/40 hover:bg-rose-500/10 hover:text-rose-400"
              >
                <LogOut className="h-4 w-4" />
                Logout
              </button>
            </div>
          </div>
        </div>

        {/* ── stat cards ── */}
        <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
          {[
            {
              label: 'Total Mentors',
              value: stats.total,
              accent: 'from-violet-400 to-purple-400',
              iconBg: 'bg-violet-500/15 border-violet-500/30',
              Icon: Users,
            },
            {
              label: 'Pending Review',
              value: stats.pending,
              accent: 'from-amber-400 to-orange-400',
              iconBg: 'bg-amber-500/15 border-amber-500/30',
              Icon: Clock,
            },
            {
              label: 'Verified',
              value: stats.verified,
              accent: 'from-emerald-400 to-teal-400',
              iconBg: 'bg-emerald-500/15 border-emerald-500/30',
              Icon: CheckCircle,
            },
            {
              label: 'Rejected',
              value: stats.rejected,
              accent: 'from-rose-400 to-pink-400',
              iconBg: 'bg-rose-500/15 border-rose-500/30',
              Icon: XCircle,
            },
          ].map((card, idx) => (
            <div
              key={card.label}
              className="group relative overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/60 p-5 transition-all hover:-translate-y-0.5 hover:border-slate-700 hover:shadow-xl hover:shadow-black/30 animate-fade-in-up"
              style={{ animationDelay: `${idx * 0.1}s` }}
            >
              {/* glow */}
              <div
                className={`absolute -right-4 -top-4 h-24 w-24 rounded-full bg-gradient-to-br ${card.accent} opacity-10 blur-2xl transition-opacity group-hover:opacity-20`}
              />

              <div className="relative">
                <div className="mb-3 flex items-center justify-between">
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-xl border ${card.iconBg}`}
                  >
                    <card.Icon className="h-5 w-5 text-slate-300" />
                  </div>
                  <span className="rounded-full bg-slate-800 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-slate-500">
                    Live
                  </span>
                </div>
                <p className="text-sm text-slate-400">{card.label}</p>
                <p
                  className={`mt-1 bg-gradient-to-r ${card.accent} bg-clip-text text-4xl font-black text-transparent`}
                >
                  {card.value}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* ── filters ── */}
        <div className="mb-6 rounded-2xl border border-slate-800 bg-slate-900/60 p-5 animate-fade-in">
          <div className="flex flex-col gap-4 lg:flex-row">
            {/* search */}
            <div className="relative flex-1">
              <div className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">
                <Search className="h-5 w-5" />
              </div>
              <input
                type="text"
                placeholder="Search by name, email, or ID…"
                className="w-full rounded-xl border border-slate-700 bg-slate-800/60 py-3 pl-12 pr-4 text-sm text-slate-200 placeholder:text-slate-500 transition-all focus:border-violet-500/50 focus:outline-none focus:ring-2 focus:ring-violet-500/30"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* selects */}
            {[
              {
                value: statusFilter,
                setter: setStatusFilter,
                options: [
                  ['all', 'All Status'],
                  ['pending', 'Pending'],
                  ['in_review', 'In Review'],
                  ['verified', 'Verified'],
                  ['completed', 'Completed'],
                  ['rejected', 'Rejected'],
                ],
              },
              {
                value: sortBy,
                setter: setSortBy,
                options: [
                  ['newest', 'Newest First'],
                  ['oldest', 'Oldest First'],
                  ['name', 'Name (A-Z)'],
                ],
              },
              {
                value: itemsPerPage,
                setter: (v) => setItemsPerPage(Number(v)),
                options: [
                  [5, '5 per page'],
                  [10, '10 per page'],
                  [25, '25 per page'],
                  [50, '50 per page'],
                ],
              },
            ].map((sel, i) => (
              <select
                key={i}
                className="rounded-xl border border-slate-700 bg-slate-800/60 px-4 py-3 text-sm text-slate-300 transition-all focus:border-violet-500/50 focus:outline-none focus:ring-2 focus:ring-violet-500/30"
                value={sel.value}
                onChange={(e) => sel.setter(e.target.value)}
              >
                {sel.options.map(([val, label]) => (
                  <option key={val} value={val}>
                    {label}
                  </option>
                ))}
              </select>
            ))}
          </div>

          {/* active filters */}
          {(searchQuery || statusFilter !== 'all') && (
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <span className="text-sm text-slate-500">Active filters:</span>

              {searchQuery && (
                <span className="inline-flex items-center gap-1 rounded-full bg-violet-500/15 px-3 py-1 text-xs font-medium text-violet-400">
                  Search: {searchQuery}
                  <button
                    onClick={() => setSearchQuery('')}
                    className="ml-1 hover:text-violet-300"
                  >
                    ×
                  </button>
                </span>
              )}

              {statusFilter !== 'all' && (
                <span className="inline-flex items-center gap-1 rounded-full bg-violet-500/15 px-3 py-1 text-xs font-medium text-violet-400">
                  Status: {formatStatusLabel(statusFilter)}
                  <button
                    onClick={() => setStatusFilter('all')}
                    className="ml-1 hover:text-violet-300"
                  >
                    ×
                  </button>
                </span>
              )}

              <button
                onClick={() => {
                  setSearchQuery('');
                  setStatusFilter('all');
                }}
                className="text-xs font-semibold text-violet-500 hover:text-violet-400"
              >
                Clear all
              </button>
            </div>
          )}
        </div>

        {/* ── table ── */}
        <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/60 shadow-xl animate-fade-in">
          {/* error banner */}
          {mentorError && (
            <div className="flex items-center gap-2 border-b border-rose-500/20 bg-rose-500/10 px-5 py-3 text-sm font-medium text-rose-400">
              <AlertCircle className="h-5 w-5" />
              {mentorError}
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="w-full min-w-[920px]">
              <thead className="border-b border-slate-800 bg-slate-800/40">
                <tr>
                  {['Mentor', 'Email', 'Created', 'Status', 'Action'].map((h, i) => (
                    <th
                      key={h}
                      className={`px-6 py-4 text-[11px] font-bold uppercase tracking-widest text-slate-500 ${
                        i === 4 ? 'text-right' : 'text-left'
                      }`}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-800/60">
                {paginatedMentors.map((mentor, idx) => {
                  const itemStatus = statusMap[mentor.id]?.current_status || 'pending';
                  return (
                    <tr
                      key={mentor.id}
                      className="transition-colors hover:bg-slate-800/40 animate-fade-in"
                      style={{ animationDelay: `${idx * 0.04}s` }}
                    >
                      {/* name + avatar */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-violet-600 to-indigo-600 text-sm font-bold text-white shadow-md shadow-violet-500/20">
                            {(mentor.first_name?.[0] || 'M').toUpperCase()}
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-white">
                              {[mentor.first_name, mentor.last_name].filter(Boolean).join(' ') ||
                                'Mentor'}
                            </p>
                            <p className="text-xs text-slate-500">ID: #{mentor.id}</p>
                          </div>
                        </div>
                      </td>

                      {/* email */}
                      <td className="px-6 py-4 text-sm text-slate-400">
                        {mentor.email || 'No email'}
                      </td>

                      {/* created */}
                      <td className="px-6 py-4 text-sm text-slate-500">
                        {formatDateTime(mentor.created_at)}
                      </td>

                      {/* status */}
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold capitalize ${getStatusChipClass(
                            itemStatus,
                          )}`}
                        >
                          {formatStatusLabel(itemStatus)}
                        </span>
                      </td>

                      {/* action */}
                      <td className="px-6 py-4 text-right">
                        <button
                          type="button"
                          onClick={() => navigate(`/admin/review/${mentor.id}`)}
                          className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-md shadow-violet-500/20 transition-all hover:from-violet-500 hover:to-indigo-500 hover:shadow-violet-500/30 active:scale-95"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          Review
                        </button>
                      </td>
                    </tr>
                  );
                })}

                {/* empty */}
                {!paginatedMentors.length && !mentorLoading && (
                  <tr>
                    <td colSpan={5} className="px-6 py-16 text-center">
                      <div className="flex flex-col items-center text-slate-600">
                        <Inbox className="mb-4 h-16 w-16 text-slate-700" />
                        <p className="text-sm font-semibold text-slate-400">No mentors found</p>
                        <p className="mt-1 text-xs text-slate-600">Try adjusting your filters</p>
                      </div>
                    </td>
                  </tr>
                )}

                {/* loading */}
                {mentorLoading && (
                  <tr>
                    <td colSpan={5} className="px-6 py-16 text-center">
                      <div className="flex items-center justify-center gap-3">
                        <RefreshCw className="h-8 w-8 animate-spin text-violet-500" />
                        <span className="text-sm text-slate-400">Loading mentors…</span>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* ── pagination ── */}
          {totalPages > 1 && (
            <div className="border-t border-slate-800 bg-slate-800/30 px-6 py-4">
              <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
                <p className="text-sm text-slate-500">
                  Showing{' '}
                  <span className="font-bold text-slate-300">
                    {(currentPage - 1) * itemsPerPage + 1}
                  </span>{' '}
                  to{' '}
                  <span className="font-bold text-slate-300">
                    {Math.min(currentPage * itemsPerPage, filteredAndSortedMentors.length)}
                  </span>{' '}
                  of{' '}
                  <span className="font-bold text-slate-300">
                    {filteredAndSortedMentors.length}
                  </span>{' '}
                  results
                </p>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="rounded-lg border border-slate-700 bg-slate-800 p-2 text-slate-400 transition-all hover:border-slate-600 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>

                  <div className="flex items-center gap-1">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum;
                      if (totalPages <= 5) pageNum = i + 1;
                      else if (currentPage <= 3) pageNum = i + 1;
                      else if (currentPage >= totalPages - 2) pageNum = totalPages - 4 + i;
                      else pageNum = currentPage - 2 + i;

                      return (
                        <button
                          key={pageNum}
                          onClick={() => setCurrentPage(pageNum)}
                          className={`min-w-[40px] rounded-lg py-2 text-sm font-bold transition-all ${
                            currentPage === pageNum
                              ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-md shadow-violet-500/25'
                              : 'border border-slate-700 bg-slate-800 text-slate-400 hover:border-slate-600 hover:text-white'
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                  </div>

                  <button
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="rounded-lg border border-slate-700 bg-slate-800 p-2 text-slate-400 transition-all hover:border-slate-600 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {settingsOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/55 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-lg font-bold text-white">Portal Settings</h3>
                <p className="mt-1 text-sm text-slate-400">Control public landing page links.</p>
              </div>
              <button
                type="button"
                onClick={() => setSettingsOpen(false)}
                className="rounded-lg border border-slate-700 bg-slate-800 px-2 py-1 text-xs text-slate-300 hover:bg-slate-700"
              >
                Close
              </button>
            </div>

            <div className="mt-5 rounded-xl border border-slate-700 bg-slate-800/60 p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-slate-200">Enable Donate Link</p>
                  <p className="mt-1 text-xs text-slate-400">
                    Show or hide Donate in landing page topbar.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleToggleDonateLink}
                  disabled={settingsSaving}
                  className={`inline-flex h-7 w-14 items-center rounded-full p-1 transition-colors ${
                    donateLinkEnabled ? 'bg-emerald-500' : 'bg-slate-600'
                  }`}
                  aria-label="Toggle donate link visibility"
                >
                  <span
                    className={`h-5 w-5 rounded-full bg-white transition-transform ${
                      donateLinkEnabled ? 'translate-x-7' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
              <p className={`mt-3 text-xs font-semibold ${donateLinkEnabled ? 'text-emerald-400' : 'text-slate-400'}`}>
                Current status: {donateLinkEnabled ? 'Enabled' : 'Disabled'}
              </p>
              {settingsError ? (
                <p className="mt-2 text-xs font-semibold text-rose-400">{settingsError}</p>
              ) : null}
            </div>
          </div>
        </div>
      )}

      {/* ── animations ── */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeInDown {
          from { opacity: 0; transform: translateY(-16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes slideInLeft {
          from { opacity: 0; transform: translateX(-24px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20%, 60% { transform: translateX(-6px); }
          40%, 80% { transform: translateX(6px); }
        }
        .animate-fade-in       { animation: fadeIn .4s ease-out both; }
        .animate-fade-in-up    { animation: fadeInUp .5s ease-out both; }
        .animate-fade-in-down  { animation: fadeInDown .5s ease-out both; }
        .animate-slide-in-left { animation: slideInLeft .5s ease-out both; }
        .animate-shake         { animation: shake .4s ease-in-out; }
      `}</style>
    </div>
  );
};

export default AdminPortal;
