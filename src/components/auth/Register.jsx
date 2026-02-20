import React, { useState } from 'react';
import TopAuth from './TopAuth';
import BottomAuth from './BottomAuth';
import { useNavigate } from 'react-router-dom';
import leftside from '../assets/Leftside.png';
import { useMenteeAuth } from '../../apis/apihook/useMenteeAuth';
import {
  setPendingMenteeRegistration,
  setAssessmentDraft,
} from '../../apis/api/storage';

const initialForm = {
  firstName: '',
  lastName: '',
  grade: '',
  email: '',
  dob: '',
  gender: '',
  parentConsent: false,
  parentMobile: '',
  recordConsent: false,
};

const Register = () => {
  const [gradeOpen, setGradeOpen] = useState(false);
  const [genderOpen, setGenderOpen] = useState(false);
  const [form, setForm] = useState(initialForm);
  const [errorMessage, setErrorMessage] = useState('');
  const [otpHint, setOtpHint] = useState('');
  const navigate = useNavigate();
  const { loading, registerMentee, sendParentOtp } = useMenteeAuth();
  const gradeOptions = ['10th Grade', '11th Grade', '12th Grade'];
  const genderOptions = ['Female', 'Male'];

  const updateField = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const maskMobile = (value) => {
    if (!value) return '';
    const cleaned = value.replace(/\D/g, '');
    if (cleaned.length <= 4) return cleaned;
    return `${'*'.repeat(Math.max(cleaned.length - 4, 0))}${cleaned.slice(-4)}`;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setErrorMessage('');
    setOtpHint('');

    if (!form.firstName || !form.lastName || !form.grade || !form.email || !form.dob || !form.gender) {
      setErrorMessage('Please fill all required fields to continue.');
      return;
    }

    if (!form.parentConsent) {
      setErrorMessage('Parent / Guardian consent is required to continue.');
      return;
    }

    if (!form.parentMobile.trim()) {
      setErrorMessage('Parent mobile number is required for OTP verification.');
      return;
    }

    try {
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Kolkata';
      const mentee = await registerMentee({
        first_name: form.firstName.trim(),
        last_name: form.lastName.trim(),
        grade: form.grade,
        email: form.email.trim().toLowerCase(),
        dob: form.dob,
        gender: form.gender,
        timezone,
        parent_guardian_consent: form.parentConsent,
        parent_mobile: form.parentMobile.trim(),
        record_consent: form.recordConsent,
      });

      const otpResponse = await sendParentOtp(mentee.id, form.parentMobile.trim());
      if (otpResponse?.otp) {
        setOtpHint(`Test OTP: ${otpResponse.otp}`);
      }

      setPendingMenteeRegistration({
        menteeId: mentee.id,
        email: form.email.trim().toLowerCase(),
        parentMobile: form.parentMobile.trim(),
      });
      setAssessmentDraft({});

      navigate('/verify-parent', {
        state: {
          parentMobileMasked: maskMobile(form.parentMobile.trim()),
        },
      });
    } catch (err) {
      setErrorMessage(err?.message || 'Unable to create account right now.');
    }
  };

  return (
    <div className="min-h-screen bg-[#f4f2f7] text-primary flex flex-col">
      <TopAuth />

      <main className="flex-1">
        <div className="w-full flex justify-center px-4 sm:px-6 py-6 sm:py-10">
          <div className="border border-[#e6e2f1] rounded-b-[12px] overflow-hidden bg-white shadow-sm w-full max-w-[1266px] xl:min-h-[790px]">
            <div className="grid grid-cols-1 xl:grid-cols-[591px_675px] xl:min-h-[788px]">
              <div className="hidden xl:block bg-[#f8f6fb] w-[591px] min-h-[788px]">
                <img
                  src={leftside}
                  alt="Find your safe space"
                  className="h-full w-full object-cover"
                />
              </div>

              <div className="p-6 sm:p-8 lg:p-10 bg-[#f7f5fa] w-full xl:w-[675px] xl:min-h-[788px]">
                <div className="inline-flex items-center rounded-full bg-[#ede7f6] text-xs text-[#6b4eff] px-3 py-1 font-medium">
                  Step 1 of 3
                </div>
                <h2 className="mt-3 text-lg sm:text-2xl font-semibold text-[#1f2937]">
                  Create your Bond Room account
                </h2>
                <p className="mt-1 text-sm text-[#6b7280]">You don&apos;t have to carry this alone.</p>
                <p className="mt-4 text-sm text-[#6b7280]">
                  Preparing for exams like JEE, NEET, CLAT, or board exams can feel overwhelming.
                  Bond Room connects you with trusted elders who listen—without judgment or pressure.
                </p>

                <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="firstName" className="text-xs text-muted">First name</label>
                      <input
                        id="firstName"
                        className="mt-1 w-full rounded-md border border-[#d7d0e2] bg-white px-3 py-2 text-sm"
                        placeholder="e.g. Priya"
                        value={form.firstName}
                        onChange={(event) => updateField('firstName', event.target.value)}
                      />
                    </div>
                    <div>
                      <label htmlFor="lastName" className="text-xs text-muted">Last name</label>
                      <input
                        id="lastName"
                        className="mt-1 w-full rounded-md border border-[#d7d0e2] bg-white px-3 py-2 text-sm"
                        placeholder="e.g. Sharma"
                        value={form.lastName}
                        onChange={(event) => updateField('lastName', event.target.value)}
                      />
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label id="registerGradeLabel" className="text-xs text-muted">Grade</label>
                      <div className="relative mt-1" tabIndex={0} onBlur={() => setGradeOpen(false)}>
                        <button
                          type="button"
                          className="w-full rounded-md border border-[#d7d0e2] bg-white px-3 py-2 text-sm text-left"
                          onClick={() => setGradeOpen((o) => !o)}
                          aria-haspopup="listbox"
                          aria-expanded={gradeOpen}
                          aria-labelledby="registerGradeLabel"
                        >
                          {form.grade || 'Select'}
                        </button>
                        {gradeOpen && (
                          <ul className="absolute z-10 mt-1 w-full rounded-md border border-accent bg-accent text-on-accent text-sm shadow" role="listbox">
                            {gradeOptions.map((opt) => (
                              <li key={opt}>
                                <button
                                  type="button"
                                  className="w-full text-left px-3 py-2 hover:bg-[#5D3699]/80"
                                  onMouseDown={(e) => e.preventDefault()}
                                  onClick={() => {
                                    updateField('grade', opt);
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
                      <input
                        id="email"
                        type="email"
                        className="mt-1 w-full rounded-md border border-[#d7d0e2] bg-white px-3 py-2 text-sm"
                        placeholder="student@example.com"
                        value={form.email}
                        onChange={(event) => updateField('email', event.target.value)}
                      />
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="dob" className="text-xs text-muted">Date of Birth</label>
                      <input
                        id="dob"
                        type="date"
                        className="mt-1 w-full rounded-md border border-[#d7d0e2] bg-white px-3 py-2 text-sm"
                        value={form.dob}
                        onChange={(event) => updateField('dob', event.target.value)}
                      />
                    </div>
                    <div>
                      <label id="registerGenderLabel" className="text-xs text-muted">Gender</label>
                      <div className="relative mt-1" tabIndex={0} onBlur={() => setGenderOpen(false)}>
                        <button
                          type="button"
                          className="w-full rounded-md border border-[#d7d0e2] bg-white px-3 py-2 text-sm text-left"
                          onClick={() => setGenderOpen((o) => !o)}
                          aria-haspopup="listbox"
                          aria-expanded={genderOpen}
                          aria-labelledby="registerGenderLabel"
                        >
                          {form.gender || 'Select Gender'}
                        </button>
                        {genderOpen && (
                          <ul className="absolute z-10 mt-1 w-full rounded-md border border-accent bg-accent text-on-accent text-sm shadow" role="listbox">
                            {genderOptions.map((opt) => (
                              <li key={opt}>
                                <button
                                  type="button"
                                  className="w-full text-left px-3 py-2 hover:bg-[#5D3699]/80"
                                  onMouseDown={(e) => e.preventDefault()}
                                  onClick={() => {
                                    updateField('gender', opt);
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

                  <div className="rounded-lg border border-[#d7d0e2] bg-white p-3">
                    <label className="flex items-start gap-2 text-sm text-secondary">
                      <input
                        id="parentMobileOpt"
                        type="checkbox"
                        className="mt-1 accent-[#5b2c91]"
                        checked={form.parentConsent}
                        onChange={(event) => updateField('parentConsent', event.target.checked)}
                      />
                      <span>Parent / Guardian Consent</span>
                    </label>
                    <p className="text-xs text-muted mt-1">
                      We&apos;ll send an OTP to inform your parent/guardian that you&apos;re joining Bond Room.
                    </p>
                    <div className="mt-3 flex flex-col sm:flex-row gap-2">
                      <div className="w-full sm:w-20 rounded-md border border-[#d7d0e2] bg-[#f6f4fb] px-3 py-2 text-sm text-muted" aria-hidden="true">+91</div>
                      <input
                        id="parentMobile"
                        className="flex-1 rounded-md border border-[#d7d0e2] bg-white px-3 py-2 text-sm"
                        placeholder="98765 43210"
                        aria-label="Parent mobile number"
                        value={form.parentMobile}
                        onChange={(event) => updateField('parentMobile', event.target.value)}
                      />
                    </div>
                  </div>

                  <label className="flex items-start gap-2 text-sm text-secondary">
                    <input
                      id="recordConsent"
                      type="checkbox"
                      className="mt-1 accent-[#5b2c91]"
                      checked={form.recordConsent}
                      onChange={(event) => updateField('recordConsent', event.target.checked)}
                    />
                    <span>
                      I Agree to Session Recording for Safety
                      <span className="block text-xs text-muted">All sessions are recorded to ensure student safety and quality of mentorship. Learn more.</span>
                    </span>
                  </label>

                  {errorMessage && <p className="text-sm text-red-600">{errorMessage}</p>}
                  {!errorMessage && otpHint && <p className="text-sm text-[#5b2c91]">{otpHint}</p>}

                  <button
                    type="submit"
                    className="block w-full rounded-md bg-[#5b2c91] text-white py-2.5 text-sm text-center disabled:opacity-70"
                    disabled={loading}
                  >
                    {loading ? 'Please wait...' : 'Continue'}
                  </button>
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
