import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LogIn,
  Mail,
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
  Sparkles,
  ArrowRight,
  UserPlus,
  Shield,
  Zap,
  Users,
  Calendar,
  Award,
  Heart,
  CheckCircle,
} from 'lucide-react';
import { loginVoluntorUser } from './voluntorStore';

const VoluntorLogin = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const redirectPath = location.state?.redirectTo || '/volunteer/activities';

  const onChange = (key) => (event) => {
    setError('');
    setForm((prev) => ({ ...prev, [key]: event.target.value }));
  };

  const onSubmit = (event) => {
    event.preventDefault();
    setLoading(true);
    setTimeout(() => {
      const response = loginVoluntorUser(form);
      if (!response.ok) {
        setError(response.message);
        setLoading(false);
        return;
      }
      navigate(redirectPath, { replace: true });
    }, 600);
  };

  const features = [
    {
      icon: Calendar,
      title: 'Your Registered Events',
      desc: 'View all your upcoming volunteer activities in one place',
    },
    {
      icon: Award,
      title: 'Track Contributions',
      desc: 'Monitor your volunteering hours and earned certificates',
    },
    {
      icon: Users,
      title: 'Manage Your Team',
      desc: 'Coordinate with your volunteer group and team members',
    },
    {
      icon: Shield,
      title: 'Secure Dashboard',
      desc: 'Your personal space with safe and private data',
    },
  ];

  const stats = [
    { value: '500+', label: 'Active Volunteers' },
    { value: '50+', label: 'Events Monthly' },
    { value: '95%', label: 'Satisfaction' },
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
                  Volunteer Portal
                </span>
              </div>

              <h1 className="mb-4 text-3xl font-extrabold text-white sm:text-4xl lg:text-5xl">
                Continue Your{' '}
                <span className="bg-gradient-to-r from-purple-300 to-fuchsia-300 bg-clip-text text-transparent">
                  Impact Journey
                </span>
              </h1>

              <p className="max-w-md text-base leading-relaxed text-gray-300">
                Login to access your volunteer dashboard, view registered
                events, track your contributions, and manage your team.
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

            {/* Features List */}
            <div className="space-y-4">
              <p className="text-xs font-bold uppercase tracking-widest text-gray-400">
                Access Your Dashboard
              </p>
              {features.map(({ icon: Icon, title, desc }) => (
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

            {/* Quick Info Banner */}
            <div className="mt-8 rounded-xl bg-gradient-to-r from-emerald-500/10 to-cyan-500/10 p-5 ring-1 ring-emerald-400/20">
              <div className="mb-3 flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500/20">
                  <CheckCircle size={16} className="text-emerald-400" />
                </div>
                <h3 className="font-bold text-white">Secure & Private</h3>
              </div>
              <p className="text-sm text-gray-300">
                Your data is encrypted and protected. We never share your
                personal information with third parties.
              </p>
            </div>

            {/* Trust Indicators */}
            <div className="mt-6 flex flex-wrap items-center gap-3">
              {[
                { icon: Shield, text: '256-bit SSL' },
                { icon: CheckCircle, text: 'GDPR Compliant' },
                { icon: Heart, text: '100% Free' },
              ].map(({ icon: Icon, text }) => (
                <div
                  key={text}
                  className="flex items-center gap-1.5 text-xs font-medium text-gray-400"
                >
                  <Icon size={14} className="text-purple-400" />
                  {text}
                </div>
              ))}
            </div>
          </div>

          {/* ════════════════════════════════════════
              RIGHT SIDE — LOGIN FORM
          ════════════════════════════════════════ */}
          <div className="flex flex-col justify-center p-8 sm:p-10 lg:p-12">
            {/* Form Header */}
            <div className="mb-8 text-center lg:text-left">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-purple-500/20 ring-1 ring-purple-400/30 lg:mx-0">
                <LogIn size={26} className="text-purple-300" />
              </div>
              <h2 className="mb-2 text-2xl font-extrabold text-white">
                Welcome Back!
              </h2>
              <p className="text-sm text-gray-400">
                Enter your credentials to access your account
              </p>
            </div>

            {/* ── Form ── */}
            <form onSubmit={onSubmit} className="space-y-5">
              {/* Email Field */}
              <div className="space-y-1.5">
                <label className="flex items-center gap-1.5 text-sm font-semibold text-gray-200">
                  <Mail size={14} className="text-purple-300" />
                  Email Address
                </label>
                <div className="group relative">
                  <input
                    type="email"
                    value={form.email}
                    onChange={onChange('email')}
                    required
                    placeholder="aman@email.com"
                    className="w-full rounded-xl border border-white/10 bg-white/[0.06] px-4 py-3 text-sm text-white placeholder-gray-500 outline-none transition-all duration-300 focus:border-purple-400/50 focus:bg-white/[0.08] focus:ring-2 focus:ring-purple-500/20"
                  />
                </div>
              </div>

              {/* Password Field */}
              <div className="space-y-1.5">
                <label className="flex items-center gap-1.5 text-sm font-semibold text-gray-200">
                  <Lock size={14} className="text-purple-300" />
                  Password
                </label>
                <div className="group relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    minLength={6}
                    value={form.password}
                    onChange={onChange('password')}
                    required
                    placeholder="Enter your password"
                    className="w-full rounded-xl border border-white/10 bg-white/[0.06] px-4 py-3 pr-11 text-sm text-white placeholder-gray-500 outline-none transition-all duration-300 focus:border-purple-400/50 focus:bg-white/[0.08] focus:ring-2 focus:ring-purple-500/20"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((p) => !p)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 transition-colors duration-200 hover:text-white"
                    aria-label={
                      showPassword ? 'Hide password' : 'Show password'
                    }
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
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
                  { icon: Zap, text: 'Instant access' },
                  { icon: Shield, text: 'Secure login' },
                  { icon: Heart, text: 'All features' },
                ].map(({ icon: Icon, text }) => (
                  <div
                    key={text}
                    className="inline-flex items-center gap-1.5 rounded-full bg-purple-500/10 px-3 py-1 text-xs font-medium text-purple-300 ring-1 ring-purple-500/20"
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
                    Logging in...
                  </span>
                ) : (
                  <>
                    <span className="relative z-10">Login to Dashboard</span>
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
                  New volunteer?
                </span>
                <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
              </div>

              {/* Register Link */}
              <Link
                to="/volunteer/register"
                className="group flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-6 py-3 text-sm font-semibold text-gray-100 transition-all duration-300 hover:border-purple-400/30 hover:bg-white/[0.08] hover:text-white"
              >
                <UserPlus
                  size={16}
                  className="text-purple-300 transition-transform duration-300 group-hover:scale-110"
                />
                Create Volunteer Account
              </Link>

              {/* Terms */}
              <p className="text-center text-[11px] text-gray-500">
                By logging in you agree to Bond Room's{' '}
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

export default VoluntorLogin;