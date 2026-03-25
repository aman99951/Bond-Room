import { useState, useEffect } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  LogOut,
  Sparkles,
  Menu,
  X,
  Home,
  Activity,
  User,
  LogIn,
  UserPlus,
  ChevronRight,
} from 'lucide-react';
import { getVoluntorSession, logoutVoluntorUser } from './voluntorStore';
import bondRoomLogo from '../../assets/logo.png';

const VoluntorLayout = () => {
  const navigate = useNavigate();
  const session = getVoluntorSession();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Lock body scroll when mobile menu open
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileOpen]);

  const onQuickLogout = () => {
    logoutVoluntorUser();
    setMobileOpen(false);
    navigate('/volunteer', { replace: true });
  };

  const closeMobile = () => setMobileOpen(false);

  const navItems = [
    { to: '/volunteer', label: 'Landing', icon: Home, end: true },
    { to: '/volunteer/activities', label: 'Activities', icon: Activity },
    { to: '/volunteer/my-space', label: 'My Space', icon: User },
  ];

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-slate-950 via-purple-950/40 to-slate-950 text-white overflow-x-hidden">
      {/* ── Animated Background Orbs ── */}
      <div className="pointer-events-none fixed inset-0 z-0" aria-hidden="true">
        <div className="absolute -top-32 -left-32 h-[500px] w-[500px] rounded-full bg-purple-600/10 blur-[120px] animate-pulse" />
        <div className="absolute top-1/2 -right-40 h-[400px] w-[400px] rounded-full bg-fuchsia-600/10 blur-[100px] animate-pulse" />
        <div className="absolute -bottom-20 left-1/3 h-[350px] w-[350px] rounded-full bg-violet-500/10 blur-[100px] animate-pulse" />
      </div>

      {/* ── Subtle Grid Overlay ── */}
      <div
        className="pointer-events-none fixed inset-0 z-0 opacity-[0.03]"
        aria-hidden="true"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
        }}
      />

      {/* ════════════════════════════════════════════
          HEADER — FIXED HIGH CONTRAST
      ════════════════════════════════════════════ */}
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
          scrolled
            ? 'bg-slate-950/95 backdrop-blur-xl shadow-lg shadow-purple-900/20 border-b border-white/10'
            : 'bg-slate-950/80 backdrop-blur-md border-b border-white/5'
        }`}
      >
        <div className="mx-auto flex max-w-full items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
          {/* ── Brand ── */}
          <Link
            to="/volunteer"
            className="group flex items-center gap-2.5 transition-transform duration-300 hover:scale-[1.02]"
          >
            <div className="relative">
              <div className="absolute -inset-1 rounded-xl bg-gradient-to-r from-purple-500 to-fuchsia-500 opacity-0 blur transition-opacity duration-500 group-hover:opacity-60" />
              <img
                src={bondRoomLogo}
                alt="Bond Room"
                className="relative h-9 w-9 rounded-lg object-contain sm:h-10 sm:w-10"
              />
            </div>
            <div className="flex flex-col leading-none">
              <span className="text-base font-bold tracking-tight text-white sm:text-lg">
                Bond Room
              </span>
              <span className="bg-gradient-to-r from-purple-400 to-fuchsia-400 bg-clip-text text-[10px] font-semibold uppercase tracking-widest text-transparent">
                Volunteer
              </span>
            </div>
          </Link>

          {/* ── Desktop Navigation — FIXED VISIBILITY ── */}
          <nav className="hidden items-center gap-1 md:flex">
            {navItems.map(({ to, label, icon: Icon, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                className={({ isActive }) =>
                  `group relative flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all duration-300 ${
                    isActive
                      ? 'bg-purple-500/20 text-white ring-1 ring-purple-400/30'
                      : 'text-gray-200 hover:bg-white/10 hover:text-white'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon
                      size={16}
                      className={`transition-colors duration-300 ${
                        isActive
                          ? 'text-purple-300'
                          : 'text-gray-400 group-hover:text-purple-300'
                      }`}
                    />
                    <span>{label}</span>
                    {isActive && (
                      <span className="absolute bottom-0 left-1/2 h-[3px] w-8 -translate-x-1/2 rounded-full bg-gradient-to-r from-purple-500 to-fuchsia-500" />
                    )}
                  </>
                )}
              </NavLink>
            ))}
          </nav>

          {/* ── Desktop Actions — FIXED VISIBILITY ── */}
          <div className="hidden items-center gap-3 md:flex">
            {session ? (
              <>
                {/* User Badge */}
                <div className="flex items-center gap-2 rounded-full bg-purple-500/15 px-4 py-2 ring-1 ring-purple-400/30">
                  <Sparkles size={14} className="text-yellow-400" />
                  <span className="text-sm font-semibold text-white">
                    {session.name}
                  </span>
                </div>
                
                {/* Logout Button */}
                <button
                  type="button"
                  onClick={onQuickLogout}
                  className="group flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-gray-200 ring-1 ring-white/10 transition-all duration-300 hover:bg-red-500/15 hover:text-red-300 hover:ring-red-400/30"
                >
                  <LogOut
                    size={15}
                    className="transition-transform duration-300 group-hover:-translate-x-0.5"
                  />
                  Logout
                </button>
              </>
            ) : (
              <>
                {/* Login Button */}
                <Link
                  to="/volunteer/login"
                  className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-gray-100 ring-1 ring-white/15 transition-all duration-300 hover:bg-white/10 hover:text-white hover:ring-white/30"
                >
                  <LogIn size={15} />
                  Login
                </Link>
                
                {/* Register Button */}
                <Link
                  to="/volunteer/register"
                  className="group relative inline-flex items-center gap-2 overflow-hidden rounded-xl px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-purple-500/25 transition-all duration-300 hover:shadow-purple-500/40 hover:scale-[1.02]"
                >
                  <span className="absolute inset-0 bg-gradient-to-r from-purple-600 to-fuchsia-600 transition-all duration-300 group-hover:brightness-110" />
                  <UserPlus size={15} className="relative z-10" />
                  <span className="relative z-10">Register</span>
                </Link>
              </>
            )}
          </div>

          {/* ── Mobile Menu Toggle ── */}
          <button
            type="button"
            onClick={() => setMobileOpen((o) => !o)}
            className="relative z-[60] flex h-10 w-10 items-center justify-center rounded-xl bg-white/5 text-white ring-1 ring-white/10 transition-all duration-300 hover:bg-white/10 hover:ring-white/20 md:hidden"
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </header>

      {/* ════════════════════════════════════════════
          MOBILE MENU OVERLAY
      ════════════════════════════════════════════ */}
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-40 bg-black/70 backdrop-blur-sm transition-opacity duration-300 md:hidden ${
          mobileOpen ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
        onClick={closeMobile}
      />

      {/* Slide Panel */}
      <div
        className={`fixed right-0 top-0 z-50 flex h-full w-[280px] flex-col border-l border-white/10 bg-slate-950/98 backdrop-blur-2xl transition-transform duration-500 ease-out md:hidden ${
          mobileOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex-1 overflow-y-auto px-4 pb-6 pt-20">
          {/* User card (mobile) */}
          {session && (
            <div className="mb-6 flex items-center gap-3 rounded-2xl bg-gradient-to-r from-purple-500/15 to-fuchsia-500/15 p-4 ring-1 ring-purple-400/30">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-purple-500/25 ring-1 ring-purple-400/30">
                <Sparkles size={20} className="text-yellow-400" />
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-white">
                  {session.name}
                </p>
                <p className="text-xs font-medium text-purple-300">
                  Volunteer
                </p>
              </div>
            </div>
          )}

          {/* Nav Label */}
          <p className="mb-3 px-2 text-[10px] font-bold uppercase tracking-widest text-gray-400">
            Navigation
          </p>

          {/* Nav Links — FIXED MOBILE VISIBILITY */}
          <nav className="flex flex-col gap-1.5">
            {navItems.map(({ to, label, icon: Icon, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                onClick={closeMobile}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-xl px-3 py-3.5 text-sm font-semibold transition-all duration-300 ${
                    isActive
                      ? 'bg-purple-500/20 text-white ring-1 ring-purple-400/30'
                      : 'text-gray-200 hover:bg-white/10 hover:text-white'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <div
                      className={`flex h-9 w-9 items-center justify-center rounded-lg transition-colors duration-300 ${
                        isActive
                          ? 'bg-purple-500/25 ring-1 ring-purple-400/30'
                          : 'bg-white/10'
                      }`}
                    >
                      <Icon
                        size={18}
                        className={isActive ? 'text-purple-300' : 'text-gray-300'}
                      />
                    </div>
                    <span className="flex-1">{label}</span>
                    {isActive && (
                      <ChevronRight size={16} className="text-purple-400" />
                    )}
                  </>
                )}
              </NavLink>
            ))}
          </nav>

          {/* Divider */}
          <div className="my-6 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent" />

          {/* Account Label */}
          <p className="mb-3 px-2 text-[10px] font-bold uppercase tracking-widest text-gray-400">
            Account
          </p>

          {/* Auth Actions — FIXED MOBILE VISIBILITY */}
          {session ? (
            <button
              type="button"
              onClick={onQuickLogout}
              className="flex w-full items-center gap-3 rounded-xl px-3 py-3.5 text-sm font-semibold text-red-300 ring-1 ring-red-500/30 transition-all duration-300 hover:bg-red-500/15"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-red-500/15 ring-1 ring-red-400/30">
                <LogOut size={18} className="text-red-400" />
              </div>
              <span>Logout</span>
            </button>
          ) : (
            <div className="flex flex-col gap-2">
              <Link
                to="/volunteer/login"
                onClick={closeMobile}
                className="flex items-center gap-3 rounded-xl px-3 py-3.5 text-sm font-semibold text-gray-100 ring-1 ring-white/15 transition-all duration-300 hover:bg-white/10 hover:text-white hover:ring-white/25"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/10">
                  <LogIn size={18} className="text-gray-200" />
                </div>
                <span>Login</span>
              </Link>
              <Link
                to="/volunteer/register"
                onClick={closeMobile}
                className="flex items-center gap-3 rounded-xl bg-gradient-to-r from-purple-600 to-fuchsia-600 px-3 py-3.5 text-sm font-bold text-white shadow-lg shadow-purple-500/25 transition-all duration-300 hover:shadow-purple-500/40"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/15">
                  <UserPlus size={18} />
                </div>
                <span>Register Now</span>
              </Link>
            </div>
          )}
        </div>

        {/* Mobile Footer */}
        <div className="border-t border-white/10 px-4 py-4">
          <p className="text-center text-[11px] font-medium text-gray-500">
            © 2025 Bond Room · Volunteer
          </p>
        </div>
      </div>

      {/* ════════════════════════════════════════════
          MAIN CONTENT
      ════════════════════════════════════════════ */}
      <main className="relative z-10 mx-auto max-w-full px-4 pb-16 pt-24 sm:px-6 lg:px-8">
        <Outlet />
      </main>
    </div>
  );
};

export default VoluntorLayout;