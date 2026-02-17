import React, { useMemo, useState } from 'react';
import TopAuth from './TopAuth';
import BottomAuth from './BottomAuth';
import { useNavigate } from 'react-router-dom';
import mentorLeft from '../assets/teach1.png';
import mentorBottom from '../assets/teach2.png';
import imageContainer from '../assets/Image Container.png';
import { useMentorAuth } from '../../apis/apihook/useMentorAuth';
import {
  getPendingMentorRegistration,
  setPendingMentorRegistration,
} from '../../apis/api/storage';

const MentorRegister = () => {
  const [selectedLanguages, setSelectedLanguages] = useState([]);
  const [selectedCareAreas, setSelectedCareAreas] = useState([]);
  const languagesOptions = ['Tamil', 'English', 'Telugu', 'Kannada'];
  const careAreaOptions = ['Anxiety', 'Relationships', 'Academic Stress'];
  const pendingMentor = useMemo(() => getPendingMentorRegistration(), []);
  const navigate = useNavigate();
  const { loading, registerMentor, sendMentorOtp, verifyMentorOtp, login } = useMentorAuth();
  const [errorMessage, setErrorMessage] = useState('');
  const [infoMessage, setInfoMessage] = useState('');
  const [otpErrorMessage, setOtpErrorMessage] = useState('');
  const [otpInfoMessage, setOtpInfoMessage] = useState('');
  const [emailHint, setEmailHint] = useState('');
  const [phoneHint, setPhoneHint] = useState('');
  const [mentorId, setMentorId] = useState(pendingMentor?.mentorId || null);
  const [emailVerified, setEmailVerified] = useState(false);
  const [phoneVerified, setPhoneVerified] = useState(false);
  const [otpModal, setOtpModal] = useState({
    open: false,
    channel: 'email',
    otp: '',
  });
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    mobile: '',
    dob: '',
    gender: '',
    cityState: '',
    qualification: '',
    bio: '',
    consent: false,
    password: '',
  });
  const isDev = Boolean(import.meta?.env?.DEV);

  const toggleMultiCheckbox = (value, setter) => {
    setter((prev) => {
      if (prev.includes(value)) {
        return prev.filter((item) => item !== value);
      }
      return [...prev, value];
    });
  };

  const updateField = (key, value) => {
    if (key === 'email') {
      setEmailVerified(false);
      setPhoneVerified(false);
      setEmailHint('');
      setPhoneHint('');
      setMentorId(null);
    }
    if (key === 'mobile') {
      setPhoneVerified(false);
      setPhoneHint('');
    }
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const validateRegistrationForm = () => {
    if (
      !form.firstName.trim() ||
      !form.lastName.trim() ||
      !form.email.trim() ||
      !form.mobile.trim() ||
      !form.dob ||
      !form.gender ||
      !form.cityState.trim() ||
      !form.password
    ) {
      return 'Please fill all required fields to continue.';
    }
    if (!form.consent) {
      return 'Please confirm your consent to proceed.';
    }
    return '';
  };

  const buildMentorPayload = () => {
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Kolkata';
    return {
      first_name: form.firstName.trim(),
      last_name: form.lastName.trim(),
      email: form.email.trim().toLowerCase(),
      mobile: form.mobile.trim(),
      dob: form.dob,
      gender: form.gender,
      city_state: form.cityState.trim(),
      languages: selectedLanguages,
      care_areas: selectedCareAreas,
      preferred_formats: [],
      availability: [],
      timezone,
      qualification: form.qualification.trim(),
      bio: form.bio.trim(),
      consent: form.consent,
      password: form.password,
    };
  };

  const ensureMentorRegistered = async () => {
    const validationError = validateRegistrationForm();
    if (validationError) {
      throw new Error(validationError);
    }

    const mentor = await registerMentor(buildMentorPayload());
    setPendingMentorRegistration({
      mentorId: mentor?.id,
      email: form.email.trim().toLowerCase(),
      password: form.password,
      mobile: form.mobile.trim(),
    });

    if (mentor?.id && mentor?.id !== mentorId) {
      setEmailVerified(false);
      setPhoneVerified(false);
    }
    setMentorId(mentor?.id || null);
    return mentor;
  };

  const handleSendOtp = async (channel, options = {}) => {
    const { registerIfNeeded = true } = options;
    setErrorMessage('');
    setInfoMessage('');
    setOtpErrorMessage('');
    setOtpInfoMessage('');

    try {
      let currentMentorId = mentorId || pendingMentor?.mentorId || null;
      if (registerIfNeeded || !currentMentorId) {
        const mentor = await ensureMentorRegistered();
        currentMentorId = mentor?.id || currentMentorId;
      }
      if (!currentMentorId) {
        throw new Error('Please complete registration details first, then request OTP.');
      }

      const response = await sendMentorOtp(currentMentorId, channel);

      if (channel === 'email' && response?.otp) {
        setEmailHint(`Test OTP: ${response.otp}`);
      }
      if (channel === 'phone' && response?.otp) {
        setPhoneHint(`Test OTP: ${response.otp}`);
      }
      const successMessage = `${channel === 'email' ? 'Email' : 'Phone'} OTP sent successfully.`;
      setInfoMessage(successMessage);
      setOtpInfoMessage(successMessage);
    } catch (err) {
      const message = err?.message || 'Unable to send OTP.';
      setErrorMessage(message);
      setOtpErrorMessage(message);
    }
  };

  const handleVerifyOtp = async (channel, otp) => {
    const currentMentorId = mentorId || pendingMentor?.mentorId;
    if (!currentMentorId) {
      const message = 'Please complete registration details first, then request OTP.';
      setErrorMessage(message);
      setOtpErrorMessage(message);
      return;
    }
    if (otp.length !== 6) {
      const message = 'Please enter a valid 6-digit OTP.';
      setErrorMessage(message);
      setOtpErrorMessage(message);
      return;
    }
    setErrorMessage('');
    setInfoMessage('');
    setOtpErrorMessage('');
    setOtpInfoMessage('');
    try {
      await verifyMentorOtp(currentMentorId, channel, otp);
      if (channel === 'email') {
        setEmailVerified(true);
      } else {
        setPhoneVerified(true);
      }
      setOtpModal({ open: false, channel, otp: '' });
      setInfoMessage(`${channel === 'email' ? 'Email' : 'Phone'} verified successfully.`);
    } catch (err) {
      const message = err?.message || 'OTP verification failed.';
      setErrorMessage(message);
      setOtpErrorMessage(message);
    }
  };

  const openOtpModal = async (channel) => {
    setOtpErrorMessage('');
    setOtpInfoMessage('');
    setOtpModal({ open: true, channel, otp: '' });
    await handleSendOtp(channel, { registerIfNeeded: true });
  };

  const closeOtpModal = () => {
    setOtpErrorMessage('');
    setOtpInfoMessage('');
    setOtpModal((prev) => ({ ...prev, open: false, otp: '' }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setErrorMessage('');
    setInfoMessage('');

    const validationError = validateRegistrationForm();
    if (validationError) {
      setErrorMessage(validationError);
      return;
    }

    if (!emailVerified || !phoneVerified) {
      setErrorMessage('Please verify both email and mobile before submitting.');
      return;
    }

    try {
      const mentor = await ensureMentorRegistered();
      await login(form.email.trim().toLowerCase(), form.password, 'mentors');
      setMentorId(mentor?.id || null);
      navigate('/mentor-verify-identity');
    } catch (err) {
      setErrorMessage(err?.message || 'Unable to submit mentor application right now.');
    }
  };

  return (
    <div className="min-h-screen text-[#1f2937] flex flex-col">
      <TopAuth />

      <main className="flex-1 bg-transparent">
        <div className="w-full flex justify-center px-4 sm:px-6 lg:px-4 py-4 sm:py-6 lg:py-10 bg-transparent">
          <div className="rounded-[12px] overflow-hidden w-full max-w-[1266px] bg-white shadow-[0_10px_30px_rgba(0,0,0,0.2)] xl:min-h-[820px]">
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

              <div className="p-4 sm:p-6 lg:p-10 bg-white text-[#1f2937] h-full overflow-y-auto">
                <div className="max-w-2xl mx-auto md:max-w-none md:mx-0">
                  <div className="inline-flex items-center rounded-full bg-[#e9ddff] text-xs text-[#5b2c91] px-3 py-1 font-medium">
                    Step 1 of 3
                  </div>
                  <h2 className="mt-3 text-xl sm:text-2xl font-semibold text-[#1f2937]">
                    Apply as a Mentor
                  </h2>
                  <p className="mt-1 text-sm text-[#6b7280]">
                    Share your experience and guide students with care.
                  </p>
                  <p className="mt-4 text-xs sm:text-sm text-[#6b7280]">
                    Bond Room connects students with trusted mentors who listen without judgment.
                    Tell us about yourself so we can match you thoughtfully.
                  </p>

                  <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                      <div>
                        <label htmlFor="firstName" className="block text-xs font-medium text-[#6b7280] mb-1">
                          First name
                        </label>
                        <input
                          id="firstName"
                          className="w-full rounded-md border bg-white px-3 py-2.5 text-sm text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#5b2c91] focus:border-transparent transition-all"
                          placeholder="e.g. Priya"
                          value={form.firstName}
                          onChange={(event) => updateField('firstName', event.target.value)}
                        />
                      </div>
                      <div>
                        <label htmlFor="lastName" className="block text-xs font-medium text-[#6b7280] mb-1">
                          Last name
                        </label>
                        <input
                          id="lastName"
                          className="w-full rounded-md border bg-white px-3 py-2.5 text-sm text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#5b2c91] focus:border-transparent transition-all"
                          placeholder="e.g. Sharma"
                          value={form.lastName}
                          onChange={(event) => updateField('lastName', event.target.value)}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                      <div>
                        <label htmlFor="email" className="block text-xs font-medium text-[#6b7280] mb-1">
                          Email
                        </label>
                        <div className="flex items-center gap-2">
                          <input
                            id="email"
                            type="email"
                            className="flex-1 rounded-md border bg-white px-3 py-2.5 text-sm text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#5b2c91] focus:border-transparent transition-all"
                            placeholder="name@example.com"
                            value={form.email}
                            onChange={(event) => updateField('email', event.target.value)}
                          />
                          <button
                            type="button"
                            className={`rounded-md px-3 py-2 text-xs font-semibold border ${
                              emailVerified
                                ? 'border-[#22c55e] text-[#15803d] bg-[#f0fdf4]'
                                : 'border-[#5b2c91] text-[#5b2c91] bg-white'
                            }`}
                            onClick={() => openOtpModal('email')}
                            disabled={loading || !form.email.trim() || emailVerified}
                          >
                            {emailVerified ? 'Verified' : 'Verify'}
                          </button>
                        </div>
                      </div>

                      <div>
                        <label htmlFor="mobile" className="block text-xs font-medium text-[#6b7280] mb-1">
                          Mobile Number
                        </label>
                        <div className="flex items-center gap-2">
                          <input
                            id="mobile"
                            type="tel"
                            className="flex-1 rounded-md border bg-white px-3 py-2.5 text-sm text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#5b2c91] focus:border-transparent transition-all"
                            placeholder="+91 98765 43210"
                            value={form.mobile}
                            onChange={(event) => updateField('mobile', event.target.value)}
                          />
                          <button
                            type="button"
                            className={`rounded-md px-3 py-2 text-xs font-semibold border ${
                              phoneVerified
                                ? 'border-[#22c55e] text-[#15803d] bg-[#f0fdf4]'
                                : 'border-[#5b2c91] text-[#5b2c91] bg-white'
                            }`}
                            onClick={() => openOtpModal('phone')}
                            disabled={loading || !form.mobile.trim() || phoneVerified}
                          >
                            {phoneVerified ? 'Verified' : 'Verify'}
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                      <div>
                        <label htmlFor="dob" className="block text-xs font-medium text-[#6b7280] mb-1">
                          Date of Birth
                        </label>
                        <input
                          id="dob"
                          type="date"
                          className="w-full rounded-md border bg-white px-3 py-2.5 text-sm text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#5b2c91] focus:border-transparent transition-all"
                          value={form.dob}
                          onChange={(event) => updateField('dob', event.target.value)}
                        />
                      </div>
                      <div>
                        <label htmlFor="gender" className="block text-xs font-medium text-[#6b7280] mb-1">
                          Gender
                        </label>
                        <select
                          id="gender"
                          className="w-full rounded-md border border-[#d7d0e2] bg-white px-3 py-2.5 text-sm text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#5b2c91] focus:border-transparent transition-all"
                          value={form.gender}
                          onChange={(event) => updateField('gender', event.target.value)}
                        >
                          <option value="">Select Gender</option>
                          <option>Female</option>
                          <option>Male</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label htmlFor="cityState" className="block text-xs font-medium text-[#6b7280] mb-1">
                        City / State
                      </label>
                      <input
                        id="cityState"
                        className="w-full rounded-md border bg-white px-3 py-2.5 text-sm text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#5b2c91] focus:border-transparent transition-all"
                        placeholder="e.g. Tiruchirappalli, Tamil Nadu"
                        value={form.cityState}
                        onChange={(event) => updateField('cityState', event.target.value)}
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-[#6b7280] mb-1">
                        Languages Spoken
                      </label>
                      <div className="w-full rounded-md border border-[#d7d0e2] bg-white px-3 py-2.5">
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                          {languagesOptions.map((lang) => (
                            <label key={lang} className="inline-flex items-center gap-2 text-sm text-[#111827] cursor-pointer">
                              <input
                                type="checkbox"
                                className="accent-[#5b2c91] w-4 h-4 cursor-pointer"
                                checked={selectedLanguages.includes(lang)}
                                onChange={() => toggleMultiCheckbox(lang, setSelectedLanguages)}
                              />
                              <span>{lang}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                      <p className="text-xs text-[#6b7280] mt-1">
                        Select one or more languages.
                      </p>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-[#6b7280] mb-1">
                        Mentor Care Areas
                      </label>
                      <div className="w-full rounded-md border border-[#d7d0e2] bg-white px-3 py-2.5">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {careAreaOptions.map((area) => (
                            <label key={area} className="inline-flex items-center gap-2 text-sm text-[#111827] cursor-pointer">
                              <input
                                type="checkbox"
                                className="accent-[#5b2c91] w-4 h-4 cursor-pointer"
                                checked={selectedCareAreas.includes(area)}
                                onChange={() => toggleMultiCheckbox(area, setSelectedCareAreas)}
                              />
                              <span>{area}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                      <p className="text-xs text-[#6b7280] mt-1">
                        Select one or more care areas.
                      </p>
                    </div>

                    <div>
                      <label htmlFor="qualification" className="block text-xs font-medium text-[#6b7280] mb-1">
                        Educational Qualification
                      </label>
                      <input
                        id="qualification"
                        className="w-full rounded-md border bg-white px-3 py-2.5 text-sm text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#5b2c91] focus:border-transparent transition-all"
                        placeholder="e.g. PhD in Psychology"
                        value={form.qualification}
                        onChange={(event) => updateField('qualification', event.target.value)}
                      />
                    </div>

                    <div>
                      <label htmlFor="bio" className="block text-xs font-medium text-[#6b7280] mb-1">
                        Brief Bio
                      </label>
                      <textarea
                        id="bio"
                        rows={3}
                        className="w-full rounded-md border bg-white px-3 py-2.5 text-sm text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#5b2c91] focus:border-transparent transition-all resize-none"
                        placeholder="Tell us a bit about your professional background..."
                        value={form.bio}
                        onChange={(event) => updateField('bio', event.target.value)}
                      />
                    </div>

                    <div>
                      <label htmlFor="mentorPassword" className="block text-xs font-medium text-[#6b7280] mb-1">
                        Create password
                      </label>
                      <input
                        id="mentorPassword"
                        type="password"
                        className="w-full rounded-md border bg-white px-3 py-2.5 text-sm text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#5b2c91] focus:border-transparent transition-all"
                        placeholder="Minimum 6 characters"
                        value={form.password}
                        onChange={(event) => updateField('password', event.target.value)}
                      />
                    </div>

                    <label className="flex items-start gap-2 text-xs sm:text-sm text-[#6b7280] cursor-pointer">
                      <input
                        id="consent"
                        type="checkbox"
                        className="mt-0.5 sm:mt-1 accent-[#5b2c91] w-4 h-4 cursor-pointer"
                        checked={form.consent}
                        onChange={(event) => updateField('consent', event.target.checked)}
                      />
                      <span>I agree to share my information for background verification purposes.</span>
                    </label>

                    {(errorMessage || infoMessage) && (
                      <p className={`text-sm ${errorMessage ? 'text-red-600' : 'text-green-700'}`}>
                        {errorMessage || infoMessage}
                      </p>
                    )}

                    <button
                      type="submit"
                      className="w-full rounded-md bg-[#5b2c91] hover:bg-[#4a2374] text-white py-3 text-sm font-semibold transition-all duration-200 shadow-lg hover:shadow-xl active:scale-[0.98]"
                      disabled={loading}
                    >
                      {loading ? 'Submitting...' : 'Submit Application'}
                    </button>

                    <p className="text-center text-xs text-[#6b7280] leading-relaxed">
                      By continuing, you agree to our{' '}
                      <a href="/terms" className="underline hover:text-[#5b2c91]">Terms &amp; Conditions</a>
                      {' '}and{' '}
                      <a href="/privacy" className="underline hover:text-[#5b2c91]">Privacy Policy</a>
                    </p>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {otpModal.open && (
        <div
          className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          onClick={closeOtpModal}
        >
          <div
            className="w-full max-w-sm rounded-xl bg-white border border-[#e6e2f1] shadow-2xl p-5"
            onClick={(event) => event.stopPropagation()}
          >
            <h3 className="text-base font-semibold text-[#1f2937]">
              Verify {otpModal.channel === 'email' ? 'Email' : 'Mobile'}
            </h3>
            <p className="mt-1 text-xs text-[#6b7280]">
              Enter the 6-digit OTP to complete verification.
            </p>

            <input
              type="text"
              inputMode="numeric"
              maxLength={6}
              className="mt-4 w-full rounded-md border border-[#d7d0e2] bg-white px-3 py-2 text-sm text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#5b2c91] focus:border-transparent"
              placeholder="Enter 6-digit OTP"
              value={otpModal.otp}
              onChange={(event) =>
                setOtpModal((prev) => ({
                  ...prev,
                  otp: event.target.value.replace(/\D/g, '').slice(0, 6),
                }))
              }
            />

            {otpModal.channel === 'email' && emailHint && (
              <p className="mt-2 text-[11px] text-[#5b2c91]">{emailHint}</p>
            )}
            {otpModal.channel === 'phone' && phoneHint && (
              <p className="mt-2 text-[11px] text-[#5b2c91]">{phoneHint}</p>
            )}
            {isDev && (
              <p className="mt-2 text-[11px] text-[#6b7280]">Local test OTP: 123456</p>
            )}

            <div className="mt-4 flex items-center justify-between gap-2">
              <button
                type="button"
                className="text-xs text-[#5b2c91] underline disabled:opacity-60"
                onClick={() => handleSendOtp(otpModal.channel, { registerIfNeeded: false })}
                disabled={loading}
              >
                Resend OTP
              </button>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className="rounded-md border border-[#d7d0e2] px-3 py-1.5 text-xs text-[#374151]"
                  onClick={closeOtpModal}
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="rounded-md bg-[#5b2c91] text-white px-3 py-1.5 text-xs"
                  onClick={() => handleVerifyOtp(otpModal.channel, otpModal.otp)}
                  disabled={loading}
                >
                  Verify OTP
                </button>
              </div>
            </div>
            {(otpErrorMessage || otpInfoMessage) && (
              <p className={`mt-3 text-xs ${otpErrorMessage ? 'text-red-600' : 'text-green-700'}`}>
                {otpErrorMessage || otpInfoMessage}
              </p>
            )}
          </div>
        </div>
      )}

      <BottomAuth />
    </div>
  );
};

export default MentorRegister;
