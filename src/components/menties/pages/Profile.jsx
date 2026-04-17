import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { menteeApi } from '../../../apis/api/menteeApi';
import { useMenteeData } from '../../../apis/apihook/useMenteeData';
import {
  User,
  Mail,
  GraduationCap,
  Phone,
  Camera,
  Sparkles,
  Clock,
  Users,
  ChevronDown,
  ChevronRight,
  Save,
  X,
  CheckCircle2,
  AlertCircle,
  Settings,
  Heart,
  RefreshCw
} from 'lucide-react';


const COUNTRY_OPTIONS = ['India', 'USA'];
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

const gradeOptions = ['10th Grade', '11th Grade', '12th Grade'];
const genderOptions = ['Female', 'Male'];

const normalizePhone = (value) => String(value || '').replace(/\D/g, '').slice(0, 10);

const parseCityState = (cityState) => {
  const text = String(cityState || '').trim();
  if (!text) return { city: '', state: '', country: '', postalCode: '' };

  const postalMatch = text.match(/\(([^)]+)\)\s*$/);
  const postalCode = postalMatch ? String(postalMatch[1] || '').trim() : '';
  const withoutPostal = postalMatch ? text.slice(0, postalMatch.index).trim() : text;
  const parts = withoutPostal.split(',').map((part) => part.trim()).filter(Boolean);

  return {
    city: parts[0] || '',
    state: parts[1] || '',
    country: parts[2] || '',
    postalCode,
  };
};

const buildProfileFieldsFromMentee = (mentee) => {
  const parsed = parseCityState(mentee?.city_state || '');
  const country = mentee?.country || parsed.country || 'India';
  const stateList = LOCATION_OPTIONS[country]?.states || [];
  const state = mentee?.state || parsed.state || stateList[0] || '';
  const cityList = LOCATION_OPTIONS[country]?.citiesByState?.[state] || [];
  const city = mentee?.city || parsed.city || cityList[0] || '';

  return {
    schoolOrCollege: mentee?.school_or_college || '',
    country,
    state,
    city,
    postalCode: mentee?.postal_code || parsed.postalCode || '',
    gender: mentee?.gender || '',
    dob: mentee?.dob || '',
    grade: mentee?.grade || '',
    parentMobile: normalizePhone(mentee?.parent_mobile || ''),
    mobile: normalizePhone(mentee?.mobile || ''),
  };
};

const DropdownSelect = ({ value, options, placeholder, disabled = false, onChange }) => {
  const [open, setOpen] = useState(false);
  const selectedLabel = useMemo(() => {
    const found = (options || []).find((opt) => opt.value === value);
    return found?.label || '';
  }, [options, value]);

  return (
    <div
      className="relative w-full"
      tabIndex={0}
      onBlur={(event) => {
        // Close when focus moves outside the dropdown container.
        if (!event.currentTarget.contains(event.relatedTarget)) {
          setOpen(false);
        }
      }}
      onKeyDown={(event) => {
        if (event.key === 'Escape') setOpen(false);
      }}
    >
      <button
        type="button"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((prev) => !prev)}
        className="flex h-10 w-full items-center justify-between gap-2 rounded-xl bg-[color:var(--theme-v-nav-hover-bg)] px-3 text-sm shadow-sm ring-1 ring-[color:var(--theme-v-hero-border)] transition-all hover:ring-[color:var(--theme-v-accent)] focus:outline-none focus:ring-2 focus:ring-[color:var(--theme-v-accent)] disabled:cursor-not-allowed disabled:opacity-60"
      >
        <span className={selectedLabel ? 'text-[color:var(--theme-v-text-primary)]' : 'text-[color:var(--theme-v-text-secondary)]'}>
          {selectedLabel || placeholder}
        </span>
        <ChevronDown
          className={`h-4 w-4 text-[color:var(--theme-v-text-secondary)] transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open && (
        <ul
          role="listbox"
          className="absolute z-20 mt-2 w-full rounded-xl bg-[color:var(--theme-v-nav-hover-bg)] py-2 shadow-xl ring-1 ring-[color:var(--theme-v-hero-border)]"
        >
          {options.map((opt) => (
            <li key={opt.value}>
              <button
                type="button"
                className={`w-full px-4 py-2.5 text-left text-sm transition-colors ${value === opt.value
                    ? 'bg-[color:var(--theme-v-nav-hover-bg)] text-[color:var(--theme-v-accent)] font-medium'
                    : 'text-[color:var(--theme-v-text-secondary)] hover:bg-[color:var(--theme-v-nav-hover-bg)]'
                  }`}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  onChange(opt.value);
                  setOpen(false);
                }}
              >
                {opt.label}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

const mentorTypeOptions = [
  { label: 'Listener', value: 'listener' },
  { label: 'Advisor', value: 'advisor' },
  { label: 'Problem-Solver', value: 'problem_solver' },
  { label: 'Career Guide', value: 'career_guide' },
  { label: 'Friendly', value: 'friendly' },
];

const comfortOptions = [
  'Very Uncomfortable',
  'Somewhat Uncomfortable',
  'Neutral',
  'Comfortable',
  'Very Comfortable',
];

const sessionLengthOptions = [30];

const normalizeList = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.results)) return payload.results;
  return [];
};

const formatDate = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString([], { day: '2-digit', month: 'short', year: 'numeric' });
};

const resolveMediaUrl = (value) => {
  if (!value) return '';
  if (/^https?:\/\//i.test(value)) return value;
  const apiBase = (import.meta.env.VITE_API_BASE_URL || '/api').replace(/\/+$/, '');
  const base = apiBase.endsWith('/api') ? apiBase.slice(0, -4) : apiBase;
  if (value.startsWith('/')) {
    return `${base}${value}`;
  }
  return value;
};

const Profile = () => {
  const navigate = useNavigate();
  const { mentee, loading: menteeLoading, error: menteeError, setMentee } = useMenteeData();
  const avatarInputRef = useRef(null);
  const [preferences, setPreferences] = useState({
    comfort_level: '',
    preferred_session_minutes: '',
    preferred_mentor_types: [],
  });
  const [assessmentSummary, setAssessmentSummary] = useState({
    lastTaken: '',
    focus: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [photoUploading, setPhotoUploading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [profileFields, setProfileFields] = useState({
    schoolOrCollege: '',
    country: 'India',
    state: 'Tamilnadu',
    city: 'Chennai',
    postalCode: '',
    gender: '',
    dob: '',
    grade: '',
    parentMobile: '',
    mobile: '',
  });

  useEffect(() => {
    if (mentee) setProfileFields(buildProfileFieldsFromMentee(mentee));
  }, [mentee]);

  useEffect(() => {
    let cancelled = false;

    const loadProfileData = async () => {
      if (!mentee?.id) {
        if (!menteeLoading) setLoading(false);
        return;
      }

      setLoading(true);
      setError('');

      try {
        const [preferencesResponse, requestsResponse] = await Promise.all([
          menteeApi.getMenteePreferences(mentee.id),
          menteeApi.listMenteeRequests({ mentee_id: mentee.id }),
        ]);

        if (cancelled) return;

        const nextPreferences = {
          comfort_level: preferencesResponse?.comfort_level || '',
          preferred_session_minutes: 30,
          preferred_mentor_types: Array.isArray(preferencesResponse?.preferred_mentor_types)
            ? preferencesResponse.preferred_mentor_types
            : [],
        };
        setPreferences(nextPreferences);

        const requests = normalizeList(requestsResponse);
        const latestRequest = requests[0];
        if (latestRequest) {
          setAssessmentSummary({
            lastTaken: formatDate(latestRequest.created_at),
            focus: latestRequest.feeling_cause || latestRequest.support_type || latestRequest.feeling || '',
          });
        } else {
          setAssessmentSummary({ lastTaken: '', focus: '' });
        }
      } catch (err) {
        if (!cancelled) {
          setError(err?.message || 'Unable to load profile data.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadProfileData();
    return () => {
      cancelled = true;
    };
  }, [mentee?.id, menteeLoading]);

  const comfortPosition = useMemo(() => {
    if (!preferences.comfort_level) return null;
    const index = comfortOptions.indexOf(preferences.comfort_level);
    if (index < 0) return null;
    return (index / (comfortOptions.length - 1)) * 100;
  }, [preferences.comfort_level]);

  const fullName = `${mentee?.first_name || ''} ${mentee?.last_name || ''}`.trim();
  const email = mentee?.email || '';
  const grade = mentee?.grade || '';
  const parentMobile = mentee?.parent_mobile || '';
  const initials = fullName
    ? fullName
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0])
      .join('')
      .toUpperCase()
    : '';
  const avatarUrl = resolveMediaUrl(mentee?.avatar || '');

  const toggleMentorType = (value) => {
    setPreferences((prev) => {
      const exists = prev.preferred_mentor_types.includes(value);
      return {
        ...prev,
        preferred_mentor_types: exists
          ? prev.preferred_mentor_types.filter((item) => item !== value)
          : [...prev.preferred_mentor_types, value],
      };
    });
  };

  const handleComfortChange = (value) => {
    setPreferences((prev) => ({
      ...prev,
      comfort_level: value,
    }));
  };

  const handleSessionLengthChange = (value) => {
    setPreferences((prev) => ({
      ...prev,
      preferred_session_minutes: value === '' ? '' : Number(value),
    }));
  };

  const handleProfileFieldChange = (key, value) => {
    if (key === 'country') {
      const nextCountry = value;
      const nextStates = LOCATION_OPTIONS[nextCountry]?.states || [];
      const nextState = nextStates[0] || '';
      const nextCities = LOCATION_OPTIONS[nextCountry]?.citiesByState?.[nextState] || [];
      const nextCity = nextCities[0] || '';
      setProfileFields((prev) => ({
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
      const nextCities = LOCATION_OPTIONS[profileFields.country]?.citiesByState?.[nextState] || [];
      const nextCity = nextCities[0] || '';
      setProfileFields((prev) => ({ ...prev, state: nextState, city: nextCity }));
      return;
    }

    if (key === 'parentMobile' || key === 'mobile') {
      setProfileFields((prev) => ({ ...prev, [key]: normalizePhone(value) }));
      return;
    }

    setProfileFields((prev) => ({ ...prev, [key]: value }));
  };

  const handleCancel = async () => {
    if (!mentee?.id) return;
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      const latestPreferences = await menteeApi.getMenteePreferences(mentee.id);
      setProfileFields(buildProfileFieldsFromMentee(mentee));
      setPreferences({
        comfort_level: latestPreferences?.comfort_level || '',
        preferred_session_minutes: 30,
        preferred_mentor_types: Array.isArray(latestPreferences?.preferred_mentor_types)
          ? latestPreferences.preferred_mentor_types
          : [],
      });
    } catch (err) {
      setError(err?.message || 'Unable to reset profile changes.');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!mentee?.id) return;
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const [updatedMentee, updatedPreferences] = await Promise.all([
        menteeApi.updateMentee(mentee.id, {
          first_name: mentee.first_name,
          last_name: mentee.last_name,
          grade: profileFields.grade || '',
          email: mentee.email,
          dob: profileFields.dob || '',
          gender: profileFields.gender || '',
          school_or_college: profileFields.schoolOrCollege || '',
          country: profileFields.country || '',
          state: profileFields.state || '',
          city: profileFields.city || '',
          postal_code: profileFields.postalCode || '',
          city_state: ([profileFields.city, profileFields.state, profileFields.country].filter(Boolean).join(', ') + (profileFields.postalCode ? ` (${profileFields.postalCode})` : '')).trim(),
          timezone: mentee.timezone || '',
          parent_mobile: profileFields.parentMobile || '',
          mobile: profileFields.mobile || '',
        }),
        menteeApi.updateMenteePreferences(mentee.id, {
          comfort_level: preferences.comfort_level || '',
          preferred_session_minutes: 30,
          preferred_mentor_types: preferences.preferred_mentor_types,
        }),
      ]);

      setMentee(updatedMentee || mentee);
      setPreferences((prev) => ({
        ...prev,
        comfort_level: updatedPreferences?.comfort_level || prev.comfort_level,
        preferred_session_minutes:
          updatedPreferences?.preferred_session_minutes ?? prev.preferred_session_minutes,
        preferred_mentor_types:
          updatedPreferences?.preferred_mentor_types || prev.preferred_mentor_types,
      }));
      setSuccess('Profile preferences saved.');
    } catch (err) {
      setError(err?.message || 'Unable to save profile changes.');
    } finally {
      setSaving(false);
    }
  };

  const handlePhotoSelect = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file || !mentee?.id) return;
    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file.');
      setSuccess('');
      return;
    }

    setPhotoUploading(true);
    setError('');
    setSuccess('');

    try {
      const formData = new FormData();
      formData.append('avatar', file);
      const updatedMentee = await menteeApi.updateMentee(mentee.id, formData);
      setMentee(updatedMentee || mentee);
      setSuccess('Profile photo updated.');
    } catch (err) {
      setError(err?.message || 'Unable to upload profile photo.');
    } finally {
      setPhotoUploading(false);
    }
  };
  return (
    <div className="p-4 sm:p-6 lg:p-8 bg-transparent">
      <div className="mx-auto max-w-full">
        {/* Header */}
        <div className="mb-6 sm:mb-8 rounded-[28px] border border-[color:var(--theme-v-hero-border)] bg-[linear-gradient(135deg,var(--theme-v-bg-start)_0%,var(--theme-v-bg-mid)_45%,var(--theme-v-bg-end)_100%)] p-4 shadow-[0_28px_60px_-46px_rgba(22,10,46,0.72)] ring-1 ring-[color:var(--theme-v-hero-border)] sm:p-6">
          <div className="flex min-w-0 items-start gap-3 sm:items-center sm:gap-4">
            <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-[color:var(--theme-v-accent)] shadow-lg">
              <User className="h-6 w-6 text-[color:var(--theme-v-accent-text)]" />
            </div>
            <div className="min-w-0">
              <h1 className="text-xl font-bold tracking-tight text-[color:var(--theme-v-text-primary)] sm:text-3xl">
                My Profile
              </h1>
              <p className="mt-1 text-sm text-[color:var(--theme-v-text-secondary)]">
                Manage your profile and preferences
              </p>
            </div>
          </div>
        </div>

        {/* Main Card */}
        <div className="rounded-2xl bg-[color:var(--theme-v-nav-hover-bg)] p-4 sm:p-6 lg:p-8 shadow-sm ring-1 ring-[color:var(--theme-v-hero-border)]">
          <div className="flex flex-col gap-8 lg:flex-row">
            {/* Avatar Section */}
            <div className="flex flex-col items-center gap-4 lg:w-48">
              <div className="relative">
                <div className="h-28 w-28 overflow-hidden rounded-2xl bg-[color:var(--theme-v-nav-hover-bg)] ring-4 ring-[color:var(--theme-v-hero-border)] shadow-lg">
                  {avatarUrl ? (
                    <img
                      src={avatarUrl}
                      alt="Profile"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-3xl font-bold text-[color:var(--theme-v-accent)]">
                      {initials || 'U'}
                    </div>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => avatarInputRef.current?.click()}
                  disabled={photoUploading || saving || menteeLoading}
                  className="absolute -bottom-2 -right-2 flex h-10 w-10 items-center justify-center rounded-xl bg-[color:var(--theme-v-accent)] text-[color:var(--theme-v-accent-text)] shadow-lg transition-all hover:bg-[color:var(--theme-v-accent-hover)] hover:scale-110 disabled:opacity-60"
                  aria-label="Upload profile photo"
                >
                  {photoUploading ? (
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-[rgba(59,34,101,0.3)] border-t-[color:var(--theme-v-accent-text)]" />
                  ) : (
                    <Camera className="h-5 w-5" />
                  )}
                </button>
                <input
                  ref={avatarInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handlePhotoSelect}
                />
              </div>
              <div className="text-center">
                <p className="text-sm font-medium text-[color:var(--theme-v-text-primary)]">{fullName}</p>
                <p className="text-xs text-[color:var(--theme-v-text-secondary)]">Student</p>
              </div>
            </div>

            {/* Form Section */}
            <div className="flex-1 space-y-6">
              {/* Personal Information */}
              <div>
                <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-[color:var(--theme-v-text-secondary)]">
                  <User className="h-4 w-4" />
                  Personal Information
                </h2>

                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  {/* Full Name */}
                  <div>
                    <label className="mb-2 flex items-center gap-2 text-sm font-medium text-[color:var(--theme-v-text-secondary)]">
                      <User className="h-4 w-4 text-[color:var(--theme-v-text-secondary)]" />
                      Full Name
                    </label>
                    <input
                      type="text"
                      value={fullName}
                      readOnly
                      className="h-11 w-full rounded-xl border-0 bg-[color:var(--theme-v-nav-hover-bg)] px-4 text-sm text-[color:var(--theme-v-text-primary)] ring-1 ring-[color:var(--theme-v-hero-border)] cursor-not-allowed"
                    />
                  </div>

                  {/* Email */}
                  <div>
                    <label className="mb-2 flex items-center gap-2 text-sm font-medium text-[color:var(--theme-v-text-secondary)]">
                      <Mail className="h-4 w-4 text-[color:var(--theme-v-text-secondary)]" />
                      Email
                    </label>
                    <input
                      type="email"
                      value={email}
                      readOnly
                      className="h-11 w-full rounded-xl border-0 bg-[color:var(--theme-v-nav-hover-bg)] px-4 text-sm text-[color:var(--theme-v-text-primary)] ring-1 ring-[color:var(--theme-v-hero-border)] cursor-not-allowed"
                    />
                  </div>

                  {/* Grade */}
                  <div>
                    <label className="mb-2 flex items-center gap-2 text-sm font-medium text-[color:var(--theme-v-text-secondary)]">
                      <GraduationCap className="h-4 w-4 text-[color:var(--theme-v-text-secondary)]" />
                      Grade / Class
                    </label>
                    <div className="flex h-11 w-full items-center justify-between rounded-xl bg-[color:var(--theme-v-nav-hover-bg)] px-4 text-sm text-[color:var(--theme-v-text-primary)] ring-1 ring-[color:var(--theme-v-hero-border)]">
                      <span>{grade}</span>
                      <ChevronRight className="h-4 w-4 text-[color:var(--theme-v-text-secondary)] rotate-90" />
                    </div>
                  </div>

                  {/* Parent's Mobile */}
                  <div>
                    <label className="mb-2 flex items-center gap-2 text-sm font-medium text-[color:var(--theme-v-text-secondary)]">
                      <Phone className="h-4 w-4 text-[color:var(--theme-v-text-secondary)]" />
                      Parent's Mobile
                    </label>
                    <div className="flex h-11 w-full items-center justify-between rounded-xl bg-[color:var(--theme-v-nav-hover-bg)] px-4 text-sm text-[color:var(--theme-v-text-primary)] ring-1 ring-[color:var(--theme-v-hero-border)]">
                      <span>{parentMobile}</span>
                      <div className="flex h-6 w-6 items-center justify-center rounded-md bg-[color:var(--theme-v-hero-border)]">
                        <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 text-[color:var(--theme-v-text-secondary)]" fill="none" stroke="currentColor" strokeWidth="2">
                          <rect x="5" y="11" width="14" height="10" rx="2" />
                          <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Divider */}
              <div className="border-t border-[color:var(--theme-v-hero-border)]" />

              {/* Registration Details */}
              <div>
                <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-[color:var(--theme-v-text-secondary)]">
                  <Settings className="h-4 w-4" />
                  Registration Details
                </h2>

                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-[color:var(--theme-v-text-secondary)]">School / College</label>
                    <input type="text" value={profileFields.schoolOrCollege} onChange={(event) => handleProfileFieldChange('schoolOrCollege', event.target.value)} className="h-11 w-full rounded-xl border-0 bg-[color:var(--theme-v-nav-hover-bg)] px-4 text-sm text-[color:var(--theme-v-text-primary)] ring-1 ring-[color:var(--theme-v-hero-border)] focus:outline-none focus:ring-2 focus:ring-[color:var(--theme-v-accent)]" />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-[color:var(--theme-v-text-secondary)]">Mentee Mobile</label>
                    <input type="tel" value={profileFields.mobile} onChange={(event) => handleProfileFieldChange('mobile', event.target.value)} className="h-11 w-full rounded-xl border-0 bg-[color:var(--theme-v-nav-hover-bg)] px-4 text-sm text-[color:var(--theme-v-text-primary)] ring-1 ring-[color:var(--theme-v-hero-border)] focus:outline-none focus:ring-2 focus:ring-[color:var(--theme-v-accent)]" />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-[color:var(--theme-v-text-secondary)]">Country</label>
                    <select value={profileFields.country} onChange={(event) => handleProfileFieldChange('country', event.target.value)} className="h-11 w-full rounded-xl border-0 bg-[color:var(--theme-v-nav-hover-bg)] px-4 text-sm text-[color:var(--theme-v-text-primary)] ring-1 ring-[color:var(--theme-v-hero-border)] focus:outline-none focus:ring-2 focus:ring-[color:var(--theme-v-accent)]">
                      {COUNTRY_OPTIONS.map((country) => (<option key={country} value={country}>{country}</option>))}
                    </select>
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-[color:var(--theme-v-text-secondary)]">State</label>
                    <select value={profileFields.state} onChange={(event) => handleProfileFieldChange('state', event.target.value)} className="h-11 w-full rounded-xl border-0 bg-[color:var(--theme-v-nav-hover-bg)] px-4 text-sm text-[color:var(--theme-v-text-primary)] ring-1 ring-[color:var(--theme-v-hero-border)] focus:outline-none focus:ring-2 focus:ring-[color:var(--theme-v-accent)]">
                      {(LOCATION_OPTIONS[profileFields.country]?.states || []).map((stateName) => (<option key={stateName} value={stateName}>{stateName}</option>))}
                    </select>
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-[color:var(--theme-v-text-secondary)]">City</label>
                    <select value={profileFields.city} onChange={(event) => handleProfileFieldChange('city', event.target.value)} className="h-11 w-full rounded-xl border-0 bg-[color:var(--theme-v-nav-hover-bg)] px-4 text-sm text-[color:var(--theme-v-text-primary)] ring-1 ring-[color:var(--theme-v-hero-border)] focus:outline-none focus:ring-2 focus:ring-[color:var(--theme-v-accent)]">
                      {(LOCATION_OPTIONS[profileFields.country]?.citiesByState?.[profileFields.state] || []).map((cityName) => (<option key={cityName} value={cityName}>{cityName}</option>))}
                    </select>
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-[color:var(--theme-v-text-secondary)]">Postal Code</label>
                    <input type="text" value={profileFields.postalCode} onChange={(event) => handleProfileFieldChange('postalCode', event.target.value)} className="h-11 w-full rounded-xl border-0 bg-[color:var(--theme-v-nav-hover-bg)] px-4 text-sm text-[color:var(--theme-v-text-primary)] ring-1 ring-[color:var(--theme-v-hero-border)] focus:outline-none focus:ring-2 focus:ring-[color:var(--theme-v-accent)]" />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-[color:var(--theme-v-text-secondary)]">Gender</label>
                    <DropdownSelect value={profileFields.gender} options={genderOptions.map((opt) => ({ label: opt, value: opt }))} placeholder="Select Gender" onChange={(value) => handleProfileFieldChange('gender', value)} />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-[color:var(--theme-v-text-secondary)]">Date of Birth</label>
                    <input type="date" value={profileFields.dob} onChange={(event) => handleProfileFieldChange('dob', event.target.value)} className="h-11 w-full rounded-xl border-0 bg-[color:var(--theme-v-nav-hover-bg)] px-4 text-sm text-[color:var(--theme-v-text-primary)] ring-1 ring-[color:var(--theme-v-hero-border)] focus:outline-none focus:ring-2 focus:ring-[color:var(--theme-v-accent)]" />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-[color:var(--theme-v-text-secondary)]">Grade</label>
                    <DropdownSelect value={profileFields.grade} options={gradeOptions.map((opt) => ({ label: opt, value: opt }))} placeholder="Select Grade" onChange={(value) => handleProfileFieldChange('grade', value)} />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-[color:var(--theme-v-text-secondary)]">Parent Mobile</label>
                    <input type="tel" value={profileFields.parentMobile} onChange={(event) => handleProfileFieldChange('parentMobile', event.target.value)} className="h-11 w-full rounded-xl border-0 bg-[color:var(--theme-v-nav-hover-bg)] px-4 text-sm text-[color:var(--theme-v-text-primary)] ring-1 ring-[color:var(--theme-v-hero-border)] focus:outline-none focus:ring-2 focus:ring-[color:var(--theme-v-accent)]" />
                  </div>
                </div>
              </div>

              {/* Divider */}
              <div className="border-t border-[color:var(--theme-v-hero-border)]" />

              {/* Assessment Card */}
              <div className="rounded-2xl bg-[color:var(--theme-v-nav-hover-bg)] p-5 ring-1 ring-[color:var(--theme-v-hero-border)]">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div className="flex min-w-0 items-start gap-4">
                    <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-[color:var(--theme-v-accent)]">
                      <Sparkles className="h-6 w-6 text-[color:var(--theme-v-accent-text)]" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-base font-semibold text-[color:var(--theme-v-text-primary)]">
                        Mood & Needs Assessment
                      </h3>
                      {assessmentSummary.lastTaken && assessmentSummary.focus ? (
                        <p className="mt-1 break-words text-sm leading-relaxed text-[color:var(--theme-v-text-secondary)]">
                          Last taken on{' '}
                          <span className="font-medium text-[color:var(--theme-v-text-primary)]">{assessmentSummary.lastTaken}</span>
                          <br className="sm:hidden" />
                          <span className="hidden sm:inline">{' | '}</span>
                          Focus:{' '}
                          <span className="font-medium text-[color:var(--theme-v-accent)]">{assessmentSummary.focus}</span>
                        </p>
                      ) : (
                        <p className="mt-1 text-sm text-[color:var(--theme-v-text-secondary)]">
                          Complete your assessment to get personalized mentor matches.
                        </p>
                      )}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => navigate('/needs-assessment')}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[color:var(--theme-v-nav-hover-bg)] px-4 py-2.5 text-sm font-medium text-[color:var(--theme-v-accent)] ring-1 ring-[color:var(--theme-v-hero-border)] transition-all hover:bg-[color:var(--theme-v-accent)] hover:text-[color:var(--theme-v-accent-text)] sm:w-auto sm:self-start lg:flex-shrink-0 lg:self-auto"
                  >
                    <RefreshCw className="h-4 w-4" />
                    Retake Assessment
                  </button>
                </div>
              </div>

              {/* Divider */}
              <div className="border-t border-[color:var(--theme-v-hero-border)]" />

              {/* Session Preferences */}
              <div>
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[color:var(--theme-v-nav-hover-bg)]">
                    <Settings className="h-4 w-4 text-[color:var(--theme-v-accent)]" />
                  </div>
                  <div>
                    <h2 className="text-base font-semibold text-[color:var(--theme-v-text-primary)]">
                      Session Preferences
                    </h2>
                    <p className="text-xs text-[color:var(--theme-v-text-secondary)]">
                      Help us find the best mentors for you
                    </p>
                  </div>
                </div>

                <div className="mt-6 grid gap-6 sm:grid-cols-2">
                  {/* Comfort Level */}
                  <div className="rounded-xl bg-[color:var(--theme-v-nav-hover-bg)] p-4 ring-1 ring-[color:var(--theme-v-hero-border)]">
                    <div className="flex items-center gap-2 text-sm font-medium text-[color:var(--theme-v-text-primary)]">
                      <Heart className="h-4 w-4 text-[color:var(--theme-v-accent)]" />
                      Comfort Level
                    </div>
                    <p className="mt-1 text-xs text-[color:var(--theme-v-text-secondary)]">
                      Talking to new people
                    </p>

                    <div className="mt-3">
                      <DropdownSelect
                        value={preferences.comfort_level}
                        placeholder="Select comfort level"
                        options={comfortOptions.map((option) => ({ label: option, value: option }))}
                        onChange={handleComfortChange}
                      />
                    </div>

                    {comfortPosition != null ? (
                      <div className="mt-4">
                        <div className="relative h-2 rounded-full bg-[color:var(--theme-v-hero-border)]">
                          <div
                            className="absolute h-2 rounded-full bg-[color:var(--theme-v-accent)]"
                            style={{ width: `${comfortPosition}%` }}
                          />
                          <div
                            className="absolute top-1/2 h-5 w-5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[color:var(--theme-v-accent)] ring-4 ring-[color:var(--theme-v-hero-border)] shadow-lg"
                            style={{ left: `${comfortPosition}%` }}
                          />
                        </div>
                        <div className="mt-3 flex items-center justify-between text-[10px] font-medium text-[color:var(--theme-v-text-secondary)]">
                          <span>Very Shy</span>
                          <span>Neutral</span>
                          <span>Outgoing</span>
                        </div>
                      </div>
                    ) : (
                      <div className="mt-4 flex items-center justify-center rounded-lg bg-[color:var(--theme-v-nav-hover-bg)] py-4 text-xs text-[color:var(--theme-v-text-secondary)]">
                        Not set yet
                      </div>
                    )}
                  </div>

                  {/* Session Length */}
                  <div className="rounded-xl bg-[color:var(--theme-v-nav-hover-bg)] p-4 ring-1 ring-[color:var(--theme-v-hero-border)]">
                    <div className="flex items-center gap-2 text-sm font-medium text-[color:var(--theme-v-text-primary)]">
                      <Clock className="h-4 w-4 text-[color:var(--theme-v-accent)]" />
                      Session Length
                    </div>
                    <p className="mt-1 text-xs text-[color:var(--theme-v-text-secondary)]">
                      Preferred duration
                    </p>

                    <div className="mt-3">
                      <div className="flex h-10 w-full items-center justify-between rounded-xl bg-[color:var(--theme-v-nav-hover-bg)] px-3 text-sm text-[color:var(--theme-v-text-primary)] shadow-sm ring-1 ring-[color:var(--theme-v-hero-border)]">
                        <span>30 minutes</span>
                        <span className="text-[11px] font-semibold text-[color:var(--theme-v-text-secondary)]">Fixed</span>
                      </div>
                    </div>

                    <div className="mt-4 flex h-12 items-center justify-center rounded-xl bg-[color:var(--theme-v-nav-hover-bg)] text-lg font-semibold text-[color:var(--theme-v-accent)] ring-1 ring-[color:var(--theme-v-hero-border)]">
                      30 min
                    </div>
                  </div>
                </div>

                {/* Mentor Type */}
                <div className="mt-6">
                  <div className="flex items-center gap-2 text-sm font-medium text-[color:var(--theme-v-text-primary)]">
                    <Users className="h-4 w-4 text-[color:var(--theme-v-accent)]" />
                    Preferred Mentor Type
                  </div>
                  <p className="mt-1 text-xs text-[color:var(--theme-v-text-secondary)]">
                    Select the type of mentors you'd like to connect with
                  </p>

                  <div className="mt-4 flex flex-wrap gap-3">
                    {mentorTypeOptions.map((option) => {
                      const selected = preferences.preferred_mentor_types.includes(option.value);
                      return (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => toggleMentorType(option.value)}
                          className={`group inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-medium transition-all duration-200 ${selected
                              ? 'bg-[color:var(--theme-v-accent)] text-[color:var(--theme-v-accent-text)] shadow-md'
                              : 'bg-[color:var(--theme-v-nav-hover-bg)] text-[color:var(--theme-v-text-secondary)] ring-1 ring-[color:var(--theme-v-hero-border)] hover:ring-[color:var(--theme-v-accent)] hover:text-[color:var(--theme-v-accent)]'
                            }`}
                        >
                          {selected && (
                            <CheckCircle2 className="h-4 w-4" />
                          )}
                          {option.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Status Messages */}
              {(error || menteeError) && (
                <div className="flex items-center gap-3 rounded-xl bg-red-50 px-4 py-3 ring-1 ring-red-100">
                  <AlertCircle className="h-5 w-5 flex-shrink-0 text-red-600" />
                  <p className="text-sm text-red-600">{error || menteeError}</p>
                  <button
                    type="button"
                    onClick={() => setError('')}
                    className="ml-auto text-red-400 hover:text-red-600"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              )}

              {success && (
                <div className="flex items-center gap-3 rounded-xl bg-green-50 px-4 py-3 ring-1 ring-green-100">
                  <CheckCircle2 className="h-5 w-5 flex-shrink-0 text-green-600" />
                  <p className="text-sm text-green-600">{success}</p>
                </div>
              )}

              {(loading || menteeLoading) && !error && !success && (
                <div className="flex items-center justify-center gap-3 rounded-xl bg-[color:var(--theme-v-nav-hover-bg)] px-4 py-4">
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-[color:var(--theme-v-hero-border)] border-t-[color:var(--theme-v-accent)]" />
                  <span className="text-sm text-[color:var(--theme-v-text-secondary)]">Loading profile...</span>
                </div>
              )}

              {/* Divider */}
              <div className="border-t border-[color:var(--theme-v-hero-border)]" />

              {/* Action Buttons */}
              <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-end">
                <button
                  type="button"
                  onClick={handleCancel}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-[color:var(--theme-v-nav-hover-bg)] px-6 py-3 text-sm font-medium text-[color:var(--theme-v-text-secondary)] ring-1 ring-[color:var(--theme-v-hero-border)] transition-all hover:bg-[color:var(--theme-v-nav-hover-bg)] hover:text-[color:var(--theme-v-text-primary)]"
                >
                  <X className="h-4 w-4" />
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={saving || menteeLoading}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-[color:var(--theme-v-accent)] px-6 py-3 text-sm font-semibold text-[color:var(--theme-v-accent-text)] shadow-sm transition-all hover:bg-[color:var(--theme-v-accent-hover)] hover:shadow-md disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {saving ? (
                    <>
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-[rgba(59,34,101,0.3)] border-t-[color:var(--theme-v-accent-text)]" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4" />
                      Save Changes
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Help Card */}
        <div className="mt-6 rounded-2xl bg-[color:var(--theme-v-nav-hover-bg)] p-5 shadow-sm ring-1 ring-[color:var(--theme-v-hero-border)]">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[color:var(--theme-v-nav-hover-bg)]">
                <Sparkles className="h-5 w-5 text-[color:var(--theme-v-accent)]" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-[color:var(--theme-v-text-primary)]">Need Help?</h3>
                <p className="text-xs text-[color:var(--theme-v-text-secondary)]">
                  Contact support if you need assistance with your profile
                </p>
              </div>
            </div>
           
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;



