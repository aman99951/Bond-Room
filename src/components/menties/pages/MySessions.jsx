import React, { useEffect, useMemo, useState } from 'react';
import { Search, ChevronDown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { menteeApi } from '../../../apis/api/menteeApi';
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

const normalizeList = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.results)) return payload.results;
  return [];
};

const startOfWeek = (date) => {
  const nextDate = new Date(date);
  const day = (nextDate.getDay() + 6) % 7;
  nextDate.setDate(nextDate.getDate() - day);
  nextDate.setHours(0, 0, 0, 0);
  return nextDate;
};

const endOfWeek = (date) => {
  const nextDate = new Date(date);
  nextDate.setDate(nextDate.getDate() + 7);
  nextDate.setHours(0, 0, 0, 0);
  return nextDate;
};

const formatDate = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
};

const formatTimeRange = (startValue, endValue) => {
  const start = new Date(startValue);
  const end = new Date(endValue);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return '-';
  const startLabel = start.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  const endLabel = end.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  return `${startLabel} - ${endLabel}`;
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

const isFeedbackEligible = (session) => session?.status === 'completed';

const getJoinUrl = (session) => session?.join_url || session?.joinUrl || '';

const isPastSession = (session) => {
  const end = new Date(session?.scheduled_end || session?.scheduled_start || '');
  if (Number.isNaN(end.getTime())) return false;
  return end < new Date();
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [joinError, setJoinError] = useState('');
  const [joiningId, setJoiningId] = useState(null);
  const filterOptions = ['All Types', 'Upcoming', 'Completed'];
  const weekFilterOptions = ['This Week', 'All Time'];

  useEffect(() => {
    let cancelled = false;

    const loadSessions = async () => {
      setLoading(true);
      setError('');
      try {
        const [sessionResponse, mentorResponse] = await Promise.all([
          menteeApi.listSessions(),
          menteeApi.listMentors(),
        ]);
        if (cancelled) return;
        const sessionItems = normalizeList(sessionResponse);
        const mentorItems = normalizeList(mentorResponse);
        const nextMentorMap = {};
        mentorItems.forEach((mentor) => {
          const fullName = `${mentor?.first_name || ''} ${mentor?.last_name || ''}`.trim();
          nextMentorMap[String(mentor.id)] = {
            name: fullName || `Mentor #${mentor?.id}`,
          };
        });
        setSessions(sessionItems);
        setMentorMap(nextMentorMap);
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

    loadSessions();
    return () => {
      cancelled = true;
    };
  }, []);

  const weekStart = useMemo(() => startOfWeek(new Date()), []);
  const weekEnd = useMemo(() => endOfWeek(weekStart), [weekStart]);

  const days = useMemo(() => {
    const labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    return labels.map((label, index) => {
      const date = new Date(weekStart);
      date.setDate(weekStart.getDate() + index);
      const now = new Date();
      return {
        label,
        date: date.getDate(),
        iso: date.toISOString().slice(0, 10),
        active:
          date.getDate() === now.getDate() &&
          date.getMonth() === now.getMonth() &&
          date.getFullYear() === now.getFullYear(),
      };
    });
  }, [weekStart]);

  const enrichedSessions = useMemo(() => {
    return sessions.map((session) => {
      const start = new Date(session.scheduled_start);
      const end = new Date(session.scheduled_end || session.scheduled_start);
      const dayIndex = Number.isNaN(start.getTime()) ? -1 : (start.getDay() + 6) % 7;
      const hourIndex = Number.isNaN(start.getTime()) ? -1 : Math.max(0, start.getHours() - 8);
      const mentorName = mentorMap[String(session.mentor)]?.name || `Mentor #${session.mentor}`;
      const tone = ['completed', 'canceled', 'no_show'].includes(session.status) ? 'light' : 'dark';
      const isPast = !Number.isNaN(end.getTime()) && end < new Date();
      return {
        ...session,
        mentorName,
        dayIndex,
        hourIndex,
        tone,
        isPast,
        timeRange: formatTimeRange(session.scheduled_start, session.scheduled_end),
      };
    });
  }, [sessions, mentorMap]);

  const filteredSessions = useMemo(() => {
    return enrichedSessions.filter((session) => {
      if (filterValue === 'Upcoming' && !isUpcomingStatus(session)) return false;
      if (filterValue === 'Completed' && !isCompletedStatus(session)) return false;
      if (weekFilterValue === 'This Week') {
        const start = new Date(session?.scheduled_start || '');
        if (Number.isNaN(start.getTime())) return false;
        if (start < weekStart || start >= weekEnd) return false;
      }
      if (searchValue.trim()) {
        return session.mentorName.toLowerCase().includes(searchValue.trim().toLowerCase());
      }
      return true;
    });
  }, [enrichedSessions, filterValue, weekFilterValue, weekStart, weekEnd, searchValue]);

  const calendarSessions = useMemo(() => {
    return filteredSessions.filter((session) => {
      const start = new Date(session?.scheduled_start || '');
      if (Number.isNaN(start.getTime())) return false;
      if (start < weekStart || start >= weekEnd) return false;
      if (session?.status === 'requested') return false;
      return session.dayIndex >= 0 && session.hourIndex >= 0 && session.hourIndex < hours.length;
    });
  }, [filteredSessions, weekStart, weekEnd]);

  const openJoinLink = (url) => {
    if (!url) return false;
    window.open(url, '_blank', 'noopener,noreferrer');
    return true;
  };

  const handleJoin = async (session) => {
    if (!session?.id) return;
    setJoinError('');
    const existing = getJoinUrl(session);
    if (existing) {
      openJoinLink(existing);
      return;
    }
    setJoiningId(session.id);
    try {
      const response = await menteeApi.getSessionJoinLink(session.id);
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
        openJoinLink(url);
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
              placeholder="Search mentor..."
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

      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
      {joinError && <p className="mt-2 text-xs text-red-600">{joinError}</p>}
      {loading && <p className="mt-3 text-sm text-[#6b7280]">Loading sessions...</p>}

      {view === 'calendar' ? (
        <div className="mt-4 rounded-xl border border-[#e5e7eb] bg-white overflow-x-auto shadow-[0px_1px_2px_0px_rgba(0,0,0,0.08)]">
          <div className="min-w-[1000px]" style={{ height: '640px' }}>
            <div className="grid grid-cols-[100px_repeat(7,128px)] border-b border-[#e5e7eb] text-xs text-[#6b7280]">
              <div className="p-3" />
              {days.map((d) => (
                <div key={`${d.label}-${d.date}`} className={`p-3 text-center border-l border-r border-[#e5e7eb] ${d.active ? 'bg-[#f8fafc]' : ''}`}>
                  <div className={`text-xs ${d.active ? 'text-[#5D3699] font-semibold' : 'text-[#6b7280]'}`}>{d.label}</div>
                  <div
                    className={`mt-1 inline-flex h-6 w-6 items-center justify-center rounded-full ${
                      d.active ? 'bg-[#5D3699] text-white' : ''
                    }`}
                    style={
                      d.active
                        ? { fontFamily: 'Inter', fontSize: '16px', lineHeight: '20px', fontWeight: 600, color: '#ffffff' }
                        : { fontFamily: 'DM Sans', fontSize: '24px', lineHeight: '28px', fontWeight: 700, color: '#1A202C' }
                    }
                  >
                    {d.date}
                  </div>
                </div>
              ))}
            </div>

            {hours.map((h, idx) => {
              const rowHasJoin = calendarSessions.some((s) => s.hourIndex === idx && !s.isPast);
              const rowHasFeedback = calendarSessions.some(
                (s) => s.hourIndex === idx && isFeedbackEligible(s)
              );
              return (
              <div key={h} className="grid grid-cols-[100px_repeat(7,128px)] border-b border-[#e5e7eb] text-xs">
                <div
                  className="p-3 text-[#6b7280]"
                  style={{ fontFamily: 'DM Sans', fontSize: '12px', lineHeight: '18px', fontWeight: 400, textAlign: 'right' }}
                >
                  {h}
                </div>
                {days.map((d, c) => {
                  const session = calendarSessions.find((s) => s.dayIndex === c && s.hourIndex === idx);
                  return (
                    <div
                      key={`${h}-${d.label}`}
                      className={`border-l border-r border-[#e5e7eb] p-1.5 ${rowHasJoin || rowHasFeedback ? 'h-20' : 'h-14'} relative ${d.active ? 'bg-[#f8fafc]' : ''}`}
                    >
                      {session && (
                        <div
                          className={`absolute inset-1.5 rounded-[6px] px-2 py-1.5 ${
                            session.tone === 'light'
                              ? 'bg-[#f3f4f6] text-[#374151]'
                              : 'bg-[#5D3699] text-white'
                          } ${session.isPast ? 'opacity-50' : ''}`}
                        >
                          <div
                            role="button"
                            tabIndex={0}
                            onClick={() => setSelectedSessionId(session.id)}
                            onKeyDown={(event) => {
                              if (event.key === 'Enter') setSelectedSessionId(session.id);
                            }}
                          >
                          <div style={{ fontFamily: 'Inter', fontSize: '12px', lineHeight: '16px', fontWeight: 600, textAlign: 'center' }}>
                            {session.mentorName}
                          </div>
                          <div
                            style={{
                              fontFamily: 'DM Sans',
                              fontSize: '10px',
                              lineHeight: '14px',
                              fontWeight: 400,
                              textAlign: 'center',
                              textDecoration: session.tone === 'light' ? 'line-through' : 'none',
                            }}
                          >
                            {session.timeRange}
                          </div>
                          </div>
                          {isFeedbackEligible(session) ? (
                            <div className="mt-0.5 flex justify-center">
                              <button
                                type="button"
                                onClick={(event) => {
                                  event.stopPropagation();
                                  setSelectedSessionId(session.id);
                                  navigate('/feedback');
                                }}
                                className="inline-flex items-center justify-center rounded-full border border-[#5D3699] bg-white px-2 py-0.5 text-[9px] font-semibold text-[#5D3699]"
                              >
                                Leave Feedback
                              </button>
                            </div>
                          ) : (
                            !session.isPast && (
                            <div className="mt-0.5 flex justify-center">
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
                          ))}
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
        <div className="mt-4 rounded-xl border border-[#e5e7eb] bg-white overflow-hidden shadow-[0px_1px_2px_0px_rgba(0,0,0,0.08)]">
          <table className="w-full table-fixed text-xs">
            <thead className="bg-[#f8fafc] text-[#6b7280]">
              <tr>
                <th className="text-left p-3 border-b border-[#e5e7eb] w-[28%]">Mentor</th>
                <th className="text-left p-3 border-b border-[#e5e7eb] w-[20%]">Date</th>
                <th className="text-left p-3 border-b border-[#e5e7eb] w-[24%]">Time</th>
                <th className="text-left p-3 border-b border-[#e5e7eb] w-[14%]">Type</th>
                <th className="text-left p-3 border-b border-[#e5e7eb] w-[14%]">Join</th>
              </tr>
            </thead>
            <tbody>
              {filteredSessions.map((session) => (
                <tr key={`${session.id}`} className="border-b border-[#e5e7eb]">
                  <td className="p-3 text-[#111827] break-words">{session.mentorName}</td>
                  <td className="p-3 text-[#6b7280] break-words">{formatDate(session.scheduled_start)}</td>
                  <td className="p-3 text-[#6b7280] break-words">{session.timeRange}</td>
                  <td className="p-3 text-[#6b7280] break-words">{session.status || 'Session'}</td>
                  <td className="p-3">
                    {isFeedbackEligible(session) ? (
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedSessionId(session.id);
                          navigate('/feedback');
                        }}
                        className="inline-flex items-center rounded-md border border-[#5D3699] bg-white px-3 py-1.5 text-[11px] text-[#5D3699]"
                      >
                        Leave Feedback
                      </button>
                    ) : !isPastSession(session) ? (
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
                <tr>
                  <td className="p-3 text-[#6b7280]" colSpan={5}>No sessions found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default MySessions;
