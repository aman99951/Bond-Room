import React, { useEffect, useMemo, useState } from 'react';
import { Mail, Phone, ShieldCheck, Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import TopAuth from '../../auth/TopAuth';
import BottomAuth from '../../auth/BottomAuth';
import mentorLeft from '../../assets/teach1.png';
import mentorBottom from '../../assets/teach2.png';
import imageContainer from '../../assets/Image Container.png';
import { mentorApi } from '../../../apis/api/mentorApi';
import { useMentorAuth } from '../../../apis/apihook/useMentorAuth';
import { useMentorData } from '../../../apis/apihook/useMentorData';
import { clearPendingMentorRegistration, getAuthSession, getPendingMentorRegistration } from '../../../apis/api/storage';

const VerifyContact = () => {
  const navigate = useNavigate();
  const pendingMentor = useMemo(() => getPendingMentorRegistration(), []);
  const { mentor } = useMentorData();
  const { sendMentorOtp, verifyMentorOtp, login } = useMentorAuth();
  const [emailOtp, setEmailOtp] = useState('');
  const [phoneOtp, setPhoneOtp] = useState('');
  const [emailVerified, setEmailVerified] = useState(false);
  const [phoneVerified, setPhoneVerified] = useState(false);
  const [emailHint, setEmailHint] = useState('');
  const [phoneHint, setPhoneHint] = useState('');
  const [infoMessage, setInfoMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [authReady, setAuthReady] = useState(Boolean(getAuthSession()?.accessToken));
  const [contactStatusLoaded, setContactStatusLoaded] = useState(false);
  const [otpSent, setOtpSent] = useState({ email: false, phone: false });

  const mentorId = pendingMentor?.mentorId || mentor?.id;

  const maskEmail = (value) => {
    if (!value) return '***@***';
    const [user, domain] = value.split('@');
    if (!domain) return '***@***';
    const visible = user.slice(0, 2);
    return `${visible}${'*'.repeat(Math.max(user.length - 2, 0))}@${domain}`;
  };

  const maskPhone = (value) => {
    if (!value) return '******0000';
    const digits = value.replace(/\D/g, '');
    if (digits.length <= 4) return digits;
    return `${'*'.repeat(Math.max(digits.length - 4, 0))}${digits.slice(-4)}`;
  };

  const maskedEmail = maskEmail(pendingMentor?.email || mentor?.email || '');
  const maskedPhone = maskPhone(pendingMentor?.mobile || mentor?.mobile || '');

  useEffect(() => {
    let cancelled = false;
    if (authReady) return undefined;
    if (!pendingMentor?.email || !pendingMentor?.password) return undefined;

    const ensureLogin = async () => {
      try {
        await login(pendingMentor.email, pendingMentor.password, 'mentors');
        if (!cancelled) setAuthReady(true);
      } catch (err) {
        if (!cancelled) {
          setErrorMessage(err?.message || 'Unable to authenticate mentor session.');
        }
      }
    };

    ensureLogin();
    return () => {
      cancelled = true;
    };
  }, [authReady, login, pendingMentor?.email, pendingMentor?.password]);

  useEffect(() => {
    let cancelled = false;
    if (!authReady || !mentorId) return undefined;
    setContactStatusLoaded(false);

    const loadContactVerification = async () => {
      try {
        const response = await mentorApi.listContactVerifications({ mentor_id: mentorId });
        const list = Array.isArray(response) ? response : response?.results || [];
        const existing = list[0] || null;
        if (!cancelled) {
          setEmailVerified(Boolean(existing?.email_verified));
          setPhoneVerified(Boolean(existing?.phone_verified));
        }
      } catch (err) {
        if (!cancelled) {
          setErrorMessage(err?.message || 'Unable to load verification status.');
        }
      } finally {
        if (!cancelled) {
          setContactStatusLoaded(true);
        }
      }
    };

    loadContactVerification();
    return () => {
      cancelled = true;
    };
  }, [authReady, mentorId]);

  useEffect(() => {
    if (!mentorId || !contactStatusLoaded) return;
    if (!otpSent.email && !emailVerified) {
      handleSendOtp('email');
    }
    if (!otpSent.phone && !phoneVerified) {
      handleSendOtp('phone');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mentorId, contactStatusLoaded, emailVerified, phoneVerified]);

  useEffect(() => {
    if (!emailVerified || !phoneVerified) return;
    clearPendingMentorRegistration();
    navigate('/mentor-onboarding-status', { replace: true });
  }, [emailVerified, phoneVerified, navigate]);

  const updateOtpValue = (current, index, value) => {
    const digit = value.replace(/\D/g, '').slice(-1);
    const padded = current.padEnd(6, '');
    const chars = padded.split('');
    chars[index] = digit;
    return chars.join('').trim();
  };

  const handleSendOtp = async (channel) => {
    if (!mentorId) {
      setErrorMessage('Mentor registration not found. Please register again.');
      return;
    }
    setErrorMessage('');
    setInfoMessage('');
    setLoading(true);
    try {
      const response = await sendMentorOtp(mentorId, channel);
      if (channel === 'email' && response?.otp) {
        setEmailHint(`Test OTP: ${response.otp}`);
      }
      if (channel === 'phone' && response?.otp) {
        setPhoneHint(`Test OTP: ${response.otp}`);
      }
      setOtpSent((prev) => ({ ...prev, [channel]: true }));
      setInfoMessage(`${channel === 'email' ? 'Email' : 'Phone'} OTP sent successfully.`);
    } catch (err) {
      setErrorMessage(err?.message || 'Unable to send OTP.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (channel) => {
    if (!mentorId) {
      setErrorMessage('Mentor registration not found. Please register again.');
      return;
    }
    const otp = channel === 'email' ? emailOtp : phoneOtp;
    if (otp.length !== 6) {
      setErrorMessage('Please enter a valid 6-digit OTP.');
      return;
    }
    setErrorMessage('');
    setInfoMessage('');
    setLoading(true);
    try {
      await verifyMentorOtp(mentorId, channel, otp);
      if (channel === 'email') {
        setEmailVerified(true);
      } else {
        setPhoneVerified(true);
      }
      setInfoMessage(`${channel === 'email' ? 'Email' : 'Phone'} verified successfully.`);
    } catch (err) {
      setErrorMessage(err?.message || 'OTP verification failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleContinue = () => {
    if (!emailVerified || !phoneVerified) {
      setErrorMessage('Both email and phone verifications are required to proceed.');
      return;
    }
    clearPendingMentorRegistration();
    navigate('/mentor-onboarding-status');
  };

  return (
    <div className="min-h-screen bg-[#f4f2f7] text-primary flex flex-col">
      <TopAuth />

      <main className="flex-1">
        <div className="w-full flex justify-center px-4 sm:px-6 lg:px-4 py-4 sm:py-6 lg:py-10 bg-transparent">
          <div className="rounded-[12px] overflow-hidden w-full max-w-[1266px] border border-[#e6e2f1] bg-white shadow-[0_10px_30px_rgba(0,0,0,0.2)] xl:min-h-[820px]">
            <div className="grid grid-cols-1 xl:grid-cols-[591px_675px] h-full">
              <div className="hidden xl:grid grid-rows-2 h-full bg-transparent relative">
                <img
                  src={imageContainer}
                  alt=""
                  aria-hidden="true"
                  className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-20 w-[300px] h-[300px] md:w-[380px] md:h-[380px] lg:w-[500px] lg:h-[500px]"
                />
                <div className="grid grid-cols-[1.05fr_1fr]">
                  <div>
                    <img
                      src={mentorLeft}
                      alt="Mentor guidance"
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div className="relative bg-[#5b2c91] p-6 text-white flex flex-col justify-between">
                    <div>
                      <h3 className="font-['Manrope'] font-bold text-[37px] leading-[36.5px]">
                        Join a
                        <br />
                        community
                        <br />
                        built on trust
                        <br />
                        and care.
                      </h3>
                      <p className="mt-3 font-['Manrope'] text-[16px] leading-[22.5px] font-normal text-white/90">
                        Your guidance can help a student feel seen -- beyond marks, ranks, and expectations.
                      </p>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-[1.05fr_1fr]">
                  <div className="bg-[#f2c94c] p-6 text-[#1f2937] flex items-center justify-center">
                    <ul className="list-disc pl-4 space-y-3 text-sm">
                      <li>Bond Room exists to restore human connection in an exam-driven system.</li>
                      <li>You are not expected to teach.</li>
                      <li>Your presence and perspective are enough.</li>
                    </ul>
                  </div>
                  <div className="bg-black">
                    <img
                      src={mentorBottom}
                      alt="Students"
                      className="h-full w-full object-cover"
                    />
                  </div>
                </div>
              </div>

              <div className="p-4 sm:p-6 lg:p-10 bg-[#f7f5fa] text-[#1f2937] h-full">
                <div className="max-w-2xl mx-auto md:max-w-none md:mx-0">
                  <div className="inline-flex items-center rounded-full bg-[#e9ddff] text-xs text-[#5b2c91] px-3 py-1 font-medium">
                    Step 3 of 3
                  </div>

                  <h2 className="mt-3 text-xl sm:text-2xl font-semibold text-[#1f2937]">
                    Verify Your Contact Details
                  </h2>
                  <p className="mt-1 text-sm text-[#6b7280]">
                    Enter the OTP codes sent to your email and mobile number to secure your account.
                  </p>

                  <div className="mt-6 space-y-4">
                    <div className="border border-[#e6e2f1] rounded-xl p-4 sm:p-5 bg-[#fff5d6]">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3">
                          <div className="h-9 w-9 rounded-full bg-white flex items-center justify-center border border-[#f2e3b0]">
                            <Mail className="h-4 w-4 text-[#5b2c91]" aria-hidden="true" />
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-[#1f2937]">Email Verification</p>
                            <p className="text-xs text-[#6b7280]">Sent to: {maskedEmail}</p>
                          </div>
                        </div>
                        {emailVerified ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-[#e6fff2] text-[#1a9b61] text-xs px-2 py-0.5">
                            <Check className="h-3 w-3" aria-hidden="true" />
                            Verified
                          </span>
                        ) : (
                          <span className="inline-flex items-center rounded-full bg-[#ffe0a3] text-xs text-[#a25b00] px-2 py-0.5">
                            Pending
                          </span>
                        )}
                      </div>

                      <div className="mt-4 flex flex-wrap gap-2">
                        {Array.from({ length: 6 }).map((_, idx) => (
                          <input
                            key={`email-otp-${idx}`}
                            type="text"
                            inputMode="numeric"
                            maxLength={1}
                            className="h-10 w-10 rounded-md border border-[#e6e2f1] text-center text-sm bg-white"
                            aria-label={`Email verification digit ${idx + 1}`}
                            value={emailOtp[idx] || ''}
                            onChange={(event) => setEmailOtp(updateOtpValue(emailOtp, idx, event.target.value))}
                            disabled={emailVerified}
                          />
                        ))}
                      </div>

                      <div className="mt-3 flex items-center justify-between text-xs text-[#6b7280]">
                        <span>{emailVerified ? 'Verified' : 'Enter the code to verify.'}</span>
                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            className="text-[#5b2c91] underline disabled:opacity-70"
                            onClick={() => handleSendOtp('email')}
                            disabled={loading}
                          >
                            Resend Code
                          </button>
                          {!emailVerified && (
                            <button
                              type="button"
                              className="rounded-md bg-[#5b2c91] text-white px-3 py-1 text-[10px]"
                              onClick={() => handleVerifyOtp('email')}
                              disabled={loading}
                            >
                              Verify
                            </button>
                          )}
                        </div>
                      </div>
                      {!emailVerified && emailHint && (
                        <p className="mt-2 text-xs text-[#5b2c91]">{emailHint}</p>
                      )}
                    </div>

                    <div className="border border-[#e6e2f1] rounded-xl p-4 sm:p-5 bg-white">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3">
                          <div className="h-9 w-9 rounded-full bg-[#f1ecfb] flex items-center justify-center">
                            <Phone className="h-4 w-4 text-[#5b2c91]" aria-hidden="true" />
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-[#1f2937]">Mobile Verification</p>
                            <p className="text-xs text-[#6b7280]">Sent to: +91 {maskedPhone}</p>
                          </div>
                        </div>
                        {phoneVerified ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-[#e6fff2] text-[#1a9b61] text-xs px-2 py-0.5">
                            <Check className="h-3 w-3" aria-hidden="true" />
                            Verified
                          </span>
                        ) : (
                          <span className="inline-flex items-center rounded-full bg-[#ffe0a3] text-xs text-[#a25b00] px-2 py-0.5">
                            Pending
                          </span>
                        )}
                      </div>

                      <div className="mt-4 flex flex-wrap gap-2">
                        {Array.from({ length: 6 }).map((_, idx) => (
                          <input
                            key={`mobile-otp-${idx}`}
                            type="text"
                            inputMode="numeric"
                            maxLength={1}
                            value={phoneOtp[idx] || ''}
                            onChange={(event) => setPhoneOtp(updateOtpValue(phoneOtp, idx, event.target.value))}
                            className={`h-10 w-10 rounded-md border border-[#e6e2f1] text-center text-sm ${
                              phoneVerified ? 'bg-[#f8f8fb] text-[#6b7280]' : 'bg-white'
                            }`}
                            aria-label={`Mobile verification digit ${idx + 1}`}
                            disabled={phoneVerified}
                          />
                        ))}
                      </div>

                      <div className="mt-3 flex items-center justify-between text-xs text-[#6b7280]">
                        <span>{phoneVerified ? 'Verified successfully' : 'Enter the code to verify.'}</span>
                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            className="text-[#5b2c91] underline disabled:opacity-70"
                            onClick={() => handleSendOtp('phone')}
                            disabled={loading}
                          >
                            Resend Code
                          </button>
                          {!phoneVerified && (
                            <button
                              type="button"
                              className="rounded-md bg-[#5b2c91] text-white px-3 py-1 text-[10px]"
                              onClick={() => handleVerifyOtp('phone')}
                              disabled={loading}
                            >
                              Verify
                            </button>
                          )}
                        </div>
                      </div>
                      {!phoneVerified && phoneHint && (
                        <p className="mt-2 text-xs text-[#5b2c91]">{phoneHint}</p>
                      )}
                    </div>

                    <div className="border border-[#e6e2f1] rounded-xl p-3 flex items-start gap-2 text-xs text-[#6b7280] bg-white">
                      <ShieldCheck className="h-4 w-4 text-[#1a9b61] mt-0.5" aria-hidden="true" />
                      <span>
                        These details are required to ensure secure communication and identity verification.
                        Your contact information will not be shared publicly without your consent.
                      </span>
                    </div>

                    <div className="mt-2">
                      <button
                        type="button"
                        className="w-full rounded-md bg-[#5b2c91] text-white py-2.5 text-sm font-semibold hover:bg-[#4a2374]"
                        onClick={handleContinue}
                        disabled={loading}
                      >
                        Continue →
                      </button>
                      <p className="text-center text-xs text-[#6b7280] mt-2">
                        Both contact details must be verified to proceed.
                      </p>
                      {errorMessage && <p className="mt-2 text-xs text-red-600">{errorMessage}</p>}
                      {!errorMessage && infoMessage && (
                        <p className="mt-2 text-xs text-green-700">{infoMessage}</p>
                      )}
                    </div>
                  </div>
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
