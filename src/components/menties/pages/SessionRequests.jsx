import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, ClipboardList, RefreshCw } from 'lucide-react';
import { menteeApi } from '../../../apis/api/menteeApi';

const normalizeList = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.results)) return payload.results;
  return [];
};

const formatDateTime = (value) => {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleString('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
};

const formatStatusLabel = (status) => {
  if (!status) return 'Unknown';
  return status.charAt(0).toUpperCase() + status.slice(1);
};

const statusStyles = {
  requested: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  approved: 'bg-sky-100 text-sky-700 border-sky-200',
  scheduled: 'bg-indigo-100 text-indigo-700 border-indigo-200',
  completed: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  canceled: 'bg-red-100 text-red-700 border-red-200',
  default: 'bg-gray-100 text-gray-700 border-gray-200',
};

const SessionRequests = () => {
  const navigate = useNavigate();
  const [sessions, setSessions] = useState([]);
  const [mentors, setMentors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const loadData = useCallback(
    async ({ skipLoading = false } = {}) => {
      if (!skipLoading) setLoading(true);
      setError('');
      try {
        const [sessionsResponse, mentorsResponse] = await Promise.all([
          menteeApi.listSessions(),
          menteeApi.listMentors(),
        ]);
        setSessions(normalizeList(sessionsResponse));
        setMentors(normalizeList(mentorsResponse));
      } catch (err) {
        setError(err?.message || 'Unable to load your sessions right now.');
        setSessions([]);
        setMentors([]);
      } finally {
        if (!skipLoading) setLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData({ skipLoading: true });
    setRefreshing(false);
  };

  const mentorMap = useMemo(() => {
    const map = {};
    mentors.forEach((mentor) => {
      const name = `${mentor?.first_name || ''} ${mentor?.last_name || ''}`.trim();
      map[String(mentor?.id)] = {
        name: name || `Mentor #${mentor?.id || '—'}`,
        avatar: mentor?.avatar || mentor?.profile_photo || '',
      };
    });
    return map;
  }, [mentors]);

  const sortedSessions = useMemo(() => {
    return [...sessions].sort((a, b) => {
      const aTs = new Date(a?.scheduled_start || '').getTime() || 0;
      const bTs = new Date(b?.scheduled_start || '').getTime() || 0;
      return bTs - aTs;
    });
  }, [sessions]);

  const stats = useMemo(() => {
    const pending = sessions.filter((session) => session?.status === 'requested').length;
    const upcoming = sessions.filter((session) => ['approved', 'scheduled'].includes(session?.status)).length;
    return {
      total: sessions.length,
      pending,
      upcoming,
    };
  }, [sessions]);

  return (
    <div className="bg-transparent p-3 sm:p-5 lg:p-8 font-sans text-[#111827]">
      <div className="mb-6 flex flex-col gap-3 rounded-[28px] border border-[#e8dcff] bg-[linear-gradient(135deg,#ffffff_0%,#fcfaff_45%,#f8f3ff_100%)] p-4 shadow-[0_28px_60px_-46px_rgba(93,54,153,0.65)] ring-1 ring-[#efe7ff] sm:flex-row sm:items-center sm:justify-between sm:p-6">
        <div>
          <div className="inline-flex items-center gap-3 rounded-2xl bg-[#5D3699]/10 px-4 py-2 text-sm font-semibold text-[#5D3699]">
            <ClipboardList className="h-4 w-4" />
            Session Requested
          </div>
          <h1 className="mt-3 text-2xl font-bold text-[#111827]">Recent requests to mentors</h1>
          <p className="mt-1 text-sm text-[#6b7280] leading-relaxed">
            This list shows every session request you’ve sent to mentors, newest first.
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-2">
          <button
            type="button"
            onClick={handleRefresh}
            disabled={loading || refreshing}
            className="inline-flex items-center gap-2 rounded-xl border border-[#e5e7eb] bg-white px-3 py-2 text-xs font-semibold text-[#111827] transition hover:border-[#c4b5fd] hover:text-[#5D3699] disabled:opacity-60"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </button>
          <button
            type="button"
            onClick={() => navigate('/book-session')}
            className="inline-flex items-center gap-2 rounded-xl bg-[#5D3699] px-3 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-[#4a2b7a]"
          >
            <Clock className="h-4 w-4" />
            Book mentor
          </button>
        </div>
      </div>

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        {[
          { label: 'Total requests', value: stats.total },
          { label: 'Needs approval', value: stats.pending },
          { label: 'Upcoming/approved', value: stats.upcoming },
        ].map((stat) => (
          <div
            key={stat.label}
            className="rounded-2xl border border-[#e5e7eb] bg-white p-4 shadow-sm"
          >
            <p className="text-xs uppercase tracking-[0.3em] text-[#9ca3af]">{stat.label}</p>
            <p className="mt-2 text-2xl font-bold text-[#111827]">{stat.value}</p>
          </div>
        ))}
      </div>

      {error && (
        <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {loading ? (
        <div className="rounded-2xl border border-dashed border-[#e5e7eb] bg-white/60 p-8 text-center text-sm text-[#6b7280]">
          Loading sessions you requested...
        </div>
      ) : (
        <div className="space-y-4">
          {!sortedSessions.length ? (
            <div className="rounded-2xl border border-dashed border-[#e5e7eb] bg-white/60 p-8 text-center text-sm text-[#6b7280]">
              You haven’t requested any sessions yet. Share what you need help with to show up here.
            </div>
          ) : (
            sortedSessions.map((session) => {
              const mentorInfo = mentorMap[String(session?.mentor)] || {
                name: session?.mentor_name || 'Mentor',
                avatar: session?.mentor_avatar || session?.mentor?.profile_photo || '',
              };
              const statusKey = session?.status || 'default';
              const badgeClass = statusStyles[statusKey] || statusStyles.default;
              return (
                <article
                  key={session.id}
                  className="rounded-2xl border border-[#e5e7eb] bg-white p-5 shadow-sm flex flex-col gap-4"
                >
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-2xl bg-[#f5f3ff] text-xs font-semibold text-[#5D3699]">
                        {mentorInfo.avatar ? (
                          <img
                            src={mentorInfo.avatar}
                            alt={mentorInfo.name}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          mentorInfo.name?.charAt(0)?.toUpperCase() || 'M'
                        )}
                      </div>
                      <div>
                        <p className="text-base font-semibold text-[#111827]">{mentorInfo.name}</p>
                        <p className="text-sm text-[#6b7280]">{formatDateTime(session?.scheduled_start)}</p>
                      </div>
                    </div>
                    <span
                      className={`rounded-full border px-3 py-1 text-xs font-semibold ${badgeClass}`}
                    >
                      {formatStatusLabel(session?.status)}
                    </span>
                  </div>
                  <p className="text-sm text-[#6b7280]">
                    {session?.notes || session?.description || 'No additional notes provided.'}
                  </p>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-[#6b7280]">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" />
                      Scheduled on {formatDateTime(session?.scheduled_start)}
                    </span>
                    <span>
                      Mode: {(session?.session_mode || 'online').replace('_', ' ')}
                    </span>
                  </div>
                </article>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};

export default SessionRequests;
