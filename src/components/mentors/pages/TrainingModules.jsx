import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, Play, Lock, ArrowLeft } from 'lucide-react';
import TopAuth from '../../auth/TopAuth';
import BottomAuth from '../../auth/BottomAuth';
import { mentorApi } from '../../../apis/api/mentorApi';
import { useMentorData } from '../../../apis/apihook/useMentorData';

const TrainingModules = () => {
  const navigate = useNavigate();
  const { mentor } = useMentorData();
  const [modules, setModules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    if (!mentor?.id) {
      setLoading(false);
      return undefined;
    }

    const loadModules = async () => {
      setLoading(true);
      setError('');
      try {
        const response = await mentorApi.listTrainingModules({ mentor_id: mentor.id });
        const list = Array.isArray(response) ? response : response?.results || [];
        if (!cancelled) {
          setModules(list);
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

  const completedCount = useMemo(
    () => modules.filter((module) => module.training_status === 'completed').length,
    [modules]
  );
  const progressPercent = useMemo(() => {
    if (!modules.length) return 0;
    return Math.round((completedCount / modules.length) * 100);
  }, [completedCount, modules.length]);
  return (
    <div className="min-h-screen bg-transparent text-[#1f2937] flex flex-col">
      <TopAuth />

      <main className="flex-1">
        <div className="max-w-[1060px] mx-auto px-4 sm:px-6 lg:px-10 py-8 sm:py-10">
          <button
            type="button"
            className="inline-flex items-center gap-2 text-sm text-[#6b7280] hover:text-[#1f2937] mb-4"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Back
          </button>
          <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 className="text-lg sm:text-xl font-semibold text-[#1f2937]">Training Modules</h2>
              <p className="mt-1 text-sm text-[#6b7280]">
                Complete all modules to unlock the final quiz and activate your account.
              </p>
            </div>
            <div className="inline-flex items-center gap-3 rounded-xl border border-white/15 bg-white px-4 py-3 shadow-[0_8px_20px_rgba(0,0,0,0.2)]">
              <div
                className="relative h-11 w-11 rounded-full flex items-center justify-center"
                style={{
                  background: `conic-gradient(#fdd253 0% ${progressPercent}%, #f1f2f4 ${progressPercent}% 100%)`,
                }}
              >
                <div className="absolute inset-[3px] rounded-full bg-white" />
                <span className="relative text-xs text-[#1f2937] font-medium">{progressPercent}%</span>
              </div>
              <div>
                <p className="text-sm font-medium text-[#1f2937]">
                  {completedCount} of {modules.length || 0} Completed
                </p>
                <p className="text-xs text-[#6b7280]">Keep going!</p>
              </div>
            </div>
          </div>

          <div className="mt-6 space-y-4">
            {modules.map((module) => {
              const status = module.training_status || module.status || 'locked';
              const isCompleted = status === 'completed';
              const _isInProgress = status === 'in_progress';
              const isLocked = status === 'locked';
              const cardClass = isCompleted
                ? 'border-[#d9f3e6] bg-[#f0fff7]'
                : isLocked
                  ? 'border-[#e6e2f1] bg-[#f8fbfb]'
                  : 'border-[#e6e2f1] bg-white';
              const iconClass = isCompleted
                ? 'bg-[#18b77e] text-white'
                : isLocked
                  ? 'bg-[#e5e7eb] text-[#9ca3af]'
                  : 'bg-[#fdd253] text-[#1f2937]';
              return (
                <div
                  key={module.id}
                  className={`rounded-xl border ${cardClass} p-4 sm:p-5 flex items-center justify-between gap-4`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`h-9 w-9 rounded-full flex items-center justify-center ${iconClass}`}>
                      {isCompleted ? (
                        <Check className="h-4 w-4" aria-hidden="true" />
                      ) : isLocked ? (
                        <Lock className="h-4 w-4" aria-hidden="true" />
                      ) : (
                        <Play className="h-4 w-4" aria-hidden="true" />
                      )}
                    </div>
                    <div>
                      <p className={`text-sm font-semibold ${isLocked ? 'text-[#6b7280]' : 'text-[#1f2937]'}`}>
                        {module.title}
                      </p>
                      <p className="text-xs text-[#6b7280]">
                        {isCompleted && module.completed_at
                          ? `Completed on ${new Date(module.completed_at).toLocaleDateString()}`
                          : module.description || 'Complete the module to unlock the next step.'}
                      </p>
                    </div>
                  </div>
                  {!isLocked && (
                    <button
                      type="button"
                      className={`text-xs font-semibold ${
                        isCompleted
                          ? 'text-[#4B5563]'
                          : 'rounded-md bg-[#5b2c91] text-white px-5 py-2'
                      }`}
                      onClick={() => navigate(`/mentor-training-boundaries?moduleId=${module.id}`)}
                    >
                      {isCompleted ? 'Review' : 'Continue'}
                    </button>
                  )}
                </div>
              );
            })}

            {!modules.length && !loading && (
              <div className="text-xs text-[#6b7280]">No training modules available yet.</div>
            )}
            {(loading || error) && (
              <div className={`text-xs ${error ? 'text-red-600' : 'text-[#6b7280]'}`}>
                {error || 'Loading training modules...'}
              </div>
            )}
          </div>
        </div>
      </main>

      <BottomAuth />
    </div>
  );
};

export default TrainingModules;
