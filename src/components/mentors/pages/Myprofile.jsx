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
  if (!value) return '';
  if (/^https?:\/\//i.test(value)) return value;
  if (value.startsWith('/')) {
    const base = API_BASE_URL.endsWith('/api') ? API_BASE_URL.slice(0, -4) : API_BASE_URL;
    return base ? `${base}${value}` : value;
  }
  return value;
};

const withCacheBuster = (url, versionToken) => {
  if (!url) return '';
  if (!versionToken) return url;
  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}v=${encodeURIComponent(versionToken)}`;
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
    city: '',
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

  const initials = useMemo(() => {
    const parts = (form.fullName || '').split(' ').filter(Boolean);
    const first = parts[0]?.[0] || '';
    const second = parts[1]?.[0] || '';
    return `${first}${second}`.toUpperCase() || 'MN';
  }, [form.fullName]);

  const syncForm = (mentorData, profileData) => {
    const fullName = `${mentorData?.first_name || ''} ${mentorData?.last_name || ''}`.trim();
    setForm({
      fullName: fullName || '',
      email: mentorData?.email || '',
      phone: mentorData?.mobile || '',
      city: mentorData?.city_state || '',
      specialization: profileData?.specialization || '',
      experience: profileData?.years_experience ? String(profileData.years_experience) : '',
      bio: mentorData?.bio || '',
    });
    setPhotoPreview(
      withCacheBuster(
        resolveMediaUrl(profileData?.profile_photo),
        profileData?.updated_at || ''
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
          setPhotoPreview(
            withCacheBuster(
              resolveMediaUrl(profileResponse?.profile_photo),
              profileResponse?.updated_at || ''
            )
          );
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

  const handleCancel = () => {
    setError('');
    setSuccess('');
    syncForm(mentor || {}, profile || {});
  };

  const handleSave = async () => {
    if (!mentor?.id) return;
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
          city_state: form.city.trim(),
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
  <div className="min-h-screen p-3 sm:p-6 lg:p-8">
    <div className="mx-auto max-w-6xl">
      {/* Header Section */}
      <div className="relative mb-8 overflow-hidden rounded-3xl bg-[linear-gradient(120deg,#ffffff_0%,#f8f4ff_55%,#f3ecff_100%)] p-4 shadow-[0_20px_45px_-28px_rgba(93,54,153,0.45)] ring-1 ring-[#e6def8] sm:p-6">
        <div className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-[#d7c2ff]/35 blur-3xl" />
        <div className="pointer-events-none absolute -left-16 -bottom-16 h-36 w-36 rounded-full bg-[#ede5ff]/70 blur-3xl" />
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          {/* Title with decorative element */}
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl bg-[#f5f3ff] sm:h-12 sm:w-12">
              <User className="h-6 w-6 text-[#5D3699]" />
            </div>
            <div className="min-w-0">
              <h1 className="text-xl font-bold tracking-tight text-gray-900 sm:text-3xl">
                My Profile
              </h1>
              <p className="mt-1 text-sm text-gray-500">
                Manage your mentor profile details
              </p>
            </div>
          </div>

          {/* Mentor ID Badge */}
          <div className="flex w-full items-center justify-center gap-2 rounded-full bg-[#5D3699]/10 px-4 py-2 ring-1 ring-[#5D3699]/20 sm:w-auto sm:self-start sm:justify-start">
            <Shield className="h-4 w-4 text-[#5D3699]" />
            <span className="text-sm font-semibold text-[#5D3699]">
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
          <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-gray-100 sm:p-6">
            {/* Avatar Section */}
            <div className="flex flex-col items-center text-center">
              <div className="relative">
                <div className="h-20 w-20 overflow-hidden rounded-2xl bg-[#5D3699]/10 ring-4 ring-white shadow-lg sm:h-24 sm:w-24">
                  {photoPreview ? (
                    <img
                      src={photoPreview}
                      alt="Profile"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-2xl font-bold text-[#5D3699]">
                      {initials}
                    </div>
                  )}
                </div>
                {/* Camera Button Overlay */}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={photoUploading}
                  className="absolute -bottom-2 -right-2 flex h-8 w-8 items-center justify-center rounded-full bg-[#5D3699] text-white shadow-lg transition-all hover:bg-[#4a2b7a] hover:scale-110 disabled:opacity-60"
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
              <h2 className="mt-4 text-xl font-bold text-gray-900">
                {form.fullName || 'Mentor Name'}
              </h2>
              <div className="mt-1 flex items-center gap-2 text-sm text-gray-500">
                <MapPin className="h-3.5 w-3.5" />
                <span>{form.city || 'Location not set'}</span>
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
            <div className="my-6 border-t border-gray-100" />

            {/* Stats Grid */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
              <div className="rounded-xl bg-gray-50 p-4 text-center">
                <div className="flex items-center justify-center gap-1.5 text-gray-500">
                  <Calendar className="h-4 w-4" />
                  <span className="text-xs font-medium">Sessions</span>
                </div>
                <p className="mt-2 text-2xl font-bold text-gray-900">
                  {stats.sessions_completed}
                </p>
              </div>
              <div className="rounded-xl bg-gray-50 p-4 text-center">
                <div className="flex items-center justify-center gap-1.5 text-gray-500">
                  <Star className="h-4 w-4" />
                  <span className="text-xs font-medium">Rating</span>
                </div>
                <p className="mt-2 text-2xl font-bold text-gray-900">
                  {stats.average_rating}
                </p>
              </div>
            </div>

            {/* Languages */}
            <div className="mt-4 rounded-xl bg-gray-50 p-4">
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Globe className="h-4 w-4" />
                <span className="font-medium">Languages</span>
              </div>
              <div className="mt-2 flex flex-wrap gap-2">
                {Array.isArray(mentor?.languages) && mentor.languages.length ? (
                  mentor.languages.map((lang, idx) => (
                    <span
                      key={idx}
                      className="rounded-full bg-white px-3 py-1 text-xs font-medium text-gray-700 ring-1 ring-gray-200"
                    >
                      {lang}
                    </span>
                  ))
                ) : (
                  <span className="text-sm text-gray-400">Not set</span>
                )}
              </div>
            </div>
          </div>

          {/* Quick Actions Card */}
          <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-gray-100 sm:p-6">
            <h3 className="text-sm font-semibold text-gray-900">Quick Actions</h3>
            <div className="mt-4 space-y-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={photoUploading}
                className="flex w-full items-center gap-3 rounded-xl bg-gray-50 px-4 py-3 text-left text-sm font-medium text-gray-700 transition-all hover:bg-gray-100 disabled:opacity-60"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#5D3699]/10">
                  <Camera className="h-4 w-4 text-[#5D3699]" />
                </div>
                <span>{photoUploading ? 'Uploading...' : 'Change Photo'}</span>
              </button>
           
            </div>
          </div>
        </div>

        {/* Right Column - Edit Form */}
        <div className="min-w-0 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-gray-100 sm:p-6 lg:p-8">
          {/* Form Header */}
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#5D3699]/10">
              <Edit3 className="h-5 w-5 text-[#5D3699]" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Edit Profile</h2>
              <p className="text-sm text-gray-500">Update your personal information</p>
            </div>
          </div>

          {/* Form Fields */}
          <div className="space-y-6">
            {/* Personal Information Section */}
            <div>
              <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-gray-400">
                Personal Information
              </h3>
              <div className="grid gap-4 sm:grid-cols-2">
                {/* Full Name */}
                <div className="group">
                  <label className="mb-2 flex items-center gap-2 text-sm font-medium text-gray-700">
                    <User className="h-4 w-4 text-gray-400" />
                    Full Name
                  </label>
                  <input
                    type="text"
                    className="w-full rounded-xl border-0 bg-gray-50 px-4 py-3 text-sm text-gray-900 ring-1 ring-gray-200 transition-all placeholder:text-gray-400 focus:bg-white focus:ring-2 focus:ring-[#5D3699]"
                    placeholder="Enter your full name"
                    value={form.fullName}
                    onChange={(event) => updateField('fullName', event.target.value)}
                  />
                </div>

                {/* Email */}
                <div className="group">
                  <label className="mb-2 flex items-center gap-2 text-sm font-medium text-gray-700">
                    <Mail className="h-4 w-4 text-gray-400" />
                    Email
                  </label>
                  <input
                    type="email"
                    className="w-full cursor-not-allowed rounded-xl border-0 bg-gray-100 px-4 py-3 text-sm text-gray-500 ring-1 ring-gray-200"
                    value={form.email}
                    readOnly
                  />
                </div>

                {/* Phone */}
                <div className="group">
                  <label className="mb-2 flex items-center gap-2 text-sm font-medium text-gray-700">
                    <Phone className="h-4 w-4 text-gray-400" />
                    Phone
                  </label>
                  <input
                    type="tel"
                    className="w-full rounded-xl border-0 bg-gray-50 px-4 py-3 text-sm text-gray-900 ring-1 ring-gray-200 transition-all placeholder:text-gray-400 focus:bg-white focus:ring-2 focus:ring-[#5D3699]"
                    placeholder="Enter your phone number"
                    value={form.phone}
                    onChange={(event) => updateField('phone', event.target.value)}
                  />
                </div>

                {/* City */}
                <div className="group">
                  <label className="mb-2 flex items-center gap-2 text-sm font-medium text-gray-700">
                    <MapPin className="h-4 w-4 text-gray-400" />
                    City
                  </label>
                  <input
                    type="text"
                    className="w-full rounded-xl border-0 bg-gray-50 px-4 py-3 text-sm text-gray-900 ring-1 ring-gray-200 transition-all placeholder:text-gray-400 focus:bg-white focus:ring-2 focus:ring-[#5D3699]"
                    placeholder="Enter your city"
                    value={form.city}
                    onChange={(event) => updateField('city', event.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Divider */}
            <div className="border-t border-gray-100" />

            {/* Professional Information Section */}
            <div>
              <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-gray-400">
                Professional Information
              </h3>
              <div className="grid gap-4 sm:grid-cols-2">
                {/* Specialization */}
                <div className="group">
                  <label className="mb-2 flex items-center gap-2 text-sm font-medium text-gray-700">
                    <Award className="h-4 w-4 text-gray-400" />
                    Specialization
                  </label>
                  <input
                    type="text"
                    className="w-full rounded-xl border-0 bg-gray-50 px-4 py-3 text-sm text-gray-900 ring-1 ring-gray-200 transition-all placeholder:text-gray-400 focus:bg-white focus:ring-2 focus:ring-[#5D3699]"
                    placeholder="e.g., Career Coaching, Tech Mentoring"
                    value={form.specialization}
                    onChange={(event) => updateField('specialization', event.target.value)}
                  />
                </div>

                {/* Experience */}
                <div className="group">
                  <label className="mb-2 flex items-center gap-2 text-sm font-medium text-gray-700">
                    <Briefcase className="h-4 w-4 text-gray-400" />
                    Experience
                  </label>
                  <input
                    type="text"
                    className="w-full rounded-xl border-0 bg-gray-50 px-4 py-3 text-sm text-gray-900 ring-1 ring-gray-200 transition-all placeholder:text-gray-400 focus:bg-white focus:ring-2 focus:ring-[#5D3699]"
                    placeholder="e.g., 5+ years in software development"
                    value={form.experience}
                    onChange={(event) => updateField('experience', event.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Divider */}
            <div className="border-t border-gray-100" />

            {/* Bio Section */}
            <div>
              <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-gray-400">
                About You
              </h3>
              <div className="group">
                <label className="mb-2 flex items-center gap-2 text-sm font-medium text-gray-700">
                  <Edit3 className="h-4 w-4 text-gray-400" />
                  Bio
                </label>
                <textarea
                  rows={5}
                  className="w-full resize-none rounded-xl border-0 bg-gray-50 px-4 py-3 text-sm text-gray-900 ring-1 ring-gray-200 transition-all placeholder:text-gray-400 focus:bg-white focus:ring-2 focus:ring-[#5D3699]"
                  placeholder="Tell mentees about yourself, your experience, and what you can help them with..."
                  value={form.bio}
                  onChange={(event) => updateField('bio', event.target.value)}
                />
                <p className="mt-2 text-xs text-gray-400">
                  Write a brief description about yourself. This will be visible to mentees.
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col gap-3 border-t border-gray-100 pt-6 sm:flex-row sm:items-center sm:justify-between">
              <div className="order-2 flex flex-col gap-3 sm:order-1 sm:flex-row">
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={saving}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#5D3699] px-6 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:bg-[#4a2b7a] hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
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
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-white px-6 py-3 text-sm font-semibold text-gray-700 ring-1 ring-gray-200 transition-all hover:bg-gray-50 hover:ring-gray-300 sm:w-auto"
                >
                  <X className="h-4 w-4" />
                  Cancel
                </button>
              </div>

              <p className="order-1 text-xs text-gray-400 sm:order-2">
                Last updated: Today
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Status Messages */}
      {loading && (
        <div className="mt-6 flex items-center justify-center gap-3 rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-100">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-gray-200 border-t-[#5D3699]" />
          <span className="text-sm font-medium text-gray-600">Loading profile...</span>
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
