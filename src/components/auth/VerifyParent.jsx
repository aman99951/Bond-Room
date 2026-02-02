import React from 'react';
import TopAuth from './TopAuth';
import BottomAuth from './BottomAuth';
import { Link } from 'react-router-dom';

const VerifyParent = () => {
  return (
    <div className="min-h-screen bg-surface text-primary flex flex-col">
      <TopAuth />

      <main className="flex-1">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-20 py-10 sm:py-14 flex items-center justify-center">
          <div className="w-full max-w-sm sm:max-w-md border border-default rounded-2xl bg-surface shadow-sm p-6 sm:p-8 text-center">
            <div className="mx-auto h-10 w-10 rounded-full bg-muted flex items-center justify-center">
              <svg className="h-5 w-5 text-secondary" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M12 3l7 3v6c0 4.1-3 7.8-7 9-4-1.2-7-4.9-7-9V6l7-3z" stroke="currentColor" strokeWidth="1.5" />
              </svg>
            </div>
            <div className="mt-3 inline-flex items-center rounded-full bg-muted text-xs text-muted px-3 py-1">
              Step 2 of 3
            </div>
            <h2 className="mt-3 text-lg font-semibold text-primary">Verify Parent's Number</h2>
            <p className="mt-1 text-xs text-muted">
              Enter the 6-digit OTP sent to +91 ******3210
            </p>

            <div className="mt-5 rounded-lg border border-default bg-muted p-3 text-left text-xs text-muted">
              <span className="font-semibold">Explicit Consent:</span> Entering this OTP confirms that a parent
              or guardian consents to the student's participation and session recording.
            </div>

            <div className="mt-6 flex flex-wrap justify-center gap-2">
              {['4', '2', '', '', '', ''].map((v, i) => (
                <input
                  key={i}
                  value={v}
                  readOnly
                  className="h-10 w-10 rounded-md border border-default text-center text-sm"
                />
              ))}
            </div>

            <div className="mt-3 flex items-center justify-between text-xs text-muted">
              <span>01:42</span>
              <button className="text-subtle hover:text-muted">Resend OTP</button>
            </div>

            <Link
              to="/needs-assessment"
              className="mt-4 block w-full rounded-md bg-accent text-on-accent py-2.5 text-sm text-center"
            >
              Verify & Continue
            </Link>
            <Link
              to="/register"
              className="mt-3 block w-full rounded-md border border-default py-2.5 text-sm text-muted"
            >
              Back to Registration
            </Link>
          </div>
        </div>
      </main>

      <BottomAuth />
    </div>
  );
};

export default VerifyParent;
