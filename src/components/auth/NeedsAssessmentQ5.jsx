import React from 'react';
import TopAuth from './TopAuth';
import BottomAuth from './BottomAuth';
import { Link } from 'react-router-dom';
import selectedIcon from '../assets/Vector.png';

const Choice = ({ label, selected }) => {
  return (
    <button
      type="button"
      className={`relative h-12 sm:h-14 rounded-lg border px-4 text-sm text-secondary flex items-center justify-center ${
        selected ? 'border-accent shadow-sm' : 'border-default'
      }`}
    >
      {label}
      {selected && <img src={selectedIcon} alt="" className="absolute right-3 h-4 w-4" />}
    </button>
  );
};

const NeedsAssessmentQ5 = () => {
  return (
    <div className="min-h-screen bg-surface text-primary flex flex-col">
      <TopAuth />

      <main className="flex-1">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-20 py-10 sm:py-14">
          <div className="max-w-3xl mx-auto">
            <div className="flex items-center justify-between text-xs text-muted">
              <span>Step 3 of 3: Needs Assessment</span>
              <span>Question 5 of 5</span>
            </div>
            <div className="mt-2 h-1.5 w-full rounded-full bg-muted">
              <div className="h-1.5 w-56 rounded-full bg-gray-800"></div>
            </div>

            <div className="text-center mt-10">
              <h2 className="text-xl sm:text-2xl font-semibold">Which language do you prefer?</h2>
            </div>

            <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Choice label="Tamil" selected />
              <Choice label="English" />
              <Choice label="Telugu" />
              <Choice label="Malayalam" />
              <Choice label="Kannada" />
              <Choice label="Hindi" />
            </div>

            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                to="/needs-assessment/q4"
                className="w-full sm:w-40 rounded-md border border-default py-2.5 text-sm text-center text-muted"
              >
                Back
              </Link>
              <Link
                to="/dashboard"
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

export default NeedsAssessmentQ5;
