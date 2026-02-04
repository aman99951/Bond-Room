import React from 'react';
import { Link } from 'react-router-dom';

const mentorsBeforeBooking = [
  {
    name: 'Dr. Lakshmi T Rajan',
    location: 'Madurai, TN',
    tags: ['Anxiety', 'Career Stress', 'Mindfulness'],
    rating: '4.9',
    reviews: '128',
    blurb:
      'Specializes in cognitive-behavioral techniques to help professionals manage work-related stress and anxiety.',
    topMatch: true,
    avatar:
      'https://c.pxhere.com/photos/c7/42/young_man_portrait_beard_young_man_male_handsome_young_man_handsome-1046502.jpg!d',
  },
  {
    name: 'Mr.Arputharaj Felix',
    location: 'Chennai, TN',
    tags: ['Relationships', 'Communication'],
    rating: '4.8',
    reviews: '97',
    blurb:
      'Expert in relationship counseling and building effective communication skills for personal and professional growth.',
    avatar: 'https://cdn.pixabay.com/photo/2023/02/24/00/41/ai-generated-7809879_960_720.jpg',
  },
  {
    name: 'Rizwana Parvin',
    location: 'Coimbatore, TN',
    tags: ['Burnout', 'Resilience', 'Habit Formation'],
    rating: '4.9',
    reviews: '152',
    blurb:
      'Focuses on helping clients overcome burnout by building resilience and fostering positive, sustainable habits.',
    avatar:
      'https://c.pxhere.com/photos/c7/42/young_man_portrait_beard_young_man_male_handsome_young_man_handsome-1046502.jpg!d',
  },
  {
    name: 'A. Elangovan',
    location: 'Chennai, TN',
    tags: ['Leadership', 'Personal Growth'],
    rating: '4.7',
    reviews: '88',
    blurb:
      'A certified coach dedicated to unlocking leadership potential and guiding individuals through personal growth journeys.',
    avatar: 'https://cdn.pixabay.com/photo/2023/02/24/00/41/ai-generated-7809879_960_720.jpg',
  },
];

const Mentors = () => {
  return (
    <div className="min-h-screen bg-transparent">
      <div className="max-w-6xl mx-auto px-3 sm:px-4 md:px-6 py-6 sm:py-8 md:py-10">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4">
          <div>
            <h1
              className="text-[#111827] text-2xl sm:text-[30px]"
              style={{
                fontFamily: 'DM Sans',
                lineHeight: '36px',
                fontWeight: 700,
              }}
            >
              Your Recommended Mentors
            </h1>
            <p className="mt-1 text-xs sm:text-sm text-[#6b7280]">Based on your current mood and concerns</p>
          </div>
          <div className="inline-flex items-center gap-2 rounded-full bg-[#ecfdf3] text-[#1f7a3f] px-3 sm:px-4 py-1.5 sm:py-2 text-[10px] sm:text-xs font-medium w-fit">
            <span className="inline-flex h-3 w-3 sm:h-4 sm:w-4 items-center justify-center rounded-full bg-[#1f7a3f] text-white text-[8px] sm:text-[10px] flex-shrink-0">
              ✓
            </span>
            AI Analysis Complete
          </div>
        </div>

        <div className="mt-4 sm:mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
          {mentorsBeforeBooking.map((m) => (
            <div
              key={m.name}
              className={`relative rounded-xl sm:rounded-2xl border-2 bg-white p-4 sm:p-5 shadow-[0px_1px_2px_0px_rgba(0,0,0,0.08)] ${
                m.topMatch ? 'border-[#10b981]' : 'border-[#e5e7eb]'
              }`}
            >
              {m.topMatch && (
                <span className="absolute -top-3 right-3 sm:right-4 inline-flex items-center gap-1 rounded-full border border-[#10b981] bg-[#ecfdf3] px-2 sm:px-3 py-1 text-[9px] sm:text-[10px] font-semibold text-[#10b981]">
                  <span className="text-[10px] sm:text-[11px]">★</span> Top Match
                </span>
              )}
              <div className="flex items-start gap-3 sm:gap-4">
                <div className="h-12 w-12 sm:h-16 sm:w-16 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden flex-shrink-0">
                  {m.avatar ? (
                    <img src={m.avatar} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <div className="h-full w-full bg-gradient-to-br from-gray-200 to-gray-300" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs sm:text-sm font-semibold text-[#111827] truncate">{m.name}</div>
                  <div className="mt-0.5 text-[10px] sm:text-xs text-gray-500 flex items-center gap-1">
                    <span className="inline-flex h-3 w-3 items-center justify-center flex-shrink-0">
                      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="h-3 w-3 text-[#4B5563]">
                        <path d="M12 21s7-5.2 7-11a7 7 0 0 0-14 0c0 5.8 7 11 7 11z" stroke="currentColor" strokeWidth="1.5" />
                        <circle cx="12" cy="10" r="2.5" stroke="currentColor" strokeWidth="1.5" />
                      </svg>
                    </span>
                    {m.location}
                  </div>
                  <div className="mt-1.5 sm:mt-2 flex flex-wrap items-center gap-1 sm:gap-2">
                    {m.tags.map((t) => (
                      <span
                        key={t}
                        className="rounded-full bg-[#E0E7FF] px-2 sm:px-[10px] py-[2px] text-[#5b2c91] whitespace-nowrap text-[10px] sm:text-xs"
                        style={{
                          fontFamily: 'DM Sans',
                          fontWeight: 500,
                        }}
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <p
                className="mt-2 sm:mt-3 text-gray-500 text-xs sm:text-sm line-clamp-3 sm:line-clamp-none"
                style={{ fontFamily: 'DM Sans', lineHeight: '22.75px', fontWeight: 400 }}
              >
                {m.blurb}
              </p>

              <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-0">
                <div className="flex items-center gap-1 text-xs text-gray-600">
                  <span className="text-[#f4b740]">★</span>
                  <span className="font-semibold text-[#111827]">{m.rating}</span>
                  <span className="text-gray-400">({m.reviews})</span>
                </div>
                <div className="flex items-center justify-between sm:justify-end gap-2 sm:gap-3">
                  <Link
                    to="/mentor-profile"
                    className="hover:text-[#5b2c91] text-xs sm:text-sm"
                    style={{
                      fontFamily: 'DM Sans',
                      lineHeight: '20px',
                      fontWeight: m.topMatch ? 600 : 400,
                      color: m.topMatch ? '#5D3699' : '#6b7280',
                      textAlign: 'center',
                      verticalAlign: 'middle',
                    }}
                  >
                    View Profile
                  </Link>
                  <Link
                    to="/mentor-details"
                    className={`rounded-[8px] border px-3 sm:px-4 py-2 text-center text-xs sm:text-base flex-1 sm:flex-none ${
                      m.topMatch ? 'bg-[#5D3699] text-white border-[#5D3699]' : 'border-[#5D3699] text-[#5D3699]'
                    }`}
                    style={{
                      minWidth: 'auto',
                      height: '36px',
                      fontFamily: 'DM Sans',
                      lineHeight: '24px',
                      fontWeight: 500,
                    }}
                  >
                    <span className="hidden sm:inline">Schedule Session</span>
                    <span className="sm:hidden">Schedule</span>
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div
          className="mt-6 sm:mt-8 flex items-center justify-center gap-2 sm:gap-3 text-[#4B5563]"
          style={{ fontFamily: 'DM Sans', fontSize: '16px', lineHeight: '24px', fontWeight: 500 }}
        >
          <button className="h-6 w-6 sm:h-7 sm:w-7 rounded-md text-[#4B5563] text-sm sm:text-base">‹</button>
          <button className="h-6 w-6 sm:h-7 sm:w-7 rounded-md bg-[#5b2c91] text-white text-sm sm:text-base">1</button>
          <button className="h-6 w-6 sm:h-7 sm:w-7 rounded-md text-[#4B5563] text-sm sm:text-base">2</button>
          <button className="h-6 w-6 sm:h-7 sm:w-7 rounded-md text-[#4B5563] text-sm sm:text-base">3</button>
          <span className="text-[#4B5563] text-sm sm:text-base">...</span>
          <button className="h-6 w-6 sm:h-7 sm:w-7 rounded-md text-[#4B5563] text-sm sm:text-base">8</button>
          <button className="h-6 w-6 sm:h-7 sm:w-7 rounded-md text-[#4B5563] text-sm sm:text-base">›</button>
        </div>
      </div>
    </div>
  );
};

export default Mentors;