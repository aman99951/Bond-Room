const USERS_KEY = 'bondroom_voluntor_users_v1';
const SESSION_KEY = 'bondroom_voluntor_session_v1';
const EVENT_REGISTRATIONS_KEY = 'bondroom_voluntor_event_registrations_v1';

const readJson = (key, fallback) => {
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
};

const writeJson = (key, value) => {
  window.localStorage.setItem(key, JSON.stringify(value));
};

export const getVoluntorUsers = () => readJson(USERS_KEY, []);

export const registerVoluntorUser = ({ name, email, password }) => {
  const users = getVoluntorUsers();
  const normalizedEmail = String(email || '').trim().toLowerCase();

  if (users.some((user) => String(user.email || '').toLowerCase() === normalizedEmail)) {
    return { ok: false, message: 'An account already exists with this email.' };
  }

  const newUser = {
    id: `u-${Date.now()}`,
    name: String(name || '').trim(),
    email: normalizedEmail,
    password,
    createdAt: new Date().toISOString(),
  };

  const nextUsers = [newUser, ...users];
  writeJson(USERS_KEY, nextUsers);
  writeJson(SESSION_KEY, { id: newUser.id, name: newUser.name, email: newUser.email });

  return { ok: true, user: newUser };
};

export const loginVoluntorUser = ({ email, password }) => {
  const users = getVoluntorUsers();
  const normalizedEmail = String(email || '').trim().toLowerCase();
  const found = users.find((user) => String(user.email || '').toLowerCase() === normalizedEmail);

  if (!found || found.password !== password) {
    return { ok: false, message: 'Invalid email or password.' };
  }

  writeJson(SESSION_KEY, { id: found.id, name: found.name, email: found.email });
  return { ok: true, user: found };
};

export const getVoluntorSession = () => readJson(SESSION_KEY, null);

export const logoutVoluntorUser = () => {
  window.localStorage.removeItem(SESSION_KEY);
};

export const listEventRegistrations = () => readJson(EVENT_REGISTRATIONS_KEY, []);

export const saveEventRegistration = (payload) => {
  const registrations = listEventRegistrations();
  const next = [
    {
      id: `r-${Date.now()}`,
      createdAt: new Date().toISOString(),
      ...payload,
    },
    ...registrations,
  ];

  writeJson(EVENT_REGISTRATIONS_KEY, next);
  return next[0];
};

