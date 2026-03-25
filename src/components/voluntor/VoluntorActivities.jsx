import { Link } from 'react-router-dom';
import {
  Calendar,
  Clock3,
  MapPin,
  Users,
  UserRound,
  ArrowUpRight,
  Sparkles,
} from 'lucide-react';
import { volunteerEvents } from './voluntorData';

const formatDate = (value) => {
  const parsed = new Date(`${value}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleDateString('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};

const streamColors = {
  'Healthcare Support': {
    bg: 'bg-rose-500/20',
    text: 'text-rose-200',
    ring: 'ring-rose-400/40',
    dot: 'bg-rose-400',
  },
  'Cancer Care': {
    bg: 'bg-rose-500/20',
    text: 'text-rose-200',
    ring: 'ring-rose-400/40',
    dot: 'bg-rose-400',
  },
  'Marine Cleanup': {
    bg: 'bg-cyan-500/20',
    text: 'text-cyan-200',
    ring: 'ring-cyan-400/40',
    dot: 'bg-cyan-400',
  },
  'Ocean Conservation': {
    bg: 'bg-cyan-500/20',
    text: 'text-cyan-200',
    ring: 'ring-cyan-400/40',
    dot: 'bg-cyan-400',
  },
  'Elder Home': {
    bg: 'bg-amber-500/20',
    text: 'text-amber-200',
    ring: 'ring-amber-400/40',
    dot: 'bg-amber-400',
  },
  'Elder Care': {
    bg: 'bg-amber-500/20',
    text: 'text-amber-200',
    ring: 'ring-amber-400/40',
    dot: 'bg-amber-400',
  },
  default: {
    bg: 'bg-purple-500/20',
    text: 'text-purple-200',
    ring: 'ring-purple-400/40',
    dot: 'bg-purple-400',
  },
};

const getStreamStyle = (stream) => streamColors[stream] || streamColors.default;

const VoluntorActivities = () => {
  return (
    <section className="space-y-12 pb-12">
      {/* ════════════════════════════════════════
          HEADER SECTION
      ════════════════════════════════════════ */}
      <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-slate-900/80 px-6 py-10 backdrop-blur-sm sm:px-10 sm:py-14">
        <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-purple-500/15 blur-[80px]" />
        <div className="absolute -bottom-10 -left-10 h-40 w-40 rounded-full bg-fuchsia-500/15 blur-[60px]" />

        <div className="relative z-10 mx-auto max-w-3xl text-center">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full bg-purple-500/15 px-4 py-1.5 ring-1 ring-purple-400/30">
            <Sparkles size={14} className="text-yellow-400" />
            <span className="text-xs font-semibold tracking-wide text-purple-100 sm:text-sm">
              Volunteering Stream
            </span>
          </div>

          <h1 className="mb-4 text-3xl font-extrabold text-white sm:text-4xl lg:text-5xl">
            Teen Volunteer{' '}
            <span className="bg-gradient-to-r from-purple-300 to-fuchsia-300 bg-clip-text text-transparent">
              Activities
            </span>
          </h1>

          <p className="mx-auto max-w-2xl text-sm leading-relaxed text-gray-200 sm:text-base">
            Browse upcoming social impact events and register your group. Each
            activity includes date, time, location, and a registration form for
            volunteer details.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-6">
            {[
              { icon: Calendar, label: `${volunteerEvents.length} Events` },
              { icon: Users, label: 'Open Slots' },
              { icon: MapPin, label: 'Multiple Locations' },
            ].map(({ icon: Icon, label }) => (
              <div
                key={label}
                className="flex items-center gap-2 text-sm text-gray-100"
              >
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-purple-500/20">
                  <Icon size={14} className="text-purple-300" />
                </div>
                <span className="font-medium">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ════════════════════════════════════════
          EVENTS GRID
      ════════════════════════════════════════ */}
      <div>
        <div className="mb-6 flex items-center gap-3">
          <div className="h-px flex-1 bg-gradient-to-r from-purple-500/50 to-transparent" />
          <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-gray-200">
            All Activities ({volunteerEvents.length})
          </h2>
          <div className="h-px flex-1 bg-gradient-to-l from-purple-500/50 to-transparent" />
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {volunteerEvents.map((event) => {
            const style = getStreamStyle(event.stream);

            return (
              <article
                key={event.id}
                className="group relative flex flex-col overflow-hidden rounded-2xl border border-white/10 bg-slate-900/80 backdrop-blur-sm transition-all duration-500 hover:border-purple-400/30 hover:bg-slate-800/90 hover:-translate-y-1 hover:shadow-xl hover:shadow-purple-500/10"
              >
                {/* ── Image ── */}
                <div className="relative aspect-[16/10] overflow-hidden">
                  <img
                    src={event.image}
                    alt={event.title}
                    className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/50 to-transparent opacity-80" />

                  {/* Stream Badge */}
                  <div
                    className={`absolute left-3 top-3 flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider backdrop-blur-md ring-1 ${style.bg} ${style.text} ${style.ring}`}
                  >
                    <div
                      className={`h-1.5 w-1.5 rounded-full ${style.dot}`}
                    />
                    {event.stream}
                  </div>

                  {/* Hover Arrow */}
                  <div className="absolute bottom-3 right-3 flex h-8 w-8 items-center justify-center rounded-full bg-purple-500/40 text-white opacity-0 backdrop-blur-md ring-1 ring-purple-300/40 transition-all duration-500 group-hover:opacity-100">
                    <ArrowUpRight size={14} />
                  </div>
                </div>

                {/* ── Body ── */}
                <div className="flex flex-1 flex-col p-5">
                  {/* Title */}
                  <h2 className="mb-2 text-lg font-bold text-white transition-colors duration-300 group-hover:text-purple-200">
                    {event.title}
                  </h2>

                  {/* Description */}
                  <p className="mb-4 line-clamp-3 text-sm leading-relaxed text-gray-200">
                    {event.description}
                  </p>

                  {/* ── Meta Info ── */}
                  <div className="mb-5 space-y-2">
                    {[
                      {
                        icon: Calendar,
                        value: formatDate(event.date),
                        iconColor: 'text-purple-300',
                      },
                      {
                        icon: Clock3,
                        value: event.time,
                        iconColor: 'text-fuchsia-300',
                      },
                      {
                        icon: MapPin,
                        value: event.location,
                        iconColor: 'text-cyan-300',
                      },
                      {
                        icon: Users,
                        value: `${event.seats} volunteer slots`,
                        iconColor: 'text-emerald-300',
                      },
                      {
                        icon: UserRound,
                        value: `Organized by ${event.organizer}`,
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
                        <span className="text-gray-100 leading-snug">
                          {value}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Spacer */}
                  <div className="mt-auto" />

                  {/* CTA Button */}
                  <Link
                    to={`/volunteer/activities/${event.id}/register`}
                    className="group/btn relative flex w-full items-center justify-center gap-2 overflow-hidden rounded-xl px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-purple-500/20 transition-all duration-300 hover:shadow-purple-500/40 hover:scale-[1.02]"
                  >
                    <span className="absolute inset-0 bg-gradient-to-r from-purple-600 to-fuchsia-600 transition-all duration-300 group-hover/btn:brightness-110" />
                    <span className="relative z-10">
                      Open Registration Form
                    </span>
                    <ArrowUpRight
                      size={15}
                      className="relative z-10 transition-transform duration-300 group-hover/btn:-translate-y-0.5 group-hover/btn:translate-x-0.5"
                    />
                  </Link>
                </div>

                {/* Bottom accent line */}
                <div className="absolute bottom-0 left-0 h-[2px] w-0 bg-gradient-to-r from-purple-500 to-fuchsia-500 transition-all duration-500 group-hover:w-full" />
              </article>
            );
          })}
        </div>
      </div>

      {/* ════════════════════════════════════════
          BOTTOM INFO BAR
      ════════════════════════════════════════ */}
      <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-slate-900/80 p-6 backdrop-blur-sm sm:p-8">
        <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-purple-500/15 blur-[60px]" />

        <div className="relative z-10 flex flex-col items-center justify-between gap-4 sm:flex-row">
          <div className="text-center sm:text-left">
            <h3 className="mb-1 text-lg font-bold text-white">
              Can't find the right activity?
            </h3>
            <p className="text-sm text-gray-200">
              New events are added every week. Check back soon or create your
              own volunteer campaign.
            </p>
          </div>
          <Link
            to="/volunteer/my-space"
            className="inline-flex shrink-0 items-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold text-white ring-1 ring-white/20 transition-all duration-300 hover:bg-white/10 hover:ring-white/40"
          >
            Go to My Space
            <ArrowUpRight size={14} />
          </Link>
        </div>
      </div>
    </section>
  );
};

export default VoluntorActivities;