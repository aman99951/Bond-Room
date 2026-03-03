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
        className="flex h-10 w-full items-center justify-between gap-2 rounded-xl bg-white px-3 text-sm shadow-sm ring-1 ring-[#e5e7eb] transition-all hover:ring-[#c4b5fd] focus:outline-none focus:ring-2 focus:ring-[#5D3699] disabled:cursor-not-allowed disabled:opacity-60"
      >
        <span className={selectedLabel ? 'text-[#111827]' : 'text-[#9ca3af]'}>
          {selectedLabel || placeholder}
        </span>
        <ChevronDown
          className={`h-4 w-4 text-[#9ca3af] transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open && (
        <ul
          role="listbox"
          className="absolute z-20 mt-2 w-full rounded-xl bg-white py-2 shadow-xl ring-1 ring-[#e5e7eb]"
        >
          {options.map((opt) => (
            <li key={opt.value}>
              <button
                type="button"
                className={`w-full px-4 py-2.5 text-left text-sm transition-colors ${
                  value === opt.value
                    ? 'bg-[#f5f3ff] text-[#5D3699] font-medium'
                    : 'text-[#6b7280] hover:bg-[#f5f3ff]'
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

const sessionLengthOptions = [30, 45, 60, 90];

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
          preferred_session_minutes:
            preferencesResponse?.preferred_session_minutes ?? '',
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

  const handleCancel = async () => {
    if (!mentee?.id) return;
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      const latestPreferences = await menteeApi.getMenteePreferences(mentee.id);
      setPreferences({
        comfort_level: latestPreferences?.comfort_level || '',
        preferred_session_minutes:
          latestPreferences?.preferred_session_minutes ?? '',
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
          grade: mentee.grade,
          email: mentee.email,
          dob: mentee.dob,
          gender: mentee.gender,
          city_state: mentee.city_state || '',
          timezone: mentee.timezone || '',
          parent_mobile: mentee.parent_mobile || '',
        }),
        menteeApi.updateMenteePreferences(mentee.id, {
          comfort_level: preferences.comfort_level || '',
          preferred_session_minutes:
            preferences.preferred_session_minutes === ''
              ? null
              : Number(preferences.preferred_session_minutes),
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
      <div className="mb-6 sm:mb-8">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#5D3699] shadow-lg shadow-[#5D3699]/20">
            <User className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-[#111827] sm:text-3xl">
              My Profile
            </h1>
            <p className="mt-1 text-sm text-[#6b7280]">
              Manage your profile and preferences
            </p>
          </div>
        </div>
      </div>

      {/* Main Card */}
      <div className="rounded-2xl bg-white p-6 sm:p-8 shadow-sm ring-1 ring-[#e5e7eb]">
        <div className="flex flex-col gap-8 lg:flex-row">
          {/* Avatar Section */}
          <div className="flex flex-col items-center gap-4 lg:w-48">
            <div className="relative">
              <div className="h-28 w-28 overflow-hidden rounded-2xl bg-[#f5f3ff] ring-4 ring-white shadow-lg">
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt="Profile"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-3xl font-bold text-[#5D3699]">
                    {initials || 'U'}
                  </div>
                )}
              </div>
              <button
                type="button"
                onClick={() => avatarInputRef.current?.click()}
                disabled={photoUploading || saving || menteeLoading}
                className="absolute -bottom-2 -right-2 flex h-10 w-10 items-center justify-center rounded-xl bg-[#5D3699] text-white shadow-lg transition-all hover:bg-[#4a2b7a] hover:scale-110 disabled:opacity-60"
                aria-label="Upload profile photo"
              >
                {photoUploading ? (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
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
              <p className="text-sm font-medium text-[#111827]">{fullName}</p>
              <p className="text-xs text-[#6b7280]">Student</p>
            </div>
          </div>

          {/* Form Section */}
          <div className="flex-1 space-y-6">
            {/* Personal Information */}
            <div>
              <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-[#9ca3af]">
                <User className="h-4 w-4" />
                Personal Information
              </h2>
              
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                {/* Full Name */}
                <div>
                  <label className="mb-2 flex items-center gap-2 text-sm font-medium text-[#6b7280]">
                    <User className="h-4 w-4 text-[#9ca3af]" />
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={fullName}
                    readOnly
                    className="h-11 w-full rounded-xl border-0 bg-[#f8fafc] px-4 text-sm text-[#111827] ring-1 ring-[#e5e7eb] cursor-not-allowed"
                  />
                </div>

                {/* Email */}
                <div>
                  <label className="mb-2 flex items-center gap-2 text-sm font-medium text-[#6b7280]">
                    <Mail className="h-4 w-4 text-[#9ca3af]" />
                    Email
                  </label>
                  <input
                    type="email"
                    value={email}
                    readOnly
                    className="h-11 w-full rounded-xl border-0 bg-[#f8fafc] px-4 text-sm text-[#111827] ring-1 ring-[#e5e7eb] cursor-not-allowed"
                  />
                </div>

                {/* Grade */}
                <div>
                  <label className="mb-2 flex items-center gap-2 text-sm font-medium text-[#6b7280]">
                    <GraduationCap className="h-4 w-4 text-[#9ca3af]" />
                    Grade / Class
                  </label>
                  <div className="flex h-11 w-full items-center justify-between rounded-xl bg-white px-4 text-sm text-[#111827] ring-1 ring-[#e5e7eb]">
                    <span>{grade}</span>
                    <ChevronRight className="h-4 w-4 text-[#9ca3af] rotate-90" />
                  </div>
                </div>

                {/* Parent's Mobile */}
                <div>
                  <label className="mb-2 flex items-center gap-2 text-sm font-medium text-[#6b7280]">
                    <Phone className="h-4 w-4 text-[#9ca3af]" />
                    Parent's Mobile
                  </label>
                  <div className="flex h-11 w-full items-center justify-between rounded-xl bg-[#f8fafc] px-4 text-sm text-[#111827] ring-1 ring-[#e5e7eb]">
                    <span>{parentMobile}</span>
                    <div className="flex h-6 w-6 items-center justify-center rounded-md bg-[#e5e7eb]">
                      <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 text-[#6b7280]" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="5" y="11" width="14" height="10" rx="2" />
                        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Divider */}
            <div className="border-t border-[#e5e7eb]" />

            {/* Assessment Card */}
            <div className="rounded-2xl bg-[#f5f3ff] p-5 ring-1 ring-[#5D3699]/10">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-[#5D3699]">
                    <Sparkles className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-[#111827]">
                      Mood & Needs Assessment
                    </h3>
                    {assessmentSummary.lastTaken && assessmentSummary.focus ? (
                      <p className="mt-1 text-sm text-[#6b7280]">
                        Last taken on{' '}
                        <span className="font-medium text-[#111827]">{assessmentSummary.lastTaken}</span>
                        <br className="sm:hidden" />
                        <span className="hidden sm:inline"> · </span>
                        Focus:{' '}
                        <span className="font-medium text-[#5D3699]">{assessmentSummary.focus}</span>
                      </p>
                    ) : (
                      <p className="mt-1 text-sm text-[#6b7280]">
                        Complete your assessment to get personalized mentor matches.
                      </p>
                    )}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => navigate('/needs-assessment')}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-medium text-[#5D3699] ring-1 ring-[#5D3699]/20 transition-all hover:bg-[#5D3699] hover:text-white sm:flex-shrink-0"
                >
                  <RefreshCw className="h-4 w-4" />
                  Retake Assessment
                </button>
              </div>
            </div>

            {/* Divider */}
            <div className="border-t border-[#e5e7eb]" />

            {/* Session Preferences */}
            <div>
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#f5f3ff]">
                  <Settings className="h-4 w-4 text-[#5D3699]" />
                </div>
                <div>
                  <h2 className="text-base font-semibold text-[#111827]">
                    Session Preferences
                  </h2>
                  <p className="text-xs text-[#6b7280]">
                    Help us find the best mentors for you
                  </p>
                </div>
              </div>

              <div className="mt-6 grid gap-6 sm:grid-cols-2">
                {/* Comfort Level */}
                <div className="rounded-xl bg-[#f8fafc] p-4 ring-1 ring-[#e5e7eb]">
                  <div className="flex items-center gap-2 text-sm font-medium text-[#111827]">
                    <Heart className="h-4 w-4 text-[#5D3699]" />
                    Comfort Level
                  </div>
                  <p className="mt-1 text-xs text-[#6b7280]">
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
                      <div className="relative h-2 rounded-full bg-[#e5e7eb]">
                        <div
                          className="absolute h-2 rounded-full bg-[#5D3699]"
                          style={{ width: `${comfortPosition}%` }}
                        />
                        <div
                          className="absolute top-1/2 h-5 w-5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#5D3699] ring-4 ring-white shadow-lg"
                          style={{ left: `${comfortPosition}%` }}
                        />
                      </div>
                      <div className="mt-3 flex items-center justify-between text-[10px] font-medium text-[#9ca3af]">
                        <span>Very Shy</span>
                        <span>Neutral</span>
                        <span>Outgoing</span>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-4 flex items-center justify-center rounded-lg bg-white py-4 text-xs text-[#9ca3af]">
                      Not set yet
                    </div>
                  )}
                </div>

                {/* Session Length */}
                <div className="rounded-xl bg-[#f8fafc] p-4 ring-1 ring-[#e5e7eb]">
                  <div className="flex items-center gap-2 text-sm font-medium text-[#111827]">
                    <Clock className="h-4 w-4 text-[#5D3699]" />
                    Session Length
                  </div>
                  <p className="mt-1 text-xs text-[#6b7280]">
                    Preferred duration
                  </p>

                  <div className="mt-3">
                    <DropdownSelect
                      value={
                        preferences.preferred_session_minutes === ''
                          ? ''
                          : String(preferences.preferred_session_minutes)
                      }
                      placeholder="Select session length"
                      options={sessionLengthOptions.map((minutes) => ({
                        label: `${minutes} minutes`,
                        value: String(minutes),
                      }))}
                      onChange={handleSessionLengthChange}
                    />
                  </div>
                  
                  <div className="mt-4 flex h-12 items-center justify-center rounded-xl bg-white text-lg font-semibold text-[#5D3699] ring-1 ring-[#e5e7eb]">
                    {preferences.preferred_session_minutes
                      ? `${preferences.preferred_session_minutes} min`
                      : 'Not set'}
                  </div>
                </div>
              </div>

              {/* Mentor Type */}
              <div className="mt-6">
                <div className="flex items-center gap-2 text-sm font-medium text-[#111827]">
                  <Users className="h-4 w-4 text-[#5D3699]" />
                  Preferred Mentor Type
                </div>
                <p className="mt-1 text-xs text-[#6b7280]">
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
                        className={`group inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-medium transition-all duration-200 ${
                          selected
                            ? 'bg-[#5D3699] text-white shadow-md shadow-[#5D3699]/20'
                            : 'bg-white text-[#6b7280] ring-1 ring-[#e5e7eb] hover:ring-[#5D3699]/30 hover:text-[#5D3699]'
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
              <div className="flex items-center justify-center gap-3 rounded-xl bg-[#f5f3ff] px-4 py-4">
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-[#e5e7eb] border-t-[#5D3699]" />
                <span className="text-sm text-[#6b7280]">Loading profile...</span>
              </div>
            )}

            {/* Divider */}
            <div className="border-t border-[#e5e7eb]" />

            {/* Action Buttons */}
            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-end">
              <button
                type="button"
                onClick={handleCancel}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-6 py-3 text-sm font-medium text-[#6b7280] ring-1 ring-[#e5e7eb] transition-all hover:bg-[#f8fafc] hover:text-[#111827]"
              >
                <X className="h-4 w-4" />
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={saving || menteeLoading}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#5D3699] px-6 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:bg-[#4a2b7a] hover:shadow-md disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {saving ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
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
      <div className="mt-6 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-[#e5e7eb]">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#f5f3ff]">
              <Sparkles className="h-5 w-5 text-[#5D3699]" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-[#111827]">Need Help?</h3>
              <p className="text-xs text-[#6b7280]">
                Contact support if you need assistance with your profile
              </p>
            </div>
          </div>
          <button
            type="button"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#f5f3ff] px-4 py-2 text-sm font-medium text-[#5D3699] transition-all hover:bg-[#ede9fe]"
          >
            Contact Support
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  </div>
);
};

export default Profile;
