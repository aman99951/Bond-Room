import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Calendar, CheckCircle2, Images, MapPin, Users, X } from 'lucide-react';
import { menteeApi } from '../apis/api/menteeApi';
import logo from './assets/Logo.svg';

const DEFAULT_COMPLETION_BRIEF = `Day 1 began with preparing the space and creating a welcoming environment for everyone. Through ice-breaker conversations, storytelling, music, and interactive games, we focused on building comfort, connection, and joy among the participants.

On Day 2, we carried forward the same energy by marking our presence, hosting a lively dance session, engaging the children with fun activities, and organizing a magical performance that brought excitement to the room. As a special highlight, we gifted guitars to the children, an effort to inspire creativity and leave them with something meaningful.

These two days were not just about activities but about creating smiles, strengthening bonds, and building memories that will last.`;

const formatDate = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Date unavailable';
  return date.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
};

const normalizeVolunteerEvent = (event) => ({
  ...event,
  image: event?.image || '',
  date: event?.date || '',
  completed_on: event?.completed_on || '',
  joined_count: Number(event?.joined_count || 0),
  completion_brief: String(event?.completion_brief || '').trim(),
  gallery_images: Array.isArray(event?.gallery_images)
    ? event.gallery_images.map((item) => String(item || '').trim()).filter(Boolean)
    : [],
});

const getCompletedEventDate = (event) => String(event?.completed_on || event?.date || '');

const CompletedEventStoryPage = () => {
  const { eventId } = useParams();
  const [eventItem, setEventItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeImageIndex, setActiveImageIndex] = useState(null);
  const [bondRoomParticipants, setBondRoomParticipants] = useState(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const closeMobile = useCallback(() => setMobileOpen(false), []);
  const NAV = [
    { label: 'Home', href: '/' },
    { label: 'About', href: '/about' },
    { label: 'Volunteer', href: '/volunteer' },
    { label: 'Safety', href: '/#safety' },
    { label: 'Stories', href: '/#stories' },
  ];

  useEffect(() => {
    let cancelled = false;
    const loadEvent = async () => {
      setLoading(true);
      setError('');
      try {
        const payload = await menteeApi.getPublicVolunteerEventById(eventId);
        if (cancelled) return;
        setEventItem(normalizeVolunteerEvent(payload || {}));
      } catch (err) {
        if (!cancelled) {
          setEventItem(null);
          setError(err?.message || 'Unable to load completed event story.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    if (eventId) {
      loadEvent();
    } else {
      setLoading(false);
      setError('Invalid completed event.');
    }
    return () => {
      cancelled = true;
    };
  }, [eventId]);

  useEffect(() => {
    let cancelled = false;
    const loadBondRoomParticipants = async () => {
      try {
        const payload = await menteeApi.getPublicVolunteerParticipantCount();
        if (cancelled) return;
        setBondRoomParticipants(Number(payload?.count || 0));
      } catch {
        if (!cancelled) setBondRoomParticipants(null);
      }
    };
    loadBondRoomParticipants();
    return () => {
      cancelled = true;
    };
  }, []);

  const galleryImages = (() => {
    if (!eventItem) return [];
    if (Array.isArray(eventItem.gallery_images) && eventItem.gallery_images.length) return eventItem.gallery_images;
    return eventItem.image ? [eventItem.image] : [];
  })();

  useEffect(() => {
    if (activeImageIndex === null) return undefined;
    const onEsc = (event) => {
      if (event.key === 'Escape') setActiveImageIndex(null);
      if (event.key === 'ArrowRight') {
        setActiveImageIndex((prev) => {
          if (prev === null) return prev;
          return (prev + 1) % galleryImages.length;
        });
      }
      if (event.key === 'ArrowLeft') {
        setActiveImageIndex((prev) => {
          if (prev === null) return prev;
          return (prev - 1 + galleryImages.length) % galleryImages.length;
        });
      }
    };
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onEsc);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', onEsc);
    };
  }, [activeImageIndex, galleryImages.length]);

  const storyBrief = useMemo(() => {
    const brief = String(eventItem?.completion_brief || '').trim();
    return brief || DEFAULT_COMPLETION_BRIEF;
  }, [eventItem]);

  const joinedCount = useMemo(() => Number(eventItem?.joined_count || eventItem?.seats || 0), [eventItem]);

  const topBar = (
    <>
      <header className="theme-v-header fixed top-0 inset-x-0 z-50">
        <div className="mx-auto flex h-[60px] w-full max-w-[1920px] items-center justify-between px-4 sm:px-6 lg:px-10 xl:px-12 2xl:px-16 min-[2200px]:h-[84px] min-[2200px]:px-16 min-[2500px]:px-20">
          <Link to="/" className="flex flex-col items-center leading-none group">
            <img src={logo} alt="Bond Room" className="theme-v-logo h-10 w-auto object-contain transition-transform group-hover:scale-105 2xl:h-12 min-[2200px]:h-14" />
            <span className="theme-v-tagline mt-0.5 block text-[8px] leading-tight tracking-wide sm:text-[9px] 2xl:text-[11px] min-[2200px]:text-[13px]">
              Bridging Old and New Destinies
            </span>
          </Link>
          <nav className="hidden items-center gap-0.5 md:flex 2xl:gap-1.5 min-[2200px]:gap-2">
            {NAV.map((n) => (
              n.href.includes('#') ? (
                <a key={n.label} href={n.href} className="theme-v-nav-link rounded-lg px-3 py-1.5 text-[13px] font-medium 2xl:px-4 2xl:py-2 2xl:text-[15px] min-[2200px]:px-5 min-[2200px]:py-2.5 min-[2200px]:text-[17px]">{n.label}</a>
              ) : (
                <Link key={n.label} to={n.href} className="theme-v-nav-link rounded-lg px-3 py-1.5 text-[13px] font-medium 2xl:px-4 2xl:py-2 2xl:text-[15px] min-[2200px]:px-5 min-[2200px]:py-2.5 min-[2200px]:text-[17px]">{n.label}</Link>
              )
            ))}
          </nav>
          <div className="hidden items-center gap-2 md:flex 2xl:gap-3 min-[2200px]:gap-4">
            <Link to="/donate" className="theme-v-cta rounded-lg px-3.5 py-1.5 text-[13px] font-semibold transition-all hover:scale-105 2xl:px-4.5 2xl:py-2 2xl:text-[15px] min-[2200px]:px-5 min-[2200px]:py-2.5 min-[2200px]:text-[17px]">Donate</Link>
            <Link to="/login?source=volunteer" className="theme-v-cta rounded-lg px-4 py-1.5 text-[13px] font-semibold shadow-md shadow-[#2D1A4F]/30 transition-all hover:scale-105 hover:shadow-[#2D1A4F]/45 2xl:px-5 2xl:py-2 2xl:text-[15px] min-[2200px]:px-6 min-[2200px]:py-2.5 min-[2200px]:text-[17px]">Log in</Link>
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
                  <a key={n.label} href={n.href} onClick={closeMobile} className="rounded-lg px-3 py-2.5 text-sm font-medium text-[#5F6B81] transition hover:bg-[#EDE3FF] hover:text-[#5D3699]">{n.label}</a>
                ) : (
                  <Link key={n.label} to={n.href} onClick={closeMobile} className="rounded-lg px-3 py-2.5 text-sm font-medium text-[#5F6B81] transition hover:bg-[#EDE3FF] hover:text-[#5D3699]">{n.label}</Link>
                )
              ))}
              <Link to="/donate" onClick={closeMobile} className="rounded-lg px-3 py-2.5 text-sm font-medium text-[#5D3699] transition hover:bg-[#EDE3FF]">Donate</Link>
              <Link to="/login?source=volunteer" onClick={closeMobile} className="rounded-lg px-3 py-2.5 text-sm font-medium text-[#5F6B81] transition hover:bg-[#EDE3FF] hover:text-[#5D3699]">Log in</Link>
            </nav>
            <div className="border-t border-[#EDE3FF] p-3">
              <Link to="/register?source=event-flow" onClick={closeMobile} className="block rounded-lg bg-[#fdd253] px-4 py-2.5 text-center text-sm font-bold text-[#1f2937] shadow-md shadow-[#fdd253]/30">Mentee Sign Up</Link>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );

  if (loading) {
    return (
      <>
        {topBar}
        <div className="theme-v-page min-h-screen p-4 pt-[86px] sm:p-8 sm:pt-[90px]">
          <div className="mx-auto max-w-5xl rounded-2xl border border-[#e8dcff] bg-white p-10 text-center">
            <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-[#d1fae5] border-t-[#15803d]" />
            <p className="mt-3 text-sm text-[#6b7280]">Loading completed event story...</p>
          </div>
        </div>
      </>
    );
  }

  if (error || !eventItem?.id) {
    return (
      <>
        {topBar}
        <div className="theme-v-page min-h-screen p-4 pt-[86px] sm:p-8 sm:pt-[90px]">
          <div className="mx-auto max-w-5xl rounded-2xl border border-red-200 bg-white p-10 text-center">
            <p className="text-sm text-red-600">{error || 'Completed event not found.'}</p>
            <button
              type="button"
              onClick={() => navigate('/volunteer')}
              className="theme-v-back-btn mt-4 inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Back to Volunteer
            </button>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      {topBar}
      <motion.div
        className="theme-v-page min-h-screen p-4 pt-[86px] sm:p-8 sm:pt-[90px]"
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
      >
      <div className="mx-auto w-full">
        <section className="theme-v-hero mt-5 w-full overflow-hidden rounded-3xl p-5 sm:p-7">
          <div className="mb-5">
            <p className="inline-flex items-center gap-1 rounded-full bg-[#FDD253]/20 px-3 py-1 text-[11px] font-semibold text-[#FDD253]">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Completed Event Story
            </p>
            <h1 className="theme-v-title mt-3 text-2xl font-semibold sm:text-3xl">{eventItem.title}</h1>
            <div className="theme-v-subtitle mt-2 flex flex-wrap items-center gap-3 text-xs">
              <span className="inline-flex items-center gap-1"><Calendar className="h-3.5 w-3.5 text-[#FDD253]" />{formatDate(getCompletedEventDate(eventItem))}</span>
              <span className="inline-flex items-center gap-1"><MapPin className="h-3.5 w-3.5 text-[#FDD253]" />{eventItem.location || 'Location not provided'}</span>
            </div>
          </div>

          <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1.6fr)_minmax(300px,1fr)]">
            <div className="rounded-2xl border border-[#d1fae5] bg-white/90 p-4 sm:p-5">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-[#15803d]">Story Brief</p>
              <p className="mt-2 whitespace-pre-line text-sm leading-7 text-[#1f2937]">{storyBrief}</p>
            </div>

            <aside className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
              <div className="rounded-2xl border border-[#bbf7d0] bg-[#f0fdf4] p-4">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-[#15803d]">Participants</p>
                <p className="mt-2 inline-flex items-center gap-2 text-3xl font-bold text-[#166534]">
                  <Users className="h-6 w-6" />
                  {joinedCount}
                </p>
                <p className="mt-1 text-xs text-[#166534]">Joined this event</p>
              </div>
              <div className="rounded-2xl border border-[#d1fae5] bg-white/95 p-4">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-[#15803d]">Bond Room Participants</p>
                <p className="mt-2 inline-flex items-center gap-2 text-3xl font-bold text-[#166534]">
                  <Users className="h-6 w-6" />
                  {bondRoomParticipants === null ? 'N/A' : bondRoomParticipants}
                </p>
                <p className="mt-1 text-xs text-[#166534]">Volunteer</p>
              </div>
            </aside>
          </div>

          <div className="mt-4 rounded-2xl border border-[#d1fae5] bg-white/95 p-4 sm:p-5">
            <p className="inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wide text-[#15803d]">
              <Images className="h-3.5 w-3.5" />
              Event Gallery
            </p>
            {galleryImages.length ? (
              <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {galleryImages.map((imgSrc, index) => (
                  <button
                    key={`${imgSrc}-${index}`}
                    type="button"
                    onClick={() => setActiveImageIndex(index)}
                    className="overflow-hidden rounded-xl border border-[#d1fae5] text-left"
                  >
                    <img
                      src={imgSrc}
                      alt={`${eventItem.title} gallery ${index + 1}`}
                      className="h-52 w-full object-cover transition-transform duration-500 hover:scale-105"
                      loading="lazy"
                    />
                  </button>
                ))}
              </div>
            ) : (
              <p className="mt-2 text-xs text-[#6b7280]">No gallery images were added for this event.</p>
            )}
          </div>
        </section>
      </div>

      {activeImageIndex !== null && galleryImages[activeImageIndex] ? (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/80 p-4">
          <button
            type="button"
            className="absolute inset-0"
            aria-label="Close image preview"
            onClick={() => setActiveImageIndex(null)}
          />
          <div className="relative z-10 max-h-[90vh] max-w-6xl overflow-hidden rounded-2xl border border-white/20 bg-black">
            <button
              type="button"
              onClick={() => setActiveImageIndex(null)}
              className="absolute right-3 top-3 z-20 inline-flex h-9 w-9 items-center justify-center rounded-full bg-black/45 text-white hover:bg-black/65"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>
            {galleryImages.length > 1 ? (
              <>
                <button
                  type="button"
                  onClick={() =>
                    setActiveImageIndex((prev) => (prev === null ? prev : (prev - 1 + galleryImages.length) % galleryImages.length))
                  }
                  className="absolute left-3 top-1/2 z-20 inline-flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-black/45 text-white hover:bg-black/65"
                  aria-label="Previous image"
                >
                  <ArrowLeft className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setActiveImageIndex((prev) => (prev === null ? prev : (prev + 1) % galleryImages.length))
                  }
                  className="absolute right-3 top-1/2 z-20 inline-flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-black/45 text-white hover:bg-black/65"
                  aria-label="Next image"
                >
                  <ArrowLeft className="h-4 w-4 rotate-180" />
                </button>
              </>
            ) : null}
            <img
              src={galleryImages[activeImageIndex]}
              alt={`${eventItem.title} large preview ${activeImageIndex + 1}`}
              className="max-h-[90vh] w-full object-contain"
            />
          </div>
        </div>
      ) : null}
      </motion.div>
    </>
  );
};

export default CompletedEventStoryPage;


