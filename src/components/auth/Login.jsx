import React, { useState } from 'react';
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
  const navigate = useNavigate();
  const { loading, login } = useMenteeAuth();

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
                    Login to access your dashboard, sessions, progress, and mentorship tools in one place.
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
                  Enter your credentials to continue.
                </p>

                <form className="mt-6 space-y-4" onSubmit={handleLogin}>
                  <div>
                    <label htmlFor="loginEmail" className="text-xs text-muted">
                      Email address
                    </label>
                    <input
                      id="loginEmail"
                      type="email"
                      className="mt-1 w-full rounded-md border border-[#d7d0e2] bg-white px-3 py-2 text-sm"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                    />
                  </div>

                  <div>
                    <label htmlFor="loginPassword" className="text-xs text-muted">
                      Password
                    </label>
                    <input
                      id="loginPassword"
                      type="password"
                      className="mt-1 w-full rounded-md border border-[#d7d0e2] bg-white px-3 py-2 text-sm"
                      placeholder="********"
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                    />
                  </div>

                  <div className="text-right">
                    <Link to="/forgot-password" className="text-xs text-[#5b2c91] hover:underline">
                      Forgot Password?
                    </Link>
                  </div>

                  {errorMessage && <p className="text-sm text-red-600">{errorMessage}</p>}

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
