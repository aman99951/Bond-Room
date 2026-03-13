// src/layouts/MainLayout.js
import React, { useEffect, useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import Sidebar from './side-top/Sidebar';
import BottomAuth from './auth/BottomAuth';
import logo from '../assets/logo.png';
import { subscribeToApiLoading } from '../apis/api/requestLoading';
import MenteeMeetingInviteBanner from './meeting/MenteeMeetingInviteBanner';
import MeetingHost from './meeting/MeetingHost';
import { getAuthSession, mapAppRoleToUiRole } from '../apis/api/storage';
import { Sparkles } from 'lucide-react';

const MENTOR_TOUR_DONE_KEY = 'bondroom_mentor_tour_done_v1';

const mentorTourSteps = [
  {
    title: 'Welcome to Mentor Workspace',
    description: 'Use the left sidebar to move between Mentor Dashboard, Sessions, and Availability.',
  },
  {
    title: 'Set Your Availability',
    description: 'Open Manage Availability and add your weekly slots so mentees can book you.',
    route: '/mentor-availability',
    cta: 'Open Availability',
  },
  {
    title: 'Review Session Requests',
    description: 'Check pending requests and approve the ones that fit your schedule.',
    route: '/mentor-session-requests',
    cta: 'Open Requests',
  },
  {
    title: 'Start Your Sessions',
    description: 'Track upcoming sessions from My Sessions and join meetings on time.',
    route: '/mentor-sessions',
    cta: 'Open My Sessions',
  },
];

const MainLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [apiLoading, setApiLoading] = useState(false);
  const [mentorTourOpen, setMentorTourOpen] = useState(false);
  const [mentorTourStep, setMentorTourStep] = useState(0);

  useEffect(() => {
    const unsubscribe = subscribeToApiLoading((loading) => {
      setApiLoading(loading);
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    const prevHtmlOverflow = document.documentElement.style.overflow;
    const prevBodyOverflow = document.body.style.overflow;
    document.documentElement.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';
    return () => {
      document.documentElement.style.overflow = prevHtmlOverflow;
      document.body.style.overflow = prevBodyOverflow;
    };
  }, []);

  useEffect(() => {
    const session = getAuthSession();
    const storedRole = localStorage.getItem('userRole');
    const uiRole = session?.role ? mapAppRoleToUiRole(session.role) : storedRole;
    if (uiRole !== 'mentors' || !session?.accessToken) return;
    const mentorTourKey = `${MENTOR_TOUR_DONE_KEY}:${session?.email || 'mentor'}`;
    if (localStorage.getItem(mentorTourKey) === 'true') return;
    setMentorTourOpen(true);
    setMentorTourStep(0);
  }, []);

  const completeMentorTour = () => {
    const session = getAuthSession();
    const mentorTourKey = `${MENTOR_TOUR_DONE_KEY}:${session?.email || 'mentor'}`;
    localStorage.setItem(mentorTourKey, 'true');
    setMentorTourOpen(false);
  };

  const handleMentorTourNext = () => {
    if (mentorTourStep >= mentorTourSteps.length - 1) {
      completeMentorTour();
      return;
    }
    setMentorTourStep((prev) => prev + 1);
  };

  const handleMentorTourGoTo = () => {
    const step = mentorTourSteps[mentorTourStep];
    if (!step?.route) return;
    if (location.pathname !== step.route) {
      navigate(step.route);
    }
  };

  return (
    // ✅ Changed: min-h-[100dvh] → h-[100dvh], added overflow-hidden for all sizes
    <div
      className="flex h-[100dvh] flex-col overflow-hidden bg-page"
      style={{ height: 'var(--app-height, 100dvh)', paddingBottom: 'env(safe-area-inset-bottom)' }}
    >

      {/* ── Mobile top bar ── */}
      <div className="shrink-0 lg:hidden bg-surface border-b border-gray-100 px-4 py-3 flex items-center justify-between">
        <button
          className="h-9 w-9 rounded-md border border-default flex items-center justify-center"
          onClick={() => setSidebarOpen(true)}
          aria-label="Open sidebar"
        >
          <svg className="h-5 w-5 text-secondary" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
        </button>
        <div className="flex items-center gap-2">
          <span className="inline-flex h-7 w-7 items-center justify-center rounded-md">
            <img src={logo} alt="Bond Room" className="h-4 w-4" />
          </span>
          <span className="text-sm font-semibold text-primary">Bond Room</span>
        </div>
        <div className="h-9 w-9" />
      </div>

      {/* ── Body: sidebar + main ── */}
      {/* ✅ Changed: added overflow-hidden for all sizes (was lg-only) */}
      <div className="flex flex-1 flex-col overflow-hidden min-h-0">
        <div className="flex flex-1 flex-col lg:flex-row overflow-hidden min-h-0">

          <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

          {/* ✅ Changed: split main into scrollable content + pinned BottomAuth */}
          <main className="flex flex-1 flex-col overflow-hidden min-h-0" role="main">

            {/* Scrollable content area */}
            <div
              className="flex-1 overflow-y-auto min-h-0 sm:px-2 sm:py-4 lg:px-4 lg:py-6"
              data-scroll-container="true"
              tabIndex={0}
            >
              <div className="w-full mx-auto">
                <MeetingHost />
                <MenteeMeetingInviteBanner />
                <Outlet />
              </div>
            </div>

            {/* ✅ BottomAuth: always pinned at the bottom, never scrolled away */}
            <div className="shrink-0">
              <BottomAuth />
            </div>

          </main>
        </div>
      </div>

      {/* ── Global loading spinner ── */}
      {apiLoading ? (
        <div className="fixed inset-0 z-[60] pointer-events-none flex items-center justify-center">
          <div className="rounded-full bg-white/85 p-4 shadow-md border border-default">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#d9d3e5] border-t-[#5D3699]" />
          </div>
        </div>
      ) : null}

      {mentorTourOpen ? (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-5 shadow-xl ring-1 ring-[#e5e7eb] sm:p-6">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 flex h-10 w-10 items-center justify-center rounded-xl bg-[#f5f3ff]">
                <Sparkles className="h-5 w-5 text-[#5D3699]" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold uppercase tracking-wide text-[#5D3699]">
                  Mentor Guide
                </p>
                <h3 className="mt-1 text-lg font-semibold text-[#111827]">
                  {mentorTourSteps[mentorTourStep]?.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-[#6b7280]">
                  {mentorTourSteps[mentorTourStep]?.description}
                </p>
              </div>
            </div>

            <div className="mt-4 flex items-center gap-1.5">
              {mentorTourSteps.map((_, idx) => (
                <span
                  key={idx}
                  className={`h-1.5 rounded-full transition-all ${idx === mentorTourStep ? 'w-8 bg-[#5D3699]' : 'w-4 bg-[#e5e7eb]'}`}
                />
              ))}
            </div>

            <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={completeMentorTour}
                className="inline-flex items-center justify-center rounded-xl border border-[#d1d5db] px-4 py-2 text-sm font-medium text-[#374151] hover:bg-[#f9fafb]"
              >
                Skip
              </button>
              {mentorTourSteps[mentorTourStep]?.route ? (
                <button
                  type="button"
                  onClick={handleMentorTourGoTo}
                  className="inline-flex items-center justify-center rounded-xl border border-[#5D3699]/20 bg-[#f5f3ff] px-4 py-2 text-sm font-medium text-[#5D3699] hover:bg-[#ede9fe]"
                >
                  {mentorTourSteps[mentorTourStep]?.cta || 'Open Page'}
                </button>
              ) : null}
              <button
                type="button"
                onClick={handleMentorTourNext}
                className="inline-flex items-center justify-center rounded-xl bg-[#5D3699] px-4 py-2 text-sm font-semibold text-white hover:bg-[#4a2b7a]"
              >
                {mentorTourStep >= mentorTourSteps.length - 1 ? 'Done' : 'Next'}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default MainLayout;
