import React from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import logo from '../assets/logo.png';
import { clearAuthSession, getAuthSession } from '../../apis/api/storage';

const TopAuth = () => {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const isLogin = pathname === '/login';
  const isLoggedIn = Boolean(getAuthSession()?.accessToken);

  const handleLogout = () => {
    clearAuthSession();
    navigate('/login');
  };

  return (
    <header className="border-b border-gray-100 bg-white">
      <div className="mx-auto flex w-full max-w-[1400px] flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:py-4 lg:px-10 xl:px-14">
        <Link to="/" className="flex shrink-0 flex-col items-start" aria-label="Go to landing page">
          <img
            src={logo}
            alt="Bond Room"
            className="h-11 w-auto object-contain sm:h-12 lg:h-14"
          />
          <p className="mt-1 text-[10px] font-medium uppercase tracking-[0.2em] text-gray-500 sm:text-[11px]">
            Bridging Old and New Destinies
          </p>
        </Link>
        <div className="flex w-full flex-wrap items-center justify-between gap-3 text-[13px] text-[#36323D] sm:w-auto sm:justify-end sm:gap-4">
          <nav className="hidden items-center gap-4 md:flex lg:gap-6">
            <a href="#" className="hover:text-primary">About</a>
            <a href="#" className="hover:text-primary">Contact</a>
            <a href="#" className="hover:text-primary">Help</a>
          </nav>
          {isLoggedIn ? (
            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex min-w-[96px] justify-center rounded-md bg-accent px-4 py-2 text-[13px] text-on-accent"
            >
              Logout
            </button>
          ) : isLogin ? (
            <Link to="/register" className="inline-flex min-w-[96px] justify-center rounded-md bg-accent px-4 py-2 text-[13px] text-on-accent">
              Register
            </Link>
          ) : (
            <Link to="/login" className="inline-flex min-w-[96px] justify-center rounded-md bg-accent px-4 py-2 text-[13px] text-on-accent">
              Login
            </Link>
          )}
        </div>
      </div>
    </header>
  );
};

export default TopAuth;
