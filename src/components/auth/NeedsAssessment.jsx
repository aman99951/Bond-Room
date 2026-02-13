import React, { useState } from 'react';
import TopAuth from './TopAuth';
import BottomAuth from './BottomAuth';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useMenteeAssessment } from '../../apis/apihook/useMenteeAssessment';

const NeedOption = ({ label, selected, icon, iconClassName, onClick }) => {
  return (
    <button
      type="button"
      className={`relative w-[240px] h-[156px] rounded-[12px] border-2 text-center flex flex-col items-center justify-center gap-3 bg-white shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)] ${
        selected ? 'border-[#41a34a] bg-[#f2faf3]' : 'border-[#d7d0e2]'
      }`}
      onClick={onClick}
    >
      <span className="h-16 w-16 rounded-full bg-[#F5F5F5] border border-[#E5E7EB] flex items-center justify-center">
        {typeof icon === 'string' ? (
          <span className={`leading-none ${iconClassName || 'text-[28px]'}`}>{icon}</span>
        ) : null}
      </span>
      <span className={`text-sm ${selected ? 'text-[#1f2937] font-semibold' : 'text-[#6b7280]'}`}>{label}</span>
      {selected && (
        <span className="absolute top-2 right-2 h-4 w-4 rounded-full bg-[#41a34a] text-white text-[10px] flex items-center justify-center">
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

  const options = [
    'Burnt Out',
    'Anxious',
    'Confused',
    'Lonely',
    'Hopeful',
    'Other',
  ];

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
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-20 py-10 sm:py-14">
          <div className="max-w-3xl mx-auto">
            <div className="flex items-center justify-between text-xs text-[#6b7280]">
              <span>Step 3 of 3: Needs Assessment</span>
              <span>Question 1 of 5</span>
            </div>
            <div className="mt-2 h-1.5 w-full rounded-full bg-[#e5e7eb]">
              <div className="h-1.5 w-1/5 rounded-full bg-[#5b2c91]"></div>
            </div>

            <div className="text-center mt-10">
              <h2
                className="text-center text-[#1f2937]"
                style={{ fontFamily: 'Manrope', fontSize: '36px', lineHeight: '45.5px', fontWeight: 600 }}
              >
                How have you been feeling lately?
              </h2>
              <p className="mt-2 text-sm text-[#6b7280]">
                Select the option that best describes your current state of mind.
              </p>
            </div>

            <div className="mt-8 grid grid-cols-2 sm:grid-cols-3 gap-4">
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

            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
              {!hideBackButton && (
                <Link
                  to="/verify-parent"
                  className="w-full sm:w-40 rounded-md border border-[#d7d0e2] py-2.5 text-sm text-center text-[#6b7280] bg-white"
                >
                  Back
                </Link>
              )}
              <button
                type="button"
                onClick={handleNext}
                className="w-full sm:w-80 rounded-md bg-[#5b2c91] text-white py-2.5 text-sm text-center"
              >
                Next Question →
              </button>
            </div>

            <div className="mt-4 text-center">
              <button className="text-xs text-[#6b7280] underline">Skip this question</button>
            </div>
          </div>
        </div>
      </main>

      <BottomAuth />
    </div>
  );
};

export default NeedsAssessment;
