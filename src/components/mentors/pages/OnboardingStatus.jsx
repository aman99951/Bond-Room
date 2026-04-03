import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Check, Hourglass } from 'lucide-react';
import TopAuth from '../../auth/TopAuth';
import BottomAuth from '../../auth/BottomAuth';
import { mentorApi } from '../../../apis/api/mentorApi';
import { useMentorData } from '../../../apis/apihook/useMentorData';

const DOCUMENT_LABELS = {
  id_front: 'ID Proof Front',
  id_back: 'ID Proof Back',
  address_front: 'Address Proof Front',
  address_back: 'Address Proof Back',
};

const OnboardingStatus = () => {
  const navigate = useNavigate();
  const { mentor } = useMentorData();
  const [onboarding, setOnboarding] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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
  const isCompleted = (value) => value === 'completed' || value === 'verified';
  const applicationDone = isCompleted(status?.application_status);
  const identityDone = isCompleted(status?.identity_status);
  const trainingDone = isCompleted(status?.training_status);
  const accessReady = applicationDone && identityDone;
  const currentStatusLabel = status?.current_status || 'pending';
  const currentStatusText = String(currentStatusLabel).replace(/_/g, ' ');
  const identityVerification = onboarding?.identity_verification;
  const hasIdentitySubmission = Boolean(
    identityVerification &&
      (
        identityVerification.id ||
        identityVerification.id_proof_document ||
        identityVerification.passport_or_license ||
        identityVerification.address_proof_document ||
        identityVerification.aadhaar_front ||
        identityVerification.aadhaar_back ||
        identityVerification.id_proof_type ||
        identityVerification.address_proof_type
      )
  );

  const rejectedDocumentReasons = useMemo(
    () => {
      const documentReviewStatus =
        identityVerification && typeof identityVerification.document_review_status === 'object'
          ? identityVerification.document_review_status
          : {};
      const documentReviewComments =
        identityVerification && typeof identityVerification.document_review_comments === 'object'
          ? identityVerification.document_review_comments
          : {};
      return Object.entries(documentReviewStatus)
        .filter(([, value]) => String(value || '').toLowerCase() === 'rejected')
        .map(([key]) => ({
          key,
          label: DOCUMENT_LABELS[key] || key,
          reason:
            String(documentReviewComments[key] || '').trim() ||
            'Rejected by admin. Please re-upload a clearer/valid document.',
        }));
    },
    [identityVerification]
  );

  const steps = useMemo(
    () => [
      { key: 'application_status', label: 'Personal Detials', required: true },
      { key: 'identity_status', label: 'Document Verification', required: true },
      { key: 'training_status', label: 'Training Module', link: '/mentor-training-modules', optional: true },
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
        <div className="w-full px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
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
                      {currentStatusText}
                    </span>
                  </div>
                </div>

                <div className="mt-2">
                  <div className="relative px-2 sm:px-6">
                    <div className="hidden sm:block absolute left-6 right-6 top-4 h-px bg-[#e5e7eb]" aria-hidden="true" />
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 text-center">
                      {steps.map((step, index) => {
                        const value = status?.[step.key] || 'pending';
                        const label = getStatusLabel(value);
                        const content = (
                          <>
                            <div className="relative bg-white px-2">
                              {renderStepIcon(value, index)}
                            </div>
                            <p className={`mt-3 text-sm font-medium ${value === 'pending' ? 'text-[#6b7280]' : 'text-[#1f2937]'}`}>
                              {step.label}
                            </p>
                            {step.optional && (
                              <span className="mt-1 inline-flex rounded-full bg-[#ede9fe] px-2 py-0.5 text-[10px] font-medium text-[#5b2c91]">
                                Optional
                              </span>
                            )}
                            <span className={`mt-1 inline-flex rounded-md text-xs px-2 py-0.5 ${getBadgeClasses(value)}`}>
                              {label}
                            </span>
                            {step.key === 'identity_status' && value === 'pending' && !hasIdentitySubmission && (
                              <Link
                                to="/mentor-verify-identity"
                                className="mt-3 inline-flex items-center gap-1 rounded-full border border-[#d9c7f7] bg-[#f7f1ff] px-3 py-1 text-[11px] font-semibold text-[#5b2c91] transition-colors hover:bg-[#efe5ff] hover:text-[#4a2374]"
                              >
                                <span className="h-1.5 w-1.5 rounded-full bg-[#5b2c91]" aria-hidden="true" />
                                Upload Documents
                              </Link>
                            )}
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

                {(rejectedDocumentReasons.length > 0 || status?.identity_status === 'rejected') && (
                  <div className="rounded-xl border border-[#fecaca] bg-gradient-to-br from-[#fff7f7] to-[#fff1f2] p-5">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <h3 className="text-sm font-semibold text-[#b91c1c]">
                          Document Verification Feedback
                        </h3>
                        <p className="mt-1 text-xs text-[#991b1b]">
                          Please correct and re-upload only the rejected document(s).
                        </p>
                      </div>
                      <Link
                        to="/mentor-verify-identity"
                        className="inline-flex rounded-md border border-[#fca5a5] bg-white px-3 py-1.5 text-xs font-semibold text-[#b91c1c] hover:bg-[#fff5f5]"
                      >
                        Re-upload Documents
                      </Link>
                    </div>

                    {rejectedDocumentReasons.length > 0 ? (
                      <div className="mt-4 grid gap-2">
                        {rejectedDocumentReasons.map((item) => (
                          <div
                            key={item.key}
                            className="rounded-lg border border-[#fecaca] bg-white px-3 py-2"
                          >
                            <p className="text-xs font-semibold text-[#7f1d1d]">{item.label}</p>
                            <p className="mt-1 text-xs text-[#991b1b]">{item.reason}</p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="mt-4 rounded-lg border border-[#fecaca] bg-white px-3 py-2 text-xs text-[#991b1b]">
                        Document verification is rejected. Reason was not provided by admin yet.
                      </div>
                    )}
                  </div>
                )}

                <div className="rounded-xl bg-[#f3ebff] p-5 text-sm text-[#5b2c91]">
                  {accessReady ? (
                    <>
                      <p className="font-semibold text-[#5b2c91]">Dashboard Access Ready</p>
                      <p className="mt-1 text-sm text-[#5b2c91]">
                        Required steps are complete. Training is optional and can be completed anytime.
                      </p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <button
                          type="button"
                          className="inline-flex rounded-md bg-[#5b2c91] text-white px-4 py-2 text-xs font-semibold"
                          onClick={() => navigate('/mentor-impact-dashboard')}
                        >
                          Skip Training & Go Dashboard
                        </button>
                        {!trainingDone && (
                          <button
                            type="button"
                            className="inline-flex rounded-md border border-[#c9b5e8] bg-white text-[#5b2c91] px-4 py-2 text-xs font-semibold"
                            onClick={() => navigate('/mentor-training-modules')}
                          >
                            Do Training Now
                          </button>
                        )}
                      </div>
                    </>
                  ) : (
                    <>
                      <p className="font-semibold text-[#5b2c91]">Verification in Progress</p>
                      <p className="mt-1 text-sm text-[#5b2c91]">
                        You will be notified via email and SMS once the document verification is complete.
                        Dashboard unlocks after Personal Details and Document Verification are completed.
                      </p>
                    </>
                  )}
                </div>
                {(loading || error) && (
                  <div className={`text-xs ${error ? 'text-red-600' : 'text-[#6b7280]'}`}>
                    {error || 'Loading onboarding status...'}
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
