import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Calendar, CheckCircle2, ChevronLeft, ChevronRight, Clock, Copy, Plus, Trash2 } from 'lucide-react';
import { mentorApi } from '../../../apis/api/mentorApi';
import { useMentorData } from '../../../apis/apihook/useMentorData';
import {
  INDIA_TIMEZONE,
  addDaysToDateKey,
  diffDateKeys,
  formatIndiaDateKey,
  getIndiaTimeLabel,
  getIndiaWeekStartKey,
  indiaDateKeyToLabel,
  indiaDateTimeToIso,
  parseDateKey,
} from '../../../utils/indiaTime';

const dayLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const ALLOWED_START_MINUTES = 8 * 60;
const ALLOWED_END_MINUTES = 19 * 60;

const buildWeekDays = (startDateKey) =>
  dayLabels.map((label, index) => {
    const dateKey = addDaysToDateKey(startDateKey, index);
    const parts = parseDateKey(dateKey);
    return { label, dateKey, dayNumber: parts?.day || 0, slots: [] };
  });

const formatWeekRange = (startDateKey) => {
  const endDateKey = addDaysToDateKey(startDateKey, 6);
  const startLabel = indiaDateKeyToLabel(startDateKey, { month: 'short', day: 'numeric' });
  const endLabel = indiaDateKeyToLabel(endDateKey, { month: 'short', day: 'numeric' });
  return `${startLabel} - ${endLabel}`;
};

const formatTime = (value) => {
  return getIndiaTimeLabel(value, { hour12: false });
};

const getDisplayTimeParts = (value) => {
  const label = String(getIndiaTimeLabel(value, { hour12: true }) || '').trim();
  const match = label.match(/^(.+?)\s*([AP]M)$/i);
  if (match) {
    return {
      time: String(match[1] || '').trim(),
      period: String(match[2] || '').toUpperCase(),
      label: `${String(match[1] || '').trim()} ${String(match[2] || '').toUpperCase()}`.trim(),
    };
  }
  return { time: label, period: '', label };
};

const getSlotPeriodLabel = (startValue, endValue) => {
  const startPeriod = getDisplayTimeParts(startValue).period;
  const endPeriod = getDisplayTimeParts(endValue).period;
  if (startPeriod && endPeriod && startPeriod !== endPeriod) {
    return `${startPeriod}/${endPeriod}`;
  }
  return startPeriod || endPeriod || '';
};

const parseTime = (value) => {
  const [hour, minute] = value.split(':').map((item) => Number(item));
  return { hour: Number.isNaN(hour) ? 0 : hour, minute: Number.isNaN(minute) ? 0 : minute };
};

const toMinutes = (label) => {
  const value = String(label || '').trim();
  if (!/^\d{2}:\d{2}$/.test(value)) return NaN;
  const parsed = parseTime(value);
  return parsed.hour * 60 + parsed.minute;
};

const isWithinAllowedWindow = (startLabel, endLabel) => {
  if (!startLabel || !endLabel) return false;
  const startTime = parseTime(startLabel);
  const endTime = parseTime(endLabel);
  const startMinutes = startTime.hour * 60 + startTime.minute;
  const endMinutes = endTime.hour * 60 + endTime.minute;
  return startMinutes >= ALLOWED_START_MINUTES && endMinutes <= ALLOWED_END_MINUTES;
};

const hasDuplicateSlot = (slots, startLabel, endLabel) =>
  (slots || []).some((slot) => slot.time === startLabel && slot.end === endLabel);

const ManageAvailability = () => {
  const { mentor } = useMentorData();
  const [copyOpen, setCopyOpen] = useState(null);
  const [copyTargets, setCopyTargets] = useState([]);
  const [pendingMove, setPendingMove] = useState(null);
  const [rangePicker, setRangePicker] = useState({
    dayLabel: '',
    startTime: '10:30',
    endTime: '11:30',
  });
  const popoverRef = useRef(null);
  const dragPayloadRef = useRef(null);
  const dragTargetRef = useRef(null);
  const dragDidDropRef = useRef(false);
  const [weekStartKey, setWeekStartKey] = useState(() => getIndiaWeekStartKey(new Date()));
  const [days, setDays] = useState(() => buildWeekDays(getIndiaWeekStartKey(new Date())));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const handleClick = (event) => {
      if (!popoverRef.current) return;
      if (popoverRef.current.contains(event.target)) return;
      setCopyOpen(null);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);
  const weekLabel = useMemo(() => formatWeekRange(weekStartKey), [weekStartKey]);
  const timezoneLabel = INDIA_TIMEZONE;

  const loadSlots = async (startDateKey) => {
    if (!mentor?.id) return;
    setLoading(true);
    setError('');
    try {
      const response = await mentorApi.listAvailabilitySlots({
        mentor_id: mentor.id,
        start_from: indiaDateTimeToIso(startDateKey, '00:00'),
      });
      const list = Array.isArray(response) ? response : response?.results || [];
      const weekEndKey = addDaysToDateKey(startDateKey, 7);
      const nextDays = buildWeekDays(startDateKey);
      list.forEach((slot) => {
        const slotDateKey = formatIndiaDateKey(slot.start_time);
        if (!slotDateKey) return;
        if (slotDateKey < startDateKey || slotDateKey >= weekEndKey) return;
        const dayIndex = diffDateKeys(startDateKey, slotDateKey);
        if (Number.isNaN(dayIndex) || dayIndex < 0 || dayIndex > 6) return;
        const day = nextDays[dayIndex];
        if (!day) return;
        day.slots.push({
          id: slot.id,
          start_time: slot.start_time,
          end_time: slot.end_time,
          time: formatTime(slot.start_time),
          end: formatTime(slot.end_time),
          tone: slot.is_available ? 'purple' : 'scheduled',
        });
      });
      setDays(nextDays);
    } catch (err) {
      setError(err?.message || 'Unable to load availability slots.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!mentor?.id) {
      setLoading(false);
      return;
    }
    loadSlots(weekStartKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mentor?.id, weekStartKey]);

  const _handleDrop = async (targetLabel, payload) => {
    if (!payload) return;
    const { fromLabel, slotId } = payload;
    if (fromLabel === targetLabel) return;
    const targetDay = days.find((day) => day.label === targetLabel);
    if (!targetDay) return;

    let movedSlot = null;
    setDays((prev) => {
      const next = prev.map((day) => ({ ...day, slots: [...day.slots] }));
      const fromDay = next.find((d) => d.label === fromLabel);
      const toDay = next.find((d) => d.label === targetLabel);
      if (!fromDay || !toDay) return prev;
      const slotIndex = fromDay.slots.findIndex((slot) => slot.id === slotId);
      if (slotIndex < 0) return prev;
      const [moved] = fromDay.slots.splice(slotIndex, 1);
      if (!moved) return prev;
      movedSlot = moved;
      toDay.slots.unshift(moved);
      return next;
    });

    if (!movedSlot?.id) return;
    const targetStartLabel = formatTime(movedSlot.start_time);
    const targetEndLabel = formatTime(movedSlot.end_time);
    const targetStartIso = indiaDateTimeToIso(targetDay.dateKey, targetStartLabel);
    const targetEndIso = indiaDateTimeToIso(targetDay.dateKey, targetEndLabel);

    try {
      await mentorApi.createAvailabilitySlot({
        mentor: mentor?.id,
        start_time: targetStartIso,
        end_time: targetEndIso,
        timezone: timezoneLabel,
        is_available: true,
      });
      await mentorApi.deleteAvailabilitySlot(movedSlot.id);
      await loadSlots(weekStartKey);
    } catch (err) {
      setError(err?.message || 'Unable to update slot.');
      await loadSlots(weekStartKey);
    }
  };

  const scheduleMove = (targetLabel, payload) => {
    if (!payload || pendingMove) return;
    const { fromLabel, slotId } = payload;
    if (!fromLabel || !slotId || fromLabel === targetLabel) return;
    const sourceDay = days.find((day) => day.label === fromLabel);
    const targetDay = days.find((day) => day.label === targetLabel);
    const slot = sourceDay?.slots?.find((item) => item.id === slotId) || null;
    if (!slot || !targetDay) {
      setError('Unable to move slot. Please try again.');
      return;
    }
    const targetStartLabel = formatTime(slot.start_time);
    const targetEndLabel = formatTime(slot.end_time);
    if (hasDuplicateSlot(targetDay.slots, targetStartLabel, targetEndLabel)) {
      setError('This time slot already exists for that day.');
      return;
    }
    setError('');
    setPendingMove({
      slot,
      fromLabel,
      toLabel: targetLabel,
    });
  };

  const handleConfirmMove = async () => {
    if (!pendingMove || !mentor?.id) return;
    const targetDay = days.find((day) => day.label === pendingMove.toLabel);
    if (!targetDay) {
      setPendingMove(null);
      return;
    }
    setLoading(true);
    setError('');
    try {
      const targetStartLabel = formatTime(pendingMove.slot.start_time);
      const targetEndLabel = formatTime(pendingMove.slot.end_time);
      if (hasDuplicateSlot(targetDay.slots, targetStartLabel, targetEndLabel)) {
        setError('This time slot already exists for that day.');
        return;
      }
      if (!isWithinAllowedWindow(targetStartLabel, targetEndLabel)) {
        setError('Slots must be between 08:00 and 19:00.');
        return;
      }
      await mentorApi.createAvailabilitySlot({
        mentor: mentor.id,
        start_time: indiaDateTimeToIso(targetDay.dateKey, targetStartLabel),
        end_time: indiaDateTimeToIso(targetDay.dateKey, targetEndLabel),
        timezone: timezoneLabel,
        is_available: true,
      });
      await mentorApi.deleteAvailabilitySlot(pendingMove.slot.id);
      await loadSlots(weekStartKey);
      setPendingMove(null);
    } catch (err) {
      setError(err?.message || 'Unable to move slot.');
    } finally {
      setLoading(false);
    }
  };

  const openRangePicker = (dayLabel) => {
    const targetDay = days.find((day) => day.label === dayLabel);
    const todayKey = formatIndiaDateKey(new Date());
    if (targetDay?.dateKey && todayKey && targetDay.dateKey < todayKey) {
      setError("Can't add availability slots to past dates.");
      return;
    }
    setError('');
    setRangePicker({
      dayLabel,
      startTime: '10:30',
      endTime: '11:30',
    });
  };

  const closeRangePicker = () => {
    setRangePicker({ dayLabel: '', startTime: '10:30', endTime: '11:30' });
  };

  const addCustomSlot = async () => {
    if (!mentor?.id || !rangePicker.dayLabel) return;
    const targetDay = days.find((day) => day.label === rangePicker.dayLabel);
    if (!targetDay?.dateKey) return;

    const startLabel = String(rangePicker.startTime || '').trim();
    const endLabel = String(rangePicker.endTime || '').trim();
    const startMinutes = toMinutes(startLabel);
    const endMinutes = toMinutes(endLabel);
    if (Number.isNaN(startMinutes) || Number.isNaN(endMinutes)) {
      setError('Choose valid start and end time.');
      return;
    }
    if (endMinutes <= startMinutes) {
      setError('End time must be later than start time.');
      return;
    }
    if (!isWithinAllowedWindow(startLabel, endLabel)) {
      setError('Slots must be within 08:00 and 19:00.');
      return;
    }
    if (hasDuplicateSlot(targetDay.slots, startLabel, endLabel)) {
      setError('This time slot already exists for that day.');
      return;
    }
    const overlapsExisting = (targetDay.slots || []).some((slot) => {
      const slotStart = toMinutes(slot.time);
      const slotEnd = toMinutes(slot.end);
      if (Number.isNaN(slotStart) || Number.isNaN(slotEnd)) return false;
      return startMinutes < slotEnd && endMinutes > slotStart;
    });
    if (overlapsExisting) {
      setError('This range overlaps an existing slot.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      await mentorApi.createAvailabilitySlot({
        mentor: mentor.id,
        start_time: indiaDateTimeToIso(targetDay.dateKey, startLabel),
        end_time: indiaDateTimeToIso(targetDay.dateKey, endLabel),
        timezone: timezoneLabel,
        is_available: true,
      });
      await loadSlots(weekStartKey);
      closeRangePicker();
    } catch (err) {
      setError(err?.message || 'Unable to add availability slot.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSlot = async (slotId) => {
    if (!slotId) return;
    setError('');
    try {
      await mentorApi.deleteAvailabilitySlot(slotId);
      await loadSlots(weekStartKey);
    } catch (err) {
      setError(err?.message || 'Unable to remove availability slot.');
    }
  };

  const handleClearDay = async (dayLabel) => {
    if (!mentor?.id) return;
    const targetDay = days.find((day) => day.label === dayLabel);
    const slotIds = (targetDay?.slots || []).map((slot) => slot.id).filter(Boolean);
    if (!slotIds.length) return;

    setLoading(true);
    setError('');
    try {
      await Promise.all(slotIds.map((slotId) => mentorApi.deleteAvailabilitySlot(slotId)));
      await loadSlots(weekStartKey);
    } catch (err) {
      setError(err?.message || 'Unable to clear day availability.');
    } finally {
      setLoading(false);
    }
  };

  const handleWeekChange = (direction) => {
    setWeekStartKey((prev) => addDaysToDateKey(prev, direction * 7));
  };

  const handleClearWeek = async () => {
    if (!mentor?.id) return;
    const slotIds = days.flatMap((day) => day.slots.map((slot) => slot.id)).filter(Boolean);
    if (!slotIds.length) return;
    setLoading(true);
    setError('');
    try {
      await Promise.all(slotIds.map((slotId) => mentorApi.deleteAvailabilitySlot(slotId)));
      await loadSlots(weekStartKey);
    } catch (err) {
      setError(err?.message || 'Unable to clear availability slots.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyWeek = async () => {
    if (!mentor?.id) return;
    const sourceSlots = days.flatMap((day) => day.slots);
    if (!sourceSlots.length) return;
    setLoading(true);
    setError('');
    try {
      const nextWeekStartKey = addDaysToDateKey(weekStartKey, 7);
      const response = await mentorApi.listAvailabilitySlots({
        mentor_id: mentor.id,
        start_from: indiaDateTimeToIso(nextWeekStartKey, '00:00'),
      });
      const list = Array.isArray(response) ? response : response?.results || [];
      const weekEndKey = addDaysToDateKey(nextWeekStartKey, 7);
      const nextWeekDays = buildWeekDays(nextWeekStartKey);
      list.forEach((slot) => {
        const slotDateKey = formatIndiaDateKey(slot.start_time);
        if (!slotDateKey) return;
        if (slotDateKey < nextWeekStartKey || slotDateKey >= weekEndKey) return;
        const dayIndex = diffDateKeys(nextWeekStartKey, slotDateKey);
        if (Number.isNaN(dayIndex) || dayIndex < 0 || dayIndex > 6) return;
        const day = nextWeekDays[dayIndex];
        if (!day) return;
        day.slots.push({
          id: slot.id,
          start_time: slot.start_time,
          end_time: slot.end_time,
          time: formatTime(slot.start_time),
          end: formatTime(slot.end_time),
          tone: slot.is_available ? 'purple' : 'scheduled',
        });
      });

      const requests = sourceSlots.map((slot) => {
        const sourceDateKey = formatIndiaDateKey(slot.start_time);
        if (!sourceDateKey) {
          return null;
        }
        const targetDateKey = addDaysToDateKey(sourceDateKey, 7);
        if (targetDateKey < nextWeekStartKey || targetDateKey >= weekEndKey) {
          return null;
        }
        const dayIndex = diffDateKeys(nextWeekStartKey, targetDateKey);
        if (Number.isNaN(dayIndex) || dayIndex < 0 || dayIndex > 6) {
          return null;
        }
        const targetDay = nextWeekDays[dayIndex];
        if (!targetDay) {
          return null;
        }
        const startLabel = formatTime(slot.start_time);
        const endLabel = formatTime(slot.end_time);
        if (hasDuplicateSlot(targetDay.slots, startLabel, endLabel)) {
          return null;
        }
        if (!isWithinAllowedWindow(startLabel, endLabel)) {
          return null;
        }
        targetDay.slots.push({ time: startLabel, end: endLabel });
        return mentorApi.createAvailabilitySlot({
          mentor: mentor.id,
          start_time: indiaDateTimeToIso(targetDateKey, startLabel),
          end_time: indiaDateTimeToIso(targetDateKey, endLabel),
          timezone: timezoneLabel,
          is_available: true,
        });
      });
      await Promise.all(requests.filter(Boolean));
      setWeekStartKey(nextWeekStartKey);
    } catch (err) {
      setError(err?.message || 'Unable to copy week availability.');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCopy = (dayLabel, slot = null) => {
    setCopyOpen({ dayLabel, slot });
    setCopyTargets([]);
  };

  const toggleCopyTarget = (label) => {
    setCopyTargets((prev) => {
      if (prev.includes(label)) return prev.filter((item) => item !== label);
      return [...prev, label];
    });
  };

  const handleApplyCopy = async () => {
    if (!mentor?.id || !copyOpen || !copyTargets.length) return;
    const sourceDay = days.find((day) => day.label === copyOpen.dayLabel);
    const sourceSlots = copyOpen.slot ? [copyOpen.slot] : sourceDay?.slots || [];
    if (!sourceSlots.length) {
      setCopyOpen(null);
      return;
    }

    setLoading(true);
    setError('');
    try {
      const requests = [];
      copyTargets.forEach((targetLabel) => {
        const targetDay = days.find((day) => day.label === targetLabel);
        if (!targetDay) return;
        const existingTimes = new Set(
          (targetDay.slots || []).map((slot) => `${slot.time}-${slot.end}`)
        );
        sourceSlots.forEach((slot) => {
          const targetStartLabel = formatTime(slot.start_time);
          const targetEndLabel = formatTime(slot.end_time);
          const duplicateKey = `${targetStartLabel}-${targetEndLabel}`;
          if (existingTimes.has(duplicateKey)) {
            return;
          }
          if (hasDuplicateSlot(targetDay.slots, targetStartLabel, targetEndLabel)) {
            return;
          }
          if (!isWithinAllowedWindow(targetStartLabel, targetEndLabel)) {
            return;
          }
          existingTimes.add(duplicateKey);
          requests.push(
            mentorApi.createAvailabilitySlot({
              mentor: mentor.id,
              start_time: indiaDateTimeToIso(targetDay.dateKey, targetStartLabel),
              end_time: indiaDateTimeToIso(targetDay.dateKey, targetEndLabel),
              timezone: timezoneLabel,
              is_available: true,
            })
          );
        });
      });
      if (requests.length) {
        await Promise.all(requests);
      }
      await loadSlots(weekStartKey);
      setCopyOpen(null);
      setCopyTargets([]);
    } catch (err) {
      setError(err?.message || 'Unable to copy availability slots.');
    } finally {
      setLoading(false);
    }
  };

  const getDragPayload = (event) => {
    const raw =
      event?.dataTransfer?.getData('application/json') ||
      event?.dataTransfer?.getData('text/plain') ||
      event?.dataTransfer?.getData('text') ||
      '';
    if (raw) {
      try {
        return JSON.parse(raw);
      } catch {
        return null;
      }
    }
    return dragPayloadRef.current;
  };

  const handleDropOnDay = (event, label) => {
    event.preventDefault();
    setError('');
    const payload = getDragPayload(event);
    if (!payload) {
      setError('Unable to move slot. Please try again.');
      return;
    }
    dragDidDropRef.current = true;
    dragTargetRef.current = label;
    scheduleMove(label, payload);
    dragPayloadRef.current = null;
  };
  const todayDateKey = formatIndiaDateKey(new Date());

  return (
    <div className="min-h-screen bg-transparent p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-[1400px]">
        {/* Header */}
        <div className="relative mb-6 flex flex-col gap-4 overflow-hidden rounded-3xl bg-[linear-gradient(120deg,#ffffff_0%,#f8f4ff_55%,#f3ecff_100%)] p-4 shadow-[0_20px_45px_-28px_rgba(93,54,153,0.45)] ring-1 ring-[#e6def8] sm:flex-row sm:items-center sm:justify-between sm:p-6">
          <div className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-[#d7c2ff]/35 blur-3xl" />
          <div className="pointer-events-none absolute -left-16 -bottom-16 h-36 w-36 rounded-full bg-[#ede5ff]/70 blur-3xl" />
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#f5f3ff]">
              <Calendar className="h-6 w-6 text-[#5D3699]" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-[#111827] sm:text-2xl">Manage Availability</h1>
              <div className="mt-0.5 inline-flex items-center gap-2 text-sm text-[#6b7280]">
                <Clock className="h-4 w-4" />
                <span>{timezoneLabel}</span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            {/* Week Navigation */}
            <div className="inline-flex items-center gap-2 self-start rounded-lg bg-[#f8fafc] px-2 py-1.5 ring-1 ring-[#e5e7eb] sm:self-auto">
              <button
                type="button"
                onClick={() => handleWeekChange(-1)}
                className="inline-flex h-7 w-7 items-center justify-center rounded-md text-[#5D3699] transition-colors hover:bg-[#ede9fe] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent"
                aria-label="Previous week"
                disabled={loading}
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="text-xs font-semibold text-[#374151]">{weekLabel}</span>
              <button
                type="button"
                onClick={() => handleWeekChange(1)}
                className="inline-flex h-7 w-7 items-center justify-center rounded-md text-[#5D3699] transition-colors hover:bg-[#ede9fe] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent"
                aria-label="Next week"
                disabled={loading}
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>

            <button
              type="button"
              className="inline-flex items-center justify-center rounded-xl bg-red-50 px-4 py-2 text-xs font-semibold text-red-700 ring-1 ring-red-100 transition-colors hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"
              onClick={handleClearWeek}
              disabled={loading}
            >
              Clear Week
            </button>
            <button
              type="button"
              className="inline-flex items-center justify-center rounded-xl bg-[#f5f3ff] px-4 py-2 text-xs font-semibold text-[#5D3699] ring-1 ring-[#5D3699]/10 transition-colors hover:bg-[#ede9fe] disabled:cursor-not-allowed disabled:opacity-60"
              onClick={handleCopyWeek}
              disabled={loading}
            >
              Copy Week
            </button>
          </div>
        </div>

        {/* Loading / Error */}
        {(loading || error) && (
          <div className="mb-6 rounded-xl ring-1 ring-inset">
            <div
              className={`flex items-center gap-2 px-4 py-3 ${
                error
                  ? 'bg-red-50 text-red-700 ring-red-100'
                  : 'bg-[#f5f3ff] text-[#5D3699] ring-[#5D3699]/10'
              }`}
            >
              {!error && (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-[#5D3699]/20 border-t-[#5D3699]" />
              )}
              <span className="text-xs font-medium">{error || 'Loading availability...'}</span>
            </div>
          </div>
        )}

        {/* Mobile Cards */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:hidden">
          {days.map((day) => {
            const isToday = day.dateKey === todayDateKey;
            return (
              <div
                key={day.label}
                className="relative"
                onDragOver={(e) => {
                  e.preventDefault();
                  e.dataTransfer.dropEffect = 'move';
                }}
                onDragEnter={() => {
                  dragTargetRef.current = day.label;
                }}
                onDrop={(e) => handleDropOnDay(e, day.label)}
              >
                <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-[#e5e7eb]">
                  <div className={`px-3 py-3 ${isToday ? 'bg-[#f5f0ff]' : 'bg-[#f8fafc]'} border-b border-[#e5e7eb]`}>
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <div className="text-xs font-semibold uppercase tracking-wider text-[#6b7280]">{day.label}</div>
                        <div className="mt-1 text-lg font-bold text-[#5D3699]">{day.dayNumber || '--'}</div>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleOpenCopy(day.label)}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-xl text-[#5D3699] transition-colors hover:bg-[#ede9fe] disabled:cursor-not-allowed disabled:opacity-50"
                          aria-label="Copy day"
                          disabled={loading}
                        >
                          <Copy className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleClearDay(day.label)}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-xl text-[#5D3699] transition-colors hover:bg-[#ede9fe] disabled:cursor-not-allowed disabled:opacity-50"
                          aria-label="Clear day"
                          disabled={loading}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="relative flex min-h-[280px] flex-col gap-2 p-3">
                    {copyOpen?.dayLabel === day.label && (
                      <div
                        ref={popoverRef}
                        className="absolute left-3 right-3 top-3 z-50 rounded-xl bg-white p-4 shadow-xl ring-1 ring-[#e5e7eb]"
                      >
                        <p className="mb-3 text-xs font-semibold text-[#111827]">
                          {copyOpen?.slot ? 'Copy slot to...' : 'Copy day to...'}
                        </p>
                        <div className="max-h-48 space-y-2 overflow-y-auto custom-scrollbar">
                          {dayLabels
                            .filter((label) => label !== day.label)
                            .map((label) => (
                              <label
                                key={label}
                                className="flex cursor-pointer items-center gap-2 rounded-lg p-2 transition-colors hover:bg-[#f5f3ff]"
                              >
                                <input
                                  type="checkbox"
                                  className="h-3.5 w-3.5 cursor-pointer rounded border-[#d1d5db] text-[#5D3699] focus:ring-2 focus:ring-[#5D3699]"
                                  checked={copyTargets.includes(label)}
                                  onChange={() => toggleCopyTarget(label)}
                                />
                                <span className="text-xs font-medium text-[#374151]">{label}</span>
                              </label>
                            ))}
                        </div>
                        <button
                          type="button"
                          className="mt-3 inline-flex w-full items-center justify-center rounded-lg bg-[#5D3699] py-2 text-xs font-semibold text-white transition-colors hover:bg-[#4a2b7a] disabled:cursor-not-allowed disabled:opacity-60"
                          disabled={!copyTargets.length || loading}
                          onClick={handleApplyCopy}
                        >
                          Apply
                        </button>
                      </div>
                    )}

                    {day.slots.map((slot) => (
                      (() => {
                        const startParts = getDisplayTimeParts(slot.start_time);
                        const endParts = getDisplayTimeParts(slot.end_time);
                        const slotPeriodLabel = getSlotPeriodLabel(slot.start_time, slot.end_time);
                        return (
                      <div
                        key={slot.id}
                        draggable={slot.tone !== 'scheduled'}
                        onDragStart={(e) => {
                          const payload = { fromLabel: day.label, slotId: slot.id };
                          dragPayloadRef.current = payload;
                          dragTargetRef.current = null;
                          dragDidDropRef.current = false;
                          e.dataTransfer.effectAllowed = 'move';
                          try {
                            e.dataTransfer.setData('application/json', JSON.stringify(payload));
                            e.dataTransfer.setData('text/plain', JSON.stringify(payload));
                            e.dataTransfer.setData('text', JSON.stringify(payload));
                          } catch {
                            // ignore dataTransfer errors
                          }
                        }}
                        onDragEnd={() => {
                          if (
                            !dragDidDropRef.current &&
                            dragPayloadRef.current &&
                            dragTargetRef.current &&
                            dragTargetRef.current !== dragPayloadRef.current.fromLabel
                          ) {
                            scheduleMove(dragTargetRef.current, dragPayloadRef.current);
                          }
                          dragPayloadRef.current = null;
                          dragTargetRef.current = null;
                          dragDidDropRef.current = false;
                        }}
                        className={`group flex items-center justify-between gap-2 rounded-xl border px-3 py-2 ${
                          slot.tone === 'scheduled'
                            ? 'border-[#e5e7eb] bg-[#f3f4f6] text-[#9ca3af]'
                            : 'cursor-move border-[#cfb9ef] bg-gradient-to-b from-white to-[#f7f1ff] text-[#4a2b7a] shadow-[0_2px_6px_rgba(93,54,153,0.1)]'
                        }`}
                      >
                        <div className="min-w-0">
                          <div className="text-xs font-bold">{startParts.time}</div>
                          <div className="text-[10px] font-medium text-[#6b7280]">to</div>
                          <div className="text-xs font-bold">{endParts.time}</div>
                        </div>
                        <div className="flex items-center gap-2">
                          {slotPeriodLabel && (
                            <span className="inline-flex min-w-[44px] items-center justify-center rounded-full bg-[#ede9fe] px-2 py-1 text-[10px] font-bold tracking-wide text-[#5D3699]">
                              {slotPeriodLabel}
                            </span>
                          )}
                          <button
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation();
                              handleOpenCopy(day.label, slot);
                            }}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-xl text-[#5D3699] transition-colors hover:bg-[#ede9fe] disabled:cursor-not-allowed disabled:opacity-40"
                            aria-label="Copy slot"
                            disabled={loading}
                          >
                            <Copy className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteSlot(slot.id)}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-xl text-[#5D3699] transition-colors hover:bg-[#ede9fe] disabled:cursor-not-allowed disabled:opacity-40"
                            aria-label="Delete slot"
                            disabled={loading || slot.tone === 'scheduled'}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                        );
                      })()
                    ))}

                    <button
                      type="button"
                      className="mt-auto inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-dashed border-[#cfb9ef] bg-white text-xs font-semibold text-[#5D3699] transition-colors hover:bg-[#f5f3ff] disabled:cursor-not-allowed disabled:opacity-60"
                      onClick={() => openRangePicker(day.label)}
                      disabled={loading || (day.dateKey && day.dateKey < todayDateKey)}
                    >
                      <Plus className="h-4 w-4" />
                      Add Time
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Desktop Week Grid */}
        <div className="hidden overflow-x-auto lg:block">
          <div className="min-w-[860px] rounded-xl bg-[#f8fafc] p-3 ring-1 ring-[#e5e7eb]">
            <div className="grid grid-cols-7 gap-2 border-b border-[#e5e7eb] pb-3">
              {days.map((day) => {
                const isToday = day.dateKey === todayDateKey;
                return (
                  <div key={day.label} className="py-2 text-center">
                    <div
                      className={`text-xs font-semibold uppercase tracking-wider ${
                        isToday ? 'text-[#5D3699]' : 'text-[#6b7280]'
                      }`}
                    >
                      {day.label}
                    </div>
                    {isToday ? (
                      <div className="mt-1.5 flex justify-center">
                        <span className="inline-flex h-9 min-w-9 items-center justify-center rounded-[12px] bg-[#5D3699] px-2 text-[22px] font-bold leading-none text-white shadow-[0_8px_16px_rgba(93,54,153,0.28)]">
                          {day.dayNumber || '--'}
                        </span>
                      </div>
                    ) : (
                      <div className="mt-1 text-[22px] font-bold leading-none text-[#5D3699]">{day.dayNumber || '--'}</div>
                    )}
                    <div className="mt-2 flex items-center justify-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleOpenCopy(day.label)}
                        className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-[#5D3699] transition-colors hover:bg-[#ede9fe] disabled:cursor-not-allowed disabled:opacity-50"
                        aria-label="Copy day"
                        disabled={loading}
                      >
                        <Copy className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleClearDay(day.label)}
                        className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-[#5D3699] transition-colors hover:bg-[#ede9fe] disabled:cursor-not-allowed disabled:opacity-50"
                        aria-label="Clear day"
                        disabled={loading}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-3 grid grid-cols-7 gap-2">
              {days.map((day) => {
                const isToday = day.dateKey === todayDateKey;
                return (
                  <div
                    key={day.label}
                    className={`relative space-y-2 rounded-xl p-2 ${isToday ? 'bg-[#f5f0ff] ring-1 ring-[#e0d2f7]' : ''}`}
                    onDragOver={(e) => {
                      e.preventDefault();
                      e.dataTransfer.dropEffect = 'move';
                    }}
                    onDragEnter={() => {
                      dragTargetRef.current = day.label;
                    }}
                    onDrop={(e) => handleDropOnDay(e, day.label)}
                  >
                    {copyOpen?.dayLabel === day.label && (
                      <div
                        ref={popoverRef}
                        className="absolute left-2 right-2 top-2 z-50 rounded-xl bg-white p-4 shadow-xl ring-1 ring-[#e5e7eb]"
                      >
                        <p className="mb-3 text-xs font-semibold text-[#111827]">
                          {copyOpen?.slot ? 'Copy slot to...' : 'Copy day to...'}
                        </p>
                        <div className="max-h-48 space-y-2 overflow-y-auto custom-scrollbar">
                          {dayLabels
                            .filter((label) => label !== day.label)
                            .map((label) => (
                              <label
                                key={label}
                                className="flex cursor-pointer items-center gap-2 rounded-lg p-2 transition-colors hover:bg-[#f5f3ff]"
                              >
                                <input
                                  type="checkbox"
                                  className="h-3.5 w-3.5 cursor-pointer rounded border-[#d1d5db] text-[#5D3699] focus:ring-2 focus:ring-[#5D3699]"
                                  checked={copyTargets.includes(label)}
                                  onChange={() => toggleCopyTarget(label)}
                                />
                                <span className="text-xs font-medium text-[#374151]">{label}</span>
                              </label>
                            ))}
                        </div>
                        <button
                          type="button"
                          className="mt-3 inline-flex w-full items-center justify-center rounded-lg bg-[#5D3699] py-2 text-xs font-semibold text-white transition-colors hover:bg-[#4a2b7a] disabled:cursor-not-allowed disabled:opacity-60"
                          disabled={!copyTargets.length || loading}
                          onClick={handleApplyCopy}
                        >
                          Apply
                        </button>
                      </div>
                    )}

                    {day.slots.map((slot) => (
                      (() => {
                        const startParts = getDisplayTimeParts(slot.start_time);
                        const endParts = getDisplayTimeParts(slot.end_time);
                        const slotPeriodLabel = getSlotPeriodLabel(slot.start_time, slot.end_time);
                        return (
                      <div
                        key={slot.id}
                        draggable={slot.tone !== 'scheduled'}
                        onDragStart={(e) => {
                          const payload = { fromLabel: day.label, slotId: slot.id };
                          dragPayloadRef.current = payload;
                          dragTargetRef.current = null;
                          dragDidDropRef.current = false;
                          e.dataTransfer.effectAllowed = 'move';
                          try {
                            e.dataTransfer.setData('application/json', JSON.stringify(payload));
                            e.dataTransfer.setData('text/plain', JSON.stringify(payload));
                            e.dataTransfer.setData('text', JSON.stringify(payload));
                          } catch {
                            // ignore dataTransfer errors
                          }
                        }}
                        onDragEnd={() => {
                          if (
                            !dragDidDropRef.current &&
                            dragPayloadRef.current &&
                            dragTargetRef.current &&
                            dragTargetRef.current !== dragPayloadRef.current.fromLabel
                          ) {
                            scheduleMove(dragTargetRef.current, dragPayloadRef.current);
                          }
                          dragPayloadRef.current = null;
                          dragTargetRef.current = null;
                          dragDidDropRef.current = false;
                        }}
                        className={`group relative flex items-center justify-between gap-2 rounded-xl border px-2 py-2 transition-all ${
                          slot.tone === 'scheduled'
                            ? 'border-[#e5e7eb] bg-[#f3f4f6] text-[#9ca3af]'
                            : 'cursor-move border-[#cfb9ef] bg-gradient-to-b from-white to-[#f7f1ff] text-[#4a2b7a] shadow-[0_2px_6px_rgba(93,54,153,0.1)] hover:-translate-y-[1px] hover:border-[#5D3699]'
                        }`}
                      >
                        <div className="flex min-w-0 flex-col items-center justify-center leading-none">
                          <span className="text-[12px] font-bold tracking-wide">{startParts.time}</span>
                          <span className="my-1 h-px w-10 bg-[#d5c3f1]" />
                          <span className="text-[12px] font-bold tracking-wide">{endParts.time}</span>
                        </div>

                        <div className="relative flex h-8 w-[74px] items-center justify-end">
                          {slotPeriodLabel && (
                            <span className="inline-flex min-w-[44px] items-center justify-center rounded-full bg-[#ede9fe] px-2 py-1 text-[10px] font-bold tracking-wide text-[#5D3699] transition-opacity duration-150 group-hover:opacity-0">
                              {slotPeriodLabel}
                            </span>
                          )}
                          <div className="pointer-events-none absolute inset-0 flex items-center justify-end gap-1 opacity-0 transition-opacity duration-150 group-hover:pointer-events-auto group-hover:opacity-100">
                            <button
                              type="button"
                              onClick={(event) => {
                                event.stopPropagation();
                                handleOpenCopy(day.label, slot);
                              }}
                              className="inline-flex h-8 w-8 items-center justify-center rounded-xl text-[#5D3699] transition-colors hover:bg-[#ede9fe] disabled:cursor-not-allowed disabled:opacity-40"
                              aria-label="Copy slot"
                              disabled={loading}
                            >
                              <Copy className="h-4 w-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteSlot(slot.id)}
                              className="inline-flex h-8 w-8 items-center justify-center rounded-xl text-[#5D3699] transition-colors hover:bg-[#ede9fe] disabled:cursor-not-allowed disabled:opacity-40"
                              aria-label="Delete slot"
                              disabled={loading || slot.tone === 'scheduled'}
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                        );
                      })()
                    ))}

                    {day.slots.some((slot) => slot.tone === 'scheduled') && (
                      <div className="flex items-center justify-center gap-1 rounded-xl bg-green-50 px-2 py-2 text-[10px] font-semibold text-green-700 ring-1 ring-green-100">
                        <CheckCircle2 className="h-3 w-3" />
                        <span>Scheduled slots can't be moved or deleted</span>
                      </div>
                    )}

                    <button
                      type="button"
                      className="mt-2 inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-dashed border-[#cfb9ef] bg-white text-xs font-semibold text-[#5D3699] transition-colors hover:bg-[#f5f3ff] disabled:cursor-not-allowed disabled:opacity-60"
                      onClick={() => openRangePicker(day.label)}
                      disabled={loading || (day.dateKey && day.dateKey < todayDateKey)}
                    >
                      <Plus className="h-4 w-4" />
                      Add Time
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {rangePicker.dayLabel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="bg-[#5D3699] px-6 py-4">
              <h3 className="text-lg font-bold text-white">Add Availability Time</h3>
            </div>
            <div className="space-y-4 p-6">
              <p className="text-sm text-[#374151]">
                {rangePicker.dayLabel} - choose your exact time range.
              </p>
              <div className="grid grid-cols-2 gap-3">
                <label className="text-xs font-semibold text-[#374151]">
                  Start
                  <input
                    type="time"
                    step="1800"
                    min="08:00"
                    max="18:30"
                    value={rangePicker.startTime}
                    onChange={(e) =>
                      setRangePicker((prev) => ({ ...prev, startTime: e.target.value }))
                    }
                    className="mt-1 w-full rounded-lg border border-[#d1d5db] px-3 py-2 text-sm text-[#111827] focus:border-[#5D3699] focus:outline-none"
                  />
                </label>
                <label className="text-xs font-semibold text-[#374151]">
                  End
                  <input
                    type="time"
                    step="1800"
                    min="08:30"
                    max="19:00"
                    value={rangePicker.endTime}
                    onChange={(e) =>
                      setRangePicker((prev) => ({ ...prev, endTime: e.target.value }))
                    }
                    className="mt-1 w-full rounded-lg border border-[#d1d5db] px-3 py-2 text-sm text-[#111827] focus:border-[#5D3699] focus:outline-none"
                  />
                </label>
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 px-6 pb-6">
              <button
                type="button"
                className="rounded-xl bg-white px-5 py-2.5 text-sm font-semibold text-[#374151] ring-1 ring-[#e5e7eb] transition-colors hover:bg-[#f9fafb] disabled:cursor-not-allowed disabled:opacity-60"
                onClick={closeRangePicker}
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="button"
                className="rounded-xl bg-[#5D3699] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#4a2b7a] disabled:cursor-not-allowed disabled:opacity-60"
                onClick={addCustomSlot}
                disabled={loading}
              >
                {loading ? 'Saving...' : 'Add Slot'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Move Confirmation Modal */}
      {pendingMove && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="bg-[#5D3699] px-6 py-4">
              <h3 className="text-lg font-bold text-white">Move Availability</h3>
            </div>

            <div className="p-6">
              <p className="text-sm leading-relaxed text-[#374151]">
                Move slot{' '}
                <span className="font-bold text-[#5D3699]">
                  {getDisplayTimeParts(pendingMove.slot.start_time).label} - {getDisplayTimeParts(pendingMove.slot.end_time).label}
                </span>{' '}
                from <span className="font-bold text-[#111827]">{pendingMove.fromLabel}</span> to{' '}
                <span className="font-bold text-[#111827]">{pendingMove.toLabel}</span>?
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 px-6 pb-6">
              <button
                type="button"
                className="rounded-xl bg-white px-5 py-2.5 text-sm font-semibold text-[#374151] ring-1 ring-[#e5e7eb] transition-colors hover:bg-[#f9fafb] disabled:cursor-not-allowed disabled:opacity-60"
                onClick={() => setPendingMove(null)}
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="button"
                className="rounded-xl bg-[#5D3699] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#4a2b7a] disabled:cursor-not-allowed disabled:opacity-60"
                onClick={handleConfirmMove}
                disabled={loading}
              >
                {loading ? 'Saving...' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

};

export default ManageAvailability;
