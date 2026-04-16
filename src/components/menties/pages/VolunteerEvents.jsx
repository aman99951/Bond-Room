import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowUpRight,
  Calendar,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  Clock,
  MapPin,
  Users,
} from 'lucide-react';
import { menteeApi } from '../../../apis/api/menteeApi';
import VolunteerBottomAuth from '../../auth/VolunteerBottomAuth';
import logo from '../../assets/Logo.svg';
import './VolunteerEvents.css';

const formatDate = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
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

const calendarWeekLabels = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
const EVENTS_PER_PAGE = 6;

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

const VolunteerEvents = () => {
  const navigate = useNavigate();
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [completedEvents, setCompletedEvents] = useState([]);
  const [eventsLoading, setEventsLoading] = useState(true);
  const [eventsError, setEventsError] = useState('');
  const [upcomingPage, setUpcomingPage] = useState(1);
  const [completedPage, setCompletedPage] = useState(1);
  const [upcomingRange, setUpcomingRange] = useState('year');
  const [upcomingSelectedDay, setUpcomingSelectedDay] = useState(() => new Date().toISOString().slice(0, 10));
  const [upcomingSelectedMonth, setUpcomingSelectedMonth] = useState(() => new Date().toISOString().slice(0, 7));
  const [upcomingSelectedYear, setUpcomingSelectedYear] = useState(() => String(new Date().getFullYear()));
  const [upcomingCalendarOpen, setUpcomingCalendarOpen] = useState(false);
  const [upcomingCalendarCursor, setUpcomingCalendarCursor] = useState(() => parseIsoDate(new Date().toISOString().slice(0, 10)));
  const [upcomingMonthPickerYear, setUpcomingMonthPickerYear] = useState(() => Number(new Date().getFullYear()));
  const [completedRange, setCompletedRange] = useState('year');
  const [completedSelectedDay, setCompletedSelectedDay] = useState(() => new Date().toISOString().slice(0, 10));
  const [completedSelectedMonth, setCompletedSelectedMonth] = useState(() => new Date().toISOString().slice(0, 7));
  const [completedSelectedYear, setCompletedSelectedYear] = useState(() => String(new Date().getFullYear()));
  const [completedCalendarOpen, setCompletedCalendarOpen] = useState(false);
  const [completedCalendarCursor, setCompletedCalendarCursor] = useState(() => parseIsoDate(new Date().toISOString().slice(0, 10)));
  const [completedMonthPickerYear, setCompletedMonthPickerYear] = useState(() => Number(new Date().getFullYear()));
  const [mobileOpen, setMobileOpen] = useState(false);
  const calendarPopoverRef = useRef(null);
  const completedCalendarPopoverRef = useRef(null);
  const closeMobile = useCallback(() => setMobileOpen(false), []);
  const NAV = [
    { label: 'Home', href: '/' },
    { label: 'About', href: '/about' },
    { label: 'Volunteer', href: '/volunteer' },
    { label: 'Safety', href: '/#safety' },
    { label: 'Stories', href: '/#stories' },
  ];

  useEffect(() => {
    if (!upcomingCalendarOpen && !completedCalendarOpen) return undefined;
    const handleOutside = (event) => {
      if (upcomingCalendarOpen && !calendarPopoverRef.current?.contains(event.target)) setUpcomingCalendarOpen(false);
      if (completedCalendarOpen && !completedCalendarPopoverRef.current?.contains(event.target)) setCompletedCalendarOpen(false);
    };
    window.addEventListener('mousedown', handleOutside);
    return () => window.removeEventListener('mousedown', handleOutside);
  }, [upcomingCalendarOpen, completedCalendarOpen]);

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
        setUpcomingEvents(normalizeList(upcomingRes).map(normalizeVolunteerEvent));
        setCompletedEvents(normalizeList(completedRes).map(normalizeVolunteerEvent));
      } catch (err) {
        if (!cancelled) {
          setEventsError(err?.message || 'Unable to load volunteer events.');
          setUpcomingEvents([]);
          setCompletedEvents([]);
        }
      } finally {
        if (!cancelled) setEventsLoading(false);
      }
    };
    loadEvents();
    return () => {
      cancelled = true;
    };
  }, []);

  const upcomingYearOptions = useMemo(() => {
    const values = upcomingEvents
      .map((event) => String(event?.date || '').slice(0, 4))
      .filter((value) => /^\d{4}$/.test(value));
    if (!values.length) return [String(new Date().getFullYear())];
    const set = new Set(values);
    return Array.from(set).sort((a, b) => Number(a) - Number(b));
  }, [upcomingEvents]);

  const completedYearOptions = useMemo(() => {
    const values = completedEvents
      .map((event) => getCompletedEventDate(event).slice(0, 4))
      .filter((value) => /^\d{4}$/.test(value));
    if (!values.length) return [String(new Date().getFullYear())];
    const set = new Set(values);
    return Array.from(set).sort((a, b) => Number(a) - Number(b));
  }, [completedEvents]);

  useEffect(() => {
    if (!upcomingYearOptions.length) return;
    if (!upcomingYearOptions.includes(upcomingSelectedYear)) {
      setUpcomingSelectedYear(upcomingYearOptions[upcomingYearOptions.length - 1]);
    }
  }, [upcomingSelectedYear, upcomingYearOptions]);

  useEffect(() => {
    if (!completedYearOptions.length) return;
    if (!completedYearOptions.includes(completedSelectedYear)) {
      setCompletedSelectedYear(completedYearOptions[completedYearOptions.length - 1]);
    }
  }, [completedSelectedYear, completedYearOptions]);

  const upcomingCalendarDays = useMemo(() => {
    const first = new Date(upcomingCalendarCursor.getFullYear(), upcomingCalendarCursor.getMonth(), 1);
    const firstWeekday = first.getDay();
    const start = new Date(first);
    start.setDate(first.getDate() - firstWeekday);
    return Array.from({ length: 42 }).map((_, index) => {
      const day = new Date(start);
      day.setDate(start.getDate() + index);
      return day;
    });
  }, [upcomingCalendarCursor]);

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

  const matchesUpcomingRange = (dateValue) => {
    const normalized = String(dateValue || '');
    if (!normalized) return false;

    if (upcomingRange === 'day') return normalized === upcomingSelectedDay;
    if (upcomingRange === 'week') {
      const start = new Date(`${upcomingSelectedDay}T00:00:00`);
      const eventDate = new Date(`${normalized}T00:00:00`);
      if (Number.isNaN(start.getTime()) || Number.isNaN(eventDate.getTime())) return false;
      const diffDays = Math.floor((eventDate.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
      return diffDays >= 0 && diffDays <= 7;
    }
    if (upcomingRange === 'month') return normalized.slice(0, 7) === upcomingSelectedMonth;
    if (upcomingRange === 'year') return normalized.slice(0, 4) === upcomingSelectedYear;
    return true;
  };

  const matchesCompletedRange = (dateValue) => {
    const normalized = String(dateValue || '');
    if (!normalized) return false;

    if (completedRange === 'day') return normalized === completedSelectedDay;
    if (completedRange === 'week') {
      const start = new Date(`${completedSelectedDay}T00:00:00`);
      const eventDate = new Date(`${normalized}T00:00:00`);
      if (Number.isNaN(start.getTime()) || Number.isNaN(eventDate.getTime())) return false;
      const diffDays = Math.floor((eventDate.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
      return diffDays >= 0 && diffDays <= 7;
    }
    if (completedRange === 'month') return normalized.slice(0, 7) === completedSelectedMonth;
    if (completedRange === 'year') return normalized.slice(0, 4) === completedSelectedYear;
    return true;
  };

  const filteredUpcoming = useMemo(
    () => upcomingEvents.filter((event) => matchesUpcomingRange(event.date)),
    [upcomingEvents, upcomingRange, upcomingSelectedDay, upcomingSelectedMonth, upcomingSelectedYear]
  );

  const filteredCompleted = useMemo(
    () => completedEvents.filter((event) => matchesCompletedRange(getCompletedEventDate(event))),
    [completedEvents, completedRange, completedSelectedDay, completedSelectedMonth, completedSelectedYear]
  );

  useEffect(() => {
    setUpcomingPage(1);
  }, [upcomingRange, upcomingSelectedDay, upcomingSelectedMonth, upcomingSelectedYear]);

  useEffect(() => {
    setCompletedPage(1);
  }, [completedRange, completedSelectedDay, completedSelectedMonth, completedSelectedYear]);

  const upcomingTotalPages = Math.max(1, Math.ceil(filteredUpcoming.length / EVENTS_PER_PAGE));
  const completedTotalPages = Math.max(1, Math.ceil(filteredCompleted.length / EVENTS_PER_PAGE));

  useEffect(() => {
    if (upcomingPage > upcomingTotalPages) setUpcomingPage(upcomingTotalPages);
  }, [upcomingPage, upcomingTotalPages]);

  useEffect(() => {
    if (completedPage > completedTotalPages) setCompletedPage(completedTotalPages);
  }, [completedPage, completedTotalPages]);

  const paginatedUpcoming = useMemo(() => {
    const start = (upcomingPage - 1) * EVENTS_PER_PAGE;
    return filteredUpcoming.slice(start, start + EVENTS_PER_PAGE);
  }, [filteredUpcoming, upcomingPage]);

  const paginatedCompleted = useMemo(() => {
    const start = (completedPage - 1) * EVENTS_PER_PAGE;
    return filteredCompleted.slice(start, start + EVENTS_PER_PAGE);
  }, [completedPage, filteredCompleted]);

  const upcomingSelectedDayLabel = useMemo(() => formatDate(upcomingSelectedDay), [upcomingSelectedDay]);
  const upcomingSelectedMonthLabel = useMemo(() => {
    const parsed = parseIsoDate(`${upcomingSelectedMonth}-01`);
    return parsed.toLocaleDateString([], { month: 'long', year: 'numeric' });
  }, [upcomingSelectedMonth]);
  const completedSelectedDayLabel = useMemo(() => formatDate(completedSelectedDay), [completedSelectedDay]);
  const completedSelectedMonthLabel = useMemo(() => {
    const parsed = parseIsoDate(`${completedSelectedMonth}-01`);
    return parsed.toLocaleDateString([], { month: 'long', year: 'numeric' });
  }, [completedSelectedMonth]);

  const toggleUpcomingCalendar = () => {
    setUpcomingCalendarOpen((prev) => !prev);
    if (!upcomingCalendarOpen) {
      if (upcomingRange === 'month') {
        setUpcomingMonthPickerYear(Number(upcomingSelectedMonth.slice(0, 4)) || new Date().getFullYear());
      } else if (upcomingRange === 'day' || upcomingRange === 'week') {
        setUpcomingCalendarCursor(parseIsoDate(upcomingSelectedDay));
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
      <header className="theme-v-header fixed top-0 inset-x-0 z-50">
        <div className="mx-auto flex h-[60px] w-full max-w-[1920px] items-center justify-between px-4 sm:px-6 lg:px-10 xl:px-12 2xl:px-16 min-[2200px]:h-[84px] min-[2200px]:px-16 min-[2500px]:px-20">
          <Link to="/" className="flex flex-col items-center leading-none group">
            <img src={logo} alt="Bond Room" className="theme-v-logo h-10 w-auto object-contain transition-transform group-hover:scale-105 2xl:h-12 min-[2200px]:h-14" />
            <span className="theme-v-tagline mt-0.5 block max-w-[120px] truncate text-[8px] tracking-wide sm:max-w-none sm:text-[9px] 2xl:text-[11px] min-[2200px]:text-[13px]">
              Bridging Old and New Destinies
            </span>
          </Link>

          <nav className="hidden items-center gap-0.5 md:flex 2xl:gap-1.5 min-[2200px]:gap-2">
            {NAV.map((n) => (
              n.href.includes('#') ? (
                <a
                  key={n.label}
                  href={n.href}
                  className="theme-v-nav-link rounded-lg px-3 py-1.5 text-[13px] font-medium 2xl:px-4 2xl:py-2 2xl:text-[15px] min-[2200px]:px-5 min-[2200px]:py-2.5 min-[2200px]:text-[17px]"
                >
                  {n.label}
                </a>
              ) : (
                <Link
                  key={n.label}
                  to={n.href}
                  className="theme-v-nav-link rounded-lg px-3 py-1.5 text-[13px] font-medium 2xl:px-4 2xl:py-2 2xl:text-[15px] min-[2200px]:px-5 min-[2200px]:py-2.5 min-[2200px]:text-[17px]"
                >
                  {n.label}
                </Link>
              )
            ))}
          </nav>

          <div className="hidden items-center gap-2 md:flex 2xl:gap-3 min-[2200px]:gap-4">
            <Link to="/donate" className="theme-v-cta rounded-lg px-3.5 py-1.5 text-[13px] font-semibold transition-all hover:scale-105 2xl:px-4.5 2xl:py-2 2xl:text-[15px] min-[2200px]:px-5 min-[2200px]:py-2.5 min-[2200px]:text-[17px]">
              Donate
            </Link>
            <Link to="/login" className="theme-v-cta rounded-lg px-4 py-1.5 text-[13px] font-semibold shadow-md shadow-[#2D1A4F]/30 transition-all hover:scale-105 2xl:px-5 2xl:py-2 2xl:text-[15px] min-[2200px]:px-6 min-[2200px]:py-2.5 min-[2200px]:text-[17px]">
              Log in
            </Link>
          </div>

          <button onClick={() => setMobileOpen(true)} className="flex h-9 w-9 items-center justify-center rounded-lg transition hover:bg-white/10 md:hidden">
            <svg className="theme-v-menu-icon h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
      </header>

      {mobileOpen ? (
        <div className="fixed inset-0 z-[100] flex">
          <div className="absolute inset-0 bg-[#4A2B7A]/40 backdrop-blur-sm" onClick={closeMobile} />
          <div className="relative ml-auto flex h-full w-[270px] max-w-[82vw] flex-col bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#EDE3FF] px-4 pb-2 pt-4">
              <span className="text-sm font-bold text-[#5D3699]">Menu</span>
              <button onClick={closeMobile} className="flex h-8 w-8 items-center justify-center rounded-lg text-sm transition hover:bg-[#EDE3FF]">X</button>
            </div>
            <nav className="flex flex-1 flex-col gap-0.5 p-3">
              {NAV.map((n) => (
                n.href.includes('#') ? (
                  <a key={n.label} href={n.href} onClick={closeMobile} className="rounded-lg px-3 py-2.5 text-sm font-medium text-[#5F6B81] transition hover:bg-[#EDE3FF] hover:text-[#5D3699]">
                    {n.label}
                  </a>
                ) : (
                  <Link key={n.label} to={n.href} onClick={closeMobile} className="rounded-lg px-3 py-2.5 text-sm font-medium text-[#5F6B81] transition hover:bg-[#EDE3FF] hover:text-[#5D3699]">
                    {n.label}
                  </Link>
                )
              ))}
              <Link to="/donate" onClick={closeMobile} className="rounded-lg px-3 py-2.5 text-sm font-medium text-[#5D3699] transition hover:bg-[#EDE3FF]">
                Donate
              </Link>
              <Link to="/login" onClick={closeMobile} className="rounded-lg px-3 py-2.5 text-sm font-medium text-[#5F6B81] transition hover:bg-[#EDE3FF] hover:text-[#5D3699]">
                Log in
              </Link>
            </nav>
            <div className="border-t border-[#EDE3FF] p-3">
              <Link to="/register" onClick={closeMobile} className="block rounded-lg bg-[#fdd253] px-4 py-2.5 text-center text-sm font-bold text-[#1f2937] shadow-md shadow-[#fdd253]/30">
                Mentee Sign Up
              </Link>
            </div>
          </div>
        </div>
      ) : null}
      <motion.div
        className="theme-v-page relative min-h-screen overflow-hidden p-3 pt-[86px] sm:p-6 sm:pt-[90px] lg:p-8 lg:pt-[94px]"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
      <div className="theme-v-hero relative overflow-hidden rounded-[24px] p-4 ring-1 ring-[#FDD253]/20 sm:rounded-[28px] sm:p-8">
        <div className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-[#fdd253] opacity-50 blur-2xl" />
        <div className="pointer-events-none absolute -left-10 bottom-0 h-24 w-24 rounded-full bg-[#5D3699] opacity-25 blur-2xl" />
        <div className="pointer-events-none absolute -right-20 bottom-10 h-20 w-20 rounded-full bg-[#fdd253] opacity-40 blur-xl" />
        <div className="relative">
          <h1 className="theme-v-title text-2xl font-semibold leading-tight tracking-tight sm:text-4xl">
            Volunteer Events
            <br />
            <span className="theme-v-highlight">
              Explore Every Activity
            </span>
          </h1>
          <p className="theme-v-subtitle mt-3 max-w-2xl text-sm sm:text-base">
            Browse all upcoming and completed volunteer activities in one place.
          </p>
        </div>
      </div>

      <section className="mt-8">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#fdd253]/30 ring-1 ring-[#fdd253]">
              <Calendar className="h-5 w-5 text-[#c9a227]" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white">Upcoming Activities</h2>
              <p className="text-xs text-white/85">Join and participate with your community</p>
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
                    setUpcomingRange(item.key);
                    setUpcomingCalendarOpen(false);
                  }}
                  className={`whitespace-nowrap rounded-full px-3 py-1.5 text-[11px] font-semibold transition-all ${
                    upcomingRange === item.key
                      ? 'bg-[#fdd253] text-[#1f2937] shadow-sm shadow-[#fdd253]/40'
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
                onClick={toggleUpcomingCalendar}
                className="inline-flex max-w-full items-center gap-2 rounded-full border border-[#e8dcff] bg-white px-3 py-2 text-xs font-medium text-[#5D3699] transition-colors hover:bg-[#f8f4ff]"
              >
                <CalendarDays className="h-3.5 w-3.5" />
                <span className="max-w-[130px] truncate sm:max-w-none">
                  {upcomingRange === 'day' || upcomingRange === 'week'
                    ? upcomingSelectedDayLabel
                    : upcomingRange === 'month'
                      ? upcomingSelectedMonthLabel
                      : upcomingSelectedYear}
                </span>
                <ChevronRight className={`h-3.5 w-3.5 transition-transform ${upcomingCalendarOpen ? 'rotate-90' : ''}`} />
              </button>

              {upcomingCalendarOpen && (
                <div className="absolute right-0 z-30 mt-2 w-[min(92vw,320px)] rounded-2xl border border-[#e8dcff] bg-white p-3 shadow-[0_20px_45px_-26px_rgba(93,54,153,0.65)] sm:w-[320px]">
                  {(upcomingRange === 'day' || upcomingRange === 'week') && (
                    <>
                      <div className="mb-2 flex items-center justify-between">
                        <button
                          type="button"
                          onClick={() => setUpcomingCalendarCursor((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))}
                          className="rounded-lg p-1 text-[#5D3699] hover:bg-[#f5f3ff]"
                          aria-label="Previous month"
                        >
                          <ChevronRight className="h-4 w-4 rotate-180" />
                        </button>
                        <p className="text-sm font-semibold text-[#312049]">
                          {upcomingCalendarCursor.toLocaleDateString([], { month: 'long', year: 'numeric' })}
                        </p>
                        <button
                          type="button"
                          onClick={() => setUpcomingCalendarCursor((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))}
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
                        {upcomingCalendarDays.map((day) => {
                          const iso = toIsoDate(day);
                          const inCurrentMonth = day.getMonth() === upcomingCalendarCursor.getMonth();
                          const selected = iso === upcomingSelectedDay;
                          return (
                            <button
                              key={iso}
                              type="button"
                              onClick={() => {
                                setUpcomingSelectedDay(iso);
                                setUpcomingCalendarOpen(false);
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

                  {upcomingRange === 'month' && (
                    <>
                      <div className="mb-2 flex items-center justify-between">
                        <button
                          type="button"
                          onClick={() => setUpcomingMonthPickerYear((prev) => prev - 1)}
                          className="rounded-lg p-1 text-[#5D3699] hover:bg-[#f5f3ff]"
                          aria-label="Previous year"
                        >
                          <ChevronRight className="h-4 w-4 rotate-180" />
                        </button>
                        <p className="text-sm font-semibold text-[#312049]">{upcomingMonthPickerYear}</p>
                        <button
                          type="button"
                          onClick={() => setUpcomingMonthPickerYear((prev) => prev + 1)}
                          className="rounded-lg p-1 text-[#5D3699] hover:bg-[#f5f3ff]"
                          aria-label="Next year"
                        >
                          <ChevronRight className="h-4 w-4" />
                        </button>
                      </div>

                      <div className="grid grid-cols-3 gap-2">
                        {Array.from({ length: 12 }).map((_, index) => {
                          const date = new Date(upcomingMonthPickerYear, index, 1);
                          const monthValue = toIsoMonth(date);
                          const selected = monthValue === upcomingSelectedMonth;
                          return (
                            <button
                              key={monthValue}
                              type="button"
                              onClick={() => {
                                setUpcomingSelectedMonth(monthValue);
                                setUpcomingCalendarOpen(false);
                              }}
                              className={`rounded-lg px-2 py-2 text-xs font-medium transition-colors ${
                                selected ? 'bg-[#5D3699] text-white' : 'text-[#312049] hover:bg-[#f5f3ff]'
                              }`}
                            >
                              {date.toLocaleDateString([], { month: 'short' })}
                            </button>
                          );
                        })}
                      </div>
                    </>
                  )}

                  {upcomingRange === 'year' && (
                    <div className="grid grid-cols-3 gap-2">
                      {upcomingYearOptions.map((year) => {
                        const selected = year === upcomingSelectedYear;
                        return (
                          <button
                            key={year}
                            type="button"
                            onClick={() => {
                              setUpcomingSelectedYear(year);
                              setUpcomingCalendarOpen(false);
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
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {paginatedUpcoming.map((event) => (
            <article
              key={event.id}
              className="group overflow-hidden rounded-2xl border border-[#e9ddff] bg-white shadow-[0_24px_44px_-34px_rgba(93,54,153,0.7)] transition-transform duration-200 hover:-translate-y-1"
            >
              <div className="volunteer-events-card-media relative h-44 overflow-hidden">
                <img
                  src={event.image}
                  alt={event.title}
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#120a2c]/75 via-[#120a2c]/30 to-transparent" />
                <div className="absolute bottom-3 left-3 right-3">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-[#d8cff1]">{event.stream}</p>
                  <h3 className="mt-1 line-clamp-2 text-sm font-semibold text-white">{event.title}</h3>
                </div>
              </div>

              <div className="space-y-3 p-4">
                <p className="line-clamp-2 text-xs leading-5 text-[#6b7280]">{event.description}</p>
                <div className="space-y-1.5 text-[11px] text-[#5f6472]">
                  <p className="inline-flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5 text-[#5D3699]" />{formatDate(event.date)}</p>
                  <p className="inline-flex items-center gap-1.5"><Clock className="h-3.5 w-3.5 text-[#5D3699]" />{event.time}</p>
                  <p className="inline-flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5 text-[#5D3699]" />{event.location}</p>
                  <p className="inline-flex items-center gap-1.5"><Users className="h-3.5 w-3.5 text-[#5D3699]" />{event.seats} seats</p>
                </div>
                <Link
                  to={`/volunteer-events/${event.id}/register`}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#fdd253] px-4 py-2.5 text-sm font-semibold text-[#1f2937] transition-all hover:-translate-y-0.5 hover:bg-[#f59e0b] hover:text-white shadow-[#fdd253]/30"
                >
                  Open Registration
                  <ArrowUpRight className="h-4 w-4" />
                </Link>
              </div>
            </article>
          ))}
        </div>
        {filteredUpcoming.length === 0 && (
          <div className="rounded-xl border border-[#e5e7eb] border-dashed bg-white p-8 text-center">
            <p className="text-sm text-[#6b7280]">
              {eventsLoading ? 'Loading upcoming events...' : 'No upcoming events found for this filter.'}
            </p>
          </div>
        )}
        {filteredUpcoming.length > 0 && upcomingTotalPages > 1 && (
          <div className="mt-4 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setUpcomingPage((prev) => Math.max(1, prev - 1))}
              disabled={upcomingPage === 1}
              className="rounded-lg border border-[#e8dcff] bg-white px-3 py-1.5 text-xs font-medium text-[#5D3699] disabled:cursor-not-allowed disabled:opacity-50"
            >
              Prev
            </button>
            <span className="text-xs font-medium text-[#6b7280]">
              Page {upcomingPage} of {upcomingTotalPages}
            </span>
            <button
              type="button"
              onClick={() => setUpcomingPage((prev) => Math.min(upcomingTotalPages, prev + 1))}
              disabled={upcomingPage === upcomingTotalPages}
              className="rounded-lg border border-[#e8dcff] bg-white px-3 py-1.5 text-xs font-medium text-[#5D3699] disabled:cursor-not-allowed disabled:opacity-50"
            >
              Next
            </button>
          </div>
        )}
      </section>

      <section className="mt-10">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#fdd253]/30 ring-1 ring-[#fdd253]">
              <CheckCircle2 className="h-5 w-5 text-[#c9a227]" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white">Completed Activities</h2>
              <p className="text-xs text-white/85">Finished events and impact highlights</p>
            </div>
          </div>

          <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto sm:justify-end">
              <div className="inline-flex max-w-full items-center gap-1 overflow-x-auto rounded-full border border-[#fdd253]/40 bg-white p-1">
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
                      ? 'bg-[#fdd253] text-[#1f2937] shadow-sm shadow-[#fdd253]/40'
                      : 'text-[#c9a227] hover:bg-[#fdd253]/20'
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
                  className="inline-flex max-w-full items-center gap-2 rounded-full border border-[#fdd253]/40 bg-white px-3 py-2 text-xs font-medium text-[#c9a227] transition-colors hover:bg-[#fdd253]/20"
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
                <div className="absolute right-0 z-30 mt-2 w-[min(92vw,320px)] rounded-2xl border border-[#fdd253]/40 bg-white p-3 shadow-[0_20px_45px_-26px_rgba(253,210,83,0.5)] sm:w-[320px]">
                  {(completedRange === 'day' || completedRange === 'week') && (
                    <>
                      <div className="mb-2 flex items-center justify-between">
                        <button
                          type="button"
                          onClick={() => setCompletedCalendarCursor((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))}
                          className="rounded-lg p-1 text-[#c9a227] hover:bg-[#fdd253]/20"
                          aria-label="Previous month"
                        >
                          <ChevronRight className="h-4 w-4 rotate-180" />
                        </button>
                        <p className="text-sm font-semibold text-[#1f2937]">
                          {completedCalendarCursor.toLocaleDateString([], { month: 'long', year: 'numeric' })}
                        </p>
                        <button
                          type="button"
                          onClick={() => setCompletedCalendarCursor((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))}
                          className="rounded-lg p-1 text-[#c9a227] hover:bg-[#fdd253]/20"
                          aria-label="Next month"
                        >
                          <ChevronRight className="h-4 w-4" />
                        </button>
                      </div>

                      <div className="grid grid-cols-7 gap-1">
                        {calendarWeekLabels.map((label) => (
                          <span key={label} className="text-center text-[10px] font-semibold text-[#c9a227]">
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
                                  ? 'bg-[#fdd253] text-[#1f2937]'
                                  : inCurrentMonth
                                    ? 'text-[#1f2937] hover:bg-[#fdd253]/20'
                                    : 'text-[#c9a227] opacity-50 hover:bg-[#fdd253]/10'
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
                          className="rounded-lg p-1 text-[#c9a227] hover:bg-[#fdd253]/20"
                          aria-label="Previous year"
                        >
                          <ChevronRight className="h-4 w-4 rotate-180" />
                        </button>
                        <p className="text-sm font-semibold text-[#1f2937]">{completedMonthPickerYear}</p>
                        <button
                          type="button"
                          onClick={() => setCompletedMonthPickerYear((prev) => prev + 1)}
                          className="rounded-lg p-1 text-[#c9a227] hover:bg-[#fdd253]/20"
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
                                  ? 'bg-[#fdd253] text-[#1f2937]'
                                  : 'text-[#1f2937] hover:bg-[#fdd253]/20'
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
                              selected ? 'bg-[#fdd253] text-[#1f2937]' : 'text-[#1f2937] hover:bg-[#fdd253]/20'
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

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {paginatedCompleted.map((event) => (
            <button
              key={event.id}
              type="button"
              onClick={() => navigate(`/volunteer/completed/${event.id}`)}
              className="group overflow-hidden rounded-2xl border border-[#e9ddff] bg-white text-left shadow-[0_24px_44px_-34px_rgba(93,54,153,0.7)] transition-transform duration-200 hover:-translate-y-1"
            >
              <div className="volunteer-events-card-media relative h-44 overflow-hidden">
                {event.image ? (
                  <img src={event.image} alt={event.title} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                ) : (
                  <div className="flex h-full items-center justify-center bg-[#f5f3ff] text-xs font-semibold text-[#6b7280]">
                    No image available
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-[#120a2c]/75 via-[#120a2c]/30 to-transparent" />
                    <div className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-[#fdd253] px-2.5 py-1 text-[10px] font-semibold text-[#1f2937] ring-1 ring-[#fdd253]">
                      <CheckCircle2 className="h-3 w-3" />
                      Completed
                    </div>
                <div className="absolute bottom-3 left-3 right-3">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-[#d8cff1]">{event.stream}</p>
                  <h3 className="mt-1 line-clamp-2 text-sm font-semibold text-white">{event.title}</h3>
                </div>
              </div>
              <div className="space-y-3 p-4">
                <p className="line-clamp-2 text-xs leading-5 text-[#6b7280]">{event.summary || event.description || 'Completed event details available.'}</p>
                <p className="inline-flex items-center gap-1 rounded-full bg-[#f5f3ff] px-2.5 py-1 text-[10px] font-medium text-[#5D3699]">
                  <Calendar className="h-3 w-3" />
                  {formatDate(getCompletedEventDate(event))}
                </p>
                <div className="rounded-xl border border-[#fdd253]/40 bg-[#fdd253]/10 p-3">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-[#c9a227]">Impact</p>
                  <p className="mt-1 text-xs font-medium text-[#1f2937]">{event.impact}</p>
                  <p className="mt-1 text-[11px] text-[#c9a227]">{event.location}</p>
                </div>
                <p className="inline-flex items-center gap-1 text-[11px] font-medium text-[#c9a227]">
                  <Users className="h-3.5 w-3.5" />
                  {Number(event.joined_count || event.seats || 0)} joined
                </p>
              </div>
            </button>
          ))}
        </div>
        {filteredCompleted.length === 0 && (
          <div className="rounded-xl border border-[#e5e7eb] border-dashed bg-white p-8 text-center">
            <p className="text-sm text-[#6b7280]">
              {eventsLoading ? 'Loading completed events...' : 'No completed events found for this filter.'}
            </p>
          </div>
        )}
        {filteredCompleted.length > 0 && completedTotalPages > 1 && (
          <div className="mt-4 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setCompletedPage((prev) => Math.max(1, prev - 1))}
              disabled={completedPage === 1}
              className="rounded-lg border border-[#e8dcff] bg-white px-3 py-1.5 text-xs font-medium text-[#5D3699] disabled:cursor-not-allowed disabled:opacity-50"
            >
              Prev
            </button>
            <span className="text-xs font-medium text-[#6b7280]">
              Page {completedPage} of {completedTotalPages}
            </span>
            <button
              type="button"
              onClick={() => setCompletedPage((prev) => Math.min(completedTotalPages, prev + 1))}
              disabled={completedPage === completedTotalPages}
              className="rounded-lg border border-[#e8dcff] bg-white px-3 py-1.5 text-xs font-medium text-[#5D3699] disabled:cursor-not-allowed disabled:opacity-50"
            >
              Next
            </button>
          </div>
        )}
      </section>
      {eventsError && (
        <div className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          {eventsError}
        </div>
      )}
      </motion.div>
      <VolunteerBottomAuth />
    </>
  );
};

export default VolunteerEvents;
