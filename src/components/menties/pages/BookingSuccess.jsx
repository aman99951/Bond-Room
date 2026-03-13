import React, { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { menteeApi } from '../../../apis/api/menteeApi';
import { clearSelectedSessionId, getLastBooking, setSelectedSessionId } from '../../../apis/api/storage';
import {
  CheckCircle2,
  Calendar,
  Clock,
  User,
  Bell,
  Video,
  Home,
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
    <div className="bg-transparent px-3 py-4 sm:px-5 sm:py-6 lg:px-8 lg:py-8">
      <div className="mx-auto w-full max-w-5xl rounded-3xl bg-white p-4 shadow-sm ring-1 ring-[#e5e7eb] sm:p-6 lg:p-8">
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
          <section className="rounded-2xl bg-[#f8fafc] p-4 ring-1 ring-[#e5e7eb] sm:p-5">
            <div className="flex items-start gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#ecfdf3]">
                <CheckCircle2 className="h-7 w-7 text-[#10b981]" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-[#111827] sm:text-2xl">Session Requested</h1>
                <p className="mt-1 text-sm text-[#6b7280]">
                  Your request was sent successfully. You will be notified when the mentor approves it.
                </p>
              </div>
            </div>

            <div className="mt-4 rounded-xl bg-white p-4 ring-1 ring-[#e5e7eb]">
              {hasBookingDetails ? (
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <div className="h-14 w-14 overflow-hidden rounded-xl bg-[#f5f3ff] ring-1 ring-[#e5e7eb]">
                        {booking?.mentorAvatar ? (
                          <img
                            src={booking.mentorAvatar}
                            alt={booking?.mentorName || 'Mentor'}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center">
                            <User className="h-7 w-7 text-[#5D3699]" />
                          </div>
                        )}
                      </div>
                      <div className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-[#5D3699]">
                        <Video className="h-3 w-3 text-white" />
                      </div>
                    </div>
                    <div>
                      <p className="text-xs text-[#6b7280]">Mentor</p>
                      <p className="text-sm font-semibold text-[#111827]">{booking?.mentorName || 'Assigned mentor'}</p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {booking?.durationMinutes ? (
                      <div className="inline-flex items-center gap-2 rounded-lg bg-[#f8fafc] px-3 py-2 text-xs font-medium text-[#111827] ring-1 ring-[#e5e7eb]">
                        <Clock className="h-4 w-4 text-[#5D3699]" />
                        {booking.durationMinutes} min
                      </div>
                    ) : null}
                    {booking?.scheduledStart ? (
                      <div className="inline-flex items-center gap-2 rounded-lg bg-[#f8fafc] px-3 py-2 text-xs font-medium text-[#111827] ring-1 ring-[#e5e7eb]">
                        <Calendar className="h-4 w-4 text-[#5D3699]" />
                        {formatDate(booking.scheduledStart)}
                      </div>
                    ) : null}
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-sm text-[#6b7280]">
                  <Calendar className="h-4 w-4 text-[#9ca3af]" />
                  Booking details will appear once available
                </div>
              )}
            </div>
          </section>

          <aside className="rounded-2xl bg-white p-4 ring-1 ring-[#e5e7eb] sm:p-5">
            <div className="inline-flex items-center gap-2 rounded-full bg-[#fef3c7] px-3 py-1.5 ring-1 ring-[#f59e0b]/20">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#f59e0b] opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-[#f59e0b]" />
              </span>
              <span className="text-xs font-semibold text-[#92400e]">Awaiting approval</span>
            </div>

            <div className="mt-4 rounded-xl bg-[#f8fafc] p-3 ring-1 ring-[#e5e7eb]">
              <div className="flex items-start gap-2">
                <Bell className="mt-0.5 h-4 w-4 text-[#5D3699]" />
                <p className="text-xs leading-relaxed text-[#6b7280]">
                  We will notify you instantly once the session is confirmed.
                </p>
              </div>
            </div>

            {loading ? (
              <div className="mt-3 flex items-center gap-2 text-xs text-[#6b7280]">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-[#e5e7eb] border-t-[#5D3699]" />
                Loading booking details...
              </div>
            ) : null}

            <div className="mt-4 space-y-2.5">
              <Link
                to="/my-sessions"
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#5D3699] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#4a2b7a]"
              >
                <Calendar className="h-4 w-4" />
                View My Sessions
              </Link>
              <Link
                to="/dashboard"
                onClick={handleContinue}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-[#374151] ring-1 ring-[#d1d5db] transition-colors hover:bg-[#f9fafb]"
              >
                <Home className="h-4 w-4" />
                Back to Dashboard
              </Link>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
};

export default BookingSuccess;
