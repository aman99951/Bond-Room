import React, { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { CheckCircle2, AlertCircle, X, UserRound, MapPin, ShieldCheck, Camera } from 'lucide-react';
import { Eye, EyeOff } from 'lucide-react';
import TopAuth from './TopAuth';
import BottomAuth from './BottomAuth';
import mentorLeft from '../assets/teach1.png';
import mentorBottom from '../assets/teach2.png';
import imageContainer from '../assets/Image Container.png';
import { authApi } from '../../apis/api/authApi';
import { setAssessmentDraft } from '../../apis/api/storage';
import { useMenteeAuth } from '../../apis/apihook/useMenteeAuth';
import BoundedDatePicker from '../shared/BoundedDatePicker';
import '../LandingPage.css';
import './Register.css';

const STUDENT_MIN_AGE = 13;
const STUDENT_MAX_AGE = 18;
const MOBILE_DIGITS_LENGTH = 10;
const COUNTRY_OPTIONS = ['India', 'USA'];
const COUNTRY_DIAL_CODE = {
  India: '+91',
  USA: '+1',
};
const LOCATION_OPTIONS = {
  India: {
    states: ['Tamilnadu'],
    citiesByState: {
      Tamilnadu: ['Chennai'],
    },
  },
  USA: {
    states: ['Texas'],
    citiesByState: {
      Texas: ['Houston'],
    },
  },
};

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
    const priorityKeys = ['parent_mobile', 'mobile', 'email', 'password', 'non_field_errors', 'detail', 'message'];
    for (const key of priorityKeys) {
      const value = payload?.[key];
      if (typeof value === 'string' && value.trim()) return value.trim();
      if (Array.isArray(value) && value.length) {
        const first = value.find((item) => typeof item === 'string' && item.trim());
        if (first) return first.trim();
      }
    }
  }
  if (typeof error?.message === 'string' && error.message.trim()) return error.message.trim();
  return fallback;
};

const initialForm = {
  firstName: '',
  lastName: '',
  grade: '',
  email: '',
  password: '',
  dob: '',
  gender: '',
  parentConsent: true,
  parentMobile: '',
  menteeMobile: '',
  menteeSameAsParent: true,
  schoolOrCollege: '',
  country: 'India',
  state: 'Tamilnadu',
  city: 'Chennai',
  postalCode: '',
  recordConsent: false,
};

const normalizePhone = (value) => String(value || '').replace(/\D/g, '');
const MENTEE_REGISTER_DRAFT_KEY = 'bondroom:mentee-register-draft:v1';

const readMenteeRegisterDraft = () => {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(MENTEE_REGISTER_DRAFT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return null;
    return parsed;
  } catch {
    return null;
  }
};

const clearMenteeRegisterDraft = () => {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(MENTEE_REGISTER_DRAFT_KEY);
  } catch {
    // ignore storage errors
  }
};

const PASSWORD_REQUIREMENT_MESSAGE =
  'Password must be at least 10 characters and include uppercase, lowercase, number, and special character.';

const isStrongPassword = (value) => {
  const password = String(value || '');
  if (password.length < 10) return false;
  if (!/[A-Z]/.test(password)) return false;
  if (!/[a-z]/.test(password)) return false;
  if (!/[0-9]/.test(password)) return false;
  if (!/[^A-Za-z0-9]/.test(password)) return false;
  return true;
};

const getPasswordChecks = (value) => {
  const password = String(value || '');
  return [
    { key: 'length', label: 'At least 10 characters', ok: password.length >= 10 },
    { key: 'upper', label: 'One uppercase letter (A-Z)', ok: /[A-Z]/.test(password) },
    { key: 'lower', label: 'One lowercase letter (a-z)', ok: /[a-z]/.test(password) },
    { key: 'number', label: 'One number (0-9)', ok: /[0-9]/.test(password) },
    { key: 'special', label: 'One special character', ok: /[^A-Za-z0-9]/.test(password) },
  ];
};

const Register = () => {
  const location = useLocation();
  const [gradeOpen, setGradeOpen] = useState(false);
  const [genderOpen, setGenderOpen] = useState(false);
  const [form, setForm] = useState(initialForm);
  const [touchedFields, setTouchedFields] = useState({});
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [errorSignal, setErrorSignal] = useState(0);
  const [infoMessage, setInfoMessage] = useState('');
  const [toastState, setToastState] = useState({
    open: false,
    message: '',
    type: 'success',
  });
  const [emailVerified, setEmailVerified] = useState(false);
  const [parentMobileVerified, setParentMobileVerified] = useState(false);
  const [menteeMobileVerified, setMenteeMobileVerified] = useState(false);
  const [otpModal, setOtpModal] = useState({ open: false, channel: 'email', otp: '' });
  const [otpError, setOtpError] = useState('');
  const [otpHint, setOtpHint] = useState({ email: '', parentMobile: '', menteeMobile: '' });
  const [otpBusy, setOtpBusy] = useState({ sending: false, verifying: false });
  const [showPassword, setShowPassword] = useState(false);
  const profileImageInputRef = useRef(null);
  const [profileImageFile, setProfileImageFile] = useState(null);
  const [profileImagePreview, setProfileImagePreview] = useState('');
  const [draftReady, setDraftReady] = useState(false);
  const dialCode = COUNTRY_DIAL_CODE[form.country] || '+91';

  const navigate = useNavigate();
  const { loading, registerMentee, login } = useMenteeAuth();
  const gradeOptions = ['10th Grade', '11th Grade', '12th Grade'];
  const genderOptions = ['Female', 'Male'];
  const dobBounds = getStudentDobBounds();
  const searchParams = new URLSearchParams(location.search);
  const signupSource = searchParams.get('source') === 'event-flow' ? 'event_flow' : 'regular';
  const nextAfterRegister = searchParams.get('next') || '';
  const safeNextAfterRegister = nextAfterRegister.startsWith('/') ? nextAfterRegister : '';
  const isEventFlowLock = signupSource === 'event_flow';
  const [showVolunteerFlowLockModal, setShowVolunteerFlowLockModal] = useState(false);

  useEffect(() => {
    const draft = readMenteeRegisterDraft();
    if (!draft) return;
    if (draft.form && typeof draft.form === 'object') {
      setForm((prev) => ({ ...prev, ...draft.form }));
    }
    if (draft.touchedFields && typeof draft.touchedFields === 'object') {
      setTouchedFields(draft.touchedFields);
    }
    if (typeof draft.submitAttempted === 'boolean') {
      setSubmitAttempted(draft.submitAttempted);
    }
    if (typeof draft.emailVerified === 'boolean') {
      setEmailVerified(draft.emailVerified);
    }
    if (typeof draft.parentMobileVerified === 'boolean') {
      setParentMobileVerified(draft.parentMobileVerified);
    }
    if (typeof draft.menteeMobileVerified === 'boolean') {
      setMenteeMobileVerified(draft.menteeMobileVerified);
    }
    if (draft.otpHint && typeof draft.otpHint === 'object') {
      setOtpHint((prev) => ({ ...prev, ...draft.otpHint }));
    }
    setDraftReady(true);
    return undefined;
  }, []);

  useEffect(() => {
    if (!draftReady) {
      setDraftReady(true);
    }
  }, [draftReady]);

  useEffect(() => {
    if (!draftReady) return;
    if (typeof window === 'undefined') return;
    const payload = {
      form,
      touchedFields,
      submitAttempted,
      emailVerified,
      parentMobileVerified,
      menteeMobileVerified,
      otpHint,
      signupSource,
      safeNextAfterRegister,
    };
    try {
      window.localStorage.setItem(MENTEE_REGISTER_DRAFT_KEY, JSON.stringify(payload));
    } catch {
      // ignore storage errors
    }
  }, [
    form,
    touchedFields,
    submitAttempted,
    emailVerified,
    parentMobileVerified,
    menteeMobileVerified,
    otpHint,
    signupSource,
    safeNextAfterRegister,
    draftReady,
  ]);

  const notifyError = (message) => {
    setErrorMessage(String(message || '').trim());
    setErrorSignal((prev) => prev + 1);
  };

  const updateField = (key, value) => {
    setTouchedFields((prev) => (prev[key] ? prev : { ...prev, [key]: true }));
    if (key === 'country') {
      const nextCountry = value;
      const nextStates = LOCATION_OPTIONS[nextCountry]?.states || [];
      const nextState = nextStates[0] || '';
      const nextCities = LOCATION_OPTIONS[nextCountry]?.citiesByState?.[nextState] || [];
      const nextCity = nextCities[0] || '';
      setForm((prev) => ({
        ...prev,
        country: nextCountry,
        state: nextState,
        city: nextCity,
        postalCode: '',
      }));
      return;
    }
    if (key === 'state') {
      const nextState = value;
      const nextCities = LOCATION_OPTIONS[form.country]?.citiesByState?.[nextState] || [];
      const nextCity = nextCities[0] || '';
      setForm((prev) => ({ ...prev, state: nextState, city: nextCity }));
      return;
    }
    if (key === 'parentMobile' || key === 'menteeMobile') {
      const digitsOnly = normalizePhone(value).slice(0, MOBILE_DIGITS_LENGTH);
      if (key === 'parentMobile') {
        setForm((prev) => ({
          ...prev,
          parentMobile: digitsOnly,
          menteeMobile: prev.menteeSameAsParent ? digitsOnly : prev.menteeMobile,
        }));
      } else {
        setForm((prev) => ({ ...prev, [key]: digitsOnly }));
      }
      if (key === 'parentMobile') {
        setParentMobileVerified(false);
        setMenteeMobileVerified(form.menteeSameAsParent ? false : menteeMobileVerified);
        setOtpHint((prev) => ({ ...prev, parentMobile: '', menteeMobile: '' }));
      }
      if (key === 'menteeMobile') {
        setMenteeMobileVerified(false);
        setOtpHint((prev) => ({ ...prev, menteeMobile: '' }));
      }
      return;
    }
    if (key === 'email') {
      setEmailVerified(false);
    }
    if (key === 'menteeSameAsParent') {
      const enabled = Boolean(value);
      setForm((prev) => ({
        ...prev,
        menteeSameAsParent: enabled,
        menteeMobile: enabled ? normalizePhone(prev.parentMobile).slice(0, MOBILE_DIGITS_LENGTH) : '',
      }));
      setMenteeMobileVerified(enabled ? parentMobileVerified : false);
      setOtpHint((prev) => ({ ...prev, menteeMobile: '' }));
      return;
    }
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const markFieldTouched = (key) => {
    setTouchedFields((prev) => (prev[key] ? prev : { ...prev, [key]: true }));
  };

  const hasRequiredFieldError = (key) => {
    if (!submitAttempted && !touchedFields[key]) return false;
    if (key === 'recordConsent') return !form.recordConsent;
    if (key === 'parentMobile') {
      const digitsOnly = normalizePhone(form.parentMobile);
      return !digitsOnly || digitsOnly.length !== MOBILE_DIGITS_LENGTH;
    }
    if (key === 'menteeMobile') {
      const digitsOnly = normalizePhone(form.menteeMobile);
      if (!form.menteeSameAsParent && !digitsOnly) return true;
      return Boolean(digitsOnly && digitsOnly.length !== MOBILE_DIGITS_LENGTH);
    }
    return !String(form[key] || '').trim();
  };

  const openOtpModal = async (channel) => {
    setErrorMessage('');
    setInfoMessage('');
    setOtpError('');
    setOtpModal({ open: true, channel, otp: '' });
    await handleSendOtp(channel);
  };

  const closeOtpModal = () => {
    setOtpError('');
    setOtpModal((prev) => ({ ...prev, open: false, otp: '' }));
  };

  const handleSendOtp = async (channel) => {
    setOtpError('');
    const value =
      channel === 'email'
        ? form.email.trim().toLowerCase()
        : channel === 'parentMobile'
          ? normalizePhone(form.parentMobile)
          : normalizePhone(form.menteeMobile);
    if (!value) {
      setOtpError(
        channel === 'email'
          ? 'Enter email first.'
          : channel === 'parentMobile'
            ? 'Enter parent mobile first.'
            : 'Enter mentee mobile first.'
      );
      return;
    }
    if ((channel === 'parentMobile' || channel === 'menteeMobile') && value.length !== MOBILE_DIGITS_LENGTH) {
      setOtpError(`${channel === 'parentMobile' ? 'Parent' : 'Mentee'} mobile must be exactly 10 digits.`);
      return;
    }
    setOtpBusy((prev) => ({ ...prev, sending: true }));
    try {
      const response = await authApi.sendMentorOtp(
        channel === 'email'
          ? { channel: 'email', email: value }
          : { channel: 'phone', mobile: value }
      );
      if (response?.otp) {
        setOtpHint((prev) => ({ ...prev, [channel]: `Test OTP: ${response.otp}` }));
      }
      setInfoMessage(
        channel === 'email'
          ? 'Email OTP sent.'
          : channel === 'parentMobile'
            ? 'Parent mobile OTP sent.'
            : 'Mentee mobile OTP sent.'
      );
    } catch (err) {
      setOtpError(getFriendlyErrorMessage(err, 'Unable to send OTP.'));
    } finally {
      setOtpBusy((prev) => ({ ...prev, sending: false }));
    }
  };

  const handleVerifyOtp = async () => {
    const channel = otpModal.channel;
    const otp = otpModal.otp;
    setOtpError('');
    if (otp.length !== 6) {
      setOtpError('Please enter a valid 6-digit OTP.');
      return;
    }
    const value =
      channel === 'email'
        ? form.email.trim().toLowerCase()
        : channel === 'parentMobile'
          ? normalizePhone(form.parentMobile)
          : normalizePhone(form.menteeMobile);
    setOtpBusy((prev) => ({ ...prev, verifying: true }));
    try {
      await authApi.verifyMentorOtp(
        channel === 'email'
          ? { channel: 'email', email: value, otp }
          : { channel: 'phone', mobile: value, otp }
      );
      if (channel === 'email') {
        setEmailVerified(true);
      } else if (channel === 'parentMobile') {
        setParentMobileVerified(true);
      } else {
        setMenteeMobileVerified(true);
      }
      closeOtpModal();
      setInfoMessage(
        channel === 'email'
          ? 'Email verified.'
          : channel === 'parentMobile'
            ? 'Parent mobile verified.'
            : 'Mentee mobile verified.'
      );
    } catch (err) {
      setOtpError(getFriendlyErrorMessage(err, 'OTP verification failed.'));
    } finally {
      setOtpBusy((prev) => ({ ...prev, verifying: false }));
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitAttempted(true);
    setErrorMessage('');
    setInfoMessage('');

    if (
      !form.firstName ||
      !form.lastName ||
      !form.grade ||
      !form.email ||
      !form.password ||
      !form.dob ||
      !form.gender ||
      !form.schoolOrCollege ||
      !form.country ||
      !form.state ||
      !form.city ||
      !form.postalCode
    ) {
      notifyError('Please fill all required fields to continue.');
      return;
    }
    if (!isStrongPassword(form.password)) {
      notifyError(PASSWORD_REQUIREMENT_MESSAGE);
      return;
    }
    if (!emailVerified) {
      notifyError('Please verify email before continuing.');
      return;
    }
    if (!form.recordConsent) {
      notifyError('Session recording consent is required to continue.');
      return;
    }

    const parentMobileDigits = normalizePhone(form.parentMobile);
    if (!parentMobileDigits || parentMobileDigits.length !== MOBILE_DIGITS_LENGTH) {
      notifyError('Parent mobile number must be exactly 10 digits.');
      return;
    }
    if (!parentMobileVerified) {
      notifyError('Please verify parent mobile before continuing.');
      return;
    }

    const menteeMobileDigits = form.menteeSameAsParent
      ? parentMobileDigits
      : normalizePhone(form.menteeMobile);
    if (!form.menteeSameAsParent) {
      if (!menteeMobileDigits || menteeMobileDigits.length !== MOBILE_DIGITS_LENGTH) {
        notifyError('Mentee mobile number must be exactly 10 digits.');
        return;
      }
      if (!menteeMobileVerified) {
        notifyError('Please verify mentee mobile before continuing.');
        return;
      }
    }

    if (form.dob < dobBounds.min || form.dob > dobBounds.max) {
      notifyError(`Student age must be between ${STUDENT_MIN_AGE} and ${STUDENT_MAX_AGE} years.`);
      return;
    }

    try {
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Kolkata';
      const registrationPayload = {
        first_name: form.firstName.trim(),
        last_name: form.lastName.trim(),
        grade: form.grade,
        email: form.email.trim().toLowerCase(),
        password: form.password,
        dob: form.dob,
        gender: form.gender,
        school_or_college: form.schoolOrCollege.trim(),
        country: form.country.trim(),
        state: form.state.trim(),
        city: form.city.trim(),
        postal_code: form.postalCode.trim(),
        city_state: `${form.city}, ${form.state}, ${form.country} (${form.postalCode})`,
        timezone,
        mobile: menteeMobileDigits,
        parent_guardian_consent: true,
        parent_mobile: parentMobileDigits,
        volunteer_access: true,
        signup_source: signupSource,
        mentee_program_enabled: signupSource !== 'event_flow',
        record_consent: form.recordConsent,
      };

      const payloadToSubmit = profileImageFile
        ? (() => {
            const formData = new FormData();
            Object.entries(registrationPayload).forEach(([key, value]) => {
              if (value === null || value === undefined) return;
              if (typeof value === 'boolean') {
                formData.append(key, value ? 'true' : 'false');
                return;
              }
              formData.append(key, String(value));
            });
            formData.append('avatar', profileImageFile);
            return formData;
          })()
        : registrationPayload;

      await registerMentee(payloadToSubmit);

      await login(form.email.trim().toLowerCase(), form.password, 'menties');
      setAssessmentDraft({});
      clearMenteeRegisterDraft();
      if (signupSource === 'event_flow') {
        navigate(safeNextAfterRegister || '/dashboard');
      } else {
        navigate('/needs-assessment');
      }
    } catch (err) {
      notifyError(getFriendlyErrorMessage(err));
    }
  };

  useEffect(() => {
    if (!errorMessage) return;
    setToastState({ open: true, message: errorMessage, type: 'error' });
  }, [errorMessage, errorSignal]);

  useEffect(() => {
    if (!infoMessage) return;
    setToastState({ open: true, message: infoMessage, type: 'success' });
  }, [infoMessage]);

  useEffect(() => {
    if (!toastState.open) return undefined;
    const timer = window.setTimeout(() => {
      setToastState((prev) => ({ ...prev, open: false }));
    }, 3500);
    return () => window.clearTimeout(timer);
  }, [toastState.open, toastState.message]);

  useEffect(() => {
    return () => {
      if (profileImagePreview && profileImagePreview.startsWith('blob:')) {
        URL.revokeObjectURL(profileImagePreview);
      }
    };
  }, [profileImagePreview]);

  const handleProfileImageChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      notifyError('Please select a valid image file.');
      return;
    }
    if (profileImagePreview && profileImagePreview.startsWith('blob:')) {
      URL.revokeObjectURL(profileImagePreview);
    }
    const objectUrl = URL.createObjectURL(file);
    setProfileImageFile(file);
    setProfileImagePreview(objectUrl);
  };

  const handleCancelEventFlowRegistration = () => {
    setShowVolunteerFlowLockModal(false);
    clearMenteeRegisterDraft();
    navigate(safeNextAfterRegister || '/volunteer-events', { replace: true });
  };

  return (
    <div className="lp lp-register">
      {showVolunteerFlowLockModal ? (
        <div className="lp-register-lock-overlay">
          <div className="lp-register-lock-card" role="dialog" aria-modal="true" aria-labelledby="volunteer-flow-lock-title">
            <div className="lp-register-lock-head">
              <div className="lp-register-lock-head-row">
                <div className="lp-register-lock-icon">
                  <AlertCircle size={20} />
                </div>
                <div className="lp-register-lock-copy">
                  <h3 id="volunteer-flow-lock-title" className="lp-register-lock-title">Complete Volunteer Sign-Up First</h3>
                  <p className="lp-register-lock-text">
                    You started registration from a volunteer event. If you leave this flow now, you may not be able to complete volunteer registration for that event.
                  </p>
                </div>
              </div>
            </div>
            <div className="lp-register-lock-actions">
              <button
                type="button"
                onClick={handleCancelEventFlowRegistration}
                className="lp-register-lock-btn lp-register-lock-btn-secondary"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => setShowVolunteerFlowLockModal(false)}
                className="lp-register-lock-btn lp-register-lock-btn-primary"
              >
                Continue Registration
              </button>
            </div>
          </div>
        </div>
      ) : null}

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

      <TopAuth
        lockNavigation={isEventFlowLock}
        onBlockedNavigate={() => setShowVolunteerFlowLockModal(true)}
      />

      <main className="lp-register-main">
        <div className="lp-register-orb lp-register-orb-a" />
        <div className="lp-register-orb lp-register-orb-b" />

        <div className="lp-register-shell">
          <div className="lp-register-grid">
            <aside className="relative hidden h-full min-h-0 overflow-hidden bg-transparent xl:grid xl:grid-rows-2" aria-hidden="true">
              <img
                src={imageContainer}
                alt=""
                aria-hidden="true"
                className="absolute left-1/2 top-1/2 z-20 h-[300px] w-[300px] -translate-x-1/2 -translate-y-1/2 animate-pulse-slow md:h-[380px] md:w-[380px] lg:h-[500px] lg:w-[500px]"
              />
              <div className="grid min-h-0 grid-cols-[1.05fr_1fr]">
                <div className="min-h-0 overflow-hidden">
                  <img
                    src={mentorLeft}
                    alt="Mentor guidance"
                    className="h-full w-full object-cover transition-transform duration-700 hover:scale-105"
                  />
                </div>
                <div className="relative flex min-h-0 flex-col items-center justify-start bg-[#5b2c91] px-10 pb-8 pt-24 lg:px-12 lg:pt-28 text-white">
                  <div className="max-w-[280px] text-left animate-fadeIn" style={{ paddingTop: '100px',paddingLeft:'24px',paddingRight:'24px' }}>
                    <h3 className="font-sans text-[37px] font-bold leading-[36.5px]">
                      Join a
                      <br />
                      community
                      <br />
                      built on trust
                      <br />
                      and care.
                    </h3>
                    <p className="font-sans text-[16px] font-normal leading-[22.5px] text-white/90" style={{marginTop: '14px'}}>
                      Your guidance can help a student feel seen -- beyond marks, ranks, and expectations.
                    </p>
                  </div>
                </div>
              </div>
              <div className="grid min-h-0 grid-cols-[1.05fr_1fr]">
                <div className="flex min-h-0 items-center justify-center bg-[#f2c94c] p-6 text-[#1f2937]">
                  <ul className="list-disc space-y-3 pl-4 text-sm animate-fadeIn">
                    <li>Bond Room exists to restore human connection in an exam-driven system.</li>
                    <li>You are not expected to teach.</li>
                    <li>Your presence and perspective are enough.</li>
                  </ul>
                </div>
                <div className="min-h-0 overflow-hidden bg-black">
                  <img
                    src={mentorBottom}
                    alt="Students"
                    className="h-full w-full object-cover transition-transform duration-700 hover:scale-105"
                  />
                </div>
              </div>
            </aside>

            <section className="lp-register-form-wrap">
              <div className="lp-login-pill">
                <span className="lp-login-pill-dot" />
                Mentee / Volunteer Registration
              </div>
              <h2 className="lp-register-h2">Register your Mentee / Volunteer account</h2>
              <p className="lp-register-sub">Create your account and verify details in one step.</p>
              <div className="lp-register-role-tabs" role="tablist" aria-label="Select registration role">
                <Link to="/register" className="lp-register-role-tab is-active" aria-current="page">
                  Mentee / Volunteer
                </Link>
                <Link
                  to="/mentor-register"
                  className={`lp-register-role-tab ${isEventFlowLock ? 'opacity-60 cursor-not-allowed' : ''}`}
                  onClick={(event) => {
                    if (!isEventFlowLock) return;
                    event.preventDefault();
                    setShowVolunteerFlowLockModal(true);
                  }}
                >
                  Mentor
                </Link>
              </div>

              <form className="lp-register-form" onSubmit={handleSubmit}>
                <section className="lp-register-form-card">
                  <div className="lp-register-form-card-head">
                    <h3>
                      <UserRound size={14} className="text-[#5b2c91]" aria-hidden="true" />
                      Personal Info
                    </h3>
                  </div>

                  <div className="lp-register-row">
                  <div className="lp-field">
                    <label className="lp-register-field-label" htmlFor="firstName">First Name *</label>
                    <input
                      id="firstName"
                      className={`lp-input ${hasRequiredFieldError('firstName') ? 'lp-input-error' : ''}`}
                      placeholder="e.g. Priya"
                      value={form.firstName}
                      onChange={(event) => updateField('firstName', event.target.value)}
                      onBlur={() => markFieldTouched('firstName')}
                    />
                  </div>
                  <div className="lp-field">
                    <label className="lp-register-field-label" htmlFor="lastName">Last Name *</label>
                    <input
                      id="lastName"
                      className={`lp-input ${hasRequiredFieldError('lastName') ? 'lp-input-error' : ''}`}
                      placeholder="e.g. Sharma"
                      value={form.lastName}
                      onChange={(event) => updateField('lastName', event.target.value)}
                      onBlur={() => markFieldTouched('lastName')}
                    />
                  </div>
                  </div>

                  <div className="lp-field">
                    <label className="lp-register-field-label">Profile Image (Optional)</label>
                    <div className="lp-profile-upload-card">
                      <div className="lp-profile-upload-main">
                        <div className="lp-profile-upload-avatar">
                          {profileImagePreview ? (
                            <img src={profileImagePreview} alt="Profile preview" className="h-full w-full object-cover" />
                          ) : (
                            <div className="lp-profile-upload-avatar-fallback">
                              {form.firstName?.[0] ? String(form.firstName[0]).toUpperCase() : 'U'}
                            </div>
                          )}
                        </div>
                        <div className="lp-profile-upload-copy">
                          <p className="lp-profile-upload-title">Add a profile photo for your mentee account.</p>
                          <p className="lp-profile-upload-file">
                            {profileImageFile ? profileImageFile.name : 'No file selected'}
                          </p>
                        </div>
                        <div className="lp-profile-upload-actions">
                          <button
                            type="button"
                            className="lp-profile-upload-btn-primary"
                            onClick={() => profileImageInputRef.current?.click()}
                          >
                            <Camera className="h-3.5 w-3.5" />
                            {profileImageFile ? 'Change' : 'Upload'}
                          </button>
                          {profileImageFile ? (
                            <button
                              type="button"
                              className="lp-profile-upload-btn-secondary"
                              onClick={() => {
                                if (profileImagePreview && profileImagePreview.startsWith('blob:')) {
                                  URL.revokeObjectURL(profileImagePreview);
                                }
                                setProfileImageFile(null);
                                setProfileImagePreview('');
                                if (profileImageInputRef.current) {
                                  profileImageInputRef.current.value = '';
                                }
                              }}
                            >
                              Remove
                            </button>
                          ) : null}
                        </div>
                      </div>
                      <input
                        ref={profileImageInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleProfileImageChange}
                      />
                    </div>
                  </div>

                  <div className="lp-register-row">
                  <div className="lp-field">
                    <label className="lp-register-field-label" id="registerGradeLabel">Grade *</label>
                    <div
                      className="lp-select-wrap"
                      tabIndex={0}
                      onBlur={() => {
                        setGradeOpen(false);
                        markFieldTouched('grade');
                      }}
                    >
                      <button
                        type="button"
                        className={`lp-input lp-select-trigger ${hasRequiredFieldError('grade') ? 'lp-input-error' : ''}`}
                        onClick={() => setGradeOpen((open) => !open)}
                        aria-haspopup="listbox"
                        aria-expanded={gradeOpen}
                        aria-labelledby="registerGradeLabel"
                      >
                        <span>{form.grade || 'Select Grade'}</span>
                        <svg
                          className={`lp-select-chevron ${gradeOpen ? 'is-open' : ''}`}
                          viewBox="0 0 24 24"
                          aria-hidden="true"
                        >
                          <path d="M6 9l6 6 6-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
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
                    <label className="lp-register-field-label" htmlFor="dob">Date of Birth *</label>
                    <BoundedDatePicker
                      id="dob"
                      inputClassName={`lp-input ${hasRequiredFieldError('dob') ? 'lp-input-error' : ''}`}
                      value={form.dob}
                      onChange={(nextValue) => updateField('dob', nextValue)}
                      onBlur={() => markFieldTouched('dob')}
                      minDate={dobBounds.min}
                      maxDate={dobBounds.max}
                      placeholder="Select date of birth"
                    />
                    <p className="lp-register-note">Allowed age: {STUDENT_MIN_AGE} to {STUDENT_MAX_AGE} years</p>
                  </div>
                  </div>

                  <div className="lp-register-row">
                  <div className="lp-field">
                    <label className="lp-register-field-label" htmlFor="email">Email Address *</label>
                    <div className="lp-register-inline-verify">
                      <input
                        id="email"
                        type="email"
                        className={`lp-input ${hasRequiredFieldError('email') ? 'lp-input-error' : ''}`}
                        placeholder="student@example.com"
                        value={form.email}
                        onChange={(event) => updateField('email', event.target.value)}
                        onBlur={() => markFieldTouched('email')}
                      />
                      <button
                        type="button"
                        className={`lp-vp-inline-btn ${emailVerified ? 'is-verified' : ''}`}
                        onClick={() => openOtpModal('email')}
                      >
                        {emailVerified ? 'Verified' : 'Verify'}
                      </button>
                    </div>
                  </div>

                  <div className="lp-field">
                    <label className="lp-register-field-label" htmlFor="password">Password *</label>
                    <div className="lp-password-wrap">
                      <input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        className={`lp-input lp-password-input ${hasRequiredFieldError('password') ? 'lp-input-error' : ''}`}
                        placeholder="Create password"
                        value={form.password}
                        onChange={(event) => updateField('password', event.target.value)}
                        onBlur={() => markFieldTouched('password')}
                      />
                      <button
                        type="button"
                        className="lp-password-toggle"
                        onClick={() => setShowPassword((prev) => !prev)}
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                        title={showPassword ? 'Hide password' : 'Show password'}
                      >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                    {form.password ? (
                      <div className="lp-password-guide" aria-live="polite">
                        <p>{PASSWORD_REQUIREMENT_MESSAGE}</p>
                        <ul>
                          {getPasswordChecks(form.password).map((check) => (
                            <li key={check.key} className={check.ok ? 'is-ok' : ''}>
                              <span aria-hidden="true" className="lp-password-guide-icon">{check.ok ? '✔' : '○'}</span> {check.label}
                            </li>
                          ))}
                        </ul>
                      </div>
                    ) : null}
                  </div>
                  </div>

                  <div className="lp-register-row">
                  <div className="lp-field">
                    <label className="lp-register-field-label" id="registerGenderLabel">Gender *</label>
                    <div
                      className="lp-select-wrap"
                      tabIndex={0}
                      onBlur={() => {
                        setGenderOpen(false);
                        markFieldTouched('gender');
                      }}
                    >
                      <button
                        type="button"
                        className={`lp-input lp-select-trigger ${hasRequiredFieldError('gender') ? 'lp-input-error' : ''}`}
                        onClick={() => setGenderOpen((open) => !open)}
                        aria-haspopup="listbox"
                        aria-expanded={genderOpen}
                        aria-labelledby="registerGenderLabel"
                      >
                        <span>{form.gender || 'Select Gender'}</span>
                        <svg
                          className={`lp-select-chevron ${genderOpen ? 'is-open' : ''}`}
                          viewBox="0 0 24 24"
                          aria-hidden="true"
                        >
                          <path d="M6 9l6 6 6-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
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
                </section>

                <section className="lp-register-form-card">
                  <div className="lp-register-form-card-head">
                    <h3>
                      <MapPin size={14} className="text-[#5b2c91]" aria-hidden="true" />
                      School & Location
                    </h3>
                  </div>

                  <div className="lp-register-row">
                  <div className="lp-field">
                    <label className="lp-register-field-label" htmlFor="schoolOrCollege">School / College *</label>
                    <input
                      id="schoolOrCollege"
                      className={`lp-input ${hasRequiredFieldError('schoolOrCollege') ? 'lp-input-error' : ''}`}
                      placeholder="Enter school or college"
                      value={form.schoolOrCollege}
                      onChange={(event) => updateField('schoolOrCollege', event.target.value)}
                      onBlur={() => markFieldTouched('schoolOrCollege')}
                    />
                  </div>
                  </div>

                  <div className="lp-register-row">
                  <div className="lp-field">
                    <label className="lp-register-field-label" htmlFor="country">Country *</label>
                    <select
                      id="country"
                      className={`lp-input ${hasRequiredFieldError('country') ? 'lp-input-error' : ''}`}
                      value={form.country}
                      onChange={(event) => updateField('country', event.target.value)}
                      onBlur={() => markFieldTouched('country')}
                    >
                      {COUNTRY_OPTIONS.map((country) => (
                        <option key={country} value={country}>{country}</option>
                      ))}
                    </select>
                  </div>
                  <div className="lp-field">
                    <label className="lp-register-field-label" htmlFor="state">State *</label>
                    <select
                      id="state"
                      className={`lp-input ${hasRequiredFieldError('state') ? 'lp-input-error' : ''}`}
                      value={form.state}
                      onChange={(event) => updateField('state', event.target.value)}
                      onBlur={() => markFieldTouched('state')}
                    >
                      {(LOCATION_OPTIONS[form.country]?.states || []).map((stateName) => (
                        <option key={stateName} value={stateName}>{stateName}</option>
                      ))}
                    </select>
                  </div>
                  </div>

                  <div className="lp-register-row">
                  <div className="lp-field">
                    <label className="lp-register-field-label" htmlFor="city">City *</label>
                    <select
                      id="city"
                      className={`lp-input ${hasRequiredFieldError('city') ? 'lp-input-error' : ''}`}
                      value={form.city}
                      onChange={(event) => updateField('city', event.target.value)}
                      onBlur={() => markFieldTouched('city')}
                    >
                      {(LOCATION_OPTIONS[form.country]?.citiesByState?.[form.state] || []).map((cityName) => (
                        <option key={cityName} value={cityName}>{cityName}</option>
                      ))}
                    </select>
                  </div>
                  <div className="lp-field">
                    <label className="lp-register-field-label" htmlFor="postalCode">Pincode *</label>
                    <input
                      id="postalCode"
                      className={`lp-input ${hasRequiredFieldError('postalCode') ? 'lp-input-error' : ''}`}
                      placeholder={form.country === 'USA' ? 'e.g. 77001' : 'e.g. 600001'}
                      value={form.postalCode}
                      onChange={(event) => updateField('postalCode', event.target.value)}
                      onBlur={() => markFieldTouched('postalCode')}
                    />
                  </div>
                  </div>
                </section>

                <section className="lp-register-form-card">
                  <div className="lp-register-form-card-head">
                    <h3>
                      <ShieldCheck size={14} className="text-[#5b2c91]" aria-hidden="true" />
                      Consent & Verification
                    </h3>
                  </div>

                  <div className="lp-register-consent-box">
                  <p className="lp-register-note">Verify parent mobile before creating the student account.</p>

                  <div className="lp-register-mobile-row lp-register-mobile-row-action">
                    <div className="lp-register-country" aria-hidden="true">{dialCode}</div>
                    <input
                      id="parentMobile"
                      className={`lp-input ${hasRequiredFieldError('parentMobile') ? 'lp-input-error' : ''}`}
                      placeholder="Parent mobile number"
                      aria-label="Parent mobile number"
                      value={form.parentMobile}
                      onChange={(event) => updateField('parentMobile', event.target.value)}
                      onBlur={() => markFieldTouched('parentMobile')}
                    />
                    <button
                      type="button"
                      className={`lp-vp-inline-btn ${parentMobileVerified ? 'is-verified' : ''}`}
                      onClick={() => openOtpModal('parentMobile')}
                    >
                      {parentMobileVerified ? 'Verified' : 'Verify'}
                    </button>
                  </div>
                </div>

                {parentMobileVerified ? (
                  <div className="lp-register-consent-box lp-register-secondary-box">
                    <label className="lp-register-checkline">
                      <input
                        id="menteeSameAsParent"
                        type="checkbox"
                        checked={form.menteeSameAsParent}
                        onChange={(event) => updateField('menteeSameAsParent', event.target.checked)}
                      />
                      <span>Mentee number same as parent</span>
                    </label>

                    <div className={`lp-register-mobile-row ${form.menteeSameAsParent ? '' : 'lp-register-mobile-row-action'}`}>
                      <div className="lp-register-country" aria-hidden="true">{dialCode}</div>
                      <input
                        id="menteeMobile"
                        className={`lp-input ${hasRequiredFieldError('menteeMobile') ? 'lp-input-error' : ''}`}
                        placeholder="Mentee mobile number"
                        aria-label="Mentee mobile number"
                        value={form.menteeSameAsParent ? form.parentMobile : form.menteeMobile}
                        onChange={(event) => updateField('menteeMobile', event.target.value)}
                        onBlur={() => markFieldTouched('menteeMobile')}
                        disabled={form.menteeSameAsParent}
                      />
                      {!form.menteeSameAsParent ? (
                        <button
                          type="button"
                          className={`lp-vp-inline-btn ${menteeMobileVerified ? 'is-verified' : ''}`}
                          onClick={() => openOtpModal('menteeMobile')}
                          disabled={!form.menteeMobile}
                        >
                          {menteeMobileVerified ? 'Verified' : 'Verify'}
                        </button>
                      ) : null}
                    </div>
                  </div>
                ) : null}

                  <label className={`lp-register-checkline ${hasRequiredFieldError('recordConsent') ? 'lp-input-error-check' : ''}`}>
                    <input
                      id="recordConsent"
                      type="checkbox"
                      checked={form.recordConsent}
                      onChange={(event) => updateField('recordConsent', event.target.checked)}
                    />
                    <span>
                      I Agree to Session Recording for Safety *
                      <span className="lp-register-note lp-register-note-block">
                        All sessions are recorded to ensure student safety and quality of mentorship.
                      </span>
                    </span>
                  </label>
                </section>

                <button type="submit" className="lp-login-submit" disabled={loading}>
                  {loading ? 'Please wait...' : 'Verify & Continue'}
                </button>

                <p className="lp-register-terms">
                  By continuing, you agree to our <span>Terms & Conditions</span> and <span>Privacy Policy</span>
                </p>
              </form>
            </section>
          </div>
        </div>
      </main>

      <BottomAuth />

      {otpModal.open && (
        <div className="lp-register-otp-overlay" onClick={closeOtpModal}>
          <div className="lp-register-otp-card" onClick={(e) => e.stopPropagation()}>
            <div className="lp-register-otp-header">
              <div className="lp-register-otp-icon" aria-hidden="true">
                {otpModal.channel === 'email' ? '@' : '#'}
              </div>
              <h3 className="lp-register-otp-title">
                Verify {otpModal.channel === 'email' ? 'Email' : otpModal.channel === 'parentMobile' ? 'Parent Mobile' : 'Mentee Mobile'}
              </h3>
              <button type="button" className="lp-register-otp-close" onClick={closeOtpModal} aria-label="Close">
                ×
              </button>
            </div>
            <p className="lp-register-otp-subtitle">Enter the 6-digit OTP sent to your contact.</p>
            <input
              type="text"
              inputMode="numeric"
              maxLength={6}
              className="lp-register-otp-input"
              placeholder="000000"
              value={otpModal.otp}
              onChange={(event) =>
                setOtpModal((prev) => ({ ...prev, otp: event.target.value.replace(/\D/g, '').slice(0, 6) }))
              }
            />
            {otpModal.channel === 'email' && otpHint.email ? <p className="lp-register-otp-hint">{otpHint.email}</p> : null}
            {otpModal.channel === 'parentMobile' && otpHint.parentMobile ? <p className="lp-register-otp-hint">{otpHint.parentMobile}</p> : null}
            {otpModal.channel === 'menteeMobile' && otpHint.menteeMobile ? <p className="lp-register-otp-hint">{otpHint.menteeMobile}</p> : null}
            {otpError ? <p className="lp-register-otp-error">{otpError}</p> : null}
            <div className="lp-register-otp-actions">
              <button
                type="button"
                className="lp-register-otp-btn lp-register-otp-btn-secondary"
                onClick={() => handleSendOtp(otpModal.channel)}
                disabled={otpBusy.sending || otpBusy.verifying}
              >
                {otpBusy.sending ? 'Sending...' : 'Resend OTP'}
              </button>
              <button
                type="button"
                className="lp-register-otp-btn lp-register-otp-btn-primary"
                onClick={handleVerifyOtp}
                disabled={otpBusy.sending || otpBusy.verifying || otpModal.otp.length !== 6}
              >
                {otpBusy.verifying ? 'Verifying...' : 'Verify OTP'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Register;
