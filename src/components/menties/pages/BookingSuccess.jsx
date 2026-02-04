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
    <div className="min-h-[70vh] flex items-center justify-center px-4 bg-transparent">
      <div className="w-full max-w-3xl rounded-2xl border border-[#e5e7eb] bg-white p-5 sm:p-8 shadow-[0px_12px_24px_rgba(0,0,0,0.1)] text-center">
        <div className="mx-auto h-12 w-12 sm:h-14 sm:w-14 rounded-full bg-[#DCFCE7] flex items-center justify-center">
          <svg className="h-6 w-6 text-[#22c55e]" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M5 12l4 4 10-10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <h1 className="mt-4 text-xl font-semibold text-[#111827]">Session Requested</h1>

        <div className="mt-4 rounded-xl bg-[#f8fafc] px-4 sm:px-6 py-4 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 text-sm text-[#6b7280]">
          <img
            src="https://c.pxhere.com/photos/c7/42/young_man_portrait_beard_young_man_male_handsome_young_man_handsome-1046502.jpg!d"
            alt=""
            className="h-10 w-10 rounded-full object-cover"
          />
          <div className="text-[#111827] font-semibold">Dr. Lakshmi T Rajan</div>
          <span className="hidden sm:inline h-4 w-px bg-[#e5e7eb]" />
          <div className="flex items-center gap-1">
            <svg className="h-4 w-4 text-[#6b7280]" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.5" />
              <path d="M12 7v6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            45 Minutes
          </div>
          <span className="hidden sm:inline h-4 w-px bg-[#e5e7eb]" />
          <div className="flex items-center gap-1">
            <svg className="h-4 w-4 text-[#6b7280]" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <rect x="4" y="5" width="16" height="15" rx="2" stroke="currentColor" strokeWidth="1.5" />
              <path d="M8 3v4M16 3v4M4 9h16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            Oct 24, 2024
          </div>
        </div>

        <p className="mt-4 text-sm text-[#6b7280]">
          Your session request will be approved by the mentor. We will keep you posed.
        </p>

        <Link
          to="/dashboard"
          onClick={handleContinue}
          className="mt-6 inline-flex items-center justify-center text-sm text-[#6b7280]"
          aria-label="Back to dashboard"
        >
          ← Back to Dashboard
        </Link>
      </div>
    </div>
  );
};

export default BookingSuccess;
