import { useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { menteeApi } from '../../../apis/api/menteeApi';
import { getSelectedMentorId, setSelectedMentorId } from '../../../apis/api/storage';

const dayOrder = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const normalizeList = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.results)) return payload.results;
  return [];
};

const formatTimeInZone = (dateLike, timeZone = '') => {
  if (!dateLike) return '';
  const date = new Date(dateLike);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleTimeString([], {
    hour: 'numeric',
    minute: '2-digit',
    timeZone: timeZone || undefined,
  });
};

const formatTimeRangeInZone = (startTime, endTime, timeZone = '') => {
  const startLabel = formatTimeInZone(startTime, timeZone);
  const endLabel = formatTimeInZone(endTime, timeZone);
  if (!startLabel && !endLabel) return '';
  if (!startLabel) return endLabel;
  if (!endLabel) return startLabel;
  return `${startLabel} - ${endLabel}`;
};

const toMentorData = (mentor) => {
  if (!mentor) return null;
  const name = `${mentor?.first_name || ''} ${mentor?.last_name || ''}`.trim();
  return {
    id: mentor?.id ?? null,
    name,
    location: mentor?.city_state || '',
    languages: Array.isArray(mentor?.languages) ? mentor.languages : [],
    rating: mentor?.average_rating ? Number(mentor.average_rating) : null,
    reviews: Number(mentor?.sessions_completed || 0),
    bio: mentor?.bio || '',
    areas: Array.isArray(mentor?.care_areas) ? mentor.care_areas : [],
    avatar: mentor?.avatar || '',
    qualification: mentor?.qualification || '',
  };
};

const buildAvailabilityMap = (slots) => {
  const map = new Map(dayOrder.map((day) => [day, []]));
  normalizeList(slots).forEach((slot) => {
    if (!slot?.start_time) return;
    const date = new Date(slot.start_time);
    if (Number.isNaN(date.getTime())) return;
    const day = dayOrder[(date.getDay() + 6) % 7];
    const time = formatTimeRangeInZone(slot.start_time, slot.end_time, slot.timezone);
    if (!time) return;
    const existing = map.get(day) || [];
    if (!existing.includes(time)) map.set(day, [...existing, time]);
  });
  return dayOrder.map((day) => (map.get(day) || []).slice(0, 3));
};

const toReviewData = (feedback) => {
  if (!feedback) return null;
  return {
    rating: feedback?.rating ? Number(feedback.rating) : null,
    comments: feedback?.comments || '',
  };
};

export const useMentorScreenData = () => {
  const { search } = useLocation();
  const mentorIdFromQuery = useMemo(() => {
    const params = new URLSearchParams(search);
    return params.get('mentorId') || '';
  }, [search]);

  const [mentor, setMentor] = useState(null);
  const [availability, setAvailability] = useState(dayOrder.map(() => []));
  const [review, setReview] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;

    const loadMentorData = async () => {
      const effectiveMentorId = mentorIdFromQuery || getSelectedMentorId();
      setLoading(true);
      setError('');

      try {
        let currentMentor = null;
        if (effectiveMentorId) {
          currentMentor = await menteeApi.getMentorById(effectiveMentorId);
        } else {
          const mentors = normalizeList(await menteeApi.listMentors());
          currentMentor = mentors[0] || null;
        }

        if (!currentMentor) {
          if (!cancelled) {
            setMentor(null);
            setAvailability(dayOrder.map(() => []));
            setReview(null);
            setReviews([]);
            setLoading(false);
          }
          return;
        }

        const mappedMentor = toMentorData(currentMentor);
        if (!cancelled) {
          setMentor(mappedMentor);
          if (mappedMentor?.id) setSelectedMentorId(mappedMentor.id);
        }

        const mentorId = mappedMentor?.id;
        if (!mentorId) {
          if (!cancelled) {
            setAvailability(dayOrder.map(() => []));
            setReview(null);
            setReviews([]);
          }
          return;
        }

        const [slotsResponse, reviewsResponse] = await Promise.allSettled([
          menteeApi.listAvailabilitySlots({ mentor_id: mentorId }),
          menteeApi.getMentorReviews(mentorId),
        ]);

        if (!cancelled) {
          if (slotsResponse.status === 'fulfilled') {
            setAvailability(buildAvailabilityMap(slotsResponse.value));
          } else {
            setAvailability(dayOrder.map(() => []));
          }

          if (reviewsResponse.status === 'fulfilled') {
            const summary = reviewsResponse.value?.summary || {};
            const recentFeedback = Array.isArray(reviewsResponse.value?.recent_feedback)
              ? reviewsResponse.value.recent_feedback
              : [];
            setReviews(recentFeedback);
            setReview(toReviewData(recentFeedback[0] || null));
            setMentor((prev) =>
              prev
                ? {
                    ...prev,
                    rating:
                      summary?.average_rating !== undefined && summary?.average_rating !== null
                        ? Number(summary.average_rating)
                        : prev.rating,
                    reviews:
                      summary?.total_reviews !== undefined && summary?.total_reviews !== null
                        ? Number(summary.total_reviews)
                        : prev.reviews,
                  }
                : prev
            );
          } else {
            setReview(null);
            setReviews([]);
          }
        }
      } catch (err) {
        if (!cancelled) {
          setError(err?.message || 'Unable to load mentor data.');
          setMentor(null);
          setAvailability(dayOrder.map(() => []));
          setReview(null);
          setReviews([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadMentorData();
    return () => {
      cancelled = true;
    };
  }, [mentorIdFromQuery]);

  return {
    mentor,
    availability,
    review,
    reviews,
    loading,
    error,
  };
};
