import React from 'react';
import { Mail, Phone, ShieldCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import TopAuth from '../../auth/TopAuth';
import BottomAuth from '../../auth/BottomAuth';

const VerifyContact = () => {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-surface text-primary flex flex-col">
      <TopAuth />

      <main className="flex-1">
        <div className="max-w-[800px] mx-auto px-4 sm:px-6 lg:px-20 py-8 sm:py-10">
          <div className="border border-default rounded-2xl overflow-hidden bg-surface shadow-sm">
            <div className="p-6 sm:p-8 lg:p-10">
              <div className="flex justify-end">
                <div className="inline-flex items-center rounded-full bg-muted text-xs text-muted px-3 py-1">
                  Step 3 of 5
                </div>
              </div>

              <div className="mt-2 text-center">
                <h2 className="text-lg sm:text-xl font-semibold text-primary">Verify Your Contact Details</h2>
                <p className="mt-1 text-sm text-muted">
                  Enter the OTP codes sent to your email and mobile number to secure your account.
                </p>
              </div>

              <div className="mt-6 space-y-4">
                <div className="border border-default rounded-xl p-4 sm:p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className="h-9 w-9 rounded-full bg-muted flex items-center justify-center">
                        <Mail className="h-4 w-4 text-secondary" aria-hidden="true" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-primary">Email Verification</p>
                        <p className="text-xs text-muted">Sent to: moor***y***@gmail.com</p>
                      </div>
                    </div>
                    <span className="inline-flex items-center rounded-full bg-muted text-xs text-muted px-2 py-0.5">
                      Pending
                    </span>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    {Array.from({ length: 6 }).map((_, idx) => (
                      <input
                        key={`email-otp-${idx}`}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        className="h-10 w-10 rounded-md border border-default text-center text-sm"
                        aria-label={`Email verification digit ${idx + 1}`}
                      />
                    ))}
                  </div>

                  <div className="mt-3 flex items-center justify-between text-xs text-muted">
                    <span>Expires in 04:59</span>
                    <button type="button" className="text-secondary underline">
                      Resend Code
                    </button>
                  </div>
                </div>

                <div className="border border-default rounded-xl p-4 sm:p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className="h-9 w-9 rounded-full bg-muted flex items-center justify-center">
                        <Phone className="h-4 w-4 text-secondary" aria-hidden="true" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-primary">Mobile Verification</p>
                        <p className="text-xs text-muted">Sent to: +91 ******1234</p>
                      </div>
                    </div>
                    <span className="inline-flex items-center gap-1 rounded-full bg-[#5D3699] text-white text-xs px-2 py-0.5">
                      <ShieldCheck className="h-3 w-3" aria-hidden="true" />
                      Verified
                    </span>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    {['4', '3', '1', '7', '2', '1'].map((val, idx) => (
                      <input
                        key={`mobile-otp-${idx}`}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        value={val}
                        readOnly
                        className="h-10 w-10 rounded-md border border-default text-center text-sm bg-muted text-secondary"
                        aria-label={`Mobile verification digit ${idx + 1}`}
                      />
                    ))}
                  </div>

                  <p className="mt-3 text-xs text-muted">Verified successfully</p>
                </div>

                <div className="border border-default rounded-xl p-3 flex items-start gap-2 text-xs text-muted">
                  <ShieldCheck className="h-4 w-4 text-secondary mt-0.5" aria-hidden="true" />
                  <span>
                    These details are required to ensure secure communication and identity verification.
                    Your contact information will not be shared publicly without your consent.
                  </span>
                </div>

                <div className="mt-2">
                  <button
                    type="button"
                    className="w-full rounded-md bg-muted text-secondary py-2.5 text-sm"
                    onClick={() => navigate('/mentor-onboarding-status')}
                  >
                    Continue →
                  </button>
                  <p className="text-center text-xs text-muted mt-2">
                    Both contact details must be verified to proceed.
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

export default VerifyContact;
