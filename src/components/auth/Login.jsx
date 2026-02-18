import React, { useState, useEffect } from 'react';
import TopAuth from './TopAuth';
import BottomAuth from './BottomAuth';
import { Link, useNavigate } from 'react-router-dom';
import logo from '../assets/logo.png';
import { useMenteeAuth } from '../../apis/apihook/useMenteeAuth';
import { clearAuthSession, mapAppRoleToUiRole } from '../../apis/api/storage';
import { mentorApi } from '../../apis/api/mentorApi';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [focusedField, setFocusedField] = useState(null);
  const [mounted, setMounted] = useState(false);
  const [shakeError, setShakeError] = useState(false);
  const navigate = useNavigate();
  const { loading, login } = useMenteeAuth();

  useEffect(() => {
    setTimeout(() => setMounted(true), 100);
  }, []);

  useEffect(() => {
    if (errorMessage) {
      setShakeError(true);
      const timer = setTimeout(() => setShakeError(false), 600);
      return () => clearTimeout(timer);
    }
  }, [errorMessage]);

  const handleLogin = async (event) => {
    event.preventDefault();
    setErrorMessage('');

    if (!email.trim() || !password) {
      setErrorMessage('Email and password are required.');
      return;
    }

    const normalizedEmail = email.trim().toLowerCase();

    try {
      const session = await login(normalizedEmail, password);
      const targetRole = mapAppRoleToUiRole(session?.role);

      if (targetRole === 'admins') {
        clearAuthSession();
        setErrorMessage('Admin login is available only on /admin.');
        return;
      }

      if (targetRole === 'mentors') {
        try {
          const mentors = await mentorApi.getMentors({ email: session?.email || normalizedEmail });
          const list = Array.isArray(mentors) ? mentors : mentors?.results || [];
          const currentMentor = list[0] || null;
          if (currentMentor?.id) {
            const onboarding = await mentorApi.getMentorOnboarding(currentMentor.id);
            const statusValue =
              onboarding?.status?.current_status ||
              onboarding?.status?.final_approval_status ||
              '';
            if (String(statusValue).toLowerCase() === 'completed') {
              navigate('/mentor-impact-dashboard');
              return;
            }
          }
          navigate('/mentor-onboarding-status');
        } catch {
          navigate('/mentor-onboarding-status');
        }
        return;
      }

      navigate('/dashboard');
    } catch (err) {
      setErrorMessage(err?.message || 'Unable to login with provided credentials.');
    }
  };

  return (
    <div className="min-h-screen bg-[#f4f2f7] text-primary flex flex-col overflow-hidden">
      <style>{`
        /* ========== PAGE ENTRANCE ========== */
        @keyframes fadeSlideUp {
          from {
            opacity: 0;
            transform: translateY(40px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes fadeSlideRight {
          from {
            opacity: 0;
            transform: translateX(-40px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        @keyframes fadeSlideLeft {
          from {
            opacity: 0;
            transform: translateX(40px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        @keyframes scaleIn {
          from {
            opacity: 0;
            transform: scale(0.8);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        /* ========== FLOATING PARTICLES ========== */
        @keyframes float1 {
          0%, 100% { transform: translate(0, 0) rotate(0deg); opacity: 0.3; }
          25% { transform: translate(20px, -30px) rotate(90deg); opacity: 0.6; }
          50% { transform: translate(-10px, -60px) rotate(180deg); opacity: 0.3; }
          75% { transform: translate(30px, -30px) rotate(270deg); opacity: 0.6; }
        }

        @keyframes float2 {
          0%, 100% { transform: translate(0, 0); opacity: 0.2; }
          33% { transform: translate(-25px, -40px); opacity: 0.5; }
          66% { transform: translate(15px, -70px); opacity: 0.2; }
        }

        @keyframes float3 {
          0%, 100% { transform: translate(0, 0) scale(1); opacity: 0.4; }
          50% { transform: translate(20px, -50px) scale(1.5); opacity: 0.1; }
        }

        @keyframes glowPulse {
          0%, 100% { box-shadow: 0 0 5px rgba(107, 78, 255, 0); }
          50% { box-shadow: 0 0 20px rgba(107, 78, 255, 0.15); }
        }

        /* ========== FIELD ANIMATIONS ========== */
        @keyframes fieldGlow {
          0% { box-shadow: 0 0 0 0 rgba(91, 44, 145, 0); }
          50% { box-shadow: 0 0 12px 3px rgba(91, 44, 145, 0.12); }
          100% { box-shadow: 0 0 6px 1px rgba(91, 44, 145, 0.06); }
        }

        @keyframes underlineExpand {
          from { transform: scaleX(0); }
          to { transform: scaleX(1); }
        }

        @keyframes labelFloat {
          from { transform: translateY(0); color: #6b7280; }
          to { transform: translateY(-2px); color: #5b2c91; }
        }

        /* ========== BUTTON ========== */
        @keyframes buttonPulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(91, 44, 145, 0.4); }
          50% { box-shadow: 0 0 0 8px rgba(91, 44, 145, 0); }
        }

        @keyframes ripple {
          to {
            transform: scale(4);
            opacity: 0;
          }
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        /* ========== ERROR ========== */
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-4px); }
          20%, 40%, 60%, 80% { transform: translateX(4px); }
        }

        @keyframes errorFadeIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }

        /* ========== STAT CARDS ========== */
        @keyframes cardHoverGlow {
          0%, 100% { border-color: rgba(255, 255, 255, 0.25); }
          50% { border-color: rgba(255, 255, 255, 0.5); }
        }

        @keyframes countUp {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }

        /* ========== BADGE BOUNCE ========== */
        @keyframes badgeBounce {
          0% { opacity: 0; transform: scale(0.3) translateY(-10px); }
          50% { transform: scale(1.05) translateY(0); }
          70% { transform: scale(0.95); }
          100% { opacity: 1; transform: scale(1); }
        }

        /* ========== LOGO ========== */
        @keyframes logoPulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.03); }
        }

        /* ========== CLASSES ========== */
        .page-enter {
          opacity: 0;
        }

        .page-enter-active {
          animation: fadeSlideUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }

        .left-panel-enter {
          animation: fadeSlideRight 0.9s cubic-bezier(0.16, 1, 0.3, 1) 0.2s both;
        }

        .right-panel-enter {
          animation: fadeSlideLeft 0.9s cubic-bezier(0.16, 1, 0.3, 1) 0.3s both;
        }

        .badge-enter {
          animation: badgeBounce 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) 0.6s both;
        }

        .title-enter {
          animation: fadeSlideUp 0.7s cubic-bezier(0.16, 1, 0.3, 1) 0.7s both;
        }

        .subtitle-enter {
          animation: fadeSlideUp 0.7s cubic-bezier(0.16, 1, 0.3, 1) 0.8s both;
        }

        .field-enter-1 {
          animation: fadeSlideUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) 0.9s both;
        }

        .field-enter-2 {
          animation: fadeSlideUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) 1.0s both;
        }

        .field-enter-3 {
          animation: fadeSlideUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) 1.1s both;
        }

        .button-enter {
          animation: fadeSlideUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) 1.2s both;
        }

        .register-enter {
          animation: fadeSlideUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) 1.3s both;
        }

        .logo-enter {
          animation: scaleIn 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) 0.4s both;
        }

        .left-title-enter {
          animation: fadeSlideUp 0.7s cubic-bezier(0.16, 1, 0.3, 1) 0.6s both;
        }

        .left-desc-enter {
          animation: fadeSlideUp 0.7s cubic-bezier(0.16, 1, 0.3, 1) 0.8s both;
        }

        .stat-card-1 {
          animation: fadeSlideUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) 1.0s both;
        }

        .stat-card-2 {
          animation: fadeSlideUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) 1.2s both;
        }

        .field-focused {
          animation: fieldGlow 0.6s ease-out forwards;
          border-color: #5b2c91 !important;
        }

        .label-focused {
          animation: labelFloat 0.3s ease-out forwards;
          color: #5b2c91;
        }

        .input-underline {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          height: 2px;
          background: linear-gradient(90deg, #5b2c91, #6b4eff, #5b2c91);
          transform: scaleX(0);
          transform-origin: center;
          transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1);
          border-radius: 2px;
        }

        .input-underline-active {
          transform: scaleX(1);
        }

        .input-wrapper {
          position: relative;
        }

        .shake-animation {
          animation: shake 0.6s cubic-bezier(0.36, 0.07, 0.19, 0.97) both;
        }

        .error-enter {
          animation: errorFadeIn 0.4s ease-out both;
        }

        .spinner {
          display: inline-block;
          width: 16px;
          height: 16px;
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-top-color: white;
          border-radius: 50%;
          animation: spin 0.7s linear infinite;
          margin-right: 8px;
        }

        .login-btn {
          position: relative;
          overflow: hidden;
          transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .login-btn:hover:not(:disabled) {
          background-color: #4a2273;
          transform: translateY(-1px);
          box-shadow: 0 4px 15px rgba(91, 44, 145, 0.3);
        }

        .login-btn:active:not(:disabled) {
          transform: translateY(0) scale(0.98);
          box-shadow: 0 2px 8px rgba(91, 44, 145, 0.2);
        }

        .login-btn::after {
          content: '';
          position: absolute;
          top: 50%;
          left: 50%;
          width: 5px;
          height: 5px;
          background: rgba(255, 255, 255, 0.5);
          opacity: 0;
          border-radius: 100%;
          transform: scale(1, 1) translate(-50%);
          transform-origin: 50% 50%;
        }

        .login-btn:focus:not(:active)::after {
          animation: ripple 0.6s ease-out;
        }

        .floating-particle {
          position: absolute;
          border-radius: 50%;
          pointer-events: none;
        }

        .particle-1 {
          width: 6px;
          height: 6px;
          background: rgba(255, 255, 255, 0.3);
          top: 30%;
          left: 20%;
          animation: float1 8s ease-in-out infinite;
        }

        .particle-2 {
          width: 4px;
          height: 4px;
          background: rgba(255, 255, 255, 0.2);
          top: 50%;
          left: 70%;
          animation: float2 10s ease-in-out infinite 1s;
        }

        .particle-3 {
          width: 8px;
          height: 8px;
          background: rgba(255, 255, 255, 0.15);
          top: 70%;
          left: 40%;
          animation: float3 12s ease-in-out infinite 2s;
        }

        .particle-4 {
          width: 5px;
          height: 5px;
          background: rgba(255, 255, 255, 0.25);
          top: 20%;
          left: 80%;
          animation: float1 9s ease-in-out infinite 3s;
        }

        .particle-5 {
          width: 3px;
          height: 3px;
          background: rgba(255, 255, 255, 0.35);
          top: 80%;
          left: 15%;
          animation: float2 11s ease-in-out infinite 0.5s;
        }

        .particle-6 {
          width: 7px;
          height: 7px;
          background: rgba(255, 255, 255, 0.1);
          top: 40%;
          left: 50%;
          animation: float3 14s ease-in-out infinite 4s;
        }

        .stat-card {
          transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .stat-card:hover {
          transform: translateY(-4px);
          background: rgba(255, 255, 255, 0.15);
          border-color: rgba(255, 255, 255, 0.5);
          box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
        }

        .logo-hover {
          transition: all 0.3s ease;
        }

        .logo-hover:hover {
          animation: logoPulse 0.6s ease-in-out;
          box-shadow: 0 4px 15px rgba(91, 44, 145, 0.2);
        }

        .forgot-link {
          position: relative;
          transition: all 0.3s ease;
        }

        .forgot-link::after {
          content: '';
          position: absolute;
          bottom: -1px;
          left: 0;
          width: 0;
          height: 1px;
          background: #5b2c91;
          transition: width 0.3s ease;
        }

        .forgot-link:hover::after {
          width: 100%;
        }

        .register-link {
          position: relative;
          transition: all 0.3s ease;
        }

        .register-link:hover {
          color: #4a2273;
          text-shadow: 0 0 8px rgba(91, 44, 145, 0.15);
        }

        .glow-card {
          animation: glowPulse 3s ease-in-out infinite;
        }

        .input-field {
          transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .input-field:hover:not(:focus) {
          border-color: #b8a5d4;
          box-shadow: 0 2px 8px rgba(91, 44, 145, 0.06);
        }
      `}</style>

      <TopAuth />

      <main className="flex-1">
        <div className="w-full flex justify-center px-4 sm:px-6 py-6 sm:py-10">
          <div
            className={`border border-[#e6e2f1] rounded-b-[12px] overflow-hidden bg-white shadow-sm w-full max-w-[1266px] glow-card ${
              mounted ? 'page-enter-active' : 'page-enter'
            }`}
          >
            <div className="grid grid-cols-1 xl:grid-cols-[591px_675px]">

              {/* ===== LEFT PANEL ===== */}
              <div className="hidden xl:flex w-[591px] bg-[#5b2c91] text-white p-10 flex-col justify-between relative overflow-hidden">

                {/* Floating Particles */}
                <div className="floating-particle particle-1"></div>
                <div className="floating-particle particle-2"></div>
                <div className="floating-particle particle-3"></div>
                <div className="floating-particle particle-4"></div>
                <div className="floating-particle particle-5"></div>
                <div className="floating-particle particle-6"></div>

                <div className={mounted ? 'left-panel-enter' : 'opacity-0'}>
                  <div className={`inline-flex items-center rounded-full bg-white px-3 py-2 logo-hover ${mounted ? 'logo-enter' : 'opacity-0'}`}>
                    <img src={logo} alt="Bond Room" className="h-9 w-auto" />
                  </div>
                  <h3 className={`mt-6 text-3xl font-semibold leading-tight ${mounted ? 'left-title-enter' : 'opacity-0'}`}>
                    Continue your
                    <br />
                    growth journey
                  </h3>
                  <p className={`mt-4 text-sm text-white/85 max-w-md ${mounted ? 'left-desc-enter' : 'opacity-0'}`}>
                    Login to access your dashboard, sessions, progress, and mentorship tools in one place.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3 relative z-10">
                  <div className={`rounded-xl border border-white/25 bg-white/10 p-4 stat-card ${mounted ? 'stat-card-1' : 'opacity-0'}`}>
                    <p className="text-2xl font-semibold">1:1</p>
                    <p className="mt-1 text-xs text-white/80">Mentorship sessions</p>
                  </div>
                  <div className={`rounded-xl border border-white/25 bg-white/10 p-4 stat-card ${mounted ? 'stat-card-2' : 'opacity-0'}`}>
                    <p className="text-2xl font-semibold">24x7</p>
                    <p className="mt-1 text-xs text-white/80">Support ecosystem</p>
                  </div>
                </div>
              </div>

              {/* ===== RIGHT PANEL ===== */}
              <div className={`p-6 sm:p-8 lg:p-10 bg-[#f7f5fa] w-full xl:w-[675px] ${mounted ? 'right-panel-enter' : 'opacity-0'}`}>

                <div className={mounted ? 'badge-enter' : 'opacity-0'}>
                  <div className="inline-flex items-center rounded-full bg-[#ede7f6] text-xs text-[#6b4eff] px-3 py-1 font-medium">
                    ✨ Welcome back
                  </div>
                </div>

                <h2 className={`mt-3 text-lg sm:text-2xl font-semibold text-[#1f2937] ${mounted ? 'title-enter' : 'opacity-0'}`}>
                  Login to your Bond Room account
                </h2>
                <p className={`mt-1 text-sm text-[#6b7280] ${mounted ? 'subtitle-enter' : 'opacity-0'}`}>
                  Enter your credentials to continue.
                </p>

                <form className="mt-6 space-y-4" onSubmit={handleLogin}>

                  {/* Email Field */}
                  <div className={`input-wrapper ${mounted ? 'field-enter-1' : 'opacity-0'}`}>
                    <label
                      htmlFor="loginEmail"
                      className={`text-xs text-muted transition-all duration-300 ${
                        focusedField === 'email' ? 'label-focused' : ''
                      }`}
                    >
                      Email address
                    </label>
                    <div className="relative">
                      <input
                        id="loginEmail"
                        type="email"
                        className={`input-field mt-1 w-full rounded-md border border-[#d7d0e2] bg-white px-3 py-2 text-sm focus:outline-none ${
                          focusedField === 'email' ? 'field-focused' : ''
                        }`}
                        placeholder="you@example.com"
                        value={email}
                        onChange={(event) => setEmail(event.target.value)}
                        onFocus={() => setFocusedField('email')}
                        onBlur={() => setFocusedField(null)}
                      />
                      <div
                        className={`input-underline ${
                          focusedField === 'email' ? 'input-underline-active' : ''
                        }`}
                      ></div>
                    </div>
                  </div>

                  {/* Password Field */}
                  <div className={`input-wrapper ${mounted ? 'field-enter-2' : 'opacity-0'}`}>
                    <label
                      htmlFor="loginPassword"
                      className={`text-xs text-muted transition-all duration-300 ${
                        focusedField === 'password' ? 'label-focused' : ''
                      }`}
                    >
                      Password
                    </label>
                    <div className="relative">
                      <input
                        id="loginPassword"
                        type="password"
                        className={`input-field mt-1 w-full rounded-md border border-[#d7d0e2] bg-white px-3 py-2 text-sm focus:outline-none ${
                          focusedField === 'password' ? 'field-focused' : ''
                        }`}
                        placeholder="••••••••"
                        value={password}
                        onChange={(event) => setPassword(event.target.value)}
                        onFocus={() => setFocusedField('password')}
                        onBlur={() => setFocusedField(null)}
                      />
                      <div
                        className={`input-underline ${
                          focusedField === 'password' ? 'input-underline-active' : ''
                        }`}
                      ></div>
                    </div>
                  </div>

                  {/* Forgot Password */}
                  <div className={`text-right ${mounted ? 'field-enter-3' : 'opacity-0'}`}>
                    <Link
                      to="/forgot-password"
                      className="forgot-link text-xs text-[#5b2c91]"
                    >
                      Forgot Password?
                    </Link>
                  </div>

                  {/* Error Message */}
                  {errorMessage && (
                    <div className={shakeError ? 'shake-animation' : ''}>
                      <p className="text-sm text-red-600 error-enter flex items-center gap-1">
                        <span>⚠️</span> {errorMessage}
                      </p>
                    </div>
                  )}

                  {/* Login Button */}
                  <div className={mounted ? 'button-enter' : 'opacity-0'}>
                    <button
                      type="submit"
                      className="login-btn block w-full rounded-md bg-[#5b2c91] text-white py-2.5 text-sm text-center disabled:opacity-70"
                      disabled={loading}
                    >
                      {loading ? (
                        <span className="flex items-center justify-center">
                          <span className="spinner"></span>
                          Signing in...
                        </span>
                      ) : (
                        'Login'
                      )}
                    </button>
                  </div>

                  {/* Register Link */}
                  <div className={mounted ? 'register-enter' : 'opacity-0'}>
                    <p className="text-center text-sm text-[#6b7280]">
                      Don&apos;t have an account?{' '}
                      <Link
                        to="/register"
                        className="register-link font-semibold text-[#5b2c91] underline"
                      >
                        Register Now
                      </Link>
                    </p>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </main>

      <BottomAuth />
    </div>
  );
};

export default Login;