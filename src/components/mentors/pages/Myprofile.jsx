import React, { useEffect, useMemo, useRef, useState } from 'react';
import { mentorApi } from '../../../apis/api/mentorApi';
import { useMentorData } from '../../../apis/apihook/useMentorData';
import {
  User,
  Mail,
  Phone,
  MapPin,
  Briefcase,
  Award,
  Star,
  Globe,
  Calendar,
  Camera,
  Save,
  X,
  CheckCircle2,
  AlertCircle,
  Shield,
  Edit3,
  Clock
} from 'lucide-react';

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || '/api').replace(/\/+$/, '');

const resolveMediaUrl = (value) => {
  const raw = String(value || '').trim();
  if (!raw) return '';
  if (['null', 'undefined', 'none'].includes(raw.toLowerCase())) return '';
  if (/^https?:\/\//i.test(raw)) return raw;

  const base = API_BASE_URL.endsWith('/api') ? API_BASE_URL.slice(0, -4) : API_BASE_URL;
  if (raw.startsWith('/')) return base ? `${base}${raw}` : raw;
  if (raw.startsWith('media/')) return base ? `${base}/${raw}` : `/${raw}`;
  return raw;
};

const withCacheBuster = (url, versionToken) => {
  if (!url) return '';
  if (!versionToken) return url;
  // Do not mutate signed URLs (S3/presigned/CDN signatures), it can invalidate them.
  const lowered = String(url).toLowerCase();
  if (
    lowered.includes('x-amz-algorithm=') ||
    lowered.includes('x-amz-signature=') ||
    lowered.includes('signature=') ||
    lowered.includes('token=')
  ) {
    return url;
  }
  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}v=${encodeURIComponent(versionToken)}`;
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
const CARE_AREA_OPTIONS = [
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
const BIO_MAX_WORDS = 1000;
const CONTINUOUS_TEXT_WORD_CHUNK = 8;
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

const Myprofile = () => {
  const { mentor, error: mentorError, setMentor } = useMentorData();
  const [profile, setProfile] = useState(null);
  const [stats, setStats] = useState({ sessions_completed: 0, average_rating: 0 });
  const [photoPreview, setPhotoPreview] = useState('');
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    countryCode: '+91',
    country: 'India',
    stateName: 'Tamil Nadu',
    city: 'Chennai',
    postalCode: '',
    careAreas: [],
    specialization: '',
    experience: '',
    bio: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [photoUploading, setPhotoUploading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const fileInputRef = useRef(null);
  const bioTextareaRef = useRef(null);

  const initials = useMemo(() => {
    const parts = (form.fullName || '').split(' ').filter(Boolean);
    const first = parts[0]?.[0] || '';
    const second = parts[1]?.[0] || '';
    return `${first}${second}`.toUpperCase() || 'MN';
  }, [form.fullName]);

  const stateOptions = useMemo(
    () => LOCATION_OPTIONS[form.country]?.states || [],
    [form.country]
  );

  const cityOptions = useMemo(
    () => LOCATION_OPTIONS[form.country]?.citiesByState?.[form.stateName] || [],
    [form.country, form.stateName]
  );

  const locationLabel = useMemo(() => {
    const tokens = [form.city, form.stateName, form.country]
      .map((item) => String(item || '').trim())
      .filter(Boolean);
    return tokens.join(', ');
  }, [form.city, form.stateName, form.country]);
  const bioWordCount = useMemo(() => countWords(form.bio), [form.bio]);

  const syncForm = (mentorData, profileData) => {
    const fullName = `${mentorData?.first_name || ''} ${mentorData?.last_name || ''}`.trim();
    const nextCountry = COUNTRY_OPTIONS.includes(mentorData?.country)
      ? mentorData.country
      : 'India';
    const nextStates = LOCATION_OPTIONS[nextCountry]?.states || [];
    const nextState = nextStates.includes(mentorData?.state)
      ? mentorData.state
      : (nextStates[0] || '');
    const nextCities = LOCATION_OPTIONS[nextCountry]?.citiesByState?.[nextState] || [];
    const nextCity = nextCities.includes(mentorData?.city)
      ? mentorData.city
      : (nextCities[0] || mentorData?.city_state || '');
    setForm({
      fullName: fullName || '',
      email: mentorData?.email || '',
      phone: mentorData?.mobile || '',
      countryCode: mentorData?.country_code || COUNTRY_DIAL_CODE[nextCountry] || '+91',
      country: nextCountry,
      stateName: nextState,
      city: nextCity,
      postalCode: mentorData?.postal_code || '',
      careAreas: Array.isArray(mentorData?.care_areas) ? mentorData.care_areas : [],
      specialization: profileData?.specialization || '',
      experience: profileData?.years_experience ? String(profileData.years_experience) : '',
      bio: mentorData?.bio || '',
    });
    const resolvedMentorAvatar = resolveMediaUrl(mentorData?.profile_photo || mentorData?.avatar);
    const resolvedProfilePhoto = resolveMediaUrl(profileData?.profile_photo);
    setPhotoPreview(
      withCacheBuster(
        resolvedMentorAvatar || resolvedProfilePhoto,
        profileData?.updated_at || mentorData?.updated_at || ''
      )
    );
  };

  useEffect(() => {
    let cancelled = false;
    if (!mentor?.id) {
      setLoading(false);
      return undefined;
    }

    const loadProfile = async () => {
      setLoading(true);
      setError('');
      try {
        const [profileResponse, impactResponse] = await Promise.all([
          mentorApi.getMentorProfile(mentor.id),
          mentorApi.getMentorImpactDashboard(mentor.id),
        ]);
        if (!cancelled) {
          setProfile(profileResponse || null);
          {
            const resolvedMentorAvatar = resolveMediaUrl(mentor?.profile_photo || mentor?.avatar);
            const resolvedProfilePhoto = resolveMediaUrl(profileResponse?.profile_photo);
            setPhotoPreview(
              withCacheBuster(
                resolvedMentorAvatar || resolvedProfilePhoto,
                profileResponse?.updated_at || mentor?.updated_at || ''
              )
            );
          }
          setStats({
            sessions_completed: impactResponse?.summary?.completed_sessions || 0,
            average_rating: impactResponse?.summary?.average_rating || 0,
          });
          syncForm(mentor, profileResponse);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err?.message || 'Unable to load mentor profile.');
          syncForm(mentor || {}, profile || {});
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadProfile();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mentor?.id]);

  const updateField = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  useEffect(() => {
    const availableStates = LOCATION_OPTIONS[form.country]?.states || [];
    if (!availableStates.length) return;
    if (!availableStates.includes(form.stateName)) {
      setForm((prev) => ({ ...prev, stateName: availableStates[0] }));
      return;
    }
    const availableCities = LOCATION_OPTIONS[form.country]?.citiesByState?.[form.stateName] || [];
    if (availableCities.length && !availableCities.includes(form.city)) {
      setForm((prev) => ({ ...prev, city: availableCities[0] }));
    }
    const expectedCountryCode = COUNTRY_DIAL_CODE[form.country] || '+91';
    if (!form.countryCode || form.countryCode !== expectedCountryCode) {
      setForm((prev) => ({ ...prev, countryCode: expectedCountryCode }));
    }
  }, [form.country, form.stateName, form.city, form.countryCode]);

  const toggleCareArea = (value) => {
    setForm((prev) => {
      const current = Array.isArray(prev.careAreas) ? prev.careAreas : [];
      const exists = current.includes(value);
      if (exists) {
        return { ...prev, careAreas: current.filter((item) => item !== value) };
      }
      return { ...prev, careAreas: [...current, value] };
    });
  };

  const handleBioInput = (value) => {
    const limited = truncateToWordLimit(value, BIO_MAX_WORDS);
    updateField('bio', limited);
  };

  const handleCancel = () => {
    setError('');
    setSuccess('');
    syncForm(mentor || {}, profile || {});
  };

  const handleSave = async () => {
    if (!mentor?.id) return;
    if (!Array.isArray(form.careAreas) || form.careAreas.length === 0) {
      setError('Please select at least one care area.');
      return;
    }
    setSaving(true);
    setError('');
    setSuccess('');

    const nameParts = form.fullName.trim().split(' ').filter(Boolean);
    const firstName = nameParts.shift() || mentor.first_name || '';
    const lastName = nameParts.join(' ') || mentor.last_name || '';

    try {
      const [updatedMentor, updatedProfile] = await Promise.all([
        mentorApi.updateMentor(mentor.id, {
          first_name: firstName,
          last_name: lastName,
          mobile: form.phone.trim(),
          country_code: form.countryCode.trim(),
          country: form.country.trim(),
          state: form.stateName.trim(),
          city: form.city.trim(),
          postal_code: form.postalCode.trim(),
          city_state: form.city.trim(),
          care_areas: form.careAreas,
          qualification: mentor.qualification || '',
          bio: form.bio.trim(),
        }),
        mentorApi.updateMentorProfile(mentor.id, {
          specialization: form.specialization.trim(),
          years_experience: form.experience ? Number(form.experience) : null,
        }),
      ]);

      setMentor(updatedMentor || mentor);
      setProfile(updatedProfile || profile);
      syncForm(updatedMentor || mentor, updatedProfile || profile);
      setSuccess('Profile updated successfully.');
    } catch (err) {
      setError(err?.message || 'Unable to save profile changes.');
    } finally {
      setSaving(false);
    }
  };

  const handlePhotoUpload = async (file) => {
    if (!mentor?.id || !file) return;
    setPhotoUploading(true);
    setError('');
    setSuccess('');
    try {
      const formData = new FormData();
      formData.append('profile_photo', file);
      const updatedProfile = await mentorApi.updateMentorProfile(mentor.id, formData);
      setProfile(updatedProfile || profile);
      const resolvedPhoto = resolveMediaUrl(updatedProfile?.profile_photo);
      const nextPhoto = withCacheBuster(
        resolvedPhoto,
        updatedProfile?.updated_at || Date.now()
      );
      setPhotoPreview(nextPhoto || photoPreview);
      if (resolvedPhoto) {
        setMentor((prev) => (prev ? { ...prev, avatar: resolvedPhoto, profile_photo: resolvedPhoto } : prev));
        if (typeof window !== 'undefined') {
          window.dispatchEvent(
            new CustomEvent('mentor:avatar-updated', {
              detail: { avatar: resolvedPhoto },
            })
          );
        }
      }
      setSuccess('Profile photo updated successfully.');
    } catch (err) {
      setError(err?.message || 'Unable to update profile photo.');
    } finally {
      setPhotoUploading(false);
    }
  };
return (
  <div className="min-h-screen bg-transparent p-3 text-[color:var(--theme-v-text-primary)] sm:p-6 lg:p-8">
    <div className="w-full">
      {/* Header Section */}
      <div className="relative mb-8 overflow-hidden rounded-3xl border border-[color:var(--theme-v-border-strong)] bg-[linear-gradient(135deg,var(--theme-v-bg-mid)_0%,var(--theme-v-bg-start)_50%,var(--theme-v-bg-end)_100%)] p-4 shadow-[0_20px_45px_-28px_var(--theme-v-shell-shadow)] ring-1 ring-[color:var(--theme-v-hero-ring)] sm:p-6">
        <div className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-[color:var(--theme-v-orb-gold)] blur-3xl" />
        <div className="pointer-events-none absolute -left-16 -bottom-16 h-36 w-36 rounded-full bg-[color:var(--theme-v-orb-light)] blur-3xl" />
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          {/* Title with decorative element */}
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl bg-[color:var(--theme-v-surface-overlay-strong)] sm:h-12 sm:w-12">
              <User className="h-6 w-6 text-[color:var(--theme-v-accent)]" />
            </div>
            <div className="min-w-0">
              <h1 className="text-xl font-bold tracking-tight text-[color:var(--theme-v-text-primary)] sm:text-3xl">
                My Profile
              </h1>
              <p className="mt-1 text-sm text-[color:var(--theme-v-text-secondary)]">
                Manage your mentor profile details
              </p>
            </div>
          </div>

          {/* Mentor ID Badge */}
          <div className="flex w-full items-center justify-center gap-2 rounded-full bg-[color:var(--theme-v-surface-overlay)] px-4 py-2 ring-1 ring-[color:var(--theme-v-border-soft)] sm:w-auto sm:self-start sm:justify-start">
            <Shield className="h-4 w-4 text-[color:var(--theme-v-accent)]" />
            <span className="text-sm font-semibold text-[color:var(--theme-v-accent)]">
              {profile?.public_id || 'BR-0000'}
            </span>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 xl:grid-cols-[minmax(0,340px)_minmax(0,1fr)]">
        {/* Left Column - Profile Card */}
        <div className="space-y-6">
          {/* Profile Overview Card */}
          <div className="rounded-2xl bg-[color:var(--theme-v-surface-overlay)] p-4 shadow-sm ring-1 ring-[color:var(--theme-v-border-soft)] sm:p-6">
            {/* Avatar Section */}
            <div className="flex flex-col items-center text-center">
              <div className="relative">
                <div className="h-20 w-20 overflow-hidden rounded-2xl bg-[color:var(--theme-v-surface-overlay-strong)] ring-4 ring-[color:var(--theme-v-surface-overlay)] shadow-lg sm:h-24 sm:w-24">
                  {photoPreview ? (
                    <img
                      src={photoPreview}
                      alt="Profile"
                      className="h-full w-full object-cover"
                      onError={(event) => {
                        const fallback = withCacheBuster(
                          resolveMediaUrl(mentor?.profile_photo || mentor?.avatar),
                          mentor?.updated_at || ''
                        );
                        if (fallback && event.currentTarget.src !== fallback) {
                          setPhotoPreview(fallback);
                          return;
                        }
                        // If /media isn't reachable in local dev, avoid broken-image icon.
                        setPhotoPreview('');
                      }}
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-2xl font-bold text-[color:var(--theme-v-accent)]">
                      {initials}
                    </div>
                  )}
                </div>
                {/* Camera Button Overlay */}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={photoUploading}
                  className="absolute -bottom-2 -right-2 flex h-8 w-8 items-center justify-center rounded-full bg-[color:var(--theme-v-accent)] text-[color:var(--theme-v-accent-text)] shadow-lg transition-all hover:bg-[color:var(--theme-v-accent-hover)] hover:scale-110 disabled:opacity-60"
                >
                  {photoUploading ? (
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  ) : (
                    <Camera className="h-4 w-4" />
                  )}
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (file) handlePhotoUpload(file);
                    event.target.value = '';
                  }}
                />
              </div>

              {/* Name & Role */}
              <h2 className="mt-4 text-xl font-bold text-[color:var(--theme-v-text-primary)]">
                {form.fullName || 'Mentor Name'}
              </h2>
              <div className="mt-1 flex items-center gap-2 text-sm text-[color:var(--theme-v-text-secondary)]">
                <MapPin className="h-3.5 w-3.5" />
                <span>{locationLabel || 'Location not set'}</span>
              </div>

              {/* Status Badge */}
              <div className="mt-3">
                <span
                  className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${
                    profile?.is_active
                      ? 'bg-green-50 text-green-700 ring-1 ring-green-600/20'
                      : 'bg-red-50 text-red-700 ring-1 ring-red-600/20'
                  }`}
                >
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${
                      profile?.is_active ? 'bg-green-500' : 'bg-red-500'
                    }`}
                  />
                  {profile?.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>

            {/* Divider */}
            <div className="my-6 border-t border-[color:var(--theme-v-border-soft)]" />

            {/* Stats Grid */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
              <div className="rounded-xl bg-[color:var(--theme-v-surface-overlay-strong)] p-4 text-center ring-1 ring-[color:var(--theme-v-border-soft)]">
                <div className="flex items-center justify-center gap-1.5 text-[color:var(--theme-v-text-secondary)]">
                  <Calendar className="h-4 w-4" />
                  <span className="text-xs font-medium">Sessions</span>
                </div>
                <p className="mt-2 text-2xl font-bold text-[color:var(--theme-v-text-primary)]">
                  {stats.sessions_completed}
                </p>
              </div>
              <div className="rounded-xl bg-[color:var(--theme-v-surface-overlay-strong)] p-4 text-center ring-1 ring-[color:var(--theme-v-border-soft)]">
                <div className="flex items-center justify-center gap-1.5 text-[color:var(--theme-v-text-secondary)]">
                  <Star className="h-4 w-4" />
                  <span className="text-xs font-medium">Rating</span>
                </div>
                <p className="mt-2 text-2xl font-bold text-[color:var(--theme-v-text-primary)]">
                  {stats.average_rating}
                </p>
              </div>
            </div>

            {/* Languages */}
            <div className="mt-4 rounded-xl bg-[color:var(--theme-v-surface-overlay-strong)] p-4 ring-1 ring-[color:var(--theme-v-border-soft)]">
              <div className="flex items-center gap-2 text-sm text-[color:var(--theme-v-text-secondary)]">
                <Globe className="h-4 w-4" />
                <span className="font-medium">Languages</span>
              </div>
              <div className="mt-2 flex flex-wrap gap-2">
                {Array.isArray(mentor?.languages) && mentor.languages.length ? (
                  mentor.languages.map((lang, idx) => (
                    <span
                      key={idx}
                      className="rounded-full bg-[color:var(--theme-v-surface-overlay)] px-3 py-1 text-xs font-medium text-[color:var(--theme-v-text-secondary)] ring-1 ring-[color:var(--theme-v-border-soft)]"
                    >
                      {lang}
                    </span>
                  ))
                ) : (
                  <span className="text-sm text-[color:var(--theme-v-text-placeholder)]">Not set</span>
                )}
              </div>
            </div>
          </div>

          {/* Quick Actions Card */}
          <div className="rounded-2xl bg-[color:var(--theme-v-surface-overlay)] p-4 shadow-sm ring-1 ring-[color:var(--theme-v-border-soft)] sm:p-6">
            <h3 className="text-sm font-semibold text-[color:var(--theme-v-text-primary)]">Quick Actions</h3>
            <div className="mt-4 space-y-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={photoUploading}
                className="flex w-full items-center gap-3 rounded-xl bg-[color:var(--theme-v-surface-overlay-strong)] px-4 py-3 text-left text-sm font-medium text-[color:var(--theme-v-text-primary)] transition-all hover:bg-[color:var(--theme-v-surface-overlay)] disabled:opacity-60"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[color:var(--theme-v-surface-overlay)]">
                  <Camera className="h-4 w-4 text-[color:var(--theme-v-accent)]" />
                </div>
                <span>{photoUploading ? 'Uploading...' : 'Change Photo'}</span>
              </button>
           
            </div>
          </div>
        </div>

        {/* Right Column - Edit Form */}
        <div className="min-w-0 rounded-2xl bg-[color:var(--theme-v-surface-overlay)] p-4 shadow-sm ring-1 ring-[color:var(--theme-v-border-soft)] sm:p-6 lg:p-8">
          {/* Form Header */}
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[color:var(--theme-v-surface-overlay-strong)]">
              <Edit3 className="h-5 w-5 text-[color:var(--theme-v-accent)]" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-[color:var(--theme-v-text-primary)]">Edit Profile</h2>
              <p className="text-sm text-[color:var(--theme-v-text-secondary)]">Update your personal information</p>
            </div>
          </div>

          {/* Form Fields */}
          <div className="space-y-6">
            {/* Personal Information Section */}
            <div>
              <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-[color:var(--theme-v-text-secondary)]">
                Personal Information
              </h3>
              <div className="grid gap-4 sm:grid-cols-2">
                {/* Full Name */}
                <div className="group">
                  <label className="mb-2 flex items-center gap-2 text-sm font-medium text-[color:var(--theme-v-text-label)]">
                    <User className="h-4 w-4 text-[color:var(--theme-v-text-secondary)]" />
                    Full Name
                  </label>
                  <input
                    type="text"
                    className="w-full rounded-xl border-0 bg-[color:var(--theme-v-surface-overlay-strong)] px-4 py-3 text-sm text-[color:var(--theme-v-text-primary)] ring-1 ring-[color:var(--theme-v-border-soft)] transition-all placeholder:text-[color:var(--theme-v-text-placeholder)] focus:bg-[color:var(--theme-v-surface-overlay)] focus:ring-2 focus:ring-[color:var(--theme-v-border-focus)]"
                    placeholder="Enter your full name"
                    value={form.fullName}
                    onChange={(event) => updateField('fullName', event.target.value)}
                  />
                </div>

                {/* Email */}
                <div className="group">
                  <label className="mb-2 flex items-center gap-2 text-sm font-medium text-[color:var(--theme-v-text-label)]">
                    <Mail className="h-4 w-4 text-[color:var(--theme-v-text-secondary)]" />
                    Email
                  </label>
                  <input
                    type="email"
                    className="w-full cursor-not-allowed rounded-xl border-0 bg-[color:var(--theme-v-surface-overlay-strong)] px-4 py-3 text-sm text-[color:var(--theme-v-text-secondary)] ring-1 ring-[color:var(--theme-v-border-soft)]"
                    value={form.email}
                    readOnly
                  />
                </div>

                {/* Phone */}
                <div className="group">
                  <label className="mb-2 flex items-center gap-2 text-sm font-medium text-[color:var(--theme-v-text-label)]">
                    <Phone className="h-4 w-4 text-[color:var(--theme-v-text-secondary)]" />
                    Phone
                  </label>
                  <input
                    type="tel"
                    className="w-full rounded-xl border-0 bg-[color:var(--theme-v-surface-overlay-strong)] px-4 py-3 text-sm text-[color:var(--theme-v-text-primary)] ring-1 ring-[color:var(--theme-v-border-soft)] transition-all placeholder:text-[color:var(--theme-v-text-placeholder)] focus:bg-[color:var(--theme-v-surface-overlay)] focus:ring-2 focus:ring-[color:var(--theme-v-border-focus)]"
                    placeholder="Enter your phone number"
                    value={form.phone}
                    onChange={(event) => updateField('phone', event.target.value)}
                  />
                </div>

                {/* City */}
                <div className="group">
                  <label className="mb-2 flex items-center gap-2 text-sm font-medium text-[color:var(--theme-v-text-label)]">
                    <Globe className="h-4 w-4 text-[color:var(--theme-v-text-secondary)]" />
                    Country
                  </label>
                  <select
                    className="w-full rounded-xl border-0 bg-[color:var(--theme-v-surface-overlay-strong)] px-4 py-3 text-sm text-[color:var(--theme-v-text-primary)] ring-1 ring-[color:var(--theme-v-border-soft)] transition-all focus:bg-[color:var(--theme-v-surface-overlay)] focus:ring-2 focus:ring-[color:var(--theme-v-border-focus)]"
                    value={form.country}
                    onChange={(event) => updateField('country', event.target.value)}
                  >
                    {COUNTRY_OPTIONS.map((country) => (
                      <option key={country} value={country}>
                        {country}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="group">
                  <label className="mb-2 flex items-center gap-2 text-sm font-medium text-[color:var(--theme-v-text-label)]">
                    <Phone className="h-4 w-4 text-[color:var(--theme-v-text-secondary)]" />
                    Country Code
                  </label>
                  <input
                    type="text"
                    className="w-full rounded-xl border-0 bg-[color:var(--theme-v-surface-overlay-strong)] px-4 py-3 text-sm text-[color:var(--theme-v-text-primary)] ring-1 ring-[color:var(--theme-v-border-soft)] transition-all focus:bg-[color:var(--theme-v-surface-overlay)] focus:ring-2 focus:ring-[color:var(--theme-v-border-focus)]"
                    value={form.countryCode}
                    onChange={(event) => updateField('countryCode', event.target.value)}
                  />
                </div>

                <div className="group">
                  <label className="mb-2 flex items-center gap-2 text-sm font-medium text-[color:var(--theme-v-text-label)]">
                    <MapPin className="h-4 w-4 text-[color:var(--theme-v-text-secondary)]" />
                    State
                  </label>
                  <select
                    className="w-full rounded-xl border-0 bg-[color:var(--theme-v-surface-overlay-strong)] px-4 py-3 text-sm text-[color:var(--theme-v-text-primary)] ring-1 ring-[color:var(--theme-v-border-soft)] transition-all focus:bg-[color:var(--theme-v-surface-overlay)] focus:ring-2 focus:ring-[color:var(--theme-v-border-focus)]"
                    value={form.stateName}
                    onChange={(event) => updateField('stateName', event.target.value)}
                  >
                    {stateOptions.map((stateItem) => (
                      <option key={stateItem} value={stateItem}>
                        {stateItem}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="group">
                  <label className="mb-2 flex items-center gap-2 text-sm font-medium text-[color:var(--theme-v-text-label)]">
                    <MapPin className="h-4 w-4 text-[color:var(--theme-v-text-secondary)]" />
                    City
                  </label>
                  <select
                    className="w-full rounded-xl border-0 bg-[color:var(--theme-v-surface-overlay-strong)] px-4 py-3 text-sm text-[color:var(--theme-v-text-primary)] ring-1 ring-[color:var(--theme-v-border-soft)] transition-all focus:bg-[color:var(--theme-v-surface-overlay)] focus:ring-2 focus:ring-[color:var(--theme-v-border-focus)]"
                    value={form.city}
                    onChange={(event) => updateField('city', event.target.value)}
                  >
                    {cityOptions.map((cityItem) => (
                      <option key={cityItem} value={cityItem}>
                        {cityItem}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="group">
                  <label className="mb-2 flex items-center gap-2 text-sm font-medium text-[color:var(--theme-v-text-label)]">
                    <MapPin className="h-4 w-4 text-[color:var(--theme-v-text-secondary)]" />
                    Pincode
                  </label>
                  <input
                    type="text"
                    className="w-full rounded-xl border-0 bg-[color:var(--theme-v-surface-overlay-strong)] px-4 py-3 text-sm text-[color:var(--theme-v-text-primary)] ring-1 ring-[color:var(--theme-v-border-soft)] transition-all placeholder:text-[color:var(--theme-v-text-placeholder)] focus:bg-[color:var(--theme-v-surface-overlay)] focus:ring-2 focus:ring-[color:var(--theme-v-border-focus)]"
                    placeholder={form.country === 'USA' ? 'e.g. 77001' : 'e.g. 600001'}
                    value={form.postalCode}
                    onChange={(event) => updateField('postalCode', event.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Divider */}
            <div className="border-t border-[color:var(--theme-v-border-soft)]" />

            {/* Professional Information Section */}
            <div>
              <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-[color:var(--theme-v-text-secondary)]">
                Professional Information
              </h3>
              <div className="grid gap-4 sm:grid-cols-2">
                {/* Specialization */}
                <div className="group">
                  <label className="mb-2 flex items-center gap-2 text-sm font-medium text-[color:var(--theme-v-text-label)]">
                    <Award className="h-4 w-4 text-[color:var(--theme-v-text-secondary)]" />
                    Specialization
                  </label>
                  <input
                    type="text"
                    className="w-full rounded-xl border-0 bg-[color:var(--theme-v-surface-overlay-strong)] px-4 py-3 text-sm text-[color:var(--theme-v-text-primary)] ring-1 ring-[color:var(--theme-v-border-soft)] transition-all placeholder:text-[color:var(--theme-v-text-placeholder)] focus:bg-[color:var(--theme-v-surface-overlay)] focus:ring-2 focus:ring-[color:var(--theme-v-border-focus)]"
                    placeholder="e.g., Career Coaching, Tech Mentoring"
                    value={form.specialization}
                    onChange={(event) => updateField('specialization', event.target.value)}
                  />
                </div>

                {/* Experience */}
                <div className="group">
                  <label className="mb-2 flex items-center gap-2 text-sm font-medium text-[color:var(--theme-v-text-label)]">
                    <Briefcase className="h-4 w-4 text-[color:var(--theme-v-text-secondary)]" />
                    Experience
                  </label>
                  <input
                    type="text"
                    className="w-full rounded-xl border-0 bg-[color:var(--theme-v-surface-overlay-strong)] px-4 py-3 text-sm text-[color:var(--theme-v-text-primary)] ring-1 ring-[color:var(--theme-v-border-soft)] transition-all placeholder:text-[color:var(--theme-v-text-placeholder)] focus:bg-[color:var(--theme-v-surface-overlay)] focus:ring-2 focus:ring-[color:var(--theme-v-border-focus)]"
                    placeholder="e.g., 5+ years in software development"
                    value={form.experience}
                    onChange={(event) => updateField('experience', event.target.value)}
                  />
                </div>
              </div>
              <div className="mt-5">
                <label className="mb-2 block text-sm font-medium text-[color:var(--theme-v-text-label)]">
                  Care Areas
                </label>
                <div className="grid gap-2 sm:grid-cols-2">
                  {CARE_AREA_OPTIONS.map((area) => {
                    const selected = Array.isArray(form.careAreas) && form.careAreas.includes(area);
                    return (
                      <button
                        key={area}
                        type="button"
                        onClick={() => toggleCareArea(area)}
                        className={`rounded-lg px-3 py-2 text-left text-xs font-medium transition-all ${
                          selected
                            ? 'bg-[color:var(--theme-v-selected-bg)] text-[color:var(--theme-v-accent)] ring-1 ring-[color:var(--theme-v-border-medium)]'
                            : 'bg-[color:var(--theme-v-surface-overlay-strong)] text-[color:var(--theme-v-text-secondary)] ring-1 ring-[color:var(--theme-v-border-soft)] hover:bg-[color:var(--theme-v-surface-overlay)]'
                        }`}
                      >
                        {area}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Divider */}
            <div className="border-t border-[color:var(--theme-v-border-soft)]" />

            {/* Bio Section */}
            <div>
              <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-[color:var(--theme-v-text-secondary)]">
                About You
              </h3>
              <div className="group">
                <label className="mb-2 flex items-center gap-2 text-sm font-medium text-[color:var(--theme-v-text-label)]">
                  <Edit3 className="h-4 w-4 text-[color:var(--theme-v-text-secondary)]" />
                  Brief Bio
                </label>
                <textarea
                  ref={bioTextareaRef}
                  rows={5}
                  className="w-full resize-y overflow-hidden rounded-xl border-0 bg-[color:var(--theme-v-surface-overlay-strong)] px-4 py-3 text-sm text-[color:var(--theme-v-text-primary)] ring-1 ring-[color:var(--theme-v-border-soft)] transition-all placeholder:text-[color:var(--theme-v-text-placeholder)] focus:bg-[color:var(--theme-v-surface-overlay)] focus:ring-2 focus:ring-[color:var(--theme-v-border-focus)]"
                  placeholder="Tell mentees about yourself, your experience, and what you can help them with..."
                  value={form.bio}
                  onChange={(event) => handleBioInput(event.target.value)}
                  onInput={(event) => {
                    const element = event.currentTarget;
                    element.style.height = 'auto';
                    element.style.height = `${Math.max(140, element.scrollHeight)}px`;
                  }}
                />
                <p className="mt-2 text-xs text-[color:var(--theme-v-text-secondary)]">
                  Maximum {BIO_MAX_WORDS} words. Current: {bioWordCount}.
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col gap-3 border-t border-[color:var(--theme-v-border-soft)] pt-6 sm:flex-row sm:items-center sm:justify-between">
              <div className="order-2 flex flex-col gap-3 sm:order-1 sm:flex-row">
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={saving}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[color:var(--theme-v-accent)] px-6 py-3 text-sm font-semibold text-[color:var(--theme-v-accent-text)] shadow-sm transition-all hover:bg-[color:var(--theme-v-accent-hover)] hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
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
                <button
                  type="button"
                  onClick={handleCancel}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[color:var(--theme-v-surface-overlay)] px-6 py-3 text-sm font-semibold text-[color:var(--theme-v-text-secondary)] ring-1 ring-[color:var(--theme-v-border-soft)] transition-all hover:bg-[color:var(--theme-v-surface-overlay-strong)] hover:ring-[color:var(--theme-v-border-hover)] sm:w-auto"
                >
                  <X className="h-4 w-4" />
                  Cancel
                </button>
              </div>

              <p className="order-1 text-xs text-[color:var(--theme-v-text-secondary)] sm:order-2">
                Last updated: Today
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Status Messages */}
      {loading && (
        <div className="mt-6 flex items-center justify-center gap-3 rounded-xl bg-[color:var(--theme-v-surface-overlay)] p-6 shadow-sm ring-1 ring-[color:var(--theme-v-border-soft)]">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-[color:var(--theme-v-border-soft)] border-t-[color:var(--theme-v-accent)]" />
          <span className="text-sm font-medium text-[color:var(--theme-v-text-secondary)]">Loading profile...</span>
        </div>
      )}

      {(error || mentorError) && (
        <div className="mt-6 flex flex-col items-start gap-3 rounded-xl bg-red-50 p-4 ring-1 ring-red-100 sm:flex-row sm:items-center">
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-red-100">
            <AlertCircle className="h-5 w-5 text-red-600" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-red-800">Error</p>
            <p className="text-sm text-red-600">{error || mentorError}</p>
          </div>
          <button
            type="button"
            className="self-end rounded-lg bg-red-100 px-3 py-1.5 text-xs font-medium text-red-700 transition-colors hover:bg-red-200 sm:self-auto"
          >
            Dismiss
          </button>
        </div>
      )}

      {success && (
        <div className="mt-6 flex flex-col items-start gap-3 rounded-xl bg-green-50 p-4 ring-1 ring-green-100 sm:flex-row sm:items-center">
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-green-100">
            <CheckCircle2 className="h-5 w-5 text-green-600" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-green-800">Success!</p>
            <p className="text-sm text-green-600">{success}</p>
          </div>
        </div>
      )}
    </div>
  </div>
);

};

export default Myprofile;
