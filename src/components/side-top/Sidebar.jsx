import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import logo from '../assets/i.png';
import { navRoutes } from '../../config/routes';

const Sidebar = ({ isOpen, onClose }) => {
  const [showLogout, setShowLogout] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    try {
      localStorage.removeItem('bookingComplete');
    } catch {
      // ignore storage errors
    }
    setShowLogout(false);
    navigate('/login');
  };

  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 bg-black/40 z-40 md:hidden" onClick={onClose} />
      )}
      <aside
        className={`w-full md:w-72 border-b md:border-r border-gray-100 bg-surface md:h-screen z-50 overflow-y-auto ${
          isOpen ? 'fixed inset-y-0 left-0' : 'hidden md:block'
        }`}
      >
      <div className="px-4 sm:px-5 py-4 flex items-center justify-between border-b border-gray-100">
        <div className="flex items-center gap-2">
          <span className="inline-flex h-7 w-7 items-center justify-center rounded-md bg-accent">
            <img src={logo} alt="Bond Room" className="h-4 w-4" />
          </span>
          <span className="text-sm font-semibold">Bond Room</span>
        </div>
        <div className="flex items-center gap-2">
          <button className="h-8 w-8 rounded-full bg-muted border border-gray-100 flex items-center justify-center">
            <svg className="h-4 w-4 text-muted" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M15 17h4l-1.4-1.4A2 2 0 0 1 17 14.2V11a5 5 0 1 0-10 0v3.2a2 2 0 0 1-.6 1.4L5 17h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              <path d="M10 17a2 2 0 0 0 4 0" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
          <button
            className="md:hidden h-8 w-8 rounded-full bg-muted border border-gray-100 flex items-center justify-center"
            onClick={onClose}
            aria-label="Close sidebar"
          >
            <svg className="h-4 w-4 text-muted" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M6 6l12 12M18 6l-12 12" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            </svg>
          </button>
        </div>
      </div>

      <div className="px-4 sm:px-5 py-4 flex items-center gap-3">
        <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
          <svg className="h-5 w-5 text-muted" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <circle cx="12" cy="8" r="3.5" stroke="currentColor" strokeWidth="1.5" />
            <path d="M4 20c1.7-3.4 5-5 8-5s6.3 1.6 8 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </div>
        <div className="text-sm">
          <div className="text-muted">Good Morning</div>
          <div className="font-semibold text-primary">Rajeswari</div>
        </div>
      </div>

      <nav className="px-3">
        <ul className="space-y-1">
          {navRoutes.map((item) => {
            const Icon = item.icon;
            return (
              <li key={item.path}>
                <NavLink
                  to={item.path}
                  onClick={() => {
                    if (onClose) onClose();
                  }}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2 rounded-md text-sm ${
                      isActive ? 'bg-muted text-primary' : 'text-muted hover:bg-muted'
                    }`
                  }
                >
                  <Icon className="h-4 w-4 text-muted" />
                  <span>{item.label}</span>
                </NavLink>
              </li>
            );
          })}
          <li className="pt-1">
            <button
              className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm text-muted hover:bg-muted"
              onClick={() => setShowLogout(true)}
            >
              <span className="h-4 w-4 text-muted">
                <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path d="M10 17l5-5-5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M4 12h11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  <path d="M14 5h6v14h-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </span>
              <span>Logout</span>
            </button>
          </li>
        </ul>
      </nav>

      <div className="px-4 sm:px-5 pt-4 border-t border-gray-100 mt-4">
        <div className="flex items-center gap-2 text-xs text-muted">
          <span className="h-4 w-4 text-subtle">
            <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.5" />
              <path d="M12 7v6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              <circle cx="12" cy="17" r="1" fill="currentColor" />
            </svg>
          </span>
          <span>Why these matches?</span>
        </div>
        <div className="mt-3 p-3 rounded-lg border border-gray-100 bg-muted text-xs text-muted">
          You're feeling overwhelmed and anxious, so we've matched you with mentors for study habits and
          stress management.
        </div>

        <div className="mt-4 text-xs text-muted">Language Preference</div>
        <div className="mt-1 text-sm text-secondary">Tamil, English</div>

        <div className="mt-4 text-xs text-muted">Availability</div>
        <div className="mt-1 text-sm text-secondary">Evenings, Weekends</div>

        <button className="mt-4 text-xs text-muted underline">Rematch / Refresh Suggestions</button>
      </div>
      {showLogout && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[60]">
          <div className="w-full max-w-sm rounded-2xl bg-surface p-6 shadow-lg">
            <h2 className="text-lg font-semibold text-primary">Log out?</h2>
            <p className="mt-2 text-sm text-muted">Are you sure you want to log out of Bond Room?</p>
            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                className="rounded-md border border-default px-4 py-2 text-sm text-secondary"
                onClick={() => setShowLogout(false)}
              >
                Cancel
              </button>
              <button
                className="rounded-md bg-accent px-4 py-2 text-sm text-on-accent"
                onClick={handleLogout}
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      )}
      </aside>
    </>
  );
};

export default Sidebar;
