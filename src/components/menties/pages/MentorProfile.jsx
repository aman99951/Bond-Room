import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useMentorScreenData } from './useMentorScreenData';

const MentorProfile = () => {
  const { mentor, availability, review, loading, error } = useMentorScreenData();
  const rating = mentor?.rating != null ? Number(mentor.rating).toFixed(1) : '';
  const reviewCount = mentor?.reviews != null ? Number(mentor.reviews) : null;
  const reviewStars = review?.rating ? '*'.repeat(Math.max(1, Math.min(5, Number(review.rating)))) : '';
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
    <div className="p-3 sm:p-4 md:p-6 overflow-x-hidden bg-transparent">
      <div
        className="mx-auto grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-4 sm:gap-6 w-full lg:w-[1102px] lg:h-[1204px] max-w-[1280px]"
      >
        <div className="space-y-4">
          <aside
            className="border border-[#e5e7eb] rounded-[16px] bg-white p-4 sm:p-6 lg:p-8 shadow-[0px_1px_2px_0px_rgba(0,0,0,0.08)] w-full lg:w-[355.33px] lg:h-[567px]"
          >
            <div className="flex flex-col items-center text-center">
              <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-full overflow-hidden bg-gray-200 flex-shrink-0">
                {mentor?.avatar ? (
                  <img
                    src={mentor.avatar}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="h-full w-full bg-gray-200" />
                )}
              </div>
              <h1
                className="mt-3 text-[#111827] text-center text-xl sm:text-2xl"
                style={{ fontFamily: 'Inter', lineHeight: '32px', fontWeight: 700 }}
              >
                {displayName}
              </h1>
              {mentor?.location && (
                <div className="text-xs text-[#64748B] flex items-center gap-1">
                  <span className="inline-flex h-3 w-3 items-center justify-center">
                    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="h-3 w-3 text-[#4B5563]">
                      <path d="M12 21s7-5.2 7-11a7 7 0 0 0-14 0c0 5.8 7 11 7 11z" stroke="currentColor" strokeWidth="1.5" />
                      <circle cx="12" cy="10" r="2.5" stroke="currentColor" strokeWidth="1.5" />
                    </svg>
                  </span>
                  {mentor.location}
                </div>
              )}

              {mentor?.qualification && (
                <div
                  className="mt-3 inline-flex items-center justify-center rounded-full bg-[#DCFCE7] px-3 py-1 text-[#166534] text-xs"
                  style={{
                    minWidth: '106.17px',
                    height: '24px',
                    fontFamily: 'Inter',
                    fontWeight: 600,
                  }}
                >
                  {mentor.qualification}
                </div>
              )}
              <div className="mt-2 flex items-center justify-center gap-2 flex-wrap">
                {(mentor?.languages || []).map((language) => (
                  <span
                    key={language}
                    className="rounded-full bg-[#F1F5F9] px-[10px] py-[4px] text-[#334155] text-xs"
                    style={{
                      fontFamily: 'DM Sans',
                      fontWeight: 500,
                    }}
                  >
                    {language}
                  </span>
                ))}
              </div>
            </div>

            {(rating || reviewCount != null) && (
              <div className="mt-4 flex items-center justify-center gap-2 mx-auto pb-4 sm:pb-6" style={{ minHeight: '48px' }}>
                <span className="text-[#f4b740]">*</span>
                {rating && (
                  <span style={{ fontFamily: 'Inter', fontSize: '16px', lineHeight: '24px', fontWeight: 600, textAlign: 'center', verticalAlign: 'middle', color: '#111827' }}>
                    {rating}
                  </span>
                )}
                {reviewCount != null && (
                  <span style={{ fontFamily: 'DM Sans', fontSize: '16px', lineHeight: '24px', fontWeight: 400, textAlign: 'center', verticalAlign: 'middle', color: '#6b7280' }}>
                    ({reviewCount} reviews)
                  </span>
                )}
              </div>
            )}

           

            {Array.isArray(mentor?.areas) && mentor.areas.length > 0 && (
              <>
                <div className="mt-4 text-[10px] text-[#6b7280] text-center">AI Matched For:</div>
                <div className="mt-2 flex items-center justify-center gap-2 flex-wrap">
                  {mentor.areas.map((area) => (
                    <span key={area} className="rounded-full bg-[#E0E7FF] px-3 py-1 text-[10px] text-[#5D3699]">{area}</span>
                  ))}
                </div>
              </>
            )}
          </aside>

          <Link to="/mentors" className="text-xs text-[#6b7280] underline block">
            {'<-'} Back to recommendations
          </Link>
        </div>

        <section
          className="space-y-4 sm:space-y-6 lg:space-y-8 min-w-0 w-full lg:w-[728.67px] lg:h-[1030px] lg:ml-[80.33px]"
        >
          {(loading || error) && (
            <div className={`text-xs sm:text-sm ${error ? 'text-red-600' : 'text-[#6b7280]'}`}>
              {error || 'Loading mentor profile...'}
            </div>
          )}

          <div
            className="border border-[#e5e7eb] rounded-[16px] bg-white p-4 sm:p-6 lg:p-8 shadow-[0px_1px_2px_0px_rgba(0,0,0,0.08)] w-full lg:w-[728.67px] lg:h-[267px]"
          >
            <h2
              className="text-[#111827] text-lg sm:text-xl"
              style={{ fontFamily: 'Inter', lineHeight: '28px', fontWeight: 700 }}
            >
              About the Mentor
            </h2>
            {mentor?.bio && (
              <p
                ref={aboutRef}
                className={`mt-3 text-[#6b7280] text-sm sm:text-base w-full lg:w-[649px] ${
                  aboutExpanded ? '' : 'line-clamp-4'
                }`}
                style={{
                  fontFamily: 'DM Sans',
                  lineHeight: '26px',
                  fontWeight: 400,
                }}
              >
                {mentor.bio}
              </p>
            )}
            {showReadMore && (
              <button
                type="button"
                className="mt-3 text-[#5D3699] text-center text-sm sm:text-base"
                style={{ fontFamily: 'Inter', lineHeight: '24px', fontWeight: 600 }}
                onClick={() => setAboutExpanded((prev) => !prev)}
              >
                {aboutExpanded ? 'Read Less' : 'Read More'}
              </button>
            )}
          </div>

          <div
            className="border border-[#e5e7eb] rounded-[16px] bg-white p-4 sm:p-6 lg:p-8 shadow-[0px_1px_2px_0px_rgba(0,0,0,0.08)] w-full lg:w-[728.67px] lg:h-[202px]"
          >
            <h2
              className="text-[#111827] text-lg sm:text-xl"
              style={{ fontFamily: 'Inter', lineHeight: '28px', fontWeight: 700 }}
            >
              Wisdom Areas
            </h2>
            <div className="mt-3 sm:mt-4 flex flex-wrap gap-2 sm:gap-3 lg:gap-4 w-full lg:w-[648.67px] lg:h-[92px]">
              {(mentor?.areas || []).map((area) => (
                <span
                  key={area}
                  className="rounded-[8px] bg-[#F1F5F9] px-3 sm:px-4 py-1.5 sm:py-2 text-[9px] sm:text-[10px] text-[#5D3699]"
                >
                  {area}
                </span>
              ))}
            </div>
          </div>

          <div className="border border-[#e5e7eb] rounded-[16px] bg-white p-4 sm:p-6 lg:p-8 shadow-[0px_1px_2px_0px_rgba(0,0,0,0.08)] w-full overflow-x-auto">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-0">
              <h2 className="text-[#111827] text-lg sm:text-xl" style={{ fontFamily: 'Inter', lineHeight: '28px', fontWeight: 700 }}>
                Availability This Week
              </h2>
              <button className="text-xs text-[#5D3699] underline">View Full Availability</button>
            </div>
            <div className="mt-4 min-w-[500px] sm:min-w-0">
              <div className="grid grid-cols-7 gap-1 sm:gap-2 lg:gap-3 text-center text-[10px] sm:text-[12px] text-[#9CA3AF]">
                {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d) => (
                  <div key={d} className="font-medium text-[#6B7280]">
                    {d}
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-1 sm:gap-2 lg:gap-3 mt-2">
                {(availability || []).map((times, i) => (
                  <div key={i} className="flex flex-col items-center gap-1 sm:gap-2">
                    {times.length === 0 ? (
                      <span className="h-6 sm:h-8" />
                    ) : (
                      times.map((t) => (
                        <div key={t} className="h-6 sm:h-8 rounded-md bg-[#DBEAFE] text-[#1D4ED8] flex items-center justify-center px-1 sm:px-2 text-[8px] sm:text-[10px] lg:text-xs whitespace-nowrap">
                          {t}
                        </div>
                      ))
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="border border-[#e5e7eb] rounded-2xl bg-white p-4 sm:p-5 shadow-[0px_1px_2px_0px_rgba(0,0,0,0.08)] w-full">
            <h2
              className="text-[#111827] text-lg sm:text-xl"
              style={{ fontFamily: 'Inter', lineHeight: '28px', fontWeight: 700 }}
            >
              What Mentees Say
            </h2>
            <div className="mt-3 sm:mt-4 rounded-xl border border-[#eef2f7] bg-[#f8fafc] p-3 sm:p-4 text-xs text-[#6b7280]">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-0">
                <span
                  className="text-[#111827] text-sm sm:text-base"
                  style={{ fontFamily: 'Inter', lineHeight: '24px', fontWeight: 600 }}
                >
                  {review ? 'Recent Feedback' : 'No Feedback Yet'}
                </span>
                <span
                  className="text-[#f4b740] text-base sm:text-lg"
                  style={{ lineHeight: '16px' }}
                >
                  {reviewStars}
                </span>
              </div>
              {review?.comments && (
                <p
                  className="mt-2 text-sm sm:text-base w-full lg:w-[598.67px] lg:h-[48px]"
                  style={{
                    fontFamily: 'DM Sans',
                    lineHeight: '24px',
                    fontWeight: 400,
                  }}
                >
                  "{review.comments}"
                </p>
              )}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default MentorProfile;
