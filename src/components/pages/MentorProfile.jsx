import React from 'react';
import { Link } from 'react-router-dom';
import { Brain, Calendar, MessageCircle } from 'lucide-react';

const MentorProfile = () => {
  return (
    <div className="p-4 sm:p-6">
      <div className="grid lg:grid-cols-[260px_1fr] gap-6">
        <Link to="/mentors" className="lg:col-span-2 text-xs text-secondary underline">
          ← Back
        </Link>
        <aside className="border border-default rounded-2xl bg-surface p-5" aria-label="Mentor profile summary">
          <div className="flex flex-col items-center text-center">
            <div className="h-20 w-20 rounded-full bg-gray-200 flex items-center justify-center" aria-hidden="true">
              <svg className="h-8 w-8 text-secondary" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <circle cx="12" cy="8" r="3.5" stroke="currentColor" strokeWidth="1.5" />
                <path d="M4 20c1.7-3.4 5-5 8-5s6.3 1.6 8 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </div>
            <h1 className="mt-3 text-sm font-semibold text-primary">Dr. Lakshmi T Rajan</h1>
            <div className="text-xs text-secondary">Madurai, TN</div>
            <div className="mt-3 inline-flex items-center gap-1 rounded-full bg-muted px-3 py-1 text-[10px] text-secondary">
              Senior Mentor
            </div>
            <div className="mt-2 inline-flex items-center gap-1 rounded-full bg-muted px-3 py-1 text-[10px] text-secondary">
              Tamil, English
            </div>
          </div>

          <div className="mt-6 flex items-center justify-center gap-1 text-xs text-secondary" aria-label="Mentor rating 4.9 out of 5, 120 reviews">
            <span>★</span>
            <span>4.9</span>
            <span className="text-muted">(120 reviews)</span>
          </div>

          <Link
            to="/book-session"
            className="mt-4 block w-full rounded-md bg-accent text-on-accent py-2 text-xs text-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-900 focus-visible:ring-offset-2"
            aria-label="Schedule a session with Dr. Lakshmi T Rajan"
          >
            Schedule Session
          </Link>

          <div className="mt-4 text-[10px] text-muted text-center">AI Matched For</div>
          <div className="mt-2 flex items-center justify-center gap-2">
            <span className="rounded-full bg-muted px-3 py-1 text-[10px] text-secondary">Anxiety</span>
            <span className="rounded-full bg-muted px-3 py-1 text-[10px] text-secondary">Stress</span>
          </div>
        </aside>

        <section className="space-y-5">
          <div className="border border-default rounded-2xl bg-surface p-5">
            <h2 className="flex items-center gap-2 text-sm font-semibold text-primary">
              <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-muted" aria-hidden="true">
                <MessageCircle className="h-4 w-4 text-primary" />
              </span>
              About the Mentor
            </h2>
            <p className="mt-3 text-sm text-primary">
              Hi there! I'm Lakshmi, and I specialize in helping students navigate the pressures of high school with
              confidence. With over 5 years of experience in educational counseling, I've helped hundreds of teens find
              their balance.
            </p>
            <p className="mt-3 text-sm text-primary">
              My approach is friendly, non-judgmental, and focused on practical strategies you can use immediately.
              Whether it's exam anxiety or just feeling overwhelmed, we can tackle it together.
            </p>
          </div>

          <div className="border border-default rounded-2xl bg-surface p-5">
            <h2 className="flex items-center gap-2 text-sm font-semibold text-primary">
              <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-muted" aria-hidden="true">
                <Brain className="h-4 w-4 text-primary" />
              </span>
              Expertise
            </h2>
            <div className="mt-3 flex flex-wrap gap-2">
              {['Exam Anxiety', 'Study Strategies', 'Parent Pressure', 'Motivation', 'Stress Relief'].map((t) => (
                <span key={t} className="rounded-full bg-muted px-3 py-1 text-[10px] text-secondary">
                  {t}
                </span>
              ))}
            </div>
          </div>

          <div className="border border-default rounded-2xl bg-surface p-5">
            <div className="flex items-center justify-between text-sm font-semibold text-primary">
              <div className="flex items-center gap-2">
                <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-muted" aria-hidden="true">
                  <Calendar className="h-4 w-4 text-primary" />
                </span>
                <h2>Availability This Week</h2>
              </div>
              <button className="text-xs text-secondary underline">View Full Availability</button>
            </div>
            <div className="mt-4 overflow-x-auto">
              <div className="min-w-[520px] grid grid-cols-7 gap-2 text-center text-[10px] text-secondary">
                {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d) => (
                  <div key={d}>{d}</div>
                ))}
                <div className="col-span-7 grid grid-cols-7 gap-2">
                  {['—', '4:00 PM\n7:30 PM', '5:30 PM', '—', '3:00 PM', '—', '—'].map((t, i) => (
                    <div
                      key={i}
                      className="h-12 rounded-md border border-default bg-muted flex items-center justify-center whitespace-pre-line text-[10px] text-secondary"
                    >
                      {t}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default MentorProfile;
