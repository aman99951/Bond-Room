import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';

const WEEKDAY_LABELS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
const MONTH_LABELS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

const parseDate = (value) => {
  if (!value || typeof value !== 'string') return null;
  const [year, month, day] = value.split('-').map((part) => Number(part));
  if (!year || !month || !day) return null;
  const parsed = new Date(year, month - 1, day);
  if (Number.isNaN(parsed.getTime())) return null;
  if (
    parsed.getFullYear() !== year ||
    parsed.getMonth() !== month - 1 ||
    parsed.getDate() !== day
  ) {
    return null;
  }
  return parsed;
};

const toIsoDate = (value) => {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, '0');
  const day = String(value.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const isSameMonth = (a, b) =>
  a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth();

const isDateInRange = (date, minDate, maxDate) => {
  if (!date) return false;
  const normalized = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  if (minDate) {
    const min = new Date(minDate.getFullYear(), minDate.getMonth(), minDate.getDate());
    if (normalized < min) return false;
  }
  if (maxDate) {
    const max = new Date(maxDate.getFullYear(), maxDate.getMonth(), maxDate.getDate());
    if (normalized > max) return false;
  }
  return true;
};

const BoundedDatePicker = ({
  id,
  value,
  onChange,
  onBlur,
  minDate,
  maxDate,
  placeholder = 'Select date',
  inputClassName = '',
  popoverClassName = '',
}) => {
  const rootRef = useRef(null);
  const [open, setOpen] = useState(false);

  const min = useMemo(() => parseDate(minDate), [minDate]);
  const max = useMemo(() => parseDate(maxDate), [maxDate]);
  const selectedDate = useMemo(() => parseDate(value), [value]);

  const getFallbackMonth = () => {
    if (selectedDate) return new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1);
    if (max) return new Date(max.getFullYear(), max.getMonth(), 1);
    if (min) return new Date(min.getFullYear(), min.getMonth(), 1);
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  };

  const [viewMonth, setViewMonth] = useState(getFallbackMonth);

  useEffect(() => {
    if (!open) {
      setViewMonth(getFallbackMonth());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, value, minDate, maxDate]);

  useEffect(() => {
    const handlePointerDown = (event) => {
      if (!open) return;
      if (rootRef.current && !rootRef.current.contains(event.target)) {
        setOpen(false);
        if (onBlur) onBlur();
      }
    };
    document.addEventListener('mousedown', handlePointerDown);
    return () => document.removeEventListener('mousedown', handlePointerDown);
  }, [open, onBlur]);

  const monthStart = new Date(viewMonth.getFullYear(), viewMonth.getMonth(), 1);
  const monthEnd = new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1, 0);
  const firstWeekDay = monthStart.getDay();
  const daysInMonth = monthEnd.getDate();

  const canGoPrev = !min || monthStart > new Date(min.getFullYear(), min.getMonth(), 1);
  const canGoNext = !max || monthStart < new Date(max.getFullYear(), max.getMonth(), 1);

  const yearOptions = useMemo(() => {
    if (!min || !max) return [];
    const years = [];
    for (let y = max.getFullYear(); y >= min.getFullYear(); y -= 1) {
      years.push(y);
    }
    return years;
  }, [min, max]);

  const selectedLabel = selectedDate
    ? selectedDate.toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' })
    : placeholder;

  return (
    <div ref={rootRef} className="relative">
      <button
        id={id}
        type="button"
        className={`${inputClassName} flex items-center justify-between gap-3 text-left`}
        onClick={() => setOpen((prev) => !prev)}
      >
        <span className={selectedDate ? '' : 'text-[#9ca3af]'}>
          {selectedLabel}
        </span>
        <Calendar className="h-4 w-4 shrink-0 text-[#6b7280]" />
      </button>

      {open ? (
        <div
          className={`absolute left-0 z-50 mt-2 w-[320px] max-w-[calc(100vw-2rem)] rounded-xl border border-[#e6e2f1] bg-white p-3 shadow-2xl ${popoverClassName}`}
          role="dialog"
          aria-label="Date picker"
        >
          <div className="mb-3 flex items-center gap-2">
            <button
              type="button"
              onClick={() => canGoPrev && setViewMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))}
              disabled={!canGoPrev}
              className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-[#e5e7eb] text-[#374151] disabled:opacity-40"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <select
              value={viewMonth.getMonth()}
              onChange={(event) =>
                setViewMonth((prev) => new Date(prev.getFullYear(), Number(event.target.value), 1))
              }
              className="h-8 min-w-0 flex-1 rounded-md border border-[#e5e7eb] px-2 text-sm text-[#111827]"
            >
              {MONTH_LABELS.map((label, index) => (
                <option key={label} value={index}>
                  {label}
                </option>
              ))}
            </select>
            <select
              value={viewMonth.getFullYear()}
              onChange={(event) =>
                setViewMonth((prev) => new Date(Number(event.target.value), prev.getMonth(), 1))
              }
              className="h-8 w-24 rounded-md border border-[#e5e7eb] px-2 text-sm text-[#111827]"
            >
              {(yearOptions.length ? yearOptions : [viewMonth.getFullYear()]).map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => canGoNext && setViewMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))}
              disabled={!canGoNext}
              className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-[#e5e7eb] text-[#374151] disabled:opacity-40"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-semibold text-[#6b7280]">
            {WEEKDAY_LABELS.map((label) => (
              <div key={label} className="py-1">{label}</div>
            ))}
          </div>

          <div className="mt-1 grid grid-cols-7 gap-1">
            {Array.from({ length: firstWeekDay }).map((_, index) => (
              <div key={`blank-${index}`} className="h-9" />
            ))}
            {Array.from({ length: daysInMonth }).map((_, index) => {
              const day = index + 1;
              const date = new Date(viewMonth.getFullYear(), viewMonth.getMonth(), day);
              const dateIso = toIsoDate(date);
              const enabled = isDateInRange(date, min, max);
              const selected = selectedDate ? toIsoDate(selectedDate) === dateIso : false;
              const today = toIsoDate(new Date()) === dateIso;

              return (
                <button
                  key={dateIso}
                  type="button"
                  disabled={!enabled}
                  onClick={() => {
                    onChange(dateIso);
                    setOpen(false);
                    if (onBlur) onBlur();
                  }}
                  className={`h-9 rounded-md text-sm transition-colors ${
                    selected
                      ? 'bg-[#5b2c91] text-white'
                      : enabled
                        ? 'text-[#111827] hover:bg-[#f3ecff]'
                        : 'cursor-not-allowed text-[#c7cdd8]'
                  } ${today && !selected ? 'ring-1 ring-[#d9cdf2]' : ''}`}
                >
                  {day}
                </button>
              );
            })}
          </div>

          <div className="mt-3 flex items-center justify-between gap-2 text-[11px] text-[#6b7280]">
            <span>
              Allowed: {minDate || '--'} to {maxDate || '--'}
            </span>
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                if (onBlur) onBlur();
              }}
              className="rounded-md border border-[#e5e7eb] px-2 py-1 text-[#374151] hover:bg-[#f9fafb]"
            >
              Done
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default BoundedDatePicker;
