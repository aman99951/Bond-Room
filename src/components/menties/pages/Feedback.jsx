import React from 'react';
import { Link } from 'react-router-dom';

const Feedback = () => {
  return (
    <div className="p-4 sm:p-6 flex items-center justify-center">
      <div className="w-full max-w-md rounded-2xl border border-default bg-surface p-6 shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <Link to="/my-sessions" className="text-xs text-muted underline">
            ← Back
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
            {Array.from({ length: 5 }).map((_, i) => (
              <span key={i} className="text-lg">☆</span>
            ))}
          </div>
        </div>

        <div className="mt-6">
          <div className="text-xs text-muted mb-2">Topics Discussed</div>
          <div className="grid grid-cols-2 gap-3 text-xs text-secondary">
            {['Exam Anxiety', 'Parent Issues', 'Peer Pressure', 'Study Methods', 'Stress Relief', 'Other'].map((t) => (
              <label key={t} className="flex items-center gap-2 rounded-lg border border-default px-3 py-2">
                <input type="checkbox" className="h-4 w-4 accent-gray-900" />
                <span>{t}</span>
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
          />
        </div>

        <button className="mt-6 w-full rounded-md bg-accent text-on-accent py-2.5 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-900 focus-visible:ring-offset-2">
          Submit Feedback
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
