import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AlertCircle, X } from 'lucide-react';
import logo from '../assets/logo.png';
import { useMenteeAssessment } from '../../apis/apihook/useMenteeAssessment';
import { useMenteeAuth } from '../../apis/apihook/useMenteeAuth';
import '../LandingPage.css';
import './NeedsAssessment.css';

const Choice = ({ label, selected, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className={`lp-na-choice ${selected ? 'is-selected' : ''}`}
  >
    <span>{label}</span>
    {selected && <span className="lp-na-choice-mark">{'\u2713'}</span>}
  </button>
);

const NeedsAssessmentQ5 = () => {
  const navigate = useNavigate();
  const { draft, saveAnswer, submitAssessment, loading, error } = useMenteeAssessment();
  const { logout, loading: authLoading } = useMenteeAuth();
  const [selectedLanguage, setSelectedLanguage] = useState(draft.language || 'Tamil');
  const [localError, setLocalError] = useState('');
  const [toastState, setToastState] = useState({
    open: false,
    message: '',
    type: 'error',
  });

  const options = ['Tamil', 'English', 'Telugu', 'Malayalam', 'Kannada', 'Hindi'];

  const handleFinish = async () => {
    setLocalError('');
    try {
      saveAnswer('language', selectedLanguage);
      await submitAssessment();
      navigate('/dashboard');
    } catch (err) {
      setLocalError(err?.message || 'Unable to submit assessment.');
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
    } finally {
      navigate('/login');
    }
  };

  useEffect(() => {
    const message = localError || error;
    if (!message) return;
    setToastState({ open: true, message, type: 'error' });
  }, [localError, error]);

  useEffect(() => {
    if (!toastState.open) return undefined;
    const timer = window.setTimeout(() => {
      setToastState((prev) => ({ ...prev, open: false }));
    }, 3500);
    return () => window.clearTimeout(timer);
  }, [toastState.open, toastState.message]);

  return (
    <div className="lp lp-na">
      {toastState.open && (
        <div className={`lp-na-toast lp-na-toast-${toastState.type}`} role="status" aria-live="polite">
          <span className="lp-na-toast-icon">
            <AlertCircle size={18} />
          </span>
          <p>{toastState.message}</p>
          <button
            type="button"
            className="lp-na-toast-close"
            aria-label="Close notification"
            onClick={() => setToastState((prev) => ({ ...prev, open: false }))}
          >
            <X size={14} />
          </button>
        </div>
      )}

      <header className="lp-hdr">
        <Link to="/" className="lp-logo" aria-label="Go to landing page">
          <img src={logo} alt="Bond Room" />
          <span>Bridging Old and New Destinies</span>
        </Link>
        <div className="lp-hdr-actions">
          <button type="button" className="lp-ghost" onClick={handleLogout} disabled={authLoading}>
            Logout
          </button>
        </div>
      </header>

      <main className="lp-na-main">
        <div className="lp-na-orb lp-na-orb-a" />
        <div className="lp-na-orb lp-na-orb-b" />

        <div className="lp-na-shell">
          <div className="lp-na-top">
            <span>Step 3 of 3: Needs Assessment</span>
            <span>Question 5 of 5</span>
          </div>
          <div className="lp-na-progress-track">
            <div className="lp-na-progress-fill" style={{ width: '100%' }} />
          </div>

          <div className="lp-na-head">
            <h2>Which language do you prefer?</h2>
          </div>

          <div className="lp-na-grid">
            {options.map((option) => (
              <Choice
                key={option}
                label={option}
                selected={selectedLanguage === option}
                onClick={() => setSelectedLanguage(option)}
              />
            ))}
          </div>

          <div className="lp-na-actions">
            <Link to="/needs-assessment/q4" className="lp-na-btn-ghost">Back</Link>
            <button
              type="button"
              onClick={handleFinish}
              className="lp-na-btn-primary"
              disabled={loading}
            >
              {loading ? 'Submitting...' : `Finish \u2192`}
            </button>
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

export default NeedsAssessmentQ5;
