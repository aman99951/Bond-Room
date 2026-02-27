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
  Calendar,
  Clock,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Award,
  Globe,
  BookOpen,
  MessageCircle,
  Sparkles,
  User,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  Quote
} from 'lucide-react';

const CALENDAR_DAYS = 7;

const MentorDetails = () => {
  const navigate = useNavigate();
  const { mentor, availabilitySlots, review, reviews, loading, error } = useMentorScreenData();
  const mentorIdSuffix = mentor?.id ? `?mentorId=${mentor.id}` : '';
  const rating = mentor?.rating != null ? Number(mentor.rating).toFixed(1) : '';
  const reviewCount = mentor?.reviews != null ? Number(mentor.reviews) : null;
  const reviewList = Array.isArray(reviews) ? reviews.slice(0, 3) : [];
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
  <div className="min-h-screen bg-transparent p-3 sm:p-5 lg:p-8">
    <div className="mx-auto max-w-6xl">
      {/* Back Link */}
      <Link
        to="/mentors"
        className="mb-4 inline-flex items-center gap-2 text-sm text-[#6b7280] transition-colors hover:text-[#5D3699] sm:mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to recommendations
      </Link>

      {/* Main Grid */}
      <div className="grid gap-5 lg:gap-6 xl:grid-cols-[320px_minmax(0,1fr)]">
        {/* Left Sidebar - Mentor Card */}
        <div className="space-y-5 xl:sticky xl:top-6 xl:self-start">
          <aside className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-[#e5e7eb]">
            {/* Header Background */}
            <div className="relative h-24 bg-[#5D3699]">
              <div className="absolute inset-0 opacity-20">
                <div className="absolute inset-0" style={{
                  backgroundImage: 'radial-gradient(circle at 20% 50%, rgba(255,255,255,0.3) 0%, transparent 50%), radial-gradient(circle at 80% 50%, rgba(255,255,255,0.2) 0%, transparent 50%)'
                }} />
              </div>
            </div>

            {/* Avatar & Info */}
            <div className="px-4 pb-5 sm:px-6 sm:pb-6">
              <div className="-mt-12 flex flex-col items-center text-center">
                {/* Avatar */}
                <div className="relative">
                  <div className="h-24 w-24 overflow-hidden rounded-2xl bg-white ring-4 ring-white shadow-lg">
                    {mentor?.avatar ? (
                      <img
                        src={mentor.avatar}
                        alt={displayName}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-[#f5f3ff]">
                        <User className="h-10 w-10 text-[#5D3699]" />
                      </div>
                    )}
                  </div>
                  {/* Verified Badge */}
                  <div className="absolute -bottom-2 -right-2 flex h-8 w-8 items-center justify-center rounded-full bg-[#10b981] ring-2 ring-white">
                    <CheckCircle2 className="h-4 w-4 text-white" />
                  </div>
                </div>

                {/* Name */}
                <h1 className="mt-4 text-xl font-bold text-[#111827] sm:text-2xl">
                  {displayName}
                </h1>

                {/* Location */}
                {mentor?.location && (
                  <div className="mt-1 flex items-center gap-1.5 text-sm text-[#6b7280]">
                    <MapPin className="h-4 w-4" />
                    <span>{mentor.location}</span>
                  </div>
                )}

                {/* Qualification Badge */}
                {mentor?.qualification && (
                  <div className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-[#ecfdf3] px-3 py-1.5 text-xs font-semibold text-[#10b981]">
                    <Award className="h-3.5 w-3.5" />
                    {mentor.qualification}
                  </div>
                )}

                {/* Languages */}
                {(mentor?.languages || []).length > 0 && (
                  <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
                    {mentor.languages.map((language) => (
                      <span
                        key={language}
                        className="inline-flex items-center gap-1 rounded-full bg-[#f5f3ff] px-3 py-1 text-xs font-medium text-[#5D3699]"
                      >
                        <Globe className="h-3 w-3" />
                        {language}
                      </span>
                    ))}
                  </div>
                )}

                {/* Rating */}
                {(rating || reviewCount != null) && (
                  <div className="mt-4 flex w-full items-center justify-center gap-3 rounded-xl bg-[#f8fafc] px-4 py-3">
                    <div className="flex items-center gap-1">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`h-5 w-5 ${
                            i < Math.floor(rating || 0)
                              ? 'fill-[#f59e0b] text-[#f59e0b]'
                              : 'text-[#e5e7eb]'
                          }`}
                        />
                      ))}
                    </div>
                    <div className="flex items-baseline gap-1">
                      <span className="text-lg font-bold text-[#111827]">{rating}</span>
                      {reviewCount != null && (
                        <span className="text-sm text-[#6b7280]">({reviewCount})</span>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* CTA Button */}
              <Link
                to={`/book-session${mentorIdSuffix}`}
                className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-[#5D3699] px-5 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:bg-[#4a2b7a] hover:shadow-md"
              >
                <Calendar className="h-5 w-5" />
                Schedule Session
              </Link>

              {/* AI Matched Areas */}
              {Array.isArray(mentor?.areas) && mentor.areas.length > 0 && (
                <div className="mt-6 rounded-xl bg-[#f5f3ff] p-4">
                  <div className="flex items-center justify-center gap-2 text-xs font-medium text-[#5D3699]">
                    <Sparkles className="h-4 w-4" />
                    AI Matched For
                  </div>
                  <div className="mt-3 flex flex-wrap justify-center gap-2">
                    {mentor.areas.map((area) => (
                      <span
                        key={area}
                        className="rounded-full bg-white px-3 py-1 text-xs font-medium text-[#5D3699] ring-1 ring-[#5D3699]/20"
                      >
                        {area}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </aside>

          {/* Quick Contact Card */}
          <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-[#e5e7eb] sm:p-5">
            <h3 className="text-sm font-semibold text-[#111827]">Quick Info</h3>
            <div className="mt-4 space-y-3">
              <div className="flex items-center gap-3 text-sm text-[#6b7280]">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#f5f3ff]">
                  <Clock className="h-4 w-4 text-[#5D3699]" />
                </div>
                <span>Usually responds within 24h</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-[#6b7280]">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-50">
                  <CheckCircle2 className="h-4 w-4 text-[#10b981]" />
                </div>
                <span>Available this week</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Section - Details */}
        <section className="space-y-5 sm:space-y-6">
          {/* Loading/Error State */}
          {(loading || error) && (
            <div className={`flex items-center gap-3 rounded-xl p-4 ${
              error ? 'bg-red-50 ring-1 ring-red-100' : 'bg-white ring-1 ring-[#e5e7eb]'
            }`}>
              {loading && (
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-[#e5e7eb] border-t-[#5D3699]" />
              )}
              <span className={`text-sm ${error ? 'text-red-600' : 'text-[#6b7280]'}`}>
                {error || 'Loading mentor details...'}
              </span>
            </div>
          )}

          {/* About Section */}
          <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-[#e5e7eb] sm:p-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#f5f3ff]">
                <User className="h-5 w-5 text-[#5D3699]" />
              </div>
              <h2 className="text-lg font-semibold text-[#111827]">About the Mentor</h2>
            </div>

            {mentor?.bio && (
              <>
                <p
                  ref={aboutRef}
                  className={`mt-4 text-[#6b7280] leading-relaxed ${
                    aboutExpanded ? '' : 'line-clamp-4'
                  }`}
                >
                  {mentor.bio}
                </p>
                {showReadMore && (
                  <button
                    type="button"
                    onClick={() => setAboutExpanded((prev) => !prev)}
                    className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-[#5D3699] transition-colors hover:text-[#4a2b7a]"
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
          </div>

          {/* Wisdom Areas */}
          <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-[#e5e7eb] sm:p-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#f5f3ff]">
                <BookOpen className="h-5 w-5 text-[#5D3699]" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-[#111827]">Wisdom Areas</h2>
                <p className="text-xs text-[#6b7280]">Topics this mentor specializes in</p>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {(mentor?.areas || []).map((area) => (
                <span
                  key={area}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-[#f5f3ff] px-4 py-2 text-sm font-medium text-[#5D3699] transition-colors hover:bg-[#ede9fe]"
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  {area}
                </span>
              ))}
              {(!mentor?.areas || mentor.areas.length === 0) && (
                <span className="text-sm text-[#9ca3af]">No areas specified</span>
              )}
            </div>
          </div>

          {/* Availability */}
          <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-[#e5e7eb] sm:p-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#f5f3ff]">
                  <Calendar className="h-5 w-5 text-[#5D3699]" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-[#111827]">Availability This Week</h2>
                  <p className="text-xs text-[#6b7280]">Click any time slot to book instantly</p>
                </div>
              </div>
              <div className="inline-flex items-center gap-2 self-start rounded-lg bg-[#f8fafc] px-2 py-1.5 ring-1 ring-[#e5e7eb] sm:self-auto">
                <button
                  type="button"
                  onClick={() => setWeekStartKey((prev) => (canGoPrevWeek ? addDaysToDateKey(prev, -7) : prev))}
                  disabled={!canGoPrevWeek}
                  className="inline-flex h-7 w-7 items-center justify-center rounded-md text-[#5D3699] transition-colors hover:bg-[#ede9fe] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent"
                  aria-label="Previous week"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <span className="text-xs font-semibold text-[#374151]">{weekRangeLabel}</span>
                <button
                  type="button"
                  onClick={() => setWeekStartKey((prev) => addDaysToDateKey(prev, 7))}
                  className="inline-flex h-7 w-7 items-center justify-center rounded-md text-[#5D3699] transition-colors hover:bg-[#ede9fe]"
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
                      className={`rounded-xl p-3 ring-1 ${
                        isTodayColumn ? 'bg-[#f5f0ff] ring-[#dfd2f6]' : 'bg-white ring-[#e5e7eb]'
                      }`}
                    >
                      <div className="mb-3 flex items-center gap-3">
                        <div
                          className={`text-xs font-semibold uppercase tracking-wider ${
                            isTodayColumn ? 'text-[#5D3699]' : 'text-[#6b7280]'
                          }`}
                        >
                          {column.day}
                        </div>
                        {isTodayColumn ? (
                          <span className="inline-flex h-8 min-w-8 items-center justify-center rounded-[10px] bg-[#5D3699] px-2 text-sm font-bold text-white">
                            {dayNumber || '--'}
                          </span>
                        ) : (
                          <span className="text-sm font-bold text-[#5D3699]">{dayNumber || '--'}</span>
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
                                className={`group flex h-14 w-full items-center justify-between rounded-xl border px-4 transition-all disabled:cursor-not-allowed ${
                                  isSubmitting
                                    ? 'border-[#5D3699] bg-[#5D3699] text-white'
                                    : 'border-[#cfb9ef] bg-gradient-to-b from-white to-[#f7f1ff] text-[#4a2b7a] shadow-[0_2px_6px_rgba(93,54,153,0.1)]'
                                } ${bookingSlotKey ? 'disabled:opacity-60' : ''}`}
                              >
                                <span className="text-sm font-bold tracking-wide">{startLabel || '--'}</span>
                                <span className={`h-px w-8 ${isSubmitting ? 'bg-white/70' : 'bg-[#d5c3f1]'}`} />
                                <span className="text-sm font-bold tracking-wide">{endLabel || '--'}</span>
                              </button>
                            );
                          })
                        ) : (
                          <div className="flex h-12 items-center justify-center rounded-xl border border-dashed border-[#e5e7eb] bg-[#f9fafb] text-sm font-medium text-[#9ca3af]">
                            No slots
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="hidden overflow-x-auto md:block">
                <div className="min-w-[700px] rounded-xl bg-[#f8fafc] p-3 ring-1 ring-[#e5e7eb]">
                  <div className="grid grid-cols-7 gap-2 border-b border-[#e5e7eb] pb-3">
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
                            className={`text-xs font-semibold uppercase tracking-wider ${
                              isTodayColumn ? 'text-[#5D3699]' : 'text-[#6b7280]'
                            }`}
                          >
                            {column.day}
                          </div>
                          {isTodayColumn ? (
                            <div className="mt-1.5 flex justify-center">
                              <span className="inline-flex h-9 min-w-9 items-center justify-center rounded-[12px] bg-[#5D3699] px-2 text-[22px] font-bold leading-none text-white shadow-[0_8px_16px_rgba(93,54,153,0.28)]">
                                {dayLabel}
                              </span>
                            </div>
                          ) : (
                            <div className="mt-1 text-[22px] font-bold leading-none text-[#5D3699]">
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
                          className={`space-y-2 rounded-xl p-1.5 ${
                            isTodayColumn ? 'bg-[#f5f0ff] ring-1 ring-[#e0d2f7]' : ''
                          }`}
                        >
                          {Array.from({ length: maxSlotRows }).map((_, rowIndex) => {
                            const slot = availabilityByDay[dayIndex]?.[rowIndex] || null;
                            if (!slot) {
                              return (
                                <div
                                  key={`${column.dateKey}-empty-${rowIndex}`}
                                  className={`flex h-16 items-center justify-center rounded-xl border border-dashed text-sm font-semibold ${
                                    isTodayColumn
                                      ? 'border-[#dfd2f6] bg-white/75 text-[#b2a4ca]'
                                      : 'border-[#e5e7eb] bg-white text-[#9ca3af]'
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
                                className={`group relative flex h-16 w-full items-center justify-center rounded-xl border px-2 transition-all disabled:cursor-not-allowed ${
                                  isBookable
                                    ? 'border-[#cfb9ef] bg-gradient-to-b from-white to-[#f7f1ff] text-[#4a2b7a] shadow-[0_2px_6px_rgba(93,54,153,0.1)] hover:-translate-y-[1px] hover:border-[#5D3699] hover:from-[#6f49af] hover:to-[#5D3699] hover:text-white hover:shadow-[0_10px_20px_rgba(93,54,153,0.28)]'
                                    : 'border-[#e5e7eb] bg-[#f3f4f6] text-[#9ca3af] opacity-70'
                                } ${bookingSlotKey ? 'disabled:opacity-60' : ''}`}
                              >
                                {isSubmitting ? (
                                  <span className="text-[12px] font-semibold">Booking...</span>
                                ) : (
                                  <span className="flex w-full flex-col items-center leading-none">
                                    <span className="text-[12px] font-bold tracking-wide">{startLabel || '--'}</span>
                                    <span
                                      className={`my-1 h-px w-10 ${
                                        isBookable ? 'bg-[#d5c3f1] group-hover:bg-white/60' : 'bg-[#d1d5db]'
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
              <div className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700 ring-1 ring-red-100">
                {bookingError}
              </div>
            ) : null}
          </div>

          {/* Reviews Section */}
          <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-[#e5e7eb] sm:p-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#f5f3ff]">
                <MessageCircle className="h-5 w-5 text-[#5D3699]" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-[#111827]">What Mentees Say</h2>
                <p className="text-xs text-[#6b7280]">Feedback from previous sessions</p>
              </div>
            </div>

            {/* Reviews List */}
            <div className="mt-6 space-y-4">
              {reviewList.length > 0 ? (
                reviewList.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-xl bg-[#f8fafc] p-4 ring-1 ring-[#e5e7eb]"
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#5D3699]/10">
                          <User className="h-5 w-5 text-[#5D3699]" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-[#111827]">Anonymous Mentee</p>
                          <p className="text-xs text-[#6b7280]">Verified Session</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-0.5">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`h-4 w-4 ${
                              i < Math.floor(item?.rating || 0)
                                ? 'fill-[#f59e0b] text-[#f59e0b]'
                                : 'text-[#e5e7eb]'
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                    {item?.comments ? (
                      <div className="mt-3 flex gap-2">
                        <Quote className="h-4 w-4 flex-shrink-0 text-[#9ca3af]" />
                        <p className="text-sm leading-relaxed text-[#6b7280]">
                          {item.comments}
                        </p>
                      </div>
                    ) : (
                      <p className="mt-3 text-sm text-[#9ca3af] italic">
                        No comment provided
                      </p>
                    )}
                  </div>
                ))
              ) : review?.comments ? (
                <div className="rounded-xl bg-[#f8fafc] p-4 ring-1 ring-[#e5e7eb]">
                  <div className="flex items-center gap-0.5">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`h-4 w-4 ${
                          i < Math.floor(review?.rating || 0)
                            ? 'fill-[#f59e0b] text-[#f59e0b]'
                            : 'text-[#e5e7eb]'
                        }`}
                      />
                    ))}
                  </div>
                  <div className="mt-3 flex gap-2">
                    <Quote className="h-4 w-4 flex-shrink-0 text-[#9ca3af]" />
                    <p className="text-sm leading-relaxed text-[#6b7280]">
                      {review.comments}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center rounded-xl bg-[#f8fafc] py-12 text-center">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#f5f3ff]">
                    <MessageCircle className="h-7 w-7 text-[#9ca3af]" />
                  </div>
                  <p className="mt-4 text-sm font-medium text-[#111827]">No reviews yet</p>
                  <p className="mt-1 text-xs text-[#6b7280]">
                    Be the first to leave feedback after your session
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* CTA Card */}
          <div className="rounded-2xl bg-[#5D3699] p-4 text-white shadow-lg shadow-[#5D3699]/20 sm:p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="text-lg font-semibold">Ready to connect?</h3>
                <p className="mt-1 text-sm text-white/80">
                  Book a session with {displayName} today
                </p>
              </div>
              <Link
                to={`/book-session${mentorIdSuffix}`}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-white px-6 py-3 text-sm font-semibold text-[#5D3699] transition-all hover:bg-[#f5f3ff] sm:w-auto"
              >
                <Calendar className="h-5 w-5" />
                Schedule Now
              </Link>
            </div>
          </div>
        </section>
      </div>
    </div>
    {confirmSlot ? (
      <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/50 p-4">
        <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-xl ring-1 ring-[#e5e7eb] sm:p-6">
          <h3 className="text-lg font-semibold text-[#111827]">Book This Session?</h3>
          <p className="mt-2 text-sm text-[#4b5563]">
            Do you want to book this session? A request will be sent to the mentor.
          </p>
          <div className="mt-4 rounded-xl bg-[#f8fafc] p-3 text-sm ring-1 ring-[#e5e7eb]">
            <div className="font-semibold text-[#111827]">{displayName}</div>
            <div className="mt-1 text-[#6b7280]">
              {indiaDateKeyToLabel(formatIndiaDateKey(confirmSlot.startTime), {
                weekday: 'long',
                month: 'short',
                day: 'numeric',
              }) || '--'}
            </div>
            <div className="text-[#5D3699]">{confirmSlot.label}</div>
          </div>
          <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={closeBookingConfirm}
              disabled={Boolean(bookingSlotKey)}
              className="inline-flex items-center justify-center rounded-xl border border-[#d1d5db] px-4 py-2 text-sm font-medium text-[#374151] transition-colors hover:bg-[#f9fafb] disabled:cursor-not-allowed disabled:opacity-60"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleBookSlot}
              disabled={Boolean(bookingSlotKey)}
              className="inline-flex items-center justify-center rounded-xl bg-[#5D3699] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#4a2b7a] disabled:cursor-not-allowed disabled:opacity-60"
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

export default MentorDetails;
