// src/layouts/MainLayout.js
import React, { useEffect, useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './side-top/Sidebar';
import BottomAuth from './auth/BottomAuth';
import logo from '../assets/logo.png';
import { subscribeToApiLoading } from '../apis/api/requestLoading';
import MenteeMeetingInviteBanner from './meeting/MenteeMeetingInviteBanner';
import MeetingHost from './meeting/MeetingHost';

const MainLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [apiLoading, setApiLoading] = useState(false);

  useEffect(() => {
    const unsubscribe = subscribeToApiLoading((loading) => {
      setApiLoading(loading);
    });
    return unsubscribe;
  }, []);

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
    </div>
  );
};

export default MainLayout;
