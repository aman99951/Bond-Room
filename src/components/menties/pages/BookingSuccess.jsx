import React, { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { menteeApi } from '../../../apis/api/menteeApi';
import { clearSelectedSessionId, getLastBooking, setSelectedSessionId } from '../../../apis/api/storage';
import {
  CheckCircle2,
  Calendar,
  Clock,
  User,
  ArrowLeft,
  Bell,
  Mail,
  Video,
  Shield,
  Sparkles,
  Home
} from 'lucide-react';

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
    <div className="min-h-screen bg-transparent flex items-center justify-center p-4 sm:p-6 lg:p-8">
      <div className="w-full max-w-2xl">
        {/* Main Card */}
        <div className="rounded-2xl bg-white p-4 sm:p-6 lg:p-10 shadow-sm ring-1 ring-[#e5e7eb] text-center">
          {/* Success Icon */}
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-[#ecfdf3] ring-8 ring-[#dcfce7]/50">
            <CheckCircle2 className="h-10 w-10 text-[#10b981]" />
          </div>

          {/* Title */}
          <h1 className="mt-6 text-2xl font-bold text-[#111827] sm:text-3xl">
            Session Requested!
          </h1>
          <p className="mt-2 text-sm text-[#6b7280] sm:text-base">
            Your booking request has been sent to the mentor
          </p>

          {/* Booking Details Card */}
          <div className="mt-8 rounded-2xl bg-[#f8fafc] p-5 sm:p-6 ring-1 ring-[#e5e7eb]">
            {hasBookingDetails ? (
              <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
                {/* Mentor Avatar */}
                <div className="relative">
                  <div className="h-16 w-16 overflow-hidden rounded-xl bg-[#f5f3ff] ring-2 ring-white shadow-md">
                    {booking?.mentorAvatar ? (
                      <img
                        src={booking.mentorAvatar}
                        alt={booking?.mentorName || 'Mentor'}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center">
                        <User className="h-8 w-8 text-[#5D3699]" />
                      </div>
                    )}
                  </div>
                  <div className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-[#5D3699] ring-2 ring-white">
                    <Video className="h-3 w-3 text-white" />
                  </div>
                </div>

                {/* Details */}
                <div className="flex flex-col items-center gap-3 sm:flex-row sm:gap-4">
                  {/* Mentor Name */}
                  {booking?.mentorName && (
                    <div className="text-center sm:text-left">
                      <p className="text-xs text-[#6b7280]">Session with</p>
                      <p className="text-base font-semibold text-[#111827]">
                        {booking.mentorName}
                      </p>
                    </div>
                  )}

                  {/* Divider */}
                  <div className="hidden h-10 w-px bg-[#e5e7eb] sm:block" />

                  {/* Duration */}
                  {booking?.durationMinutes && (
                    <div className="flex items-center gap-2 rounded-lg bg-white px-3 py-2 ring-1 ring-[#e5e7eb]">
                      <Clock className="h-4 w-4 text-[#5D3699]" />
                      <span className="text-sm font-medium text-[#111827]">
                        {booking.durationMinutes} min
                      </span>
                    </div>
                  )}

                  {/* Date */}
                  {booking?.scheduledStart && (
                    <div className="flex items-center gap-2 rounded-lg bg-white px-3 py-2 ring-1 ring-[#e5e7eb]">
                      <Calendar className="h-4 w-4 text-[#5D3699]" />
                      <span className="text-sm font-medium text-[#111827]">
                        {formatDate(booking.scheduledStart)}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center py-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#f5f3ff]">
                  <Calendar className="h-6 w-6 text-[#9ca3af]" />
                </div>
                <p className="mt-3 text-sm text-[#6b7280]">
                  Booking details will appear once available
                </p>
              </div>
            )}
          </div>

          {/* Status Badge */}
          <div className="mt-6 inline-flex items-center gap-2 rounded-full bg-[#fef3c7] px-4 py-2 ring-1 ring-[#f59e0b]/20">
            <div className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#f59e0b] opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-[#f59e0b]" />
            </div>
            <span className="text-xs font-medium text-[#92400e]">
              Awaiting mentor approval
            </span>
          </div>

          {/* Info Text */}
          <p className="mt-6 text-sm text-[#6b7280]">
            Your session request will be reviewed by the mentor.
            <br className="hidden sm:block" />
            We'll notify you once it's confirmed.
          </p>

          {/* What's Next Section */}
          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            <div className="rounded-xl bg-[#f8fafc] p-4 ring-1 ring-[#e5e7eb]">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#f5f3ff] mx-auto">
                <Bell className="h-5 w-5 text-[#5D3699]" />
              </div>
              <p className="mt-3 text-xs font-medium text-[#111827]">Get Notified</p>
              <p className="mt-1 text-[10px] text-[#6b7280]">
                You'll receive updates on your booking status
              </p>
            </div>
            <div className="rounded-xl bg-[#f8fafc] p-4 ring-1 ring-[#e5e7eb]">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#f5f3ff] mx-auto">
                <Mail className="h-5 w-5 text-[#5D3699]" />
              </div>
              <p className="mt-3 text-xs font-medium text-[#111827]">Check Email</p>
              <p className="mt-1 text-[10px] text-[#6b7280]">
                Confirmation will be sent to your email
              </p>
            </div>
            <div className="rounded-xl bg-[#f8fafc] p-4 ring-1 ring-[#e5e7eb]">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-50 mx-auto">
                <Shield className="h-5 w-5 text-[#10b981]" />
              </div>
              <p className="mt-3 text-xs font-medium text-[#111827]">Safe Session</p>
              <p className="mt-1 text-[10px] text-[#6b7280]">
                All sessions are monitored for safety
              </p>
            </div>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="mt-6 flex items-center justify-center gap-2">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-[#e5e7eb] border-t-[#5D3699]" />
              <span className="text-xs text-[#6b7280]">Loading booking details...</span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Link
              to="/my-sessions"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#5D3699] px-6 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:bg-[#4a2b7a] hover:shadow-md"
            >
              <Calendar className="h-4 w-4" />
              View My Sessions
            </Link>
            <Link
              to="/dashboard"
              onClick={handleContinue}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-6 py-3 text-sm font-semibold text-[#6b7280] ring-1 ring-[#e5e7eb] transition-all hover:bg-[#f8fafc] hover:text-[#111827]"
            >
              <Home className="h-4 w-4" />
              Back to Dashboard
            </Link>
          </div>

          {/* Divider */}
          <div className="my-8 border-t border-[#e5e7eb]" />

          {/* Browse More */}
          <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Sparkles className="h-5 w-5 text-[#5D3699]" />
            <span className="text-sm text-[#6b7280]">
              Want to explore more mentors?
            </span>
            <Link
              to="/mentors"
              className="text-sm font-semibold text-[#5D3699] hover:underline"
            >
              Browse Mentors →
            </Link>
          </div>
        </div>

        {/* Help Text */}
        <p className="mt-6 text-center text-xs text-[#9ca3af]">
          Questions? Contact us at{' '}
          <a href="mailto:support@bondroom.com" className="text-[#5D3699] hover:underline">
            support@bondroom.com
          </a>
        </p>
      </div>
    </div>
  );
};

export default BookingSuccess;
