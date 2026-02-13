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
      className={`relative w-[240px] h-[69px] rounded-[12px] border-2 px-[20px] py-[22px] text-sm text-secondary flex items-center justify-center ${
        selected ? 'border-[#41a34a] bg-[#f2faf3] shadow-sm' : 'border-default'
      }`}
    >
      <span
        className="whitespace-nowrap"
        style={{
          fontFamily: 'DM Sans',
          fontSize: '16px',
          lineHeight: '24px',
          fontWeight: selected ? 600 : 400,
          textAlign: 'center',
        }}
      >
        {label}
      </span>
      {selected && (
        <span className="absolute right-3 h-4 w-4 rounded-full bg-[#41a34a] text-white text-[10px] flex items-center justify-center">
          {'\u2713'}
        </span>
      )}
    </button>
  );
};

const NeedsAssessmentQ3 = () => {
  const navigate = useNavigate();
  const { draft, saveAnswer } = useMenteeAssessment();
  const [selectedSupport, setSelectedSupport] = useState(draft.support_type || 'Motivation');

  const options = [
    'Someone to Listen',
    'Study Guidance / Tips',
    'Motivation',
    'Stress Relief Strategies',
    'Life Advice / Perspective',
    "I'm Not Sure",
  ];

  const handleNext = () => {
    saveAnswer('support_type', selectedSupport);
    navigate('/needs-assessment/q4');
  };

  return (
    <div className="min-h-screen bg-surface text-primary flex flex-col">
      <TopAuth />

      <main className="flex-1">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-20 py-10 sm:py-14">
          <div className="max-w-3xl mx-auto">
            <div className="flex items-center justify-between text-xs text-muted">
              <span style={{ fontFamily: 'DM Sans', fontSize: '12px', lineHeight: '24px', fontWeight: 400, textAlign: 'center' }}>
                Step 3 of 3: Needs Assessment
              </span>
              <span style={{ fontFamily: 'DM Sans', fontSize: '12px', lineHeight: '24px', fontWeight: 400, textAlign: 'center' }}>
                Question 3 of 5
              </span>
            </div>
            <div className="mt-2 h-1.5 w-full rounded-full bg-muted">
              <div className="h-1.5 w-3/5 rounded-full bg-accent"></div>
            </div>

            <div className="text-center mt-10">
              <h2
                className="text-center text-[#1f2937]"
                style={{ fontFamily: 'Manrope', fontSize: '36px', lineHeight: '45.5px', fontWeight: 600 }}
              >
                What kind of support are you looking for right now?
              </h2>
            </div>

            <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4 justify-items-center">
              {options.map((option) => (
                <Choice
                  key={option}
                  label={option}
                  selected={selectedSupport === option}
                  onClick={() => setSelectedSupport(option)}
                />
              ))}
            </div>

            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                to="/needs-assessment/q2"
                className="w-full sm:w-40 rounded-md border border-default py-2.5 text-sm text-center text-muted"
              >
                Back
              </Link>
              <button
                type="button"
                onClick={handleNext}
                className="w-full sm:w-80 rounded-md bg-accent text-on-accent py-2.5 text-sm text-center"
              >
                Next Question →
              </button>
            </div>

            <div className="mt-4 text-center">
              <button className="text-xs text-subtle underline" onClick={handleNext}>Skip this question</button>
            </div>
          </div>
        </div>
      </main>

      <BottomAuth />
    </div>
  );
};

export default NeedsAssessmentQ3;
