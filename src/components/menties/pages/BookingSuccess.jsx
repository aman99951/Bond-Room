import React, { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { menteeApi } from '../../../apis/api/menteeApi';
import { clearSelectedSessionId, getLastBooking, setSelectedSessionId } from '../../../apis/api/storage';

const formatDate = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Date unavailable';
  return date.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
};

const BookingSuccess = () => {
  const [searchParams] = useSearchParams();
  const storedBooking = useMemo(() => getLastBooking() || null, []);
  const [booking, setBooking] = useState(storedBooking);
  const [loading, setLoading] = useState(Boolean(searchParams.get('sessionId')));

  useEffect(() => {
    let cancelled = false;

    const loadBookedSession = async () => {
      const sessionId = searchParams.get('sessionId') || storedBooking?.sessionId;
      if (!sessionId) {
        setLoading(false);
        return;
      }

      try {
        const session = await menteeApi.getSessionById(sessionId);
        let mentorName = storedBooking?.mentorName || '';
        let mentorAvatar = storedBooking?.mentorAvatar || '';
        if (session?.mentor) {
          try {
            const mentor = await menteeApi.getMentorById(session.mentor);
            const fullName = `${mentor?.first_name || ''} ${mentor?.last_name || ''}`.trim();
            mentorName = fullName || mentorName;
            mentorAvatar = mentor?.avatar || mentorAvatar;
          } catch {
            // keep stored values
          }
        }

        const nextBooking = {
          sessionId: session?.id || sessionId,
          mentorName,
          mentorAvatar,
          durationMinutes: session?.duration_minutes ?? storedBooking?.durationMinutes ?? null,
          scheduledStart: session?.scheduled_start || storedBooking?.scheduledStart || '',
        };

        if (!cancelled) {
          setBooking(nextBooking);
          setSelectedSessionId(nextBooking.sessionId);
        }
      } catch {
        if (!cancelled) {
          setBooking(storedBooking || null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadBookedSession();
    return () => {
      cancelled = true;
    };
  }, [searchParams, storedBooking]);

  const handleContinue = () => {
    try {
      localStorage.setItem('bookingComplete', 'true');
      clearSelectedSessionId();
    } catch {
      // ignore storage errors
    }
  };

  const hasBookingDetails = Boolean(
    booking?.mentorName || booking?.mentorAvatar || booking?.durationMinutes || booking?.scheduledStart
  );

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
          {hasBookingDetails ? (
            <>
              {booking?.mentorAvatar ? (
                <img
                  src={booking.mentorAvatar}
                  alt=""
                  className="h-10 w-10 rounded-full object-cover"
                />
              ) : (
                <div className="h-10 w-10 rounded-full bg-[#e5e7eb]" />
              )}
              {booking?.mentorName && (
                <div className="text-[#111827] font-semibold">{booking.mentorName}</div>
              )}
              {booking?.durationMinutes ? (
                <>
                  <span className="hidden sm:inline h-4 w-px bg-[#e5e7eb]" />
                  <div className="flex items-center gap-1">
                    <svg className="h-4 w-4 text-[#6b7280]" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.5" />
                      <path d="M12 7v6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                    </svg>
                    {booking.durationMinutes} Minutes
                  </div>
                </>
              ) : null}
              {booking?.scheduledStart ? (
                <>
                  <span className="hidden sm:inline h-4 w-px bg-[#e5e7eb]" />
                  <div className="flex items-center gap-1">
                    <svg className="h-4 w-4 text-[#6b7280]" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                      <rect x="4" y="5" width="16" height="15" rx="2" stroke="currentColor" strokeWidth="1.5" />
                      <path d="M8 3v4M16 3v4M4 9h16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                    </svg>
                    {formatDate(booking.scheduledStart)}
                  </div>
                </>
              ) : null}
            </>
          ) : (
            <div className="text-xs text-[#6b7280]">Booking details will appear once available.</div>
          )}
        </div>

        <p className="mt-4 text-sm text-[#6b7280]">
          Your session request will be approved by the mentor. We will keep you posed.
        </p>

        {loading && <p className="mt-3 text-xs text-[#6b7280]">Loading booking details...</p>}

        <Link
          to="/dashboard"
          onClick={handleContinue}
          className="mt-6 inline-flex items-center justify-center text-sm text-[#6b7280]"
          aria-label="Back to dashboard"
        >
          {'<-'} Back to Dashboard
        </Link>
      </div>
    </div>
  );
};

export default BookingSuccess;
