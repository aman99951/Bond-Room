import React, { useEffect, useMemo, useRef, useState } from 'react';
import { mentorApi } from '../../../apis/api/mentorApi';
import { useMentorData } from '../../../apis/apihook/useMentorData';

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

const Myprofile = () => {
  const { mentor, loading: mentorLoading, error: mentorError, setMentor } = useMentorData();
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
    setPhotoPreview(resolveMediaUrl(profileData?.profile_photo));
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
          setPhotoPreview(resolveMediaUrl(profileResponse?.profile_photo));
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
      setPhotoPreview(resolveMediaUrl(updatedProfile?.profile_photo) || photoPreview);
      setSuccess('Profile photo updated successfully.');
    } catch (err) {
      setError(err?.message || 'Unable to update profile photo.');
    } finally {
      setPhotoUploading(false);
    }
  };
  return (
    <div className="p-4 sm:p-6 bg-transparent">
      <div className="max-w-[1100px]">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1
              className="text-[#111827]"
              style={{ fontFamily: 'DM Sans', fontSize: '30px', lineHeight: '36px', fontWeight: 700 }}
            >
              My Profile
            </h1>
            <p className="mt-1 text-sm text-[#6b7280]">Manage your mentor profile details.</p>
          </div>
          <div className="inline-flex items-center gap-2 rounded-full bg-[#e9ddff] text-xs text-[#5b2c91] px-3 py-1 font-medium">
            Mentor ID: {profile?.public_id || 'BR-0000'}
          </div>
        </div>

        <div className="mt-6 grid gap-4 lg:grid-cols-[320px_1fr]">
          <div className="rounded-2xl border border-[#e6e2f1] bg-white p-6 shadow-[0px_1px_2px_0px_rgba(0,0,0,0.08)]">
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 rounded-full bg-[#ede9fe] text-[#5b2c91] flex items-center justify-center text-xl font-semibold overflow-hidden">
                {photoPreview ? (
                  <img src={photoPreview} alt="Profile" className="h-full w-full object-cover" />
                ) : (
                  initials
                )}
              </div>
              <div>
                <div className="text-base font-semibold text-[#1f2937]">{form.fullName || 'Mentor'}</div>
                <div className="text-sm text-[#6b7280]">Mentor • {form.city || 'Location'}</div>
              </div>
            </div>

            <div className="mt-6 space-y-3 text-sm text-[#6b7280]">
              <div className="flex items-center justify-between">
                <span>Sessions Completed</span>
                <span className="font-semibold text-[#1f2937]">{stats.sessions_completed}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Rating</span>
                <span className="font-semibold text-[#1f2937]">{stats.average_rating}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Languages</span>
                <span className="font-semibold text-[#1f2937]">
                  {Array.isArray(mentor?.languages) && mentor.languages.length
                    ? mentor.languages.join(', ')
                    : 'Not set'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>Status</span>
                <span className={`inline-flex rounded-full text-xs px-2 py-0.5 font-semibold ${
                  profile?.is_active ? 'bg-[#dcfce7] text-[#16a34a]' : 'bg-[#fee2e2] text-[#b91c1c]'
                }`}>
                  {profile?.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>

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
            <button
              type="button"
              className="mt-6 w-full rounded-md border border-[#e5e7eb] px-4 py-2 text-sm text-[#6b7280] disabled:opacity-60"
              onClick={() => fileInputRef.current?.click()}
              disabled={photoUploading}
            >
              {photoUploading ? 'Uploading...' : 'Update Profile Photo'}
            </button>
          </div>

          <div className="rounded-2xl border border-[#e6e2f1] bg-white p-6 shadow-[0px_1px_2px_0px_rgba(0,0,0,0.08)]">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs text-[#6b7280] mb-1">Full Name</label>
                <input
                  className="w-full rounded-md border border-[#e5e7eb] bg-white px-3 py-2 text-sm"
                  value={form.fullName}
                  onChange={(event) => updateField('fullName', event.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs text-[#6b7280] mb-1">Email</label>
                <input
                  className="w-full rounded-md border border-[#e5e7eb] bg-white px-3 py-2 text-sm"
                  value={form.email}
                  readOnly
                />
              </div>
              <div>
                <label className="block text-xs text-[#6b7280] mb-1">Phone</label>
                <input
                  className="w-full rounded-md border border-[#e5e7eb] bg-white px-3 py-2 text-sm"
                  value={form.phone}
                  onChange={(event) => updateField('phone', event.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs text-[#6b7280] mb-1">City</label>
                <input
                  className="w-full rounded-md border border-[#e5e7eb] bg-white px-3 py-2 text-sm"
                  value={form.city}
                  onChange={(event) => updateField('city', event.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs text-[#6b7280] mb-1">Specialization</label>
                <input
                  className="w-full rounded-md border border-[#e5e7eb] bg-white px-3 py-2 text-sm"
                  value={form.specialization}
                  onChange={(event) => updateField('specialization', event.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs text-[#6b7280] mb-1">Experience</label>
                <input
                  className="w-full rounded-md border border-[#e5e7eb] bg-white px-3 py-2 text-sm"
                  value={form.experience}
                  onChange={(event) => updateField('experience', event.target.value)}
                />
              </div>
            </div>

            <div className="mt-6">
              <label className="block text-xs text-[#6b7280] mb-1">Bio</label>
              <textarea
                rows={4}
                className="w-full rounded-md border border-[#e5e7eb] bg-white px-3 py-2 text-sm"
                value={form.bio}
                onChange={(event) => updateField('bio', event.target.value)}
              />
            </div>

            <div className="mt-6 flex flex-wrap items-center gap-3">
              <button
                type="button"
                className="rounded-md bg-[#5b2c91] text-white px-5 py-2 text-sm disabled:opacity-70"
                onClick={handleSave}
                disabled={saving}
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
              <button
                type="button"
                className="rounded-md border border-[#e5e7eb] px-5 py-2 text-sm text-[#6b7280]"
                onClick={handleCancel}
              >
                Cancel
              </button>
            </div>
            {(loading || saving || error || success || mentorError) && (
              <div className={`mt-3 text-xs ${error || mentorError ? 'text-red-600' : success ? 'text-green-700' : 'text-[#6b7280]'}`}>
                {error || mentorError || success || (saving ? 'Saving...' : loading || mentorLoading ? 'Loading profile...' : '')}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Myprofile;
