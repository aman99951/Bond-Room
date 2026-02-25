import React, { useEffect, useMemo, useState } from 'react';
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

const MySessions = () => {
  const [view, setView] = useState('calendar');
  const navigate = useNavigate();
  const { mentor } = useMentorData();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [joinError, setJoinError] = useState('');
  const [joiningId, setJoiningId] = useState(null);
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
      return undefined;
    }
    const loadSessions = async () => {
      setLoading(true);
      setError('');
      try {
        const response = await mentorApi.listSessions({ mentor_id: mentor.id });
        const list = Array.isArray(response) ? response : response?.results || [];
        if (!cancelled) {
          setSessions(list);
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
    loadSessions();
    return () => {
      cancelled = true;
    };
  }, [mentor?.id]);

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
      const start = new Date(session.scheduled_start);
      const end = new Date(session.scheduled_end || session.scheduled_start);
      const sessionDateKey = formatIndiaDateKey(session.scheduled_start);
      const dayIndex = sessionDateKey ? diffDateKeys(weekStartKey, sessionDateKey) : -1;
      const indiaHour = getIndiaHour(session.scheduled_start);
      const hourIndex = hours.findIndex((label) => parseHourLabel(label) === indiaHour);
      const joinUrl = session?.meeting_url || session?.join_url || session?.host_join_url || '';
      const menteeName = (getMenteeName(session) || '').trim() || 'Mentee';
      return {
        id: session.id,
        dayIndex,
        hourIndex,
        title: menteeName,
        menteeAvatar: getMenteeAvatar(session),
        time: formatTimeRange(session.scheduled_start, session.scheduled_end),
        tone: session.status === 'completed' ? 'light' : 'dark',
        isPast: !Number.isNaN(end.getTime()) && end < now,
        joinUrl,
      };
    });
  }, [sessionsThisWeek, weekStartKey]);

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
    setJoinError('');
    const existing = getJoinUrl(session);
    const isWrongRolePath =
      typeof existing === 'string' && existing.includes('/mentee-meeting-room');
    if (existing && !isWrongRolePath) {
      openJoinLink(existing, session.id);
      return;
    }
    setJoiningId(session.id);
    try {
      const response = await mentorApi.getSessionJoinLink(session.id);
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

  const getJoinUrl = (session) =>
    session?.host_join_url || session?.meeting_url || session?.joinUrl || session?.join_url || '';

return (
  <div className="min-h-screenp-4 sm:p-6 lg:p-8">
    {/* Header Section */}
    <div className="mb-8">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        {/* Title with decorative element */}
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#5D3699] shadow-lg shadow-[#5D3699]/20">
            <Calendar className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
              My Sessions
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              Manage and track all your mentoring sessions
            </p>
          </div>
        </div>

        {/* Controls Section */}
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
          {/* Search Input */}
          <div className="relative w-full sm:w-auto">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              className="h-11 w-full rounded-xl border-0 bg-white pl-11 pr-4 text-sm text-gray-900 shadow-sm ring-1 ring-gray-200 placeholder:text-gray-400 focus:ring-2 focus:ring-[#5D3699] sm:w-64 transition-all duration-200"
              placeholder="Search mentee..."
              value={searchValue}
              onChange={(event) => setSearchValue(event.target.value)}
            />
            {searchValue && (
              <button
                onClick={() => setSearchValue('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 hover:bg-gray-100 transition-colors"
              >
                <X className="h-3 w-3 text-gray-400" />
              </button>
            )}
          </div>

          {/* Filter Dropdown */}
          <div className="relative" tabIndex={0} onBlur={() => setFilterOpen(false)}>
            <button
              type="button"
              className="flex h-11 w-full items-center justify-between gap-2 rounded-xl bg-white px-4 text-sm text-gray-700 shadow-sm ring-1 ring-gray-200 hover:bg-gray-50 sm:w-40 transition-all duration-200"
              onClick={() => setFilterOpen((o) => !o)}
            >
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-gray-400" />
                <span>{filterValue}</span>
              </div>
              <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform duration-200 ${filterOpen ? 'rotate-180' : ''}`} />
            </button>
            {filterOpen && (
              <ul className="absolute z-20 mt-2 w-full origin-top-right rounded-xl border-0 bg-white py-2 shadow-xl ring-1 ring-gray-100 animate-in fade-in slide-in-from-top-2 duration-200">
                {filterOptions.map((opt) => (
                  <li key={opt}>
                    <button
                      type="button"
                      className={`w-full px-4 py-2.5 text-left text-sm transition-colors ${
                        filterValue === opt
                          ? 'bg-[#5D3699]/10 text-[#5D3699] font-medium'
                          : 'text-gray-700 hover:bg-gray-50'
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
          <div className="relative" tabIndex={0} onBlur={() => setWeekFilterOpen(false)}>
            <button
              type="button"
              className="flex h-11 w-full items-center justify-between gap-2 rounded-xl bg-white px-4 text-sm text-gray-700 shadow-sm ring-1 ring-gray-200 hover:bg-gray-50 sm:w-36 transition-all duration-200"
              onClick={() => setWeekFilterOpen((o) => !o)}
            >
              <span>{weekFilterValue}</span>
              <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform duration-200 ${weekFilterOpen ? 'rotate-180' : ''}`} />
            </button>
            {weekFilterOpen && (
              <ul className="absolute z-20 mt-2 w-full origin-top-right rounded-xl border-0 bg-white py-2 shadow-xl ring-1 ring-gray-100 animate-in fade-in slide-in-from-top-2 duration-200">
                {weekFilterOptions.map((opt) => (
                  <li key={opt}>
                    <button
                      type="button"
                      className={`w-full px-4 py-2.5 text-left text-sm transition-colors ${
                        weekFilterValue === opt
                          ? 'bg-[#5D3699]/10 text-[#5D3699] font-medium'
                          : 'text-gray-700 hover:bg-gray-50'
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
          <div className="flex h-11 items-center rounded-xl bg-white p-1 shadow-sm ring-1 ring-gray-200">
            <button
              className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all duration-200 ${
                view === 'calendar'
                  ? 'bg-[#5D3699] text-white shadow-md'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
              onClick={() => setView('calendar')}
            >
              <Calendar className="h-4 w-4" />
              <span className="hidden sm:inline">Calendar</span>
            </button>
            <button
              className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all duration-200 ${
                view === 'table'
                  ? 'bg-[#5D3699] text-white shadow-md'
                  : 'text-gray-600 hover:text-gray-900'
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

    {/* Calendar View */}
    {view === 'calendar' ? (
      <div className="rounded-2xl bg-white shadow-sm ring-1 ring-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <div className="min-w-[1100px]">
            {/* Calendar Header */}
            <div className="grid grid-cols-[100px_repeat(7,1fr)] bg-gray-50">
              <div className="p-4" />
              {days.map((d) => (
                <div
                  key={`${d.label}-${d.dateKey}`}
                  className={`p-4 text-center border-l border-gray-100 transition-colors ${
                    d.active ? 'bg-[#5D3699]/5' : ''
                  }`}
                >
                  <div className={`text-xs font-medium uppercase tracking-wider ${
                    d.active ? 'text-[#5D3699]' : 'text-gray-400'
                  }`}>
                    {d.label}
                  </div>
                  <div
                    className={`mt-2 inline-flex h-10 w-10 items-center justify-center rounded-xl text-lg font-bold transition-all ${
                      d.active
                        ? 'bg-[#5D3699] text-white shadow-lg shadow-[#5D3699]/30'
                        : 'text-gray-800'
                    }`}
                  >
                    {d.dayNumber}
                  </div>
                </div>
              ))}
            </div>

            {/* Calendar Body */}
            <div className="divide-y divide-gray-100">
              {hours.map((h, idx) => {
                const rowHasJoin = calendarEntries.some((s) => s.hourIndex === idx && !s.isPast);
                return (
                  <div key={h} className="grid grid-cols-[100px_repeat(7,1fr)]">
                    <div className="flex items-start justify-end p-3 pr-4 text-xs font-medium text-gray-400">
                      {h}
                    </div>
                    {days.map((d, c) => {
                      const session = calendarEntries.find((s) => s.dayIndex === c && s.hourIndex === idx);
                      return (
                        <div
                          key={`${h}-${d.label}`}
                          className={`relative border-l border-gray-100 p-2 transition-colors ${
                            rowHasJoin ? 'min-h-[110px]' : 'min-h-[70px]'
                          } ${d.active ? 'bg-[#5D3699]/[0.02]' : 'hover:bg-gray-50/50'}`}
                        >
                          {session && (
                            <div
                              role="button"
                              tabIndex={0}
                              onClick={() => {
                                setSelectedSessionId(session.id);
                                if (session?.tone === 'light') {
                                  navigate('/mentor-session-completed');
                                }
                              }}
                              onKeyDown={(event) => {
                                if (event.key === 'Enter') {
                                  setSelectedSessionId(session.id);
                                  if (session?.tone === 'light') {
                                    navigate('/mentor-session-completed');
                                  }
                                }
                              }}
                              className={`group absolute inset-2 flex flex-col rounded-xl p-3 transition-all duration-200 cursor-pointer ${
                                session.tone === 'light'
                                  ? 'bg-gray-100 hover:bg-gray-200 ring-1 ring-gray-200'
                                  : 'bg-[#5D3699] hover:bg-[#4a2b7a] shadow-lg shadow-[#5D3699]/20'
                              } ${session.isPast ? 'opacity-60' : ''}`}
                            >
                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  className={`flex h-6 w-6 flex-shrink-0 items-center justify-center overflow-hidden rounded-full text-[10px] font-semibold ${
                                    session.tone === 'light'
                                      ? 'bg-[#e5e7eb] text-[#374151]'
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
                                      ? 'text-gray-800 hover:text-[#5D3699]'
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
                              <div className={`mt-1 flex items-center gap-1 text-xs ${
                                session.tone === 'light' ? 'text-gray-500' : 'text-white/80'
                              }`}>
                                <Clock className="h-3 w-3" />
                                <span className={session.tone === 'light' ? 'line-through' : ''}>
                                  {session.time}
                                </span>
                              </div>
                              {!session.isPast && (
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
      <div className="rounded-2xl bg-white shadow-sm ring-1 ring-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px]">
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
                  Status
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredSessions.map((session) => (
                <tr
                  key={session.id}
                  className="group transition-colors hover:bg-gray-50/50"
                >
                  <td className="px-6 py-4">
                    <button
                      type="button"
                      className="flex items-center gap-3 text-left"
                      onClick={() => navigate(`/mentor-mentee-profile/${session.id}`)}
                    >
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#5D3699]/10 text-sm font-semibold text-[#5D3699]">
                        {getMenteeAvatar(session) ? (
                          <img src={getMenteeAvatar(session)} alt="" className="h-full w-full rounded-full object-cover" />
                        ) : (
                          getMenteeName(session).charAt(0).toUpperCase()
                        )}
                      </div>
                      <div>
                        <span className="font-medium text-gray-900 group-hover:text-[#5D3699] transition-colors">
                          {getMenteeName(session)}
                        </span>
                      </div>
                    </button>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      {formatDateLabel(session.scheduled_start)}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Clock className="h-4 w-4 text-gray-400" />
                      {formatTimeRange(session.scheduled_start, session.scheduled_end)}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${
                        isPastSession(session)
                          ? 'bg-gray-100 text-gray-600'
                          : 'bg-green-50 text-green-700 ring-1 ring-green-600/20'
                      }`}
                    >
                      {isPastSession(session) ? 'Completed' : session.status || 'Scheduled'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {!isPastSession(session) ? (
                      <button
                        type="button"
                        onClick={() => handleJoin(session)}
                        className="inline-flex items-center gap-2 rounded-xl bg-[#5D3699] px-4 py-2 text-sm font-medium text-white shadow-sm transition-all hover:bg-[#4a2b7a] hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={joiningId === session.id}
                      >
                        <Video className="h-4 w-4" />
                        {joiningId === session.id ? 'Joining...' : 'Join Call'}
                        <ArrowRight className="h-4 w-4" />
                      </button>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 text-sm text-gray-400">
                        <span className="h-2 w-2 rounded-full bg-gray-300" />
                        Session Ended
                      </span>
                    )}
                  </td>
                </tr>
              ))}
              {!filteredSessions.length && (
                <tr>
                  <td colSpan={5} className="px-6 py-16 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
                        <Calendar className="h-8 w-8 text-gray-400" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">No sessions found</p>
                        <p className="mt-1 text-sm text-gray-500">
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
        error ? 'bg-red-50 text-red-600' : 'bg-gray-50 text-gray-600'
      }`}>
        {loading && (
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-gray-300 border-t-[#5D3699]" />
        )}
        <span className="text-sm font-medium">{error || 'Loading sessions...'}</span>
      </div>
    )}

    {joinError && (
      <div className="mt-4 flex items-center gap-2 rounded-xl bg-red-50 p-4 text-sm text-red-600 ring-1 ring-red-100">
        <span className="font-medium">{joinError}</span>
      </div>
    )}
  </div>
);
};

export default MySessions;
