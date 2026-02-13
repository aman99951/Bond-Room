import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import logo from '../assets/logo.png';

const TopAuth = () => {
  const { pathname } = useLocation();
  const isLogin = pathname === '/login';

  return (
    <header className="border-b border-gray-100 bg-white">
      <div className="max-w-full mx-auto px-6 lg:px-[88px] h-[78px] flex items-center justify-between">
        <Link to="/" className="flex items-center" aria-label="Go to landing page">
          <img
            src={logo}
            alt="Bond Room"
            className="h-[49.7903px] w-[56.9998px] object-contain"
          />
        </Link>
        <div className="flex items-center gap-[47px] text-[13px] text-[#36323D]">
          <nav className="hidden md:flex items-center gap-[47px]">
            <a href="#" className="hover:text-primary">About</a>
            <a href="#" className="hover:text-primary">Contact</a>
            <a href="#" className="hover:text-primary">Help</a>
          </nav>
          {isLogin ? (
            <Link to="/register" className="px-4 py-1.5 rounded-md bg-accent text-on-accent text-[13px]">
              Register
            </Link>
          ) : (
            <Link to="/login" className="px-4 py-1.5 rounded-md bg-accent text-on-accent text-[13px]">
              Login
            </Link>
          )}
        </div>
      </div>
    </header>
  );
};

export default TopAuth;
