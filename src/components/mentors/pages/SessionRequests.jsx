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
  User,
  Monitor,
  Phone
} from 'lucide-react';

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
  const startLabel = start.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  const endLabel = end.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  return `${startLabel} - ${endLabel}`;
};

const normalizeList = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.results)) return payload.results;
  return [];
};

const SessionRequests = () => {
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
  <div className="min-h-screen p-4 sm:p-6 lg:p-8">
    {/* Header Section */}
    <div className="mb-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        {/* Title with decorative element */}
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#5D3699] shadow-lg shadow-[#5D3699]/20">
            <Inbox className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
              Session Requests
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              Review mentee requests waiting for your approval
            </p>
          </div>
        </div>

        {/* Refresh Button */}
        <button
          type="button"
          onClick={loadRequests}
          disabled={loading}
          className="group inline-flex items-center justify-center gap-2 rounded-xl bg-white px-5 py-2.5 text-sm font-medium text-gray-700 shadow-sm ring-1 ring-gray-200 transition-all hover:bg-gray-50 hover:ring-gray-300 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <RefreshCw className={`h-4 w-4 text-gray-500 transition-transform group-hover:text-[#5D3699] ${loading ? 'animate-spin' : ''}`} />
          {loading ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      {/* Stats Cards */}
      {(rows.length > 0 || stats.approvedToday > 0 || stats.approvedThisWeek > 0) && (
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-gray-100">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-50">
                <Clock className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{rows.length}</p>
                <p className="text-xs text-gray-500">Pending Requests</p>
              </div>
            </div>
          </div>
          <div className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-gray-100">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-50">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.approvedToday}</p>
                <p className="text-xs text-gray-500">Approved Today</p>
              </div>
            </div>
          </div>
          <div className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-gray-100">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50">
                <Calendar className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.approvedThisWeek}</p>
                <p className="text-xs text-gray-500">This Week</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>

    {/* Table Section */}
    <div className="hidden overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-gray-100 lg:block">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px]">
          <thead>
            <tr className="bg-gray-50/80">
              <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                Mentee
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                Date
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                Time
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                Duration
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                Mode
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {rows.map((session) => {
              const durationLabel = session?.duration_minutes
                ? `${session.duration_minutes} min`
                : 'TBD';
              const modeLabel = session?.mode ? session.mode.replace('_', ' ') : 'N/A';
              const menteeName = getMenteeName(session);
              const menteeAvatar = resolveMediaUrl(session?.mentee_avatar);
              const busy = updatingId === session.id;

              // Get mode icon
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
                  className="group transition-colors hover:bg-gray-50/50"
                >
                  {/* Mentee */}
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#5D3699]/10">
                        {menteeAvatar ? (
                          <img
                            src={menteeAvatar}
                            alt={menteeName}
                            className="h-10 w-10 rounded-full object-cover"
                          />
                        ) : (
                          <User className="h-5 w-5 text-[#5D3699]" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">
                          {menteeName}
                        </p>
                        <p className="text-xs text-gray-500">
                          Awaiting approval
                        </p>
                      </div>
                    </div>
                  </td>

                  {/* Date */}
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      {formatDateLabel(session.scheduled_start)}
                    </div>
                  </td>

                  {/* Time */}
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Clock className="h-4 w-4 text-gray-400" />
                      {formatTimeRange(session.scheduled_start, session.scheduled_end)}
                    </div>
                  </td>

                  {/* Duration */}
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700">
                        <Timer className="h-3 w-3" />
                        {durationLabel}
                      </span>
                    </div>
                  </td>

                  {/* Mode */}
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1 text-xs font-medium capitalize text-blue-700 ring-1 ring-blue-600/10">
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
                        className="inline-flex items-center gap-1.5 rounded-xl bg-[#5D3699] px-4 py-2 text-xs font-semibold text-white shadow-sm transition-all hover:bg-[#4a2b7a] hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60"
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
                        className="inline-flex items-center gap-1.5 rounded-xl bg-white px-4 py-2 text-xs font-semibold text-gray-700 shadow-sm ring-1 ring-gray-200 transition-all hover:bg-gray-50 hover:text-red-600 hover:ring-red-200 disabled:cursor-not-allowed disabled:opacity-60"
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
                    <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gray-100">
                      <Inbox className="h-10 w-10 text-gray-400" />
                    </div>
                    <h3 className="mt-4 text-base font-semibold text-gray-900">
                      No pending requests
                    </h3>
                    <p className="mt-1 max-w-sm text-sm text-gray-500">
                      You're all caught up! New session requests from mentees will appear here.
                    </p>
                    <button
                      type="button"
                      onClick={loadRequests}
                      className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#5D3699] px-5 py-2.5 text-sm font-medium text-white shadow-sm transition-all hover:bg-[#4a2b7a] hover:shadow-md"
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
      <div className="mt-6 flex items-center justify-center gap-3 rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-100">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-gray-200 border-t-[#5D3699]" />
        <span className="text-sm font-medium text-gray-600">Loading session requests...</span>
      </div>
    )}

    {/* Error State */}
    {error && (
      <div className="mt-6 flex items-center gap-3 rounded-xl bg-red-50 p-4 ring-1 ring-red-100">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100">
          <XCircle className="h-5 w-5 text-red-600" />
        </div>
        <div>
          <p className="text-sm font-medium text-red-800">Error loading requests</p>
          <p className="text-sm text-red-600">{error}</p>
        </div>
        <button
          type="button"
          onClick={loadRequests}
          className="ml-auto rounded-lg bg-red-100 px-3 py-1.5 text-xs font-medium text-red-700 transition-colors hover:bg-red-200"
        >
          Try Again
        </button>
      </div>
    )}

    {/* Success State */}
    {success && (
      <div className="mt-6 flex items-center gap-3 rounded-xl bg-green-50 p-4 ring-1 ring-green-100">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100">
          <CheckCircle2 className="h-5 w-5 text-green-600" />
        </div>
        <div>
          <p className="text-sm font-medium text-green-800">Success!</p>
          <p className="text-sm text-green-600">{success}</p>
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
            className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-100"
          >
            {/* Card Header */}
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#5D3699]/10">
                  {menteeAvatar ? (
                    <img
                      src={menteeAvatar}
                      alt={menteeName}
                      className="h-12 w-12 rounded-full object-cover"
                    />
                  ) : (
                    <User className="h-6 w-6 text-[#5D3699]" />
                  )}
                </div>
                <div>
                  <p className="font-semibold text-gray-900">{menteeName}</p>
                  <span className="inline-flex items-center rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700">
                    Pending
                  </span>
                </div>
              </div>
            </div>

            {/* Card Details */}
            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Calendar className="h-4 w-4 text-gray-400" />
                {formatDateLabel(session.scheduled_start)}
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Clock className="h-4 w-4 text-gray-400" />
                {formatTimeRange(session.scheduled_start, session.scheduled_end)}
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Timer className="h-4 w-4 text-gray-400" />
                {durationLabel}
              </div>
              <div className="flex items-center gap-2 text-sm capitalize text-gray-600">
                <Video className="h-4 w-4 text-gray-400" />
                {modeLabel}
              </div>
            </div>

            {/* Card Actions */}
            <div className="mt-5 flex gap-3">
              <button
                type="button"
                onClick={() => handleDecision(session.id, 'approved')}
                disabled={busy}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#5D3699] py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-[#4a2b7a] disabled:opacity-60"
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
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-white py-2.5 text-sm font-semibold text-gray-700 ring-1 ring-gray-200 transition-all hover:bg-gray-50 hover:text-red-600 disabled:opacity-60"
              >
                <XCircle className="h-4 w-4" />
                Decline
              </button>
            </div>
          </div>
        );
      })}

      {!rows.length && !loading && (
        <div className="rounded-2xl bg-white p-8 text-center shadow-sm ring-1 ring-gray-100">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
            <Inbox className="h-8 w-8 text-gray-400" />
          </div>
          <h3 className="mt-4 text-base font-semibold text-gray-900">No pending requests</h3>
          <p className="mt-1 text-sm text-gray-500">
            You&apos;re all caught up! New session requests from mentees will appear here.
          </p>
        </div>
      )}
    </div>
  </div>
);
};

export default SessionRequests;
