import { clearAuthSession, getAccessToken } from './storage';
import { beginApiRequest, endApiRequest } from './requestLoading';

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || '/api').replace(/\/+$/, '');

const normalizePath = (path) => {
  if (!path) return '/';
  return path.startsWith('/') ? path : `/${path}`;
};

const buildUrl = (path) => `${API_BASE_URL}${normalizePath(path)}`;

const parseResponseBody = async (response) => {
  const contentType = response.headers.get('content-type') || '';
  if (!contentType.includes('application/json')) return null;
  try {
    return await response.json();
  } catch {
    return null;
  }
};

const toError = (response, payload) => {
  const message =
    payload?.detail ||
    payload?.message ||
    (Array.isArray(payload) ? payload.join(', ') : null) ||
    'Request failed';
  const error = new Error(message);
  error.status = response.status;
  error.data = payload;
  return error;
};

const request = async (path, options = {}) => {
  const { method = 'GET', data, headers = {}, auth = true } = options;
  const isFormData = typeof FormData !== 'undefined' && data instanceof FormData;

  const finalHeaders = { ...headers };
  if (data !== undefined && !isFormData) {
    finalHeaders['Content-Type'] = 'application/json';
  }

  if (auth) {
    const accessToken = getAccessToken();
    if (accessToken) {
      finalHeaders.Authorization = `Bearer ${accessToken}`;
    }
  }

  beginApiRequest();
  try {
    const response = await fetch(buildUrl(path), {
      method,
      headers: finalHeaders,
      body: data !== undefined ? (isFormData ? data : JSON.stringify(data)) : undefined,
    });

    const payload = await parseResponseBody(response);
    if (!response.ok) {
      if (response.status === 401 && auth) {
        clearAuthSession();
        if (typeof window !== 'undefined') {
          const currentPath = window.location.pathname || '';
          if (currentPath !== '/login') {
            window.location.replace('/login');
          }
        }
      }
      throw toError(response, payload);
    }

    return payload;
  } finally {
    endApiRequest();
  }
};

export const apiClient = {
  get: (path, options = {}) => request(path, { ...options, method: 'GET' }),
  post: (path, data, options = {}) => request(path, { ...options, method: 'POST', data }),
  patch: (path, data, options = {}) => request(path, { ...options, method: 'PATCH', data }),
  put: (path, data, options = {}) => request(path, { ...options, method: 'PUT', data }),
  delete: (path, options = {}) => request(path, { ...options, method: 'DELETE' }),
};
