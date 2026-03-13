import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CheckCircle2, AlertCircle, X } from 'lucide-react';
import logo from '../assets/logo.png';
import leftside from '../assets/Leftside.png';
import { useMenteeAuth } from '../../apis/apihook/useMenteeAuth';
import {
  setPendingMenteeRegistration,
  setAssessmentDraft,
} from '../../apis/api/storage';
import '../LandingPage.css';
import './Register.css';

const STUDENT_MIN_AGE = 13;
const STUDENT_MAX_AGE = 18;

const yearsAgo = (years) => {
  const today = new Date();
  const cloned = new Date(today);
  cloned.setFullYear(today.getFullYear() - years);
  return cloned;
};

const toDateInputValue = (value) => {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, '0');
  const day = String(value.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const getStudentDobBounds = () => ({
  min: toDateInputValue(yearsAgo(STUDENT_MAX_AGE)),
  max: toDateInputValue(yearsAgo(STUDENT_MIN_AGE)),
});

const getFriendlyErrorMessage = (error, fallback = 'Unable to create account right now.') => {
  const payload = error?.data;
  if (payload && typeof payload === 'object') {
    const priorityKeys = ['parent_mobile', 'email', 'non_field_errors', 'detail', 'message'];
    for (const key of priorityKeys) {
      const value = payload?.[key];
      if (typeof value === 'string' && value.trim()) return value.trim();
      if (Array.isArray(value) && value.length) {
        const first = value.find((item) => typeof item === 'string' && item.trim());
        if (first) return first.trim();
      }
    }

    const firstFieldValue = Object.values(payload).find((value) => {
      if (typeof value === 'string' && value.trim()) return true;
      return Array.isArray(value) && value.some((item) => typeof item === 'string' && item.trim());
    });
    if (typeof firstFieldValue === 'string' && firstFieldValue.trim()) {
      return firstFieldValue.trim();
    }
    if (Array.isArray(firstFieldValue)) {
      const first = firstFieldValue.find((item) => typeof item === 'string' && item.trim());
      if (first) return first.trim();
    }
  }

  if (typeof error?.message === 'string' && error.message.trim()) {
    return error.message.trim();
  }
  return fallback;
};

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
  const [infoMessage, setInfoMessage] = useState('');
  const [otpHint, setOtpHint] = useState('');
  const [toastState, setToastState] = useState({
    open: false,
    message: '',
    type: 'success',
  });
  const navigate = useNavigate();
  const { loading, registerMentee, sendParentOtp } = useMenteeAuth();
  const gradeOptions = ['10th Grade', '11th Grade', '12th Grade'];
  const genderOptions = ['Female', 'Male'];
  const dobBounds = getStudentDobBounds();

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
    setInfoMessage('');
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

    if (form.dob < dobBounds.min || form.dob > dobBounds.max) {
      setErrorMessage(`Student age must be between ${STUDENT_MIN_AGE} and ${STUDENT_MAX_AGE} years.`);
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
        setInfoMessage('OTP sent successfully.');
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
      setErrorMessage(getFriendlyErrorMessage(err));
    }
  };

  useEffect(() => {
    if (!errorMessage) return;
    setToastState({ open: true, message: errorMessage, type: 'error' });
  }, [errorMessage]);

  useEffect(() => {
    if (!infoMessage && !otpHint) return;
    const details = otpHint ? ` ${otpHint}` : '';
    setToastState({
      open: true,
      message: `${infoMessage || 'Success.'}${details}`.trim(),
      type: 'success',
    });
  }, [infoMessage, otpHint]);

  useEffect(() => {
    if (!toastState.open) return undefined;
    const timer = window.setTimeout(() => {
      setToastState((prev) => ({ ...prev, open: false }));
    }, 3500);
    return () => window.clearTimeout(timer);
  }, [toastState.open, toastState.message]);

  return (
    <div className="lp lp-register">
      {toastState.open && (
        <div className={`lp-toast lp-toast-${toastState.type}`} role="status" aria-live="polite">
          <div className="lp-toast-icon">
            {toastState.type === 'error' ? <AlertCircle size={18} /> : <CheckCircle2 size={18} />}
          </div>
          <p>{toastState.message}</p>
          <button
            type="button"
            className="lp-toast-close"
            aria-label="Close notification"
            onClick={() => setToastState((prev) => ({ ...prev, open: false }))}
          >
            <X size={14} />
          </button>
        </div>
      )}

      <header className="lp-hdr">
        <Link to="/" className="lp-logo" aria-label="Go to landing page">
          <img src={logo} alt="Bond Room" />
          <span>Bridging Old and New Destinies</span>
        </Link>

        <nav className="lp-nav">
          <Link to="/">Home</Link>
          <a href="/#about">About</a>
          <a href="/#safety">Safety</a>
        </nav>

        <div className="lp-hdr-actions">
          <Link to="/login" className="lp-ghost">Log in</Link>
        </div>
      </header>

      <main className="lp-register-main">
        <div className="lp-register-orb lp-register-orb-a" />
        <div className="lp-register-orb lp-register-orb-b" />

        <div className="lp-register-shell">
          <div className="lp-register-grid">
            <aside className="lp-register-side lp-register-side-clean" aria-hidden="true">
              <img src={leftside} alt="" className="lp-register-side-image" />
            </aside>

            <section className="lp-register-form-wrap">
              <div className="lp-login-pill">
                <span className="lp-login-pill-dot" />
                Student registration
              </div>
              <h2 className="lp-register-h2">Create your Bond Room account</h2>
              <p className="lp-register-sub">You don&apos;t have to carry this alone.</p>

              <form className="lp-register-form" onSubmit={handleSubmit}>
                <div className="lp-register-row">
                  <div className="lp-field">
                    <label htmlFor="firstName">First Name</label>
                    <input
                      id="firstName"
                      className="lp-input"
                      placeholder="e.g. Priya"
                      value={form.firstName}
                      onChange={(event) => updateField('firstName', event.target.value)}
                    />
                  </div>
                  <div className="lp-field">
                    <label htmlFor="lastName">Last Name</label>
                    <input
                      id="lastName"
                      className="lp-input"
                      placeholder="e.g. Sharma"
                      value={form.lastName}
                      onChange={(event) => updateField('lastName', event.target.value)}
                    />
                  </div>
                </div>

                <div className="lp-register-row">
                  <div className="lp-field">
                    <label id="registerGradeLabel">Grade</label>
                    <div className="lp-select-wrap" tabIndex={0} onBlur={() => setGradeOpen(false)}>
                      <button
                        type="button"
                        className="lp-input lp-select-trigger"
                        onClick={() => setGradeOpen((open) => !open)}
                        aria-haspopup="listbox"
                        aria-expanded={gradeOpen}
                        aria-labelledby="registerGradeLabel"
                      >
                        {form.grade || 'Select Grade'}
                      </button>
                      {gradeOpen && (
                        <ul className="lp-select-options" role="listbox">
                          {gradeOptions.map((opt) => (
                            <li key={opt}>
                              <button
                                type="button"
                                className="lp-select-option"
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

                  <div className="lp-field">
                    <label htmlFor="email">Email Address</label>
                    <input
                      id="email"
                      type="email"
                      className="lp-input"
                      placeholder="student@example.com"
                      value={form.email}
                      onChange={(event) => updateField('email', event.target.value)}
                    />
                  </div>
                </div>

                <div className="lp-register-row">
                  <div className="lp-field">
                    <label htmlFor="dob">Date of Birth</label>
                    <input
                      id="dob"
                      type="date"
                      className="lp-input"
                      value={form.dob}
                      onChange={(event) => updateField('dob', event.target.value)}
                      min={dobBounds.min}
                      max={dobBounds.max}
                    />
                    <p className="lp-register-note">Allowed age: {STUDENT_MIN_AGE} to {STUDENT_MAX_AGE} years</p>
                  </div>

                  <div className="lp-field">
                    <label id="registerGenderLabel">Gender</label>
                    <div className="lp-select-wrap" tabIndex={0} onBlur={() => setGenderOpen(false)}>
                      <button
                        type="button"
                        className="lp-input lp-select-trigger"
                        onClick={() => setGenderOpen((open) => !open)}
                        aria-haspopup="listbox"
                        aria-expanded={genderOpen}
                        aria-labelledby="registerGenderLabel"
                      >
                        {form.gender || 'Select Gender'}
                      </button>
                      {genderOpen && (
                        <ul className="lp-select-options" role="listbox">
                          {genderOptions.map((opt) => (
                            <li key={opt}>
                              <button
                                type="button"
                                className="lp-select-option"
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

                <div className="lp-register-consent-box">
                  <label className="lp-register-checkline">
                    <input
                      id="parentMobileOpt"
                      type="checkbox"
                      checked={form.parentConsent}
                      onChange={(event) => updateField('parentConsent', event.target.checked)}
                    />
                    <span>Parent / Guardian Consent</span>
                  </label>
                  <p className="lp-register-note">
                    We&apos;ll send an OTP to inform your parent/guardian that you&apos;re joining Bond Room.
                  </p>
                  <div className="lp-register-mobile-row">
                    <div className="lp-register-country" aria-hidden="true">+91</div>
                    <input
                      id="parentMobile"
                      className="lp-input"
                      placeholder="98765 43210"
                      aria-label="Parent mobile number"
                      value={form.parentMobile}
                      onChange={(event) => updateField('parentMobile', event.target.value)}
                    />
                  </div>
                </div>

                <label className="lp-register-checkline">
                  <input
                    id="recordConsent"
                    type="checkbox"
                    checked={form.recordConsent}
                    onChange={(event) => updateField('recordConsent', event.target.checked)}
                  />
                  <span>
                    I Agree to Session Recording for Safety
                    <span className="lp-register-note lp-register-note-block">
                      All sessions are recorded to ensure student safety and quality of mentorship.
                    </span>
                  </span>
                </label>

                <button
                  type="submit"
                  className="lp-login-submit"
                  disabled={loading}
                >
                  {loading ? 'Please wait...' : 'Continue'}
                </button>

                <p className="lp-register-terms">
                  By continuing, you agree to our <span>Terms & Conditions</span> and <span>Privacy Policy</span>
                </p>
              </form>
            </section>
          </div>
        </div>
      </main>

      <footer className="lp-footer lp-login-footer">
        <div className="lp-footer-btm">
          <span>(c) 2026 Bond Room Platform. All rights reserved.</span>
          <span className="lp-login-footer-links">
            <a href="#">Privacy</a>
            <a href="#">Terms</a>
            <a href="#">Support</a>
          </span>
        </div>
      </footer>
    </div>
  );
};

export default Register;
