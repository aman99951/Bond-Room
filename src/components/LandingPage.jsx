import { useEffect, useState } from 'react';
import logo from './assets/logo.png';
import heroLeft from './assets/left.png';
import heroRight from './assets/right.png';
import mentorLeft from './assets/mentor-left.png';
import plantPot from './assets/plant-pot-cropped.png';
import avatarOne from './assets/avatar-1.jpg';
import students from './assets/teach2.png';
import {
  ShieldCheck,
  Users,
  Bot,
  Smile,
  ChevronRight,
  Twitter,
  Linkedin,
  LockKeyhole,
  Ear,
  Brain,
  Handshake,
} from 'lucide-react';
import './LandingPage.css';

const LandingPage = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const previousBodyBackground = document.body.style.background;
    const previousHtmlBackground = document.documentElement.style.background;
    document.body.style.background = 'transparent';
    document.documentElement.style.background = 'transparent';

    return () => {
      document.body.style.background = previousBodyBackground;
      document.documentElement.style.background = previousHtmlBackground;
    };
  }, []);

  return (
    <div className="landing-figma-root min-h-screen font-['DM_Sans'] text-gray-900">
      {/* Header */}
      <header className="max-w-7xl mx-auto px-6 py-4 lg:py-5 lg:px-8">
        <div className="flex items-center justify-between lg:grid lg:grid-cols-[auto_1fr_auto] gap-4 lg:gap-6">
          {/* Logo */}
          <div className="flex items-center">
            <img src={logo} alt="Bond Room" className="h-12 w-auto" />
          </div>

          {/* Navigation - Desktop */}
          <nav className="hidden lg:flex justify-center gap-7">
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

          {/* Actions - Desktop */}
          <div className="hidden lg:flex gap-3 w-full lg:w-auto">
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

          {/* Mobile / Tablet Menu Trigger (visual) */}
          <button
            type="button"
            aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={mobileMenuOpen}
            onClick={() => setMobileMenuOpen((open) => !open)}
            className="landing-mobile-menu-btn inline-flex lg:hidden items-center justify-center"
          >
            {mobileMenuOpen ? (
              <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M5 7h14M5 12h14M5 17h14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
              </svg>
            )}
          </button>
        </div>

        {/* Mobile / Tablet Navigation */}
        {mobileMenuOpen && (
          <div className="landing-mobile-panel lg:hidden">
            <nav className="landing-mobile-nav flex gap-6 border-t border-gray-100 pt-3">
              <a href="#about" className="text-gray-600 hover:text-gray-900 font-medium text-sm" onClick={() => setMobileMenuOpen(false)}>
                About
              </a>
              <a href="#safety" className="text-gray-600 hover:text-gray-900 font-medium text-sm" onClick={() => setMobileMenuOpen(false)}>
                Safety
              </a>
              <a href="#stories" className="text-gray-600 hover:text-gray-900 font-medium text-sm" onClick={() => setMobileMenuOpen(false)}>
                Stories
              </a>
            </nav>
            <div className="landing-mobile-panel-actions">
              <a href="/login" onClick={() => setMobileMenuOpen(false)}>
                Log in
              </a>
              <a href="/register" onClick={() => setMobileMenuOpen(false)}>
                Get Started
              </a>
            </div>
          </div>
        )}
      </header>

      <main>
        {/* Hero Section */}
        <section className="max-w-7xl mx-auto px-6 py-6 sm:py-8 lg:py-12 lg:px-8">
          <div className="hero-figma-grid">
            <div className="hero-figma-copy">
              <h1 className="hero-figma-title">
                Guided Support for
                <br />
                Students from
                <br />
                <span>Experienced</span>
                <br />
                <span>Mentors</span>
              </h1>

              <p className="hero-figma-description">
                A safe, thoughtful platform where students grow through conversations with trusted mentors
                who&apos;ve walked the path before.
              </p>

              <div className="hero-figma-actions">
                <a className="hero-figma-btn hero-figma-btn--primary" href="/register">
                  Get Started
                </a>
                <a className="hero-figma-btn hero-figma-btn--secondary" href="/mentor-register">
                  Become a Mentor
                </a>
              </div>

              <p className="hero-figma-note">
                <LockKeyhole size={14} strokeWidth={2.4} />
                Sessions are monitored and recorded for student safety.
              </p>
            </div>

            <div className="hero-figma-visual" aria-hidden="true">
              <div className="hero-figma-images">
                <figure className="hero-figma-image hero-figma-image--left">
                  <img src={heroLeft} alt="" />
                </figure>
                <div className="hero-figma-right-wrap">
                  <img src={plantPot} alt="" className="hero-figma-pot" />
                  <figure className="hero-figma-image hero-figma-image--right">
                    <img src={heroRight} alt="" />
                  </figure>
                </div>
              </div>

              <article className="hero-figma-live-card">
                <div className="hero-figma-live-label">
                  <span className="hero-figma-live-dot" />
                  LIVE SESSION
                </div>
                <p>
                  &quot;It&apos;s normal to feel overwhelmed at this stage. Let&apos;s break it down into
                  smaller steps together.&quot;
                </p>
              </article>
            </div>
          </div>
        </section>

        {/* Flow Section */}
        <section className="flow-figma-section" id="about">
          <div className="flow-figma-heading">
            <h2>How Guidance Flows</h2>
            <p>A simple, transparent journey from confusion to clarity.</p>
          </div>

          <div className="flow-figma-steps">
            <article className="flow-figma-step">
              <div className="flow-figma-node">
                <Ear />
              </div>
              <h3>Listen</h3>
              <p>Students share their concerns in a private, judgment-free space.</p>
            </article>

            <article className="flow-figma-step">
              <div className="flow-figma-node">
                <Brain />
              </div>
              <h3>Understand</h3>
              <p>Our intelligent system matches them with a mentor who truly relates.</p>
            </article>

            <article className="flow-figma-step">
              <div className="flow-figma-node">
                <Handshake />
              </div>
              <h3>Guide</h3>
              <p>Meaningful 1-on-1 sessions that provide perspective and direction.</p>
            </article>
          </div>
        </section>

        {/* Trust Section */}
        <section className="trust-figma-section" id="safety">
          <div className="trust-figma-shell">
            <div className="trust-figma-copy">
              <h2>
                Built on Trust,
                <br />
                Experience, and Care
              </h2>
              <p>
                Bond Room isn&apos;t about generic advice - it&apos;s about guidance. Every interaction is
                designed to be safe, respectful, and deeply human. We bridge the gap between generations to
                foster real growth.
              </p>
              <span className="trust-figma-accent" />
            </div>

            <div className="trust-figma-list">
              <article className="trust-figma-item">
                <div className="trust-figma-icon">
                  <ShieldCheck />
                </div>
                <div>
                  <h4>Safe &amp; Monitored Sessions</h4>
                  <p>
                    Strict safety protocols including keyword monitoring and session recording ensure a secure
                    environment for every student.
                  </p>
                </div>
              </article>

              <article className="trust-figma-item">
                <div className="trust-figma-icon">
                  <Users />
                </div>
                <div>
                  <h4>Mentors from Trusted 50+ Age Group</h4>
                  <p>
                    Wisdom comes from lived experience. Our mentors are vetted professionals, retirees, and
                    parents who genuinely care.
                  </p>
                </div>
              </article>

              <article className="trust-figma-item">
                <div className="trust-figma-icon">
                  <Bot />
                </div>
                <div>
                  <h4>AI-Powered Matching</h4>
                  <p>
                    Our algorithm considers academic interests, emotional needs, and language preferences to
                    find the perfect mentor match.
                  </p>
                </div>
              </article>

              <article className="trust-figma-item">
                <div className="trust-figma-icon">
                  <Smile />
                </div>
                <div>
                  <h4>Simple, Student-Friendly Experience</h4>
                  <p>
                    No complex onboarding. Just sign up, match, and start talking. Designed to be as easy as
                    messaging a friend.
                  </p>
                </div>
              </article>
            </div>
          </div>
        </section>

        {/* Stories Section */}
        <section className="stories-figma-section" id="stories">
          <div className="stories-figma-shell">
            <h2>Stories That Matter</h2>

            <div className="stories-figma-grid">
              <article className="stories-figma-card">
                <span className="stories-figma-quote">❝</span>
                <p>
                  &quot;I was so stressed about my board exams. Talking to Mr. Sharma helped me calm down. He
                  didn&apos;t just give advice, he listened.&quot;
                </p>
                <div className="stories-figma-person">
                  <img src={avatarOne} alt="Arav" />
                  <div>
                    <h4>Arav</h4>
                    <span>Student, 17</span>
                  </div>
                </div>
              </article>

              <article className="stories-figma-card">
                <span className="stories-figma-quote">❝</span>
                <p>
                  &quot;I felt lost choosing a career path. My mentor shared her own journey of confusion and
                  success, which gave me so much hope.&quot;
                </p>
                <div className="stories-figma-person">
                  <img
                    src={students}
                    alt="Priya"
                    className="stories-figma-avatar stories-figma-avatar--left"
                  />
                  <div>
                    <h4>Priya</h4>
                    <span>Student, 19</span>
                  </div>
                </div>
              </article>

              <article className="stories-figma-card">
                <span className="stories-figma-quote">❝</span>
                <p>
                  &quot;It&apos;s different than talking to parents. My mentor feels like a wise friend who
                  doesn&apos;t judge my mistakes.&quot;
                </p>
                <div className="stories-figma-person">
                  <img
                    src={students}
                    alt="Rohan"
                    className="stories-figma-avatar stories-figma-avatar--right"
                  />
                  <div>
                    <h4>Rohan</h4>
                    <span>Student, 16</span>
                  </div>
                </div>
              </article>
            </div>
          </div>
        </section>

        {/* Gallery Section */}
        <section className="wisdom-figma-section">
          <div className="wisdom-figma-shell">
            <div className="wisdom-figma-head">
              <div className="wisdom-figma-copy">
                <h2>Wisdom You Can See</h2>
                <p>
                  Connect with mentors who bring decades of life experience, professional success, and
                  emotional intelligence.
                </p>
              </div>

              <a className="wisdom-figma-link" href="/mentors">
                Meet Our Mentors
                <ChevronRight size={17} />
              </a>
            </div>

            <div className="wisdom-figma-grid">
              <article className="wisdom-figma-card">
                <figure className="wisdom-figma-media wisdom-figma-media--one">
                  <img src={heroRight} alt="Dr. Anand K." />
                </figure>
                <div className="wisdom-figma-body">
                  <div className="wisdom-figma-row">
                    <h3>Dr. Anand K.</h3>
                    <span>Retired Prof.</span>
                  </div>
                  <div className="wisdom-figma-tags">
                    <span>Academic Stress</span>
                    <span>Physics</span>
                  </div>
                  <p>&quot;I help students find joy in learning rather than fearing exams.&quot;</p>
                </div>
              </article>

              <article className="wisdom-figma-card">
                <figure className="wisdom-figma-media wisdom-figma-media--two">
                  <img src={mentorLeft} alt="Mrs. Radha" />
                </figure>
                <div className="wisdom-figma-body">
                  <div className="wisdom-figma-row">
                    <h3>Mrs. Radha</h3>
                    <span>Ex-HR Director</span>
                  </div>
                  <div className="wisdom-figma-tags">
                    <span>Career Guidance</span>
                    <span>Confidence</span>
                  </div>
                  <p>&quot;Guiding young minds to discover their true potential is my passion.&quot;</p>
                </div>
              </article>

              <article className="wisdom-figma-card">
                <figure className="wisdom-figma-media wisdom-figma-media--three">
                  <img src={heroRight} alt="Col. Singh (Retd)" />
                </figure>
                <div className="wisdom-figma-body">
                  <div className="wisdom-figma-row">
                    <h3>Col. Singh (Retd)</h3>
                    <span>Army Veteran</span>
                  </div>
                  <div className="wisdom-figma-tags">
                    <span>Discipline</span>
                    <span>Leadership</span>
                  </div>
                  <p>&quot;Building character and resilience for the challenges of tomorrow.&quot;</p>
                </div>
              </article>
            </div>
          </div>
        </section>

        <section className="wellbeing-figma-section">
          <div className="wellbeing-figma-shell">
            <div className="wellbeing-figma-left">
              <div className="wellbeing-figma-icon">
                <ShieldCheck />
              </div>
              <div className="wellbeing-figma-copy">
                <h3>Your wellbeing comes first</h3>
                <p>
                  All sessions are private yet monitored by AI for safety keywords. We maintain a zero-tolerance
                  policy for inappropriate behavior.
                </p>
              </div>
            </div>

            <div className="wellbeing-figma-links">
              <a href="/privacy">Privacy Policy</a>
              <a href="/safety">Safety Guidelines</a>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="cta-figma-section">
          <div className="cta-figma-shell">
            <h2>Ready to Start Your Journey?</h2>
            <p>Join a community built on wisdom, trust, and shared growth.</p>

            <div className="cta-figma-actions">
              <a className="cta-figma-btn cta-figma-btn--primary" href="/register">
                Begin as Student
              </a>
              <a className="cta-figma-btn cta-figma-btn--secondary" href="/mentor-register">
                Sign Up as Mentor
              </a>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="footer-figma-section">
        <div className="footer-figma-shell">
          <a href="/" className="footer-figma-brand" aria-label="Bond Room Home">
            <img src={logo} alt="Bond Room" />
          </a>

          <nav className="footer-figma-nav">
            <a href="#about">About</a>
            <a href="/terms">Terms</a>
            <a href="/privacy">Privacy</a>
            <a href="/support">Help</a>
          </nav>

          <div className="footer-figma-social">
            <a href="#" aria-label="Twitter">
              <Twitter />
            </a>
            <a href="#" aria-label="LinkedIn">
              <Linkedin />
            </a>
          </div>
        </div>
      </footer>

      <div className="copyright-figma-strip">© 2025 Bond Room Platform. All rights reserved.</div>
    </div>
  );
};

export default LandingPage;
