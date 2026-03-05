import React, { useState } from 'react';
import TopAuth from './TopAuth';
import BottomAuth from './BottomAuth';
import { Link, useNavigate } from 'react-router-dom';
import { useMenteeAssessment } from '../../apis/apihook/useMenteeAssessment';

const Choice = ({ label, selected, onClick }) => {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative flex w-full min-h-[72px] max-w-[260px] items-center justify-center rounded-[12px] border-2 px-4 py-4 text-center text-secondary sm:px-5 ${
        selected ? 'border-[#41a34a] bg-[#f2faf3] shadow-sm' : 'border-default bg-white'
      }`}
    >
      <span
        className={`text-sm leading-5 sm:text-base sm:leading-6 ${selected ? 'font-semibold' : 'font-normal'}`}
      >
        {label}
      </span>
      {selected && (
        <span className="absolute right-3 flex h-4 w-4 items-center justify-center rounded-full bg-[#41a34a] text-[10px] text-white">
          {'\u2713'}
        </span>
      )}
    </button>
  );
};

const NeedsAssessmentQ5 = () => {
  const navigate = useNavigate();
  const { draft, saveAnswer, submitAssessment, loading, error } = useMenteeAssessment();
  const [selectedLanguage, setSelectedLanguage] = useState(draft.language || 'Tamil');
  const [localError, setLocalError] = useState('');

  const options = ['Tamil', 'English', 'Telugu', 'Malayalam', 'Kannada', 'Hindi'];

  const handleFinish = async () => {
    setLocalError('');
    try {
      saveAnswer('language', selectedLanguage);
      await submitAssessment();
      navigate('/dashboard');
    } catch (err) {
      setLocalError(err?.message || 'Unable to submit assessment.');
    }
  };

  return (
    <div className="min-h-screen bg-surface text-primary flex flex-col">
      <TopAuth />

      <main className="flex-1">
        <div className="mx-auto max-w-[1280px] px-4 py-6 sm:px-6 sm:py-10 lg:px-20 lg:py-14">
          <div className="mx-auto max-w-3xl">
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted">
              <span className="text-xs">Step 3 of 3: Needs Assessment</span>
              <span className="text-xs">Question 5 of 5</span>
            </div>
            <div className="mt-2 h-1.5 w-full rounded-full bg-muted">
              <div className="h-1.5 w-full rounded-full bg-accent" />
            </div>

            <div className="mt-8 text-center sm:mt-10">
              <h2 className="text-center text-2xl font-semibold leading-tight text-[#1f2937] sm:text-3xl lg:text-[36px] lg:leading-[45.5px]">
                Which language do you prefer?
              </h2>
            </div>

            <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 sm:justify-items-center lg:grid-cols-3">
              {options.map((option) => (
                <Choice
                  key={option}
                  label={option}
                  selected={selectedLanguage === option}
                  onClick={() => setSelectedLanguage(option)}
                />
              ))}
            </div>

            {(localError || error) && <p className="mt-4 text-center text-sm text-red-600">{localError || error}</p>}

            <div className="mt-8 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center sm:gap-4">
              <Link
                to="/needs-assessment/q4"
                className="w-full rounded-md border border-default bg-white py-2.5 text-center text-sm text-muted sm:w-40"
              >
                Back
              </Link>
              <button
                type="button"
                onClick={handleFinish}
                className="w-full rounded-md bg-accent py-2.5 text-center text-sm text-on-accent disabled:opacity-70 sm:w-80"
                disabled={loading}
              >
                {loading ? 'Submitting...' : `Finish \u2192`}
              </button>
            </div>

            <div className="mt-4 text-center">
              <button type="button" className="text-xs text-subtle underline" onClick={handleFinish} disabled={loading}>
                Skip this question
              </button>
            </div>
          </div>
        </div>
      </main>

      <BottomAuth />
    </div>
  );
};

export default NeedsAssessmentQ5;
