import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import TopAuth from '../../auth/TopAuth';
import BottomAuth from '../../auth/BottomAuth';

const TrainingBoundaries = () => {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-surface text-primary flex flex-col">
      <TopAuth />

      <main className="flex-1">
        <div className="max-w-[900px] mx-auto px-4 sm:px-6 lg:px-20 py-8 sm:py-10">
          <button
            type="button"
            className="inline-flex items-center gap-2 text-sm text-secondary hover:text-primary mb-4"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Back
          </button>

          <div className="border border-default rounded-2xl bg-surface shadow-sm p-6 sm:p-8 lg:p-10">
            <h2 className="text-lg sm:text-xl font-semibold text-primary">Boundaries &amp; Ethics</h2>
            <p className="mt-2 text-sm text-muted">
              This is the training module screen for Boundaries &amp; Ethics. Add content here.
            </p>
          </div>
        </div>
      </main>

      <BottomAuth />
    </div>
  );
};

export default TrainingBoundaries;
