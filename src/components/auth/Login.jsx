import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
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

  return (
    <div className="min-h-screen bg-[#f4f2f7] text-primary flex flex-col">
      <TopAuth />

      <main className="flex-1">
        <div className="w-full flex justify-center px-4 sm:px-6 py-6 sm:py-10">
          <div className="border border-[#e6e2f1] rounded-b-[12px] overflow-hidden bg-white shadow-sm w-full max-w-[1266px]">
            <div className="grid grid-cols-1 xl:grid-cols-[591px_675px]">
              <div className="hidden xl:flex w-[591px] bg-[#5b2c91] text-white p-10 flex-col justify-between">
                <div>
                  <div className="inline-flex items-center rounded-full bg-white px-3 py-2">
                    <img src={logo} alt="Bond Room" className="h-9 w-auto" />
                  </div>
                  <h3 className="mt-6 text-3xl font-semibold leading-tight">
                    Continue your
                    <br />
                    growth journey
                  </h3>
                  <p className="mt-4 text-sm text-white/85 max-w-md">
                    Login with your registered mobile number to access sessions and dashboard.
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-xl border border-white/25 bg-white/10 p-4">
                    <p className="text-2xl font-semibold">1:1</p>
                    <p className="mt-1 text-xs text-white/80">Mentorship sessions</p>
                  </div>
                  <div className="rounded-xl border border-white/25 bg-white/10 p-4">
                    <p className="text-2xl font-semibold">24x7</p>
                    <p className="mt-1 text-xs text-white/80">Support ecosystem</p>
                  </div>
                </div>
              </div>

              <div className="p-6 sm:p-8 lg:p-10 bg-[#f7f5fa] w-full xl:w-[675px]">
                <div className="inline-flex items-center rounded-full bg-[#ede7f6] text-xs text-[#6b4eff] px-3 py-1 font-medium">
                  Welcome back
                </div>
                <h2 className="mt-3 text-lg sm:text-2xl font-semibold text-[#1f2937]">
                  Login to your Bond Room account
                </h2>
                <p className="mt-1 text-sm text-[#6b7280]">
                  Use your registered mobile number and OTP.
                </p>

                <form className="mt-6 space-y-4" onSubmit={handleLogin}>
                  <div>
                    <label htmlFor="loginMobile" className="text-xs text-muted">Mobile number</label>
                    <input
                      id="loginMobile"
                      type="tel"
                      className="mt-1 w-full rounded-md border border-[#d7d0e2] bg-white px-3 py-2 text-sm"
                      placeholder="+91 9876543210"
                      value={mobile}
                      onChange={(event) => setMobile(event.target.value)}
                    />
                    <div className="mt-2 text-right">
                      <button
                        type="button"
                        className="text-xs text-[#5b2c91] underline"
                        onClick={handleGenerateOtp}
                      >
                        Generate Mock OTP
                      </button>
                    </div>
                  </div>

                  <div>
                    <label htmlFor="loginOtp" className="text-xs text-muted">OTP</label>
                    <input
                      id="loginOtp"
                      type="text"
                      inputMode="numeric"
                      maxLength={6}
                      className="mt-1 w-full rounded-md border border-[#d7d0e2] bg-white px-3 py-2 text-sm"
                      placeholder="Enter 6-digit OTP"
                      value={otp}
                      onChange={(event) => setOtp(event.target.value.replace(/\D/g, '').slice(0, 6))}
                    />
                  </div>

                  {errorMessage && <p className="text-sm text-red-600">{errorMessage}</p>}
                  {!errorMessage && infoMessage && <p className="text-sm text-green-700">{infoMessage}</p>}
                  {!errorMessage && otpHint && <p className="text-xs text-[#5b2c91]">{otpHint}</p>}

                  <button
                    type="submit"
                    className="block w-full rounded-md bg-[#5b2c91] text-white py-2.5 text-sm text-center disabled:opacity-70"
                    disabled={loading}
                  >
                    {loading ? 'Signing in...' : 'Login'}
                  </button>

                  <p className="text-center text-sm text-[#6b7280]">
                    Don&apos;t have an account?{' '}
                    <Link to="/register" className="font-semibold text-[#5b2c91] underline">
                      Register Now
                    </Link>
                  </p>
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
