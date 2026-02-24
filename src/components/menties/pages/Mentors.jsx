import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
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
  MessageCircle
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

  const mentorCards = useMemo(() => {
    return Array.isArray(mentors) ? mentors : [];
  }, [mentors]);

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(mentorCards.length / PAGE_SIZE)),
    [mentorCards.length]
  );

  const paginatedMentorCards = useMemo(() => {
    const startIndex = (currentPage - 1) * PAGE_SIZE;
    return mentorCards.slice(startIndex, startIndex + PAGE_SIZE);
  }, [mentorCards, currentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [mentorCards.length]);

  const handlePageChange = (page) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
  };

return (
  <div className="min-h-screen bg-transparent p-4 sm:p-6 lg:p-8">
    <div className="mx-auto max-w-full">
      {/* Header Section */}
      <div className="mb-6 sm:mb-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          {/* Title */}
          <div className="flex items-start gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#5D3699] shadow-lg shadow-[#5D3699]/20">
              <Users className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-[#111827] sm:text-3xl">
                Recommended Mentors
              </h1>
              <p className="mt-1 text-sm text-[#6b7280]">
                Based on your current mood and concerns
              </p>
            </div>
          </div>

          {/* AI Badge */}
          <div className="inline-flex items-center gap-2 self-start rounded-full bg-[#ecfdf3] px-4 py-2 ring-1 ring-[#10b981]/20">
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[#10b981]">
              <CheckCircle2 className="h-3.5 w-3.5 text-white" />
            </div>
            <div>
              <span className="text-xs font-semibold text-[#10b981]">AI Analysis Complete</span>
            </div>
          </div>
        </div>
      </div>

      {/* Error State */}
      {(error || menteeError) && (
        <div className="mb-6 flex items-center gap-3 rounded-xl bg-red-50 px-4 py-3 ring-1 ring-red-100">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-red-100">
            <span className="text-red-600">!</span>
          </div>
          <p className="text-sm text-red-600">{error || menteeError}</p>
        </div>
      )}

      {/* Mentors Grid */}
      <div className="grid gap-5 sm:grid-cols-2">
        {paginatedMentorCards.map((m) => (
          <div
            key={m.id || m.name}
            className={`group relative overflow-hidden rounded-2xl bg-white shadow-sm transition-all duration-300 hover:shadow-lg ${
              m.topMatch
                ? 'ring-2 ring-[#10b981]'
                : 'ring-1 ring-[#e5e7eb] hover:ring-[#5D3699]/30'
            }`}
          >
            {/* Top Match Badge */}
            {m.topMatch && (
              <div className="absolute right-4 top-4 z-10">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-[#10b981] px-3 py-1.5 text-xs font-semibold text-white shadow-lg shadow-[#10b981]/30">
                  <Award className="h-3.5 w-3.5" />
                  Top Match
                </span>
              </div>
            )}

            {/* Card Content */}
            <div className="p-5 sm:p-6">
              {/* Mentor Info */}
              <div className="flex gap-4">
                {/* Avatar */}
                <div className="relative flex-shrink-0">
                  <div className="h-16 w-16 overflow-hidden rounded-xl bg-[#f5f3ff] ring-2 ring-white shadow-md sm:h-20 sm:w-20">
                    {m.avatar ? (
                      <img
                        src={m.avatar}
                        alt={m.name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-[#f5f3ff]">
                        <User className="h-8 w-8 text-[#5D3699]" />
                      </div>
                    )}
                  </div>
                </div>

                {/* Info */}
                <div className="min-w-0 flex-1">
                  <h3 className="text-base font-semibold text-[#111827] sm:text-lg">
                    {m.name}
                  </h3>
                  
                  {m.location && (
                    <div className="mt-1 flex items-center gap-1.5 text-xs text-[#6b7280] sm:text-sm">
                      <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
                      <span className="truncate">{m.location}</span>
                    </div>
                  )}

                  {/* Rating */}
                  {m.rating != null && (
                    <div className="mt-2 flex items-center gap-2">
                      <div className="flex items-center gap-1">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`h-3.5 w-3.5 ${
                              i < Math.floor(m.rating)
                                ? 'fill-[#f59e0b] text-[#f59e0b]'
                                : 'text-[#e5e7eb]'
                            }`}
                          />
                        ))}
                      </div>
                      <span className="text-sm font-semibold text-[#111827]">
                        {Number(m.rating).toFixed(1)}
                      </span>
                      {m.reviews != null && (
                        <span className="text-xs text-[#9ca3af]">
                          ({m.reviews} reviews)
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Tags */}
              {m.tags.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {m.tags.map((t) => (
                    <span
                      key={t}
                      className="inline-flex items-center rounded-full bg-[#f5f3ff] px-3 py-1 text-xs font-medium text-[#5D3699]"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              )}

              {/* Bio */}
              {m.blurb && (
                <p className="mt-4 line-clamp-2 text-sm leading-relaxed text-[#6b7280] sm:line-clamp-3">
                  {m.blurb}
                </p>
              )}

              {/* Divider */}
              <div className="my-4 border-t border-[#e5e7eb]" />

              {/* Actions */}
              <div className="flex items-center justify-between gap-3">
                <Link
                  to={m.id ? `/mentor-profile?mentorId=${m.id}` : '/mentor-profile'}
                  onClick={() => setSelectedMentorId(m.id)}
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-[#6b7280] transition-colors hover:text-[#5D3699]"
                >
                  <User className="h-4 w-4" />
                  View Profile
                </Link>

                <Link
                  to={m.id ? `/mentor-details?mentorId=${m.id}` : '/mentor-details'}
                  onClick={() => setSelectedMentorId(m.id)}
                  className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all ${
                    m.topMatch
                      ? 'bg-[#5D3699] text-white shadow-sm hover:bg-[#4a2b7a] hover:shadow-md'
                      : 'bg-white text-[#5D3699] ring-1 ring-[#5D3699]/30 hover:bg-[#f5f3ff]'
                  }`}
                >
                  <Calendar className="h-4 w-4" />
                  <span className="hidden sm:inline">Schedule Session</span>
                  <span className="sm:hidden">Schedule</span>
                  {m.topMatch && <ArrowRight className="h-4 w-4" />}
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Loading State */}
      {loading && (
        <div className="mt-8 flex flex-col items-center justify-center rounded-2xl bg-white p-12 shadow-sm ring-1 ring-[#e5e7eb]">
          <p className="text-sm font-medium text-[#6b7280]">Finding your perfect mentors...</p>
        </div>
      )}

      {/* Empty State */}
      {!loading && mentorCards.length === 0 && (
        <div className="mt-8 flex flex-col items-center justify-center gap-4 rounded-2xl bg-white p-12 text-center shadow-sm ring-1 ring-[#e5e7eb]">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[#f5f3ff]">
            <Users className="h-10 w-10 text-[#9ca3af]" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-[#111827]">No mentors found</h3>
            <p className="mt-1 text-sm text-[#6b7280]">
              Complete your assessment to get personalized recommendations
            </p>
          </div>
          <button
            type="button"
            onClick={() => navigate('/needs-assessment')}
            className="mt-2 inline-flex items-center gap-2 rounded-xl bg-[#5D3699] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-[#4a2b7a] hover:shadow-md"
          >
            <Sparkles className="h-4 w-4" />
            Take Assessment
          </button>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-8 flex items-center justify-center gap-2">
          {/* Previous Button */}
          <button
            type="button"
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-white text-[#6b7280] ring-1 ring-[#e5e7eb] transition-all hover:bg-[#f5f3ff] hover:text-[#5D3699] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>

          {/* Page Numbers */}
          <div className="flex items-center gap-1">
            {Array.from({ length: totalPages }, (_, index) => index + 1).map((page) => (
              <button
                key={page}
                type="button"
                onClick={() => handlePageChange(page)}
                className={`inline-flex h-10 w-10 items-center justify-center rounded-xl text-sm font-medium transition-all ${
                  currentPage === page
                    ? 'bg-[#5D3699] text-white shadow-md shadow-[#5D3699]/20'
                    : 'bg-white text-[#6b7280] ring-1 ring-[#e5e7eb] hover:bg-[#f5f3ff] hover:text-[#5D3699]'
                }`}
              >
                {page}
              </button>
            ))}
          </div>

          {/* Next Button */}
          <button
            type="button"
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-white text-[#6b7280] ring-1 ring-[#e5e7eb] transition-all hover:bg-[#f5f3ff] hover:text-[#5D3699] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      )}

      {/* Results Info */}
      {!loading && mentorCards.length > 0 && (
        <p className="mt-4 text-center text-xs text-[#9ca3af]">
          Showing {(currentPage - 1) * PAGE_SIZE + 1} - {Math.min(currentPage * PAGE_SIZE, mentorCards.length)} of {mentorCards.length} mentors
        </p>
      )}

      {/* Help Section */}
      <div className="mt-8 rounded-2xl bg-[#f5f3ff] p-5 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#5D3699]">
              <MessageCircle className="h-6 w-6 text-white" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-[#111827]">
                Not finding the right match?
              </h3>
              <p className="mt-0.5 text-sm text-[#6b7280]">
                Update your preferences to get better recommendations
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => navigate('/needs-assessment')}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-5 py-2.5 text-sm font-medium text-[#5D3699] ring-1 ring-[#5D3699]/20 transition-all hover:bg-[#5D3699] hover:text-white sm:flex-shrink-0"
          >
            <Sparkles className="h-4 w-4" />
            Retake Assessment
          </button>
        </div>
      </div>
    </div>
  </div>
);
};

export default Mentors;
