import React from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import logo from '../assets/logo.png';
import { clearAuthSession, getAuthSession } from '../../apis/api/storage';

const TopAuth = ({ lockNavigation = false, onBlockedNavigate, logoutRedirectTo = '/login' }) => {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const isLogin = pathname === '/login';
  const isRegister = pathname === '/register';
  const isMentorRegister = pathname === '/mentor-register';
  const shouldShowBack = !isLogin && !isRegister && !isMentorRegister;
  const isLoggedIn = Boolean(getAuthSession()?.accessToken);

  const handleLogout = () => {
    if (lockNavigation) {
      if (typeof onBlockedNavigate === 'function') onBlockedNavigate('/login');
      return;
    }
    clearAuthSession();
    navigate(logoutRedirectTo);
  };

  const handleNavClick = (event, targetPath) => {
    if (!lockNavigation) return;
    event.preventDefault();
    if (typeof onBlockedNavigate === 'function') onBlockedNavigate(targetPath);
  };

  const handleBack = () => {
    if (lockNavigation) {
      if (typeof onBlockedNavigate === 'function') onBlockedNavigate('/');
      return;
    }
    if (typeof window !== 'undefined' && window.history.length > 1) {
      navigate(-1);
      return;
    }
    navigate('/');
  };

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-[color:var(--theme-v-hero-border)] bg-[linear-gradient(180deg,var(--theme-v-bg-mid)_0%,var(--theme-v-bg-end)_100%)]">
      <div className="mx-auto flex w-full max-w-[1400px] items-center gap-5 px-4 py-2 sm:px-6 lg:px-10 xl:px-14">
        <Link to="/" className="flex flex-col items-center leading-none" aria-label="Go to landing page" onClick={(event) => handleNavClick(event, '/')}>
          <div className="rounded-lg bg-white px-2 py-1 shadow-sm">
            <img src={logo} alt="Bond Room" className="h-12 w-auto object-contain" />
          </div>
          <span className="mt-1 hidden text-[10px] uppercase tracking-[0.25em] text-[color:var(--theme-v-text-secondary)] sm:block">
            Bridging Old and New Destinies
          </span>
        </Link>

        <nav className="ml-auto flex items-center gap-2 sm:gap-3">
          {shouldShowBack ? (
            <button
              type="button"
              onClick={handleBack}
              className="rounded-lg px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-[color:var(--theme-v-nav-text)] transition-colors hover:bg-[color:var(--theme-v-nav-hover-bg)] hover:text-[color:var(--theme-v-nav-hover-text)]"
              aria-label="Go back"
            >
              Back
            </button>
          ) : null}
          <Link
            to="/"
            onClick={(event) => handleNavClick(event, '/')}
            className="rounded-lg px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-[color:var(--theme-v-nav-text)] transition-colors hover:bg-[color:var(--theme-v-nav-hover-bg)] hover:text-[color:var(--theme-v-nav-hover-text)]"
          >
            Home
          </Link>
        </nav>

        <div className="flex items-center">
          {isLoggedIn ? (
            <button
              type="button"
              onClick={handleLogout}
              className="rounded-lg px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-[color:var(--theme-v-nav-text)] transition-colors hover:bg-[color:var(--theme-v-nav-hover-bg)] hover:text-[color:var(--theme-v-nav-hover-text)]"
            >
              Logout
            </button>
          ) : isLogin ? (
            <Link
              to="/register"
              className="rounded-lg px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-[color:var(--theme-v-nav-text)] transition-colors hover:bg-[color:var(--theme-v-nav-hover-bg)] hover:text-[color:var(--theme-v-nav-hover-text)]"
              onClick={(event) => handleNavClick(event, '/register')}
            >
              Student Sign Up
            </Link>
          ) : (
            <Link
              to="/login"
              className="rounded-lg px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-[color:var(--theme-v-nav-text)] transition-colors hover:bg-[color:var(--theme-v-nav-hover-bg)] hover:text-[color:var(--theme-v-nav-hover-text)]"
              onClick={(event) => handleNavClick(event, '/login')}
            >
              Login
            </Link>
          )}
        </div>
      </div>
    </header>
  );
};

export default TopAuth;
