import React from 'react';
import { Link } from 'react-router-dom';
import { Check, Hourglass } from 'lucide-react';
import TopAuth from '../../auth/TopAuth';
import BottomAuth from '../../auth/BottomAuth';

const OnboardingStatus = () => {
  return (
    <div className="min-h-screen bg-[#f4f2f7] text-primary flex flex-col">
      <TopAuth />

      <main className="flex-1">
        <div className="max-w-[1180px] mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
          <div className="border border-[#e6e2f1] rounded-[18px] overflow-hidden bg-white shadow-[0_12px_30px_rgba(0,0,0,0.08)]">
            <div className="p-8 sm:p-10 lg:p-12">
              <div className="flex flex-col gap-6">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h2 className="text-2xl sm:text-3xl font-semibold text-[#1f2937]">Your Onboarding Journey</h2>
                    <p className="mt-1 text-sm text-[#6b7280]">Track your progress to becoming a mentor.</p>
                  </div>
                  <div className="inline-flex items-center gap-2 text-sm text-[#6b7280]">
                    <span>Current Status:</span>
                    <span className="rounded-full bg-[#ffe0a3] text-xs text-[#a25b00] px-3 py-1">In Review</span>
                  </div>
                </div>

                <div className="mt-2">
                  <div className="relative px-2 sm:px-6">
                    <div className="hidden sm:block absolute left-6 right-6 top-4 h-px bg-[#e5e7eb]" aria-hidden="true" />
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 text-center">
                      <div className="relative flex flex-col items-center">
                        <div className="bg-white px-2">
                          <div className="h-10 w-10 rounded-full bg-[#12b981] text-white flex items-center justify-center shadow">
                            <Check className="h-5 w-5" aria-hidden="true" />
                          </div>
                        </div>
                        <p className="mt-3 text-sm font-medium text-[#1f2937]">Application Submitted</p>
                        <span className="mt-1 inline-flex rounded-md bg-[#dff6ea] text-xs text-[#1a9b61] px-2 py-0.5">
                          Completed
                        </span>
                      </div>
                      <div className="relative flex flex-col items-center">
                        <div className="bg-white px-2">
                          <div className="h-10 w-10 rounded-full bg-[#f59e0b] text-white flex items-center justify-center shadow">
                            <Hourglass className="h-5 w-5" aria-hidden="true" />
                          </div>
                        </div>
                        <p className="mt-3 text-sm font-medium text-[#1f2937]">Document Verification</p>
                        <span className="mt-1 inline-flex rounded-md bg-[#ffe0a3] text-xs text-[#a25b00] px-2 py-0.5">
                          In Review
                        </span>
                      </div>
                      <Link to="/mentor-training-modules" className="relative flex flex-col items-center opacity-60 hover:opacity-100 focus:outline-none">
                        <div className="bg-white px-2">
                          <div className="h-10 w-10 rounded-full bg-[#f3f4f6] text-[#9ca3af] flex items-center justify-center text-sm">
                            3
                          </div>
                        </div>
                        <p className="mt-3 text-sm font-medium text-[#6b7280]">Training Module</p>
                        <span className="mt-1 inline-flex rounded-md bg-[#f3f4f6] text-xs text-[#9ca3af] px-2 py-0.5">
                          Pending
                        </span>
                      </Link>
                      <Link to="/mentor-impact-dashboard" className="relative flex flex-col items-center opacity-60 hover:opacity-100 focus:outline-none">
                        <div className="bg-white px-2">
                          <div className="h-10 w-10 rounded-full bg-[#f3f4f6] text-[#9ca3af] flex items-center justify-center text-sm">
                            4
                          </div>
                        </div>
                        <p className="mt-3 text-sm font-medium text-[#6b7280]">Final Approval</p>
                        <span className="mt-1 inline-flex rounded-md bg-[#f3f4f6] text-xs text-[#9ca3af] px-2 py-0.5">
                          Pending
                        </span>
                      </Link>
                    </div>
                  </div>
                </div>

                <div className="rounded-xl bg-[#f3ebff] p-5 text-sm text-[#5b2c91]">
                  <p className="font-semibold text-[#5b2c91]">Verification in Progress</p>
                  <p className="mt-1 text-sm text-[#5b2c91]">
                    You will be notified via email and SMS once the document verification is complete.
                    This step is essential before you can access training modules.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <BottomAuth />
    </div>
  );
};

export default OnboardingStatus;
