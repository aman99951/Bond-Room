import React from 'react';
import TopAuth from './TopAuth';
import BottomAuth from './BottomAuth';
import { Link } from 'react-router-dom';
const Choice = ({ label, selected }) => {
  return (
    <button
      type="button"
      className={`relative w-[240px] h-[69px] rounded-[12px] border-2 px-[59px] py-[22px] text-sm text-secondary flex items-center justify-center ${
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
              <Choice label="Someone to Listen" />
              <Choice label="Study Guidance / Tips" />
              <Choice label="Motivation" selected />
              <Choice label="Stress Relief Strategies" />
              <Choice label="Life Advice / Perspective" />
              <Choice label="I'm Not Sure" />
            </div>

            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                to="/needs-assessment/q2"
                className="w-full sm:w-40 rounded-md border border-default py-2.5 text-sm text-center text-muted"
              >
                Back
              </Link>
              <Link
                to="/needs-assessment/q4"
                className="w-full sm:w-80 rounded-md bg-accent text-on-accent py-2.5 text-sm text-center"
              >
                Next Question →
              </Link>
            </div>

            <div className="mt-4 text-center">
              <button className="text-xs text-subtle underline">Skip this question</button>
            </div>
          </div>
        </div>
      </main>

      <BottomAuth />
    </div>
  );
};

export default NeedsAssessmentQ3;
