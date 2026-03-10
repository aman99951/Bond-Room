import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Search, 
  Filter, 
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
  Inbox
} from 'lucide-react';
import { authApi } from '../../apis/api/authApi';
import { mentorApi } from '../../apis/api/mentorApi';
import {
  clearAuthSession,
  decodeJwtPayload,
  getAuthSession,
  setAuthSession,
} from '../../apis/api/storage';

// Utility functions
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
    return 'bg-[#dcfce7] text-[#166534] ring-1 ring-[#166534]/20';
  if (status === 'rejected')
    return 'bg-[#fee2e2] text-[#b91c1c] ring-1 ring-[#b91c1c]/20';
  if (status === 'in_review')
    return 'bg-[#fef3c7] text-[#92400e] ring-1 ring-[#92400e]/20';
  return 'bg-[#ede9fe] text-[#5b2c91] ring-1 ring-[#5b2c91]/20';
};

const inputClass =
  'mt-1.5 w-full rounded-lg border border-[#d7d0e2] bg-white px-4 py-3 text-sm text-[#111827] placeholder:text-[#9ca3af] focus:outline-none focus:ring-2 focus:ring-[#5b2c91] focus:border-transparent transition-all duration-200';

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

  // Filter & Pagination state
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [sortBy, setSortBy] = useState('newest');

  const isAdmin = session?.role === 'admin';
  const isOtherRoleLoggedIn = Boolean(
    session?.accessToken && session?.role && session?.role !== 'admin'
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

  // Filter and sort mentors
  const filteredAndSortedMentors = useMemo(() => {
    let result = [...mentors];

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (mentor) =>
          mentor.first_name?.toLowerCase().includes(query) ||
          mentor.last_name?.toLowerCase().includes(query) ||
          mentor.email?.toLowerCase().includes(query) ||
          String(mentor.id).includes(query)
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      result = result.filter((mentor) => {
        const status = statusMap[mentor.id]?.current_status || 'pending';
        return status === statusFilter;
      });
    }

    // Sorting
    result.sort((a, b) => {
      if (sortBy === 'newest') {
        return Number(b?.id || 0) - Number(a?.id || 0);
      } else if (sortBy === 'oldest') {
        return Number(a?.id || 0) - Number(b?.id || 0);
      } else if (sortBy === 'name') {
        const nameA = [a.first_name, a.last_name].filter(Boolean).join(' ').toLowerCase();
        const nameB = [b.first_name, b.last_name].filter(Boolean).join(' ').toLowerCase();
        return nameA.localeCompare(nameB);
      }
      return 0;
    });

    return result;
  }, [mentors, searchQuery, statusFilter, statusMap, sortBy]);

  // Pagination
  const totalPages = Math.ceil(filteredAndSortedMentors.length / itemsPerPage);
  const paginatedMentors = filteredAndSortedMentors.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Statistics
  const stats = useMemo(() => {
    const total = mentors.length;
    const pending = mentors.filter((m) => {
      const status = statusMap[m.id]?.current_status || 'pending';
      return status === 'pending' || status === 'in_review';
    }).length;
    const verified = mentors.filter((m) => {
      const status = statusMap[m.id]?.current_status || 'pending';
      return status === 'completed' || status === 'verified';
    }).length;
    const rejected = mentors.filter((m) => {
      const status = statusMap[m.id]?.current_status || 'pending';
      return status === 'rejected';
    }).length;

    return { total, pending, verified, rejected };
  }, [mentors, statusMap]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter, sortBy]);

  if (isOtherRoleLoggedIn) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#f5f0ff] via-[#f9f8ff] to-[#eef2ff] p-6 flex items-center justify-center">
        <div className="w-full max-w-lg rounded-2xl border border-[#e6e2f1] bg-white p-8 shadow-xl animate-fade-in">
          <div className="flex items-center justify-center w-16 h-16 rounded-full bg-[#fee2e2] mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-[#b91c1c]" />
          </div>
          <h1 className="text-2xl font-bold text-[#111827] text-center">Admin Access Required</h1>
          <p className="mt-3 text-sm text-[#6b7280] text-center">
            Please logout and continue with an admin account.
          </p>
          <button
            type="button"
            className="mt-6 w-full rounded-lg bg-gradient-to-r from-[#5b2c91] to-[#4a2374] px-4 py-3 text-sm font-semibold text-white hover:from-[#4a2374] hover:to-[#3a1d5f] transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-[#5b2c91]/25"
            onClick={handleLogout}
          >
            <LogOut className="w-5 h-5" />
            Logout
          </button>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#f5f0ff] via-[#f9f8ff] to-[#eef2ff] p-4 sm:p-6 flex items-center justify-center">
        <div className="w-full max-w-5xl rounded-3xl border border-[#e6e2f1] bg-white shadow-2xl overflow-hidden animate-fade-in-up">
          <div className="grid md:grid-cols-[1fr_1.2fr]">
            {/* Left Panel */}
            <div className="relative bg-gradient-to-br from-[#5b2c91] via-[#4a2374] to-[#3a1d5f] text-white p-8 sm:p-12 overflow-hidden">
              {/* Animated background circles */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl animate-pulse-slow" />
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full blur-2xl animate-pulse-slow" style={{ animationDelay: '1s' }} />
              
              <div className="relative z-10">
                <div className="inline-flex items-center gap-2 rounded-full bg-white/20 backdrop-blur-sm px-4 py-2 text-xs font-semibold animate-fade-in">
                  <span className="w-2 h-2 bg-[#dcfce7] rounded-full animate-pulse" />
                  Admin Portal
                </div>
                <h1 className="mt-6 text-4xl font-bold leading-tight animate-slide-in-left">
                  Mentor Review Console
                </h1>
                <p className="mt-4 text-base text-white/90 animate-slide-in-left" style={{ animationDelay: '0.1s' }}>
                  Review identity documents, training status, and onboarding decisions with our powerful admin dashboard.
                </p>
                
                <div className="mt-8 space-y-3 animate-slide-in-left" style={{ animationDelay: '0.2s' }}>
                  {[
                    { text: 'Verify KYC documents', icon: CheckCircle },
                    { text: 'Track onboarding status', icon: Clock },
                    { text: 'Manage mentor approvals', icon: Users }
                  ].map((feature, idx) => (
                    <div key={idx} className="flex items-center gap-3">
                      <feature.icon className="w-5 h-5 text-[#dcfce7]" />
                      <span className="text-sm">{feature.text}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Panel - Login Form */}
            <div className="p-8 sm:p-12 animate-fade-in" style={{ animationDelay: '0.3s' }}>
              <div className="flex items-center gap-3 mb-8">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#5b2c91] to-[#4a2374] flex items-center justify-center shadow-lg shadow-[#5b2c91]/25">
                  <Lock className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-[#111827]">Sign in</h2>
                  <p className="text-sm text-[#6b7280]">Access your admin account</p>
                </div>
              </div>

              <form className="space-y-5" onSubmit={handleLogin}>
                <div className="space-y-2">
                  <label htmlFor="adminLoginEmail" className="flex items-center gap-2 text-sm font-medium text-[#374151]">
                    <Mail className="w-4 h-4 text-[#6b7280]" />
                    Email Address
                  </label>
                  <input
                    id="adminLoginEmail"
                    type="email"
                    placeholder="admin@example.com"
                    className={inputClass}
                    value={loginForm.email}
                    onChange={(event) =>
                      setLoginForm((prev) => ({ ...prev, email: event.target.value }))
                    }
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="adminLoginPassword" className="flex items-center gap-2 text-sm font-medium text-[#374151]">
                    <Lock className="w-4 h-4 text-[#6b7280]" />
                    Password
                  </label>
                  <input
                    id="adminLoginPassword"
                    type="password"
                    placeholder="Enter your password"
                    className={inputClass}
                    value={loginForm.password}
                    onChange={(event) =>
                      setLoginForm((prev) => ({ ...prev, password: event.target.value }))
                    }
                  />
                </div>

                {authError && (
                  <div className="rounded-lg bg-[#fee2e2] border border-[#fecaca] px-4 py-3 text-sm text-[#b91c1c] flex items-start gap-2 animate-shake">
                    <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                    <span>{authError}</span>
                  </div>
                )}

                <button
                  type="submit"
                  className="w-full rounded-lg bg-gradient-to-r from-[#5b2c91] to-[#4a2374] px-4 py-3.5 text-sm font-semibold text-white hover:from-[#4a2374] hover:to-[#3a1d5f] focus:outline-none focus:ring-4 focus:ring-[#5b2c91]/50 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-[#5b2c91]/25"
                  disabled={authLoading}
                >
                  {authLoading ? (
                    <span className="flex items-center justify-center gap-2">
                      <RefreshCw className="w-5 h-5 animate-spin" />
                      Signing in...
                    </span>
                  ) : (
                    'Sign in to Dashboard'
                  )}
                </button>
              </form>

              <div className="mt-6 pt-6 border-t border-[#e5e7eb]">
                <p className="text-xs text-[#6b7280] text-center">
                  Protected by enterprise-grade security
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f4f2f7] p-4 sm:p-6">
      <div className="mx-auto max-w-[1400px]">
        {/* Header */}
        <div className="rounded-2xl border border-[#e6e2f1] bg-white/80 backdrop-blur-sm p-6 shadow-[0_10px_30px_rgba(91,44,145,0.10)] mb-6 animate-fade-in-down">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#5b2c91] to-[#4a2374] flex items-center justify-center shadow-lg shadow-[#5b2c91]/25">
                <Users className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-[#5b2c91] to-[#4a2374] bg-clip-text text-transparent">
                  Mentor Dashboard
                </h1>
                <p className="text-sm text-[#6b7280] mt-1">
                  Manage and review mentor applications
                </p>
                <button
                  type="button"
                  onClick={() => navigate('/admin/activity')}
                  className="mt-3 inline-flex items-center gap-2 rounded-full border border-[#d8cbef] bg-[#f7f2ff] px-3 py-1.5 text-xs font-semibold text-[#5b2c91] transition-colors hover:bg-[#efe6ff]"
                >
                  Open Activity Analytics
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                className="rounded-lg border border-[#e5e7eb] bg-white px-4 py-2.5 text-sm font-medium text-[#374151] hover:bg-[#f9fafb] transition-all duration-200 flex items-center gap-2 shadow-sm"
                onClick={loadMentorRows}
                disabled={mentorLoading}
              >
                <RefreshCw className={`w-5 h-5 ${mentorLoading ? 'animate-spin' : ''}`} />
                Refresh
              </button>
              <button
                type="button"
                className="rounded-lg border border-[#e5e7eb] bg-white px-4 py-2.5 text-sm font-medium text-[#374151] hover:bg-[#f9fafb] transition-all duration-200 flex items-center gap-2 shadow-sm"
                onClick={handleLogout}
              >
                <LogOut className="w-5 h-5" />
                Logout
              </button>
            </div>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {[
            { label: 'Total Mentors', value: stats.total, color: '[#5b2c91]', bgColor: '[#ede9fe]', icon: Users },
            { label: 'Pending Review', value: stats.pending, color: '[#92400e]', bgColor: '[#fef3c7]', icon: Clock },
            { label: 'Verified', value: stats.verified, color: '[#166534]', bgColor: '[#dcfce7]', icon: CheckCircle },
            { label: 'Rejected', value: stats.rejected, color: '[#b91c1c]', bgColor: '[#fee2e2]', icon: XCircle },
          ].map((stat, idx) => (
            <div
              key={stat.label}
              className="rounded-xl border border-[#e6e2f1] bg-white p-5 shadow-sm hover:shadow-md transition-all duration-300 animate-fade-in-up"
              style={{ animationDelay: `${idx * 0.1}s` }}
            >
              <div className="flex items-center justify-between mb-3">
                <div className={`w-10 h-10 rounded-lg bg-${stat.bgColor} flex items-center justify-center`}>
                  <stat.icon className={`w-5 h-5 text-${stat.color}`} />
                </div>
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full bg-${stat.bgColor} text-${stat.color}`}>
                  Live
                </span>
              </div>
              <div className="text-sm text-[#6b7280] mb-1">{stat.label}</div>
              <div className={`text-3xl font-bold text-${stat.color}`}>{stat.value}</div>
            </div>
          ))}
        </div>

        {/* Filters & Search */}
        <div className="rounded-xl border border-[#e6e2f1] bg-white p-5 shadow-sm mb-6 animate-fade-in">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#9ca3af]">
                <Search className="w-5 h-5" />
              </div>
              <input
                type="text"
                placeholder="Search by name, email, or ID..."
                className="w-full pl-12 pr-4 py-3 rounded-lg border border-[#d7d0e2] focus:outline-none focus:ring-2 focus:ring-[#5b2c91] focus:border-transparent transition-all duration-200"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* Status Filter */}
            <select
              className="px-4 py-3 rounded-lg border border-[#d7d0e2] focus:outline-none focus:ring-2 focus:ring-[#5b2c91] focus:border-transparent transition-all duration-200 bg-white text-[#374151]"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="in_review">In Review</option>
              <option value="verified">Verified</option>
              <option value="completed">Completed</option>
              <option value="rejected">Rejected</option>
            </select>

            {/* Sort */}
            <select
              className="px-4 py-3 rounded-lg border border-[#d7d0e2] focus:outline-none focus:ring-2 focus:ring-[#5b2c91] focus:border-transparent transition-all duration-200 bg-white text-[#374151]"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="name">Name (A-Z)</option>
            </select>

            {/* Items per page */}
            <select
              className="px-4 py-3 rounded-lg border border-[#d7d0e2] focus:outline-none focus:ring-2 focus:ring-[#5b2c91] focus:border-transparent transition-all duration-200 bg-white text-[#374151]"
              value={itemsPerPage}
              onChange={(e) => setItemsPerPage(Number(e.target.value))}
            >
              <option value={5}>5 per page</option>
              <option value={10}>10 per page</option>
              <option value={25}>25 per page</option>
              <option value={50}>50 per page</option>
            </select>
          </div>

          {/* Active filters indicator */}
          {(searchQuery || statusFilter !== 'all') && (
            <div className="mt-4 flex items-center gap-2 flex-wrap">
              <span className="text-sm text-[#6b7280]">Active filters:</span>
              {searchQuery && (
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-[#ede9fe] text-[#5b2c91] text-xs font-medium">
                  Search: {searchQuery}
                  <button onClick={() => setSearchQuery('')} className="hover:text-[#4a2374] ml-1">×</button>
                </span>
              )}
              {statusFilter !== 'all' && (
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-[#ede9fe] text-[#5b2c91] text-xs font-medium">
                  Status: {formatStatusLabel(statusFilter)}
                  <button onClick={() => setStatusFilter('all')} className="hover:text-[#4a2374] ml-1">×</button>
                </span>
              )}
              <button
                onClick={() => {
                  setSearchQuery('');
                  setStatusFilter('all');
                }}
                className="text-xs text-[#5b2c91] hover:text-[#4a2374] font-medium"
              >
                Clear all
              </button>
            </div>
          )}
        </div>

        {/* Table */}
        <div className="rounded-xl border border-[#e5e7eb] bg-white overflow-hidden shadow-sm animate-fade-in">
          {mentorError && (
            <div className="p-4 bg-[#fee2e2] border-b border-[#fecaca] text-sm text-[#b91c1c] flex items-center gap-2">
              <AlertCircle className="w-5 h-5" />
              {mentorError}
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px]">
              <thead className="bg-[#faf8ff] border-b border-[#e6e2f1]">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-[#6b7280] uppercase tracking-wider">
                    Mentor
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-[#6b7280] uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-[#6b7280] uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-[#6b7280] uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-[#6b7280] uppercase tracking-wider">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f1eef7]">
                {paginatedMentors.map((mentor, idx) => {
                  const itemStatus = statusMap[mentor.id]?.current_status || 'pending';
                  return (
                    <tr
                      key={mentor.id}
                      className="hover:bg-[#fcfbff] transition-colors duration-150 animate-fade-in"
                      style={{ animationDelay: `${idx * 0.05}s` }}
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#5b2c91] to-[#4a2374] flex items-center justify-center text-white font-semibold text-sm shadow-md shadow-[#5b2c91]/25">
                            {(mentor.first_name?.[0] || 'M').toUpperCase()}
                          </div>
                          <div>
                            <div className="text-sm font-semibold text-[#111827]">
                              {[mentor.first_name, mentor.last_name].filter(Boolean).join(' ') || 'Mentor'}
                            </div>
                            <div className="text-xs text-[#6b7280]">ID: #{mentor.id}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-[#6b7280]">{mentor.email || 'No email'}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-[#6b7280]">{formatDateTime(mentor.created_at)}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold capitalize ${getStatusChipClass(
                            itemStatus
                          )}`}
                        >
                          {formatStatusLabel(itemStatus)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          type="button"
                          className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-[#5b2c91] to-[#4a2374] px-4 py-2 text-xs font-semibold text-white hover:from-[#4a2374] hover:to-[#3a1d5f] transition-all duration-200 shadow-sm shadow-[#5b2c91]/25 hover:shadow-md transform hover:scale-105"
                          onClick={() => navigate(`/admin/review/${mentor.id}`)}
                        >
                          Review
                          <ArrowRight className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
                {!paginatedMentors.length && !mentorLoading && (
                  <tr>
                    <td className="px-6 py-12 text-center" colSpan={5}>
                      <div className="flex flex-col items-center justify-center text-[#9ca3af]">
                        <Inbox className="w-16 h-16 mb-4 text-[#d1d5db]" />
                        <p className="text-sm font-medium text-[#6b7280]">No mentors found</p>
                        <p className="text-xs text-[#9ca3af] mt-1">Try adjusting your filters</p>
                      </div>
                    </td>
                  </tr>
                )}
                {mentorLoading && (
                  <tr>
                    <td className="px-6 py-12 text-center" colSpan={5}>
                      <div className="flex items-center justify-center gap-3">
                        <RefreshCw className="w-8 h-8 text-[#5b2c91] animate-spin" />
                        <span className="text-sm text-[#6b7280]">Loading mentors...</span>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-6 py-4 border-t border-[#e6e2f1] bg-[#faf8ff]">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="text-sm text-[#6b7280]">
                  Showing <span className="font-semibold text-[#111827]">{(currentPage - 1) * itemsPerPage + 1}</span> to{' '}
                  <span className="font-semibold text-[#111827]">
                    {Math.min(currentPage * itemsPerPage, filteredAndSortedMentors.length)}
                  </span>{' '}
                  of <span className="font-semibold text-[#111827]">{filteredAndSortedMentors.length}</span> results
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="p-2 rounded-lg border border-[#d7d0e2] bg-white hover:bg-[#f9fafb] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>

                  <div className="flex items-center gap-1">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum;
                      if (totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (currentPage <= 3) {
                        pageNum = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                      } else {
                        pageNum = currentPage - 2 + i;
                      }

                      return (
                        <button
                          key={pageNum}
                          onClick={() => setCurrentPage(pageNum)}
                          className={`min-w-[40px] h-10 rounded-lg text-sm font-medium transition-all duration-200 ${
                            currentPage === pageNum
                              ? 'bg-gradient-to-r from-[#5b2c91] to-[#4a2374] text-white shadow-md shadow-[#5b2c91]/25'
                              : 'bg-white border border-[#d7d0e2] text-[#374151] hover:bg-[#f9fafb]'
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
                    className="p-2 rounded-lg border border-[#d7d0e2] bg-white hover:bg-[#f9fafb] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminPortal;
