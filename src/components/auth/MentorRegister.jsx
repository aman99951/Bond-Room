import React, { useEffect, useMemo, useState } from 'react';
import TopAuth from './TopAuth';
import BottomAuth from './BottomAuth';
import { useNavigate } from 'react-router-dom';
import mentorLeft from '../assets/teach1.png';
import mentorBottom from '../assets/teach2.png';
import imageContainer from '../assets/Image Container.png';
import { useMentorAuth } from '../../apis/apihook/useMentorAuth';
import { authApi } from '../../apis/api/authApi';
import { setPendingMentorRegistration } from '../../apis/api/storage';

const MENTOR_MIN_AGE = 45;
const MENTOR_MAX_AGE = 60;

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

const getMentorDobBounds = () => ({
  min: toDateInputValue(yearsAgo(MENTOR_MAX_AGE)),
  max: toDateInputValue(yearsAgo(MENTOR_MIN_AGE)),
});

const REQUIRED_FIELDS_MESSAGE = 'Please fill all required fields to continue.';
const normalizePhone = (value) => String(value || '').replace(/\D/g, '');

// Custom Select Component
const CustomSelect = ({ id, value, onChange, options, placeholder, disabled, className = '' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const selectedOption = options.find(opt => opt.value === value);

  return (
    <div className="relative">
      <button
        type="button"
        id={id}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`w-full rounded-lg border border-[#d7d0e2] bg-white px-4 py-2.5 text-left text-sm text-[#111827] 
          focus:outline-none focus:ring-2 focus:ring-[#5b2c91] focus:border-transparent 
          transition-all duration-200 hover:border-[#5b2c91] disabled:bg-[#f3f4f6] 
          disabled:text-[#9ca3af] disabled:cursor-not-allowed flex items-center justify-between
          ${isOpen ? 'ring-2 ring-[#5b2c91] border-transparent' : ''} ${className}`}
      >
        <span className={selectedOption ? 'text-[#111827]' : 'text-[#9ca3af]'}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <svg
          className={`w-5 h-5 text-[#5b2c91] transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      
      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute z-20 w-full mt-2 bg-white border border-[#e6e2f1] rounded-lg shadow-xl max-h-60 overflow-auto animate-fadeIn">
            {options.map((option, index) => (
              <button
                key={option.value || index}
                type="button"
                onClick={() => {
                  onChange(option.value);
                  setIsOpen(false);
                }}
                className={`w-full px-4 py-2.5 text-left text-sm transition-colors duration-150
                  ${value === option.value 
                    ? 'bg-[#f3ecff] text-[#5b2c91] font-medium' 
                    : 'text-[#111827] hover:bg-[#f9f7ff]'
                  }
                  ${index === 0 ? 'rounded-t-lg' : ''}
                  ${index === options.length - 1 ? 'rounded-b-lg' : ''}
                `}
              >
                {option.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

// Loading Spinner Component
const Spinner = ({ size = 'sm' }) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8'
  };

  return (
    <svg
      className={`animate-spin ${sizeClasses[size]}`}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
};

const MentorRegister = () => {
  const [selectedLanguages, setSelectedLanguages] = useState([]);
  const [selectedCareAreas, setSelectedCareAreas] = useState([]);
  const languagesOptions = ['Tamil', 'English', 'Telugu', 'Kannada', 'Malayalam', 'Hindi'];
  const careAreaOptions = ['Anxiety', 'Relationships', 'Academic Stress'];
  const navigate = useNavigate();
  const { registerMentor, sendMentorOtp, verifyMentorOtp } = useMentorAuth();
  const [errorMessage, setErrorMessage] = useState('');
  const [infoMessage, setInfoMessage] = useState('');
  const [otpErrorMessage, setOtpErrorMessage] = useState('');
  const [otpInfoMessage, setOtpInfoMessage] = useState('');
  const [emailHint, setEmailHint] = useState('');
  const [phoneHint, setPhoneHint] = useState('');
  const [mentorId, setMentorId] = useState(null);
  const [emailVerified, setEmailVerified] = useState(false);
  const [phoneVerified, setPhoneVerified] = useState(false);
  const [otpModal, setOtpModal] = useState({
    open: false,
    channel: 'email',
    otp: '',
  });
  const [actionBusy, setActionBusy] = useState({
    sendEmail: false,
    sendPhone: false,
    verifyEmail: false,
    verifyPhone: false,
    submit: false,
  });
  const [formSection, setFormSection] = useState(1);
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    mobile: '',
    dob: '',
    gender: '',
    stateName: '',
    cityName: '',
    qualification: '',
    bio: '',
    consent: false,
  });
  const [stateOptions, setStateOptions] = useState([]);
  const [cityOptions, setCityOptions] = useState([]);
  const [locationBusy, setLocationBusy] = useState({
    states: false,
    cities: false,
  });
  const [locationError, setLocationError] = useState('');
  const [resendCooldown, setResendCooldown] = useState({
    email: 0,
    phone: 0,
  });
  const isDev = Boolean(import.meta?.env?.DEV);
  const dobBounds = getMentorDobBounds();

  const toggleMultiCheckbox = (value, setter) => {
    setter((prev) => {
      if (prev.includes(value)) {
        return prev.filter((item) => item !== value);
      }
      return [...prev, value];
    });
  };

  const updateField = (key, value) => {
    if (key === 'email') {
      setEmailVerified(false);
      setPhoneVerified(false);
      setEmailHint('');
      setPhoneHint('');
      setMentorId(null);
    }
    if (key === 'mobile') {
      setPhoneVerified(false);
      setPhoneHint('');
      setMentorId(null);
    }
    if (key === 'stateName') {
      setForm((prev) => ({ ...prev, stateName: value, cityName: '' }));
      return;
    }
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  useEffect(() => {
    let active = true;

    const loadStates = async () => {
      setLocationBusy((prev) => ({ ...prev, states: true }));
      setLocationError('');
      try {
        const response = await authApi.getLocationStates();
        if (!active) return;
        const states = Array.isArray(response?.states) ? response.states : [];
        setStateOptions(states);
      } catch (err) {
        if (!active) return;
        setStateOptions([]);
        setLocationError(err?.message || 'Unable to load states.');
      } finally {
        if (active) {
          setLocationBusy((prev) => ({ ...prev, states: false }));
        }
      }
    };

    loadStates();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!form.stateName) {
      setCityOptions([]);
      return;
    }

    let active = true;

    const loadCities = async () => {
      setLocationBusy((prev) => ({ ...prev, cities: true }));
      setLocationError('');
      try {
        const response = await authApi.getLocationCities(form.stateName);
        if (!active) return;
        const cities = Array.isArray(response?.cities) ? response.cities : [];
        setCityOptions(cities);
      } catch (err) {
        if (!active) return;
        setCityOptions([]);
        setLocationError(err?.message || 'Unable to load cities for selected state.');
      } finally {
        if (active) {
          setLocationBusy((prev) => ({ ...prev, cities: false }));
        }
      }
    };

    loadCities();
    return () => {
      active = false;
    };
  }, [form.stateName]);

  useEffect(() => {
    if (!resendCooldown.email && !resendCooldown.phone) {
      return undefined;
    }

    const intervalId = window.setInterval(() => {
      setResendCooldown((prev) => ({
        email: prev.email > 0 ? prev.email - 1 : 0,
        phone: prev.phone > 0 ? prev.phone - 1 : 0,
      }));
    }, 1000);

    return () => window.clearInterval(intervalId);
  }, [resendCooldown.email, resendCooldown.phone]);

  const validateSectionOneForm = () => {
    if (
      !form.firstName.trim() ||
      !form.lastName.trim() ||
      !form.email.trim() ||
      !form.mobile.trim() ||
      !form.dob ||
      !form.gender ||
      !form.stateName ||
      !form.cityName
    ) {
      return 'Please fill all required fields to continue.';
    }
    if (!selectedLanguages.length) {
      return 'Please select at least one language.';
    }
    if (form.dob < dobBounds.min || form.dob > dobBounds.max) {
      return `Mentor age must be between ${MENTOR_MIN_AGE} and ${MENTOR_MAX_AGE} years.`;
    }
    return '';
  };

  const validateRegistrationForm = () => {
    const sectionOneError = validateSectionOneForm();
    if (sectionOneError) {
      return sectionOneError;
    }
    return '';
  };

  const getExistingMentorId = () => {
    return mentorId;
  };

  const buildMentorPayload = () => {
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Kolkata';
    const currentMentorId = getExistingMentorId();
    const payload = {
      first_name: form.firstName.trim(),
      last_name: form.lastName.trim(),
      email: form.email.trim().toLowerCase(),
      mobile: form.mobile.trim(),
      dob: form.dob,
      gender: form.gender,
      city_state: `${form.cityName}, ${form.stateName}`,
      languages: selectedLanguages,
      care_areas: selectedCareAreas,
      preferred_formats: [],
      availability: [],
      timezone,
      qualification: form.qualification.trim(),
      bio: form.bio.trim(),
      consent: form.consent,
      email_verified: emailVerified,
      phone_verified: phoneVerified,
    };
    if (currentMentorId) {
      payload.mentor_id = currentMentorId;
    }
    return payload;
  };

  const buildOtpPayload = (channel, otp = '') => {
    const currentMentorId = getExistingMentorId();
    const payload = { channel };
    if (otp) {
      payload.otp = otp;
    }
    if (currentMentorId) {
      payload.mentor_id = currentMentorId;
      return payload;
    }
    if (channel === 'email') {
      payload.email = form.email.trim().toLowerCase();
    } else {
      payload.mobile = form.mobile.trim();
    }
    return payload;
  };

  const ensureMentorRegistered = async (options = {}) => {
    const { forVerification = false } = options;
    const validationError = forVerification
      ? validateSectionOneForm()
      : validateRegistrationForm();
    if (validationError) {
      throw new Error(validationError);
    }

    const mentor = await registerMentor(buildMentorPayload());
    setPendingMentorRegistration({
      mentorId: mentor?.id,
      email: form.email.trim().toLowerCase(),
      mobile: form.mobile.trim(),
    });

    if (mentor?.id && mentor?.id !== mentorId) {
      setEmailVerified(false);
      setPhoneVerified(false);
    }
    setMentorId(mentor?.id || null);
    return mentor;
  };

  const handleSendOtp = async (channel) => {
    const sendKey = channel === 'email' ? 'sendEmail' : 'sendPhone';
    setErrorMessage('');
    setInfoMessage('');
    setOtpErrorMessage('');
    setOtpInfoMessage('');
    setActionBusy((prev) => ({ ...prev, [sendKey]: true }));

    try {
      const fieldValue = channel === 'email' ? form.email.trim() : form.mobile.trim();
      if (!fieldValue) {
        throw new Error(channel === 'email' ? 'Please enter your email first.' : 'Please enter your mobile number first.');
      }
      const response = await sendMentorOtp(buildOtpPayload(channel));

      if (channel === 'email' && response?.otp) {
        setEmailHint(`Test OTP: ${response.otp}`);
      }
      if (channel === 'phone' && response?.otp) {
        setPhoneHint(`Test OTP: ${response.otp}`);
      }
      setResendCooldown((prev) => ({ ...prev, [channel]: 30 }));
      const successMessage = `${channel === 'email' ? 'Email' : 'Phone'} OTP sent successfully.`;
      setInfoMessage(successMessage);
      setOtpInfoMessage(successMessage);
    } catch (err) {
      const message = err?.message || 'Unable to send OTP.';
      setErrorMessage(message);
      setOtpErrorMessage(message === REQUIRED_FIELDS_MESSAGE ? '' : message);
    } finally {
      setActionBusy((prev) => ({ ...prev, [sendKey]: false }));
    }
  };

  const handleVerifyOtp = async (channel, otp) => {
    const verifyKey = channel === 'email' ? 'verifyEmail' : 'verifyPhone';
    const fieldValue = channel === 'email' ? form.email.trim() : form.mobile.trim();
    if (!fieldValue) {
      const message = channel === 'email' ? 'Please enter your email first.' : 'Please enter your mobile number first.';
      setErrorMessage(message);
      setOtpErrorMessage(message);
      return;
    }
    if (otp.length !== 6) {
      const message = 'Please enter a valid 6-digit OTP.';
      setErrorMessage(message);
      setOtpErrorMessage(message);
      return;
    }
    setErrorMessage('');
    setInfoMessage('');
    setOtpErrorMessage('');
    setOtpInfoMessage('');
    setActionBusy((prev) => ({ ...prev, [verifyKey]: true }));
    try {
      await verifyMentorOtp(buildOtpPayload(channel, otp));
      if (channel === 'email') {
        setEmailVerified(true);
      } else {
        setPhoneVerified(true);
      }
      setOtpModal({ open: false, channel, otp: '' });
      setInfoMessage(`${channel === 'email' ? 'Email' : 'Phone'} verified successfully.`);
    } catch (err) {
      const message = err?.message || 'OTP verification failed.';
      setErrorMessage(message);
      setOtpErrorMessage(message);
    } finally {
      setActionBusy((prev) => ({ ...prev, [verifyKey]: false }));
    }
  };

  const openOtpModal = async (channel) => {
    setOtpErrorMessage('');
    setOtpInfoMessage('');
    setOtpModal({ open: true, channel, otp: '' });
    await handleSendOtp(channel);
  };

  const closeOtpModal = () => {
    setOtpErrorMessage('');
    setOtpInfoMessage('');
    setOtpModal((prev) => ({ ...prev, open: false, otp: '' }));
  };

  const handleContinueToProfile = () => {
    setErrorMessage('');
    setInfoMessage('');

    const validationError = validateSectionOneForm();
    if (validationError) {
      setErrorMessage(validationError);
      return;
    }
    if (!emailVerified || !phoneVerified) {
      setErrorMessage('Please verify both email and mobile to continue.');
      return;
    }
    setFormSection(2);
  };

  const handleSubmit = async () => {
    setErrorMessage('');
    setInfoMessage('');

    const validationError = validateRegistrationForm();
    if (validationError) {
      setErrorMessage(validationError);
      return;
    }

    if (!emailVerified || !phoneVerified) {
      setErrorMessage('Please verify both email and mobile before submitting.');
      return;
    }

    setActionBusy((prev) => ({ ...prev, submit: true }));
    try {
      const mentor = await ensureMentorRegistered();
      setMentorId(mentor?.id || null);
      navigate('/mentor-verify-identity');
    } catch (err) {
      setErrorMessage(err?.message || 'Unable to submit mentor application right now.');
    } finally {
      setActionBusy((prev) => ({ ...prev, submit: false }));
    }
  };

  const isOtpSending = otpModal.channel === 'email' ? actionBusy.sendEmail : actionBusy.sendPhone;
  const isOtpVerifying = otpModal.channel === 'email' ? actionBusy.verifyEmail : actionBusy.verifyPhone;
  const activeCooldown = resendCooldown[otpModal.channel] || 0;
  const formatCooldown = (seconds) => `00:${String(seconds).padStart(2, '0')}`;

  // Prepare dropdown options
  const stateDropdownOptions = [
    { value: '', label: locationBusy.states ? 'Loading states...' : 'Select State' },
    ...stateOptions.map(state => ({ value: state, label: state }))
  ];

  const cityDropdownOptions = [
    { 
      value: '', 
      label: !form.stateName 
        ? 'Select State First' 
        : locationBusy.cities 
          ? 'Loading cities...' 
          : 'Select City' 
    },
    ...cityOptions.map(city => ({ value: city, label: city }))
  ];

  const genderOptions = [
    { value: '', label: 'Select Gender' },
    { value: 'Female', label: 'Female' },
    { value: 'Male', label: 'Male' }
  ];

  return (
    <div className="min-h-screen text-[#1f2937] flex flex-col">
      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes scaleIn {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        @keyframes pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.5;
          }
        }

        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out forwards;
        }

        .animate-slideUp {
          animation: slideUp 0.4s ease-out forwards;
        }

        .animate-scaleIn {
          animation: scaleIn 0.3s ease-out forwards;
        }

        .animate-pulse-slow {
          animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }

        /* Custom scrollbar */
        ::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }

        ::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 10px;
        }

        ::-webkit-scrollbar-thumb {
          background: #5b2c91;
          border-radius: 10px;
        }

        ::-webkit-scrollbar-thumb:hover {
          background: #4a2374;
        }

        /* Smooth transitions for all interactive elements */
        input, button, select, textarea {
          transition: all 0.2s ease-in-out;
        }

        /* Input focus glow effect */
        input:focus, textarea:focus {
          box-shadow: 0 0 0 3px rgba(91, 44, 145, 0.1);
        }

        /* Button hover lift effect */
        button:not(:disabled):hover {
          transform: translateY(-1px);
        }

        button:not(:disabled):active {
          transform: translateY(0);
        }
      `}</style>

      <TopAuth />

      <main className="bg-transparent flex-1">
        <div className="flex w-full justify-center px-4 py-4 sm:px-6 sm:py-8 lg:py-10">
          <div className="w-full max-w-[1266px] overflow-hidden rounded-xl bg-white shadow-[0_10px_30px_rgba(0,0,0,0.2)] animate-scaleIn">
            <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
              {/* Left Panel */}
              <div className="relative hidden h-full grid-rows-2 bg-transparent xl:grid">
                <img
                  src={imageContainer}
                  alt=""
                  aria-hidden="true"
                  className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-20 w-[300px] h-[300px] md:w-[380px] md:h-[380px] lg:w-[500px] lg:h-[500px] animate-pulse-slow"
                />
                <div className="grid grid-cols-[1.05fr_1fr]">
                  <div className="overflow-hidden">
                    <img
                      src={mentorLeft}
                      alt="Mentor guidance"
                      className="h-full w-full object-cover hover:scale-105 transition-transform duration-700"
                    />
                  </div>
                  <div className="relative bg-[#5b2c91] p-6 text-white flex flex-col justify-between">
                    <div className="animate-fadeIn">
                      <h3 className="font-sans font-bold text-[37px] leading-[36.5px]">
                        Join a
                        <br />
                        community
                        <br />
                        built on trust
                        <br />
                        and care.
                      </h3>
                      <p className="mt-3 font-sans text-[16px] leading-[22.5px] font-normal text-white/90">
                        Your guidance can help a student feel seen -- beyond marks, ranks, and expectations.
                      </p>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-[1.05fr_1fr]">
                  <div className="bg-[#f2c94c] p-6 text-[#1f2937] flex items-center justify-center">
                    <ul className="list-disc pl-4 space-y-3 text-sm animate-fadeIn">
                      <li>Bond Room exists to restore human connection in an exam-driven system.</li>
                      <li>You are not expected to teach.</li>
                      <li>Your presence and perspective are enough.</li>
                    </ul>
                  </div>
                  <div className="bg-black overflow-hidden">
                    <img
                      src={mentorBottom}
                      alt="Students"
                      className="h-full w-full object-cover hover:scale-105 transition-transform duration-700"
                    />
                  </div>
                </div>
              </div>

              {/* Right Panel - Form */}
              <div className="bg-white p-4 text-[#1f2937] sm:p-6 lg:p-10">
                <div className="max-w-2xl mx-auto md:max-w-none md:mx-0 animate-slideUp">
                  <div className="inline-flex items-center rounded-full bg-gradient-to-r from-[#e9ddff] to-[#f3ecff] text-xs text-[#5b2c91] px-3 py-1 font-medium shadow-sm">
                    <span className="inline-block w-2 h-2 bg-[#5b2c91] rounded-full mr-2 animate-pulse"></span>
                    Step 1 of 3
                  </div>
                  <h2 className="mt-3 text-xl sm:text-2xl font-semibold text-[#1f2937] bg-gradient-to-r from-[#5b2c91] to-[#4a2374] bg-clip-text text-transparent">
                    Apply as a Mentor
                  </h2>
                  <p className="mt-1 text-sm text-[#6b7280]">
                    Share your experience and guide students with care.
                  </p>
                  <p className="mt-4 text-xs sm:text-sm text-[#6b7280]">
                    Bond Room connects students with trusted mentors who listen without judgment.
                    Tell us about yourself so we can match you thoughtfully.
                  </p>

                  <form className="mt-6 space-y-4" onSubmit={(event) => event.preventDefault()}>
                    <section className="rounded-xl border border-[#e6e2f1] p-4 sm:p-5 space-y-4 bg-gradient-to-br from-white to-[#fafafa] shadow-sm hover:shadow-md transition-shadow duration-300">
                      <div className="flex items-center justify-between gap-3">
                        <h3 className="text-sm font-semibold text-[#1f2937] flex items-center gap-2">
                          <span className="inline-block w-1 h-5 bg-gradient-to-b from-[#5b2c91] to-[#4a2374] rounded-full"></span>
                          {formSection === 1 ? 'Personal & Contact' : 'Mentor Profile'}
                        </h3>
                        <span className="rounded-full bg-gradient-to-r from-[#f3ecff] to-[#e9ddff] px-2.5 py-1 text-[11px] font-medium text-[#5b2c91] shadow-sm">
                          Section {formSection} of 2
                        </span>
                      </div>

                      {formSection === 1 && (
                        <div className="space-y-4 animate-fadeIn">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                            <div className="group">
                              <label htmlFor="firstName" className="block text-xs font-medium text-[#6b7280] mb-1 group-hover:text-[#5b2c91] transition-colors">
                                First name
                              </label>
                              <input
                                id="firstName"
                                className="w-full rounded-lg border border-[#d7d0e2] bg-white px-4 py-2.5 text-sm text-[#111827] 
                                  focus:outline-none focus:ring-2 focus:ring-[#5b2c91] focus:border-transparent 
                                  transition-all duration-200 hover:border-[#5b2c91] placeholder:text-[#9ca3af]"
                                placeholder="e.g. Priya"
                                value={form.firstName}
                                onChange={(event) => updateField('firstName', event.target.value)}
                              />
                            </div>
                            <div className="group">
                              <label htmlFor="lastName" className="block text-xs font-medium text-[#6b7280] mb-1 group-hover:text-[#5b2c91] transition-colors">
                                Last name
                              </label>
                              <input
                                id="lastName"
                                className="w-full rounded-lg border border-[#d7d0e2] bg-white px-4 py-2.5 text-sm text-[#111827] 
                                  focus:outline-none focus:ring-2 focus:ring-[#5b2c91] focus:border-transparent 
                                  transition-all duration-200 hover:border-[#5b2c91] placeholder:text-[#9ca3af]"
                                placeholder="e.g. Sharma"
                                value={form.lastName}
                                onChange={(event) => updateField('lastName', event.target.value)}
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                            <div className="group">
                              <label htmlFor="email" className="block text-xs font-medium text-[#6b7280] mb-1 group-hover:text-[#5b2c91] transition-colors">
                                Email
                              </label>
                              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                                <input
                                  id="email"
                                  type="email"
                                  className="w-full min-w-0 flex-1 rounded-lg border border-[#d7d0e2] bg-white px-4 py-2.5 text-sm text-[#111827] 
                                    focus:outline-none focus:ring-2 focus:ring-[#5b2c91] focus:border-transparent 
                                    transition-all duration-200 hover:border-[#5b2c91] placeholder:text-[#9ca3af]"
                                  placeholder="name@example.com"
                                  value={form.email}
                                  onChange={(event) => updateField('email', event.target.value)}
                                />
                                <button
                                  type="button"
                                  className={`w-full shrink-0 rounded-lg px-3 py-2 text-xs font-semibold border transition-all duration-200 sm:w-auto sm:min-w-[96px] ${
                                    emailVerified
                                      ? 'border-[#22c55e] text-[#15803d] bg-gradient-to-r from-[#f0fdf4] to-[#dcfce7] shadow-sm'
                                      : 'border-[#5b2c91] text-[#5b2c91] bg-white hover:bg-[#f3ecff] shadow-sm hover:shadow'
                                  }`}
                                  onClick={() => openOtpModal('email')}
                                  disabled={
                                    actionBusy.sendEmail
                                    || actionBusy.verifyEmail
                                    || actionBusy.submit
                                    || !form.email.trim()
                                    || emailVerified
                                  }
                                >
                                  {emailVerified ? (
                                    <span className="flex items-center gap-1">
                                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                      </svg>
                                      Verified
                                    </span>
                                  ) : 'Verify'}
                                </button>
                              </div>
                            </div>

                            <div className="group">
                              <label htmlFor="mobile" className="block text-xs font-medium text-[#6b7280] mb-1 group-hover:text-[#5b2c91] transition-colors">
                                Mobile Number
                              </label>
                              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                                <input
                                  id="mobile"
                                  type="tel"
                                  className="w-full min-w-0 flex-1 rounded-lg border border-[#d7d0e2] bg-white px-4 py-2.5 text-sm text-[#111827] 
                                    focus:outline-none focus:ring-2 focus:ring-[#5b2c91] focus:border-transparent 
                                    transition-all duration-200 hover:border-[#5b2c91] placeholder:text-[#9ca3af]"
                                  placeholder="+91 98765 43210"
                                  value={form.mobile}
                                  onChange={(event) => updateField('mobile', event.target.value)}
                                />
                                <button
                                  type="button"
                                  className={`w-full shrink-0 rounded-lg px-3 py-2 text-xs font-semibold border transition-all duration-200 sm:w-auto sm:min-w-[96px] ${
                                    phoneVerified
                                      ? 'border-[#22c55e] text-[#15803d] bg-gradient-to-r from-[#f0fdf4] to-[#dcfce7] shadow-sm'
                                      : 'border-[#5b2c91] text-[#5b2c91] bg-white hover:bg-[#f3ecff] shadow-sm hover:shadow'
                                  }`}
                                  onClick={() => openOtpModal('phone')}
                                  disabled={
                                    actionBusy.sendPhone
                                    || actionBusy.verifyPhone
                                    || actionBusy.submit
                                    || !form.mobile.trim()
                                    || phoneVerified
                                  }
                                >
                                  {phoneVerified ? (
                                    <span className="flex items-center gap-1">
                                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                      </svg>
                                      Verified
                                    </span>
                                  ) : 'Verify'}
                                </button>
                              </div>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                            <div className="group">
                              <label htmlFor="dob" className="block text-xs font-medium text-[#6b7280] mb-1 group-hover:text-[#5b2c91] transition-colors">
                                Date of Birth
                              </label>
                              <input
                                id="dob"
                                type="date"
                                className="w-full rounded-lg border border-[#d7d0e2] bg-white px-4 py-2.5 text-sm text-[#111827] 
                                  focus:outline-none focus:ring-2 focus:ring-[#5b2c91] focus:border-transparent 
                                  transition-all duration-200 hover:border-[#5b2c91]"
                                value={form.dob}
                                onChange={(event) => updateField('dob', event.target.value)}
                                min={dobBounds.min}
                                max={dobBounds.max}
                              />
                              <p className="mt-1 text-[11px] text-[#6b7280]">
                                Allowed age: {MENTOR_MIN_AGE} to {MENTOR_MAX_AGE} years
                              </p>
                            </div>
                            <div className="group">
                              <label htmlFor="gender" className="block text-xs font-medium text-[#6b7280] mb-1 group-hover:text-[#5b2c91] transition-colors">
                                Gender
                              </label>
                              <CustomSelect
                                id="gender"
                                value={form.gender}
                                onChange={(value) => updateField('gender', value)}
                                options={genderOptions}
                                placeholder="Select Gender"
                              />
                            </div>
                          </div>

                          <div className="rounded-xl border border-[#e6e2f1] bg-gradient-to-br from-[#f9f7ff] to-[#fafafa] p-4 shadow-sm">
                            <p className="text-xs font-semibold tracking-[0.04em] text-[#5b2c91] uppercase flex items-center gap-2">
                              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                              </svg>
                              Location Details
                            </p>
                            <p className="mt-1 text-xs text-[#6b7280]">
                              Select your state first, then choose your city.
                            </p>

                            <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
                              <div className="group">
                                <label htmlFor="stateName" className="block text-xs font-medium text-[#6b7280] mb-1 group-hover:text-[#5b2c91] transition-colors">
                                  State
                                </label>
                                <CustomSelect
                                  id="stateName"
                                  value={form.stateName}
                                  onChange={(value) => updateField('stateName', value)}
                                  options={stateDropdownOptions}
                                  placeholder="Select State"
                                  disabled={locationBusy.states}
                                />
                              </div>

                              <div className="group">
                                <label htmlFor="cityName" className="block text-xs font-medium text-[#6b7280] mb-1 group-hover:text-[#5b2c91] transition-colors">
                                  City
                                </label>
                                <CustomSelect
                                  id="cityName"
                                  value={form.cityName}
                                  onChange={(value) => updateField('cityName', value)}
                                  options={cityDropdownOptions}
                                  placeholder="Select City"
                                  disabled={!form.stateName || locationBusy.cities}
                                />
                              </div>
                            </div>

                            {locationError && (
                              <p className="mt-2 text-xs text-red-600 flex items-center gap-1 animate-fadeIn">
                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                </svg>
                                {locationError}
                              </p>
                            )}

                            {form.stateName && form.cityName && (
                              <div className="mt-3 inline-flex items-center rounded-full border border-[#d9c7f7] bg-white px-3 py-1 text-xs text-[#4a2374] shadow-sm animate-fadeIn">
                                <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                                </svg>
                                {form.cityName}, {form.stateName}
                              </div>
                            )}
                          </div>

                          <div className="group">
                            <label className="block text-xs font-medium text-[#6b7280] mb-1 group-hover:text-[#5b2c91] transition-colors">
                              Languages Spoken
                            </label>
                            <div className="w-full rounded-lg border border-[#d7d0e2] bg-white px-4 py-3 hover:border-[#5b2c91] transition-colors duration-200">
                              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                {languagesOptions.map((lang) => (
                                  <label key={lang} className="inline-flex items-center gap-2 text-sm text-[#111827] cursor-pointer group/checkbox hover:text-[#5b2c91] transition-colors">
                                    <input
                                      type="checkbox"
                                      className="accent-[#5b2c91] w-4 h-4 cursor-pointer rounded focus:ring-2 focus:ring-[#5b2c91] focus:ring-offset-1"
                                      checked={selectedLanguages.includes(lang)}
                                      onChange={() => toggleMultiCheckbox(lang, setSelectedLanguages)}
                                    />
                                    <span className="select-none">{lang}</span>
                                  </label>
                                ))}
                              </div>
                            </div>
                            <p className="text-xs text-[#6b7280] mt-1">
                              Select one or more languages.
                            </p>
                          </div>
                        </div>
                      )}

                      {formSection === 2 && (
                        <div className="space-y-4 animate-fadeIn">
                          <div className="group">
                            <label className="block text-xs font-medium text-[#6b7280] mb-1 group-hover:text-[#5b2c91] transition-colors">
                              Mentor Care Areas
                            </label>
                            <div className="w-full rounded-lg border border-[#d7d0e2] bg-white px-4 py-3 hover:border-[#5b2c91] transition-colors duration-200">
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                {careAreaOptions.map((area) => (
                                  <label key={area} className="inline-flex items-center gap-2 text-sm text-[#111827] cursor-pointer group/checkbox hover:text-[#5b2c91] transition-colors">
                                    <input
                                      type="checkbox"
                                      className="accent-[#5b2c91] w-4 h-4 cursor-pointer rounded focus:ring-2 focus:ring-[#5b2c91] focus:ring-offset-1"
                                      checked={selectedCareAreas.includes(area)}
                                      onChange={() => toggleMultiCheckbox(area, setSelectedCareAreas)}
                                    />
                                    <span className="select-none">{area}</span>
                                  </label>
                                ))}
                              </div>
                            </div>
                            <p className="text-xs text-[#6b7280] mt-1">
                              Select one or more care areas.
                            </p>
                          </div>

                          <div className="group">
                            <label htmlFor="qualification" className="block text-xs font-medium text-[#6b7280] mb-1 group-hover:text-[#5b2c91] transition-colors">
                              Educational Qualification
                            </label>
                            <input
                              id="qualification"
                              className="w-full rounded-lg border border-[#d7d0e2] bg-white px-4 py-2.5 text-sm text-[#111827] 
                                focus:outline-none focus:ring-2 focus:ring-[#5b2c91] focus:border-transparent 
                                transition-all duration-200 hover:border-[#5b2c91] placeholder:text-[#9ca3af]"
                              placeholder="e.g. PhD in Psychology"
                              value={form.qualification}
                              onChange={(event) => updateField('qualification', event.target.value)}
                            />
                          </div>

                          <div className="group">
                            <label htmlFor="bio" className="block text-xs font-medium text-[#6b7280] mb-1 group-hover:text-[#5b2c91] transition-colors">
                              Brief Bio
                            </label>
                            <textarea
                              id="bio"
                              rows={3}
                              className="w-full rounded-lg border border-[#d7d0e2] bg-white px-4 py-2.5 text-sm text-[#111827] 
                                focus:outline-none focus:ring-2 focus:ring-[#5b2c91] focus:border-transparent 
                                transition-all duration-200 hover:border-[#5b2c91] resize-none placeholder:text-[#9ca3af]"
                              placeholder="Tell us a bit about your professional background..."
                              value={form.bio}
                              onChange={(event) => updateField('bio', event.target.value)}
                            />
                          </div>

                          <label className="flex items-start gap-2 text-xs sm:text-sm text-[#6b7280] cursor-pointer group hover:text-[#5b2c91] transition-colors p-3 rounded-lg hover:bg-[#f9f7ff]">
                            <input
                              id="consent"
                              type="checkbox"
                              className="mt-0.5 sm:mt-1 accent-[#5b2c91] w-4 h-4 cursor-pointer rounded focus:ring-2 focus:ring-[#5b2c91] focus:ring-offset-1"
                              checked={form.consent}
                              onChange={(event) => updateField('consent', event.target.checked)}
                            />
                            <span className="select-none">I agree to share my information for background verification purposes.</span>
                          </label>
                        </div>
                      )}
                    </section>

                    {(errorMessage || infoMessage) && (
                      <div className={`rounded-lg p-3 flex items-center gap-2 animate-fadeIn ${
                        errorMessage 
                          ? 'bg-red-50 border border-red-200 text-red-700' 
                          : 'bg-green-50 border border-green-200 text-green-700'
                      }`}>
                        {errorMessage ? (
                          <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                          </svg>
                        ) : (
                          <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                        )}
                        <p className="text-sm">{errorMessage || infoMessage}</p>
                      </div>
                    )}

                    <div className="flex items-center justify-end gap-3">
                      {formSection === 2 && (
                        <button
                          type="button"
                          className="rounded-lg border-2 border-[#d7d0e2] px-5 py-2.5 text-sm font-medium text-[#374151] 
                            hover:bg-[#f9fafb] hover:border-[#5b2c91] transition-all duration-200 shadow-sm"
                          onClick={() => setFormSection(1)}
                        >
                          ← Back
                        </button>
                      )}
                      {formSection === 1 ? (
                        <button
                          type="button"
                          className="rounded-lg bg-gradient-to-r from-[#5b2c91] to-[#4a2374] hover:from-[#4a2374] hover:to-[#3a1d5f] 
                            text-white px-5 py-2.5 text-sm font-semibold transition-all duration-200 shadow-lg hover:shadow-xl 
                            active:scale-[0.98] flex items-center gap-2"
                          onClick={handleContinueToProfile}
                        >
                          Next
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </button>
                      ) : (
                        <button
                          type="button"
                          className="rounded-lg bg-gradient-to-r from-[#5b2c91] to-[#4a2374] hover:from-[#4a2374] hover:to-[#3a1d5f] 
                            text-white px-5 py-2.5 text-sm font-semibold transition-all duration-200 shadow-lg hover:shadow-xl 
                            active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center gap-2"
                          disabled={actionBusy.submit}
                          onClick={handleSubmit}
                        >
                          {actionBusy.submit ? (
                            <>
                              <Spinner size="sm" />
                              Submitting...
                            </>
                          ) : (
                            <>
                              Submit Application
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                            </>
                          )}
                        </button>
                      )}
                    </div>

                    {formSection === 2 && (
                      <p className="text-center text-xs text-[#6b7280] leading-relaxed animate-fadeIn">
                        By continuing, you agree to our{' '}
                        <a href="/terms" className="underline hover:text-[#5b2c91] transition-colors">Terms &amp; Conditions</a>
                        {' '}and{' '}
                        <a href="/privacy" className="underline hover:text-[#5b2c91] transition-colors">Privacy Policy</a>
                      </p>
                    )}
                  </form>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* OTP Modal */}
      {otpModal.open && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn"
          role="dialog"
          aria-modal="true"
          onClick={closeOtpModal}
        >
          <div
            className="w-full max-w-sm rounded-2xl bg-white border border-[#e6e2f1] shadow-2xl p-6 animate-scaleIn"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-[#1f2937] flex items-center gap-2">
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-r from-[#e9ddff] to-[#f3ecff]">
                  {otpModal.channel === 'email' ? (
                    <svg className="block h-5 w-5 text-[#5b2c91]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  ) : (
                    <svg className="block h-5 w-5 text-[#5b2c91]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                  )}
                </span>
                Verify {otpModal.channel === 'email' ? 'Email' : 'Mobile'}
              </h3>
              <button
                onClick={closeOtpModal}
                className="text-[#6b7280] hover:text-[#1f2937] transition-colors"
                disabled={isOtpSending || isOtpVerifying}
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <p className="text-sm text-[#6b7280] mb-4">
              Enter the 6-digit OTP sent to your {otpModal.channel === 'email' ? 'email' : 'mobile number'}.
            </p>

            <input
              type="text"
              inputMode="numeric"
              maxLength={6}
              className="w-full rounded-lg border-2 border-[#d7d0e2] bg-white px-4 py-3 text-center text-lg font-semibold 
                text-[#111827] tracking-widest focus:outline-none focus:ring-2 focus:ring-[#5b2c91] focus:border-transparent 
                transition-all duration-200 hover:border-[#5b2c91]"
              placeholder="● ● ● ● ● ●"
              value={otpModal.otp}
              onChange={(event) =>
                setOtpModal((prev) => ({
                  ...prev,
                  otp: event.target.value.replace(/\D/g, '').slice(0, 6),
                }))
              }
              autoFocus
            />

            {otpModal.channel === 'email' && emailHint && (
              <p className="mt-3 text-xs text-[#5b2c91] bg-[#f3ecff] rounded-lg p-2 animate-fadeIn">
                🔑 {emailHint}
              </p>
            )}
            {otpModal.channel === 'phone' && phoneHint && (
              <p className="mt-3 text-xs text-[#5b2c91] bg-[#f3ecff] rounded-lg p-2 animate-fadeIn">
                🔑 {phoneHint}
              </p>
            )}
            {isDev && (
              <p className="mt-3 text-xs text-[#6b7280] bg-[#f9fafb] rounded-lg p-2 animate-fadeIn">
                🧪 Local test OTP: 123456
              </p>
            )}

            <div className="mt-5 flex items-center justify-between gap-3">
              <button
                type="button"
                className="text-xs text-[#5b2c91] hover:text-[#4a2374] underline disabled:opacity-60 disabled:no-underline 
                  transition-all duration-200 flex items-center gap-1"
                onClick={() => handleSendOtp(otpModal.channel, { registerIfNeeded: false })}
                disabled={isOtpSending || isOtpVerifying || activeCooldown > 0}
              >
                {isOtpSending ? (
                  <>
                    <Spinner size="sm" />
                    Sending...
                  </>
                ) : activeCooldown > 0 ? (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Resend in {formatCooldown(activeCooldown)}
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Resend OTP
                  </>
                )}
              </button>
              
              <button
                type="button"
                className="rounded-lg bg-gradient-to-r from-[#5b2c91] to-[#4a2374] hover:from-[#4a2374] hover:to-[#3a1d5f] 
                  text-white px-5 py-2 text-sm font-semibold transition-all duration-200 shadow-lg hover:shadow-xl 
                  active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                onClick={() => handleVerifyOtp(otpModal.channel, otpModal.otp)}
                disabled={isOtpSending || isOtpVerifying || otpModal.otp.length !== 6}
              >
                {isOtpVerifying ? (
                  <>
                    <Spinner size="sm" />
                    Verifying...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Verify OTP
                  </>
                )}
              </button>
            </div>

            {(otpErrorMessage || otpInfoMessage) && (
              <div className={`mt-4 rounded-lg p-3 flex items-center gap-2 text-sm animate-fadeIn ${
                otpErrorMessage 
                  ? 'bg-red-50 border border-red-200 text-red-700' 
                  : 'bg-green-50 border border-green-200 text-green-700'
              }`}>
                {otpErrorMessage ? (
                  <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                )}
                <p>{otpErrorMessage || otpInfoMessage}</p>
              </div>
            )}
          </div>
        </div>
      )}

      <BottomAuth />
    </div>
  );
};

export default MentorRegister;
