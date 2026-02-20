// src/layouts/AppLayout.jsx
import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';

import Register from './auth/Register';
import MentorRegister from './auth/MentorRegister';
import Login from './auth/Login';
import VerifyParent from './auth/VerifyParent';
import NeedsAssessment from './auth/NeedsAssessment';
import NeedsAssessmentQ2 from './auth/NeedsAssessmentQ2';
import NeedsAssessmentQ3 from './auth/NeedsAssessmentQ3';
import NeedsAssessmentQ4 from './auth/NeedsAssessmentQ4';
import NeedsAssessmentQ5 from './auth/NeedsAssessmentQ5';
import MainLayout from './MainLayout';
import Dashboard from './menties/pages/Dashboard';
import MySessions from './menties/pages/MySessions';
import Mentors from './menties/pages/Mentors';
import Profile from './menties/pages/Profile';
import MentorDetails from './menties/pages/MentorDetails';
import BookSession from './menties/pages/BookSession';
import BookingSuccess from './menties/pages/BookingSuccess';
import Feedback from './menties/pages/Feedback';
import MentorProfile from './menties/pages/MentorProfile';
import MenteeZoomMeeting from './menties/pages/ZoomMeeting';
import MentorVerifyIdentity from './mentors/pages/VerifyIdentity';
import MentorOnboardingStatus from './mentors/pages/OnboardingStatus';
import MentorTrainingModules from './mentors/pages/TrainingModules';
import MentorTrainingBoundaries from './mentors/pages/TrainingBoundaries';
import MentorTrainingQuiz from './mentors/pages/TrainingQuiz';
import MentorImpactDashboard from './mentors/pages/ImpactDashboard';
import MentorMySessions from './mentors/pages/MySessions';
import MentorSessionRequests from './mentors/pages/SessionRequests';
import MentorSessionCompleted from './mentors/pages/SessionCompleted';
import MentorZoomMeeting from './mentors/pages/ZoomMeeting';
import MentorImpact from './mentors/pages/ImpactDashboard';
import MentorAvailability from './mentors/pages/ManageAvailability';
import MentorMyprofilePage from './mentors/pages/Myprofile';
import MentorMenteeProfile from './mentors/pages/MenteeProfile';
import AdminPortal from './admin/AdminPortal';
import LandingPage from './LandingPage';
import {
  AUTH_LOGOUT_EVENT_NAME,
  getAuthSession,
  mapAppRoleToUiRole,
} from '../apis/api/storage';
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
  if (pathname === '/admin') return true;
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
    '/verify-parent',
    '/needs-assessment',
  ]);
  if (exactPublicPaths.has(pathname)) return true;
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

const ProtectedApp = ({ children }) => {
  const session = getAuthSession();
  if (!session?.accessToken) {
    return <Navigate to="/login" replace />;
  }
  return children;
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

const AppLayout = () => {
  return (
    <Router>
      <ScrollToTop />
      <AuthExpiryWatcher />
      <Routes>
        <Route path="/" element={<LandingPage />} />
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
        <Route path="/verify-parent" element={<VerifyParent />} />
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
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="my-sessions" element={<MySessions />} />
        <Route path="mentors" element={<Mentors />} />
        <Route path="profile" element={<Profile />} />
        <Route path="mentor-details" element={<MentorDetails />} />
        <Route path="book-session" element={<BookSession />} />
        <Route path="booking-success" element={<BookingSuccess />} />
        <Route path="feedback" element={<Feedback />} />
        <Route path="mentee-zoom-meeting" element={<MenteeZoomMeeting />} />
        <Route path="mentor-profile" element={<MentorProfile />} />
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
        <Route path="mentor-mentee-profile/:sessionId" element={<MentorMenteeProfile />} />
        <Route path="mentor-session-requests" element={<MentorSessionRequests />} />
        <Route path="mentor-session-completed" element={<MentorSessionCompleted />} />
        <Route path="mentor-zoom-meeting" element={<MentorZoomMeeting />} />
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
