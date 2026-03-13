import { apiClient } from './client.js';

const buildQuery = (params = {}) => {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return;
    searchParams.set(key, String(value));
  });
  const query = searchParams.toString();
  return query ? `?${query}` : '';
};

export const menteeApi = {
  getMentees: (params = {}) => apiClient.get(`/mentees/${buildQuery(params)}`),
  getMenteeById: (menteeId) => apiClient.get(`/mentees/${menteeId}/`),
  updateMentee: (menteeId, payload) => apiClient.patch(`/mentees/${menteeId}/`, payload),
  getDashboard: (menteeId) => apiClient.get(`/mentees/${menteeId}/dashboard/`),
  getMenteePreferences: (menteeId) => apiClient.get(`/mentees/${menteeId}/preferences/`),
  updateMenteePreferences: (menteeId, payload) =>
    apiClient.patch(`/mentees/${menteeId}/preferences/`, payload),

  createRequest: (payload) => apiClient.post('/mentee-requests/', payload),
  listMenteeRequests: (params = {}) => apiClient.get(`/mentee-requests/${buildQuery(params)}`),

  listMentors: (params = {}) => apiClient.get(`/mentors/${buildQuery(params)}`),
  listPublicMentors: (params = {}) => apiClient.get(`/mentors/${buildQuery(params)}`, { auth: false }),
  getMentorById: (mentorId) => apiClient.get(`/mentors/${mentorId}/`),
  getMentorReviews: (mentorId) => apiClient.get(`/mentors/${mentorId}/reviews/`),
  getRecommendedMentors: (params = {}) => apiClient.get(`/mentors/recommended/${buildQuery(params)}`),

  listAvailabilitySlots: (params = {}) =>
    apiClient.get(`/mentor-availability-slots/${buildQuery(params)}`),

  listSessions: (params = {}) => apiClient.get(`/sessions/${buildQuery(params)}`),
  getSessionById: (sessionId) => apiClient.get(`/sessions/${sessionId}/`),
  createSession: (payload) => apiClient.post('/sessions/', payload),
  updateSession: (sessionId, payload) => apiClient.patch(`/sessions/${sessionId}/`, payload),
  getSessionJoinLink: (sessionId) => apiClient.post(`/sessions/${sessionId}/join-link/`),
  listSessionMeetingSignals: (sessionId, params = {}) =>
    apiClient.get(`/sessions/${sessionId}/meeting-signals/${buildQuery(params)}`, { trackLoading: false }),
  sendSessionMeetingSignal: (sessionId, payload) =>
    apiClient.post(`/sessions/${sessionId}/meeting-signals/`, payload),
  getSessionRecording: (sessionId) =>
    apiClient.get(`/sessions/${sessionId}/recording/`, { trackLoading: false }),
  getSessionRecordingUploadSignature: (sessionId, payload = {}) =>
    apiClient.post(`/sessions/${sessionId}/recording-upload-signature/`, payload),
  updateSessionRecording: (sessionId, payload) =>
    apiClient.post(`/sessions/${sessionId}/recording/`, payload),
  analyzeSessionTranscript: (sessionId, payload) =>
    apiClient.post(`/sessions/${sessionId}/analyze-transcript/`, payload),
  listSessionAbuseIncidents: (sessionId) =>
    apiClient.get(`/sessions/${sessionId}/abuse-incidents/`),

  getSessionFeedback: (sessionId) => apiClient.get(`/sessions/${sessionId}/feedback/`),
  submitSessionFeedback: (sessionId, payload) => apiClient.post(`/sessions/${sessionId}/feedback/`, payload),
  listSessionFeedback: (params = {}) => apiClient.get(`/session-feedback/${buildQuery(params)}`),
};
