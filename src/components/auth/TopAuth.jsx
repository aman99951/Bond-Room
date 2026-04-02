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
    <header className="lp-hdr">
      <div className="mx-auto flex w-full max-w-[1400px] 2xl:max-w-[min(97vw,3000px)] items-center gap-5 px-4 sm:px-6 lg:px-10 xl:px-14 2xl:px-6">
        <Link to="/" className="lp-logo" aria-label="Go to landing page">
          <img src={logo} alt="Bond Room" />
          <span>Bridging Old and New Destinies</span>
        </Link>

        <nav className="lp-nav">
          <Link to="/">Home</Link>
        </nav>

        <div className="lp-hdr-actions">
          {isLoggedIn ? (
            <button
              type="button"
              onClick={handleLogout}
              className="lp-solid"
            >
              Logout
            </button>
          ) : isLogin ? (
            <Link to="/register" className="lp-solid">
              Student Sign Up
            </Link>
          ) : (
            <Link to="/login" className="lp-solid">
              Login
            </Link>
          )}
        </div>
      </div>
    </header>
  );
};

export default TopAuth;
