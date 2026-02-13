import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Settings, ClipboardCheck, User, HelpCircle } from 'lucide-react';
import topRightIcon from '../../assets/Vector (1).png';
import { menteeApi } from '../../../apis/api/menteeApi';
import { setSelectedMentorId } from '../../../apis/api/storage';
import { useMenteeData } from '../../../apis/apihook/useMenteeData';

const quickActions = [
  { title: 'Update Preferences', subtitle: 'Refine your goals', icon: Settings },
  { title: 'Retake Assessment', subtitle: 'Check your progress', icon: ClipboardCheck, to: '/needs-assessment?from=dashboard' },
  { title: 'Edit Profile', subtitle: 'Keep info current', icon: User, to: '/profile' },
  { title: 'Get Help', subtitle: 'Contact support', icon: HelpCircle },
];

const normalizeList = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.results)) return payload.results;
  return [];
};

const getMentorName = (mentor) => {
  const fullName = `${mentor?.first_name || ''} ${mentor?.last_name || ''}`.trim();
  return fullName || mentor?.name || 'Mentor';
};

const formatDateTime = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Schedule unavailable';
  return date.toLocaleString([], {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
};

const formatDate = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Date unavailable';
  return date.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
};

const getRelativeStart = (value) => {
  const target = new Date(value);
  if (Number.isNaN(target.getTime())) return 'Upcoming';
  const diffMs = target.getTime() - Date.now();
  if (diffMs <= 0) return 'Starting soon';
  const diffMin = Math.round(diffMs / (1000 * 60));
  if (diffMin < 60) return `Starts in ${diffMin}m`;
  const diffHrs = Math.round(diffMin / 60);
  if (diffHrs < 24) return `Starts in ${diffHrs}h`;
  return `Starts in ${Math.round(diffHrs / 24)}d`;
};

const getJoinUrl = (session) => session?.join_url || session?.joinUrl || '';

const RecommendationCard = ({ mentor }) => {
  const [expanded, setExpanded] = useState(false);
  const [showReadMore, setShowReadMore] = useState(false);
  const [tagsExpanded, setTagsExpanded] = useState(false);
  const [showTagsToggle, setShowTagsToggle] = useState(false);
  const blurbRef = useRef(null);
  const tagsRef = useRef(null);

  useEffect(() => {
    if (expanded) return undefined;
    const checkOverflow = () => {
      const element = blurbRef.current;
      if (!element) {
        setShowReadMore(false);
        return;
      }
      setShowReadMore(element.scrollHeight > element.clientHeight + 1);
    };
    checkOverflow();
    window.addEventListener('resize', checkOverflow);
    return () => window.removeEventListener('resize', checkOverflow);
  }, [mentor.blurb, expanded]);

  useEffect(() => {
    if (tagsExpanded) return undefined;
    const checkTagsOverflow = () => {
      const element = tagsRef.current;
      if (!element) {
        setShowTagsToggle(false);
        return;
      }
      setShowTagsToggle(element.scrollWidth > element.clientWidth + 1);
    };
    checkTagsOverflow();
    window.addEventListener('resize', checkTagsOverflow);
    return () => window.removeEventListener('resize', checkTagsOverflow);
  }, [mentor.tags, tagsExpanded]);

  return (
    <div
      className="rounded-[12px] border border-[#e5e7eb] bg-white p-4 sm:p-5 lg:p-6 shadow-[0px_1px_2px_0px_rgba(0,0,0,0.08)] flex h-full flex-col w-full lg:w-[386.33px]"
    >
      <div className="flex-1">
        <div className="flex items-start gap-3 sm:gap-4">
          <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-full bg-gray-200 overflow-hidden flex-shrink-0">
            {mentor.avatar ? (
              <img src={mentor.avatar} alt="" className="h-full w-full object-cover" />
            ) : (
              <div className="h-full w-full bg-[#e5e7eb]" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-1 sm:gap-2">
              <div className="min-w-0">
                <div className="text-xs sm:text-sm font-semibold text-[#111827] truncate">{mentor.name}</div>
                <div className="text-[10px] sm:text-xs text-[#6b7280]">{mentor.location}</div>
              </div>
              {mentor.topMatch && (
                <span className="rounded-full bg-[#DCFCE7] px-2 py-0.5 sm:py-1 text-[9px] sm:text-[10px] text-[#166534] w-fit flex-shrink-0">
                  Top Match
                </span>
              )}
            </div>
            <div className="mt-2 flex items-start gap-2">
              <div ref={tagsRef} className={`min-w-0 flex-1 ${tagsExpanded ? '' : 'overflow-hidden'}`}>
                <div className={`flex gap-1 sm:gap-2 ${tagsExpanded ? 'flex-wrap' : 'flex-nowrap whitespace-nowrap'}`}>
                  {(mentor.tags || []).map((tag) => (
                    <span key={tag} className="rounded-full bg-[#E0E7FF] px-1.5 sm:px-2 py-0.5 sm:py-1 text-[9px] sm:text-[10px] text-[#5D3699]">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
              {showTagsToggle && (
                <button
                  type="button"
                  className="shrink-0 text-[10px] sm:text-xs font-medium text-[#5D3699] underline"
                  onClick={() => setTagsExpanded((prev) => !prev)}
                >
                  {tagsExpanded ? 'Read less' : 'Read more'}
                </button>
              )}
            </div>
            <p
              ref={blurbRef}
              className={`mt-2 text-[#6b7280] text-xs sm:text-sm ${
                expanded ? '' : 'line-clamp-4 min-h-[80px]'
              }`}
              style={{ fontFamily: 'DM Sans', lineHeight: '20px', fontWeight: 400 }}
            >
              {mentor.blurb}
            </p>
            {showReadMore && (
              <button
                type="button"
                className="mt-1 text-xs font-medium text-[#5D3699] underline"
                onClick={() => setExpanded((prev) => !prev)}
              >
                {expanded ? 'Read less' : 'Read more'}
              </button>
            )}
          </div>
        </div>
      </div>
      <Link
        to={mentor.id ? `/mentor-profile?mentorId=${mentor.id}` : '/mentor-profile'}
        onClick={() => setSelectedMentorId(mentor.id)}
        className="mt-3 sm:mt-4 w-full rounded-md bg-[#5D3699] text-white py-2 text-xs text-center"
      >
        View Profile
      </Link>
    </div>
  );
};

const Dashboard = () => {
  const navigate = useNavigate();
  const { mentee, loading: menteeLoading, error: menteeError } = useMenteeData();
  const [refreshTick, setRefreshTick] = useState(0);
  const [dashboardLoading, setDashboardLoading] = useState(true);
  const [dashboardError, setDashboardError] = useState('');
  const [joinError, setJoinError] = useState('');
  const [joinLoading, setJoinLoading] = useState(false);
  const [recommended, setRecommended] = useState([]);
  const [upcomingSession, setUpcomingSession] = useState(null);
  const [recentSessions, setRecentSessions] = useState([]);
  const [stats, setStats] = useState({ total_sessions: 0, completed_sessions: 0 });

  const openJoinLink = (url) => {
    if (!url) return false;
    window.open(url, '_blank', 'noopener,noreferrer');
    return true;
  };

  const handleJoinUpcomingSession = async () => {
    if (!upcomingSession?.id) return;
    setJoinError('');

    const existing = getJoinUrl(upcomingSession);
    if (existing) {
      openJoinLink(existing);
      return;
    }

    setJoinLoading(true);
    try {
      const response = await menteeApi.getSessionJoinLink(upcomingSession.id);
      const url = response?.join_url || response?.host_join_url || '';
      if (url) {
        setUpcomingSession((prev) =>
          prev
            ? {
                ...prev,
                join_url: response?.join_url || prev.join_url,
                host_join_url: response?.host_join_url || prev.host_join_url,
              }
            : prev
        );
        openJoinLink(url);
      } else {
        setJoinError('Join link not ready yet.');
      }
    } catch (err) {
      setJoinError(err?.message || 'Unable to fetch join link.');
    } finally {
      setJoinLoading(false);
    }
  };

  useEffect(() => {
    const refreshHandler = () => setRefreshTick((value) => value + 1);
    window.addEventListener('mentee:recommendations-updated', refreshHandler);
    return () => {
      window.removeEventListener('mentee:recommendations-updated', refreshHandler);
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    const loadDashboard = async () => {
      if (!mentee?.id) {
        if (!menteeLoading) setDashboardLoading(false);
        return;
      }

      setDashboardLoading(true);
      setDashboardError('');

      try {
        const [dashboardRes, mentorsRes] = await Promise.all([
          menteeApi.getDashboard(mentee.id),
          menteeApi.listMentors(),
        ]);

        if (cancelled) return;

        const mentorList = normalizeList(mentorsRes);
        const mentorMap = mentorList.reduce((acc, mentor) => {
          acc[String(mentor.id)] = mentor;
          return acc;
        }, {});

        let recommendations = normalizeList(dashboardRes?.recommendations);
        if (!recommendations.length) {
          try {
            const recommendedRes = await menteeApi.getRecommendedMentors({ mentee_id: mentee.id });
            recommendations = normalizeList(recommendedRes);
          } catch {
            recommendations = [];
          }
        }

        const recommendationCards = recommendations.map((entry, index) => {
          const mentor = entry?.mentor || entry;
          const tags =
            Array.isArray(mentor?.care_areas) && mentor.care_areas.length
              ? mentor.care_areas
              : Array.isArray(entry?.matched_topics)
                ? entry.matched_topics
                : [];
          return {
            id: mentor?.id ?? null,
            name: getMentorName(mentor),
            location: mentor?.city_state || '',
            tags,
            blurb: entry?.explanation || mentor?.bio || '',
            topMatch: index === 0,
            avatar: mentor?.avatar || '',
          };
        });

        const upcomingList = normalizeList(dashboardRes?.upcoming_sessions);
        const recentList = normalizeList(dashboardRes?.recent_sessions);

        const upcoming = upcomingList[0] || null;
        const upcomingMentor = upcoming ? mentorMap[String(upcoming.mentor)] : null;
        const upcomingCard = upcoming
          ? {
              ...upcoming,
              mentorName: getMentorName(upcomingMentor || {}),
              mentorAvatar: upcomingMentor?.avatar || '',
            }
          : null;

        const recentCards = recentList.map((session) => {
          const mentor = mentorMap[String(session.mentor)] || {};
          const status =
            session?.status === 'completed'
              ? 'Done'
              : session?.status === 'requested'
                ? 'Feedback'
                : session?.status || 'Session';
          return {
            id: session.id,
            name: getMentorName(mentor),
            date: formatDate(session.scheduled_start),
            status,
            avatar: mentor?.avatar || '',
          };
        });

        setRecommended(recommendationCards);
        setUpcomingSession(upcomingCard);
        setRecentSessions(recentCards);
        setStats(dashboardRes?.stats || { total_sessions: 0, completed_sessions: 0 });
      } catch (err) {
        if (!cancelled) {
          setDashboardError(err?.message || 'Unable to load dashboard data.');
          setRecommended([]);
          setUpcomingSession(null);
          setRecentSessions([]);
        }
      } finally {
        if (!cancelled) setDashboardLoading(false);
      }
    };

    loadDashboard();
    return () => {
      cancelled = true;
    };
  }, [mentee?.id, menteeLoading, refreshTick]);

  const displayName = mentee?.first_name || 'there';
  const progressPercent = useMemo(() => {
    const total = Number(stats?.total_sessions || 0);
    const completed = Number(stats?.completed_sessions || 0);
    if (!total) return 0;
    return Math.max(0, Math.min(100, Math.round((completed / total) * 100)));
  }, [stats]);

  return (
    <div className="p-3 sm:p-4 md:p-6 bg-transparent">
      <div className="rounded-xl sm:rounded-2xl border border-[#e5e7eb] bg-white p-4 sm:p-5 md:p-6 flex items-center justify-between gap-4 sm:gap-6 shadow-[0px_1px_2px_0px_rgba(0,0,0,0.08)]">
        <div className="min-w-0">
          <h1 className="text-lg sm:text-xl md:text-2xl font-semibold text-[#111827] truncate sm:whitespace-normal">
            Hi {displayName}, welcome back.
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-[#6b7280]">
            Here&apos;s what we&apos;ve prepared for you today to help you grow
            <br className="hidden sm:block" />
            and achieve your goals.
          </p>
          <p className="mt-2 text-[10px] sm:text-xs text-[#9ca3af]">Progress: {progressPercent}%</p>
        </div>
        <div className="h-12 w-12 sm:h-16 sm:w-16 md:h-20 md:w-20 rounded-full bg-[#ede9fe] flex items-center justify-center flex-shrink-0">
          <img src={topRightIcon} alt="" className="h-6 w-6 sm:h-8 sm:w-8 opacity-70" />
        </div>
      </div>

      <div className="mt-4 sm:mt-5 grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {quickActions.map((item) => {
          const Icon = item.icon;
          const isClickable = Boolean(item.to);
          const className = `rounded-lg sm:rounded-xl border border-[#e5e7eb] bg-white p-3 sm:p-4 shadow-[0px_1px_2px_0px_rgba(0,0,0,0.08)] ${
            isClickable ? 'text-left transition hover:border-[#c4b5fd]' : ''
          }`;
          const content = (
            <div className="flex flex-col sm:flex-row items-start gap-2 sm:gap-3">
              <div className="h-8 w-8 sm:h-9 sm:w-9 rounded-md bg-[#f5f3ff] text-[#5D3699] flex items-center justify-center flex-shrink-0">
                <Icon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              </div>
              <div className="min-w-0">
                <div className="text-xs sm:text-sm font-semibold text-[#111827] truncate">{item.title}</div>
                <div className="text-[10px] sm:text-xs text-[#9ca3af]">{item.subtitle}</div>
              </div>
            </div>
          );

          if (isClickable) {
            return (
              <button
                type="button"
                key={item.title}
                className={className}
                onClick={() => navigate(item.to)}
              >
                {content}
              </button>
            );
          }

          return (
            <div key={item.title} className={className}>
              {content}
            </div>
          );
        })}
      </div>

      <div className="mt-5 sm:mt-6 flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-0">
        <div>
          <h2 className="text-sm font-semibold text-[#111827]">Your Recommended Mentors</h2>
          <p className="text-xs text-[#6b7280]">Based on your recent mood and assessment responses.</p>
        </div>
        <Link to="/mentors" className="text-xs text-[#5D3699] underline text-left sm:text-right">
          See All Recommendations
        </Link>
      </div>

      <div className="mt-3 sm:mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {recommended.map((m) => (
          <RecommendationCard key={m.id || m.name} mentor={m} />
        ))}
      </div>

      {!recommended.length && (
        <div className="mt-3 text-xs text-[#6b7280]">No recommendations available yet.</div>
      )}

      <div className="mt-5 sm:mt-6 grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-4 sm:gap-6">
        <div>
          <h2 className="text-sm font-semibold text-[#111827] mb-2">Your Upcoming Sessions</h2>
          <div className="rounded-xl border border-[#e5e7eb] bg-white p-3 sm:p-4 shadow-[0px_1px_2px_0px_rgba(0,0,0,0.08)]">
            {upcomingSession ? (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-full bg-gray-200 overflow-hidden flex-shrink-0">
                    {upcomingSession.mentorAvatar ? (
                      <img src={upcomingSession.mentorAvatar} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <div className="h-full w-full bg-[#e5e7eb]" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs sm:text-sm font-semibold text-[#111827] truncate">
                      Session with {upcomingSession.mentorName}
                    </div>
                    <div className="text-[10px] sm:text-xs text-[#6b7280]">{formatDateTime(upcomingSession.scheduled_start)}</div>
                  </div>
                </div>
                <div className="flex items-center justify-between sm:justify-end gap-2 sm:gap-3 ml-12 sm:ml-0">
                  <span className="text-[9px] sm:text-[10px] text-[#f59e0b]">{getRelativeStart(upcomingSession.scheduled_start)}</span>
                  <button
                    type="button"
                    className="rounded-md bg-[#5D3699] px-3 sm:px-4 py-1.5 sm:py-2 text-[10px] sm:text-xs text-white disabled:opacity-70"
                    onClick={handleJoinUpcomingSession}
                    disabled={joinLoading}
                  >
                    {joinLoading ? 'Joining...' : 'Join Call'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-xs text-[#6b7280]">No upcoming sessions.</div>
            )}
            {joinError && <div className="mt-2 text-xs text-red-600">{joinError}</div>}
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-sm font-semibold text-[#111827]">Recent Sessions</h2>
            <button
              type="button"
              className="text-xs text-[#5D3699]"
              onClick={() => navigate('/my-sessions')}
            >
              View All
            </button>
          </div>
          <div className="rounded-xl border border-[#e5e7eb] bg-white p-3 sm:p-4 space-y-2 sm:space-y-3 shadow-[0px_1px_2px_0px_rgba(0,0,0,0.08)]">
            {recentSessions.map((s) => (
              <div key={s.id} className="flex items-center justify-between">
                <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                  <div className="h-7 w-7 sm:h-8 sm:w-8 rounded-full bg-gray-200 overflow-hidden flex-shrink-0">
                    {s.avatar ? (
                      <img src={s.avatar} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <div className="h-full w-full bg-[#e5e7eb]" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs sm:text-sm font-semibold text-[#111827] truncate">{s.name}</div>
                    <div className="text-[10px] sm:text-xs text-[#6b7280]">{s.date}</div>
                  </div>
                </div>
                <span className={`text-[9px] sm:text-[10px] flex-shrink-0 ${s.status === 'Done' ? 'text-[#16a34a]' : 'text-[#5D3699]'}`}>
                  {s.status}
                </span>
              </div>
            ))}
            {!recentSessions.length && <div className="text-xs text-[#6b7280]">No recent sessions.</div>}
          </div>
        </div>
      </div>

      {(dashboardLoading || dashboardError || menteeError) && (
        <div className={`mt-3 text-xs ${dashboardError || menteeError ? 'text-red-600' : 'text-[#6b7280]'}`}>
          {dashboardError || menteeError || 'Loading dashboard...'}
        </div>
      )}
    </div>
  );
};

export default Dashboard;
