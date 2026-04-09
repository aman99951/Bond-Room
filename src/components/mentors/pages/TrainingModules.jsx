import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Check, Play, Lock } from 'lucide-react';
import TopAuth from '../../auth/TopAuth';
import BottomAuth from '../../auth/BottomAuth';
import { mentorApi } from '../../../apis/api/mentorApi';
import { useMentorData } from '../../../apis/apihook/useMentorData';

const TrainingModules = () => {
  const navigate = useNavigate();
  const { mentor } = useMentorData();
  const [modules, setModules] = useState([]);
  const [quizStatus, setQuizStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showQuizStartModal, setShowQuizStartModal] = useState(false);

  useEffect(() => {
    let cancelled = false;
    if (!mentor?.id) {
      return undefined;
    }

    const loadModules = async () => {
      setLoading(true);
      setError('');
      try {
        const [modulesResponse, quizResponse] = await Promise.all([
          mentorApi.listTrainingModules({ mentor_id: mentor.id }),
          mentorApi.getTrainingQuizStatus({ mentor_id: mentor.id }),
        ]);
        const list = Array.isArray(modulesResponse) ? modulesResponse : modulesResponse?.results || [];
        if (!cancelled) {
          setModules(list);
          setQuizStatus(quizResponse || null);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err?.message || 'Unable to load training modules.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadModules();
    return () => {
      cancelled = true;
    };
  }, [mentor?.id]);

  const completedCount = useMemo(() => {
    return modules.filter(
      (module) => (module.training_status || module.status || 'locked') === 'completed'
    ).length;
  }, [modules]);

  const activeModuleId = useMemo(() => {
    const active = modules.find(
      (module) => (module.training_status || module.status || 'locked') === 'in_progress'
    );
    return active?.id || null;
  }, [modules]);

  const formatCompletedDate = (completedAt) => {
    const parsed = new Date(completedAt);
    if (Number.isNaN(parsed.getTime())) return '';
    return parsed.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const progressPercent = useMemo(() => {
    if (!modules.length) return 0;
    return Math.round((completedCount / modules.length) * 100);
  }, [completedCount, modules.length]);
  const allModulesCompleted = modules.length > 0 && completedCount === modules.length;
  const quizPassed = Boolean(quizStatus?.quiz_passed);

  const handleBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
      return;
    }
    navigate('/mentor-impact-dashboard');
  };

  return (
    <div className="min-h-screen bg-transparent text-[#1f2937] flex flex-col">
      <TopAuth />

      <main className="flex-1 pt-20 sm:pt-24">
        <div className="w-full px-4 sm:px-8 lg:px-10 py-8 sm:py-10">
          <button
            type="button"
            className="inline-flex items-center gap-2 text-sm text-[#6b7280] hover:text-[#1f2937] mb-4"
            onClick={handleBack}
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Back
          </button>

          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <h2 className="text-xl sm:text-2xl font-semibold text-[#0f2041]">Training Modules</h2>
              <p className="mt-1 text-xs sm:text-sm text-[#2f3b50]">
                Complete all modules to unlock the final quiz and activate your account.
              </p>
            </div>

            <div className="min-w-[210px] rounded-[14px] border border-[#d8d8da] bg-white px-4 py-3 shadow-[0_8px_20px_rgba(15,23,42,0.14)]">
              <div className="flex items-center gap-3">
                <div
                  className="relative h-12 w-12 rounded-full flex items-center justify-center"
                  style={{
                    background: `conic-gradient(#f0be3f 0% ${progressPercent}%, #e3e4e8 ${progressPercent}% 100%)`,
                  }}
                >
                  <div className="absolute inset-[4px] rounded-full bg-white" />
                  <span className="relative text-[11px] font-semibold text-[#6c7280]">{progressPercent}%</span>
                </div>
                <div>
                  <p className="text-xs sm:text-sm font-semibold text-[#3e4758]">
                    {completedCount} of {modules.length || 0} Completed
                  </p>
                  <p className="text-xs text-[#7a8190]">
                    {allModulesCompleted
                      ? (quizPassed ? 'Training completed.' : 'Modules done. Quiz pending.')
                      : 'Keep going!'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 space-y-4">
            {loading && (
              <div className="flex items-center justify-center py-8">
                <div
                  className="h-9 w-9 animate-spin rounded-full border-[3px] border-[#e3e4e8] border-t-[#6b4ab2]"
                  aria-label="Loading training modules"
                />
              </div>
            )}

            {!loading &&
              modules.map((module) => {
                const status = module.training_status || module.status || 'locked';
                const isCompleted = status === 'completed';
                const isInProgress = status === 'in_progress';
                const isLocked = status === 'locked';

                const rowClass = isCompleted
                  ? 'bg-[#e5f0e8] border-[#d2e2d8]'
                  : isLocked
                    ? 'bg-[#e7ecf1] border-[#dfe5ec]'
                    : 'bg-[#f4f4f6] border-[#dadbe2]';

                const iconClass = isCompleted
                  ? 'bg-[#24b56b] text-white'
                  : isLocked
                    ? 'bg-[#d4dae1] text-[#697586]'
                    : 'bg-[#f2c74c] text-[#1d2733]';

                const isActiveRow = activeModuleId && module.id === activeModuleId;

                return (
                  <div
                    key={module.id}
                    className={`rounded-[18px] px-5 py-5 sm:px-8 sm:py-6 flex items-center justify-between gap-4 border ${rowClass} ${
                      isActiveRow ? 'border-2 border-[#6b4ab2] shadow-[0_0_0_2px_rgba(107,74,178,0.08)]' : ''
                    }`}
                  >
                    <div className="flex items-center gap-4 min-w-0">
                      <div className={`h-10 w-10 rounded-full flex items-center justify-center shrink-0 ${iconClass}`}>
                        {isCompleted ? (
                          <Check className="h-5 w-5" strokeWidth={2.6} aria-hidden="true" />
                        ) : isLocked ? (
                          <Lock className="h-5 w-5" strokeWidth={2.6} aria-hidden="true" />
                        ) : (
                          <Play className="h-5 w-5" strokeWidth={2.6} fill="currentColor" aria-hidden="true" />
                        )}
                      </div>

                      <div className="min-w-0">
                        <p
                          className={`text-lg font-semibold truncate ${
                            isLocked ? 'text-[#616c7d]' : isInProgress ? 'text-[#5d3ea7]' : 'text-[#2e3644]'
                          }`}
                        >
                          {module.title}
                        </p>
                        <p className="text-sm text-[#7b8595] truncate">
                          {isCompleted && module.completed_at
                            ? `Completed on ${formatCompletedDate(module.completed_at)}`
                            : module.description || 'Complete previous module to unlock.'}
                        </p>
                      </div>
                    </div>

                    {isCompleted && (
                      <button
                        type="button"
                        className="text-sm font-semibold text-[#657084] shrink-0"
                        onClick={() => navigate(`/mentor-training-boundaries?moduleId=${module.id}`)}
                      >
                        Review
                      </button>
                    )}

                    {isInProgress && (
                      <button
                        type="button"
                        className="rounded-[8px] bg-[#6b4ab2] px-5 py-2 text-sm font-semibold text-white hover:bg-[#593f95] shrink-0"
                        onClick={() => navigate(`/mentor-training-boundaries?moduleId=${module.id}`)}
                      >
                        Continue
                      </button>
                    )}
                  </div>
                );
              })}

            {!loading && !!mentor?.id && !error && !modules.length && (
              <div className="text-xs text-[#6b7280]">No training modules available yet.</div>
            )}

            {!loading && modules.length > 0 && (
              <div className="rounded-[18px] border border-[#ddd4f0] bg-[#faf8ff] p-5 sm:p-6 shadow-[0_8px_20px_rgba(15,23,42,0.08)]">
                <p className="text-base font-semibold text-[#33224d]">
                  {quizPassed ? 'Final Quiz Completed' : 'Final Quiz'}
                </p>
                <p className="mt-1 text-sm text-[#6b7280]">
                  {quizPassed
                    ? 'You passed the mixed 15-question quiz from all modules.'
                    : 'This quiz contains mixed questions from all modules. Complete all modules to enable Start Quiz.'}
                </p>
                <button
                  type="button"
                  className="mt-4 rounded-[10px] bg-[#6b4ab2] px-5 py-2 text-sm font-semibold text-white hover:bg-[#593f95] disabled:opacity-60 disabled:cursor-not-allowed"
                  onClick={() => setShowQuizStartModal(true)}
                  disabled={!allModulesCompleted || quizPassed}
                >
                  Start Quiz
                </button>
              </div>
            )}

            {error && (
              <div className="text-xs text-red-600">
                {error}
              </div>
            )}

            <div className="pt-2 sm:pt-4">
              <button
                type="button"
                className="inline-flex items-center justify-center rounded-[10px] border border-[#d7d0e2] bg-white px-5 py-2 text-sm font-semibold text-[#374151] transition-colors hover:bg-[#f9fafb]"
                onClick={() => navigate('/mentor-impact-dashboard')}
              >
                Go to Dashboard
              </button>
            </div>
          </div>
        </div>
      </main>

      {showQuizStartModal && (
        <div
          className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          onClick={() => setShowQuizStartModal(false)}
        >
          <div
            className="w-full max-w-md rounded-2xl border border-[#ddd4f0] bg-white shadow-[0_18px_45px_rgba(17,24,39,0.28)] p-5"
            onClick={(event) => event.stopPropagation()}
          >
            <p className="text-lg font-semibold text-[#1f2937]">Start Final Quiz?</p>
            <p className="mt-2 text-sm text-[#6b7280]">
              This quiz contains mixed questions from all modules. Once you enter, going back before submission will fail the quiz.
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                className="rounded-md border border-[#d7d0e2] px-4 py-2 text-sm text-[#374151]"
                onClick={() => setShowQuizStartModal(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="rounded-md bg-[#5b2c91] px-4 py-2 text-sm font-semibold text-white hover:bg-[#4a2374]"
                onClick={() => {
                  setShowQuizStartModal(false);
                  navigate('/mentor-training-modules-quiz');
                }}
              >
                Start Quiz
              </button>
            </div>
          </div>
        </div>
      )}

      <BottomAuth />
    </div>
  );
};

export default TrainingModules;
