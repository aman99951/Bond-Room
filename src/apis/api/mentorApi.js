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

export const mentorApi = {
  getMentors: (params = {}) => apiClient.get(`/mentors/${buildQuery(params)}`),
  getMentorById: (mentorId) => apiClient.get(`/mentors/${mentorId}/`),
  updateMentor: (mentorId, payload) => apiClient.patch(`/mentors/${mentorId}/`, payload),
  getMentorProfile: (mentorId) => apiClient.get(`/mentors/${mentorId}/profile/`),
  updateMentorProfile: (mentorId, payload) => apiClient.patch(`/mentors/${mentorId}/profile/`, payload),
  getMentorImpactDashboard: (mentorId) => apiClient.get(`/mentors/${mentorId}/impact-dashboard/`),
  getMentorOnboarding: (mentorId) => apiClient.get(`/mentors/${mentorId}/onboarding/`),
  submitAdminOnboardingDecision: (mentorId, payload) =>
    apiClient.post(`/mentors/${mentorId}/admin-decision/`, payload),

  listTrainingModules: (params = {}) => apiClient.get(`/training-modules/${buildQuery(params)}`),
  watchTrainingModuleVideo: (moduleId, payload) =>
    apiClient.post(`/training-modules/${moduleId}/watch-video/`, payload),
  getTrainingQuizStatus: (params = {}) =>
    apiClient.get(`/training-modules/quiz/${buildQuery(params)}`),
  startTrainingQuiz: (payload = {}) =>
    apiClient.post('/training-modules/quiz/start/', payload),
  submitTrainingQuiz: (payload) =>
    apiClient.post('/training-modules/quiz/submit/', payload),
  abandonTrainingQuiz: (payload) =>
    apiClient.post('/training-modules/quiz/abandon/', payload),
  listMentorTrainingProgress: (params = {}) =>
    apiClient.get(`/mentor-training-progress/${buildQuery(params)}`),
  createMentorTrainingProgress: (payload) => apiClient.post('/mentor-training-progress/', payload),
  updateMentorTrainingProgress: (progressId, payload) =>
    apiClient.patch(`/mentor-training-progress/${progressId}/`, payload),

  listAvailabilitySlots: (params = {}) =>
    apiClient.get(`/mentor-availability-slots/${buildQuery(params)}`),
  createAvailabilitySlot: (payload) => apiClient.post('/mentor-availability-slots/', payload),
  updateAvailabilitySlot: (slotId, payload) =>
    apiClient.patch(`/mentor-availability-slots/${slotId}/`, payload),
  deleteAvailabilitySlot: (slotId) => apiClient.delete(`/mentor-availability-slots/${slotId}/`),

  listSessions: (params = {}) => apiClient.get(`/sessions/${buildQuery(params)}`),
  getSessionRequestStats: (params = {}) =>
    apiClient.get(`/sessions/request-stats/${buildQuery(params)}`),
  getSessionById: (sessionId) => apiClient.get(`/sessions/${sessionId}/`),
  getMenteeProfileBySession: (sessionId) => apiClient.get(`/sessions/${sessionId}/mentee-profile/`),
  updateSession: (sessionId, payload) => apiClient.patch(`/sessions/${sessionId}/`, payload),
  terminateSession: (sessionId, payload = {}) => apiClient.post(`/sessions/${sessionId}/terminate/`, payload),
  getSessionJoinLink: (sessionId) => apiClient.post(`/sessions/${sessionId}/join-link/`),
  listSessionMeetingSignals: (sessionId, params = {}) =>
    apiClient.get(`/sessions/${sessionId}/meeting-signals/${buildQuery(params)}`, { trackLoading: false }),
  sendSessionMeetingSignal: (sessionId, payload) =>
    apiClient.post(`/sessions/${sessionId}/meeting-signals/`, payload, { trackLoading: false }),
  sendRealtimeTranscriptChunk: (sessionId, payload) =>
    apiClient.post(`/sessions/${sessionId}/realtime-transcript-chunk/`, payload, { trackLoading: false }),
  sendMentorRealtimeTranscriptSignal: (sessionId, payload) =>
    apiClient.post(`/sessions/${sessionId}/mentor-monitoring-transcript/`, payload, { trackLoading: false }),
  getSessionRecording: (sessionId) =>
    apiClient.get(`/sessions/${sessionId}/recording/`, { trackLoading: false }),
  getSessionRecordingUploadSignature: (sessionId, payload = {}) =>
    apiClient.post(`/sessions/${sessionId}/recording-upload-signature/`, payload, { trackLoading: false }),
  updateSessionRecording: (sessionId, payload) =>
    apiClient.post(`/sessions/${sessionId}/recording/`, payload, { trackLoading: false }),
  analyzeSessionTranscript: (sessionId, payload) =>
    apiClient.post(`/sessions/${sessionId}/analyze-transcript/`, payload, { trackLoading: false }),
  reportSessionBehavior: (sessionId, payload) =>
    apiClient.post(`/sessions/${sessionId}/report-behavior/`, payload, { trackLoading: false }),
  analyzeSessionVideoFrame: (sessionId, payload) =>
    apiClient.post(`/sessions/${sessionId}/analyze-video-frame/`, payload, { trackLoading: false }),
  listSessionAbuseIncidents: (sessionId) =>
    apiClient.get(`/sessions/${sessionId}/abuse-incidents/`, { trackLoading: false }),
  submitSessionDisposition: (sessionId, payload) =>
    apiClient.post(`/sessions/${sessionId}/disposition/`, payload),
  listSessionFeedback: (params = {}) => apiClient.get(`/session-feedback/${buildQuery(params)}`),

  listSessionDispositions: (params = {}) =>
    apiClient.get(`/session-dispositions/${buildQuery(params)}`),
  listMentorWallets: (params = {}) => apiClient.get(`/mentor-wallets/${buildQuery(params)}`),
  listPayoutTransactions: (params = {}) =>
    apiClient.get(`/payout-transactions/${buildQuery(params)}`),
  markPayoutTransactionPaid: (payoutId, payload = {}) =>
    apiClient.post(`/payout-transactions/${payoutId}/mark-paid/`, payload),
  listDonationTransactions: (params = {}) =>
    apiClient.get(`/donation-transactions/${buildQuery(params)}`),
  listSessionIssueReports: (params = {}) =>
    apiClient.get(`/session-issue-reports/${buildQuery(params)}`),

  listIdentityVerifications: (params = {}) =>
    apiClient.get(`/mentor-identity-verifications/${buildQuery(params)}`),
  createIdentityVerification: (payload) =>
    apiClient.post('/mentor-identity-verifications/', payload),
  updateIdentityVerification: (verificationId, payload) =>
    apiClient.patch(`/mentor-identity-verifications/${verificationId}/`, payload),
  setIdentityDocumentDecision: (verificationId, payload) =>
    apiClient.post(`/mentor-identity-verifications/${verificationId}/document-decision/`, payload),

  listContactVerifications: (params = {}) =>
    apiClient.get(`/mentor-contact-verifications/${buildQuery(params)}`),

  listOnboardingStatuses: (params = {}) =>
    apiClient.get(`/mentor-onboarding-statuses/${buildQuery(params)}`),
};
