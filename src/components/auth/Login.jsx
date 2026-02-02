import React from 'react';
import TopAuth from './TopAuth';
import BottomAuth from './BottomAuth';
import { Link } from 'react-router-dom';

const Login = () => {
  return (
    <div className="min-h-screen bg-surface text-primary flex flex-col">
      <TopAuth />

      <main className="flex-1">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-20 py-10">
          <div className="max-w-md mx-auto rounded-2xl border border-default bg-surface p-8 shadow-sm">
            <h1 className="text-xl font-semibold text-primary">Welcome back</h1>
            <p className="mt-1 text-sm text-muted">Sign in to continue to Bond Room.</p>

            <form className="mt-6 space-y-4">
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
                  placeholder="••••••••"
                />
              </div>
              <button type="button" className="w-full rounded-md bg-accent text-on-accent py-2.5 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-900 focus-visible:ring-offset-2">
                Login
              </button>
            </form>

            <div className="mt-4 text-xs text-muted text-center">
              Don’t have an account?{' '}
              <Link to="/register" className="underline text-secondary">
                Register
              </Link>
            </div>
          </div>
        </div>
      </main>

      <BottomAuth />
    </div>
  );
};

export default Login;
