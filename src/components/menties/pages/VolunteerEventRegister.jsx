import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  AlertCircle,
  ArrowLeft,
  Calendar,
  Clock,
  FileText,
  HeartHandshake,
  Building,
  MapPin,
  Phone,
  Send,
  User,
  Users,
} from 'lucide-react';
import { menteeApi } from '../../../apis/api/menteeApi';
import { useMenteeData } from '../../../apis/apihook/useMenteeData';

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

const formatDate = (value) => {
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
};

const getMenteeFullName = (mentee) =>
  `${mentee?.first_name || ''} ${mentee?.last_name || ''}`.trim();

const getMenteePhone = (mentee) => {
  const menteePhone = String(mentee?.mobile || '').trim();
  if (menteePhone) return menteePhone;
  return String(mentee?.parent_mobile || '').trim();
};

const VolunteerEventRegister = () => {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const { mentee } = useMenteeData();
  const defaultFullName = getMenteeFullName(mentee);
  const defaultEmail = String(mentee?.email || '').trim();
  const defaultPhone = getMenteePhone(mentee);
  const [eventItem, setEventItem] = useState(null);
  const [eventLoading, setEventLoading] = useState(true);

  const [form, setForm] = useState(() => ({
    fullName: '',
    email: '',
    phone: '',
    teamName: '',
    schoolOrCollege: '',
    country: 'India',
    state: 'Tamilnadu',
    city: 'Chennai',
    postalCode: '',
    preferredRole: '',
    emergencyContact: '',
    notes: '',
    consent: false,
  }));
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!mentee) return;
    setForm((prev) => ({
      ...prev,
      fullName: prev.fullName.trim() ? prev.fullName : defaultFullName,
      email: prev.email.trim() ? prev.email : defaultEmail,
      phone: prev.phone.trim() ? prev.phone : defaultPhone,
    }));
  }, [mentee, defaultEmail, defaultFullName, defaultPhone]);

  useEffect(() => {
    let cancelled = false;
    const loadEvent = async () => {
      setEventLoading(true);
      setErrorMessage('');
      try {
        const response = await menteeApi.getVolunteerEventById(eventId);
        if (cancelled) return;
        setEventItem(response || null);
      } catch {
        if (!cancelled) {
          setEventItem(null);
        }
      } finally {
        if (!cancelled) setEventLoading(false);
      }
    };

    if (eventId) {
      loadEvent();
    } else {
      setEventLoading(false);
      setEventItem(null);
    }

    return () => {
      cancelled = true;
    };
  }, [eventId]);

  const onChange = (key) => (event) => {
    const nextValue = key === 'consent' ? event.target.checked : event.target.value;
    if (key === 'country') {
      const nextCountry = nextValue;
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
      const nextState = nextValue;
      const nextCities = LOCATION_OPTIONS[form.country]?.citiesByState?.[nextState] || [];
      const nextCity = nextCities[0] || '';
      setForm((prev) => ({ ...prev, state: nextState, city: nextCity }));
      return;
    }
    setForm((prev) => ({ ...prev, [key]: nextValue }));
  };

  const onSubmit = async (event) => {
    event.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!eventItem?.id) return;
    if (
      !form.fullName.trim() ||
      !form.email.trim() ||
      !form.phone.trim() ||
      !form.teamName.trim() ||
      !form.schoolOrCollege.trim() ||
      !form.country.trim() ||
      !form.state.trim() ||
      !form.city.trim() ||
      !form.postalCode.trim() ||
      !form.emergencyContact.trim()
    ) {
      setErrorMessage('Please fill all required fields.');
      return;
    }
    if (!form.consent) {
      setErrorMessage('Please confirm consent before submitting.');
      return;
    }

    setLoading(true);
    try {
      await menteeApi.createVolunteerEventRegistration({
        volunteer_event: eventItem.id,
        full_name: form.fullName.trim(),
        email: form.email.trim().toLowerCase(),
        phone: form.phone.trim(),
        team_name: form.teamName.trim(),
        school_or_college: form.schoolOrCollege.trim(),
        country: form.country.trim(),
        state: form.state.trim(),
        city: form.city.trim(),
        postal_code: form.postalCode.trim(),
        preferred_role: form.preferredRole.trim(),
        emergency_contact: form.emergencyContact.trim(),
        notes: form.notes.trim(),
        consent: form.consent,
      });
      setSuccessMessage('Registration submitted successfully.');
      setForm((prev) => ({
        ...prev,
        phone: defaultPhone,
        teamName: '',
        schoolOrCollege: '',
        postalCode: '',
        preferredRole: '',
        emergencyContact: '',
        notes: '',
        consent: false,
      }));
    } catch (err) {
      setErrorMessage(err?.message || 'Unable to submit registration right now.');
    } finally {
      setLoading(false);
    }
  };

  if (eventLoading || !eventItem) {
    return (
      <div className="p-6 sm:p-8">
        <div className="mx-auto max-w-xl rounded-2xl border border-red-200 bg-white p-8 text-center">
          {eventLoading ? (
            <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-[#e7d8ff] border-t-[#5D3699]" />
          ) : (
            <AlertCircle className="mx-auto h-8 w-8 text-red-500" />
          )}
          <h2 className="mt-3 text-lg font-semibold text-[#111827]">
            {eventLoading ? 'Loading Event' : 'Event Not Found'}
          </h2>
          <p className="mt-1 text-sm text-[#6b7280]">
            {eventLoading ? 'Fetching volunteer event details...' : 'The selected volunteer event does not exist.'}
          </p>
          <Link
            to="/volunteer-events"
            className="mt-4 inline-flex items-center gap-2 rounded-lg bg-[#5D3699] px-4 py-2 text-sm font-semibold text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Events
          </Link>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      className="relative overflow-hidden bg-transparent p-3 sm:p-6 lg:p-8"
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45 }}
    >
      <div className="mb-6">
        <button
          type="button"
          onClick={() => navigate('/volunteer-events')}
          className="inline-flex items-center gap-2 rounded-full border border-[#e7d8ff] bg-white px-4 py-2 text-xs font-semibold text-[#5D3699] hover:bg-[#f8f4ff]"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to Events
        </button>
      </div>

      <div className="grid gap-5 lg:grid-cols-[320px_1fr] xl:grid-cols-[360px_1fr]">
        <aside className="min-w-0 lg:sticky lg:top-20 lg:self-start">
          <div className="overflow-hidden rounded-2xl border border-[#e8dcff] bg-white shadow-[0_24px_44px_-34px_rgba(93,54,153,0.7)]">
            <div className="relative h-40 overflow-hidden sm:h-48">
              <img src={eventItem.image} alt={eventItem.title} className="h-full w-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#120a2c]/75 via-[#120a2c]/25 to-transparent" />
              <div className="absolute bottom-3 left-3 right-3">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-[#d8cff1]">{eventItem.stream}</p>
                <h2 className="mt-1 text-base font-semibold text-white">{eventItem.title}</h2>
              </div>
            </div>
            <div className="space-y-2.5 p-4 text-xs text-[#5f6472]">
              <p className="inline-flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5 text-[#5D3699]" />{formatDate(eventItem.date)}</p>
              <p className="inline-flex items-center gap-1.5"><Clock className="h-3.5 w-3.5 text-[#5D3699]" />{eventItem.time}</p>
              <p className="inline-flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5 text-[#5D3699]" />{eventItem.location}</p>
              <p className="inline-flex items-center gap-1.5"><Users className="h-3.5 w-3.5 text-[#5D3699]" />{eventItem.seats} seats</p>
            </div>
          </div>
        </aside>

        <form onSubmit={onSubmit} className="min-w-0 rounded-2xl border border-[#e8dcff] bg-white p-4 shadow-[0_24px_44px_-34px_rgba(93,54,153,0.7)] sm:p-8">
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#f5f3ff]">
              <FileText className="h-5 w-5 text-[#5D3699]" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-[#111827]">Event Registration</h1>
              <p className="text-xs text-[#6b7280]">Complete the form to register for this activity.</p>
            </div>
          </div>

          {errorMessage && (
            <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">{errorMessage}</div>
          )}
          {successMessage && (
            <div className="mb-4 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">{successMessage}</div>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wide text-[#7b699d]">Full Name *</label>
              <input value={form.fullName} onChange={onChange('fullName')} required className="w-full rounded-xl border border-[#e7e2f6] bg-white px-4 py-2.5 text-sm text-[#111827] outline-none focus:border-[#c4b5fd]" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wide text-[#7b699d]">Email *</label>
              <input type="email" value={form.email} onChange={onChange('email')} required className="w-full rounded-xl border border-[#e7e2f6] bg-white px-4 py-2.5 text-sm text-[#111827] outline-none focus:border-[#c4b5fd]" />
            </div>
            <div className="space-y-1.5">
              <label className="inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-[#7b699d]"><Phone className="h-3.5 w-3.5" />Phone *</label>
              <input value={form.phone} onChange={onChange('phone')} required className="w-full rounded-xl border border-[#e7e2f6] bg-white px-4 py-2.5 text-sm text-[#111827] outline-none focus:border-[#c4b5fd]" />
            </div>
            <div className="space-y-1.5">
              <label className="inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-[#7b699d]"><Users className="h-3.5 w-3.5" />Team Name *</label>
              <input value={form.teamName} onChange={onChange('teamName')} required className="w-full rounded-xl border border-[#e7e2f6] bg-white px-4 py-2.5 text-sm text-[#111827] outline-none focus:border-[#c4b5fd]" />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <label className="inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-[#7b699d]"><Building className="h-3.5 w-3.5" />School / College *</label>
              <input value={form.schoolOrCollege} onChange={onChange('schoolOrCollege')} required className="w-full rounded-xl border border-[#e7e2f6] bg-white px-4 py-2.5 text-sm text-[#111827] outline-none focus:border-[#c4b5fd]" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wide text-[#7b699d]">Country *</label>
              <select value={form.country} onChange={onChange('country')} className="w-full rounded-xl border border-[#e7e2f6] bg-white px-4 py-2.5 text-sm text-[#111827] outline-none focus:border-[#c4b5fd]">
                {COUNTRY_OPTIONS.map((country) => (
                  <option key={country} value={country}>{country}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wide text-[#7b699d]">State *</label>
              <select value={form.state} onChange={onChange('state')} className="w-full rounded-xl border border-[#e7e2f6] bg-white px-4 py-2.5 text-sm text-[#111827] outline-none focus:border-[#c4b5fd]">
                {(LOCATION_OPTIONS[form.country]?.states || []).map((stateName) => (
                  <option key={stateName} value={stateName}>{stateName}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wide text-[#7b699d]">City *</label>
              <select value={form.city} onChange={onChange('city')} className="w-full rounded-xl border border-[#e7e2f6] bg-white px-4 py-2.5 text-sm text-[#111827] outline-none focus:border-[#c4b5fd]">
                {(LOCATION_OPTIONS[form.country]?.citiesByState?.[form.state] || []).map((cityName) => (
                  <option key={cityName} value={cityName}>{cityName}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wide text-[#7b699d]">
                {form.country === 'USA' ? 'ZIP Code *' : 'Pincode *'}
              </label>
              <input
                value={form.postalCode}
                onChange={onChange('postalCode')}
                required
                placeholder={form.country === 'USA' ? 'e.g. 77001' : 'e.g. 600001'}
                className="w-full rounded-xl border border-[#e7e2f6] bg-white px-4 py-2.5 text-sm text-[#111827] outline-none focus:border-[#c4b5fd]"
              />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <label className="inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-[#7b699d]"><User className="h-3.5 w-3.5" />Preferred Role</label>
              <input value={form.preferredRole} onChange={onChange('preferredRole')} className="w-full rounded-xl border border-[#e7e2f6] bg-white px-4 py-2.5 text-sm text-[#111827] outline-none focus:border-[#c4b5fd]" />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-xs font-semibold uppercase tracking-wide text-[#7b699d]">Emergency Contact *</label>
              <input value={form.emergencyContact} onChange={onChange('emergencyContact')} required className="w-full rounded-xl border border-[#e7e2f6] bg-white px-4 py-2.5 text-sm text-[#111827] outline-none focus:border-[#c4b5fd]" />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-xs font-semibold uppercase tracking-wide text-[#7b699d]">Notes</label>
              <textarea rows={4} value={form.notes} onChange={onChange('notes')} className="w-full resize-none rounded-xl border border-[#e7e2f6] bg-white px-4 py-2.5 text-sm text-[#111827] outline-none focus:border-[#c4b5fd]" />
            </div>
            <div className="sm:col-span-2">
              <label className="flex items-start gap-2 rounded-xl border border-[#e7e2f6] bg-[#faf8ff] p-3">
                <input type="checkbox" checked={form.consent} onChange={onChange('consent')} className="mt-1 h-4 w-4 accent-[#5D3699]" />
                <span className="text-xs text-[#5f6472]">I confirm all details are correct and I agree to participate in this volunteer event.</span>
              </label>
            </div>
            <div className="sm:col-span-2">
              <button
                type="submit"
                disabled={loading}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#5D3699] px-5 py-3 text-sm font-semibold text-white transition-all hover:-translate-y-0.5 hover:bg-[#4a2b7a] disabled:opacity-60"
              >
                <HeartHandshake className="h-4 w-4" />
                {loading ? 'Submitting...' : 'Submit Registration'}
                <Send className="h-4 w-4" />
              </button>
            </div>
          </div>
        </form>
      </div>
    </motion.div>
  );
};

export default VolunteerEventRegister;
