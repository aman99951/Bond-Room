const AUTH_STORAGE_KEY = 'bondroom_auth';
const PENDING_MENTEE_KEY = 'bondroom_pending_mentee';
const PENDING_MENTOR_KEY = 'bondroom_pending_mentor';
const ASSESSMENT_DRAFT_KEY = 'bondroom_assessment_draft';
const SELECTED_MENTOR_KEY = 'bondroom_selected_mentor_id';
const LAST_BOOKING_KEY = 'bondroom_last_booking';
const SELECTED_SESSION_KEY = 'bondroom_selected_session_id';
const AUTH_LOGOUT_EVENT = 'auth:logout';

export const mapAppRoleToUiRole = (appRole) => {
  if (appRole === 'admin') return 'admins';
  if (appRole === 'mentor') return 'mentors';
  return 'menties';
};

const safeJsonParse = (value, fallback = null) => {
  if (!value) return fallback;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
};

const decodeBase64 = (value) => {
  const padded = value.padEnd(value.length + ((4 - (value.length % 4)) % 4), '=');
  return atob(padded.replace(/-/g, '+').replace(/_/g, '/'));
};

export const decodeJwtPayload = (token) => {
  if (!token || typeof token !== 'string') return null;
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  try {
    return JSON.parse(decodeBase64(parts[1]));
  } catch {
    return null;
  }
};

const getTokenExpiryMs = (token) => {
  const payload = decodeJwtPayload(token);
  const expSeconds = Number(payload?.exp || 0);
  if (!expSeconds) return 0;
  return expSeconds * 1000;
};

const notifyLogout = () => {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event(AUTH_LOGOUT_EVENT));
  }
};

const purgeAuthSession = () => {
  localStorage.removeItem(AUTH_STORAGE_KEY);
  localStorage.removeItem('userRole');
  localStorage.removeItem('bookingComplete');
  localStorage.removeItem(SELECTED_MENTOR_KEY);
  localStorage.removeItem(LAST_BOOKING_KEY);
  localStorage.removeItem(SELECTED_SESSION_KEY);
};

export const getAuthSession = () => {
  try {
    const parsed = safeJsonParse(localStorage.getItem(AUTH_STORAGE_KEY), null);
    if (!parsed?.accessToken) return null;
    const payload = decodeJwtPayload(parsed.accessToken) || {};
    const expiresAt = Number(parsed?.expiresAt || getTokenExpiryMs(parsed.accessToken) || 0);
    if (expiresAt && Date.now() >= expiresAt) {
      purgeAuthSession();
      notifyLogout();
      return null;
    }

    const normalized = {
      ...parsed,
      email: parsed?.email || payload?.email || '',
      role: parsed?.role || payload?.role || '',
      expiresAt,
    };

    if (
      normalized.email !== parsed?.email ||
      normalized.role !== parsed?.role ||
      normalized.expiresAt !== parsed?.expiresAt
    ) {
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(normalized));
    }

    return normalized;
  } catch {
    return null;
  }
};

export const setAuthSession = ({ accessToken, refreshToken, role, email }) => {
  const payload = decodeJwtPayload(accessToken) || {};
  const session = {
    accessToken,
    refreshToken,
    role: role || payload?.role || '',
    email: email || payload?.email || '',
    expiresAt: getTokenExpiryMs(accessToken),
    updatedAt: new Date().toISOString(),
  };
  localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session));
  localStorage.setItem('userRole', mapAppRoleToUiRole(session.role));
  return session;
};

export const clearAuthSession = () => {
  purgeAuthSession();
  notifyLogout();
};

export const getAccessToken = () => getAuthSession()?.accessToken || '';
export const getRefreshToken = () => getAuthSession()?.refreshToken || '';
export const isAuthSessionExpired = () => !getAuthSession()?.accessToken;
export const AUTH_LOGOUT_EVENT_NAME = AUTH_LOGOUT_EVENT;

export const setPendingMenteeRegistration = (payload) => {
  localStorage.setItem(PENDING_MENTEE_KEY, JSON.stringify(payload));
};

export const getPendingMenteeRegistration = () =>
  safeJsonParse(localStorage.getItem(PENDING_MENTEE_KEY), null);

export const clearPendingMenteeRegistration = () => {
  localStorage.removeItem(PENDING_MENTEE_KEY);
};

export const setPendingMentorRegistration = (payload) => {
  localStorage.setItem(PENDING_MENTOR_KEY, JSON.stringify(payload));
};

export const getPendingMentorRegistration = () =>
  safeJsonParse(localStorage.getItem(PENDING_MENTOR_KEY), null);

export const clearPendingMentorRegistration = () => {
  localStorage.removeItem(PENDING_MENTOR_KEY);
};

export const getAssessmentDraft = () =>
  safeJsonParse(localStorage.getItem(ASSESSMENT_DRAFT_KEY), {});

export const setAssessmentDraft = (payload) => {
  localStorage.setItem(ASSESSMENT_DRAFT_KEY, JSON.stringify(payload));
};

export const clearAssessmentDraft = () => {
  localStorage.removeItem(ASSESSMENT_DRAFT_KEY);
};

export const setSelectedMentorId = (mentorId) => {
  if (!mentorId) {
    localStorage.removeItem(SELECTED_MENTOR_KEY);
    return;
  }
  localStorage.setItem(SELECTED_MENTOR_KEY, String(mentorId));
};

export const getSelectedMentorId = () => {
  const value = localStorage.getItem(SELECTED_MENTOR_KEY);
  if (!value) return '';
  return value;
};

export const clearSelectedMentorId = () => {
  localStorage.removeItem(SELECTED_MENTOR_KEY);
};

export const setLastBooking = (payload) => {
  localStorage.setItem(LAST_BOOKING_KEY, JSON.stringify(payload || {}));
};

export const getLastBooking = () => safeJsonParse(localStorage.getItem(LAST_BOOKING_KEY), null);

export const clearLastBooking = () => {
  localStorage.removeItem(LAST_BOOKING_KEY);
};

export const setSelectedSessionId = (sessionId) => {
  if (!sessionId) {
    localStorage.removeItem(SELECTED_SESSION_KEY);
    return;
  }
  localStorage.setItem(SELECTED_SESSION_KEY, String(sessionId));
};

export const getSelectedSessionId = () => localStorage.getItem(SELECTED_SESSION_KEY) || '';

export const clearSelectedSessionId = () => {
  localStorage.removeItem(SELECTED_SESSION_KEY);
};
