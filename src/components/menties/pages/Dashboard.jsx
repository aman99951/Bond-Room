import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Sparkles,
  Calendar,
  Clock,
  ArrowRight,
  Video,
  CheckCircle2,
  ChevronRight,
  User,
  Star,
  Settings,
  ClipboardCheck,
  HelpCircle,
  Crown,
  MapPin,
  Brain,
  BookOpen,
  Languages,
  CalendarCheck,
} from 'lucide-react';
import '../../LandingPage.css';
import './DashboardMentorCarousel.css';
import './DashboardMentorCard.css';
import { menteeApi } from '../../../apis/api/menteeApi';
import { setSelectedMentorId, setSelectedSessionId } from '../../../apis/api/storage';
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

const getEventStatus = (registration, eventById) => {
  const event = eventById.get(registration?.volunteer_event);
  if (event?.status === 'completed') return 'completed';
  if (event?.status === 'upcoming') return 'upcoming';
  return 'unknown';
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

const getJoinUrl = (session) => session?.join_url || session?.meeting_url || session?.joinUrl || '';
const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || '/api').replace(/\/+$/, '');

const toNumberOrNull = (value) => {
  if (value === null || value === undefined || value === '') return null;
  const num = Number(value);
  return Number.isFinite(num) ? num : null;
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

const fadeUp = {
  hidden: { opacity: 0, y: 32 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.65, ease: [0.22, 1, 0.36, 1] },
  },
};

const stagger = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.08 },
  },
};

const MentorRingCarousel = ({ items, className = 'dash-mentor-arc', onCardClick = null }) => {
  const stageRef = useRef(null);
  const cardRefs = useRef([]);
  const rafRef = useRef(null);
  const lastTsRef = useRef(null);
  const hoverRef = useRef(false);
  const dragRef = useRef(false);
  const pointerStartRef = useRef({ x: 0, y: 0 });
  const movedRef = useRef(false);
  const lastPointerXRef = useRef(0);
  const phaseRef = useRef(0);
  const speedRef = useRef(0.17);
  const targetSpeedRef = useRef(0.17);

  const BASE_SPEED = 0.17;
  const HOVER_SPEED = 0.35;
  const DRAG_PHASE_MULTIPLIER = 0.0033;
  const DRAG_MOMENTUM_MULTIPLIER = 0.0019;

  const applyArcLayout = () => {
    const stageWidth = stageRef.current?.clientWidth || 1280;
    const count = items.length || 1;
    const half = count / 2;

    const slot = Math.min(320, Math.max(150, stageWidth * 0.2));
    const frontZ = Math.min(380, Math.max(210, stageWidth * 0.23));
    const zDrop = frontZ * 0.36;
    const yawStep = 11.8;

    cardRefs.current.forEach((card, index) => {
      if (!card) return;

      let offset = index - phaseRef.current;
      if (offset > half) offset -= count;
      if (offset < -half) offset += count;

      const abs = Math.abs(offset);
      const x = offset * slot;
      const y = Math.pow(abs, 1.7) * 8;
      const z = frontZ - abs * zDrop;
      const rotateY = -offset * yawStep;
      const scale = 1 - Math.min(0.24, abs * 0.07);
      const opacity = abs <= 2.25 ? 1 : Math.max(0.34, 1 - (abs - 2.25) * 0.56);
      const blur = abs <= 2.6 ? 0 : Math.min(1.1, (abs - 2.6) * 1.2);

      card.style.transform = `translate3d(${x}px, ${y}px, ${z}px) rotateY(${rotateY}deg) scale(${scale})`;
      card.style.opacity = `${opacity}`;
      card.style.filter = blur > 0 ? `blur(${blur}px)` : 'none';
      card.style.zIndex = `${Math.round(900 - abs * 100)}`;
    });
  };

  useEffect(() => {
    applyArcLayout();

    const tick = (ts) => {
      if (lastTsRef.current === null) {
        lastTsRef.current = ts;
      }

      const dt = Math.min(0.05, (ts - lastTsRef.current) / 1000);
      lastTsRef.current = ts;

      if (!dragRef.current) {
        const blend = 1 - Math.exp(-dt * 8.2);
        speedRef.current += (targetSpeedRef.current - speedRef.current) * blend;
        phaseRef.current = (phaseRef.current + speedRef.current * dt + items.length) % items.length;
        applyArcLayout();
      }

      rafRef.current = window.requestAnimationFrame(tick);
    };

    rafRef.current = window.requestAnimationFrame(tick);

    return () => {
      if (rafRef.current) {
        window.cancelAnimationFrame(rafRef.current);
      }
      lastTsRef.current = null;
    };
  }, [items.length]);

  useEffect(() => {
    const onResize = () => applyArcLayout();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [items.length]);

  const handleStageEnter = () => {
    hoverRef.current = true;
    if (!dragRef.current) {
      targetSpeedRef.current = HOVER_SPEED;
    }
  };

  const handleStageLeave = () => {
    hoverRef.current = false;
    if (!dragRef.current) {
      targetSpeedRef.current = BASE_SPEED;
    }
  };

  const handlePointerDown = (event) => {
    dragRef.current = true;
    lastPointerXRef.current = event.clientX;
    pointerStartRef.current = { x: event.clientX, y: event.clientY };
    movedRef.current = false;
    targetSpeedRef.current = 0;
    speedRef.current = 0;
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handlePointerMove = (event) => {
    if (!dragRef.current) return;

    const dx = event.clientX - lastPointerXRef.current;
    const travelX = Math.abs(event.clientX - pointerStartRef.current.x);
    const travelY = Math.abs(event.clientY - pointerStartRef.current.y);
    if (travelX > 6 || travelY > 6) {
      movedRef.current = true;
    }
    lastPointerXRef.current = event.clientX;

    phaseRef.current = (phaseRef.current - dx * DRAG_PHASE_MULTIPLIER + items.length) % items.length;
    speedRef.current = -dx * DRAG_MOMENTUM_MULTIPLIER;
    applyArcLayout();
  };

  const handlePointerEnd = (event) => {
    if (!dragRef.current) return;

    if (!movedRef.current && onCardClick) {
      const target = document.elementFromPoint(event.clientX, event.clientY);
      const card = target?.closest?.('.lp-arc-card');
      const index = Number(card?.getAttribute('data-arc-index'));
      const item = Number.isFinite(index) ? items[index] : null;
      if (item) {
        onCardClick(item);
      }
    }

    dragRef.current = false;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    targetSpeedRef.current = hoverRef.current ? HOVER_SPEED : BASE_SPEED;
  };

  return (
    <div className={`lp-arc-shell ${className}`}>
      <div
        ref={stageRef}
        className="lp-arc-stage"
        onMouseEnter={handleStageEnter}
        onMouseLeave={handleStageLeave}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerEnd}
        onPointerCancel={handlePointerEnd}
      >
        <div className="lp-arc-track">
          {items.map(({ id, image, name, role }, index) => {
            return (
              <div
                key={`${id || name}-${index}`}
                className={`lp-arc-card ${onCardClick ? 'cursor-pointer' : ''}`}
                data-arc-index={index}
                ref={(el) => {
                  cardRefs.current[index] = el;
                }}
              >
                <div className="lp-arc-card-inner">
                  {image ? (
                    <img src={image} alt={name} className="lp-arc-img" draggable={false} />
                  ) : (
                    <div className="lp-arc-img dash-arc-empty" aria-hidden="true" />
                  )}
                  <div className="lp-arc-overlay" />
                  <div className="lp-arc-info">
                    <strong>{name}</strong>
                    <span>{role}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

const RecommendationCard = ({ mentor }) => {
  const [expanded, setExpanded] = useState(false);
  const [showReadMore, setShowReadMore] = useState(false);
  const [tagsExpanded, setTagsExpanded] = useState(false);
  const [showTagsToggle, setShowTagsToggle] = useState(false);
  const blurbRef = useRef(null);
  const tagsRef = useRef(null);
  const initials = (mentor.name || 'M')
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
  const primaryTag = mentor.tags?.[0] || '';
  const secondaryTag = mentor.tags?.[1] || '';

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
    <div className="dm-card-3d relative h-full w-full min-w-0 rounded-3xl ">
      <div className="dm-gradient-border absolute -inset-[1px] rounded-3xl opacity-60" />
      <div className="dm-glass-card relative flex h-full min-h-[252px] flex-col rounded-3xl border border-white/70 p-4 shadow-xl sm:p-5">
        {mentor.topMatch && (
          <div className="dm-badge-animate absolute -top-3 left-4">
            <div className="flex items-center gap-1.5 rounded-full bg-gradient-to-r from-emerald-500 to-cyan-500 px-3 py-1 text-[10px] font-bold text-white">
              <Crown className="h-3 w-3" />
              Top Match
            </div>
          </div>
        )}

        <div className="flex items-start gap-3">
          <div className="relative flex-shrink-0">
            <div className="dm-avatar-ring absolute -inset-1 rounded-full" />
            <div className="relative flex h-14 w-14 items-center justify-center overflow-hidden rounded-full bg-[#5D3699] text-sm font-bold text-white">
              {mentor.avatar ? <img src={mentor.avatar} alt={mentor.name} className="h-full w-full object-cover" /> : initials}
            </div>
            <div className="absolute bottom-0 right-0 h-3 w-3 rounded-full border border-white bg-emerald-400" />
          </div>

          <div className="min-w-0 flex-1">
            <h3 className="truncate text-base font-bold text-[#111827]">{mentor.name}</h3>
            <div className="mt-1 flex items-center gap-1 text-[11px] text-[#6b7280]">
              <MapPin className="h-3 w-3" />
              <span className="truncate">{mentor.location || 'Location unavailable'}</span>
            </div>
            {mentor.rating != null ? (
              <div className="mt-2 flex items-center gap-1.5">
                {[0, 1, 2, 3, 4].map((i) => (
                  <Star
                    key={i}
                    className={`h-3.5 w-3.5 ${i < Math.floor(mentor.rating) ? 'fill-yellow-400 text-yellow-400' : 'text-white/35'}`}
                  />
                ))}
                <span className="ml-1 text-xs font-semibold text-[#111827]">{Number(mentor.rating).toFixed(1)}</span>
                {mentor.reviews != null && <span className="text-[10px] text-[#6b7280]">({mentor.reviews})</span>}
              </div>
            ) : (
              <div className="mt-2 text-[11px] text-[#6b7280]">No ratings yet</div>
            )}
          </div>
        </div>

        {(primaryTag || secondaryTag) && (
          <div className="mt-3 flex items-center gap-2">
            {primaryTag && (
              <div className="dm-specialty-tag flex items-center gap-1 rounded-lg px-2.5 py-1">
                <Brain className="h-3 w-3 text-purple-300" />
                <span className="text-[11px] text-[#4c1d95]">{primaryTag}</span>
              </div>
            )}
            {secondaryTag && (
              <div className="dm-specialty-tag flex items-center gap-1 rounded-lg px-2.5 py-1">
                <BookOpen className="h-3 w-3 text-pink-300" />
                <span className="text-[11px] text-[#4c1d95]">{secondaryTag}</span>
              </div>
            )}
          </div>
        )}

        {(mentor.language || mentor.availability) && (
          <div className="mt-2 flex items-center gap-1 text-[11px] text-[#6b7280]">
            <Languages className="h-3 w-3" />
            <span>{mentor.language || mentor.availability}</span>
          </div>
        )}

        <p
          ref={blurbRef}
          className={`mt-2 flex-1 text-xs leading-5 text-[#4b5563] ${expanded ? '' : 'line-clamp-3 min-h-[60px]'}`}
        >
          {mentor.blurb || 'No description available.'}
        </p>

        <div className="mt-3 flex items-center justify-between gap-2">
          <div ref={tagsRef} className={`min-w-0 flex-1 ${tagsExpanded ? '' : 'overflow-hidden'}`}>
            <div className={`flex gap-1.5 ${tagsExpanded ? 'flex-wrap' : 'whitespace-nowrap'}`}>
              {(mentor.tags || []).slice(0, 4).map((tag) => (
                <span key={tag} className="rounded-full border border-[#e7d8ff] bg-[#f7f0ff] px-2 py-0.5 text-[10px] text-[#5D3699]">
                  {tag}
                </span>
              ))}
            </div>
          </div>
          {showTagsToggle && (
            <button
              type="button"
              className="shrink-0 text-[10px] font-medium text-[#5D3699] underline"
              onClick={() => setTagsExpanded((prev) => !prev)}
            >
              {tagsExpanded ? 'Less' : 'More'}
            </button>
          )}
        </div>

        {showReadMore && (
          <button
            type="button"
            className="mt-1 text-left text-[11px] font-medium text-[#5D3699] underline"
            onClick={() => setExpanded((prev) => !prev)}
          >
            {expanded ? 'Read less' : 'Read more'}
          </button>
        )}

        <Link
          to={mentor.id ? `/mentor-profile?mentorId=${mentor.id}` : '/mentor-profile'}
          onClick={() => setSelectedMentorId(mentor.id)}
          className="dm-book-btn mt-3 inline-flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold text-white"
        >
          <CalendarCheck className="h-4 w-4" />
          View Profile
        </Link>
      </div>
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
  const [registeredEvents, setRegisteredEvents] = useState([]);
  const [registeredEventsLoading, setRegisteredEventsLoading] = useState(true);
  const [registeredEventsError, setRegisteredEventsError] = useState('');
  const [stats, setStats] = useState({ total_sessions: 0, completed_sessions: 0 });

  const openJoinLink = (url) => {
    if (!url) return false;
    if (url.startsWith('http://') || url.startsWith('https://')) {
      window.location.assign(url);
      return true;
    }
    navigate(url);
    return true;
  };

  const handleJoinUpcomingSession = async () => {
    if (!upcomingSession?.id) return;
    setJoinError('');

    const existing = getJoinUrl(upcomingSession);
    const isWrongRolePath =
      typeof existing === 'string' && existing.includes('/mentor-meeting-room');
    if (existing && !isWrongRolePath) {
      setSelectedSessionId(upcomingSession.id);
      openJoinLink(existing);
      return;
    }

    setJoinLoading(true);
    try {
      const response = await menteeApi.getSessionJoinLink(upcomingSession.id);
      const url = response?.meeting_url || response?.join_url || response?.host_join_url || '';
      if (url) {
        setUpcomingSession((prev) =>
          prev
            ? {
              ...prev,
              meeting_url: response?.meeting_url || prev.meeting_url,
              join_url: response?.join_url || prev.join_url,
              host_join_url: response?.host_join_url || prev.host_join_url,
            }
            : prev
        );
        setSelectedSessionId(upcomingSession.id);
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
        const eventOnlyMode =
          mentee?.signup_source === 'event_flow' && !mentee?.mentee_program_enabled;

        if (!eventOnlyMode) {
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
            const languageList = Array.isArray(mentor?.languages)
              ? mentor.languages
              : Array.isArray(mentor?.language_preferences)
                ? mentor.language_preferences
                : mentor?.language
                  ? [mentor.language]
                  : [];
            const languageText = languageList.filter(Boolean).join(', ');
            const availabilityText =
              mentor?.availability_status ||
              (typeof mentor?.is_available === 'boolean'
                ? mentor.is_available ? 'Available for sessions' : 'Not currently available'
                : '');
            return {
              id: mentor?.id ?? null,
              name: getMentorName(mentor),
              location: mentor?.city_state || '',
              tags,
              blurb: entry?.explanation || mentor?.bio || '',
              topMatch: index === 0,
              avatar: resolveMediaUrl(mentor?.avatar || mentor?.profile_photo || mentor?.user?.avatar || ''),
              rating: toNumberOrNull(mentor?.average_rating ?? mentor?.rating ?? entry?.average_rating),
              reviews: mentor?.reviews_count ?? entry?.total_reviews ?? null,
              language: languageText ? `Mentor speaks ${languageText}` : '',
              availability: availabilityText,
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
              mentorAvatar: resolveMediaUrl(upcomingMentor?.avatar || upcomingMentor?.profile_photo || ''),
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
              avatar: resolveMediaUrl(mentor?.avatar || mentor?.profile_photo || ''),
            };
          });

          setRecommended(recommendationCards);
          setUpcomingSession(upcomingCard);
          setRecentSessions(recentCards.slice(0, 4));
          setStats(dashboardRes?.stats || { total_sessions: 0, completed_sessions: 0 });
        } else {
          setRecommended([]);
          setUpcomingSession(null);
          setRecentSessions([]);
          setStats({ total_sessions: 0, completed_sessions: 0 });
        }

        setRegisteredEventsLoading(true);
        setRegisteredEventsError('');
        try {
          const [registrationsRes, eventsRes] = await Promise.all([
            menteeApi.listVolunteerEventRegistrations(),
            menteeApi.listVolunteerEvents(),
          ]);
          if (cancelled) return;

          const registrationItems = normalizeList(registrationsRes);
          const events = normalizeList(eventsRes);
          const eventById = new Map(events.map((event) => [event.id, event]));
          const registrationCards = registrationItems
            .map((registration, index) => {
              const event = eventById.get(registration?.volunteer_event);
              const status = getEventStatus(registration, eventById);
              const dateValue = registration?.volunteer_event_date || event?.date || '';
              const timeValue = registration?.volunteer_event_time || event?.time || 'Time TBA';
              const statusLabel = status === 'completed' ? 'Completed' : status === 'upcoming' ? 'Upcoming' : 'Registered';
              const dateLabel = dateValue ? formatDate(dateValue) : 'Date unavailable';
              return {
                id: registration?.id || `${registration?.volunteer_event || 'event'}-${registration?.created_at || index}`,
                registrationId: registration?.id || null,
                image: resolveMediaUrl(event?.image || ''),
                name: registration?.volunteer_event_title || event?.title || `Event #${registration?.volunteer_event}`,
                role: `${statusLabel} - ${dateLabel} - ${timeValue}`,
                title: registration?.volunteer_event_title || event?.title || `Event #${registration?.volunteer_event}`,
                dateLabel,
                timeLabel: timeValue,
                location: event?.location || `${registration?.city || '-'}, ${registration?.state || '-'}`,
                status,
                statusLabel,
                statusSort: status === 'upcoming' ? 0 : status === 'completed' ? 1 : 2,
                dateSort: dateValue ? new Date(dateValue).getTime() : Number.POSITIVE_INFINITY,
              };
            })
            .sort((a, b) => {
              if (a.statusSort !== b.statusSort) return a.statusSort - b.statusSort;
              return a.dateSort - b.dateSort;
            });

          setRegisteredEvents(registrationCards);
        } catch (registrationError) {
          if (!cancelled) {
            setRegisteredEvents([]);
            setRegisteredEventsError(registrationError?.message || 'Unable to load your registered events.');
          }
        } finally {
          if (!cancelled) setRegisteredEventsLoading(false);
        }
      } catch (err) {
        if (!cancelled) {
          setDashboardError(err?.message || 'Unable to load dashboard data.');
          setRecommended([]);
          setUpcomingSession(null);
          setRecentSessions([]);
          setRegisteredEvents([]);
          setRegisteredEventsLoading(false);
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
  const isEventFlowOnly = mentee?.signup_source === 'event_flow' && !mentee?.mentee_program_enabled;
  const registeredEventCarouselItems = useMemo(() => {
    if (!registeredEvents.length) return [];
    if (registeredEvents.length >= 5) return registeredEvents;
    const repeated = [];
    for (let i = 0; i < 5; i += 1) {
      repeated.push(registeredEvents[i % registeredEvents.length]);
    }
    return repeated;
  }, [registeredEvents]);
  const completedRegisteredEvents = useMemo(
    () => registeredEvents.filter((event) => event.status === 'completed' && event.registrationId),
    [registeredEvents]
  );
  const progressPercent = useMemo(() => {
    const total = Number(stats?.total_sessions || 0);
    const completed = Number(stats?.completed_sessions || 0);
    if (!total) return 0;
    return Math.max(0, Math.min(100, Math.round((completed / total) * 100)));
  }, [stats]);
return (
    <motion.div
      className="relative overflow-hidden bg-transparent p-3 sm:p-6 lg:p-8"
      initial="hidden"
      animate="show"
      variants={stagger}
    >
      {/* Welcome Header Card */}
      <motion.div
        variants={fadeUp}
        className="relative overflow-hidden rounded-[24px] border border-[#e8dcff] bg-[linear-gradient(135deg,#ffffff_0%,#fcfaff_45%,#f8f3ff_100%)] p-4 shadow-[0_28px_60px_-46px_rgba(93,54,153,0.65)] ring-1 ring-[#efe7ff] sm:rounded-[28px] sm:p-8"
      >
        <div className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-[#efe6ff] blur-2xl" />
        <div className="pointer-events-none absolute -left-10 bottom-0 h-24 w-24 rounded-full bg-[#f4edff] blur-2xl" />

        <div className="relative grid grid-cols-1 gap-6 lg:grid-cols-[1fr_360px] lg:items-center">
          <div className="min-w-0">
            <div className="mb-3 flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1 text-xs font-semibold text-[#5D3699] ring-1 ring-[#e7d8ff]">
                <Sparkles className="h-3 w-3" />
                Welcome Back
              </span>
              <span className="inline-flex rounded-full bg-[#f3ecff] px-2.5 py-1 text-[11px] font-medium text-[#6f4ca6] ring-1 ring-[#e7d8ff]">
                Daily Momentum
              </span>
            </div>

            <h1 className="text-2xl font-semibold leading-tight tracking-tight text-[#111827] sm:text-4xl">
              Hi {displayName},
              <br />
              <span className="bg-gradient-to-r from-[#5D3699] to-[#8c63cc] bg-clip-text text-transparent">
                let&apos;s build your next win
              </span>
            </h1>

            <p className="mt-3 max-w-2xl text-sm text-[#6b7280] sm:text-base">
              Here&apos;s what we&apos;ve prepared for you today to help you grow and achieve your goals.
            </p>
          </div>

          <div className="rounded-2xl border border-[#eadfff] bg-white p-4 shadow-[0_18px_32px_-28px_rgba(93,54,153,0.6)] lg:p-5">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-[0.08em] text-[#7b699d]">Your Progress</span>
              <span className="rounded-full bg-[#f2eaff] px-2.5 py-1 text-xs font-bold text-[#5D3699]">{progressPercent}%</span>
            </div>
            <div className="h-2.5 w-full overflow-hidden rounded-full bg-[#f5f3ff]">
              <div
                className="h-full rounded-full bg-[linear-gradient(90deg,#5D3699,#8b5cf6)] transition-all duration-700"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <p className="mt-2 text-[11px] text-[#84749f]">Consistency unlocks better mentor matching and faster progress.</p>
          </div>
        </div>
      </motion.div>

      {!isEventFlowOnly ? (
      <motion.div variants={fadeUp} className="mt-8 sm:mt-10">
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

        {recommended.length > 0 && (
          <MentorRingCarousel
            items={(() => {
              const baseItems = recommended.map((mentor) => ({
                image: mentor.avatar,
                name: mentor.name,
                role: mentor.location || 'Mentor',
              }));
              if (baseItems.length >= 5) return baseItems;
              const expanded = [];
              for (let i = 0; i < 5; i += 1) {
                expanded.push(baseItems[i % baseItems.length]);
              }
              return expanded;
            })()}
          />
        )}

        {recommended.length > 0 ? (
          <div className="mt-6 grid grid-cols-1 gap-3 sm:gap-4 md:grid-cols-2 lg:gap-5 xl:grid-cols-3">
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
      </motion.div>
      ) : (
      <motion.div variants={fadeUp} className="mt-8 sm:mt-10">
        <div className="rounded-2xl border border-[#e9ddff] bg-white p-5 shadow-[0_20px_40px_-30px_rgba(93,54,153,0.5)]">
          <h2 className="text-base font-semibold text-[#111827]">Join BondRoom Mentee Program</h2>
          <p className="mt-1 text-sm text-[#6b7280]">
            You are currently using event-only access. Want full mentee support, mentor matching, and sessions?
          </p>
          <button
            type="button"
            onClick={() => navigate('/needs-assessment?from=event-flow')}
            className="mt-4 inline-flex items-center rounded-xl bg-[#5D3699] px-4 py-2 text-xs font-semibold text-white hover:bg-[#4a2b7a]"
          >
            Yes, I Want to Join
          </button>
        </div>
      </motion.div>
      )}

      {/* Registered Events Section */}
      <motion.div variants={fadeUp} className="mt-8 sm:mt-10">
        <div className="mb-4 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#f5f3ff] ring-1 ring-[#e9ddff]">
              <CalendarCheck className="h-5 w-5 text-[#5D3699]" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-[#111827]">Registered Events</h2>
              <p className="text-xs text-[#6b7280]">All events you have registered for</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => navigate('/registered-events')}
            className="inline-flex items-center gap-1.5 rounded-full bg-[#f5f3ff] px-4 py-2 text-xs font-medium text-[#5D3699] transition-all hover:bg-[#ede9fe]"
          >
            View All
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>

        {registeredEventsLoading ? (
          <div className="rounded-2xl border border-[#e9ddff] bg-white p-8 text-center shadow-[0_22px_45px_-38px_rgba(93,54,153,0.7)]">
            <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-[#e7d8ff] border-t-[#5D3699]" />
            <p className="mt-3 text-sm text-[#6b7280]">Loading your registered events...</p>
          </div>
        ) : registeredEventCarouselItems.length > 0 ? (
          <div className="rounded-2xl border border-[#e9ddff] bg-white/60 p-3 shadow-[0_22px_45px_-38px_rgba(93,54,153,0.7)] sm:p-4">
            <MentorRingCarousel
              items={registeredEventCarouselItems}
              className="dash-volunteer-arc"
              onCardClick={() => navigate('/registered-events')}
            />
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-[#e2d4fb] bg-white p-8 text-center">
            <p className="text-sm text-[#6b7280]">No registered events yet.</p>
            <button
              type="button"
              onClick={() => navigate('/volunteer-events')}
              className="mt-3 inline-flex items-center rounded-xl bg-[#5D3699] px-4 py-2 text-xs font-semibold text-white hover:bg-[#4a2b7a]"
            >
              Explore Volunteer Events
            </button>
          </div>
        )}

        {registeredEventsError && (
          <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
            {registeredEventsError}
          </div>
        )}
      </motion.div>

      {/* Completed Certificates Section */}
      <motion.div variants={fadeUp} className="mt-8 sm:mt-10">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#f0fdf4] ring-1 ring-[#bbf7d0]">
              <CheckCircle2 className="h-5 w-5 text-[#15803d]" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-[#111827]">Completed Event Certificates</h2>
              <p className="text-xs text-[#6b7280]">Tap any completed event to open and download your certificate PDF</p>
            </div>
          </div>
        </div>

        {registeredEventsLoading ? (
          <div className="rounded-2xl border border-[#e9ddff] bg-white p-6 text-sm text-[#6b7280]">
            Loading completed events...
          </div>
        ) : completedRegisteredEvents.length > 0 ? (
          <div className="overflow-x-auto pb-2">
            <div className="flex min-w-full gap-4">
              {completedRegisteredEvents.map((event) => (
                <button
                  key={`completed-${event.registrationId}`}
                  type="button"
                  onClick={() => navigate(`/event-certificate/${event.registrationId}`)}
                  className="group min-w-[300px] max-w-[360px] flex-1 overflow-hidden rounded-2xl border border-[#d9f9e6] bg-white text-left shadow-[0_18px_40px_-30px_rgba(21,128,61,0.45)] transition-all hover:-translate-y-0.5 hover:shadow-[0_22px_44px_-30px_rgba(21,128,61,0.55)]"
                >
                  <div className="relative h-36 w-full overflow-hidden bg-[#f0fdf4]">
                    {event.image ? (
                      <img src={event.image} alt={event.title} className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#dcfce7] to-[#f0fdf4] text-[#166534]">
                        <CheckCircle2 className="h-8 w-8" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-[#052e16]/65 via-[#052e16]/20 to-transparent" />
                    <span className="absolute right-3 top-3 inline-flex items-center rounded-full bg-[#166534] px-2.5 py-1 text-[10px] font-semibold text-white">
                      Completed
                    </span>
                  </div>
                  <div className="space-y-1.5 p-4">
                    <h3 className="line-clamp-2 text-sm font-semibold text-[#111827]">{event.title}</h3>
                    <p className="text-xs text-[#4b5563]">{event.dateLabel} • {event.timeLabel}</p>
                    <p className="line-clamp-1 text-xs text-[#6b7280]">{event.location}</p>
                    <p className="pt-1 text-xs font-semibold text-[#15803d]">Open Certificate</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-[#d1fae5] bg-white p-6 text-center">
            <p className="text-sm text-[#4b5563]">No completed registered events yet.</p>
            <p className="mt-1 text-xs text-[#6b7280]">Certificates will appear here after completion.</p>
          </div>
        )}
      </motion.div>
      {!isEventFlowOnly ? (
      <>
      {/* Quick Actions Grid */}
      <motion.div variants={fadeUp} className="mt-8 sm:mt-10">
        <div className="flex items-center gap-2 mb-4">
          <div className="h-1 w-1 rounded-full bg-[#5D3699]" />
          <h2 className="text-sm font-semibold text-[#111827]">Quick Actions</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {quickActions.map((item) => {
            const Icon = item.icon;
            const isClickable = Boolean(item.to);

            const cardContent = (
              <div className="group h-full rounded-xl border border-[#e9ddff] bg-white/85 p-4 sm:p-5 shadow-[0_24px_40px_-34px_rgba(93,54,153,0.85)] backdrop-blur-sm transition-all duration-200 hover:-translate-y-1 hover:border-[#c4b5fd] hover:shadow-md">
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
      </motion.div>

      {/* Sessions Section */}
      <motion.div variants={fadeUp} className="mt-8 sm:mt-10 grid grid-cols-1 lg:grid-cols-5 gap-4 sm:gap-6">
        {/* Upcoming Session - Takes more space */}
        <div className="lg:col-span-3">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#f5f3ff] ring-1 ring-[#e9ddff]">
              <Calendar className="h-5 w-5 text-[#5D3699]" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-[#111827]">Upcoming Session</h2>
              <p className="text-xs text-[#6b7280]">Your next scheduled mentoring session</p>
            </div>
          </div>

          <div className="relative overflow-hidden rounded-2xl border border-[#e9ddff] bg-white p-5 shadow-[0_22px_45px_-38px_rgba(93,54,153,0.7)] sm:p-6">
            <div className="pointer-events-none absolute right-0 top-0 z-0 h-24 w-24 rounded-bl-[48px] bg-[#faf7ff]" />
            {upcomingSession ? (
              <div className="relative z-10 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                <div className="flex items-center gap-4">
                  {/* Avatar with online indicator */}
                  <div className="relative flex-shrink-0">
                    <div className="h-14 w-14 overflow-hidden rounded-xl bg-[#f5f3ff] ring-2 ring-[#f0e9ff]">
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
                    <h3 className="text-base font-semibold text-[#111827] sm:text-lg">
                      Session with {upcomingSession.mentorName}
                    </h3>
                    <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-[#6b7280]">
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-[#f8f5ff] px-2.5 py-1 ring-1 ring-[#efe7ff]">
                        <Calendar className="h-3.5 w-3.5" />
                        {formatDateTime(upcomingSession.scheduled_start)}
                      </span>
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-[#fff8eb] px-2.5 py-1 font-medium text-[#b45309] ring-1 ring-[#fde68a]">
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
                  className="relative z-20 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[linear-gradient(135deg,#5D3699_0%,#7b4cbc_100%)] px-5 py-3 text-sm font-semibold text-white shadow-[0_10px_22px_-14px_rgba(93,54,153,0.75)] transition-all hover:-translate-y-0.5 hover:bg-[linear-gradient(135deg,#4a2b7a_0%,#6a41ac_100%)] hover:shadow-[0_14px_26px_-14px_rgba(93,54,153,0.85)] disabled:opacity-60 sm:w-auto sm:flex-shrink-0"
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
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#f5f3ff] ring-1 ring-[#e8dcff]">
                  <Calendar className="h-7 w-7 text-[#7c65ad]" />
                </div>
                <p className="mt-4 text-sm font-semibold text-[#111827]">No upcoming sessions</p>
                <p className="mt-1 text-xs text-[#6b7280]">Book a session with a mentor to get started</p>
                <button
                  type="button"
                  onClick={() => navigate('/mentors')}
                  className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-[#5D3699] px-4 py-2 text-xs font-semibold text-white transition-all hover:-translate-y-0.5 hover:bg-[#4a2b7a]"
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
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#f5f3ff] ring-1 ring-[#e9ddff]">
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

          <div className="overflow-hidden rounded-2xl border border-[#e9ddff] bg-white shadow-[0_22px_45px_-38px_rgba(93,54,153,0.7)]">
            {recentSessions.length > 0 ? (
              <div className="divide-y divide-[#ece4ff]">
                {recentSessions.map((s) => (
                  <div
                    key={s.id}
                    className="flex items-center justify-between p-4 transition-colors hover:bg-[#faf7ff]"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="relative flex-shrink-0">
                        <div className="h-10 w-10 overflow-hidden rounded-lg bg-[#f5f3ff] ring-1 ring-[#ece4ff]">
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
                      className={`flex-shrink-0 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-semibold ring-1 ${s.status === 'Done'
                          ? 'bg-green-50 text-[#16a34a] ring-green-200'
                          : 'bg-[#f5f3ff] text-[#5D3699] ring-[#e9ddff]'
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
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#f5f3ff] ring-1 ring-[#e8dcff]">
                  <Clock className="h-7 w-7 text-[#7c65ad]" />
                </div>
                <p className="mt-3 text-sm font-semibold text-[#111827]">No recent sessions</p>
                <p className="mt-1 text-xs text-[#6b7280]">Your completed sessions will appear here.</p>
              </div>
            )}
          </div>
        </div>
      </motion.div>
      </>
      ) : null}
      {/* Loading/Error States */}
      {(dashboardLoading || dashboardError || menteeError) && (
        <div className={`mt-6 flex items-center justify-center gap-3 rounded-xl border border-[#e5e7eb] bg-white p-4 ${dashboardError || menteeError ? 'border-red-200' : ''
          }`}>
          {dashboardLoading && (
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-[#e5e7eb] border-t-[#5D3699]" />
          )}
          <span className={`text-sm ${dashboardError || menteeError ? 'text-red-600' : 'text-[#6b7280]'}`}>
            {dashboardError || menteeError || 'Loading dashboard...'}
          </span>
        </div>
      )}
    </motion.div>
  );
};

export default Dashboard;





