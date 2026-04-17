import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { mentorApi } from '../../../apis/api/mentorApi';
import { useMentorData } from '../../../apis/apihook/useMentorData';
import { 
  RefreshCw, 
  Calendar, 
  Clock, 
  Timer, 
  Video, 
  CheckCircle2, 
  XCircle, 
  Inbox,
  ArrowLeft,
  User,
  Monitor,
  Phone
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || '/api').replace(/\/+$/, '');

const resolveMediaUrl = (value) => {
  if (!value) return '';
  if (/^https?:\/\//i.test(value)) return value;
  if (value.startsWith('/')) {
    const base = API_BASE_URL.endsWith('/api') ? API_BASE_URL.slice(0, -4) : API_BASE_URL;
    return base ? `${base}${value}` : value;
  }
  return value;
};

const getMenteeName = (session) => {
  if (session?.mentee_name) return session.mentee_name;
  const firstName = (session?.mentee_first_name || '').trim();
  const lastName = (session?.mentee_last_name || '').trim();
  const fullName = `${firstName} ${lastName}`.trim();
  if (fullName) return fullName;
  if (session?.mentee) return `Mentee #${session.mentee}`;
  return 'Mentee';
};

const formatDateLabel = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Date TBD';
  return date.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
};

const formatTimeRange = (startValue, endValue) => {
  const start = new Date(startValue);
  const end = new Date(endValue);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return 'Time TBD';
  const startLabel = start.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true });
  const endLabel = end.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true });
  return `${startLabel} - ${endLabel}`;
};

const normalizeList = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.results)) return payload.results;
  return [];
};

const SessionRequests = () => {
  const navigate = useNavigate();
  const { mentor } = useMentorData();
  const [sessions, setSessions] = useState([]);
  const [stats, setStats] = useState({ approvedToday: 0, approvedThisWeek: 0 });
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const loadRequests = useCallback(async () => {
    if (!mentor?.id) {
      setStats({ approvedToday: 0, approvedThisWeek: 0 });
      setLoading(false);
      return;
    }
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      const [response, statsResponse] = await Promise.all([
        mentorApi.listSessions({ mentor_id: mentor.id, status: 'requested' }),
        mentorApi
          .getSessionRequestStats({ mentor_id: mentor.id })
          .catch(() => ({ approved_today: 0, approved_this_week: 0 })),
      ]);
      const list = normalizeList(response);
      setSessions(list);
      setStats({
        approvedToday: Number(statsResponse?.approved_today || 0),
        approvedThisWeek: Number(statsResponse?.approved_this_week || 0),
      });
    } catch (err) {
      setError(err?.message || 'Unable to load session requests.');
      setSessions([]);
      setStats({ approvedToday: 0, approvedThisWeek: 0 });
    } finally {
      setLoading(false);
    }
  }, [mentor?.id]);

  useEffect(() => {
    loadRequests();
  }, [loadRequests]);

  const handleDecision = async (sessionId, status) => {
    if (!sessionId) return;
    setUpdatingId(sessionId);
    setError('');
    setSuccess('');
    try {
      await mentorApi.updateSession(sessionId, { status });
      setSessions((prev) => prev.filter((session) => session.id !== sessionId));
      if (status === 'approved') {
        setStats((prev) => ({
          approvedToday: prev.approvedToday + 1,
          approvedThisWeek: prev.approvedThisWeek + 1,
        }));
      }
      setSuccess('Session updated.');
    } catch (err) {
      setError(err?.message || 'Unable to update session.');
    } finally {
      setUpdatingId(null);
    }
  };

  const rows = useMemo(() => sessions, [sessions]);

return (
  <div className="min-h-screen bg-transparent p-4 text-[color:var(--theme-v-text-primary)] sm:p-6 lg:p-8">
    {/* Header Section */}
    <div className="relative mb-8 overflow-hidden rounded-3xl border border-[color:var(--theme-v-border-strong)] bg-[linear-gradient(135deg,var(--theme-v-bg-mid)_0%,var(--theme-v-bg-start)_50%,var(--theme-v-bg-end)_100%)] p-4 shadow-[0_20px_45px_-28px_var(--theme-v-shell-shadow)] ring-1 ring-[color:var(--theme-v-hero-ring)] sm:p-6">
      <div className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-[color:var(--theme-v-orb-gold)] blur-3xl" />
      <div className="pointer-events-none absolute -left-16 -bottom-16 h-36 w-36 rounded-full bg-[color:var(--theme-v-orb-light)] blur-3xl" />
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        {/* Title with decorative element */}
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[color:var(--theme-v-surface-overlay-strong)]">
            <Inbox className="h-6 w-6 text-[color:var(--theme-v-accent)]" />
          </div>
          <div>
            <button
              type="button"
              onClick={() => navigate('/mentor-sessions')}
              className="mb-2 inline-flex items-center gap-1 rounded-lg border border-[color:var(--theme-v-border-soft)] bg-[color:var(--theme-v-surface-overlay)] px-3 py-1.5 text-xs font-medium text-[color:var(--theme-v-accent)] transition-colors hover:bg-[color:var(--theme-v-surface-overlay-strong)]"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Back to My Sessions
            </button>
            <h1 className="text-2xl font-bold tracking-tight text-[color:var(--theme-v-text-primary)] sm:text-3xl">
              Session Requests
            </h1>
            <p className="mt-1 text-sm text-[color:var(--theme-v-text-secondary)]">
              Review mentee requests waiting for your approval
            </p>
          </div>
        </div>

        {/* Refresh Button */}
        <button
          type="button"
          onClick={loadRequests}
          disabled={loading}
          className="group inline-flex items-center justify-center gap-2 rounded-xl border border-[color:var(--theme-v-border-soft)] bg-[color:var(--theme-v-surface-overlay)] px-5 py-2.5 text-sm font-medium text-[color:var(--theme-v-text-primary)] shadow-sm transition-all hover:-translate-y-0.5 hover:border-[color:var(--theme-v-border-hover)] hover:shadow disabled:cursor-not-allowed disabled:opacity-60"
        >
          <RefreshCw className={`h-4 w-4 text-[color:var(--theme-v-accent)] transition-transform group-hover:text-[color:var(--theme-v-highlight-mid)] ${loading ? 'animate-spin' : ''}`} />
          {loading ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      {/* Stats Cards */}
      {(rows.length > 0 || stats.approvedToday > 0 || stats.approvedThisWeek > 0) && (
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-xl bg-[color:var(--theme-v-surface-overlay-strong)] p-4 shadow-sm ring-1 ring-[color:var(--theme-v-border-soft)]">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[color:var(--theme-v-surface-overlay)]">
                <Clock className="h-5 w-5 text-[color:var(--theme-v-accent)]" />
              </div>
              <div>
                <p className="text-2xl font-bold text-[color:var(--theme-v-text-primary)]">{rows.length}</p>
                <p className="text-xs text-[color:var(--theme-v-text-secondary)]">Pending Requests</p>
              </div>
            </div>
          </div>
          <div className="rounded-xl bg-[color:var(--theme-v-surface-overlay-strong)] p-4 shadow-sm ring-1 ring-[color:var(--theme-v-border-soft)]">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[color:var(--theme-v-surface-overlay)]">
                <CheckCircle2 className="h-5 w-5 text-[color:var(--theme-v-accent)]" />
              </div>
              <div>
                <p className="text-2xl font-bold text-[color:var(--theme-v-text-primary)]">{stats.approvedToday}</p>
                <p className="text-xs text-[color:var(--theme-v-text-secondary)]">Approved Today</p>
              </div>
            </div>
          </div>
          <div className="rounded-xl bg-[color:var(--theme-v-surface-overlay-strong)] p-4 shadow-sm ring-1 ring-[color:var(--theme-v-border-soft)]">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[color:var(--theme-v-surface-overlay)]">
                <Calendar className="h-5 w-5 text-[color:var(--theme-v-accent)]" />
              </div>
              <div>
                <p className="text-2xl font-bold text-[color:var(--theme-v-text-primary)]">{stats.approvedThisWeek}</p>
                <p className="text-xs text-[color:var(--theme-v-text-secondary)]">This Week</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>

    {/* Table Section */}
    <div className="hidden overflow-hidden rounded-2xl bg-[color:var(--theme-v-surface-overlay)] shadow-sm ring-1 ring-[color:var(--theme-v-border-soft)] lg:block">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px]">
          <thead>
            <tr className="bg-[color:var(--theme-v-surface-overlay-strong)]">
              <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-[color:var(--theme-v-text-secondary)]">
                Mentee
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-[color:var(--theme-v-text-secondary)]">
                Date
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-[color:var(--theme-v-text-secondary)]">
                Time
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-[color:var(--theme-v-text-secondary)]">
                Duration
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-[color:var(--theme-v-text-secondary)]">
                Mode
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-[color:var(--theme-v-text-secondary)]">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[color:var(--theme-v-border-soft)]">
            {rows.map((session) => {
              const durationLabel = session?.duration_minutes
                ? `${session.duration_minutes} min`
                : 'TBD';
              const modeLabel = session?.mode ? session.mode.replace('_', ' ') : 'N/A';
              const menteeName = getMenteeName(session);
              const menteeAvatar = resolveMediaUrl(session?.mentee_avatar);
              const busy = updatingId === session.id;

              const getModeIcon = (mode) => {
                switch (mode?.toLowerCase()) {
                  case 'video':
                  case 'video_call':
                    return <Video className="h-4 w-4" />;
                  case 'phone':
                  case 'phone_call':
                    return <Phone className="h-4 w-4" />;
                  default:
                    return <Monitor className="h-4 w-4" />;
                }
              };

              return (
                <tr
                  key={session.id}
                  className="group transition-colors hover:bg-[color:var(--theme-v-surface-overlay)]"
                >
                  {/* Mentee */}
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[color:var(--theme-v-surface-overlay-strong)]">
                        {menteeAvatar ? (
                          <img
                            src={menteeAvatar}
                            alt={menteeName}
                            className="h-10 w-10 rounded-full object-cover"
                          />
                        ) : (
                          <User className="h-5 w-5 text-[color:var(--theme-v-accent)]" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-[color:var(--theme-v-text-primary)]">
                          {menteeName}
                        </p>
                        <p className="text-xs text-[color:var(--theme-v-text-secondary)]">
                          Awaiting approval
                        </p>
                      </div>
                    </div>
                  </td>

                  {/* Date */}
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-sm text-[color:var(--theme-v-text-secondary)]">
                      <Calendar className="h-4 w-4 text-[color:var(--theme-v-accent)]" />
                      {formatDateLabel(session.scheduled_start)}
                    </div>
                  </td>

                  {/* Time */}
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-sm text-[color:var(--theme-v-text-secondary)]">
                      <Clock className="h-4 w-4 text-[color:var(--theme-v-accent)]" />
                      {formatTimeRange(session.scheduled_start, session.scheduled_end)}
                    </div>
                  </td>

                  {/* Duration */}
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-[color:var(--theme-v-surface-overlay-strong)] px-3 py-1 text-xs font-medium text-[color:var(--theme-v-text-primary)] ring-1 ring-[color:var(--theme-v-border-soft)]">
                        <Timer className="h-3 w-3 text-[color:var(--theme-v-accent)]" />
                        {durationLabel}
                      </span>
                    </div>
                  </td>

                  {/* Mode */}
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-[color:var(--theme-v-surface-overlay)] px-3 py-1 text-xs font-medium capitalize text-[color:var(--theme-v-accent)] ring-1 ring-[color:var(--theme-v-border-soft)]">
                      {getModeIcon(session?.mode)}
                      {modeLabel}
                    </span>
                  </td>

                  {/* Actions */}
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleDecision(session.id, 'approved')}
                        disabled={busy}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-[color:var(--theme-v-accent)] px-4 py-2 text-xs font-semibold text-[color:var(--theme-v-accent-text)] shadow-sm transition-all hover:bg-[color:var(--theme-v-accent-hover)] hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {busy ? (
                          <>
                            <div className="h-3 w-3 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                            Updating...
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            Approve
                          </>
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDecision(session.id, 'canceled')}
                        disabled={busy}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-[color:var(--theme-v-surface-overlay)] px-4 py-2 text-xs font-semibold text-[color:var(--theme-v-text-secondary)] shadow-sm ring-1 ring-[color:var(--theme-v-border-soft)] transition-all hover:bg-[color:var(--theme-v-surface-overlay-strong)] hover:text-red-400 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        <XCircle className="h-3.5 w-3.5" />
                        Decline
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}

            {/* Empty State */}
            {!rows.length && !loading && (
              <tr>
                <td colSpan={6} className="px-6 py-16">
                  <div className="flex flex-col items-center justify-center text-center">
                    <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[color:var(--theme-v-surface-overlay-strong)]">
                      <Inbox className="h-10 w-10 text-[color:var(--theme-v-accent)]" />
                    </div>
                    <h3 className="mt-4 text-base font-semibold text-[color:var(--theme-v-text-primary)]">
                      No pending requests
                    </h3>
                    <p className="mt-1 max-w-sm text-sm text-[color:var(--theme-v-text-secondary)]">
                      You're all caught up! New session requests from mentees will appear here.
                    </p>
                    <button
                      type="button"
                      onClick={loadRequests}
                      className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[color:var(--theme-v-accent)] px-5 py-2.5 text-sm font-medium text-[color:var(--theme-v-accent-text)] shadow-sm transition-all hover:bg-[color:var(--theme-v-accent-hover)] hover:shadow-md"
                    >
                      <RefreshCw className="h-4 w-4" />
                      Check for new requests
                    </button>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>

    {/* Loading State */}
    {loading && (
      <div className="mt-6 flex items-center justify-center gap-3 rounded-xl bg-[color:var(--theme-v-surface-overlay)] p-6 shadow-sm ring-1 ring-[color:var(--theme-v-border-soft)]">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-[color:var(--theme-v-border-soft)] border-t-[color:var(--theme-v-accent)]" />
        <span className="text-sm font-medium text-[color:var(--theme-v-text-secondary)]">Loading session requests...</span>
      </div>
    )}

    {/* Error State */}
    {error && (
      <div className="mt-6 flex items-center gap-3 rounded-xl bg-[color:var(--theme-v-toast-error-bg)] p-4 ring-1 ring-[color:var(--theme-v-toast-error-border)]">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-900/40">
          <XCircle className="h-5 w-5 text-[color:var(--theme-v-toast-error-text)]" />
        </div>
        <div>
          <p className="text-sm font-medium text-[color:var(--theme-v-toast-error-text)]">Error loading requests</p>
          <p className="text-sm text-red-300">{error}</p>
        </div>
        <button
          type="button"
          onClick={loadRequests}
          className="ml-auto rounded-lg bg-red-900/50 px-3 py-1.5 text-xs font-medium text-[color:var(--theme-v-toast-error-text)] transition-colors hover:bg-red-900/70"
        >
          Try Again
        </button>
      </div>
    )}

    {/* Success State */}
    {success && (
      <div className="mt-6 flex items-center gap-3 rounded-xl bg-[color:var(--theme-v-toast-success-bg)] p-4 ring-1 ring-[color:var(--theme-v-toast-success-border)]">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-900/40">
          <CheckCircle2 className="h-5 w-5 text-[color:var(--theme-v-toast-success-text)]" />
        </div>
        <div>
          <p className="text-sm font-medium text-[color:var(--theme-v-toast-success-text)]">Success!</p>
          <p className="text-sm text-emerald-300">{success}</p>
        </div>
      </div>
    )}

    {/* Mobile Card View (Alternative for small screens) */}
    <div className="mt-6 space-y-4 lg:hidden">
      {rows.map((session) => {
        const durationLabel = session?.duration_minutes
          ? `${session.duration_minutes} min`
          : 'TBD';
        const modeLabel = session?.mode ? session.mode.replace('_', ' ') : 'N/A';
        const menteeName = getMenteeName(session);
        const menteeAvatar = resolveMediaUrl(session?.mentee_avatar);
        const busy = updatingId === session.id;

        return (
          <div
            key={`mobile-${session.id}`}
            className="rounded-2xl bg-[color:var(--theme-v-surface-overlay)] p-5 shadow-sm ring-1 ring-[color:var(--theme-v-border-soft)]"
          >
            {/* Card Header */}
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[color:var(--theme-v-surface-overlay-strong)]">
                  {menteeAvatar ? (
                    <img
                      src={menteeAvatar}
                      alt={menteeName}
                      className="h-12 w-12 rounded-full object-cover"
                    />
                  ) : (
                    <User className="h-6 w-6 text-[color:var(--theme-v-accent)]" />
                  )}
                </div>
                <div>
                  <p className="font-semibold text-[color:var(--theme-v-text-primary)]">{menteeName}</p>
                  <span className="inline-flex items-center rounded-full bg-[color:var(--theme-v-surface-overlay-strong)] px-2 py-0.5 text-xs font-medium text-[color:var(--theme-v-accent)] ring-1 ring-[color:var(--theme-v-border-soft)]">
                    Pending
                  </span>
                </div>
              </div>
            </div>

            {/* Card Details */}
            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="flex items-center gap-2 text-sm text-[color:var(--theme-v-text-secondary)]">
                <Calendar className="h-4 w-4 text-[color:var(--theme-v-accent)]" />
                {formatDateLabel(session.scheduled_start)}
              </div>
              <div className="flex items-center gap-2 text-sm text-[color:var(--theme-v-text-secondary)]">
                <Clock className="h-4 w-4 text-[color:var(--theme-v-accent)]" />
                {formatTimeRange(session.scheduled_start, session.scheduled_end)}
              </div>
              <div className="flex items-center gap-2 text-sm text-[color:var(--theme-v-text-secondary)]">
                <Timer className="h-4 w-4 text-[color:var(--theme-v-accent)]" />
                {durationLabel}
              </div>
              <div className="flex items-center gap-2 text-sm capitalize text-[color:var(--theme-v-text-secondary)]">
                <Video className="h-4 w-4 text-[color:var(--theme-v-accent)]" />
                {modeLabel}
              </div>
            </div>

            {/* Card Actions */}
            <div className="mt-5 flex gap-3">
              <button
                type="button"
                onClick={() => handleDecision(session.id, 'approved')}
                disabled={busy}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[color:var(--theme-v-accent)] py-2.5 text-sm font-semibold text-[color:var(--theme-v-accent-text)] shadow-sm transition-all hover:bg-[color:var(--theme-v-accent-hover)] disabled:opacity-60"
              >
                {busy ? (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                ) : (
                  <CheckCircle2 className="h-4 w-4" />
                )}
                {busy ? 'Updating...' : 'Approve'}
              </button>
              <button
                type="button"
                onClick={() => handleDecision(session.id, 'canceled')}
                disabled={busy}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[color:var(--theme-v-surface-overlay)] py-2.5 text-sm font-semibold text-[color:var(--theme-v-text-secondary)] ring-1 ring-[color:var(--theme-v-border-soft)] transition-all hover:bg-[color:var(--theme-v-surface-overlay-strong)] hover:text-red-400 disabled:opacity-60"
              >
                <XCircle className="h-4 w-4" />
                Decline
              </button>
            </div>
          </div>
        );
      })}

      {!rows.length && !loading && (
        <div className="rounded-2xl bg-[color:var(--theme-v-surface-overlay)] p-8 text-center shadow-sm ring-1 ring-[color:var(--theme-v-border-soft)]">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[color:var(--theme-v-surface-overlay-strong)]">
            <Inbox className="h-8 w-8 text-[color:var(--theme-v-accent)]" />
          </div>
          <h3 className="mt-4 text-base font-semibold text-[color:var(--theme-v-text-primary)]">No pending requests</h3>
          <p className="mt-1 text-sm text-[color:var(--theme-v-text-secondary)]">
            You're all caught up! New session requests from mentees will appear here.
          </p>
        </div>
      )}
    </div>
  </div>
);
};

export default SessionRequests;
