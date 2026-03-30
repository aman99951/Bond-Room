import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion as Motion, AnimatePresence } from 'framer-motion';
import { Phone, Lock, ArrowRight, CheckCircle2, AlertCircle, Sparkles, Mail } from 'lucide-react';
import logo from '../assets/logo.png';
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
  const [mobile, setMobile] = useState('');
  const [otp, setOtp] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [infoMessage, setInfoMessage] = useState('');
  const [otpHint, setOtpHint] = useState('');
  const navigate = useNavigate();
  const { loading, loginWithMobile, login } = useMenteeAuth();

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
        navigate('/dashboard');
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
      <header className="lp-hdr">
        <Link to="/" className="lp-logo" aria-label="Go to landing page">
          <img src={logo} alt="Bond Room" />
          <span>Bridging Old and New Destinies</span>
        </Link>

        <nav className="lp-nav">
          <Link to="/">Home</Link>
          <a href="/#about">About</a>
          <a href="/#safety">Safety</a>
        </nav>

        <div className="lp-hdr-actions">
          <Link to="/register" className="lp-solid">Student Sign Up</Link>
        </div>
      </header>

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
            <section className="lp-login-brand">
              <Motion.div variants={itemVariants} className="lp-login-brand-inner">
                <div className="lp-login-badge">
                  <span className="lp-edot" />
                  Welcome back
                </div>
                <h3 className="lp-login-title">
                  Continue your
                  <br />
                  growth journey
                </h3>
                <p className="lp-login-copy">
                  Join hundreds of mentors and mentees in building meaningful connections and driving real impact.
                </p>
              </Motion.div>

              <Motion.div variants={itemVariants} className="lp-login-stats">
                <div className="lp-login-stat">
                  <div className="lp-login-stat-ico">
                    <Sparkles size={18} />
                  </div>
                  <p>1:1</p>
                  <span>Mentorship Sessions</span>
                </div>
                <div className="lp-login-stat">
                  <div className="lp-login-stat-ico">
                    <CheckCircle2 size={18} />
                  </div>
                  <p>24/7</p>
                  <span>Active Support</span>
                </div>
              </Motion.div>
            </section>

            <section className="lp-login-form-wrap">
              <Motion.div variants={itemVariants}>
                <div className="lp-login-pill">
                  <span className="lp-login-pill-dot" />
                  Welcome back
                </div>
                <h2 className="lp-login-h2">Login to your account</h2>
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
              >
                <div className="lp-role-switch" role="tablist" aria-label="Select login role">
                  <button
                    type="button"
                    className={`lp-role-btn ${selectedRole === 'mentee' ? 'is-active' : ''}`}
                    onClick={() => handleRoleChange('mentee')}
                  >
                    Mentee
                  </button>
                  <button
                    type="button"
                    className={`lp-role-btn ${selectedRole === 'mentor' ? 'is-active' : ''}`}
                    onClick={() => handleRoleChange('mentor')}
                  >
                    Mentor
                  </button>
                </div>

                {selectedRole === 'mentee' ? (
                  <>
                    <div className="lp-field">
                      <label htmlFor="loginEmail">
                        <Mail size={16} />
                        Email Address
                      </label>
                      <input
                        id="loginEmail"
                        type="email"
                        className="lp-input"
                        placeholder="student@example.com"
                        value={email}
                        onChange={(event) => setEmail(event.target.value)}
                      />
                    </div>

                    <div className="lp-field">
                      <label htmlFor="loginPassword">
                        <Lock size={16} />
                        Password
                      </label>
                      <input
                        id="loginPassword"
                        type="password"
                        className="lp-input"
                        placeholder="Enter password"
                        value={password}
                        onChange={(event) => setPassword(event.target.value)}
                      />
                    </div>
                  </>
                ) : (
                  <>
                    <div className="lp-field">
                      <label htmlFor="loginMobile">
                        <Phone size={16} />
                        Mobile Number
                      </label>
                      <input
                        id="loginMobile"
                        type="tel"
                        className="lp-input"
                        placeholder="+91 9876543210"
                        value={mobile}
                        onChange={(event) => setMobile(event.target.value)}
                      />
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
                      <label htmlFor="loginOtp">
                        <Lock size={16} />
                        OTP Verification
                      </label>
                      <input
                        id="loginOtp"
                        type="text"
                        inputMode="numeric"
                        maxLength={6}
                        className="lp-input lp-input-otp"
                        placeholder="******"
                        value={otp}
                        onChange={(event) => setOtp(event.target.value.replace(/\D/g, '').slice(0, 6))}
                      />
                    </div>
                  </>
                )}

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
                      Sign In
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

      <footer className="lp-footer lp-login-footer">
        <div className="lp-footer-btm">
          <span>(c) 2026 Bond Room Platform. All rights reserved.</span>
          <span className="lp-login-footer-links">
            <a href="#">Privacy</a>
            <a href="#">Terms</a>
            <a href="#">Support</a>
          </span>
        </div>
      </footer>
    </div>
  );
};

export default Login;
