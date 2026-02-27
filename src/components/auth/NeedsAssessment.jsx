import React, { useState } from 'react';
import TopAuth from './TopAuth';
import BottomAuth from './BottomAuth';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useMenteeAssessment } from '../../apis/apihook/useMenteeAssessment';

const NeedOption = ({ label, selected, icon, iconClassName, onClick }) => {
  return (
    <button
      type="button"
      className={`relative flex w-full min-h-[148px] max-w-[240px] flex-col items-center justify-center gap-3 rounded-[12px] border-2 bg-white p-4 text-center shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)] sm:min-h-[156px] sm:p-5 ${
        selected ? 'border-[#41a34a] bg-[#f2faf3]' : 'border-[#d7d0e2]'
      }`}
      onClick={onClick}
    >
      <span className="flex h-14 w-14 items-center justify-center rounded-full border border-[#E5E7EB] bg-[#F5F5F5] sm:h-16 sm:w-16">
        {typeof icon === 'string' ? (
          <span className={`leading-none ${iconClassName || 'text-[28px]'}`}>{icon}</span>
        ) : null}
      </span>
      <span className={`text-sm sm:text-base ${selected ? 'font-semibold text-[#1f2937]' : 'text-[#6b7280]'}`}>
        {label}
      </span>
      {selected && (
        <span className="absolute right-2 top-2 flex h-4 w-4 items-center justify-center rounded-full bg-[#41a34a] text-[10px] text-white">
          {'\u2713'}
        </span>
      )}
    </button>
  );
};

const NeedsAssessment = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { draft, saveAnswer } = useMenteeAssessment();
  const [selectedFeeling, setSelectedFeeling] = useState(draft.feeling || 'Anxious');
  const hideBackButton = new URLSearchParams(location.search).get('from') === 'dashboard';

  const options = ['Burnt Out', 'Anxious', 'Confused', 'Lonely', 'Hopeful', 'Other'];

  const icons = {
    'Burnt Out': '🤯',
    Anxious: '😟',
    Confused: '😕',
    Lonely: '😞',
    Hopeful: '😌',
    Other: '⋯',
  };

  const handleNext = () => {
    saveAnswer('feeling', selectedFeeling);
    navigate('/needs-assessment/q2');
  };

  return (
    <div className="min-h-screen bg-[#f4f2f7] text-primary flex flex-col">
      <TopAuth />

      <main className="flex-1">
        <div className="mx-auto max-w-[1280px] px-4 py-6 sm:px-6 sm:py-10 lg:px-20 lg:py-14">
          <div className="mx-auto max-w-3xl">
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-[#6b7280]">
              <span>Step 3 of 3: Needs Assessment</span>
              <span>Question 1 of 5</span>
            </div>
            <div className="mt-2 h-1.5 w-full rounded-full bg-[#e5e7eb]">
              <div className="h-1.5 w-1/5 rounded-full bg-[#5b2c91]" />
            </div>

            <div className="mt-8 text-center sm:mt-10">
              <h2 className="text-center text-2xl font-semibold leading-tight text-[#1f2937] sm:text-3xl lg:text-[36px] lg:leading-[45.5px]">
                How have you been feeling lately?
              </h2>
              <p className="mt-2 text-sm text-[#6b7280]">
                Select the option that best describes your current state of mind.
              </p>
            </div>

            <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 sm:justify-items-center lg:grid-cols-3">
              {options.map((option) => (
                <NeedOption
                  key={option}
                  label={option}
                  icon={icons[option]}
                  iconClassName="text-[28px]"
                  selected={selectedFeeling === option}
                  onClick={() => setSelectedFeeling(option)}
                />
              ))}
            </div>

            <div className="mt-8 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center sm:gap-4">
              {!hideBackButton && (
                <Link
                  to="/verify-parent"
                  className="w-full rounded-md border border-[#d7d0e2] bg-white py-2.5 text-center text-sm text-[#6b7280] sm:w-40"
                >
                  Back
                </Link>
              )}
              <button
                type="button"
                onClick={handleNext}
                className="w-full rounded-md bg-[#5b2c91] py-2.5 text-center text-sm text-white sm:w-80"
              >
                Next Question -&gt;
              </button>
            </div>

            <div className="mt-4 text-center">
              <button type="button" className="text-xs text-[#6b7280] underline" onClick={handleNext}>
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

export default NeedsAssessment;
