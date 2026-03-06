import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Phone, Lock, ArrowRight, CheckCircle2, AlertCircle, Sparkles } from 'lucide-react';
import TopAuth from './TopAuth';
import BottomAuth from './BottomAuth';
import logo from '../assets/logo.png';
import { useMenteeAuth } from '../../apis/apihook/useMenteeAuth';
import { clearAuthSession, mapAppRoleToUiRole } from '../../apis/api/storage';
import { mentorApi } from '../../apis/api/mentorApi';

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
  const [mobile, setMobile] = useState('');
  const [otp, setOtp] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [infoMessage, setInfoMessage] = useState('');
  const [otpHint, setOtpHint] = useState('');
  const navigate = useNavigate();
  const { loading, loginWithMobile } = useMenteeAuth();

  const handleGenerateOtp = () => {
    setErrorMessage('');
    setInfoMessage('Mock OTP generated.');
    setOtpHint(`Mock OTP: ${MOCK_OTP}`);
  };

  const handleLogin = async (event) => {
    event.preventDefault();
    setErrorMessage('');
    setInfoMessage('');

    if (!mobile.trim() || otp.length !== 6) {
      setErrorMessage('Mobile number and valid 6-digit OTP are required.');
      return;
    }

    try {
      const session = await loginWithMobile(mobile.trim(), otp);
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

      navigate('/dashboard');
    } catch (err) {
      setErrorMessage(err?.message || 'Unable to login with provided mobile and OTP.');
    }
  };

  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: { opacity: 1, x: 0 }
  };

  return (
    <div className="min-h-screen bg-[#f8f9ff] text-[#1f2937] flex flex-col relative overflow-hidden font-sans">
      {/* Background Decorative Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-[#5b2c91]/5 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-[#6b4eff]/5 rounded-full blur-[100px] pointer-events-none" />

      <TopAuth />

      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8 relative z-10">
        <motion.div 
          initial="hidden"
          animate="visible"
          variants={containerVariants}
          className="w-full max-w-[1100px] overflow-hidden rounded-[2rem] border border-white/50 bg-white/80 backdrop-blur-xl shadow-[0_20px_50px_rgba(0,0,0,0.05)]"
        >
          <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_1.3fr]">
            {/* Left Panel: Branding & Info */}
            <div className="hidden lg:flex bg-[#5b2c91] p-12 text-white flex-col justify-between relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-32 -mt-32" />
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-purple-400/20 rounded-full blur-3xl -ml-24 -mb-24" />
              
              <motion.div variants={itemVariants} className="relative z-10">
                <div className="inline-flex items-center rounded-2xl bg-white/10 backdrop-blur-md px-4 py-3 border border-white/20">
                  <img src={logo} alt="Bond Room" className="h-8 w-auto brightness-0 invert" />
                </div>
                <h3 className="mt-10 text-4xl font-bold leading-tight">
                  Continue your<br />
                  <span className="text-purple-200">growth journey</span>
                </h3>
                <p className="mt-6 text-lg text-white/80 max-w-sm leading-relaxed">
                  Join hundreds of mentors and mentees in building meaningful connections and driving real impact.
                </p>
              </motion.div>

              <motion.div variants={itemVariants} className="grid grid-cols-2 gap-4 relative z-10">
                <div className="rounded-2xl border border-white/15 bg-white/5 p-5 backdrop-blur-sm group hover:bg-white/10 transition-colors duration-300">
                  <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center mb-3">
                    <Sparkles className="w-5 h-5 text-purple-200" />
                  </div>
                  <p className="text-2xl font-bold">1:1</p>
                  <p className="mt-1 text-xs text-white/60 font-medium uppercase tracking-wider">Mentorship Sessions</p>
                </div>
                <div className="rounded-2xl border border-white/15 bg-white/5 p-5 backdrop-blur-sm group hover:bg-white/10 transition-colors duration-300">
                  <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center mb-3">
                    <CheckCircle2 className="w-5 h-5 text-purple-200" />
                  </div>
                  <p className="text-2xl font-bold">24/7</p>
                  <p className="mt-1 text-xs text-white/60 font-medium uppercase tracking-wider">Active Support</p>
                </div>
              </motion.div>
            </div>

            {/* Right Panel: Login Form */}
            <div className="w-full bg-white p-8 sm:p-12 lg:p-16">
              <motion.div variants={itemVariants}>
                <div className="inline-flex items-center gap-2 rounded-full bg-purple-50 text-xs text-[#5b2c91] px-4 py-1.5 font-bold uppercase tracking-wider mb-4">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#5b2c91] animate-pulse" />
                  Welcome back
                </div>
                <h2 className="text-3xl font-bold text-[#111827]">
                  Login to your account
                </h2>
                <p className="mt-3 text-[#6b7280]">
                  Enter your registered mobile number to continue.
                </p>
              </motion.div>

              <motion.form 
                variants={itemVariants} 
                className="mt-10 space-y-6" 
                onSubmit={handleLogin}
              >
                <div className="space-y-2">
                  <label htmlFor="loginMobile" className="text-sm font-semibold text-[#374151] flex items-center gap-2">
                    <Phone className="w-4 h-4 text-[#5b2c91]" />
                    Mobile Number
                  </label>
                  <div className="relative group">
                    <input
                      id="loginMobile"
                      type="tel"
                      className="w-full rounded-xl border border-[#e5e7eb] bg-white px-4 py-3.5 text-sm transition-all duration-200 focus:border-[#5b2c91] focus:ring-4 focus:ring-[#5b2c91]/5 outline-none placeholder:text-[#9ca3af]"
                      placeholder="+91 9876543210"
                      value={mobile}
                      onChange={(event) => setMobile(event.target.value)}
                    />
                  </div>
                  <div className="flex justify-end">
                    <button
                      type="button"
                      className="text-xs font-semibold text-[#5b2c91] hover:text-[#4a2476] transition-colors flex items-center gap-1 group"
                      onClick={handleGenerateOtp}
                    >
                      <Sparkles className="w-3 h-3 group-hover:rotate-12 transition-transform" />
                      Generate Mock OTP
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <label htmlFor="loginOtp" className="text-sm font-semibold text-[#374151] flex items-center gap-2">
                    <Lock className="w-4 h-4 text-[#5b2c91]" />
                    OTP Verification
                  </label>
                  <input
                    id="loginOtp"
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    className="w-full rounded-xl border border-[#e5e7eb] bg-white px-4 py-3.5 text-sm transition-all duration-200 focus:border-[#5b2c91] focus:ring-4 focus:ring-[#5b2c91]/5 outline-none placeholder:text-[#9ca3af] tracking-[0.5em] text-center font-bold"
                    placeholder="••••••"
                    value={otp}
                    onChange={(event) => setOtp(event.target.value.replace(/\D/g, '').slice(0, 6))}
                  />
                </div>

                <AnimatePresence mode="wait">
                  {errorMessage && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="flex items-start gap-2 p-3.5 rounded-xl bg-red-50 text-red-700 text-sm font-medium border border-red-100"
                    >
                      <AlertCircle className="w-5 h-5 shrink-0" />
                      {errorMessage}
                    </motion.div>
                  )}
                  {!errorMessage && infoMessage && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="flex items-start gap-2 p-3.5 rounded-xl bg-emerald-50 text-emerald-700 text-sm font-medium border border-emerald-100"
                    >
                      <CheckCircle2 className="w-5 h-5 shrink-0" />
                      <div>
                        {infoMessage}
                        {otpHint && <div className="mt-1 font-bold text-xs uppercase tracking-wider">{otpHint}</div>}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <motion.button
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-[#5b2c91] hover:bg-[#4a2476] text-white py-4 text-sm font-bold shadow-lg shadow-[#5b2c91]/20 transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed group"
                >
                  {loading ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Signing in...
                    </div>
                  ) : (
                    <>
                      Sign In
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </motion.button>

                <div className="text-center pt-2">
                  <p className="text-sm text-[#6b7280]">
                    Don&apos;t have an account?{' '}
                    <Link to="/register" className="font-bold text-[#5b2c91] hover:text-[#4a2476] transition-colors decoration-2 underline-offset-4 hover:underline">
                      Create account
                    </Link>
                  </p>
                </div>
              </motion.form>
            </div>
          </div>
        </motion.div>
      </main>

      <BottomAuth />
    </div>
  );
};

export default Login;
