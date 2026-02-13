import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import arrowLeft from '../../assets/Container (2).png';
import arrowRight from '../../assets/Container (1).png';
import { menteeApi } from '../../../apis/api/menteeApi';
import { getSelectedMentorId, setLastBooking, setSelectedMentorId } from '../../../apis/api/storage';

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
    <div className="p-3 sm:p-4 md:p-6 bg-transparent min-h-screen">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <h1 className="text-base sm:text-lg md:text-xl font-semibold text-[#111827]">
          {mentor?.name ? `Book Session with ${mentor.name}` : 'Book Session'}
        </h1>
        <div className="inline-flex items-center gap-2 rounded-full bg-[#ecfdf3] text-[#1f7a3f] px-2 sm:px-3 py-1 text-[10px] sm:text-xs font-medium w-fit">
          <span className="inline-flex h-3 w-3 sm:h-4 sm:w-4 items-center justify-center rounded-full bg-[#1f7a3f] text-white text-[8px] sm:text-[10px] flex-shrink-0">
            OK
          </span>
          <span className="whitespace-nowrap">Sessions are monitored for safety</span>
        </div>
      </div>

      <div className="rounded-xl sm:rounded-2xl border border-[#e5e7eb] bg-white shadow-[0px_1px_2px_0px_rgba(0,0,0,0.08)] overflow-hidden">
        <div className="flex flex-col lg:grid lg:grid-cols-[320px_1fr] xl:grid-cols-[356px_1fr]">
          <aside className="p-4 sm:p-6 md:p-8 border-b lg:border-b-0 lg:border-r border-[#eef2f7] space-y-4 sm:space-y-6 w-full">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-full overflow-hidden bg-gray-200 flex-shrink-0">
                {mentor?.avatar ? (
                  <img
                    src={mentor.avatar}
                    alt={mentor?.name || 'Mentor'}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="h-full w-full bg-gradient-to-br from-gray-200 to-gray-300" />
                )}
              </div>
              <div className="min-w-0">
                <div className="text-[#111827] font-bold text-base sm:text-lg md:text-xl leading-tight truncate">
                  {mentor?.name || 'Mentor'}
                </div>
                <div className="text-[10px] sm:text-xs text-[#6b7280]">
                  {mentor?.location || 'Location not specified'}
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs text-[#6b7280] border-b border-[#e5e7eb] pb-4 sm:pb-6">
              <div className="flex items-center gap-1">
                <span className="text-[#f4b740]">*</span>
                <span className="text-[#111827] font-semibold text-sm">
                  {mentor?.rating !== null && mentor?.rating !== undefined ? Number(mentor.rating).toFixed(1) : '--'}
                </span>
              </div>
              <span className="text-[#9ca3af] text-xs sm:text-sm">({mentor?.reviews ?? 0} reviews)</span>
              <span className="text-[#9ca3af] text-xs sm:text-sm">
                <span className="font-bold text-black">{mentor?.sessions ?? 0}</span> sessions
              </span>
            </div>

            <div className="space-y-4 sm:space-y-6">
              <div>
                <div className="text-[#6b7280] text-xs sm:text-sm font-semibold tracking-wider uppercase">
                  EXPERTISE
                </div>
                <div className="mt-2 flex flex-wrap gap-1.5 sm:gap-2">
                  {(mentor?.expertise || []).map((t) => (
                    <span
                      key={t}
                      className="rounded-full bg-[#F1F5F9] px-2 sm:px-3 py-1 text-[9px] sm:text-[10px] text-[#334155]"
                    >
                      {t}
                    </span>
                  ))}
                  {!mentor?.expertise?.length && (
                    <span className="rounded-full bg-[#F1F5F9] px-2 sm:px-3 py-1 text-[9px] sm:text-[10px] text-[#334155]">
                      Not specified
                    </span>
                  )}
                </div>
              </div>

              <div>
                <div className="text-[#6b7280] text-xs sm:text-sm font-semibold tracking-wider uppercase">
                  LANGUAGES
                </div>
                <div className="mt-2 flex flex-wrap gap-1.5 sm:gap-2">
                  {(mentor?.languages || []).map((t) => (
                    <span
                      key={t}
                      className="rounded-full bg-[#F1F5F9] px-2 sm:px-3 py-1 text-[9px] sm:text-[10px] text-[#334155]"
                    >
                      {t}
                    </span>
                  ))}
                  {!mentor?.languages?.length && (
                    <span className="rounded-full bg-[#F1F5F9] px-2 sm:px-3 py-1 text-[9px] sm:text-[10px] text-[#334155]">
                      Not specified
                    </span>
                  )}
                </div>
              </div>

              <div>
                <div className="text-[#6b7280] text-xs sm:text-sm font-semibold tracking-wider uppercase">
                  MY STORY
                </div>
                <p className="mt-2 text-[#6b7280] text-xs sm:text-sm leading-relaxed">
                  "{mentor?.bio || 'Bio not provided yet.'}"
                </p>
                <button className="mt-2 text-[10px] sm:text-xs text-[#5D3699] underline">
                  Read full bio
                </button>
              </div>
            </div>
          </aside>

          <div className="flex flex-col md:grid md:grid-cols-1 lg:grid-cols-[1fr_220px] xl:grid-cols-[1fr_260px] gap-4 sm:gap-6 lg:gap-8 p-4 sm:p-6 md:p-8 w-full">
            <section className="space-y-3 sm:space-y-4 w-full">
              <div className="flex items-center justify-between mb-2 sm:mb-4">
                <button
                  className="h-8 w-8 sm:h-9 sm:w-9 rounded-full text-[#6B7280] flex items-center justify-center hover:bg-gray-100 transition-colors"
                  onClick={() => handleMonthChange(-1)}
                >
                  <img src={arrowLeft} alt="Previous month" className="h-3 w-1.5 sm:h-3.5 sm:w-2" />
                </button>
                <h2 className="text-[#111827] text-base sm:text-lg font-semibold">
                  {monthLabel}
                </h2>
                <button
                  className="h-8 w-8 sm:h-9 sm:w-9 rounded-full text-[#6B7280] flex items-center justify-center hover:bg-gray-100 transition-colors"
                  onClick={() => handleMonthChange(1)}
                >
                  <img src={arrowRight} alt="Next month" className="h-3 w-1.5 sm:h-3.5 sm:w-2" />
                </button>
              </div>

              <div className="grid grid-cols-7 gap-1 sm:gap-2 md:gap-3 text-center">
                {days.map((d) => (
                  <div
                    key={d}
                    className="font-medium text-[#9ca3af] text-[10px] sm:text-xs py-1 sm:py-2"
                  >
                    {d}
                  </div>
                ))}

                {dates.map((d, i) => {
                  const isEmpty = d === '';
                  const dateValue = d ? new Date(monthDate.getFullYear(), monthDate.getMonth(), Number(d)) : null;
                  const dateKey = dateValue ? toDateKey(dateValue) : '';
                  const isSelected = Boolean(dateKey) && dateKey === selectedDateKey;
                  const isUnavailable = Boolean(dateKey) && !availableDateSet.has(dateKey);

                  return (
                    <div
                      key={`${d}-${i}`}
                      onClick={() => handleDateSelect(d)}
                      className={`
                        h-7 w-7 sm:h-8 sm:w-8 md:h-9 md:w-9
                        flex items-center justify-center
                        rounded-full
                        text-xs sm:text-sm
                        mx-auto
                        cursor-pointer
                        transition-colors
                        ${isEmpty ? 'text-transparent cursor-default' : ''}
                        ${isSelected ? 'bg-[#f4b740] text-[#5D3699] font-semibold' : ''}
                        ${!isEmpty && !isSelected && !isUnavailable ? 'hover:bg-gray-100 text-[#111827]' : ''}
                        ${isUnavailable ? 'text-[#9CA3AF] opacity-60 cursor-not-allowed' : ''}
                      `}
                    >
                      {d || '.'}
                    </div>
                  );
                })}
              </div>
            </section>

            <aside className="border-t md:border-t lg:border-t-0 lg:border-l border-[#eef2f7] pt-4 sm:pt-6 lg:pt-0 lg:pl-4 xl:pl-6">
              <div className="text-[#111827] text-base sm:text-lg font-semibold">
                Available Times
              </div>
              <div className="mt-1 text-[#6b7280] text-xs sm:text-sm">
                {selectedDateKey ? formatDateLabel(selectedDateKey) : 'No slot selected'}
              </div>

              <div className="mt-3 grid grid-cols-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-2 gap-2 sm:gap-3 lg:gap-4 w-full">
                {selectedDateSlots.map((slot) => {
                  const isSelected = slot.id === selectedSlotId;

                  return (
                    <button
                      key={slot.id}
                      className={`
                        rounded-lg border
                        px-2 sm:px-3
                        py-2 sm:py-2.5
                        text-[10px] sm:text-xs md:text-sm
                        transition-colors
                        min-h-[40px] sm:min-h-[44px] md:min-h-[46px]
                        ${isSelected
                          ? 'border-[#5D3699] bg-[#EFF6FF] text-[#5D3699] font-semibold'
                          : 'border-[#e5e7eb] text-[#111827] hover:border-[#5D3699] hover:bg-[#F9FAFB]'
                        }
                      `}
                      onClick={() => setSelectedSlotId(slot.id)}
                    >
                      {slot.label}
                    </button>
                  );
                })}
              </div>

              {!selectedDateSlots.length && (
                <p className="mt-3 text-xs text-[#9CA3AF]">No available times for this day.</p>
              )}
            </aside>
          </div>
        </div>

        <div className="px-3 sm:px-4 md:px-5 py-3 sm:py-4 border-t border-[#eef2f7]">
          <button
            type="button"
            onClick={handleConfirmBooking}
            disabled={submitting || loading || !selectedSlot}
            className="block rounded-lg bg-[#5D3699] text-white text-center w-full py-3 sm:py-3.5 md:py-4 text-sm sm:text-base font-semibold hover:bg-[#4a2b7a] transition-colors disabled:opacity-70"
          >
            {submitting ? 'Confirming...' : `Confirm Booking for ${currentSelectedTimeLabel}`}
          </button>
        </div>
      </div>

      {(loading || error) && (
        <div className={`mt-3 text-center text-xs sm:text-sm ${error ? 'text-red-600' : 'text-[#6b7280]'}`}>
          {error || 'Loading available slots...'}
        </div>
      )}

      <div className="mt-4 text-center">
        <Link
          to="/mentors"
          className="text-[10px] sm:text-xs text-[#6b7280] underline hover:text-[#5D3699] transition-colors"
        >
          {'<-'} Go Back to Mentors
        </Link>
      </div>
    </div>
  );
};

export default BookSession;
