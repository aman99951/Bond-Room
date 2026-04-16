// src/layouts/AppLayout.jsx
import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';

import Register from './auth/Register';
import MentorRegister from './auth/MentorRegister';
import Login from './auth/Login';
import NeedsAssessment from './auth/NeedsAssessment';
import NeedsAssessmentQ2 from './auth/NeedsAssessmentQ2';
import NeedsAssessmentQ3 from './auth/NeedsAssessmentQ3';
import NeedsAssessmentQ4 from './auth/NeedsAssessmentQ4';
import NeedsAssessmentQ5 from './auth/NeedsAssessmentQ5';
import MainLayout from './MainLayout';
import Dashboard from './menties/pages/Dashboard';
import MySessions from './menties/pages/MySessions';
import SessionRequests from './menties/pages/SessionRequests';
import Profile from './menties/pages/Profile';
import MentorDetails from './menties/pages/MentorDetails';
import BookSession from './menties/pages/BookSession';
import BookingSuccess from './menties/pages/BookingSuccess';
import Feedback from './menties/pages/Feedback';
import MentorProfile from './menties/pages/MentorProfile';
import VolunteerEventRegister from './menties/pages/VolunteerEventRegister';
import RegisteredEvents from './menties/pages/RegisteredEvents';
import EventCertificate from './menties/pages/EventCertificate';
import MenteeMeetingRoom from './menties/pages/MeetingRoom';
import MentorVerifyIdentity from './mentors/pages/VerifyIdentity';
import MentorOnboardingStatus from './mentors/pages/OnboardingStatus';
import MentorTrainingModules from './mentors/pages/TrainingModules';
import MentorTrainingBoundaries from './mentors/pages/TrainingBoundaries';
import MentorTrainingQuiz from './mentors/pages/TrainingQuiz';
import MentorImpactDashboard from './mentors/pages/ImpactDashboard';
import MentorMySessions from './mentors/pages/MySessions';
import MentorSessionRequests from './mentors/pages/SessionRequests';
import MentorSessionCompleted from './mentors/pages/SessionCompleted';
import MentorMeetingRoom from './mentors/pages/MeetingRoom';
import MentorImpact from './mentors/pages/ImpactDashboard';
import MentorAvailability from './mentors/pages/ManageAvailability';
import MentorMyprofilePage from './mentors/pages/Myprofile';
import MentorMenteeProfile from './mentors/pages/MenteeProfile';
import SessionRecords from './shared/SessionRecords';
import AdminPortal from './admin/AdminPortal';
import AdminMentorReview from './admin/AdminMentorReview';
import AdminActivityPage from './admin/AdminActivityPage';
import AdminVolunteerEventsPage from './admin/AdminVolunteerEventsPage';
import LandingPage from './LandingPage';
import AboutUs from './AboutUs';
import DonationPage from './DonationPage';
import VolunteerPage from './VolunteerPage';
import CompletedEventStoryPage from './CompletedEventStoryPage';
import BondRoomChatbot from './chatbot/BondRoomChatbot';
import {
  AUTH_LOGOUT_EVENT_NAME,
  getAssessmentDraft,
  getAuthSession,
  mapAppRoleToUiRole,
} from '../apis/api/storage';
import { menteeApi } from '../apis/api/menteeApi';
import { mentorApi } from '../apis/api/mentorApi';
import { useMentorData } from '../apis/apihook/useMentorData';

const ScrollToTop = () => {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
    document.body.scrollTop = 0;
    document.documentElement.scrollTop = 0;
    const containers = document.querySelectorAll('[data-scroll-container]');
    containers.forEach((el) => {
      try {
        el.scrollTo({ top: 0, left: 0, behavior: 'auto' });
      } catch {
        el.scrollTop = 0;
        el.scrollLeft = 0;
      }
    });
  }, [pathname]);
  return null;
};

const isPublicPath = (pathname) => {
  if (pathname === '/admin' || pathname.startsWith('/admin/')) return true;
  const exactPublicPaths = new Set([
    '/',
    '/login',
    '/register',
    '/mentor-register',
    '/mentor-verify-identity',
    '/mentor-onboarding-status',
    '/mentor-training-modules',
    '/mentor-training-boundaries',
    '/mentor-training-modules-quiz',
    '/needs-assessment',
    '/about',
    '/volunteer',
    '/volunteer-events',
    '/donate',
  ]);
  if (exactPublicPaths.has(pathname)) return true;
  if (pathname.startsWith('/volunteer-events/')) return true;
  if (pathname.startsWith('/volunteer/completed/')) return true;
  return pathname.startsWith('/needs-assessment/');
};

const isCompletedStatus = (value) => {
  const normalized = String(value || '').toLowerCase();
  return normalized === 'completed' || normalized === 'verified';
};

const canAccessMentorDashboard = (status) => {
  const onboardingStatus = status || {};
  return (
    isCompletedStatus(onboardingStatus.application_status) &&
    isCompletedStatus(onboardingStatus.identity_status)
  );
};

const AuthExpiryWatcher = () => {
  const location = useLocation();

  useEffect(() => {
    if (isPublicPath(location.pathname)) return undefined;

    const checkAndRedirect = () => {
      const session = getAuthSession();
      if (!session?.accessToken && window.location.pathname !== '/login') {
        window.location.replace('/login');
      }
    };

    checkAndRedirect();
    const intervalId = window.setInterval(checkAndRedirect, 15000);
    const onVisibility = () => checkAndRedirect();
    const onLogoutEvent = () => checkAndRedirect();
    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener(AUTH_LOGOUT_EVENT_NAME, onLogoutEvent);

    return () => {
      window.clearInterval(intervalId);
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener(AUTH_LOGOUT_EVENT_NAME, onLogoutEvent);
    };
  }, [location.pathname]);

  return null;
};

const GlobalChatbot = () => {
  const { pathname } = useLocation();
  const normalizedPath = String(pathname || '').toLowerCase();
  const hideOnPaths = [
    '/mentee-meeting-room',
    '/mentor-meeting-room',
    '/zoom-meeting',
  ];
  const isHidden =
    hideOnPaths.some((part) => normalizedPath.includes(part)) ||
    normalizedPath === '/admin' ||
    normalizedPath.startsWith('/admin/');

  if (isHidden) return null;
  return <BondRoomChatbot />;
};

const ProtectedApp = ({ children }) => {
  const session = getAuthSession();
  if (!session?.accessToken) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

const RootRoute = () => {
  const session = getAuthSession();
  const uiRole = mapAppRoleToUiRole(session?.role);
  if (session?.accessToken && uiRole === 'menties') {
    return <Navigate to="/dashboard" replace />;
  }
  return <LandingPage />;
};

const ReturnToPreviousRoute = () => {
  const navigate = useNavigate();
  const session = getAuthSession();

  useEffect(() => {
    const canGoBack = window.history.length > 1;
    if (canGoBack) {
      navigate(-1);
      return;
    }

    const uiRole = mapAppRoleToUiRole(session?.role);
    if (uiRole === 'mentors') {
      navigate('/mentor-impact-dashboard', { replace: true });
      return;
    }
    if (uiRole === 'admins') {
      navigate('/admin', { replace: true });
      return;
    }
    if (session?.accessToken) {
      navigate('/dashboard', { replace: true });
      return;
    }
    navigate('/login', { replace: true });
  }, [navigate, session?.accessToken, session?.role]);

  return null;
};

const normalizeListPayload = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.results)) return payload.results;
  return [];
};

const hasValue = (value) => {
  if (Array.isArray(value)) return value.some((item) => String(item || '').trim());
  return Boolean(String(value || '').trim());
};

const ASSESSMENT_REQUIRED_KEYS = ['feeling', 'feeling_cause', 'support_type', 'comfort_level', 'language'];

const isAssessmentRequestComplete = (request) => {
  if (!request || typeof request !== 'object') return false;
  return ASSESSMENT_REQUIRED_KEYS.every((key) => hasValue(request[key]));
};

const draftHasAnyAssessmentValue = (draft) => {
  if (!draft || typeof draft !== 'object') return false;
  return (
    ASSESSMENT_REQUIRED_KEYS.some((key) => hasValue(draft[key])) ||
    hasValue(draft.feelings) ||
    hasValue(draft.feeling_causes)
  );
};

const isAssessmentDraftComplete = (draft) => {
  if (!draft || typeof draft !== 'object') return false;
  return ASSESSMENT_REQUIRED_KEYS.every((key) => hasValue(draft[key]));
};

const MentorDashboardGuard = ({ children }) => {
  const session = getAuthSession();
  const { mentor, loading: mentorLoading } = useMentorData();
  const [checking, setChecking] = useState(true);
  const [allowed, setAllowed] = useState(null);

  useEffect(() => {
    let cancelled = false;

    const checkStatus = async () => {
      if (session?.role !== 'mentor') {
        if (!cancelled) {
          setAllowed(false);
          setChecking(false);
        }
        return;
      }
      if (mentorLoading) {
        if (!cancelled) {
          setChecking(true);
        }
        return;
      }
      if (!mentor?.id) {
        if (!cancelled) {
          setAllowed(false);
          setChecking(false);
        }
        return;
      }
      if (!cancelled) {
        setChecking(true);
      }
      try {
        const response = await mentorApi.getMentorOnboarding(mentor.id);
        if (!cancelled) {
          setAllowed(canAccessMentorDashboard(response?.status));
        }
      } catch {
        if (!cancelled) {
          setAllowed(false);
        }
      } finally {
        if (!cancelled) setChecking(false);
      }
    };

    checkStatus();
    return () => {
      cancelled = true;
    };
  }, [mentor?.id, mentorLoading, session?.role]);

  if (!mentorLoading && !checking && allowed === false) {
    return <Navigate to="/mentor-onboarding-status" replace />;
  }

  return (
    <>
      {children}
      {(mentorLoading || checking) ? (
        <div className="mt-3 px-6 text-sm text-[#6b7280]">Checking onboarding status...</div>
      ) : null}
    </>
  );
};

const MenteeAssessmentGuard = ({ children }) => {
  const session = getAuthSession();
  const uiRole = mapAppRoleToUiRole(session?.role);
  const [checking, setChecking] = useState(true);
  const [hasAssessment, setHasAssessment] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const checkAssessment = async () => {
      if (!session?.accessToken || uiRole !== 'menties') {
        if (!cancelled) {
          setHasAssessment(true);
          setChecking(false);
        }
        return;
      }

      if (!session?.email) {
        if (!cancelled) {
          setHasAssessment(false);
          setChecking(false);
        }
        return;
      }

      const assessmentDraft = getAssessmentDraft();
      if (draftHasAnyAssessmentValue(assessmentDraft) && !isAssessmentDraftComplete(assessmentDraft)) {
        if (!cancelled) {
          setHasAssessment(false);
          setChecking(false);
        }
        return;
      }

      if (!cancelled) {
        setChecking(true);
      }

      try {
        const menteesResponse = await menteeApi.getMentees({ email: session.email });
        const mentees = normalizeListPayload(menteesResponse);
        const currentMentee = mentees[0] || null;
        if (!currentMentee?.id) {
          if (!cancelled) setHasAssessment(false);
          return;
        }
        const eventFlowOnly =
          currentMentee?.signup_source === 'event_flow' && !currentMentee?.mentee_program_enabled;
        if (eventFlowOnly) {
          if (!cancelled) setHasAssessment(true);
          return;
        }

        const requestsResponse = await menteeApi.listMenteeRequests({ mentee_id: currentMentee.id });
        const requests = normalizeListPayload(requestsResponse);
        const latestRequest = requests[0] || null;
        const hasCompleteAssessment = isAssessmentRequestComplete(latestRequest);
        if (!cancelled) {
          setHasAssessment(hasCompleteAssessment);
        }
      } catch {
        if (!cancelled) {
          setHasAssessment(false);
        }
      } finally {
        if (!cancelled) {
          setChecking(false);
        }
      }
    };

    checkAssessment();
    return () => {
      cancelled = true;
    };
  }, [session?.accessToken, session?.email, uiRole]);

  if (checking) {
    return <div className="mt-3 px-6 text-sm text-[#6b7280]">Checking assessment status...</div>;
  }

  if (!hasAssessment) {
    return <Navigate to="/needs-assessment" replace />;
  }

  return children;
};

const AppLayout = () => {
  useEffect(() => {
    const setAppHeight = () => {
      document.documentElement.style.setProperty('--app-height', `${window.innerHeight}px`);
    };
    setAppHeight();
    window.addEventListener('resize', setAppHeight);
    window.addEventListener('orientationchange', setAppHeight);
    return () => {
      window.removeEventListener('resize', setAppHeight);
      window.removeEventListener('orientationchange', setAppHeight);
    };
  }, []);

  return (
    <Router>
      <ScrollToTop />
      <AuthExpiryWatcher />
      <GlobalChatbot />
      <Routes>
        <Route path="/" element={<RootRoute />} />
        <Route path="/about" element={<AboutUs />} />
        <Route path="/volunteer" element={<VolunteerPage />} />
        <Route path="/volunteer/completed/:eventId" element={<CompletedEventStoryPage />} />
        <Route path="/volunteer-events" element={<Navigate to="/volunteer" replace />} />
        <Route path="/volunteer-events/:eventId/register" element={<VolunteerEventRegister />} />
        <Route path="/donate" element={<DonationPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/mentor-register" element={<MentorRegister />} />
        <Route path="/mentor-verify-identity" element={<MentorVerifyIdentity />} />
        <Route path="/mentor-verify-contact" element={<Navigate to="/mentor-register" replace />} />
        <Route path="/mentor-onboarding-status" element={<MentorOnboardingStatus />} />
        <Route path="/mentor-training-modules" element={<MentorTrainingModules />} />
        <Route path="/mentor-training-boundaries" element={<MentorTrainingBoundaries />} />
        <Route path="/mentor-training-modules-quiz" element={<MentorTrainingQuiz />} />
        <Route path="/mentor-training-quiz" element={<Navigate to="/mentor-training-modules-quiz" replace />} />
        <Route path="/admin" element={<AdminPortal />} />
        <Route path="/admin/activity" element={<AdminActivityPage />} />
        <Route path="/admin/volunteer-events" element={<AdminVolunteerEventsPage />} />
        <Route path="/admin/review/:mentorId" element={<AdminMentorReview />} />
        <Route path="/needs-assessment" element={<NeedsAssessment />} />
        <Route path="/needs-assessment/q2" element={<NeedsAssessmentQ2 />} />
        <Route path="/needs-assessment/q3" element={<NeedsAssessmentQ3 />} />
        <Route path="/needs-assessment/q4" element={<NeedsAssessmentQ4 />} />
        <Route path="/needs-assessment/q5" element={<NeedsAssessmentQ5 />} />
        <Route
          path="/*"
          element={(
            <ProtectedApp>
              <MainLayout />
            </ProtectedApp>
          )}
        >
        <Route
          path="dashboard"
          element={(
            <MenteeAssessmentGuard>
              <Dashboard />
            </MenteeAssessmentGuard>
          )}
        />
        <Route path="my-sessions" element={<MySessions />} />
        <Route path="session-requests" element={<SessionRequests />} />
        <Route path="session-records" element={<SessionRecords />} />
        <Route path="mentors" element={<Navigate to="/dashboard" replace />} />
        <Route path="profile" element={<Profile />} />
        <Route path="mentor-details" element={<MentorDetails />} />
        <Route path="book-session" element={<BookSession />} />
        <Route path="booking-success" element={<BookingSuccess />} />
        <Route path="feedback" element={<Feedback />} />
        <Route path="mentee-meeting-room" element={<MenteeMeetingRoom />} />
        <Route path="mentee-zoom-meeting" element={<MenteeMeetingRoom />} />
        <Route path="mentor-profile" element={<MentorProfile />} />
        <Route path="registered-events" element={<RegisteredEvents />} />
        <Route path="event-register/:eventId" element={<VolunteerEventRegister menteeOnly />} />
        <Route path="event-certificate/:registrationId" element={<EventCertificate />} />
        <Route
          path="mentor-impact-dashboard"
          element={(
            <MentorDashboardGuard>
              <MentorImpactDashboard />
            </MentorDashboardGuard>
          )}
        />
        <Route
          path="mentor-dashboard"
          element={(
            <MentorDashboardGuard>
              <MentorImpactDashboard />
            </MentorDashboardGuard>
          )}
        />
        <Route
          path="mentor-impact"
          element={(
            <MentorDashboardGuard>
              <MentorImpact />
            </MentorDashboardGuard>
          )}
        />
        <Route path="mentor-sessions" element={<MentorMySessions />} />
        <Route path="mentor-session-records" element={<SessionRecords />} />
        <Route path="mentor-mentee-profile/:sessionId" element={<MentorMenteeProfile />} />
        <Route path="mentor-session-requests" element={<MentorSessionRequests />} />
        <Route path="mentor-session-completed" element={<MentorSessionCompleted />} />
        <Route path="mentor-meeting-room" element={<MentorMeetingRoom />} />
        <Route path="mentor-zoom-meeting" element={<MentorMeetingRoom />} />
        <Route path="mentor-availability" element={<MentorAvailability />} />
        <Route path="mentor-myprofile" element={<MentorMyprofilePage />} />
        <Route path="*" element={<ReturnToPreviousRoute />} />
      </Route>
        <Route path="*" element={<ReturnToPreviousRoute />} />
      </Routes>
    </Router>
  );
};

export default AppLayout;




