import React from 'react';
import { Link } from 'react-router-dom';

const MentorDetails = () => {
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
                <img
                  src="https://c.pxhere.com/photos/c7/42/young_man_portrait_beard_young_man_male_handsome_young_man_handsome-1046502.jpg!d"
                  alt=""
                  className="h-full w-full object-cover"
                />
              </div>
              <h1
                className="mt-3 text-[#111827] text-center text-xl sm:text-2xl"
                style={{ fontFamily: 'Inter', lineHeight: '32px', fontWeight: 700 }}
              >
                Dr. Lakshmi T Rajan
              </h1>
              <div className="text-xs text-[#64748B] flex items-center gap-1">
                <span className="inline-flex h-3 w-3 items-center justify-center">
                  <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="h-3 w-3 text-[#4B5563]">
                    <path d="M12 21s7-5.2 7-11a7 7 0 0 0-14 0c0 5.8 7 11 7 11z" stroke="currentColor" strokeWidth="1.5" />
                    <circle cx="12" cy="10" r="2.5" stroke="currentColor" strokeWidth="1.5" />
                  </svg>
                </span>
                Madurai, TN
              </div>

              <div
                className="mt-3 inline-flex items-center justify-center rounded-full bg-[#DCFCE7] px-3 py-1 text-[#166534] text-xs"
                style={{
                  minWidth: '106.17px',
                  height: '24px',
                  fontFamily: 'Inter',
                  fontWeight: 600,
                }}
              >
                Senior Mentor
              </div>
              <div className="mt-2 flex items-center justify-center gap-2 flex-wrap">
                <span
                  className="rounded-full bg-[#F1F5F9] px-[10px] py-[4px] text-[#334155] text-xs"
                  style={{
                    fontFamily: 'DM Sans',
                    fontWeight: 500,
                  }}
                >
                  Tamil
                </span>
                <span
                  className="rounded-full bg-[#F1F5F9] px-[10px] py-[4px] text-[#334155] text-xs"
                  style={{
                    fontFamily: 'DM Sans',
                    fontWeight: 500,
                  }}
                >
                  English
                </span>
              </div>
            </div>

            <div className="mt-4 flex items-center justify-center gap-2 mx-auto pb-4 sm:pb-6" style={{ minHeight: '48px' }}>
              <span className="text-[#f4b740]">★</span>
              <span style={{ fontFamily: 'Inter', fontSize: '16px', lineHeight: '24px', fontWeight: 600, textAlign: 'center', verticalAlign: 'middle', color: '#111827' }}>
                4.9
              </span>
              <span style={{ fontFamily: 'DM Sans', fontSize: '16px', lineHeight: '24px', fontWeight: 400, textAlign: 'center', verticalAlign: 'middle', color: '#6b7280' }}>
                (128 reviews)
              </span>
            </div>

            <Link
              to="/book-session"
              className="mt-4 block rounded-[8px] bg-[#5D3699] text-white text-center px-4 sm:px-6 py-3 w-full lg:w-[275.33px] text-sm sm:text-base"
              style={{
                height: '48px',
                fontFamily: 'Inter',
                lineHeight: '24px',
                fontWeight: 600,
              }}
            >
              Schedule Session
            </Link>

            <div className="mt-4 text-[10px] text-[#6b7280] text-center">AI Matched For:</div>
            <div className="mt-2 flex items-center justify-center gap-2 flex-wrap">
              <span className="rounded-full bg-[#E0E7FF] px-3 py-1 text-[10px] text-[#5D3699]">Anxiety</span>
              <span className="rounded-full bg-[#E0E7FF] px-3 py-1 text-[10px] text-[#5D3699]">Stress</span>
            </div>
          </aside>

          <Link to="/mentors" className="text-xs text-[#6b7280] underline block">
            ← Back to recommendations
          </Link>
        </div>

        <section
          className="space-y-4 sm:space-y-6 lg:space-y-8 min-w-0 w-full lg:w-[728.67px] lg:h-[1030px] lg:ml-[80.33px]"
        >
          <div
            className="border border-[#e5e7eb] rounded-[16px] bg-white p-4 sm:p-6 lg:p-8 shadow-[0px_1px_2px_0px_rgba(0,0,0,0.08)] w-full lg:w-[728.67px] lg:h-[267px]"
          >
            <h2
              className="text-[#111827] text-lg sm:text-xl"
              style={{ fontFamily: 'Inter', lineHeight: '28px', fontWeight: 700 }}
            >
              About the Mentor
            </h2>
            <p
              className="mt-3 text-[#6b7280] text-sm sm:text-base w-full lg:w-[649px] lg:h-[128px] lg:max-h-[128px]"
              style={{
                fontFamily: 'DM Sans',
                lineHeight: '26px',
                fontWeight: 400,
              }}
            >
             Hi there! I'm Lakshmi, and I specialize in helping students navigate the pressures of high school with confidence. With over 5 years of experience in educational counseling, I've helped hundreds of teens find their balance.
            </p>
            <button
              className="mt-3 text-[#5D3699] text-center text-sm sm:text-base"
              style={{ fontFamily: 'Inter', lineHeight: '24px', fontWeight: 600 }}
            >
              Read More
            </button>
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
              {['Exam Anxiety', 'Study Strategies', 'Parent Pressure', 'Motivation', 'Stress Relief', 'Time Management', 'Perfectionism'].map((t) => (
                <span
                  key={t}
                  className="rounded-[8px] bg-[#F1F5F9] px-3 sm:px-4 py-1.5 sm:py-2 text-[9px] sm:text-[10px] text-[#5D3699]"
                >
                  {t}
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
                {[
                  [],
                  ['9:00 AM'],
                  [],
                  ['2:00 PM'],
                  [],
                  ['10:00 AM', '11:00 AM'],
                  ['3:00 PM'],
                ].map((times, i) => (
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
                  Michael B.
                </span>
                <span
                  className="text-[#f4b740] text-base sm:text-lg"
                  style={{ lineHeight: '16px' }}
                >
                  ★★★★★
                </span>
              </div>
              <p
                className="mt-2 text-sm sm:text-base w-full lg:w-[598.67px] lg:h-[48px]"
                style={{
                  fontFamily: 'DM Sans',
                  lineHeight: '24px',
                  fontWeight: 400,
                }}
              >
                "Her guidance on study strategies completely changed my approach to learning. I feel more confident and
                organized than ever."
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default MentorDetails;