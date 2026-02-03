import './LandingPage.css';

const LandingPage = () => {
  return (
    <div className="landing">
      <header className="landing__header">
        <div className="landing__brand">
          <span className="landing__logo">Bond</span>
          <span className="landing__logo-dot">.</span>
        </div>
        <nav className="landing__nav">
          <a href="#about">About</a>
          <a href="#safety">Safety</a>
          <a href="#stories">Stories</a>
        </nav>
        <div className="landing__actions">
          <a className="btn btn--ghost" href="/login">Log in</a>
          <a className="btn btn--primary" href="/register">Start now</a>
        </div>
      </header>

      <main>
        <section className="hero">
          <div className="hero__content">
            <p className="hero__eyebrow">Guided support for students</p>
            <h1>Guided Support for Students from Experienced Mentors</h1>
            <p className="hero__lead">
              A safe, structured space where students can grow academically and emotionally
              with trusted mentors who walk the path with them.
            </p>
            <div className="hero__cta">
              <a className="btn btn--primary" href="/register">Get started</a>
              <a className="btn btn--outline" href="/mentor-register">Become a mentor</a>
            </div>
            <div className="hero__trust">
              <div>
                <strong>1,200+</strong>
                <span>students matched</span>
              </div>
              <div>
                <strong>4.9/5</strong>
                <span>mentor rating</span>
              </div>
              <div>
                <strong>100%</strong>
                <span>verified mentors</span>
              </div>
            </div>
          </div>
          <div className="hero__visual">
            <div className="hero__image hero__image--large" />
            <div className="hero__image hero__image--small" />
            <div className="hero__bubble hero__bubble--top">
              <p>We meet on your schedule.</p>
              <span>Weekly progress check-ins</span>
            </div>
            <div className="hero__bubble hero__bubble--bottom">
              <p>Personalized guidance</p>
              <span>Tailored to each student</span>
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
              <p>We start by understanding goals, needs, and communication style.</p>
            </div>
            <div className="flow__card">
              <span className="flow__icon">02</span>
              <h3>Understand</h3>
              <p>Mentors map a clear plan with milestones and parent visibility.</p>
            </div>
            <div className="flow__card">
              <span className="flow__icon">03</span>
              <h3>Guide</h3>
              <p>Ongoing sessions build confidence, habits, and academic momentum.</p>
            </div>
          </div>
        </section>

        <section className="trust" id="safety">
          <div className="trust__copy">
            <h2>Built on Trust, Experience, and Care</h2>
            <p>
              Every mentor is background-checked, trained, and supported by our in-house
              student success team.
            </p>
          </div>
          <div className="trust__list">
            <div className="trust__item">
              <h4>Safe &amp; Monitored Sessions</h4>
              <p>Session logs, parent updates, and secure messaging included.</p>
            </div>
            <div className="trust__item">
              <h4>Mentors You Trust 24/7</h4>
              <p>High-quality mentors vetted for experience and empathy.</p>
            </div>
            <div className="trust__item">
              <h4>AI-Powered Matching</h4>
              <p>We pair students with mentors based on goals and personality.</p>
            </div>
            <div className="trust__item">
              <h4>Student-Centered Experience</h4>
              <p>Flexible scheduling, progress tracking, and clear outcomes.</p>
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
              <p>
                “Bond helped my daughter regain her confidence and finally enjoy
                learning again.”
              </p>
              <div className="quote__meta">
                <span className="quote__avatar">A</span>
                <div>
                  <strong>Alex M.</strong>
                  <span>Parent</span>
                </div>
              </div>
            </article>
            <article className="quote">
              <p>
                “The mentor understood exactly how I learn. My grades improved
                in just one semester.”
              </p>
              <div className="quote__meta">
                <span className="quote__avatar">J</span>
                <div>
                  <strong>Jenna K.</strong>
                  <span>Student</span>
                </div>
              </div>
            </article>
            <article className="quote">
              <p>
                “Weekly updates kept us in the loop. The experience felt safe
                and collaborative.”
              </p>
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
          <span className="landing__logo">Bond</span>
          <span className="landing__logo-dot">.</span>
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
