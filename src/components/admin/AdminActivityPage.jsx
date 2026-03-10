import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import {
  Activity,
  ArrowLeft,
  ExternalLink,
  Maximize2,
  PlayCircle,
  RefreshCw,
  Users,
  Video,
  X,
} from 'lucide-react';
import { mentorApi } from '../../apis/api/mentorApi';
import { getAuthSession } from '../../apis/api/storage';

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || '/api').replace(/\/+$/, '');

const normalizeList = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.results)) return payload.results;
  return [];
};

const resolveMediaUrl = (value) => {
  if (!value) return '';
  if (/^https?:\/\//i.test(value)) return value;
  if (value.startsWith('/')) {
    const base = API_BASE_URL.endsWith('/api') ? API_BASE_URL.slice(0, -4) : API_BASE_URL;
    return base ? `${base}${value}` : value;
  }
  return value;
};

const toDisplayDate = (value) => {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleString([], {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const toStatusLabel = (value) =>
  String(value || 'pending')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());

const statusColor = (status) => {
  const normalized = String(status || '').toLowerCase();
  if (normalized === 'completed' || normalized === 'verified') return 'bg-emerald-100 text-emerald-700';
  if (normalized === 'in_review' || normalized === 'approved' || normalized === 'scheduled') {
    return 'bg-amber-100 text-amber-700';
  }
  if (normalized === 'rejected' || normalized === 'canceled' || normalized === 'no_show') {
    return 'bg-rose-100 text-rose-700';
  }
  return 'bg-slate-100 text-slate-700';
};

const getEntityName = (entity) => {
  if (entity && typeof entity === 'object') {
    if (entity.full_name) return String(entity.full_name);
    if (entity.name) return String(entity.name);
    const fullName = [entity.first_name, entity.last_name].filter(Boolean).join(' ').trim();
    if (fullName) return fullName;
    if (entity.username) return entity.username;
    if (entity.email) return entity.email;
  }
  return '';
};

const getEntityId = (entity) => {
  if (!entity) return '';
  if (typeof entity === 'object') return entity.id ? String(entity.id) : '';
  return String(entity);
};

const resolvePersonName = (entity, lookupMap, label) => {
  const directName = getEntityName(entity);
  if (directName) return directName;
  const entityId = getEntityId(entity);
  if (entityId && lookupMap?.[entityId]) return lookupMap[entityId];
  return `Unknown ${label}`;
};

const toDateKey = (value) => {
  const date = value ? new Date(value) : null;
  if (!date || Number.isNaN(date.getTime())) return '';
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const buildLast7Days = () => {
  const days = [];
  const today = new Date();
  for (let index = 6; index >= 0; index -= 1) {
    const copy = new Date(today);
    copy.setDate(today.getDate() - index);
    const key = toDateKey(copy);
    const label = copy.toLocaleDateString([], { weekday: 'short' });
    days.push({ key, label, value: 0 });
  }
  return days;
};

const AdminActivityPage = () => {
  const session = getAuthSession();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [mentors, setMentors] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [onboardingStatusMap, setOnboardingStatusMap] = useState({});
  const [recordingsBySession, setRecordingsBySession] = useState({});
  const [activeStatKey, setActiveStatKey] = useState(null);
  const [recordingPreview, setRecordingPreview] = useState(null);
  const recordingVideoRef = useRef(null);

  const isAdmin = session?.role === 'admin';

  const loadActivity = useCallback(async () => {
    if (!isAdmin) return;
    setLoading(true);
    setError('');
    try {
      const [mentorResponse, sessionResponse, onboardingResponse] = await Promise.all([
        mentorApi.getMentors(),
        mentorApi.listSessions(),
        mentorApi.listOnboardingStatuses(),
      ]);

      const mentorItems = normalizeList(mentorResponse);
      const sessionItems = normalizeList(sessionResponse);
      const onboardingItems = normalizeList(onboardingResponse);

      const statusMap = onboardingItems.reduce((acc, item) => {
        acc[item.mentor] = item;
        return acc;
      }, {});

      const recentSessions = [...sessionItems]
        .sort((left, right) => {
          const leftValue = new Date(left?.scheduled_start || left?.created_at || 0).getTime();
          const rightValue = new Date(right?.scheduled_start || right?.created_at || 0).getTime();
          return rightValue - leftValue;
        })
        .slice(0, 24);

      const recordingEntries = await Promise.all(
        recentSessions.map(async (item) => {
          try {
            const recording = await mentorApi.getSessionRecording(item.id);
            return [String(item.id), recording || null];
          } catch {
            return [String(item.id), null];
          }
        })
      );

      setMentors(mentorItems);
      setSessions(sessionItems);
      setOnboardingStatusMap(statusMap);
      setRecordingsBySession(Object.fromEntries(recordingEntries));
    } catch (err) {
      setError(err?.message || 'Unable to load activity data.');
      setMentors([]);
      setSessions([]);
      setOnboardingStatusMap({});
      setRecordingsBySession({});
    } finally {
      setLoading(false);
    }
  }, [isAdmin]);

  useEffect(() => {
    loadActivity();
  }, [loadActivity]);

  const summary = useMemo(() => {
    const totalMentors = mentors.length;
    const uniqueMenteeIds = new Set();
    const uniqueMentorIds = new Set();
    const sessionStatusCount = {};
    let completedSessions = 0;

    sessions.forEach((item) => {
      const status = String(item?.status || 'pending').toLowerCase();
      sessionStatusCount[status] = (sessionStatusCount[status] || 0) + 1;
      if (status === 'completed') completedSessions += 1;

      if (item?.mentee && typeof item.mentee !== 'object') uniqueMenteeIds.add(String(item.mentee));
      if (item?.mentor && typeof item.mentor !== 'object') uniqueMentorIds.add(String(item.mentor));
      if (item?.mentee && typeof item.mentee === 'object' && item.mentee.id) uniqueMenteeIds.add(String(item.mentee.id));
      if (item?.mentor && typeof item.mentor === 'object' && item.mentor.id) uniqueMentorIds.add(String(item.mentor.id));
    });

    const recordingsAvailable = Object.values(recordingsBySession).filter((recording) => {
      const media = resolveMediaUrl(recording?.recording_url || recording?.recording_file || '');
      return Boolean(media);
    }).length;

    const completedMentors = mentors.filter((mentor) => {
      const status = String(onboardingStatusMap[mentor.id]?.current_status || '').toLowerCase();
      return status === 'completed' || status === 'verified';
    }).length;

    return {
      totalMentors,
      totalSessions: sessions.length,
      completedSessions,
      activeMentors: uniqueMentorIds.size,
      activeMentees: uniqueMenteeIds.size,
      recordingsAvailable,
      completedMentors,
      sessionStatusCount,
    };
  }, [mentors, onboardingStatusMap, recordingsBySession, sessions]);

  const trendData = useMemo(() => {
    const base = buildLast7Days();
    const byDay = base.reduce((acc, item) => {
      acc[item.key] = item;
      return acc;
    }, {});
    sessions.forEach((item) => {
      const key = toDateKey(item?.scheduled_start || item?.created_at);
      if (byDay[key]) {
        byDay[key].value += 1;
      }
    });
    return base;
  }, [sessions]);

  const maxTrendValue = Math.max(...trendData.map((item) => item.value), 1);

  const mentorNameById = useMemo(() => {
    return mentors.reduce((acc, mentor) => {
      const key = getEntityId(mentor);
      const name = getEntityName(mentor);
      if (key && name) acc[key] = name;
      return acc;
    }, {});
  }, [mentors]);

  const menteeNameById = useMemo(() => {
    return sessions.reduce((acc, item) => {
      const key = getEntityId(item?.mentee);
      const name = getEntityName(item?.mentee);
      if (key && name) acc[key] = name;
      return acc;
    }, {});
  }, [sessions]);

  const allSessionRows = useMemo(() => {
    return [...sessions]
      .sort((left, right) => {
        const leftValue = new Date(left?.scheduled_start || left?.created_at || 0).getTime();
        const rightValue = new Date(right?.scheduled_start || right?.created_at || 0).getTime();
        return rightValue - leftValue;
      })
      .map((item) => {
        const recording = recordingsBySession[String(item.id)] || null;
        const recordingUrl = resolveMediaUrl(recording?.recording_url || recording?.recording_file || '');
        const mentorName = resolvePersonName(item?.mentor, mentorNameById, 'Mentor');
        const menteeName = resolvePersonName(item?.mentee, menteeNameById, 'Mentee');
        return {
          id: item.id,
          mentorName,
          menteeName,
          status: item.status || 'pending',
          scheduledStart: item.scheduled_start || item.created_at,
          recordingUrl,
        };
      });
  }, [menteeNameById, mentorNameById, recordingsBySession, sessions]);

  const mentorActivityRows = useMemo(() => {
    const map = {};
    sessions.forEach((item) => {
      const mentorId = String(
        typeof item?.mentor === 'object' ? item?.mentor?.id || '' : item?.mentor || ''
      );
      if (!mentorId) return;
      const mentorName = resolvePersonName(item?.mentor, mentorNameById, 'Mentor');
      if (!map[mentorId]) {
        map[mentorId] = { mentorId, mentorName, sessions: 0, completed: 0 };
      }
      map[mentorId].sessions += 1;
      if (String(item?.status || '').toLowerCase() === 'completed') {
        map[mentorId].completed += 1;
      }
    });
    return Object.values(map)
      .sort((left, right) => right.sessions - left.sessions)
      .slice(0, 6);
  }, [mentorNameById, sessions]);

  const recentSessionRows = useMemo(() => {
    return allSessionRows.slice(0, 10);
  }, [allSessionRows]);

  const completedSessionRows = useMemo(() => {
    return allSessionRows.filter((row) => String(row.status || '').toLowerCase() === 'completed');
  }, [allSessionRows]);

  const recordingRows = useMemo(() => {
    return allSessionRows.filter((row) => Boolean(row.recordingUrl));
  }, [allSessionRows]);

  const statCards = [
    {
      key: 'total_sessions',
      label: 'Total Sessions',
      value: summary.totalSessions,
      accent: 'from-[#2f80ed] to-[#56ccf2]',
      subtitle: 'All sessions in platform',
    },
    {
      key: 'completed_sessions',
      label: 'Completed Sessions',
      value: summary.completedSessions,
      accent: 'from-[#11998e] to-[#38ef7d]',
      subtitle: 'Sessions finished successfully',
    },
    {
      key: 'active_mentors',
      label: 'Active Mentors',
      value: summary.activeMentors || summary.totalMentors,
      accent: 'from-[#6a11cb] to-[#2575fc]',
      subtitle: 'Mentors with session activity',
    },
    {
      key: 'recordings',
      label: 'Recordings',
      value: summary.recordingsAvailable,
      accent: 'from-[#f46b45] to-[#eea849]',
      subtitle: 'Sessions with recording files',
    },
  ];

  const activeStatMeta = useMemo(() => {
    if (!activeStatKey) return null;
    const map = {
      total_sessions: {
        title: 'Total Session Details',
        count: allSessionRows.length,
        subtitle: 'Every session currently available in the system.',
      },
      completed_sessions: {
        title: 'Completed Session Details',
        count: completedSessionRows.length,
        subtitle: 'Only sessions marked as completed.',
      },
      active_mentors: {
        title: 'Active Mentor Breakdown',
        count: mentorActivityRows.length,
        subtitle: 'Mentor-wise session volume and completion quality.',
      },
      recordings: {
        title: 'Recording Library',
        count: recordingRows.length,
        subtitle: 'Sessions where a recording file or URL is present.',
      },
    };
    return map[activeStatKey] || null;
  }, [activeStatKey, allSessionRows.length, completedSessionRows.length, mentorActivityRows.length, recordingRows.length]);

  const openRecordingPreview = useCallback((row) => {
    if (!row?.recordingUrl) return;
    setRecordingPreview({
      url: row.recordingUrl,
      sessionId: row.id,
      mentorName: row.mentorName,
      menteeName: row.menteeName,
      scheduledStart: row.scheduledStart,
    });
  }, []);

  const closeRecordingPreview = useCallback(() => {
    setRecordingPreview(null);
  }, []);

  const openPreviewFullscreen = useCallback(() => {
    if (!recordingVideoRef.current?.requestFullscreen) return;
    recordingVideoRef.current.requestFullscreen();
  }, []);

  useEffect(() => {
    if (!activeStatKey && !recordingPreview) return undefined;
    const onKeyDown = (event) => {
      if (event.key !== 'Escape') return;
      if (recordingPreview) {
        closeRecordingPreview();
        return;
      }
      setActiveStatKey(null);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [activeStatKey, closeRecordingPreview, recordingPreview]);

  const completionPercent = summary.totalSessions
    ? Math.round((summary.completedSessions / summary.totalSessions) * 100)
    : 0;

  if (!isAdmin) {
    return <Navigate to="/admin" replace />;
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_#f4ebff,_#eef4ff_45%,_#f8fafc)] p-4 sm:p-6">
      <div className="mx-auto max-w-[1480px]">
        <div className="rounded-3xl border border-[#e5def2] bg-white/90 p-6 shadow-[0_18px_50px_rgba(61,37,99,0.14)] sm:p-8">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-[#f2e9ff] px-3 py-1 text-xs font-semibold text-[#5b2c91]">
                <Activity className="h-3.5 w-3.5" />
                Activity Intelligence
              </div>
              <h1 className="mt-3 text-3xl font-black tracking-tight text-[#1f2937] sm:text-4xl">
                Mentor and Mentee Activity
              </h1>
              <p className="mt-2 text-sm text-[#6b7280]">
                Unified visibility into sessions, mentor onboarding quality, and recordings.
              </p>
              <div className="mt-4">
                <Link
                  to="/admin"
                  className="inline-flex items-center gap-2 rounded-lg border border-[#d9caee] bg-white px-3 py-2 text-xs font-semibold text-[#5b2c91] transition-colors hover:bg-[#f7f2ff]"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back to Mentor Dashboard
                </Link>
              </div>
            </div>
            <button
              type="button"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#1f2937] px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#111827] disabled:opacity-60"
              onClick={loadActivity}
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh Data
            </button>
          </div>

          {error && (
            <div className="mt-6 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {error}
            </div>
          )}

          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {statCards.map((item) => (
              <button
                type="button"
                key={item.key}
                className="rounded-2xl border border-[#e7e2f2] bg-white p-4 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:border-[#cdbcf0] hover:shadow-md"
                onClick={() => setActiveStatKey(item.key)}
              >
                <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#6b7280]">{item.label}</p>
                <p className={`mt-2 bg-gradient-to-r ${item.accent} bg-clip-text text-3xl font-black text-transparent`}>
                  {item.value}
                </p>
                <p className="mt-1 text-xs text-[#7c6f90]">{item.subtitle}</p>
                <p className="mt-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-[#5b2c91]">
                  Click for full details
                </p>
              </button>
            ))}
          </div>

          <div className="mt-8 grid gap-6 xl:grid-cols-[1.05fr_1fr]">
            <div className="rounded-2xl border border-[#e7e2f2] bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-[#1f2937]">Session Completion Pulse</h2>
                <span className="text-xs text-[#6b7280]">Last loaded snapshot</span>
              </div>
              <div className="mt-5 grid grid-cols-[120px_1fr] items-center gap-5">
                <div
                  className="mx-auto grid h-28 w-28 place-items-center rounded-full"
                  style={{
                    background: `conic-gradient(#5b2c91 ${completionPercent * 3.6}deg, #e9def8 0deg)`,
                  }}
                >
                  <div className="grid h-20 w-20 place-items-center rounded-full bg-white text-center">
                    <p className="text-xl font-black text-[#1f2937]">{completionPercent}%</p>
                    <p className="text-[10px] uppercase tracking-[0.08em] text-[#6b7280]">Completed</p>
                  </div>
                </div>
                <div className="space-y-3">
                  {Object.entries(summary.sessionStatusCount)
                    .sort((left, right) => right[1] - left[1])
                    .map(([status, count]) => {
                      const maxValue = Math.max(...Object.values(summary.sessionStatusCount), 1);
                      const width = `${Math.max((count / maxValue) * 100, 8)}%`;
                      return (
                        <div key={status}>
                          <div className="mb-1 flex items-center justify-between text-xs">
                            <span className="font-semibold text-[#374151]">{toStatusLabel(status)}</span>
                            <span className="text-[#6b7280]">{count}</span>
                          </div>
                          <div className="h-2.5 rounded-full bg-[#f3eefb]">
                            <div
                              className="h-2.5 rounded-full bg-gradient-to-r from-[#5b2c91] to-[#9f6de1]"
                              style={{ width }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  {!Object.keys(summary.sessionStatusCount).length && (
                    <p className="text-sm text-[#9ca3af]">No session activity yet.</p>
                  )}
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-[#e7e2f2] bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-[#1f2937]">7-Day Session Trend</h2>
                <span className="text-xs text-[#6b7280]">Daily volume</span>
              </div>
              <div className="mt-5 flex h-44 items-end justify-between gap-2 rounded-xl bg-[#f8f5ff] p-4">
                {trendData.map((item) => (
                  <div key={item.key} className="flex flex-1 flex-col items-center gap-2">
                    <div className="text-[10px] font-semibold text-[#6b7280]">{item.value}</div>
                    <div className="flex h-28 w-full items-end">
                      <div
                        className="w-full rounded-t-md bg-gradient-to-t from-[#5b2c91] to-[#8f58dc]"
                        style={{ height: `${Math.max((item.value / maxTrendValue) * 100, item.value ? 10 : 2)}%` }}
                      />
                    </div>
                    <div className="text-[10px] font-semibold uppercase text-[#7c6f90]">{item.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-8 grid gap-6 xl:grid-cols-2">
            <div className="rounded-2xl border border-[#e7e2f2] bg-white p-5 shadow-sm">
              <h2 className="text-lg font-bold text-[#1f2937]">Top Mentor Activity</h2>
              <p className="mt-1 text-xs text-[#6b7280]">Most session-active mentors right now</p>
              <div className="mt-4 space-y-3">
                {mentorActivityRows.map((row, index) => {
                  const completion = row.sessions ? Math.round((row.completed / row.sessions) * 100) : 0;
                  return (
                    <div key={row.mentorId} className="rounded-xl border border-[#eee6fa] bg-[#fcfaff] p-3">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-semibold text-[#1f2937]">
                          {index + 1}. {row.mentorName}
                        </p>
                        <span className="text-xs font-semibold text-[#5b2c91]">{row.sessions} sessions</span>
                      </div>
                      <div className="mt-2 h-2 rounded-full bg-[#ece4fa]">
                        <div
                          className="h-2 rounded-full bg-gradient-to-r from-[#5b2c91] to-[#9f6de1]"
                          style={{ width: `${completion}%` }}
                        />
                      </div>
                      <p className="mt-1 text-[11px] text-[#6b7280]">{completion}% completion rate</p>
                    </div>
                  );
                })}
                {!mentorActivityRows.length && <p className="text-sm text-[#9ca3af]">No mentor activity available.</p>}
              </div>
            </div>

            <div className="rounded-2xl border border-[#e7e2f2] bg-white p-5 shadow-sm">
              <h2 className="text-lg font-bold text-[#1f2937]">Onboarding Readiness</h2>
              <p className="mt-1 text-xs text-[#6b7280]">How many mentors are production-ready for matching</p>
              <div className="mt-5 grid grid-cols-2 gap-4">
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.08em] text-emerald-700">Completed</p>
                  <p className="mt-2 text-3xl font-black text-emerald-700">{summary.completedMentors}</p>
                </div>
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.08em] text-amber-700">In Progress</p>
                  <p className="mt-2 text-3xl font-black text-amber-700">
                    {Math.max(summary.totalMentors - summary.completedMentors, 0)}
                  </p>
                </div>
              </div>
              <div className="mt-5 rounded-xl border border-[#ece4fa] bg-[#faf7ff] p-4 text-sm text-[#5a4d71]">
                <p className="font-semibold">Active Mentees</p>
                <p className="mt-1 text-2xl font-black text-[#2f2a38]">{summary.activeMentees}</p>
                <p className="mt-1 text-xs text-[#7a6b92]">
                  Based on sessions currently available in the system.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-8 rounded-2xl border border-[#e7e2f2] bg-white p-5 shadow-sm">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <h2 className="text-lg font-bold text-[#1f2937]">Recent Session and Recording Activity</h2>
              <div className="inline-flex items-center gap-2 rounded-full bg-[#eef2ff] px-3 py-1 text-xs font-semibold text-[#4338ca]">
                <Video className="h-3.5 w-3.5" />
                {summary.recordingsAvailable} recordings available
              </div>
            </div>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[900px] border-separate border-spacing-y-2">
                <thead>
                  <tr className="text-left text-xs uppercase tracking-[0.08em] text-[#6b7280]">
                    <th className="px-3 py-2">Session</th>
                    <th className="px-3 py-2">Mentor</th>
                    <th className="px-3 py-2">Mentee</th>
                    <th className="px-3 py-2">Date</th>
                    <th className="px-3 py-2">Status</th>
                    <th className="px-3 py-2">Recording</th>
                  </tr>
                </thead>
                <tbody>
                  {recentSessionRows.map((row) => (
                    <tr key={row.id} className="rounded-xl bg-[#faf9ff] text-sm text-[#1f2937]">
                      <td className="px-3 py-3 font-semibold">#{row.id}</td>
                      <td className="px-3 py-3">{row.mentorName}</td>
                      <td className="px-3 py-3">{row.menteeName}</td>
                      <td className="px-3 py-3">{toDisplayDate(row.scheduledStart)}</td>
                      <td className="px-3 py-3">
                        <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusColor(row.status)}`}>
                          {toStatusLabel(row.status)}
                        </span>
                      </td>
                      <td className="px-3 py-3">
                        {row.recordingUrl ? (
                          <button
                            type="button"
                            onClick={() => openRecordingPreview(row)}
                            className="inline-flex items-center gap-1 rounded-lg border border-[#d8ccf0] bg-white px-2.5 py-1 text-xs font-semibold text-[#5b2c91] hover:bg-[#f7f2ff]"
                          >
                            <PlayCircle className="h-3.5 w-3.5" />
                            See Recording
                          </button>
                        ) : (
                          <span className="text-xs text-[#9ca3af]">Not available</span>
                        )}
                      </td>
                    </tr>
                  ))}
                  {!recentSessionRows.length && (
                    <tr>
                      <td colSpan={6} className="px-3 py-10 text-center text-sm text-[#9ca3af]">
                        No session activity found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {loading && (
            <div className="mt-6 inline-flex items-center gap-2 rounded-lg bg-[#f3ecff] px-3 py-2 text-sm font-medium text-[#5b2c91]">
              <RefreshCw className="h-4 w-4 animate-spin" />
              Loading activity data...
            </div>
          )}

          {!loading && (
            <div className="mt-6 rounded-xl border border-[#e9e3f4] bg-[#fbf9ff] p-4 text-xs text-[#6b7280]">
              <div className="inline-flex items-center gap-2 font-semibold text-[#4b3b66]">
                <Users className="h-4 w-4" />
                Snapshot generated from mentor, onboarding, session and recording endpoints.
              </div>
            </div>
          )}
        </div>
      </div>

      {activeStatMeta && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#0f172ab3] p-4"
          onClick={() => setActiveStatKey(null)}
        >
          <div
            className="max-h-[90vh] w-full max-w-6xl overflow-hidden rounded-3xl border border-[#d8ccf0] bg-white shadow-[0_30px_80px_rgba(15,23,42,0.35)]"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4 border-b border-[#eee6fa] bg-[linear-gradient(135deg,#faf7ff,#f5f9ff)] p-5">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#6b7280]">Activity Insights</p>
                <h3 className="mt-1 text-2xl font-black text-[#1f2937]">{activeStatMeta.title}</h3>
                <p className="mt-1 text-sm text-[#6b7280]">{activeStatMeta.subtitle}</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="rounded-full border border-[#d8ccf0] bg-white px-3 py-1 text-sm font-semibold text-[#5b2c91]">
                  {activeStatMeta.count} records
                </div>
                <button
                  type="button"
                  onClick={() => setActiveStatKey(null)}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[#d8ccf0] bg-white text-[#5b2c91] transition-colors hover:bg-[#f7f2ff]"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="max-h-[72vh] overflow-y-auto p-5">
              {(activeStatKey === 'total_sessions' || activeStatKey === 'completed_sessions') && (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[860px] border-separate border-spacing-y-2">
                    <thead>
                      <tr className="text-left text-xs uppercase tracking-[0.08em] text-[#6b7280]">
                        <th className="px-3 py-2">Session</th>
                        <th className="px-3 py-2">Mentor</th>
                        <th className="px-3 py-2">Mentee</th>
                        <th className="px-3 py-2">Date</th>
                        <th className="px-3 py-2">Status</th>
                        <th className="px-3 py-2">Recording</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(activeStatKey === 'completed_sessions' ? completedSessionRows : allSessionRows).map((row) => (
                        <tr key={row.id} className="rounded-xl bg-[#faf9ff] text-sm text-[#1f2937]">
                          <td className="px-3 py-3 font-semibold">#{row.id}</td>
                          <td className="px-3 py-3">{row.mentorName}</td>
                          <td className="px-3 py-3">{row.menteeName}</td>
                          <td className="px-3 py-3">{toDisplayDate(row.scheduledStart)}</td>
                          <td className="px-3 py-3">
                            <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusColor(row.status)}`}>
                              {toStatusLabel(row.status)}
                            </span>
                          </td>
                          <td className="px-3 py-3">
                            <span className="text-xs font-semibold text-[#4f46e5]">
                              {row.recordingUrl ? 'Available' : 'Not available'}
                            </span>
                          </td>
                        </tr>
                      ))}
                      {!(activeStatKey === 'completed_sessions' ? completedSessionRows : allSessionRows).length && (
                        <tr>
                          <td colSpan={6} className="px-3 py-10 text-center text-sm text-[#9ca3af]">
                            No data available for this metric.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}

              {activeStatKey === 'active_mentors' && (
                <div className="grid gap-4 sm:grid-cols-2">
                  {mentorActivityRows.map((row, index) => {
                    const completion = row.sessions ? Math.round((row.completed / row.sessions) * 100) : 0;
                    return (
                      <div
                        key={row.mentorId}
                        className="rounded-2xl border border-[#e8e0f6] bg-[linear-gradient(145deg,#fcfaff,#f8f4ff)] p-4"
                      >
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-bold text-[#1f2937]">
                            {index + 1}. {row.mentorName}
                          </p>
                          <span className="rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-[#5b2c91]">
                            {row.sessions} sessions
                          </span>
                        </div>
                        <div className="mt-3 h-2.5 rounded-full bg-[#ece4fa]">
                          <div
                            className="h-2.5 rounded-full bg-gradient-to-r from-[#5b2c91] to-[#9f6de1]"
                            style={{ width: `${completion}%` }}
                          />
                        </div>
                        <div className="mt-2 flex items-center justify-between text-xs text-[#6b7280]">
                          <span>Completed: {row.completed}</span>
                          <span>{completion}% completion</span>
                        </div>
                      </div>
                    );
                  })}
                  {!mentorActivityRows.length && (
                    <p className="text-sm text-[#9ca3af]">No mentor activity available for this metric.</p>
                  )}
                </div>
              )}

              {activeStatKey === 'recordings' && (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[860px] border-separate border-spacing-y-2">
                    <thead>
                      <tr className="text-left text-xs uppercase tracking-[0.08em] text-[#6b7280]">
                        <th className="px-3 py-2">Session</th>
                        <th className="px-3 py-2">Mentor</th>
                        <th className="px-3 py-2">Mentee</th>
                        <th className="px-3 py-2">Date</th>
                        <th className="px-3 py-2">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recordingRows.map((row) => (
                        <tr key={row.id} className="rounded-xl bg-[#faf9ff] text-sm text-[#1f2937]">
                          <td className="px-3 py-3 font-semibold">#{row.id}</td>
                          <td className="px-3 py-3">{row.mentorName}</td>
                          <td className="px-3 py-3">{row.menteeName}</td>
                          <td className="px-3 py-3">{toDisplayDate(row.scheduledStart)}</td>
                          <td className="px-3 py-3">
                            <button
                              type="button"
                              onClick={() => openRecordingPreview(row)}
                              className="inline-flex items-center gap-1 rounded-lg border border-[#d8ccf0] bg-white px-2.5 py-1 text-xs font-semibold text-[#5b2c91] hover:bg-[#f7f2ff]"
                            >
                              <PlayCircle className="h-3.5 w-3.5" />
                              See Recording
                            </button>
                          </td>
                        </tr>
                      ))}
                      {!recordingRows.length && (
                        <tr>
                          <td colSpan={5} className="px-3 py-10 text-center text-sm text-[#9ca3af]">
                            No recordings available yet.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {recordingPreview && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-[#020617d9] p-3 sm:p-6"
          onClick={closeRecordingPreview}
        >
          <div
            className="w-full max-w-6xl overflow-hidden rounded-3xl border border-[#2d3748] bg-[#0f172a] shadow-[0_35px_90px_rgba(2,6,23,0.65)]"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex flex-col gap-3 border-b border-[#1f2a44] bg-[#111b32] p-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#94a3b8]">Session Recording</p>
                <h3 className="text-lg font-bold text-white">
                  Session #{recordingPreview.sessionId} | {recordingPreview.mentorName} to {recordingPreview.menteeName}
                </h3>
                <p className="text-xs text-[#93c5fd]">{toDisplayDate(recordingPreview.scheduledStart)}</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={openPreviewFullscreen}
                  className="inline-flex items-center gap-2 rounded-lg border border-[#334155] bg-[#0b1227] px-3 py-2 text-xs font-semibold text-[#cbd5e1] transition-colors hover:bg-[#1e293b]"
                >
                  <Maximize2 className="h-3.5 w-3.5" />
                  Full Size
                </button>
                <a
                  href={recordingPreview.url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 rounded-lg border border-[#334155] bg-[#0b1227] px-3 py-2 text-xs font-semibold text-[#cbd5e1] transition-colors hover:bg-[#1e293b]"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  New Tab
                </a>
                <button
                  type="button"
                  onClick={closeRecordingPreview}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[#334155] bg-[#0b1227] text-[#cbd5e1] transition-colors hover:bg-[#1e293b]"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="bg-black p-2 sm:p-4">
              <video
                ref={recordingVideoRef}
                src={recordingPreview.url}
                controls
                autoPlay
                playsInline
                className="h-[52vh] w-full rounded-xl bg-black object-contain sm:h-[70vh]"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminActivityPage;
