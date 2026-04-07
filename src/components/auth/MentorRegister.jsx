import React, { useEffect, useRef, useState } from 'react';
import TopAuth from './TopAuth';
import BottomAuth from './BottomAuth';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import mentorLeft from '../assets/teach1.png';
import mentorBottom from '../assets/teach2.png';
import imageContainer from '../assets/Image Container.png';
import { useMentorAuth } from '../../apis/apihook/useMentorAuth';
import { setPendingMentorRegistration } from '../../apis/api/storage';
import { UserRound, Briefcase, Camera } from 'lucide-react';
import BoundedDatePicker from '../shared/BoundedDatePicker';
import '../LandingPage.css';
import './Register.css';

const MENTOR_MIN_AGE = 25;
const MENTOR_MAX_AGE = 65;

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
const MOBILE_DIGITS_LENGTH = 10;
const BIO_MAX_WORDS = 1000;
const CONTINUOUS_TEXT_WORD_CHUNK = 8;
const normalizePhone = (value) => String(value || '').replace(/\D/g, '');
const countWords = (value) => {
  const text = String(value || '').trim();
  if (!text) return 0;

  const tokens = text.split(/\s+/).filter(Boolean);
  return tokens.reduce((count, token) => (
    count + Math.max(1, Math.ceil(token.length / CONTINUOUS_TEXT_WORD_CHUNK))
  ), 0);
};
const truncateToWordLimit = (value, maxWords) => {
  const text = String(value || '');
  if (!text.trim()) return text;

  const parts = text.split(/(\s+)/);
  const output = [];
  let words = 0;

  for (const part of parts) {
    if (!part) continue;
    if (/^\s+$/.test(part)) {
      output.push(part);
      continue;
    }
    const tokenWords = Math.max(1, Math.ceil(part.length / CONTINUOUS_TEXT_WORD_CHUNK));
    const remaining = maxWords - words;
    if (remaining <= 0) break;
    if (tokenWords <= remaining) {
      output.push(part);
      words += tokenWords;
      continue;
    }

    const allowedChars = remaining * CONTINUOUS_TEXT_WORD_CHUNK;
    if (allowedChars > 0) {
      output.push(part.slice(0, allowedChars));
    }
    words = maxWords;
    break;
  }

  return output.join('').trimEnd();
};
const COUNTRY_OPTIONS = ['India', 'USA'];
const COUNTRY_DIAL_CODE = {
  India: '+91',
  USA: '+1',
};
const LOCATION_OPTIONS = {
  India: {
    states: ['Tamil Nadu'],
    citiesByState: {
      'Tamil Nadu': [
        'Arcot',
        'Chengalpattu',
        'Chennai',
        'Chidambaram',
        'Coimbatore',
        'Cuddalore',
        'Dharmapuri',
        'Dindigul',
        'Erode',
        'Kanchipuram',
        'Kanniyakumari',
        'Kodaikanal',
        'Kumbakonam',
        'Madurai',
        'Mamallapuram',
        'Nagappattinam',
        'Nagercoil',
        'Palayamkottai',
        'Pudukkottai',
        'Rajapalayam',
        'Ramanathapuram',
        'Salem',
        'Thanjavur',
        'Tiruchchirappalli',
        'Tirunelveli',
        'Tiruppur',
        'Thoothukudi',
        'Udhagamandalam',
        'Vellore',
      ],
    },
  },
  USA: {
    states: ['Texas'],
    citiesByState: {
      Texas: ['Houston'],
    },
  },
};
const MENTOR_REGISTER_DRAFT_KEY = 'bondroom:mentor-register-draft:v1';

const readMentorRegisterDraft = () => {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(MENTOR_REGISTER_DRAFT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return null;
    return parsed;
  } catch {
    return null;
  }
};

const clearMentorRegisterDraft = () => {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(MENTOR_REGISTER_DRAFT_KEY);
  } catch {
    // ignore storage errors
  }
};

// Custom Select Component
const CustomSelect = ({ id, value, onChange, options, placeholder, disabled, error = false, className = '' }) => {
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
        <span className={selectedOption ? 'text-[#111827]' : error ? 'text-red-500' : 'text-[#9ca3af]'}>
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
  const location = useLocation();
  const languagesOptions = ['Tamil', 'English', 'Telugu', 'Kannada', 'Malayalam', 'Hindi'];
  const careAreaOptions = [
    'Anxiety',
    'Relationships',
    'Academic Stress',
    'Exam Pressure',
    'Parent Expectations',
    'Friend Issues',
    'Future Anxiety (Career/College)',
    'Concentration Struggles',
    'Study Struggles',
    'Motivation',
    'Stress Relief Strategies',
    'Life Advice / Perspective',
    'Someone to Listen',
  ];
  const navigate = useNavigate();
  const { registerMentor, sendMentorOtp, verifyMentorOtp } = useMentorAuth();
  const [errorMessage, setErrorMessage] = useState('');
  const [infoMessage, setInfoMessage] = useState('');
  const [otpErrorMessage, setOtpErrorMessage] = useState('');
  const [otpInfoMessage, setOtpInfoMessage] = useState('');
  const [toastState, setToastState] = useState({
    open: false,
    message: '',
    type: 'success',
  });
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
    country: 'India',
    dob: '',
    gender: '',
    stateName: 'Tamil Nadu',
    cityName: 'Chennai',
    postalCode: '',
    qualification: '',
    bio: '',
    consent: false,
  });
  const [stateOptions, setStateOptions] = useState([]);
  const [cityOptions, setCityOptions] = useState([]);
  const [touchedFields, setTouchedFields] = useState({});
  const [validationState, setValidationState] = useState({
    sectionOne: false,
    submit: false,
  });
  const [locationBusy, setLocationBusy] = useState({
    states: false,
    cities: false,
  });
  const [locationError, setLocationError] = useState('');
  const [resendCooldown, setResendCooldown] = useState({
    email: 0,
    phone: 0,
  });
  const [draftReady, setDraftReady] = useState(false);
  const bioTextareaRef = useRef(null);
  const profileImageInputRef = useRef(null);
  const cameraVideoRef = useRef(null);
  const cameraCanvasRef = useRef(null);
  const cameraStreamRef = useRef(null);
  const profileImageMenuRef = useRef(null);
  const [profileImageFile, setProfileImageFile] = useState(null);
  const [profileImagePreview, setProfileImagePreview] = useState('');
  const [profileImageMenuOpen, setProfileImageMenuOpen] = useState(false);
  const [cameraModalOpen, setCameraModalOpen] = useState(false);
  const [cameraErrorMessage, setCameraErrorMessage] = useState('');
  const isDev = Boolean(import.meta?.env?.DEV);
  const dobBounds = getMentorDobBounds();
  const dialCode = COUNTRY_DIAL_CODE[form.country] || '+91';
  const sectionOneFieldKeys = new Set([
    'firstName',
    'lastName',
    'email',
    'mobile',
    'country',
    'dob',
    'gender',
    'stateName',
    'cityName',
    'postalCode',
    'languages',
  ]);

  useEffect(() => {
    return () => {
      if (profileImagePreview && profileImagePreview.startsWith('blob:')) {
        URL.revokeObjectURL(profileImagePreview);
      }
      if (cameraStreamRef.current) {
        cameraStreamRef.current.getTracks().forEach((track) => track.stop());
        cameraStreamRef.current = null;
      }
    };
  }, [profileImagePreview]);

  useEffect(() => {
    if (!profileImageMenuOpen) return undefined;
    const handleOutside = (event) => {
      if (!profileImageMenuRef.current?.contains(event.target)) {
        setProfileImageMenuOpen(false);
      }
    };
    window.addEventListener('mousedown', handleOutside);
    return () => window.removeEventListener('mousedown', handleOutside);
  }, [profileImageMenuOpen]);

  useEffect(() => {
    const draft = readMentorRegisterDraft();
    if (!draft) {
      setDraftReady(true);
      return;
    }

    if (draft.form && typeof draft.form === 'object') {
      setForm((prev) => ({ ...prev, ...draft.form }));
    }
    if (Array.isArray(draft.selectedLanguages)) {
      setSelectedLanguages(draft.selectedLanguages);
    }
    if (Array.isArray(draft.selectedCareAreas)) {
      setSelectedCareAreas(draft.selectedCareAreas);
    }
    if (typeof draft.emailVerified === 'boolean') {
      setEmailVerified(draft.emailVerified);
    }
    if (typeof draft.phoneVerified === 'boolean') {
      setPhoneVerified(draft.phoneVerified);
    }
    if (typeof draft.mentorId === 'number' || draft.mentorId === null) {
      setMentorId(draft.mentorId);
    }
    if (typeof draft.formSection === 'number' && (draft.formSection === 1 || draft.formSection === 2)) {
      setFormSection(draft.formSection);
    }
    if (draft.touchedFields && typeof draft.touchedFields === 'object') {
      setTouchedFields(draft.touchedFields);
    }
    if (draft.validationState && typeof draft.validationState === 'object') {
      setValidationState((prev) => ({ ...prev, ...draft.validationState }));
    }
    if (typeof draft.emailHint === 'string') {
      setEmailHint(draft.emailHint);
    }
    if (typeof draft.phoneHint === 'string') {
      setPhoneHint(draft.phoneHint);
    }
    setDraftReady(true);
  }, []);

  useEffect(() => {
    if (!draftReady) return;
    if (typeof window === 'undefined') return;
    const payload = {
      form,
      selectedLanguages,
      selectedCareAreas,
      emailVerified,
      phoneVerified,
      mentorId,
      formSection,
    touchedFields,
    validationState,
    emailHint,
    phoneHint,
  };
    try {
      window.localStorage.setItem(MENTOR_REGISTER_DRAFT_KEY, JSON.stringify(payload));
    } catch {
      // ignore storage errors
    }
  }, [
    form,
    selectedLanguages,
    selectedCareAreas,
    emailVerified,
    phoneVerified,
    mentorId,
    formSection,
    touchedFields,
    validationState,
    emailHint,
    phoneHint,
    draftReady,
  ]);

  const toggleMultiCheckbox = (value, setter) => {
    setter((prev) => {
      if (prev.includes(value)) {
        return prev.filter((item) => item !== value);
      }
      return [...prev, value];
    });
  };

  const markFieldTouched = (key) => {
    setTouchedFields((prev) => (prev[key] ? prev : { ...prev, [key]: true }));
  };

  const getInputClasses = (hasError) =>
    `w-full rounded-lg border px-4 py-2.5 text-sm transition-all duration-200 ${
      hasError
        ? 'border-red-300 bg-red-50 text-red-900 placeholder:text-red-400 hover:border-red-400 focus:outline-none focus:ring-2 focus:ring-red-200 focus:border-red-400'
        : 'border-[#d7d0e2] bg-white text-[#111827] hover:border-[#5b2c91] focus:outline-none focus:ring-2 focus:ring-[#5b2c91] focus:border-transparent placeholder:text-[#9ca3af]'
    }`;

  const getPanelClasses = (hasError) =>
    `w-full rounded-lg border px-4 py-3 transition-colors duration-200 ${
      hasError
        ? 'border-red-300 bg-red-50 hover:border-red-400'
        : 'border-[#d7d0e2] bg-white hover:border-[#5b2c91]'
    }`;

  const handleProfileImageChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setErrorMessage('Please select a valid image file.');
      return;
    }
    if (profileImagePreview && profileImagePreview.startsWith('blob:')) {
      URL.revokeObjectURL(profileImagePreview);
    }
    const objectUrl = URL.createObjectURL(file);
    setProfileImageFile(file);
    setProfileImagePreview(objectUrl);
  };

  const stopCameraStream = () => {
    if (cameraStreamRef.current) {
      cameraStreamRef.current.getTracks().forEach((track) => track.stop());
      cameraStreamRef.current = null;
    }
    if (cameraVideoRef.current) {
      cameraVideoRef.current.srcObject = null;
    }
  };

  const closeCameraModal = () => {
    setCameraModalOpen(false);
    setCameraErrorMessage('');
    stopCameraStream();
  };

  const openCameraModal = async () => {
    setProfileImageMenuOpen(false);
    setCameraErrorMessage('');
    setCameraModalOpen(true);
    if (!navigator?.mediaDevices?.getUserMedia) {
      setCameraErrorMessage('Camera is not supported on this device/browser.');
      setCameraModalOpen(false);
      return;
    }
    try {
      let stream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'user' },
          audio: false,
        });
      } catch {
        stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false,
        });
      }
      cameraStreamRef.current = stream;
      window.setTimeout(() => {
        const video = cameraVideoRef.current;
        if (!video) return;
        video.srcObject = stream;
        video.muted = true;
        video.playsInline = true;
        video.onloadedmetadata = () => {
          video.play().catch(() => {
            setCameraErrorMessage('Unable to start live preview. Please try again.');
          });
        };
      }, 0);
    } catch {
      setCameraErrorMessage('Unable to access camera. Please allow camera permission.');
      stopCameraStream();
      setCameraModalOpen(false);
    }
  };

  const captureFromCamera = () => {
    const video = cameraVideoRef.current;
    const canvas = cameraCanvasRef.current;
    if (!video || !canvas) return;
    if (!video.videoWidth || !video.videoHeight) {
      setCameraErrorMessage('Camera not ready. Please wait a moment and try again.');
      return;
    }
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const context = canvas.getContext('2d');
    if (!context) return;
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    canvas.toBlob((blob) => {
      if (!blob) return;
      if (profileImagePreview && profileImagePreview.startsWith('blob:')) {
        URL.revokeObjectURL(profileImagePreview);
      }
      const file = new File([blob], `mentor-profile-${Date.now()}.png`, { type: 'image/png' });
      setProfileImageFile(file);
      setProfileImagePreview(URL.createObjectURL(file));
      closeCameraModal();
    }, 'image/png');
  };

  const updateField = (key, value) => {
    markFieldTouched(key);
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
      const digitsOnly = normalizePhone(value).slice(0, MOBILE_DIGITS_LENGTH);
      setForm((prev) => ({ ...prev, mobile: digitsOnly }));
      return;
    }
    if (key === 'country') {
      const nextCountry = value;
      const fallbackStates = LOCATION_OPTIONS[nextCountry]?.states || [];
      const fallbackState = fallbackStates[0] || '';
      const nextState = fallbackState;
      const fallbackCities = LOCATION_OPTIONS[nextCountry]?.citiesByState?.[nextState] || [];
      const nextCity = fallbackCities[0] || '';
      setForm((prev) => ({
        ...prev,
        country: nextCountry,
        stateName: nextState,
        cityName: nextCity,
        postalCode: '',
      }));
      return;
    }
    if (key === 'stateName') {
      setForm((prev) => ({ ...prev, stateName: value, cityName: '' }));
      return;
    }
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  useEffect(() => {
    const states = LOCATION_OPTIONS[form.country]?.states || [];
    setStateOptions(states);
    setLocationBusy((prev) => ({ ...prev, states: false }));
    setLocationError('');

    if (!states.length) return;
    if (!states.includes(form.stateName)) {
      const firstState = states[0];
      const firstCity = LOCATION_OPTIONS[form.country]?.citiesByState?.[firstState]?.[0] || '';
      setForm((prev) => ({
        ...prev,
        stateName: firstState,
        cityName: firstCity,
      }));
    }
  }, [form.country, form.stateName]);

  useEffect(() => {
    const cities = LOCATION_OPTIONS[form.country]?.citiesByState?.[form.stateName] || [];
    setCityOptions(cities);
    setLocationBusy((prev) => ({ ...prev, cities: false }));
    setLocationError('');

    if (!cities.length) return;
    if (!cities.includes(form.cityName)) {
      setForm((prev) => ({ ...prev, cityName: cities[0] || '' }));
    }
  }, [form.country, form.stateName, form.cityName]);

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

  useEffect(() => {
    if (!toastState.open) {
      return undefined;
    }
    const timer = window.setTimeout(() => {
      setToastState((prev) => ({ ...prev, open: false }));
    }, 3000);
    return () => window.clearTimeout(timer);
  }, [toastState.open, toastState.message]);

  useEffect(() => {
    if (!errorMessage) {
      return;
    }
    setToastState({ open: true, message: errorMessage, type: 'error' });
  }, [errorMessage]);

  useEffect(() => {
    if (!infoMessage) {
      return;
    }
    setToastState({ open: true, message: infoMessage, type: 'success' });
  }, [infoMessage]);

  const getSectionOneErrors = () => {
    const errors = {};
    const mobileDigits = normalizePhone(form.mobile);

    if (!form.firstName.trim()) errors.firstName = 'First name is required.';
    if (!form.lastName.trim()) errors.lastName = 'Last name is required.';
    if (!form.email.trim()) errors.email = 'Email is required.';
    if (!mobileDigits) errors.mobile = 'Mobile number is required.';
    else if (mobileDigits.length !== MOBILE_DIGITS_LENGTH) {
      errors.mobile = 'Mobile number must be exactly 10 digits.';
    }
    if (!form.country) errors.country = 'Country is required.';
    if (!form.dob) errors.dob = 'Date of birth is required.';
    if (!form.gender) errors.gender = 'Gender is required.';
    if (!form.stateName) errors.stateName = 'State is required.';
    if (!form.cityName) errors.cityName = 'City is required.';
    if (!form.postalCode.trim()) errors.postalCode = 'Pincode is required.';
    if (!selectedLanguages.length) errors.languages = 'Select at least one language.';
    if (form.dob && (form.dob < dobBounds.min || form.dob > dobBounds.max)) {
      errors.dob = `Mentor age must be between ${MENTOR_MIN_AGE} and ${MENTOR_MAX_AGE} years.`;
    }

    return errors;
  };

  const getRegistrationErrors = () => {
    const errors = getSectionOneErrors();
    if (!form.qualification.trim()) {
      errors.qualification = 'Educational qualification is required.';
    }
    if (!form.bio.trim()) {
      errors.bio = 'Brief bio is required.';
    } else if (countWords(form.bio) > BIO_MAX_WORDS) {
      errors.bio = `Brief bio must be ${BIO_MAX_WORDS} words or fewer.`;
    }
    if (!selectedCareAreas.length) {
      errors.careAreas = 'Select at least one mentor care area.';
    }
    if (!form.consent) {
      errors.consent = 'Please accept the mentor declaration before submitting.';
    }
    return errors;
  };

  const getFirstErrorMessage = (errors) => Object.values(errors)[0] || '';
  const showToast = (message, type = 'success') => {
    setToastState({ open: true, message, type });
  };

  const validateSectionOneForm = () => getFirstErrorMessage(getSectionOneErrors());

  const validateRegistrationForm = () => getFirstErrorMessage(getRegistrationErrors());

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
      mobile: normalizePhone(form.mobile),
      country_code: dialCode,
      dob: form.dob,
      gender: form.gender,
      country: form.country.trim(),
      state: form.stateName.trim(),
      city: form.cityName.trim(),
      postal_code: form.postalCode.trim(),
      city_state: `${form.cityName}, ${form.stateName}, ${form.country} (${form.postalCode.trim()})`,
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
    if (profileImageFile) {
      const formData = new FormData();
      Object.entries(payload).forEach(([key, value]) => {
        if (value === null || value === undefined) return;
        if (Array.isArray(value)) {
          value.forEach((item) => formData.append(key, String(item)));
          return;
        }
        if (typeof value === 'boolean') {
          formData.append(key, value ? 'true' : 'false');
          return;
        }
        formData.append(key, String(value));
      });
      formData.append('profile_image', profileImageFile);
      return formData;
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
      payload.mobile = normalizePhone(form.mobile);
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
      mobile: normalizePhone(form.mobile),
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
      const fieldValue = channel === 'email' ? form.email.trim() : normalizePhone(form.mobile);
      if (!fieldValue) {
        throw new Error(channel === 'email' ? 'Please enter your email first.' : 'Please enter your mobile number first.');
      }
      if (channel === 'phone' && fieldValue.length !== MOBILE_DIGITS_LENGTH) {
        throw new Error('Mobile number must be exactly 10 digits.');
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
    const fieldValue = channel === 'email' ? form.email.trim() : normalizePhone(form.mobile);
    if (!fieldValue) {
      const message = channel === 'email' ? 'Please enter your email first.' : 'Please enter your mobile number first.';
      setErrorMessage(message);
      setOtpErrorMessage(message);
      return;
    }
    if (channel === 'phone' && fieldValue.length !== MOBILE_DIGITS_LENGTH) {
      const message = 'Mobile number must be exactly 10 digits.';
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
      showToast(`${channel === 'email' ? 'Email' : 'Phone'} verified successfully.`);
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
    setValidationState((prev) => ({ ...prev, sectionOne: true }));

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
    setValidationState((prev) => ({ ...prev, submit: true, sectionOne: true }));

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
      clearMentorRegisterDraft();
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
    { value: '', label: 'Select State' },
    ...stateOptions.map(state => ({ value: state, label: state }))
  ];

  const cityDropdownOptions = [
    { 
      value: '', 
      label: !form.stateName 
        ? 'Select State First' 
        : 'Select City' 
    },
    ...cityOptions.map(city => ({ value: city, label: city }))
  ];

  const genderOptions = [
    { value: '', label: 'Select Gender' },
    { value: 'Female', label: 'Female' },
    { value: 'Male', label: 'Male' }
  ];

  const qualificationOptions = [
    { value: '', label: 'Select Qualification' },
    { value: 'High School', label: 'High School' },
    { value: "Bachelor's Degree", label: "Bachelor's Degree" },
    { value: "Master's Degree", label: "Master's Degree" },
    { value: 'Doctorate (PhD)', label: 'Doctorate (PhD)' },
    { value: 'Professional Certification', label: 'Professional Certification' },
    
  ];

  const sectionOneErrors = getSectionOneErrors();
  const registrationErrors = getRegistrationErrors();
  const searchParams = new URLSearchParams(location.search);
  const isEventFlowLock = searchParams.get('source') === 'event-flow';
  const registerTabHref = isEventFlowLock ? `/register?${searchParams.toString()}` : '/register';
  const shouldShowError = (fieldKey) => {
    const isSectionOneField = sectionOneFieldKeys.has(fieldKey);
    const attempted = isSectionOneField
      ? validationState.sectionOne || validationState.submit
      : validationState.submit;
    return Boolean(registrationErrors[fieldKey] && (touchedFields[fieldKey] || attempted));
  };
  const bioWordCount = countWords(form.bio);

  const handleBioChange = (value) => {
    const limitedValue = truncateToWordLimit(value, BIO_MAX_WORDS);
    updateField('bio', limitedValue);
    const textarea = bioTextareaRef.current;
    if (!textarea) return;
    textarea.style.height = 'auto';
    textarea.style.height = `${Math.min(textarea.scrollHeight, 420)}px`;
  };

  useEffect(() => {
    if (!isEventFlowLock) return;
    navigate(registerTabHref, { replace: true });
  }, [isEventFlowLock, navigate, registerTabHref]);

  return (
    <div className="mentor-register-page lp-register text-[#1f2937]">
      {toastState.open && (
        <div className={`fixed right-4 top-4 z-[70] max-w-xs rounded-lg border px-4 py-3 shadow-lg animate-fadeIn ${
          toastState.type === 'error'
            ? 'border-red-200 bg-red-50 text-red-700'
            : 'border-green-200 bg-green-50 text-green-700'
        }`}>
          <p className="text-sm font-medium">{toastState.message}</p>
        </div>
      )}
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

      <main className="lp-register-main">
        <div className="lp-register-orb lp-register-orb-a" />
        <div className="lp-register-orb lp-register-orb-b" />
        <div className="lp-register-shell animate-scaleIn">
          <div className="lp-register-grid">
              {/* Left Panel */}
              <div className="relative hidden h-full min-h-0 overflow-hidden bg-transparent xl:grid xl:grid-rows-2">
                <img
                  src={imageContainer}
                  alt=""
                  aria-hidden="true"
                  className="absolute left-1/2 top-1/2 z-10 h-[200px] w-[200px] -translate-x-1/2 -translate-y-1/2 animate-pulse-slow md:h-[280px] md:w-[280px] lg:h-[340px] lg:w-[340px]"
                />
                <div className="grid min-h-0 grid-cols-[1.05fr_1fr]">
                  <div className="min-h-0 overflow-hidden">
                    <img
                      src={mentorLeft}
                      alt="Mentor guidance"
                      className="h-full w-full object-cover transition-transform duration-700 hover:scale-105"
                    />
                  </div>
                  <div className="relative flex min-h-0 flex-col items-center justify-center bg-[#5b2c91] px-10 pb-8 pt-8 lg:px-12 text-white">
                    <div className="relative z-20 max-w-[280px] text-left animate-fadeIn">
                      <h3 className="font-sans text-[37px] font-bold leading-[36.5px]">
                        Join a
                        <br />
                        community
                        <br />
                        built on trust
                        <br />
                        and care.
                      </h3>
                      <p className="mt-3 font-sans text-[16px] font-normal leading-[22.5px] text-white/90">
                        Your guidance can help a student feel seen -- beyond marks, ranks, and expectations.
                      </p>
                    </div>
                  </div>
                </div>
                <div className="grid min-h-0 grid-cols-[1.05fr_1fr]">
                  <div className="flex min-h-0 items-center justify-center bg-[#f2c94c] p-6 text-[#1f2937]">
                    <ul className="relative z-20 mx-auto max-w-[300px] list-disc space-y-3 pl-5 text-sm font-medium leading-6 text-[#1f2937] animate-fadeIn">
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
              </div>

              {/* Right Panel - Form */}
              <div className="bg-white p-4 text-[#1f2937] sm:p-6 lg:p-10">
                <div className="max-w-2xl mx-auto md:max-w-none md:mx-0 animate-slideUp">
                  <div className="inline-flex items-center rounded-full bg-gradient-to-r from-[#e9ddff] to-[#f3ecff] text-xs text-[#5b2c91] px-3 py-1 font-medium shadow-sm">
                    <span className="inline-block w-2 h-2 bg-[#5b2c91] rounded-full mr-2 animate-pulse"></span>
                    Mentor Registration
                  </div>
                  <h2 className="mt-3 text-xl sm:text-2xl font-semibold text-[#1f2937] bg-gradient-to-r from-[#5b2c91] to-[#4a2374] bg-clip-text text-transparent">
                    Register your Mentor account
                  </h2>
                  <p className="mt-1 text-sm text-[#6b7280]">
                    Create your mentor profile and verify details in one flow.
                  </p>
                  <div className="mt-3 inline-flex items-center gap-1 rounded-xl border border-[#e7e2f6] bg-[#f7f2ff] p-1">
                    <Link
                      to={registerTabHref}
                      className="rounded-lg px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-[#5b4a78] hover:text-[#4a2a7a]"
                    >
                      Mentee / Volunteer
                    </Link>
                    <Link
                      to="/mentor-register"
                      aria-current="page"
                      className="rounded-lg bg-white px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-[#4a2a7a] shadow-sm"
                    >
                      Mentor
                    </Link>
                  </div>
                  <p className="mt-4 text-xs sm:text-sm text-[#6b7280]">
                    Bond Room connects students with trusted mentors who listen without judgment.
                    Tell us about yourself so we can match you thoughtfully.
                  </p>

                  <form className="mt-6 space-y-4" onSubmit={(event) => event.preventDefault()}>
                    <section className="rounded-xl border border-[#e6e2f1] p-4 sm:p-5 space-y-4 bg-gradient-to-br from-white to-[#fafafa] shadow-sm hover:shadow-md transition-shadow duration-300">
                      <div className="flex items-center justify-between gap-3">
                        <h3 className="text-sm font-semibold text-[#1f2937] flex items-center gap-2">
                          {formSection === 1 ? (
                            <UserRound size={14} className="text-[#5b2c91]" aria-hidden="true" />
                          ) : (
                            <Briefcase size={14} className="text-[#5b2c91]" aria-hidden="true" />
                          )}
                          {formSection === 1 ? 'Personal Info' : 'Mentor Profile'}
                        </h3>
                        <span className="rounded-full bg-gradient-to-r from-[#f3ecff] to-[#e9ddff] px-2.5 py-1 text-[11px] font-medium text-[#5b2c91] shadow-sm">
                          Section {formSection} of 3
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
                                className={getInputClasses(shouldShowError('firstName'))}
                                placeholder="e.g. Priya"
                                value={form.firstName}
                                onChange={(event) => updateField('firstName', event.target.value)}
                                onBlur={() => markFieldTouched('firstName')}
                              />
                              {shouldShowError('firstName') && <p className="mt-1 text-xs text-red-600">{sectionOneErrors.firstName}</p>}
                            </div>
                            <div className="group">
                              <label htmlFor="lastName" className="block text-xs font-medium text-[#6b7280] mb-1 group-hover:text-[#5b2c91] transition-colors">
                                Last name
                              </label>
                              <input
                                id="lastName"
                                className={getInputClasses(shouldShowError('lastName'))}
                                placeholder="e.g. Sharma"
                                value={form.lastName}
                                onChange={(event) => updateField('lastName', event.target.value)}
                                onBlur={() => markFieldTouched('lastName')}
                              />
                              {shouldShowError('lastName') && <p className="mt-1 text-xs text-red-600">{sectionOneErrors.lastName}</p>}
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
                                  className={`${getInputClasses(shouldShowError('email'))} min-w-0 flex-1`}
                                  placeholder="name@example.com"
                                  value={form.email}
                                  onChange={(event) => updateField('email', event.target.value)}
                                  onBlur={() => markFieldTouched('email')}
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
                                    || resendCooldown.email > 0
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
                                  ) : resendCooldown.email > 0 ? (
                                    `Resend ${formatCooldown(resendCooldown.email)}`
                                  ) : 'Verify'}
                                </button>
                              </div>
                              {shouldShowError('email') && <p className="mt-1 text-xs text-red-600">{sectionOneErrors.email}</p>}
                            </div>

                            <div className="group">
                              <label htmlFor="mobile" className="block text-xs font-medium text-[#6b7280] mb-1 group-hover:text-[#5b2c91] transition-colors">
                                Mobile Number *
                              </label>
                              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                                <div className={`flex min-w-0 flex-1 rounded-lg border bg-white px-3 transition-all duration-200 ${
                                  shouldShowError('mobile')
                                    ? 'border-red-300 bg-red-50 hover:border-red-400 focus-within:ring-2 focus-within:ring-red-200 focus-within:border-red-400'
                                    : 'border-[#d7d0e2] hover:border-[#5b2c91] focus-within:ring-2 focus-within:ring-[#5b2c91] focus-within:border-transparent'
                                }`}>
                                  <span className="inline-flex items-center text-sm font-medium text-[#5b2c91] pr-2 border-r border-[#e6e2f1]">
                                    {dialCode}
                                  </span>
                                  <input
                                    id="mobile"
                                    type="tel"
                                    className={`min-w-0 flex-1 border-0 bg-transparent px-3 py-2.5 text-sm text-[#111827] focus:outline-none ${shouldShowError('mobile') ? 'text-red-900 placeholder:text-red-400' : 'placeholder:text-[#9ca3af]'}`}
                                    placeholder="9876543210"
                                    value={form.mobile}
                                    onChange={(event) => updateField('mobile', event.target.value)}
                                    onBlur={() => markFieldTouched('mobile')}
                                    inputMode="numeric"
                                    pattern="[0-9]*"
                                    maxLength={MOBILE_DIGITS_LENGTH}
                                    autoComplete="tel-national"
                                  />
                                </div>
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
                                    || normalizePhone(form.mobile).length !== MOBILE_DIGITS_LENGTH
                                    || resendCooldown.phone > 0
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
                                  ) : resendCooldown.phone > 0 ? (
                                    `Resend ${formatCooldown(resendCooldown.phone)}`
                                  ) : 'Verify'}
                                </button>
                              </div>
                              {shouldShowError('mobile') && <p className="mt-1 text-xs text-red-600">{sectionOneErrors.mobile}</p>}
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                            <div className="group">
                              <label htmlFor="dob" className="block text-xs font-medium text-[#6b7280] mb-1 group-hover:text-[#5b2c91] transition-colors">
                                Date of Birth
                              </label>
                              <BoundedDatePicker
                                id="dob"
                                inputClassName={getInputClasses(shouldShowError('dob'))}
                                value={form.dob}
                                onChange={(nextValue) => updateField('dob', nextValue)}
                                onBlur={() => markFieldTouched('dob')}
                                minDate={dobBounds.min}
                                maxDate={dobBounds.max}
                                placeholder="Select date of birth"
                              />
                              {shouldShowError('dob') && <p className="mt-1 text-xs text-red-600">{sectionOneErrors.dob}</p>}
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
                                error={shouldShowError('gender')}
                                className={shouldShowError('gender') ? 'border-red-300 bg-red-50 hover:border-red-400 focus:ring-red-200' : ''}
                              />
                              {shouldShowError('gender') && <p className="mt-1 text-xs text-red-600">{sectionOneErrors.gender}</p>}
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
                              Set country, then select state and city, and provide your pincode.
                            </p>

                            <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
                              <div className="group">
                                <label htmlFor="country" className="block text-xs font-medium text-[#6b7280] mb-1 group-hover:text-[#5b2c91] transition-colors">
                                  Country *
                                </label>
                                <CustomSelect
                                  id="country"
                                  value={form.country}
                                  onChange={(value) => updateField('country', value)}
                                  options={COUNTRY_OPTIONS.map((country) => ({ value: country, label: country }))}
                                  placeholder="Select Country"
                                  error={shouldShowError('country')}
                                  className={shouldShowError('country') ? 'border-red-300 bg-red-50 hover:border-red-400 focus:ring-red-200' : ''}
                                />
                                {shouldShowError('country') && <p className="mt-1 text-xs text-red-600">{sectionOneErrors.country}</p>}
                              </div>

                              <div className="group">
                                <label htmlFor="stateName" className="block text-xs font-medium text-[#6b7280] mb-1 group-hover:text-[#5b2c91] transition-colors">
                                  State *
                                </label>
                                <CustomSelect
                                  id="stateName"
                                  value={form.stateName}
                                  onChange={(value) => updateField('stateName', value)}
                                  options={stateDropdownOptions}
                                  placeholder="Select State"
                                  disabled={locationBusy.states}
                                  error={shouldShowError('stateName')}
                                  className={shouldShowError('stateName') ? 'border-red-300 bg-red-50 hover:border-red-400 focus:ring-red-200' : ''}
                                />
                                {shouldShowError('stateName') && <p className="mt-1 text-xs text-red-600">{sectionOneErrors.stateName}</p>}
                              </div>

                              <div className="group">
                                <label htmlFor="cityName" className="block text-xs font-medium text-[#6b7280] mb-1 group-hover:text-[#5b2c91] transition-colors">
                                  City *
                                </label>
                                <CustomSelect
                                  id="cityName"
                                  value={form.cityName}
                                  onChange={(value) => updateField('cityName', value)}
                                  options={cityDropdownOptions}
                                  placeholder="Select City"
                                  disabled={!form.stateName || locationBusy.cities}
                                  error={shouldShowError('cityName')}
                                  className={shouldShowError('cityName') ? 'border-red-300 bg-red-50 hover:border-red-400 focus:ring-red-200' : ''}
                                />
                                {shouldShowError('cityName') && <p className="mt-1 text-xs text-red-600">{sectionOneErrors.cityName}</p>}
                              </div>

                              <div className="group">
                                <label htmlFor="postalCode" className="block text-xs font-medium text-[#6b7280] mb-1 group-hover:text-[#5b2c91] transition-colors">
                                  Pincode *
                                </label>
                                <input
                                  id="postalCode"
                                  type="text"
                                  className={getInputClasses(shouldShowError('postalCode'))}
                                  placeholder={form.country === 'USA' ? 'e.g. 77001' : 'e.g. 600001'}
                                  value={form.postalCode}
                                  onChange={(event) => updateField('postalCode', event.target.value)}
                                  onBlur={() => markFieldTouched('postalCode')}
                                />
                                {shouldShowError('postalCode') && <p className="mt-1 text-xs text-red-600">{sectionOneErrors.postalCode}</p>}
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
                                {form.cityName}, {form.stateName}, {form.country}{form.postalCode ? ` (${form.postalCode})` : ''}
                              </div>
                            )}
                          </div>

                          <div className="group">
                            <label className="block text-xs font-medium text-[#6b7280] mb-1 group-hover:text-[#5b2c91] transition-colors">
                              Languages Spoken
                            </label>
                            <div className={getPanelClasses(shouldShowError('languages'))}>
                              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                {languagesOptions.map((lang) => (
                                  <label key={lang} className="inline-flex items-center gap-2 text-sm text-[#111827] cursor-pointer group/checkbox hover:text-[#5b2c91] transition-colors">
                                    <input
                                      type="checkbox"
                                      className="accent-[#5b2c91] w-4 h-4 cursor-pointer rounded focus:ring-2 focus:ring-[#5b2c91] focus:ring-offset-1"
                                      checked={selectedLanguages.includes(lang)}
                                      onChange={() => {
                                        markFieldTouched('languages');
                                        toggleMultiCheckbox(lang, setSelectedLanguages);
                                      }}
                                    />
                                    <span className="select-none">{lang}</span>
                                  </label>
                                ))}
                              </div>
                            </div>
                            {shouldShowError('languages') && <p className="mt-1 text-xs text-red-600">{sectionOneErrors.languages}</p>}
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
                              Profile Image (Optional)
                            </label>
                            <div className="lp-profile-upload-card">
                              <div className="lp-profile-upload-main">
                                <div className="lp-profile-upload-avatar">
                                  {profileImagePreview ? (
                                    <img src={profileImagePreview} alt="Mentor preview" className="h-full w-full object-cover" />
                                  ) : (
                                    <Camera className="h-5 w-5 text-[#5b2c91]" />
                                  )}
                                </div>
                                <div className="lp-profile-upload-copy">
                                  <p className="lp-profile-upload-title">Add an image for your mentor profile.</p>
                                  <p className="lp-profile-upload-file">
                                    {profileImageFile ? profileImageFile.name : 'No file selected'}
                                  </p>
                                </div>
                                <div className="lp-profile-upload-actions" ref={profileImageMenuRef}>
                                  <button
                                    type="button"
                                    className="lp-profile-upload-btn-primary"
                                    onClick={() => setProfileImageMenuOpen((prev) => !prev)}
                                  >
                                    <Camera className="h-3.5 w-3.5" />
                                    {profileImageFile ? 'Change' : 'Upload'}
                                  </button>
                                  {profileImageMenuOpen ? (
                                    <div className="upload-menu-card">
                                      <button
                                        type="button"
                                        className="upload-menu-item"
                                        onClick={() => {
                                          setProfileImageMenuOpen(false);
                                          profileImageInputRef.current?.click();
                                        }}
                                      >
                                        Upload from device
                                      </button>
                                      <button
                                        type="button"
                                        className="upload-menu-item"
                                        onClick={openCameraModal}
                                      >
                                        Camera
                                      </button>
                                    </div>
                                  ) : null}
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

                          <div className="group">
                            <label className="block text-xs font-medium text-[#6b7280] mb-1 group-hover:text-[#5b2c91] transition-colors">
                              Mentor Care Areas
                            </label>
                            <div className={getPanelClasses(shouldShowError('careAreas'))}>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                {careAreaOptions.map((area) => (
                                  <label key={area} className="inline-flex items-center gap-2 text-sm text-[#111827] cursor-pointer group/checkbox hover:text-[#5b2c91] transition-colors">
                                    <input
                                      type="checkbox"
                                      className="accent-[#5b2c91] w-4 h-4 cursor-pointer rounded focus:ring-2 focus:ring-[#5b2c91] focus:ring-offset-1"
                                      checked={selectedCareAreas.includes(area)}
                                      onChange={() => {
                                        markFieldTouched('careAreas');
                                        toggleMultiCheckbox(area, setSelectedCareAreas);
                                      }}
                                    />
                                    <span className="select-none">{area}</span>
                                  </label>
                                ))}
                              </div>
                            </div>
                            {shouldShowError('careAreas') && (
                              <p className="mt-1 text-xs text-red-600">{registrationErrors.careAreas}</p>
                            )}
                            <p className="text-xs text-[#6b7280] mt-1">
                              Select mentor strengths that best match mentee assessment themes for better AI recommendations.
                            </p>
                          </div>

                          <div className="group">
                            <label htmlFor="qualification" className="block text-xs font-medium text-[#6b7280] mb-1 group-hover:text-[#5b2c91] transition-colors">
                              Educational Qualification
                            </label>
                            <CustomSelect
                              id="qualification"
                              value={form.qualification}
                              onChange={(value) => updateField('qualification', value)}
                              options={qualificationOptions}
                              placeholder="Select Qualification"
                              error={shouldShowError('qualification')}
                              className={shouldShowError('qualification') ? 'border-red-300 bg-red-50 hover:border-red-400 focus:ring-red-200' : ''}
                            />
                            {shouldShowError('qualification') && (
                              <p className="mt-1 text-xs text-red-600">{registrationErrors.qualification}</p>
                            )}
                          </div>

                          <div className="group">
                            <label htmlFor="bio" className="block text-xs font-medium text-[#6b7280] mb-1 group-hover:text-[#5b2c91] transition-colors">
                              Brief Bio
                            </label>
                            <textarea
                              ref={bioTextareaRef}
                              id="bio"
                              rows={5}
                              className={`${getInputClasses(shouldShowError('bio'))} resize-y min-h-[140px] max-h-[420px]`}
                              placeholder="Tell us a bit about your professional background..."
                              value={form.bio}
                              onChange={(event) => handleBioChange(event.target.value)}
                              onBlur={() => markFieldTouched('bio')}
                            />
                            {shouldShowError('bio') && (
                              <p className="mt-1 text-xs text-red-600">{registrationErrors.bio}</p>
                            )}
                            <p className={`mt-1 text-xs ${bioWordCount > BIO_MAX_WORDS ? 'text-red-600' : 'text-[#6b7280]'}`}>
                              Maximum {BIO_MAX_WORDS} words. Current: {bioWordCount}.
                            </p>
                          </div>

                          <label className={`flex items-start gap-2 text-xs sm:text-sm cursor-pointer group transition-colors p-3 rounded-lg ${
                            shouldShowError('consent')
                              ? 'border border-red-300 bg-red-50 text-red-700'
                              : 'text-[#6b7280] hover:text-[#5b2c91] hover:bg-[#f9f7ff]'
                          }`}>
                            <input
                              id="consent"
                              type="checkbox"
                              className="mt-0.5 sm:mt-1 accent-[#5b2c91] w-4 h-4 cursor-pointer rounded focus:ring-2 focus:ring-[#5b2c91] focus:ring-offset-1"
                              checked={form.consent}
                              onChange={(event) => updateField('consent', event.target.checked)}
                            />
                            <span className="select-none space-y-2">
                              <span className="block font-medium text-[#1f2937]">Mentor Commitment & Code of Conduct</span>
                              <span className="block">
                                I confirm that I am voluntarily joining Mentor To Go, will maintain professional boundaries,
                                provide truthful information, protect mentee confidentiality, and follow all program policies,
                                curriculum guidelines, safety expectations, and reporting timelines.
                              </span>
                              <span className="block">
                                I understand I am responsible for my own communication costs, cannot seek payment for mentoring,
                                must not engage in harassment or personal relationship-building with mentees, and may face
                                suspension or removal for policy violations.
                              </span>
                              <span className="block">
                                I agree to promptly escalate concerns about safety or wellbeing to the authorised grievance channels
                                and continue acting in the best interests of the mentee and Mentor To Go during and after the mentorship period.
                              </span>
                              <span className="block font-medium">I agree to this declaration.</span>
                              {shouldShowError('consent') && (
                                <span className="mt-1 block text-xs text-red-600">
                                  {registrationErrors.consent}
                                </span>
                              )}
                            </span>
                          </label>
                        </div>
                      )}
                    </section>

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

      {cameraModalOpen ? (
        <div
          className="lp-camera-overlay"
          role="dialog"
          aria-modal="true"
          onClick={closeCameraModal}
        >
          <div className="lp-camera-dialog" onClick={(event) => event.stopPropagation()}>
            <div className="lp-camera-head">
              <div>
                <h3>Capture Profile Photo</h3>
                <p>Position your face clearly, then click Capture.</p>
              </div>
              <button type="button" className="lp-camera-close" onClick={closeCameraModal}>
                <span className="text-xl leading-none">&times;</span>
              </button>
            </div>
            <div className="lp-camera-body">
              <video ref={cameraVideoRef} autoPlay playsInline muted className="lp-camera-video" />
              <canvas ref={cameraCanvasRef} className="hidden" />
            </div>
            {cameraErrorMessage ? (
              <p className="lp-camera-error">{cameraErrorMessage}</p>
            ) : null}
            <div className="lp-camera-actions">
              <button type="button" className="lp-camera-btn lp-camera-btn-secondary" onClick={closeCameraModal}>
                Cancel
              </button>
              <button type="button" className="lp-camera-btn lp-camera-btn-primary" onClick={captureFromCamera}>
                Capture
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <BottomAuth />
    </div>
  );
};

export default MentorRegister;
