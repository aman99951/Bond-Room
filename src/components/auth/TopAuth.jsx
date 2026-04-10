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
    <header className="lp-hdr">
      <div className="mx-auto flex w-full max-w-[1400px] 2xl:max-w-[min(97vw,3000px)] items-center gap-5 px-4 sm:px-6 lg:px-10 xl:px-14 2xl:px-6">
        <Link to="/" className="lp-logo" aria-label="Go to landing page" onClick={(event) => handleNavClick(event, '/')}>
          <img src={logo} alt="Bond Room" />
          <span>Bridging Old and New Destinies</span>
        </Link>

        <nav className="lp-nav">
          {shouldShowBack ? (
            <button
              type="button"
              onClick={handleBack}
              className="lp-ghost"
              aria-label="Go back"
            >
              Back
            </button>
          ) : null}
          <Link to="/" onClick={(event) => handleNavClick(event, '/')}>Home</Link>
        </nav>

        <div className="lp-hdr-actions">
          {isLoggedIn ? (
            <button
              type="button"
              onClick={handleLogout}
              className="lp-ghost"
            >
              Logout
            </button>
          ) : isLogin ? (
            <Link to="/register" className="lp-ghost" onClick={(event) => handleNavClick(event, '/register')}>
              Student Sign Up
            </Link>
          ) : (
            <Link to="/login" className="lp-ghost" onClick={(event) => handleNavClick(event, '/login')}>
              Login
            </Link>
          )}
        </div>
      </div>
    </header>
  );
};

export default TopAuth;
