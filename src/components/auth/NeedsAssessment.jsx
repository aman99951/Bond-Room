import React from 'react';
import TopAuth from './TopAuth';
import BottomAuth from './BottomAuth';
import { Link } from 'react-router-dom';
import moreIcon from '../assets/more.png';

const NeedOption = ({ label, selected, icon, iconClassName }) => {
  return (
    <button
      type="button"
      className={`relative w-[240px] h-[156px] rounded-[12px] border-2 text-center flex flex-col items-center justify-center gap-3 bg-white shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)] ${
        selected ? 'border-[#41a34a] bg-[#f2faf3]' : 'border-[#d7d0e2]'
      }`}
    >
      <span className="h-16 w-16 rounded-full bg-[#F5F5F5] border border-[#E5E7EB] flex items-center justify-center">
        {typeof icon === 'string' ? (
          <span className={`leading-none ${iconClassName || 'text-[28px]'}`}>{icon}</span>
        ) : (
          <img src={icon} alt="" className={`object-contain ${iconClassName || 'h-7 w-7'}`} />
        )}
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
              <NeedOption label="Burnt Out" icon="🤯" iconClassName="text-[28px]" />
              <NeedOption label="Anxious" icon="😟" iconClassName="text-[28px]" selected />
              <NeedOption label="Confused" icon="😕" iconClassName="text-[28px]" />
              <NeedOption label="Lonely" icon="😞" iconClassName="text-[28px]" />
              <NeedOption label="Hopeful" icon="😌" iconClassName="text-[28px]" />
              <NeedOption label="Other" icon="⋯" iconClassName="text-[28px]"/>
            </div>

            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                to="/verify-parent"
                className="w-full sm:w-40 rounded-md border border-[#d7d0e2] py-2.5 text-sm text-center text-[#6b7280] bg-white"
              >
                Back
              </Link>
              <Link
                to="/needs-assessment/q2"
                className="w-full sm:w-80 rounded-md bg-[#5b2c91] text-white py-2.5 text-sm text-center"
              >
                Next Question →
              </Link>
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


