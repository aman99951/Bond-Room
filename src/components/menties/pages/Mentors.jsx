import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
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
      transition: { staggerChildren: 0.1 }
    }
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 30, scale: 0.95 },
    visible: { opacity: 1, y: 0, scale: 1, transition: { type: "spring", stiffness: 100, damping: 15 } }
  };

  const contentVariants = {
    hidden: { opacity: 0, x: -10 },
    visible: { opacity: 1, x: 0, transition: { delay: 0.2 } }
  };

  return (
    <div className="min-h-screen bg-transparent p-4 sm:p-6 lg:p-8 relative">
      {/* Floating Sparkles Animation in Background */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-20">
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={i}
            animate={{
              y: [0, -100, 0],
              x: [0, Math.random() * 50 - 25, 0],
              opacity: [0.2, 0.5, 0.2],
              scale: [1, 1.2, 1]
            }}
            transition={{
              duration: 5 + i,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="absolute text-[#5D3699]"
            style={{
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`
            }}
          >
            <Sparkles size={24 + i * 4} />
          </motion.div>
        ))}
      </div>

      <div className="mx-auto max-w-7xl relative z-10">
        {/* Header Section */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="mb-10"
        >
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between bg-white/40 backdrop-blur-sm p-6 rounded-[2rem] border border-white/50 shadow-sm">
            <div className="flex items-start gap-5">
              <motion.div 
                whileHover={{ rotate: 15, scale: 1.1 }}
                className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[#5D3699] to-[#7c4dff] shadow-xl shadow-purple-500/20"
              >
                <Users className="h-8 w-8 text-white" />
              </motion.div>
              <div>
                <h1 className="text-3xl font-black tracking-tight text-[#111827] sm:text-4xl">
                  Curated Mentors
                </h1>
                <p className="mt-1.5 text-[#6b7280] font-semibold flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-purple-400 animate-pulse" />
                  Tailored guidance for your journey.
                  {loading && <Loader2 className="h-4 w-4 animate-spin text-[#5D3699]" />}
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-[#9ca3af] group-focus-within:text-[#5D3699] transition-colors" />
                <input 
                  type="text"
                  placeholder="Search by name or skill..."
                  value={searchTerm}
                  onChange={(e) => setSearchArea(e.target.value)}
                  className="w-full sm:w-72 pl-11 pr-4 py-3 rounded-2xl bg-white border border-[#e5e7eb] focus:border-[#5D3699] focus:ring-4 focus:ring-[#f5f3ff] outline-none transition-all text-sm shadow-sm"
                />
              </div>
              <motion.div 
                whileHover={{ scale: 1.05 }}
                className="flex items-center gap-2 self-start rounded-2xl bg-[#f5f3ff] px-5 py-3 border border-[#5D3699]/10 shadow-sm"
              >
                <CheckCircle2 className="h-4 w-4 text-[#5D3699]" />
                <span className="text-xs font-black text-[#5D3699] uppercase tracking-widest">AI Matching Active</span>
              </motion.div>
            </div>
          </div>
        </motion.div>

        {/* Error State */}
        <AnimatePresence>
          {(error || menteeError) && (
            <motion.div 
              initial={{ opacity: 0, height: 0, y: -20 }}
              animate={{ opacity: 1, height: 'auto', y: 0 }}
              exit={{ opacity: 0, height: 0, y: -20 }}
              className="mb-8 flex items-center gap-4 rounded-2xl bg-red-50 p-5 border border-red-100 shadow-sm"
            >
              <AlertCircle className="h-6 w-6 text-red-600 shrink-0" />
              <p className="font-bold text-red-700">{error || menteeError}</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Mentors Grid */}
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid gap-8 sm:grid-cols-2"
        >
          <AnimatePresence mode="popLayout">
            {paginatedMentorCards.map((m) => (
              <motion.div
                layout
                key={m.id || m.name}
                variants={cardVariants}
                whileHover={{ y: -10, boxShadow: "0 25px 50px -12px rgba(93, 54, 153, 0.15)" }}
                className={`group relative flex flex-col h-full overflow-hidden rounded-[2.5rem] bg-white p-8 shadow-sm border-2 transition-all duration-500 ${m.topMatch
                    ? 'border-[#5D3699]/30 ring-1 ring-[#5D3699]/5'
                    : 'border-transparent hover:border-[#5D3699]/20'
                  }`}
              >
                {/* Top Match Badge */}
                {m.topMatch && (
                  <motion.div 
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute right-8 top-8 z-20"
                  >
                    <span className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#5D3699] to-[#7c4dff] px-4 py-2 text-[11px] font-black text-white uppercase tracking-[0.15em] shadow-xl">
                      <Award className="h-4 w-4" />
                      Elite Match
                    </span>
                  </motion.div>
                )}

                <div className="flex gap-6 mb-8 items-start">
                  <div className="relative shrink-0">
                    <motion.div 
                      whileHover={{ rotate: 360, scale: 1.1 }}
                      transition={{ type: "spring", stiffness: 200, damping: 10 }}
                      className="h-24 w-24 overflow-hidden rounded-[2rem] bg-[#f5f3ff] ring-4 ring-white shadow-2xl transition-all duration-500 cursor-pointer"
                    >
                      {m.avatar ? (
                        <img src={m.avatar} alt={m.name} className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center">
                          <User className="h-10 w-10 text-[#5D3699]" />
                        </div>
                      )}
                    </motion.div>
                    <motion.div 
                      animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
                      transition={{ duration: 2, repeat: Infinity }}
                      className="absolute -bottom-1 -right-1 h-6 w-6 bg-emerald-500 rounded-full border-4 border-white shadow-lg" 
                    />
                  </div>

                  <motion.div variants={contentVariants} className="flex-1 min-w-0 pt-2">
                    <h3 className="text-2xl font-black text-[#111827] truncate group-hover:text-[#5D3699] transition-colors duration-300">
                      {m.name}
                    </h3>
                    
                    <div className="mt-2 flex flex-col gap-2.5">
                      {m.location && (
                        <div className="flex items-center gap-2 text-sm text-[#6b7280] font-bold">
                          <MapPin className="h-4 w-4 text-purple-400" />
                          <span className="truncate">{m.location}</span>
                        </div>
                      )}
                      {m.rating != null && (
                        <div className="flex items-center gap-3 bg-[#f5f3ff] self-start px-3 py-1 rounded-xl border border-[#5D3699]/5">
                          <div className="flex items-center gap-0.5">
                            {[...Array(5)].map((_, i) => (
                              <Star key={i} className={`h-3.5 w-3.5 ${i < Math.floor(m.rating) ? 'fill-amber-400 text-amber-400' : 'text-gray-200'}`} />
                            ))}
                          </div>
                          <span className="text-sm font-black text-[#111827]">{Number(m.rating).toFixed(1)}</span>
                          {m.reviews != null && <span className="text-[10px] font-bold text-[#9ca3af] uppercase tracking-tighter">({m.reviews} reviews)</span>}
                        </div>
                      )}
                    </div>
                  </motion.div>
                </div>

                <div className="flex flex-wrap gap-2.5 mb-8">
                  {m.tags.slice(0, 3).map((t, idx) => (
                    <motion.span 
                      key={t}
                      whileHover={{ scale: 1.1, backgroundColor: "#5D3699", color: "#fff" }}
                      className="px-4 py-1.5 text-[11px] font-black uppercase tracking-[0.1em] rounded-xl bg-[#f5f3ff] text-[#5D3699] border border-[#5D3699]/10 transition-colors cursor-default"
                    >
                      {t}
                    </motion.span>
                  ))}
                  {m.tags.length > 3 && (
                    <span className="text-xs font-bold text-[#9ca3af] self-center ml-1">+{m.tags.length - 3} Expertise</span>
                  )}
                </div>

                <p className="text-base leading-relaxed text-[#6b7280] mb-10 line-clamp-3 font-medium italic">
                  &quot;{m.blurb || "I'm dedicated to helping you unlock your full potential through structured guidance and real-world experience."}&quot;
                </p>

                <div className="mt-auto pt-8 border-t border-[#f3f4f6] flex items-center gap-4">
                  <motion.button
                    whileHover={{ x: -5 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      setSelectedMentorId(m.id);
                      navigate(m.id ? `/mentor-profile?mentorId=${m.id}` : '/mentor-profile');
                    }}
                    className="flex-1 flex items-center justify-center gap-2 py-4 rounded-2xl bg-gray-50 text-[#6b7280] text-sm font-black uppercase tracking-widest hover:bg-gray-100 hover:text-[#111827] transition-all border border-transparent hover:border-gray-200"
                  >
                    <User className="h-4 w-4" />
                    Bio
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02, x: 5 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      setSelectedMentorId(m.id);
                      navigate(m.id ? `/mentor-details?mentorId=${m.id}` : '/mentor-details');
                    }}
                    className={`flex-[1.8] flex items-center justify-center gap-3 py-4 rounded-2xl text-sm font-black uppercase tracking-[0.15em] transition-all shadow-xl ${m.topMatch
                        ? 'bg-gradient-to-r from-[#5D3699] to-[#7c4dff] text-white shadow-purple-500/30'
                        : 'bg-white text-[#5D3699] border-2 border-[#5D3699]/20 hover:border-[#5D3699] shadow-sm'
                      }`}
                  >
                    <Calendar className="h-4 w-4" />
                    Meet Now
                    <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </motion.button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>

        {/* Empty State */}
        {!loading && filteredMentors.length === 0 && (
          <motion.div 
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            className="py-24 text-center bg-white/60 backdrop-blur-md rounded-[3rem] border-2 border-dashed border-[#5D3699]/20 shadow-inner"
          >
            <div className="inline-flex h-24 w-24 items-center justify-center rounded-full bg-[#f5f3ff] mb-8 animate-bounce">
              <Search className="h-12 w-12 text-[#5D3699]/40" />
            </div>
            <h3 className="text-2xl font-black text-[#111827] mb-3">Searching far and wide...</h3>
            <p className="text-[#6b7280] mb-10 max-w-sm mx-auto font-medium">We couldn't find an exact match. Try adjusting your search or explore our full roster.</p>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setSearchArea('')}
              className="px-12 py-4 rounded-[1.5rem] bg-[#5D3699] text-white font-black uppercase tracking-widest shadow-2xl shadow-purple-500/40"
            >
              Reset Search
            </motion.button>
          </motion.div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-16 flex flex-col items-center gap-6"
          >
            <div className="flex items-center gap-3 bg-white p-2 rounded-2xl shadow-lg border border-gray-100">
              <motion.button
                whileTap={{ scale: 0.8 }}
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="h-12 w-12 flex items-center justify-center rounded-xl bg-gray-50 text-[#6b7280] disabled:opacity-30 hover:bg-[#f5f3ff] hover:text-[#5D3699] transition-all"
              >
                <ChevronLeft className="h-6 w-6" />
              </motion.button>

              <div className="flex items-center gap-2 px-2">
                {Array.from({ length: totalPages }, (_, index) => index + 1).map((page) => (
                  <motion.button
                    key={page}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => handlePageChange(page)}
                    className={`h-12 w-12 rounded-xl text-sm font-black transition-all ${currentPage === page
                        ? 'bg-[#5D3699] text-white shadow-xl shadow-purple-500/30'
                        : 'bg-white text-[#6b7280] hover:text-[#5D3699]'
                      }`}
                  >
                    {page}
                  </motion.button>
                ))}
              </div>

              <motion.button
                whileTap={{ scale: 0.8 }}
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="h-12 w-12 flex items-center justify-center rounded-xl bg-gray-50 text-[#6b7280] disabled:opacity-30 hover:bg-[#f5f3ff] hover:text-[#5D3699] transition-all"
              >
                <ChevronRight className="h-6 w-6" />
              </motion.button>
            </div>
            <p className="text-[11px] font-black text-[#9ca3af] uppercase tracking-[0.3em]">
              Perspective {currentPage} of {totalPages}
            </p>
          </motion.div>
        )}

        {/* Premium CTA */}
        <motion.div 
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-20 group relative rounded-[3rem] bg-gradient-to-br from-[#5D3699] to-[#2d1b4d] p-1 shadow-2xl overflow-hidden"
        >
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10" />
          <div className="relative bg-[#1a1133]/90 backdrop-blur-xl rounded-[2.9rem] p-10 lg:p-14 flex flex-col sm:flex-row items-center justify-between gap-10 overflow-hidden">
            <motion.div 
              animate={{ rotate: 360 }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
              className="absolute -right-20 -bottom-20 h-64 w-64 bg-purple-500/10 rounded-full blur-[80px]"
            />
            
            <div className="flex flex-col sm:flex-row items-center gap-8 z-10 text-center sm:text-left">
              <motion.div 
                whileHover={{ scale: 1.1, rotate: [0, -10, 10, 0] }}
                className="h-20 w-20 flex items-center justify-center rounded-3xl bg-white/10 border border-white/20 shadow-2xl"
              >
                <Sparkles className="h-10 w-10 text-purple-200" />
              </motion.div>
              <div>
                <h2 className="text-3xl font-black text-white mb-2">Refine Your Path</h2>
                <p className="text-purple-200/80 font-bold text-lg max-w-md">Update your assessment to unlock even more precise mentor matches.</p>
              </div>
            </div>
            
            <motion.button
              whileHover={{ scale: 1.05, boxShadow: "0 0 30px rgba(124, 77, 255, 0.4)" }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/needs-assessment')}
              className="relative z-10 w-full sm:w-auto px-12 py-5 rounded-[1.5rem] bg-white text-[#5D3699] font-black text-xl shadow-2xl transition-all"
            >
              Start Now
            </motion.button>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Mentors;
