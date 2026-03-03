import React, { useMemo, useState } from 'react';
import TopAuth from './TopAuth';
import BottomAuth from './BottomAuth';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import leftside from '../assets/Leftside.png';
import errorIcon from '../assets/error.png';
import { useMenteeAuth } from '../../apis/apihook/useMenteeAuth';
import {
  clearPendingMenteeRegistration,
  getPendingMenteeRegistration,
} from '../../apis/api/storage';

const VerifyParent = () => {
  const navigate = useNavigate();
  const { state } = useLocation();
  const pendingMentee = useMemo(() => getPendingMenteeRegistration(), []);
  const [otp, setOtp] = useState('');
  const [infoMessage, setInfoMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [otpHint, setOtpHint] = useState('');
  const { loading, sendParentOtp, verifyParentOtp, loginWithMobile } = useMenteeAuth();

  const parentMobileMasked =
    state?.parentMobileMasked ||
    (pendingMentee?.parentMobile
      ? `${'*'.repeat(Math.max(pendingMentee.parentMobile.length - 4, 0))}${pendingMentee.parentMobile.slice(-4)}`
      : '******0000');

  const handleOtpChange = (event) => {
    const digitsOnly = event.target.value.replace(/\D/g, '').slice(0, 6);
    setOtp(digitsOnly);
  };

  const handleResend = async () => {
    setErrorMessage('');
    setInfoMessage('');
    try {
      if (!pendingMentee?.menteeId) {
        throw new Error('Registration data not found. Please register again.');
      }
      const response = await sendParentOtp(pendingMentee.menteeId, pendingMentee.parentMobile);
      setInfoMessage('OTP sent successfully.');
      if (response?.otp) {
        setOtpHint(`Test OTP: ${response.otp}`);
      }
    } catch (err) {
      setErrorMessage(err?.message || 'Unable to resend OTP.');
    }
  };

  const handleVerify = async () => {
    setErrorMessage('');
    setInfoMessage('');

    if (!pendingMentee?.menteeId || !pendingMentee?.parentMobile) {
      setErrorMessage('Registration session expired. Please register again.');
      return;
    }

    if (otp.length !== 6) {
      setErrorMessage('Please enter a valid 6-digit OTP.');
      return;
    }

    try {
      await verifyParentOtp(pendingMentee.menteeId, otp);
      await loginWithMobile(pendingMentee.parentMobile, '123456', 'menties');
      clearPendingMenteeRegistration();
      navigate('/needs-assessment');
    } catch (err) {
      setErrorMessage(err?.message || 'OTP verification failed.');
    }
  };

  return (
    <div className="min-h-screen bg-[#f4f2f7] text-primary flex flex-col">
      <TopAuth />

      <main className="flex-1">
        <div className="w-full flex justify-center px-4 sm:px-6 py-6 sm:py-10">
          <div className="border border-[#e6e2f1] rounded-b-[12px] overflow-hidden bg-white shadow-sm w-full max-w-[1266px] md:h-[790px]">
            <div className="grid md:grid-cols-[591px_675px] md:h-[788px]">
              <div className="hidden md:block w-[591px] h-[788px]">
                <img
                  src={leftside}
                  alt="Find your safe space"
                  className="h-full w-full object-cover"
                />
              </div>

              <div className="p-6 sm:p-8 lg:p-12 bg-[#f7f5fa] w-full md:w-[675px] md:h-[788px] flex items-center justify-center">
                <div className="w-full max-w-md text-center">
                  <div className="mx-auto h-11 w-11 rounded-full bg-[#5b2c91] flex items-center justify-center">
                    <svg className="h-5 w-5 text-[#f2c94c]" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                      <path
                        d="M12 3l7 3v6c0 4.1-3 7.8-7 9-4-1.2-7-4.9-7-9V6l7-3z"
                        stroke="currentColor"
                        strokeWidth="1.5"
                      />
                    </svg>
                  </div>
                  <div className="mt-3 inline-flex items-center rounded-full bg-[#e9ddff] text-xs text-[#5b2c91] px-3 py-1 font-medium">
                    Step 2 of 3
                  </div>
                  <h2
                    className="mt-3 text-[#1f2937] text-center"
                    style={{ fontSize: '24px', lineHeight: '25.5px', fontWeight: 600 }}
                  >
                    Verify phone number
                  </h2>
                  <p className="mt-1 text-xs text-[#6b7280]">
                    Enter the 6-digit OTP sent to +91 {parentMobileMasked}
                  </p>

                  <div className="mt-5 rounded-lg border border-[#e3d7f5] bg-[#eadcf9] p-4 text-left text-[#3f3a4a] shadow-sm">
                    <div className="flex items-start gap-3">
                      <span className=" inline-flex h-7 w-7 items-center justify-center rounded-full">
                        <img src={errorIcon} alt="" className="h-3 w-3" />
                      </span>
                      <p style={{ fontSize: '12px', lineHeight: '20px', fontWeight: 400 }}>
                        <span style={{ fontSize: '12px', lineHeight: '20px', fontWeight: 700, color: '#2f273a' }}>
                          Explicit Consent:
                        </span>{' '}
                        Entering this OTP confirms that a parent or guardian consents to the student&apos;s
                        participation and session recording.
                      </p>
                    </div>
                  </div>

                  <div className="mt-6 flex justify-center">
                    <input
                      value={otp}
                      onChange={handleOtpChange}
                      placeholder="Enter OTP"
                      className="h-10 w-44 rounded-md border border-[#d7d0e2] bg-white text-center text-sm tracking-[0.5em]"
                      maxLength={6}
                      inputMode="numeric"
                    />
                  </div>

                  <div className="mt-4 flex items-center justify-between text-xs text-[#6b7280]">
                    <span>{otp.length ? `${otp.length}/6 digits` : 'Enter OTP'}</span>
                    <button
                      className="text-[#6b7280] hover:text-[#5b2c91] disabled:opacity-70"
                      onClick={handleResend}
                      type="button"
                      disabled={loading}
                    >
                      Resend OTP
                    </button>
                  </div>

                  {errorMessage && <p className="mt-3 text-sm text-red-600">{errorMessage}</p>}
                  {!errorMessage && infoMessage && <p className="mt-3 text-sm text-green-700">{infoMessage}</p>}
                  {!errorMessage && otpHint && <p className="mt-2 text-xs text-[#5b2c91]">{otpHint}</p>}

                  <button
                    type="button"
                    onClick={handleVerify}
                    className="mt-5 block w-full rounded-md bg-[#5b2c91] text-white py-2.5 text-sm text-center"
                    disabled={loading}
                  >
                    {loading ? 'Verifying...' : 'Verify & Continue'}
                  </button>
                  <Link
                    to="/register"
                    className="mt-3 block w-full rounded-md border border-[#d7d0e2] bg-white py-2.5 text-[#6b7280] text-center"
                    style={{ fontSize: '16px', lineHeight: '100%', fontWeight: 400 }}
                  >
                    Back to Registration
                  </Link>
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

export default VerifyParent;
