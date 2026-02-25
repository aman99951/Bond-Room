export const INDIA_TIMEZONE = 'Asia/Kolkata';

const INDIA_OFFSET_MINUTES = 5 * 60 + 30;
const DAY_MS = 24 * 60 * 60 * 1000;

const indiaDateFormatter = new Intl.DateTimeFormat('en-US', {
  timeZone: INDIA_TIMEZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

const indiaWeekdayFormatter = new Intl.DateTimeFormat('en-US', {
  timeZone: INDIA_TIMEZONE,
  weekday: 'short',
});

const weekdayToIndex = {
  Mon: 0,
  Tue: 1,
  Wed: 2,
  Thu: 3,
  Fri: 4,
  Sat: 5,
  Sun: 6,
};

const pad = (value) => String(value).padStart(2, '0');

export const parseDateKey = (dateKey) => {
  const value = String(dateKey || '').trim();
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;
  return {
    year: Number(match[1]),
    month: Number(match[2]),
    day: Number(match[3]),
  };
};

const formatDateParts = ({ year, month, day }) => `${year}-${pad(month)}-${pad(day)}`;

const toDate = (value) => {
  if (value instanceof Date) return value;
  return new Date(value);
};

export const formatIndiaDateKey = (value) => {
  const date = toDate(value);
  if (Number.isNaN(date.getTime())) return '';
  const parts = indiaDateFormatter.formatToParts(date);
  const year = Number(parts.find((part) => part.type === 'year')?.value || 0);
  const month = Number(parts.find((part) => part.type === 'month')?.value || 0);
  const day = Number(parts.find((part) => part.type === 'day')?.value || 0);
  if (!year || !month || !day) return '';
  return formatDateParts({ year, month, day });
};

export const addDaysToDateKey = (dateKey, days) => {
  const parts = parseDateKey(dateKey);
  if (!parts) return '';
  const utc = Date.UTC(parts.year, parts.month - 1, parts.day + Number(days || 0));
  const date = new Date(utc);
  return formatDateParts({
    year: date.getUTCFullYear(),
    month: date.getUTCMonth() + 1,
    day: date.getUTCDate(),
  });
};

export const diffDateKeys = (startKey, endKey) => {
  const start = parseDateKey(startKey);
  const end = parseDateKey(endKey);
  if (!start || !end) return NaN;
  const startUtc = Date.UTC(start.year, start.month - 1, start.day);
  const endUtc = Date.UTC(end.year, end.month - 1, end.day);
  return Math.round((endUtc - startUtc) / DAY_MS);
};

export const getIndiaWeekStartKey = (value = new Date()) => {
  const date = toDate(value);
  if (Number.isNaN(date.getTime())) return '';
  const key = formatIndiaDateKey(date);
  if (!key) return '';
  const weekday = indiaWeekdayFormatter.format(date);
  const index = weekdayToIndex[weekday] ?? 0;
  return addDaysToDateKey(key, -index);
};

export const getIndiaTimeLabel = (value, { hour12 = true } = {}) => {
  const date = toDate(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    hour12,
    timeZone: INDIA_TIMEZONE,
  });
};

export const indiaDateTimeToIso = (dateKey, timeLabel) => {
  const parts = parseDateKey(dateKey);
  if (!parts) return '';
  const [rawHour, rawMinute] = String(timeLabel || '00:00').split(':');
  const hour = Number(rawHour);
  const minute = Number(rawMinute);
  if (Number.isNaN(hour) || Number.isNaN(minute)) return '';

  const utcMs =
    Date.UTC(parts.year, parts.month - 1, parts.day, hour, minute, 0, 0) -
    INDIA_OFFSET_MINUTES * 60 * 1000;
  return new Date(utcMs).toISOString();
};

export const indiaDateKeyToLabel = (dateKey, options = {}) => {
  const parts = parseDateKey(dateKey);
  if (!parts) return '';
  const date = new Date(Date.UTC(parts.year, parts.month - 1, parts.day, 12, 0, 0, 0));
  return date.toLocaleDateString([], { timeZone: INDIA_TIMEZONE, ...options });
};

export const buildDateKey = (year, monthIndex, day) =>
  `${year}-${pad(Number(monthIndex) + 1)}-${pad(day)}`;
