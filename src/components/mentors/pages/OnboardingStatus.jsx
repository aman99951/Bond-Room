import React from 'react';
import { Link } from 'react-router-dom';
import { Check, Hourglass } from 'lucide-react';
import TopAuth from '../../auth/TopAuth';
import BottomAuth from '../../auth/BottomAuth';

const OnboardingStatus = () => {
  return (
    <div className="min-h-screen bg-surface text-primary flex flex-col">
      <TopAuth />

      <main className="flex-1">
        <div className="max-w-[1100px] mx-auto px-4 sm:px-6 lg:px-20 py-8 sm:py-10">
          <div className="border border-default rounded-2xl overflow-hidden bg-surface shadow-sm">
            <div className="p-6 sm:p-8 lg:p-10">
              <div className="flex justify-end">
                <div className="inline-flex items-center rounded-full bg-muted text-xs text-muted px-3 py-1">
                  Step 3 of 5
                </div>
              </div>

              <div className="flex flex-col gap-6">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h2 className="text-lg sm:text-xl font-semibold text-primary">Your Onboarding Journey</h2>
                    <p className="mt-1 text-sm text-muted">Track your progress to becoming a mentor.</p>
                  </div>
                  <div className="inline-flex items-center gap-2 text-sm text-secondary">
                    <span>Current Status:</span>
                    <span className="rounded-full bg-muted text-xs text-muted px-3 py-1">In Review</span>
                  </div>
                </div>

                <div className="mt-2">
                  <div className="relative px-6 sm:px-10">
                    <div className="absolute left-6 right-6 sm:left-10 sm:right-10 top-4 h-px bg-[#5D3699]/15" aria-hidden="true" />
                    <div className="grid grid-cols-4 gap-4 text-center">
                      <div className="relative flex flex-col items-center">
                        <div className="bg-surface px-2">
                          <div className="h-9 w-9 rounded-full bg-[#5D3699] text-white flex items-center justify-center shadow">
                            <Check className="h-4 w-4" aria-hidden="true" />
                          </div>
                        </div>
                        <p className="mt-3 text-sm font-medium text-primary">Application Submitted</p>
                        <span className="mt-1 inline-flex rounded-md bg-muted text-xs text-muted px-2 py-0.5">
                          Completed
                        </span>
                      </div>
                      <div className="relative flex flex-col items-center">
                        <div className="bg-surface px-2">
                          <div className="h-9 w-9 rounded-full bg-muted text-secondary flex items-center justify-center">
                            <Hourglass className="h-4 w-4" aria-hidden="true" />
                          </div>
                        </div>
                        <p className="mt-3 text-sm font-medium text-primary">Document Verification</p>
                        <span className="mt-1 inline-flex rounded-md bg-muted text-xs text-muted px-2 py-0.5">
                          In Review
                        </span>
                      </div>
                      <Link to="/mentor-training-modules" className="relative flex flex-col items-center opacity-60 hover:opacity-100 focus:outline-none">
                        <div className="bg-surface px-2">
                          <div className="h-9 w-9 rounded-full bg-muted text-secondary flex items-center justify-center text-xs">
                            3
                          </div>
                        </div>
                        <p className="mt-3 text-sm font-medium text-primary">Training Module</p>
                        <span className="mt-1 inline-flex rounded-md bg-muted text-xs text-muted px-2 py-0.5">
                          Pending
                        </span>
                      </Link>
                      <Link to="/mentor-impact-dashboard" className="relative flex flex-col items-center opacity-60 hover:opacity-100 focus:outline-none">
                        <div className="bg-surface px-2">
                          <div className="h-9 w-9 rounded-full bg-muted text-secondary flex items-center justify-center text-xs">
                            4
                          </div>
                        </div>
                        <p className="mt-3 text-sm font-medium text-primary">Final Approval</p>
                        <span className="mt-1 inline-flex rounded-md bg-muted text-xs text-muted px-2 py-0.5">
                          Pending
                        </span>
                      </Link>
                    </div>
                  </div>
                </div>

                <div className="rounded-xl border border-default bg-muted/40 p-4 text-sm text-secondary">
                  <p className="font-medium text-primary">Verification in Progress</p>
                  <p className="mt-1 text-sm text-muted">
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
