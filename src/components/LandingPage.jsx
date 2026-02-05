import logo from './assets/logo.png';
import heroLeft from './assets/left.png';
import heroRight from './assets/right.png';
import { 
  ShieldCheck, 
  Clock, 
  Sparkles, 
  Users,
  ChevronRight 
} from 'lucide-react';

const LandingPage = () => {
  return (
    <div className="min-h-screen bg-white font-['DM_Sans'] text-gray-900">
      {/* Header */}
      <header className="max-w-7xl mx-auto px-6 py-5 lg:px-8">
        <div className="flex flex-col lg:grid lg:grid-cols-[auto_1fr_auto] gap-4 lg:gap-6 items-start lg:items-center">
          {/* Logo */}
          <div className="flex items-center">
            <img src={logo} alt="Bond Room" className="h-12 w-auto" />
          </div>

          {/* Navigation - Hidden on mobile */}
          <nav className="hidden md:flex justify-center gap-7">
            <a href="#about" className="text-gray-600 hover:text-gray-900 font-medium text-sm transition-colors">
              About
            </a>
            <a href="#safety" className="text-gray-600 hover:text-gray-900 font-medium text-sm transition-colors">
              Safety
            </a>
            <a href="#stories" className="text-gray-600 hover:text-gray-900 font-medium text-sm transition-colors">
              Stories
            </a>
          </nav>

          {/* Actions */}
          <div className="flex gap-3 w-full lg:w-auto">
            <a 
              className="text-gray-600 hover:text-gray-900 font-semibold text-sm px-5 py-2.5 rounded-lg transition-all hover:-translate-y-0.5"
              href="/login"
            >
              Log in
            </a>
            <a 
              className="bg-[#5d3699] text-white font-semibold text-sm px-5 py-2.5 rounded-lg shadow-lg shadow-purple-500/20 hover:-translate-y-0.5 transition-all"
              href="/register"
            >
              Get Started
            </a>
          </div>
        </div>

        {/* Mobile Navigation */}
        <nav className="flex md:hidden gap-6 mt-4 border-t border-gray-100 pt-4">
          <a href="#about" className="text-gray-600 hover:text-gray-900 font-medium text-sm">
            About
          </a>
          <a href="#safety" className="text-gray-600 hover:text-gray-900 font-medium text-sm">
            Safety
          </a>
          <a href="#stories" className="text-gray-600 hover:text-gray-900 font-medium text-sm">
            Stories
          </a>
        </nav>
      </header>

      <main>
        {/* Hero Section */}
        <section className="max-w-7xl mx-auto px-6 py-8 lg:py-12 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            {/* Hero Content */}
            <div className="order-2 lg:order-1">
              <h1 className="font-['Manrope'] font-bold text-4xl sm:text-5xl lg:text-[44px] leading-tight mb-4">
                Guided Support for
                <br />
                Students from
                <br />
                <span className="text-[#5d3699]">Experienced</span>
                <br />
                <span className="text-[#5d3699]">Mentors</span>
              </h1>
              <p className="text-gray-600 text-base mb-6 max-w-lg">
                A safe, structured space where students can grow academically and emotionally with trusted mentors who
                walk the path with them.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 mb-4">
                <a 
                  className="bg-[#5d3699] text-white font-semibold text-sm px-6 py-3 rounded-lg shadow-lg shadow-purple-500/20 hover:-translate-y-0.5 transition-all text-center"
                  href="/register"
                >
                  Get Started
                </a>
                <a 
                  className="border border-gray-300 text-gray-700 font-semibold text-sm px-6 py-3 rounded-lg hover:-translate-y-0.5 transition-all text-center bg-white"
                  href="/mentor-register"
                >
                  Become a Mentor
                </a>
              </div>
              <p className="text-xs text-gray-600 flex items-start gap-2">
                <ShieldCheck className="w-5 h-5 text-[#5d3699] flex-shrink-0 mt-0.5" />
                <span>All mentors are verified and session activities are monitored for safety.</span>
              </p>
            </div>

            {/* Hero Visual */}
            <div className="relative min-h-[400px] lg:min-h-[420px] order-1 lg:order-2">
              <div 
                className="absolute left-0 top-0 w-[70%] sm:w-[330px] h-[320px] sm:h-[380px] bg-cover bg-center rounded-[28px] shadow-2xl"
                style={{ backgroundImage: `url(${heroLeft})` }}
              />
              <div 
                className="absolute right-0 top-4 sm:right-2 sm:top-2 w-[65%] sm:w-[300px] h-[280px] sm:h-[330px] bg-cover bg-center rounded-[28px] shadow-2xl"
                style={{ backgroundImage: `url(${heroRight})` }}
              />
              
              {/* Bubble */}
              <div className="absolute bottom-0 right-0 sm:bottom-auto sm:top-[310px] sm:right-10 w-full sm:w-[384px] max-w-[384px] bg-white p-5 rounded-xl shadow-lg border border-gray-200">
                <div className="flex items-center gap-2 text-[10px] font-semibold text-gray-600 uppercase tracking-wider mb-2">
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                  Live Session
                </div>
                <p className="text-xs text-gray-700 font-medium leading-relaxed">
                  "It's normal to feel overwhelmed at this stage. Let's break it down into smaller steps together."
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Flow Section */}
        <section className="max-w-6xl mx-auto px-6 py-12 lg:py-16 lg:px-8" id="about">
          <div className="text-center mb-8">
            <h2 className="font-['Manrope'] font-bold text-2xl lg:text-3xl mb-2 text-gray-900">
              How Guidance Flows
            </h2>
            <p className="text-gray-600 text-sm">
              A simple, transparent process that keeps students safe and supported.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-2xl border border-gray-100 text-center hover:shadow-md transition-shadow">
              <span className="inline-flex bg-purple-50 text-[#5d3699] px-4 py-1.5 rounded-full font-semibold mb-4 text-xs">
                01
              </span>
              <h3 className="font-semibold text-base mb-2">Listen</h3>
              <p className="text-xs text-gray-600">
                Students share goals, challenges, and communication style.
              </p>
            </div>
            <div className="bg-white p-6 rounded-2xl border border-gray-100 text-center hover:shadow-md transition-shadow">
              <span className="inline-flex bg-purple-50 text-[#5d3699] px-4 py-1.5 rounded-full font-semibold mb-4 text-xs">
                02
              </span>
              <h3 className="font-semibold text-base mb-2">Understand</h3>
              <p className="text-xs text-gray-600">
                Mentors craft a tailored plan with checkpoints and clarity.
              </p>
            </div>
            <div className="bg-white p-6 rounded-2xl border border-gray-100 text-center hover:shadow-md transition-shadow">
              <span className="inline-flex bg-purple-50 text-[#5d3699] px-4 py-1.5 rounded-full font-semibold mb-4 text-xs">
                03
              </span>
              <h3 className="font-semibold text-base mb-2">Guide</h3>
              <p className="text-xs text-gray-600">
                Sessions build habits, confidence, and academic momentum.
              </p>
            </div>
          </div>
        </section>

        {/* Trust Section */}
        <section className="max-w-6xl mx-auto px-6 py-12 lg:px-8" id="safety">
          <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_1fr] gap-8 lg:gap-12">
            <div>
              <h2 className="font-['Manrope'] font-bold text-2xl lg:text-3xl leading-tight mb-3">
                Built on Trust,
                <br />
                Experience, and Care
              </h2>
              <p className="text-gray-600 text-sm max-w-md">
                Every mentor is background-checked, trained, and supported by our in-house student success team.
              </p>
            </div>
            <div className="space-y-3">
              <div className="bg-white p-4 rounded-xl border border-gray-100 flex gap-3 items-start hover:shadow-md transition-shadow">
                <div className="w-5 h-5 rounded-full bg-purple-50 flex-shrink-0 mt-1 flex items-center justify-center">
                  <ShieldCheck className="w-3 h-3 text-[#5d3699]" />
                </div>
                <div>
                  <h4 className="font-semibold text-sm mb-1">Safe &amp; Monitored Sessions</h4>
                  <p className="text-xs text-gray-600">
                    Session logs, parent updates, and secure messaging included.
                  </p>
                </div>
              </div>
              <div className="bg-white p-4 rounded-xl border border-gray-100 flex gap-3 items-start hover:shadow-md transition-shadow">
                <div className="w-5 h-5 rounded-full bg-purple-50 flex-shrink-0 mt-1 flex items-center justify-center">
                  <Clock className="w-3 h-3 text-[#5d3699]" />
                </div>
                <div>
                  <h4 className="font-semibold text-sm mb-1">Mentors You Trust 24/7</h4>
                  <p className="text-xs text-gray-600">
                    High-quality mentors vetted for experience and empathy.
                  </p>
                </div>
              </div>
              <div className="bg-white p-4 rounded-xl border border-gray-100 flex gap-3 items-start hover:shadow-md transition-shadow">
                <div className="w-5 h-5 rounded-full bg-purple-50 flex-shrink-0 mt-1 flex items-center justify-center">
                  <Sparkles className="w-3 h-3 text-[#5d3699]" />
                </div>
                <div>
                  <h4 className="font-semibold text-sm mb-1">AI-Powered Matching</h4>
                  <p className="text-xs text-gray-600">
                    We pair students with mentors based on goals and personality.
                  </p>
                </div>
              </div>
              <div className="bg-white p-4 rounded-xl border border-gray-100 flex gap-3 items-start hover:shadow-md transition-shadow">
                <div className="w-5 h-5 rounded-full bg-purple-50 flex-shrink-0 mt-1 flex items-center justify-center">
                  <Users className="w-3 h-3 text-[#5d3699]" />
                </div>
                <div>
                  <h4 className="font-semibold text-sm mb-1">Student-Centered Experience</h4>
                  <p className="text-xs text-gray-600">
                    Flexible scheduling, progress tracking, and clear outcomes.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Stories Section */}
        <section className="max-w-6xl mx-auto px-6 py-12 lg:px-8" id="stories">
          <div className="text-left mb-8">
            <h2 className="font-['Manrope'] font-bold text-2xl lg:text-3xl mb-2">
              Stories That Matter
            </h2>
            <p className="text-gray-600 text-sm">
              Parents and students who found confidence through mentoring.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <article className="bg-white p-5 rounded-xl border border-gray-100 hover:shadow-md transition-shadow">
              <p className="text-sm text-gray-700 mb-4">
                "Bond helped my daughter regain her confidence and finally enjoy learning again."
              </p>
              <div className="flex items-center gap-3">
                <span className="w-7 h-7 rounded-full bg-purple-50 text-[#5d3699] grid place-items-center font-semibold text-xs">
                  A
                </span>
                <div>
                  <strong className="text-sm block">Alex M.</strong>
                  <span className="text-xs text-gray-600">Parent</span>
                </div>
              </div>
            </article>
            <article className="bg-white p-5 rounded-xl border border-gray-100 hover:shadow-md transition-shadow">
              <p className="text-sm text-gray-700 mb-4">
                "The mentor understood exactly how I learn. My grades improved in just one semester."
              </p>
              <div className="flex items-center gap-3">
                <span className="w-7 h-7 rounded-full bg-purple-50 text-[#5d3699] grid place-items-center font-semibold text-xs">
                  J
                </span>
                <div>
                  <strong className="text-sm block">Jenna K.</strong>
                  <span className="text-xs text-gray-600">Student</span>
                </div>
              </div>
            </article>
            <article className="bg-white p-5 rounded-xl border border-gray-100 hover:shadow-md transition-shadow">
              <p className="text-sm text-gray-700 mb-4">
                "Weekly updates kept us in the loop. The experience felt safe and collaborative."
              </p>
              <div className="flex items-center gap-3">
                <span className="w-7 h-7 rounded-full bg-purple-50 text-[#5d3699] grid place-items-center font-semibold text-xs">
                  R
                </span>
                <div>
                  <strong className="text-sm block">Ravi S.</strong>
                  <span className="text-xs text-gray-600">Parent</span>
                </div>
              </div>
            </article>
          </div>
        </section>

        {/* Gallery Section */}
        <section className="max-w-6xl mx-auto px-6 py-12 lg:px-8">
          <div className="text-left mb-6">
            <h2 className="font-['Manrope'] font-bold text-2xl lg:text-3xl mb-2">
              Wisdom You Can See
            </h2>
            <p className="text-gray-600 text-sm mb-3">
              Mentors who have guided students across academics and life skills.
            </p>
            <a className="inline-flex items-center gap-1 text-sm text-[#5d3699] font-semibold hover:gap-2 transition-all" href="/mentors">
              Meet Our Mentors
              <ChevronRight className="w-4 h-4" />
            </a>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <article className="bg-white rounded-2xl overflow-hidden border border-gray-100 hover:shadow-md transition-shadow">
              <div 
                className="h-36 bg-cover bg-center"
                style={{ backgroundImage: "url('https://images.unsplash.com/photo-1544723795-3fb6469f5b39?auto=format&fit=crop&w=800&q=80')" }}
              />
              <div className="p-4">
                <h3 className="font-semibold text-sm">Dr. Ananya K.</h3>
                <p className="text-xs text-gray-600 mt-1">STEM Mentorship</p>
              </div>
            </article>
            <article className="bg-white rounded-2xl overflow-hidden border border-gray-100 hover:shadow-md transition-shadow">
              <div 
                className="h-36 bg-cover bg-center"
                style={{ backgroundImage: "url('https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=800&q=80')" }}
              />
              <div className="p-4">
                <h3 className="font-semibold text-sm">Mr. Rahul S.</h3>
                <p className="text-xs text-gray-600 mt-1">Career Guidance</p>
              </div>
            </article>
            <article className="bg-white rounded-2xl overflow-hidden border border-gray-100 hover:shadow-md transition-shadow">
              <div 
                className="h-36 bg-cover bg-center"
                style={{ backgroundImage: "url('https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=800&q=80')" }}
              />
              <div className="p-4">
                <h3 className="font-semibold text-sm">Ms. Sanya D.</h3>
                <p className="text-xs text-gray-600 mt-1">Learning Strategies</p>
              </div>
            </article>
          </div>
        </section>

        {/* CTA Section */}
        <section className="max-w-6xl mx-auto px-6 py-12 mb-16 lg:px-8">
          <div className="bg-purple-50 border border-purple-100 rounded-2xl p-8 lg:p-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
            <div>
              <h2 className="font-['Manrope'] font-bold text-xl lg:text-2xl mb-2">
                Ready to Start Your Journey?
              </h2>
              <p className="text-sm text-gray-600">
                Match with a mentor in minutes and begin guided progress today.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
              <a 
                className="bg-[#5d3699] text-white font-semibold text-sm px-6 py-3 rounded-lg shadow-lg shadow-purple-500/20 hover:-translate-y-0.5 transition-all text-center whitespace-nowrap"
                href="/register"
              >
                Register a Student
              </a>
              <a 
                className="border border-gray-300 text-gray-700 font-semibold text-sm px-6 py-3 rounded-lg hover:-translate-y-0.5 transition-all text-center bg-white whitespace-nowrap"
                href="/mentor-register"
              >
                Register as Mentor
              </a>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="max-w-7xl mx-auto px-6 py-8 lg:px-8 border-t border-gray-100">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <img src={logo} alt="Bond Room" className="h-10 w-auto" />
            <p className="text-sm text-gray-600">Guided mentoring for every student.</p>
          </div>
          <div className="flex gap-6 text-xs text-gray-600">
            <a href="/privacy" className="hover:text-gray-900 transition-colors">Privacy</a>
            <a href="/terms" className="hover:text-gray-900 transition-colors">Terms</a>
            <a href="/support" className="hover:text-gray-900 transition-colors">Support</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
