import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Settings, ClipboardCheck, User, HelpCircle, Sparkles, Clock, Calendar, Star, Zap, Award, TrendingUp } from 'lucide-react';
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
    rating: 4.9,
    sessions: 150,
  },
  {
    name: 'Mr.Nanda Kumar',
    location: 'Chennai, TN',
    tags: ['Well-being', 'Mindfulness', 'Stress Mgmt.'],
    blurb:
      'A certified wellness coach, Sarah specializes in helping clients find balance and reduce work-related stress.',
    avatar: avatars[1],
    rating: 4.8,
    sessions: 120,
  },
  {
    name: 'Dr.Sajeedha Begum',
    location: 'Salem, TN',
    tags: ['Public Speaking', 'Communication'],
    blurb:
      'Michael helps individuals build confidence and deliver impactful presentations with ease.',
    avatar: avatars[0],
    rating: 4.7,
    sessions: 95,
  },
];

const quickActions = [
  { title: 'Update Preferences', subtitle: 'Refine your goals', icon: Settings, gradient: 'from-purple-400 to-purple-600', emoji: '⚙️' },
  { title: 'Retake Assessment', subtitle: 'Check your progress', icon: ClipboardCheck, gradient: 'from-blue-400 to-blue-600', emoji: '📋' },
  { title: 'Edit Profile', subtitle: 'Keep info current', icon: User, gradient: 'from-pink-400 to-pink-600', emoji: '👤' },
  { title: 'Get Help', subtitle: 'Contact support', icon: HelpCircle, gradient: 'from-green-400 to-green-600', emoji: '💬' },
];

const Dashboard = () => {
  const [hoveredCard, setHoveredCard] = useState(null);
  const [hoveredAction, setHoveredAction] = useState(null);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 right-10 w-64 h-64 bg-purple-200 rounded-full mix-blend-multiply filter blur-xl opacity-40 animate-blob"></div>
        <div className="absolute bottom-20 left-10 w-64 h-64 bg-pink-200 rounded-full mix-blend-multiply filter blur-xl opacity-40 animate-blob animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-yellow-200 rounded-full mix-blend-multiply filter blur-xl opacity-40 animate-blob animation-delay-4000"></div>
        
        {/* Floating Icons */}
        <div className="absolute top-24 left-20 animate-float opacity-30">
          <Star className="w-6 h-6 text-yellow-400" fill="currentColor" />
        </div>
        <div className="absolute bottom-32 right-32 animate-float animation-delay-2000 opacity-30">
          <Zap className="w-8 h-8 text-purple-400" fill="currentColor" />
        </div>
        <div className="absolute top-1/3 right-20 animate-float animation-delay-4000 opacity-30">
          <Award className="w-7 h-7 text-pink-400" fill="currentColor" />
        </div>
      </div>

      <div className="relative z-10 p-3 sm:p-4 md:p-6">
        {/* Welcome Header with 3D Effect */}
        <div className="rounded-2xl sm:rounded-3xl border-2 border-purple-100 bg-gradient-to-br from-white via-purple-50 to-white p-5 sm:p-6 md:p-8 flex items-center justify-between gap-4 sm:gap-6 shadow-2xl hover:shadow-purple-200 transform hover:scale-[1.01] transition-all duration-500 animate-fade-in-up">
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent font-['Manrope']">
                Hi Rajeswari! 👋
              </h1>
              <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-500 animate-pulse" />
            </div>
            <p className="text-xs sm:text-sm md:text-base text-gray-600 font-medium">
              Here&apos;s what we&apos;ve prepared for you today to help you grow
              <br className="hidden sm:block" />
              and achieve your amazing goals! 🚀
            </p>
            
            {/* Progress Bar */}
            <div className="mt-4 max-w-md">
              <div className="flex items-center justify-between text-xs text-gray-600 mb-2">
                <span className="font-semibold">Weekly Progress</span>
                <span className="text-purple-600 font-bold">75%</span>
              </div>
              <div className="h-2.5 bg-gray-200 rounded-full overflow-hidden shadow-inner">
                <div className="h-full bg-gradient-to-r from-purple-500 via-pink-500 to-purple-600 rounded-full animate-progress shadow-lg" style={{ width: '75%' }}></div>
              </div>
            </div>
          </div>
          <div className="relative flex-shrink-0">
            <div className="h-16 w-16 sm:h-20 sm:w-20 md:h-24 md:w-24 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center shadow-2xl animate-bounce-slow transform hover:rotate-12 transition-transform duration-500">
              <img src={topRightIcon} alt="" className="h-8 w-8 sm:h-10 sm:w-10 md:h-12 md:w-12 brightness-0 invert" />
            </div>
            <div className="absolute -top-1 -right-1 w-6 h-6 bg-green-500 rounded-full border-4 border-white animate-pulse shadow-lg"></div>
          </div>
        </div>

        {/* Quick Actions with 3D Cards */}
        <div className="mt-6 sm:mt-8">
          <div className="flex items-center gap-2 mb-4">
            <Zap className="w-5 h-5 text-purple-600" fill="currentColor" />
            <h2 className="text-base sm:text-lg font-bold text-gray-800">Quick Actions</h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {quickActions.map((item, idx) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.title}
                  className="group relative rounded-xl sm:rounded-2xl border-2 border-gray-100 bg-white p-4 sm:p-5 shadow-lg hover:shadow-2xl transform hover:scale-105 hover:-translate-y-2 transition-all duration-300 cursor-pointer overflow-hidden animate-slide-in-up"
                  style={{ animationDelay: `${idx * 100}ms` }}
                  onMouseEnter={() => setHoveredAction(idx)}
                  onMouseLeave={() => setHoveredAction(null)}
                >
                  {/* Gradient Background on Hover */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${item.gradient} opacity-0 group-hover:opacity-10 transition-opacity duration-300`}></div>
                  
                  <div className="relative z-10 flex flex-col items-start gap-3">
                    <div className={`h-12 w-12 sm:h-14 sm:w-14 rounded-xl bg-gradient-to-br ${item.gradient} text-white flex items-center justify-center shadow-lg transform group-hover:rotate-12 group-hover:scale-110 transition-all duration-300`}>
                      <span className="text-2xl">{item.emoji}</span>
                    </div>
                    <div className="min-w-0 w-full">
                      <div className="text-xs sm:text-sm font-bold text-gray-800 group-hover:text-purple-600 transition-colors duration-300">
                        {item.title}
                      </div>
                      <div className="text-[10px] sm:text-xs text-gray-500 mt-1">{item.subtitle}</div>
                    </div>
                  </div>
                  
                  {/* Sparkle Effect */}
                  {hoveredAction === idx && (
                    <div className="absolute top-2 right-2 animate-ping">
                      <Sparkles className="w-4 h-4 text-purple-400" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Recommended Mentors Section */}
        <div className="mt-8 sm:mt-10 animate-fade-in-up animation-delay-400">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 mb-5">
            <div>
              <div className="flex items-center gap-2">
                <Star className="w-5 h-5 text-yellow-500" fill="currentColor" />
                <h2 className="text-base sm:text-lg font-bold text-gray-800">Your Recommended Mentors</h2>
              </div>
              <p className="text-xs sm:text-sm text-gray-600 mt-1">Based on your recent mood and assessment responses 🎯</p>
            </div>
            <button className="text-xs sm:text-sm text-purple-600 font-semibold hover:text-purple-700 underline decoration-2 underline-offset-4 hover:decoration-wavy transition-all flex items-center gap-1 group">
              See All Recommendations
              <TrendingUp className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>

          {/* Mentor Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
            {recommended.map((m, idx) => (
              <div
                key={m.name}
                className="group rounded-2xl border-2 border-gray-100 bg-white p-5 sm:p-6 shadow-xl hover:shadow-2xl hover:border-purple-200 transform hover:scale-[1.02] hover:-translate-y-1 transition-all duration-500 animate-scale-in"
                style={{ animationDelay: `${idx * 150}ms` }}
                onMouseEnter={() => setHoveredCard(idx)}
                onMouseLeave={() => setHoveredCard(null)}
              >
                {/* Top Match Badge */}
                {m.topMatch && (
                  <div className="absolute -top-3 -right-3 z-20">
                    <div className="relative">
                      <div className="rounded-full bg-gradient-to-r from-green-400 to-emerald-500 px-3 py-1.5 text-[10px] sm:text-xs text-white font-bold shadow-lg animate-pulse">
                        ⭐ Top Match
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex items-start gap-4">
                  {/* Avatar with 3D Effect */}
                  <div className="relative flex-shrink-0">
                    <div className="h-14 w-14 sm:h-16 sm:w-16 rounded-full overflow-hidden border-4 border-purple-100 shadow-lg transform group-hover:scale-110 group-hover:rotate-6 transition-all duration-300">
                      <img src={m.avatar} alt={m.name} className="h-full w-full object-cover" />
                    </div>
                    <div className="absolute -bottom-1 -right-1 h-5 w-5 bg-green-500 rounded-full border-2 border-white shadow-md"></div>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <h3 className="text-sm sm:text-base font-bold text-gray-800 group-hover:text-purple-600 transition-colors truncate">
                          {m.name}
                        </h3>
                        <p className="text-[10px] sm:text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                          📍 {m.location}
                        </p>
                      </div>
                    </div>

                    {/* Rating & Sessions */}
                    <div className="flex items-center gap-3 mt-2">
                      <div className="flex items-center gap-1">
                        <Star className="w-3.5 h-3.5 text-yellow-400" fill="currentColor" />
                        <span className="text-xs font-bold text-gray-700">{m.rating}</span>
                      </div>
                      <div className="text-[10px] text-gray-500">
                        {m.sessions} sessions
                      </div>
                    </div>

                    {/* Tags */}
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {m.tags.map((t) => (
                        <span
                          key={t}
                          className="rounded-full bg-gradient-to-r from-purple-100 to-pink-100 px-2.5 py-1 text-[9px] sm:text-[10px] text-purple-700 font-semibold border border-purple-200 hover:shadow-md transition-shadow"
                        >
                          {t}
                        </span>
                      ))}
                    </div>

                    {/* Description */}
                    <p className="mt-3 text-gray-600 text-xs sm:text-sm line-clamp-3 leading-relaxed">
                      {m.blurb}
                    </p>
                  </div>
                </div>

                {/* View Profile Button */}
                <Link
                  to="/mentor-profile"
                  className="mt-5 w-full rounded-xl bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white py-3 text-xs sm:text-sm font-bold text-center shadow-lg hover:shadow-xl transform hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 flex items-center justify-center gap-2 group relative overflow-hidden"
                >
                  <span className="relative z-10">View Profile</span>
                  <TrendingUp className="w-4 h-4 relative z-10 group-hover:translate-x-1 transition-transform" />
                  <div className="absolute inset-0 bg-gradient-to-r from-pink-600 to-purple-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </Link>

                {/* Hover Sparkle */}
                {hoveredCard === idx && (
                  <div className="absolute top-4 right-4 animate-ping">
                    <Sparkles className="w-5 h-5 text-purple-400" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Bottom Section - Upcoming & Recent Sessions */}
        <div className="mt-8 sm:mt-10 grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-5 sm:gap-6 animate-fade-in-up animation-delay-600">
          {/* Upcoming Sessions */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Calendar className="w-5 h-5 text-blue-600" />
              <h2 className="text-base sm:text-lg font-bold text-gray-800">Upcoming Sessions</h2>
            </div>
            <div className="rounded-2xl border-2 border-blue-100 bg-gradient-to-br from-blue-50 to-white p-4 sm:p-6 shadow-xl hover:shadow-2xl transform hover:scale-[1.01] transition-all duration-300">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <div className="h-12 w-12 sm:h-14 sm:w-14 rounded-full overflow-hidden border-4 border-blue-200 shadow-lg">
                      <img src={avatars[1]} alt="" className="h-full w-full object-cover" />
                    </div>
                    <div className="absolute -bottom-1 -right-1 h-4 w-4 bg-blue-500 rounded-full border-2 border-white animate-pulse"></div>
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm sm:text-base font-bold text-gray-800">Session with Mahima Boopesh</div>
                    <div className="text-[10px] sm:text-xs text-gray-600 flex items-center gap-1 mt-1">
                      <Clock className="w-3 h-3" />
                      Today, December 16 at 5:00 PM
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between sm:justify-end gap-3 ml-16 sm:ml-0">
                  <span className="text-xs font-bold text-orange-600 bg-orange-100 px-3 py-1.5 rounded-full animate-pulse">
                    ⏰ Starts in 2h
                  </span>
                  <button className="rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 px-4 sm:px-6 py-2.5 text-xs sm:text-sm text-white font-bold shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95 transition-all">
                    Join Call
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Sessions */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-purple-600" />
                <h2 className="text-base sm:text-lg font-bold text-gray-800">Recent Sessions</h2>
              </div>
              <button className="text-xs sm:text-sm text-purple-600 font-semibold hover:text-purple-700">View All</button>
            </div>
            <div className="rounded-2xl border-2 border-purple-100 bg-white p-4 sm:p-5 space-y-4 shadow-xl hover:shadow-2xl transition-all duration-300">
              {[
                { name: 'Sarah Lee', date: 'Dec 9, 2025', status: 'Done', avatar: avatars[0], color: 'green' },
                { name: 'Michael Brown', date: 'Dec 2, 2025', status: 'Feedback', avatar: avatars[1], color: 'purple' },
                { name: 'David Chen', date: 'Nov 28, 2025', status: 'Done', avatar: avatars[0], color: 'green' },
              ].map((s, idx) => (
                <div
                  key={s.name}
                  className="flex items-center justify-between p-3 rounded-xl bg-gradient-to-r from-gray-50 to-white hover:from-purple-50 hover:to-pink-50 border border-gray-100 hover:border-purple-200 transform hover:scale-[1.02] transition-all duration-300 group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="h-10 w-10 rounded-full overflow-hidden border-2 border-gray-200 group-hover:border-purple-300 shadow-md transform group-hover:scale-110 transition-all">
                      <img src={s.avatar} alt="" className="h-full w-full object-cover" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs sm:text-sm font-bold text-gray-800 group-hover:text-purple-600 transition-colors">
                        {s.name}
                      </div>
                      <div className="text-[10px] sm:text-xs text-gray-500">{s.date}</div>
                    </div>
                  </div>
                  <span
                    className={`text-[10px] sm:text-xs font-bold px-3 py-1.5 rounded-full flex-shrink-0 ${
                      s.color === 'green'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-purple-100 text-purple-700'
                    }`}
                  >
                    {s.status === 'Done' ? '✓ ' : '⭐ '}{s.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Custom Animations */}
      <style jsx>{`
        @keyframes blob {
          0%, 100% { transform: translate(0, 0) scale(1); }
          25% { transform: translate(20px, -50px) scale(1.1); }
          50% { transform: translate(-20px, 20px) scale(0.9); }
          75% { transform: translate(50px, 50px) scale(1.05); }
        }

        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
        }

        @keyframes bounce-slow {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }

        @keyframes fade-in-up {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @keyframes slide-in-up {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @keyframes scale-in {
          from { opacity: 0; transform: scale(0.9); }
          to { opacity: 1; transform: scale(1); }
        }

        @keyframes progress {
          0% { width: 0%; }
          100% { width: 75%; }
        }

        .animate-blob { animation: blob 7s infinite; }
        .animate-float { animation: float 3s ease-in-out infinite; }
        .animate-bounce-slow { animation: bounce-slow 2s ease-in-out infinite; }
        .animate-fade-in-up { animation: fade-in-up 0.6s ease-out; }
        .animate-slide-in-up { animation: slide-in-up 0.6s ease-out; }
        .animate-scale-in { animation: scale-in 0.6s ease-out; }
        .animate-progress { animation: progress 1.5s ease-out; }

        .animation-delay-200 { animation-delay: 200ms; }
        .animation-delay-400 { animation-delay: 400ms; }
        .animation-delay-600 { animation-delay: 600ms; }
        .animation-delay-2000 { animation-delay: 2s; }
        .animation-delay-4000 { animation-delay: 4s; }
      `}</style>
    </div>
  );
};

export default Dashboard;