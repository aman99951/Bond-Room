// src/layouts/AppLayout.jsx
import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';

import Register from './auth/Register';
import Login from './auth/Login';
import VerifyParent from './auth/VerifyParent';
import NeedsAssessment from './auth/NeedsAssessment';
import NeedsAssessmentQ2 from './auth/NeedsAssessmentQ2';
import NeedsAssessmentQ3 from './auth/NeedsAssessmentQ3';
import NeedsAssessmentQ4 from './auth/NeedsAssessmentQ4';
import NeedsAssessmentQ5 from './auth/NeedsAssessmentQ5';
import MainLayout from './MainLayout';
import Dashboard from './pages/Dashboard';
import MySessions from './pages/MySessions';
import Mentors from './pages/Mentors';
import Profile from './pages/Profile';
import MentorDetails from './pages/MentorDetails';
import BookSession from './pages/BookSession';
import BookingSuccess from './pages/BookingSuccess';
import Feedback from './pages/Feedback';
import MentorProfile from './pages/MentorProfile';

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
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
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
      </Route>
        <Route path="*" element={<Navigate to="/register" replace />} />
      </Routes>
    </Router>
  );
};

export default AppLayout;
