import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useMentorScreenData } from './useMentorScreenData';
import {
  MapPin,
  Star,
  Globe,
  Award,
  BookOpen,
  Calendar,
  Clock,
  MessageCircle,
  ArrowLeft,
  User,
  ChevronDown,
  ChevronUp,
  Sparkles,
  CheckCircle2,
  Quote,
  ExternalLink
} from 'lucide-react';


const MentorProfile = () => {
  const { mentor, availability, review, loading, error } = useMentorScreenData();
  const rating = mentor?.rating != null ? Number(mentor.rating).toFixed(1) : '';
  const reviewCount = mentor?.reviews != null ? Number(mentor.reviews) : null;
  const displayName = mentor?.name || (mentor?.id ? `Mentor #${mentor.id}` : '');
  const [aboutExpanded, setAboutExpanded] = useState(false);
  const [showReadMore, setShowReadMore] = useState(false);
  const aboutRef = useRef(null);

  useEffect(() => {
    if (aboutExpanded) return undefined;
    const checkOverflow = () => {
      const element = aboutRef.current;
      if (!element) {
        setShowReadMore(false);
        return;
      }
      setShowReadMore(element.scrollHeight > element.clientHeight + 1);
    };
    checkOverflow();
    window.addEventListener('resize', checkOverflow);
    return () => window.removeEventListener('resize', checkOverflow);
  }, [mentor?.bio, aboutExpanded]);

return (
  <div className="min-h-screen bg-transparent p-4 sm:p-6 lg:p-8">
    <div className="mx-auto max-w-6xl">
      {/* Back Link */}
      <Link
        to="/mentors"
        className="mb-6 inline-flex items-center gap-2 text-sm text-[#6b7280] transition-colors hover:text-[#5D3699]"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to recommendations
      </Link>

      {/* Main Grid */}
      <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
        {/* Left Sidebar - Mentor Card */}
        <div className="space-y-6">
          <aside className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-[#e5e7eb]">
            {/* Header Background */}
            <div className="relative h-28 bg-[#5D3699]">
              <div className="absolute inset-0 opacity-30">
                <div
                  className="absolute inset-0"
                  style={{
                    backgroundImage:
                      'radial-gradient(circle at 20% 80%, rgba(255,255,255,0.4) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(255,255,255,0.3) 0%, transparent 50%)',
                  }}
                />
              </div>
            </div>

            {/* Avatar & Info */}
            <div className="px-6 pb-6">
              <div className="-mt-14 flex flex-col items-center text-center">
                {/* Avatar */}
                <div className="relative">
                  <div className="h-28 w-28 overflow-hidden rounded-2xl bg-white ring-4 ring-white shadow-xl">
                    {mentor?.avatar ? (
                      <img
                        src={mentor.avatar}
                        alt={displayName}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-[#f5f3ff]">
                        <User className="h-12 w-12 text-[#5D3699]" />
                      </div>
                    )}
                  </div>
                  {/* Verified Badge */}
                  <div className="absolute -bottom-2 -right-2 flex h-8 w-8 items-center justify-center rounded-full bg-[#10b981] ring-2 ring-white">
                    <CheckCircle2 className="h-4 w-4 text-white" />
                  </div>
                </div>

                {/* Name */}
                <h1 className="mt-4 text-xl font-bold text-[#111827] sm:text-2xl">
                  {displayName}
                </h1>

                {/* Location */}
                {mentor?.location && (
                  <div className="mt-1 flex items-center gap-1.5 text-sm text-[#6b7280]">
                    <MapPin className="h-4 w-4" />
                    <span>{mentor.location}</span>
                  </div>
                )}

                {/* Qualification Badge */}
                {mentor?.qualification && (
                  <div className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-[#ecfdf3] px-4 py-1.5 text-xs font-semibold text-[#10b981] ring-1 ring-[#10b981]/20">
                    <Award className="h-3.5 w-3.5" />
                    {mentor.qualification}
                  </div>
                )}

                {/* Languages */}
                {(mentor?.languages || []).length > 0 && (
                  <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
                    {mentor.languages.map((language) => (
                      <span
                        key={language}
                        className="inline-flex items-center gap-1 rounded-full bg-[#f5f3ff] px-3 py-1 text-xs font-medium text-[#5D3699]"
                      >
                        <Globe className="h-3 w-3" />
                        {language}
                      </span>
                    ))}
                  </div>
                )}

                {/* Rating */}
                {(rating || reviewCount != null) && (
                  <div className="mt-6 flex items-center gap-3 rounded-xl bg-[#f8fafc] px-5 py-3 ring-1 ring-[#e5e7eb]">
                    <div className="flex items-center gap-1">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`h-5 w-5 ${
                            i < Math.floor(rating || 0)
                              ? 'fill-[#f59e0b] text-[#f59e0b]'
                              : 'text-[#e5e7eb]'
                          }`}
                        />
                      ))}
                    </div>
                    <div className="flex items-baseline gap-1">
                      <span className="text-lg font-bold text-[#111827]">{rating}</span>
                      {reviewCount != null && (
                        <span className="text-sm text-[#6b7280]">({reviewCount})</span>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* AI Matched Areas */}
              {Array.isArray(mentor?.areas) && mentor.areas.length > 0 && (
                <div className="mt-6 rounded-xl bg-[#f5f3ff] p-4">
                  <div className="flex items-center justify-center gap-2 text-xs font-medium text-[#5D3699]">
                    <Sparkles className="h-4 w-4" />
                    AI Matched For
                  </div>
                  <div className="mt-3 flex flex-wrap justify-center gap-2">
                    {mentor.areas.map((area) => (
                      <span
                        key={area}
                        className="rounded-full bg-white px-3 py-1 text-xs font-medium text-[#5D3699] ring-1 ring-[#5D3699]/20"
                      >
                        {area}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </aside>

          {/* Quick Info Card */}
          <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-[#e5e7eb]">
            <h3 className="text-sm font-semibold text-[#111827]">Quick Info</h3>
            <div className="mt-4 space-y-3">
              <div className="flex items-center gap-3 text-sm text-[#6b7280]">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#f5f3ff]">
                  <Clock className="h-4 w-4 text-[#5D3699]" />
                </div>
                <span>Usually responds within 24h</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-[#6b7280]">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-green-50">
                  <CheckCircle2 className="h-4 w-4 text-[#10b981]" />
                </div>
                <span>Available this week</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-[#6b7280]">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#f5f3ff]">
                  <MessageCircle className="h-4 w-4 text-[#5D3699]" />
                </div>
                <span>{reviewCount || 0} reviews received</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Section - Details */}
        <section className="space-y-6">
          {/* Loading/Error State */}
          {(loading || error) && (
            <div
              className={`flex items-center gap-3 rounded-xl p-4 ${
                error ? 'bg-red-50 ring-1 ring-red-100' : 'bg-white ring-1 ring-[#e5e7eb]'
              }`}
            >
              {loading && (
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-[#e5e7eb] border-t-[#5D3699]" />
              )}
              <span className={`text-sm ${error ? 'text-red-600' : 'text-[#6b7280]'}`}>
                {error || 'Loading mentor profile...'}
              </span>
            </div>
          )}

          {/* About Section */}
          <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-[#e5e7eb]">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#f5f3ff]">
                <User className="h-5 w-5 text-[#5D3699]" />
              </div>
              <h2 className="text-lg font-semibold text-[#111827]">About the Mentor</h2>
            </div>

            {mentor?.bio && (
              <>
                <p
                  ref={aboutRef}
                  className={`mt-4 text-[#6b7280] leading-relaxed ${
                    aboutExpanded ? '' : 'line-clamp-4'
                  }`}
                >
                  {mentor.bio}
                </p>
                {showReadMore && (
                  <button
                    type="button"
                    onClick={() => setAboutExpanded((prev) => !prev)}
                    className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-[#5D3699] transition-colors hover:text-[#4a2b7a]"
                  >
                    {aboutExpanded ? (
                      <>
                        <ChevronUp className="h-4 w-4" />
                        Read Less
                      </>
                    ) : (
                      <>
                        <ChevronDown className="h-4 w-4" />
                        Read More
                      </>
                    )}
                  </button>
                )}
              </>
            )}

            {!mentor?.bio && (
              <p className="mt-4 text-sm text-[#9ca3af]">No bio available yet.</p>
            )}
          </div>

          {/* Wisdom Areas */}
          <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-[#e5e7eb]">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#f5f3ff]">
                <BookOpen className="h-5 w-5 text-[#5D3699]" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-[#111827]">Wisdom Areas</h2>
                <p className="text-xs text-[#6b7280]">Topics this mentor specializes in</p>
              </div>
            </div>

            <div className="mt-5 flex flex-wrap gap-2">
              {(mentor?.areas || []).length > 0 ? (
                mentor.areas.map((area) => (
                  <span
                    key={area}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-[#f5f3ff] px-4 py-2.5 text-sm font-medium text-[#5D3699] transition-colors hover:bg-[#ede9fe]"
                  >
                    <Sparkles className="h-3.5 w-3.5" />
                    {area}
                  </span>
                ))
              ) : (
                <span className="text-sm text-[#9ca3af]">No areas specified</span>
              )}
            </div>
          </div>

          {/* Availability */}
          <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-[#e5e7eb]">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#f5f3ff]">
                  <Calendar className="h-5 w-5 text-[#5D3699]" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-[#111827]">Availability This Week</h2>
                  <p className="text-xs text-[#6b7280]">Times when mentor is free</p>
                </div>
              </div>
              <button
                type="button"
                className="inline-flex items-center gap-1.5 rounded-lg bg-[#f5f3ff] px-3 py-1.5 text-xs font-medium text-[#5D3699] transition-colors hover:bg-[#ede9fe]"
              >
                View Full Calendar
                <ExternalLink className="h-3 w-3" />
              </button>
            </div>

            {/* Calendar Grid */}
            <div className="mt-6 overflow-x-auto">
              <div className="min-w-[500px]">
                {/* Days Header */}
                <div className="grid grid-cols-7 gap-2 border-b border-[#e5e7eb] pb-3">
                  {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
                    <div
                      key={day}
                      className="text-center text-xs font-semibold uppercase tracking-wider text-[#6b7280]"
                    >
                      {day}
                    </div>
                  ))}
                </div>

                {/* Time Slots */}
                <div className="mt-4 grid grid-cols-7 gap-2">
                  {(availability || []).map((times, dayIndex) => (
                    <div key={dayIndex} className="flex flex-col items-center gap-2">
                      {times.length === 0 ? (
                        <div className="flex h-10 w-full items-center justify-center rounded-lg bg-[#f8fafc] text-[10px] text-[#9ca3af]">
                          —
                        </div>
                      ) : (
                        times.map((time) => (
                          <div
                            key={time}
                            className="flex h-10 w-full items-center justify-center rounded-lg bg-[#5D3699]/10 text-xs font-medium text-[#5D3699]"
                          >
                            {time}
                          </div>
                        ))
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Reviews Section */}
          <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-[#e5e7eb]">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#f5f3ff]">
                <MessageCircle className="h-5 w-5 text-[#5D3699]" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-[#111827]">What Mentees Say</h2>
                <p className="text-xs text-[#6b7280]">Feedback from previous sessions</p>
              </div>
            </div>

            {/* Review Card */}
            <div className="mt-6">
              {review?.comments ? (
                <div className="rounded-xl bg-[#f8fafc] p-5 ring-1 ring-[#e5e7eb]">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#5D3699]/10">
                        <User className="h-5 w-5 text-[#5D3699]" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-[#111827]">Anonymous Mentee</p>
                        <p className="text-xs text-[#6b7280]">Verified Session</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-0.5">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`h-4 w-4 ${
                            i < (review?.rating || 0)
                              ? 'fill-[#f59e0b] text-[#f59e0b]'
                              : 'text-[#e5e7eb]'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                  <div className="mt-4 flex gap-2">
                    <Quote className="h-5 w-5 flex-shrink-0 text-[#9ca3af]" />
                    <p className="text-sm leading-relaxed text-[#6b7280]">{review.comments}</p>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center rounded-xl bg-[#f8fafc] py-12 text-center">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#f5f3ff]">
                    <MessageCircle className="h-7 w-7 text-[#9ca3af]" />
                  </div>
                  <p className="mt-4 text-sm font-medium text-[#111827]">No reviews yet</p>
                  <p className="mt-1 text-xs text-[#6b7280]">
                    Be the first to leave feedback after your session
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* CTA Card */}
          <div className="rounded-2xl bg-[#5D3699] p-6 text-white shadow-lg shadow-[#5D3699]/20">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="text-lg font-semibold">Ready to connect?</h3>
                <p className="mt-1 text-sm text-white/80">
                  Book a session with {displayName} today
                </p>
              </div>
              <Link
                to={`/book-session?mentorId=${mentor?.id || ''}`}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-6 py-3 text-sm font-semibold text-[#5D3699] transition-all hover:bg-[#f5f3ff]"
              >
                <Calendar className="h-5 w-5" />
                Schedule Session
              </Link>
            </div>
          </div>
        </section>
      </div>
    </div>
  </div>
);
};

export default MentorProfile;
