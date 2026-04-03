import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { mentorApi } from '../../../apis/api/mentorApi';

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

const formatDate = (value) => {
  if (!value) return 'Not provided';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Not provided';
  return date.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
};

const formatConsent = (value) => (value ? 'Yes' : 'No');
const toDisplayValue = (value) => (value ? value : 'Not provided');

const MenteeProfile = () => {
  const navigate = useNavigate();
  const { sessionId } = useParams();
  const [mentee, setMentee] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    const loadMenteeProfile = async () => {
      if (!sessionId) {
        setError('Missing session reference.');
        setLoading(false);
        return;
      }
      setLoading(true);
      setError('');
      try {
        const response = await mentorApi.getMenteeProfileBySession(sessionId);
        if (!cancelled) {
          setMentee(response || null);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err?.message || 'Unable to load mentee profile.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadMenteeProfile();
    return () => {
      cancelled = true;
    };
  }, [sessionId]);

  const menteeName = useMemo(() => {
    if (!mentee) return 'Mentee Profile';
    const fullName = [mentee.first_name, mentee.last_name].filter(Boolean).join(' ').trim();
    if (fullName) return fullName;
    if (mentee.id) return `Mentee #${mentee.id}`;
    return 'Mentee Profile';
  }, [mentee]);

  const initials = useMemo(() => {
    const first = mentee?.first_name?.[0] || '';
    const last = mentee?.last_name?.[0] || '';
    const value = `${first}${last}`.toUpperCase();
    return value || 'MN';
  }, [mentee]);

  const details = useMemo(() => {
    const assessment = mentee?.latest_assessment || {};
    const preferences = mentee?.assessment_preferences || {};
    return [
      { label: 'First Name', value: toDisplayValue(mentee?.first_name) },
      { label: 'Last Name', value: toDisplayValue(mentee?.last_name) },
      { label: 'Email', value: toDisplayValue(mentee?.email) },
      { label: 'Date of Birth', value: formatDate(mentee?.dob) },
      { label: 'Grade', value: toDisplayValue(mentee?.grade) },
      { label: 'Gender', value: toDisplayValue(mentee?.gender) },
      { label: 'City / State', value: toDisplayValue(mentee?.city_state) },
      { label: 'Timezone', value: toDisplayValue(mentee?.timezone) },
      { label: 'Parent Contact', value: toDisplayValue(mentee?.parent_mobile) },
      { label: 'Language', value: toDisplayValue(assessment?.language) },
      { label: 'Session Mode', value: toDisplayValue(assessment?.session_mode) },
      {
        label: 'Comfort Level',
        value: toDisplayValue(assessment?.comfort_level || preferences?.comfort_level),
      },
      {
        label: 'Session Duration',
        value: preferences?.preferred_session_minutes
          ? `${preferences.preferred_session_minutes} mins`
          : 'Not provided',
      },
    ];
  }, [mentee]);

  const menteeAvatarUrl = useMemo(() => resolveMediaUrl(mentee?.avatar || ''), [mentee?.avatar]);

  const selectedAssessments = useMemo(() => {
    const assessment = mentee?.latest_assessment || {};

    const toText = (value) => {
      if (Array.isArray(value)) {
        const cleaned = value.map((item) => String(item || '').trim()).filter(Boolean);
        return cleaned.length ? cleaned.join(', ') : '';
      }
      return String(value || '').trim();
    };

    const values = [
      { label: 'Feeling', value: toText(assessment.feeling) },
      { label: 'Cause', value: toText(assessment.feeling_cause) },
      { label: 'Support Needed', value: toText(assessment.support_type) },
      { label: 'Topics', value: toText(assessment.topics) },
      { label: 'Additional Notes', value: toText(assessment.free_text) },
    ];

    return values.filter((item) => item.value);
  }, [mentee]);

  return (
    <div className="p-4 sm:p-6 bg-transparent">
      <div className="w-full">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <button
              type="button"
              className="inline-flex items-center gap-1 rounded-md border border-[#e5e7eb] bg-white px-2.5 py-1.5 text-xs text-[#6b7280] hover:text-[#111827]"
              onClick={() => navigate(-1)}
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Back
            </button>
            <h1
              className="mt-2 text-[#111827]"
              style={{ fontSize: '30px', lineHeight: '36px', fontWeight: 700 }}
            >
              Mentee Profile
            </h1>
            <p className="mt-1 text-sm text-[#6b7280]">View mentee details shared for mentor sessions.</p>
          </div>
          <div className="inline-flex items-center gap-2 rounded-full bg-[#e9ddff] text-xs text-[#5b2c91] px-3 py-1 font-medium">
            Mentee ID: {mentee?.id || '--'}
          </div>
        </div>

        {loading && (
          <div className="mt-4 rounded-xl border border-[#e5e7eb] bg-white p-4 text-sm text-[#6b7280]">
            Loading profile...
          </div>
        )}
        {!loading && error && (
          <div className="mt-4 rounded-xl border border-[#fecaca] bg-[#fff1f2] p-4 text-sm text-red-600">
            {error}
          </div>
        )}

        {!loading && !error && mentee && (
          <div className="mt-6 grid gap-4 lg:grid-cols-[minmax(0,300px)_minmax(0,1fr)]">
            <div className="rounded-2xl border border-[#e6e2f1] bg-white p-6 shadow-[0px_1px_2px_0px_rgba(0,0,0,0.08)]">
              <div className="flex items-center gap-4">
                {menteeAvatarUrl ? (
                  <img
                    src={menteeAvatarUrl}
                    alt={menteeName}
                    className="h-16 w-16 rounded-full object-cover ring-2 ring-[#ede9fe]"
                  />
                ) : (
                  <div className="h-16 w-16 rounded-full bg-[#ede9fe] text-[#5b2c91] flex items-center justify-center text-xl font-semibold">
                    {initials}
                  </div>
                )}
                <div className="min-w-0">
                  <div className="text-base font-semibold text-[#1f2937] truncate">{menteeName}</div>
                  <div className="text-sm text-[#6b7280]">
                    {toDisplayValue(mentee.grade)} | {toDisplayValue(mentee.gender)}
                  </div>
                </div>
              </div>

              <div className="mt-6 space-y-3 text-sm text-[#6b7280]">
                <div className="flex items-center justify-between">
                  <span>Timezone</span>
                  <span className="font-semibold text-[#1f2937]">{toDisplayValue(mentee.timezone)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Parent Contact</span>
                  <span className="font-semibold text-[#1f2937]">{toDisplayValue(mentee.parent_mobile)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Recorded Sessions</span>
                  <span
                    className={`inline-flex rounded-full text-xs px-2 py-0.5 font-semibold ${
                      mentee?.record_consent ? 'bg-[#dcfce7] text-[#16a34a]' : 'bg-[#fee2e2] text-[#b91c1c]'
                    }`}
                  >
                    {formatConsent(mentee?.record_consent)}
                  </span>
                </div>
              </div>

              <div className="mt-5 border-t border-[#eef2ff] pt-4">
                <h3 className="text-sm font-semibold text-[#111827]">Selected Assessments</h3>
                {selectedAssessments.length ? (
                  <div className="mt-3 space-y-2">
                    {selectedAssessments.map((item) => (
                      <div key={item.label} className="rounded-lg border border-[#eef2ff] bg-[#faf8ff] px-3 py-2">
                        <div className="text-[11px] text-[#6b7280]">{item.label}</div>
                        <div className="mt-1 text-sm font-medium text-[#111827] break-words">{item.value}</div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="mt-2 text-sm text-[#6b7280]">No assessment selections found.</p>
                )}
              </div>
            </div>

            <div className="space-y-4">
              <div className="rounded-2xl border border-[#e6e2f1] bg-white p-6 shadow-[0px_1px_2px_0px_rgba(0,0,0,0.08)]">
                <h2 className="text-base font-semibold text-[#111827]">Mentee Information</h2>
                <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {details.map((item) => (
                    <div key={item.label} className="rounded-lg border border-[#eef2ff] bg-[#faf8ff] px-3 py-2">
                      <div className="text-[11px] text-[#6b7280]">{item.label}</div>
                      <div className="mt-1 text-sm font-medium text-[#111827] break-words">{item.value}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl border border-[#e6e2f1] bg-white p-6 shadow-[0px_1px_2px_0px_rgba(0,0,0,0.08)]">
                <h2 className="text-base font-semibold text-[#111827]">Consent Status</h2>
                <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                  <div className="rounded-lg border border-[#eef2ff] bg-[#faf8ff] px-3 py-2">
                    <div className="text-[11px] text-[#6b7280]">Parent/Guardian Consent</div>
                    <div className="mt-1 font-medium text-[#111827]">{formatConsent(mentee.parent_guardian_consent)}</div>
                  </div>
                  <div className="rounded-lg border border-[#eef2ff] bg-[#faf8ff] px-3 py-2">
                    <div className="text-[11px] text-[#6b7280]">Recording Consent</div>
                    <div className="mt-1 font-medium text-[#111827]">{formatConsent(mentee.record_consent)}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MenteeProfile;

