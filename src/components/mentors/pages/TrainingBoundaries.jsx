import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import TopAuth from '../../auth/TopAuth';
import BottomAuth from '../../auth/BottomAuth';

const TrainingBoundaries = () => {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-[#f4f2f7] text-primary flex flex-col">
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

          <div className="border border-[#e6e2f1] rounded-[18px] bg-white shadow-[0_12px_30px_rgba(0,0,0,0.08)] p-6 sm:p-8 lg:p-10">
            <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h2 className="text-lg sm:text-2xl font-semibold text-[#1f2937]">Boundaries &amp; Ethics</h2>
                <p className="mt-2 text-sm text-[#6b7280] max-w-2xl">
                  Learn the professional boundaries between mentor and mentee, ethical guidance, and how to
                  build trust while keeping the student safe.
                </p>
              </div>
              <div className="inline-flex items-center gap-2 rounded-full bg-[#e9ddff] text-xs text-[#5b2c91] px-3 py-1 font-medium">
                Module 3 of 4
              </div>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <div className="rounded-xl border border-[#e6e2f1] bg-[#f7f5fa] p-5">
                <h3 className="text-sm font-semibold text-[#1f2937]">Lesson Outline</h3>
                <ul className="mt-3 space-y-2 text-sm text-[#6b7280] list-disc pl-4">
                  <li>Setting healthy boundaries and expectations</li>
                  <li>Privacy, confidentiality, and reporting</li>
                  <li>Handling sensitive disclosures</li>
                  <li>Maintaining a safe mentor-mentee relationship</li>
                </ul>
              </div>
              <div className="rounded-xl border border-[#e6e2f1] bg-white p-5">
                <h3 className="text-sm font-semibold text-[#1f2937]">Quick Check</h3>
                <p className="mt-2 text-sm text-[#6b7280]">
                  Complete the short quiz after the lesson to unlock the next module.
                </p>
                <div className="mt-4 h-2 w-full rounded-full bg-[#ebe7f4]">
                  <div className="h-2 w-1/3 rounded-full bg-[#5b2c91]" />
                </div>
                <p className="mt-2 text-xs text-[#6b7280]">33% completed</p>
              </div>
            </div>

            <div className="mt-6 rounded-xl border border-[#e6e2f1] bg-[#fff5d6] p-4 text-sm text-[#6b7280]">
              Tip: Use clear session boundaries and share them with students and guardians upfront.
            </div>

            <div className="mt-6 flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
              <button
                type="button"
                className="rounded-md border border-[#5b2c91] text-[#5b2c91] px-5 py-2 text-sm font-semibold"
              >
                Review Guidelines
              </button>
              <button
                type="button"
                className="rounded-md bg-[#5b2c91] text-white px-6 py-2.5 text-sm font-semibold hover:bg-[#4a2374]"
                onClick={() => navigate('/mentor-training-modules')}
              >
                Continue to Quiz
              </button>
            </div>
          </div>
        </div>
      </main>

      <BottomAuth />
    </div>
  );
};

export default TrainingBoundaries;
