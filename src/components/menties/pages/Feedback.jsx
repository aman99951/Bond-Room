import React, { useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { menteeApi } from '../../../apis/api/menteeApi';
import { getSelectedSessionId } from '../../../apis/api/storage';
import {
  ArrowLeft,
  Star,
  MessageSquare,
  Send,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  X
} from 'lucide-react';

const topics = ['Exam Anxiety', 'Parent Issues', 'Peer Pressure', 'Study Methods', 'Stress Relief', 'Other'];

const Feedback = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialSessionId = useMemo(
    () => searchParams.get('sessionId') || getSelectedSessionId() || '',
    [searchParams]
  );
  const [rating, setRating] = useState(0);
  const [selectedTopics, setSelectedTopics] = useState([]);
  const [comments, setComments] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const toggleTopic = (topic) => {
    setSelectedTopics((prev) =>
      prev.includes(topic) ? prev.filter((item) => item !== topic) : [...prev, topic]
    );
  };

  const handleSubmit = async () => {
    setError('');
    setSuccess('');

    if (!initialSessionId) {
      setError('No session selected for feedback.');
      return;
    }
    if (!rating) {
      setError('Please select a rating before submitting.');
      return;
    }

    setLoading(true);
    try {
      await menteeApi.submitSessionFeedback(initialSessionId, {
        rating,
        topics_discussed: selectedTopics,
        comments,
      });
      setSuccess('Feedback submitted successfully.');
      setTimeout(() => navigate('/my-sessions'), 700);
    } catch (err) {
      setError(err?.message || 'Unable to submit feedback.');
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="min-h-screen p-4 sm:p-6 lg:p-8 bg-transparent flex items-center justify-center">
      <div className="w-full max-w-lg">
        {/* Back Link */}
        <Link
          to="/my-sessions"
          className="inline-flex items-center gap-2 text-sm text-[#6b7280] hover:text-[#5D3699] transition-colors mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Sessions
        </Link>

        {/* Main Card */}
        <div className="rounded-2xl bg-white p-4 sm:p-6 lg:p-8 shadow-sm ring-1 ring-[#e5e7eb]">
          {/* Header */}
          <div className="text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#f5f3ff]">
              <MessageSquare className="h-7 w-7 text-[#5D3699]" />
            </div>
            <h1 className="mt-4 text-xl sm:text-2xl font-bold text-[#111827]">
              How was your session?
            </h1>
            <p className="mt-2 text-sm text-[#6b7280]">
              Your feedback helps us improve the mentorship quality
            </p>
          </div>

          {/* Rating Section */}
          <div className="mt-8">
            <label className="block text-sm font-medium text-[#111827] text-center mb-4">
              Rate your experience
            </label>
            <div className="flex items-center justify-center gap-2" aria-label="Rate your experience">
              {Array.from({ length: 5 }).map((_, i) => {
                const starValue = i + 1;
                const selected = starValue <= rating;
                return (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setRating(starValue)}
                    className={`group relative p-2 transition-all duration-200 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-[#5D3699] focus:ring-offset-2 rounded-lg ${selected ? 'scale-105' : ''
                      }`}
                    aria-label={`Rate ${starValue} star${starValue > 1 ? 's' : ''}`}
                  >
                    <Star
                      className={`h-10 w-10 transition-all duration-200 ${selected
                          ? 'fill-[#f59e0b] text-[#f59e0b]'
                          : 'text-[#e5e7eb] hover:text-[#fbbf24]'
                        }`}
                    />
                    {selected && (
                      <Sparkles className="absolute -top-1 -right-1 h-3 w-3 text-[#f59e0b] animate-pulse" />
                    )}
                  </button>
                );
              })}
            </div>
            {rating > 0 && (
              <p className="mt-3 text-center text-sm text-[#6b7280]">
                {rating === 5 && "Excellent! We're glad you had a great experience!"}
                {rating === 4 && "Great! Thank you for the positive feedback!"}
                {rating === 3 && "Good! Let us know how we can improve."}
                {rating === 2 && "We appreciate your honesty. Please share more details."}
                {rating === 1 && "We're sorry to hear that. Please tell us what went wrong."}
              </p>
            )}
          </div>

          {/* Topics Section */}
          <div className="mt-8">
            <label className="block text-sm font-medium text-[#111827] mb-3">
              Topics Discussed
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {topics.map((topic) => {
                const isSelected = selectedTopics.includes(topic);
                return (
                  <label
                    key={topic}
                    className={`group flex items-center gap-3 rounded-xl border px-4 py-3 cursor-pointer transition-all duration-200 ${isSelected
                        ? 'border-[#5D3699] bg-[#f5f3ff] ring-1 ring-[#5D3699]/20'
                        : 'border-[#e5e7eb] bg-white hover:border-[#c4b5fd] hover:bg-[#f5f3ff]/50'
                      }`}
                  >
                    <div
                      className={`flex h-5 w-5 items-center justify-center rounded-md border-2 transition-all duration-200 ${isSelected
                          ? 'border-[#5D3699] bg-[#5D3699]'
                          : 'border-[#e5e7eb] group-hover:border-[#c4b5fd]'
                        }`}
                    >
                      {isSelected && (
                        <CheckCircle2 className="h-3.5 w-3.5 text-white" />
                      )}
                    </div>
                    <span
                      className={`text-sm transition-colors ${isSelected ? 'text-[#5D3699] font-medium' : 'text-[#6b7280]'
                        }`}
                    >
                      {topic}
                    </span>
                    <input
                      type="checkbox"
                      className="sr-only"
                      checked={isSelected}
                      onChange={() => toggleTopic(topic)}
                    />
                  </label>
                );
              })}
            </div>
          </div>

          {/* Comments Section */}
          <div className="mt-8">
            <label
              htmlFor="feedbackComments"
              className="block text-sm font-medium text-[#111827] mb-2"
            >
              Additional Comments
              <span className="ml-1 text-[#9ca3af] font-normal">(Optional)</span>
            </label>
            <div className="relative">
              <textarea
                id="feedbackComments"
                rows={4}
                className="w-full rounded-xl border-0 bg-[#f8fafc] p-4 text-sm text-[#111827] ring-1 ring-[#e5e7eb] placeholder:text-[#9ca3af] focus:bg-white focus:ring-2 focus:ring-[#5D3699] transition-all resize-none"
                placeholder="Share any specific feedback about your session..."
                value={comments}
                onChange={(event) => setComments(event.target.value)}
              />
              <div className="absolute bottom-3 right-3 text-xs text-[#9ca3af]">
                {comments.length}/500
              </div>
            </div>
          </div>

          {/* Error State */}
          {error && (
            <div className="mt-6 flex items-center gap-3 rounded-xl bg-red-50 px-4 py-3 ring-1 ring-red-100">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-red-100">
                <AlertCircle className="h-4 w-4 text-red-600" />
              </div>
              <p className="flex-1 text-sm text-red-600">{error}</p>
              <button
                type="button"
                onClick={() => setError('')}
                className="text-red-400 hover:text-red-600 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}

          {/* Success State */}
          {!error && success && (
            <div className="mt-6 flex items-center gap-3 rounded-xl bg-green-50 px-4 py-3 ring-1 ring-green-100">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-100">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
              </div>
              <p className="flex-1 text-sm text-green-600">{success}</p>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading || rating === 0}
            className="mt-6 w-full flex items-center justify-center gap-2 rounded-xl bg-[#5D3699] px-6 py-3.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-[#4a2b7a] hover:shadow-md focus:outline-none focus:ring-2 focus:ring-[#5D3699] focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                Submitting...
              </>
            ) : (
              <>
                <Send className="h-4 w-4" />
                Submit Feedback
              </>
            )}
          </button>

          {/* Skip Link */}
          <div className="mt-4 text-center">
            <Link
              to="/my-sessions"
              className="inline-flex items-center gap-1 text-sm text-[#6b7280] hover:text-[#5D3699] transition-colors"
            >
              Skip for now
            </Link>
          </div>
        </div>

        {/* Footer Note */}
        <p className="mt-6 text-center text-xs text-[#9ca3af]">
          Your feedback is anonymous and helps us improve the platform.
        </p>
      </div>
    </div>
  );
};

export default Feedback;
