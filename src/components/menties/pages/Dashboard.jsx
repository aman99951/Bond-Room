import React from 'react';
import { Link } from 'react-router-dom';
import topRightIcon from '../../assets/Vector (1).png';

const recommended = [
  {
    name: 'Dr. Vani Ayyasamy',
    location: 'Coimbatore, TN',
    tags: ['#CareerGrowth', '#Anxiety'],
    blurb:
      "I've navigated the corporate ladder for 15 years and understand the unique pressures students face.",
    topMatch: true,
  },
  {
    name: 'Mr.Nanda Kumar',
    location: 'Chennai, TN',
    tags: ['#TechIndustry', '#Burnout'],
    blurb:
      'Transitioning from university to a startup can be overwhelming. I specialize in helping young professionals.',
  },
  {
    name: 'Dr.Sajeedha Begum',
    location: 'Salem, TN',
    tags: ['#Mindfulness', '#StudySkills'],
    blurb:
      "Mindfulness isn't just meditation; it's a way to approach your studies. Let's build a sustainable approach.",
  },
];

const Dashboard = () => {
  return (
    <div className="p-4 sm:p-6">
      <div className="space-y-6">
        <div className="rounded-2xl border border-default bg-surface p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-lg font-semibold text-primary">Hi Rajeswari, welcome back.</h1>
            <div className="text-sm text-muted">
              Here's what we've prepared for you today to help you grow.
            </div>
          </div>
          <div className="h-16 w-32 rounded-xl bg-muted flex items-center justify-center self-start sm:self-auto" aria-hidden="true">
            <img src={topRightIcon} alt="" className="h-8 w-8" />
          </div>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {['Update Preferences', 'Retake Assessment', 'Edit Profile', 'Get Help'].map((t) => (
            <button
              key={t}
              className="rounded-xl border border-default bg-surface py-3 text-sm text-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-900 focus-visible:ring-offset-2"
              aria-label={t}
            >
              {t}
            </button>
          ))}
        </div>

        <div>
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-primary">Your Recommended Mentors</h2>
              <div className="text-xs text-muted">
                Based on your recent mood and assessment responses.
              </div>
            </div>
            <button
              className="text-xs text-secondary underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-900 focus-visible:ring-offset-2"
              aria-label="See all mentor recommendations"
            >
              See All Recommendations
            </button>
          </div>

          <div className="mt-3 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {recommended.map((m) => (
              <div key={m.name} className="rounded-xl border border-default bg-surface p-4">
                <div className="flex items-start gap-3">
                  <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center" aria-hidden="true">
                    <svg className="h-5 w-5 text-muted" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                      <circle cx="12" cy="8" r="3.5" stroke="currentColor" strokeWidth="1.5" />
                      <path d="M4 20c1.7-3.4 5-5 8-5s6.3 1.6 8 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <div className="text-sm font-semibold">{m.name}</div>
                        <div className="text-xs text-muted">{m.location}</div>
                      </div>
                      {m.topMatch && (
                        <span className="rounded-full border border-default bg-muted px-2 py-1 text-[10px] text-muted">
                          Top Match
                        </span>
                      )}
                    </div>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {m.tags.map((t) => (
                        <span key={t} className="rounded-full bg-muted px-2 py-1 text-[10px] text-muted">
                          {t}
                        </span>
                      ))}
                    </div>
                    <p className="mt-2 text-xs text-muted">{m.blurb}</p>
                  </div>
                </div>
                <Link
                  to="/mentor-profile"
                  className="mt-3 block w-full rounded-md border border-default py-2 text-xs text-center text-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-900 focus-visible:ring-offset-2"
                  aria-label={`View profile for ${m.name}`}
                >
                  View Profile
                </Link>
              </div>
            ))}
          </div>
        </div>

        <div className="grid lg:grid-cols-[2fr_1fr] gap-6">
          <div>
            <h2 className="text-sm font-semibold text-primary mb-2">Your Upcoming Sessions</h2>
            <div className="rounded-xl border border-default bg-surface p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center" aria-hidden="true">
                  <svg className="h-5 w-5 text-muted" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <circle cx="12" cy="8" r="3.5" stroke="currentColor" strokeWidth="1.5" />
                    <path d="M4 20c1.7-3.4 5-5 8-5s6.3 1.6 8 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                </div>
                <div>
                  <div className="text-sm font-semibold">Session with Mahima Boopesh</div>
                  <div className="text-xs text-muted">Today, 4:00 PM</div>
                </div>
              </div>
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <span className="text-[10px] text-muted">Starts in 2h</span>
                <button className="rounded-md bg-muted px-3 py-2 text-xs text-secondary ml-auto sm:ml-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-900 focus-visible:ring-offset-2">
                  Join Call
                </button>
              </div>
            </div>
          </div>

          <div>
            <h2 className="text-sm font-semibold text-primary mb-2">Recent Sessions</h2>
            <div className="rounded-xl border border-default bg-surface p-4 space-y-3">
              <div className="flex items-center justify-between text-xs text-muted">
                <div>
                  <div className="text-sm font-semibold text-primary">Dr. Mahima Boopesh</div>
                  <div className="text-xs text-muted">Oct 24, 2025</div>
                </div>
                <button className="rounded-md border border-default px-2 py-1 text-[10px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-900 focus-visible:ring-offset-2">
                  Leave feedback for Dr. Mahima Boopesh
                </button>
              </div>
              <div className="flex items-center justify-between text-xs text-muted">
                <div>
                  <div className="text-sm font-semibold text-primary">A. Elangovan</div>
                  <div className="text-xs text-muted">Oct 12, 2025</div>
                </div>
                <span className="text-[10px] text-muted">✓ Done</span>
              </div>
              <div className="flex items-center justify-between text-xs text-muted">
                <div>
                  <div className="text-sm font-semibold text-primary">Bilal Azam</div>
                  <div className="text-xs text-muted">Sept 30, 2025</div>
                </div>
                <span className="text-[10px] text-muted">✓ Done</span>
              </div>
              <button className="w-full text-center text-xs text-secondary underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-900 focus-visible:ring-offset-2">
                View all session history
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
