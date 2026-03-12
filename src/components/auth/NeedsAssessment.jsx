import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { AlertCircle, X } from 'lucide-react';
import logo from '../assets/logo.png';
import { useMenteeAssessment } from '../../apis/apihook/useMenteeAssessment';
import '../LandingPage.css';
import './NeedsAssessment.css';

const MAX_SELECTIONS = 3;

const toArray = (value) => {
  if (Array.isArray(value)) {
    return value.filter(Boolean);
  }
  if (typeof value === 'string' && value.trim()) {
    return [value.trim()];
  }
  return [];
};

const NeedOption = ({ label, selected, icon, onClick }) => (
  <button
    type="button"
    className={`lp-na-choice ${selected ? 'is-selected' : ''}`}
    onClick={onClick}
  >
    <div className="lp-na-choice-stack">
      <span className="lp-na-choice-icon">{icon}</span>
      <span>{label}</span>
    </div>
    {selected && <span className="lp-na-choice-mark">{'\u2713'}</span>}
  </button>
);

const NeedsAssessment = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { draft, saveAnswer } = useMenteeAssessment();
  const [selectedFeelings, setSelectedFeelings] = useState(() => {
    const savedSelections = toArray(draft.feelings);
    if (savedSelections.length) {
      return savedSelections.slice(0, MAX_SELECTIONS);
    }
    return toArray(draft.feeling).slice(0, MAX_SELECTIONS);
  });
  const [otherFeelingText, setOtherFeelingText] = useState(draft.feeling_other_text || '');
  const [localError, setLocalError] = useState('');
  const [toastState, setToastState] = useState({
    open: false,
    message: '',
    type: 'error',
  });
  const hideBackButton = new URLSearchParams(location.search).get('from') === 'dashboard';

  const options = ['Burnt Out', 'Anxious', 'Confused', 'Lonely', 'Hopeful', 'Other'];

  const icons = {
    'Burnt Out': '\uD83E\uDD2F',
    Anxious: '\uD83D\uDE1F',
    Confused: '\uD83D\uDE15',
    Lonely: '\uD83D\uDE1E',
    Hopeful: '\uD83D\uDE0C',
    Other: '\u22EF',
  };

  const toggleFeeling = (option) => {
    setLocalError('');
    setSelectedFeelings((prev) => {
      if (prev.includes(option)) {
        if (option === 'Other') {
          setOtherFeelingText('');
        }
        return prev.filter((item) => item !== option);
      }
      if (prev.length >= MAX_SELECTIONS) {
        setLocalError(`You can select up to ${MAX_SELECTIONS} options.`);
        return prev;
      }
      return [...prev, option];
    });
  };

  const saveFeelingAnswers = (nextFeelings, nextOtherText) => {
    saveAnswer('feelings', nextFeelings);
    saveAnswer('feeling', nextFeelings[0] || '');
    saveAnswer('feeling_other_text', nextOtherText.trim());
  };

  const handleNext = () => {
    if (!selectedFeelings.length) {
      setLocalError('Please choose at least one feeling or skip this question.');
      return;
    }
    if (selectedFeelings.includes('Other') && !otherFeelingText.trim()) {
      setLocalError('Please add a short note when selecting Other.');
      return;
    }
    saveFeelingAnswers(selectedFeelings, otherFeelingText);
    navigate('/needs-assessment/q2');
  };

  const handleSkip = () => {
    saveFeelingAnswers([], '');
    navigate('/needs-assessment/q2');
  };

  useEffect(() => {
    if (!localError) return;
    setToastState({ open: true, message: localError, type: 'error' });
  }, [localError]);

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
        <nav className="lp-nav">
          <Link to="/">Home</Link>
          <a href="/#about">About</a>
          <a href="/#safety">Safety</a>
        </nav>
        <div className="lp-hdr-actions">
          <Link to="/dashboard" className="lp-ghost">Dashboard</Link>
        </div>
      </header>

      <main className="lp-na-main">
        <div className="lp-na-orb lp-na-orb-a" />
        <div className="lp-na-orb lp-na-orb-b" />

        <div className="lp-na-shell">
          <div className="lp-na-top">
            <span>Step 3 of 3: Needs Assessment</span>
            <span>Question 1 of 5</span>
          </div>
          <div className="lp-na-progress-track">
            <div className="lp-na-progress-fill" style={{ width: '20%' }} />
          </div>

          <div className="lp-na-head">
            <h2>How have you been feeling lately?</h2>
            <p>Select up to {MAX_SELECTIONS} options that best describe your current state of mind.</p>
          </div>

          <div className="lp-na-grid">
            {options.map((option) => (
              <NeedOption
                key={option}
                label={option}
                icon={icons[option]}
                selected={selectedFeelings.includes(option)}
                onClick={() => toggleFeeling(option)}
              />
            ))}
          </div>

          <p className="lp-na-meta">Selected: {selectedFeelings.length}/{MAX_SELECTIONS}</p>

          {selectedFeelings.includes('Other') && (
            <div className="lp-na-other">
              <label htmlFor="feelingOtherText">Tell us how you are feeling</label>
              <textarea
                id="feelingOtherText"
                rows={3}
                placeholder="Share in your own words..."
                value={otherFeelingText}
                onChange={(event) => setOtherFeelingText(event.target.value)}
              />
            </div>
          )}

          <div className="lp-na-actions">
            {!hideBackButton && (
              <Link to="/verify-parent" className="lp-na-btn-ghost">Back</Link>
            )}
            <button type="button" onClick={handleNext} className="lp-na-btn-primary">Next Question {'\u2192'}</button>
          </div>

          <div className="lp-na-skip">
            <button type="button" onClick={handleSkip}>Skip this question</button>
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

export default NeedsAssessment;
