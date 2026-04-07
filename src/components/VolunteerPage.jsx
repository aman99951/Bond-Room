import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, ArrowRight, Calendar, CalendarDays, CheckCircle2, ChevronRight, Users } from 'lucide-react';
import { menteeApi } from '../apis/api/menteeApi';
import { clearAuthSession, getAuthSession } from '../apis/api/storage';
import VolunteerTopAuth from './auth/VolunteerTopAuth';
import VolunteerBottomAuth from './auth/VolunteerBottomAuth';
import './LandingPage.css';
import './menties/pages/DashboardMentorCarousel.css';

const formatDate = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Date unavailable';
  return date.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
};

const toIsoDate = (date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

const toIsoMonth = (date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
};

const parseIsoDate = (value) => {
  const parsed = new Date(`${value}T00:00:00`);
  return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
};

const normalizeList = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.results)) return payload.results;
  return [];
};

const normalizeVolunteerEvent = (event) => ({
  ...event,
  image: event?.image || '',
  date: event?.date || '',
  time: event?.time || '',
  completed_on: event?.completed_on || '',
  joined_count: Number(event?.joined_count || 0),
  completion_brief: String(event?.completion_brief || '').trim(),
  gallery_images: Array.isArray(event?.gallery_images)
    ? event.gallery_images.map((item) => String(item || '').trim()).filter(Boolean)
    : [],
});

const getCompletedEventDate = (event) => String(event?.completed_on || event?.date || '');

const calendarWeekLabels = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

const MentorRingCarousel = ({ items, className = 'dash-volunteer-arc', onCardClick = null }) => {
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
  const HOVER_SPEED = 0;
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
      if (rafRef.current) window.cancelAnimationFrame(rafRef.current);
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
    if (!dragRef.current) targetSpeedRef.current = HOVER_SPEED;
  };

  const handleStageLeave = () => {
    hoverRef.current = false;
    if (!dragRef.current) targetSpeedRef.current = BASE_SPEED;
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
    if (travelX > 6 || travelY > 6) movedRef.current = true;
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
      if (item) onCardClick(item);
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
          {items.map(({ id, image, name, role }, index) => (
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
          ))}
        </div>
      </div>
    </div>
  );
};

const VolunteerRingCarousel = ({ items, onCardClick }) => {
  const carouselItems = items.map((event) => ({
    id: event.id,
    image: event.image,
    name: event.title,
    role: `${event.stream} - ${formatDate(event.date)} - ${event.time || 'Time TBA'}`,
  }));
  return <MentorRingCarousel items={carouselItems} className="dash-volunteer-arc" onCardClick={onCardClick} />;
};

const VolunteerPage = () => {
  const navigate = useNavigate();
  const [volunteerEvents, setVolunteerEvents] = useState([]);
  const [completedVolunteerEvents, setCompletedVolunteerEvents] = useState([]);
  const [eventsLoading, setEventsLoading] = useState(true);
  const [eventsError, setEventsError] = useState('');
  const [volunteerRange, setVolunteerRange] = useState('year');
  const [selectedDay, setSelectedDay] = useState(() => new Date().toISOString().slice(0, 10));
  const [selectedMonth, setSelectedMonth] = useState(() => new Date().toISOString().slice(0, 7));
  const [selectedYear, setSelectedYear] = useState(() => String(new Date().getFullYear()));
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [calendarCursor, setCalendarCursor] = useState(() => parseIsoDate(new Date().toISOString().slice(0, 10)));
  const [monthPickerYear, setMonthPickerYear] = useState(() => Number(new Date().getFullYear()));
  const [completedRange, setCompletedRange] = useState('year');
  const [completedSelectedDay, setCompletedSelectedDay] = useState(() => new Date().toISOString().slice(0, 10));
  const [completedSelectedMonth, setCompletedSelectedMonth] = useState(() => new Date().toISOString().slice(0, 7));
  const [completedSelectedYear, setCompletedSelectedYear] = useState(() => String(new Date().getFullYear()));
  const [completedCalendarOpen, setCompletedCalendarOpen] = useState(false);
  const [completedCalendarCursor, setCompletedCalendarCursor] = useState(() => parseIsoDate(new Date().toISOString().slice(0, 10)));
  const [completedMonthPickerYear, setCompletedMonthPickerYear] = useState(() => Number(new Date().getFullYear()));
  const [showLogoutPrompt, setShowLogoutPrompt] = useState(false);
  const calendarPopoverRef = useRef(null);
  const completedCalendarPopoverRef = useRef(null);

  const handleBackToHome = () => {
    const session = getAuthSession();
    if (session?.accessToken) {
      setShowLogoutPrompt(true);
      return;
    }
    navigate('/');
  };

  const handleLogoutAndGoHome = () => {
    clearAuthSession();
    setShowLogoutPrompt(false);
    navigate('/', { replace: true });
  };

  useEffect(() => {
    if (!calendarOpen && !completedCalendarOpen) return undefined;
    const handleOutside = (event) => {
      if (calendarOpen && !calendarPopoverRef.current?.contains(event.target)) setCalendarOpen(false);
      if (completedCalendarOpen && !completedCalendarPopoverRef.current?.contains(event.target)) {
        setCompletedCalendarOpen(false);
      }
    };
    window.addEventListener('mousedown', handleOutside);
    return () => window.removeEventListener('mousedown', handleOutside);
  }, [calendarOpen, completedCalendarOpen]);

  useEffect(() => {
    let cancelled = false;
    const loadEvents = async () => {
      setEventsLoading(true);
      setEventsError('');
      try {
        const [upcomingRes, completedRes] = await Promise.all([
          menteeApi.listPublicVolunteerEvents({ status: 'upcoming' }),
          menteeApi.listPublicVolunteerEvents({ status: 'completed' }),
        ]);
        if (cancelled) return;
        setVolunteerEvents(normalizeList(upcomingRes).map(normalizeVolunteerEvent));
        setCompletedVolunteerEvents(normalizeList(completedRes).map(normalizeVolunteerEvent));
      } catch (error) {
        if (cancelled) return;
        setVolunteerEvents([]);
        setCompletedVolunteerEvents([]);
        setEventsError(error?.message || 'Unable to load volunteer events right now.');
      } finally {
        if (!cancelled) setEventsLoading(false);
      }
    };

    loadEvents();
    return () => {
      cancelled = true;
    };
  }, []);

  const volunteerYearOptions = useMemo(() => {
    const values = [
      ...volunteerEvents.map((event) => String(event?.date || '').slice(0, 4)),
      ...completedVolunteerEvents.map((event) => String(event?.completed_on || '').slice(0, 4)),
    ].filter((value) => /^\d{4}$/.test(value));
    if (!values.length) return [String(new Date().getFullYear())];
    const set = new Set(values);
    return Array.from(set).sort((a, b) => Number(a) - Number(b));
  }, [completedVolunteerEvents, volunteerEvents]);

  const completedYearOptions = useMemo(() => {
    const values = completedVolunteerEvents
      .map((event) => getCompletedEventDate(event).slice(0, 4))
      .filter((value) => /^\d{4}$/.test(value));
    if (!values.length) return [String(new Date().getFullYear())];
    return Array.from(new Set(values)).sort((a, b) => Number(a) - Number(b));
  }, [completedVolunteerEvents]);

  useEffect(() => {
    if (!volunteerYearOptions.includes(selectedYear)) {
      setSelectedYear(volunteerYearOptions[volunteerYearOptions.length - 1]);
    }
  }, [selectedYear, volunteerYearOptions]);

  useEffect(() => {
    if (!completedYearOptions.includes(completedSelectedYear)) {
      setCompletedSelectedYear(completedYearOptions[completedYearOptions.length - 1]);
    }
  }, [completedSelectedYear, completedYearOptions]);

  const filteredVolunteerEvents = useMemo(() => {
    return volunteerEvents.filter((event) => {
      const eventDateValue = String(event?.date || '');
      if (!eventDateValue) return false;

      if (volunteerRange === 'day') {
        return eventDateValue === selectedDay;
      }
      if (volunteerRange === 'week') {
        const start = new Date(`${selectedDay}T00:00:00`);
        const eventDate = new Date(`${eventDateValue}T00:00:00`);
        if (Number.isNaN(start.getTime()) || Number.isNaN(eventDate.getTime())) return false;
        const diffDays = Math.floor((eventDate.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
        return diffDays >= 0 && diffDays <= 7;
      }
      if (volunteerRange === 'month') {
        return eventDateValue.slice(0, 7) === selectedMonth;
      }
      if (volunteerRange === 'year') {
        return eventDateValue.slice(0, 4) === selectedYear;
      }
      return true;
    });
  }, [selectedDay, selectedMonth, selectedYear, volunteerEvents, volunteerRange]);

  const filteredCompletedVolunteerEvents = useMemo(() => {
    return completedVolunteerEvents.filter((event) => {
      const eventDateValue = getCompletedEventDate(event);
      if (!eventDateValue) return false;

      if (completedRange === 'day') return eventDateValue === completedSelectedDay;
      if (completedRange === 'week') {
        const start = new Date(`${completedSelectedDay}T00:00:00`);
        const eventDate = new Date(`${eventDateValue}T00:00:00`);
        if (Number.isNaN(start.getTime()) || Number.isNaN(eventDate.getTime())) return false;
        const diffDays = Math.floor((eventDate.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
        return diffDays >= 0 && diffDays <= 7;
      }
      if (completedRange === 'month') return eventDateValue.slice(0, 7) === completedSelectedMonth;
      if (completedRange === 'year') return eventDateValue.slice(0, 4) === completedSelectedYear;
      return true;
    });
  }, [
    completedRange,
    completedSelectedDay,
    completedSelectedMonth,
    completedSelectedYear,
    completedVolunteerEvents,
  ]);

  const calendarDays = useMemo(() => {
    const first = new Date(calendarCursor.getFullYear(), calendarCursor.getMonth(), 1);
    const firstWeekday = first.getDay();
    const start = new Date(first);
    start.setDate(first.getDate() - firstWeekday);
    return Array.from({ length: 42 }).map((_, index) => {
      const day = new Date(start);
      day.setDate(start.getDate() + index);
      return day;
    });
  }, [calendarCursor]);

  const completedCalendarDays = useMemo(() => {
    const first = new Date(completedCalendarCursor.getFullYear(), completedCalendarCursor.getMonth(), 1);
    const firstWeekday = first.getDay();
    const start = new Date(first);
    start.setDate(first.getDate() - firstWeekday);
    return Array.from({ length: 42 }).map((_, index) => {
      const day = new Date(start);
      day.setDate(start.getDate() + index);
      return day;
    });
  }, [completedCalendarCursor]);

  const selectedDayLabel = useMemo(() => formatDate(selectedDay), [selectedDay]);
  const selectedMonthLabel = useMemo(() => {
    const parsed = parseIsoDate(`${selectedMonth}-01`);
    return parsed.toLocaleDateString([], { month: 'long', year: 'numeric' });
  }, [selectedMonth]);
  const completedSelectedDayLabel = useMemo(() => formatDate(completedSelectedDay), [completedSelectedDay]);
  const completedSelectedMonthLabel = useMemo(() => {
    const parsed = parseIsoDate(`${completedSelectedMonth}-01`);
    return parsed.toLocaleDateString([], { month: 'long', year: 'numeric' });
  }, [completedSelectedMonth]);
  const toggleCalendar = () => {
    setCalendarOpen((prev) => !prev);
    if (!calendarOpen) {
      if (volunteerRange === 'month') {
        setMonthPickerYear(Number(selectedMonth.slice(0, 4)) || new Date().getFullYear());
      } else if (volunteerRange === 'day' || volunteerRange === 'week') {
        setCalendarCursor(parseIsoDate(selectedDay));
      }
    }
  };

  const toggleCompletedCalendar = () => {
    setCompletedCalendarOpen((prev) => !prev);
    if (!completedCalendarOpen) {
      if (completedRange === 'month') {
        setCompletedMonthPickerYear(Number(completedSelectedMonth.slice(0, 4)) || new Date().getFullYear());
      } else if (completedRange === 'day' || completedRange === 'week') {
        setCompletedCalendarCursor(parseIsoDate(completedSelectedDay));
      }
    }
  };

  return (
    <>
      <VolunteerTopAuth logoutRedirectTo="/volunteer" />
      <motion.div
        className="min-h-screen bg-[linear-gradient(180deg,#f8f3ff_0%,#ffffff_55%,#f6f0ff_100%)] p-4 pt-24 sm:p-8 sm:pt-28"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
      {showLogoutPrompt ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 px-4">
          <div className="w-full max-w-md rounded-2xl border border-[#e8dcff] bg-white p-6 shadow-[0_24px_54px_-26px_rgba(0,0,0,0.5)]">
            <h3 className="text-lg font-semibold text-[#111827]">Logout Required</h3>
            <p className="mt-2 text-sm text-[#6b7280]">
              You are currently logged in. Logout first to return to the home screen.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={handleLogoutAndGoHome}
                className="inline-flex items-center rounded-lg bg-[#5D3699] px-4 py-2 text-sm font-semibold text-white hover:bg-[#4a2b7a]"
              >
                Logout and Go Home
              </button>
              <button
                type="button"
                onClick={() => setShowLogoutPrompt(false)}
                className="inline-flex items-center rounded-lg border border-[#ddd6fe] bg-white px-4 py-2 text-sm font-semibold text-[#5D3699] hover:bg-[#f8f4ff]"
              >
                Stay Here
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <div className="mx-auto max-w-full">
        <section className="relative mt-5 overflow-hidden rounded-[28px] border border-[#e8dcff] bg-white p-6 shadow-[0_28px_60px_-46px_rgba(93,54,153,0.65)] sm:p-10">
          <div className="pointer-events-none absolute -right-8 -top-8 h-36 w-36 rounded-full bg-[#efe6ff] blur-2xl" />
          <div className="pointer-events-none absolute -left-10 bottom-0 h-24 w-24 rounded-full bg-[#f4edff] blur-2xl" />
          <div className="relative">
            <p className="text-xs font-semibold uppercase tracking-wide text-[#7b699d]">Volunteer</p>
            <h1 className="mt-2 text-3xl font-semibold leading-tight text-[#111827] sm:text-5xl">
              Upcoming and Completed
              <br />
              <span className="bg-gradient-to-r from-[#5D3699] to-[#8c63cc] bg-clip-text text-transparent">
                Community Events
              </span>
            </h1>
            <p className="mt-5 max-w-3xl text-sm leading-7 text-[#5f6472] sm:text-base">
              Discover active opportunities and impact from completed drives using the same event experience as the mentee dashboard.
            </p>
          </div>
        </section>

        <section className="mt-6 rounded-2xl border border-[#e9ddff] bg-white p-4 shadow-[0_24px_44px_-34px_rgba(93,54,153,0.7)] sm:p-6">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#f5f3ff] ring-1 ring-[#e9ddff]">
                <Calendar className="h-5 w-5 text-[#5D3699]" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-[#111827]">Upcoming Events</h2>
                <p className="text-xs text-[#6b7280]">Filter and browse active volunteer opportunities</p>
              </div>
            </div>

            <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto sm:justify-end">
              <div className="inline-flex max-w-full items-center gap-1 overflow-x-auto rounded-full border border-[#e8dcff] bg-white p-1">
                {[
                  { key: 'day', label: 'Day' },
                  { key: 'week', label: 'Week' },
                  { key: 'month', label: 'Month' },
                  { key: 'year', label: 'Year' },
                ].map((item) => (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => {
                      setVolunteerRange(item.key);
                      setCalendarOpen(false);
                    }}
                    className={`whitespace-nowrap rounded-full px-3 py-1.5 text-[11px] font-semibold transition-all ${
                      volunteerRange === item.key
                        ? 'bg-[#5D3699] text-white shadow-sm'
                        : 'text-[#5D3699] hover:bg-[#f5f3ff]'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              <div className="relative" ref={calendarPopoverRef}>
                <button
                  type="button"
                  onClick={toggleCalendar}
                  className="inline-flex max-w-full items-center gap-2 rounded-full border border-[#e8dcff] bg-white px-3 py-2 text-xs font-medium text-[#5D3699] transition-colors hover:bg-[#f8f4ff]"
                >
                  <CalendarDays className="h-3.5 w-3.5" />
                  <span className="max-w-[130px] truncate sm:max-w-none">
                    {volunteerRange === 'day' || volunteerRange === 'week'
                      ? selectedDayLabel
                      : volunteerRange === 'month'
                        ? selectedMonthLabel
                        : selectedYear}
                  </span>
                  <ChevronRight className={`h-3.5 w-3.5 transition-transform ${calendarOpen ? 'rotate-90' : ''}`} />
                </button>

                {calendarOpen && (
                  <div className="absolute right-0 z-30 mt-2 w-[min(92vw,320px)] rounded-2xl border border-[#e8dcff] bg-white p-3 shadow-[0_20px_45px_-26px_rgba(93,54,153,0.65)] sm:w-[320px]">
                    {(volunteerRange === 'day' || volunteerRange === 'week') && (
                      <>
                        <div className="mb-2 flex items-center justify-between">
                          <button
                            type="button"
                            onClick={() => setCalendarCursor((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))}
                            className="rounded-lg p-1 text-[#5D3699] hover:bg-[#f5f3ff]"
                            aria-label="Previous month"
                          >
                            <ChevronRight className="h-4 w-4 rotate-180" />
                          </button>
                          <p className="text-sm font-semibold text-[#312049]">
                            {calendarCursor.toLocaleDateString([], { month: 'long', year: 'numeric' })}
                          </p>
                          <button
                            type="button"
                            onClick={() => setCalendarCursor((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))}
                            className="rounded-lg p-1 text-[#5D3699] hover:bg-[#f5f3ff]"
                            aria-label="Next month"
                          >
                            <ChevronRight className="h-4 w-4" />
                          </button>
                        </div>

                        <div className="grid grid-cols-7 gap-1">
                          {calendarWeekLabels.map((label) => (
                            <span key={label} className="text-center text-[10px] font-semibold text-[#7b699d]">
                              {label}
                            </span>
                          ))}
                          {calendarDays.map((day) => {
                            const iso = toIsoDate(day);
                            const inCurrentMonth = day.getMonth() === calendarCursor.getMonth();
                            const selected = iso === selectedDay;
                            return (
                              <button
                                key={iso}
                                type="button"
                                onClick={() => {
                                  setSelectedDay(iso);
                                  setCalendarOpen(false);
                                }}
                                className={`h-8 rounded-lg text-xs transition-colors ${
                                  selected
                                    ? 'bg-[#5D3699] text-white'
                                    : inCurrentMonth
                                      ? 'text-[#312049] hover:bg-[#f5f3ff]'
                                      : 'text-[#b8aecb] hover:bg-[#faf7ff]'
                                }`}
                              >
                                {day.getDate()}
                              </button>
                            );
                          })}
                        </div>
                      </>
                    )}

                    {volunteerRange === 'month' && (
                      <>
                        <div className="mb-2 flex items-center justify-between">
                          <button
                            type="button"
                            onClick={() => setMonthPickerYear((prev) => prev - 1)}
                            className="rounded-lg p-1 text-[#5D3699] hover:bg-[#f5f3ff]"
                            aria-label="Previous year"
                          >
                            <ChevronRight className="h-4 w-4 rotate-180" />
                          </button>
                          <p className="text-sm font-semibold text-[#312049]">{monthPickerYear}</p>
                          <button
                            type="button"
                            onClick={() => setMonthPickerYear((prev) => prev + 1)}
                            className="rounded-lg p-1 text-[#5D3699] hover:bg-[#f5f3ff]"
                            aria-label="Next year"
                          >
                            <ChevronRight className="h-4 w-4" />
                          </button>
                        </div>

                        <div className="grid grid-cols-3 gap-2">
                          {Array.from({ length: 12 }).map((_, index) => {
                            const date = new Date(monthPickerYear, index, 1);
                            const monthValue = toIsoMonth(date);
                            const selected = monthValue === selectedMonth;
                            return (
                              <button
                                key={monthValue}
                                type="button"
                                onClick={() => {
                                  setSelectedMonth(monthValue);
                                  setCalendarOpen(false);
                                }}
                                className={`rounded-lg px-2 py-2 text-xs font-medium transition-colors ${
                                  selected
                                    ? 'bg-[#5D3699] text-white'
                                    : 'text-[#312049] hover:bg-[#f5f3ff]'
                                }`}
                              >
                                {date.toLocaleDateString([], { month: 'short' })}
                              </button>
                            );
                          })}
                        </div>
                      </>
                    )}

                    {volunteerRange === 'year' && (
                      <div className="grid grid-cols-3 gap-2">
                        {volunteerYearOptions.map((year) => {
                          const selected = year === selectedYear;
                          return (
                            <button
                              key={year}
                              type="button"
                              onClick={() => {
                                setSelectedYear(year);
                                setCalendarOpen(false);
                              }}
                              className={`rounded-lg px-2 py-2 text-xs font-medium transition-colors ${
                                selected ? 'bg-[#5D3699] text-white' : 'text-[#312049] hover:bg-[#f5f3ff]'
                              }`}
                            >
                              {year}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <Link
                to="/volunteer-events"
                className="inline-flex items-center gap-1.5 rounded-full bg-[#f5f3ff] px-4 py-2 text-xs font-medium text-[#5D3699] transition-all hover:bg-[#ede9fe]"
              >
                View All
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>

          {filteredVolunteerEvents.length > 0 ? (
            <VolunteerRingCarousel
              items={filteredVolunteerEvents}
              onCardClick={(item) => {
                if (!item?.id) return;
                navigate(`/volunteer-events/${item.id}/register`);
              }}
            />
          ) : (
            <div className="rounded-xl border border-[#e5e7eb] border-dashed bg-white p-8 text-center">
              <p className="text-sm text-[#6b7280]">
                {eventsLoading ? 'Loading upcoming events...' : 'No volunteer activities found for this filter.'}
              </p>
            </div>
          )}
        </section>

        <section className="mt-6 rounded-2xl border border-[#dcfce7] bg-white p-4 shadow-[0_24px_44px_-34px_rgba(21,128,61,0.35)] sm:p-6">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#eefcf5] ring-1 ring-[#c7f0da]">
                <CheckCircle2 className="h-5 w-5 text-[#15803d]" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-[#111827]">Completed Volunteer Events</h2>
                <p className="text-xs text-[#6b7280]">Impact stories from already completed activities</p>
              </div>
            </div>

            <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto sm:justify-end">
              <div className="inline-flex max-w-full items-center gap-1 overflow-x-auto rounded-full border border-[#dcfce7] bg-white p-1">
                {[
                  { key: 'day', label: 'Day' },
                  { key: 'week', label: 'Week' },
                  { key: 'month', label: 'Month' },
                  { key: 'year', label: 'Year' },
                ].map((item) => (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => {
                      setCompletedRange(item.key);
                      setCompletedCalendarOpen(false);
                    }}
                    className={`whitespace-nowrap rounded-full px-3 py-1.5 text-[11px] font-semibold transition-all ${
                      completedRange === item.key
                        ? 'bg-[#15803d] text-white shadow-sm'
                        : 'text-[#166534] hover:bg-[#f0fdf4]'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              <div className="relative" ref={completedCalendarPopoverRef}>
                <button
                  type="button"
                  onClick={toggleCompletedCalendar}
                  className="inline-flex max-w-full items-center gap-2 rounded-full border border-[#dcfce7] bg-white px-3 py-2 text-xs font-medium text-[#166534] transition-colors hover:bg-[#f0fdf4]"
                >
                  <CalendarDays className="h-3.5 w-3.5" />
                  <span className="max-w-[130px] truncate sm:max-w-none">
                    {completedRange === 'day' || completedRange === 'week'
                      ? completedSelectedDayLabel
                      : completedRange === 'month'
                        ? completedSelectedMonthLabel
                        : completedSelectedYear}
                  </span>
                  <ChevronRight className={`h-3.5 w-3.5 transition-transform ${completedCalendarOpen ? 'rotate-90' : ''}`} />
                </button>

                {completedCalendarOpen && (
                  <div className="absolute right-0 z-30 mt-2 w-[min(92vw,320px)] rounded-2xl border border-[#dcfce7] bg-white p-3 shadow-[0_20px_45px_-26px_rgba(21,128,61,0.4)] sm:w-[320px]">
                    {(completedRange === 'day' || completedRange === 'week') && (
                      <>
                        <div className="mb-2 flex items-center justify-between">
                          <button
                            type="button"
                            onClick={() => setCompletedCalendarCursor((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))}
                            className="rounded-lg p-1 text-[#166534] hover:bg-[#f0fdf4]"
                            aria-label="Previous month"
                          >
                            <ChevronRight className="h-4 w-4 rotate-180" />
                          </button>
                          <p className="text-sm font-semibold text-[#14532d]">
                            {completedCalendarCursor.toLocaleDateString([], { month: 'long', year: 'numeric' })}
                          </p>
                          <button
                            type="button"
                            onClick={() => setCompletedCalendarCursor((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))}
                            className="rounded-lg p-1 text-[#166534] hover:bg-[#f0fdf4]"
                            aria-label="Next month"
                          >
                            <ChevronRight className="h-4 w-4" />
                          </button>
                        </div>

                        <div className="grid grid-cols-7 gap-1">
                          {calendarWeekLabels.map((label) => (
                            <span key={label} className="text-center text-[10px] font-semibold text-[#4b7a57]">
                              {label}
                            </span>
                          ))}
                          {completedCalendarDays.map((day) => {
                            const iso = toIsoDate(day);
                            const inCurrentMonth = day.getMonth() === completedCalendarCursor.getMonth();
                            const selected = iso === completedSelectedDay;
                            return (
                              <button
                                key={iso}
                                type="button"
                                onClick={() => {
                                  setCompletedSelectedDay(iso);
                                  setCompletedCalendarOpen(false);
                                }}
                                className={`h-8 rounded-lg text-xs transition-colors ${
                                  selected
                                    ? 'bg-[#15803d] text-white'
                                    : inCurrentMonth
                                      ? 'text-[#14532d] hover:bg-[#f0fdf4]'
                                      : 'text-[#a7bcae] hover:bg-[#f8faf8]'
                                }`}
                              >
                                {day.getDate()}
                              </button>
                            );
                          })}
                        </div>
                      </>
                    )}

                    {completedRange === 'month' && (
                      <>
                        <div className="mb-2 flex items-center justify-between">
                          <button
                            type="button"
                            onClick={() => setCompletedMonthPickerYear((prev) => prev - 1)}
                            className="rounded-lg p-1 text-[#166534] hover:bg-[#f0fdf4]"
                            aria-label="Previous year"
                          >
                            <ChevronRight className="h-4 w-4 rotate-180" />
                          </button>
                          <p className="text-sm font-semibold text-[#14532d]">{completedMonthPickerYear}</p>
                          <button
                            type="button"
                            onClick={() => setCompletedMonthPickerYear((prev) => prev + 1)}
                            className="rounded-lg p-1 text-[#166534] hover:bg-[#f0fdf4]"
                            aria-label="Next year"
                          >
                            <ChevronRight className="h-4 w-4" />
                          </button>
                        </div>

                        <div className="grid grid-cols-3 gap-2">
                          {Array.from({ length: 12 }).map((_, index) => {
                            const date = new Date(completedMonthPickerYear, index, 1);
                            const monthValue = toIsoMonth(date);
                            const selected = monthValue === completedSelectedMonth;
                            return (
                              <button
                                key={monthValue}
                                type="button"
                                onClick={() => {
                                  setCompletedSelectedMonth(monthValue);
                                  setCompletedCalendarOpen(false);
                                }}
                                className={`rounded-lg px-2 py-2 text-xs font-medium transition-colors ${
                                  selected
                                    ? 'bg-[#15803d] text-white'
                                    : 'text-[#14532d] hover:bg-[#f0fdf4]'
                                }`}
                              >
                                {date.toLocaleDateString([], { month: 'short' })}
                              </button>
                            );
                          })}
                        </div>
                      </>
                    )}

                    {completedRange === 'year' && (
                      <div className="grid grid-cols-3 gap-2">
                        {completedYearOptions.map((year) => {
                          const selected = year === completedSelectedYear;
                          return (
                            <button
                              key={year}
                              type="button"
                              onClick={() => {
                                setCompletedSelectedYear(year);
                                setCompletedCalendarOpen(false);
                              }}
                              className={`rounded-lg px-2 py-2 text-xs font-medium transition-colors ${
                                selected ? 'bg-[#15803d] text-white' : 'text-[#14532d] hover:bg-[#f0fdf4]'
                              }`}
                            >
                              {year}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {filteredCompletedVolunteerEvents.length > 0 ? (
            <div className="flex gap-4 overflow-x-auto pb-2 [scrollbar-width:thin] [scrollbar-color:#c4b5fd_transparent]">
              {filteredCompletedVolunteerEvents.map((event) => (
                <button
                  key={event.id}
                  type="button"
                  onClick={() => navigate(`/volunteer/completed/${event.id}`)}
                  className="group min-w-[260px] max-w-[260px] overflow-hidden rounded-2xl border border-[#e9ddff] bg-white text-left shadow-[0_24px_44px_-34px_rgba(93,54,153,0.7)] transition-transform duration-200 hover:-translate-y-1 sm:min-w-[300px] sm:max-w-[300px]"
                >
                  <div className="relative h-40 overflow-hidden">
                    <img
                      src={event.image}
                      alt={event.title}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#120a2c]/75 via-[#120a2c]/30 to-transparent" />
                    <div className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-white/95 px-2.5 py-1 text-[10px] font-semibold text-[#14532d] ring-1 ring-[#bbf7d0]">
                      <CheckCircle2 className="h-3 w-3" />
                      Completed
                    </div>
                    <div className="absolute bottom-3 left-3 right-3">
                      <p className="text-[10px] font-semibold uppercase tracking-wide text-[#d8cff1]">{event.stream}</p>
                      <h3 className="mt-1 line-clamp-2 text-sm font-semibold text-white">{event.title}</h3>
                    </div>
                  </div>

                  <div className="space-y-3 p-4">
                    <p className="line-clamp-2 text-xs leading-5 text-[#6b7280]">{event.summary}</p>
                    <div className="inline-flex items-center gap-1 rounded-full bg-[#f5f3ff] px-2.5 py-1 text-[10px] font-medium text-[#5D3699]">
                      <Calendar className="h-3 w-3" />
                      {formatDate(getCompletedEventDate(event))}
                    </div>
                    <div className="rounded-xl border border-[#dcfce7] bg-[#f0fdf4] p-3">
                      <p className="text-[10px] font-semibold uppercase tracking-wide text-[#166534]">Impact</p>
                      <p className="mt-1 text-xs font-medium text-[#166534]">{event.impact}</p>
                      <p className="mt-1 text-[11px] text-[#15803d]">{event.location}</p>
                    </div>
                    <p className="inline-flex items-center gap-1 text-[11px] font-medium text-[#14532d]">
                      <Users className="h-3.5 w-3.5" />
                      {Number(event.joined_count || event.seats || 0)} joined
                    </p>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-[#e5e7eb] border-dashed bg-white p-8 text-center">
              <p className="text-sm text-[#6b7280]">
                {eventsLoading ? 'Loading completed events...' : 'No completed volunteer events found for this filter.'}
              </p>
            </div>
          )}
        </section>

        {eventsError ? (
          <div className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
            {eventsError}
          </div>
        ) : null}
      </div>
      </motion.div>
      <VolunteerBottomAuth />
    </>
  );
};

export default VolunteerPage;
