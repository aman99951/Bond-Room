import React from 'react';
import { Link } from 'react-router-dom';

const mentorsBeforeBooking = [
  {
    name: 'Dr. Lakshmi T Rajan',
    location: 'Madurai, TN',
    tags: ['Academic Stress', 'Anxiety'],
    rating: '4.9',
    reviews: '120',
    blurb:
      'Help students navigate the pressures of higher education. Having been a professor for 10 years, I understand the unique challenges of exam season.',
    topMatch: true,
    darkCta: true,
  },
  {
    name: 'Mr.Arputharaj Felix',
    location: 'Chennai, TN',
    tags: ['Time Management', 'Focus'],
    rating: '4.8',
    reviews: '98',
    blurb:
      "Specializing in productivity and mindfulness. Let's build a schedule that works for you, not against you.",
  },
  {
    name: 'Rizwana Parvin',
    location: 'Coimbatore, TN',
    tags: ['Career Prep', 'Motivation'],
    rating: '4.7',
    reviews: '48',
    blurb:
      'Bilingual mentor focused on helping first-generation students succeed. I provide practical advice and emotional support.',
  },
  {
    name: 'A. Elangovan',
    location: 'Chennai, TN',
    tags: ['Exam Anxiety', 'Loneliness'],
    rating: '4.8',
    reviews: '98',
    blurb:
      "Retired school principal. I'm here to listen without judgment. Let's talk about what's bothering you.",
  },
];

const Mentors = () => {
  return (
    <div className="p-4 sm:p-6">
      <div className="rounded-2xl border border-default bg-surface shadow-sm overflow-hidden">
        <div className="bg-gradient-to-b from-gray-900 to-gray-800 text-on-accent px-4 sm:px-6 py-5 w-full min-h-[132px]">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-lg font-semibold">Your Recommended Mentors</h1>
              <p className="text-xs text-gray-300 mt-1">Based on your current mood and concerns</p>
            </div>
            <div className="flex items-center gap-2 rounded-full border border-gray-700 px-3 py-1 text-[11px] text-gray-200">
              <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-gray-700">
                <span className="text-[9px]">✓</span>
              </span>
              AI Analysis Complete
            </div>
          </div>
        </div>

        <div className="p-4 sm:p-6 grid sm:grid-cols-2 gap-5">
          {mentorsBeforeBooking.map((m) => (
            <div
              key={m.name}
              className={`relative rounded-xl border ${m.topMatch ? 'border-accent shadow' : 'border-default'} bg-surface p-4`}
            >
              {m.topMatch && (
                <span className="absolute -top-3 left-4 rounded-full border border-accent bg-surface px-3 py-1 text-[10px] font-semibold">
                  ★ Top Match
                </span>
              )}
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex flex-col items-center">
                  <div className="h-14 w-14 rounded-lg bg-gray-200 flex items-center justify-center">
                    <svg className="h-7 w-7 text-muted" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                      <circle cx="12" cy="8" r="3.5" stroke="currentColor" strokeWidth="1.5" />
                      <path d="M4 20c1.7-3.4 5-5 8-5s6.3 1.6 8 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                    </svg>
                  </div>
                  <div className="mt-2 flex items-center gap-1 text-xs text-muted">
                    <span>★</span>
                    <span>{m.rating}</span>
                    <span className="text-subtle">({m.reviews})</span>
                  </div>
                </div>
                <div className="flex-1">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                    <div>
                      <div className="text-sm font-semibold text-primary">{m.name}</div>
                      <div className="text-xs text-muted">{m.location}</div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      {m.tags.map((t) => (
                        <span
                          key={t}
                          className="rounded-full bg-muted px-2 py-1 text-[10px] text-muted"
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>
                  <p className="mt-2 text-xs text-muted">{m.blurb}</p>
                </div>
              </div>
              <div className="mt-4 flex flex-col sm:flex-row gap-3">
                <Link
                  to="/mentor-details"
                  className={`flex-1 rounded-md border ${
                    m.darkCta ? 'bg-accent text-on-accent border-accent' : 'border-default text-secondary'
                  } py-2 text-xs text-center`}
                >
                  Schedule Session
                </Link>
                <Link to="/mentor-profile" className="flex-1 rounded-md border border-default py-2 text-xs text-secondary text-center">
                  View Profile
                </Link>
              </div>
            </div>
          ))}
        </div>

        <div className="px-4 sm:px-6 pb-6">
          <div className="flex items-center justify-center gap-2 text-xs text-muted">
            <button className="h-8 w-8 rounded-md border border-default">←</button>
            <button className="h-8 w-8 rounded-md bg-accent text-on-accent">1</button>
            <button className="h-8 w-8 rounded-md border border-default">2</button>
            <button className="h-8 w-8 rounded-md border border-default">3</button>
            <button className="h-8 w-8 rounded-md border border-default">→</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Mentors;
