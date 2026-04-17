import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { menteeApi } from '../../../apis/api/menteeApi';
import { getSelectedMentorId, setLastBooking, setSelectedMentorId } from '../../../apis/api/storage';
import './BookSession.css';
import {
  INDIA_TIMEZONE,
  buildDateKey,
  formatIndiaDateKey,
  getIndiaTimeLabel,
  indiaDateKeyToLabel,
  parseDateKey,
} from '../../../utils/indiaTime';
import {
  Calendar,
  Clock,
  MapPin,
  Star,
  Globe,
  BookOpen,
  Shield,
  ChevronLeft,
  ChevronRight,
  ArrowLeft,
  User,
  CheckCircle2,
  MessageCircle,
  Sparkles,
  Video,
  AlertCircle
} from 'lucide-react';
const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const normalizeList = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.results)) return payload.results;
  return [];
};

const getMentorName = (mentor) => {
  const fullName = `${mentor?.first_name || ''} ${mentor?.last_name || ''}`.trim();
  return fullName || 'Mentor';
};

const toMentorData = (mentor) => ({
  id: mentor?.id ?? null,
  name: getMentorName(mentor),
  location: mentor?.city_state || '',
  rating: mentor?.average_rating !== null && mentor?.average_rating !== undefined
    ? Number(mentor.average_rating)
    : null,
  reviews: Number(mentor?.reviews_count || 0),
  sessions: Number(mentor?.sessions_completed || 0),
  expertise: Array.isArray(mentor?.care_areas) ? mentor.care_areas : [],
  languages: Array.isArray(mentor?.languages) ? mentor.languages : [],
  bio: mentor?.bio || '',
  avatar: mentor?.avatar || '',
});

const toDateKey = (value) => {
  return formatIndiaDateKey(value);
};

const formatTimeInZone = (value) => {
  return getIndiaTimeLabel(value, { hour12: true });
};

const formatTimeRangeInZone = (start, end) => {
  const startLabel = formatTimeInZone(start);
  const endLabel = formatTimeInZone(end);
  if (!startLabel && !endLabel) return '';
  if (!startLabel) return endLabel;
  if (!endLabel) return startLabel;
  return `${startLabel} - ${endLabel}`;
};

const formatDateLabel = (value) => {
  const key = parseDateKey(value) ? value : toDateKey(value);
  if (!key) return 'No date selected';
  return indiaDateKeyToLabel(key, { weekday: 'long', month: 'long', day: 'numeric' });
};

const mapAvailabilitySlots = (payload) =>
  {
    const nowMs = Date.now();
    const todayDateKey = formatIndiaDateKey(new Date());

    return normalizeList(payload)
      .filter((slot) => slot?.is_available !== false)
      .map((slot) => {
        const start = slot?.start_time;
        const end = slot?.end_time || start;
        const dateKey = toDateKey(start);
        if (!start || !dateKey) return null;
        if (dateKey < todayDateKey) return null;

        const startMs = new Date(start).getTime();
        if (dateKey === todayDateKey && Number.isFinite(startMs) && startMs <= nowMs) return null;

        const label = formatTimeRangeInZone(start, end);
        if (!label) return null;

        return {
          ...slot,
          dateKey,
          label,
        };
      })
      .filter(Boolean)
      .sort((a, b) => new Date(a.start_time) - new Date(b.start_time));
  };

const getMonthGrid = (monthDate) => {
  const year = monthDate.getFullYear();
  const month = monthDate.getMonth();
  const firstDay = new Date(year, month, 1);
  const padding = (firstDay.getDay() + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells = [];

  for (let i = 0; i < padding; i += 1) {
    cells.push('');
  }
  for (let day = 1; day <= daysInMonth; day += 1) {
    cells.push(String(day));
  }
  while (cells.length < 42) {
    cells.push('');
  }
  return cells;
};

const BookSession = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [mentor, setMentor] = useState(null);
  const [slots, setSlots] = useState([]);
  const [selectedDateKey, setSelectedDateKey] = useState('');
  const [selectedSlotId, setSelectedSlotId] = useState(null);
  const [monthDate, setMonthDate] = useState(() => new Date());
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;

    const loadData = async () => {
      setLoading(true);
      setError('');

      try {
        const queryMentorId = searchParams.get('mentorId');
        const storedMentorId = getSelectedMentorId();
        let mentorId = queryMentorId || storedMentorId || '';
        let mentorPayload = null;

        if (mentorId) {
          mentorPayload = await menteeApi.getMentorById(mentorId);
        } else {
          const mentors = normalizeList(await menteeApi.listMentors());
          mentorPayload = mentors[0] || null;
          mentorId = mentorPayload?.id ? String(mentorPayload.id) : '';
        }

        const mappedMentor = mentorPayload ? toMentorData(mentorPayload) : null;
        if (!cancelled) {
          setMentor(mappedMentor);
          if (mappedMentor?.id) setSelectedMentorId(mappedMentor.id);
        }

        if (!mentorId || !mappedMentor) {
          if (!cancelled) {
            setSlots([]);
            setError('Mentor not found.');
            setLoading(false);
          }
          return;
        }

        const [slotResponse, feedbackResponse, sessionResponse] = await Promise.allSettled([
          menteeApi.listAvailabilitySlots({
            mentor_id: mentorId,
          }),
          menteeApi.listSessionFeedback({ mentor_id: mentorId }),
          menteeApi.listSessions({ mentor_id: mentorId }),
        ]);

        const availableSlots = slotResponse.status === 'fulfilled'
          ? mapAvailabilitySlots(slotResponse.value)
          : mapAvailabilitySlots(mentorPayload?.availability || []);

        const reviewsCount = feedbackResponse.status === 'fulfilled'
          ? normalizeList(feedbackResponse.value).length
          : mappedMentor.reviews;

        const sessionsCount = sessionResponse.status === 'fulfilled'
          ? normalizeList(sessionResponse.value).length
          : mappedMentor.sessions;

        if (!cancelled) {
          setSlots(availableSlots);
          setMentor((prev) => (prev
            ? {
              ...prev,
              reviews: reviewsCount,
              sessions: sessionsCount,
            }
            : prev));
          if (availableSlots[0]) {
            setSelectedDateKey(availableSlots[0].dateKey);
            setSelectedSlotId(availableSlots[0].id);
            const firstDateParts = parseDateKey(availableSlots[0].dateKey);
            if (firstDateParts) {
              setMonthDate(new Date(firstDateParts.year, firstDateParts.month - 1, 1));
            }
          } else {
            setSelectedDateKey('');
            setSelectedSlotId(null);
          }
        }
      } catch (err) {
        if (!cancelled) {
          setError(err?.message || 'Unable to load booking details.');
          setMentor(null);
          setSlots([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadData();
    return () => {
      cancelled = true;
    };
  }, [searchParams]);

  const monthLabel = useMemo(
    () => monthDate.toLocaleDateString([], { month: 'long', year: 'numeric' }),
    [monthDate]
  );

  const dates = useMemo(() => getMonthGrid(monthDate), [monthDate]);

  const availableDateSet = useMemo(() => {
    const values = new Set();
    slots.forEach((slot) => {
      if (slot?.dateKey) values.add(slot.dateKey);
    });
    return values;
  }, [slots]);

  const selectedDateSlots = useMemo(() => {
    if (!selectedDateKey) return [];
    return slots.filter((slot) => slot.dateKey === selectedDateKey);
  }, [slots, selectedDateKey]);

  useEffect(() => {
    if (!selectedDateSlots.length) {
      setSelectedSlotId(null);
      return;
    }
    if (!selectedDateSlots.some((slot) => slot.id === selectedSlotId)) {
      setSelectedSlotId(selectedDateSlots[0].id);
    }
  }, [selectedDateSlots, selectedSlotId]);

  const selectedSlot = useMemo(
    () => selectedDateSlots.find((slot) => slot.id === selectedSlotId) || null,
    [selectedDateSlots, selectedSlotId]
  );

  const handleMonthChange = (delta) => {
    setMonthDate((prev) => new Date(prev.getFullYear(), prev.getMonth() + delta, 1));
  };

  const handleDateSelect = (dayValue) => {
    if (!dayValue) return;
    const dateKey = buildDateKey(monthDate.getFullYear(), monthDate.getMonth(), Number(dayValue));
    if (!availableDateSet.has(dateKey)) return;
    setSelectedDateKey(dateKey);
  };

  const handleConfirmBooking = async () => {
    if (!mentor?.id || !selectedSlot) {
      setError('Please choose an available date and time slot.');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const start = new Date(selectedSlot.start_time);
      const end = new Date(selectedSlot.end_time);
      const durationMinutes = Math.max(
        15,
        Math.round((end.getTime() - start.getTime()) / (1000 * 60))
      );

      const created = await menteeApi.createSession({
        mentor: mentor.id,
        availability_slot: selectedSlot.id,
        scheduled_start: selectedSlot.start_time,
        scheduled_end: selectedSlot.end_time,
        duration_minutes: durationMinutes,
        timezone: INDIA_TIMEZONE,
        mode: 'online',
        status: 'requested',
        topic_tags: mentor.expertise?.slice(0, 3) || [],
      });

      setLastBooking({
        sessionId: created?.id,
        mentorId: mentor.id,
        mentorName: mentor.name,
        mentorAvatar: mentor.avatar,
        durationMinutes,
        scheduledStart: selectedSlot.start_time,
      });

      navigate(created?.id ? `/booking-success?sessionId=${created.id}` : '/booking-success');
    } catch (err) {
      setError(err?.message || 'Failed to create session request.');
    } finally {
      setSubmitting(false);
    }
  };

  const currentSelectedTimeLabel = selectedSlot?.label || 'Select time';

  return (
    <div className="book-session-page min-h-screen bg-transparent p-4 sm:p-6 lg:p-8">
      <div className="book-session-shell mx-auto w-full">
        {/* Back Link */}
        <Link
          to="/dashboard"
          className="mb-6 inline-flex items-center gap-2 text-sm text-[color:var(--theme-v-text-primary)] font-semibold transition-colors hover:text-[color:var(--theme-v-accent)]"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Mentors
        </Link>

        {/* Header */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[color:var(--theme-v-accent)] shadow-lg shadow-[0_12px_24px_-18px_var(--theme-v-shell-shadow)]">
              <Calendar className="h-6 w-6 text-[color:var(--theme-v-text-primary)]" />
            </div>
            <div>
              <h1 className="book-session-title text-xl font-bold tracking-tight text-[color:var(--theme-v-text-primary)] sm:text-2xl">
                {mentor?.name ? `Book with ${mentor.name}` : 'Book Session'}
              </h1>
              <p className="mt-0.5 text-sm text-[color:var(--theme-v-text-primary)] font-medium opacity-80">
                Select a date and time that works for you
              </p>
            </div>
          </div>

          {/* Safety Badge */}
          <div className="inline-flex items-center gap-2 self-start rounded-full bg-[color:var(--theme-v-accent)]/20 px-4 py-2 ring-1 ring-[color:var(--theme-v-border-medium)]">
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[color:var(--theme-v-accent)]">
              <Shield className="h-3.5 w-3.5 text-[color:var(--theme-v-text-primary)]" />
            </div>
            <span className="text-xs font-medium text-[color:var(--theme-v-highlight-mid)]">
              Sessions are monitored for safety
            </span>
          </div>
        </div>

        {/* Main Card */}
        <div className="book-session-main overflow-hidden rounded-2xl bg-[color:var(--theme-v-surface-overlay)] shadow-sm ring-1 ring-[color:var(--theme-v-border-soft)]">
          <div className="book-session-layout flex flex-col lg:grid lg:grid-cols-[minmax(0,340px)_minmax(0,1fr)]">
            {/* Left Sidebar - Mentor Info */}
            <aside className="border-b border-[color:var(--theme-v-border-soft)] bg-[color:var(--theme-v-surface-overlay-strong)] lg:border-b-0 lg:border-r">
              {/* ——— Mobile: Compact Mentor Card ——— */}
              <div className="block p-4 lg:hidden">
                <div className="flex items-center gap-3">
                  <div className="relative flex-shrink-0">
                    <div className="h-12 w-12 overflow-hidden rounded-xl bg-[color:var(--theme-v-accent)]/20 ring-2 ring-white shadow-md">
                      {mentor?.avatar ? (
                        <img src={mentor.avatar} alt={mentor?.name || 'Mentor'} className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center">
                          <User className="h-6 w-6 text-[color:var(--theme-v-accent)]" />
                        </div>
                      )}
                    </div>
                    <div className="absolute -bottom-0.5 -right-0.5 h-4 w-4 rounded-full border-2 border-white bg-[color:var(--theme-v-accent)]" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h2 className="text-base font-bold text-[color:var(--theme-v-text-primary)] truncate">
                      {mentor?.name || 'Mentor'}
                    </h2>
                    <div className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-[color:var(--theme-v-text-secondary)]">
                      {mentor?.location && (
                        <span className="inline-flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          <span className="truncate max-w-[120px]">{mentor.location}</span>
                        </span>
                      )}
                      {mentor?.rating !== null && mentor?.rating !== undefined && (
                        <span className="inline-flex items-center gap-1">
                          <Star className="h-3 w-3 fill-[color:var(--theme-v-accent)] text-[color:var(--theme-v-accent)]" />
                          <span className="font-semibold text-[color:var(--theme-v-text-primary)]">{Number(mentor.rating).toFixed(1)}</span>
                        </span>
                      )}
                      <span className="inline-flex items-center gap-1">
                        <MessageCircle className="h-3 w-3" />
                        {mentor?.reviews ?? 0}
                      </span>
                    </div>
                  </div>
                </div>
                {(mentor?.expertise || []).length > 0 && (
                  <div className="mt-2.5 flex flex-wrap gap-1.5">
                    {mentor.expertise.slice(0, 3).map((t) => (
                      <span key={t} className="inline-flex items-center rounded-full bg-[color:var(--theme-v-accent)]/20 px-2.5 py-1 text-[10px] font-medium text-[color:var(--theme-v-highlight-mid)]">
                        {t}
                      </span>
                    ))}
                    {mentor.expertise.length > 3 && (
                      <span className="inline-flex items-center rounded-full bg-[color:var(--theme-v-accent)]/20 px-2.5 py-1 text-[10px] font-medium text-[color:var(--theme-v-text-placeholder)]">
                        +{mentor.expertise.length - 3}
                      </span>
                    )}
                  </div>
                )}
              </div>
              {/* ——— Desktop: Full Sidebar ——— */}
              <div className="hidden p-6 lg:block lg:p-8">
                {/* Mentor Header */}
                <div className="flex items-center gap-4">
                  <div className="relative flex-shrink-0">
                    <div className="h-16 w-16 overflow-hidden rounded-xl bg-[color:var(--theme-v-surface-overlay-strong)] ring-2 ring-white shadow-md">
                      {mentor?.avatar ? (
                        <img
                          src={mentor.avatar}
                          alt={mentor?.name || 'Mentor'}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center">
                          <User className="h-8 w-8 text-[color:var(--theme-v-accent)]" />
                        </div>
                      )}
                    </div>
                    {/* Online indicator */}
                    <div className="absolute -bottom-1 -right-1 h-5 w-5 rounded-full border-2 border-white bg-[color:var(--theme-v-accent)]" />
                  </div>
                  <div className="min-w-0">
                    <h2 className="text-lg font-bold text-[color:var(--theme-v-text-primary)] truncate">
                      {mentor?.name || 'Mentor'}
                    </h2>
                    {mentor?.location && (
                      <div className="mt-0.5 flex items-center gap-1.5 text-sm text-[color:var(--theme-v-text-secondary)]">
                        <MapPin className="h-3.5 w-3.5" />
                        <span className="truncate">{mentor.location}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Stats */}
                <div className="mt-6 flex items-center gap-4 rounded-xl bg-[color:var(--theme-v-surface-overlay)] p-4 ring-1 ring-[color:var(--theme-v-border-soft)]">
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-0.5">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`h-4 w-4 ${i < Math.floor(mentor?.rating || 0)
                            ? 'fill-[color:var(--theme-v-accent)] text-[color:var(--theme-v-accent)]'
                            : 'text-[color:var(--theme-v-accent-text)]/30'
                            }`}
                        />
                      ))}
                    </div>
                    <span className="text-sm font-bold text-[color:var(--theme-v-text-primary)]">
                      {mentor?.rating !== null && mentor?.rating !== undefined
                        ? Number(mentor.rating).toFixed(1)
                        : '--'}
                    </span>
                  </div>
                  <div className="h-4 w-px bg-[color:var(--theme-v-border-soft)]" />
                  <div className="flex items-center gap-1 text-sm text-[color:var(--theme-v-text-secondary)]">
                    <MessageCircle className="h-3.5 w-3.5" />
                    <span>{mentor?.reviews ?? 0}</span>
                  </div>
                  <div className="h-4 w-px bg-[color:var(--theme-v-border-soft)]" />
                  <div className="flex items-center gap-1 text-sm text-[color:var(--theme-v-text-secondary)]">
                    <Video className="h-3.5 w-3.5" />
                    <span className="font-semibold text-[color:var(--theme-v-text-primary)]">{mentor?.sessions ?? 0}</span>
                  </div>
                </div>

                {/* Expertise */}
                <div className="mt-6">
                  <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[color:var(--theme-v-text-secondary)]">
                    <BookOpen className="h-4 w-4" />
                    Expertise
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {(mentor?.expertise || []).map((t) => (
                      <span
                        key={t}
                        className="inline-flex items-center rounded-full bg-[color:var(--theme-v-surface-overlay-strong)] px-3 py-1.5 text-xs font-medium text-[color:var(--theme-v-accent)]"
                      >
                        {t}
                      </span>
                    ))}
                    {!mentor?.expertise?.length && (
                      <span className="text-xs text-[color:var(--theme-v-text-placeholder)]">Not specified</span>
                    )}
                  </div>
                </div>

                {/* Languages */}
                <div className="mt-6">
                  <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[color:var(--theme-v-text-secondary)]">
                    <Globe className="h-4 w-4" />
                    Languages
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {(mentor?.languages || []).map((t) => (
                      <span
                        key={t}
                        className="inline-flex items-center gap-1.5 rounded-full bg-[color:var(--theme-v-surface-overlay)] px-3 py-1.5 text-xs font-medium text-[color:var(--theme-v-text-secondary)] ring-1 ring-[color:var(--theme-v-border-soft)]"
                      >
                        <Globe className="h-3 w-3" />
                        {t}
                      </span>
                    ))}
                    {!mentor?.languages?.length && (
                      <span className="text-xs text-[color:var(--theme-v-text-placeholder)]">Not specified</span>
                    )}
                  </div>
                </div>

                {/* Bio */}
                <div className="mt-6">
                  <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[color:var(--theme-v-text-secondary)]">
                    <Sparkles className="h-4 w-4" />
                    My Story
                  </div>
                  <div className="mt-3 rounded-xl bg-[color:var(--theme-v-surface-overlay)] p-4 ring-1 ring-[color:var(--theme-v-border-soft)]">
                    <p className="text-sm italic leading-relaxed text-[color:var(--theme-v-text-secondary)]">
                      "{mentor?.bio || 'Bio not provided yet.'}"
                    </p>
                    <button
                      type="button"
                      className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-[color:var(--theme-v-accent)] hover:underline"
                    >
                      Read full bio
                      <ChevronRight className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              </div>
            </aside>

            {/* Right Section - Calendar & Time Slots */}
            <div className="p-6 lg:p-8">
              <div className="book-session-calendar-layout grid gap-6 lg:grid-cols-[minmax(0,1fr)_220px] lg:gap-8">
                {/* Calendar */}
                <section className="book-session-calendar-section">
                  {/* Month Navigation */}
                  <div className="mb-6 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => handleMonthChange(-1)}
                      className="flex h-10 w-10 items-center justify-center rounded-xl bg-[color:var(--theme-v-surface-overlay-strong)] text-[color:var(--theme-v-accent)] transition-colors hover:bg-[color:var(--theme-v-surface-overlay)]"
                    >
                      <ChevronLeft className="h-5 w-5" />
                    </button>
                    <h2 className="text-lg font-semibold text-[color:var(--theme-v-text-primary)]">
                      {monthLabel}
                    </h2>
                    <button
                      type="button"
                      onClick={() => handleMonthChange(1)}
                      className="flex h-10 w-10 items-center justify-center rounded-xl bg-[color:var(--theme-v-surface-overlay-strong)] text-[color:var(--theme-v-accent)] transition-colors hover:bg-[color:var(--theme-v-surface-overlay)]"
                    >
                      <ChevronRight className="h-5 w-5" />
                    </button>
                  </div>

                  {/* Calendar Grid */}
                  <div className="book-session-calendar-grid rounded-xl bg-[color:var(--theme-v-surface-overlay-strong)] p-4 ring-1 ring-[color:var(--theme-v-border-soft)]">
                    {/* Days Header */}
                    <div className="mb-3 grid grid-cols-7 gap-2">
                      {days.map((d) => (
                        <div
                          key={d}
                          className="text-center text-xs font-semibold uppercase tracking-wider text-[color:var(--theme-v-text-placeholder)]"
                        >
                          {d}
                        </div>
                      ))}
                    </div>

                    {/* Dates Grid */}
                    <div className="grid grid-cols-7 gap-2">
                      {dates.map((d, i) => {
                        const isEmpty = d === '';
                        const dateKey = d
                          ? buildDateKey(monthDate.getFullYear(), monthDate.getMonth(), Number(d))
                          : '';
                        const isSelected = Boolean(dateKey) && dateKey === selectedDateKey;
                        const isUnavailable = Boolean(dateKey) && !availableDateSet.has(dateKey);
                        const isToday = dateKey === formatIndiaDateKey(new Date());

                        return (
                          <button
                            key={`${d}-${i}`}
                            type="button"
                            onClick={() => !isEmpty && !isUnavailable && handleDateSelect(d)}
                            disabled={isEmpty || isUnavailable}
                            className={`
                            relative flex aspect-square w-full items-center justify-center rounded-xl text-sm font-medium transition-all
                            ${isEmpty ? 'cursor-default' : ''}
                            ${isSelected
                                ? 'bg-[color:var(--theme-v-accent)] text-[color:var(--theme-v-text-primary)] shadow-[0_12px_24px_-18px_var(--theme-v-shell-shadow)]'
                                : ''
                              }
                            ${!isEmpty && !isSelected && !isUnavailable
                                ? 'bg-[color:var(--theme-v-surface-overlay)] text-[color:var(--theme-v-text-primary)] ring-1 ring-[color:var(--theme-v-border-soft)] hover:ring-[color:var(--theme-v-border-hover)] hover:bg-[color:var(--theme-v-accent)]/10'
                                : ''
                              }
                            ${isUnavailable
                                ? 'cursor-not-allowed bg-transparent text-[color:var(--theme-v-text-placeholder)]'
                                : ''
                              }
                            ${isToday && !isSelected
                                ? 'ring-2 ring-[color:var(--theme-v-focus-ring)]'
                                : ''
                              }
                          `}
                          >
                            {d || ''}
                            {isToday && !isSelected && (
                              <span className="absolute -bottom-1 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-[color:var(--theme-v-accent)]" />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Legend */}
                  <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-[color:var(--theme-v-text-secondary)]">
                    <div className="flex items-center gap-2">
                      <div className="h-3 w-3 rounded-full bg-[color:var(--theme-v-accent)]" />
                      <span>Selected</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="h-3 w-3 rounded-full bg-[color:var(--theme-v-surface-overlay)] ring-1 ring-[color:var(--theme-v-border-soft)]" />
                      <span>Available</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="h-3 w-3 rounded-full bg-[color:var(--theme-v-accent)]/30" />
                      <span>Unavailable</span>
                    </div>
                  </div>
                </section>

                {/* Time Slots */}
                <aside className="border-t border-[color:var(--theme-v-border-soft)] pt-6 lg:border-l lg:border-t-0 lg:pl-6 lg:pt-0">
                  <div className="flex items-center gap-2">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[color:var(--theme-v-accent)]/20">
                      <Clock className="h-5 w-5 text-[color:var(--theme-v-highlight-mid)]" />
                    </div>
                    <div>
                      <h3 className="text-base font-semibold text-[color:var(--theme-v-text-primary)]">
                        Available Times
                      </h3>
                      <p className="text-xs text-[color:var(--theme-v-text-secondary)]">
                        {selectedDateKey ? formatDateLabel(selectedDateKey) : 'Select a date'}
                      </p>
                    </div>
                  </div>

                  {/* Time Slot Buttons */}
                  <div className="mt-4 space-y-2">
                    {selectedDateSlots.length > 0 ? (
                      selectedDateSlots.map((slot) => {
                        const isSelected = slot.id === selectedSlotId;

                        return (
                          <button
                            key={slot.id}
                            type="button"
                            onClick={() => setSelectedSlotId(slot.id)}
                            className={`flex w-full items-center justify-between rounded-xl px-4 py-3 text-sm font-medium transition-all ${isSelected
                              ? 'bg-[color:var(--theme-v-accent)] text-[color:var(--theme-v-text-primary)] shadow-[0_12px_24px_-18px_var(--theme-v-shell-shadow)]'
                              : 'bg-[color:var(--theme-v-surface-overlay)] text-[color:var(--theme-v-text-primary)] ring-1 ring-[color:var(--theme-v-border-soft)] hover:ring-[color:var(--theme-v-border-hover)] hover:bg-[color:var(--theme-v-accent)]/10'
                              }`}
                          >
                            <span>{slot.label}</span>
                            {isSelected && (
                              <CheckCircle2 className="h-4 w-4" />
                            )}
                          </button>
                        );
                      })
                    ) : (
                      <div className="flex flex-col items-center justify-center rounded-xl bg-[color:var(--theme-v-surface-overlay-strong)] py-8 text-center">
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[color:var(--theme-v-surface-overlay)] ring-1 ring-[color:var(--theme-v-border-soft)]">
                          <Clock className="h-6 w-6 text-[color:var(--theme-v-text-placeholder)]" />
                        </div>
                        <p className="mt-3 text-sm font-medium text-[color:var(--theme-v-text-primary)]">
                          No times available
                        </p>
                        <p className="mt-1 text-xs text-[color:var(--theme-v-text-secondary)]">
                          Please select another date
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Selected Summary */}
                  {selectedSlot && (
                    <div className="mt-4 rounded-xl bg-[color:var(--theme-v-accent)]/20 p-4">
                      <div className="flex items-center gap-2 text-xs font-medium text-[color:var(--theme-v-highlight-mid)]">
                        <CheckCircle2 className="h-4 w-4" />
                        Selected Time
                      </div>
                      <p className="mt-1 text-sm font-semibold text-[color:var(--theme-v-text-primary)]">
                        {currentSelectedTimeLabel}
                      </p>
                    </div>
                  )}
                </aside>
              </div>
            </div>
          </div>

          {/* Footer CTA */}
          <div className="border-t border-[color:var(--theme-v-border-soft)] bg-[color:var(--theme-v-surface-overlay-strong)] p-4 sm:p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[color:var(--theme-v-accent)]">
                  <Video className="h-5 w-5 text-[color:var(--theme-v-text-primary)]" />
                </div>
                <div>
                  <p className="text-sm font-medium text-[color:var(--theme-v-text-primary)]">
                    {selectedSlot ? 'Ready to book?' : 'Select a time slot'}
                  </p>
                  <p className="text-xs text-[color:var(--theme-v-text-secondary)]">
                    {selectedSlot
                      ? `Session with ${mentor?.name || 'Mentor'}`
                      : 'Choose a date and time above'}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleConfirmBooking}
                disabled={submitting || loading || !selectedSlot}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[color:var(--theme-v-accent)] px-8 py-3.5 text-sm font-semibold text-[color:var(--theme-v-accent-text)] shadow-sm transition-all hover:bg-[color:var(--theme-v-accent-hover)] hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
              >
                {submitting ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    Confirming...
                  </>
                ) : (
                  <>
                    <Calendar className="h-5 w-5" />
                    Confirm Booking
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Loading/Error States */}
        {loading && (
          <div className="mt-6 flex items-center justify-center gap-3 rounded-xl bg-[color:var(--theme-v-surface-overlay)] p-6 shadow-sm ring-1 ring-[color:var(--theme-v-border-soft)]">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-[color:var(--theme-v-border-soft)] border-t-[color:var(--theme-v-accent)]" />
            <span className="text-sm font-medium text-[color:var(--theme-v-text-secondary)]">Loading available slots...</span>
          </div>
        )}

        {error && (
          <div className="mt-6 flex items-center gap-3 rounded-xl bg-[color:var(--theme-v-toast-error-bg)] p-4 ring-1 ring-[color:var(--theme-v-toast-error-border)]">
            <AlertCircle className="h-5 w-5 text-[color:var(--theme-v-toast-error-text)]" />
            <span className="text-sm text-[color:var(--theme-v-toast-error-text)]">{error}</span>
          </div>
        )}

        {/* Session Info */}
        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl bg-[color:var(--theme-v-surface-overlay)] p-4 shadow-sm ring-1 ring-[color:var(--theme-v-border-soft)]">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[color:var(--theme-v-surface-overlay-strong)]">
                <Video className="h-5 w-5 text-[color:var(--theme-v-accent)]" />
              </div>
              <div>
                <p className="text-sm font-semibold text-[color:var(--theme-v-text-primary)]">Video Call</p>
                <p className="text-xs text-[color:var(--theme-v-text-secondary)]">Secure video session</p>
              </div>
            </div>
          </div>
          <div className="rounded-xl bg-[color:var(--theme-v-surface-overlay)] p-4 shadow-sm ring-1 ring-[color:var(--theme-v-border-soft)]">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[color:var(--theme-v-surface-overlay-strong)]">
                <Clock className="h-5 w-5 text-[color:var(--theme-v-accent)]" />
              </div>
              <div>
                <p className="text-sm font-semibold text-[color:var(--theme-v-text-primary)]">30 Minutes</p>
                <p className="text-xs text-[color:var(--theme-v-text-secondary)]">Session duration</p>
              </div>
            </div>
          </div>
          <div className="rounded-xl bg-[color:var(--theme-v-surface-overlay)] p-4 shadow-sm ring-1 ring-[color:var(--theme-v-border-soft)]">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[color:var(--theme-v-toast-success-bg)]">
                <Shield className="h-5 w-5 text-[color:var(--theme-v-toast-success-text)]" />
              </div>
              <div>
                <p className="text-sm font-semibold text-[color:var(--theme-v-text-primary)]">Safe & Secure</p>
                <p className="text-xs text-[color:var(--theme-v-text-secondary)]">Monitored sessions</p>
              </div>
            </div>
          </div>
        </div>

        {/* Help Text */}
        <p className="mt-6 text-center text-xs text-[color:var(--theme-v-text-placeholder)]">
          Need help? Contact our support team at support@bondroom.com
        </p>
      </div>
    </div>
  );
};

export default BookSession;

