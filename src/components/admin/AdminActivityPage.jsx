import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import {
  Activity,
  AlertTriangle,
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

/* ───────── helpers ───────── */

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
    .replace(/\b\w/g, (c) => c.toUpperCase());

const toIncidentLabel = (value) =>
  String(value || 'unknown')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());

const alertBadgeClass = (severity) => {
  const value = String(severity || '').toLowerCase();
  if (value === 'high') return 'border-rose-500/40 bg-rose-500/15 text-rose-300';
  if (value === 'medium') return 'border-amber-500/40 bg-amber-500/15 text-amber-300';
  return 'border-slate-500/40 bg-slate-500/15 text-slate-300';
};

const statusColor = (status) => {
  const n = String(status || '').toLowerCase();
  if (n === 'completed' || n === 'verified')
    return 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30';
  if (n === 'in_review' || n === 'approved' || n === 'scheduled')
    return 'bg-amber-500/20 text-amber-400 border border-amber-500/30';
  if (n === 'rejected' || n === 'canceled' || n === 'no_show')
    return 'bg-rose-500/20 text-rose-400 border border-rose-500/30';
  return 'bg-slate-500/20 text-slate-400 border border-slate-500/30';
};

const getEntityName = (entity) => {
  if (entity && typeof entity === 'object') {
    if (entity.full_name) return String(entity.full_name);
    if (entity.name) return String(entity.name);
    const full = [entity.first_name, entity.last_name].filter(Boolean).join(' ').trim();
    if (full) return full;
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
  const direct = getEntityName(entity);
  if (direct) return direct;
  const id = getEntityId(entity);
  if (id && lookupMap?.[id]) return lookupMap[id];
  return `Unknown ${label}`;
};

const getSessionMenteeName = (session) => {
  const fromEntity = getEntityName(session?.mentee);
  if (fromEntity) return fromEntity;
  const fromFields = [session?.mentee_first_name, session?.mentee_last_name].filter(Boolean).join(' ').trim();
  if (fromFields) return fromFields;
  if (session?.mentee_name) return String(session.mentee_name);
  if (session?.mentee) return `Mentee #${session.mentee}`;
  return '';
};

const toDateKey = (value) => {
  const d = value ? new Date(value) : null;
  if (!d || Number.isNaN(d.getTime())) return '';
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const buildLast7Days = () => {
  const days = [];
  const today = new Date();
  for (let i = 6; i >= 0; i -= 1) {
    const copy = new Date(today);
    copy.setDate(today.getDate() - i);
    days.push({ key: toDateKey(copy), label: copy.toLocaleDateString([], { weekday: 'short' }), value: 0 });
  }
  return days;
};

/* ───────── component ───────── */

const AdminActivityPage = () => {
  const session = getAuthSession();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [mentors, setMentors] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [onboardingStatusMap, setOnboardingStatusMap] = useState({});
  const [recordingsBySession, setRecordingsBySession] = useState({});
  const [incidentsBySession, setIncidentsBySession] = useState({});
  const [realtimeAlerts, setRealtimeAlerts] = useState([]);
  const [terminateBusyId, setTerminateBusyId] = useState(null);
  const [terminateError, setTerminateError] = useState('');
  const [activeStatKey, setActiveStatKey] = useState(null);
  const [recordingPreview, setRecordingPreview] = useState(null);
  const recordingVideoRef = useRef(null);
  const lastIncidentIdBySessionRef = useRef({});
  const hasLoadedOnceRef = useRef(false);
  const alertTimerRef = useRef(null);

  const isAdmin = session?.role === 'admin';

  /* ── data fetching ── */
  const loadActivity = useCallback(async ({ silent = false } = {}) => {
    if (!isAdmin) return;
    if (!silent) {
      setLoading(true);
      setError('');
    }
    try {
      const [mentorRes, sessionRes, onboardingRes] = await Promise.all([
        mentorApi.getMentors(),
        mentorApi.listSessions(),
        mentorApi.listOnboardingStatuses(),
      ]);
      const mentorItems = normalizeList(mentorRes);
      const sessionItems = normalizeList(sessionRes);
      const onboardingItems = normalizeList(onboardingRes);

      const statusMap = onboardingItems.reduce((a, c) => {
        a[c.mentor] = c;
        return a;
      }, {});

      const recent = [...sessionItems]
        .sort((l, r) => new Date(r?.scheduled_start || r?.created_at || 0) - new Date(l?.scheduled_start || l?.created_at || 0))
        .slice(0, 24);

      const recEntries = await Promise.all(
        recent.map(async (s) => {
          try {
            const rec = await mentorApi.getSessionRecording(s.id);
            return [String(s.id), rec || null];
          } catch {
            return [String(s.id), null];
          }
        }),
      );

      const incidentEntries = await Promise.all(
        recent.map(async (s) => {
          try {
            const payload = await mentorApi.listSessionAbuseIncidents(s.id);
            return [String(s.id), normalizeList(payload)];
          } catch {
            return [String(s.id), []];
          }
        }),
      );

      const alerts = [];
      const nextIncidentMap = {};
      incidentEntries.forEach(([sessionId, incidents]) => {
        const rows = Array.isArray(incidents) ? incidents : [];
        let maxId = 0;
        rows.forEach((incident) => {
          const incidentId = Number(incident?.id || 0);
          if (incidentId > maxId) maxId = incidentId;
        });
        const lastSeen = Number(lastIncidentIdBySessionRef.current[sessionId] || 0);
        if (hasLoadedOnceRef.current && rows.length) {
          rows.forEach((incident) => {
            const incidentId = Number(incident?.id || 0);
            if (incidentId <= lastSeen) return;
            const speakerRole = String(incident?.speaker_role || 'unknown').toLowerCase();
            const incidentType = toIncidentLabel(incident?.incident_type || 'unknown');
            const severity = String(incident?.severity || 'low').toLowerCase();
            alerts.push({
              id: `${sessionId}-${incidentId}`,
              sessionId,
              speakerRole,
              incidentType,
              severity,
              createdAt: incident?.created_at || '',
            });
          });
        }
        nextIncidentMap[sessionId] = maxId;
      });

      if (alerts.length) {
        setRealtimeAlerts((prev) => {
          const next = [...alerts, ...prev].slice(0, 6);
          return next;
        });
        if (alertTimerRef.current) {
          window.clearTimeout(alertTimerRef.current);
        }
        alertTimerRef.current = window.setTimeout(() => {
          setRealtimeAlerts((prev) => prev.slice(0, 3));
        }, 8000);
      }
      lastIncidentIdBySessionRef.current = nextIncidentMap;

      setMentors(mentorItems);
      setSessions(sessionItems);
      setOnboardingStatusMap(statusMap);
      setRecordingsBySession(Object.fromEntries(recEntries));
      setIncidentsBySession(Object.fromEntries(incidentEntries));
    } catch (err) {
      if (!silent) {
        setError(err?.message || 'Unable to load activity data.');
      }
      setMentors([]);
      setSessions([]);
      setOnboardingStatusMap({});
      setRecordingsBySession({});
      setIncidentsBySession({});
    } finally {
      if (!silent) {
        setLoading(false);
      }
      if (!hasLoadedOnceRef.current) {
        hasLoadedOnceRef.current = true;
      }
    }
  }, [isAdmin]);

  useEffect(() => {
    loadActivity();
  }, [loadActivity]);

  useEffect(() => {
    if (!isAdmin) return undefined;
    const timer = window.setInterval(() => {
      loadActivity({ silent: true });
    }, 6000);
    return () => window.clearInterval(timer);
  }, [isAdmin, loadActivity]);

  useEffect(() => {
    return () => {
      if (alertTimerRef.current) {
        window.clearTimeout(alertTimerRef.current);
      }
    };
  }, []);

  const handleTerminateSessionById = useCallback(
    async (sessionId) => {
      if (!sessionId) return;
      const confirmText = `End session #${sessionId}? This will disconnect participants.`;
      if (!window.confirm(confirmText)) return;
      const reason =
        window.prompt('Reason for ending the session (optional):', 'Safety alert review') || '';
      setTerminateBusyId(sessionId);
      setTerminateError('');
      try {
        await mentorApi.terminateSession(sessionId, { reason });
        await loadActivity();
      } catch (err) {
        setTerminateError(err?.message || 'Unable to end the session.');
      } finally {
        setTerminateBusyId(null);
      }
    },
    [loadActivity],
  );

  /* ── derived data ── */
  const summary = useMemo(() => {
    const totalMentors = mentors.length;
    const menteeIds = new Set();
    const mentorIds = new Set();
    const statusCount = {};
    let completed = 0;

    sessions.forEach((s) => {
      const st = String(s?.status || 'pending').toLowerCase();
      statusCount[st] = (statusCount[st] || 0) + 1;
      if (st === 'completed') completed += 1;
      const mteId = getEntityId(s?.mentee);
      const mtrId = getEntityId(s?.mentor);
      if (mteId) menteeIds.add(mteId);
      if (mtrId) mentorIds.add(mtrId);
    });

    const recordings = Object.values(recordingsBySession).filter((r) =>
      Boolean(resolveMediaUrl(r?.recording_url || r?.recording_file || '')),
    ).length;

    const completedMentors = mentors.filter((m) => {
      const st = String(onboardingStatusMap[m.id]?.current_status || '').toLowerCase();
      return st === 'completed' || st === 'verified';
    }).length;

    return {
      totalMentors,
      totalSessions: sessions.length,
      completedSessions: completed,
      activeMentors: mentorIds.size,
      activeMentees: menteeIds.size,
      recordingsAvailable: recordings,
      completedMentors,
      sessionStatusCount: statusCount,
    };
  }, [mentors, onboardingStatusMap, recordingsBySession, sessions]);

  const trendData = useMemo(() => {
    const base = buildLast7Days();
    const byDay = Object.fromEntries(base.map((d) => [d.key, d]));
    sessions.forEach((s) => {
      const k = toDateKey(s?.scheduled_start || s?.created_at);
      if (byDay[k]) byDay[k].value += 1;
    });
    return base;
  }, [sessions]);

  const maxTrendValue = Math.max(...trendData.map((d) => d.value), 1);

  const mentorNameById = useMemo(
    () =>
      mentors.reduce((a, m) => {
        const k = getEntityId(m);
        const n = getEntityName(m);
        if (k && n) a[k] = n;
        return a;
      }, {}),
    [mentors],
  );

  const menteeNameById = useMemo(
    () =>
      sessions.reduce((a, s) => {
        const k = getEntityId(s?.mentee);
        const n = getSessionMenteeName(s);
        if (k && n) a[k] = n;
        return a;
      }, {}),
    [sessions],
  );

  const allSessionRows = useMemo(
    () =>
      [...sessions]
        .sort((l, r) => new Date(r?.scheduled_start || r?.created_at || 0) - new Date(l?.scheduled_start || l?.created_at || 0))
        .map((s) => {
          const rec = recordingsBySession[String(s.id)] || null;
          const incidents = Array.isArray(incidentsBySession[String(s.id)]) ? incidentsBySession[String(s.id)] : [];
          const mentorWarnings = incidents
            .filter((incident) => String(incident?.speaker_role || '').toLowerCase() === 'mentor')
            .map((incident) => {
              const incidentType = String(incident?.incident_type || '').toLowerCase();
              const severity = String(incident?.severity || 'low').toLowerCase();
              if (incidentType === 'verbal_abuse') {
                return `Mentor bad language (${severity})`;
              }
              return `Mentor video behavior (${toIncidentLabel(incidentType)} - ${severity})`;
            });
          const menteeWarnings = incidents
            .filter((incident) => String(incident?.speaker_role || '').toLowerCase() === 'mentee')
            .map((incident) => {
              const incidentType = String(incident?.incident_type || '').toLowerCase();
              const severity = String(incident?.severity || 'low').toLowerCase();
              if (incidentType === 'verbal_abuse') {
                return `Mentee bad language (${severity})`;
              }
              return `Mentee video behavior (${toIncidentLabel(incidentType)} - ${severity})`;
            });
          const warningSummary = [...mentorWarnings, ...menteeWarnings];
          const menteeName = getSessionMenteeName(s);
          return {
            id: s.id,
            mentorName: resolvePersonName(s?.mentor, mentorNameById, 'Mentor'),
            menteeName: menteeName || resolvePersonName(s?.mentee, menteeNameById, 'Mentee'),
            status: s.status || 'pending',
            scheduledStart: s.scheduled_start || s.created_at,
            recordingUrl: resolveMediaUrl(rec?.recording_url || rec?.recording_file || ''),
            warningSummary,
          };
        }),
    [incidentsBySession, menteeNameById, mentorNameById, recordingsBySession, sessions],
  );

  const mentorActivityRows = useMemo(() => {
    const map = {};
    sessions.forEach((s) => {
      const id = String(typeof s?.mentor === 'object' ? s?.mentor?.id || '' : s?.mentor || '');
      if (!id) return;
      if (!map[id]) map[id] = { mentorId: id, mentorName: resolvePersonName(s?.mentor, mentorNameById, 'Mentor'), sessions: 0, completed: 0 };
      map[id].sessions += 1;
      if (String(s?.status || '').toLowerCase() === 'completed') map[id].completed += 1;
    });
    return Object.values(map)
      .sort((l, r) => r.sessions - l.sessions)
      .slice(0, 6);
  }, [mentorNameById, sessions]);

  const recentSessionRows = useMemo(() => allSessionRows.slice(0, 10), [allSessionRows]);
  const completedSessionRows = useMemo(() => allSessionRows.filter((r) => String(r.status).toLowerCase() === 'completed'), [allSessionRows]);
  const recordingRows = useMemo(() => allSessionRows.filter((r) => Boolean(r.recordingUrl)), [allSessionRows]);

  const completionPercent = summary.totalSessions ? Math.round((summary.completedSessions / summary.totalSessions) * 100) : 0;

  /* ── stat cards ── */
  const statCards = [
    { key: 'total_sessions', label: 'Total Sessions', value: summary.totalSessions, accent: 'from-blue-400 to-cyan-400', icon: Activity, subtitle: 'All sessions in platform' },
    { key: 'completed_sessions', label: 'Completed', value: summary.completedSessions, accent: 'from-emerald-400 to-teal-400', icon: PlayCircle, subtitle: 'Successfully finished' },
    { key: 'active_mentors', label: 'Active Mentors', value: summary.activeMentors || summary.totalMentors, accent: 'from-violet-400 to-purple-400', icon: Users, subtitle: 'With session activity' },
    { key: 'recordings', label: 'Recordings', value: summary.recordingsAvailable, accent: 'from-orange-400 to-amber-400', icon: Video, subtitle: 'Available to review' },
  ];

  /* ── modal meta ── */
  const activeStatMeta = useMemo(() => {
    if (!activeStatKey) return null;
    const map = {
      total_sessions: { title: 'All Sessions', count: allSessionRows.length, subtitle: 'Every session in the system' },
      completed_sessions: { title: 'Completed Sessions', count: completedSessionRows.length, subtitle: 'Sessions marked as completed' },
      active_mentors: { title: 'Active Mentors', count: mentorActivityRows.length, subtitle: 'Mentor-wise session breakdown' },
      recordings: { title: 'Recording Library', count: recordingRows.length, subtitle: 'Sessions with available recordings' },
    };
    return map[activeStatKey] || null;
  }, [activeStatKey, allSessionRows.length, completedSessionRows.length, mentorActivityRows.length, recordingRows.length]);

  /* ── recording preview ── */
  const openRecordingPreview = useCallback((row) => {
    if (!row?.recordingUrl) return;
    setRecordingPreview({ url: row.recordingUrl, sessionId: row.id, mentorName: row.mentorName, menteeName: row.menteeName, scheduledStart: row.scheduledStart });
  }, []);
  const closeRecordingPreview = useCallback(() => setRecordingPreview(null), []);
  const openPreviewFullscreen = useCallback(() => {
    recordingVideoRef.current?.requestFullscreen?.();
  }, []);

  /* ── escape key ── */
  useEffect(() => {
    if (!activeStatKey && !recordingPreview) return undefined;
    const handler = (e) => {
      if (e.key !== 'Escape') return;
      if (recordingPreview) {
        closeRecordingPreview();
        return;
      }
      setActiveStatKey(null);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [activeStatKey, closeRecordingPreview, recordingPreview]);

  if (!isAdmin) return <Navigate to="/admin" replace />;

  /* ───────── session table (reusable) ───────── */
  const SessionTable = ({ rows }) => (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[860px] border-separate border-spacing-y-1.5">
          <thead>
            <tr className="text-left text-[11px] uppercase tracking-widest text-slate-500">
              <th className="px-4 py-2.5">Session</th>
              <th className="px-4 py-2.5">Mentor</th>
              <th className="px-4 py-2.5">Mentee</th>
              <th className="px-4 py-2.5">Date</th>
              <th className="px-4 py-2.5">Status</th>
              <th className="px-4 py-2.5">Alerts</th>
              <th className="px-4 py-2.5">Recording</th>
              <th className="px-4 py-2.5">Action</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="group rounded-xl bg-slate-800/50 text-sm transition-colors hover:bg-slate-700/60">
              <td className="rounded-l-xl px-4 py-3.5 font-bold text-white">#{row.id}</td>
              <td className="px-4 py-3.5 text-slate-300">{row.mentorName}</td>
              <td className="px-4 py-3.5 text-slate-300">{row.menteeName}</td>
              <td className="px-4 py-3.5 text-slate-400">{toDisplayDate(row.scheduledStart)}</td>
              <td className="px-4 py-3.5">
                <span className={`inline-block rounded-full px-2.5 py-1 text-xs font-semibold ${statusColor(row.status)}`}>
                  {toStatusLabel(row.status)}
                </span>
              </td>
                <td className="px-4 py-3.5">
                  {Array.isArray(row.warningSummary) && row.warningSummary.length ? (
                    <div className="flex flex-wrap items-center gap-1.5">
                      {row.warningSummary.slice(0, 2).map((label, idx) => (
                        <span
                          key={`${row.id}-warning-${idx}`}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-amber-500/35 bg-amber-500/12 px-2.5 py-1 text-[11px] font-semibold text-amber-300"
                        >
                          <AlertTriangle className="h-3.5 w-3.5" />
                          {label}
                        </span>
                      ))}
                      {row.warningSummary.length > 2 ? (
                        <span className="text-[11px] font-semibold text-slate-400">
                          +{row.warningSummary.length - 2} more
                        </span>
                      ) : null}
                    </div>
                  ) : (
                    <span className="text-xs text-slate-600">—</span>
                  )}
                </td>
                <td className="px-4 py-3.5">
                  {row.recordingUrl ? (
                  <button
                    type="button"
                    onClick={() => openRecordingPreview(row)}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-violet-500/40 bg-violet-500/10 px-3 py-1.5 text-xs font-semibold text-violet-400 transition-all hover:border-violet-400/60 hover:bg-violet-500/20 hover:text-violet-300"
                  >
                    <PlayCircle className="h-3.5 w-3.5" />
                      Watch
                    </button>
                  ) : (
                    <span className="text-xs text-slate-600">—</span>
                  )}
                </td>
                <td className="rounded-r-xl px-4 py-3.5">
                  {(() => {
                    const statusValue = String(row.status || '').toLowerCase();
                    const canTerminate = !['completed', 'canceled', 'no_show'].includes(statusValue);
                    const isBusy = terminateBusyId === row.id;
                    if (!canTerminate) return <span className="text-xs text-slate-600">—</span>;
                    return (
                      <button
                        type="button"
                        onClick={() => handleTerminateSessionById(row.id)}
                        disabled={isBusy}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-rose-500/40 bg-rose-500/10 px-3 py-1.5 text-xs font-semibold text-rose-300 transition-all hover:border-rose-400/70 hover:bg-rose-500/20 hover:text-rose-200 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {isBusy ? 'Ending...' : 'End Session'}
                      </button>
                    );
                  })()}
                </td>
              </tr>
            ))}
            {!rows.length && (
              <tr>
                <td colSpan={8} className="px-4 py-14 text-center text-sm text-slate-600">
                  No data available.
                </td>
              </tr>
            )}
          </tbody>
        </table>
    </div>
  );

  /* ───────── render ───────── */
  return (
    <>
      {realtimeAlerts.length ? (
        <div className="fixed right-4 top-4 z-[90] flex w-[92vw] max-w-sm flex-col gap-2">
          {realtimeAlerts.map((alert) => (
            <div
              key={alert.id}
              className={`rounded-xl border px-3 py-2 text-xs shadow-lg sm:text-sm ${alertBadgeClass(alert.severity)}`}
              role="status"
              aria-live="polite"
            >
              <div className="flex items-start gap-2">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                <div className="min-w-0">
                  <div className="font-semibold text-white/90">
                    Session #{alert.sessionId} alert
                  </div>
                  <div className="text-[11px] text-slate-200/90">
                    {String(alert.speakerRole || 'participant').replace(/\b\w/g, (c) =>
                      c.toUpperCase()
                    )}{' '}
                    {alert.incidentType} ({alert.severity})
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleTerminateSessionById(Number(alert.sessionId))}
                  disabled={terminateBusyId === Number(alert.sessionId)}
                  className="ml-auto inline-flex items-center rounded-md border border-rose-500/50 bg-rose-500/20 px-2 py-1 text-[10px] font-semibold text-rose-100 transition-colors hover:bg-rose-500/30 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {terminateBusyId === Number(alert.sessionId) ? 'Ending...' : 'End'}
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : null}
      <div className="min-h-screen bg-[#0b0f1a] bg-[radial-gradient(ellipse_80%_60%_at_50%_-20%,_#1e1b4b33,_transparent)] p-3 sm:p-6">
        <div className="mx-auto max-w-[1520px]">

        {/* ── page card ── */}
        <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-5 shadow-2xl backdrop-blur-sm sm:p-8">

          {/* ── header ── */}
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-violet-500/15 px-3.5 py-1.5 text-xs font-bold tracking-wide text-violet-400">
                <Activity className="h-3.5 w-3.5" />
                Activity Intelligence
              </div>
              <h1 className="mt-4 text-3xl font-black tracking-tight text-white sm:text-4xl">
                Mentor &amp; Mentee Activity
              </h1>
              <p className="mt-2 max-w-lg text-sm leading-relaxed text-slate-400">
                Unified visibility into sessions, mentor onboarding quality, and recordings across the platform.
              </p>
              <div className="mt-5">
                <Link
                  to="/admin"
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-800/60 px-4 py-2.5 text-xs font-semibold text-slate-300 transition-all hover:border-slate-600 hover:bg-slate-800 hover:text-white"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back to Dashboard
                </Link>
              </div>
            </div>
            <button
              type="button"
              onClick={loadActivity}
              disabled={loading}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-violet-500/25 transition-all hover:from-violet-500 hover:to-indigo-500 hover:shadow-violet-500/40 disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh Data
            </button>
          </div>

          {/* ── error ── */}
            {error && (
              <div className="mt-6 rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm font-medium text-rose-400">
                {error}
              </div>
            )}
            {terminateError && (
              <div className="mt-4 rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm font-medium text-rose-400">
                {terminateError}
              </div>
            )}

          {/* ── stat cards ── */}
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {statCards.map((card) => {
              const Icon = card.icon;
              return (
                <button
                  type="button"
                  key={card.key}
                  onClick={() => setActiveStatKey(card.key)}
                  className="group relative overflow-hidden rounded-2xl border border-slate-800 bg-slate-800/40 p-5 text-left transition-all hover:-translate-y-1 hover:border-slate-700 hover:bg-slate-800/70 hover:shadow-xl hover:shadow-black/30"
                >
                  {/* glow accent */}
                  <div className={`absolute -right-4 -top-4 h-24 w-24 rounded-full bg-gradient-to-br ${card.accent} opacity-10 blur-2xl transition-opacity group-hover:opacity-20`} />

                  <div className="relative">
                    <div className="flex items-center justify-between">
                      <p className="text-[11px] font-bold uppercase tracking-widest text-slate-500">
                        {card.label}
                      </p>
                      <div className={`rounded-lg bg-gradient-to-br ${card.accent} p-2`}>
                        <Icon className="h-4 w-4 text-white" />
                      </div>
                    </div>
                    <p className={`mt-3 bg-gradient-to-r ${card.accent} bg-clip-text text-4xl font-black text-transparent`}>
                      {card.value}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">{card.subtitle}</p>
                    <p className="mt-4 text-[10px] font-bold uppercase tracking-widest text-violet-500 transition-colors group-hover:text-violet-400">
                      View details →
                    </p>
                  </div>
                </button>
              );
            })}
          </div>

          {/* ── charts row ── */}
          <div className="mt-8 grid gap-6 xl:grid-cols-[1.05fr_1fr]">

            {/* completion pulse */}
            <div className="rounded-2xl border border-slate-800 bg-slate-800/40 p-5">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-white">Session Completion</h2>
                <span className="text-[11px] font-semibold uppercase tracking-widest text-slate-600">Live snapshot</span>
              </div>
              <div className="mt-6 grid grid-cols-[120px_1fr] items-center gap-6">
                {/* donut */}
                <div
                  className="mx-auto grid h-28 w-28 place-items-center rounded-full shadow-lg shadow-violet-500/10"
                  style={{ background: `conic-gradient(#7c3aed ${completionPercent * 3.6}deg, #1e1b4b44 0deg)` }}
                >
                  <div className="grid h-20 w-20 place-items-center rounded-full bg-slate-900 text-center">
                    <p className="text-2xl font-black text-white">{completionPercent}%</p>
                    <p className="text-[9px] font-bold uppercase tracking-widest text-slate-500">Done</p>
                  </div>
                </div>
                {/* bars */}
                <div className="space-y-3">
                  {Object.entries(summary.sessionStatusCount)
                    .sort((a, b) => b[1] - a[1])
                    .map(([status, count]) => {
                      const maxVal = Math.max(...Object.values(summary.sessionStatusCount), 1);
                      const w = `${Math.max((count / maxVal) * 100, 8)}%`;
                      return (
                        <div key={status}>
                          <div className="mb-1 flex items-center justify-between text-xs">
                            <span className="font-semibold text-slate-300">{toStatusLabel(status)}</span>
                            <span className="font-bold text-slate-500">{count}</span>
                          </div>
                          <div className="h-2 rounded-full bg-slate-700/50">
                            <div className="h-2 rounded-full bg-gradient-to-r from-violet-600 to-purple-500" style={{ width: w }} />
                          </div>
                        </div>
                      );
                    })}
                  {!Object.keys(summary.sessionStatusCount).length && (
                    <p className="text-sm text-slate-600">No session activity yet.</p>
                  )}
                </div>
              </div>
            </div>

            {/* 7-day trend */}
            <div className="rounded-2xl border border-slate-800 bg-slate-800/40 p-5">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-white">7-Day Trend</h2>
                <span className="text-[11px] font-semibold uppercase tracking-widest text-slate-600">Daily volume</span>
              </div>
              <div className="mt-6 flex h-48 items-end justify-between gap-2 rounded-xl bg-slate-900/60 p-4">
                {trendData.map((d) => (
                  <div key={d.key} className="flex flex-1 flex-col items-center gap-2">
                    <span className="text-[11px] font-bold text-slate-400">{d.value}</span>
                    <div className="flex h-32 w-full items-end">
                      <div
                        className="w-full rounded-t-lg bg-gradient-to-t from-violet-600 to-purple-400 shadow-sm shadow-violet-500/20 transition-all hover:from-violet-500 hover:to-purple-300"
                        style={{ height: `${Math.max((d.value / maxTrendValue) * 100, d.value ? 12 : 3)}%` }}
                      />
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{d.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ── middle row ── */}
          <div className="mt-8 grid gap-6 xl:grid-cols-2">

            {/* top mentors */}
            <div className="rounded-2xl border border-slate-800 bg-slate-800/40 p-5">
              <h2 className="text-lg font-bold text-white">Top Mentor Activity</h2>
              <p className="mt-1 text-xs text-slate-500">Most session-active mentors</p>
              <div className="mt-5 space-y-3">
                {mentorActivityRows.map((row, i) => {
                  const pct = row.sessions ? Math.round((row.completed / row.sessions) * 100) : 0;
                  return (
                    <div key={row.mentorId} className="rounded-xl border border-slate-700/50 bg-slate-900/50 p-4 transition-colors hover:border-slate-700">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-bold text-white">
                          <span className="mr-2 text-violet-500">#{i + 1}</span>
                          {row.mentorName}
                        </p>
                        <span className="rounded-full bg-violet-500/15 px-2.5 py-1 text-[11px] font-bold text-violet-400">
                          {row.sessions} sessions
                        </span>
                      </div>
                      <div className="mt-3 h-2 rounded-full bg-slate-700/50">
                        <div
                          className="h-2 rounded-full bg-gradient-to-r from-violet-600 to-fuchsia-500"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <p className="mt-2 text-[11px] text-slate-500">
                        <span className="text-slate-400">{row.completed}</span> completed · {pct}% rate
                      </p>
                    </div>
                  );
                })}
                {!mentorActivityRows.length && <p className="py-6 text-center text-sm text-slate-600">No mentor activity.</p>}
              </div>
            </div>

            {/* onboarding */}
            <div className="rounded-2xl border border-slate-800 bg-slate-800/40 p-5">
              <h2 className="text-lg font-bold text-white">Onboarding Readiness</h2>
              <p className="mt-1 text-xs text-slate-500">Mentor production readiness</p>
              <div className="mt-5 grid grid-cols-2 gap-4">
                <div className="rounded-xl border border-emerald-500/25 bg-emerald-500/10 p-5">
                  <p className="text-[11px] font-bold uppercase tracking-widest text-emerald-500">Completed</p>
                  <p className="mt-3 text-4xl font-black text-emerald-400">{summary.completedMentors}</p>
                </div>
                <div className="rounded-xl border border-amber-500/25 bg-amber-500/10 p-5">
                  <p className="text-[11px] font-bold uppercase tracking-widest text-amber-500">In Progress</p>
                  <p className="mt-3 text-4xl font-black text-amber-400">
                    {Math.max(summary.totalMentors - summary.completedMentors, 0)}
                  </p>
                </div>
              </div>
              <div className="mt-5 rounded-xl border border-slate-700/50 bg-slate-900/50 p-5">
                <p className="text-[11px] font-bold uppercase tracking-widest text-slate-500">Active Mentees</p>
                <p className="mt-2 text-3xl font-black text-white">{summary.activeMentees}</p>
                <p className="mt-2 text-xs text-slate-500">Based on current session activity</p>
              </div>
            </div>
          </div>

          {/* ── recent sessions table ── */}
          <div className="mt-8 rounded-2xl border border-slate-800 bg-slate-800/40 p-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <h2 className="text-lg font-bold text-white">Recent Sessions &amp; Recordings</h2>
              <div className="inline-flex items-center gap-2 rounded-full bg-violet-500/15 px-3 py-1.5 text-xs font-bold text-violet-400">
                <Video className="h-3.5 w-3.5" />
                {summary.recordingsAvailable} recordings
              </div>
            </div>
            <div className="mt-5">
              <SessionTable rows={recentSessionRows} />
            </div>
          </div>

          {/* ── footer loading / info ── */}
          {loading && (
            <div className="mt-6 inline-flex items-center gap-2 rounded-xl bg-violet-500/10 px-4 py-2.5 text-sm font-semibold text-violet-400">
              <RefreshCw className="h-4 w-4 animate-spin" />
              Loading activity data…
            </div>
          )}
          {!loading && (
            <div className="mt-6 rounded-xl border border-slate-800 bg-slate-800/30 p-4">
              <div className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500">
                <Users className="h-4 w-4 text-slate-600" />
                Snapshot generated from mentor, onboarding, session and recording endpoints.
              </div>
            </div>
          )}
        </div>
      </div>

      </div>
      {/* ───────── STAT DETAIL MODAL ───────── */}
      {activeStatMeta && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-3 backdrop-blur-sm" onClick={() => setActiveStatKey(null)}>
          <div
            className="max-h-[92vh] w-full max-w-6xl overflow-hidden rounded-3xl border border-slate-700 bg-slate-900 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* header */}
            <div className="flex items-start justify-between gap-4 border-b border-slate-800 bg-slate-900 p-5">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-widest text-slate-500">Activity Insights</p>
                <h3 className="mt-1 text-2xl font-black text-white">{activeStatMeta.title}</h3>
                <p className="mt-1 text-sm text-slate-400">{activeStatMeta.subtitle}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="rounded-full bg-violet-500/15 px-3 py-1.5 text-sm font-bold text-violet-400">
                  {activeStatMeta.count} records
                </span>
                <button
                  type="button"
                  onClick={() => setActiveStatKey(null)}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-700 bg-slate-800 text-slate-400 transition-colors hover:bg-slate-700 hover:text-white"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* body */}
            <div className="max-h-[72vh] overflow-y-auto p-5">
              {(activeStatKey === 'total_sessions' || activeStatKey === 'completed_sessions') && (
                <SessionTable rows={activeStatKey === 'completed_sessions' ? completedSessionRows : allSessionRows} />
              )}

              {activeStatKey === 'active_mentors' && (
                <div className="grid gap-4 sm:grid-cols-2">
                  {mentorActivityRows.map((row, i) => {
                    const pct = row.sessions ? Math.round((row.completed / row.sessions) * 100) : 0;
                    return (
                      <div key={row.mentorId} className="rounded-2xl border border-slate-700 bg-slate-800/60 p-5">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-bold text-white">
                            <span className="mr-2 text-violet-500">#{i + 1}</span>
                            {row.mentorName}
                          </p>
                          <span className="rounded-full bg-violet-500/15 px-2.5 py-1 text-xs font-bold text-violet-400">
                            {row.sessions} sessions
                          </span>
                        </div>
                        <div className="mt-4 h-2.5 rounded-full bg-slate-700">
                          <div className="h-2.5 rounded-full bg-gradient-to-r from-violet-600 to-fuchsia-500" style={{ width: `${pct}%` }} />
                        </div>
                        <div className="mt-2 flex justify-between text-xs text-slate-500">
                          <span>Completed: <span className="text-slate-300">{row.completed}</span></span>
                          <span className="text-violet-400">{pct}%</span>
                        </div>
                      </div>
                    );
                  })}
                  {!mentorActivityRows.length && <p className="py-8 text-center text-sm text-slate-600">No mentor activity.</p>}
                </div>
              )}

              {activeStatKey === 'recordings' && (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[860px] border-separate border-spacing-y-1.5">
                    <thead>
                      <tr className="text-left text-[11px] uppercase tracking-widest text-slate-500">
                        <th className="px-4 py-2.5">Session</th>
                        <th className="px-4 py-2.5">Mentor</th>
                        <th className="px-4 py-2.5">Mentee</th>
                        <th className="px-4 py-2.5">Date</th>
                        <th className="px-4 py-2.5">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recordingRows.map((row) => (
                        <tr key={row.id} className="group rounded-xl bg-slate-800/50 text-sm transition-colors hover:bg-slate-700/60">
                          <td className="rounded-l-xl px-4 py-3.5 font-bold text-white">#{row.id}</td>
                          <td className="px-4 py-3.5 text-slate-300">{row.mentorName}</td>
                          <td className="px-4 py-3.5 text-slate-300">{row.menteeName}</td>
                          <td className="px-4 py-3.5 text-slate-400">{toDisplayDate(row.scheduledStart)}</td>
                          <td className="rounded-r-xl px-4 py-3.5">
                            <button
                              type="button"
                              onClick={() => openRecordingPreview(row)}
                              className="inline-flex items-center gap-1.5 rounded-lg border border-violet-500/40 bg-violet-500/10 px-3 py-1.5 text-xs font-semibold text-violet-400 hover:bg-violet-500/20"
                            >
                              <PlayCircle className="h-3.5 w-3.5" />
                              Watch
                            </button>
                          </td>
                        </tr>
                      ))}
                      {!recordingRows.length && (
                        <tr>
                          <td colSpan={5} className="px-4 py-14 text-center text-sm text-slate-600">
                            No recordings available.
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

      {/* ───────── RECORDING PREVIEW MODAL ───────── */}
      {recordingPreview && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 p-3 backdrop-blur-sm sm:p-6" onClick={closeRecordingPreview}>
          <div
            className="w-full max-w-6xl overflow-hidden rounded-3xl border border-slate-700 bg-[#0a0e1a] shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex flex-col gap-3 border-b border-slate-800 bg-[#0d1224] p-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-widest text-slate-500">Session Recording</p>
                <h3 className="mt-1 text-lg font-bold text-white">
                  Session #{recordingPreview.sessionId}
                  <span className="mx-2 text-slate-600">·</span>
                  <span className="text-slate-300">{recordingPreview.mentorName}</span>
                  <span className="mx-1 text-slate-600">→</span>
                  <span className="text-slate-300">{recordingPreview.menteeName}</span>
                </h3>
                <p className="mt-1 text-xs text-cyan-400">{toDisplayDate(recordingPreview.scheduledStart)}</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={openPreviewFullscreen}
                  className="inline-flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-700 hover:text-white"
                >
                  <Maximize2 className="h-3.5 w-3.5" />
                  Fullscreen
                </button>
                <a
                  href={recordingPreview.url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-700 hover:text-white"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  New Tab
                </a>
                <button
                  type="button"
                  onClick={closeRecordingPreview}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-700 bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white"
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
    </>
  );
};

export default AdminActivityPage;
