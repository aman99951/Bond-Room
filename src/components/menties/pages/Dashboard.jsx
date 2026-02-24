import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Sparkles,
  Calendar,
  Clock,
  ArrowRight,
  Video,
  CheckCircle2,
  ChevronRight,
  Play,
  User,
  Star,
  TrendingUp,
  Settings,
  ClipboardCheck,
  HelpCircle,
} from 'lucide-react';
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
      className="flex h-full w-full min-w-0 flex-col rounded-[12px] border border-[#e5e7eb] bg-white p-4 shadow-[0px_1px_2px_0px_rgba(0,0,0,0.08)] sm:p-5 lg:p-6"
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
  <div className="p-4 sm:p-6 lg:p-8 bg-transparent">
    {/* Welcome Header Card */}
    <div className="rounded-2xl border border-[#e5e7eb] bg-white p-6 sm:p-8 shadow-sm ring-1 ring-[#e5e7eb]/50">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-3">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#f5f3ff] px-3 py-1 text-xs font-medium text-[#5D3699]">
              <Sparkles className="h-3 w-3" />
              Welcome Back
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#111827] tracking-tight">
            Hi {displayName}! 👋
          </h1>
          <p className="mt-3 text-sm sm:text-base text-[#6b7280] max-w-lg">
            Here's what we've prepared for you today to help you grow and achieve your goals.
          </p>
          
          {/* Progress Bar */}
          <div className="mt-5 max-w-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-[#6b7280]">Your Progress</span>
              <span className="text-xs font-semibold text-[#5D3699]">{progressPercent}%</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-[#f5f3ff]">
              <div
                className="h-full rounded-full bg-[#5D3699] transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        </div>
        
        {/* Decorative Icon */}
        <div className="hidden sm:flex h-24 w-24 lg:h-28 lg:w-28 rounded-2xl bg-[#f5f3ff] items-center justify-center flex-shrink-0 ring-4 ring-[#ede9fe]">
          <img src={topRightIcon} alt="" className="h-12 w-12 lg:h-14 lg:w-14 opacity-80" />
        </div>
      </div>
    </div>

    {/* Quick Actions Grid */}
    <div className="mt-6 sm:mt-8">
      <div className="flex items-center gap-2 mb-4">
        <div className="h-1 w-1 rounded-full bg-[#5D3699]" />
        <h2 className="text-sm font-semibold text-[#111827]">Quick Actions</h2>
      </div>
      
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {quickActions.map((item) => {
          const Icon = item.icon;
          const isClickable = Boolean(item.to);

          const cardContent = (
            <div className="group h-full rounded-xl border border-[#e5e7eb] bg-white p-4 sm:p-5 shadow-sm transition-all duration-200 hover:border-[#c4b5fd] hover:shadow-md">
              <div className="flex flex-col h-full">
                <div className="flex items-start justify-between">
                  <div className="flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-xl bg-[#f5f3ff] text-[#5D3699] transition-colors group-hover:bg-[#ede9fe]">
                    <Icon className="h-5 w-5" />
                  </div>
                  {isClickable && (
                    <ChevronRight className="h-4 w-4 text-[#9ca3af] transition-transform group-hover:translate-x-0.5 group-hover:text-[#5D3699]" />
                  )}
                </div>
                <div className="mt-4 flex-1">
                  <h3 className="text-sm font-semibold text-[#111827] group-hover:text-[#5D3699] transition-colors">
                    {item.title}
                  </h3>
                  <p className="mt-1 text-xs text-[#9ca3af] line-clamp-2">
                    {item.subtitle}
                  </p>
                </div>
              </div>
            </div>
          );

          if (isClickable) {
            return (
              <button
                type="button"
                key={item.title}
                className="text-left h-full"
                onClick={() => navigate(item.to)}
              >
                {cardContent}
              </button>
            );
          }

          return (
            <div key={item.title} className="h-full">
              {cardContent}
            </div>
          );
        })}
      </div>
    </div>

    {/* Recommended Mentors Section */}
    <div className="mt-8 sm:mt-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#f5f3ff]">
            <Star className="h-5 w-5 text-[#5D3699]" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-[#111827]">Recommended Mentors</h2>
            <p className="text-xs text-[#6b7280]">Based on your mood and assessment responses</p>
          </div>
        </div>
        <Link
          to="/mentors"
          className="inline-flex items-center gap-1.5 rounded-full bg-[#f5f3ff] px-4 py-2 text-xs font-medium text-[#5D3699] transition-all hover:bg-[#ede9fe]"
        >
          See All
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      {recommended.length > 0 ? (
        <div className="grid grid-cols-1 gap-3 sm:gap-4 md:grid-cols-2 lg:gap-5 xl:grid-cols-3">
          {recommended.map((m) => (
            <RecommendationCard key={m.id || m.name} mentor={m} />
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-[#e5e7eb] border-dashed bg-white p-8 text-center">
          <div className="flex justify-center mb-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#f5f3ff]">
              <User className="h-6 w-6 text-[#9ca3af]" />
            </div>
          </div>
          <p className="text-sm text-[#6b7280]">No recommendations available yet.</p>
          <p className="mt-1 text-xs text-[#9ca3af]">Complete your assessment to get personalized matches</p>
        </div>
      )}
    </div>

    {/* Sessions Section */}
    <div className="mt-8 sm:mt-10 grid grid-cols-1 lg:grid-cols-5 gap-6">
      {/* Upcoming Session - Takes more space */}
      <div className="lg:col-span-3">
        <div className="flex items-center gap-3 mb-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#f5f3ff]">
            <Calendar className="h-5 w-5 text-[#5D3699]" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-[#111827]">Upcoming Session</h2>
            <p className="text-xs text-[#6b7280]">Your next scheduled mentoring session</p>
          </div>
        </div>

        <div className="rounded-xl border border-[#e5e7eb] bg-white p-5 sm:p-6 shadow-sm">
          {upcomingSession ? (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                {/* Avatar with online indicator */}
                <div className="relative flex-shrink-0">
                  <div className="h-14 w-14 overflow-hidden rounded-xl bg-[#f5f3ff] ring-2 ring-white">
                    {upcomingSession.mentorAvatar ? (
                      <img src={upcomingSession.mentorAvatar} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center">
                        <User className="h-6 w-6 text-[#5D3699]" />
                      </div>
                    )}
                  </div>
                  <div className="absolute -bottom-1 -right-1 h-4 w-4 rounded-full border-2 border-white bg-[#16a34a]" />
                </div>

                <div className="min-w-0">
                  <h3 className="text-base font-semibold text-[#111827]">
                    Session with {upcomingSession.mentorName}
                  </h3>
                  <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-[#6b7280]">
                    <span className="inline-flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5" />
                      {formatDateTime(upcomingSession.scheduled_start)}
                    </span>
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-[#f5f3ff] px-2 py-0.5 font-medium text-[#f59e0b]">
                      <Clock className="h-3 w-3" />
                      {getRelativeStart(upcomingSession.scheduled_start)}
                    </span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={handleJoinUpcomingSession}
                disabled={joinLoading}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#5D3699] px-5 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:bg-[#4a2b7a] hover:shadow-md disabled:opacity-60 sm:flex-shrink-0"
              >
                {joinLoading ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    Joining...
                  </>
                ) : (
                  <>
                    <Video className="h-4 w-4" />
                    Join Call
                  </>
                )}
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-6 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#f5f3ff]">
                <Calendar className="h-7 w-7 text-[#9ca3af]" />
              </div>
              <p className="mt-4 text-sm font-medium text-[#111827]">No upcoming sessions</p>
              <p className="mt-1 text-xs text-[#6b7280]">Book a session with a mentor to get started</p>
              <button
                type="button"
                onClick={() => navigate('/mentors')}
                className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-[#f5f3ff] px-4 py-2 text-xs font-medium text-[#5D3699] transition-colors hover:bg-[#ede9fe]"
              >
                Find a Mentor
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
          {joinError && (
            <div className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-xs text-red-600">
              {joinError}
            </div>
          )}
        </div>
      </div>

      {/* Recent Sessions */}
      <div className="lg:col-span-2">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#f5f3ff]">
              <Clock className="h-5 w-5 text-[#5D3699]" />
            </div>
            <h2 className="text-base font-semibold text-[#111827]">Recent Sessions</h2>
          </div>
          <button
            type="button"
            onClick={() => navigate('/my-sessions')}
            className="text-xs font-medium text-[#5D3699] hover:underline"
          >
            View All
          </button>
        </div>

        <div className="rounded-xl border border-[#e5e7eb] bg-white shadow-sm overflow-hidden">
          {recentSessions.length > 0 ? (
            <div className="divide-y divide-[#e5e7eb]">
              {recentSessions.map((s, index) => (
                <div
                  key={s.id}
                  className="flex items-center justify-between p-4 transition-colors hover:bg-[#f5f3ff]/30"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="relative flex-shrink-0">
                      <div className="h-10 w-10 overflow-hidden rounded-lg bg-[#f5f3ff]">
                        {s.avatar ? (
                          <img src={s.avatar} alt="" className="h-full w-full object-cover" />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center">
                            <User className="h-4 w-4 text-[#5D3699]" />
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-[#111827] truncate">{s.name}</p>
                      <p className="text-xs text-[#9ca3af]">{s.date}</p>
                    </div>
                  </div>
                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-medium ${
                      s.status === 'Done'
                        ? 'bg-green-50 text-[#16a34a]'
                        : 'bg-[#f5f3ff] text-[#5D3699]'
                    }`}
                  >
                    {s.status === 'Done' && <CheckCircle2 className="h-3 w-3" />}
                    {s.status}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Clock className="h-8 w-8 text-[#9ca3af]" />
              <p className="mt-3 text-sm text-[#6b7280]">No recent sessions</p>
            </div>
          )}
        </div>
      </div>
    </div>

   

    {/* Loading/Error States */}
    {(dashboardLoading || dashboardError || menteeError) && (
      <div className={`mt-6 flex items-center justify-center gap-3 rounded-xl border border-[#e5e7eb] bg-white p-4 ${
        dashboardError || menteeError ? 'border-red-200' : ''
      }`}>
        {dashboardLoading && (
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-[#e5e7eb] border-t-[#5D3699]" />
        )}
        <span className={`text-sm ${dashboardError || menteeError ? 'text-red-600' : 'text-[#6b7280]'}`}>
          {dashboardError || menteeError || 'Loading dashboard...'}
        </span>
      </div>
    )}
  </div>
);
};

export default Dashboard;
