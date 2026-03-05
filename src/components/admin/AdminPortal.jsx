import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Calendar, Eye, FileImage, FileText, X } from 'lucide-react';
import { authApi } from '../../apis/api/authApi';
import { mentorApi } from '../../apis/api/mentorApi';
import {
  clearAuthSession,
  decodeJwtPayload,
  getAuthSession,
  setAuthSession,
} from '../../apis/api/storage';

const normalizeList = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.results)) return payload.results;
  return [];
};

const formatDateTime = (value) => {
  if (!value) return 'Not available';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Not available';
  return date.toLocaleString([], { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
};

const resolveMediaUrl = (value) => {
  if (!value) return '';
  if (/^https?:\/\//i.test(value)) return value;
  const apiBase = (import.meta.env.VITE_API_BASE_URL || '/api').replace(/\/+$/, '');
  const base = apiBase.endsWith('/api') ? apiBase.slice(0, -4) : apiBase;
  if (value.startsWith('/')) {
    return `${base}${value}`;
  }
  return value;
};

const resolveDocumentKind = (url) => {
  if (!url) return 'unknown';
  const lowered = String(url).toLowerCase();
  if (/\.pdf($|\?)/i.test(lowered)) return 'pdf';
  if (/\.(png|jpe?g|gif|webp|bmp|svg)($|\?)/i.test(lowered)) return 'image';
  if (lowered.includes('res.cloudinary.com')) {
    if (lowered.includes('/image/upload/')) return 'image';
    if (lowered.includes('/raw/upload/')) return 'pdf';
  }
  return 'unknown';
};

const getDocumentName = (url) => {
  if (!url) return '';
  const normalized = String(url).split('?')[0];
  const parts = normalized.split('/');
  return parts[parts.length - 1] || 'document';
};

const toOnboardingIdentityStatus = (identityDecision) => {
  if (identityDecision === 'verified') return 'completed';
  if (identityDecision === 'rejected') return 'rejected';
  if (identityDecision === 'in_review') return 'in_review';
  return 'pending';
};

const computeCurrentStatus = ({
  applicationStatus,
  identityStatus,
  contactStatus,
  trainingStatus,
  finalApprovalStatus,
}) => {
  const statuses = [applicationStatus, identityStatus, contactStatus, trainingStatus, finalApprovalStatus];
  if (statuses.some((item) => item === 'rejected')) return 'rejected';
  if (statuses.every((item) => item === 'completed')) return 'completed';
  if (statuses.every((item) => item === 'pending')) return 'pending';
  return 'in_review';
};

const onboardingStatusOptions = [
  { value: 'pending', label: 'Pending' },
  { value: 'in_review', label: 'In Review' },
  { value: 'completed', label: 'Completed' },
  { value: 'rejected', label: 'Rejected' },
];

const identityStatusOptions = [
  { value: 'pending', label: 'Pending' },
  { value: 'in_review', label: 'In Review' },
  { value: 'verified', label: 'Verified' },
  { value: 'rejected', label: 'Rejected' },
];

const formatStatusLabel = (value) => String(value || 'pending').replace(/_/g, ' ');

const getStatusChipClass = (status) => {
  if (status === 'completed' || status === 'verified') return 'bg-[#dcfce7] text-[#166534]';
  if (status === 'rejected') return 'bg-[#fee2e2] text-[#b91c1c]';
  if (status === 'in_review') return 'bg-[#fef3c7] text-[#92400e]';
  return 'bg-[#ede9fe] text-[#5b2c91]';
};

const inputClass =
  'mt-1 w-full rounded-md border border-[#d7d0e2] bg-white px-3 py-2.5 text-sm text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#5b2c91] focus:border-transparent';

const AdminPortal = () => {
  const [session, setSession] = useState(() => getAuthSession());
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState('');
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });

  const [mentors, setMentors] = useState([]);
  const [statusMap, setStatusMap] = useState({});
  const [mentorLoading, setMentorLoading] = useState(false);
  const [mentorError, setMentorError] = useState('');
  const [selectedMentorId, setSelectedMentorId] = useState(null);
  const [selectedMentor, setSelectedMentor] = useState(null);
  const [selectedOnboarding, setSelectedOnboarding] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [detailsError, setDetailsError] = useState('');
  const [decisionLoading, setDecisionLoading] = useState(false);
  const [decisionError, setDecisionError] = useState('');
  const [decisionSuccess, setDecisionSuccess] = useState('');
  const [decisionForm, setDecisionForm] = useState({
    identityDecision: 'pending',
    trainingStatus: 'pending',
    finalApprovalStatus: 'pending',
    reviewerNotes: '',
    finalRejectionReason: '',
  });
  const [documentViewer, setDocumentViewer] = useState({
    open: false,
    title: '',
    url: '',
    kind: 'unknown',
  });

  const isAdmin = session?.role === 'admin';
  const isOtherRoleLoggedIn = Boolean(session?.accessToken && session?.role && session?.role !== 'admin');

  const applySession = (tokens, fallbackEmail) => {
    const payload = decodeJwtPayload(tokens?.access);
    const role = payload?.role || '';
    if (role !== 'admin') {
      throw new Error('This account is not an admin account.');
    }
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

  const loadMentorDetails = useCallback(async (mentorId) => {
    if (!mentorId || !isAdmin) return;
    setDetailsLoading(true);
    setDetailsError('');
    setDecisionError('');
    setDecisionSuccess('');
    try {
      const [mentorResponse, onboardingResponse] = await Promise.all([
        mentorApi.getMentorById(mentorId),
        mentorApi.getMentorOnboarding(mentorId),
      ]);
      const onboardingStatus = onboardingResponse?.status || {};
      const identityVerification = onboardingResponse?.identity_verification || null;
      setSelectedMentor(mentorResponse || null);
      setSelectedOnboarding(onboardingResponse || null);
      setDecisionForm({
        identityDecision: identityVerification?.status || 'pending',
        trainingStatus: onboardingStatus?.training_status || 'pending',
        finalApprovalStatus: onboardingStatus?.final_approval_status || 'pending',
        reviewerNotes: identityVerification?.reviewer_notes || '',
        finalRejectionReason: onboardingStatus?.final_rejection_reason || '',
      });
    } catch (err) {
      setDetailsError(err?.message || 'Unable to load mentor onboarding details.');
      setSelectedMentor(null);
      setSelectedOnboarding(null);
    } finally {
      setDetailsLoading(false);
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
    setSelectedMentorId(null);
    setSelectedMentor(null);
    setSelectedOnboarding(null);
    setDocumentViewer({ open: false, title: '', url: '', kind: 'unknown' });
  };

  const openDocumentViewer = async (title, url) => {
    const resolvedUrl = resolveMediaUrl(url);
    if (!resolvedUrl) return;
    const initialKind = resolveDocumentKind(resolvedUrl);
    setDocumentViewer({
      open: true,
      title,
      url: resolvedUrl,
      kind: initialKind,
    });
    if (initialKind !== 'unknown') return;
    try {
      let credentials = 'include';
      try {
        const targetOrigin = new URL(resolvedUrl, window.location.href).origin;
        credentials = targetOrigin === window.location.origin ? 'include' : 'omit';
      } catch {
        credentials = 'omit';
      }
      const response = await fetch(resolvedUrl, { method: 'HEAD', credentials });
      if (response.type === 'opaque') return;
      const contentType = response.headers.get('content-type') || '';
      let inferredKind = 'unknown';
      if (contentType.startsWith('image/')) inferredKind = 'image';
      if (contentType === 'application/pdf') inferredKind = 'pdf';
      if (inferredKind !== 'unknown') {
        setDocumentViewer((prev) =>
          prev.open && prev.url === resolvedUrl ? { ...prev, kind: inferredKind } : prev
        );
      }
    } catch {
      // Keep the viewer open with the fallback message.
    }
  };

  const closeDocumentViewer = () => {
    setDocumentViewer({ open: false, title: '', url: '', kind: 'unknown' });
  };

  const handleSaveDecision = async () => {
    if (!selectedMentor?.id) {
      setDecisionError('Please select a mentor first.');
      return;
    }
    if (!selectedOnboarding?.status?.id) {
      setDecisionError('Onboarding status record is missing.');
      return;
    }
    if (
      decisionForm.finalApprovalStatus === 'rejected' &&
      !decisionForm.finalRejectionReason.trim()
    ) {
      setDecisionError('Please add reject reason for final approval rejection.');
      return;
    }
    setDecisionLoading(true);
    setDecisionError('');
    setDecisionSuccess('');
    try {
      await mentorApi.submitAdminOnboardingDecision(selectedMentor.id, {
        identity_decision: decisionForm.identityDecision,
        training_status: decisionForm.trainingStatus,
        final_approval_status: decisionForm.finalApprovalStatus,
        reviewer_notes: decisionForm.reviewerNotes,
        final_rejection_reason: decisionForm.finalRejectionReason.trim(),
      });

      const onboardingStatus = selectedOnboarding?.status || {};
      const nextCurrentStatus = computeCurrentStatus({
        applicationStatus: onboardingStatus.application_status || 'completed',
        identityStatus: toOnboardingIdentityStatus(decisionForm.identityDecision),
        contactStatus: onboardingStatus.contact_status || 'pending',
        trainingStatus: decisionForm.trainingStatus,
        finalApprovalStatus: decisionForm.finalApprovalStatus,
      });

      setDecisionSuccess(
        `Decision saved successfully. Current onboarding status: ${nextCurrentStatus}.`
      );
      await Promise.all([loadMentorRows(), loadMentorDetails(selectedMentor.id)]);
    } catch (err) {
      setDecisionError(err?.message || 'Unable to save admin decision.');
    } finally {
      setDecisionLoading(false);
    }
  };

  const sortedMentors = useMemo(() => {
    return [...mentors].sort((a, b) => {
      const aCreated = a?.created_at ? new Date(a.created_at).getTime() : 0;
      const bCreated = b?.created_at ? new Date(b.created_at).getTime() : 0;
      if (aCreated !== bCreated) return bCreated - aCreated;
      return Number(b?.id || 0) - Number(a?.id || 0);
    });
  }, [mentors]);

  if (isOtherRoleLoggedIn) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#f5f0ff] via-[#f9f8ff] to-[#eef2ff] p-6 flex items-center justify-center">
        <div className="w-full max-w-lg rounded-2xl border border-[#e6e2f1] bg-white p-6 shadow-[0_12px_30px_rgba(91,44,145,0.12)]">
          <h1 className="text-xl font-semibold text-[#111827]">Admin Access Required</h1>
          <p className="mt-2 text-sm text-[#6b7280]">
            You are logged in as <span className="font-semibold text-[#111827]">{session.role}</span>. Please logout and continue with an admin account.
          </p>
          <button
            type="button"
            className="mt-5 rounded-md bg-[#5b2c91] px-4 py-2 text-sm text-white hover:bg-[#4a2374]"
            onClick={handleLogout}
          >
            Logout and continue
          </button>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#f5f0ff] via-[#f9f8ff] to-[#eef2ff] p-4 sm:p-6">
        <div className="mx-auto max-w-5xl rounded-2xl border border-[#e6e2f1] bg-white shadow-[0_16px_40px_rgba(91,44,145,0.12)] overflow-hidden">
          <div className="grid md:grid-cols-[1fr_1.2fr]">
            <div className="bg-gradient-to-br from-[#5b2c91] via-[#6d35ad] to-[#4a2374] text-white p-7 sm:p-8">
              <div className="inline-flex items-center rounded-full bg-white/20 px-3 py-1 text-xs font-semibold">Admin Portal</div>
              <h1 className="mt-5 text-3xl font-bold leading-tight">Mentor Onboarding Control</h1>
              <p className="mt-3 text-sm text-white/90">
                Verify identity documents, review training completion, and publish final decisions.
              </p>
              <div className="mt-8 space-y-3 text-sm">
                <div className="rounded-lg border border-white/20 bg-white/10 px-3 py-2">Identity Verification</div>
                <div className="rounded-lg border border-white/20 bg-white/10 px-3 py-2">Training Review</div>
                <div className="rounded-lg border border-white/20 bg-white/10 px-3 py-2">Final Approval</div>
              </div>
            </div>

            <div className="p-6 sm:p-8">
              <h2 className="mt-5 text-2xl font-semibold text-[#111827]">
                Welcome back, Admin
              </h2>
              <p className="mt-1 text-sm text-[#6b7280]">
                Sign in to manage mentor onboarding decisions.
              </p>
              <p className="mt-2 text-xs text-[#6b7280]">
                Admin registration is managed through Django superadmin.
              </p>

              <form className="mt-6 space-y-4" onSubmit={handleLogin}>
                <div>
                  <label htmlFor="adminLoginEmail" className="text-xs text-[#6b7280]">Email</label>
                  <input
                    id="adminLoginEmail"
                    type="email"
                    className={inputClass}
                    value={loginForm.email}
                    onChange={(event) => setLoginForm((prev) => ({ ...prev, email: event.target.value }))}
                    placeholder="admin@example.com"
                  />
                </div>
                <div>
                  <label htmlFor="adminLoginPassword" className="text-xs text-[#6b7280]">Password</label>
                  <input
                    id="adminLoginPassword"
                    type="password"
                    className={inputClass}
                    value={loginForm.password}
                    onChange={(event) => setLoginForm((prev) => ({ ...prev, password: event.target.value }))}
                    placeholder="********"
                  />
                </div>
                {authError && <div className="text-xs text-red-600">{authError}</div>}
                <button
                  type="submit"
                  className="w-full rounded-md bg-[#5b2c91] px-4 py-2.5 text-sm text-white hover:bg-[#4a2374] disabled:opacity-70"
                  disabled={authLoading}
                >
                  {authLoading ? 'Signing in...' : 'Login'}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const pendingCount = sortedMentors.filter((mentor) => {
    const status = statusMap[mentor.id]?.current_status || 'pending';
    return status === 'pending' || status === 'in_review';
  }).length;
  const completedCount = sortedMentors.filter(
    (mentor) => (statusMap[mentor.id]?.current_status || 'pending') === 'completed'
  ).length;
  const rejectedCount = sortedMentors.filter(
    (mentor) => (statusMap[mentor.id]?.current_status || 'pending') === 'rejected'
  ).length;

  return (
    <div className="min-h-screen bg-[#f4f2f7] p-4 sm:p-6">
      <div className="mx-auto max-w-[1280px]">
        <div className="rounded-2xl border border-[#e6e2f1] bg-white p-5 sm:p-6 shadow-[0_10px_30px_rgba(91,44,145,0.10)]">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h1 className="text-[#111827]" style={{ fontSize: '30px', lineHeight: '36px', fontWeight: 700 }}>
                Admin Onboarding Dashboard
              </h1>
              <p className="mt-1 text-sm text-[#6b7280]">
                Review mentor identity documents, training status, and final approval.
              </p>
            </div>
            <button
              type="button"
              className="rounded-md border border-[#e5e7eb] bg-white px-4 py-2 text-sm text-[#6b7280] hover:text-[#111827]"
              onClick={handleLogout}
            >
              Logout
            </button>
          </div>
          <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="rounded-lg border border-[#ede9fe] bg-[#faf8ff] px-3 py-2">
              <div className="text-[11px] text-[#6b7280]">Total Mentors</div>
              <div className="text-lg font-semibold text-[#111827]">{sortedMentors.length}</div>
            </div>
            <div className="rounded-lg border border-[#fef3c7] bg-[#fffbeb] px-3 py-2">
              <div className="text-[11px] text-[#6b7280]">Pending / Review</div>
              <div className="text-lg font-semibold text-[#92400e]">{pendingCount}</div>
            </div>
            <div className="rounded-lg border border-[#dcfce7] bg-[#f0fdf4] px-3 py-2">
              <div className="text-[11px] text-[#6b7280]">Completed</div>
              <div className="text-lg font-semibold text-[#166534]">{completedCount}</div>
            </div>
            <div className="rounded-lg border border-[#fee2e2] bg-[#fff1f2] px-3 py-2">
              <div className="text-[11px] text-[#6b7280]">Rejected</div>
              <div className="text-lg font-semibold text-[#b91c1c]">{rejectedCount}</div>
            </div>
          </div>
        </div>

        <div className="mt-5 grid gap-4 lg:grid-cols-[360px_1fr]">
          <div className="rounded-xl border border-[#e5e7eb] bg-white p-4 shadow-[0px_1px_2px_0px_rgba(0,0,0,0.08)]">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-[#111827]">Mentor Queue</h2>
              <button
                type="button"
                className="text-xs text-[#5b2c91] underline"
                onClick={loadMentorRows}
                disabled={mentorLoading}
              >
                {mentorLoading ? 'Refreshing...' : 'Refresh'}
              </button>
            </div>
            {mentorError && <div className="mt-2 text-xs text-red-600">{mentorError}</div>}
            <div className="mt-3 max-h-[620px] overflow-y-auto space-y-2 pr-1">
              {sortedMentors.map((mentor) => {
                const itemStatus = statusMap[mentor.id]?.current_status || 'pending';
                const isActive = selectedMentorId === mentor.id;
                return (
                  <button
                    type="button"
                    key={mentor.id}
                    onClick={async () => {
                      setSelectedMentorId(mentor.id);
                      await loadMentorDetails(mentor.id);
                    }}
                    className={`w-full rounded-lg border px-3 py-2.5 text-left transition-all ${
                      isActive
                        ? 'border-[#5b2c91] bg-[#f5f0ff]'
                        : 'border-[#e5e7eb] bg-white hover:border-[#c4b5fd]'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="text-sm font-semibold text-[#111827] truncate">
                          #{mentor.id} - {[mentor.first_name, mentor.last_name].filter(Boolean).join(' ') || 'Mentor'}
                        </div>
                        <div className="text-xs text-[#6b7280] truncate">{mentor.email || 'No email'}</div>
                      </div>
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize ${getStatusChipClass(itemStatus)}`}>
                        {formatStatusLabel(itemStatus)}
                      </span>
                    </div>
                  </button>
                );
              })}
              {!sortedMentors.length && !mentorLoading && (
                <div className="rounded-lg border border-[#e5e7eb] p-3 text-xs text-[#6b7280]">
                  No mentors found.
                </div>
              )}
            </div>
          </div>

          <div className="rounded-xl border border-[#e5e7eb] bg-white p-4 sm:p-5 shadow-[0px_1px_2px_0px_rgba(0,0,0,0.08)]">
            {!selectedMentorId && (
              <div className="h-full min-h-[300px] flex items-center justify-center text-sm text-[#6b7280]">
                Select a mentor from the left list to review onboarding.
              </div>
            )}

            {selectedMentorId && detailsLoading && (
              <div className="text-sm text-[#6b7280]">Loading mentor details...</div>
            )}

            {selectedMentorId && !detailsLoading && detailsError && (
              <div className="text-sm text-red-600">{detailsError}</div>
            )}

            {selectedMentorId && !detailsLoading && !detailsError && selectedMentor && selectedOnboarding && (
              <div>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div>
                    <h2 className="text-lg font-semibold text-[#111827]">
                      {[selectedMentor.first_name, selectedMentor.last_name].filter(Boolean).join(' ') || `Mentor #${selectedMentor.id}`}
                    </h2>
                    <p className="text-xs text-[#6b7280]">
                      Mentor ID: {selectedMentor.id} &bull; {selectedMentor.email || 'No email'}
                    </p>
                  </div>
                  <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium capitalize ${getStatusChipClass(selectedOnboarding?.status?.current_status)}`}>
                    Current: {formatStatusLabel(selectedOnboarding?.status?.current_status)}
                  </span>
                </div>

                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  <div className="rounded-xl border border-[#ded3f2] bg-gradient-to-br from-[#faf8ff] to-[#f4efff] p-4 shadow-[0_10px_24px_rgba(91,44,145,0.08)]">
                    <div className="flex items-center justify-between gap-2">
                      <div className="text-xs font-semibold tracking-wide uppercase text-[#5b2c91]">Identity Documents</div>
                      <div className="inline-flex items-center gap-1.5 rounded-full border border-[#e1d8f3] bg-white px-2.5 py-1 text-[10px] text-[#6b7280]">
                        <Calendar className="h-3.5 w-3.5 text-[#5b2c91]" aria-hidden="true" />
                        <span>{formatDateTime(selectedOnboarding?.identity_verification?.submitted_at)}</span>
                      </div>
                    </div>
                    <div className="mt-3 space-y-2.5">
                      {[
                        ['Aadhaar Front', selectedOnboarding?.identity_verification?.aadhaar_front],
                        ['Aadhaar Back', selectedOnboarding?.identity_verification?.aadhaar_back],
                        ['Passport/License', selectedOnboarding?.identity_verification?.passport_or_license],
                      ].map(([label, rawUrl]) => {
                        const resolvedUrl = resolveMediaUrl(rawUrl);
                        const available = Boolean(resolvedUrl);
                        const kind = resolveDocumentKind(resolvedUrl);
                        const fileLabel = getDocumentName(resolvedUrl);
                        return (
                          <div
                            key={label}
                            className={`rounded-lg border px-3 py-2.5 ${
                              available
                                ? 'border-[#e2d7f5] bg-white'
                                : 'border-[#ece8f6] bg-[#f8f7fb]'
                            }`}
                          >
                            <div className="flex items-center justify-between gap-2">
                              <div className="min-w-0 flex items-center gap-2">
                                <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${
                                  available ? 'bg-[#f1e9ff] text-[#5b2c91]' : 'bg-[#eef0f3] text-[#9ca3af]'
                                }`}>
                                  {kind === 'pdf' ? <FileText className="h-4 w-4" aria-hidden="true" /> : <FileImage className="h-4 w-4" aria-hidden="true" />}
                                </div>
                                <div className="min-w-0">
                                  <div className="text-xs font-semibold text-[#1f2937]">{label}</div>
                                  <div className="text-[11px] text-[#6b7280] truncate">{available ? fileLabel : 'Not uploaded'}</div>
                                </div>
                              </div>
                              {available && (
                                <button
                                  type="button"
                                  className="inline-flex items-center gap-1 rounded-md border border-[#d8c8f2] bg-[#f8f2ff] px-2.5 py-1.5 text-[11px] font-semibold text-[#5b2c91] hover:bg-[#f1e7ff]"
                                  onClick={() => openDocumentViewer(label, resolvedUrl)}
                                >
                                  <Eye className="h-3.5 w-3.5" aria-hidden="true" />
                                  View
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="rounded-lg border border-[#e5e7eb] bg-[#faf8ff] p-3.5">
                    <div className="text-xs font-semibold text-[#111827]">Onboarding Snapshot</div>
                    <div className="mt-2 grid grid-cols-2 gap-2 text-[11px]">
                      {[
                        ['Application', selectedOnboarding?.status?.application_status],
                        ['Identity', selectedOnboarding?.status?.identity_status],
                        ['Contact', selectedOnboarding?.status?.contact_status],
                        ['Training', selectedOnboarding?.status?.training_status],
                        ['Final', selectedOnboarding?.status?.final_approval_status],
                      ].map(([label, value]) => (
                        <div key={label} className="rounded-md border border-[#ece8f6] bg-white px-2 py-1.5">
                          <div className="text-[#6b7280]">{label}</div>
                          <div className="mt-0.5 font-semibold capitalize text-[#111827]">{formatStatusLabel(value)}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="mt-4 rounded-lg border border-[#e5e7eb] bg-[#faf8ff] p-3.5">
                  <div className="text-xs font-semibold text-[#111827]">Training Modules</div>
                  <div className="mt-2 space-y-2">
                      {(selectedOnboarding.training_modules || []).map((module) => (
                        <div key={module.id} className="rounded-md border border-[#ece8f6] bg-white px-2.5 py-2">
                          <div className="flex items-center justify-between gap-2 text-xs">
                            <div className="font-medium text-[#111827] truncate">{module.title}</div>
                            <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize ${getStatusChipClass(module.status)}`}>
                              {formatStatusLabel(module.status)}
                            </span>
                          </div>
                          <div className="mt-1.5 h-1.5 rounded-full bg-[#ede9fe]">
                            <div
                              className="h-full rounded-full bg-[#5b2c91]"
                              style={{ width: `${Math.max(0, Math.min(100, Number(module.progress_percent || 0)))}%` }}
                            />
                          </div>
                        </div>
                      ))}
                      {!selectedOnboarding.training_modules?.length && (
                        <div className="text-xs text-[#6b7280]">No training modules found.</div>
                      )}
                  </div>
                </div>

                <div className="mt-5 rounded-lg border border-[#e5e7eb] p-4">
                  <h3 className="text-sm font-semibold text-[#111827]">Admin Decision</h3>
                  <div className="mt-3 grid gap-3 sm:grid-cols-3">
                    <div>
                      <label htmlFor="identityDecision" className="text-xs text-[#6b7280]">Identity Verification</label>
                      <select
                        id="identityDecision"
                        className={inputClass}
                        value={decisionForm.identityDecision}
                        onChange={(event) => setDecisionForm((prev) => ({ ...prev, identityDecision: event.target.value }))}
                      >
                        {identityStatusOptions.map((option) => (
                          <option key={option.value} value={option.value}>{option.label}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label htmlFor="trainingStatus" className="text-xs text-[#6b7280]">Training Status</label>
                      <select
                        id="trainingStatus"
                        className={inputClass}
                        value={decisionForm.trainingStatus}
                        onChange={(event) => setDecisionForm((prev) => ({ ...prev, trainingStatus: event.target.value }))}
                      >
                        {onboardingStatusOptions.map((option) => (
                          <option key={option.value} value={option.value}>{option.label}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label htmlFor="finalApprovalStatus" className="text-xs text-[#6b7280]">Final Approval</label>
                      <select
                        id="finalApprovalStatus"
                        className={inputClass}
                        value={decisionForm.finalApprovalStatus}
                        onChange={(event) => setDecisionForm((prev) => ({ ...prev, finalApprovalStatus: event.target.value }))}
                      >
                        {onboardingStatusOptions.map((option) => (
                          <option key={option.value} value={option.value}>{option.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="mt-3">
                    <label htmlFor="reviewerNotes" className="text-xs text-[#6b7280]">Reviewer Notes</label>
                    <textarea
                      id="reviewerNotes"
                      rows={3}
                      className={inputClass}
                      value={decisionForm.reviewerNotes}
                      onChange={(event) => setDecisionForm((prev) => ({ ...prev, reviewerNotes: event.target.value }))}
                      placeholder="Optional notes for identity review."
                    />
                  </div>
                  {decisionForm.finalApprovalStatus === 'rejected' && (
                    <div className="mt-3">
                      <label htmlFor="finalRejectionReason" className="text-xs text-[#6b7280]">Final Rejection Reason</label>
                      <textarea
                        id="finalRejectionReason"
                        rows={3}
                        className={inputClass}
                        value={decisionForm.finalRejectionReason}
                        onChange={(event) => setDecisionForm((prev) => ({ ...prev, finalRejectionReason: event.target.value }))}
                        placeholder="Add reason for final rejection."
                      />
                    </div>
                  )}

                  {decisionError && <div className="mt-2 text-xs text-red-600">{decisionError}</div>}
                  {decisionSuccess && !decisionError && <div className="mt-2 text-xs text-green-700">{decisionSuccess}</div>}

                  <div className="mt-4 flex justify-end">
                    <button
                      type="button"
                      className="rounded-md bg-[#5b2c91] px-4 py-2 text-sm text-white hover:bg-[#4a2374] disabled:opacity-70"
                      onClick={handleSaveDecision}
                      disabled={decisionLoading}
                    >
                      {decisionLoading ? 'Saving...' : 'Save Decision'}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      {documentViewer.open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 py-6"
          role="dialog"
          aria-modal="true"
          onClick={closeDocumentViewer}
        >
          <div
            className="w-full max-w-4xl rounded-2xl border border-[#ded3f2] bg-white shadow-[0_18px_60px_rgba(17,24,39,0.28)]"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-[#ece8f6] px-4 py-3">
              <div className="min-w-0">
                <h3 className="truncate text-sm font-semibold text-[#1f2937]">{documentViewer.title}</h3>
                <p className="truncate text-xs text-[#6b7280]">{getDocumentName(documentViewer.url)}</p>
              </div>
              <button
                type="button"
                className="rounded-md border border-[#e5e7eb] p-1.5 text-[#6b7280] hover:text-[#111827]"
                onClick={closeDocumentViewer}
                aria-label="Close document viewer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="max-h-[75vh] overflow-auto bg-[#f8f5ff] p-4">
              {documentViewer.kind === 'image' && (
                <img
                  src={documentViewer.url}
                  alt={documentViewer.title}
                  className="mx-auto max-h-[68vh] w-auto max-w-full rounded-lg border border-[#e2d7f5] bg-white object-contain"
                />
              )}
              {documentViewer.kind === 'pdf' && (
                <iframe
                  title={documentViewer.title}
                  src={documentViewer.url}
                  className="h-[68vh] w-full rounded-lg border border-[#e2d7f5] bg-white"
                />
              )}
              {documentViewer.kind === 'unknown' && (
                <div className="rounded-lg border border-[#e2d7f5] bg-white p-6 text-center text-sm text-[#6b7280]">
                  Preview is not available for this file type.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPortal;


