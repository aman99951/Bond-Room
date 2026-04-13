import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import logo from '../assets/logo.png';
import { clearAuthSession, getAuthSession } from '../../apis/api/storage';

const VolunteerTopAuth = ({ lockNavigation = false, onBlockedNavigate, logoutRedirectTo = '/volunteer' }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const isLoggedIn = Boolean(getAuthSession()?.accessToken);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const currentPathWithSearch = useMemo(
    () => `${location.pathname}${location.search || ''}`,
    [location.pathname, location.search],
  );
  const shouldShowBack = location.pathname !== '/';
  const loginPath = `/login?next=${encodeURIComponent(currentPathWithSearch)}`;

  useEffect(() => {
    setDrawerOpen(false);
  }, [location.pathname, location.search]);

  const navigateGuarded = (targetPath) => {
    if (lockNavigation) {
      if (typeof onBlockedNavigate === 'function') onBlockedNavigate(targetPath);
      return false;
    }
    return true;
  };

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

  const handleBack = () => {
    if (!navigateGuarded('/')) return;
    if (typeof window !== 'undefined' && window.history.length > 1) {
      navigate(-1);
      return;
    }
    navigate('/');
  };

  const closeDrawer = () => setDrawerOpen(false);

  return (
    <>
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

          <nav className="lp-nav hidden md:flex items-center gap-2">
       
          <Link to="/" onClick={handleHomeClick}>Home</Link>
          <Link to="/volunteer" onClick={(event) => handleNavClick(event, '/volunteer')}>Volunteer</Link>
        </nav>

          <div className="hidden md:flex items-center gap-2">
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

          <button
            type="button"
            onClick={() => setDrawerOpen((open) => !open)}
            className="md:hidden ml-auto w-9 h-9 rounded-lg flex items-center justify-center hover:bg-[#EDE3FF] transition"
            aria-label={drawerOpen ? "Close menu" : "Open menu"}
            aria-expanded={drawerOpen}
          >
            {drawerOpen ? (
              <svg className="w-5 h-5 text-[#5D3699]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-5 h-5 text-[#5D3699]" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>
      </header>

    {drawerOpen ? (
      <div className="fixed inset-0 z-[100] flex">
        <div className="absolute inset-0 bg-[#4A2B7A]/40 backdrop-blur-sm" onClick={closeDrawer} />
        <div className="relative ml-auto w-[270px] max-w-[82vw] bg-white h-full shadow-2xl flex flex-col asc">
          <div className="flex items-center justify-between px-4 pt-4 pb-2 border-b border-[#EDE3FF]">
            <span className="font-bold text-[#5D3699] text-sm">Menu</span>
            <button onClick={closeDrawer} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-[#EDE3FF] transition text-sm" aria-label="Close menu">
              <svg className="w-4 h-4 text-[#5D3699]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          </div>
          <nav className="flex flex-col gap-0.5 p-3 flex-1">
       
            <Link to="/" onClick={(event) => { handleNavClick(event, '/'); closeDrawer(); }} className="px-3 py-2.5 rounded-lg text-sm font-medium text-[#5F6B81] hover:bg-[#EDE3FF] hover:text-[#5D3699] transition">Home</Link>
            <Link to="/volunteer" onClick={(event) => { handleNavClick(event, '/volunteer'); closeDrawer(); }} className="px-3 py-2.5 rounded-lg text-sm font-medium text-[#5F6B81] hover:bg-[#EDE3FF] hover:text-[#5D3699] transition">Volunteer</Link>
            {!isLoggedIn ? (
              <Link to={loginPath} onClick={(event) => { handleNavClick(event, loginPath); closeDrawer(); }} className="px-3 py-2.5 rounded-lg text-sm font-medium text-[#5F6B81] hover:bg-[#EDE3FF] hover:text-[#5D3699] transition">
                Log in
              </Link>
            ) : null}
          </nav>
          {isLoggedIn ? (
            <div className="p-3 border-t border-[#EDE3FF]">
              <button type="button" className="block w-full text-center px-4 py-2.5 text-sm font-bold text-white bg-gradient-to-r from-[#5D3699] to-[#5B2CC7] rounded-lg shadow-md" onClick={() => { closeDrawer(); handleLogout(); }}>
              Logout
            </button>
            </div>
          ) : null}
        </div>
      </div>
    ) : null}
    </>
  );
};

export default VolunteerTopAuth;
