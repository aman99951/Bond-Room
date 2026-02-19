import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, ChevronDown } from 'lucide-react';
import { mentorApi } from '../../../apis/api/mentorApi';
import { useMentorData } from '../../../apis/apihook/useMentorData';
import { setSelectedSessionId } from '../../../apis/api/storage';

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

const getStartOfWeek = (date) => {
  const copy = new Date(date);
  const day = (copy.getDay() + 6) % 7;
  copy.setDate(copy.getDate() - day);
  copy.setHours(0, 0, 0, 0);
  return copy;
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
  const start = new Date(startValue);
  const end = new Date(endValue);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return 'Time TBD';
  const startLabel = start.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  const endLabel = end.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  return `${startLabel} - ${endLabel}`;
};

const formatDateLabel = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Date TBD';
  return date.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
};

const getMenteeName = (session) => {
  const fullName = [session?.mentee_first_name, session?.mentee_last_name]
    .filter(Boolean)
    .join(' ')
    .trim();
  if (fullName) return fullName;
  if (session?.mentee_name) return session.mentee_name;
  if (session?.mentee) return `Mentee #${session.mentee}`;
  return 'Mentee';
};

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
  const weekStart = useMemo(() => getStartOfWeek(new Date()), []);
  const weekEnd = useMemo(() => {
    const end = new Date(weekStart);
    end.setDate(weekStart.getDate() + 7);
    return end;
  }, [weekStart]);
  const days = useMemo(
    () =>
      dayLabels.map((label, index) => {
        const date = new Date(weekStart);
        date.setDate(weekStart.getDate() + index);
        return {
          label,
          date,
          active: new Date().toDateString() === date.toDateString(),
        };
      }),
    [weekStart]
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
        if (!cancelled) setSessions(list);
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
        const start = new Date(session.scheduled_start);
        if (Number.isNaN(start.getTime())) return false;
        if (start < weekStart || start >= weekEnd) return false;
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
  }, [filterValue, sessions, weekFilterValue, weekStart, weekEnd, searchValue]);

  const sessionsThisWeek = useMemo(() => {
    return filteredSessions.filter((session) => {
      const start = new Date(session.scheduled_start);
      return !Number.isNaN(start.getTime()) && start >= weekStart && start < weekEnd;
    });
  }, [filteredSessions, weekStart, weekEnd]);

  const calendarEntries = useMemo(() => {
    const now = new Date();
    return sessionsThisWeek
      .filter((session) => session?.status !== 'requested')
      .map((session) => {
      const start = new Date(session.scheduled_start);
      const end = new Date(session.scheduled_end || session.scheduled_start);
      const dayIndex = Math.floor((start - weekStart) / (1000 * 60 * 60 * 24));
      const hourIndex = hours.findIndex((label) => parseHourLabel(label) === start.getHours());
      const joinUrl = session?.join_url || session?.host_join_url || '';
      return {
        id: session.id,
        dayIndex,
        hourIndex,
        title: getMenteeName(session),
        time: formatTimeRange(session.scheduled_start, session.scheduled_end),
        tone: session.status === 'completed' ? 'light' : 'dark',
        isPast: !Number.isNaN(end.getTime()) && end < now,
        joinUrl,
      };
    });
  }, [sessionsThisWeek, weekStart]);

  const openJoinLink = (url, sessionId) => {
    if (!url) return false;
    const params = new URLSearchParams({
      url,
      sessionId: String(sessionId || ''),
    });
    navigate(`/mentor-zoom-meeting?${params.toString()}`);
    return true;
  };

  const handleJoin = async (session) => {
    if (!session?.id) return;
    setJoinError('');
    const existing = getJoinUrl(session);
    if (existing) {
      setSelectedSessionId(session.id);
      openJoinLink(existing, session.id);
      return;
    }
    setJoiningId(session.id);
    try {
      const response = await mentorApi.getSessionJoinLink(session.id);
      const url = response?.join_url || response?.host_join_url || '';
      if (url) {
        setSessions((prev) =>
          prev.map((item) =>
            item.id === session.id
              ? {
                  ...item,
                  join_url: response?.join_url || item.join_url,
                  host_join_url: response?.host_join_url || item.host_join_url,
                }
              : item
          )
        );
        setSelectedSessionId(session.id);
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

  const getJoinUrl = (session) => session?.joinUrl || session?.join_url || session?.host_join_url || '';

  return (
    <div className="p-4 sm:p-6 bg-transparent">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <h1
          className="text-[#111827]"
          style={{ fontFamily: 'DM Sans', fontSize: '30px', lineHeight: '36px', fontWeight: 700 }}
        >
          My Sessions
        </h1>

        <div className="flex flex-wrap items-center gap-3">
          <label className="inline-flex items-center gap-2 rounded-full border border-[#e5e7eb] bg-white px-4 py-2 text-xs text-[#6b7280] min-w-[220px]">
            <Search className="h-4 w-4 text-[#9ca3af]" />
            <input
              className="outline-none text-xs bg-transparent w-full"
              placeholder="Search mentee..."
              value={searchValue}
              onChange={(event) => setSearchValue(event.target.value)}
            />
          </label>

          <div className="relative" tabIndex={0} onBlur={() => setFilterOpen(false)}>
            <button
              type="button"
              className="inline-flex items-center justify-between gap-2 rounded-md border border-[#e5e7eb] bg-white px-3 py-2 text-xs text-[#6b7280] min-w-[140px]"
              onClick={() => setFilterOpen((o) => !o)}
            >
              Filter: {filterValue}
              <ChevronDown className="h-4 w-4" />
            </button>
            {filterOpen && (
              <ul className="absolute z-10 mt-1 w-full rounded-md border border-[#e5e7eb] bg-white text-[#111827] text-xs shadow">
                {filterOptions.map((opt) => (
                  <li key={opt}>
                    <button
                      type="button"
                      className="w-full text-left px-3 py-2 hover:bg-[#f3f4f6]"
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

          <div className="relative" tabIndex={0} onBlur={() => setWeekFilterOpen(false)}>
            <button
              type="button"
              className="inline-flex items-center justify-between gap-2 rounded-md border border-[#e5e7eb] bg-white px-3 py-2 text-xs text-[#6b7280] min-w-[120px]"
              onClick={() => setWeekFilterOpen((o) => !o)}
            >
              {weekFilterValue}
              <ChevronDown className="h-4 w-4" />
            </button>
            {weekFilterOpen && (
              <ul className="absolute z-10 mt-1 w-full rounded-md border border-[#e5e7eb] bg-white text-[#111827] text-xs shadow">
                {weekFilterOptions.map((opt) => (
                  <li key={opt}>
                    <button
                      type="button"
                      className="w-full text-left px-3 py-2 hover:bg-[#f3f4f6]"
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

          <div className="inline-flex rounded-full border border-[#e5e7eb] bg-white overflow-hidden">
            <button
              className={`px-4 py-2 text-xs ${view === 'calendar' ? 'bg-[#5D3699] text-white' : 'text-[#6b7280]'}`}
              onClick={() => setView('calendar')}
            >
              Calendar
            </button>
            <button
              className={`px-4 py-2 text-xs ${view === 'table' ? 'bg-[#5D3699] text-white' : 'text-[#6b7280]'}`}
              onClick={() => setView('table')}
            >
              Table
            </button>
          </div>
        </div>
      </div>

      {view === 'calendar' ? (
        <div className="mt-4 rounded-xl border border-[#e5e7eb] bg-white overflow-x-auto shadow-[0px_1px_2px_0px_rgba(0,0,0,0.08)]">
          <div className="min-w-[1100px]" style={{ height: '716px' }}>
            <div className="grid grid-cols-[120px_repeat(7,142px)] border-b border-[#e5e7eb] text-xs text-[#6b7280]">
              <div className="p-3" />
              {days.map((d) => (
                <div key={d.label} className={`p-3 text-center border-l border-r border-[#e5e7eb] ${d.active ? 'bg-[#f8fafc]' : ''}`}>
                  <div className={`text-xs ${d.active ? 'text-[#5D3699] font-semibold' : 'text-[#6b7280]'}`}>{d.label}</div>
                  <div
                    className={`mt-1 inline-flex h-6 w-6 items-center justify-center rounded-full ${
                      d.active ? 'bg-[#5D3699] text-white' : ''
                    }`}
                    style={
                      d.active
                        ? { fontFamily: 'Inter', fontSize: '16px', lineHeight: '20px', fontWeight: 600, color: '#ffffff' }
                        : { fontFamily: 'DM Sans', fontSize: '22px', lineHeight: '28px', fontWeight: 700, color: '#1A202C' }
                    }
                  >
                    {d.date.getDate()}
                  </div>
                </div>
              ))}
            </div>

            {hours.map((h, idx) => {
              const rowHasJoin = calendarEntries.some((s) => s.hourIndex === idx && !s.isPast);
              return (
              <div key={h} className="grid grid-cols-[120px_repeat(7,142px)] border-b border-[#e5e7eb] text-xs">
                <div
                  className="p-3 text-[#6b7280]"
                  style={{ fontFamily: 'DM Sans', fontSize: '14px', lineHeight: '20px', fontWeight: 400, textAlign: 'right' }}
                >
                  {h}
                </div>
                {days.map((d, c) => {
                  const session = calendarEntries.find((s) => s.dayIndex === c && s.hourIndex === idx);
                  return (
                    <div
                      key={`${h}-${d.label}`}
                      className={`border-l border-r border-[#e5e7eb] p-2 ${rowHasJoin ? 'h-24' : 'h-16'} relative ${d.active ? 'bg-[#f8fafc]' : ''}`}
                    >
                      {session && (
                        <div
                          className={`absolute inset-2 rounded-[6px] px-2 py-2 ${
                            session.tone === 'light'
                              ? 'bg-[#f3f4f6] text-[#374151]'
                              : 'bg-[#5D3699] text-white'
                          } ${session.isPast ? 'opacity-50' : ''}`}
                        >
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
                            className="flex flex-col items-center gap-0.5"
                          >
                            <button
                              type="button"
                              className="max-w-full truncate text-center underline-offset-2 hover:underline"
                              style={{ fontFamily: 'Inter', fontSize: '13px', lineHeight: '18px', fontWeight: 600 }}
                              onClick={(event) => {
                                event.stopPropagation();
                                navigate(`/mentor-mentee-profile/${session.id}`);
                              }}
                            >
                              {session.title}
                            </button>
                            <div
                              style={{
                                fontFamily: 'DM Sans',
                                fontSize: '11px',
                                lineHeight: '15px',
                                fontWeight: 400,
                                textAlign: 'center',
                                textDecoration: session.tone === 'light' ? 'line-through' : 'none',
                              }}
                            >
                              {session.time}
                            </div>
                          </div>
                          {!session.isPast && (
                            <div className="mt-1 flex justify-center">
                              <button
                                type="button"
                                onClick={(event) => {
                                  event.stopPropagation();
                                  handleJoin(session);
                                }}
                                className="inline-flex items-center justify-center rounded-full border border-white/60 bg-white/20 px-2 py-0.5 text-[9px] font-semibold text-white disabled:opacity-70"
                                disabled={joiningId === session.id}
                              >
                                {joiningId === session.id ? 'Joining...' : 'Join'}
                              </button>
                            </div>
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
      ) : (
        <div className="mt-4 rounded-xl border border-[#e5e7eb] bg-white overflow-x-auto shadow-[0px_1px_2px_0px_rgba(0,0,0,0.08)]">
          <table className="min-w-[640px] w-full text-xs">
            <thead className="bg-[#f8fafc] text-[#6b7280]">
              <tr>
                <th className="text-left p-3 border-b border-[#e5e7eb]">Mentee</th>
                <th className="text-left p-3 border-b border-[#e5e7eb]">Date</th>
                <th className="text-left p-3 border-b border-[#e5e7eb]">Time</th>
                <th className="text-left p-3 border-b border-[#e5e7eb]">Type</th>
                <th className="text-left p-3 border-b border-[#e5e7eb]">Join</th>
              </tr>
            </thead>
            <tbody>
              {filteredSessions.map((session) => (
                <tr key={session.id} className="border-b border-[#e5e7eb]">
                  <td className="p-3 text-[#111827]">
                    <button
                      type="button"
                      className="text-left text-[#5D3699] hover:underline"
                      onClick={() => navigate(`/mentor-mentee-profile/${session.id}`)}
                    >
                      {getMenteeName(session)}
                    </button>
                  </td>
                  <td className="p-3 text-[#6b7280]">{formatDateLabel(session.scheduled_start)}</td>
                  <td className="p-3 text-[#6b7280]">{formatTimeRange(session.scheduled_start, session.scheduled_end)}</td>
                  <td className="p-3 text-[#6b7280]">{session.status || 'Session'}</td>
                  <td className="p-3">
                    {!isPastSession(session) ? (
                      <button
                        type="button"
                        onClick={() => handleJoin(session)}
                        className="inline-flex items-center rounded-md bg-[#5D3699] px-3 py-1.5 text-[11px] text-white disabled:opacity-70"
                        disabled={joiningId === session.id}
                      >
                        {joiningId === session.id ? 'Joining...' : 'Join Call'}
                      </button>
                    ) : (
                      <span className="text-[#cbd5f5]">Ended</span>
                    )}
                  </td>
                </tr>
              ))}
              {!filteredSessions.length && (
                <tr className="border-b border-[#e5e7eb]">
                  <td className="p-3 text-xs text-[#6b7280]" colSpan={5}>
                    No sessions found for this view.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
      {(loading || error) && (
        <div className={`mt-3 text-xs ${error ? 'text-red-600' : 'text-[#6b7280]'}`}>
          {error || 'Loading sessions...'}
        </div>
      )}
      {joinError && <div className="mt-2 text-xs text-red-600">{joinError}</div>}
    </div>
  );
};

export default MySessions;
