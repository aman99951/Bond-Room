import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { menteeApi } from '../../../apis/api/menteeApi';
import { useMenteeData } from '../../../apis/apihook/useMenteeData';

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
          comfort_level: preferences.comfort_level || null,
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
    <div className="bg-transparent p-4 sm:p-6">
      <div className="rounded-2xl border border-[#e5e7eb] bg-white p-6 sm:p-8 shadow-[0px_1px_2px_0px_rgba(0,0,0,0.08)]">
        <div className="flex flex-col gap-6 md:flex-row">
          <div className="flex flex-col items-center gap-3">
            <div className="relative">
              <div className="h-20 w-20 rounded-full bg-[#e5e7eb] text-[#5D3699] flex items-center justify-center text-xl font-semibold overflow-hidden">
                {avatarUrl ? (
                  <img src={avatarUrl} alt="Mentee profile" className="h-full w-full object-cover" />
                ) : (
                  initials || ''
                )}
              </div>
              <button
                type="button"
                className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full bg-[#f4c542] disabled:opacity-70"
                onClick={() => avatarInputRef.current?.click()}
                disabled={photoUploading || saving || menteeLoading}
                aria-label="Upload profile photo"
              >
                <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 text-[#111827]" aria-hidden="true">
                  <path
                    d="M4 20l4.5-1 9-9a1.4 1.4 0 0 0 0-2L16 5.5a1.4 1.4 0 0 0-2 0l-9 9L4 20z"
                    fill="currentColor"
                  />
                </svg>
              </button>
              <input
                ref={avatarInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handlePhotoSelect}
              />
            </div>
          </div>

          <div className="flex-1">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label
                  className="text-[12px] font-semibold uppercase tracking-[0.7px] text-[#6b7280]"
                  style={{ fontFamily: 'Inter' }}
                >
                  Full Name
                </label>
                <input
                  className="mt-1 h-10 w-full rounded-lg border border-[#d1d5db] px-3 text-[14px] text-[#111827]"
                  style={{ fontFamily: 'DM Sans', lineHeight: '20px' }}
                  value={fullName}
                  readOnly
                />
              </div>
              <div>
                <label
                  className="text-[12px] font-semibold uppercase tracking-[0.7px] text-[#6b7280]"
                  style={{ fontFamily: 'Inter' }}
                >
                  Email
                </label>
                <input
                  className="mt-1 h-10 w-full rounded-lg border border-[#d1d5db] px-3 text-[14px] text-[#111827]"
                  style={{ fontFamily: 'DM Sans', lineHeight: '20px' }}
                  value={email}
                  readOnly
                />
              </div>
              <div>
                <label
                  className="text-[12px] font-semibold uppercase tracking-[0.7px] text-[#6b7280]"
                  style={{ fontFamily: 'Inter' }}
                >
                  Grade / Class
                </label>
                <div className="mt-1 flex h-10 w-full items-center justify-between rounded-lg border border-[#d1d5db] px-3 text-[14px] text-[#111827]">
                  <span style={{ fontFamily: 'DM Sans', lineHeight: '20px' }}>{grade}</span>
                  <svg viewBox="0 0 24 24" className="h-4 w-4 text-[#6b7280]" aria-hidden="true">
                    <path
                      d="M6 9l6 6 6-6"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
              </div>
              <div>
                <label
                  className="text-[12px] font-semibold uppercase tracking-[0.7px] text-[#6b7280]"
                  style={{ fontFamily: 'Inter' }}
                >
                  Parent&apos;s Mobile Number
                </label>
                <div className="mt-1 flex h-10 w-full items-center justify-between rounded-lg border border-[#e5e7eb] bg-[#f3f4f6] px-3 text-[14px] text-[#111827]">
                  <span style={{ fontFamily: 'DM Sans', lineHeight: '20px' }}>{parentMobile}</span>
                  <svg viewBox="0 0 24 24" className="h-4 w-4 text-[#9ca3af]" aria-hidden="true">
                    <path
                      d="M7 10V8a5 5 0 0 1 10 0v2"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.6"
                      strokeLinecap="round"
                    />
                    <rect x="5" y="10" width="14" height="10" rx="2" stroke="currentColor" strokeWidth="1.6" fill="none" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="mt-6 border-t border-[#eef2f7] pt-6">
              <div className="flex flex-col gap-3 rounded-xl border border-[#e5d9f5] bg-[#f7f2ff] p-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="text-[16px] font-semibold text-[#111827]" style={{ fontFamily: 'Inter', lineHeight: '24px' }}>
                    Mood & Needs Assessment
                  </div>
                  {assessmentSummary.lastTaken && assessmentSummary.focus ? (
                    <div className="mt-1 text-[14px] text-[#6b7280]" style={{ fontFamily: 'DM Sans', lineHeight: '20px' }}>
                      Last taken on {assessmentSummary.lastTaken}. Current Focus:{' '}
                      <span className="text-[#5D3699]" style={{ fontWeight: 500 }}>
                        {assessmentSummary.focus}
                      </span>
                    </div>
                  ) : (
                    <div className="mt-1 text-[14px] text-[#6b7280]" style={{ fontFamily: 'DM Sans', lineHeight: '20px' }}>
                      Assessment data not available yet.
                    </div>
                  )}
                </div>
                <button
                  className="h-9 rounded-lg border border-[#5D3699] px-4 text-[14px] text-[#5D3699]"
                  style={{ fontFamily: 'DM Sans', lineHeight: '20px', fontWeight: 500 }}
                  onClick={() => navigate('/needs-assessment')}
                >
                  Retake Assessment
                </button>
              </div>
            </div>

            <div className="mt-6">
              <div className="text-[16px] font-semibold text-[#111827]" style={{ fontFamily: 'Inter', lineHeight: '24px' }}>
                Session Preferences
              </div>
              <div className="mt-1 text-[14px] text-[#6b7280]" style={{ fontFamily: 'DM Sans', lineHeight: '20px' }}>
                Help us find the best mentors for you.
              </div>

              <div className="mt-4 grid gap-6 md:grid-cols-2">
                <div>
                  <div className="text-[14px] text-[#6b7280]" style={{ fontFamily: 'DM Sans', lineHeight: '20px' }}>
                    Comfort level talking to new people
                  </div>
                  {comfortPosition != null ? (
                    <div className="relative mt-3 h-1 rounded-full bg-[#e5e7eb]">
                      <div className="absolute -top-2 h-4 w-4 -translate-x-1/2 rounded-full bg-[#5D3699]" style={{ left: `${comfortPosition}%` }} />
                    </div>
                  ) : (
                    <div className="mt-3 text-xs text-[#9ca3af]">Not set</div>
                  )}
                  <div className="mt-2 flex items-center justify-between text-[12px] text-[#9ca3af]" style={{ fontFamily: 'DM Sans' }}>
                    <span>Very Shy</span>
                    <span>Neutral</span>
                    <span>Very Outgoing</span>
                  </div>
                </div>
                <div>
                  <div className="text-[14px] text-[#6b7280]" style={{ fontFamily: 'DM Sans', lineHeight: '20px' }}>
                    Preferred Session Length
                  </div>
                  <div
                    className="mt-2 h-10 w-full rounded-lg border border-[#e5e7eb] bg-[#f9fafb] px-3 text-[14px] text-[#111827] flex items-center"
                    style={{ fontFamily: 'DM Sans', lineHeight: '20px' }}
                  >
                    {preferences.preferred_session_minutes
                      ? `${preferences.preferred_session_minutes} Minutes`
                      : 'Not set'}
                  </div>
                </div>
              </div>

              <div className="mt-6">
                <div className="text-[14px] text-[#6b7280]" style={{ fontFamily: 'DM Sans', lineHeight: '20px' }}>
                  Preferred Mentor Type
                </div>
                <div className="mt-3 flex flex-wrap gap-3">
                  {mentorTypeOptions.map((option) => {
                    const selected = preferences.preferred_mentor_types.includes(option.value);
                    return (
                      <button
                        key={option.value}
                        className={`rounded-full border px-4 py-2 text-[12px] ${
                          selected
                            ? 'border-[#5D3699] bg-[#5D3699] text-white'
                            : 'border-[#e5e7eb] text-[#6b7280]'
                        }`}
                        style={{ fontFamily: 'DM Sans', lineHeight: '16px', fontWeight: 500 }}
                        onClick={() => toggleMentorType(option.value)}
                      >
                        {option.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {(loading || saving || photoUploading || error || success || menteeError) && (
              <div className={`mt-4 text-xs ${error || menteeError ? 'text-red-600' : success ? 'text-green-700' : 'text-[#6b7280]'}`}>
                {error || menteeError || success || (photoUploading ? 'Uploading photo...' : saving ? 'Saving...' : loading || menteeLoading ? 'Loading profile...' : '')}
              </div>
            )}

            <div className="mt-8 flex items-center justify-end gap-4 border-t border-[#eef2f7] pt-6">
              <button className="text-[14px] text-[#6b7280]" style={{ fontFamily: 'DM Sans', lineHeight: '20px' }} onClick={handleCancel}>
                Cancel
              </button>
              <button
                className="h-10 rounded-lg bg-[#5D3699] px-6 text-[14px] text-white disabled:opacity-70"
                style={{ fontFamily: 'DM Sans', lineHeight: '20px', fontWeight: 500 }}
                onClick={handleSave}
                disabled={saving || menteeLoading}
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
