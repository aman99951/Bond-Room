import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useMentorScreenData } from './useMentorScreenData';
import { menteeApi } from '../../../apis/api/menteeApi';
import { setLastBooking } from '../../../apis/api/storage';
import {
  addDaysToDateKey,
  formatIndiaDateKey,
  INDIA_TIMEZONE,
  getIndiaTimeLabel,
  indiaDateKeyToLabel,
} from '../../../utils/indiaTime';
import {
  MapPin,
  Star,
  Globe,
  Award,
  BookOpen,
  Calendar,
  Clock,
  MessageCircle,
  ArrowLeft,
  User,
  ChevronDown,
  ChevronUp,
  Sparkles,
  CheckCircle2,
  Quote,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

const CALENDAR_DAYS = 7;

const MentorProfile = () => {
  const navigate = useNavigate();
  const { mentor, availabilitySlots, review, loading, error } = useMentorScreenData();
  const rating = mentor?.rating != null ? Number(mentor.rating).toFixed(1) : '';
  const reviewCount = mentor?.reviews != null ? Number(mentor.reviews) : null;
  const displayName = mentor?.name || (mentor?.id ? `Mentor #${mentor.id}` : '');
  const todayDateKey = formatIndiaDateKey(new Date());
  const [weekStartKey, setWeekStartKey] = useState(() => todayDateKey);
  const [bookingSlotKey, setBookingSlotKey] = useState('');
  const [confirmSlot, setConfirmSlot] = useState(null);
  const [bookingError, setBookingError] = useState('');
  const [aboutExpanded, setAboutExpanded] = useState(false);
  const [showReadMore, setShowReadMore] = useState(false);
  const aboutRef = useRef(null);

  const weekColumns = useMemo(
    () =>
      Array.from({ length: CALENDAR_DAYS }).map((_, index) => {
        const dateKey = addDaysToDateKey(weekStartKey, index);
        return {
          day: indiaDateKeyToLabel(dateKey, { weekday: 'short' }) || '--',
          dateKey,
          dateLabel: indiaDateKeyToLabel(dateKey, { month: 'short', day: 'numeric' }),
        };
      }),
    [weekStartKey]
  );

  const weekRangeLabel = useMemo(() => {
    const startLabel = indiaDateKeyToLabel(weekStartKey, { month: 'short', day: 'numeric' });
    const endLabel = indiaDateKeyToLabel(addDaysToDateKey(weekStartKey, 6), { month: 'short', day: 'numeric' });
    if (!startLabel || !endLabel) return 'This Week';
    return `${startLabel} - ${endLabel}`;
  }, [weekStartKey]);

  const availabilityByDate = useMemo(() => {
    const map = {};
    const nowMs = Date.now();
    weekColumns.forEach((column) => {
      map[column.dateKey] = [];
    });
    (Array.isArray(availabilitySlots) ? availabilitySlots : []).forEach((slot) => {
      const start = slot?.start_time;
      if (!start) return;
      const dateKey = formatIndiaDateKey(start);
      if (dateKey < todayDateKey) return;
      if (!map[dateKey]) return;
      if (slot?.is_available === false) return;
      const slotId = Number(slot?.id);
      if (!slotId) return;
      const startDate = new Date(start);
      const endDate = new Date(slot?.end_time || start);
      const startMs = Number.isNaN(startDate.getTime()) ? 0 : startDate.getTime();
      const endMs = Number.isNaN(endDate.getTime()) ? startMs : endDate.getTime();
      if (dateKey === todayDateKey && startMs <= nowMs) return;
      const startLabel = getIndiaTimeLabel(startDate, { hour12: true });
      const endLabel = getIndiaTimeLabel(endDate, { hour12: true });
      const label = endLabel ? `${startLabel} - ${endLabel}` : startLabel;
      if (!label) return;
      const entries = map[dateKey];
      const duplicate = entries.some((entry) => entry.id === slotId);
      if (!duplicate) {
        entries.push({
          id: slotId,
          label,
          startMs,
          endMs,
          startTime: start,
          endTime: slot?.end_time || start,
          isAvailable: true,
        });
      }
    });
    Object.keys(map).forEach((dateKey) => {
      map[dateKey].sort((a, b) => {
        if (a.startMs !== b.startMs) return a.startMs - b.startMs;
        return a.endMs - b.endMs;
      });
    });
    return map;
  }, [availabilitySlots, todayDateKey, weekColumns]);

  const canGoPrevWeek = useMemo(
    () => addDaysToDateKey(weekStartKey, -7) >= todayDateKey,
    [todayDateKey, weekStartKey]
  );

  const availabilityByDay = useMemo(
    () => weekColumns.map((column) => availabilityByDate[column.dateKey] || []),
    [availabilityByDate, weekColumns]
  );

  const maxSlotRows = useMemo(() => {
    const counts = availabilityByDay.map((times) => times.length);
    return Math.max(1, ...counts);
  }, [availabilityByDay]);

  useEffect(() => {
    if (aboutExpanded) return undefined;
    const checkOverflow = () => {
      const element = aboutRef.current;
      if (!element) {
        setShowReadMore(false);
        return;
      }
      setShowReadMore(element.scrollHeight > element.clientHeight + 1);
    };
    checkOverflow();
    window.addEventListener('resize', checkOverflow);
    return () => window.removeEventListener('resize', checkOverflow);
  }, [mentor?.bio, aboutExpanded]);

  const openBookingConfirm = (slot) => {
    if (!slot || bookingSlotKey) return;
    setBookingError('');
    setConfirmSlot(slot);
  };

  const closeBookingConfirm = () => {
    if (bookingSlotKey) return;
    setConfirmSlot(null);
  };

  const handleBookSlot = async () => {
    const slot = confirmSlot;
    if (!mentor?.id || !slot?.id || !slot?.startTime || !slot?.endTime) {
      setBookingError('Unable to book this slot right now.');
      return;
    }

    const slotKey = `${slot.id}`;
    setBookingError('');
    setBookingSlotKey(slotKey);

    try {
      const start = new Date(slot.startTime);
      const end = new Date(slot.endTime);
      const durationMinutes = Math.max(
        15,
        Math.round((end.getTime() - start.getTime()) / (1000 * 60))
      );

      const created = await menteeApi.createSession({
        mentor: mentor.id,
        availability_slot: slot.id,
        scheduled_start: slot.startTime,
        scheduled_end: slot.endTime,
        duration_minutes: durationMinutes,
        timezone: INDIA_TIMEZONE,
        mode: 'online',
        status: 'requested',
        topic_tags: Array.isArray(mentor?.areas) ? mentor.areas.slice(0, 3) : [],
      });

      setLastBooking({
        sessionId: created?.id,
        mentorId: mentor.id,
        mentorName: mentor.name,
        mentorAvatar: mentor.avatar,
        durationMinutes,
        scheduledStart: slot.startTime,
      });

      navigate(created?.id ? `/booking-success?sessionId=${created.id}` : '/booking-success');
    } catch (err) {
      setBookingError(err?.message || 'Failed to book slot. Please try again.');
    } finally {
      setBookingSlotKey('');
      setConfirmSlot(null);
    }
  };

  return (
    <div className="min-h-screen bg-transparent p-4 text-[color:var(--theme-v-text-primary)] sm:p-6 lg:p-8">
      <div className="mx-auto max-w-6xl">
        {/* Back Link */}
        <Link
          to="/dashboard"
          className="mb-6 inline-flex items-center gap-2 text-sm text-[color:var(--theme-v-text-secondary)] transition-colors hover:text-[color:var(--theme-v-accent)]"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to recommendations
        </Link>

        {/* Main Grid */}
        <div className="grid gap-6 lg:grid-cols-[minmax(0,340px)_minmax(0,1fr)]">
          {/* Left Sidebar - Mentor Card */}
          <div className="space-y-6">
            <aside className="overflow-hidden rounded-2xl bg-[color:var(--theme-v-surface-overlay)] shadow-sm ring-1 ring-[color:var(--theme-v-border-soft)]">
              {/* Header Background */}
              <div className="relative h-28 bg-[color:var(--theme-v-accent)]">
                <div className="absolute inset-0 opacity-30">
                  <div
                    className="absolute inset-0"
                    style={{
                      backgroundImage:
                        'radial-gradient(circle at 20% 80%, rgba(255,255,255,0.4) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(255,255,255,0.3) 0%, transparent 50%)',
                    }}
                  />
                </div>
              </div>

              {/* Avatar & Info */}
              <div className="px-6 pb-6">
                <div className="-mt-14 flex flex-col items-center text-center">
                  {/* Avatar */}
                  <div className="relative">
                    <div className="h-28 w-28 overflow-hidden rounded-2xl bg-[color:var(--theme-v-surface-overlay)] ring-4 ring-[color:var(--theme-v-surface-overlay)] shadow-xl">
                      {mentor?.avatar ? (
                        <img
                          src={mentor.avatar}
                          alt={displayName}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-[color:var(--theme-v-surface-overlay-strong)]">
                          <User className="h-12 w-12 text-[color:var(--theme-v-accent)]" />
                        </div>
                      )}
                    </div>
                    {/* Verified Badge */}
                    <div className="absolute -bottom-2 -right-2 flex h-8 w-8 items-center justify-center rounded-full bg-[color:var(--theme-v-toast-success-bg)] ring-2 ring-[color:var(--theme-v-surface-overlay)]">
                      <CheckCircle2 className="h-4 w-4 text-[color:var(--theme-v-toast-success-text)]" />
                    </div>
                  </div>

                  {/* Name */}
                  <h1 className="mt-4 text-xl font-bold text-[color:var(--theme-v-text-primary)] sm:text-2xl">
                    {displayName}
                  </h1>

                  {/* Location */}
                  {mentor?.location && (
                    <div className="mt-1 flex items-center gap-1.5 text-sm text-[color:var(--theme-v-text-secondary)]">
                      <MapPin className="h-4 w-4" />
                      <span>{mentor.location}</span>
                    </div>
                  )}

                  {/* Qualification Badge */}
                  {mentor?.qualification && (
                    <div className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-[color:var(--theme-v-toast-success-bg)] px-4 py-1.5 text-xs font-semibold text-[color:var(--theme-v-toast-success-text)] ring-1 ring-[color:var(--theme-v-toast-success-border)]">
                      <Award className="h-3.5 w-3.5" />
                      {mentor.qualification}
                    </div>
                  )}

                  {/* Languages */}
                  {(mentor?.languages || []).length > 0 && (
                    <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
                      {mentor.languages.map((language) => (
                        <span
                          key={language}
                          className="inline-flex items-center gap-1 rounded-full bg-[color:var(--theme-v-surface-overlay-strong)] px-3 py-1 text-xs font-medium text-[color:var(--theme-v-accent)]"
                        >
                          <Globe className="h-3 w-3" />
                          {language}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Rating */}
                  {(rating || reviewCount != null) && (
                    <div className="mt-6 flex items-center gap-3 rounded-xl bg-[color:var(--theme-v-surface-overlay-strong)] px-5 py-3 ring-1 ring-[color:var(--theme-v-border-soft)]">
                      <div className="flex items-center gap-1">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`h-5 w-5 ${i < Math.floor(rating || 0)
                                ? 'fill-[color:var(--theme-v-accent)] text-[color:var(--theme-v-accent)]'
                                : 'text-white/30'
                              }`}
                          />
                        ))}
                      </div>
                      <div className="flex items-baseline gap-1">
                        <span className="text-lg font-bold text-[color:var(--theme-v-text-primary)]">{rating}</span>
                        {reviewCount != null && (
                          <span className="text-sm text-[color:var(--theme-v-text-secondary)]">({reviewCount})</span>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* AI Matched Areas */}
                {Array.isArray(mentor?.areas) && mentor.areas.length > 0 && (
                  <div className="mt-6 rounded-xl bg-[color:var(--theme-v-surface-overlay-strong)] p-4">
                    <div className="flex items-center justify-center gap-2 text-xs font-medium text-[color:var(--theme-v-accent)]">
                      <Sparkles className="h-4 w-4" />
                      AI Matched For
                    </div>
                    <div className="mt-3 flex flex-wrap justify-center gap-2">
                      {mentor.areas.map((area) => (
                        <span
                          key={area}
                          className="rounded-full bg-[color:var(--theme-v-surface-overlay)] px-3 py-1 text-xs font-medium text-[color:var(--theme-v-accent)] ring-1 ring-[color:var(--theme-v-border-soft)]"
                        >
                          {area}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </aside>

            {/* Quick Info Card */}
            <div className="rounded-2xl bg-[color:var(--theme-v-surface-overlay)] p-5 shadow-sm ring-1 ring-[color:var(--theme-v-border-soft)]">
              <h3 className="text-sm font-semibold text-[color:var(--theme-v-text-primary)]">Quick Info</h3>
              <div className="mt-4 space-y-3">
                <div className="flex items-center gap-3 text-sm text-[color:var(--theme-v-text-secondary)]">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[color:var(--theme-v-surface-overlay-strong)]">
                    <Clock className="h-4 w-4 text-[color:var(--theme-v-accent)]" />
                  </div>
                  <span>Usually responds within 24h</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-[color:var(--theme-v-text-secondary)]">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[color:var(--theme-v-toast-success-bg)] ring-1 ring-[color:var(--theme-v-toast-success-border)]">
                    <CheckCircle2 className="h-4 w-4 text-[color:var(--theme-v-toast-success-text)]" />
                  </div>
                  <span>Available this week</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-[color:var(--theme-v-text-secondary)]">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[color:var(--theme-v-surface-overlay-strong)]">
                    <MessageCircle className="h-4 w-4 text-[color:var(--theme-v-accent)]" />
                  </div>
                  <span>{reviewCount || 0} reviews received</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Section - Details */}
          <section className="space-y-6">
            {/* Loading/Error State */}
            {(loading || error) && (
              <div
                className={`flex items-center gap-3 rounded-xl p-4 ${error ? 'bg-[color:var(--theme-v-toast-error-bg)] ring-1 ring-[color:var(--theme-v-toast-error-border)]' : 'bg-[color:var(--theme-v-surface-overlay)] ring-1 ring-[color:var(--theme-v-border-soft)]'
                  }`}
              >
                {loading && (
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-[color:var(--theme-v-border-soft)] border-t-[color:var(--theme-v-accent)]" />
                )}
                <span className={`text-sm ${error ? 'text-[color:var(--theme-v-toast-error-text)]' : 'text-[color:var(--theme-v-text-secondary)]'}`}>
                  {error || 'Loading mentor profile...'}
                </span>
              </div>
            )}

            {/* About Section */}
            <div className="rounded-2xl bg-[color:var(--theme-v-surface-overlay)] p-4 shadow-sm ring-1 ring-[color:var(--theme-v-border-soft)] sm:p-6">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[color:var(--theme-v-surface-overlay-strong)]">
                  <User className="h-5 w-5 text-[color:var(--theme-v-accent)]" />
                </div>
                <h2 className="text-lg font-semibold text-[color:var(--theme-v-text-primary)]">About the Mentor</h2>
              </div>

              {mentor?.bio && (
                <>
                  <p
                    ref={aboutRef}
                    className={`mt-4 text-[color:var(--theme-v-text-secondary)] leading-relaxed ${aboutExpanded ? '' : 'line-clamp-4'
                      }`}
                  >
                    {mentor.bio}
                  </p>
                  {showReadMore && (
                    <button
                      type="button"
                      onClick={() => setAboutExpanded((prev) => !prev)}
                      className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-[color:var(--theme-v-accent)] transition-colors hover:text-[color:var(--theme-v-accent-hover)]"
                    >
                      {aboutExpanded ? (
                        <>
                          <ChevronUp className="h-4 w-4" />
                          Read Less
                        </>
                      ) : (
                        <>
                          <ChevronDown className="h-4 w-4" />
                          Read More
                        </>
                      )}
                    </button>
                  )}
                </>
              )}

              {!mentor?.bio && (
                <p className="mt-4 text-sm text-[color:var(--theme-v-text-placeholder)]">No bio available yet.</p>
              )}
            </div>

            {/* Wisdom Areas */}
            <div className="rounded-2xl bg-[color:var(--theme-v-surface-overlay)] p-4 shadow-sm ring-1 ring-[color:var(--theme-v-border-soft)] sm:p-6">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[color:var(--theme-v-surface-overlay-strong)]">
                  <BookOpen className="h-5 w-5 text-[color:var(--theme-v-accent)]" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-[color:var(--theme-v-text-primary)]">Wisdom Areas</h2>
                  <p className="text-xs text-[color:var(--theme-v-text-secondary)]">Topics this mentor specializes in</p>
                </div>
              </div>

              <div className="mt-5 flex flex-wrap gap-2">
                {(mentor?.areas || []).length > 0 ? (
                  mentor.areas.map((area) => (
                    <span
                      key={area}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-[color:var(--theme-v-surface-overlay-strong)] px-4 py-2.5 text-sm font-medium text-[color:var(--theme-v-accent)] transition-colors hover:bg-[color:var(--theme-v-surface-overlay)]"
                    >
                      <Sparkles className="h-3.5 w-3.5" />
                      {area}
                    </span>
                  ))
                ) : (
                  <span className="text-sm text-[color:var(--theme-v-text-placeholder)]">No areas specified</span>
                )}
              </div>
            </div>

            {/* Availability */}
            <div className="rounded-2xl bg-[color:var(--theme-v-surface-overlay)] p-4 shadow-sm ring-1 ring-[color:var(--theme-v-border-soft)] sm:p-6">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[color:var(--theme-v-surface-overlay-strong)]">
                    <Calendar className="h-5 w-5 text-[color:var(--theme-v-accent)]" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-[color:var(--theme-v-text-primary)]">Availability This Week</h2>
                    <p className="text-xs text-[color:var(--theme-v-text-secondary)]">Click any time slot to book instantly</p>
                  </div>
                </div>
                <div className="inline-flex items-center gap-2 self-start rounded-lg bg-[color:var(--theme-v-surface-overlay-strong)] px-2 py-1.5 ring-1 ring-[color:var(--theme-v-border-soft)] sm:self-auto">
                  <button
                    type="button"
                    onClick={() => setWeekStartKey((prev) => (canGoPrevWeek ? addDaysToDateKey(prev, -7) : prev))}
                    disabled={!canGoPrevWeek}
                    className="inline-flex h-7 w-7 items-center justify-center rounded-md text-[color:var(--theme-v-accent)] transition-colors hover:bg-[color:var(--theme-v-surface-overlay)] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent"
                    aria-label="Previous week"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <span className="text-xs font-semibold text-[color:var(--theme-v-text-primary)]">{weekRangeLabel}</span>
                  <button
                    type="button"
                    onClick={() => setWeekStartKey((prev) => addDaysToDateKey(prev, 7))}
                    className="inline-flex h-7 w-7 items-center justify-center rounded-md text-[color:var(--theme-v-accent)] transition-colors hover:bg-[color:var(--theme-v-surface-overlay)]"
                    aria-label="Next week"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Calendar Grid */}
              <div className="mt-4">
                <div className="space-y-3 md:hidden">
                  {weekColumns.map((column, dayIndex) => {
                    const isTodayColumn = column.dateKey === todayDateKey;
                    const dayNumber = Number(String(column.dateKey || '').split('-')[2] || 0);
                    const daySlots = availabilityByDay[dayIndex] || [];
                    return (
                      <div
                        key={`mobile-${column.dateKey}`}
                        className={`rounded-xl p-3 ring-1 ${isTodayColumn ? 'bg-[color:var(--theme-v-surface-overlay)] ring-[color:var(--theme-v-border-medium)]' : 'bg-[color:var(--theme-v-surface-overlay)] ring-[color:var(--theme-v-border-soft)]'
                          }`}
                      >
                        <div className="mb-3 flex items-center gap-3">
                          <div
                            className={`text-xs font-semibold uppercase tracking-wider ${isTodayColumn ? 'text-[color:var(--theme-v-accent)]' : 'text-[color:var(--theme-v-text-secondary)]'
                              }`}
                          >
                            {column.day}
                          </div>
                          {isTodayColumn ? (
                            <span className="inline-flex h-8 min-w-8 items-center justify-center rounded-[10px] bg-[color:var(--theme-v-accent)] px-2 text-sm font-bold text-[color:var(--theme-v-accent-text)]">
                              {dayNumber || '--'}
                            </span>
                          ) : (
                            <span className="text-sm font-bold text-[color:var(--theme-v-accent)]">{dayNumber || '--'}</span>
                          )}
                        </div>
                        <div className="space-y-2">
                          {daySlots.length > 0 ? (
                            daySlots.map((slot) => {
                              const isSubmitting = bookingSlotKey === `${slot.id}`;
                              const startLabel = getIndiaTimeLabel(slot.startTime, { hour12: true }).toUpperCase();
                              const endLabel = getIndiaTimeLabel(slot.endTime, { hour12: true }).toUpperCase();
                              return (
                                <button
                                  key={`mobile-slot-${column.dateKey}-${slot.id}`}
                                  type="button"
                                  onClick={() => openBookingConfirm(slot)}
                                  disabled={Boolean(bookingSlotKey)}
                                  className={`group flex h-14 w-full items-center justify-between rounded-xl border px-4 transition-all disabled:cursor-not-allowed ${isSubmitting
                                      ? 'border-[color:var(--theme-v-border-hover)] bg-[color:var(--theme-v-accent)] text-[color:var(--theme-v-accent-text)]'
                                      : 'border-[color:var(--theme-v-border-medium)] bg-gradient-to-b from-[color:var(--theme-v-surface-overlay)] to-[color:var(--theme-v-surface-overlay-strong)] text-[color:var(--theme-v-text-primary)] shadow-[0_2px_6px_var(--theme-v-shell-shadow)]'
                                    } ${bookingSlotKey ? 'disabled:opacity-60' : ''}`}
                                >
                                  <span className="text-sm font-bold tracking-wide">{startLabel || '--'}</span>
                                  <span className={`h-px w-8 ${isSubmitting ? 'bg-[color:var(--theme-v-surface-overlay)]/70' : 'bg-[color:var(--theme-v-border-medium)]'}`} />
                                  <span className="text-sm font-bold tracking-wide">{endLabel || '--'}</span>
                                </button>
                              );
                            })
                          ) : (
                            <div className="flex h-12 items-center justify-center rounded-xl border border-dashed border-[color:var(--theme-v-border-soft)] bg-[color:var(--theme-v-surface-overlay-strong)] text-sm font-medium text-[color:var(--theme-v-text-placeholder)]">
                              No slots
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="hidden overflow-x-auto lg:block">
                  <div className="min-w-[620px] rounded-xl bg-[color:var(--theme-v-surface-overlay-strong)] p-3 ring-1 ring-[color:var(--theme-v-border-soft)]">
                    <div className="grid grid-cols-7 gap-2 border-b border-[color:var(--theme-v-border-soft)] pb-3">
                      {weekColumns.map((column) => {
                        const isTodayColumn = column.dateKey === todayDateKey;
                        const dayNumber = Number(String(column.dateKey || '').split('-')[2] || 0);
                        const dayLabel = dayNumber || '--';
                        return (
                          <div
                            key={column.dateKey}
                            className="py-2 text-center"
                          >
                            <div
                              className={`text-xs font-semibold uppercase tracking-wider ${isTodayColumn ? 'text-[color:var(--theme-v-accent)]' : 'text-[color:var(--theme-v-text-secondary)]'
                                }`}
                            >
                              {column.day}
                            </div>
                            {isTodayColumn ? (
                              <div className="mt-1.5 flex justify-center">
                                <span className="inline-flex h-9 min-w-9 items-center justify-center rounded-[12px] bg-[color:var(--theme-v-accent)] px-2 text-[22px] font-bold leading-none text-[color:var(--theme-v-accent-text)] shadow-[0_8px_16px_rgba(93,54,153,0.28)]">
                                  {dayLabel}
                                </span>
                              </div>
                            ) : (
                              <div className="mt-1 text-[22px] font-bold leading-none text-[color:var(--theme-v-accent)]">
                                {dayLabel}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    <div className="mt-3 grid grid-cols-7 gap-2">
                      {weekColumns.map((column, dayIndex) => {
                        const isTodayColumn = column.dateKey === todayDateKey;
                        return (
                          <div
                            key={column.dateKey}
                            className={`space-y-2 rounded-xl p-1.5 ${isTodayColumn ? 'bg-[color:var(--theme-v-surface-overlay)] ring-1 ring-[color:var(--theme-v-border-medium)]' : ''
                              }`}
                          >
                            {Array.from({ length: maxSlotRows }).map((_, rowIndex) => {
                              const slot = availabilityByDay[dayIndex]?.[rowIndex] || null;
                              if (!slot) {
                                return (
                                  <div
                                    key={`${column.dateKey}-empty-${rowIndex}`}
                                    className={`flex h-16 items-center justify-center rounded-xl border border-dashed text-sm font-semibold ${isTodayColumn
                                        ? 'border-[color:var(--theme-v-border-soft)] bg-[color:var(--theme-v-surface-overlay)]/75 text-[color:var(--theme-v-text-placeholder)]'
                                        : 'border-[color:var(--theme-v-border-soft)] bg-[color:var(--theme-v-surface-overlay)] text-[color:var(--theme-v-text-placeholder)]'
                                      }`}
                                  >
                                    --
                                  </div>
                                );
                              }
                              const isSubmitting = bookingSlotKey === `${slot.id}`;
                              const isBookable = slot?.isAvailable !== false;
                              const startLabel = getIndiaTimeLabel(slot.startTime, { hour12: true }).toUpperCase();
                              const endLabel = getIndiaTimeLabel(slot.endTime, { hour12: true }).toUpperCase();
                              return (
                                <button
                                  key={`${column.dateKey}-${slot.id}-${rowIndex}`}
                                  type="button"
                                  onClick={() => openBookingConfirm(slot)}
                                  disabled={Boolean(bookingSlotKey) || !isBookable}
                                  className={`group relative flex h-16 w-full items-center justify-center rounded-xl border px-2 transition-all disabled:cursor-not-allowed ${isBookable
                                      ? 'border-[color:var(--theme-v-border-medium)] bg-gradient-to-b from-[color:var(--theme-v-surface-overlay)] to-[color:var(--theme-v-surface-overlay-strong)] text-[color:var(--theme-v-text-primary)] shadow-[0_2px_6px_var(--theme-v-shell-shadow)] hover:-translate-y-[1px] hover:border-[color:var(--theme-v-border-hover)] hover:bg-[color:var(--theme-v-surface-overlay)]'
                                      : 'border-[color:var(--theme-v-border-soft)] bg-[color:var(--theme-v-surface-overlay-track)] text-[color:var(--theme-v-text-placeholder)] opacity-70'
                                    } ${bookingSlotKey ? 'disabled:opacity-60' : ''}`}
                                >
                                  {isSubmitting ? (
                                    <span className="text-[12px] font-semibold">Booking...</span>
                                  ) : (
                                    <span className="flex w-full flex-col items-center leading-none">
                                      <span className="text-[12px] font-bold tracking-wide">{startLabel || '--'}</span>
                                      <span
                                        className={`my-1 h-px w-10 ${isBookable ? 'bg-[color:var(--theme-v-border-medium)] group-hover:bg-[color:var(--theme-v-surface-overlay)]/60' : 'bg-[color:var(--theme-v-border-soft)]'
                                          }`}
                                      />
                                      <span className="text-[12px] font-bold tracking-wide">{endLabel || '--'}</span>
                                    </span>
                                  )}
                                </button>
                              );
                            })}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
              {bookingError ? (
                <div className="mt-3 rounded-lg bg-[color:var(--theme-v-toast-error-bg)] px-3 py-2 text-xs text-[color:var(--theme-v-toast-error-text)] ring-1 ring-[color:var(--theme-v-toast-error-border)]">
                  {bookingError}
                </div>
              ) : null}
            </div>


            {/* Reviews Section */}
            <div className="rounded-2xl bg-[color:var(--theme-v-surface-overlay)] p-4 shadow-sm ring-1 ring-[color:var(--theme-v-border-soft)] sm:p-6">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[color:var(--theme-v-surface-overlay-strong)]">
                  <MessageCircle className="h-5 w-5 text-[color:var(--theme-v-accent)]" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-[color:var(--theme-v-text-primary)]">What Mentees Say</h2>
                  <p className="text-xs text-[color:var(--theme-v-text-secondary)]">Feedback from previous sessions</p>
                </div>
              </div>

              {/* Review Card */}
              <div className="mt-6">
                {review?.comments ? (
                  <div className="rounded-xl bg-[color:var(--theme-v-surface-overlay-strong)] p-5 ring-1 ring-[color:var(--theme-v-border-soft)]">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[color:var(--theme-v-accent)]/10">
                          <User className="h-5 w-5 text-[color:var(--theme-v-accent)]" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-[color:var(--theme-v-text-primary)]">Anonymous Mentee</p>
                          <p className="text-xs text-[color:var(--theme-v-text-secondary)]">Verified Session</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-0.5">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`h-4 w-4 ${i < (review?.rating || 0)
                                ? 'fill-[color:var(--theme-v-accent)] text-[color:var(--theme-v-accent)]'
                                : 'text-white/30'
                              }`}
                          />
                        ))}
                      </div>
                    </div>
                    <div className="mt-4 flex gap-2">
                      <Quote className="h-5 w-5 flex-shrink-0 text-[color:var(--theme-v-text-placeholder)]" />
                      <p className="text-sm leading-relaxed text-[color:var(--theme-v-text-secondary)]">{review.comments}</p>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center rounded-xl bg-[color:var(--theme-v-surface-overlay-strong)] py-12 text-center">
                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[color:var(--theme-v-surface-overlay-strong)]">
                      <MessageCircle className="h-7 w-7 text-[color:var(--theme-v-text-placeholder)]" />
                    </div>
                    <p className="mt-4 text-sm font-medium text-[color:var(--theme-v-text-primary)]">No reviews yet</p>
                    <p className="mt-1 text-xs text-[color:var(--theme-v-text-secondary)]">
                      Be the first to leave feedback after your session
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* CTA Card */}
            <div className="rounded-2xl bg-[color:var(--theme-v-accent)] p-6 text-[color:var(--theme-v-accent-text)] shadow-lg shadow-[0_12px_24px_-18px_var(--theme-v-shell-shadow)]">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h3 className="text-lg font-semibold">Ready to connect?</h3>
                  <p className="mt-1 text-sm text-[color:var(--theme-v-accent-text)]/85">
                    Book a session with {displayName} today
                  </p>
                </div>
                <Link
                  to={`/book-session?mentorId=${mentor?.id || ''}`}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[color:var(--theme-v-text-primary)] px-6 py-3 text-sm font-semibold text-[color:var(--theme-v-accent-text)] shadow-sm transition-all hover:bg-[color:var(--theme-v-back-btn-hover)] sm:w-auto"
                >
                  <Calendar className="h-5 w-5" />
                  Schedule Session
                </Link>
              </div>
            </div>
          </section>
        </div>
      </div>
      {confirmSlot ? (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-[color:var(--theme-v-surface-overlay)] p-5 shadow-xl ring-1 ring-[color:var(--theme-v-border-soft)] sm:p-6">
            <h3 className="text-lg font-semibold text-[color:var(--theme-v-text-primary)]">Book This Session?</h3>
            <p className="mt-2 text-sm text-[color:var(--theme-v-text-secondary)]">
              Do you want to book this session? A request will be sent to the mentor.
            </p>
            <div className="mt-4 rounded-xl bg-[color:var(--theme-v-surface-overlay-strong)] p-3 text-sm ring-1 ring-[color:var(--theme-v-border-soft)]">
              <div className="font-semibold text-[color:var(--theme-v-text-primary)]">{displayName}</div>
              <div className="mt-1 text-[color:var(--theme-v-text-secondary)]">
                {indiaDateKeyToLabel(formatIndiaDateKey(confirmSlot.startTime), {
                  weekday: 'long',
                  month: 'short',
                  day: 'numeric',
                }) || '--'}
              </div>
              <div className="text-[color:var(--theme-v-accent)]">{confirmSlot.label}</div>
            </div>
            <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={closeBookingConfirm}
                disabled={Boolean(bookingSlotKey)}
                className="inline-flex items-center justify-center rounded-xl border border-[color:var(--theme-v-border-soft)] px-4 py-2 text-sm font-medium text-[color:var(--theme-v-text-primary)] transition-colors hover:bg-[color:var(--theme-v-surface-overlay-strong)] disabled:cursor-not-allowed disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleBookSlot}
                disabled={Boolean(bookingSlotKey)}
                className="inline-flex items-center justify-center rounded-xl bg-[color:var(--theme-v-accent)] px-4 py-2 text-sm font-semibold text-[color:var(--theme-v-accent-text)] transition-colors hover:bg-[color:var(--theme-v-accent-hover)] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {bookingSlotKey ? 'Sending...' : 'Send Request'}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default MentorProfile;

