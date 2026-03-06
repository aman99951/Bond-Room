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
      <div className="mx-auto flex h-[70px] w-full max-w-[1400px] items-center justify-between px-4 sm:h-[74px] sm:px-6 lg:h-[78px] lg:px-10 xl:px-14">
        <Link to="/" className="flex items-center" aria-label="Go to landing page">
          <img
            src={logo}
            alt="Bond Room"
            className="h-9 w-auto object-contain sm:h-11"
          />
        </Link>
        <div className="flex items-center gap-3 text-[13px] text-[#36323D] sm:gap-4">
          <nav className="hidden items-center gap-6 lg:flex">
            <a href="#" className="hover:text-primary">About</a>
            <a href="#" className="hover:text-primary">Contact</a>
            <a href="#" className="hover:text-primary">Help</a>
          </nav>
          {isLoggedIn ? (
            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex min-w-[88px] justify-center rounded-md bg-accent px-3 py-2 text-[13px] text-on-accent sm:min-w-[96px]"
            >
              Logout
            </button>
          ) : isLogin ? (
            <Link to="/register" className="inline-flex min-w-[88px] justify-center rounded-md bg-accent px-3 py-2 text-[13px] text-on-accent sm:min-w-[96px]">
              Register
            </Link>
          ) : (
            <Link to="/login" className="inline-flex min-w-[88px] justify-center rounded-md bg-accent px-3 py-2 text-[13px] text-on-accent sm:min-w-[96px]">
              Login
            </Link>
          )}
        </div>
      </div>
    </header>
  );
};

export default TopAuth;
