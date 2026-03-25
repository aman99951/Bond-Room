import { useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  Calendar,
  Clock3,
  MapPin,
  Users,
  UserRound,
  Sparkles,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  User,
  Mail,
  Phone,
  Hash,
  Building,
  Briefcase,
  Clock,
  AlertTriangle,
  FileText,
  Send,
  Heart,
} from 'lucide-react';
import { volunteerEvents } from './voluntorData';
import { getVoluntorSession, saveEventRegistration } from './voluntorStore';

const formatDate = (value) => {
  const parsed = new Date(`${value}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleDateString('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
};

const initialForm = (session) => ({
  fullName: session?.name || '',
  email: session?.email || '',
  phone: '',
  age: '',
  teamName: '',
  teamSize: '1',
  schoolOrCollege: '',
  preferredRole: '',
  availability: '',
  emergencyContact: '',
  notes: '',
  consent: false,
});

const streamColors = {
  'Healthcare Support': {
    bg: 'bg-rose-500/20',
    text: 'text-rose-200',
    ring: 'ring-rose-400/40',
  },
  'Cancer Care': {
    bg: 'bg-rose-500/20',
    text: 'text-rose-200',
    ring: 'ring-rose-400/40',
  },
  'Marine Cleanup': {
    bg: 'bg-cyan-500/20',
    text: 'text-cyan-200',
    ring: 'ring-cyan-400/40',
  },
  'Ocean Conservation': {
    bg: 'bg-cyan-500/20',
    text: 'text-cyan-200',
    ring: 'ring-cyan-400/40',
  },
  'Elder Home': {
    bg: 'bg-amber-500/20',
    text: 'text-amber-200',
    ring: 'ring-amber-400/40',
  },
  'Elder Care': {
    bg: 'bg-amber-500/20',
    text: 'text-amber-200',
    ring: 'ring-amber-400/40',
  },
  default: {
    bg: 'bg-purple-500/20',
    text: 'text-purple-200',
    ring: 'ring-purple-400/40',
  },
};

const getStreamStyle = (stream) => streamColors[stream] || streamColors.default;

const VoluntorEventRegister = () => {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const session = getVoluntorSession();

  const eventItem = useMemo(
    () => volunteerEvents.find((event) => event.id === eventId),
    [eventId]
  );

  const [form, setForm] = useState(initialForm(session));
  const [successMessage, setSuccessMessage] = useState('');
  const [loading, setLoading] = useState(false);

  // Event not found state
  if (!eventItem) {
    return (
      <section className="flex min-h-[60vh] items-center justify-center px-4">
        <div className="relative max-w-md overflow-hidden rounded-3xl border border-white/10 bg-slate-900/80 px-8 py-12 text-center backdrop-blur-sm">
          <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-red-500/10 blur-[80px]" />

          <div className="relative z-10">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-red-500/15 ring-1 ring-red-400/30">
              <AlertCircle size={32} className="text-red-400" />
            </div>
            <h1 className="mb-2 text-2xl font-bold text-white">
              Event Not Found
            </h1>
            <p className="mb-6 text-sm text-gray-300">
              The selected volunteering activity is not available or may have
              been removed.
            </p>
            <Link
              to="/volunteer/activities"
              className="group relative inline-flex items-center gap-2 overflow-hidden rounded-xl px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-purple-500/20"
            >
              <span className="absolute inset-0 bg-gradient-to-r from-purple-600 to-fuchsia-600" />
              <ArrowLeft size={16} className="relative z-10" />
              <span className="relative z-10">Back to Activities</span>
            </Link>
          </div>
        </div>
      </section>
    );
  }

  const streamStyle = getStreamStyle(eventItem.stream);

  const onChange = (key) => (e) => {
    const nextValue = key === 'consent' ? e.target.checked : e.target.value;
    setForm((prev) => ({ ...prev, [key]: nextValue }));
  };

  const onSubmit = (e) => {
    e.preventDefault();
    setSuccessMessage('');
    setLoading(true);

    setTimeout(() => {
      saveEventRegistration({
        eventId: eventItem.id,
        eventTitle: eventItem.title,
        eventDate: eventItem.date,
        eventTime: eventItem.time,
        userEmail: form.email,
        ...form,
      });

      setSuccessMessage(`Registration submitted for ${eventItem.title}.`);
      setForm(initialForm(session));
      setLoading(false);

      // Optional: Navigate to dashboard
      // navigate('/volunteer/my-space', { state: { successMessage: `Registered for ${eventItem.title}` } });
    }, 800);
  };

  return (
    <section className="space-y-8 pb-12">
      {/* ════════════════════════════════════════
          HEADER SECTION
      ════════════════════════════════════════ */}
      <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-slate-900/80 px-6 py-8 backdrop-blur-sm sm:px-10 sm:py-10">
        <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-purple-500/15 blur-[80px]" />
        <div className="absolute -bottom-10 -left-10 h-40 w-40 rounded-full bg-fuchsia-500/15 blur-[60px]" />

        <div className="relative z-10">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-purple-500/15 px-3 py-1 ring-1 ring-purple-400/30">
            <Sparkles size={12} className="text-yellow-400" />
            <span className="text-[11px] font-semibold tracking-wide text-purple-100">
              Volunteer Registration
            </span>
          </div>

          <h1 className="mb-2 text-2xl font-extrabold text-white sm:text-3xl">
            Register for{' '}
            <span className="bg-gradient-to-r from-purple-300 to-fuchsia-300 bg-clip-text text-transparent">
              {eventItem.title}
            </span>
          </h1>
          <p className="max-w-2xl text-sm text-gray-300 sm:text-base">
            Complete the form below to register for this volunteering activity.
            All fields marked are required.
          </p>
        </div>
      </div>

      {/* ════════════════════════════════════════
          SUCCESS MESSAGE
      ════════════════════════════════════════ */}
      {successMessage && (
        <div className="flex items-start gap-3 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-5 py-4">
          <CheckCircle2
            size={20}
            className="mt-0.5 shrink-0 text-emerald-400"
          />
          <div>
            <p className="font-semibold text-emerald-200">
              Registration Successful!
            </p>
            <p className="text-sm text-emerald-300/80">{successMessage}</p>
            <Link
              to="/volunteer/my-space"
              className="mt-2 inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-300 hover:text-emerald-200"
            >
              View My Registrations
              <ArrowLeft size={14} className="rotate-180" />
            </Link>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════
          MAIN LAYOUT: SIDEBAR + FORM
      ════════════════════════════════════════ */}
      <div className="grid gap-8 lg:grid-cols-[380px_1fr]">
        {/* ── Event Summary Sidebar ── */}
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="overflow-hidden rounded-2xl border border-white/10 bg-slate-900/80 backdrop-blur-sm">
            {/* Event Image */}
            <div className="relative aspect-[16/10] overflow-hidden">
              <img
                src={eventItem.image}
                alt={eventItem.title}
                className="h-full w-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/40 to-transparent opacity-80" />

              {/* Stream Badge */}
              <div
                className={`absolute left-3 top-3 flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider backdrop-blur-md ring-1 ${streamStyle.bg} ${streamStyle.text} ${streamStyle.ring}`}
              >
                {eventItem.stream}
              </div>
            </div>

            {/* Event Details */}
            <div className="p-5 sm:p-6">
              <h2 className="mb-2 text-lg font-bold text-white">
                {eventItem.title}
              </h2>
              <p className="mb-5 text-sm leading-relaxed text-gray-300">
                {eventItem.description}
              </p>

              {/* Meta List */}
              <div className="space-y-2.5">
                {[
                  {
                    icon: Calendar,
                    value: formatDate(eventItem.date),
                    iconColor: 'text-purple-300',
                  },
                  {
                    icon: Clock3,
                    value: eventItem.time,
                    iconColor: 'text-fuchsia-300',
                  },
                  {
                    icon: MapPin,
                    value: eventItem.location,
                    iconColor: 'text-cyan-300',
                  },
                  {
                    icon: Users,
                    value: `${eventItem.seats} volunteer slots`,
                    iconColor: 'text-emerald-300',
                  },
                  {
                    icon: UserRound,
                    value: `Organized by ${eventItem.organizer}`,
                    iconColor: 'text-amber-300',
                  },
                ].map(({ icon: Icon, value, iconColor }) => (
                  <div
                    key={value}
                    className="flex items-start gap-2.5 text-sm"
                  >
                    <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-white/10">
                      <Icon size={13} className={iconColor} />
                    </div>
                    <span className="text-gray-100 leading-snug">{value}</span>
                  </div>
                ))}
              </div>

              {/* Back Button */}
              <button
                type="button"
                onClick={() => navigate('/volunteer/activities')}
                className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm font-semibold text-gray-200 transition-all duration-300 hover:border-purple-400/30 hover:bg-white/[0.08] hover:text-white"
              >
                <ArrowLeft size={15} />
                Back to Activities
              </button>
            </div>
          </div>
        </aside>

        {/* ── Registration Form ── */}
        <form
          onSubmit={onSubmit}
          className="relative overflow-hidden rounded-2xl border border-white/10 bg-slate-900/80 p-6 backdrop-blur-sm sm:p-8"
        >
          <div className="absolute -right-16 -top-16 h-40 w-40 rounded-full bg-purple-500/10 blur-[60px]" />

          <div className="relative z-10">
            {/* Form Header */}
            <div className="mb-8 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-500/20 ring-1 ring-purple-400/30">
                <FileText size={20} className="text-purple-300" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">
                  Registration Form
                </h3>
                <p className="text-xs text-gray-400">
                  Fill in your details below
                </p>
              </div>
            </div>

            {/* Form Grid */}
            <div className="grid gap-5 sm:grid-cols-2">
              {/* Full Name */}
              <div className="space-y-1.5">
                <label className="flex items-center gap-1.5 text-sm font-semibold text-gray-200">
                  <User size={14} className="text-purple-300" />
                  Full Name <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={form.fullName}
                  onChange={onChange('fullName')}
                  required
                  placeholder="Enter your full name"
                  className="w-full rounded-xl border border-white/10 bg-white/[0.06] px-4 py-3 text-sm text-white placeholder-gray-500 outline-none transition-all duration-300 focus:border-purple-400/50 focus:bg-white/[0.08] focus:ring-2 focus:ring-purple-500/20"
                />
              </div>

              {/* Email */}
              <div className="space-y-1.5">
                <label className="flex items-center gap-1.5 text-sm font-semibold text-gray-200">
                  <Mail size={14} className="text-purple-300" />
                  Email <span className="text-red-400">*</span>
                </label>
                <input
                  type="email"
                  value={form.email}
                  onChange={onChange('email')}
                  required
                  placeholder="your@email.com"
                  className="w-full rounded-xl border border-white/10 bg-white/[0.06] px-4 py-3 text-sm text-white placeholder-gray-500 outline-none transition-all duration-300 focus:border-purple-400/50 focus:bg-white/[0.08] focus:ring-2 focus:ring-purple-500/20"
                />
              </div>

              {/* Phone */}
              <div className="space-y-1.5">
                <label className="flex items-center gap-1.5 text-sm font-semibold text-gray-200">
                  <Phone size={14} className="text-fuchsia-300" />
                  Phone Number <span className="text-red-400">*</span>
                </label>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={onChange('phone')}
                  required
                  placeholder="+91 98765 43210"
                  className="w-full rounded-xl border border-white/10 bg-white/[0.06] px-4 py-3 text-sm text-white placeholder-gray-500 outline-none transition-all duration-300 focus:border-purple-400/50 focus:bg-white/[0.08] focus:ring-2 focus:ring-purple-500/20"
                />
              </div>

              {/* Age */}
              <div className="space-y-1.5">
                <label className="flex items-center gap-1.5 text-sm font-semibold text-gray-200">
                  <Hash size={14} className="text-fuchsia-300" />
                  Age <span className="text-red-400">*</span>
                </label>
                <input
                  type="number"
                  min="13"
                  max="25"
                  value={form.age}
                  onChange={onChange('age')}
                  required
                  placeholder="Between 13-25"
                  className="w-full rounded-xl border border-white/10 bg-white/[0.06] px-4 py-3 text-sm text-white placeholder-gray-500 outline-none transition-all duration-300 focus:border-purple-400/50 focus:bg-white/[0.08] focus:ring-2 focus:ring-purple-500/20"
                />
              </div>

              {/* Team Name */}
              <div className="space-y-1.5">
                <label className="flex items-center gap-1.5 text-sm font-semibold text-gray-200">
                  <Users size={14} className="text-cyan-300" />
                  Team Name <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={form.teamName}
                  onChange={onChange('teamName')}
                  required
                  placeholder="Weekend Care Team"
                  className="w-full rounded-xl border border-white/10 bg-white/[0.06] px-4 py-3 text-sm text-white placeholder-gray-500 outline-none transition-all duration-300 focus:border-purple-400/50 focus:bg-white/[0.08] focus:ring-2 focus:ring-purple-500/20"
                />
              </div>

              {/* Team Size */}
              <div className="space-y-1.5">
                <label className="flex items-center gap-1.5 text-sm font-semibold text-gray-200">
                  <Hash size={14} className="text-cyan-300" />
                  Team Size <span className="text-red-400">*</span>
                </label>
                <input
                  type="number"
                  min="1"
                  max="80"
                  value={form.teamSize}
                  onChange={onChange('teamSize')}
                  required
                  placeholder="1"
                  className="w-full rounded-xl border border-white/10 bg-white/[0.06] px-4 py-3 text-sm text-white placeholder-gray-500 outline-none transition-all duration-300 focus:border-purple-400/50 focus:bg-white/[0.08] focus:ring-2 focus:ring-purple-500/20"
                />
              </div>

              {/* School/College */}
              <div className="space-y-1.5">
                <label className="flex items-center gap-1.5 text-sm font-semibold text-gray-200">
                  <Building size={14} className="text-amber-300" />
                  School / College <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={form.schoolOrCollege}
                  onChange={onChange('schoolOrCollege')}
                  required
                  placeholder="Your institution name"
                  className="w-full rounded-xl border border-white/10 bg-white/[0.06] px-4 py-3 text-sm text-white placeholder-gray-500 outline-none transition-all duration-300 focus:border-purple-400/50 focus:bg-white/[0.08] focus:ring-2 focus:ring-purple-500/20"
                />
              </div>

              {/* Preferred Role */}
              <div className="space-y-1.5">
                <label className="flex items-center gap-1.5 text-sm font-semibold text-gray-200">
                  <Briefcase size={14} className="text-amber-300" />
                  Preferred Role <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={form.preferredRole}
                  onChange={onChange('preferredRole')}
                  required
                  placeholder="Coordinator, Performer, Lead..."
                  className="w-full rounded-xl border border-white/10 bg-white/[0.06] px-4 py-3 text-sm text-white placeholder-gray-500 outline-none transition-all duration-300 focus:border-purple-400/50 focus:bg-white/[0.08] focus:ring-2 focus:ring-purple-500/20"
                />
              </div>

              {/* Availability - Full Width */}
              <div className="space-y-1.5 sm:col-span-2">
                <label className="flex items-center gap-1.5 text-sm font-semibold text-gray-200">
                  <Clock size={14} className="text-emerald-300" />
                  Availability on Event Day <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={form.availability}
                  onChange={onChange('availability')}
                  required
                  placeholder="Full event / First half / Second half"
                  className="w-full rounded-xl border border-white/10 bg-white/[0.06] px-4 py-3 text-sm text-white placeholder-gray-500 outline-none transition-all duration-300 focus:border-purple-400/50 focus:bg-white/[0.08] focus:ring-2 focus:ring-purple-500/20"
                />
              </div>

              {/* Emergency Contact - Full Width */}
              <div className="space-y-1.5 sm:col-span-2">
                <label className="flex items-center gap-1.5 text-sm font-semibold text-gray-200">
                  <AlertTriangle size={14} className="text-red-400" />
                  Emergency Contact <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={form.emergencyContact}
                  onChange={onChange('emergencyContact')}
                  required
                  placeholder="Parent/Guardian name and phone number"
                  className="w-full rounded-xl border border-white/10 bg-white/[0.06] px-4 py-3 text-sm text-white placeholder-gray-500 outline-none transition-all duration-300 focus:border-purple-400/50 focus:bg-white/[0.08] focus:ring-2 focus:ring-purple-500/20"
                />
              </div>

              {/* Notes - Full Width */}
              <div className="space-y-1.5 sm:col-span-2">
                <label className="flex items-center gap-1.5 text-sm font-semibold text-gray-200">
                  <FileText size={14} className="text-purple-300" />
                  Notes for Organizers
                </label>
                <textarea
                  value={form.notes}
                  onChange={onChange('notes')}
                  rows={4}
                  placeholder="Any medical notes, preferences, transport details..."
                  className="w-full resize-none rounded-xl border border-white/10 bg-white/[0.06] px-4 py-3 text-sm text-white placeholder-gray-500 outline-none transition-all duration-300 focus:border-purple-400/50 focus:bg-white/[0.08] focus:ring-2 focus:ring-purple-500/20"
                />
              </div>

              {/* Consent Checkbox - Full Width */}
              <div className="sm:col-span-2">
                <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-white/10 bg-white/[0.04] p-4 transition-all duration-300 hover:bg-white/[0.06]">
                  <input
                    type="checkbox"
                    checked={form.consent}
                    onChange={onChange('consent')}
                    required
                    className="mt-1 h-4 w-4 shrink-0 cursor-pointer rounded border-white/20 bg-white/10 text-purple-500 focus:ring-purple-500/30"
                  />
                  <div>
                    <span className="text-sm font-medium text-gray-100">
                      I confirm the details are correct
                    </span>
                    <p className="mt-0.5 text-xs text-gray-400">
                      I understand the event guidelines and am ready to
                      volunteer for this activity.
                    </p>
                  </div>
                </label>
              </div>

              {/* Submit Button - Full Width */}
              <div className="sm:col-span-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="group relative flex w-full items-center justify-center gap-2 overflow-hidden rounded-xl px-6 py-4 text-sm font-semibold text-white shadow-lg shadow-purple-500/20 transition-all duration-300 hover:shadow-purple-500/40 hover:scale-[1.01] disabled:opacity-60 disabled:pointer-events-none sm:text-base"
                >
                  <span className="absolute inset-0 bg-gradient-to-r from-purple-600 to-fuchsia-600 transition-all duration-300 group-hover:brightness-110" />
                  {loading ? (
                    <span className="relative z-10 flex items-center gap-2">
                      <svg
                        className="h-5 w-5 animate-spin"
                        viewBox="0 0 24 24"
                        fill="none"
                      >
                        <circle
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="3"
                          className="opacity-25"
                        />
                        <path
                          d="M4 12a8 8 0 018-8"
                          stroke="currentColor"
                          strokeWidth="3"
                          strokeLinecap="round"
                          className="opacity-75"
                        />
                      </svg>
                      Submitting...
                    </span>
                  ) : (
                    <>
                      <Heart size={18} className="relative z-10" />
                      <span className="relative z-10">
                        Submit Volunteer Registration
                      </span>
                      <Send
                        size={16}
                        className="relative z-10 transition-transform duration-300 group-hover:translate-x-1"
                      />
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </section>
  );
};

export default VoluntorEventRegister;