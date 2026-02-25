import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, Copy, Trash2, Plus, AlertTriangle, Pencil } from 'lucide-react';
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

const parseTime = (value) => {
  const [hour, minute] = value.split(':').map((item) => Number(item));
  return { hour: Number.isNaN(hour) ? 0 : hour, minute: Number.isNaN(minute) ? 0 : minute };
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
    if (!isWithinAllowedWindow(preset.time, preset.end)) {
      setError('Slots must be between 08:00 and 19:00.');
      return;
    }

    try {
      await mentorApi.createAvailabilitySlot({
        mentor: mentor.id,
        start_time: indiaDateTimeToIso(targetDay.dateKey, preset.time),
        end_time: indiaDateTimeToIso(targetDay.dateKey, preset.end),
        timezone: timezoneLabel,
        is_available: true,
      });
      await loadSlots(weekStartKey);
    } catch (err) {
      setError(err?.message || 'Unable to add availability slot.');
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
          tone: slot.is_available ? 'purple' : 'danger',
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

 return (
  <div className="min-h-screen py-4 px-3 sm:px-6 lg:px-8">
    <div className="max-w-[1400px] mx-auto">
      {/* Header Section */}
      <div className="bg-white rounded-2xl shadow-md border border-slate-200 p-4 sm:p-6 mb-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          {/* Title Section */}
          <div className="space-y-1">
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">
              Manage Availability
            </h2>
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{timezoneLabel}</span>
            </div>
          </div>

          {/* Controls Section */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            {/* Week Navigation */}
            <div className="flex items-center gap-2 bg-slate-100 rounded-xl px-3 py-2">
              <button
                type="button"
                className="w-8 h-8 rounded-lg bg-white hover:bg-[#5D3699]/10 border border-slate-300 hover:border-[#5D3699] flex items-center justify-center text-slate-700 hover:text-[#5D3699] transition-all duration-200"
                onClick={() => handleWeekChange(-1)}
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="text-xs sm:text-sm font-semibold text-slate-800 min-w-[80px] text-center">
                {weekLabel}
              </span>
              <button
                type="button"
                className="w-8 h-8 rounded-lg bg-white hover:bg-[#5D3699]/10 border border-slate-300 hover:border-[#5D3699] flex items-center justify-center text-slate-700 hover:text-[#5D3699] transition-all duration-200"
                onClick={() => handleWeekChange(1)}
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>

            {/* Action Buttons */}
            <button
              type="button"
              className="px-3 sm:px-4 py-2 rounded-lg bg-red-500 hover:bg-red-600 text-white text-xs sm:text-sm font-semibold shadow-sm hover:shadow transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={handleClearWeek}
              disabled={loading}
            >
              Clear Week
            </button>
            <button
              type="button"
              className="px-3 sm:px-4 py-2 rounded-lg bg-white hover:bg-[#5D3699] border border-[#5D3699] text-[#5D3699] hover:text-white text-xs sm:text-sm font-semibold shadow-sm hover:shadow transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={handleCopyWeek}
              disabled={loading}
            >
              Copy Week
            </button>
          </div>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-3">
        {days.map((day) => {
          const isToday = day.dateKey === formatIndiaDateKey(new Date());
          return (
            <div
              key={day.label}
              className="group relative"
              onDragOver={(e) => {
                e.preventDefault();
                e.dataTransfer.dropEffect = 'move';
              }}
              onDragEnter={() => {
                dragTargetRef.current = day.label;
              }}
              onDrop={(e) => handleDropOnDay(e, day.label)}
            >
              {/* Day Card */}
              <div className="bg-white rounded-xl shadow-md border border-slate-200 overflow-hidden transition-all duration-200 hover:shadow-lg">
                {/* Day Header */}
                <div
                  className={`relative px-3 py-3 text-center ${
                    isToday
                      ? 'bg-[#FDD253] text-black'
                      : 'bg-[#5D3699] text-white'
                  }`}
                >
                  {isToday && (
                    <div className="absolute top-2 right-2">
                      <span className="relative flex h-2.5 w-2.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#5D3699] opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#5D3699]"></span>
                      </span>
                    </div>
                  )}
                  <div className="font-bold text-sm sm:text-base">
                    {day.label}
                  </div>
                  <div className="mt-2 flex items-center justify-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleOpenCopy(day.label)}
                      className="p-1.5 rounded-md hover:bg-white/20 transition-all duration-200"
                      aria-label="Copy day"
                    >
                      <Copy className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      className="p-1.5 rounded-md hover:bg-white/20 transition-all duration-200"
                      aria-label="Clear day"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                {/* Slots Container */}
                <div className="relative p-3 bg-slate-50 min-h-[400px] flex flex-col">
                  {/* Copy Popover */}
                  {copyOpen?.dayLabel === day.label && (
                    <div
                      ref={popoverRef}
                      className="absolute left-3 right-3 top-3 z-50 rounded-xl border border-slate-300 bg-white shadow-xl p-4"
                    >
                      <p className="text-slate-900 font-semibold mb-3 text-xs">
                        {copyOpen?.slot ? '📋 Copy slot to...' : '📋 Copy day to...'}
                      </p>
                      <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar">
                        {dayLabels
                          .filter((label) => label !== day.label)
                          .map((label) => (
                            <label
                              key={label}
                              className="flex items-center gap-2 p-2 rounded-lg hover:bg-[#5D3699]/10 cursor-pointer transition-colors duration-200"
                            >
                              <input
                                type="checkbox"
                                className="w-3.5 h-3.5 rounded border-slate-300 text-[#5D3699] focus:ring-2 focus:ring-[#5D3699] cursor-pointer"
                                checked={copyTargets.includes(label)}
                                onChange={() => toggleCopyTarget(label)}
                              />
                              <span className="text-xs font-medium text-slate-700">{label}</span>
                            </label>
                          ))}
                      </div>
                      <button
                        type="button"
                        className="mt-3 w-full rounded-lg bg-[#5D3699] hover:bg-[#4a2b7a] text-white py-2 text-xs font-semibold shadow-sm hover:shadow transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={!copyTargets.length || loading}
                        onClick={handleApplyCopy}
                      >
                        Apply
                      </button>
                    </div>
                  )}

                  {/* Slots List */}
                  <div className="space-y-2 flex-1 pb-2">
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
                        className={`group/slot relative rounded-lg p-2.5 cursor-move transition-all duration-200 hover:shadow-md ${
                          slot.tone === 'danger'
                            ? 'bg-red-50 border-l-4 border-red-500'
                            : 'bg-[#5D3699]/10 border-l-4 border-[#5D3699]'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-start gap-2 flex-1">
                            {/* Drag Handle */}
                            <div className="mt-1 grid grid-cols-2 gap-0.5 opacity-40 group-hover/slot:opacity-100 transition-opacity">
                              {Array.from({ length: 6 }).map((_, dotIdx) => (
                                <span
                                  key={dotIdx}
                                  className={`h-1 w-1 rounded-full ${
                                    slot.tone === 'danger' ? 'bg-red-400' : 'bg-[#5D3699]/70'
                                  }`}
                                />
                              ))}
                            </div>
                            
                            {/* Time Display */}
                            <div className="flex-1 min-w-0">
                              <div className={`text-xs font-bold ${
                                slot.tone === 'danger' ? 'text-red-700' : 'text-[#5D3699]'
                              }`}>
                                {slot.time}
                              </div>
                              <div className={`text-[10px] font-medium my-0.5 ${
                                slot.tone === 'danger' ? 'text-red-500' : 'text-[#5D3699]/80'
                              }`}>
                                to
                              </div>
                              <div className={`text-xs font-bold ${
                                slot.tone === 'danger' ? 'text-red-700' : 'text-[#5D3699]'
                              }`}>
                                {slot.end}
                              </div>
                            </div>
                          </div>

                          {/* Action Buttons */}
                          <div className="flex flex-col gap-1">
                            <button
                              type="button"
                              className={`p-1 rounded transition-all duration-200 ${
                                slot.tone === 'danger'
                                  ? 'text-red-600 hover:bg-red-100'
                                  : 'text-[#5D3699] hover:bg-[#5D3699]/15'
                              }`}
                              onClick={(event) => {
                                event.stopPropagation();
                                handleOpenCopy(day.label, slot);
                              }}
                              aria-label="Edit slot"
                            >
                              <Pencil className="h-3 w-3" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteSlot(slot.id)}
                              className={`p-1 rounded transition-all duration-200 ${
                                slot.tone === 'danger'
                                  ? 'text-red-600 hover:bg-red-100'
                                  : 'text-[#5D3699] hover:bg-[#5D3699]/15'
                              }`}
                              aria-label="Delete slot"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          </div>
                        </div>

                        {/* Conflict Badge */}
                        {slot.tone === 'danger' && (
                          <div className="mt-2 flex items-center gap-1 text-[10px] font-semibold text-red-700 bg-red-100 rounded px-2 py-1">
                            <AlertTriangle className="h-3 w-3" />
                            <span>Conflict</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Add Slot Button */}
                  <button
                    type="button"
                    className="mt-2 w-full h-10 rounded-lg border-2 border-dashed border-[#5D3699]/40 text-xs font-semibold text-[#5D3699] flex items-center justify-center gap-1.5 bg-white hover:bg-[#5D3699]/10 hover:border-[#5D3699] transition-all duration-200"
                    onClick={() => addSlot(day.label)}
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Add Slot
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Loading/Error Messages */}
      {(loading || error) && (
        <div className="mt-4">
          <div
            className={`rounded-xl p-3 shadow-sm ${
              error
                ? 'bg-red-50 border border-red-200 text-red-700'
                : 'bg-blue-50 border border-blue-200 text-blue-700'
            }`}
          >
            <div className="flex items-center gap-2">
              {!error && (
                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              )}
              <span className="text-xs font-medium">{error || 'Loading availability...'}</span>
            </div>
          </div>
        </div>
      )}
    </div>

    {/* Move Confirmation Modal */}
    {pendingMove && (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl overflow-hidden">
          {/* Modal Header */}
          <div className="bg-[#5D3699] px-6 py-4">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
              </svg>
              Move Availability
            </h3>
          </div>

          {/* Modal Content */}
          <div className="p-6">
            <p className="text-slate-700 text-sm leading-relaxed">
              Move slot{' '}
              <span className="font-bold text-[#5D3699]">
                {formatTime(pendingMove.slot.start_time)} - {formatTime(pendingMove.slot.end_time)}
              </span>{' '}
              from{' '}
              <span className="font-bold text-slate-900">{pendingMove.fromLabel}</span> to{' '}
              <span className="font-bold text-slate-900">{pendingMove.toLabel}</span>?
            </p>
          </div>

          {/* Modal Actions */}
          <div className="px-6 pb-6 flex items-center justify-end gap-3">
            <button
              type="button"
              className="px-5 py-2.5 rounded-lg border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold text-sm transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={() => setPendingMove(null)}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="button"
              className="px-5 py-2.5 rounded-lg bg-[#5D3699] hover:bg-[#4a2b7a] text-white font-semibold text-sm shadow-sm hover:shadow transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={handleConfirmMove}
              disabled={loading}
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Saving...
                </span>
              ) : (
                'Confirm'
              )}
            </button>
          </div>
        </div>
      </div>
    )}
  </div>
);
};

export default ManageAvailability;
