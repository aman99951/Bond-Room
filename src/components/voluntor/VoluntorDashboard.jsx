import { useMemo } from 'react';
import { Link, Navigate, useLocation } from 'react-router-dom';
import {
  CheckCircle2,
  LogOut,
  Mail,
  UserCircle2,
  Sparkles,
  Calendar,
  Clock,
  Users,
  Zap,
  ArrowRight,
  ClipboardList,
  Trophy,
  Heart,
  MapPin,
  AlertCircle,
} from 'lucide-react';
import { getVoluntorSession, listEventRegistrations } from './voluntorStore';

const VoluntorDashboard = () => {
  const location = useLocation();
  const session = getVoluntorSession();
  const sessionEmail = session?.email || '';

  const myRegistrations = useMemo(
    () =>
      listEventRegistrations().filter(
        (item) => item.userEmail === sessionEmail
      ),
    [sessionEmail]
  );

  if (!session) {
    return (
      <Navigate
        to="/volunteer/login"
        replace
        state={{ redirectTo: '/volunteer/my-space' }}
      />
    );
  }

  return (
    <section className="space-y-10 pb-12">
      {/* ════════════════════════════════════════
          HEADER SECTION
      ════════════════════════════════════════ */}
      <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-slate-900/80 px-6 py-10 backdrop-blur-sm sm:px-10 sm:py-12">
        {/* Decorative Orbs */}
        <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-purple-500/15 blur-[80px]" />
        <div className="absolute -bottom-10 -left-10 h-40 w-40 rounded-full bg-fuchsia-500/15 blur-[60px]" />

        <div className="relative z-10">
          {/* Greeting */}
          <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              {/* Chip */}
              <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-purple-500/15 px-3 py-1 ring-1 ring-purple-400/30">
                <Sparkles size={12} className="text-yellow-400" />
                <span className="text-[11px] font-semibold tracking-wide text-purple-100">
                  Volunteer Dashboard
                </span>
              </div>

              <h1 className="mb-2 text-2xl font-extrabold text-white sm:text-3xl lg:text-4xl">
                Welcome back,{' '}
                <span className="bg-gradient-to-r from-purple-300 to-fuchsia-300 bg-clip-text text-transparent">
                  {session.name}!
                </span>
              </h1>
              <p className="max-w-xl text-sm text-gray-300 sm:text-base">
                Track your submitted registrations and continue participating in
                upcoming activities.
              </p>
            </div>

            {/* Quick Stats */}
            <div className="flex gap-3">
              <div className="rounded-xl bg-white/[0.06] px-5 py-3 text-center ring-1 ring-white/10">
                <strong className="block text-2xl font-extrabold text-white">
                  {myRegistrations.length}
                </strong>
                <span className="mt-0.5 block text-[11px] font-medium text-gray-400">
                  Registrations
                </span>
              </div>
              <div className="rounded-xl bg-purple-500/15 px-5 py-3 text-center ring-1 ring-purple-400/30">
                <strong className="block text-2xl font-extrabold text-white">
                  <Trophy size={24} className="mx-auto text-yellow-400" />
                </strong>
                <span className="mt-0.5 block text-[11px] font-medium text-purple-200">
                  Active
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ════════════════════════════════════════
          SUCCESS MESSAGE
      ════════════════════════════════════════ */}
      {location.state?.successMessage && (
        <div className="flex items-start gap-3 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-5 py-4">
          <CheckCircle2
            size={20}
            className="mt-0.5 shrink-0 text-emerald-400"
          />
          <div>
            <p className="font-semibold text-emerald-200">
              Registration Successful!
            </p>
            <p className="text-sm text-emerald-300/80">
              {location.state.successMessage}
            </p>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════
          PROFILE & SUMMARY CARDS
      ════════════════════════════════════════ */}
      <div className="grid gap-5 sm:grid-cols-2">
        {/* Profile Card */}
        <article className="group relative overflow-hidden rounded-2xl border border-white/10 bg-slate-900/80 p-6 backdrop-blur-sm transition-all duration-500 hover:border-purple-400/30 hover:bg-slate-800/90">
          <div className="absolute -right-8 -top-8 h-28 w-28 rounded-full bg-purple-500/10 blur-[50px] transition-all duration-500 group-hover:bg-purple-500/20" />

          <div className="relative z-10">
            <div className="mb-5 flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-500/20 ring-1 ring-purple-400/30">
                <UserCircle2 size={24} className="text-purple-300" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">
                  Volunteer Profile
                </h2>
                <p className="text-xs text-gray-400">Your account details</p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-3 rounded-xl bg-white/[0.04] px-4 py-3 ring-1 ring-white/[0.06]">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-500/15">
                  <UserCircle2 size={16} className="text-purple-300" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] font-medium uppercase tracking-wider text-gray-500">
                    Full Name
                  </p>
                  <p className="truncate font-semibold text-white">
                    {session.name}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 rounded-xl bg-white/[0.04] px-4 py-3 ring-1 ring-white/[0.06]">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-fuchsia-500/15">
                  <Mail size={16} className="text-fuchsia-300" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] font-medium uppercase tracking-wider text-gray-500">
                    Email
                  </p>
                  <p className="truncate font-semibold text-white">
                    {session.email}
                  </p>
                </div>
              </div>
            </div>

            <Link
              to="/volunteer/logout"
              className="group/btn mt-5 flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm font-semibold text-gray-300 transition-all duration-300 hover:border-red-400/30 hover:bg-red-500/10 hover:text-red-300"
            >
              <LogOut
                size={15}
                className="transition-transform duration-300 group-hover/btn:-translate-x-0.5"
              />
              Logout
            </Link>
          </div>
        </article>

        {/* Summary Card */}
        <article className="group relative overflow-hidden rounded-2xl border border-white/10 bg-slate-900/80 p-6 backdrop-blur-sm transition-all duration-500 hover:border-purple-400/30 hover:bg-slate-800/90">
          <div className="absolute -left-8 -bottom-8 h-28 w-28 rounded-full bg-fuchsia-500/10 blur-[50px] transition-all duration-500 group-hover:bg-fuchsia-500/20" />

          <div className="relative z-10">
            <div className="mb-5 flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-fuchsia-500/20 ring-1 ring-fuchsia-400/30">
                <ClipboardList size={24} className="text-fuchsia-300" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">
                  Registration Summary
                </h2>
                <p className="text-xs text-gray-400">Your activity overview</p>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="mb-5 grid grid-cols-2 gap-3">
              <div className="rounded-xl bg-white/[0.04] px-4 py-4 text-center ring-1 ring-white/[0.06]">
                <strong className="block text-2xl font-extrabold text-white">
                  {myRegistrations.length}
                </strong>
                <span className="mt-1 block text-[11px] font-medium text-gray-400">
                  Total Registrations
                </span>
              </div>
              <div className="rounded-xl bg-emerald-500/10 px-4 py-4 text-center ring-1 ring-emerald-500/30">
                <strong className="block text-2xl font-extrabold text-emerald-300">
                  {myRegistrations.length}
                </strong>
                <span className="mt-1 block text-[11px] font-medium text-emerald-400/80">
                  Active Events
                </span>
              </div>
            </div>

            <Link
              to="/volunteer/activities"
              className="group/btn relative flex w-full items-center justify-center gap-2 overflow-hidden rounded-xl px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-purple-500/20 transition-all duration-300 hover:shadow-purple-500/40 hover:scale-[1.02]"
            >
              <span className="absolute inset-0 bg-gradient-to-r from-purple-600 to-fuchsia-600 transition-all duration-300 group-hover/btn:brightness-110" />
              <span className="relative z-10">Register Another Activity</span>
              <ArrowRight
                size={15}
                className="relative z-10 transition-transform duration-300 group-hover/btn:translate-x-1"
              />
            </Link>
          </div>
        </article>
      </div>

      {/* ════════════════════════════════════════
          REGISTRATIONS LIST
      ════════════════════════════════════════ */}
      <div>
        {/* Section Header */}
        <div className="mb-6 flex items-center gap-3">
          <div className="h-px flex-1 bg-gradient-to-r from-purple-500/50 to-transparent" />
          <h2 className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-gray-200">
            <Heart size={14} className="text-pink-400" />
            My Registrations ({myRegistrations.length})
          </h2>
          <div className="h-px flex-1 bg-gradient-to-l from-purple-500/50 to-transparent" />
        </div>

        {myRegistrations.length > 0 ? (
          <div className="space-y-4">
            {myRegistrations.map((item, index) => (
              <article
                key={item.id}
                className="group relative overflow-hidden rounded-2xl border border-white/10 bg-slate-900/80 p-5 backdrop-blur-sm transition-all duration-500 hover:border-purple-400/30 hover:bg-slate-800/90 sm:p-6"
              >
                {/* Index Badge */}
                <span className="absolute -right-2 -top-4 text-7xl font-black text-white/[0.04] select-none">
                  0{index + 1}
                </span>

                <div className="relative z-10">
                  {/* Title Row */}
                  <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex items-start gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-purple-500/20 ring-1 ring-purple-400/30">
                        <Zap size={18} className="text-purple-300" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-white group-hover:text-purple-200 transition-colors duration-300">
                          {item.eventTitle}
                        </h3>
                        <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-gray-300">
                          <span className="flex items-center gap-1">
                            <Calendar size={12} className="text-purple-300" />
                            {item.eventDate}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock size={12} className="text-fuchsia-300" />
                            {item.eventTime}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Status Badge */}
                    <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 px-3 py-1 ring-1 ring-emerald-400/30">
                      <CheckCircle2 size={12} className="text-emerald-400" />
                      <span className="text-[11px] font-semibold text-emerald-300">
                        Registered
                      </span>
                    </div>
                  </div>

                  {/* Details Grid */}
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="flex items-center gap-3 rounded-xl bg-white/[0.04] px-4 py-3 ring-1 ring-white/[0.06]">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-cyan-500/15">
                        <Users size={14} className="text-cyan-300" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[10px] font-medium uppercase tracking-wider text-gray-500">
                          Team
                        </p>
                        <p className="truncate text-sm font-semibold text-white">
                          {item.teamName || 'Individual'}{' '}
                          <span className="text-gray-400">
                            ({item.teamSize} member{item.teamSize > 1 ? 's' : ''})
                          </span>
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 rounded-xl bg-white/[0.04] px-4 py-3 ring-1 ring-white/[0.06]">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-500/15">
                        <Sparkles size={14} className="text-amber-300" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[10px] font-medium uppercase tracking-wider text-gray-500">
                          Skills
                        </p>
                        <p className="truncate text-sm font-semibold text-white">
                          {item.skills || 'Not specified'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Bottom accent */}
                <div className="absolute bottom-0 left-0 h-[2px] w-0 bg-gradient-to-r from-purple-500 to-fuchsia-500 transition-all duration-500 group-hover:w-full" />
              </article>
            ))}
          </div>
        ) : (
          /* Empty State */
          <article className="relative overflow-hidden rounded-2xl border border-white/10 bg-slate-900/80 px-6 py-12 text-center backdrop-blur-sm">
            <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-purple-500/10 blur-[80px]" />

            <div className="relative z-10">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-purple-500/15 ring-1 ring-purple-400/30">
                <AlertCircle size={32} className="text-purple-300" />
              </div>
              <h2 className="mb-2 text-xl font-bold text-white">
                No Registrations Yet
              </h2>
              <p className="mx-auto mb-6 max-w-md text-sm text-gray-300">
                You haven't registered for any volunteering activity yet.
                Explore our upcoming events and make a difference in your
                community!
              </p>
              <Link
                to="/volunteer/activities"
                className="group/btn relative inline-flex items-center gap-2 overflow-hidden rounded-xl px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-purple-500/20 transition-all duration-300 hover:shadow-purple-500/40 hover:scale-[1.02]"
              >
                <span className="absolute inset-0 bg-gradient-to-r from-purple-600 to-fuchsia-600 transition-all duration-300 group-hover/btn:brightness-110" />
                <span className="relative z-10">Browse Activities</span>
                <ArrowRight
                  size={15}
                  className="relative z-10 transition-transform duration-300 group-hover/btn:translate-x-1"
                />
              </Link>
            </div>
          </article>
        )}
      </div>

      {/* ════════════════════════════════════════
          QUICK ACTIONS
      ════════════════════════════════════════ */}
      <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-slate-900/80 p-6 backdrop-blur-sm sm:p-8">
        <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-purple-500/15 blur-[60px]" />

        <div className="relative z-10 flex flex-col items-center justify-between gap-4 sm:flex-row">
          <div className="text-center sm:text-left">
            <h3 className="mb-1 text-lg font-bold text-white">
              Want to do more?
            </h3>
            <p className="text-sm text-gray-300">
              Explore more volunteering opportunities and expand your impact.
            </p>
          </div>
          <div className="flex flex-wrap justify-center gap-3">
            <Link
              to="/volunteer/activities"
              className="inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white ring-1 ring-white/20 transition-all duration-300 hover:bg-white/10 hover:ring-white/40"
            >
              <MapPin size={14} className="text-purple-300" />
              View Events
            </Link>
            <Link
              to="/volunteer"
              className="inline-flex items-center gap-2 rounded-xl bg-white/[0.06] px-5 py-2.5 text-sm font-semibold text-gray-200 ring-1 ring-white/10 transition-all duration-300 hover:bg-white/[0.1] hover:text-white"
            >
              <Sparkles size={14} className="text-yellow-400" />
              Home
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};

export default VoluntorDashboard;