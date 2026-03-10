import test from "node:test";
import assert from "node:assert/strict";

import { apiClient } from "./client.js";
import { authApi } from "./authApi.js";
import { menteeApi } from "./menteeApi.js";
import { mentorApi } from "./mentorApi.js";

const originalMethods = {
  get: apiClient.get,
  post: apiClient.post,
  patch: apiClient.patch,
  put: apiClient.put,
  delete: apiClient.delete,
};

const installApiClientSpy = () => {
  const calls = [];
  apiClient.get = (path, options) => {
    calls.push({ method: "get", path, options });
    return Promise.resolve({ ok: true });
  };
  apiClient.post = (path, data, options) => {
    calls.push({ method: "post", path, data, options });
    return Promise.resolve({ ok: true });
  };
  apiClient.patch = (path, data, options) => {
    calls.push({ method: "patch", path, data, options });
    return Promise.resolve({ ok: true });
  };
  apiClient.put = (path, data, options) => {
    calls.push({ method: "put", path, data, options });
    return Promise.resolve({ ok: true });
  };
  apiClient.delete = (path, options) => {
    calls.push({ method: "delete", path, options });
    return Promise.resolve({ ok: true });
  };
  return calls;
};

const restoreApiClientMethods = () => {
  apiClient.get = originalMethods.get;
  apiClient.post = originalMethods.post;
  apiClient.patch = originalMethods.patch;
  apiClient.put = originalMethods.put;
  apiClient.delete = originalMethods.delete;
};

const runCase = async ({ api, fnName, args, expectedMethod, expectedPath }) => {
  const calls = installApiClientSpy();
  try {
    await api[fnName](...args);
    assert.equal(calls.length, 1, `${fnName} should call apiClient exactly once`);
    assert.equal(calls[0].method, expectedMethod, `${fnName} used wrong HTTP helper`);
    assert.equal(calls[0].path, expectedPath, `${fnName} used wrong path`);
  } finally {
    restoreApiClientMethods();
  }
};

test("authApi maps every wrapper to correct endpoint", async () => {
  const cases = [
    { fnName: "registerAdmin", args: [{}], expectedMethod: "post", expectedPath: "/auth/register/admin/" },
    { fnName: "registerMentee", args: [{}], expectedMethod: "post", expectedPath: "/auth/register/mentee/" },
    { fnName: "registerMentor", args: [{}], expectedMethod: "post", expectedPath: "/auth/register/mentor/" },
    { fnName: "sendParentOtp", args: [{}], expectedMethod: "post", expectedPath: "/auth/parent-consent/send-otp/" },
    { fnName: "verifyParentOtp", args: [{}], expectedMethod: "post", expectedPath: "/auth/parent-consent/verify-otp/" },
    { fnName: "sendMentorOtp", args: [{}], expectedMethod: "post", expectedPath: "/auth/mentor-contact/send-otp/" },
    { fnName: "verifyMentorOtp", args: [{}], expectedMethod: "post", expectedPath: "/auth/mentor-contact/verify-otp/" },
    { fnName: "verifyMobileLoginOtp", args: [{}], expectedMethod: "post", expectedPath: "/auth/mobile-login/verify-otp/" },
    { fnName: "getLocationStates", args: [], expectedMethod: "get", expectedPath: "/locations/states/" },
    { fnName: "getLocationCities", args: ["Tamil Nadu"], expectedMethod: "get", expectedPath: "/locations/cities/?state=Tamil%20Nadu" },
    { fnName: "login", args: [{}], expectedMethod: "post", expectedPath: "/login/" },
    { fnName: "adminLogin", args: [{}], expectedMethod: "post", expectedPath: "/admin/login/" },
    { fnName: "logout", args: [], expectedMethod: "post", expectedPath: "/auth/logout/" },
  ];

  for (const item of cases) {
    await runCase({ api: authApi, ...item });
  }
});

test("menteeApi maps every wrapper to correct endpoint", async () => {
  const cases = [
    { fnName: "getMentees", args: [{ email: "test@example.com" }], expectedMethod: "get", expectedPath: "/mentees/?email=test%40example.com" },
    { fnName: "getMenteeById", args: [11], expectedMethod: "get", expectedPath: "/mentees/11/" },
    { fnName: "updateMentee", args: [11, {}], expectedMethod: "patch", expectedPath: "/mentees/11/" },
    { fnName: "getDashboard", args: [11], expectedMethod: "get", expectedPath: "/mentees/11/dashboard/" },
    { fnName: "getMenteePreferences", args: [11], expectedMethod: "get", expectedPath: "/mentees/11/preferences/" },
    { fnName: "updateMenteePreferences", args: [11, {}], expectedMethod: "patch", expectedPath: "/mentees/11/preferences/" },
    { fnName: "createRequest", args: [{}], expectedMethod: "post", expectedPath: "/mentee-requests/" },
    { fnName: "listMenteeRequests", args: [{ mentee_id: 11 }], expectedMethod: "get", expectedPath: "/mentee-requests/?mentee_id=11" },
    { fnName: "listMentors", args: [{ email: "mentor@example.com" }], expectedMethod: "get", expectedPath: "/mentors/?email=mentor%40example.com" },
    { fnName: "getMentorById", args: [22], expectedMethod: "get", expectedPath: "/mentors/22/" },
    { fnName: "getMentorReviews", args: [22], expectedMethod: "get", expectedPath: "/mentors/22/reviews/" },
    { fnName: "getRecommendedMentors", args: [{ mentee_request_id: 3 }], expectedMethod: "get", expectedPath: "/mentors/recommended/?mentee_request_id=3" },
    { fnName: "listAvailabilitySlots", args: [{ mentor_id: 22 }], expectedMethod: "get", expectedPath: "/mentor-availability-slots/?mentor_id=22" },
    { fnName: "listSessions", args: [{ status: "approved" }], expectedMethod: "get", expectedPath: "/sessions/?status=approved" },
    { fnName: "getSessionById", args: [44], expectedMethod: "get", expectedPath: "/sessions/44/" },
    { fnName: "createSession", args: [{}], expectedMethod: "post", expectedPath: "/sessions/" },
    { fnName: "getSessionJoinLink", args: [44], expectedMethod: "post", expectedPath: "/sessions/44/join-link/" },
    { fnName: "listSessionMeetingSignals", args: [44, { after_id: 12 }], expectedMethod: "get", expectedPath: "/sessions/44/meeting-signals/?after_id=12" },
    { fnName: "sendSessionMeetingSignal", args: [44, {}], expectedMethod: "post", expectedPath: "/sessions/44/meeting-signals/" },
    { fnName: "getSessionRecordingUploadSignature", args: [44, {}], expectedMethod: "post", expectedPath: "/sessions/44/recording-upload-signature/" },
    { fnName: "updateSessionRecording", args: [44, {}], expectedMethod: "post", expectedPath: "/sessions/44/recording/" },
    { fnName: "analyzeSessionTranscript", args: [44, {}], expectedMethod: "post", expectedPath: "/sessions/44/analyze-transcript/" },
    { fnName: "listSessionAbuseIncidents", args: [44], expectedMethod: "get", expectedPath: "/sessions/44/abuse-incidents/" },
    { fnName: "getSessionFeedback", args: [44], expectedMethod: "get", expectedPath: "/sessions/44/feedback/" },
    { fnName: "submitSessionFeedback", args: [44, {}], expectedMethod: "post", expectedPath: "/sessions/44/feedback/" },
    { fnName: "listSessionFeedback", args: [{ session_id: 44 }], expectedMethod: "get", expectedPath: "/session-feedback/?session_id=44" },
  ];

  for (const item of cases) {
    await runCase({ api: menteeApi, ...item });
  }
});

test("mentorApi maps every wrapper to correct endpoint", async () => {
  const cases = [
    { fnName: "getMentors", args: [{ email: "mentor@example.com" }], expectedMethod: "get", expectedPath: "/mentors/?email=mentor%40example.com" },
    { fnName: "getMentorById", args: [22], expectedMethod: "get", expectedPath: "/mentors/22/" },
    { fnName: "updateMentor", args: [22, {}], expectedMethod: "patch", expectedPath: "/mentors/22/" },
    { fnName: "getMentorProfile", args: [22], expectedMethod: "get", expectedPath: "/mentors/22/profile/" },
    { fnName: "updateMentorProfile", args: [22, {}], expectedMethod: "patch", expectedPath: "/mentors/22/profile/" },
    { fnName: "getMentorImpactDashboard", args: [22], expectedMethod: "get", expectedPath: "/mentors/22/impact-dashboard/" },
    { fnName: "getMentorOnboarding", args: [22], expectedMethod: "get", expectedPath: "/mentors/22/onboarding/" },
    { fnName: "submitAdminOnboardingDecision", args: [22, {}], expectedMethod: "post", expectedPath: "/mentors/22/admin-decision/" },
    { fnName: "listTrainingModules", args: [{ mentor_id: 22 }], expectedMethod: "get", expectedPath: "/training-modules/?mentor_id=22" },
    { fnName: "watchTrainingModuleVideo", args: [5, { video_index: 1 }], expectedMethod: "post", expectedPath: "/training-modules/5/watch-video/" },
    { fnName: "getTrainingQuizStatus", args: [{ mentor_id: 22 }], expectedMethod: "get", expectedPath: "/training-modules/quiz/?mentor_id=22" },
    { fnName: "startTrainingQuiz", args: [{ mentor_id: 22 }], expectedMethod: "post", expectedPath: "/training-modules/quiz/start/" },
    { fnName: "submitTrainingQuiz", args: [{ attempt_id: 1, selected_answers: [0] }], expectedMethod: "post", expectedPath: "/training-modules/quiz/submit/" },
    { fnName: "abandonTrainingQuiz", args: [{ attempt_id: 1 }], expectedMethod: "post", expectedPath: "/training-modules/quiz/abandon/" },
    { fnName: "listMentorTrainingProgress", args: [{ mentor_id: 22 }], expectedMethod: "get", expectedPath: "/mentor-training-progress/?mentor_id=22" },
    { fnName: "createMentorTrainingProgress", args: [{}], expectedMethod: "post", expectedPath: "/mentor-training-progress/" },
    { fnName: "updateMentorTrainingProgress", args: [5, {}], expectedMethod: "patch", expectedPath: "/mentor-training-progress/5/" },
    { fnName: "listAvailabilitySlots", args: [{ mentor_id: 22 }], expectedMethod: "get", expectedPath: "/mentor-availability-slots/?mentor_id=22" },
    { fnName: "createAvailabilitySlot", args: [{}], expectedMethod: "post", expectedPath: "/mentor-availability-slots/" },
    { fnName: "updateAvailabilitySlot", args: [8, {}], expectedMethod: "patch", expectedPath: "/mentor-availability-slots/8/" },
    { fnName: "deleteAvailabilitySlot", args: [8], expectedMethod: "delete", expectedPath: "/mentor-availability-slots/8/" },
    { fnName: "listSessions", args: [{ mentor_id: 22 }], expectedMethod: "get", expectedPath: "/sessions/?mentor_id=22" },
    { fnName: "getSessionRequestStats", args: [{ mentor_id: 22 }], expectedMethod: "get", expectedPath: "/sessions/request-stats/?mentor_id=22" },
    { fnName: "getSessionById", args: [44], expectedMethod: "get", expectedPath: "/sessions/44/" },
    { fnName: "getMenteeProfileBySession", args: [44], expectedMethod: "get", expectedPath: "/sessions/44/mentee-profile/" },
    { fnName: "updateSession", args: [44, {}], expectedMethod: "patch", expectedPath: "/sessions/44/" },
    { fnName: "getSessionJoinLink", args: [44], expectedMethod: "post", expectedPath: "/sessions/44/join-link/" },
    { fnName: "listSessionMeetingSignals", args: [44, { after_id: 12 }], expectedMethod: "get", expectedPath: "/sessions/44/meeting-signals/?after_id=12" },
    { fnName: "sendSessionMeetingSignal", args: [44, {}], expectedMethod: "post", expectedPath: "/sessions/44/meeting-signals/" },
    { fnName: "getSessionRecordingUploadSignature", args: [44, {}], expectedMethod: "post", expectedPath: "/sessions/44/recording-upload-signature/" },
    { fnName: "updateSessionRecording", args: [44, {}], expectedMethod: "post", expectedPath: "/sessions/44/recording/" },
    { fnName: "analyzeSessionTranscript", args: [44, {}], expectedMethod: "post", expectedPath: "/sessions/44/analyze-transcript/" },
    { fnName: "listSessionAbuseIncidents", args: [44], expectedMethod: "get", expectedPath: "/sessions/44/abuse-incidents/" },
    { fnName: "submitSessionDisposition", args: [44, {}], expectedMethod: "post", expectedPath: "/sessions/44/disposition/" },
    { fnName: "listSessionFeedback", args: [{ session_id: 44 }], expectedMethod: "get", expectedPath: "/session-feedback/?session_id=44" },
    { fnName: "listSessionDispositions", args: [{ mentor_id: 22 }], expectedMethod: "get", expectedPath: "/session-dispositions/?mentor_id=22" },
    { fnName: "listMentorWallets", args: [{ mentor_id: 22 }], expectedMethod: "get", expectedPath: "/mentor-wallets/?mentor_id=22" },
    { fnName: "listPayoutTransactions", args: [{ mentor_id: 22 }], expectedMethod: "get", expectedPath: "/payout-transactions/?mentor_id=22" },
    { fnName: "markPayoutTransactionPaid", args: [9, {}], expectedMethod: "post", expectedPath: "/payout-transactions/9/mark-paid/" },
    { fnName: "listDonationTransactions", args: [{ mentor_id: 22 }], expectedMethod: "get", expectedPath: "/donation-transactions/?mentor_id=22" },
    { fnName: "listSessionIssueReports", args: [{ mentor_id: 22 }], expectedMethod: "get", expectedPath: "/session-issue-reports/?mentor_id=22" },
    { fnName: "listIdentityVerifications", args: [{ mentor_id: 22 }], expectedMethod: "get", expectedPath: "/mentor-identity-verifications/?mentor_id=22" },
    { fnName: "createIdentityVerification", args: [{}], expectedMethod: "post", expectedPath: "/mentor-identity-verifications/" },
    { fnName: "updateIdentityVerification", args: [7, {}], expectedMethod: "patch", expectedPath: "/mentor-identity-verifications/7/" },
    { fnName: "setIdentityDocumentDecision", args: [7, {}], expectedMethod: "post", expectedPath: "/mentor-identity-verifications/7/document-decision/" },
    { fnName: "listContactVerifications", args: [{ mentor_id: 22 }], expectedMethod: "get", expectedPath: "/mentor-contact-verifications/?mentor_id=22" },
    { fnName: "listOnboardingStatuses", args: [{ mentor_id: 22 }], expectedMethod: "get", expectedPath: "/mentor-onboarding-statuses/?mentor_id=22" },
  ];

  for (const item of cases) {
    await runCase({ api: mentorApi, ...item });
  }
});
