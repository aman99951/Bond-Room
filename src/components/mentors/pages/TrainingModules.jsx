import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, Play, Lock, Circle, ArrowLeft } from 'lucide-react';
import TopAuth from '../../auth/TopAuth';
import BottomAuth from '../../auth/BottomAuth';

const TrainingModules = () => {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-transparent text-[#1f2937] flex flex-col">
      <TopAuth />

      <main className="flex-1">
        <div className="max-w-[1060px] mx-auto px-4 sm:px-6 lg:px-10 py-8 sm:py-10">
          <button
            type="button"
            className="inline-flex items-center gap-2 text-sm text-[#6b7280] hover:text-[#1f2937] mb-4"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Back
          </button>
          <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 className="text-lg sm:text-xl font-semibold text-[#1f2937]">Training Modules</h2>
              <p className="mt-1 text-sm text-[#6b7280]">
                Complete all modules to unlock the final quiz and activate your account.
              </p>
            </div>
            <div className="inline-flex items-center gap-3 rounded-xl border border-white/15 bg-white px-4 py-3 shadow-[0_8px_20px_rgba(0,0,0,0.2)]">
              <div
                className="relative h-11 w-11 rounded-full flex items-center justify-center"
                style={{ background: 'conic-gradient(#fdd253 0% 50%, #f1f2f4 50% 100%)' }}
              >
                <div className="absolute inset-[3px] rounded-full bg-white" />
                <span className="relative text-xs text-[#1f2937] font-medium">50%</span>
              </div>
              <div>
                <p className="text-sm font-medium text-[#1f2937]">2 of 4 Completed</p>
                <p className="text-xs text-[#6b7280]">Keep going!</p>
              </div>
            </div>
          </div>

          <div className="mt-6 space-y-4">
            <div className="rounded-xl border border-[#d9f3e6] bg-[#f0fff7] p-4 sm:p-5 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-full bg-[#18b77e] text-white flex items-center justify-center">
                  <Check className="h-4 w-4" aria-hidden="true" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-[#1f2937]">Active Listening Basics</p>
                  <p className="text-xs text-[#6b7280]">Completed on Dec 18, 2025</p>
                </div>
              </div>
              <button type="button" className="text-sm text-[#4B5563] font-medium">
                Review
              </button>
            </div>

            <div className="rounded-xl border border-[#e6e2f1] bg-white p-4 sm:p-5 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-full bg-[#fdd253] text-[#1f2937] flex items-center justify-center">
                  <Play className="h-4 w-4" aria-hidden="true" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-[#5b2c91]">Emotional Safety Protocols</p>
                  <p className="text-xs text-[#6b7280]">Learn how to handle sensitive topics with care.</p>
                </div>
              </div>
              <button
                type="button"
                className="rounded-md bg-[#5b2c91] text-white px-5 py-2 text-xs font-semibold"
                onClick={() => navigate('/mentor-training-boundaries')}
              >
                Continue
              </button>
            </div>

            <div className="rounded-xl border border-[#e6e2f1] bg-[#f8fbfb] p-4 sm:p-5 flex items-center gap-3">
              <div className="h-9 w-9 rounded-full bg-[#e5e7eb] text-[#9ca3af] flex items-center justify-center">
                <Lock className="h-4 w-4" aria-hidden="true" />
              </div>
              <div>
                <p className="text-sm font-semibold text-[#6b7280]">Boundaries &amp; Ethics</p>
                <p className="text-xs text-[#9ca3af]">Complete previous module to unlock.</p>
              </div>
            </div>

            <div className="rounded-xl border border-[#e6e2f1] bg-[#f8fbfb] p-4 sm:p-5 flex items-center gap-3">
              <div className="h-9 w-9 rounded-full bg-[#e5e7eb] text-[#9ca3af] flex items-center justify-center">
                <Lock className="h-4 w-4" aria-hidden="true" />
              </div>
              <div>
                <p className="text-sm font-semibold text-[#6b7280]">Working with Teens</p>
                <p className="text-xs text-[#9ca3af]">Complete previous module to unlock.</p>
              </div>
            </div>
          </div>
        </div>
      </main>

      <BottomAuth />
    </div>
  );
};

export default TrainingModules;
