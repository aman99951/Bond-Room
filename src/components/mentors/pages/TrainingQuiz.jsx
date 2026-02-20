import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, ArrowLeft, CheckCircle2, CircleHelp, Trophy, XCircle } from 'lucide-react';
import TopAuth from '../../auth/TopAuth';
import BottomAuth from '../../auth/BottomAuth';
import { mentorApi } from '../../../apis/api/mentorApi';
import { getAccessToken } from '../../../apis/api/storage';
import { useMentorData } from '../../../apis/apihook/useMentorData';

const cleanQuestionText = (value) => {
  const text = String(value || '').trim();
  if (!text) return '';
  return text
    .replace(/^\s*\[\s*q\s*\d+\s*\]\s*/i, '')
    .replace(/^\s*q\s*\d+\s*[:.\-)]\s*/i, '')
    .trim();
};

const normalizeAnswers = (attemptPayload) => {
  const total = Number(attemptPayload?.total_questions || attemptPayload?.questions?.length || 0);
  const selected = Array.isArray(attemptPayload?.selected_answers) ? attemptPayload.selected_answers : [];
  return Array.from({ length: total }, (_, idx) => {
    const value = selected[idx];
    return Number.isInteger(value) ? value : null;
  });
};

const TrainingQuiz = () => {
  const navigate = useNavigate();
  const { mentor } = useMentorData();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [startingAttempt, setStartingAttempt] = useState(false);
  const [error, setError] = useState('');
  const [quizStatus, setQuizStatus] = useState(null);
  const [attempt, setAttempt] = useState(null);
  const [answers, setAnswers] = useState([]);
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [leaving, setLeaving] = useState(false);

  const loadQuizWithAutoStart = useCallback(async () => {
    if (!mentor?.id) return;
    setLoading(true);
    setError('');
    try {
      const statusResponse = await mentorApi.getTrainingQuizStatus({ mentor_id: mentor.id });
      setQuizStatus(statusResponse || null);

      if (!statusResponse?.modules_completed) {
        setAttempt(null);
        setAnswers([]);
        return;
      }

      if (statusResponse?.quiz_passed) {
        setAttempt(statusResponse?.latest_attempt || null);
        setAnswers(normalizeAnswers(statusResponse?.latest_attempt));
        return;
      }

      const latestAttempt = statusResponse?.latest_attempt || null;
      if (latestAttempt?.status === 'pending' && Array.isArray(latestAttempt?.questions) && latestAttempt.questions.length) {
        setAttempt(latestAttempt);
        setAnswers(normalizeAnswers(latestAttempt));
        return;
      }
      if (latestAttempt?.status === 'failed') {
        setAttempt(latestAttempt);
        setAnswers(normalizeAnswers(latestAttempt));
        return;
      }

      const startResponse = await mentorApi.startTrainingQuiz({ mentor_id: mentor.id });
      const startedAttempt = startResponse?.attempt || null;
      setAttempt(startedAttempt);
      setAnswers(normalizeAnswers(startedAttempt));
      setQuizStatus((prev) => ({
        ...(prev || {}),
        modules_completed: true,
        quiz_passed: Boolean(startResponse?.quiz_passed),
        latest_attempt: startedAttempt,
      }));
    } catch (err) {
      setError(err?.message || 'Unable to load quiz.');
    } finally {
      setLoading(false);
    }
  }, [mentor?.id]);

  useEffect(() => {
    let cancelled = false;
    if (!mentor?.id) return undefined;

    const run = async () => {
      if (cancelled) return;
      await loadQuizWithAutoStart();
    };
    run();

    return () => {
      cancelled = true;
    };
  }, [loadQuizWithAutoStart, mentor?.id]);

  const totalQuestions = Number(attempt?.total_questions || attempt?.questions?.length || 0);
  const scoreValue = Number(attempt?.score || 0);
  const wrongCount = Math.max(0, totalQuestions - scoreValue);
  const answeredCount = useMemo(
    () => answers.filter((item) => Number.isInteger(item)).length,
    [answers]
  );
  const passMark = Number(attempt?.pass_mark || 7);
  const isPassed = Boolean(quizStatus?.quiz_passed);
  const canAttemptQuiz = Boolean(quizStatus?.modules_completed);
  const activeQuestions = Array.isArray(attempt?.questions) ? attempt.questions : [];
  const hasPendingAttempt = attempt?.status === 'pending' && activeQuestions.length > 0;
  const blockNavigation = hasPendingAttempt && !isPassed;
  const antiCheatEnabled = hasPendingAttempt && !isPassed;

  useEffect(() => {
    if (!antiCheatEnabled) return undefined;

    const preventDefault = (event) => {
      event.preventDefault();
    };

    const handleKeyDown = (event) => {
      const key = String(event.key || '').toLowerCase();
      if ((event.ctrlKey || event.metaKey) && ['a', 'c', 'x'].includes(key)) {
        event.preventDefault();
      }
    };

    document.addEventListener('copy', preventDefault);
    document.addEventListener('cut', preventDefault);
    document.addEventListener('contextmenu', preventDefault);
    document.addEventListener('selectstart', preventDefault);
    document.addEventListener('dragstart', preventDefault);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('copy', preventDefault);
      document.removeEventListener('cut', preventDefault);
      document.removeEventListener('contextmenu', preventDefault);
      document.removeEventListener('selectstart', preventDefault);
      document.removeEventListener('dragstart', preventDefault);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [antiCheatEnabled]);

  useEffect(() => {
    if (!blockNavigation) return undefined;
    window.history.pushState({ quizLock: true }, '', window.location.href);
    const onPopState = (event) => {
      event.preventDefault();
      window.history.pushState({ quizLock: true }, '', window.location.href);
      setShowLeaveModal(true);
    };
    window.addEventListener('popstate', onPopState);
    return () => {
      window.removeEventListener('popstate', onPopState);
    };
  }, [blockNavigation]);

  useEffect(() => {
    if (!blockNavigation) return undefined;
    const onBeforeUnload = (event) => {
      if (mentor?.id && attempt?.id) {
        const apiBase = ((import.meta?.env?.VITE_API_BASE_URL || '/api')).replace(/\/+$/, '');
        const token = getAccessToken();
        const headers = { 'Content-Type': 'application/json' };
        if (token) headers.Authorization = `Bearer ${token}`;
        try {
          fetch(`${apiBase}/training-modules/quiz/abandon/`, {
            method: 'POST',
            headers,
            body: JSON.stringify({ mentor_id: mentor.id, attempt_id: attempt.id }),
            keepalive: true,
          });
        } catch {
          // Ignore unload transport failures.
        }
      }
      event.preventDefault();
      event.returnValue = 'Leaving now will fail your quiz.';
      return 'Leaving now will fail your quiz.';
    };
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', onBeforeUnload);
    };
  }, [attempt?.id, blockNavigation, mentor?.id]);

  const handleLeaveQuiz = async () => {
    if (!mentor?.id || !attempt?.id) {
      navigate('/mentor-training-modules');
      return;
    }
    setLeaving(true);
    setError('');
    try {
      await mentorApi.abandonTrainingQuiz({
        mentor_id: mentor.id,
        attempt_id: attempt.id,
      });
      navigate('/mentor-training-modules');
    } catch (err) {
      setError(err?.message || 'Unable to exit quiz right now.');
    } finally {
      setLeaving(false);
      setShowLeaveModal(false);
    }
  };

  const handleSubmitQuiz = async () => {
    if (!mentor?.id || !attempt?.id) return;
    if (answers.length !== totalQuestions || answeredCount !== totalQuestions) {
      setError(`Please answer all ${totalQuestions} questions before submitting.`);
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      await mentorApi.submitTrainingQuiz({
        mentor_id: mentor.id,
        attempt_id: attempt.id,
        selected_answers: answers,
      });
      await loadQuizWithAutoStart();
    } catch (err) {
      setError(err?.message || 'Unable to submit quiz.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleStartNewAttempt = async () => {
    if (!mentor?.id) return;
    setStartingAttempt(true);
    setError('');
    try {
      const response = await mentorApi.startTrainingQuiz({ mentor_id: mentor.id });
      const nextAttempt = response?.attempt || null;
      setAttempt(nextAttempt);
      setAnswers(normalizeAnswers(nextAttempt));
      setQuizStatus((prev) => ({
        ...(prev || {}),
        modules_completed: true,
        quiz_passed: Boolean(response?.quiz_passed),
        latest_attempt: nextAttempt,
      }));
    } catch (err) {
      setError(err?.message || 'Unable to start new attempt.');
    } finally {
      setStartingAttempt(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f4f2f7] text-primary flex flex-col">
      <TopAuth />

      <main className="flex-1">
        <div className="max-w-[1100px] mx-auto px-4 sm:px-6 lg:px-10 py-8 sm:py-10">
          <button
            type="button"
            className="inline-flex items-center gap-2 text-sm text-[#6b7280] hover:text-[#1f2937]"
            onClick={() => {
              if (blockNavigation) {
                setShowLeaveModal(true);
                return;
              }
              navigate('/mentor-training-modules');
            }}
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Back to Training Modules
          </button>

          <div className="mt-4 rounded-2xl border border-[#e6e2f1] bg-white shadow-[0_12px_30px_rgba(0,0,0,0.08)] p-5 sm:p-6 lg:p-8">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
              <div>
                <h2 className="text-xl sm:text-2xl font-semibold text-[#1f2937]">Training Modules Quiz</h2>
                <p className="mt-1 text-sm text-[#6b7280]">
                  Questions below are generated from all completed modules.
                </p>
                {blockNavigation && (
                  <p className="mt-2 text-xs text-[#b42318]">
                    Going back before submitting will fail this quiz.
                  </p>
                )}
              </div>
              <div className="inline-flex items-center gap-2 rounded-full bg-[#f3ebff] px-3 py-1 text-xs font-medium text-[#5b2c91]">
                <CircleHelp className="h-3.5 w-3.5" aria-hidden="true" />
                15 Questions
              </div>
            </div>

            {loading && (
              <div className="mt-6 flex items-center justify-center py-8">
                <div className="h-9 w-9 animate-spin rounded-full border-[3px] border-[#e3e4e8] border-t-[#6b4ab2]" />
              </div>
            )}

            {!loading && !canAttemptQuiz && (
              <div className="mt-6 rounded-xl border border-[#f3d6d6] bg-[#fff5f5] px-4 py-3 text-sm text-[#b42318]">
                Complete all training modules first, then this quiz page will unlock.
              </div>
            )}

            {!loading && canAttemptQuiz && isPassed && (
              <div className="mt-6 rounded-xl border border-[#b7ebc7] bg-gradient-to-br from-[#ecfdf3] to-[#e7f8ef] p-5 sm:p-6">
                <div className="flex items-start gap-3">
                  <div className="h-10 w-10 rounded-full bg-[#12b981] text-white flex items-center justify-center shrink-0">
                    <Trophy className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-lg font-semibold text-[#027a48]">You Passed the Quiz</p>
                    <p className="mt-1 text-sm text-[#027a48]">
                      Great work. Your training is now completed and ready for onboarding review.
                    </p>
                  </div>
                </div>
                <div className="mt-4 grid grid-cols-3 gap-2 text-xs">
                  <div className="rounded-lg border border-[#b7ebc7] bg-white px-3 py-2">
                    <p className="text-[#6b7280]">Score</p>
                    <p className="mt-1 font-semibold text-[#111827]">{scoreValue}/{totalQuestions}</p>
                  </div>
                  <div className="rounded-lg border border-[#b7ebc7] bg-white px-3 py-2">
                    <p className="text-[#6b7280]">Pass Mark</p>
                    <p className="mt-1 font-semibold text-[#111827]">{passMark}</p>
                  </div>
                  <div className="rounded-lg border border-[#b7ebc7] bg-white px-3 py-2">
                    <p className="text-[#6b7280]">Wrong</p>
                    <p className="mt-1 font-semibold text-[#111827]">{wrongCount}</p>
                  </div>
                </div>
                <div className="mt-4 flex gap-2">
                  <button
                    type="button"
                    className="rounded-md bg-[#5b2c91] px-4 py-2 text-xs font-semibold text-white hover:bg-[#4a2374]"
                    onClick={() => navigate('/mentor-onboarding-status')}
                  >
                    Go to Onboarding
                  </button>
                  <button
                    type="button"
                    className="rounded-md border border-[#d7d0e2] px-4 py-2 text-xs text-[#374151]"
                    onClick={() => navigate('/mentor-training-modules')}
                  >
                    Back to Modules
                  </button>
                </div>
              </div>
            )}

            {!loading && canAttemptQuiz && !isPassed && attempt?.status === 'failed' && (
              <div className="mt-6 rounded-xl border border-[#f5c2c2] bg-gradient-to-br from-[#fff6f6] to-[#fff0f0] p-5 sm:p-6">
                <div className="flex items-start gap-3">
                  <div className="h-10 w-10 rounded-full bg-[#ef4444] text-white flex items-center justify-center shrink-0">
                    <AlertTriangle className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-lg font-semibold text-[#b42318]">Quiz Not Passed</p>
                    <p className="mt-1 text-sm text-[#b42318]">
                      You can retry with a fresh quiz attempt. You need minimum {passMark} correct answers to pass.
                    </p>
                  </div>
                </div>
                <div className="mt-4 grid grid-cols-3 gap-2 text-xs">
                  <div className="rounded-lg border border-[#f5c2c2] bg-white px-3 py-2">
                    <p className="text-[#6b7280]">Score</p>
                    <p className="mt-1 font-semibold text-[#111827]">{scoreValue}/{totalQuestions}</p>
                  </div>
                  <div className="rounded-lg border border-[#f5c2c2] bg-white px-3 py-2">
                    <p className="text-[#6b7280]">Wrong</p>
                    <p className="mt-1 font-semibold text-[#111827]">{wrongCount}</p>
                  </div>
                  <div className="rounded-lg border border-[#f5c2c2] bg-white px-3 py-2">
                    <p className="text-[#6b7280]">Pass Mark</p>
                    <p className="mt-1 font-semibold text-[#111827]">{passMark}</p>
                  </div>
                </div>
                <button
                  type="button"
                  className="mt-4 rounded-md bg-[#5b2c91] px-4 py-2 text-sm font-semibold text-white hover:bg-[#4a2374] disabled:opacity-60"
                  onClick={handleStartNewAttempt}
                  disabled={startingAttempt}
                >
                  {startingAttempt ? 'Preparing...' : 'Try Again'}
                </button>
              </div>
            )}

            {!loading && canAttemptQuiz && !isPassed && hasPendingAttempt && (
              <div className="mt-6 select-none" style={{ userSelect: 'none', WebkitUserSelect: 'none' }}>
                <div className="rounded-xl border border-[#e5e7eb] bg-[#faf8ff] p-4">
                  <p className="text-sm text-[#4b5563]">
                    Answered <span className="font-semibold text-[#1f2937]">{answeredCount}</span> of{' '}
                    <span className="font-semibold text-[#1f2937]">{totalQuestions}</span> questions.
                  </p>
                  <p className="mt-1 text-xs text-[#6b7280]">Pass mark: {passMark}/{totalQuestions}</p>
                </div>

                <div className="mt-4 space-y-3">
                  {activeQuestions.map((item, index) => (
                    <div key={`quiz-q-${index + 1}`} className="rounded-xl border border-[#e6e2f1] bg-white p-4">
                      <p className="text-sm font-semibold text-[#1f2937]">
                        {index + 1}. {cleanQuestionText(item.question)}
                      </p>
                      {item.module_title && (
                        <p className="mt-1 text-[11px] text-[#6b7280]">Module: {item.module_title}</p>
                      )}
                      <div className="mt-3 grid gap-2">
                        {(item.options || []).map((optionText, optionIndex) => {
                          const selected = answers[index] === optionIndex;
                          return (
                            <button
                              key={`quiz-q-${index + 1}-opt-${optionIndex}`}
                              type="button"
                              className={`text-left rounded-lg border px-3 py-2 text-sm ${
                                selected
                                  ? 'border-[#5b2c91] bg-[#f3ebff] text-[#2f1a4f]'
                                  : 'border-[#e5e7eb] bg-white text-[#374151] hover:border-[#d3c3f0]'
                              }`}
                              onClick={() =>
                                setAnswers((prev) => {
                                  const next = [...prev];
                                  next[index] = optionIndex;
                                  return next;
                                })
                              }
                            >
                              {optionText}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-5 flex justify-end">
                  <button
                    type="button"
                    className="rounded-md bg-[#5b2c91] px-5 py-2 text-sm font-semibold text-white hover:bg-[#4a2374] disabled:opacity-70"
                    onClick={handleSubmitQuiz}
                    disabled={submitting}
                  >
                    {submitting ? 'Submitting...' : 'Submit Quiz'}
                  </button>
                </div>
              </div>
            )}

            {error && (
              <div className="mt-4 text-sm text-red-600">
                <span className="inline-flex items-center gap-1">
                  <XCircle className="h-4 w-4" />
                  {error}
                </span>
              </div>
            )}
          </div>
        </div>
      </main>

      {showLeaveModal && (
        <div
          className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          onClick={() => !leaving && setShowLeaveModal(false)}
        >
          <div
            className="w-full max-w-md rounded-2xl border border-[#efd1d1] bg-white shadow-[0_18px_45px_rgba(17,24,39,0.28)] p-5"
            onClick={(event) => event.stopPropagation()}
          >
            <p className="text-lg font-semibold text-[#1f2937]">Leave Quiz?</p>
            <p className="mt-2 text-sm text-[#6b7280]">
              If you leave now, this quiz attempt will be marked as failed.
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                className="rounded-md border border-[#d7d0e2] px-4 py-2 text-sm text-[#374151] disabled:opacity-60"
                onClick={() => setShowLeaveModal(false)}
                disabled={leaving}
              >
                Stay
              </button>
              <button
                type="button"
                className="rounded-md bg-[#b42318] px-4 py-2 text-sm font-semibold text-white hover:bg-[#912018] disabled:opacity-60"
                onClick={handleLeaveQuiz}
                disabled={leaving}
              >
                {leaving ? 'Failing...' : 'Fail and Exit'}
              </button>
            </div>
          </div>
        </div>
      )}

      <BottomAuth />
    </div>
  );
};

export default TrainingQuiz;
