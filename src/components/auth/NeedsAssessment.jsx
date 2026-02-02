import React from 'react';
import TopAuth from './TopAuth';
import BottomAuth from './BottomAuth';
import { Link } from 'react-router-dom';
import burnOutIcon from '../assets/burn-out.png';
import anxiousIcon from '../assets/anxious.png';
import confusedIcon from '../assets/confused.png';
import lonelyIcon from '../assets/lonely.png';
import hopefulIcon from '../assets/hopefull.png';
import moreIcon from '../assets/more.png';

const NeedOption = ({ label, selected, icon }) => {
  return (
    <button
      type="button"
      className={`relative h-28 sm:h-32 rounded-xl border text-center flex flex-col items-center justify-center gap-3 ${
        selected ? 'border-accent shadow-sm' : 'border-default'
      }`}
    >
      <span className={`h-10 w-10 rounded-full flex items-center justify-center ${selected ? 'bg-surface' : 'bg-muted'}`}>
        <img src={icon} alt="" className="h-5 w-5" />
      </span>
      <span className="text-sm text-secondary">{label}</span>
      {selected && <span className="absolute top-2 right-2 h-2.5 w-2.5 rounded-full bg-accent"></span>}
    </button>
  );
};

const NeedsAssessment = () => {
  return (
    <div className="min-h-screen bg-surface text-primary flex flex-col">
      <TopAuth />

      <main className="flex-1">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-20 py-10 sm:py-14">
          <div className="max-w-3xl mx-auto">
            <div className="flex items-center justify-between text-xs text-muted">
              <span>Step 3 of 3: Needs Assessment</span>
              <span>Question 1 of 5</span>
            </div>
            <div className="mt-2 h-1.5 w-full rounded-full bg-muted">
              <div className="h-1.5 w-24 rounded-full bg-gray-800"></div>
            </div>

            <div className="text-center mt-10">
              <h2 className="text-xl sm:text-2xl font-semibold">How have you been feeling lately?</h2>
              <p className="mt-2 text-sm text-muted">
                Select the option that best describes your current state of mind.
              </p>
            </div>

            <div className="mt-8 grid grid-cols-2 sm:grid-cols-3 gap-4">
              <NeedOption label="Burnt Out" icon={burnOutIcon} />
              <NeedOption label="Anxious" icon={anxiousIcon} selected />
              <NeedOption label="Confused" icon={confusedIcon} />
              <NeedOption label="Lonely" icon={lonelyIcon} />
              <NeedOption label="Hopeful" icon={hopefulIcon} />
              <NeedOption label="Other" icon={moreIcon} />
            </div>

            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                to="/verify-parent"
                className="w-full sm:w-40 rounded-md border border-default py-2.5 text-sm text-center text-muted"
              >
                Back
              </Link>
              <Link
                to="/needs-assessment/q2"
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

export default NeedsAssessment;
