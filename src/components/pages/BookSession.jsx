import React from 'react';
import { Link } from 'react-router-dom';

const BookSession = () => {
  return (
    <div className="p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
        <h1 className="text-base font-semibold text-primary">Book Session with Dr. Lakshmi T Rajaan</h1>
        <div className="rounded-full bg-muted px-3 py-1 text-[10px] text-secondary" aria-live="polite">
          Sessions are monitored for safety
        </div>
      </div>

      <div className="rounded-2xl border border-default bg-surface shadow-sm p-4 sm:p-5">
        <div className="grid lg:grid-cols-[240px_1fr_200px] gap-5">
          <aside className="space-y-4" aria-label="Mentor summary">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-md bg-gray-200 flex items-center justify-center" aria-hidden="true">
                <svg className="h-6 w-6 text-secondary" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <circle cx="12" cy="8" r="3.5" stroke="currentColor" strokeWidth="1.5" />
                  <path d="M4 20c1.7-3.4 5-5 8-5s6.3 1.6 8 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </div>
              <div>
                <div className="text-sm font-semibold">Dr. Lakshmi T Rajan</div>
                <div className="text-xs text-secondary">Madurai, TN</div>
              </div>
            </div>

            <div className="text-xs text-secondary flex items-center gap-2">
              <span>★ 4.9 (120)</span>
              <span className="text-subtle">24 sessions</span>
            </div>

            <div>
              <div className="text-[10px] text-muted">Expertise</div>
              <div className="mt-2 flex flex-wrap gap-2">
                {['Academic Stress', 'Anxiety'].map((t) => (
                  <span key={t} className="rounded-full bg-muted px-3 py-1 text-[10px] text-secondary">
                    {t}
                  </span>
                ))}
              </div>
            </div>

            <div>
              <div className="text-[10px] text-muted">Language</div>
              <div className="mt-2 flex flex-wrap gap-2">
                {['Tamil', 'English'].map((t) => (
                  <span key={t} className="rounded-full bg-muted px-3 py-1 text-[10px] text-secondary">
                    {t}
                  </span>
                ))}
              </div>
            </div>

            <div className="rounded-xl border border-default bg-muted p-3 text-xs text-secondary">
              <div className="text-[10px] text-muted mb-2">My Story</div>
              <p>
                I remember freezing during my finals. It took me years to realize my worth wasn't tied to a grade.
                I'm here to help you navigate that pressure and find your own path to success.
              </p>
              <button className="mt-2 text-[10px] text-secondary underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-900 focus-visible:ring-offset-2">
                Read full bio
              </button>
            </div>
          </aside>

          <section className="space-y-4" aria-label="Calendar">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold">Nov 2025</h2>
              <div className="flex items-center gap-2 text-muted">
                <button className="h-7 w-7 rounded-md border border-default focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-900 focus-visible:ring-offset-2" aria-label="Previous month">‹</button>
                <button className="h-7 w-7 rounded-md border border-default focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-900 focus-visible:ring-offset-2" aria-label="Next month">›</button>
              </div>
            </div>
            <div className="overflow-x-auto">
              <div className="min-w-[520px] grid grid-cols-7 gap-2 text-center text-[11px] text-muted">
                {['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'].map((d) => (
                  <div key={d}>{d}</div>
                ))}
                <div className="col-span-7 grid grid-cols-7 gap-2">
                  {Array.from({ length: 35 }).map((_, i) => {
                    const day = i + 1;
                    const isActive = day === 18;
                    const isMuted = day > 30;
                    return (
                      <button
                        key={i}
                        className={`h-9 rounded-md border text-[11px] flex items-center justify-center ${
                          isActive
                            ? 'bg-accent text-on-accent border-accent'
                            : isMuted
                              ? 'text-gray-300 border-gray-100'
                              : 'border-default'
                        }`}
                        aria-label={`Select ${day <= 30 ? `November ${day}, 2025` : `December ${day - 30}, 2025`}`}
                        disabled={isMuted}
                      >
                        {day <= 30 ? day : day - 30}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </section>

          <aside className="space-y-3" aria-label="Available times">
            <h2 className="text-xs text-secondary">Available Times (Nov 18)</h2>
            {['09:00 AM', '10:30 AM', '06:30 PM', '08:30 PM'].map((t, i) => (
              <button
                key={t}
                className={`w-full rounded-md border px-3 py-2 text-xs ${
                  i === 2 ? 'bg-accent text-on-accent border-accent' : 'border-default text-secondary'
                } focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-900 focus-visible:ring-offset-2`}
                aria-pressed={i === 2}
              >
                {t}
              </button>
            ))}
          </aside>
        </div>

        <div className="mt-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <Link
            to="/mentor-details"
            className="text-xs text-secondary underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-900 focus-visible:ring-offset-2"
            aria-label="Go back to mentor details"
          >
            ← Go Back
          </Link>
          <Link to="/booking-success" className="w-full sm:max-w-md rounded-md bg-accent text-on-accent py-2.5 text-xs text-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-900 focus-visible:ring-offset-2" aria-label="Confirm booking">
            Confirm Booking →
          </Link>
        </div>
      </div>
    </div>
  );
};

export default BookSession;
