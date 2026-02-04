import './LandingPage.css';
import logo from './assets/Logo.png';

const LandingPage = () => {
  return (
    <div className="landing">
      <header className="landing__header">
        <div className="landing__brand">
          <img src={logo} alt="Bond Room" className="landing__logo" />
        </div>
        <nav className="landing__nav">
          <a href="#about">About</a>
          <a href="#safety">Safety</a>
          <a href="#stories">Stories</a>
        </nav>
        <div className="landing__actions">
          <a className="btn btn--ghost" href="/login">Log in</a>
          <a className="btn btn--primary" href="/register">Get Started</a>
        </div>
      </header>

      <main>
        <section className="hero">
          <div className="hero__content">
            <h1>
              Guided Support for
              <br />
              Students from
              <br />
              <span className="hero__title-accent">Experienced</span>
              <br />
              <span className="hero__title-accent">Mentors</span>
            </h1>
            <p className="hero__lead">
              A safe, structured space where students can grow academically and emotionally with trusted mentors who
              walk the path with them.
            </p>
            <div className="hero__cta">
              <a className="btn btn--primary" href="/register">Get Started</a>
              <a className="btn btn--outline" href="/mentor-register">Become a Mentor</a>
            </div>
            <p className="hero__note">
              <span className="hero__note-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" className="hero__note-svg">
                  <path
                    d="M7 10V8a5 5 0 0 1 10 0v2"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                  />
                  <rect x="5" y="10" width="14" height="10" rx="2" stroke="currentColor" strokeWidth="1.6" fill="none" />
                </svg>
              </span>
              All mentors are verified and session activities are monitored for safety.
            </p>
          </div>
          <div className="hero__visual">
            <div className="hero__image hero__image--left" />
            <div className="hero__image hero__image--right" />
            <div className="hero__bubble hero__bubble--bottom">
              <div className="hero__bubble-tag">
                <span className="hero__bubble-dot" />
                Live Session
              </div>
              <div className="hero__bubble-quote">
                &quot;It&apos;s normal to feel overwhelmed at this stage. Let&apos;s break it down into smaller steps together.&quot;
              </div>
            </div>
          </div>
        </section>

        <section className="flow" id="about">
          <div className="section__title">
            <h2>How Guidance Flows</h2>
            <p>A simple, transparent process that keeps students safe and supported.</p>
          </div>
          <div className="flow__grid">
            <div className="flow__card">
              <span className="flow__icon">01</span>
              <h3>Listen</h3>
              <p>Students share goals, challenges, and communication style.</p>
            </div>
            <div className="flow__card">
              <span className="flow__icon">02</span>
              <h3>Understand</h3>
              <p>Mentors craft a tailored plan with checkpoints and clarity.</p>
            </div>
            <div className="flow__card">
              <span className="flow__icon">03</span>
              <h3>Guide</h3>
              <p>Sessions build habits, confidence, and academic momentum.</p>
            </div>
          </div>
        </section>

        <section className="trust" id="safety">
          <div className="trust__copy">
            <h2>
              Built on Trust,
              <br />
              Experience, and Care
            </h2>
            <p>
              Every mentor is background-checked, trained, and supported by our in-house student success team.
            </p>
          </div>
          <div className="trust__list">
            <div className="trust__item">
              <span className="trust__dot" />
              <div>
                <h4>Safe &amp; Monitored Sessions</h4>
                <p>Session logs, parent updates, and secure messaging included.</p>
              </div>
            </div>
            <div className="trust__item">
              <span className="trust__dot" />
              <div>
                <h4>Mentors You Trust 24/7</h4>
                <p>High-quality mentors vetted for experience and empathy.</p>
              </div>
            </div>
            <div className="trust__item">
              <span className="trust__dot" />
              <div>
                <h4>AI-Powered Matching</h4>
                <p>We pair students with mentors based on goals and personality.</p>
              </div>
            </div>
            <div className="trust__item">
              <span className="trust__dot" />
              <div>
                <h4>Student-Centered Experience</h4>
                <p>Flexible scheduling, progress tracking, and clear outcomes.</p>
              </div>
            </div>
          </div>
        </section>

        <section className="stories" id="stories">
          <div className="section__title section__title--left">
            <h2>Stories That Matter</h2>
            <p>Parents and students who found confidence through mentoring.</p>
          </div>
          <div className="stories__grid">
            <article className="quote">
              <p>“Bond helped my daughter regain her confidence and finally enjoy learning again.”</p>
              <div className="quote__meta">
                <span className="quote__avatar">A</span>
                <div>
                  <strong>Alex M.</strong>
                  <span>Parent</span>
                </div>
              </div>
            </article>
            <article className="quote">
              <p>“The mentor understood exactly how I learn. My grades improved in just one semester.”</p>
              <div className="quote__meta">
                <span className="quote__avatar">J</span>
                <div>
                  <strong>Jenna K.</strong>
                  <span>Student</span>
                </div>
              </div>
            </article>
            <article className="quote">
              <p>“Weekly updates kept us in the loop. The experience felt safe and collaborative.”</p>
              <div className="quote__meta">
                <span className="quote__avatar">R</span>
                <div>
                  <strong>Ravi S.</strong>
                  <span>Parent</span>
                </div>
              </div>
            </article>
          </div>
        </section>

        <section className="gallery">
          <div className="section__title section__title--left">
            <h2>Wisdom You Can See</h2>
            <p>Mentors who have guided students across academics and life skills.</p>
            <a className="gallery__link" href="/mentors">Meet Our Mentors</a>
          </div>
          <div className="gallery__grid">
            <article className="mentor-card">
              <div className="mentor-card__image mentor-card__image--one" />
              <div className="mentor-card__info">
                <h3>Dr. Ananya K.</h3>
                <p>STEM Mentorship</p>
              </div>
            </article>
            <article className="mentor-card">
              <div className="mentor-card__image mentor-card__image--two" />
              <div className="mentor-card__info">
                <h3>Mr. Rahul S.</h3>
                <p>Career Guidance</p>
              </div>
            </article>
            <article className="mentor-card">
              <div className="mentor-card__image mentor-card__image--three" />
              <div className="mentor-card__info">
                <h3>Ms. Sanya D.</h3>
                <p>Learning Strategies</p>
              </div>
            </article>
          </div>
        </section>

        <section className="cta">
          <div className="cta__content">
            <h2>Ready to Start Your Journey?</h2>
            <p>Match with a mentor in minutes and begin guided progress today.</p>
          </div>
          <div className="cta__actions">
            <a className="btn btn--primary" href="/register">Register a Student</a>
            <a className="btn btn--outline" href="/mentor-register">Register as Mentor</a>
          </div>
        </section>
      </main>

      <footer className="landing__footer">
        <div className="landing__brand">
          <img src={logo} alt="Bond Room" className="landing__logo" />
        </div>
        <p>Guided mentoring for every student.</p>
        <div className="landing__footer-links">
          <span>Privacy</span>
          <span>Terms</span>
          <span>Support</span>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
