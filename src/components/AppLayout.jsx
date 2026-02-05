// src/layouts/AppLayout.jsx
import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';

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
import MentorVerifyIdentity from './mentors/pages/VerifyIdentity';
import MentorVerifyContact from './mentors/pages/VerifyContact';
import MentorOnboardingStatus from './mentors/pages/OnboardingStatus';
import MentorTrainingModules from './mentors/pages/TrainingModules';
import MentorTrainingBoundaries from './mentors/pages/TrainingBoundaries';
import MentorImpactDashboard from './mentors/pages/ImpactDashboard';
import MentorMySessions from './mentors/pages/MySessions';
import MentorSessionCompleted from './mentors/pages/SessionCompleted';
import MentorImpact from './mentors/pages/ImpactDashboard';
import MentorAvailability from './mentors/pages/ManageAvailability';
import MentorMyprofilePage from './mentors/pages/Myprofile';
import LandingPage from './LandingPage';

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

const AppLayout = () => {
  return (
    <Router>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/mentor-register" element={<MentorRegister />} />
        <Route path="/mentor-verify-identity" element={<MentorVerifyIdentity />} />
        <Route path="/mentor-verify-contact" element={<MentorVerifyContact />} />
        <Route path="/mentor-onboarding-status" element={<MentorOnboardingStatus />} />
        <Route path="/mentor-training-modules" element={<MentorTrainingModules />} />
        <Route path="/mentor-training-boundaries" element={<MentorTrainingBoundaries />} />
        <Route path="/verify-parent" element={<VerifyParent />} />
        <Route path="/needs-assessment" element={<NeedsAssessment />} />
        <Route path="/needs-assessment/q2" element={<NeedsAssessmentQ2 />} />
        <Route path="/needs-assessment/q3" element={<NeedsAssessmentQ3 />} />
        <Route path="/needs-assessment/q4" element={<NeedsAssessmentQ4 />} />
        <Route path="/needs-assessment/q5" element={<NeedsAssessmentQ5 />} />
        <Route path="/*" element={<MainLayout />}>
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="my-sessions" element={<MySessions />} />
        <Route path="mentors" element={<Mentors />} />
        <Route path="profile" element={<Profile />} />
        <Route path="mentor-details" element={<MentorDetails />} />
        <Route path="book-session" element={<BookSession />} />
        <Route path="booking-success" element={<BookingSuccess />} />
        <Route path="feedback" element={<Feedback />} />
        <Route path="mentor-profile" element={<MentorProfile />} />
        <Route path="mentor-impact-dashboard" element={<MentorImpactDashboard />} />
        <Route path="mentor-dashboard" element={<MentorImpactDashboard />} />
        <Route path="mentor-impact" element={<MentorImpact />} />
        <Route path="mentor-sessions" element={<MentorMySessions />} />
        <Route path="mentor-session-completed" element={<MentorSessionCompleted />} />
        <Route path="mentor-availability" element={<MentorAvailability />} />
        <Route path="mentor-myprofile" element={<MentorMyprofilePage />} />
      </Route>
        <Route path="*" element={<Navigate to="/register" replace />} />
      </Routes>
    </Router>
  );
};

export default AppLayout;
