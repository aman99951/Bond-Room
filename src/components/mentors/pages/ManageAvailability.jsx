import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, Copy, Trash2, Plus, AlertTriangle, Pencil } from 'lucide-react';
import { mentorApi } from '../../../apis/api/mentorApi';
import { useMentorData } from '../../../apis/apihook/useMentorData';

const dayLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const ALLOWED_START_MINUTES = 8 * 60;
const ALLOWED_END_MINUTES = 19 * 60;

const getStartOfWeek = (date) => {
  const copy = new Date(date);
  const day = (copy.getDay() + 6) % 7;
  copy.setDate(copy.getDate() - day);
  copy.setHours(0, 0, 0, 0);
  return copy;
};

const buildWeekDays = (startDate) =>
  dayLabels.map((label, index) => {
    const date = new Date(startDate);
    date.setDate(startDate.getDate() + index);
    return { label, date, slots: [] };
  });

const formatWeekRange = (startDate) => {
  const endDate = new Date(startDate);
  endDate.setDate(startDate.getDate() + 6);
  const startLabel = startDate.toLocaleDateString([], { month: 'short', day: 'numeric' });
  const endLabel = endDate.toLocaleDateString([], { month: 'short', day: 'numeric' });
  return `${startLabel} - ${endLabel}`;
};

const formatTime = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
};

const parseTime = (value) => {
  const [hour, minute] = value.split(':').map((item) => Number(item));
  return { hour: Number.isNaN(hour) ? 0 : hour, minute: Number.isNaN(minute) ? 0 : minute };
};

const isWithinAllowedWindow = (startDate, endDate) => {
  if (!startDate || !endDate) return false;
  const startMinutes = startDate.getHours() * 60 + startDate.getMinutes();
  const endMinutes = endDate.getHours() * 60 + endDate.getMinutes();
  return startMinutes >= ALLOWED_START_MINUTES && endMinutes <= ALLOWED_END_MINUTES;
};

const hasDuplicateSlot = (slots, startLabel, endLabel) =>
  (slots || []).some((slot) => slot.time === startLabel && slot.end === endLabel);

const ManageAvailability = () => {
  const { mentor } = useMentorData();
  const [copyOpen, setCopyOpen] = useState(null);
  const [copyTargets, setCopyTargets] = useState([]);
  const [pendingMove, setPendingMove] = useState(null);
  const popoverRef = useRef(null);
  const dragPayloadRef = useRef(null);
  const dragTargetRef = useRef(null);
  const dragDidDropRef = useRef(false);
  const [weekStart, setWeekStart] = useState(() => getStartOfWeek(new Date()));
  const [days, setDays] = useState(() => buildWeekDays(getStartOfWeek(new Date())));
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
  const weekLabel = useMemo(() => formatWeekRange(weekStart), [weekStart]);
  const timezoneLabel = mentor?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';

  const loadSlots = async (startDate) => {
    if (!mentor?.id) return;
    setLoading(true);
    setError('');
    try {
      const response = await mentorApi.listAvailabilitySlots({
        mentor_id: mentor.id,
        start_from: startDate.toISOString(),
      });
      const list = Array.isArray(response) ? response : response?.results || [];
      const weekEnd = new Date(startDate);
      weekEnd.setDate(startDate.getDate() + 7);
      const nextDays = buildWeekDays(startDate);
      list.forEach((slot) => {
        const start = new Date(slot.start_time);
        if (Number.isNaN(start.getTime())) return;
        if (start < startDate || start >= weekEnd) return;
        const dayIndex = (start.getDay() + 6) % 7;
        const day = nextDays[dayIndex];
        if (!day) return;
        day.slots.push({
          id: slot.id,
          start_time: slot.start_time,
          end_time: slot.end_time,
          time: formatTime(slot.start_time),
          end: formatTime(slot.end_time),
          tone: slot.is_available ? 'purple' : 'danger',
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
    loadSlots(weekStart);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mentor?.id, weekStart]);

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
    const startTime = new Date(movedSlot.start_time);
    const endTime = new Date(movedSlot.end_time);
    const targetStart = new Date(targetDay.date);
    targetStart.setHours(startTime.getHours(), startTime.getMinutes(), 0, 0);
    const targetEnd = new Date(targetDay.date);
    targetEnd.setHours(endTime.getHours(), endTime.getMinutes(), 0, 0);

    try {
      await mentorApi.createAvailabilitySlot({
        mentor: mentor?.id,
        start_time: targetStart.toISOString(),
        end_time: targetEnd.toISOString(),
        timezone: timezoneLabel,
        is_available: true,
      });
      await mentorApi.deleteAvailabilitySlot(movedSlot.id);
      await loadSlots(weekStart);
    } catch (err) {
      setError(err?.message || 'Unable to update slot.');
      await loadSlots(weekStart);
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
    const startTime = new Date(slot.start_time);
    const endTime = new Date(slot.end_time);
    const targetStart = new Date(targetDay.date);
    targetStart.setHours(startTime.getHours(), startTime.getMinutes(), 0, 0);
    const targetEnd = new Date(targetDay.date);
    targetEnd.setHours(endTime.getHours(), endTime.getMinutes(), 0, 0);
    const targetStartLabel = formatTime(targetStart);
    const targetEndLabel = formatTime(targetEnd);
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
      const startTime = new Date(pendingMove.slot.start_time);
      const endTime = new Date(pendingMove.slot.end_time);
      const targetStart = new Date(targetDay.date);
      targetStart.setHours(startTime.getHours(), startTime.getMinutes(), 0, 0);
      const targetEnd = new Date(targetDay.date);
      targetEnd.setHours(endTime.getHours(), endTime.getMinutes(), 0, 0);
      const targetStartLabel = formatTime(targetStart);
      const targetEndLabel = formatTime(targetEnd);
      if (hasDuplicateSlot(targetDay.slots, targetStartLabel, targetEndLabel)) {
        setError('This time slot already exists for that day.');
        return;
      }
      if (!isWithinAllowedWindow(targetStart, targetEnd)) {
        setError('Slots must be between 08:00 and 19:00.');
        return;
      }
      await mentorApi.createAvailabilitySlot({
        mentor: mentor.id,
        start_time: targetStart.toISOString(),
        end_time: targetEnd.toISOString(),
        timezone: timezoneLabel,
        is_available: true,
      });
      await mentorApi.deleteAvailabilitySlot(pendingMove.slot.id);
      await loadSlots(weekStart);
      setPendingMove(null);
    } catch (err) {
      setError(err?.message || 'Unable to move slot.');
    } finally {
      setLoading(false);
    }
  };

  const slotPresets = [
    { time: '08:00', end: '09:00' },
    { time: '09:00', end: '10:00' },
    { time: '10:00', end: '11:00' },
    { time: '11:00', end: '12:00' },
    { time: '12:00', end: '13:00' },
    { time: '13:00', end: '14:00' },
    { time: '14:00', end: '15:00' },
    { time: '15:00', end: '16:00' },
    { time: '16:00', end: '17:00' },
    { time: '17:00', end: '18:00' },
    { time: '18:00', end: '19:00' },
  ];

  const addSlot = async (dayLabel) => {
    if (!mentor?.id) return;
    const targetDay = days.find((day) => day.label === dayLabel);
    const usedTimes = new Set((targetDay?.slots || []).map((slot) => slot.time));
    const preset = slotPresets.find((slot) => !usedTimes.has(slot.time));
    if (!preset) {
      setError('Availability slots are limited to 08:00-19:00.');
      return;
    }
    const dayIndex = dayLabels.indexOf(dayLabel);
    const startDate = new Date(weekStart);
    startDate.setDate(weekStart.getDate() + dayIndex);
    const { hour: startHour, minute: startMinute } = parseTime(preset.time);
    const { hour: endHour, minute: endMinute } = parseTime(preset.end);
    startDate.setHours(startHour, startMinute, 0, 0);
    const endDate = new Date(startDate);
    endDate.setHours(endHour, endMinute, 0, 0);
    if (!isWithinAllowedWindow(startDate, endDate)) {
      setError('Slots must be between 08:00 and 19:00.');
      return;
    }

    try {
      await mentorApi.createAvailabilitySlot({
        mentor: mentor.id,
        start_time: startDate.toISOString(),
        end_time: endDate.toISOString(),
        timezone: timezoneLabel,
        is_available: true,
      });
      await loadSlots(weekStart);
    } catch (err) {
      setError(err?.message || 'Unable to add availability slot.');
    }
  };

  const handleDeleteSlot = async (slotId) => {
    if (!slotId) return;
    setError('');
    try {
      await mentorApi.deleteAvailabilitySlot(slotId);
      await loadSlots(weekStart);
    } catch (err) {
      setError(err?.message || 'Unable to remove availability slot.');
    }
  };

  const handleWeekChange = (direction) => {
    const nextStart = new Date(weekStart);
    nextStart.setDate(weekStart.getDate() + direction * 7);
    setWeekStart(getStartOfWeek(nextStart));
  };

  const handleClearWeek = async () => {
    if (!mentor?.id) return;
    const slotIds = days.flatMap((day) => day.slots.map((slot) => slot.id)).filter(Boolean);
    if (!slotIds.length) return;
    setLoading(true);
    setError('');
    try {
      await Promise.all(slotIds.map((slotId) => mentorApi.deleteAvailabilitySlot(slotId)));
      await loadSlots(weekStart);
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
      const nextWeekStart = new Date(weekStart);
      nextWeekStart.setDate(weekStart.getDate() + 7);
      const response = await mentorApi.listAvailabilitySlots({
        mentor_id: mentor.id,
        start_from: nextWeekStart.toISOString(),
      });
      const list = Array.isArray(response) ? response : response?.results || [];
      const weekEnd = new Date(nextWeekStart);
      weekEnd.setDate(nextWeekStart.getDate() + 7);
      const nextWeekDays = buildWeekDays(nextWeekStart);
      list.forEach((slot) => {
        const start = new Date(slot.start_time);
        if (Number.isNaN(start.getTime())) return;
        if (start < nextWeekStart || start >= weekEnd) return;
        const dayIndex = (start.getDay() + 6) % 7;
        const day = nextWeekDays[dayIndex];
        if (!day) return;
        day.slots.push({
          id: slot.id,
          start_time: slot.start_time,
          end_time: slot.end_time,
          time: formatTime(slot.start_time),
          end: formatTime(slot.end_time),
          tone: slot.is_available ? 'purple' : 'danger',
        });
      });

      const requests = sourceSlots.map((slot) => {
        const startDate = new Date(slot.start_time);
        const endDate = new Date(slot.end_time);
        startDate.setDate(startDate.getDate() + 7);
        endDate.setDate(endDate.getDate() + 7);
        if (!isWithinAllowedWindow(startDate, endDate)) {
          return null;
        }
        const dayIndex = (startDate.getDay() + 6) % 7;
        const targetDay = nextWeekDays[dayIndex];
        if (!targetDay) {
          return null;
        }
        const startLabel = formatTime(startDate);
        const endLabel = formatTime(endDate);
        if (hasDuplicateSlot(targetDay.slots, startLabel, endLabel)) {
          return null;
        }
        targetDay.slots.push({ time: startLabel, end: endLabel });
        return mentorApi.createAvailabilitySlot({
          mentor: mentor.id,
          start_time: startDate.toISOString(),
          end_time: endDate.toISOString(),
          timezone: timezoneLabel,
          is_available: true,
        });
      });
      await Promise.all(requests.filter(Boolean));
      setWeekStart(getStartOfWeek(nextWeekStart));
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
          const startTime = new Date(slot.start_time);
          const endTime = new Date(slot.end_time);
          const targetStart = new Date(targetDay.date);
          targetStart.setHours(startTime.getHours(), startTime.getMinutes(), 0, 0);
          const targetEnd = new Date(targetDay.date);
          targetEnd.setHours(endTime.getHours(), endTime.getMinutes(), 0, 0);
          const targetStartLabel = formatTime(targetStart);
          const targetEndLabel = formatTime(targetEnd);
          const duplicateKey = `${targetStartLabel}-${targetEndLabel}`;
          if (existingTimes.has(duplicateKey)) {
            return;
          }
          if (hasDuplicateSlot(targetDay.slots, targetStartLabel, targetEndLabel)) {
            return;
          }
          if (!isWithinAllowedWindow(targetStart, targetEnd)) {
            return;
          }
          existingTimes.add(duplicateKey);
          requests.push(
            mentorApi.createAvailabilitySlot({
              mentor: mentor.id,
              start_time: targetStart.toISOString(),
              end_time: targetEnd.toISOString(),
              timezone: timezoneLabel,
              is_available: true,
            })
          );
        });
      });
      if (requests.length) {
        await Promise.all(requests);
      }
      await loadSlots(weekStart);
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

  return (
    <div className="min-h-screen bg-transparent">
      <div className="rounded-2xl bg-transparent text-white p-6 sm:p-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2
              className="text-[#111827]"
              style={{ fontFamily: 'DM Sans', fontSize: '30px', lineHeight: '36px', fontWeight: 700 }}
            >
              Manage Availability
            </h2>
            <p className="mt-1 text-xs text-[#6b7280]">Timezone: {timezoneLabel}</p>
          </div>
          <div className="flex flex-wrap items-center gap-3 text-sm text-[#6b7280]">
            <div className="flex items-center gap-2">
              <button
                type="button"
                className="h-8 w-8 rounded-full border border-[#e6e2f1] grid place-items-center text-[#6b7280]"
                onClick={() => handleWeekChange(-1)}
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="text-[#111827]">{weekLabel}</span>
              <button
                type="button"
                className="h-8 w-8 rounded-full border border-[#e6e2f1] grid place-items-center text-[#6b7280]"
                onClick={() => handleWeekChange(1)}
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
            <button
              type="button"
              className="text-[#ef4444] text-xs font-semibold disabled:opacity-60"
              onClick={handleClearWeek}
              disabled={loading}
            >
              Clear Week
            </button>
            <button
              type="button"
              className="rounded-full border border-[#d1d5db] px-3 py-1 text-xs text-[#111827] bg-white disabled:opacity-60"
              onClick={handleCopyWeek}
              disabled={loading}
            >
              Copy Week
            </button>
          </div>
        </div>

        <div className="mt-6 overflow-x-auto">
          <div className="grid grid-flow-col auto-cols-[140px] gap-4 min-w-max">
          {days.map((day) => {
            const isToday = day.date && new Date().toDateString() === new Date(day.date).toDateString();
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
                <div
                  className={`rounded-t-md border border-white/10 py-2 text-center ${
                    isToday ? 'bg-[#fdd253] text-[#1f2937]' : 'bg-transparent text-[#333333]'
                  }`}
                >
                  <div className="font-['Inter'] font-bold text-[16px] leading-[24px] tracking-[0px] text-center align-middle">
                    {day.label}
                  </div>
                  <div className={`mt-2 flex items-center justify-center gap-2 text-[10px] ${
                    isToday ? 'text-[#5b2c91]' : 'text-[#333333]'
                  }`}>
                    <button type="button" onClick={() => handleOpenCopy(day.label)} aria-label="Copy day">
                      <Copy className="h-3 w-3" />
                    </button>
                    <button type="button" aria-label="Clear day">
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                </div>
                <div className="rounded-b-md border border-white/10 bg-white h-[572px] px-2 py-3 text-[#1f2937] relative flex flex-col">
                {copyOpen?.dayLabel === day.label && (
                  <div
                    ref={popoverRef}
                    className="absolute left-3 top-10 z-10 w-[150px] rounded-lg border border-[#e6e2f1] bg-white shadow-xl p-3 text-xs"
                  >
                    <p className="text-[#1f2937] font-semibold mb-2">
                      {copyOpen?.slot ? 'Copy slot to...' : 'Copy day to...'}
                    </p>
                    {dayLabels
                      .filter((label) => label !== day.label)
                      .map((label) => (
                        <label key={label} className="mt-2 flex items-center gap-2 text-[#6b7280]">
                          <input
                            type="checkbox"
                            className="accent-[#5b2c91]"
                            checked={copyTargets.includes(label)}
                            onChange={() => toggleCopyTarget(label)}
                          />
                          {label}
                        </label>
                      ))}
                    <button
                      type="button"
                      className="mt-3 w-full rounded-md bg-[#5b2c91] text-white py-1.5 text-xs disabled:opacity-60"
                      disabled={!copyTargets.length || loading}
                      onClick={handleApplyCopy}
                    >
                      Apply
                    </button>
                  </div>
                )}

                <div className="space-y-2 flex-1 overflow-y-auto no-scrollbar pb-2">
                  {day.slots.map((slot, idx) => (
                    <div
                      key={`${day.label}-${idx}`}
                      draggable
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
                      className={`rounded-lg border border-l-4 px-2 py-2 ${
                        slot.tone === 'danger'
                          ? 'border-[#fca5a5] border-l-[#ef4444] bg-[#fff1f2] text-[#b91c1c]'
                          : 'border-[#e8e2f5] border-l-[#5b2c91] bg-[#f5f0ff] text-[#5b2c91]'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-start gap-2">
                          <div className="mt-1 grid grid-cols-2 gap-0.5 text-[#9ca3af]">
                            {Array.from({ length: 6 }).map((_, dotIdx) => (
                              <span key={dotIdx} className="h-1 w-1 rounded-full bg-current" />
                            ))}
                          </div>
                          <div>
                            <div className="text-[12px] font-semibold leading-[14px]">
                              {slot.time}
                            </div>
                            <div className="text-[10px] leading-[12px] opacity-80">-to-</div>
                            <div className="text-[12px] font-semibold leading-[14px]">
                              {slot.end}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 text-[10px]">
                          <button
                            type="button"
                            className="text-current"
                            onClick={(event) => {
                              event.stopPropagation();
                              handleOpenCopy(day.label, slot);
                            }}
                            aria-label="Edit slot"
                          >
                            <Pencil className="h-3 w-3" />
                          </button>
                          <button type="button" onClick={() => handleDeleteSlot(slot.id)} aria-label="Delete slot">
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                      {slot.tone === 'danger' && (
                        <div className="mt-2 flex items-center gap-1 text-[10px]">
                          <AlertTriangle className="h-3 w-3" />
                          <span>Conflict</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  className="mt-2 w-[115px] h-[40px] rounded-[8px] border-2 border-dashed border-[#cbd5f5] text-xs text-[#6b7280] flex items-center justify-center gap-1 bg-white self-center"
                  style={{ borderStyle: 'dashed', borderWidth: 2, borderImage: 'repeating-linear-gradient(90deg, #cbd5f5 0 6px, transparent 6px 10px) 1' }}
                  onClick={() => addSlot(day.label)}
                >
                  <Plus className="h-3 w-3" />
                  Add Slot
                </button>
              </div>
            </div>
          )})}
          </div>
        </div>
        {(loading || error) && (
          <div className={`mt-3 text-xs ${error ? 'text-red-600' : 'text-[#6b7280]'}`}>
            {error || 'Loading availability...'}
          </div>
        )}
      </div>
      {pendingMove && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl border border-[#e6e2f1]">
            <h3 className="text-lg font-semibold text-[#111827]">Move availability?</h3>
            <p className="mt-2 text-sm text-[#6b7280]">
              Move {formatTime(pendingMove.slot.start_time)} - {formatTime(pendingMove.slot.end_time)} from{' '}
              {pendingMove.fromLabel} to {pendingMove.toLabel}?
            </p>
            <div className="mt-5 flex items-center justify-end gap-3">
              <button
                type="button"
                className="rounded-md border border-[#e5e7eb] px-4 py-2 text-sm text-[#6b7280]"
                onClick={() => setPendingMove(null)}
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="button"
                className="rounded-md bg-[#5b2c91] px-4 py-2 text-sm text-white"
                onClick={handleConfirmMove}
                disabled={loading}
              >
                {loading ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageAvailability;
