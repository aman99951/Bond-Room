import React from 'react';
import { Link } from 'react-router-dom';
import { Settings, ClipboardCheck, User, HelpCircle } from 'lucide-react';
import topRightIcon from '../../assets/Vector (1).png';

const avatars = [
  'https://c.pxhere.com/photos/c7/42/young_man_portrait_beard_young_man_male_handsome_young_man_handsome-1046502.jpg!d',
  'https://cdn.pixabay.com/photo/2023/02/24/00/41/ai-generated-7809879_960_720.jpg',
];

const recommended = [
  {
    name: 'Dr. Vani Ayyasamy',
    location: 'Coimbatore, TN',
    tags: ['Leadership', 'Career Growth', 'Productivity'],
    blurb:
      'David is a seasoned tech executive with over 15 years of experience helping professionals navigate career transitions.',
    topMatch: true,
    avatar: avatars[0],
  },
  {
    name: 'Mr.Nanda Kumar',
    location: 'Chennai, TN',
    tags: ['Well-being', 'Mindfulness', 'Stress Mgmt.'],
    blurb:
      'A certified wellness coach, Sarah specializes in helping clients find balance and reduce work-related stress.',
    avatar: avatars[1],
  },
  {
    name: 'Dr.Sajeedha Begum',
    location: 'Salem, TN',
    tags: ['Public Speaking', 'Communication'],
    blurb:
      'Michael helps individuals build confidence and deliver impactful presentations with ease.',
    avatar: avatars[0],
  },
];

const quickActions = [
  { title: 'Update Preferences', subtitle: 'Refine your goals', icon: Settings },
  { title: 'Retake Assessment', subtitle: 'Check your progress', icon: ClipboardCheck },
  { title: 'Edit Profile', subtitle: 'Keep info current', icon: User },
  { title: 'Get Help', subtitle: 'Contact support', icon: HelpCircle },
];

const Dashboard = () => {
  return (
    <div className="p-3 sm:p-4 md:p-6 bg-transparent">
      {/* Welcome Header */}
      <div className="rounded-xl sm:rounded-2xl border border-[#e5e7eb] bg-white p-4 sm:p-5 md:p-6 flex items-center justify-between gap-4 sm:gap-6 shadow-[0px_1px_2px_0px_rgba(0,0,0,0.08)]">
        <div className="min-w-0">
          <h1 className="text-lg sm:text-xl md:text-2xl font-semibold text-[#111827] truncate sm:whitespace-normal">
            Hi Rajeswari, welcome back.
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-[#6b7280]">
            Here&apos;s what we&apos;ve prepared for you today to help you grow
            <br className="hidden sm:block" />
            and achieve your goals.
          </p>
        </div>
        <div className="h-12 w-12 sm:h-16 sm:w-16 md:h-20 md:w-20 rounded-full bg-[#ede9fe] flex items-center justify-center flex-shrink-0">
          <img src={topRightIcon} alt="" className="h-6 w-6 sm:h-8 sm:w-8 opacity-70" />
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mt-4 sm:mt-5 grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {quickActions.map((item) => {
          const Icon = item.icon;
          return (
            <div key={item.title} className="rounded-lg sm:rounded-xl border border-[#e5e7eb] bg-white p-3 sm:p-4 shadow-[0px_1px_2px_0px_rgba(0,0,0,0.08)]">
              <div className="flex flex-col sm:flex-row items-start gap-2 sm:gap-3">
                <div className="h-8 w-8 sm:h-9 sm:w-9 rounded-md bg-[#f5f3ff] text-[#5D3699] flex items-center justify-center flex-shrink-0">
                  <Icon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                </div>
                <div className="min-w-0">
                  <div className="text-xs sm:text-sm font-semibold text-[#111827] truncate">{item.title}</div>
                  <div className="text-[10px] sm:text-xs text-[#9ca3af]">{item.subtitle}</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Recommended Mentors Header */}
      <div className="mt-5 sm:mt-6 flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-0">
        <div>
          <h2 className="text-sm font-semibold text-[#111827]">Your Recommended Mentors</h2>
          <p className="text-xs text-[#6b7280]">Based on your recent mood and assessment responses.</p>
        </div>
        <button className="text-xs text-[#5D3699] underline text-left sm:text-right">See All Recommendations</button>
      </div>

      {/* Recommended Mentors Grid */}
      <div className="mt-3 sm:mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {recommended.map((m) => (
          <div
            key={m.name}
            className="rounded-[12px] border border-[#e5e7eb] bg-white p-4 sm:p-5 lg:p-6 shadow-[0px_1px_2px_0px_rgba(0,0,0,0.08)] flex flex-col w-full lg:w-[386.33px]"
          >
            <div className="flex items-start gap-3 sm:gap-4">
              <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-full bg-gray-200 overflow-hidden flex-shrink-0">
                <img src={m.avatar} alt="" className="h-full w-full object-cover" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-1 sm:gap-2">
                  <div className="min-w-0">
                    <div className="text-xs sm:text-sm font-semibold text-[#111827] truncate">{m.name}</div>
                    <div className="text-[10px] sm:text-xs text-[#6b7280]">{m.location}</div>
                  </div>
                  {m.topMatch && (
                    <span className="rounded-full bg-[#DCFCE7] px-2 py-0.5 sm:py-1 text-[9px] sm:text-[10px] text-[#166534] w-fit flex-shrink-0">
                      Top Match
                    </span>
                  )}
                </div>
                <div className="mt-2 flex flex-wrap gap-1 sm:gap-2">
                  {m.tags.map((t) => (
                    <span key={t} className="rounded-full bg-[#E0E7FF] px-1.5 sm:px-2 py-0.5 sm:py-1 text-[9px] sm:text-[10px] text-[#5D3699]">
                      {t}
                    </span>
                  ))}
                </div>
                <p
                  className="mt-2 text-[#6b7280] text-xs sm:text-sm line-clamp-3 sm:line-clamp-none"
                  style={{ fontFamily: 'DM Sans', lineHeight: '20px', fontWeight: 400 }}
                >
                  {m.blurb}
                </p>
              </div>
            </div>
            <Link to="/mentor-profile" className="mt-3 sm:mt-4 w-full rounded-md bg-[#5D3699] text-white py-2 text-xs text-center">
              View Profile
            </Link>
          </div>
        ))}
      </div>

      {/* Bottom Section - Upcoming & Recent Sessions */}
      <div className="mt-5 sm:mt-6 grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-4 sm:gap-6">
        {/* Upcoming Sessions */}
        <div>
          <h2 className="text-sm font-semibold text-[#111827] mb-2">Your Upcoming Sessions</h2>
          <div className="rounded-xl border border-[#e5e7eb] bg-white p-3 sm:p-4 shadow-[0px_1px_2px_0px_rgba(0,0,0,0.08)]">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-full bg-gray-200 overflow-hidden flex-shrink-0">
                  <img src={avatars[1]} alt="" className="h-full w-full object-cover" />
                </div>
                <div className="min-w-0">
                  <div className="text-xs sm:text-sm font-semibold text-[#111827] truncate">Session with Mahima Boopesh</div>
                  <div className="text-[10px] sm:text-xs text-[#6b7280]">Today, December 16 at 5:00 PM</div>
                </div>
              </div>
              <div className="flex items-center justify-between sm:justify-end gap-2 sm:gap-3 ml-12 sm:ml-0">
                <span className="text-[9px] sm:text-[10px] text-[#f59e0b]">Starts in 2h</span>
                <button className="rounded-md bg-[#e5e7eb] px-3 sm:px-4 py-1.5 sm:py-2 text-[10px] sm:text-xs text-[#6b7280]">Join Call</button>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Sessions */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-sm font-semibold text-[#111827]">Recent Sessions</h2>
            <button className="text-xs text-[#5D3699]">View All</button>
          </div>
          <div className="rounded-xl border border-[#e5e7eb] bg-white p-3 sm:p-4 space-y-2 sm:space-y-3 shadow-[0px_1px_2px_0px_rgba(0,0,0,0.08)]">
            {[
              { name: 'Sarah Lee', date: 'Dec 9, 2025', status: 'Done', avatar: avatars[0] },
              { name: 'Michael Brown', date: 'Dec 2, 2025', status: 'Feedback', avatar: avatars[1] },
              { name: 'David Chen', date: 'Nov 28, 2025', status: 'Done', avatar: avatars[0] },
            ].map((s) => (
              <div key={s.name} className="flex items-center justify-between">
                <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                  <div className="h-7 w-7 sm:h-8 sm:w-8 rounded-full bg-gray-200 overflow-hidden flex-shrink-0">
                    <img src={s.avatar} alt="" className="h-full w-full object-cover" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs sm:text-sm font-semibold text-[#111827] truncate">{s.name}</div>
                    <div className="text-[10px] sm:text-xs text-[#6b7280]">{s.date}</div>
                  </div>
                </div>
                <span className={`text-[9px] sm:text-[10px] flex-shrink-0 ${s.status === 'Done' ? 'text-[#16a34a]' : 'text-[#5D3699]'}`}>
                  {s.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
