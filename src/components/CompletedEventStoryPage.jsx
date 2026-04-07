import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Calendar, CheckCircle2, Images, MapPin, Users, X } from 'lucide-react';
import { menteeApi } from '../apis/api/menteeApi';

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
  const navigate = useNavigate();
  const { eventId } = useParams();
  const [eventItem, setEventItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeImageIndex, setActiveImageIndex] = useState(null);
  const [bondRoomParticipants, setBondRoomParticipants] = useState(null);

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

  if (loading) {
    return (
      <div className="min-h-screen bg-[linear-gradient(180deg,#f8f3ff_0%,#ffffff_55%,#f6f0ff_100%)] p-4 sm:p-8">
        <div className="mx-auto max-w-5xl rounded-2xl border border-[#e8dcff] bg-white p-10 text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-[#d1fae5] border-t-[#15803d]" />
          <p className="mt-3 text-sm text-[#6b7280]">Loading completed event story...</p>
        </div>
      </div>
    );
  }

  if (error || !eventItem?.id) {
    return (
      <div className="min-h-screen bg-[linear-gradient(180deg,#f8f3ff_0%,#ffffff_55%,#f6f0ff_100%)] p-4 sm:p-8">
        <div className="mx-auto max-w-5xl rounded-2xl border border-red-200 bg-white p-10 text-center">
          <p className="text-sm text-red-600">{error || 'Completed event not found.'}</p>
          <button
            type="button"
            onClick={() => navigate('/volunteer')}
            className="mt-4 inline-flex items-center gap-2 rounded-full border border-[#e7d8ff] bg-white px-4 py-2 text-xs font-semibold text-[#5D3699] hover:bg-[#f8f4ff]"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to Volunteer
          </button>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      className="min-h-screen bg-[linear-gradient(180deg,#f8f3ff_0%,#ffffff_55%,#f6f0ff_100%)] p-4 sm:p-8"
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
    >
      <div className="mx-auto w-full">
        <button
          type="button"
          onClick={() => navigate('/volunteer')}
          className="inline-flex items-center gap-2 rounded-full border border-[#e7d8ff] bg-white px-4 py-2 text-xs font-semibold text-[#5D3699] hover:bg-[#f8f4ff]"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to Volunteer
        </button>

        <section className="mt-5 w-full overflow-hidden rounded-3xl border border-[#dcfce7] bg-[linear-gradient(165deg,#ffffff_0%,#f3fbf6_45%,#ecfdf3_100%)] p-5 shadow-[0_30px_70px_-44px_rgba(15,23,42,0.75)] sm:p-7">
          <div className="mb-5">
            <p className="inline-flex items-center gap-1 rounded-full bg-[#dcfce7] px-3 py-1 text-[11px] font-semibold text-[#166534]">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Completed Event Story
            </p>
            <h1 className="mt-3 text-2xl font-semibold text-[#111827] sm:text-3xl">{eventItem.title}</h1>
            <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-[#4b5563]">
              <span className="inline-flex items-center gap-1"><Calendar className="h-3.5 w-3.5 text-[#15803d]" />{formatDate(getCompletedEventDate(eventItem))}</span>
              <span className="inline-flex items-center gap-1"><MapPin className="h-3.5 w-3.5 text-[#15803d]" />{eventItem.location || 'Location not provided'}</span>
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-[1.45fr_1fr]">
            <div className="rounded-2xl border border-[#d1fae5] bg-white/90 p-4">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-[#15803d]">Brief</p>
              <p className="mt-2 whitespace-pre-line text-sm leading-7 text-[#1f2937]">{storyBrief}</p>
            </div>

            <div className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-2">
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
                    {bondRoomParticipants === null ? '—' : bondRoomParticipants}
                  </p>
                  <p className="mt-1 text-xs text-[#166534]">Volunteer</p>
                </div>
              </div>

              <div className="rounded-2xl border border-[#d1fae5] bg-white/95 p-4">
                <p className="inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wide text-[#15803d]">
                  <Images className="h-3.5 w-3.5" />
                  Event Gallery
                </p>
                {galleryImages.length ? (
                  <div className="mt-3 grid grid-cols-2 gap-2">
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
                          className="h-44 w-full object-cover transition-transform duration-500 hover:scale-105 2xl:h-56"
                          loading="lazy"
                        />
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="mt-2 text-xs text-[#6b7280]">No gallery images were added for this event.</p>
                )}
              </div>
            </div>
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
  );
};

export default CompletedEventStoryPage;
