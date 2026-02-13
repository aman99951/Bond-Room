import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import TopAuth from '../../auth/TopAuth';
import BottomAuth from '../../auth/BottomAuth';
import { mentorApi } from '../../../apis/api/mentorApi';
import { useMentorData } from '../../../apis/apihook/useMentorData';

const TrainingBoundaries = () => {
  const navigate = useNavigate();
  const { search } = useLocation();
  const { mentor } = useMentorData();
  const moduleId = useMemo(() => {
    const params = new URLSearchParams(search);
    return params.get('moduleId');
  }, [search]);
  const [moduleData, setModuleData] = useState(null);
  const [totalModules, setTotalModules] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    if (!mentor?.id) {
      setLoading(false);
      return undefined;
    }

    const loadModule = async () => {
      setLoading(true);
      setError('');
      try {
        const response = await mentorApi.listTrainingModules({ mentor_id: mentor.id });
        const list = Array.isArray(response) ? response : response?.results || [];
        const matched = moduleId ? list.find((item) => String(item.id) === String(moduleId)) : list[0];
        if (!cancelled) {
          setModuleData(matched || null);
          setTotalModules(list.length);
        }
      } catch (err) {
        if (!cancelled) setError(err?.message || 'Unable to load module details.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadModule();
    return () => {
      cancelled = true;
    };
  }, [mentor?.id, moduleId]);

  const lessonOutline = Array.isArray(moduleData?.lesson_outline) ? moduleData.lesson_outline : [];
  const progressPercent = Number(moduleData?.progress_percent || 0);

  const handleComplete = async () => {
    if (!mentor?.id || !moduleData?.id) {
      setError('Module data not available.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const progressResponse = await mentorApi.listMentorTrainingProgress({ mentor_id: mentor.id });
      const progressList = Array.isArray(progressResponse) ? progressResponse : progressResponse?.results || [];
      const existing = progressList.find((item) => String(item.module) === String(moduleData.id));
      const payload = {
        status: 'completed',
        progress_percent: 100,
        completed_at: new Date().toISOString(),
      };
      if (existing?.id) {
        await mentorApi.updateMentorTrainingProgress(existing.id, payload);
      } else {
        await mentorApi.createMentorTrainingProgress({
          mentor: mentor.id,
          module: moduleData.id,
          ...payload,
        });
      }
      navigate('/mentor-training-modules');
    } catch (err) {
      setError(err?.message || 'Unable to update module progress.');
    } finally {
      setSaving(false);
    }
  };
  return (
    <div className="min-h-screen bg-[#f4f2f7] text-primary flex flex-col">
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

          <div className="border border-[#e6e2f1] rounded-[18px] bg-white shadow-[0_12px_30px_rgba(0,0,0,0.08)] p-6 sm:p-8 lg:p-10">
            <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h2 className="text-lg sm:text-2xl font-semibold text-[#1f2937]">
                  {moduleData?.title || 'Training Module'}
                </h2>
                <p className="mt-2 text-sm text-[#6b7280] max-w-2xl">
                  {moduleData?.description ||
                    'Learn the professional boundaries between mentor and mentee, ethical guidance, and how to build trust while keeping the student safe.'}
                </p>
              </div>
              <div className="inline-flex items-center gap-2 rounded-full bg-[#e9ddff] text-xs text-[#5b2c91] px-3 py-1 font-medium">
                Module {moduleData?.order || '-'} of {totalModules || '-'}
              </div>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <div className="rounded-xl border border-[#e6e2f1] bg-[#f7f5fa] p-5">
                <h3 className="text-sm font-semibold text-[#1f2937]">Lesson Outline</h3>
                <ul className="mt-3 space-y-2 text-sm text-[#6b7280] list-disc pl-4">
                  {(lessonOutline.length ? lessonOutline : ['Module outline will appear here.']).map((item, idx) => (
                    <li key={`${item}-${idx}`}>{item}</li>
                  ))}
                </ul>
              </div>
              <div className="rounded-xl border border-[#e6e2f1] bg-white p-5">
                <h3 className="text-sm font-semibold text-[#1f2937]">Quick Check</h3>
                <p className="mt-2 text-sm text-[#6b7280]">
                  Complete the short quiz after the lesson to unlock the next module.
                </p>
                <div className="mt-4 h-2 w-full rounded-full bg-[#ebe7f4]">
                  <div className="h-2 rounded-full bg-[#5b2c91]" style={{ width: `${progressPercent}%` }} />
                </div>
                <p className="mt-2 text-xs text-[#6b7280]">{progressPercent}% completed</p>
              </div>
            </div>

            <div className="mt-6 rounded-xl border border-[#e6e2f1] bg-[#fff5d6] p-4 text-sm text-[#6b7280]">
              Tip: Use clear session boundaries and share them with students and guardians upfront.
            </div>

            <div className="mt-6 flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
              <button
                type="button"
                className="rounded-md border border-[#5b2c91] text-[#5b2c91] px-5 py-2 text-sm font-semibold"
              >
                Review Guidelines
              </button>
              <button
                type="button"
                className="rounded-md bg-[#5b2c91] text-white px-6 py-2.5 text-sm font-semibold hover:bg-[#4a2374]"
                onClick={handleComplete}
                disabled={saving}
              >
                {saving ? 'Saving...' : 'Continue to Quiz'}
              </button>
            </div>
            {(loading || error) && (
              <div className={`mt-4 text-xs ${error ? 'text-red-600' : 'text-[#6b7280]'}`}>
                {error || 'Loading module details...'}
              </div>
            )}
          </div>
        </div>
      </main>

      <BottomAuth />
    </div>
  );
};

export default TrainingBoundaries;
