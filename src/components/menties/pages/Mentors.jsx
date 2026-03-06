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
  MessageCircle,
  Search,
  Filter,
  Loader2
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
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4 } }
  };

  return (
    <div className="min-h-screen bg-[#f8faff] p-4 sm:p-6 lg:p-8 relative overflow-hidden">
      {/* Background Decorative Blobs */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-100/50 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-100/50 rounded-full blur-[120px] pointer-events-none" />

      <div className="mx-auto max-w-7xl relative z-10">
        {/* Header Section */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-10"
        >
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-start gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[#5D3699] to-[#7c4dff] shadow-xl shadow-purple-500/20">
                <Users className="h-7 w-7 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-black tracking-tight text-gray-900 sm:text-4xl">
                  Curated Mentors
                </h1>
                <p className="mt-1.5 text-gray-500 font-medium max-w-md">
                  We've hand-picked these mentors based on your profile and recent assessments.
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative group">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 group-focus-within:text-[#5D3699] transition-colors" />
                <input 
                  type="text"
                  placeholder="Search by name or expertise..."
                  value={searchTerm}
                  onChange={(e) => setSearchArea(e.target.value)}
                  className="w-full sm:w-72 pl-10 pr-4 py-3 rounded-2xl bg-white border border-gray-200 focus:border-[#5D3699] focus:ring-4 focus:ring-purple-50 outline-none transition-all shadow-sm"
                />
              </div>
              <div className="hidden sm:flex items-center gap-2 self-start rounded-2xl bg-emerald-50 px-5 py-3 border border-emerald-100">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider">AI Matching Active</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Error State */}
        {(error || menteeError) && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-8 flex items-center gap-4 rounded-2xl bg-red-50 p-5 border border-red-100 shadow-sm"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-100">
              <AlertCircle className="h-5 w-5 text-red-600" />
            </div>
            <p className="font-semibold text-red-700">{error || menteeError}</p>
          </motion.div>
        )}

        {/* Loading State */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 bg-white/50 backdrop-blur-sm rounded-[2.5rem] border border-gray-100 shadow-sm">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
              className="mb-4"
            >
              <Loader2 className="h-10 w-10 text-[#5D3699]" />
            </motion.div>
            <p className="text-lg font-bold text-gray-900 tracking-tight">Finding your perfect match...</p>
            <p className="text-sm text-gray-500 mt-1">Our AI is analyzing {mentors.length} mentors</p>
          </div>
        ) : (
          <>
            <motion.div 
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="grid gap-6 sm:grid-cols-2"
            >
              <AnimatePresence mode="popLayout">
                {paginatedMentorCards.map((m) => (
                  <motion.div
                    layout
                    key={m.id || m.name}
                    variants={cardVariants}
                    whileHover={{ y: -8 }}
                    className={`group relative flex flex-col h-full overflow-hidden rounded-[2rem] bg-white p-6 shadow-sm border-2 transition-all duration-300 ${m.topMatch
                        ? 'border-emerald-100 shadow-emerald-500/10'
                        : 'border-transparent hover:border-purple-100 hover:shadow-purple-500/10'
                      }`}
                  >
                    {/* Header: Avatar & Basic Info */}
                    <div className="flex gap-5 mb-6">
                      <div className="relative">
                        <div className="h-20 w-20 overflow-hidden rounded-2xl bg-gray-50 ring-4 ring-white shadow-lg transition-transform group-hover:scale-105 duration-300">
                          {m.avatar ? (
                            <img src={m.avatar} alt={m.name} className="h-full w-full object-cover" />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center bg-purple-50">
                              <User className="h-8 w-8 text-[#5D3699]" />
                            </div>
                          )}
                        </div>
                        {m.topMatch && (
                          <div className="absolute -top-3 -right-3 h-8 w-8 bg-emerald-500 rounded-full flex items-center justify-center border-2 border-white shadow-lg">
                            <Sparkles className="h-4 w-4 text-white" />
                          </div>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-xl font-bold text-gray-900 truncate group-hover:text-[#5D3699] transition-colors">
                            {m.name}
                          </h3>
                        </div>
                        
                        <div className="flex flex-col gap-1.5">
                          {m.location && (
                            <div className="flex items-center gap-1.5 text-sm text-gray-500 font-medium">
                              <MapPin className="h-3.5 w-3.5 text-purple-400" />
                              <span className="truncate">{m.location}</span>
                            </div>
                          )}
                          {m.rating != null && (
                            <div className="flex items-center gap-2 bg-amber-50 self-start px-2 py-0.5 rounded-lg border border-amber-100">
                              <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                              <span className="text-sm font-bold text-amber-700">{Number(m.rating).toFixed(1)}</span>
                              {m.reviews != null && (
                                <span className="text-[10px] font-bold text-amber-600 uppercase tracking-tighter">({m.reviews} reviews)</span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Tags Area */}
                    <div className="mb-6">
                      <div className="flex flex-wrap gap-2">
                        {m.tags.slice(0, 3).map((t) => (
                          <span key={t} className="px-3 py-1 text-[11px] font-bold uppercase tracking-wider rounded-lg bg-gray-50 text-gray-600 group-hover:bg-purple-50 group-hover:text-[#5D3699] transition-colors border border-gray-100 group-hover:border-purple-100">
                            {t}
                          </span>
                        ))}
                        {m.tags.length > 3 && (
                          <span className="px-2 py-1 text-[11px] font-bold text-gray-400">+{m.tags.length - 3}</span>
                        )}
                      </div>
                    </div>

                    {/* Bio */}
                    <p className="text-sm leading-relaxed text-gray-600 mb-8 line-clamp-3 font-medium">
                      {m.blurb || "This mentor is eager to share their experience and help you navigate your journey."}
                    </p>

                    {/* Footer: Action Buttons */}
                    <div className="mt-auto pt-6 border-t border-gray-50 flex items-center gap-3">
                      <motion.button
                        whileTap={{ scale: 0.95 }}
                        onClick={() => {
                          setSelectedMentorId(m.id);
                          navigate(m.id ? `/mentor-profile?mentorId=${m.id}` : '/mentor-profile');
                        }}
                        className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-gray-50 text-gray-700 text-sm font-bold hover:bg-gray-100 transition-colors border border-gray-100"
                      >
                        <User className="h-4 w-4" />
                        Profile
                      </motion.button>
                      <motion.button
                        whileTap={{ scale: 0.95 }}
                        onClick={() => {
                          setSelectedMentorId(m.id);
                          navigate(m.id ? `/mentor-details?mentorId=${m.id}` : '/mentor-details');
                        }}
                        className={`flex-[1.5] flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold shadow-lg transition-all ${m.topMatch
                            ? 'bg-[#5D3699] text-white shadow-purple-500/20 hover:bg-[#4a2b7a]'
                            : 'bg-white text-[#5D3699] border-2 border-purple-100 hover:border-purple-200'
                          }`}
                      >
                        <Calendar className="h-4 w-4" />
                        Schedule
                        <ArrowRight className="h-4 w-4" />
                      </motion.button>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>

            {/* Empty State */}
            {filteredMentors.length === 0 && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="py-20 text-center bg-white rounded-[2.5rem] border-2 border-dashed border-gray-200"
              >
                <div className="inline-flex h-20 w-20 items-center justify-center rounded-full bg-purple-50 mb-6">
                  <Search className="h-10 w-10 text-purple-300" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">No matching mentors</h3>
                <p className="text-gray-500 mb-8 max-w-sm mx-auto">We couldn't find any mentors matching "{searchTerm}". Try another search or reset filters.</p>
                <button
                  onClick={() => setSearchArea('')}
                  className="px-8 py-3 rounded-2xl bg-[#5D3699] text-white font-bold shadow-xl shadow-purple-500/20 hover:scale-105 transition-transform"
                >
                  Clear Search
                </button>
              </motion.div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-12 flex flex-col items-center gap-6">
                <div className="flex items-center gap-3">
                  <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="h-12 w-12 flex items-center justify-center rounded-2xl bg-white border border-gray-200 text-gray-600 disabled:opacity-30 shadow-sm hover:border-purple-200 hover:text-[#5D3699] transition-all"
                  >
                    <ChevronLeft className="h-6 w-6" />
                  </motion.button>

                  <div className="flex items-center gap-2">
                    {Array.from({ length: totalPages }, (_, index) => index + 1).map((page) => (
                      <motion.button
                        key={page}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => handlePageChange(page)}
                        className={`h-12 w-12 rounded-2xl font-bold transition-all shadow-sm ${currentPage === page
                            ? 'bg-[#5D3699] text-white shadow-purple-500/20'
                            : 'bg-white text-gray-500 border border-gray-200 hover:border-purple-200'
                          }`}
                      >
                        {page}
                      </motion.button>
                    ))}
                  </div>

                  <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="h-12 w-12 flex items-center justify-center rounded-2xl bg-white border border-gray-200 text-gray-600 disabled:opacity-30 shadow-sm hover:border-purple-200 hover:text-[#5D3699] transition-all"
                  >
                    <ChevronRight className="h-6 w-6" />
                  </motion.button>
                </div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-[0.2em]">
                  Page {currentPage} of {totalPages} • {filteredMentors.length} total mentors
                </p>
              </div>
            )}

            {/* Recommendation CTA */}
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="mt-16 bg-gradient-to-r from-[#5D3699] to-[#7c4dff] rounded-[2.5rem] p-8 lg:p-12 text-white relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-[80px] -mr-32 -mt-32" />
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-purple-400/20 rounded-full blur-[60px] -ml-24 -mb-24" />
              
              <div className="flex flex-col lg:flex-row items-center justify-between gap-8 relative z-10">
                <div className="flex flex-col lg:flex-row items-center gap-6 text-center lg:text-left">
                  <div className="h-20 w-20 flex items-center justify-center rounded-3xl bg-white/20 backdrop-blur-md border border-white/20">
                    <Sparkles className="h-10 w-10 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl lg:text-3xl font-black mb-2">Need even better matches?</h2>
                    <p className="text-purple-100 font-medium max-w-md">Retake our comprehensive assessment to update your preferences and find the perfect mentor.</p>
                  </div>
                </div>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => navigate('/needs-assessment')}
                  className="px-10 py-4 rounded-2xl bg-white text-[#5D3699] font-black text-lg shadow-xl hover:shadow-2xl transition-all"
                >
                  Start Assessment
                </motion.button>
              </div>
            </motion.div>
          </>
        )}
      </div>
    </div>
  );
};

export default Mentors;
