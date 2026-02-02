import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import logo from '../assets/i.png';

const TopAuth = () => {
  const { pathname } = useLocation();
  const isLogin = pathname === '/login';

  return (
    <header className="border-b border-gray-100">
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-20 h-14 sm:h-16 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="inline-flex h-7 w-7 items-center justify-center rounded-md bg-accent">
            <img src={logo} alt="Bond Room" className="h-4 w-4" />
          </span>
          <span className="text-sm font-semibold">Bond Room</span>
        </div>
        <nav className="hidden md:flex items-center gap-6 text-sm text-muted">
          <a href="#" className="hover:text-primary">About</a>
          <a href="#" className="hover:text-primary">Safety</a>
          <a href="#" className="hover:text-primary">Contact</a>
        </nav>
        <div className="flex items-center gap-3 sm:gap-4 text-sm">
          <a href="#" className="hidden sm:inline text-muted hover:text-primary">Help</a>
          {isLogin ? (
            <Link to="/register" className="px-3 sm:px-4 py-1.5 rounded-md bg-accent text-on-accent text-sm">
              Register
            </Link>
          ) : (
            <Link to="/login" className="px-3 sm:px-4 py-1.5 rounded-md bg-accent text-on-accent text-sm">
              Login
            </Link>
          )}
        </div>
      </div>
    </header>
  );
};

export default TopAuth;
