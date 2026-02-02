import React, { useState } from 'react';
import TopAuth from './TopAuth';
import BottomAuth from './BottomAuth';
import { Link } from 'react-router-dom';
import logo from '../assets/i.png';

const Register = () => {
  const [gradeOpen, setGradeOpen] = useState(false);
  const [gradeValue, setGradeValue] = useState('Select');
  const [genderOpen, setGenderOpen] = useState(false);
  const [genderValue, setGenderValue] = useState('Select Gender');
  const gradeOptions = ['9th Grade', '10th Grade', '11th Grade', '12th Grade'];
  const genderOptions = ['Female', 'Male', 'Non-binary', 'Prefer not to say'];
  return (
    <div className="min-h-screen bg-surface text-primary flex flex-col">
      <TopAuth />

      <main className="flex-1">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-20 py-8 sm:py-10">
          <div className="border border-default rounded-2xl overflow-hidden bg-surface shadow-sm">
            <div className="grid md:grid-cols-2">
              <div className="bg-muted p-8 sm:p-10 flex flex-col items-center justify-center text-center">
                <div className="h-20 w-20 sm:h-24 sm:w-24 rounded-full bg-accent flex items-center justify-center">
                  <img src={logo} alt="Bond Room" className="h-6 w-6" />
                </div>
                <h3 className="mt-6 sm:mt-8 text-base font-semibold text-secondary">Find Your Safe Space</h3>
                <p className="mt-2 text-sm text-muted max-w-xs">
                  Connect with mentors who understand your journey.
                </p>
              </div>

              <div className="p-6 sm:p-8 lg:p-10">
                <div className="inline-flex items-center rounded-full bg-muted text-xs text-muted px-3 py-1">
                  Step 1 of 3
                </div>
                <h2 className="mt-3 text-lg sm:text-xl font-semibold text-primary">Create your account</h2>
                <p className="mt-1 text-sm text-muted">Join a community dedicated to student well-being.</p>

                <form className="mt-6 space-y-4">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="firstName" className="text-xs text-muted">First name</label>
                      <input id="firstName" className="mt-1 w-full rounded-md border border-default px-3 py-2 text-sm" placeholder="e.g. Priya" />
                    </div>
                    <div>
                      <label htmlFor="lastName" className="text-xs text-muted">Last name</label>
                      <input id="lastName" className="mt-1 w-full rounded-md border border-default px-3 py-2 text-sm" placeholder="e.g. Sharma" />
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label id="registerGradeLabel" className="text-xs text-muted">Grade</label>
                      <div className="relative mt-1" tabIndex={0} onBlur={() => setGradeOpen(false)}>
                        <button
                          type="button"
                          className="w-full rounded-md border border-default px-3 py-2 text-sm text-left"
                          onClick={() => setGradeOpen((o) => !o)}
                          aria-haspopup="listbox"
                          aria-expanded={gradeOpen}
                          aria-labelledby="registerGradeLabel"
                        >
                          {gradeValue}
                        </button>
                        {gradeOpen && (
                          <ul className="absolute z-10 mt-1 w-full rounded-md border border-accent bg-accent text-on-accent text-sm shadow" role="listbox">
                            {gradeOptions.map((opt) => (
                              <li key={opt}>
                                <button
                                  type="button"
                                  className="w-full text-left px-3 py-2 hover:bg-black/80"
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
                      <label htmlFor="email" className="text-xs text-muted">Email Address</label>
                      <input id="email" type="email" className="mt-1 w-full rounded-md border border-default px-3 py-2 text-sm" placeholder="student@example.com" />
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="dob" className="text-xs text-muted">Date of Birth</label>
                      <input id="dob" className="mt-1 w-full rounded-md border border-default px-3 py-2 text-sm" placeholder="dd/mm/yyyy" />
                    </div>
                    <div>
                      <label id="registerGenderLabel" className="text-xs text-muted">Gender</label>
                      <div className="relative mt-1" tabIndex={0} onBlur={() => setGenderOpen(false)}>
                        <button
                          type="button"
                          className="w-full rounded-md border border-default px-3 py-2 text-sm text-left"
                          onClick={() => setGenderOpen((o) => !o)}
                          aria-haspopup="listbox"
                          aria-expanded={genderOpen}
                          aria-labelledby="registerGenderLabel"
                        >
                          {genderValue}
                        </button>
                        {genderOpen && (
                          <ul className="absolute z-10 mt-1 w-full rounded-md border border-accent bg-accent text-on-accent text-sm shadow" role="listbox">
                            {genderOptions.map((opt) => (
                              <li key={opt}>
                                <button
                                  type="button"
                                  className="w-full text-left px-3 py-2 hover:bg-black/80"
                                  onMouseDown={(e) => e.preventDefault()}
                                  onClick={() => {
                                    setGenderValue(opt);
                                    setGenderOpen(false);
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

                  <div className="rounded-lg border border-default p-3">
                    <label className="flex items-start gap-2 text-sm text-secondary">
                      <input id="parentMobileOpt" type="checkbox" className="mt-1" />
                      <span>Parent's Mobile Number</span>
                    </label>
                    <p className="text-xs text-muted mt-1">Required for parental consent verification.</p>
                    <div className="mt-3 flex flex-col sm:flex-row gap-2">
                      <div className="w-full sm:w-20 rounded-md border border-default px-3 py-2 text-sm text-muted" aria-hidden="true">+91</div>
                      <input id="parentMobile" className="flex-1 rounded-md border border-default px-3 py-2 text-sm" placeholder="98765 43210" aria-label="Parent mobile number" />
                    </div>
                  </div>

                  <label className="flex items-start gap-2 text-sm text-secondary">
                    <input id="recordConsent" type="checkbox" className="mt-1" />
                    <span>
                      I Agree to Session Recording for Safety
                      <span className="block text-xs text-muted">All sessions are recorded to ensure student safety and quality of mentorship. Learn more.</span>
                    </span>
                  </label>

                  <Link
                    to="/verify-parent"
                    className="block w-full rounded-md bg-accent text-on-accent py-2.5 text-sm text-center"
                  >
                    Continue
                  </Link>
                  <p className="text-center text-xs text-muted">
                    By continuing, you agree to our <span className="underline">Terms & Conditions</span> and <span className="underline">Privacy Policy</span>
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

export default Register;
