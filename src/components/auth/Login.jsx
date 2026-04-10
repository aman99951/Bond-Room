import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion as Motion, AnimatePresence } from 'framer-motion';
import { Phone, Lock, ArrowRight, CheckCircle2, AlertCircle, Sparkles, Mail, Eye, EyeOff } from 'lucide-react';
import TopAuth from './TopAuth';
import BottomAuth from './BottomAuth';
import mentorBottom from '../assets/teach1.png';
import mentorLeft from '../assets/teach2.png';
import imageContainer from '../assets/Image Container.png';
import { useMenteeAuth } from '../../apis/apihook/useMenteeAuth';
import { clearAuthSession, mapAppRoleToUiRole } from '../../apis/api/storage';
import { mentorApi } from '../../apis/api/mentorApi';
import '../LandingPage.css';
import './Login.css';

const MOCK_OTP = '123456';

const isCompletedStatus = (value) => {
  const normalized = String(value || '').toLowerCase();
  return normalized === 'completed' || normalized === 'verified';
};

const canAccessMentorDashboard = (status) => {
  const onboardingStatus = status || {};
  return (
    isCompletedStatus(onboardingStatus.application_status) &&
    isCompletedStatus(onboardingStatus.identity_status)
  );
};

const Login = () => {
  const [selectedRole, setSelectedRole] = useState('mentee');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [mobile, setMobile] = useState('');
  const [otp, setOtp] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [infoMessage, setInfoMessage] = useState('');
  const [otpHint, setOtpHint] = useState('');
  const navigate = useNavigate();
  const location = useLocation();
  const { loading, loginWithMobile, login } = useMenteeAuth();
  const nextParam = new URLSearchParams(location.search).get('next') || '';
  const nextPath = nextParam.startsWith('/') ? nextParam : '';

  const handleRoleChange = (role) => {
    setSelectedRole(role);
    setErrorMessage('');
    setInfoMessage('');
    setOtpHint('');
  };

  const handleGenerateOtp = () => {
    setErrorMessage('');
    setInfoMessage('Mock OTP generated.');
    setOtpHint(`Mock OTP: ${MOCK_OTP}`);
  };

  const handleLogin = async (event) => {
    event.preventDefault();
    setErrorMessage('');
    setInfoMessage('');

    try {
      if (selectedRole === 'mentee') {
        if (!email.trim() || !password.trim()) {
          setErrorMessage('Email and password are required for mentee login.');
          return;
        }
        await login(email.trim().toLowerCase(), password, 'menties');
        navigate(nextPath || '/dashboard', { replace: true });
        return;
      }

      if (!mobile.trim() || otp.length !== 6) {
        setErrorMessage('Mobile number and valid 6-digit OTP are required.');
        return;
      }

      const session = await loginWithMobile(mobile.trim(), otp, 'mentors');
      const targetRole = mapAppRoleToUiRole(session?.role);

      if (targetRole === 'admins') {
        clearAuthSession();
        setErrorMessage('Admin login is available only on /admin.');
        return;
      }

      if (targetRole === 'mentors') {
        try {
          const mentors = await mentorApi.getMentors({ email: session?.email || '' });
          const list = Array.isArray(mentors) ? mentors : mentors?.results || [];
          const currentMentor = list[0] || null;
          if (currentMentor?.id) {
            const onboarding = await mentorApi.getMentorOnboarding(currentMentor.id);
            if (canAccessMentorDashboard(onboarding?.status)) {
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

      setErrorMessage('This account is not a mentor account.');
    } catch (err) {
      setErrorMessage(
        err?.message ||
          (selectedRole === 'mentee'
            ? 'Unable to login with provided email and password.'
            : 'Unable to login with provided mobile and OTP.')
      );
    }
  };

  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: { opacity: 1, x: 0 },
  };

  return (
    <div className="lp lp-login">
      <TopAuth />

      <main className="lp-login-main">
        <div className="lp-login-orb lp-login-orb-a" />
        <div className="lp-login-orb lp-login-orb-b" />

        <Motion.div
          initial="hidden"
          animate="visible"
          variants={containerVariants}
          className="lp-login-shell"
        >
          <div className="lp-login-grid">
            <aside className="lp-login-side" aria-hidden="true">
              <img
                src={imageContainer}
                alt=""
                className="lp-login-center-mark"
              />
              <div className="lp-login-side-grid">
                <div className="lp-login-media-pane">
                  <img src={mentorLeft} alt="Mentor support" className="lp-login-side-image" />
                </div>
                <div className="lp-login-copy-pane">
                  <h3>Welcome Back to Bond Room</h3>
                  <p>Continue your mentorship journey with focused support and meaningful conversations.</p>
                </div>
              </div>
              <div className="lp-login-side-grid lp-login-side-grid-bottom">
                <div className="lp-login-stats-pane">
                  <ul>
                    <li>Secure role-based Login In for mentees and mentors.</li>
                    <li>Simple OTP flow for mentors with onboarding checks.</li>
                    <li>Fast access to dashboards and active sessions.</li>
                  </ul>
                </div>
                <div className="lp-login-media-pane">
                  <img src={mentorBottom} alt="Growth journey" className="lp-login-side-image" />
                </div>
              </div>
            </aside>

            <section className="lp-login-form-wrap">
              <Motion.div variants={itemVariants}>
                <div className="lp-login-pill">
                  <span className="lp-login-pill-dot" />
                  Welcome back
                </div>
                <h2 className="lp-login-h2">Login to your Mentee / Volunteer or Mentor account</h2>
                <p className="lp-login-sub">
                  {selectedRole === 'mentee'
                    ? 'Select mentee and login using email and password.'
                    : 'Select mentor and login using mobile and OTP.'}
                </p>
              </Motion.div>

              <Motion.form
                variants={itemVariants}
                className="lp-login-form"
                onSubmit={handleLogin}
                autoComplete="off"
              >
                <div className="lp-register-form-card">
                  <div className="lp-register-form-card-head">
                    <h3>
                      <Sparkles size={14} />
                      Access Role
                    </h3>
                  </div>
                  <div className="lp-role-switch" role="tablist" aria-label="Select login role">
                    <button
                      type="button"
                      className={`lp-role-btn ${selectedRole === 'mentee' ? 'is-active' : ''}`}
                      onClick={() => handleRoleChange('mentee')}
                    >
                      Mentee / Volunteer
                    </button>
                    <button
                      type="button"
                      className={`lp-role-btn ${selectedRole === 'mentor' ? 'is-active' : ''}`}
                      onClick={() => handleRoleChange('mentor')}
                    >
                      Mentor
                    </button>
                  </div>
                </div>

                <div className="lp-register-form-card">
                  <div className="lp-register-form-card-head">
                    <h3>
                      <Lock size={14} />
                      Login Credentials
                    </h3>
                  </div>
                  {selectedRole === 'mentee' ? (
                    <>
                      <div className="lp-field">
                        <label className="lp-login-field-label" htmlFor="loginEmail">
                          <Mail size={15} />
                          Email Address
                        </label>
                        <input
                          id="loginEmail"
                          type="email"
                          className="lp-input"
                          placeholder="student@example.com"
                          autoComplete="off"
                          value={email}
                          onChange={(event) => setEmail(event.target.value)}
                        />
                      </div>

                      <div className="lp-field">
                        <label className="lp-login-field-label" htmlFor="loginPassword">
                          <Lock size={15} />
                          Password
                        </label>
                        <div className="lp-password-wrap">
                          <input
                            id="loginPassword"
                            type={showPassword ? 'text' : 'password'}
                            className="lp-input lp-password-input"
                            placeholder="Enter password"
                            autoComplete="new-password"
                            value={password}
                            onChange={(event) => setPassword(event.target.value)}
                          />
                          <button
                            type="button"
                            className="lp-password-toggle"
                            onClick={() => setShowPassword((prev) => !prev)}
                            aria-label={showPassword ? 'Hide password' : 'Show password'}
                            aria-pressed={showPassword}
                          >
                            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                          </button>
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="lp-field">
                        <label className="lp-login-field-label" htmlFor="loginMobile">
                          <Phone size={15} />
                          Mobile Number
                        </label>
                        <div className="lp-register-mobile-row lp-register-mobile-row-action">
                          <div className="lp-register-country" aria-hidden="true">+91</div>
                          <input
                            id="loginMobile"
                            type="tel"
                            className="lp-input"
                            placeholder="9876543210"
                            autoComplete="off"
                            value={mobile}
                            onChange={(event) => setMobile(event.target.value)}
                          />
                          <button
                            type="button"
                            className="lp-vp-inline-btn"
                            onClick={handleGenerateOtp}
                          >
                            OTP
                          </button>
                        </div>
                        <div className="lp-field-action">
                          <button
                            type="button"
                            className="lp-generate-otp"
                            onClick={handleGenerateOtp}
                          >
                            <Sparkles size={12} />
                            Generate Mock OTP
                          </button>
                        </div>
                      </div>

                      <div className="lp-field">
                        <label className="lp-login-field-label" htmlFor="loginOtp">
                          <Lock size={15} />
                          OTP Verification
                        </label>
                        <input
                          id="loginOtp"
                          type="text"
                          inputMode="numeric"
                          maxLength={6}
                          className="lp-input lp-input-otp"
                          placeholder="000000"
                          autoComplete="off"
                          value={otp}
                          onChange={(event) => setOtp(event.target.value.replace(/\D/g, '').slice(0, 6))}
                        />
                      </div>
                    </>
                  )}
                </div>

                <AnimatePresence mode="wait">
                  {errorMessage && (
                    <Motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="lp-msg lp-msg-error"
                    >
                      <AlertCircle size={18} />
                      {errorMessage}
                    </Motion.div>
                  )}
                  {!errorMessage && infoMessage && (
                    <Motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="lp-msg lp-msg-success"
                    >
                      <CheckCircle2 size={18} />
                      <div>
                        {infoMessage}
                        {otpHint && <div className="lp-msg-hint">{otpHint}</div>}
                      </div>
                    </Motion.div>
                  )}
                </AnimatePresence>

                <Motion.button
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  disabled={loading}
                  className="lp-login-submit"
                >
                  {loading ? (
                    <div className="lp-login-loading">
                      <span className="lp-login-spinner" />
                      Signing in...
                    </div>
                  ) : (
                    <>
                      Login
                      <ArrowRight size={16} />
                    </>
                  )}
                </Motion.button>

                <div className="lp-login-register">
                  <p>
                    Don&apos;t have an account?{' '}
                    <Link to="/register">
                      Create account
                    </Link>
                  </p>
                </div>
              </Motion.form>
            </section>
          </div>
        </Motion.div>
      </main>

      <BottomAuth />
    </div>
  );
};

export default Login;
