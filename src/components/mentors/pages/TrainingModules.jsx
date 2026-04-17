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
    <div className="min-h-screen bg-[linear-gradient(135deg,var(--theme-v-bg-start)_0%,var(--theme-v-bg-mid)_45%,var(--theme-v-bg-end)_100%)] text-[color:var(--theme-v-text-primary)] flex flex-col">
      <TopAuth />

      <main className="flex-1 pt-20 sm:pt-24">
        <div className="w-full px-4 sm:px-8 lg:px-10 py-8 sm:py-10">
          <button
            type="button"
            className="inline-flex items-center gap-2 text-sm text-[color:var(--theme-v-text-secondary)] hover:text-[color:var(--theme-v-text-primary)] mb-4"
            onClick={handleBack}
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Back
          </button>

          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <h2 className="text-xl sm:text-2xl font-semibold text-[color:var(--theme-v-text-primary)]">Training Modules</h2>
              <p className="mt-1 text-xs sm:text-sm text-[color:var(--theme-v-text-secondary)]">
                Complete all modules to unlock the final quiz and activate your account.
              </p>
            </div>

            <div className="min-w-[210px] rounded-[14px] border border-[color:var(--theme-v-hero-border)] bg-[color:var(--theme-v-header-bg)] px-4 py-3 shadow-[0_8px_20px_rgba(22,10,46,0.45)]">
              <div className="flex items-center gap-3">
                <div
                  className="relative h-12 w-12 rounded-full flex items-center justify-center"
                  style={{
                    background: `conic-gradient(var(--theme-v-accent) 0% ${progressPercent}%, var(--theme-v-hero-border) ${progressPercent}% 100%)`,
                  }}
                >
                  <div className="absolute inset-[4px] rounded-full bg-[color:var(--theme-v-header-bg)]" />
                  <span className="relative text-[11px] font-semibold text-[color:var(--theme-v-text-secondary)]">{progressPercent}%</span>
                </div>
                <div>
                  <p className="text-xs sm:text-sm font-semibold text-[color:var(--theme-v-text-primary)]">
                    {completedCount} of {modules.length || 0} Completed
                  </p>
                  <p className="text-xs text-[color:var(--theme-v-text-secondary)]">
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
                  className="h-9 w-9 animate-spin rounded-full border-[3px] border-[color:var(--theme-v-hero-border)] border-t-[color:var(--theme-v-accent)]"
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
                    ? 'bg-[color:var(--theme-v-nav-hover-bg)] border-[color:var(--theme-v-hero-border)]'
                    : 'bg-[color:var(--theme-v-header-bg)] border-[color:var(--theme-v-hero-border)]';

                const iconClass = isCompleted
                  ? 'bg-[#24b56b] text-white'
                  : isLocked
                    ? 'bg-[color:var(--theme-v-hero-border)] text-[color:var(--theme-v-text-secondary)]'
                    : 'bg-[color:var(--theme-v-accent)] text-[color:var(--theme-v-accent-text)]';

                const isActiveRow = activeModuleId && module.id === activeModuleId;

                return (
                  <div
                    key={module.id}
                    className={`rounded-[18px] px-5 py-5 sm:px-8 sm:py-6 flex items-center justify-between gap-4 border ${rowClass} ${
                      isActiveRow ? 'border-2 border-[color:var(--theme-v-accent)] shadow-[0_0_0_2px_rgba(253,210,83,0.2)]' : ''
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
                            isLocked ? 'text-[color:var(--theme-v-text-secondary)]' : isInProgress ? 'text-[color:var(--theme-v-accent)]' : 'text-[color:var(--theme-v-text-primary)]'
                          }`}
                        >
                          {module.title}
                        </p>
                        <p className="text-sm text-[color:var(--theme-v-text-secondary)] truncate">
                          {isCompleted && module.completed_at
                            ? `Completed on ${formatCompletedDate(module.completed_at)}`
                            : module.description || 'Complete previous module to unlock.'}
                        </p>
                      </div>
                    </div>

                    {isCompleted && (
                      <button
                        type="button"
                        className="text-sm font-semibold text-[color:var(--theme-v-accent)] shrink-0"
                        onClick={() => navigate(`/mentor-training-boundaries?moduleId=${module.id}`)}
                      >
                        Review
                      </button>
                    )}

                    {isInProgress && (
                      <button
                        type="button"
                        className="rounded-[8px] bg-[color:var(--theme-v-accent)] px-5 py-2 text-sm font-semibold text-[color:var(--theme-v-accent-text)] hover:bg-[color:var(--theme-v-accent-hover)] shrink-0"
                        onClick={() => navigate(`/mentor-training-boundaries?moduleId=${module.id}`)}
                      >
                        Continue
                      </button>
                    )}
                  </div>
                );
              })}

            {!loading && !!mentor?.id && !error && !modules.length && (
              <div className="text-xs text-[color:var(--theme-v-text-secondary)]">No training modules available yet.</div>
            )}

            {!loading && modules.length > 0 && (
              <div className="rounded-[18px] border border-[color:var(--theme-v-hero-border)] bg-[color:var(--theme-v-nav-hover-bg)] p-5 sm:p-6 shadow-[0_8px_20px_rgba(22,10,46,0.3)]">
                <p className="text-base font-semibold text-[color:var(--theme-v-text-primary)]">
                  {quizPassed ? 'Final Quiz Completed' : 'Final Quiz'}
                </p>
                <p className="mt-1 text-sm text-[color:var(--theme-v-text-secondary)]">
                  {quizPassed
                    ? 'You passed the mixed 15-question quiz from all modules.'
                    : 'This quiz contains mixed questions from all modules. Complete all modules to enable Start Quiz.'}
                </p>
                <button
                  type="button"
                  className="mt-4 rounded-[10px] bg-[color:var(--theme-v-accent)] px-5 py-2 text-sm font-semibold text-[color:var(--theme-v-accent-text)] hover:bg-[color:var(--theme-v-accent-hover)] disabled:opacity-60 disabled:cursor-not-allowed"
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
                className="inline-flex items-center justify-center rounded-[10px] border border-[color:var(--theme-v-hero-border)] bg-[color:var(--theme-v-nav-hover-bg)] px-5 py-2 text-sm font-semibold text-[color:var(--theme-v-text-primary)] transition-colors hover:bg-[color:var(--theme-v-header-bg)]"
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
            className="w-full max-w-md rounded-2xl border border-[color:var(--theme-v-hero-border)] bg-[color:var(--theme-v-header-bg)] shadow-[0_18px_45px_rgba(22,10,46,0.5)] p-5"
            onClick={(event) => event.stopPropagation()}
          >
            <p className="text-lg font-semibold text-[color:var(--theme-v-text-primary)]">Start Final Quiz?</p>
            <p className="mt-2 text-sm text-[color:var(--theme-v-text-secondary)]">
              This quiz contains mixed questions from all modules. Once you enter, going back before submission will fail the quiz.
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                className="rounded-md border border-[color:var(--theme-v-hero-border)] px-4 py-2 text-sm text-[color:var(--theme-v-text-primary)]"
                onClick={() => setShowQuizStartModal(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="rounded-md bg-[color:var(--theme-v-accent)] px-4 py-2 text-sm font-semibold text-[color:var(--theme-v-accent-text)] hover:bg-[color:var(--theme-v-accent-hover)]"
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
