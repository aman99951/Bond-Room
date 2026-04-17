import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowUpRight,
  Calendar,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  MapPin,
  Search,
  Users,
} from 'lucide-react';
import { menteeApi } from '../../../apis/api/menteeApi';

const PAGE_SIZE = 6;

const normalizeList = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.results)) return payload.results;
  return [];
};

const getTotalCount = (payload, fallbackLength = 0) => {
  if (typeof payload?.count === 'number') return payload.count;
  if (Array.isArray(payload)) return payload.length;
  return fallbackLength;
};

const getPageFromUrl = (urlValue) => {
  const raw = String(urlValue || '').trim();
  if (!raw) return null;
  try {
    const parsed = new URL(raw, window.location.origin);
    const pageValue = Number(parsed.searchParams.get('page') || '');
    return Number.isFinite(pageValue) && pageValue > 0 ? pageValue : null;
  } catch {
    return null;
  }
};

const formatDate = (value) => {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
};

const formatDateTime = (value) => {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleString([], {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
};

const getRegistrationEventId = (registration) => {
  const eventRef = registration?.volunteer_event;
  if (eventRef && typeof eventRef === 'object') {
    if (eventRef.id !== undefined && eventRef.id !== null) return String(eventRef.id);
    return '';
  }
  if (eventRef === undefined || eventRef === null || eventRef === '') return '';
  return String(eventRef);
};

const getEventForRegistration = (registration, eventById) => {
  const eventId = getRegistrationEventId(registration);
  if (!eventId) return null;
  return eventById.get(eventId) || null;
};

const normalizeStatus = (value) => {
  const status = String(value || '').trim().toLowerCase();
  if (status === 'upcoming' || status === 'completed') return status;
  return '';
};

const deriveStatusFromDate = (value) => {
  if (!value) return '';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return '';
  const now = new Date();
  return parsed.getTime() < now.getTime() ? 'completed' : 'upcoming';
};

const getEventStatus = (registration, eventById) => {
  const event = getEventForRegistration(registration, eventById);
  const inferred =
    deriveStatusFromDate(registration?.volunteer_event_date) ||
    deriveStatusFromDate(event?.date);
  if (inferred) return inferred;

  const directStatus =
    normalizeStatus(registration?.status) ||
    normalizeStatus(registration?.volunteer_event_status) ||
    normalizeStatus(event?.status);
  if (directStatus) return directStatus;

  return 'upcoming';
};

const RegisteredEvents = () => {
  const navigate = useNavigate();
  const [registrations, setRegistrations] = useState([]);
  const [eventById, setEventById] = useState(() => new Map());
  const [availableEvents, setAvailableEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [registrationsPage, setRegistrationsPage] = useState(1);
  const [availablePage, setAvailablePage] = useState(1);
  const [registrationsCount, setRegistrationsCount] = useState(0);
  const [availableCount, setAvailableCount] = useState(0);
  const [registrationsNextPage, setRegistrationsNextPage] = useState(null);
  const [registrationsPrevPage, setRegistrationsPrevPage] = useState(null);
  const [availableNextPage, setAvailableNextPage] = useState(null);
  const [availablePrevPage, setAvailablePrevPage] = useState(null);
  const [stats, setStats] = useState({ total: 0, upcoming: 0, completed: 0 });

  useEffect(() => {
    setRegistrationsPage(1);
    setAvailablePage(1);
  }, [query, statusFilter]);

  useEffect(() => {
    let cancelled = false;

    const loadData = async () => {
      setLoading(true);
      setError('');
      try {
        const registrationParams = {
          page: registrationsPage,
          page_size: PAGE_SIZE,
          search: query.trim() || undefined,
          status: statusFilter === 'all' ? undefined : statusFilter,
        };
        const [registrationsRes, eventsRes, totalRes, upcomingRes, completedRes] = await Promise.all([
          menteeApi.listVolunteerEventRegistrations(registrationParams),
          menteeApi.listVolunteerEvents({ page_size: 200 }),
          menteeApi.listVolunteerEventRegistrations({ page: 1, page_size: 1 }),
          menteeApi.listVolunteerEventRegistrations({ page: 1, page_size: 1, status: 'upcoming' }),
          menteeApi.listVolunteerEventRegistrations({ page: 1, page_size: 1, status: 'completed' }),
        ]);

        if (cancelled) return;

        const regItems = normalizeList(registrationsRes);
        const totalRegistrations = getTotalCount(registrationsRes, regItems.length);
        const events = normalizeList(eventsRes);
        const lookup = new Map(
          events
            .filter((item) => item?.id !== undefined && item?.id !== null)
            .map((item) => [String(item.id), item]),
        );

        setRegistrations(regItems);
        setRegistrationsCount(totalRegistrations);
        setEventById(lookup);
        setRegistrationsNextPage(getPageFromUrl(registrationsRes?.next));
        setRegistrationsPrevPage(getPageFromUrl(registrationsRes?.previous));
        setStats({
          total: getTotalCount(totalRes, 0),
          upcoming: getTotalCount(upcomingRes, 0),
          completed: getTotalCount(completedRes, 0),
        });

        if (!totalRegistrations) {
          const availableRes = await menteeApi.listPublicVolunteerEvents({
            status: 'upcoming',
            page: availablePage,
            page_size: PAGE_SIZE,
          });
          if (cancelled) return;
          const availableItems = normalizeList(availableRes);
          setAvailableEvents(availableItems);
          setAvailableCount(getTotalCount(availableRes, availableItems.length));
          setAvailableNextPage(getPageFromUrl(availableRes?.next));
          setAvailablePrevPage(getPageFromUrl(availableRes?.previous));
        } else {
          setAvailableEvents([]);
          setAvailableCount(0);
          setAvailableNextPage(null);
          setAvailablePrevPage(null);
        }
      } catch (err) {
        if (!cancelled) {
          setRegistrations([]);
          setRegistrationsCount(0);
          setEventById(new Map());
          setAvailableEvents([]);
          setAvailableCount(0);
          setError(err?.message || 'Unable to load registered events right now.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadData();
    return () => {
      cancelled = true;
    };
  }, [availablePage, query, registrationsPage, statusFilter]);

  const registrationsTotalPages = useMemo(
    () => Math.max(1, Math.ceil(registrationsCount / PAGE_SIZE)),
    [registrationsCount],
  );
  const availableTotalPages = useMemo(
    () => Math.max(1, Math.ceil(availableCount / PAGE_SIZE)),
    [availableCount],
  );

  const showRegistrations = registrationsCount > 0;
  const hasNoFilteredRegistrations = showRegistrations && !loading && registrations.length === 0;
  const hasNoAvailableEvents = !showRegistrations && !loading && availableEvents.length === 0;

  return (
    <>
      <motion.div
        className="relative overflow-hidden bg-transparent p-3 pt-3 sm:p-6 sm:pt-6 lg:p-8 lg:pt-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
      >
      <div className="relative overflow-hidden rounded-[24px] border border-[color:var(--theme-v-hero-border)] bg-[linear-gradient(135deg,var(--theme-v-bg-start)_0%,var(--theme-v-bg-mid)_50%,var(--theme-v-bg-end)_100%)] p-4 shadow-[0_28px_60px_-46px_rgba(22,10,46,0.72)] ring-1 ring-[color:var(--theme-v-hero-border)] sm:rounded-[28px] sm:p-8">
        <div className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-[color:var(--theme-v-nav-hover-bg)] blur-2xl" />
        <div className="pointer-events-none absolute -left-10 bottom-0 h-24 w-24 rounded-full bg-[color:var(--theme-v-header-bg)] blur-2xl" />
        <div className="relative">
          <h1 className="text-2xl font-semibold leading-tight tracking-tight text-[color:var(--theme-v-text-primary)] sm:text-4xl">
            Registered Events
            <br />
            <span className="bg-gradient-to-r from-[color:var(--theme-v-accent)] via-[color:var(--theme-v-highlight-mid)] to-[color:var(--theme-v-accent)] bg-clip-text text-transparent">
              Your Participation Timeline
            </span>
          </h1>
          <p className="mt-3 max-w-2xl text-sm text-[color:var(--theme-v-text-secondary)] sm:text-base">
            Track every volunteer event you registered for, including date, status, and registration details.
          </p>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-[color:var(--theme-v-hero-border)] bg-[color:var(--theme-v-nav-hover-bg)] p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-[color:var(--theme-v-text-secondary)]">Total</p>
          <p className="mt-1 text-2xl font-semibold text-[color:var(--theme-v-text-primary)]">{stats.total}</p>
        </div>
        <div className="rounded-2xl border border-[color:var(--theme-v-hero-border)] bg-[color:var(--theme-v-nav-hover-bg)] p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-[color:var(--theme-v-text-secondary)]">Upcoming</p>
          <p className="mt-1 text-2xl font-semibold text-[color:var(--theme-v-accent)]">{stats.upcoming}</p>
        </div>
        <div className="rounded-2xl border border-[#d9f9e6] bg-[color:var(--theme-v-nav-hover-bg)] p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-[#1f7a4a]">Completed</p>
          <p className="mt-1 text-2xl font-semibold text-[#15803d]">{stats.completed}</p>
        </div>
      </div>

      <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="inline-flex w-full items-center gap-2 rounded-xl border border-[color:var(--theme-v-hero-border)] bg-[color:var(--theme-v-nav-hover-bg)] px-3 py-2 sm:max-w-sm">
          <Search className="h-4 w-4 text-[color:var(--theme-v-text-secondary)]" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search registered events..."
            className="w-full border-0 bg-transparent text-sm text-[color:var(--theme-v-text-primary)] outline-none placeholder:text-[color:var(--theme-v-text-secondary)]"
          />
        </div>
        <div className="inline-flex w-full items-center gap-1 overflow-x-auto rounded-full border border-[color:var(--theme-v-hero-border)] bg-[color:var(--theme-v-nav-hover-bg)] p-1 sm:w-auto">
          {[
            { key: 'all', label: 'All' },
            { key: 'upcoming', label: 'Upcoming' },
            { key: 'completed', label: 'Completed' },
          ].map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() => setStatusFilter(item.key)}
              className={`whitespace-nowrap rounded-full px-3 py-1.5 text-[11px] font-semibold transition-all ${
                statusFilter === item.key
                  ? 'bg-[color:var(--theme-v-accent)] text-[color:var(--theme-v-accent-text)] shadow-sm'
                  : 'text-[color:var(--theme-v-accent)] hover:bg-[color:var(--theme-v-header-bg)]'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      <section className="mt-6">
        {showRegistrations ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {registrations.map((item) => {
              const event = getEventForRegistration(item, eventById);
              const status = getEventStatus(item, eventById);
              const isCompleted = status === 'completed';
              const statusStyles =
                isCompleted
                  ? 'bg-[#f0fdf4] text-[#166534] ring-[#bbf7d0]'
                  : 'bg-[#f5f3ff] text-[#5D3699] ring-[#ddd6fe]';

              return (
                <article
                  key={item.id}
                  className={`group overflow-hidden rounded-2xl border bg-white shadow-[0_24px_44px_-34px_rgba(93,54,153,0.7)] ${
                    isCompleted
                      ? 'cursor-pointer border-[#d4f2dd] transition-all hover:-translate-y-0.5 hover:shadow-[0_28px_48px_-34px_rgba(21,128,61,0.6)]'
                      : 'border-[color:var(--theme-v-hero-border)]'
                  }`}
                  onClick={isCompleted ? () => navigate(`/event-certificate/${item.id}`) : undefined}
                  role={isCompleted ? 'button' : undefined}
                  tabIndex={isCompleted ? 0 : undefined}
                  onKeyDown={
                    isCompleted
                      ? (eventItem) => {
                          if (eventItem.key === 'Enter' || eventItem.key === ' ') {
                            eventItem.preventDefault();
                            navigate(`/event-certificate/${item.id}`);
                          }
                        }
                      : undefined
                  }
                >
                  <div className="relative h-44 overflow-hidden bg-[color:var(--theme-v-nav-hover-bg)]">
                    {event?.image ? (
                      <img
                        src={event.image}
                        alt={item?.volunteer_event_title || event?.title || 'Volunteer event'}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[color:var(--theme-v-header-bg)] to-[color:var(--theme-v-nav-hover-bg)] text-[color:var(--theme-v-text-secondary)]">
                        <Calendar className="h-6 w-6" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-[#120a2c]/75 via-[#120a2c]/30 to-transparent" />
                    <span className={`absolute right-3 top-3 inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1 ${statusStyles}`}>
                      <CheckCircle2 className="h-3 w-3" />
                      {status === 'completed' ? 'Completed' : 'Upcoming'}
                    </span>
                    <div className="absolute bottom-3 left-3 right-3">
                      <p className="text-[10px] font-semibold uppercase tracking-wide text-[color:var(--theme-v-text-secondary)]">
                        {event?.stream || 'Volunteer Event'}
                      </p>
                      <h2
                        className="mt-1 line-clamp-2 text-base font-semibold leading-5 text-white"
                        title={item?.volunteer_event_title || event?.title || `Event #${getRegistrationEventId(item) || '-'}`}
                      >
                        {item?.volunteer_event_title || event?.title || `Event #${getRegistrationEventId(item) || '-'}`}
                      </h2>
                    </div>
                  </div>

                  <div className="space-y-3 p-4">
                    <div className="grid grid-cols-1 gap-2 text-xs text-[color:var(--theme-v-text-secondary)] sm:grid-cols-2">
                      <div className="rounded-lg border border-[color:var(--theme-v-hero-border)] bg-[color:var(--theme-v-nav-hover-bg)] px-3 py-2">
                        <p className="inline-flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5 text-[color:var(--theme-v-accent)]" />{formatDate(item?.volunteer_event_date || event?.date)}</p>
                      </div>
                      <div className="rounded-lg border border-[color:var(--theme-v-hero-border)] bg-[color:var(--theme-v-nav-hover-bg)] px-3 py-2">
                        <p className="inline-flex items-center gap-1.5"><Clock className="h-3.5 w-3.5 text-[color:var(--theme-v-accent)]" />{item?.volunteer_event_time || event?.time || 'Time TBA'}</p>
                      </div>
                      <div className="rounded-lg border border-[color:var(--theme-v-hero-border)] bg-[color:var(--theme-v-nav-hover-bg)] px-3 py-2 sm:col-span-2">
                        <p className="inline-flex items-start gap-1.5">
                          <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[color:var(--theme-v-accent)]" />
                          <span>{event?.location || `${item?.city || '-'}, ${item?.state || '-'}`}</span>
                        </p>
                      </div>
                      <div className="rounded-lg border border-[color:var(--theme-v-hero-border)] bg-[color:var(--theme-v-nav-hover-bg)] px-3 py-2 sm:col-span-2">
                        <p className="inline-flex items-center gap-1.5"><Users className="h-3.5 w-3.5 text-[color:var(--theme-v-accent)]" />Team: {item?.team_name || 'Solo'}</p>
                      </div>
                    </div>

                    <div className="rounded-lg border border-[color:var(--theme-v-hero-border)] bg-[color:var(--theme-v-nav-hover-bg)] px-3 py-2">
                      <p className="text-[11px] text-[color:var(--theme-v-text-secondary)]">
                        Registered on <span className="font-semibold text-[color:var(--theme-v-accent)]">{formatDateTime(item?.created_at)}</span>
                      </p>
                    </div>

                    {isCompleted ? (
                      <p className="text-[11px] font-semibold text-[#15803d]">Click card to view certificate</p>
                    ) : null}
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="space-y-4">
              <div className="rounded-2xl border border-dashed border-[color:var(--theme-v-accent)] bg-[color:var(--theme-v-header-bg)] p-6 text-center ring-1 ring-[color:var(--theme-v-hero-border)]">
              <p className="text-sm font-semibold text-[color:var(--theme-v-highlight-mid)]">No registered events yet</p>
              <p className="mt-1 text-sm text-[color:var(--theme-v-text-primary)]">You can register for upcoming events below.</p>
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
              {availableEvents.map((event) => (
                <article
                  key={event.id}
                  className="group overflow-hidden rounded-2xl border border-[color:var(--theme-v-hero-border)] bg-[color:var(--theme-v-nav-hover-bg)] shadow-[0_24px_44px_-34px_rgba(22,10,46,0.65)] transition-transform duration-200 hover:-translate-y-1"
                >
                  <div className="relative h-48 overflow-hidden bg-[color:var(--theme-v-nav-hover-bg)] xl:h-56 2xl:h-64">
                    {event?.image ? (
                      <img
                        src={event.image}
                        alt={event?.title || 'Volunteer event'}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[color:var(--theme-v-header-bg)] to-[color:var(--theme-v-nav-hover-bg)] text-[color:var(--theme-v-text-secondary)]">
                        <Calendar className="h-6 w-6" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-[#120a2c]/70 via-[#120a2c]/28 to-transparent" />
                    <div className="absolute bottom-3 left-3 right-3">
                      <p className="text-[10px] font-semibold uppercase tracking-wide text-[color:var(--theme-v-text-secondary)]">{event?.stream || 'Volunteer Event'}</p>
                      <h3 className="mt-1 line-clamp-2 text-sm font-semibold text-white">{event?.title || 'Upcoming Event'}</h3>
                    </div>
                  </div>

                  <div className="space-y-3 p-4">
                    <p className="line-clamp-2 text-xs leading-5 text-[color:var(--theme-v-text-secondary)]">{event?.description || 'Join this volunteer activity and contribute to your community.'}</p>
                    <div className="space-y-1.5 text-[11px] text-[color:var(--theme-v-text-secondary)]">
                      <p className="inline-flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5 text-[color:var(--theme-v-accent)]" />{formatDate(event?.date)}</p>
                      <p className="inline-flex items-center gap-1.5"><Clock className="h-3.5 w-3.5 text-[color:var(--theme-v-accent)]" />{event?.time || '-'}</p>
                      <p className="inline-flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5 text-[color:var(--theme-v-accent)]" />{event?.location || '-'}</p>
                      <p className="inline-flex items-center gap-1.5"><Users className="h-3.5 w-3.5 text-[color:var(--theme-v-accent)]" />{event?.seats || 0} seats</p>
                    </div>
                    <Link
                      to={`/event-register/${event.id}`}
                      className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[color:var(--theme-v-accent)] px-4 py-2.5 text-sm font-semibold text-[color:var(--theme-v-accent-text)] transition-all hover:-translate-y-0.5 hover:bg-[color:var(--theme-v-accent-hover)]"
                    >
                      Register Now
                      <ArrowUpRight className="h-4 w-4" />
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          </div>
        )}

        {showRegistrations && !loading && (
          <div className="mt-5 flex items-center justify-center gap-2">
            <button
              type="button"
              disabled={!registrationsPrevPage}
              onClick={() => setRegistrationsPage((prev) => Math.max(1, prev - 1))}
              className="inline-flex items-center gap-1 rounded-xl border border-[color:var(--theme-v-hero-border)] bg-[color:var(--theme-v-nav-hover-bg)] px-3 py-2 text-xs font-semibold text-[color:var(--theme-v-accent)] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
              Prev
            </button>
            <span className="rounded-xl border border-[color:var(--theme-v-hero-border)] bg-[color:var(--theme-v-nav-hover-bg)] px-3 py-2 text-xs font-semibold text-[color:var(--theme-v-accent)]">
              Page {registrationsPage} of {registrationsTotalPages}
            </span>
            <button
              type="button"
              disabled={!registrationsNextPage}
              onClick={() => setRegistrationsPage((prev) => prev + 1)}
              className="inline-flex items-center gap-1 rounded-xl border border-[color:var(--theme-v-hero-border)] bg-[color:var(--theme-v-nav-hover-bg)] px-3 py-2 text-xs font-semibold text-[color:var(--theme-v-accent)] disabled:cursor-not-allowed disabled:opacity-50"
            >
              Next
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        )}

        {!showRegistrations && !loading && availableCount > 0 && (
          <div className="mt-5 flex items-center justify-center gap-2">
            <button
              type="button"
              disabled={!availablePrevPage}
              onClick={() => setAvailablePage((prev) => Math.max(1, prev - 1))}
              className="inline-flex items-center gap-1 rounded-xl border border-[color:var(--theme-v-hero-border)] bg-[color:var(--theme-v-nav-hover-bg)] px-3 py-2 text-xs font-semibold text-[color:var(--theme-v-accent)] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
              Prev
            </button>
            <span className="rounded-xl border border-[color:var(--theme-v-hero-border)] bg-[color:var(--theme-v-nav-hover-bg)] px-3 py-2 text-xs font-semibold text-[color:var(--theme-v-accent)]">
              Page {availablePage} of {availableTotalPages}
            </span>
            <button
              type="button"
              disabled={!availableNextPage}
              onClick={() => setAvailablePage((prev) => prev + 1)}
              className="inline-flex items-center gap-1 rounded-xl border border-[color:var(--theme-v-hero-border)] bg-[color:var(--theme-v-nav-hover-bg)] px-3 py-2 text-xs font-semibold text-[color:var(--theme-v-accent)] disabled:cursor-not-allowed disabled:opacity-50"
            >
              Next
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        )}

        {hasNoFilteredRegistrations && (
          <div className="rounded-2xl border border-dashed border-[color:var(--theme-v-hero-border)] bg-[color:var(--theme-v-nav-hover-bg)] p-8 text-center">
            <p className="text-sm text-[color:var(--theme-v-text-secondary)]">
              No registered events found for this filter.
            </p>
            <Link
              to="/volunteer-events"
              className="mt-3 inline-flex items-center rounded-xl bg-[color:var(--theme-v-accent)] px-4 py-2 text-xs font-semibold text-[color:var(--theme-v-accent-text)] hover:bg-[color:var(--theme-v-accent-hover)]"
            >
              Explore Volunteer Events
            </Link>
          </div>
        )}

        {hasNoAvailableEvents && (
          <div className="rounded-2xl border border-dashed border-[color:var(--theme-v-hero-border)] bg-[color:var(--theme-v-nav-hover-bg)] p-8 text-center">
            <p className="text-sm text-[color:var(--theme-v-text-secondary)]">
              No upcoming events available right now.
            </p>
            <Link
              to="/volunteer-events"
              className="mt-3 inline-flex items-center rounded-xl bg-[color:var(--theme-v-accent)] px-4 py-2 text-xs font-semibold text-[color:var(--theme-v-accent-text)] hover:bg-[color:var(--theme-v-accent-hover)]"
            >
              Explore Volunteer Events
            </Link>
          </div>
        )}

        {loading && (
          <div className="rounded-2xl border border-[color:var(--theme-v-hero-border)] bg-[color:var(--theme-v-nav-hover-bg)] p-8 text-center">
            <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-[color:var(--theme-v-hero-border)] border-t-[color:var(--theme-v-accent)]" />
            <p className="mt-3 text-sm text-[color:var(--theme-v-text-secondary)]">Loading your registered events...</p>
          </div>
        )}

        {error && (
          <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
            {error}
          </div>
        )}
      </section>
      </motion.div>
    </>
  );
};

export default RegisteredEvents;
