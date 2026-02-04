import React from 'react';
import { Link } from 'react-router-dom';
import arrowLeft from '../../assets/Container (2).png';
import arrowRight from '../../assets/Container (1).png';

const BookSession = () => {
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const dates = [
    '', '', '', '', '', '1', '2',
    '3', '4', '5', '6', '7', '8', '9',
    '10', '11', '12', '13', '14', '15', '16',
    '17', '18', '19', '20', '21', '22', '23',
    '24', '25', '26', '27', '28', '29', '30',
    '31', '', '', '', '', '', '',
  ];

  const times = [
    '09:00 AM', '09:30 AM', '10:00 AM', '10:30 AM',
    '11:00 AM', '11:30 AM', '01:00 PM', '01:30 PM', '02:00 PM',
  ];

  return (
    <div className="p-3 sm:p-4 md:p-6 bg-transparent min-h-screen">
      {/* Header Section */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <h1 className="text-base sm:text-lg md:text-xl font-semibold text-[#111827]">
          Book Session with Dr. Lakshmi T Rajan
        </h1>
        <div className="inline-flex items-center gap-2 rounded-full bg-[#ecfdf3] text-[#1f7a3f] px-2 sm:px-3 py-1 text-[10px] sm:text-xs font-medium w-fit">
          <span className="inline-flex h-3 w-3 sm:h-4 sm:w-4 items-center justify-center rounded-full bg-[#1f7a3f] text-white text-[8px] sm:text-[10px] flex-shrink-0">
            ✓
          </span>
          <span className="whitespace-nowrap">Sessions are monitored for safety</span>
        </div>
      </div>

      {/* Main Card */}
      <div className="rounded-xl sm:rounded-2xl border border-[#e5e7eb] bg-white shadow-[0px_1px_2px_0px_rgba(0,0,0,0.08)] overflow-hidden">
        <div className="flex flex-col lg:grid lg:grid-cols-[320px_1fr] xl:grid-cols-[356px_1fr]">
          
          {/* Left Sidebar - Mentor Info */}
          <aside className="p-4 sm:p-6 md:p-8 border-b lg:border-b-0 lg:border-r border-[#eef2f7] space-y-4 sm:space-y-6 w-full">
            {/* Mentor Profile */}
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-full overflow-hidden bg-gray-200 flex-shrink-0">
                <img
                  src="https://c.pxhere.com/photos/c7/42/young_man_portrait_beard_young_man_male_handsome_young_man_handsome-1046502.jpg!d"
                  alt=""
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="min-w-0">
                <div className="text-[#111827] font-bold text-base sm:text-lg md:text-xl leading-tight truncate">
                  Dr. Lakshmi T Rajan
                </div>
                <div className="text-[10px] sm:text-xs text-[#6b7280]">Madurai, TN</div>
              </div>
            </div>

            {/* Rating & Stats */}
            <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs text-[#6b7280] border-b border-[#e5e7eb] pb-4 sm:pb-6">
              <div className="flex items-center gap-1">
                <span className="text-[#f4b740]">★</span>
                <span className="text-[#111827] font-semibold text-sm">4.9</span>
              </div>
              <span className="text-[#9ca3af] text-xs sm:text-sm">(128 reviews)</span>
              <span className="text-[#9ca3af] text-xs sm:text-sm">
                <span className="font-bold text-black">250+</span> sessions
              </span>
            </div>

            {/* Expertise, Languages, Story */}
            <div className="space-y-4 sm:space-y-6">
              <div>
                <div className="text-[#6b7280] text-xs sm:text-sm font-semibold tracking-wider uppercase">
                  EXPERTISE
                </div>
                <div className="mt-2 flex flex-wrap gap-1.5 sm:gap-2">
                  {['Career Growth', 'Leadership', 'Productivity'].map((t) => (
                    <span 
                      key={t} 
                      className="rounded-full bg-[#F1F5F9] px-2 sm:px-3 py-1 text-[9px] sm:text-[10px] text-[#334155]"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <div className="text-[#6b7280] text-xs sm:text-sm font-semibold tracking-wider uppercase">
                  LANGUAGES
                </div>
                <div className="mt-2 flex flex-wrap gap-1.5 sm:gap-2">
                  {['English', 'Spanish'].map((t) => (
                    <span 
                      key={t} 
                      className="rounded-full bg-[#F1F5F9] px-2 sm:px-3 py-1 text-[9px] sm:text-[10px] text-[#334155]"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <div className="text-[#6b7280] text-xs sm:text-sm font-semibold tracking-wider uppercase">
                  MY STORY
                </div>
                <p className="mt-2 text-[#6b7280] text-xs sm:text-sm leading-relaxed">
                  "With over 15 years in tech leadership, I&apos;ve navigated the challenges of scaling teams and products.
                  My goal is to empower the next generation of leaders to build with confidence..."
                </p>
                <button className="mt-2 text-[10px] sm:text-xs text-[#5D3699] underline">
                  Read full bio
                </button>
              </div>
            </div>
          </aside>

          {/* Right Section - Calendar & Time Slots */}
          <div className="flex flex-col md:grid md:grid-cols-1 lg:grid-cols-[1fr_220px] xl:grid-cols-[1fr_260px] gap-4 sm:gap-6 lg:gap-8 p-4 sm:p-6 md:p-8 w-full">
            
            {/* Calendar Section */}
            <section className="space-y-3 sm:space-y-4 w-full">
              {/* Month Navigation */}
              <div className="flex items-center justify-between mb-2 sm:mb-4">
                <button className="h-8 w-8 sm:h-9 sm:w-9 rounded-full text-[#6B7280] flex items-center justify-center hover:bg-gray-100 transition-colors">
                  <img src={arrowLeft} alt="Previous month" className="h-3 w-1.5 sm:h-3.5 sm:w-2" />
                </button>
                <h2 className="text-[#111827] text-base sm:text-lg font-semibold">
                  December 2025
                </h2>
                <button className="h-8 w-8 sm:h-9 sm:w-9 rounded-full text-[#6B7280] flex items-center justify-center hover:bg-gray-100 transition-colors">
                  <img src={arrowRight} alt="Next month" className="h-3 w-1.5 sm:h-3.5 sm:w-2" />
                </button>
              </div>

              {/* Calendar Grid */}
              <div className="grid grid-cols-7 gap-1 sm:gap-2 md:gap-3 text-center">
                {/* Day Headers */}
                {days.map((d) => (
                  <div 
                    key={d} 
                    className="font-medium text-[#9ca3af] text-[10px] sm:text-xs py-1 sm:py-2"
                  >
                    {d}
                  </div>
                ))}
                
                {/* Date Cells */}
                {dates.map((d, i) => {
                  const isSelected = d === '16';
                  const isEmpty = d === '';
                  const isUnavailable = ['12', '3', '4', '5', '6', '7'].includes(d);
                  
                  return (
                    <div
                      key={`${d}-${i}`}
                      className={`
                        h-7 w-7 sm:h-8 sm:w-8 md:h-9 md:w-9
                        flex items-center justify-center 
                        rounded-full 
                        text-xs sm:text-sm
                        mx-auto
                        cursor-pointer
                        transition-colors
                        ${isEmpty ? 'text-transparent cursor-default' : ''}
                        ${isSelected ? 'bg-[#f4b740] text-[#5D3699] font-semibold' : ''}
                        ${!isEmpty && !isSelected && !isUnavailable ? 'hover:bg-gray-100 text-[#111827]' : ''}
                        ${isUnavailable ? 'text-[#9CA3AF] opacity-60 cursor-not-allowed' : ''}
                      `}
                    >
                      {d || '.'}
                    </div>
                  );
                })}
              </div>
            </section>

            {/* Time Slots Section */}
            <aside className="border-t md:border-t lg:border-t-0 lg:border-l border-[#eef2f7] pt-4 sm:pt-6 lg:pt-0 lg:pl-4 xl:pl-6">
              <div className="text-[#111827] text-base sm:text-lg font-semibold">
                Available Times
              </div>
              <div className="mt-1 text-[#6b7280] text-xs sm:text-sm">
                Tuesday, December 16
              </div>
              
              {/* Time Slots Grid */}
              <div className="mt-3 grid grid-cols-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-2 gap-2 sm:gap-3 lg:gap-4 w-full">
                {times.map((t) => {
                  const isSelected = t === '10:30 AM';
                  const isUnavailable = t === '09:00 AM';
                  
                  return (
                    <button
                      key={t}
                      className={`
                        rounded-lg border 
                        px-2 sm:px-3 
                        py-2 sm:py-2.5
                        text-[10px] sm:text-xs md:text-sm
                        transition-colors
                        min-h-[40px] sm:min-h-[44px] md:min-h-[46px]
                        ${isSelected
                          ? 'border-[#5D3699] bg-[#EFF6FF] text-[#5D3699] font-semibold'
                          : isUnavailable
                            ? 'border-[#e5e7eb] text-[#9CA3AF] bg-[#F9FAFB] cursor-not-allowed'
                            : 'border-[#e5e7eb] text-[#111827] hover:border-[#5D3699] hover:bg-[#F9FAFB]'
                        }
                      `}
                      disabled={isUnavailable}
                    >
                      {t}
                    </button>
                  );
                })}
              </div>
            </aside>
          </div>
        </div>

        {/* Confirm Button */}
        <div className="px-3 sm:px-4 md:px-5 py-3 sm:py-4 border-t border-[#eef2f7]">
          <Link
            to="/booking-success"
            className="block rounded-lg bg-[#5D3699] text-white text-center w-full py-3 sm:py-3.5 md:py-4 text-sm sm:text-base font-semibold hover:bg-[#4a2b7a] transition-colors"
          >
            Confirm Booking for 10:30 AM
          </Link>
        </div>
      </div>

      {/* Back Link */}
      <div className="mt-4 text-center">
        <Link 
          to="/mentors" 
          className="text-[10px] sm:text-xs text-[#6b7280] underline hover:text-[#5D3699] transition-colors"
        >
          ← Go Back to Mentors
        </Link>
      </div>
    </div>
  );
};

export default BookSession;
