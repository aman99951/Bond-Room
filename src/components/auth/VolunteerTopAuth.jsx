import React, { useMemo } from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import logo from '../assets/logo.png';
import { clearAuthSession, getAuthSession } from '../../apis/api/storage';

const VolunteerTopAuth = ({ lockNavigation = false, onBlockedNavigate, logoutRedirectTo = '/volunteer' }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const isLoggedIn = Boolean(getAuthSession()?.accessToken);

  const currentPathWithSearch = useMemo(
    () => `${location.pathname}${location.search || ''}`,
    [location.pathname, location.search],
  );
  const loginPath = `/login?next=${encodeURIComponent(currentPathWithSearch)}`;

  const handleLogout = () => {
    if (lockNavigation) {
      if (typeof onBlockedNavigate === 'function') onBlockedNavigate(loginPath);
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

  const handleHomeClick = (event) => {
    handleNavClick(event, '/');
    if (!lockNavigation) navigate('/');
  };

  return (
    <header className="lp-hdr">
      <div className="mx-auto flex w-full max-w-[1400px] 2xl:max-w-[min(97vw,3000px)] items-center gap-5 px-4 sm:px-6 lg:px-10 xl:px-14 2xl:px-6">
        <Link
          to="/"
          className="lp-logo"
          aria-label="Go to landing page"
          onClick={handleHomeClick}
        >
          <img src={logo} alt="Bond Room" />
          <span>Bridging Old and New Destinies</span>
        </Link>

        <nav className="lp-nav">
          <Link to="/" onClick={handleHomeClick}>Home</Link>
        </nav>

        <div className="lp-hdr-actions">
          {isLoggedIn ? (
            <button type="button" onClick={handleLogout} className="lp-solid">
              Logout
            </button>
          ) : (
            <Link to={loginPath} className="lp-solid" onClick={(event) => handleNavClick(event, loginPath)}>
              Login
            </Link>
          )}
        </div>
      </div>
    </header>
  );
};

export default VolunteerTopAuth;
