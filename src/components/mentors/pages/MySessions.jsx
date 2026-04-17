import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, ChevronDown, Calendar, Table, Clock, Video, ArrowRight, Filter, X } from 'lucide-react';
import { mentorApi } from '../../../apis/api/mentorApi';
import { useMentorData } from '../../../apis/apihook/useMentorData';
import { setSelectedSessionId } from '../../../apis/api/storage';
import {
  addDaysToDateKey,
  diffDateKeys,
  formatIndiaDateKey,
  getIndiaTimeLabel,
  getIndiaWeekStartKey,
  indiaDateKeyToLabel,
  parseDateKey,
} from '../../../utils/indiaTime';

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

const hours = [
  '08:00 AM',
  '09:00 AM',
  '10:00 AM',
  '11:00 AM',
  '12:00 PM',
  '01:00 PM',
  '02:00 PM',
  '03:00 PM',
  '04:00 PM',
  '05:00 PM',
  '06:00 PM',
  '07:00 PM',
];

const dayLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const normalizeList = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.results)) return payload.results;
  return [];
};

const parseHourLabel = (label) => {
  const [time, meridiem] = label.split(' ');
  const [hour] = time.split(':').map((val) => Number(val));
  if (Number.isNaN(hour)) return 0;
  if (meridiem === 'PM' && hour !== 12) return hour + 12;
  if (meridiem === 'AM' && hour === 12) return 0;
  return hour;
};

const formatTimeRange = (startValue, endValue) => {
  const startLabel = getIndiaTimeLabel(startValue, { hour12: true });
  const endLabel = getIndiaTimeLabel(endValue, { hour12: true });
  if (!startLabel || !endLabel) return 'Time TBD';
  return `${startLabel} - ${endLabel}`;
};

const formatDateLabel = (value) => {
  const dateKey = formatIndiaDateKey(value);
  if (!dateKey) return 'Date TBD';
  return indiaDateKeyToLabel(dateKey, { month: 'short', day: 'numeric', year: 'numeric' });
};

const getIndiaHour = (value) => {
  const label = getIndiaTimeLabel(value, { hour12: false });
  const [hour] = String(label || '').split(':');
  const numericHour = Number(hour);
  return Number.isNaN(numericHour) ? -1 : numericHour;
};

const getMenteeName = (session) => {
  const profileFromSession =
    typeof session?.mentee === 'object' && session?.mentee
      ? [session?.mentee?.first_name, session?.mentee?.last_name].filter(Boolean).join(' ').trim()
      : '';
  const fullName = [
    session?.mentee_first_name,
    session?.mentee_last_name,
  ]
    .filter(Boolean)
    .join(' ')
    .trim();
  if (fullName) return fullName;
  if (profileFromSession) return profileFromSession;
  if (session?.mentee_name) return session.mentee_name;
  if (typeof session?.mentee === 'number' || typeof session?.mentee === 'string') {
    return `Mentee #${session.mentee}`;
  }
  return 'Mentee';
};

const hasConcreteMenteeName = (session) => {
  const label = getMenteeName(session);
  if (!label) return false;
  if (label === 'Mentee') return false;
  if (/^Mentee #/i.test(label)) return false;
  return true;
};

const getMenteeAvatar = (session) =>
  resolveMediaUrl(session?.mentee_avatar || session?.mentee?.avatar || '');

const isUpcomingStatus = (session) => {
  const start = new Date(session?.scheduled_start || '');
  const status = session?.status || '';
  return ['requested', 'approved', 'scheduled'].includes(status) && start >= new Date();
};

const isPastSession = (session) => {
  const end = new Date(session?.scheduled_end || session?.scheduled_start || '');
  if (Number.isNaN(end.getTime())) return false;
  return end < new Date();
};

const isConnectionClosed = (session) => {
  const candidates = [
    session?.connection_status,
    session?.connectionStatus,
    session?.connection_state,
    session?.connectionState,
    session?.meeting_connection_status,
    session?.meeting_status,
    session?.meetingStatus,
  ];
  return candidates.some((value) => String(value || '').trim().toLowerCase() === 'closed');
};

const isJoinableStatus = (session) => {
  const status = String(session?.status || '').trim().toLowerCase();
  return ['approved', 'scheduled'].includes(status);
};

const canJoinSession = (session) =>
  isJoinableStatus(session) && !isPastSession(session) && !isConnectionClosed(session);

const getJoinUnavailableLabel = (session) => {
  if (isConnectionClosed(session)) return 'Session Closed';
  if (isPastSession(session)) return 'Session Ended';
  const status = String(session?.status || '').trim().toLowerCase();
  if (status === 'requested') return 'Awaiting Approval';
  if (status === 'canceled') return 'Session Canceled';
  if (status === 'no_show') return 'No Show';
  return 'Not Joinable';
};

const parseDateMs = (value) => {
  const parsed = new Date(value || '');
  const millis = parsed.getTime();
  return Number.isNaN(millis) ? null : millis;
};

const formatStartedAtLabel = (value) => {
  const dateLabel = formatDateLabel(value);
  const timeLabel = getIndiaTimeLabel(value, { hour12: true });
  if ((!dateLabel || dateLabel === 'Date TBD') && !timeLabel) return '';
  if (!dateLabel || dateLabel === 'Date TBD') return timeLabel || '';
  if (!timeLabel) return dateLabel;
  return `${dateLabel} at ${timeLabel}`;
};

const isMenteeStartedSession = (session) => {
  const status = String(session?.status || '').toLowerCase();
  if (!['approved', 'scheduled'].includes(status)) return false;
  if (isConnectionClosed(session)) return false;
  const menteeJoinedAtMs = parseDateMs(session?.mentee_joined_at);
  if (!menteeJoinedAtMs) return false;

  const nowMs = Date.now();
  const scheduledStartMs = parseDateMs(session?.scheduled_start);
  let scheduledEndMs = parseDateMs(session?.scheduled_end);

  if (!scheduledEndMs && scheduledStartMs) {
    const minutes = Number(session?.duration_minutes || 45);
    scheduledEndMs = scheduledStartMs + Math.max(15, minutes) * 60 * 1000;
  }

  if (!scheduledStartMs || !scheduledEndMs) {
    return !isPastSession(session) && nowMs - menteeJoinedAtMs <= 2 * 60 * 60 * 1000;
  }

  const earlyJoinWindowMs = 15 * 60 * 1000;
  const lateJoinWindowMs = 60 * 60 * 1000;
  const inCurrentWindow =
    nowMs >= scheduledStartMs - earlyJoinWindowMs && nowMs <= scheduledEndMs + lateJoinWindowMs;
  if (!inCurrentWindow) return false;

  const inJoinTimestampWindow =
    menteeJoinedAtMs >= scheduledStartMs - earlyJoinWindowMs &&
    menteeJoinedAtMs <= scheduledEndMs + lateJoinWindowMs &&
    menteeJoinedAtMs <= nowMs + 60 * 1000;

  return inJoinTimestampWindow;
};

const MySessions = () => {
  const isMobileInit = typeof window !== 'undefined' && window.innerWidth < 640;
  const [view, setView] = useState(isMobileInit ? 'table' : 'calendar');
  const navigate = useNavigate();
  const { mentor } = useMentorData();
  const [sessions, setSessions] = useState([]);
  const [dispositionSessionIds, setDispositionSessionIds] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [joinError, setJoinError] = useState('');
  const [joiningId, setJoiningId] = useState(null);
  const [meetingInvite, setMeetingInvite] = useState(null);
  const pollingRef = useRef(null);
  const menteeStartedBySessionRef = useRef({});
  const joinedMeetingSessionIdsRef = useRef(new Set());
  const [filterOpen, setFilterOpen] = useState(false);
  const [weekFilterOpen, setWeekFilterOpen] = useState(false);
  const [weekFilterValue, setWeekFilterValue] = useState('This Week');
  const [filterValue, setFilterValue] = useState('All Types');
  const [searchValue, setSearchValue] = useState('');
  const filterOptions = ['All Types', 'Upcoming', 'Completed'];
  const weekFilterOptions = ['This Week', 'All Time'];
  const weekStartKey = useMemo(() => getIndiaWeekStartKey(new Date()), []);
  const weekEndKey = useMemo(() => addDaysToDateKey(weekStartKey, 7), [weekStartKey]);
  const days = useMemo(
    () =>
      dayLabels.map((label, index) => {
        const dateKey = addDaysToDateKey(weekStartKey, index);
        const parts = parseDateKey(dateKey);
        return {
          label,
          dateKey,
          dayNumber: parts?.day || 0,
          active: formatIndiaDateKey(new Date()) === dateKey,
        };
      }),
    [weekStartKey]
  );

  useEffect(() => {
    let cancelled = false;
    if (!mentor?.id) {
      setLoading(false);
      setMeetingInvite(null);
      return undefined;
    }

    const updateMenteeStartSignals = (sessionItems) => {
      const next = {};
      let latestInvite = null;

      sessionItems.forEach((session) => {
        const sessionId = String(session?.id || '');
        if (!sessionId) return;
        const startedAt = String(session?.mentee_joined_at || '');
        next[sessionId] = startedAt;

        const alreadyJoined = joinedMeetingSessionIdsRef.current.has(sessionId);
        if (!alreadyJoined && startedAt && isMenteeStartedSession(session)) {
          if (
            !latestInvite ||
            new Date(startedAt).getTime() > new Date(latestInvite.mentee_joined_at || 0).getTime()
          ) {
            latestInvite = session;
          }
        }
      });

      menteeStartedBySessionRef.current = next;
      if (latestInvite) {
        setMeetingInvite(latestInvite);
      } else {
        setMeetingInvite(null);
      }
    };

    const loadSessions = async () => {
      setLoading(true);
      setError('');
      try {
        const [sessionResponse, dispositionResponse] = await Promise.all([
          mentorApi.listSessions({ mentor_id: mentor.id }),
          mentorApi.listSessionDispositions({ mentor_id: mentor.id }),
        ]);
        const list = normalizeList(sessionResponse);
        const dispositions = normalizeList(dispositionResponse);
        if (!cancelled) {
          setSessions(list);
          updateMenteeStartSignals(list);
          const nextDispositionSessionIds = new Set(
            dispositions
              .map((item) => Number(item?.session || 0))
              .filter((value) => Number.isFinite(value) && value > 0)
          );
          setDispositionSessionIds(nextDispositionSessionIds);
        }
        const sessionsMissingName = list.filter((session) => !hasConcreteMenteeName(session));
        if (!sessionsMissingName.length || cancelled) {
          return;
        }
        const results = await Promise.all(
          sessionsMissingName.map(async (session) => {
            try {
              const profile = await mentorApi.getMenteeProfileBySession(session.id);
              const fullName = [profile?.first_name, profile?.last_name].filter(Boolean).join(' ').trim();
              const avatar = profile?.avatar || '';
              if (!fullName && !avatar) return null;
              return [session.id, fullName, avatar];
            } catch {
              return null;
            }
          })
        );
        if (!cancelled) {
          const nextSessionDataMap = {};
          results.forEach((entry) => {
            if (!entry) return;
            const [sessionId, fullName, avatar] = entry;
            if (!sessionId) return;
            nextSessionDataMap[sessionId] = {
              fullName: fullName || '',
              avatar: avatar || '',
            };
          });
          if (Object.keys(nextSessionDataMap).length) {
            setSessions((prev) =>
              prev.map((item) =>
                nextSessionDataMap[item.id]
                  ? {
                      ...item,
                      mentee_name: nextSessionDataMap[item.id].fullName || item.mentee_name,
                      mentee_avatar: nextSessionDataMap[item.id].avatar || item.mentee_avatar,
                    }
                  : item
              )
            );
          }
        }
      } catch (err) {
        if (!cancelled) setError(err?.message || 'Unable to load sessions.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    const pollSessions = async () => {
      try {
        const sessionResponse = await mentorApi.listSessions({ mentor_id: mentor.id });
        if (cancelled) return;
        const list = normalizeList(sessionResponse);
        setSessions(list);
        updateMenteeStartSignals(list);
      } catch {
        // no-op for silent polling
      }
    };

    loadSessions();
    pollingRef.current = window.setInterval(pollSessions, 5000);
    return () => {
      cancelled = true;
      if (pollingRef.current) {
        window.clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
    };
  }, [mentor?.id]);

  const needsCompletionSelection = useCallback((session) => {
    const status = String(session?.status || '').trim().toLowerCase();
    if (status !== 'completed') return false;
    const sessionId = Number(session?.id || 0);
    if (!sessionId) return false;
    return !dispositionSessionIds.has(sessionId);
  }, [dispositionSessionIds]);

  const filteredSessions = useMemo(() => {
    return sessions.filter((session) => {
      if (filterValue === 'Upcoming') {
        if (!isUpcomingStatus(session)) return false;
      }
      if (filterValue === 'Completed') {
        if (session.status !== 'completed') return false;
      }
      if (weekFilterValue === 'This Week') {
        const sessionDateKey = formatIndiaDateKey(session?.scheduled_start);
        if (!sessionDateKey || sessionDateKey < weekStartKey || sessionDateKey >= weekEndKey) return false;
      }
      if (searchValue.trim()) {
        const query = searchValue.trim().toLowerCase();
        const menteeLabel = getMenteeName(session).toLowerCase();
        if (!menteeLabel.includes(query) && !String(session.mentee || '').includes(query)) {
          return false;
        }
      }
      return true;
    });
  }, [filterValue, sessions, weekFilterValue, weekStartKey, weekEndKey, searchValue]);
  const pendingRequestCount = useMemo(
    () => sessions.filter((session) => String(session?.status || '').toLowerCase() === 'requested').length,
    [sessions]
  );

  const sessionsThisWeek = useMemo(() => {
    return filteredSessions.filter((session) => {
      const sessionDateKey = formatIndiaDateKey(session?.scheduled_start);
      return Boolean(sessionDateKey && sessionDateKey >= weekStartKey && sessionDateKey < weekEndKey);
    });
  }, [filteredSessions, weekStartKey, weekEndKey]);

  const calendarEntries = useMemo(() => {
    const now = new Date();
    return sessionsThisWeek
      .filter((session) => session?.status !== 'requested')
      .map((session) => {
      const end = new Date(session.scheduled_end || session.scheduled_start);
      const sessionDateKey = formatIndiaDateKey(session.scheduled_start);
      const dayIndex = sessionDateKey ? diffDateKeys(weekStartKey, sessionDateKey) : -1;
      const indiaHour = getIndiaHour(session.scheduled_start);
      const hourIndex = hours.findIndex((label) => parseHourLabel(label) === indiaHour);
      const joinUrl = session?.meeting_url || session?.join_url || session?.host_join_url || '';
      const menteeName = (getMenteeName(session) || '').trim() || 'Mentee';
      const connectionClosed = isConnectionClosed(session);
      return {
        ...session,
        id: session.id,
        dayIndex,
        hourIndex,
        title: menteeName,
        menteeAvatar: getMenteeAvatar(session),
        time: formatTimeRange(session.scheduled_start, session.scheduled_end),
        tone: session.status === 'completed' ? 'light' : 'dark',
        isPast: !Number.isNaN(end.getTime()) && end < now,
        needsSelection: needsCompletionSelection(session),
        connectionClosed,
        joinUrl,
      };
    });
  }, [needsCompletionSelection, sessionsThisWeek, weekStartKey]);

  const allTimeCalendarGroups = useMemo(() => {
    const now = new Date();
    const rows = filteredSessions
      .filter((session) => session?.status !== 'requested')
      .map((session) => {
        const end = new Date(session.scheduled_end || session.scheduled_start);
        const startMs = parseDateMs(session?.scheduled_start);
        const dateKey = formatIndiaDateKey(session?.scheduled_start) || '';
        const joinUrl = session?.meeting_url || session?.join_url || session?.host_join_url || '';
        const menteeName = (getMenteeName(session) || '').trim() || 'Mentee';
        const connectionClosed = isConnectionClosed(session);
        return {
          ...session,
          id: session.id,
          dateKey,
          startMs: startMs || 0,
          title: menteeName,
          menteeAvatar: getMenteeAvatar(session),
          time: formatTimeRange(session.scheduled_start, session.scheduled_end),
          tone: session.status === 'completed' ? 'light' : 'dark',
          isPast: !Number.isNaN(end.getTime()) && end < now,
          needsSelection: needsCompletionSelection(session),
          connectionClosed,
          joinUrl,
        };
      })
      .sort((a, b) => a.startMs - b.startMs);

    const grouped = rows.reduce((acc, session) => {
      const key = session.dateKey || 'unknown';
      if (!acc[key]) acc[key] = [];
      acc[key].push(session);
      return acc;
    }, {});

    return Object.entries(grouped)
      .sort(([a], [b]) => {
        if (a === 'unknown') return 1;
        if (b === 'unknown') return -1;
        return a.localeCompare(b);
      })
      .map(([dateKey, items]) => ({
        dateKey,
        dateLabel: dateKey === 'unknown' ? 'Date TBD' : indiaDateKeyToLabel(dateKey, { month: 'short', day: 'numeric', year: 'numeric' }),
        items,
      }));
  }, [filteredSessions, needsCompletionSelection]);

  const openJoinLink = (url, sessionId) => {
    if (!url) return false;
    setSelectedSessionId(sessionId);
    if (url.startsWith('http://') || url.startsWith('https://')) {
      window.location.assign(url);
      return true;
    }
    navigate(url);
    return true;
  };

  const handleJoin = async (session) => {
    if (!session?.id) return;
    if (!isJoinableStatus(session)) {
      setJoinError('Session is not available for joining.');
      return;
    }
    if (isConnectionClosed(session)) {
      setJoinError('Session connection is closed.');
      return;
    }
    if (isPastSession(session)) return;
    setJoinError('');
    const sessionKey = String(session.id);
    const existing = getJoinUrl(session);
    const isWrongRolePath =
      typeof existing === 'string' && existing.includes('/mentee-meeting-room');
    setJoiningId(session.id);
    try {
      const response = await mentorApi.getSessionJoinLink(session.id);
      const url =
        response?.meeting_url ||
        response?.join_url ||
        response?.host_join_url ||
        (!isWrongRolePath ? existing : '');
      if (url) {
        setSessions((prev) =>
          prev.map((item) =>
            item.id === session.id
              ? {
                  ...item,
                  meeting_url: response?.meeting_url || item.meeting_url,
                  join_url: response?.join_url || item.join_url,
                  host_join_url: response?.host_join_url || item.host_join_url,
                }
              : item
          )
        );
        joinedMeetingSessionIdsRef.current.add(sessionKey);
        setMeetingInvite((prev) => (String(prev?.id || '') === sessionKey ? null : prev));
        openJoinLink(url, session.id);
      } else {
        setJoinError('Join link not ready yet.');
      }
    } catch (err) {
      if (existing && !isWrongRolePath) {
        joinedMeetingSessionIdsRef.current.add(sessionKey);
        setMeetingInvite((prev) => (String(prev?.id || '') === sessionKey ? null : prev));
        openJoinLink(existing, session.id);
      } else {
        setJoinError(err?.message || 'Unable to fetch join link.');
      }
    } finally {
      setJoiningId(null);
    }
  };

  const getJoinUrl = (session) =>
    session?.host_join_url || session?.meeting_url || session?.joinUrl || session?.join_url || '';

  const openSelectionSubmission = (sessionId) => {
    if (!sessionId) return;
    setSelectedSessionId(sessionId);
    navigate('/mentor-session-completed');
  };

return (
  <div className="min-h-screen overflow-hidden bg-transparent p-4 text-[color:var(--theme-v-text-primary)] sm:p-6 lg:p-8">
    {/* Header Section */}
    <div className="relative z-10 mb-8 overflow-visible rounded-3xl border border-[color:var(--theme-v-border-strong)] bg-[linear-gradient(135deg,var(--theme-v-bg-mid)_0%,var(--theme-v-bg-start)_50%,var(--theme-v-bg-end)_100%)] p-4 shadow-[0_20px_45px_-28px_var(--theme-v-shell-shadow)] ring-1 ring-[color:var(--theme-v-hero-ring)] sm:p-6">
      <div className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-[color:var(--theme-v-orb-gold)] blur-3xl" />
      <div className="pointer-events-none absolute -left-16 -bottom-16 h-36 w-36 rounded-full bg-[color:var(--theme-v-orb-light)] blur-3xl" />
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_auto] xl:items-center">
        {/* Title with decorative element */}
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[color:var(--theme-v-surface-overlay-strong)]">
            <Calendar className="h-6 w-6 text-[color:var(--theme-v-accent)]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-[color:var(--theme-v-text-primary)] sm:text-3xl">
              My Sessions
            </h1>
            <p className="mt-1 text-sm text-[color:var(--theme-v-text-secondary)]">
              Manage and track all your mentoring sessions
            </p>
            <button
              type="button"
              onClick={() => navigate('/mentor-session-requests')}
              className={`mt-3 inline-flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold text-[color:var(--theme-v-accent-text)] transition-colors ${
                pendingRequestCount > 0
                  ? 'animate-pulse bg-[color:var(--theme-v-accent)] text-[color:var(--theme-v-accent-text)] shadow-[0_0_0_4px_var(--theme-v-focus-ring)] hover:bg-[color:var(--theme-v-accent-hover)]'
                  : 'bg-[color:var(--theme-v-accent)] text-[color:var(--theme-v-accent-text)] hover:bg-[color:var(--theme-v-accent-hover)]'
              }`}
            >
              Session Requests
              {pendingRequestCount > 0 ? (
                <span className="inline-flex min-w-5 items-center justify-center rounded-full bg-[color:var(--theme-v-surface-overlay)] px-1.5 py-0.5 text-[10px] font-bold text-[color:var(--theme-v-accent)]">
                  {pendingRequestCount}
                </span>
              ) : null}
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* Controls Section */}
        <div className="flex w-full flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center xl:w-auto xl:justify-end">
          {/* Search Input */}
          <div className="relative w-full sm:w-auto">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[color:var(--theme-v-text-secondary)]" />
            <input
              type="text"
              className="h-11 w-full rounded-xl border-0 bg-[color:var(--theme-v-surface-overlay)] pl-11 pr-4 text-sm text-[color:var(--theme-v-text-primary)] shadow-sm ring-1 ring-[color:var(--theme-v-border-soft)] placeholder:text-[color:var(--theme-v-text-placeholder)] transition-all duration-200 focus:ring-2 focus:ring-[color:var(--theme-v-border-focus)] sm:w-64"
              placeholder="Search mentee..."
              value={searchValue}
              onChange={(event) => setSearchValue(event.target.value)}
            />
            {searchValue && (
              <button
                onClick={() => setSearchValue('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 transition-colors hover:bg-[color:var(--theme-v-surface-overlay-strong)]"
              >
                <X className="h-4 w-4 text-[color:var(--theme-v-text-secondary)]" />
              </button>
            )}
          </div>

          {/* Filter Dropdown */}
          <div className="relative z-30" tabIndex={0} onBlur={() => setFilterOpen(false)}>
            <button
              type="button"
              className="flex h-11 w-full items-center justify-between gap-2 rounded-xl bg-[color:var(--theme-v-surface-overlay)] px-4 text-sm text-[color:var(--theme-v-text-secondary)] shadow-sm ring-1 ring-[color:var(--theme-v-border-soft)] transition-all hover:ring-[color:var(--theme-v-border-hover)] sm:w-40"
              onClick={() => setFilterOpen((o) => !o)}
            >
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-[color:var(--theme-v-text-secondary)]" />
                <span>{filterValue}</span>
              </div>
              <ChevronDown className={`h-4 w-4 text-[color:var(--theme-v-text-secondary)] transition-transform duration-200 ${filterOpen ? 'rotate-180' : ''}`} />
            </button>
            {filterOpen && (
              <ul className="absolute z-50 mt-2 w-full rounded-xl bg-[linear-gradient(180deg,var(--theme-v-shell-bg-start)_0%,var(--theme-v-shell-bg-end)_100%)] py-2 shadow-xl ring-1 ring-[color:var(--theme-v-border-medium)]">
                {filterOptions.map((opt) => (
                  <li key={opt}>
                    <button
                      type="button"
                      className={`w-full px-4 py-2.5 text-left text-sm transition-colors ${
                        filterValue === opt
                          ? 'bg-[color:var(--theme-v-selected-bg)] text-[color:var(--theme-v-accent)] font-medium'
                          : 'text-[color:var(--theme-v-text-secondary)] hover:bg-[color:var(--theme-v-surface-overlay-strong)]'
                      }`}
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => {
                        setFilterValue(opt);
                        setFilterOpen(false);
                      }}
                    >
                      {opt}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Week Filter Dropdown */}
          <div className="relative z-30" tabIndex={0} onBlur={() => setWeekFilterOpen(false)}>
            <button
              type="button"
              className="flex h-11 w-full items-center justify-between gap-2 rounded-xl bg-[color:var(--theme-v-surface-overlay)] px-4 text-sm text-[color:var(--theme-v-text-secondary)] shadow-sm ring-1 ring-[color:var(--theme-v-border-soft)] transition-all hover:ring-[color:var(--theme-v-border-hover)] sm:w-36"
              onClick={() => setWeekFilterOpen((o) => !o)}
            >
              <span>{weekFilterValue}</span>
              <ChevronDown className={`h-4 w-4 text-[color:var(--theme-v-text-secondary)] transition-transform duration-200 ${weekFilterOpen ? 'rotate-180' : ''}`} />
            </button>
            {weekFilterOpen && (
              <ul className="absolute z-50 mt-2 w-full rounded-xl bg-[linear-gradient(180deg,var(--theme-v-shell-bg-start)_0%,var(--theme-v-shell-bg-end)_100%)] py-2 shadow-xl ring-1 ring-[color:var(--theme-v-border-medium)]">
                {weekFilterOptions.map((opt) => (
                  <li key={opt}>
                    <button
                      type="button"
                      className={`w-full px-4 py-2.5 text-left text-sm transition-colors ${
                        weekFilterValue === opt
                          ? 'bg-[color:var(--theme-v-selected-bg)] text-[color:var(--theme-v-accent)] font-medium'
                          : 'text-[color:var(--theme-v-text-secondary)] hover:bg-[color:var(--theme-v-surface-overlay-strong)]'
                      }`}
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => {
                        setWeekFilterValue(opt);
                        setWeekFilterOpen(false);
                      }}
                    >
                      {opt}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* View Toggle */}
          <div className="flex h-11 w-full min-w-[190px] items-center rounded-xl bg-[color:var(--theme-v-surface-overlay)] p-1 shadow-sm ring-1 ring-[color:var(--theme-v-border-soft)] sm:w-auto">
            <button
              className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all duration-200 sm:flex-none ${
                view === 'calendar'
                  ? 'bg-[color:var(--theme-v-accent)] text-[color:var(--theme-v-accent-text)] shadow-md'
                  : 'text-[color:var(--theme-v-text-secondary)] hover:text-[color:var(--theme-v-text-primary)]'
              }`}
              onClick={() => setView('calendar')}
            >
              <Calendar className="h-4 w-4" />
              <span className="hidden sm:inline">Calendar</span>
            </button>
            <button
              className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all duration-200 sm:flex-none ${
                view === 'table'
                  ? 'bg-[color:var(--theme-v-accent)] text-[color:var(--theme-v-accent-text)] shadow-md'
                  : 'text-[color:var(--theme-v-text-secondary)] hover:text-[color:var(--theme-v-text-primary)]'
              }`}
              onClick={() => setView('table')}
            >
              <Table className="h-4 w-4" />
              <span className="hidden sm:inline">Table</span>
            </button>
          </div>
        </div>
      </div>
    </div>

    {meetingInvite && canJoinSession(meetingInvite) ? (
      <div className="mb-4 rounded-xl border border-[color:var(--theme-v-border-medium)] bg-[color:var(--theme-v-surface-overlay)] px-4 py-3 shadow-sm ring-1 ring-[color:var(--theme-v-border-soft)]">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="text-sm text-[color:var(--theme-v-text-primary)]">
            {`${getMenteeName(meetingInvite)} started this session${
              formatStartedAtLabel(meetingInvite?.mentee_joined_at)
                ? ` on ${formatStartedAtLabel(meetingInvite?.mentee_joined_at)}`
                : ''
            }. You can join now.`}
          </div>
          <button
            type="button"
            onClick={() => handleJoin(meetingInvite)}
            disabled={joiningId === meetingInvite.id}
            className="inline-flex items-center gap-1.5 rounded-lg bg-[color:var(--theme-v-accent)] px-3 py-1.5 text-xs font-semibold text-[color:var(--theme-v-accent-text)] hover:bg-[color:var(--theme-v-accent-hover)] disabled:opacity-50"
          >
            <Video className="h-3.5 w-3.5" />
            {joiningId === meetingInvite.id ? 'Joining...' : 'Join Meeting'}
          </button>
        </div>
      </div>
    ) : null}

    {/* Calendar View */}
    {view === 'calendar' ? (
      weekFilterValue === 'All Time' ? (
        <div className="space-y-4">
          {allTimeCalendarGroups.length ? (
            allTimeCalendarGroups.map((group) => (
              <div key={group.dateKey} className="overflow-hidden rounded-2xl bg-[color:var(--theme-v-surface-overlay)] ring-1 ring-[color:var(--theme-v-border-soft)]">
                <div className="bg-[color:var(--theme-v-surface-overlay-strong)] px-4 py-3 text-sm font-semibold text-[color:var(--theme-v-text-primary)] sm:px-5">
                  {group.dateLabel}
                </div>
                <div className="divide-y divide-[color:var(--theme-v-border-soft)]">
                  {group.items.map((session) => (
                    <div
                      key={session.id}
                      className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5"
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <button
                          type="button"
                          className="flex h-10 w-10 flex-shrink-0 items-center justify-center overflow-hidden rounded-full bg-[color:var(--theme-v-surface-overlay-strong)] text-sm font-semibold text-[color:var(--theme-v-accent)]"
                          onClick={() => navigate(`/mentor-mentee-profile/${session.id}`)}
                        >
                          {session.menteeAvatar ? (
                            <img src={session.menteeAvatar} alt="" className="h-full w-full object-cover" />
                          ) : (
                            (session.title || 'M').charAt(0).toUpperCase()
                          )}
                        </button>
                        <div className="min-w-0">
                          <button
                            type="button"
                            className="block truncate text-left text-sm font-semibold text-[color:var(--theme-v-text-primary)] hover:text-[color:var(--theme-v-accent)]"
                            onClick={() => navigate(`/mentor-mentee-profile/${session.id}`)}
                          >
                            {session.title}
                          </button>
                          <div className="mt-1 flex items-center gap-1.5 text-xs text-[color:var(--theme-v-text-secondary)]">
                            <Clock className="h-3.5 w-3.5" />
                            <span>{session.time}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 self-start sm:self-auto">
                        {canJoinSession(session) ? (
                          <button
                            type="button"
                            onClick={() => handleJoin(session)}
                            className="inline-flex items-center gap-1.5 rounded-lg bg-[color:var(--theme-v-accent)] px-3 py-2 text-xs font-semibold text-[color:var(--theme-v-accent-text)] hover:bg-[color:var(--theme-v-accent-hover)] disabled:opacity-50"
                            disabled={joiningId === session.id}
                          >
                            <Video className="h-3.5 w-3.5" />
                            {joiningId === session.id ? 'Joining...' : 'Join'}
                          </button>
                        ) : session.needsSelection ? (
                          <button
                            type="button"
                            onClick={() => openSelectionSubmission(session.id)}
                            className="inline-flex items-center gap-1.5 rounded-lg bg-[color:var(--theme-v-accent)] px-3 py-2 text-xs font-semibold text-[color:var(--theme-v-accent-text)] hover:bg-[color:var(--theme-v-accent-hover)]"
                          >
                            Submit Selection
                            <ArrowRight className="h-3.5 w-3.5" />
                          </button>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 text-xs text-[color:var(--theme-v-text-secondary)]">
                            <span className="h-2 w-2 rounded-full bg-[color:var(--theme-v-surface-overlay-track)]" />
                            {getJoinUnavailableLabel(session)}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))
          ) : (
            <div className="rounded-2xl bg-[color:var(--theme-v-surface-overlay)] px-6 py-14 text-center shadow-sm ring-1 ring-[color:var(--theme-v-border-soft)]">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[color:var(--theme-v-surface-overlay-strong)]">
                <Calendar className="h-7 w-7 text-[color:var(--theme-v-text-secondary)]" />
              </div>
              <p className="mt-4 text-sm font-medium text-[color:var(--theme-v-text-primary)]">No sessions found</p>
              <p className="mt-1 text-sm text-[color:var(--theme-v-text-secondary)]">Try changing filters to view more dates.</p>
            </div>
          )}
        </div>
      ) : (
      <div className="overflow-hidden rounded-2xl bg-[color:var(--theme-v-surface-overlay)] shadow-sm ring-1 ring-[color:var(--theme-v-border-soft)]">
        <div className="overflow-x-auto">
          <div className="min-w-[980px] pr-2 lg:min-w-[1330px] lg:pr-3">
            {/* Calendar Header */}
            <div className="grid grid-cols-[62px_repeat(7,minmax(130px,1fr))] bg-[color:var(--theme-v-surface-overlay-strong)] lg:grid-cols-[90px_repeat(7,minmax(176px,1fr))]">
              <div className="p-2.5 lg:p-4" />
              {days.map((d) => (
                <div
                  key={`${d.label}-${d.dateKey}`}
                  className={`border-l border-[color:var(--theme-v-border-soft)] p-2.5 text-center transition-colors lg:p-4 ${
                    d.active ? 'bg-[color:var(--theme-v-surface-overlay)]' : ''
                  }`}
                >
                  <div className={`text-[10px] font-medium uppercase tracking-wider sm:text-xs ${
                    d.active ? 'text-[color:var(--theme-v-accent)]' : 'text-[color:var(--theme-v-text-secondary)]'
                  }`}>
                    {d.label}
                  </div>
                  <div
                    className={`mt-2 inline-flex h-8 w-8 items-center justify-center rounded-lg text-base font-bold transition-all lg:h-10 lg:w-10 lg:rounded-xl lg:text-lg ${
                      d.active
                        ? 'bg-[color:var(--theme-v-accent)] text-[color:var(--theme-v-accent-text)] shadow-lg'
                        : 'text-[color:var(--theme-v-text-primary)]'
                    }`}
                  >
                    {d.dayNumber}
                  </div>
                </div>
              ))}
            </div>

            {/* Calendar Body */}
            <div className="divide-y divide-[color:var(--theme-v-border-soft)]">
              {hours.map((h, idx) => {
                const rowHasAction = calendarEntries.some(
                  (s) => s.hourIndex === idx && (canJoinSession(s) || s.needsSelection)
                );
                return (
                  <div key={h} className="grid grid-cols-[62px_repeat(7,minmax(130px,1fr))] lg:grid-cols-[90px_repeat(7,minmax(176px,1fr))]">
                    <div className="flex items-start justify-end p-2.5 pr-3 text-[10px] font-medium text-[color:var(--theme-v-text-secondary)] sm:text-xs lg:p-3 lg:pr-4">
                      {h}
                    </div>
                    {days.map((d, c) => {
                      const session = calendarEntries.find((s) => s.dayIndex === c && s.hourIndex === idx);
                      return (
                        <div
                          key={`${h}-${d.label}`}
                          className={`relative border-l border-[color:var(--theme-v-border-soft)] p-1.5 transition-colors lg:p-2 ${
                            rowHasAction ? 'min-h-[88px] lg:min-h-[110px]' : 'min-h-[64px] lg:min-h-[70px]'
                          } ${d.active ? 'bg-[color:var(--theme-v-surface-overlay)]' : 'hover:bg-[color:var(--theme-v-surface-overlay-strong)]'}`}
                        >
                          {session && (
                            <div
                              role="button"
                              tabIndex={0}
                              onClick={() => {
                                setSelectedSessionId(session.id);
                                if (session?.needsSelection) {
                                  navigate('/mentor-session-completed');
                                }
                              }}
                              onKeyDown={(event) => {
                                if (event.key === 'Enter') {
                                  setSelectedSessionId(session.id);
                                  if (session?.needsSelection) {
                                    navigate('/mentor-session-completed');
                                  }
                                  }
                              }}
                              className={`group absolute inset-1 flex cursor-pointer flex-col rounded-xl p-2 transition-all duration-200 md:inset-1.5 md:p-2.5 lg:inset-2 lg:p-3 ${
                                session.tone === 'light'
                                  ? 'bg-[color:var(--theme-v-surface-overlay)] hover:bg-[color:var(--theme-v-surface-overlay-strong)] ring-1 ring-[color:var(--theme-v-border-soft)]'
                                  : 'bg-[color:var(--theme-v-header-bg)] hover:bg-[color:var(--theme-v-bg-start)] shadow-lg'
                              } ${session.isPast ? 'opacity-60' : ''}`}
                            >
                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  className={`flex h-6 w-6 flex-shrink-0 items-center justify-center overflow-hidden rounded-full text-[10px] font-semibold ${
                                    session.tone === 'light'
                                      ? 'bg-[color:var(--theme-v-surface-overlay-track)] text-[color:var(--theme-v-text-primary)]'
                                      : 'bg-white/25 text-white'
                                  }`}
                                  onClick={(event) => {
                                    event.stopPropagation();
                                    navigate(`/mentor-mentee-profile/${session.id}`);
                                  }}
                                >
                                  {session.menteeAvatar ? (
                                    <img src={session.menteeAvatar} alt="" className="h-full w-full object-cover" />
                                  ) : (
                                    (session.title || 'M').charAt(0).toUpperCase()
                                  )}
                                </button>
                                <button
                                  type="button"
                                  className={`min-w-0 flex-1 text-left text-sm font-semibold truncate transition-colors ${
                                    session.tone === 'light'
                                      ? 'text-[color:var(--theme-v-text-primary)] hover:text-[color:var(--theme-v-accent)]'
                                      : 'text-white'
                                  }`}
                                  onClick={(event) => {
                                    event.stopPropagation();
                                    navigate(`/mentor-mentee-profile/${session.id}`);
                                  }}
                                >
                                  {session.title}
                                </button>
                              </div>
                              <div className={`mt-1 flex min-w-0 items-center gap-1 text-xs ${
                                session.tone === 'light' ? 'text-[color:var(--theme-v-text-secondary)]' : 'text-white/80'
                              }`}>
                                <Clock className="h-3 w-3" />
                                <span className={`block min-w-0 whitespace-nowrap ${session.tone === 'light' ? 'line-through' : ''}`}>
                                  {session.time}
                                </span>
                              </div>
                              {canJoinSession(session) && (
                                <button
                                  type="button"
                                  onClick={(event) => {
                                    event.stopPropagation();
                                    handleJoin(session);
                                  }}
                                  className="mt-auto flex items-center justify-center gap-1.5 rounded-lg bg-white/20 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur-sm transition-all hover:bg-white/30 disabled:opacity-50"
                                  disabled={joiningId === session.id}
                                >
                                  <Video className="h-3 w-3" />
                                  {joiningId === session.id ? 'Joining...' : 'Join Now'}
                                </button>
                              )}
                              {!canJoinSession(session) && session.needsSelection ? (
                                <button
                                  type="button"
                                  onClick={(event) => {
                                    event.stopPropagation();
                                    openSelectionSubmission(session.id);
                                  }}
                                  className="mt-auto flex items-center justify-center gap-1.5 rounded-lg bg-[color:var(--theme-v-accent)] px-3 py-1.5 text-xs font-semibold text-[color:var(--theme-v-accent-text)] transition-all hover:bg-[color:var(--theme-v-accent-hover)]"
                                >
                                  Submit Selection
                                  <ArrowRight className="h-3 w-3" />
                                </button>
                              ) : null}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
      )
    ) : (
      /* Table View */
      <div className="overflow-hidden rounded-2xl bg-[color:var(--theme-v-surface-overlay)] shadow-sm ring-1 ring-[color:var(--theme-v-border-soft)]">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px]">
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
                  Status
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-[color:var(--theme-v-text-secondary)]">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[color:var(--theme-v-border-soft)]">
              {filteredSessions.map((session) => (
                <tr
                  key={session.id}
                  className="group transition-colors hover:bg-[color:var(--theme-v-surface-overlay-strong)]"
                >
                  <td className="px-6 py-4">
                    <button
                      type="button"
                      className="flex items-center gap-3 text-left"
                      onClick={() => navigate(`/mentor-mentee-profile/${session.id}`)}
                    >
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[color:var(--theme-v-surface-overlay-strong)] text-sm font-semibold text-[color:var(--theme-v-accent)]">
                        {getMenteeAvatar(session) ? (
                          <img src={getMenteeAvatar(session)} alt="" className="h-full w-full rounded-full object-cover" />
                        ) : (
                          getMenteeName(session).charAt(0).toUpperCase()
                        )}
                      </div>
                      <div>
                        <span className="font-medium text-[color:var(--theme-v-text-primary)] group-hover:text-[color:var(--theme-v-accent)] transition-colors">
                          {getMenteeName(session)}
                        </span>
                      </div>
                    </button>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-sm text-[color:var(--theme-v-text-secondary)]">
                      <Calendar className="h-4 w-4 text-[color:var(--theme-v-text-secondary)]" />
                      {formatDateLabel(session.scheduled_start)}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-sm text-[color:var(--theme-v-text-secondary)]">
                      <Clock className="h-4 w-4 text-[color:var(--theme-v-text-secondary)]" />
                      {formatTimeRange(session.scheduled_start, session.scheduled_end)}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${
                        isPastSession(session)
                          ? 'bg-[color:var(--theme-v-surface-overlay-strong)] text-[color:var(--theme-v-text-secondary)]'
                          : 'bg-green-50 text-green-700 ring-1 ring-green-600/10'
                      }`}
                    >
                      {isPastSession(session) ? 'Completed' : session.status || 'Scheduled'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {canJoinSession(session) ? (
                      <button
                        type="button"
                        onClick={() => handleJoin(session)}
                        className="inline-flex items-center gap-2 rounded-xl bg-[color:var(--theme-v-accent)] px-4 py-2 text-sm font-medium text-[color:var(--theme-v-accent-text)] shadow-sm transition-all hover:bg-[color:var(--theme-v-accent-hover)] hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50"
                        disabled={joiningId === session.id}
                      >
                        <Video className="h-4 w-4" />
                        {joiningId === session.id ? 'Joining...' : 'Join Call'}
                        <ArrowRight className="h-4 w-4" />
                      </button>
                    ) : needsCompletionSelection(session) ? (
                      <button
                        type="button"
                        onClick={() => openSelectionSubmission(session.id)}
                        className="inline-flex items-center gap-2 rounded-xl bg-[color:var(--theme-v-accent)] px-4 py-2 text-sm font-medium text-[color:var(--theme-v-accent-text)] shadow-sm transition-all hover:bg-[color:var(--theme-v-accent-hover)] hover:shadow-md"
                      >
                        Submit Selection
                        <ArrowRight className="h-4 w-4" />
                      </button>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 text-sm text-[color:var(--theme-v-text-secondary)]">
                        <span className="h-2 w-2 rounded-full bg-[color:var(--theme-v-surface-overlay-track)]" />
                        {getJoinUnavailableLabel(session)}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
              {!filteredSessions.length && (
                <tr>
                  <td colSpan={5} className="px-6 py-16 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[color:var(--theme-v-surface-overlay-strong)]">
                        <Calendar className="h-8 w-8 text-[color:var(--theme-v-text-secondary)]" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-[color:var(--theme-v-text-primary)]">No sessions found</p>
                        <p className="mt-1 text-sm text-[color:var(--theme-v-text-secondary)]">
                          Try adjusting your filters or search criteria
                        </p>
                      </div>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    )}

    {/* Loading & Error States */}
    {(loading || error) && (
      <div className={`mt-6 flex items-center justify-center gap-2 rounded-xl p-4 ${
        error ? 'bg-[color:var(--theme-v-toast-error-bg)] text-[color:var(--theme-v-toast-error-text)] ring-1 ring-[color:var(--theme-v-toast-error-border)]' : 'bg-[color:var(--theme-v-surface-overlay)] text-[color:var(--theme-v-text-secondary)] ring-1 ring-[color:var(--theme-v-border-soft)]'
      }`}>
        {loading && (
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-[color:var(--theme-v-border-soft)] border-t-[color:var(--theme-v-accent)]" />
        )}
        <span className="text-sm font-medium">{error || 'Loading sessions...'}</span>
      </div>
    )}

    {joinError && (
      <div className="mt-4 flex items-center gap-2 rounded-xl bg-[color:var(--theme-v-toast-error-bg)] p-4 text-sm text-[color:var(--theme-v-toast-error-text)] ring-1 ring-[color:var(--theme-v-toast-error-border)]">
        <span className="font-medium">{joinError}</span>
      </div>
    )}
  </div>
);
};

export default MySessions;
