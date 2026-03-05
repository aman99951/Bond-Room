import React, { useState } from 'react';
import TopAuth from './TopAuth';
import BottomAuth from './BottomAuth';
import { Link, useNavigate } from 'react-router-dom';
import { useMenteeAssessment } from '../../apis/apihook/useMenteeAssessment';

const MAX_SELECTIONS = 3;

const toArray = (value) => {
  if (Array.isArray(value)) {
    return value.filter(Boolean);
  }
  if (typeof value === 'string' && value.trim()) {
    return [value.trim()];
  }
  return [];
};

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

const NeedsAssessmentQ2 = () => {
  const navigate = useNavigate();
  const { draft, saveAnswer } = useMenteeAssessment();
  const [selectedCauses, setSelectedCauses] = useState(() => {
    const savedSelections = toArray(draft.feeling_causes);
    if (savedSelections.length) {
      return savedSelections.slice(0, MAX_SELECTIONS);
    }
    return toArray(draft.feeling_cause).slice(0, MAX_SELECTIONS);
  });
  const [otherCauseText, setOtherCauseText] = useState(draft.feeling_cause_other_text || '');
  const [localError, setLocalError] = useState('');

  const options = [
    'Exam Pressure',
    'Parent Expectations',
    'Friend Issues',
    'Future Anxiety (Career/College)',
    'Concentration Struggles',
    'Study Struggles',
    'Others',
  ];

  const toggleCause = (option) => {
    setLocalError('');
    setSelectedCauses((prev) => {
      if (prev.includes(option)) {
        if (option === 'Others') {
          setOtherCauseText('');
        }
        return prev.filter((item) => item !== option);
      }
      if (prev.length >= MAX_SELECTIONS) {
        setLocalError(`You can select up to ${MAX_SELECTIONS} options.`);
        return prev;
      }
      return [...prev, option];
    });
  };

  const saveCauseAnswers = (nextCauses, nextOtherText) => {
    saveAnswer('feeling_causes', nextCauses);
    saveAnswer('feeling_cause', nextCauses[0] || '');
    saveAnswer('feeling_cause_other_text', nextOtherText.trim());
  };

  const handleNext = () => {
    if (!selectedCauses.length) {
      setLocalError('Please choose at least one cause or skip this question.');
      return;
    }
    if (selectedCauses.includes('Others') && !otherCauseText.trim()) {
      setLocalError('Please add a short note when selecting Others.');
      return;
    }
    saveCauseAnswers(selectedCauses, otherCauseText);
    navigate('/needs-assessment/q3');
  };

  const handleSkip = () => {
    saveCauseAnswers([], '');
    navigate('/needs-assessment/q3');
  };

  return (
    <div className="min-h-screen bg-surface text-primary flex flex-col">
      <TopAuth />

      <main className="flex-1">
        <div className="mx-auto max-w-[1280px] px-4 py-6 sm:px-6 sm:py-10 lg:px-20 lg:py-14">
          <div className="mx-auto max-w-3xl">
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted">
              <span className="text-xs">Step 3 of 3: Needs Assessment</span>
              <span className="text-xs">Question 2 of 5</span>
            </div>
            <div className="mt-2 h-1.5 w-full rounded-full bg-muted">
              <div className="h-1.5 w-2/5 rounded-full bg-accent" />
            </div>

            <div className="mt-8 text-center sm:mt-10">
              <h2 className="text-center text-2xl font-semibold leading-tight text-[#1f2937] sm:text-3xl lg:text-[36px] lg:leading-[45.5px]">
                What's been causing this feeling?
              </h2>
              <p className="mt-2 text-sm text-[#6b7280]">
                Select up to {MAX_SELECTIONS} options.
              </p>
            </div>

            <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 sm:justify-items-center lg:grid-cols-3">
              {options.map((option) => (
                <Choice
                  key={option}
                  label={option}
                  selected={selectedCauses.includes(option)}
                  onClick={() => toggleCause(option)}
                />
              ))}
            </div>

            <p className="mt-4 text-center text-xs text-[#6b7280]">
              Selected: {selectedCauses.length}/{MAX_SELECTIONS}
            </p>

            {selectedCauses.includes('Others') && (
              <div className="mx-auto mt-4 max-w-xl">
                <label htmlFor="causeOtherText" className="block text-xs text-[#6b7280]">
                  Tell us more about the cause
                </label>
                <textarea
                  id="causeOtherText"
                  rows={3}
                  className="mt-1 w-full rounded-md border border-[#d7d0e2] bg-white px-3 py-2 text-sm text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#5b2c91] focus:border-transparent"
                  placeholder="Share in your own words..."
                  value={otherCauseText}
                  onChange={(event) => setOtherCauseText(event.target.value)}
                />
              </div>
            )}

            {localError && (
              <p className="mt-4 text-center text-sm text-red-600">{localError}</p>
            )}

            <div className="mt-8 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center sm:gap-4">
              <Link
                to="/needs-assessment"
                className="w-full rounded-md border border-default bg-white py-2.5 text-center text-sm text-muted sm:w-40"
              >
                Back
              </Link>
              <button
                type="button"
                onClick={handleNext}
                className="w-full rounded-md bg-accent py-2.5 text-center text-sm text-on-accent sm:w-80"
              >
                Next Question {'\u2192'}
              </button>
            </div>

            <div className="mt-4 text-center">
              <button type="button" className="text-xs text-subtle underline" onClick={handleSkip}>
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

export default NeedsAssessmentQ2;
