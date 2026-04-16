import React, { useCallback, useEffect, useState } from 'react';
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
  X,
} from 'lucide-react';
import { menteeApi } from '../../../apis/api/menteeApi';
import { useMenteeData } from '../../../apis/apihook/useMenteeData';
import VolunteerBottomAuth from '../../auth/VolunteerBottomAuth';
import logo from '../../assets/Logo.svg';

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
const normalizeCountry = (value) => (COUNTRY_OPTIONS.includes(value) ? value : 'India');
const normalizeState = (country, value) => {
  const states = LOCATION_OPTIONS[country]?.states || [];
  if (states.includes(value)) return value;
  return states[0] || '';
};
const normalizeCity = (country, state, value) => {
  const cities = LOCATION_OPTIONS[country]?.citiesByState?.[state] || [];
  if (cities.includes(value)) return value;
  return cities[0] || '';
};
const getCountryCode = (country) => (country === 'USA' ? '+1' : '+91');
const normalizePhoneDigits = (value) => String(value || '').replace(/\D/g, '');
const EMERGENCY_CONTACT_DIGITS = 10;
const withCountryCode = (country, value) => {
  const code = getCountryCode(country);
  const digits = normalizePhoneDigits(value);
  if (!digits) return '';
  return `${code}${digits}`;
};
const parseLegacyCityState = (value) => {
  const raw = String(value || '').trim();
  if (!raw) return {};
  const match = raw.match(/^([^,]+),\s*([^,]+),\s*([^(]+?)(?:\s*\(([^)]+)\))?$/);
  if (!match) return {};
  return {
    city: String(match[1] || '').trim(),
    state: String(match[2] || '').trim(),
    country: String(match[3] || '').trim(),
    postalCode: String(match[4] || '').trim(),
  };
};

const normalizeVolunteerEvent = (event) => ({
  ...event,
  image: event?.image || '',
  gallery_images: Array.isArray(event?.gallery_images)
    ? event.gallery_images.map((item) => String(item || '').trim()).filter(Boolean)
    : [],
});

const VolunteerEventRegister = ({ menteeOnly = false }) => {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const { authSession, mentee, loadCurrentMentee } = useMenteeData({ autoLoad: false });
  const isLoggedIn = Boolean(authSession?.accessToken);
  const isMenteeLoggedIn = isLoggedIn && authSession?.role === 'mentee';
  const backPath = menteeOnly ? '/registered-events' : '/volunteer-events';
  const defaultFullName = getMenteeFullName(mentee);
  const defaultEmail = String(mentee?.email || authSession?.email || '').trim();
  const defaultPhone = getMenteePhone(mentee);
  const [eventItem, setEventItem] = useState(null);
  const [eventLoading, setEventLoading] = useState(true);

  const [form, setForm] = useState(() => ({
    fullName: '',
    email: '',
    phone: '',
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
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const availableRoleOptions = Array.isArray(eventItem?.available_roles)
    ? eventItem.available_roles
        .map((role) => String(role || '').trim())
        .filter((role, index, roles) => role && roles.indexOf(role) === index)
    : [];

  useEffect(() => {
    if (!errorMessage && !successMessage) return undefined;
    const timer = window.setTimeout(() => {
      setErrorMessage('');
      setSuccessMessage('');
    }, 7000);
    return () => window.clearTimeout(timer);
  }, [errorMessage, successMessage]);

  useEffect(() => {
    setShowLoginPrompt(!menteeOnly && !isMenteeLoggedIn);
  }, [isMenteeLoggedIn, menteeOnly]);

  useEffect(() => {
    if (!isMenteeLoggedIn) return;
    loadCurrentMentee();
  }, [isMenteeLoggedIn, loadCurrentMentee]);

  useEffect(() => {
    if (!mentee) return;
    const legacy = parseLegacyCityState(mentee?.city_state);
    const countrySource = String(mentee?.country || legacy.country || '').trim();
    const stateSource = String(mentee?.state || legacy.state || '').trim();
    const citySource = String(mentee?.city || legacy.city || '').trim();
    const postalSource = String(mentee?.postal_code || legacy.postalCode || '').trim();
    const nextCountry = normalizeCountry(countrySource);
    const nextState = normalizeState(nextCountry, stateSource);
    const nextCity = normalizeCity(nextCountry, nextState, citySource);
    setForm((prev) => ({
      ...prev,
      fullName: prev.fullName.trim() ? prev.fullName : defaultFullName,
      email: prev.email.trim() ? prev.email : defaultEmail,
      phone: prev.phone.trim() ? prev.phone : defaultPhone,
      schoolOrCollege: prev.schoolOrCollege.trim() ? prev.schoolOrCollege : String(mentee?.school_or_college || '').trim(),
      country: prev.country.trim() ? prev.country : nextCountry,
      state: prev.state.trim() ? prev.state : nextState,
      city: prev.city.trim() ? prev.city : nextCity,
      postalCode: prev.postalCode.trim() ? prev.postalCode : postalSource,
    }));
  }, [mentee, defaultEmail, defaultFullName, defaultPhone]);

  useEffect(() => {
    let cancelled = false;
    const loadEvent = async () => {
      setEventLoading(true);
      setErrorMessage('');
      try {
        const response = menteeOnly
          ? await menteeApi.getVolunteerEventById(eventId)
          : await menteeApi.getPublicVolunteerEventById(eventId);
        if (cancelled) return;
        setEventItem(normalizeVolunteerEvent(response || {}));
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
  }, [eventId, menteeOnly]);

  useEffect(() => {
    if (!availableRoleOptions.length) {
      setForm((prev) => (prev.preferredRole ? { ...prev, preferredRole: '' } : prev));
      return;
    }
    setForm((prev) => {
      if (availableRoleOptions.includes(prev.preferredRole)) return prev;
      return { ...prev, preferredRole: availableRoleOptions[0] };
    });
  }, [availableRoleOptions]);

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
    if (key === 'emergencyContact') {
      setForm((prev) => ({ ...prev, emergencyContact: normalizePhoneDigits(nextValue) }));
      return;
    }
    setForm((prev) => ({ ...prev, [key]: nextValue }));
  };

  const onSubmit = async (event) => {
    event.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!eventItem?.id) return;
    if (!isMenteeLoggedIn) {
      setErrorMessage('Please login with a mentee account to register for this event.');
      if (!menteeOnly) {
        setShowLoginPrompt(true);
      }
      return;
    }
    if (
      !form.fullName.trim() ||
      !form.email.trim() ||
      !form.phone.trim() ||
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
    if (!availableRoleOptions.length) {
      setErrorMessage('No volunteer roles are configured for this event yet.');
      return;
    }
    if (!form.preferredRole.trim()) {
      setErrorMessage('Please select a role for this event.');
      return;
    }
    if (normalizePhoneDigits(form.emergencyContact).length !== EMERGENCY_CONTACT_DIGITS) {
      setErrorMessage('Emergency contact number must be exactly 10 digits.');
      return;
    }
    if (!form.consent) {
      setErrorMessage('Please confirm consent before submitting.');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        volunteer_event: eventItem.id,
        full_name: form.fullName.trim(),
        email: form.email.trim().toLowerCase(),
        phone: form.phone.trim(),
        school_or_college: form.schoolOrCollege.trim(),
        country: form.country.trim(),
        state: form.state.trim(),
        city: form.city.trim(),
        postal_code: form.postalCode.trim(),
        preferred_role: form.preferredRole.trim(),
        emergency_contact: withCountryCode(form.country, form.emergencyContact),
        notes: form.notes.trim(),
        consent: form.consent,
      };
      await menteeApi.createVolunteerEventRegistration(payload);
      setSuccessMessage('Registration submitted successfully.');
      setForm((prev) => ({
        ...prev,
        phone: defaultPhone,
        schoolOrCollege: '',
        postalCode: '',
        preferredRole: '',
        emergencyContact: '',
        notes: '',
        consent: false,
      }));
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setErrorMessage(err?.message || 'Unable to submit registration right now.');
    } finally {
      setLoading(false);
    }
  };

  const handleCloseLoginPrompt = () => {
    if (window.history.length > 1) {
      navigate(-1);
      return;
    }
    navigate(backPath);
  };
  const closeMobile = useCallback(() => setMobileOpen(false), []);
  const NAV = [
    { label: 'Home', href: '/' },
    { label: 'About', href: '/about' },
    { label: 'Volunteer', href: '/volunteer' },
    { label: 'Safety', href: '/#safety' },
    { label: 'Stories', href: '/#stories' },
  ];
  const topBar = (
    <>
      <header className="theme-v-header fixed top-0 inset-x-0 z-50">
        <div className="mx-auto flex h-[60px] w-full max-w-[1920px] items-center justify-between px-4 sm:px-6 lg:px-10 xl:px-12 2xl:px-16 min-[2200px]:h-[84px] min-[2200px]:px-16 min-[2500px]:px-20">
          <Link to="/" className="flex flex-col items-center leading-none group">
            <img src={logo} alt="Bond Room" className="theme-v-logo h-10 w-auto object-contain transition-transform group-hover:scale-105 2xl:h-12 min-[2200px]:h-14" />
            <span className="theme-v-tagline mt-0.5 block max-w-[120px] truncate text-[8px] tracking-wide sm:max-w-none sm:text-[9px] 2xl:text-[11px] min-[2200px]:text-[13px]">
              Bridging Old and New Destinies
            </span>
          </Link>

          <nav className="hidden items-center gap-0.5 md:flex 2xl:gap-1.5 min-[2200px]:gap-2">
            {NAV.map((n) => (
              n.href.includes('#') ? (
                <a
                  key={n.label}
                  href={n.href}
                  className="theme-v-nav-link rounded-lg px-3 py-1.5 text-[13px] font-medium 2xl:px-4 2xl:py-2 2xl:text-[15px] min-[2200px]:px-5 min-[2200px]:py-2.5 min-[2200px]:text-[17px]"
                >
                  {n.label}
                </a>
              ) : (
                <Link
                  key={n.label}
                  to={n.href}
                  className="theme-v-nav-link rounded-lg px-3 py-1.5 text-[13px] font-medium 2xl:px-4 2xl:py-2 2xl:text-[15px] min-[2200px]:px-5 min-[2200px]:py-2.5 min-[2200px]:text-[17px]"
                >
                  {n.label}
                </Link>
              )
            ))}
          </nav>

          <div className="hidden items-center gap-2 md:flex 2xl:gap-3 min-[2200px]:gap-4">
            <Link to="/donate" className="theme-v-cta rounded-lg px-3.5 py-1.5 text-[13px] font-semibold transition-all hover:scale-105 2xl:px-4.5 2xl:py-2 2xl:text-[15px] min-[2200px]:px-5 min-[2200px]:py-2.5 min-[2200px]:text-[17px]">
              Donate
            </Link>
            <Link to="/login" className="theme-v-cta rounded-lg px-4 py-1.5 text-[13px] font-semibold shadow-md shadow-[#2D1A4F]/30 transition-all hover:scale-105 hover:shadow-[#2D1A4F]/45 2xl:px-5 2xl:py-2 2xl:text-[15px] min-[2200px]:px-6 min-[2200px]:py-2.5 min-[2200px]:text-[17px]">
              Log in
            </Link>
          </div>

          <button onClick={() => setMobileOpen(true)} className="flex h-9 w-9 items-center justify-center rounded-lg transition hover:bg-white/10 md:hidden">
            <svg className="theme-v-menu-icon h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
      </header>

      {mobileOpen ? (
        <div className="fixed inset-0 z-[100] flex">
          <div className="absolute inset-0 bg-[#4A2B7A]/40 backdrop-blur-sm" onClick={closeMobile} />
          <div className="relative ml-auto flex h-full w-[270px] max-w-[82vw] flex-col bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#EDE3FF] px-4 pb-2 pt-4">
              <span className="text-sm font-bold text-[#5D3699]">Menu</span>
              <button onClick={closeMobile} className="flex h-8 w-8 items-center justify-center rounded-lg text-sm transition hover:bg-[#EDE3FF]">X</button>
            </div>
            <nav className="flex flex-1 flex-col gap-0.5 p-3">
              {NAV.map((n) => (
                n.href.includes('#') ? (
                  <a key={n.label} href={n.href} onClick={closeMobile} className="rounded-lg px-3 py-2.5 text-sm font-medium text-[#5F6B81] transition hover:bg-[#EDE3FF] hover:text-[#5D3699]">
                    {n.label}
                  </a>
                ) : (
                  <Link key={n.label} to={n.href} onClick={closeMobile} className="rounded-lg px-3 py-2.5 text-sm font-medium text-[#5F6B81] transition hover:bg-[#EDE3FF] hover:text-[#5D3699]">
                    {n.label}
                  </Link>
                )
              ))}
              <Link to="/donate" onClick={closeMobile} className="rounded-lg px-3 py-2.5 text-sm font-medium text-[#5D3699] transition hover:bg-[#EDE3FF]">
                Donate
              </Link>
              <Link to="/login" onClick={closeMobile} className="rounded-lg px-3 py-2.5 text-sm font-medium text-[#5F6B81] transition hover:bg-[#EDE3FF] hover:text-[#5D3699]">
                Log in
              </Link>
            </nav>
            <div className="border-t border-[#EDE3FF] p-3">
              <Link to="/register" onClick={closeMobile} className="theme-v-cta block rounded-lg px-4 py-2.5 text-center text-sm font-bold shadow-md transition-all">
                Mentee Sign Up
              </Link>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );

  if (eventLoading || !eventItem) {
    return (
      <>
        {topBar}
        <div className="theme-v-page min-h-screen p-6 pt-[90px] sm:p-8 sm:pt-[94px]">
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
              to={backPath}
              className="theme-v-cta mt-4 inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Link>
          </div>
        </div>
        <VolunteerBottomAuth />
      </>
    );
  }

  return (
    <>
      {topBar}
      <motion.div
        className="theme-v-page relative min-h-screen overflow-hidden p-3 pt-[86px] sm:p-6 sm:pt-[90px] lg:p-8 lg:pt-[94px]"
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
      >
      {(errorMessage || successMessage) && (
        <div className="fixed right-4 top-4 z-[70] w-full max-w-sm">
          <div
            className={`rounded-xl border px-4 py-3 text-sm shadow-lg ${
              errorMessage
                ? 'border-red-200 bg-red-50 text-red-600'
                : 'border-green-200 bg-green-50 text-green-700'
            }`}
          >
            {errorMessage || successMessage}
          </div>
        </div>
      )}

      {showLoginPrompt ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 px-4">
          <div className="relative w-full max-w-md rounded-2xl border border-[#e8dcff] bg-white p-6 shadow-[0_24px_54px_-26px_rgba(0,0,0,0.5)]">
            <button
              type="button"
              onClick={handleCloseLoginPrompt}
              aria-label="Close login prompt"
              className="absolute right-3 top-3 inline-flex h-8 w-8 items-center justify-center rounded-full border border-[#e8dcff] bg-white text-[#5D3699] transition-colors hover:bg-[#f8f4ff]"
            >
              <X className="h-4 w-4" />
            </button>
            <h3 className="text-lg font-semibold text-[#111827]">Do you already have a Mentee account?</h3>
            {isLoggedIn && !isMenteeLoggedIn ? (
              <p className="mt-2 text-sm text-[#6b7280]">
                You are currently logged in with a non-mentee account. Please login with your mentee account to continue event registration.
              </p>
            ) : null}
            <div className="mt-4 flex flex-wrap gap-2">
              <Link
                to={`/login?next=/volunteer-events/${eventId}/register`}
                className="inline-flex items-center rounded-lg border border-[#5D3699] bg-white px-4 py-2 text-sm font-semibold text-[#5D3699] transition-colors hover:bg-[#5D3699] hover:text-white"
              >
                Yes, Login as Mentee
              </Link>
              <Link
                to={`/register?source=event-flow&next=/volunteer-events/${eventId}/register`}
                className="inline-flex items-center rounded-lg border border-[#5D3699] bg-white px-4 py-2 text-sm font-semibold text-[#5D3699] transition-colors hover:bg-[#5D3699] hover:text-white"
              >
                No, Create Account
              </Link>
            </div>
          </div>
        </div>
      ) : null}

      <div className="mb-6">
        <button
          type="button"
          onClick={() => navigate(backPath)}
          className="theme-v-back-btn inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back
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

          {!isMenteeLoggedIn && !menteeOnly ? (
            <div className="mb-4 rounded-lg border border-[#e8dcff] bg-[#f8f4ff] px-4 py-3">
              <p className="text-sm font-medium text-[#312049]">
                Do you already have a mentee account?
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                <Link
                  to={`/login?next=/volunteer-events/${eventId}/register`}
                  className="inline-flex items-center rounded-lg border border-[#5D3699] bg-white px-3 py-1.5 text-xs font-semibold text-[#5D3699] transition-colors hover:bg-[#5D3699] hover:text-white"
                >
                  Yes, Login as Mentee
                </Link>
                <Link
                  to={`/register?source=event-flow&next=/volunteer-events/${eventId}/register`}
                  className="inline-flex items-center rounded-lg border border-[#5D3699] bg-white px-3 py-1.5 text-xs font-semibold text-[#5D3699] transition-colors hover:bg-[#5D3699] hover:text-white"
                >
                  No, Create Account
                </Link>
              </div>
            </div>
          ) : isMenteeLoggedIn ? (
            <div className="mb-4 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
              Logged in. Name, email, and phone are auto-filled when available.
            </div>
          ) : (
            <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              Please login with a mentee account to register for this event.
            </div>
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
            <div className="space-y-1.5">
              <label className="inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-[#7b699d]"><User className="h-3.5 w-3.5" />Preferred Role *</label>
              <select
                value={form.preferredRole}
                onChange={onChange('preferredRole')}
                required
                disabled={!availableRoleOptions.length}
                className="w-full rounded-xl border border-[#e7e2f6] bg-white px-4 py-2.5 text-sm text-[#111827] outline-none focus:border-[#c4b5fd] disabled:bg-[#f9fafb] disabled:text-[#9ca3af]"
              >
                {availableRoleOptions.length ? (
                  availableRoleOptions.map((role) => (
                    <option key={role} value={role}>{role}</option>
                  ))
                ) : (
                  <option value="">No roles available</option>
                )}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wide text-[#7b699d]">Emergency Contact *</label>
              <div className="flex overflow-hidden rounded-xl border border-[#e7e2f6] bg-white focus-within:border-[#c4b5fd]">
                <span className="inline-flex items-center border-r border-[#e7e2f6] bg-[#f9fafb] px-3 text-sm font-semibold text-[#5D3699]">
                  {getCountryCode(form.country)}
                </span>
                <input
                  value={form.emergencyContact}
                  onChange={onChange('emergencyContact')}
                  required
                  maxLength={EMERGENCY_CONTACT_DIGITS}
                  inputMode="numeric"
                  pattern={`\\d{${EMERGENCY_CONTACT_DIGITS}}`}
                  title="Emergency contact number must be exactly 10 digits."
                  placeholder={form.country === 'USA' ? 'e.g. 8325550101' : 'e.g. 9876543210'}
                  className="w-full border-0 px-4 py-2.5 text-sm text-[#111827] outline-none"
                />
              </div>
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-xs font-semibold uppercase tracking-wide text-[#7b699d]">Notes to Organiser</label>
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
                disabled={loading || !isMenteeLoggedIn}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#FDD253] px-5 py-3 text-sm font-semibold text-[#3B2265] transition-all hover:-translate-y-0.5 hover:bg-[#F7C940] disabled:opacity-60"
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
      <VolunteerBottomAuth />
    </>
  );
};

export default VolunteerEventRegister;
