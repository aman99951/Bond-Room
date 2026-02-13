import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Check, Hourglass, Info, X } from 'lucide-react';
import TopAuth from '../../auth/TopAuth';
import BottomAuth from '../../auth/BottomAuth';
import { mentorApi } from '../../../apis/api/mentorApi';
import { useMentorData } from '../../../apis/apihook/useMentorData';

const OnboardingStatus = () => {
  const navigate = useNavigate();
  const { mentor } = useMentorData();
  const [onboarding, setOnboarding] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusPopup, setStatusPopup] = useState(null);

  useEffect(() => {
    let cancelled = false;
    if (!mentor?.id) {
      setLoading(false);
      return undefined;
    }

    const loadOnboarding = async () => {
      setLoading(true);
      setError('');
      try {
        const response = await mentorApi.getMentorOnboarding(mentor.id);
        if (!cancelled) {
          setOnboarding(response || null);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err?.message || 'Unable to load onboarding status.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadOnboarding();
    return () => {
      cancelled = true;
    };
  }, [mentor?.id]);

  const status = onboarding?.status || {};
  const normalizedStatus = String(status?.current_status || '').toLowerCase();
  const normalizedFinal = String(status?.final_approval_status || '').toLowerCase();
  const isComplete = normalizedStatus === 'completed' || normalizedFinal === 'completed';
  const currentStatusLabel = (status?.current_status || 'pending').replace('_', ' ');

  useEffect(() => {
    if (!isComplete) return;
    const timeoutId = window.setTimeout(() => {
      navigate('/mentor-impact-dashboard');
    }, 400);
    return () => window.clearTimeout(timeoutId);
  }, [isComplete, navigate]);

  const steps = useMemo(
    () => [
      { key: 'application_status', label: 'Application Submitted' },
      { key: 'identity_status', label: 'Document Verification' },
      { key: 'training_status', label: 'Training Module', link: '/mentor-training-modules' },
      { key: 'final_approval_status', label: 'Final Approval', link: '/mentor-impact-dashboard' },
    ],
    []
  );

  const getStatusLabel = (value) => {
    if (value === 'completed' || value === 'verified') return 'Completed';
    if (value === 'in_review') return 'In Review';
    if (value === 'rejected') return 'Rejected';
    return 'Pending';
  };

  const getBadgeClasses = (value) => {
    if (value === 'completed' || value === 'verified') return 'bg-[#dff6ea] text-[#1a9b61]';
    if (value === 'in_review') return 'bg-[#ffe0a3] text-[#a25b00]';
    if (value === 'rejected') return 'bg-[#fee2e2] text-[#b91c1c]';
    return 'bg-[#f3f4f6] text-[#9ca3af]';
  };

  const getStepComment = (stepKey, stepValue) => {
    const identityComment = onboarding?.identity_verification?.reviewer_notes || '';
    const finalRejectionReason = status?.final_rejection_reason || '';
    if (stepKey === 'identity_status') {
      if (identityComment) return identityComment;
      if (stepValue === 'rejected') return 'Identity verification was rejected by admin. No additional comment was provided.';
      return 'No reviewer comment available yet.';
    }
    if (stepKey === 'final_approval_status' && stepValue === 'rejected') {
      if (finalRejectionReason) return finalRejectionReason;
      return 'Final approval was rejected by admin. No reason was provided.';
    }
    if (stepValue === 'rejected') {
      return 'This step is marked as rejected. Please contact support/admin for more details.';
    }
    return 'No comment available for this step.';
  };

  const renderStepIcon = (value, index) => {
    if (value === 'completed' || value === 'verified') {
      return (
        <div className="h-10 w-10 rounded-full bg-[#12b981] text-white flex items-center justify-center shadow">
          <Check className="h-5 w-5" aria-hidden="true" />
        </div>
      );
    }
    if (value === 'in_review') {
      return (
        <div className="h-10 w-10 rounded-full bg-[#f59e0b] text-white flex items-center justify-center shadow">
          <Hourglass className="h-5 w-5" aria-hidden="true" />
        </div>
      );
    }
    if (value === 'rejected') {
      return (
        <div className="h-10 w-10 rounded-full bg-[#ef4444] text-white flex items-center justify-center shadow">
          <span className="text-sm font-semibold">!</span>
        </div>
      );
    }
    return (
      <div className="h-10 w-10 rounded-full bg-[#f3f4f6] text-[#9ca3af] flex items-center justify-center text-sm">
        {index + 1}
      </div>
    );
  };

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
                    <span className={`rounded-full text-xs px-3 py-1 ${getBadgeClasses(status?.current_status)}`}>
                      {currentStatusLabel}
                    </span>
                  </div>
                </div>

                <div className="mt-2">
                  <div className="relative px-2 sm:px-6">
                    <div className="hidden sm:block absolute left-6 right-6 top-4 h-px bg-[#e5e7eb]" aria-hidden="true" />
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 text-center">
                      {steps.map((step, index) => {
                        const value = status?.[step.key] || 'pending';
                        const label = getStatusLabel(value);
                        const isRejected = value === 'rejected';
                        const content = (
                          <>
                            <div className="relative bg-white px-2">
                              {renderStepIcon(value, index)}
                              {isRejected && (
                                <button
                                  type="button"
                                  className="absolute -top-1 -right-1 rounded-full border border-[#ef4444] bg-white p-1 text-[#ef4444] shadow"
                                  onClick={(event) => {
                                    event.preventDefault();
                                    event.stopPropagation();
                                    setStatusPopup({
                                      title: step.label,
                                      status: label,
                                      comment: getStepComment(step.key, value),
                                      showComment: step.key !== 'training_status',
                                      uploadLink:
                                        step.key === 'identity_status' && value === 'rejected'
                                          ? '/mentor-verify-identity'
                                          : '',
                                    });
                                  }}
                                  aria-label={`View ${step.label} status details`}
                                >
                                  <Info className="h-3 w-3" />
                                </button>
                              )}
                            </div>
                            <p className={`mt-3 text-sm font-medium ${value === 'pending' ? 'text-[#6b7280]' : 'text-[#1f2937]'}`}>
                              {step.label}
                            </p>
                            <span className={`mt-1 inline-flex rounded-md text-xs px-2 py-0.5 ${getBadgeClasses(value)}`}>
                              {label}
                            </span>
                          </>
                        );
                        if (step.link) {
                          return (
                            <Link
                              key={step.key}
                              to={step.link}
                              className={`relative flex flex-col items-center focus:outline-none ${
                                value === 'pending' ? 'opacity-60 hover:opacity-100' : ''
                              }`}
                            >
                              {content}
                            </Link>
                          );
                        }
                        return (
                          <div key={step.key} className="relative flex flex-col items-center">
                            {content}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <div className="rounded-xl bg-[#f3ebff] p-5 text-sm text-[#5b2c91]">
                  {isComplete ? (
                    <>
                      <p className="font-semibold text-[#5b2c91]">Onboarding Complete</p>
                      <p className="mt-1 text-sm text-[#5b2c91]">
                        You are fully approved. Redirecting to your dashboard now.
                      </p>
                      <button
                        type="button"
                        className="mt-3 inline-flex rounded-md bg-[#5b2c91] text-white px-4 py-2 text-xs font-semibold"
                        onClick={() => navigate('/mentor-impact-dashboard')}
                      >
                        Go to Dashboard
                      </button>
                    </>
                  ) : (
                    <>
                      <p className="font-semibold text-[#5b2c91]">Verification in Progress</p>
                      <p className="mt-1 text-sm text-[#5b2c91]">
                        You will be notified via email and SMS once the document verification is complete.
                        This step is essential before you can access training modules.
                      </p>
                    </>
                  )}
                </div>
                {(loading || error) && (
                  <div className={`text-xs ${error ? 'text-red-600' : 'text-[#6b7280]'}`}>
                    {error || 'Loading onboarding status...'}
                  </div>
                )}

                {statusPopup && (
                  <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center px-4">
                    <div className="w-full max-w-md rounded-2xl border border-[#e6e2f1] bg-white p-5 shadow-2xl">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h3 className="text-base font-semibold text-[#111827]">{statusPopup.title}</h3>
                          <p className="mt-1 text-xs text-[#6b7280]">Status details</p>
                        </div>
                        <button
                          type="button"
                          className="rounded-md border border-[#e5e7eb] p-1.5 text-[#6b7280]"
                          onClick={() => setStatusPopup(null)}
                          aria-label="Close status popup"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                      <div className="mt-4 space-y-3 text-sm">
                        <div className="rounded-lg bg-[#f5f0ff] px-3 py-2 text-[#5b2c91]">
                          <span className="font-semibold">Current Status:</span> {statusPopup.status}
                        </div>
                        {statusPopup.showComment && (
                          <div className="rounded-lg border border-[#e5e7eb] px-3 py-2 text-[#374151]">
                            <span className="font-semibold">Comment:</span> {statusPopup.comment}
                          </div>
                        )}
                        {statusPopup.uploadLink && (
                          <div className="rounded-lg border border-[#e9d5ff] bg-[#faf5ff] px-3 py-2 text-sm">
                            <span className="font-semibold text-[#5b2c91]">Upload page:</span>{' '}
                            <Link to={statusPopup.uploadLink} className="text-[#5b2c91] underline font-medium">
                              Re-upload documents
                            </Link>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
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
