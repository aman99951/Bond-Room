import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion as Motion, AnimatePresence } from 'framer-motion';
import { menteeApi } from '../../../apis/api/menteeApi';
import { setSelectedMentorId } from '../../../apis/api/storage';
import { useMenteeData } from '../../../apis/apihook/useMenteeData';
import {
  Sparkles,
  MapPin,
  Star,
  Calendar,
  ChevronLeft,
  ChevronRight,
  User,
  Award,
  ArrowRight,
  CheckCircle2,
  Users,
  Search,
  Loader2,
  AlertCircle
} from 'lucide-react';

const PAGE_SIZE = 4;

const normalizeList = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.results)) return payload.results;
  return [];
};

const getMentorName = (mentor) => {
  const name = `${mentor?.first_name || ''} ${mentor?.last_name || ''}`.trim();
  return name || mentor?.name || '';
};

const toNumberOrNull = (value) => {
  if (value === null || value === undefined || value === '') return null;
  const num = Number(value);
  return Number.isFinite(num) ? num : null;
};

const mapMentorToCard = (entry) => {
  const mentor = entry?.mentor || entry || {};
  const rating = toNumberOrNull(mentor?.average_rating);

  return {
    id: mentor?.id ?? null,
    name: getMentorName(mentor),
    location: mentor?.city_state || mentor?.location || '',
    tags: Array.isArray(mentor?.care_areas)
      ? mentor.care_areas
      : Array.isArray(mentor?.tags)
        ? mentor.tags
        : [],
    rating,
    reviews:
      mentor?.reviews_count ??
      entry?.total_reviews ??
      null,
    blurb: mentor?.bio || mentor?.blurb || '',
    topMatch: Boolean(entry?.top_match ?? mentor?.top_match),
    avatar: mentor?.avatar || mentor?.profile_photo || '',
  };
};

const Mentors = () => {
  const navigate = useNavigate();
  const { mentee, loading: menteeLoading, error: menteeError } = useMenteeData();
  const [mentors, setMentors] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchArea] = useState('');

  useEffect(() => {
    let cancelled = false;

    const loadMentors = async () => {
      if (!mentee?.id) {
        if (!menteeLoading) {
          setMentors([]);
          setLoading(false);
        }
        return;
      }

      setLoading(true);
      setError('');

      try {
        const recommendedResponse = await menteeApi.getRecommendedMentors({ mentee_id: mentee.id });
        const recommendedList = normalizeList(recommendedResponse);
        const cards = recommendedList.map((item) => mapMentorToCard(item));
        if (!cancelled) setMentors(cards);
      } catch (err) {
        if (!cancelled) {
          setError(err?.message || 'Unable to load recommendations right now.');
          setMentors([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadMentors();
    return () => {
      cancelled = true;
    };
  }, [mentee?.id, menteeLoading]);

  const filteredMentors = useMemo(() => {
    if (!searchTerm.trim()) return mentors;
    const term = searchTerm.toLowerCase();
    return mentors.filter(m => 
      m.name.toLowerCase().includes(term) || 
      m.tags.some(t => t.toLowerCase().includes(term))
    );
  }, [mentors, searchTerm]);

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(filteredMentors.length / PAGE_SIZE)),
    [filteredMentors.length]
  );

  const paginatedMentorCards = useMemo(() => {
    const startIndex = (currentPage - 1) * PAGE_SIZE;
    return filteredMentors.slice(startIndex, startIndex + PAGE_SIZE);
  }, [filteredMentors, currentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [filteredMentors.length]);

  const handlePageChange = (page) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.05 }
    }
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.3 } }
  };

  return (
    <div className="min-h-screen bg-transparent p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-start gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#5D3699] shadow-lg shadow-[#5D3699]/20 transition-transform hover:scale-105">
                <Users className="h-7 w-7 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold tracking-tight text-[#111827] sm:text-4xl">
                  Recommended Mentors
                </h1>
                <p className="mt-1.5 text-[#6b7280] font-medium flex items-center gap-2">
                  Tailored guidance for your journey.
                  {loading && <Loader2 className="h-3 w-3 animate-spin text-[#5D3699]" />}
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative group">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#9ca3af] group-focus-within:text-[#5D3699] transition-colors" />
                <input 
                  type="text"
                  placeholder="Search mentors..."
                  value={searchTerm}
                  onChange={(e) => setSearchArea(e.target.value)}
                  className="w-full sm:w-64 pl-10 pr-4 py-2.5 rounded-xl bg-white border border-[#e5e7eb] focus:border-[#5D3699] focus:ring-4 focus:ring-[#f5f3ff] outline-none transition-all text-sm shadow-sm"
                />
              </div>
              <div className="flex items-center gap-2 self-start rounded-xl bg-[#f5f3ff] px-4 py-2.5 border border-[#5D3699]/10">
                <CheckCircle2 className="h-4 w-4 text-[#5D3699]" />
                <span className="text-xs font-bold text-[#5D3699] uppercase tracking-wider">AI Analysis</span>
              </div>
            </div>
          </div>
        </div>

        {/* Error State */}
        {(error || menteeError) && (
          <div className="mb-8 flex items-center gap-4 rounded-xl bg-red-50 p-4 border border-red-100 shadow-sm">
            <AlertCircle className="h-5 w-5 text-red-600 shrink-0" />
            <p className="text-sm font-semibold text-red-700">{error || menteeError}</p>
          </div>
        )}

        {/* Mentors Grid / Empty State */}
        <Motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid gap-6 sm:grid-cols-2"
        >
          <AnimatePresence mode="popLayout">
            {paginatedMentorCards.map((m) => (
              <Motion.div
                layout
                key={m.id || m.name}
                variants={cardVariants}
                whileHover={{ y: -4 }}
                className={`group relative flex flex-col h-full overflow-hidden rounded-3xl bg-white p-6 shadow-sm border transition-all duration-300 ${m.topMatch
                    ? 'border-[#5D3699]/30 ring-1 ring-[#5D3699]/10'
                    : 'border-[#e5e7eb] hover:border-[#5D3699]/30 hover:shadow-md'
                  }`}
              >
                {/* Top Match Badge */}
                {m.topMatch && (
                  <div className="absolute right-6 top-6">
                    <span className="inline-flex items-center gap-1.5 rounded-lg bg-[#5D3699] px-2.5 py-1 text-[10px] font-bold text-white uppercase tracking-wider shadow-md">
                      <Award className="h-3 w-3" />
                      Top Match
                    </span>
                  </div>
                )}

                <div className="flex gap-5 mb-6">
                  <div className="relative shrink-0">
                    <div className="h-20 w-20 overflow-hidden rounded-2xl bg-[#f5f3ff] ring-4 ring-white shadow-md">
                      {m.avatar ? (
                        <img src={m.avatar} alt={m.name} className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center">
                          <User className="h-8 w-8 text-[#5D3699]" />
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex-1 min-w-0">
                    <h3 className="text-xl font-bold text-[#111827] truncate group-hover:text-[#5D3699] transition-colors">
                      {m.name}
                    </h3>
                    
                    <div className="mt-1.5 flex flex-col gap-2">
                      {m.location && (
                        <div className="flex items-center gap-1.5 text-sm text-[#6b7280]">
                          <MapPin className="h-3.5 w-3.5 text-[#9ca3af]" />
                          <span className="truncate">{m.location}</span>
                        </div>
                      )}
                      {m.rating != null && (
                        <div className="flex items-center gap-2 self-start">
                          <div className="flex items-center gap-0.5">
                            {[...Array(5)].map((_, i) => (
                              <Star key={i} className={`h-3 w-3 ${i < Math.floor(m.rating) ? 'fill-[#f59e0b] text-[#f59e0b]' : 'text-[#e5e7eb]'}`} />
                            ))}
                          </div>
                          <span className="text-xs font-bold text-[#111827]">{Number(m.rating).toFixed(1)}</span>
                          {m.reviews != null && <span className="text-[10px] font-medium text-[#9ca3af]">({m.reviews})</span>}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 mb-6">
                  {m.tags.slice(0, 3).map((t) => (
                    <span key={t} className="px-3 py-1 text-[11px] font-semibold rounded-lg bg-[#f5f3ff] text-[#5D3699] border border-[#5D3699]/5">
                      {t}
                    </span>
                  ))}
                  {m.tags.length > 3 && (
                    <span className="text-[10px] font-medium text-[#9ca3af] self-center">+{m.tags.length - 3}</span>
                  )}
                </div>

                <p className="text-sm leading-relaxed text-[#6b7280] mb-8 line-clamp-2 font-medium">
                  {m.blurb || "Experienced mentor ready to support your growth and personal development goals."}
                </p>

                <div className="mt-auto pt-6 border-t border-[#f3f4f6] flex items-center gap-3">
                  <button
                    onClick={() => {
                      setSelectedMentorId(m.id);
                      navigate(m.id ? `/mentor-profile?mentorId=${m.id}` : '/mentor-profile');
                    }}
                    className="flex-1 px-4 py-2.5 rounded-xl border border-[#e5e7eb] text-[#6b7280] text-sm font-semibold hover:bg-[#f9fafb] hover:text-[#111827] transition-all"
                  >
                    Profile
                  </button>
                  <button
                    onClick={() => {
                      setSelectedMentorId(m.id);
                      navigate(m.id ? `/mentor-details?mentorId=${m.id}` : '/mentor-details');
                    }}
                    className={`flex-[1.5] flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all shadow-sm ${m.topMatch
                        ? 'bg-[#5D3699] text-white hover:bg-[#4a2b7a]'
                        : 'bg-white text-[#5D3699] border border-[#5D3699]/20 hover:bg-[#f5f3ff]'
                      }`}
                  >
                    <Calendar className="h-4 w-4" />
                    Schedule
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              </Motion.div>
            ))}
          </AnimatePresence>
        </Motion.div>

        {/* Empty State (Only if not loading) */}
        {!loading && filteredMentors.length === 0 && (
          <div className="py-20 text-center bg-white rounded-3xl border border-[#e5e7eb] shadow-sm">
            <div className="inline-flex h-20 w-20 items-center justify-center rounded-full bg-[#f5f3ff] mb-6">
              <Search className="h-10 w-10 text-[#5D3699]/40" />
            </div>
            <h3 className="text-xl font-bold text-[#111827] mb-2">No matching mentors</h3>
            <p className="text-[#6b7280] mb-8 max-w-sm mx-auto">Try adjusting your search or browse all recommendations.</p>
            <button
              onClick={() => setSearchArea('')}
              className="px-8 py-3 rounded-xl bg-[#5D3699] text-white font-bold shadow-lg shadow-[#5D3699]/20 hover:bg-[#4a2b7a] transition-all"
            >
              Clear Search
            </button>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-12 flex flex-col items-center gap-4">
            <div className="flex items-center gap-2">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="h-10 w-10 flex items-center justify-center rounded-xl bg-white border border-[#e5e7eb] text-[#6b7280] disabled:opacity-40 shadow-sm hover:border-[#5D3699]/30 transition-all"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>

              <div className="flex items-center gap-1.5">
                {Array.from({ length: totalPages }, (_, index) => index + 1).map((page) => (
                  <button
                    key={page}
                    onClick={() => handlePageChange(page)}
                    className={`h-10 w-10 rounded-xl text-sm font-bold transition-all shadow-sm ${currentPage === page
                        ? 'bg-[#5D3699] text-white shadow-[#5D3699]/20'
                        : 'bg-white text-[#6b7280] border border-[#e5e7eb] hover:bg-[#f5f3ff] hover:text-[#5D3699]'
                      }`}
                  >
                    {page}
                  </button>
                ))}
              </div>

              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="h-10 w-10 flex items-center justify-center rounded-xl bg-white border border-[#e5e7eb] text-[#6b7280] disabled:opacity-40 shadow-sm hover:border-[#5D3699]/30 transition-all"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
            <p className="text-[10px] font-bold text-[#9ca3af] uppercase tracking-widest">
              Page {currentPage} of {totalPages}
            </p>
          </div>
        )}

        {/* Assessment CTA */}
        <div className="mt-16 rounded-3xl bg-[#f5f3ff] border border-[#5D3699]/10 p-8 text-center sm:text-left">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-8">
            <div className="flex flex-col sm:flex-row items-center gap-6">
              <div className="h-16 w-16 flex items-center justify-center rounded-2xl bg-[#5D3699] shadow-lg shadow-[#5D3699]/20">
                <Sparkles className="h-8 w-8 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-[#111827]">Need better matches?</h2>
                <p className="text-[#6b7280] font-medium mt-1">Update your preferences to find the perfect mentor.</p>
              </div>
            </div>
            <button
              onClick={() => navigate('/needs-assessment')}
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-white text-[#5D3699] font-bold border border-[#5D3699]/20 shadow-sm hover:bg-[#5D3699] hover:text-white transition-all"
            >
              Retake Assessment
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Mentors;

