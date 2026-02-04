// src/layouts/MainLayout.js
import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './side-top/Sidebar';
import BottomAuth from './auth/BottomAuth';
import logo from './assets/i.png';
// import OrderBot from '../components/OrderBot';

const MainLayout = ({ currentUser, onSignOut }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen md:h-screen flex flex-col bg-page">
      <div className="md:hidden bg-surface border-b border-gray-100 px-4 py-3 flex items-center justify-between">
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
          <span className="inline-flex h-7 w-7 items-center justify-center rounded-md bg-accent">
            <img src={logo} alt="Bond Room" className="h-4 w-4" />
          </span>
          <span className="text-sm font-semibold text-primary">Bond Room</span>
        </div>
        <div className="h-9 w-9" />
      </div>
      <div className="flex-1 flex flex-col md:overflow-hidden">
        <div className="flex-1 flex flex-col md:flex-row md:overflow-hidden">
          <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
          <main className="flex-1 md:overflow-y-auto" data-scroll-container="true" tabIndex={0} role="main">
            <div className="w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
              <Outlet />
            </div>
            <BottomAuth />
          </main>
        </div>
      </div>
      {/* <OrderBot /> */}
    </div>
  );
};

export default MainLayout;
