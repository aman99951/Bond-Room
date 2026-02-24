import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { menteeApi } from '../../../apis/api/menteeApi';
import { getSelectedMentorId, setLastBooking, setSelectedMentorId } from '../../../apis/api/storage';
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
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const formatTimeInZone = (value, timeZone = '') => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: timeZone || undefined,
  });
};

const formatTimeRangeInZone = (start, end, timeZone = '') => {
  const startLabel = formatTimeInZone(start, timeZone);
  const endLabel = formatTimeInZone(end, timeZone);
  if (!startLabel && !endLabel) return '';
  if (!startLabel) return endLabel;
  if (!endLabel) return startLabel;
  return `${startLabel} - ${endLabel}`;
};

const formatDateLabel = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'No date selected';
  return date.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' });
};

const mapAvailabilitySlots = (payload) =>
  normalizeList(payload)
    .filter((slot) => slot?.is_available !== false)
    .map((slot) => ({
      ...slot,
      dateKey: toDateKey(slot.start_time),
      label: formatTimeRangeInZone(slot.start_time, slot.end_time, slot.timezone),
    }))
    .filter((slot) => slot.dateKey && slot.label)
    .sort((a, b) => new Date(a.start_time) - new Date(b.start_time));

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
            const firstDate = new Date(availableSlots[0].start_time);
            setMonthDate(new Date(firstDate.getFullYear(), firstDate.getMonth(), 1));
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
    const date = new Date(monthDate.getFullYear(), monthDate.getMonth(), Number(dayValue));
    const dateKey = toDateKey(date);
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
        timezone: selectedSlot.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone || '',
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
  <div className="min-h-screen bg-transparent p-4 sm:p-6 lg:p-8">
    <div className="mx-auto max-w-full">
      {/* Back Link */}
      <Link
        to="/mentors"
        className="mb-6 inline-flex items-center gap-2 text-sm text-[#6b7280] transition-colors hover:text-[#5D3699]"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Mentors
      </Link>

      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#5D3699] shadow-lg shadow-[#5D3699]/20">
            <Calendar className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-[#111827] sm:text-2xl">
              {mentor?.name ? `Book with ${mentor.name}` : 'Book Session'}
            </h1>
            <p className="mt-0.5 text-sm text-[#6b7280]">
              Select a date and time that works for you
            </p>
          </div>
        </div>

        {/* Safety Badge */}
        <div className="inline-flex items-center gap-2 self-start rounded-full bg-[#ecfdf3] px-4 py-2 ring-1 ring-[#10b981]/20">
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[#10b981]">
            <Shield className="h-3.5 w-3.5 text-white" />
          </div>
          <span className="text-xs font-medium text-[#10b981]">
            Sessions are monitored for safety
          </span>
        </div>
      </div>

      {/* Main Card */}
      <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-[#e5e7eb]">
        <div className="flex flex-col lg:grid lg:grid-cols-[360px_1fr]">
          {/* Left Sidebar - Mentor Info */}
          <aside className="border-b border-[#e5e7eb] bg-[#f8fafc] p-6 lg:border-b-0 lg:border-r lg:p-8">
            {/* Mentor Header */}
            <div className="flex items-center gap-4">
              <div className="relative flex-shrink-0">
                <div className="h-16 w-16 overflow-hidden rounded-xl bg-[#f5f3ff] ring-2 ring-white shadow-md">
                  {mentor?.avatar ? (
                    <img
                      src={mentor.avatar}
                      alt={mentor?.name || 'Mentor'}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center">
                      <User className="h-8 w-8 text-[#5D3699]" />
                    </div>
                  )}
                </div>
                {/* Online indicator */}
                <div className="absolute -bottom-1 -right-1 h-5 w-5 rounded-full border-2 border-white bg-[#10b981]" />
              </div>
              <div className="min-w-0">
                <h2 className="text-lg font-bold text-[#111827] truncate">
                  {mentor?.name || 'Mentor'}
                </h2>
                {mentor?.location && (
                  <div className="mt-0.5 flex items-center gap-1.5 text-sm text-[#6b7280]">
                    <MapPin className="h-3.5 w-3.5" />
                    <span className="truncate">{mentor.location}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Stats */}
            <div className="mt-6 flex items-center gap-4 rounded-xl bg-white p-4 ring-1 ring-[#e5e7eb]">
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-0.5">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`h-4 w-4 ${
                        i < Math.floor(mentor?.rating || 0)
                          ? 'fill-[#f59e0b] text-[#f59e0b]'
                          : 'text-[#e5e7eb]'
                      }`}
                    />
                  ))}
                </div>
                <span className="text-sm font-bold text-[#111827]">
                  {mentor?.rating !== null && mentor?.rating !== undefined
                    ? Number(mentor.rating).toFixed(1)
                    : '--'}
                </span>
              </div>
              <div className="h-4 w-px bg-[#e5e7eb]" />
              <div className="flex items-center gap-1 text-sm text-[#6b7280]">
                <MessageCircle className="h-3.5 w-3.5" />
                <span>{mentor?.reviews ?? 0}</span>
              </div>
              <div className="h-4 w-px bg-[#e5e7eb]" />
              <div className="flex items-center gap-1 text-sm text-[#6b7280]">
                <Video className="h-3.5 w-3.5" />
                <span className="font-semibold text-[#111827]">{mentor?.sessions ?? 0}</span>
              </div>
            </div>

            {/* Expertise */}
            <div className="mt-6">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#6b7280]">
                <BookOpen className="h-4 w-4" />
                Expertise
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {(mentor?.expertise || []).map((t) => (
                  <span
                    key={t}
                    className="inline-flex items-center rounded-full bg-[#f5f3ff] px-3 py-1.5 text-xs font-medium text-[#5D3699]"
                  >
                    {t}
                  </span>
                ))}
                {!mentor?.expertise?.length && (
                  <span className="text-xs text-[#9ca3af]">Not specified</span>
                )}
              </div>
            </div>

            {/* Languages */}
            <div className="mt-6">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#6b7280]">
                <Globe className="h-4 w-4" />
                Languages
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {(mentor?.languages || []).map((t) => (
                  <span
                    key={t}
                    className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-xs font-medium text-[#6b7280] ring-1 ring-[#e5e7eb]"
                  >
                    <Globe className="h-3 w-3" />
                    {t}
                  </span>
                ))}
                {!mentor?.languages?.length && (
                  <span className="text-xs text-[#9ca3af]">Not specified</span>
                )}
              </div>
            </div>

            {/* Bio */}
            <div className="mt-6">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#6b7280]">
                <Sparkles className="h-4 w-4" />
                My Story
              </div>
              <div className="mt-3 rounded-xl bg-white p-4 ring-1 ring-[#e5e7eb]">
                <p className="text-sm italic leading-relaxed text-[#6b7280]">
                  "{mentor?.bio || 'Bio not provided yet.'}"
                </p>
                <button
                  type="button"
                  className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-[#5D3699] hover:underline"
                >
                  Read full bio
                  <ChevronRight className="h-3 w-3" />
                </button>
              </div>
            </div>
          </aside>

          {/* Right Section - Calendar & Time Slots */}
          <div className="p-6 lg:p-8">
            <div className="grid gap-6 lg:grid-cols-[1fr_240px] lg:gap-8">
              {/* Calendar */}
              <section>
                {/* Month Navigation */}
                <div className="mb-6 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => handleMonthChange(-1)}
                    className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#f5f3ff] text-[#5D3699] transition-colors hover:bg-[#ede9fe]"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  <h2 className="text-lg font-semibold text-[#111827]">
                    {monthLabel}
                  </h2>
                  <button
                    type="button"
                    onClick={() => handleMonthChange(1)}
                    className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#f5f3ff] text-[#5D3699] transition-colors hover:bg-[#ede9fe]"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>
                </div>

                {/* Calendar Grid */}
                <div className="rounded-xl bg-[#f8fafc] p-4 ring-1 ring-[#e5e7eb]">
                  {/* Days Header */}
                  <div className="mb-3 grid grid-cols-7 gap-2">
                    {days.map((d) => (
                      <div
                        key={d}
                        className="text-center text-xs font-semibold uppercase tracking-wider text-[#9ca3af]"
                      >
                        {d}
                      </div>
                    ))}
                  </div>

                  {/* Dates Grid */}
                  <div className="grid grid-cols-7 gap-2">
                    {dates.map((d, i) => {
                      const isEmpty = d === '';
                      const dateValue = d
                        ? new Date(monthDate.getFullYear(), monthDate.getMonth(), Number(d))
                        : null;
                      const dateKey = dateValue ? toDateKey(dateValue) : '';
                      const isSelected = Boolean(dateKey) && dateKey === selectedDateKey;
                      const isUnavailable = Boolean(dateKey) && !availableDateSet.has(dateKey);
                      const isToday = dateKey === toDateKey(new Date());

                      return (
                        <button
                          key={`${d}-${i}`}
                          type="button"
                          onClick={() => !isEmpty && !isUnavailable && handleDateSelect(d)}
                          disabled={isEmpty || isUnavailable}
                          className={`
                            relative flex h-10 w-10 items-center justify-center rounded-xl text-sm font-medium transition-all
                            ${isEmpty ? 'cursor-default' : ''}
                            ${isSelected
                              ? 'bg-[#5D3699] text-white shadow-md shadow-[#5D3699]/30'
                              : ''
                            }
                            ${!isEmpty && !isSelected && !isUnavailable
                              ? 'bg-white text-[#111827] ring-1 ring-[#e5e7eb] hover:ring-[#5D3699] hover:bg-[#f5f3ff]'
                              : ''
                            }
                            ${isUnavailable
                              ? 'cursor-not-allowed bg-transparent text-[#d1d5db]'
                              : ''
                            }
                            ${isToday && !isSelected
                              ? 'ring-2 ring-[#5D3699]/30'
                              : ''
                            }
                          `}
                        >
                          {d || ''}
                          {isToday && !isSelected && (
                            <span className="absolute -bottom-1 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-[#5D3699]" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Legend */}
                <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-[#6b7280]">
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full bg-[#5D3699]" />
                    <span>Selected</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full bg-white ring-1 ring-[#e5e7eb]" />
                    <span>Available</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full bg-[#f5f3ff]" />
                    <span>Unavailable</span>
                  </div>
                </div>
              </section>

              {/* Time Slots */}
              <aside className="border-t border-[#e5e7eb] pt-6 lg:border-l lg:border-t-0 lg:pl-6 lg:pt-0">
                <div className="flex items-center gap-2">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#f5f3ff]">
                    <Clock className="h-5 w-5 text-[#5D3699]" />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-[#111827]">
                      Available Times
                    </h3>
                    <p className="text-xs text-[#6b7280]">
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
                          className={`flex w-full items-center justify-between rounded-xl px-4 py-3 text-sm font-medium transition-all ${
                            isSelected
                              ? 'bg-[#5D3699] text-white shadow-md shadow-[#5D3699]/20'
                              : 'bg-white text-[#111827] ring-1 ring-[#e5e7eb] hover:ring-[#5D3699] hover:bg-[#f5f3ff]'
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
                    <div className="flex flex-col items-center justify-center rounded-xl bg-[#f8fafc] py-8 text-center">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white ring-1 ring-[#e5e7eb]">
                        <Clock className="h-6 w-6 text-[#9ca3af]" />
                      </div>
                      <p className="mt-3 text-sm font-medium text-[#111827]">
                        No times available
                      </p>
                      <p className="mt-1 text-xs text-[#6b7280]">
                        Please select another date
                      </p>
                    </div>
                  )}
                </div>

                {/* Selected Summary */}
                {selectedSlot && (
                  <div className="mt-4 rounded-xl bg-[#f5f3ff] p-4">
                    <div className="flex items-center gap-2 text-xs font-medium text-[#5D3699]">
                      <CheckCircle2 className="h-4 w-4" />
                      Selected Time
                    </div>
                    <p className="mt-1 text-sm font-semibold text-[#111827]">
                      {currentSelectedTimeLabel}
                    </p>
                  </div>
                )}
              </aside>
            </div>
          </div>
        </div>

        {/* Footer CTA */}
        <div className="border-t border-[#e5e7eb] bg-[#f8fafc] p-4 sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#5D3699]">
                <Video className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-[#111827]">
                  {selectedSlot ? 'Ready to book?' : 'Select a time slot'}
                </p>
                <p className="text-xs text-[#6b7280]">
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
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#5D3699] px-8 py-3.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-[#4a2b7a] hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60"
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
        <div className="mt-6 flex items-center justify-center gap-3 rounded-xl bg-white p-6 shadow-sm ring-1 ring-[#e5e7eb]">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-[#e5e7eb] border-t-[#5D3699]" />
          <span className="text-sm font-medium text-[#6b7280]">Loading available slots...</span>
        </div>
      )}

      {error && (
        <div className="mt-6 flex items-center gap-3 rounded-xl bg-red-50 p-4 ring-1 ring-red-100">
          <AlertCircle className="h-5 w-5 text-red-600" />
          <span className="text-sm text-red-600">{error}</span>
        </div>
      )}

      {/* Session Info */}
      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-[#e5e7eb]">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#f5f3ff]">
              <Video className="h-5 w-5 text-[#5D3699]" />
            </div>
            <div>
              <p className="text-sm font-semibold text-[#111827]">Video Call</p>
              <p className="text-xs text-[#6b7280]">Secure video session</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-[#e5e7eb]">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#f5f3ff]">
              <Clock className="h-5 w-5 text-[#5D3699]" />
            </div>
            <div>
              <p className="text-sm font-semibold text-[#111827]">30 Minutes</p>
              <p className="text-xs text-[#6b7280]">Session duration</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-[#e5e7eb]">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-50">
              <Shield className="h-5 w-5 text-[#10b981]" />
            </div>
            <div>
              <p className="text-sm font-semibold text-[#111827]">Safe & Secure</p>
              <p className="text-xs text-[#6b7280]">Monitored sessions</p>
            </div>
          </div>
        </div>
      </div>

      {/* Help Text */}
      <p className="mt-6 text-center text-xs text-[#9ca3af]">
        Need help? Contact our support team at support@bondroom.com
      </p>
    </div>
  </div>
);
};

export default BookSession;
