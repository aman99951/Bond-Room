import React from 'react';
import { Link } from 'react-router-dom';

const BookingSuccess = () => {
  const handleContinue = () => {
    try {
      localStorage.setItem('bookingComplete', 'true');
    } catch {
      // ignore storage errors
    }
  };

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4">
      <div className="text-center" role="status" aria-live="polite">
        <div className="mx-auto h-14 w-14 rounded-full border border-default flex items-center justify-center" aria-hidden="true">
          <svg className="h-6 w-6 text-primary" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M5 12l4 4 10-10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <h1 className="mt-4 text-xl font-semibold text-primary">Success!</h1>
        <p className="mt-1 text-sm text-secondary">Your booking successfully placed.</p>
        <p className="mt-2 text-xs text-muted max-w-xs mx-auto">
          A confirmation email has been sent to your registered address with all the details.
        </p>
        <Link
          to="/dashboard"
          onClick={handleContinue}
          className="mt-6 inline-flex items-center justify-center rounded-md bg-accent text-on-accent px-10 py-2.5 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-900 focus-visible:ring-offset-2"
          aria-label="Continue to dashboard"
        >
          Continue →
        </Link>
        <div className="mt-2">
          <button className="text-xs text-secondary underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-900 focus-visible:ring-offset-2">
            View booking details
          </button>
        </div>
      </div>
    </div>
  );
};

export default BookingSuccess;
