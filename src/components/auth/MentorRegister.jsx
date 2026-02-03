import React, { useState } from 'react';
import TopAuth from './TopAuth';
import BottomAuth from './BottomAuth';
import { useNavigate } from 'react-router-dom';
import leftside from '../assets/mentor2.png';

const MentorRegister = () => {
  const [selectedLanguages, setSelectedLanguages] = useState([]);
  const languagesOptions = ['Tamil', 'English', 'Telugu', 'Kannada'];

  const toggleLanguage = (lang) => {
    setSelectedLanguages((prev) => (
      prev.includes(lang) ? prev.filter((item) => item != lang) : [...prev, lang]
    ));
  };
  const [roleValue, setRoleValue] = useState('Mentor');
  const [roleOpen, setRoleOpen] = useState(false);
  const navigate = useNavigate();
  const roleOptions = ['Mentor', 'Student'];

  const handleRoleSelect = (nextRole) => {
    setRoleValue(nextRole);
    setRoleOpen(false);
    try {
      localStorage.setItem('userRole', nextRole === 'Student' ? 'menties' : 'mentors');
    } catch {
      // ignore storage errors
    }
    if (nextRole === 'Student') {
      navigate('/register');
    }
  };
  const handleRoleTriggerKeyDown = (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      setRoleOpen((o) => !o);
    }
    if (event.key === 'Escape') {
      setRoleOpen(false);
    }
  };
  return (
    <div className="min-h-screen bg-[#f4f2f7] text-primary flex flex-col">
      <TopAuth />

      <main className="flex-1">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-20 py-8 sm:py-10">
          <div className="border border-[#e6e2f1] rounded-2xl overflow-hidden bg-white shadow-sm">
            <div className="grid md:grid-cols-[1.05fr_1fr]">
              <div className="hidden md:block bg-[#f8f6fb]">
                <img
                  src={leftside}
                  alt="Find your safe space"
                  className="h-full w-full object-cover"
                />
              </div>

              <div className="p-6 sm:p-8 lg:p-10 bg-[#f7f5fa]">
                <div className="inline-flex items-center rounded-full bg-[#ede7f6] text-xs text-[#6b4eff] px-3 py-1 font-medium">
                  Step 1 of 5
                </div>
                <h2 className="mt-3 text-lg sm:text-2xl font-semibold text-[#1f2937]">
                  Apply as a Mentor
                </h2>
                <p className="mt-1 text-sm text-[#6b7280]">Share your experience and guide students with care.</p>
                <p className="mt-4 text-sm text-[#6b7280]">
                  Bond Room connects students with trusted mentors who listen without judgment.
                  Tell us about yourself so we can match you thoughtfully.
                </p>

                <form className="mt-6 space-y-4">
                  <div>
                    <label id="mentorRegisterRoleLabel" className="text-xs text-muted">Registering as</label>
                    <div className="relative mt-1" tabIndex={0} onBlur={() => setRoleOpen(false)} onKeyDown={handleRoleTriggerKeyDown}>
                      <button
                        type="button"
                        className="w-full rounded-md border border-[#d7d0e2] bg-white px-3 py-2 text-sm text-left"
                        onClick={() => setRoleOpen((o) => !o)}
                        aria-haspopup="listbox"
                        aria-expanded={roleOpen}
                        aria-labelledby="mentorRegisterRoleLabel"
                        aria-controls="mentorRegisterRoleList"
                      >
                        {roleValue}
                      </button>
                      {roleOpen && (
                        <ul
                          id="mentorRegisterRoleList"
                          className="absolute z-10 mt-1 w-full rounded-md border border-default bg-surface text-primary text-sm shadow"
                          role="listbox"
                        >
                          {roleOptions.map((opt) => (
                            <li key={opt} role="presentation">
                              <button
                                type="button"
                                className="w-full text-left px-3 py-2 hover:bg-muted"
                                onMouseDown={(e) => e.preventDefault()}
                                onClick={() => handleRoleSelect(opt)}
                                role="option"
                                aria-selected={roleValue === opt}
                              >
                                {opt}
                              </button>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="firstName" className="text-xs text-muted">First name</label>
                      <input id="firstName" className="mt-1 w-full rounded-md border border-[#d7d0e2] bg-white px-3 py-2 text-sm" placeholder="e.g. Priya" />
                    </div>
                    <div>
                      <label htmlFor="lastName" className="text-xs text-muted">Last name</label>
                      <input id="lastName" className="mt-1 w-full rounded-md border border-[#d7d0e2] bg-white px-3 py-2 text-sm" placeholder="e.g. Sharma" />
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="email" className="text-xs text-muted">Email</label>
                      <input id="email" type="email" className="mt-1 w-full rounded-md border border-[#d7d0e2] bg-white px-3 py-2 text-sm" placeholder="name@example.com" />
                    </div>
                    <div>
                      <label htmlFor="mobile" className="text-xs text-muted">Mobile Number</label>
                      <input id="mobile" className="mt-1 w-full rounded-md border border-[#d7d0e2] bg-white px-3 py-2 text-sm" placeholder="+91 98765 43210" />
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="dob" className="text-xs text-muted">Date of Birth</label>
                      <input id="dob" className="mt-1 w-full rounded-md border border-[#d7d0e2] bg-white px-3 py-2 text-sm" placeholder="dd/mm/yyyy" />
                    </div>
                    <div>
                      <label htmlFor="gender" className="text-xs text-muted">Gender</label>
                      <select id="gender" className="mt-1 w-full rounded-md border border-[#d7d0e2] bg-white px-3 py-2 text-sm text-muted">
                        <option value="">Select Gender</option>
                        <option>Female</option>
                        <option>Male</option>
                        <option>Non-binary</option>
                        <option>Prefer not to say</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label htmlFor="cityState" className="text-xs text-muted">City / State</label>
                    <input id="cityState" className="mt-1 w-full rounded-md border border-[#d7d0e2] bg-white px-3 py-2 text-sm" placeholder="e.g. Tiruchirappalli, Tamil Nadu" />
                  </div>

                  <div>
                    <label id="languagesLabel" className="text-xs text-muted">Languages Spoken</label>
                    <div
                      className="mt-1 w-full rounded-md border border-[#d7d0e2] bg-white p-2 text-sm text-primary max-h-28 overflow-y-auto"
                      role="group"
                      aria-labelledby="languagesLabel"
                    >
                      {languagesOptions.map((lang) => (
                        <button
                          key={lang}
                          type="button"
                          className={`w-full text-left px-2 py-1 rounded-md border ${selectedLanguages.includes(lang) ? 'border-[#5D3699] bg-[#5D3699] text-white' : 'border-transparent hover:bg-muted'}`}
                          onClick={() => toggleLanguage(lang)}
                          aria-pressed={selectedLanguages.includes(lang)}
                        >
                          {lang}
                        </button>
                      ))}
                    </div>
                    <p className="text-xs text-muted mt-1">Click to select multiple</p>
                  </div>

                  <div>
                    <label htmlFor="qualification" className="text-xs text-muted">Educational Qualification</label>
                    <input id="qualification" className="mt-1 w-full rounded-md border border-[#d7d0e2] bg-white px-3 py-2 text-sm" placeholder="e.g. PhD in Psychology" />
                  </div>

                  <div>
                    <label htmlFor="bio" className="text-xs text-muted">Brief Bio</label>
                    <textarea
                      id="bio"
                      rows={3}
                      className="mt-1 w-full rounded-md border border-[#d7d0e2] bg-white px-3 py-2 text-sm"
                      placeholder="Tell us a bit about your professional background..."
                    />
                  </div>

                  <label className="flex items-start gap-2 text-sm text-secondary">
                    <input id="consent" type="checkbox" className="mt-1" />
                    <span>I agree to share my information for background verification purposes.</span>
                  </label>

                  <button
                    type="button"
                    className="w-full rounded-md bg-[#5D3699] text-white py-2.5 text-sm"
                    onClick={() => navigate('/mentor-verify-identity')}
                  >
                    Submit Application
                  </button>
                  <p className="text-center text-xs text-muted">
                    By continuing, you agree to our <span className="underline">Terms &amp; Conditions</span> and <span className="underline">Privacy Policy</span>
                  </p>
                </form>
              </div>
            </div>
          </div>
        </div>
      </main>

      <BottomAuth />
    </div>
  );
};

export default MentorRegister;
