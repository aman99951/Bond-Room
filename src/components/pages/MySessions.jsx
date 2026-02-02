import React from 'react';
import { Link } from 'react-router-dom';

const upcoming = [
  {
    mentor: 'Mahima Boopesh',
    date: 'Today, 4:00 PM',
    status: 'Starts in 2h',
  },
  {
    mentor: 'Dr. Lakshmi T Rajan',
    date: 'Nov 20, 2025 • 6:30 PM',
    status: 'Scheduled',
  },
];

const past = [
  { mentor: 'Dr. Mahima Boopesh', date: 'Oct 24, 2025', feedback: true },
  { mentor: 'A. Elangovan', date: 'Oct 12, 2025', feedback: false },
  { mentor: 'Bilal Azam', date: 'Sept 30, 2025', feedback: false },
];

const MySessions = () => {
  return (
    <div className="p-6">
      <div className="rounded-2xl border border-default bg-surface p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
          <div>
            <h1 className="text-lg font-semibold text-primary">My Sessions</h1>
            <p className="text-sm text-muted">Manage your upcoming and past mentorship sessions.</p>
          </div>
          <Link
            to="/mentors"
            className="rounded-md border border-default px-3 py-2 text-xs text-muted"
          >
            Book New Session
          </Link>
        </div>

        <div className="mt-6 grid lg:grid-cols-[2fr_1fr] gap-6">
          <div>
            <div className="text-sm font-semibold text-primary mb-2">Upcoming Sessions</div>
            <div className="space-y-3">
              {upcoming.map((s) => (
                <div
                  key={s.mentor + s.date}
                  className="rounded-xl border border-default bg-surface p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                      <svg className="h-5 w-5 text-muted" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                        <circle cx="12" cy="8" r="3.5" stroke="currentColor" strokeWidth="1.5" />
                        <path d="M4 20c1.7-3.4 5-5 8-5s6.3 1.6 8 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                      </svg>
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-primary">Session with {s.mentor}</div>
                      <div className="text-xs text-muted">{s.date}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <span className="text-[10px] text-muted">{s.status}</span>
                    <button className="rounded-md bg-muted px-3 py-2 text-xs text-muted ml-auto sm:ml-0">
                      Join Call
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <div className="text-sm font-semibold text-primary mb-2">Recent Sessions</div>
            <div className="rounded-xl border border-default bg-surface p-4 space-y-3">
              {past.map((p) => (
                <div key={p.mentor + p.date} className="flex items-center justify-between text-xs text-muted">
                  <div>
                    <div className="text-sm font-semibold text-primary">{p.mentor}</div>
                    <div className="text-xs text-muted">{p.date}</div>
                  </div>
                  {p.feedback ? (
                    <Link
                      to="/feedback"
                      className="rounded-md border border-default px-2 py-1 text-[10px] text-secondary"
                    >
                      Feedback
                    </Link>
                  ) : (
                    <span className="text-[10px] text-muted">✓ Done</span>
                  )}
                </div>
              ))}
              <button className="w-full text-center text-xs text-muted underline">View All History</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MySessions;
