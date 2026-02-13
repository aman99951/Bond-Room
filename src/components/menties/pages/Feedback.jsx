import React, { useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { menteeApi } from '../../../apis/api/menteeApi';
import { getSelectedSessionId } from '../../../apis/api/storage';

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
    <div className="p-4 sm:p-6 flex items-center justify-center">
      <div className="w-full max-w-md rounded-2xl border border-default bg-surface p-6 shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <Link to="/my-sessions" className="text-xs text-muted underline">
            {'<-'} Back
          </Link>
          <div className="w-10" />
        </div>
        <h1 className="text-lg font-semibold text-primary text-center">How was your session?</h1>
        <p className="mt-1 text-xs text-muted text-center">
          Your feedback helps us improve the mentorship quality.
        </p>

        <div className="mt-6 text-center">
          <div className="text-xs text-muted">Rate your experience with the mentor</div>
          <div className="mt-2 flex items-center justify-center gap-1 text-subtle" aria-label="Rate your experience">
            {Array.from({ length: 5 }).map((_, i) => {
              const starValue = i + 1;
              const selected = starValue <= rating;
              return (
                <button
                  key={i}
                  type="button"
                  className={`text-lg ${selected ? 'text-[#f4b740]' : ''}`}
                  onClick={() => setRating(starValue)}
                >
                  {selected ? '*' : 'o'}
                </button>
              );
            })}
          </div>
        </div>

        <div className="mt-6">
          <div className="text-xs text-muted mb-2">Topics Discussed</div>
          <div className="grid grid-cols-2 gap-3 text-xs text-secondary">
            {topics.map((topic) => (
              <label key={topic} className="flex items-center gap-2 rounded-lg border border-default px-3 py-2">
                <input
                  type="checkbox"
                  className="h-4 w-4 accent-gray-900"
                  checked={selectedTopics.includes(topic)}
                  onChange={() => toggleTopic(topic)}
                />
                <span>{topic}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="mt-6">
          <label htmlFor="feedbackComments" className="text-xs text-muted">Additional Comments (Optional)</label>
          <textarea
            id="feedbackComments"
            rows={4}
            className="mt-2 w-full rounded-lg border border-default p-3 text-sm"
            placeholder="Share any specific feedback..."
            value={comments}
            onChange={(event) => setComments(event.target.value)}
          />
        </div>

        {error && <p className="mt-3 text-xs text-red-600">{error}</p>}
        {!error && success && <p className="mt-3 text-xs text-green-700">{success}</p>}

        <button
          className="mt-6 w-full rounded-md bg-accent text-on-accent py-2.5 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-900 focus-visible:ring-offset-2 disabled:opacity-70"
          onClick={handleSubmit}
          disabled={loading}
        >
          {loading ? 'Submitting...' : 'Submit Feedback'}
        </button>
        <div className="mt-2 text-center">
          <Link to="/my-sessions" className="text-xs text-muted underline">
            Skip
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Feedback;
