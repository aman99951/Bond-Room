import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Search,
  ChevronDown,
  Calendar,
  LayoutGrid,
  Clock,
  Video,
  MessageSquare,
  User,
  X,
  Filter,
  ArrowRight,
  CheckCircle2
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { menteeApi } from '../../../apis/api/menteeApi';
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

const normalizeList = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.results)) return payload.results;
  return [];
};

const formatDate = (value) => {
  const key = formatIndiaDateKey(value);
  if (!key) return '-';
  return indiaDateKeyToLabel(key, { month: 'short', day: 'numeric', year: 'numeric' });
};

const formatTimeRange = (startValue, endValue) => {
  const startLabel = getIndiaTimeLabel(startValue, { hour12: true });
  const endLabel = getIndiaTimeLabel(endValue, { hour12: true });
  if (!startLabel || !endLabel) return '-';
  return `${startLabel} - ${endLabel}`;
};

const getIndiaHour = (value) => {
  const label = getIndiaTimeLabel(value, { hour12: false });
  const [hour] = String(label || '').split(':');
  const numericHour = Number(hour);
  return Number.isNaN(numericHour) ? -1 : numericHour;
};

const isUpcomingStatus = (session) => {
  const start = new Date(session?.scheduled_start || '');
  const status = session?.status || '';
  return ['requested', 'approved', 'scheduled'].includes(status) && start >= new Date();
};

const isCompletedStatus = (session) => {
  const status = session?.status || '';
  return ['completed', 'canceled', 'no_show'].includes(status);
};

const getJoinUrl = (session) =>
  session?.join_url || session?.meeting_url || session?.joinUrl || session?.host_join_url || '';

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
  const dateLabel = formatDate(value);
  const timeLabel = getIndiaTimeLabel(value, { hour12: true });
  if ((!dateLabel || dateLabel === '-') && !timeLabel) return '';
  if (!dateLabel || dateLabel === '-') return timeLabel || '';
  if (!timeLabel) return dateLabel;
  return `${dateLabel} at ${timeLabel}`;
};

const isMentorStartedSession = (session) => {
  const status = String(session?.status || '').toLowerCase();
  if (!['approved', 'scheduled'].includes(status)) return false;
  const mentorJoinedAtMs = parseDateMs(session?.mentor_joined_at);
  if (!mentorJoinedAtMs) return false;

  const nowMs = Date.now();
  const twelveHoursMs = 12 * 60 * 60 * 1000;
  if (mentorJoinedAtMs > nowMs + 60 * 1000) return false;
  if (nowMs - mentorJoinedAtMs > twelveHoursMs) return false;
  return true;
};

const MySessions = () => {
  const navigate = useNavigate();
  const [view, setView] = useState('calendar');
  const [filterOpen, setFilterOpen] = useState(false);
  const [weekFilterOpen, setWeekFilterOpen] = useState(false);
  const [weekFilterValue, setWeekFilterValue] = useState('This Week');
  const [filterValue, setFilterValue] = useState('All Types');
  const [searchValue, setSearchValue] = useState('');
  const [sessions, setSessions] = useState([]);
  const [mentorMap, setMentorMap] = useState({});
  const [feedbackSessionIds, setFeedbackSessionIds] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [joinError, setJoinError] = useState('');
  const [joiningId, setJoiningId] = useState(null);
  const [meetingInvite, setMeetingInvite] = useState(null);
  const mentorStartedBySessionRef = useRef({});
  const joinedMeetingSessionIdsRef = useRef(new Set());
  const pollingRef = useRef(null);
  const filterOptions = ['All Types', 'Upcoming', 'Completed'];
  const weekFilterOptions = ['This Week', 'All Time'];

  const hasFeedbackSubmitted = (session) => {
    const sessionId = Number(session?.id || 0);
    if (!sessionId) return false;
    if (feedbackSessionIds.has(sessionId)) return true;
    const embeddedFeedback = session?.feedback;
    if (!embeddedFeedback || typeof embeddedFeedback !== 'object') return false;
    if (embeddedFeedback?.id) return true;
    if (embeddedFeedback?.submitted_at) return true;
    if (embeddedFeedback?.rating !== undefined && embeddedFeedback?.rating !== null) return true;
    if (String(embeddedFeedback?.comments || '').trim()) return true;
    return false;
  };

  const isFeedbackEligible = (session) =>
    String(session?.status || '').toLowerCase() === 'completed' && !hasFeedbackSubmitted(session);

  useEffect(() => {
    let cancelled = false;

    const updateMentorStartSignals = (sessionItems) => {
      const next = {};
      let latestInvite = null;

      sessionItems.forEach((session) => {
        const sessionId = String(session?.id || '');
        if (!sessionId) return;
        const startedAt = String(session?.mentor_joined_at || '');
        next[sessionId] = startedAt;

        const alreadyJoined = joinedMeetingSessionIdsRef.current.has(sessionId);
        if (!alreadyJoined && startedAt && isMentorStartedSession(session)) {
          if (
            !latestInvite ||
            new Date(startedAt).getTime() > new Date(latestInvite.mentor_joined_at || 0).getTime()
          ) {
            latestInvite = session;
          }
        }
      });

      mentorStartedBySessionRef.current = next;
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
        const [sessionResponse, mentorResponse, feedbackResponse] = await Promise.all([
          menteeApi.listSessions(),
          menteeApi.listMentors(),
          menteeApi.listSessionFeedback(),
        ]);
        if (cancelled) return;
        const sessionItems = normalizeList(sessionResponse);
        const mentorItems = normalizeList(mentorResponse);
        const feedbackItems = normalizeList(feedbackResponse);
        const nextMentorMap = {};
        const nextFeedbackSessionIds = new Set(
          feedbackItems
            .map((item) => Number(item?.session || 0))
            .filter((value) => Number.isFinite(value) && value > 0)
        );
        mentorItems.forEach((mentor) => {
          const fullName = `${mentor?.first_name || ''} ${mentor?.last_name || ''}`.trim();
          nextMentorMap[String(mentor.id)] = {
            name: fullName || `Mentor #${mentor?.id}`,
            avatar: mentor?.avatar || mentor?.profile_photo || '',
          };
        });
        setSessions(sessionItems);
        setMentorMap(nextMentorMap);
        setFeedbackSessionIds(nextFeedbackSessionIds);
        updateMentorStartSignals(sessionItems);
      } catch (err) {
        if (!cancelled) {
          setError(err?.message || 'Unable to load sessions.');
          setSessions([]);
          setMentorMap({});
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    const pollSessions = async () => {
      try {
        const sessionResponse = await menteeApi.listSessions();
        if (cancelled) return;
        const sessionItems = normalizeList(sessionResponse);
        setSessions(sessionItems);
        const nextFeedbackSessionIds = new Set(
          sessionItems
            .filter((item) => item?.feedback && typeof item.feedback === 'object')
            .map((item) => Number(item?.id || 0))
            .filter((value) => Number.isFinite(value) && value > 0)
        );
        if (nextFeedbackSessionIds.size) {
          setFeedbackSessionIds((prev) => {
            const merged = new Set(prev);
            nextFeedbackSessionIds.forEach((id) => merged.add(id));
            return merged;
          });
        }
        updateMentorStartSignals(sessionItems);
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
  }, []);

  const weekStartKey = useMemo(() => getIndiaWeekStartKey(new Date()), []);
  const weekEndKey = useMemo(() => addDaysToDateKey(weekStartKey, 7), [weekStartKey]);

  const days = useMemo(() => {
    const labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    return labels.map((label, index) => {
      const dateKey = addDaysToDateKey(weekStartKey, index);
      const parts = parseDateKey(dateKey);
      return {
        label,
        date: parts?.day || 0,
        iso: dateKey,
        active: formatIndiaDateKey(new Date()) === dateKey,
      };
    });
  }, [weekStartKey]);

  const enrichedSessions = useMemo(() => {
    return sessions.map((session) => {
      const end = new Date(session.scheduled_end || session.scheduled_start);
      const sessionDateKey = formatIndiaDateKey(session.scheduled_start);
      const dayIndex = sessionDateKey ? diffDateKeys(weekStartKey, sessionDateKey) : -1;
      const indiaHour = getIndiaHour(session.scheduled_start);
      const hourIndex = indiaHour >= 0 ? Math.max(0, indiaHour - 8) : -1;
      const mentorInfo = mentorMap[String(session.mentor)] || {};
      const mentorName = mentorInfo?.name || `Mentor #${session.mentor}`;
      const tone = ['completed', 'canceled', 'no_show'].includes(session.status) ? 'light' : 'dark';
      const isPast = !Number.isNaN(end.getTime()) && end < new Date();
      return {
        ...session,
        mentorName,
        mentorAvatar: mentorInfo?.avatar || '',
        dayIndex,
        hourIndex,
        tone,
        isPast,
        timeRange: formatTimeRange(session.scheduled_start, session.scheduled_end),
      };
    });
  }, [sessions, mentorMap, weekStartKey]);

  const filteredSessions = useMemo(() => {
    return enrichedSessions.filter((session) => {
      if (filterValue === 'Upcoming' && !isUpcomingStatus(session)) return false;
      if (filterValue === 'Completed' && !isCompletedStatus(session)) return false;
      if (weekFilterValue === 'This Week') {
        const sessionDateKey = formatIndiaDateKey(session?.scheduled_start);
        if (!sessionDateKey || sessionDateKey < weekStartKey || sessionDateKey >= weekEndKey) return false;
      }
      if (searchValue.trim()) {
        return session.mentorName.toLowerCase().includes(searchValue.trim().toLowerCase());
      }
      return true;
    });
  }, [enrichedSessions, filterValue, weekFilterValue, weekStartKey, weekEndKey, searchValue]);

  const calendarSessions = useMemo(() => {
    return filteredSessions.filter((session) => {
      const sessionDateKey = formatIndiaDateKey(session?.scheduled_start);
      if (!sessionDateKey || sessionDateKey < weekStartKey || sessionDateKey >= weekEndKey) return false;
      if (session?.status === 'requested') return false;
      return session.dayIndex >= 0 && session.hourIndex >= 0 && session.hourIndex < hours.length;
    });
  }, [filteredSessions, weekStartKey, weekEndKey]);

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
      typeof existing === 'string' && existing.includes('/mentor-meeting-room');
    if (existing && !isWrongRolePath) {
      joinedMeetingSessionIdsRef.current.add(sessionKey);
      setMeetingInvite((prev) => (String(prev?.id || '') === sessionKey ? null : prev));
      openJoinLink(existing, session.id);
      return;
    }
    setJoiningId(session.id);
    try {
      const response = await menteeApi.getSessionJoinLink(session.id);
      const url = response?.meeting_url || response?.join_url || response?.host_join_url || '';
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
      setJoinError(err?.message || 'Unable to fetch join link.');
    } finally {
      setJoiningId(null);
    }
  };

return (
  <div className="bg-transparent p-3 sm:p-5 lg:p-8">
    {/* Header Section */}
    <div className="mb-6 sm:mb-8">
      <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_auto] md:items-center">
        {/* Title with Icon */}
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#5D3699] shadow-lg shadow-[#5D3699]/20">
            <Calendar className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-[#111827] sm:text-3xl">
              My Sessions
            </h1>
            <p className="mt-1 text-sm text-[#6b7280]">
              View and manage your mentoring sessions
            </p>
          </div>
        </div>

        {/* Controls */}
        <div className="flex w-full flex-wrap items-center gap-3 md:w-auto md:justify-end">
          {/* Search */}
          <div className="relative w-full sm:min-w-[260px] sm:flex-1 lg:w-72 lg:flex-none">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9ca3af]" />
            <input
              type="text"
              className="h-11 w-full rounded-xl border-0 bg-white pl-11 pr-10 text-sm text-[#111827] shadow-sm ring-1 ring-[#e5e7eb] placeholder:text-[#9ca3af] transition-all duration-200 focus:ring-2 focus:ring-[#5D3699]"
              placeholder="Search mentor..."
              value={searchValue}
              onChange={(event) => setSearchValue(event.target.value)}
            />
            {searchValue && (
              <button
                onClick={() => setSearchValue('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 hover:bg-[#f5f3ff] transition-colors"
              >
                <X className="h-4 w-4 text-[#9ca3af]" />
              </button>
            )}
          </div>

          {/* Filter Dropdown */}
          <div className="relative w-full sm:w-[180px] lg:w-40" tabIndex={0} onBlur={() => setFilterOpen(false)}>
            <button
              type="button"
              className="flex h-11 w-full items-center justify-between gap-2 rounded-xl bg-white px-4 text-sm text-[#6b7280] shadow-sm ring-1 ring-[#e5e7eb] transition-all hover:ring-[#c4b5fd]"
              onClick={() => setFilterOpen((o) => !o)}
            >
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-[#9ca3af]" />
                <span>{filterValue}</span>
              </div>
              <ChevronDown className={`h-4 w-4 text-[#9ca3af] transition-transform duration-200 ${filterOpen ? 'rotate-180' : ''}`} />
            </button>
            {filterOpen && (
              <ul className="absolute z-20 mt-2 w-full rounded-xl bg-white py-2 shadow-xl ring-1 ring-[#e5e7eb]">
                {filterOptions.map((opt) => (
                  <li key={opt}>
                    <button
                      type="button"
                      className={`w-full px-4 py-2.5 text-left text-sm transition-colors ${
                        filterValue === opt
                          ? 'bg-[#f5f3ff] text-[#5D3699] font-medium'
                          : 'text-[#6b7280] hover:bg-[#f5f3ff]'
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
          <div className="relative w-full sm:w-[170px] lg:w-36" tabIndex={0} onBlur={() => setWeekFilterOpen(false)}>
            <button
              type="button"
              className="flex h-11 w-full items-center justify-between gap-2 rounded-xl bg-white px-4 text-sm text-[#6b7280] shadow-sm ring-1 ring-[#e5e7eb] transition-all hover:ring-[#c4b5fd]"
              onClick={() => setWeekFilterOpen((o) => !o)}
            >
              <span>{weekFilterValue}</span>
              <ChevronDown className={`h-4 w-4 text-[#9ca3af] transition-transform duration-200 ${weekFilterOpen ? 'rotate-180' : ''}`} />
            </button>
            {weekFilterOpen && (
              <ul className="absolute z-20 mt-2 w-full rounded-xl bg-white py-2 shadow-xl ring-1 ring-[#e5e7eb]">
                {weekFilterOptions.map((opt) => (
                  <li key={opt}>
                    <button
                      type="button"
                      className={`w-full px-4 py-2.5 text-left text-sm transition-colors ${
                        weekFilterValue === opt
                          ? 'bg-[#f5f3ff] text-[#5D3699] font-medium'
                          : 'text-[#6b7280] hover:bg-[#f5f3ff]'
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
          <div className="flex h-11 w-full min-w-[220px] items-center rounded-xl bg-white p-1 shadow-sm ring-1 ring-[#e5e7eb] sm:w-auto">
            <button
              className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all duration-200 sm:flex-none ${
                view === 'calendar'
                  ? 'bg-[#5D3699] text-white shadow-md'
                  : 'text-[#6b7280] hover:text-[#111827]'
              }`}
              onClick={() => setView('calendar')}
            >
              <Calendar className="h-4 w-4" />
              <span className="hidden sm:inline">Calendar</span>
            </button>
            <button
              className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all duration-200 sm:flex-none ${
                view === 'table'
                  ? 'bg-[#5D3699] text-white shadow-md'
                  : 'text-[#6b7280] hover:text-[#111827]'
              }`}
              onClick={() => setView('table')}
            >
              <LayoutGrid className="h-4 w-4" />
              <span className="hidden sm:inline">Table</span>
            </button>
          </div>
        </div>
      </div>
    </div>

    {/* Error/Loading States */}
    {error && (
      <div className="mb-4 flex items-center gap-2 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600 ring-1 ring-red-100">
        <X className="h-4 w-4" />
        {error}
      </div>
    )}
    {joinError && (
      <div className="mb-4 flex items-center gap-2 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600 ring-1 ring-red-100">
        <X className="h-4 w-4" />
        {joinError}
      </div>
    )}
    {loading && (
      <div className="mb-4 flex items-center justify-center gap-3 rounded-xl bg-white px-4 py-6 shadow-sm ring-1 ring-[#e5e7eb]">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-[#e5e7eb] border-t-[#5D3699]" />
        <span className="text-sm text-[#6b7280]">Loading sessions...</span>
      </div>
    )}

    {meetingInvite ? (
      <div className="mb-4 rounded-xl border border-[#d8b4fe] bg-[#faf5ff] px-4 py-3 shadow-sm ring-1 ring-[#f3e8ff]">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="text-sm text-[#4c1d95]">
            {`Your mentor started this session${
              formatStartedAtLabel(meetingInvite?.mentor_joined_at)
                ? ` on ${formatStartedAtLabel(meetingInvite?.mentor_joined_at)}`
                : ''
            }.${
              canJoinSession(meetingInvite) ? ' You can join now.' : ' Join will be available shortly.'
            }`}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleJoin(meetingInvite)}
              disabled={joiningId === meetingInvite.id || !canJoinSession(meetingInvite)}
              className="inline-flex items-center gap-1.5 rounded-lg bg-[#5D3699] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#4a2b7a] disabled:opacity-50"
            >
              <Video className="h-3.5 w-3.5" />
              {joiningId === meetingInvite.id ? 'Joining...' : 'Join Meeting'}
            </button>
          </div>
        </div>
      </div>
    ) : null}

    {/* Calendar View */}
    {view === 'calendar' ? (
      <div className="rounded-2xl bg-white shadow-sm ring-1 ring-[#e5e7eb] overflow-hidden">
        <div className="overflow-x-auto">
          <div className="min-w-[1120px] lg:min-w-[1310px]">
            {/* Calendar Header */}
            <div className="grid grid-cols-[74px_repeat(7,minmax(140px,1fr))] bg-[#f8fafc] lg:grid-cols-[100px_repeat(7,minmax(170px,1fr))]">
              <div className="p-2.5 lg:p-4" />
              {days.map((d) => (
                <div
                  key={`${d.label}-${d.date}`}
                  className={`border-l border-[#e5e7eb] p-2.5 text-center transition-colors lg:p-4 ${
                    d.active ? 'bg-[#f5f3ff]' : ''
                  }`}
                >
                  <div className={`text-[10px] font-medium uppercase tracking-wider sm:text-xs ${
                    d.active ? 'text-[#5D3699]' : 'text-[#9ca3af]'
                  }`}>
                    {d.label}
                  </div>
                  <div
                    className={`mt-2 inline-flex h-8 w-8 items-center justify-center rounded-lg text-base font-bold transition-all lg:h-10 lg:w-10 lg:rounded-xl lg:text-lg ${
                      d.active
                        ? 'bg-[#5D3699] text-white shadow-lg shadow-[#5D3699]/30'
                        : 'text-[#111827]'
                    }`}
                  >
                    {d.date}
                  </div>
                </div>
              ))}
            </div>

            {/* Calendar Body */}
            <div className="divide-y divide-[#e5e7eb]">
              {hours.map((h, idx) => {
                const rowHasJoin = calendarSessions.some(
                  (s) => s.hourIndex === idx && canJoinSession(s)
                );
                const rowHasFeedback = calendarSessions.some(
                  (s) => s.hourIndex === idx && isFeedbackEligible(s)
                );
                return (
                  <div key={h} className="grid grid-cols-[74px_repeat(7,minmax(140px,1fr))] lg:grid-cols-[100px_repeat(7,minmax(170px,1fr))]">
                    <div className="flex items-start justify-end p-2.5 pr-3 text-[10px] font-medium text-[#9ca3af] sm:text-xs lg:p-3 lg:pr-4">
                      {h}
                    </div>
                    {days.map((d, c) => {
                      const session = calendarSessions.find((s) => s.dayIndex === c && s.hourIndex === idx);
                      return (
                        <div
                          key={`${h}-${d.label}`}
                          className={`relative border-l border-[#e5e7eb] p-1.5 transition-colors lg:p-2 ${
                            rowHasJoin || rowHasFeedback ? 'min-h-[88px] lg:min-h-[110px]' : 'min-h-[64px] lg:min-h-[70px]'
                          } ${d.active ? 'bg-[#f5f3ff]/30' : 'hover:bg-[#f8fafc]'}`}
                        >
                          {session && (
                            <div
                              role="button"
                              tabIndex={0}
                              onClick={() => setSelectedSessionId(session.id)}
                              onKeyDown={(event) => {
                                if (event.key === 'Enter') setSelectedSessionId(session.id);
                              }}
                              className={`group absolute inset-1 p-2 md:inset-1.5 md:p-2.5 lg:inset-2 lg:p-3 flex cursor-pointer flex-col rounded-xl transition-all duration-200 ${
                                session.tone === 'light'
                                  ? 'bg-[#f5f3ff] hover:bg-[#ede9fe] ring-1 ring-[#e5e7eb]'
                                  : 'bg-[#5D3699] hover:bg-[#4a2b7a] shadow-lg shadow-[#5D3699]/20'
                              } ${session.isPast ? 'opacity-60' : ''}`}
                            >
                              {/* Session Content */}
                              <div className="flex min-w-0 items-center gap-1 md:gap-1.5 lg:gap-2">
                                <div className={`flex h-5 w-5 items-center justify-center rounded-md md:h-6 md:w-6 md:rounded-lg lg:h-7 lg:w-7 ${
                                  session.tone === 'light' ? 'bg-white' : 'bg-white/20'
                                }`}>
                                  {session.mentorAvatar ? (
                                    <img
                                      src={session.mentorAvatar}
                                      alt={session.mentorName}
                                      className="h-full w-full rounded-lg object-cover"
                                    />
                                  ) : (
                                    <User className={`h-3 w-3 md:h-3.5 md:w-3.5 lg:h-4 lg:w-4 ${
                                      session.tone === 'light' ? 'text-[#5D3699]' : 'text-white'
                                    }`} />
                                  )}
                                </div>
                                <span className={`block min-w-0 truncate text-[11px] font-semibold md:text-xs lg:text-sm ${
                                  session.tone === 'light' ? 'text-[#111827]' : 'text-white'
                                }`}>
                                  {session.mentorName}
                                </span>
                              </div>

                              <div className={`mt-1 flex min-w-0 items-center gap-1 text-[10px] md:text-[11px] lg:mt-1.5 lg:gap-1.5 lg:text-xs ${
                                session.tone === 'light' ? 'text-[#6b7280]' : 'text-white/80'
                              }`}>
                                <Clock className="h-3 w-3 shrink-0 lg:h-3.5 lg:w-3.5" />
                                <span className={`block min-w-0 whitespace-nowrap ${session.tone === 'light' ? 'line-through' : ''}`}>
                                  {session.timeRange}
                                </span>
                              </div>

                              {/* Action Button */}
                           {isFeedbackEligible(session) ? (
  <button
    type="button"
    onClick={(event) => {
      event.stopPropagation();
      setSelectedSessionId(session.id);
      navigate('/feedback');
    }}
    className="mt-auto inline-flex w-full items-center justify-center gap-1 rounded-md bg-white px-2 py-1.5 text-[10px] font-semibold leading-none text-[#5D3699] ring-1 ring-[#5D3699]/20 transition-all hover:bg-[#f5f3ff] md:px-2.5 lg:gap-1.5 lg:rounded-lg lg:px-3 lg:text-xs"
  >
    <MessageSquare className="h-3 w-3 flex-shrink-0 lg:h-3.5 lg:w-3.5" />
    <span className="truncate lg:hidden">Feedback</span>
    <span className="hidden lg:inline">Leave Feedback</span>
  </button>
                               ) : canJoinSession(session) && (
                                <button
                                  type="button"
                                  onClick={(event) => {
                                    event.stopPropagation();
                                    handleJoin(session);
                                  }}
                                  disabled={joiningId === session.id}
                                  className="mt-auto flex items-center justify-center gap-1 rounded-lg bg-white/20 px-2 py-1.5 text-[10px] font-semibold text-white backdrop-blur-sm transition-all hover:bg-white/30 disabled:opacity-50 md:px-2.5 md:text-[11px] lg:gap-1.5 lg:px-3 lg:text-xs"
                                >
                                  <Video className="h-3 w-3" />
                                  {joiningId === session.id ? 'Joining...' : 'Join'}
                                </button>
                              )}
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
    ) : (
      /* Table View */
      <div className="rounded-2xl bg-white shadow-sm ring-1 ring-[#e5e7eb] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] xl:min-w-0">
            <thead>
              <tr className="bg-[#f8fafc]">
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[#6b7280] lg:px-6 lg:py-4">
                  Mentor
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[#6b7280] lg:px-6 lg:py-4">
                  Date
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[#6b7280] lg:px-6 lg:py-4">
                  Time
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[#6b7280] lg:px-6 lg:py-4">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[#6b7280] lg:px-6 lg:py-4">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e5e7eb]">
              {filteredSessions.map((session) => (
                <tr
                  key={session.id}
                  className="group transition-colors hover:bg-[#f5f3ff]/30"
                >
                  {/* Mentor */}
                  <td className="px-4 py-3 lg:px-6 lg:py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-xl bg-[#f5f3ff]">
                        {session.mentorAvatar ? (
                          <img
                            src={session.mentorAvatar}
                            alt={session.mentorName}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <User className="h-5 w-5 text-[#5D3699]" />
                        )}
                      </div>
                      <div>
                        <span className="font-medium text-[#111827] group-hover:text-[#5D3699] transition-colors">
                          {session.mentorName}
                        </span>
                      </div>
                    </div>
                  </td>

                  {/* Date */}
                  <td className="px-4 py-3 lg:px-6 lg:py-4">
                    <div className="flex items-center gap-2 text-sm text-[#6b7280]">
                      <Calendar className="h-4 w-4 text-[#9ca3af]" />
                      {formatDate(session.scheduled_start)}
                    </div>
                  </td>

                  {/* Time */}
                  <td className="px-4 py-3 lg:px-6 lg:py-4">
                    <div className="flex items-center gap-2 text-sm text-[#6b7280]">
                      <Clock className="h-4 w-4 text-[#9ca3af]" />
                      {session.timeRange}
                    </div>
                  </td>

                  {/* Status */}
                  <td className="px-4 py-3 lg:px-6 lg:py-4">
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${
                        isPastSession(session)
                          ? 'bg-[#f5f3ff] text-[#6b7280]'
                          : 'bg-green-50 text-green-700 ring-1 ring-green-600/10'
                      }`}
                    >
                      {isPastSession(session) ? (
                        <>
                          <CheckCircle2 className="h-3 w-3" />
                          Completed
                        </>
                      ) : (
                        session.status || 'Scheduled'
                      )}
                    </span>
                  </td>

                  {/* Action */}
                  <td className="px-4 py-3 lg:px-6 lg:py-4">
                    {isFeedbackEligible(session) ? (
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedSessionId(session.id);
                          navigate('/feedback');
                        }}
                        className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2 text-sm font-medium text-[#5D3699] ring-1 ring-[#5D3699]/20 transition-all hover:bg-[#f5f3ff] hover:ring-[#5D3699]/40"
                      >
                        <MessageSquare className="h-4 w-4" />
                        Leave Feedback
                      </button>
                    ) : canJoinSession(session) ? (
                      <button
                        type="button"
                        onClick={() => handleJoin(session)}
                        disabled={joiningId === session.id}
                        className="inline-flex items-center gap-2 rounded-xl bg-[#5D3699] px-4 py-2 text-sm font-medium text-white shadow-sm transition-all hover:bg-[#4a2b7a] hover:shadow-md disabled:opacity-50"
                      >
                        {joiningId === session.id ? (
                          <>
                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                            Joining...
                          </>
                        ) : (
                          <>
                            <Video className="h-4 w-4" />
                            Join Call
                            <ArrowRight className="h-4 w-4" />
                          </>
                        )}
                      </button>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 text-sm text-[#9ca3af]">
                        <span className="h-2 w-2 rounded-full bg-[#e5e7eb]" />
                        {getJoinUnavailableLabel(session)}
                      </span>
                    )}
                  </td>
                </tr>
              ))}

              {/* Empty State */}
              {!filteredSessions.length && !loading && (
                <tr>
                  <td colSpan={5} className="px-4 py-16 text-center lg:px-6">
                    <div className="flex flex-col items-center">
                      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#f5f3ff]">
                        <Calendar className="h-8 w-8 text-[#9ca3af]" />
                      </div>
                      <h3 className="mt-4 text-base font-semibold text-[#111827]">
                        No sessions found
                      </h3>
                      <p className="mt-1 text-sm text-[#6b7280]">
                        Try adjusting your filters or search criteria
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          setSearchValue('');
                          setFilterValue('All');
                        }}
                        className="mt-4 inline-flex items-center gap-2 rounded-lg bg-[#f5f3ff] px-4 py-2 text-sm font-medium text-[#5D3699] transition-colors hover:bg-[#ede9fe]"
                      >
                        Clear Filters
                      </button>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    )}

    {/* Quick Stats Bar (Optional Enhancement) */}
    {!loading && filteredSessions.length > 0 && (
      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-[#e5e7eb]">
          <div className="flex items-center justify-between">
            <span className="text-xs text-[#6b7280]">Total Sessions</span>
            <Calendar className="h-4 w-4 text-[#5D3699]" />
          </div>
          <p className="mt-2 text-2xl font-bold text-[#111827]">{filteredSessions.length}</p>
        </div>
        <div className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-[#e5e7eb]">
          <div className="flex items-center justify-between">
            <span className="text-xs text-[#6b7280]">Upcoming</span>
            <Clock className="h-4 w-4 text-[#5D3699]" />
          </div>
          <p className="mt-2 text-2xl font-bold text-[#111827]">
            {filteredSessions.filter(s => !isPastSession(s)).length}
          </p>
        </div>
        <div className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-[#e5e7eb]">
          <div className="flex items-center justify-between">
            <span className="text-xs text-[#6b7280]">Completed</span>
            <CheckCircle2 className="h-4 w-4 text-green-600" />
          </div>
          <p className="mt-2 text-2xl font-bold text-[#111827]">
            {filteredSessions.filter(s => isPastSession(s)).length}
          </p>
        </div>
        <div className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-[#e5e7eb]">
          <div className="flex items-center justify-between">
            <span className="text-xs text-[#6b7280]">Need Feedback</span>
            <MessageSquare className="h-4 w-4 text-[#f59e0b]" />
          </div>
          <p className="mt-2 text-2xl font-bold text-[#111827]">
            {filteredSessions.filter(s => isFeedbackEligible(s)).length}
          </p>
        </div>
      </div>
    )}
  </div>
);
};

export default MySessions;
