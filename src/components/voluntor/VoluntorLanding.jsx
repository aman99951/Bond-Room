import { Link } from 'react-router-dom';
import {
  ArrowUpRight,
  CalendarDays,
  HeartHandshake,
  Sparkles,
  UsersRound,
  ArrowRight,
  Clock,
  MapPin,
  TrendingUp,
  Zap,
  Target,
  Users,
} from 'lucide-react';
import { streamHighlights, volunteerEvents } from './voluntorData';
import { getVoluntorSession } from './voluntorStore';

const VoluntorLanding = () => {
  const featuredEvents = volunteerEvents.slice(0, 3);
  const session = getVoluntorSession();

  return (
    <section className="space-y-20 pb-12 sm:space-y-28">
      {/* ════════════════════════════════════════
          HERO SECTION
      ════════════════════════════════════════ */}
      <div className="flex flex-col items-start gap-10 lg:flex-row lg:items-center lg:gap-16">
        {/* ── Hero Copy ── */}
        <div className="flex-1 space-y-6">
          {/* Chip */}
          <div className="inline-flex items-center gap-2 rounded-full bg-purple-500/15 px-4 py-1.5 ring-1 ring-purple-400/30">
            <Sparkles size={14} className="text-yellow-400" />
            <span className="text-xs font-semibold tracking-wide text-purple-100 sm:text-sm">
              Volunteering stream is live
            </span>
          </div>

          {/* Heading */}
          <h1 className="text-4xl font-extrabold leading-[1.1] tracking-tight sm:text-5xl lg:text-6xl">
            <span className="text-white">Modern Volunteer Hub</span>
            <br />
            <span className="bg-gradient-to-r from-purple-300 to-fuchsia-300 bg-clip-text text-transparent">
              for Teen Action Teams
            </span>
          </h1>

          {/* Description */}
          <p className="max-w-xl text-base leading-relaxed text-gray-200 sm:text-lg">
            Create campaigns, register participants, and track community impact
            across cancer care events, marine cleanup drives, and elder-home
            activities.
          </p>

          {/* CTA Row */}
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <Link
              to="/volunteer/activities"
              className="group relative inline-flex items-center gap-2 overflow-hidden rounded-xl px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-purple-500/25 transition-all duration-300 hover:shadow-purple-500/40 hover:scale-[1.03] sm:text-base"
            >
              <span className="absolute inset-0 bg-gradient-to-r from-purple-600 to-fuchsia-600 transition-all duration-300 group-hover:brightness-110" />
              <span className="relative z-10">Explore Activities</span>
              <ArrowUpRight
                size={16}
                className="relative z-10 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
              />
            </Link>

            {!session && (
              <Link
                to="/volunteer/register"
                className="inline-flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold text-white ring-1 ring-white/25 transition-all duration-300 hover:bg-white/10 hover:ring-white/40 sm:text-base"
              >
                Create Volunteer Account
              </Link>
            )}
          </div>
        </div>

        {/* ── Hero Side Panel ── */}
        <aside className="flex w-full flex-col gap-4 lg:w-[380px] lg:shrink-0">
          {/* Impact Snapshot Card */}
          <article className="group relative overflow-hidden rounded-2xl border border-white/10 bg-slate-900/80 p-6 backdrop-blur-sm transition-all duration-500 hover:border-purple-400/30 hover:bg-slate-800/90">
            <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-purple-500/15 blur-3xl transition-all duration-500 group-hover:bg-purple-500/25" />

            <div className="relative z-10">
              <div className="mb-4 flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-500/20">
                  <TrendingUp size={16} className="text-purple-300" />
                </div>
                <h3 className="text-sm font-bold uppercase tracking-wider text-white">
                  Quick Impact Snapshot
                </h3>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-xl bg-white/10 p-4 text-center ring-1 ring-white/10">
                  <strong className="block text-2xl font-extrabold text-white sm:text-3xl">
                    {volunteerEvents.length}
                  </strong>
                  <span className="mt-1 block text-xs font-medium text-gray-300">
                    Upcoming events
                  </span>
                </div>
                <div className="rounded-xl bg-white/10 p-4 text-center ring-1 ring-white/10">
                  <strong className="block text-2xl font-extrabold text-white sm:text-3xl">
                    240+
                  </strong>
                  <span className="mt-1 block text-xs font-medium text-gray-300">
                    Volunteer seats
                  </span>
                </div>
              </div>
            </div>
          </article>

          {/* Next Mission Card */}
          <article className="group relative overflow-hidden rounded-2xl border border-white/10 bg-slate-900/80 p-6 backdrop-blur-sm transition-all duration-500 hover:border-purple-400/30 hover:bg-slate-800/90">
            <div className="absolute left-0 top-0 h-full w-1 bg-gradient-to-b from-purple-400 to-fuchsia-400 opacity-80" />

            <div className="relative z-10">
              <p className="mb-1 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-purple-200">
                <Zap size={12} className="text-yellow-400" />
                Next featured mission
              </p>
              <h4 className="mb-2 text-lg font-bold text-white">
                {volunteerEvents[0]?.title}
              </h4>
              <div className="mb-4 flex flex-wrap items-center gap-3 text-xs text-gray-100">
                <span className="flex items-center gap-1">
                  <CalendarDays size={12} className="text-purple-300" />
                  {volunteerEvents[0]?.date}
                </span>
                <span className="flex items-center gap-1">
                  <Clock size={12} className="text-purple-300" />
                  {volunteerEvents[0]?.time}
                </span>
              </div>
              <Link
                to={`/volunteer/activities/${volunteerEvents[0]?.id}/register`}
                className="group/link inline-flex items-center gap-1.5 text-sm font-semibold text-purple-300 transition-colors duration-300 hover:text-white"
              >
                Open Registration
                <ArrowUpRight
                  size={14}
                  className="transition-transform duration-300 group-hover/link:-translate-y-0.5 group-hover/link:translate-x-0.5"
                />
              </Link>
            </div>
          </article>
        </aside>
      </div>

      {/* ════════════════════════════════════════
          STREAM HIGHLIGHTS
      ════════════════════════════════════════ */}
      <div>
        <div className="mb-8 flex items-center gap-3">
          <div className="h-px flex-1 bg-gradient-to-r from-purple-500/50 to-transparent" />
          <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-gray-200">
            Impact Streams
          </h2>
          <div className="h-px flex-1 bg-gradient-to-l from-purple-500/50 to-transparent" />
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {streamHighlights.map((item, index) => (
            <article
              key={item.title}
              className="group relative overflow-hidden rounded-2xl border border-white/10 bg-slate-900/80 p-6 backdrop-blur-sm transition-all duration-500 hover:border-purple-400/30 hover:bg-slate-800/90 hover:-translate-y-1"
            >
              {/* Index Number */}
              <span className="absolute -right-2 -top-4 text-7xl font-black text-white/[0.06] transition-all duration-500 group-hover:text-purple-400/[0.15] select-none">
                0{index + 1}
              </span>

              <div className="relative z-10">
                <div className="mb-4 flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-gradient-to-r from-purple-400 to-fuchsia-400" />
                  <span className="text-[10px] font-bold uppercase tracking-widest text-purple-200">
                    Stream 0{index + 1}
                  </span>
                </div>

                <h2 className="mb-3 text-lg font-bold text-white transition-colors duration-300 group-hover:text-purple-200">
                  {item.title}
                </h2>
                <p className="text-sm leading-relaxed text-gray-200 transition-colors duration-300 group-hover:text-gray-100">
                  {item.body}
                </p>
              </div>

              <div className="absolute bottom-0 left-0 h-[2px] w-0 bg-gradient-to-r from-purple-500 to-fuchsia-500 transition-all duration-500 group-hover:w-full" />
            </article>
          ))}
        </div>
      </div>

      {/* ════════════════════════════════════════
          STATS BAR
      ════════════════════════════════════════ */}
      <div className="grid gap-4 sm:grid-cols-3">
        {[
          {
            icon: CalendarDays,
            label: `${volunteerEvents.length} Events`,
            desc: 'Live volunteering activities',
            bg: 'bg-purple-500/20',
          },
          {
            icon: UsersRound,
            label: 'Teen Groups',
            desc: 'Collaborative event teams',
            bg: 'bg-fuchsia-500/20',
          },
          {
            icon: HeartHandshake,
            label: 'Social Impact',
            desc: 'Hospitals, marine cleanup, elder homes',
            bg: 'bg-violet-500/20',
          },
        ].map(({ icon: Icon, label, desc, bg }) => (
          <article
            key={label}
            className="group flex items-start gap-4 rounded-2xl border border-white/10 bg-slate-900/80 p-5 backdrop-blur-sm transition-all duration-500 hover:border-purple-400/30 hover:bg-slate-800/90"
          >
            <div
              className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${bg} transition-all duration-300 group-hover:scale-110`}
            >
              <Icon size={20} className="text-white" />
            </div>
            <div className="min-w-0">
              <strong className="block text-sm font-bold text-white sm:text-base">
                {label}
              </strong>
              <span className="mt-0.5 block text-xs text-gray-200 sm:text-sm">
                {desc}
              </span>
            </div>
          </article>
        ))}
      </div>

      {/* ════════════════════════════════════════
          FEATURED EVENTS GRID
      ════════════════════════════════════════ */}
      <div>
        <div className="mb-8 flex items-end justify-between">
          <div>
            <p className="mb-1 text-xs font-bold uppercase tracking-widest text-purple-300">
              Upcoming
            </p>
            <h2 className="text-2xl font-extrabold text-white sm:text-3xl">
              Featured Events
            </h2>
          </div>
          <Link
            to="/volunteer/activities"
            className="group hidden items-center gap-1.5 text-sm font-semibold text-gray-100 transition-colors duration-300 hover:text-purple-300 sm:flex"
          >
            View all
            <ArrowRight
              size={14}
              className="transition-transform duration-300 group-hover:translate-x-1"
            />
          </Link>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {featuredEvents.map((event) => (
            <Link
              key={event.id}
              to={`/volunteer/activities/${event.id}/register`}
              className="group relative overflow-hidden rounded-2xl border border-white/10 bg-slate-900/80 backdrop-blur-sm transition-all duration-500 hover:border-purple-400/30 hover:bg-slate-800/90 hover:-translate-y-1 hover:shadow-xl hover:shadow-purple-500/10"
            >
              {/* Image */}
              <div className="relative aspect-[16/10] overflow-hidden">
                <img
                  src={event.image}
                  alt={event.title}
                  className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/50 to-transparent opacity-80" />

                {/* Date badge */}
                <div className="absolute left-3 top-3 flex items-center gap-1.5 rounded-lg bg-black/70 px-2.5 py-1 text-[11px] font-semibold text-white backdrop-blur-md ring-1 ring-white/20">
                  <CalendarDays size={11} className="text-purple-300" />
                  {event.date}
                </div>

                {/* Arrow */}
                <div className="absolute bottom-3 right-3 flex h-8 w-8 items-center justify-center rounded-full bg-purple-500/40 text-white opacity-0 backdrop-blur-md ring-1 ring-purple-300/40 transition-all duration-500 group-hover:opacity-100">
                  <ArrowUpRight size={14} />
                </div>
              </div>

              {/* Content */}
              <div className="p-4 sm:p-5">
                <h3 className="mb-2 text-base font-bold text-white transition-colors duration-300 group-hover:text-purple-200 sm:text-lg">
                  {event.title}
                </h3>
                <div className="flex flex-wrap items-center gap-3 text-xs text-gray-200">
                  {event.time && (
                    <span className="flex items-center gap-1">
                      <Clock size={11} className="text-purple-300" />
                      {event.time}
                    </span>
                  )}
                  {event.location && (
                    <span className="flex items-center gap-1">
                      <MapPin size={11} className="text-purple-300" />
                      {event.location}
                    </span>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Mobile View All */}
        <div className="mt-6 flex justify-center sm:hidden">
          <Link
            to="/volunteer/activities"
            className="inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-purple-100 ring-1 ring-purple-400/30 transition-all duration-300 hover:bg-purple-500/10 hover:text-white"
          >
            View All Activities
            <ArrowRight size={14} />
          </Link>
        </div>
      </div>

      {/* ════════════════════════════════════════
          BOTTOM CTA
      ════════════════════════════════════════ */}
      {!session && (
        <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-slate-900/80 p-8 text-center sm:p-12">
          <div className="absolute -left-20 -top-20 h-60 w-60 rounded-full bg-purple-500/20 blur-[80px]" />
          <div className="absolute -bottom-20 -right-20 h-60 w-60 rounded-full bg-fuchsia-500/20 blur-[80px]" />

          <div className="relative z-10">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-purple-500/20 ring-1 ring-purple-400/30">
              <Users size={28} className="text-purple-300" />
            </div>
            <h2 className="mb-3 text-2xl font-extrabold text-white sm:text-3xl">
              Ready to Make a Difference?
            </h2>
            <p className="mx-auto mb-6 max-w-md text-sm text-gray-200 sm:text-base">
              Join thousands of teen volunteers creating real impact in their
              communities. Sign up takes less than 2 minutes.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <Link
                to="/volunteer/register"
                className="group relative inline-flex items-center gap-2 overflow-hidden rounded-xl px-7 py-3 text-sm font-semibold text-white shadow-lg shadow-purple-500/25 transition-all duration-300 hover:shadow-purple-500/40 hover:scale-[1.03]"
              >
                <span className="absolute inset-0 bg-gradient-to-r from-purple-600 to-fuchsia-600 transition-all duration-300 group-hover:brightness-110" />
                <Target size={16} className="relative z-10" />
                <span className="relative z-10">Get Started Free</span>
              </Link>
              <Link
                to="/volunteer/activities"
                className="inline-flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold text-white ring-1 ring-white/25 transition-all duration-300 hover:bg-white/10 hover:ring-white/40"
              >
                Browse Events
              </Link>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default VoluntorLanding;
