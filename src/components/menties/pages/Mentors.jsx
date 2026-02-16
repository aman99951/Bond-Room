import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { menteeApi } from '../../../apis/api/menteeApi';
import { setSelectedMentorId } from '../../../apis/api/storage';
import { useMenteeData } from '../../../apis/apihook/useMenteeData';

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

const mapMentorToCard = (mentor) => ({
  id: mentor?.id ?? null,
  name: getMentorName(mentor),
  location: mentor?.city_state || mentor?.location || '',
  tags: Array.isArray(mentor?.care_areas)
    ? mentor.care_areas
    : Array.isArray(mentor?.tags)
      ? mentor.tags
      : [],
  rating: mentor?.average_rating ?? mentor?.rating ?? null,
  reviews: mentor?.reviews ?? mentor?.sessions_completed ?? mentor?.reviews_count ?? null,
  blurb: mentor?.bio || mentor?.blurb || '',
  topMatch: Boolean(mentor?.topMatch ?? mentor?.top_match),
  avatar: mentor?.avatar || mentor?.profile_photo || '',
});

const Mentors = () => {
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
        const cards = recommendedList.map((item) =>
          mapMentorToCard(item?.mentor || item)
        );
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
    <div className="min-h-screen bg-transparent">
      <div className="max-w-6xl mx-auto px-3 sm:px-4 md:px-6 py-6 sm:py-8 md:py-10">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4">
          <div>
            <h1
              className="text-[#111827] text-2xl sm:text-[30px]"
              style={{
                fontFamily: 'DM Sans',
                lineHeight: '36px',
                fontWeight: 700,
              }}
            >
              Your Recommended Mentors
            </h1>
            <p className="mt-1 text-xs sm:text-sm text-[#6b7280]">Based on your current mood and concerns</p>
          </div>
          <div className="inline-flex items-center gap-2 rounded-full bg-[#ecfdf3] text-[#1f7a3f] px-3 sm:px-4 py-1.5 sm:py-2 text-[10px] sm:text-xs font-medium w-fit">
            <span className="inline-flex h-3 w-3 sm:h-4 sm:w-4 items-center justify-center rounded-full bg-[#1f7a3f] text-white text-[8px] sm:text-[10px] flex-shrink-0">
              OK
            </span>
            AI Analysis Complete
          </div>
        </div>

        {(error || menteeError) && (
          <p className="mt-3 text-xs sm:text-sm text-red-600">{error || menteeError}</p>
        )}

        <div className="mt-4 sm:mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
          {paginatedMentorCards.map((m) => (
            <div
              key={m.id || m.name}
              className={`relative rounded-xl sm:rounded-2xl border-2 bg-white p-4 sm:p-5 shadow-[0px_1px_2px_0px_rgba(0,0,0,0.08)] ${
                m.topMatch ? 'border-[#10b981]' : 'border-[#e5e7eb]'
              }`}
            >
              {m.topMatch && (
                <span className="absolute -top-3 right-3 sm:right-4 inline-flex items-center gap-1 rounded-full border border-[#10b981] bg-[#ecfdf3] px-2 sm:px-3 py-1 text-[9px] sm:text-[10px] font-semibold text-[#10b981]">
                  <span className="text-[10px] sm:text-[11px]">*</span> Top Match
                </span>
              )}
              <div className="flex items-start gap-3 sm:gap-4">
                <div className="h-12 w-12 sm:h-16 sm:w-16 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden flex-shrink-0">
                  {m.avatar ? (
                    <img src={m.avatar} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <div className="h-full w-full bg-gradient-to-br from-gray-200 to-gray-300" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs sm:text-sm font-semibold text-[#111827] truncate">{m.name}</div>
                  {m.location && (
                    <div className="mt-0.5 text-[10px] sm:text-xs text-gray-500 flex items-center gap-1">
                      <span className="inline-flex h-3 w-3 items-center justify-center flex-shrink-0">
                        <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="h-3 w-3 text-[#4B5563]">
                          <path d="M12 21s7-5.2 7-11a7 7 0 0 0-14 0c0 5.8 7 11 7 11z" stroke="currentColor" strokeWidth="1.5" />
                          <circle cx="12" cy="10" r="2.5" stroke="currentColor" strokeWidth="1.5" />
                        </svg>
                      </span>
                      {m.location}
                    </div>
                  )}
                  {m.tags.length > 0 && (
                    <div className="mt-1.5 sm:mt-2 flex flex-wrap items-center gap-1 sm:gap-2">
                      {m.tags.map((t) => (
                        <span
                          key={t}
                          className="rounded-full bg-[#E0E7FF] px-2 sm:px-[10px] py-[2px] text-[#5b2c91] whitespace-nowrap text-[10px] sm:text-xs"
                          style={{
                            fontFamily: 'DM Sans',
                            fontWeight: 500,
                          }}
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {m.blurb && (
                <p
                  className="mt-2 sm:mt-3 text-gray-500 text-xs sm:text-sm line-clamp-3 sm:line-clamp-none"
                  style={{ fontFamily: 'DM Sans', lineHeight: '22.75px', fontWeight: 400 }}
                >
                  {m.blurb}
                </p>
              )}

              <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-0">
                {(m.rating != null || m.reviews != null) && (
                  <div className="flex items-center gap-1 text-xs text-gray-600">
                    <span className="text-[#f4b740]">*</span>
                    {m.rating != null && (
                      <span className="font-semibold text-[#111827]">{Number(m.rating).toFixed(1)}</span>
                    )}
                    {m.reviews != null && (
                      <span className="text-gray-400">({m.reviews})</span>
                    )}
                  </div>
                )}
                <div className="flex items-center justify-between sm:justify-end gap-2 sm:gap-3">
                  <Link
                    to={m.id ? `/mentor-profile?mentorId=${m.id}` : '/mentor-profile'}
                    onClick={() => setSelectedMentorId(m.id)}
                    className="hover:text-[#5b2c91] text-xs sm:text-sm"
                    style={{
                      fontFamily: 'DM Sans',
                      lineHeight: '20px',
                      fontWeight: m.topMatch ? 600 : 400,
                      color: m.topMatch ? '#5D3699' : '#6b7280',
                      textAlign: 'center',
                      verticalAlign: 'middle',
                    }}
                  >
                    View Profile
                  </Link>
                  <Link
                    to={m.id ? `/mentor-details?mentorId=${m.id}` : '/mentor-details'}
                    onClick={() => setSelectedMentorId(m.id)}
                    className={`rounded-[8px] border px-3 sm:px-4 py-2 text-center text-xs sm:text-base flex-1 sm:flex-none ${
                      m.topMatch ? 'bg-[#5D3699] text-white border-[#5D3699]' : 'border-[#5D3699] text-[#5D3699]'
                    }`}
                    style={{
                      minWidth: 'auto',
                      height: '36px',
                      fontFamily: 'DM Sans',
                      lineHeight: '24px',
                      fontWeight: 500,
                    }}
                  >
                    <span className="hidden sm:inline">Schedule Session</span>
                    <span className="sm:hidden">Schedule</span>
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>

        {loading && (
          <div className="mt-3 text-center text-xs sm:text-sm text-[#6b7280]">
            Loading mentors...
          </div>
        )}
        {!loading && mentorCards.length === 0 && (
          <div className="mt-3 text-center text-xs sm:text-sm text-[#6b7280]">
            No recommendations available for your account yet.
          </div>
        )}

        {totalPages > 1 && (
          <div
            className="mt-6 sm:mt-8 flex items-center justify-center gap-2 sm:gap-3 text-[#4B5563]"
            style={{ fontFamily: 'DM Sans', fontSize: '16px', lineHeight: '24px', fontWeight: 500 }}
          >
            <button
              type="button"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="h-6 w-6 sm:h-7 sm:w-7 rounded-md text-[#4B5563] text-sm sm:text-base disabled:opacity-50"
            >
              {'<'}
            </button>

            {Array.from({ length: totalPages }, (_, index) => index + 1).map((page) => (
              <button
                key={page}
                type="button"
                onClick={() => handlePageChange(page)}
                className={`h-6 w-6 sm:h-7 sm:w-7 rounded-md text-sm sm:text-base ${
                  currentPage === page ? 'bg-[#5b2c91] text-white' : 'text-[#4B5563]'
                }`}
              >
                {page}
              </button>
            ))}

            <button
              type="button"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="h-6 w-6 sm:h-7 sm:w-7 rounded-md text-[#4B5563] text-sm sm:text-base disabled:opacity-50"
            >
              {'>'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Mentors;
