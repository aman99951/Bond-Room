import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  UserPlus,
  User,
  Mail,
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
  Sparkles,
  ArrowRight,
  LogIn,
  CheckCircle,
  Shield,
  Heart,
  Users,
  Calendar,
  Award,
  Globe,
  Zap,
} from 'lucide-react';
import { registerVoluntorUser } from './voluntorStore';

const VoluntorRegister = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const onChange = (key) => (event) => {
    setError('');
    setForm((prev) => ({ ...prev, [key]: event.target.value }));
  };

  const onSubmit = (event) => {
    event.preventDefault();
    setLoading(true);
    setTimeout(() => {
      const response = registerVoluntorUser(form);
      if (!response.ok) {
        setError(response.message);
        setLoading(false);
        return;
      }
      navigate('/volunteer/activities', { replace: true });
    }, 800);
  };

  // Password strength indicator
  const getPasswordStrength = () => {
    const len = form.password.length;
    if (len === 0) return { label: '', color: '', width: '0%' };
    if (len < 6) return { label: 'Too short', color: 'bg-red-500', width: '25%' };
    if (len < 8) return { label: 'Fair', color: 'bg-yellow-500', width: '50%' };
    if (len < 12) return { label: 'Good', color: 'bg-emerald-500', width: '75%' };
    return { label: 'Strong', color: 'bg-emerald-400', width: '100%' };
  };

  const passwordStrength = getPasswordStrength();

  const benefits = [
    {
      icon: Calendar,
      title: 'Access All Events',
      desc: 'Browse and register for cancer care, marine cleanup, elder home visits',
    },
    {
      icon: Users,
      title: 'Team Collaboration',
      desc: 'Create teams, invite friends, and volunteer together',
    },
    {
      icon: Award,
      title: 'Earn Certificates',
      desc: 'Get recognized for your contributions with official certificates',
    },
    {
      icon: Globe,
      title: 'Track Your Impact',
      desc: 'See your volunteering history and community impact stats',
    },
  ];

  const stats = [
    { value: '500+', label: 'Volunteers' },
    { value: '50+', label: 'Events' },
    { value: '10K+', label: 'Hours' },
  ];

  return (
    <section className="py-8 sm:py-12">
      <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-slate-900/80 backdrop-blur-sm">
        {/* Decorative Orbs */}
        <div className="absolute -left-32 -top-32 h-64 w-64 rounded-full bg-purple-500/15 blur-[100px]" />
        <div className="absolute -bottom-32 -right-32 h-64 w-64 rounded-full bg-fuchsia-500/15 blur-[100px]" />
        <div className="absolute left-1/2 top-1/2 h-48 w-48 -translate-x-1/2 -translate-y-1/2 rounded-full bg-violet-500/10 blur-[80px]" />

        <div className="relative z-10 grid lg:grid-cols-2">
          {/* ════════════════════════════════════════
              LEFT SIDE — CONTENT
          ════════════════════════════════════════ */}
          <div className="flex flex-col justify-center border-b border-white/10 p-8 sm:p-10 lg:border-b-0 lg:border-r lg:p-12">
            {/* Header */}
            <div className="mb-8">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-purple-500/15 px-4 py-1.5 ring-1 ring-purple-400/30">
                <Sparkles size={14} className="text-yellow-400" />
                <span className="text-xs font-semibold tracking-wide text-purple-100">
                  Join 500+ Teen Volunteers
                </span>
              </div>

              <h1 className="mb-4 text-3xl font-extrabold text-white sm:text-4xl lg:text-5xl">
                Make a{' '}
                <span className="bg-gradient-to-r from-purple-300 to-fuchsia-300 bg-clip-text text-transparent">
                  Difference
                </span>{' '}
                Today
              </h1>

              <p className="max-w-md text-base text-gray-300 leading-relaxed">
                Join Bond Room's volunteer community and participate in
                meaningful activities across healthcare, environment, and
                elderly care.
              </p>
            </div>

            {/* Stats Row */}
            <div className="mb-8 flex flex-wrap gap-4">
              {stats.map(({ value, label }) => (
                <div
                  key={label}
                  className="flex-1 min-w-[100px] rounded-xl bg-white/[0.04] px-4 py-3 text-center ring-1 ring-white/10"
                >
                  <strong className="block text-2xl font-extrabold text-white">
                    {value}
                  </strong>
                  <span className="text-xs font-medium text-gray-400">
                    {label}
                  </span>
                </div>
              ))}
            </div>

            {/* Benefits List */}
            <div className="space-y-4">
              <p className="text-xs font-bold uppercase tracking-widest text-gray-400">
                Why Join Us
              </p>
              {benefits.map(({ icon: Icon, title, desc }) => (
                <div
                  key={title}
                  className="group flex items-start gap-4 rounded-xl bg-white/[0.03] p-4 ring-1 ring-white/[0.06] transition-all duration-300 hover:bg-white/[0.06] hover:ring-purple-400/20"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-purple-500/15 ring-1 ring-purple-400/30 transition-transform duration-300 group-hover:scale-110">
                    <Icon size={18} className="text-purple-300" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white">{title}</h3>
                    <p className="mt-0.5 text-sm text-gray-400">{desc}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Testimonial */}
            <div className="mt-8 rounded-xl bg-gradient-to-r from-purple-500/10 to-fuchsia-500/10 p-5 ring-1 ring-purple-400/20">
              <div className="mb-3 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-500/20 ring-1 ring-purple-400/30">
                  <span className="text-sm font-bold text-white">AK</span>
                </div>
                <div>
                  <p className="font-semibold text-white">Volunteer Lead</p>
                  <p className="text-xs text-purple-300">Teen Volunteer Lead</p>
                </div>
              </div>
              <p className="text-sm italic text-gray-300">
                "Volunteering with Bond Room has been life-changing. I've met
                amazing people and made real impact in my community."
              </p>
            </div>
          </div>

          {/* ════════════════════════════════════════
              RIGHT SIDE — FORM
          ════════════════════════════════════════ */}
          <div className="flex flex-col justify-center p-8 sm:p-10 lg:p-12">
            {/* Form Header */}
            <div className="mb-8 text-center lg:text-left">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-500/20 to-fuchsia-500/20 ring-1 ring-purple-400/30 lg:mx-0">
                <UserPlus size={26} className="text-purple-300" />
              </div>
              <h2 className="mb-2 text-2xl font-extrabold text-white">
                Create Your Account
              </h2>
              <p className="text-sm text-gray-400">
                Fill in your details to get started
              </p>
            </div>

            {/* ── Form ── */}
            <form onSubmit={onSubmit} className="space-y-5">
              {/* Name & Email Row — Two Columns */}
              <div className="grid gap-4 sm:grid-cols-2">
                {/* Full Name */}
                <div className="space-y-1.5">
                  <label className="flex items-center gap-1.5 text-sm font-semibold text-gray-200">
                    <User size={14} className="text-purple-300" />
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={onChange('name')}
                    required
                    placeholder="Volunteer Name"
                    className="w-full rounded-xl border border-white/10 bg-white/[0.06] px-4 py-3 text-sm text-white placeholder-gray-500 outline-none transition-all duration-300 focus:border-purple-400/50 focus:bg-white/[0.08] focus:ring-2 focus:ring-purple-500/20"
                  />
                </div>

                {/* Email */}
                <div className="space-y-1.5">
                  <label className="flex items-center gap-1.5 text-sm font-semibold text-gray-200">
                    <Mail size={14} className="text-purple-300" />
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={onChange('email')}
                    required
                    placeholder="volunteer@example.com"
                    className="w-full rounded-xl border border-white/10 bg-white/[0.06] px-4 py-3 text-sm text-white placeholder-gray-500 outline-none transition-all duration-300 focus:border-purple-400/50 focus:bg-white/[0.08] focus:ring-2 focus:ring-purple-500/20"
                  />
                </div>
              </div>

              {/* Password Field — Full Width */}
              <div className="space-y-1.5">
                <label className="flex items-center gap-1.5 text-sm font-semibold text-gray-200">
                  <Lock size={14} className="text-purple-300" />
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    minLength={6}
                    value={form.password}
                    onChange={onChange('password')}
                    required
                    placeholder="Minimum 6 characters"
                    className="w-full rounded-xl border border-white/10 bg-white/[0.06] px-4 py-3 pr-11 text-sm text-white placeholder-gray-500 outline-none transition-all duration-300 focus:border-purple-400/50 focus:bg-white/[0.08] focus:ring-2 focus:ring-purple-500/20"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((p) => !p)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 transition-colors duration-200 hover:text-white"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>

                {/* Password Strength */}
                {form.password.length > 0 && (
                  <div className="mt-2 space-y-1">
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${passwordStrength.color}`}
                        style={{ width: passwordStrength.width }}
                      />
                    </div>
                    <p className="text-[11px] font-medium text-gray-400">
                      Password strength:{' '}
                      <span
                        className={`${
                          passwordStrength.color === 'bg-red-500'
                            ? 'text-red-400'
                            : passwordStrength.color === 'bg-yellow-500'
                            ? 'text-yellow-400'
                            : 'text-emerald-400'
                        }`}
                      >
                        {passwordStrength.label}
                      </span>
                    </p>
                  </div>
                )}
              </div>

              {/* Error Message */}
              {error && (
                <div className="flex items-start gap-2.5 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3">
                  <AlertCircle
                    size={16}
                    className="mt-0.5 shrink-0 text-red-400"
                  />
                  <p className="text-sm font-medium text-red-200">{error}</p>
                </div>
              )}

              {/* Quick Benefits */}
              <div className="flex flex-wrap gap-2">
                {[
                  { icon: CheckCircle, text: 'Free forever' },
                  { icon: Shield, text: 'Secure' },
                  { icon: Zap, text: 'Instant access' },
                ].map(({ icon: Icon, text }) => (
                  <div
                    key={text}
                    className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-300 ring-1 ring-emerald-500/20"
                  >
                    <Icon size={12} />
                    {text}
                  </div>
                ))}
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="group relative flex w-full items-center justify-center gap-2 overflow-hidden rounded-xl px-6 py-4 text-sm font-semibold text-white shadow-lg shadow-purple-500/25 transition-all duration-300 hover:shadow-purple-500/40 hover:scale-[1.02] disabled:opacity-60 disabled:pointer-events-none"
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
                    Creating account...
                  </span>
                ) : (
                  <>
                    <Heart size={18} className="relative z-10" />
                    <span className="relative z-10">Create Account & Start Volunteering</span>
                    <ArrowRight
                      size={16}
                      className="relative z-10 transition-transform duration-300 group-hover:translate-x-1"
                    />
                  </>
                )}
              </button>

              {/* Divider */}
              <div className="flex items-center gap-3">
                <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                <span className="text-xs font-medium text-gray-500">
                  Already registered?
                </span>
                <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
              </div>

              {/* Login Link */}
              <Link
                to="/volunteer/login"
                className="group flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-6 py-3 text-sm font-semibold text-gray-100 transition-all duration-300 hover:border-purple-400/30 hover:bg-white/[0.08] hover:text-white"
              >
                <LogIn
                  size={16}
                  className="text-purple-300 transition-transform duration-300 group-hover:scale-110"
                />
                Login to Your Account
              </Link>

              {/* Terms */}
              <p className="text-center text-[11px] text-gray-500">
                By registering, you agree to our{' '}
                <span className="text-purple-400 hover:text-purple-300 cursor-pointer">
                  Terms
                </span>{' '}
                and{' '}
                <span className="text-purple-400 hover:text-purple-300 cursor-pointer">
                  Privacy Policy
                </span>
              </p>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
};

export default VoluntorRegister;
