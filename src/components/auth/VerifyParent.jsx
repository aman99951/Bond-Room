import React, { useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ShieldCheck } from 'lucide-react';
import logo from '../assets/logo.png';
import leftside from '../assets/Leftside.png';
import errorIcon from '../assets/error.png';
import { useMenteeAuth } from '../../apis/apihook/useMenteeAuth';
import {
  clearPendingMenteeRegistration,
  getPendingMenteeRegistration,
  setPendingMenteeRegistration,
} from '../../apis/api/storage';
import '../LandingPage.css';
import './VerifyParent.css';

const MOBILE_DIGITS_LENGTH = 10;
const normalizePhone = (value) => String(value || '').replace(/\D/g, '');
const maskMobile = (value) => {
  const cleaned = normalizePhone(value);
  if (!cleaned) return '******0000';
  if (cleaned.length <= 4) return cleaned;
  return `${'*'.repeat(Math.max(cleaned.length - 4, 0))}${cleaned.slice(-4)}`;
};

const VerifyParent = () => {
  const navigate = useNavigate();
  const { state } = useLocation();
  const pendingMentee = useMemo(() => getPendingMenteeRegistration(), []);
  const [parentMobile, setParentMobile] = useState(() => normalizePhone(pendingMentee?.parentMobile || ''));
  const [isEditingMobile, setIsEditingMobile] = useState(false);
  const [mobileDraft, setMobileDraft] = useState(() => normalizePhone(pendingMentee?.parentMobile || ''));
  const [otp, setOtp] = useState('');
  const [infoMessage, setInfoMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [otpHint, setOtpHint] = useState('');
  const { loading, sendParentOtp, verifyParentOtp, loginWithMobile } = useMenteeAuth();

  const parentMobileMasked = parentMobile ? maskMobile(parentMobile) : state?.parentMobileMasked || '******0000';

  const handleOtpChange = (event) => {
    const digitsOnly = event.target.value.replace(/\D/g, '').slice(0, 6);
    setOtp(digitsOnly);
  };

  const handleMobileDraftChange = (event) => {
    const digitsOnly = normalizePhone(event.target.value).slice(0, MOBILE_DIGITS_LENGTH);
    setMobileDraft(digitsOnly);
  };

  const handleStartEditMobile = () => {
    setErrorMessage('');
    setInfoMessage('');
    setOtpHint('');
    setMobileDraft(parentMobile);
    setIsEditingMobile(true);
  };

  const handleCancelEditMobile = () => {
    setMobileDraft(parentMobile);
    setIsEditingMobile(false);
  };

  const handleSaveMobile = async () => {
    setErrorMessage('');
    setInfoMessage('');
    setOtpHint('');
    const mobileDigits = normalizePhone(mobileDraft);
    if (mobileDigits.length !== MOBILE_DIGITS_LENGTH) {
      setErrorMessage('Parent mobile number must be exactly 10 digits.');
      return;
    }
    if (!pendingMentee?.menteeId) {
      setErrorMessage('Registration data not found. Please register again.');
      return;
    }
    try {
      const response = await sendParentOtp(pendingMentee.menteeId, mobileDigits);
      const updatedPending = {
        ...(pendingMentee || {}),
        parentMobile: mobileDigits,
      };
      setPendingMenteeRegistration(updatedPending);
      setParentMobile(mobileDigits);
      setIsEditingMobile(false);
      setInfoMessage('Number updated and OTP sent successfully.');
      if (response?.otp) {
        setOtpHint(`Test OTP: ${response.otp}`);
      }
    } catch (err) {
      setErrorMessage(err?.message || 'Unable to update number.');
    }
  };

  const handleResend = async () => {
    setErrorMessage('');
    setInfoMessage('');
    try {
      if (!pendingMentee?.menteeId || !parentMobile) {
        throw new Error('Registration data not found. Please register again.');
      }
      const response = await sendParentOtp(pendingMentee.menteeId, parentMobile);
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

    if (!pendingMentee?.menteeId || !parentMobile) {
      setErrorMessage('Registration session expired. Please register again.');
      return;
    }

    if (otp.length !== 6) {
      setErrorMessage('Please enter a valid 6-digit OTP.');
      return;
    }

    try {
      await verifyParentOtp(pendingMentee.menteeId, otp);
      await loginWithMobile(parentMobile, '123456', 'menties');
      clearPendingMenteeRegistration();
      navigate('/needs-assessment');
    } catch (err) {
      setErrorMessage(err?.message || 'OTP verification failed.');
    }
  };

  return (
    <div className="lp lp-vp">
      <header className="lp-hdr">
        <Link to="/" className="lp-logo" aria-label="Go to landing page">
          <img src={logo} alt="Bond Room" />
          <span>Bridging Old and New Destinies</span>
        </Link>

        <nav className="lp-nav">
          <Link to="/">Home</Link>
          <a href="/#about">About</a>
          <a href="/#safety">Safety</a>
        </nav>

        <div className="lp-hdr-actions">
          <Link to="/register" className="lp-ghost">Back</Link>
        </div>
      </header>

      <main className="lp-vp-main">
        <div className="lp-vp-orb lp-vp-orb-a" />
        <div className="lp-vp-orb lp-vp-orb-b" />

        <div className="lp-vp-shell">
          <div className="lp-vp-grid">
            <aside className="lp-vp-side">
              <img src={leftside} alt="Find your safe space" className="lp-vp-side-image" />
              <div className="lp-vp-side-overlay" />
              <div className="lp-vp-side-copy">
                <p className="lp-label">
                  <span className="lp-rule" />
                  Step 2 of 3
                </p>
                <h3>Parent consent verification</h3>
                <p>
                  A quick OTP check confirms guardian consent before the student continues to the needs assessment.
                </p>
              </div>
            </aside>

            <section className="lp-vp-form-wrap">
              <div className="lp-login-pill">
                <span className="lp-login-pill-dot" />
                Verification
              </div>
              <h2 className="lp-vp-h2">Verify phone number</h2>
              <p className="lp-vp-sub">Enter the 6-digit OTP sent to +91 {parentMobileMasked}</p>
              <div className="lp-vp-mobile-edit">
                {!isEditingMobile ? (
                  <button
                    type="button"
                    className="lp-vp-edit-btn"
                    onClick={handleStartEditMobile}
                    disabled={loading}
                  >
                    Edit number
                  </button>
                ) : (
                  <div className="lp-vp-edit-panel">
                    <div className="lp-vp-mobile-row">
                      <span className="lp-vp-country">+91</span>
                      <input
                        type="text"
                        className="lp-input"
                        placeholder="Parent mobile number"
                        value={mobileDraft}
                        onChange={handleMobileDraftChange}
                        maxLength={MOBILE_DIGITS_LENGTH}
                        inputMode="numeric"
                      />
                    </div>
                    <div className="lp-vp-edit-actions">
                      <button type="button" className="lp-vp-inline-btn" onClick={handleSaveMobile} disabled={loading}>
                        Save & Send OTP
                      </button>
                      <button type="button" className="lp-vp-inline-btn lp-vp-inline-btn-ghost" onClick={handleCancelEditMobile} disabled={loading}>
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div className="lp-vp-consent-card">
                <span className="lp-vp-consent-icon">
                  <img src={errorIcon} alt="" className="h-3 w-3" />
                </span>
                <p>
                  <strong>Explicit Consent:</strong> Entering this OTP confirms parent or guardian consent for participation and session recording.
                </p>
              </div>

              <div className="lp-vp-otp-wrap">
                <input
                  value={otp}
                  onChange={handleOtpChange}
                  placeholder="Enter OTP"
                  className="lp-input lp-vp-otp"
                  maxLength={6}
                  inputMode="numeric"
                />
              </div>

              <div className="lp-vp-meta">
                <span>{otp.length ? `${otp.length}/6 digits` : 'Enter OTP'}</span>
                <button
                  className="lp-vp-resend"
                  onClick={handleResend}
                  type="button"
                  disabled={loading}
                >
                  Resend OTP
                </button>
              </div>

              {errorMessage && <p className="lp-msg lp-msg-error">{errorMessage}</p>}
              {!errorMessage && infoMessage && <p className="lp-msg lp-msg-success">{infoMessage}</p>}
              {!errorMessage && otpHint && <p className="lp-vp-hint">{otpHint}</p>}

              <button
                type="button"
                onClick={handleVerify}
                className="lp-login-submit"
                disabled={loading}
              >
                {loading ? 'Verifying...' : 'Verify & Continue'}
              </button>

              <Link to="/register" className="lp-vp-back-link">
                Back to Registration
              </Link>

              <p className="lp-vp-foot-note">
                <ShieldCheck size={14} /> Your verification helps keep every student interaction safe.
              </p>
            </section>
          </div>
        </div>
      </main>

      <footer className="lp-footer lp-login-footer">
        <div className="lp-footer-btm">
          <span>(c) 2026 Bond Room Platform. All rights reserved.</span>
          <span className="lp-login-footer-links">
            <a href="#">Privacy</a>
            <a href="#">Terms</a>
            <a href="#">Support</a>
          </span>
        </div>
      </footer>
    </div>
  );
};

export default VerifyParent;
