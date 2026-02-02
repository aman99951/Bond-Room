import React, { useState } from 'react';

const Profile = () => {
  const [gradeOpen, setGradeOpen] = useState(false);
  const [gradeValue, setGradeValue] = useState('11th Grade');
  const [langOpen, setLangOpen] = useState(false);
  const [langValue, setLangValue] = useState('English');
  const [styleOpen, setStyleOpen] = useState(false);
  const [styleValue, setStyleValue] = useState('Good Listener');

  const gradeOptions = ['9th Grade', '10th Grade', '11th Grade', '12th Grade'];
  const langOptions = ['English', 'Tamil', 'Telugu', 'Malayalam', 'Kannada', 'Hindi'];
  const styleOptions = ['Good Listener', 'Action Oriented', 'Friendly', 'Motivational'];

  return (
    <div className="p-4 sm:p-6">
      <div className="rounded-2xl border border-default bg-surface p-4 sm:p-6">
        <h1 className="text-lg font-semibold text-primary">My Profile</h1>
        <p className="text-sm text-muted mt-1">
          Manage your personal information and mentorship preferences.
        </p>

        <div className="mt-6 border-t border-gray-100 pt-6">
          <div className="text-sm font-semibold text-primary">Personal Information</div>
          <div className="mt-4 flex items-center gap-3">
            <div className="h-12 w-12 rounded-full bg-gray-200 flex items-center justify-center">
              <svg className="h-6 w-6 text-muted" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <circle cx="12" cy="8" r="3.5" stroke="currentColor" strokeWidth="1.5" />
                <path d="M4 20c1.7-3.4 5-5 8-5s6.3 1.6 8 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </div>
            <button className="rounded-md border border-default px-3 py-2 text-xs text-muted">
              Edit Photo
            </button>
          </div>

          <div className="mt-5 grid md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="profileFullName" className="text-xs text-muted">Full Name</label>
              <input id="profileFullName" className="mt-1 w-full rounded-md border border-default px-3 py-2 text-sm" value="Rajeswari" readOnly />
            </div>
            <div>
              <label htmlFor="profileEmail" className="text-xs text-muted">Email Address</label>
              <input id="profileEmail" className="mt-1 w-full rounded-md border border-default px-3 py-2 text-sm" value="rajeswari171@example.com" readOnly />
            </div>
            <div>
              <label id="profileGradeLabel" className="text-xs text-muted">Grade Level</label>
              <div className="relative mt-1" tabIndex={0} onBlur={() => setGradeOpen(false)}>
                <button
                  type="button"
                  className="w-full rounded-md border border-default px-3 py-2 text-sm text-left focus:outline-none focus:ring-0 focus:border-accent"
                  onClick={() => setGradeOpen((o) => !o)}
                  aria-haspopup="listbox"
                  aria-expanded={gradeOpen}
                  aria-labelledby="profileGradeLabel"
                >
                  {gradeValue}
                </button>
                {gradeOpen && (
                  <ul
                    className="absolute z-10 mt-1 w-full rounded-md border border-accent bg-accent text-on-accent text-sm shadow"
                    role="listbox"
                  >
                    {gradeOptions.map((opt) => (
                      <li key={opt}>
                        <button
                          type="button"
                          className="w-full text-left px-3 py-2 hover:bg-gray-800"
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => {
                            setGradeValue(opt);
                            setGradeOpen(false);
                          }}
                        >
                          {opt}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
            <div>
              <label className="text-xs text-muted">Parent's Mobile (Verified ✓)</label>
              <input id="profileParentMobile" className="mt-1 w-full rounded-md border border-default px-3 py-2 text-sm" value="+91 98765 43210" readOnly />
            </div>
          </div>
        </div>

        <div className="mt-8 border-t border-gray-100 pt-6">
          <div className="text-sm font-semibold text-primary">Needs Assessment</div>
          <div className="mt-4 rounded-xl border border-default bg-muted px-4 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <div className="text-xs text-muted">Latest Results (Nov 15, 2025)</div>
              <div className="mt-2 flex flex-wrap gap-2">
                <span className="rounded-full bg-muted px-3 py-1 text-[10px] text-muted">High Anxiety</span>
                <span className="rounded-full bg-muted px-3 py-1 text-[10px] text-muted">Need Motivation</span>
              </div>
            </div>
            <button className="rounded-md border border-default px-3 py-2 text-xs text-muted">
              Retake Assessment
            </button>
          </div>
        </div>

        <div className="mt-8 border-t border-gray-100 pt-6">
          <div className="text-sm font-semibold text-primary">Session Preferences</div>
          <div className="mt-4 grid md:grid-cols-2 gap-4">
            <div>
              <label id="profileLangLabel" className="text-xs text-muted">Preferred Language</label>
              <div className="relative mt-1" tabIndex={0} onBlur={() => setLangOpen(false)}>
                <button
                  type="button"
                  className="w-full rounded-md border border-default px-3 py-2 text-sm text-left focus:outline-none focus:ring-0 focus:border-accent"
                  onClick={() => setLangOpen((o) => !o)}
                  aria-haspopup="listbox"
                  aria-expanded={langOpen}
                  aria-labelledby="profileLangLabel"
                >
                  {langValue}
                </button>
                {langOpen && (
                  <ul
                    className="absolute z-10 mt-1 w-full rounded-md border border-accent bg-accent text-on-accent text-sm shadow"
                    role="listbox"
                  >
                    {langOptions.map((opt) => (
                      <li key={opt}>
                        <button
                          type="button"
                          className="w-full text-left px-3 py-2 hover:bg-gray-800"
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => {
                            setLangValue(opt);
                            setLangOpen(false);
                          }}
                        >
                          {opt}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
            <div>
              <label id="profileStyleLabel" className="text-xs text-muted">Preferred Mentor Style</label>
              <div className="relative mt-1" tabIndex={0} onBlur={() => setStyleOpen(false)}>
                <button
                  type="button"
                  className="w-full rounded-md border border-default px-3 py-2 text-sm text-left focus:outline-none focus:ring-0 focus:border-accent"
                  onClick={() => setStyleOpen((o) => !o)}
                  aria-haspopup="listbox"
                  aria-expanded={styleOpen}
                  aria-labelledby="profileStyleLabel"
                >
                  {styleValue}
                </button>
                {styleOpen && (
                  <ul
                    className="absolute z-10 mt-1 w-full rounded-md border border-accent bg-accent text-on-accent text-sm shadow"
                    role="listbox"
                  >
                    {styleOptions.map((opt) => (
                      <li key={opt}>
                        <button
                          type="button"
                          className="w-full text-left px-3 py-2 hover:bg-gray-800"
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => {
                            setStyleValue(opt);
                            setStyleOpen(false);
                          }}
                        >
                          {opt}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>

          <div className="mt-4">
            <div className="flex items-center justify-between text-xs text-muted">
              <span>Comfort talking to new people</span>
              <span>Moderate</span>
            </div>
            <input type="range" className="mt-2 w-full accent-gray-900" />
            <div className="flex items-center justify-between text-[10px] text-subtle">
              <span>Shy</span>
              <span>Very Outgoing</span>
            </div>
          </div>
        </div>

        <button className="mt-6 w-full sm:w-auto rounded-md bg-accent text-on-accent px-6 py-2 text-sm">
          Update Profile
        </button>
      </div>
    </div>
  );
};

export default Profile;
