import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
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

const NeedsAssessmentQ4 = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { draft, saveAnswer } = useMenteeAssessment();
  const { logout, loading: authLoading } = useMenteeAuth();
  const [selectedComfort, setSelectedComfort] = useState(draft.comfort_level || 'Neutral');
  const assessmentSearch = location.search || '';

  const options = [
    'Very Uncomfortable',
    'Somewhat Uncomfortable',
    'Neutral',
    'Comfortable',
    'Very Comfortable',
  ];

  const handleNext = () => {
    saveAnswer('comfort_level', selectedComfort);
    navigate(`/needs-assessment/q5${assessmentSearch}`);
  };

  const handleLogout = async () => {
    try {
      await logout();
    } finally {
      navigate('/login');
    }
  };

  return (
    <div className="lp lp-na">
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
            <span>Question 4 of 5</span>
          </div>
          <div className="lp-na-progress-track">
            <div className="lp-na-progress-fill" style={{ width: '80%' }} />
          </div>

          <div className="lp-na-head">
            <h2>How comfortable are you talking to someone new?</h2>
          </div>

          <div className="lp-na-grid">
            {options.map((option) => (
              <Choice
                key={option}
                label={option}
                selected={selectedComfort === option}
                onClick={() => setSelectedComfort(option)}
              />
            ))}
          </div>

          <div className="lp-na-actions">
            <Link to={`/needs-assessment/q3${assessmentSearch}`} className="lp-na-btn-ghost">Back</Link>
            <button type="button" onClick={handleNext} className="lp-na-btn-primary">Next Question {'\u2192'}</button>
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

export default NeedsAssessmentQ4;
