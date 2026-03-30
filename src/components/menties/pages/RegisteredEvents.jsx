import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Calendar,
  CheckCircle2,
  Clock,
  MapPin,
  Search,
  Users,
} from 'lucide-react';
import { menteeApi } from '../../../apis/api/menteeApi';

const normalizeList = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.results)) return payload.results;
  return [];
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

const getEventStatus = (registration, eventById) => {
  const event = eventById.get(registration?.volunteer_event);
  if (event?.status === 'upcoming') return 'upcoming';
  if (event?.status === 'completed') return 'completed';
  return 'unknown';
};

const RegisteredEvents = () => {
  const navigate = useNavigate();
  const [registrations, setRegistrations] = useState([]);
  const [eventById, setEventById] = useState(() => new Map());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    let cancelled = false;

    const loadData = async () => {
      setLoading(true);
      setError('');
      try {
        const [registrationsRes, eventsRes] = await Promise.all([
          menteeApi.listVolunteerEventRegistrations(),
          menteeApi.listVolunteerEvents(),
        ]);
        if (cancelled) return;

        const regItems = normalizeList(registrationsRes);
        const events = normalizeList(eventsRes);
        const lookup = new Map(events.map((item) => [item.id, item]));

        setRegistrations(regItems);
        setEventById(lookup);
      } catch (err) {
        if (!cancelled) {
          setRegistrations([]);
          setEventById(new Map());
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
  }, []);

  const filteredItems = useMemo(() => {
    const search = query.trim().toLowerCase();
    return registrations.filter((item) => {
      const status = getEventStatus(item, eventById);
      if (statusFilter !== 'all' && status !== statusFilter) return false;

      if (!search) return true;
      const event = eventById.get(item?.volunteer_event);
      const haystack = [
        item?.volunteer_event_title,
        event?.title,
        item?.team_name,
        item?.city,
        item?.state,
        item?.preferred_role,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return haystack.includes(search);
    });
  }, [eventById, query, registrations, statusFilter]);

  const stats = useMemo(() => {
    const total = registrations.length;
    const upcoming = registrations.filter((item) => getEventStatus(item, eventById) === 'upcoming').length;
    const completed = registrations.filter((item) => getEventStatus(item, eventById) === 'completed').length;
    return { total, upcoming, completed };
  }, [eventById, registrations]);

  return (
    <motion.div
      className="relative overflow-hidden bg-transparent p-3 sm:p-6 lg:p-8"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45 }}
    >
      <div className="mb-6">
        <button
          type="button"
          onClick={() => navigate('/volunteer-events')}
          className="inline-flex items-center gap-2 rounded-full border border-[#e7d8ff] bg-white px-4 py-2 text-xs font-semibold text-[#5D3699] hover:bg-[#f8f4ff]"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to Volunteer Events
        </button>
      </div>

      <div className="relative overflow-hidden rounded-[24px] border border-[#e8dcff] bg-[linear-gradient(135deg,#ffffff_0%,#fcfaff_45%,#f8f3ff_100%)] p-4 shadow-[0_28px_60px_-46px_rgba(93,54,153,0.65)] ring-1 ring-[#efe7ff] sm:rounded-[28px] sm:p-8">
        <div className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-[#efe6ff] blur-2xl" />
        <div className="pointer-events-none absolute -left-10 bottom-0 h-24 w-24 rounded-full bg-[#f4edff] blur-2xl" />
        <div className="relative">
          <h1 className="text-2xl font-semibold leading-tight tracking-tight text-[#111827] sm:text-4xl">
            Registered Events
            <br />
            <span className="bg-gradient-to-r from-[#5D3699] to-[#8c63cc] bg-clip-text text-transparent">
              Your Participation Timeline
            </span>
          </h1>
          <p className="mt-3 max-w-2xl text-sm text-[#6b7280] sm:text-base">
            Track every volunteer event you registered for, including date, status, and registration details.
          </p>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-[#e8dcff] bg-white p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-[#7b699d]">Total</p>
          <p className="mt-1 text-2xl font-semibold text-[#111827]">{stats.total}</p>
        </div>
        <div className="rounded-2xl border border-[#e8dcff] bg-white p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-[#7b699d]">Upcoming</p>
          <p className="mt-1 text-2xl font-semibold text-[#5D3699]">{stats.upcoming}</p>
        </div>
        <div className="rounded-2xl border border-[#d9f9e6] bg-white p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-[#1f7a4a]">Completed</p>
          <p className="mt-1 text-2xl font-semibold text-[#15803d]">{stats.completed}</p>
        </div>
      </div>

      <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="inline-flex w-full items-center gap-2 rounded-xl border border-[#e8dcff] bg-white px-3 py-2 sm:max-w-sm">
          <Search className="h-4 w-4 text-[#9ca3af]" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search registered events..."
            className="w-full border-0 bg-transparent text-sm text-[#111827] outline-none placeholder:text-[#9ca3af]"
          />
        </div>
        <div className="inline-flex w-full items-center gap-1 overflow-x-auto rounded-full border border-[#e8dcff] bg-white p-1 sm:w-auto">
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
                  ? 'bg-[#5D3699] text-white shadow-sm'
                  : 'text-[#5D3699] hover:bg-[#f5f3ff]'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      <section className="mt-6">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filteredItems.map((item) => {
            const event = eventById.get(item?.volunteer_event);
            const status = getEventStatus(item, eventById);
            const statusStyles =
              status === 'completed'
                ? 'bg-[#f0fdf4] text-[#166534] ring-[#bbf7d0]'
                : 'bg-[#f5f3ff] text-[#5D3699] ring-[#ddd6fe]';

            return (
              <article
                key={item.id}
                className="overflow-hidden rounded-2xl border border-[#e9ddff] bg-white shadow-[0_24px_44px_-34px_rgba(93,54,153,0.7)]"
              >
                <div className="flex flex-col sm:flex-row">
                  <div className="relative h-40 w-full overflow-hidden bg-[#f5f3ff] sm:h-auto sm:w-44 sm:shrink-0">
                    {event?.image ? (
                      <img
                        src={event.image}
                        alt={item?.volunteer_event_title || event?.title || 'Volunteer event'}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#ede5ff] to-[#f7f2ff] text-[#7b699d]">
                        <Calendar className="h-6 w-6" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-[#120a2c]/45 via-[#120a2c]/10 to-transparent" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2 border-b border-[#f1eaff] px-4 py-3">
                      <h2 className="line-clamp-2 text-sm font-semibold text-[#111827]">
                        {item?.volunteer_event_title || event?.title || `Event #${item?.volunteer_event}`}
                      </h2>
                      <span className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-1 text-[10px] font-semibold ring-1 ${statusStyles}`}>
                        <CheckCircle2 className="h-3 w-3" />
                        {status === 'completed' ? 'Completed' : 'Upcoming'}
                      </span>
                    </div>

                    <div className="space-y-2.5 p-4 text-xs text-[#5f6472]">
                      <p className="flex items-start gap-2">
                        <Calendar className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#5D3699]" />
                        <span>{formatDate(item?.volunteer_event_date || event?.date)}</span>
                      </p>
                      <p className="flex items-start gap-2">
                        <Clock className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#5D3699]" />
                        <span>{item?.volunteer_event_time || event?.time || '-'}</span>
                      </p>
                      <p className="flex items-start gap-2">
                        <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#5D3699]" />
                        <span>{event?.location || `${item?.city || '-'}, ${item?.state || '-'}`}</span>
                      </p>
                      <p className="flex items-start gap-2">
                        <Users className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#5D3699]" />
                        <span>Team: {item?.team_name || '-'}</span>
                      </p>
                    </div>

                    <div className="border-t border-[#f3ecff] bg-[#fcfaff] px-4 py-3">
                      <p className="text-[11px] text-[#7b699d]">
                        Registered on <span className="font-semibold text-[#5D3699]">{formatDateTime(item?.created_at)}</span>
                      </p>
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>

        {!loading && filteredItems.length === 0 && (
          <div className="rounded-2xl border border-dashed border-[#e2d4fb] bg-white p-8 text-center">
            <p className="text-sm text-[#6b7280]">
              No registered events found for this filter.
            </p>
            <Link
              to="/volunteer-events"
              className="mt-3 inline-flex items-center rounded-xl bg-[#5D3699] px-4 py-2 text-xs font-semibold text-white hover:bg-[#4a2b7a]"
            >
              Explore Volunteer Events
            </Link>
          </div>
        )}

        {loading && (
          <div className="rounded-2xl border border-[#e2d4fb] bg-white p-8 text-center">
            <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-[#e7d8ff] border-t-[#5D3699]" />
            <p className="mt-3 text-sm text-[#6b7280]">Loading your registered events...</p>
          </div>
        )}

        {error && (
          <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
            {error}
          </div>
        )}
      </section>
    </motion.div>
  );
};

export default RegisteredEvents;
