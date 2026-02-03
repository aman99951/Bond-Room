import React, { useState } from 'react';
import TopAuth from './TopAuth';
import BottomAuth from './BottomAuth';
import { Link, useNavigate } from 'react-router-dom';
import logo from '../assets/i.png';

const Login = () => {
  const [roleValue, setRoleValue] = useState('Student');
  const [roleOpen, setRoleOpen] = useState(false);
  const roleOptions = ['Student', 'Mentor'];
  const navigate = useNavigate();

  const handleRoleSelect = (nextRole) => {
    setRoleValue(nextRole);
    setRoleOpen(false);
    try {
      localStorage.setItem('userRole', nextRole === 'Mentor' ? 'mentors' : 'menties');
    } catch {
      // ignore storage errors
    }
  };
  return (
    <div className="min-h-screen bg-surface text-primary flex flex-col">
      <TopAuth />

      <main className="flex-1">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-20 py-10">
          <div className="border border-default rounded-2xl overflow-hidden bg-surface shadow-sm">
            <div className="grid md:grid-cols-2">
              <div className="bg-muted p-8 sm:p-10 flex flex-col items-center justify-center text-center">
                <div className="h-20 w-20 sm:h-24 sm:w-24 rounded-full bg-accent flex items-center justify-center">
                  <img src={logo} alt="Bond Room" className="h-6 w-6" />
                </div>
                <h3 className="mt-6 sm:mt-8 text-base font-semibold text-secondary">Welcome Back</h3>
                <p className="mt-2 text-sm text-muted max-w-xs">
                  Sign in to continue your journey with Bond Room.
                </p>
              </div>

              <div className="p-6 sm:p-8 lg:p-10">
                <div className="inline-flex items-center rounded-full bg-muted text-xs text-muted px-3 py-1">
                  Login
                </div>
                <h2 className="mt-3 text-lg sm:text-xl font-semibold text-primary">Access your account</h2>
                <p className="mt-1 text-sm text-muted">Enter your credentials to continue.</p>

                <form className="mt-6 space-y-4">
                  <div>
                    <label id="loginRoleLabel" className="text-xs text-muted">Login as</label>
                    <div className="relative mt-1" tabIndex={0} onBlur={() => setRoleOpen(false)}>
                      <button
                        type="button"
                        className="w-full rounded-md border border-default px-3 py-2 text-sm text-left"
                        onClick={() => setRoleOpen((o) => !o)}
                        aria-haspopup="listbox"
                        aria-expanded={roleOpen}
                        aria-labelledby="loginRoleLabel"
                      >
                        {roleValue}
                      </button>
                      {roleOpen && (
                        <ul className="absolute z-10 mt-1 w-full rounded-md border border-default bg-surface text-primary text-sm shadow" role="listbox">
                          {roleOptions.map((opt) => (
                            <li key={opt}>
                              <button
                                type="button"
                                className="w-full text-left px-3 py-2 hover:bg-muted"
                                onMouseDown={(e) => e.preventDefault()}
                                onClick={() => handleRoleSelect(opt)}
                              >
                                {opt}
                              </button>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>
                  <div>
                    <label htmlFor="loginEmail" className="text-xs text-muted">Email Address</label>
                    <input
                      id="loginEmail"
                      type="email"
                      className="mt-1 w-full rounded-md border border-default px-3 py-2 text-sm"
                      placeholder="you@example.com"
                    />
                  </div>
                  <div>
                    <label htmlFor="loginPassword" className="text-xs text-muted">Password</label>
                    <input
                      id="loginPassword"
                      type="password"
                      className="mt-1 w-full rounded-md border border-default px-3 py-2 text-sm"
                      placeholder="********"
                    />
                  </div>
                  <button
                    type="button"
                    className="w-full rounded-md bg-accent text-on-accent py-2.5 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-900 focus-visible:ring-offset-2"
                    onClick={() => {
                      try {
                        localStorage.setItem('userRole', roleValue === 'Mentor' ? 'mentors' : 'menties');
                      } catch {
                        // ignore storage errors
                      }
                      navigate(roleValue === 'Mentor' ? '/mentor-impact-dashboard' : '/dashboard');
                    }}
                  >
                    Login
                  </button>
                </form>

                <div className="mt-4 text-xs text-muted text-center">
                  Don&apos;t have an account?{' '}
                  <Link to="/register" className="underline text-secondary">
                    Register
                  </Link>
                </div>
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
