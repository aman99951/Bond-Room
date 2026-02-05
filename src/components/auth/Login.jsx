import React, { useState } from 'react';
import TopAuth from './TopAuth';
import BottomAuth from './BottomAuth';
import { Link, useNavigate } from 'react-router-dom';
import logo from '../assets/logo.png';
import { Sparkles, Book, Users, ArrowRight, Lock, Mail } from 'lucide-react';

const Login = () => {
  const [roleValue, setRoleValue] = useState('Student');
  const [roleOpen, setRoleOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const roleOptions = ['Student', 'Mentor'];
  const navigate = useNavigate();

  const handleRoleSelect = (nextRole) => {
    setRoleValue(nextRole);
    setRoleOpen(false);
    try {
      localStorage.setItem('userRole', nextRole === 'Mentor' ? 'mentors' : 'menties');
    } catch {
      // ignore storage errors
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 text-gray-900 flex flex-col relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-64 h-64 bg-purple-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
        <div className="absolute top-40 right-10 w-64 h-64 bg-yellow-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-40 w-64 h-64 bg-pink-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>
        
        {/* Floating Icons */}
        <div className="absolute top-32 right-20 animate-float">
          <Sparkles className="w-8 h-8 text-purple-400 opacity-60" />
        </div>
        <div className="absolute bottom-32 left-20 animate-float animation-delay-2000">
          <Book className="w-10 h-10 text-blue-400 opacity-60" />
        </div>
        <div className="absolute top-1/2 right-32 animate-float animation-delay-4000">
          <Users className="w-9 h-9 text-pink-400 opacity-60" />
        </div>
      </div>

      <TopAuth />

      <main className="flex-1 relative z-10">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-20 py-10">
          <div className="border border-gray-200 rounded-3xl overflow-hidden bg-white shadow-2xl transform hover:scale-[1.01] transition-all duration-500 hover:shadow-purple-200">
            <div className="grid grid-cols-1 md:grid-cols-2">
              
              {/* Left Side - Animated Welcome Section */}
              <div className="relative bg-gradient-to-br from-[#5D3699] via-purple-600 to-purple-800 p-8 sm:p-10 lg:p-12 flex flex-col items-center justify-center text-center overflow-hidden">
                {/* Animated Background Pattern */}
                <div className="absolute inset-0 opacity-10">
                  <div className="absolute top-0 left-0 w-full h-full bg-repeat" style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
                  }}></div>
                </div>

                {/* Logo with 3D effect */}
                <div className="relative animate-bounce-slow">
                  <div className="h-24 w-24 sm:h-28 sm:w-28 rounded-full bg-white shadow-2xl flex items-center justify-center transform hover:rotate-12 transition-transform duration-500 hover:scale-110">
                    <img src={logo} alt="Bond Room" className="h-20 w-20 sm:h-24 sm:w-24" />
                  </div>
                  <div className="absolute -top-2 -right-2 animate-ping">
                    <Sparkles className="w-6 h-6 text-yellow-300" />
                  </div>
                </div>

                <h3 className="mt-8 text-2xl sm:text-3xl font-bold text-white animate-fade-in-up font-['Manrope']">
                  Welcome Back! 👋
                </h3>
                <p className="mt-3 text-sm sm:text-base text-purple-100 max-w-xs animate-fade-in-up animation-delay-200">
                  Sign in to continue your amazing learning journey with Bond Room.
                </p>

                {/* Decorative Cards */}
                <div className="mt-8 grid grid-cols-2 gap-4 w-full max-w-sm animate-fade-in-up animation-delay-400">
                  <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 transform hover:scale-105 transition-all duration-300 hover:bg-white/20 border border-white/20">
                    <div className="text-2xl mb-2">🎯</div>
                    <p className="text-xs text-white font-medium">Goal Setting</p>
                  </div>
                  <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 transform hover:scale-105 transition-all duration-300 hover:bg-white/20 border border-white/20">
                    <div className="text-2xl mb-2">🚀</div>
                    <p className="text-xs text-white font-medium">Track Progress</p>
                  </div>
                </div>

                {/* Animated Dots */}
                <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-2">
                  <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                  <div className="w-2 h-2 bg-white rounded-full animate-pulse animation-delay-200"></div>
                  <div className="w-2 h-2 bg-white rounded-full animate-pulse animation-delay-400"></div>
                </div>
              </div>

              {/* Right Side - Form Section */}
              <div className="p-6 sm:p-8 lg:p-10 bg-white relative">
                {/* Decorative Corner */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-purple-100 to-transparent rounded-bl-full opacity-50"></div>
                
                <div className="relative z-10">
                  <div className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-purple-100 to-pink-100 text-xs text-[#5D3699] px-4 py-2 font-semibold shadow-sm animate-slide-in-right">
                    <Lock className="w-3 h-3" />
                    Secure Login
                  </div>
                  
                  <h2 className="mt-4 text-xl sm:text-2xl font-bold text-gray-900 animate-slide-in-right animation-delay-200 font-['Manrope']">
                    Access your account
                  </h2>
                  <p className="mt-2 text-sm text-gray-600 animate-slide-in-right animation-delay-300">
                    Enter your credentials to continue.
                  </p>

                  <form className="mt-6 space-y-5 animate-fade-in animation-delay-400">
                    {/* Role Selection */}
                    <div className="transform hover:scale-[1.02] transition-transform duration-200">
                      <label id="loginRoleLabel" className="text-xs font-semibold text-gray-700 flex items-center gap-1">
                        Login as
                        <Sparkles className="w-3 h-3 text-purple-500" />
                      </label>
                      <div className="relative mt-2" tabIndex={0} onBlur={() => setRoleOpen(false)}>
                        <button
                          type="button"
                          className="w-full rounded-xl border-2 border-gray-200 px-4 py-3 text-sm text-left bg-gradient-to-r from-white to-purple-50 hover:border-[#5D3699] transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-[#5D3699] focus:ring-offset-2 font-medium shadow-sm hover:shadow-md"
                          onClick={() => setRoleOpen((o) => !o)}
                          aria-haspopup="listbox"
                          aria-expanded={roleOpen}
                          aria-labelledby="loginRoleLabel"
                        >
                          <span className="flex items-center gap-2">
                            {roleValue === 'Student' ? '🎓' : '👨‍🏫'} {roleValue}
                          </span>
                        </button>
                        {roleOpen && (
                          <ul className="absolute z-10 mt-2 w-full rounded-xl border-2 border-[#5D3699] bg-white text-gray-900 text-sm shadow-2xl overflow-hidden animate-scale-in" role="listbox">
                            {roleOptions.map((opt) => (
                              <li key={opt}>
                                <button
                                  type="button"
                                  className="w-full text-left px-4 py-3 hover:bg-gradient-to-r hover:from-purple-50 hover:to-pink-50 transition-all duration-200 flex items-center gap-2 font-medium"
                                  onMouseDown={(e) => e.preventDefault()}
                                  onClick={() => handleRoleSelect(opt)}
                                >
                                  {opt === 'Student' ? '🎓' : '👨‍🏫'} {opt}
                                </button>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    </div>

                    {/* Email Input */}
                    <div className="transform hover:scale-[1.02] transition-transform duration-200">
                      <label htmlFor="loginEmail" className="text-xs font-semibold text-gray-700 flex items-center gap-1">
                        <Mail className="w-3 h-3 text-purple-500" />
                        Email Address
                      </label>
                      <input
                        id="loginEmail"
                        type="email"
                        className="mt-2 w-full rounded-xl border-2 border-gray-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#5D3699] focus:border-transparent transition-all duration-300 hover:border-purple-300 shadow-sm hover:shadow-md"
                        placeholder="you@example.com"
                      />
                    </div>

                    {/* Password Input */}
                    <div className="transform hover:scale-[1.02] transition-transform duration-200">
                      <label htmlFor="loginPassword" className="text-xs font-semibold text-gray-700 flex items-center gap-1">
                        <Lock className="w-3 h-3 text-purple-500" />
                        Password
                      </label>
                      <input
                        id="loginPassword"
                        type="password"
                        className="mt-2 w-full rounded-xl border-2 border-gray-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#5D3699] focus:border-transparent transition-all duration-300 hover:border-purple-300 shadow-sm hover:shadow-md"
                        placeholder="••••••••"
                      />
                    </div>

                    {/* Forgot Password */}
                    <div className="text-right">
                      <Link to="/forgot-password" className="text-xs text-[#5D3699] hover:text-purple-700 font-semibold hover:underline transition-all">
                        Forgot Password?
                      </Link>
                    </div>

                    {/* Login Button */}
                    <button
                      type="button"
                      className="w-full rounded-xl bg-gradient-to-r from-[#5D3699] to-purple-600 text-white py-3.5 text-sm font-bold shadow-lg hover:shadow-2xl transform hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-[#5D3699] focus:ring-offset-2 group relative overflow-hidden"
                      onClick={() => {
                        try {
                          localStorage.setItem('userRole', roleValue === 'Mentor' ? 'mentors' : 'menties');
                        } catch {
                          // ignore storage errors
                        }
                        navigate(roleValue === 'Mentor' ? '/mentor-impact-dashboard' : '/dashboard');
                      }}
                      onMouseEnter={() => setIsHovered(true)}
                      onMouseLeave={() => setIsHovered(false)}
                    >
                      <span className="relative z-10 flex items-center justify-center gap-2">
                        Login & Start Learning
                        <ArrowRight className={`w-4 h-4 transition-transform duration-300 ${isHovered ? 'translate-x-1' : ''}`} />
                      </span>
                      <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    </button>
                  </form>

                  {/* Register Link */}
                  <div className="mt-6 text-center">
                    <div className="relative">
                      <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-gray-200"></div>
                      </div>
                      <div className="relative flex justify-center text-xs">
                        <span className="px-2 bg-white text-gray-500">or</span>
                      </div>
                    </div>
                    <p className="mt-4 text-sm text-gray-600">
                      Don't have an account?{' '}
                      <Link 
                        to="/register" 
                        className="font-bold text-[#5D3699] hover:text-purple-700 underline decoration-2 underline-offset-2 hover:decoration-wavy transition-all"
                      >
                        Register Now 🚀
                      </Link>
                    </p>
                  </div>

                  {/* Trust Indicators */}
                  <div className="mt-6 flex items-center justify-center gap-6 text-xs text-gray-500">
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                      Secure
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse animation-delay-200"></div>
                      Trusted
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse animation-delay-400"></div>
                      Fun
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <BottomAuth />

      {/* Add custom styles */}
      <style jsx>{`
        @keyframes blob {
          0%, 100% {
            transform: translate(0, 0) scale(1);
          }
          25% {
            transform: translate(20px, -50px) scale(1.1);
          }
          50% {
            transform: translate(-20px, 20px) scale(0.9);
          }
          75% {
            transform: translate(50px, 50px) scale(1.05);
          }
        }

        @keyframes float {
          0%, 100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-20px);
          }
        }

        @keyframes bounce-slow {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-10px);
          }
        }

        @keyframes fade-in-up {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes slide-in-right {
          from {
            opacity: 0;
            transform: translateX(-20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        @keyframes scale-in {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        @keyframes fade-in {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        .animate-blob {
          animation: blob 7s infinite;
        }

        .animate-float {
          animation: float 3s ease-in-out infinite;
        }

        .animate-bounce-slow {
          animation: bounce-slow 2s ease-in-out infinite;
        }

        .animate-fade-in-up {
          animation: fade-in-up 0.6s ease-out;
        }

        .animate-slide-in-right {
          animation: slide-in-right 0.6s ease-out;
        }

        .animate-scale-in {
          animation: scale-in 0.2s ease-out;
        }

        .animate-fade-in {
          animation: fade-in 0.8s ease-out;
        }

        .animation-delay-200 {
          animation-delay: 200ms;
        }

        .animation-delay-400 {
          animation-delay: 400ms;
        }

        .animation-delay-2000 {
          animation-delay: 2s;
        }

        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </div>
  );
};

export default Login;