import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, CirclePlay, Lock } from 'lucide-react';
import TopAuth from '../../auth/TopAuth';
import BottomAuth from '../../auth/BottomAuth';
import { mentorApi } from '../../../apis/api/mentorApi';
import { useMentorData } from '../../../apis/apihook/useMentorData';

const FALLBACK_VIDEOS = [
  {
    key: 'video-1',
    title: 'Module walkthrough video 1',
    url: '',
    watched: false,
  },
  {
    key: 'video-2',
    title: 'Module walkthrough video 2',
    url: '',
    watched: false,
  },
];

const getModuleVideos = (moduleData) => {
  if (Array.isArray(moduleData?.video_progress) && moduleData.video_progress.length) {
    return moduleData.video_progress.map((item, index) => ({
      key: item.key || `video-${index + 1}`,
      title: item.title || `Video ${index + 1}`,
      url: item.url || '',
      watched: Boolean(item.watched),
      index: index + 1,
    }));
  }

  if (Array.isArray(moduleData?.videos) && moduleData.videos.length) {
    return moduleData.videos.map((item, index) => ({
      key: item.key || `video-${index + 1}`,
      title: item.title || `Video ${index + 1}`,
      url: item.url || '',
      watched: false,
      index: index + 1,
    }));
  }

  return FALLBACK_VIDEOS.map((item, index) => ({ ...item, index: index + 1 }));
};

const getYouTubeVideoId = (url) => {
  if (!url) return '';
  try {
    const parsed = new URL(url);
    if (parsed.hostname.includes('youtu.be')) {
      return parsed.pathname.replace('/', '');
    }
    if (parsed.hostname.includes('youtube.com')) {
      return parsed.searchParams.get('v') || '';
    }
    return '';
  } catch {
    return '';
  }
};

const TrainingBoundaries = () => {
  const navigate = useNavigate();
  const { search } = useLocation();
  const { mentor } = useMentorData();

  const moduleId = useMemo(() => {
    const params = new URLSearchParams(search);
    return params.get('moduleId');
  }, [search]);

  const [modules, setModules] = useState([]);
  const [moduleData, setModuleData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [markingVideoIndex, setMarkingVideoIndex] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    if (!mentor?.id) {
      return undefined;
    }

    const loadModules = async () => {
      setLoading(true);
      setError('');
      try {
        const response = await mentorApi.listTrainingModules({ mentor_id: mentor.id });
        const list = Array.isArray(response) ? response : response?.results || [];
        const selected =
          list.find((item) => String(item.id) === String(moduleId)) ||
          list.find((item) => (item.training_status || item.status || 'locked') === 'in_progress') ||
          list[0] ||
          null;

        if (!cancelled) {
          setModules(list);
          setModuleData(selected);
        }
      } catch (err) {
        if (!cancelled) setError(err?.message || 'Unable to load module details.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadModules();
    return () => {
      cancelled = true;
    };
  }, [mentor?.id, moduleId]);

  const videos = useMemo(() => getModuleVideos(moduleData), [moduleData]);
  const watchedCount = useMemo(() => videos.filter((item) => item.watched).length, [videos]);
  const progressPercent = useMemo(() => {
    if (!videos.length) return 0;
    return Math.round((watchedCount / videos.length) * 100);
  }, [videos, watchedCount]);

  const moduleStatus = moduleData?.training_status || moduleData?.status || 'locked';
  const moduleIndex = useMemo(() => {
    if (!moduleData?.id) return '-';
    const idx = modules.findIndex((item) => item.id === moduleData.id);
    if (idx === -1) return moduleData.order || '-';
    return idx + 1;
  }, [moduleData, modules]);

  const handleVideoEnded = async (videoIndex) => {
    if (!mentor?.id || !moduleData?.id || moduleStatus === 'locked') return;

    setMarkingVideoIndex(videoIndex);
    setError('');

    try {
      const response = await mentorApi.watchTrainingModuleVideo(moduleData.id, {
        mentor_id: mentor.id,
        video_index: videoIndex,
      });

      const nextModules = Array.isArray(response?.modules) ? response.modules : modules;
      const nextModule =
        response?.module || nextModules.find((item) => String(item.id) === String(moduleData.id)) || moduleData;

      setModules(nextModules);
      setModuleData(nextModule);
    } catch (err) {
      setError(err?.message || 'Unable to update video progress.');
    } finally {
      setMarkingVideoIndex(null);
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
            onClick={() => navigate('/mentor-training-modules')}
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Back to Modules
          </button>

          <div className="border border-[#e6e2f1] rounded-[18px] bg-white shadow-[0_12px_30px_rgba(0,0,0,0.08)] p-6 sm:p-8 lg:p-10">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h2 className="text-lg sm:text-2xl font-semibold text-[#1f2937]">
                  {moduleData?.title || 'Training Module'}
                </h2>
                <p className="mt-2 text-sm text-[#6b7280] max-w-2xl">
                  {moduleData?.description ||
                    'Watch both videos to complete this module and unlock the next one.'}
                </p>
              </div>

              <div className="inline-flex items-center gap-2 rounded-full bg-[#e9ddff] text-xs text-[#5b2c91] px-3 py-1 font-medium">
                Module {moduleIndex} of {modules.length || '-'}
              </div>
            </div>

            {loading ? (
              <div className="mt-6 flex items-center justify-center py-8">
                <div
                  className="h-9 w-9 animate-spin rounded-full border-[3px] border-[#e3e4e8] border-t-[#6b4ab2]"
                  aria-label="Loading module details"
                />
              </div>
            ) : (
              <>
                <div className="mt-6 rounded-xl border border-[#e6e2f1] bg-[#f7f5fa] p-5">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <h3 className="text-sm font-semibold text-[#1f2937]">Module Progress</h3>
                      <p className="mt-1 text-xs text-[#6b7280]">
                        {watchedCount} of {videos.length} videos watched
                      </p>
                    </div>
                    <div className="text-sm font-semibold text-[#5b2c91]">{progressPercent}%</div>
                  </div>

                  <div className="mt-3 h-2 w-full rounded-full bg-[#ebe7f4]">
                    <div className="h-2 rounded-full bg-[#5b2c91]" style={{ width: `${progressPercent}%` }} />
                  </div>
                </div>

                {!moduleData ? (
                  <div className="mt-6 text-xs text-[#6b7280]">No module data available.</div>
                ) : moduleStatus === 'locked' ? (
                  <div className="mt-6 rounded-xl border border-[#f3d6d6] bg-[#fff5f5] px-4 py-3 text-sm text-[#b42318] flex items-center gap-2">
                    <Lock className="h-4 w-4" aria-hidden="true" />
                    Complete previous modules first to unlock this module.
                  </div>
                ) : (
                  <div className="mt-6 grid gap-5 lg:grid-cols-2">
                    {videos.map((video) => (
                      <div key={video.key} className="rounded-xl border border-[#e6e2f1] bg-white p-4">
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-2">
                            <CirclePlay className="h-4 w-4 text-[#5b2c91]" aria-hidden="true" />
                            <p className="text-sm font-semibold text-[#1f2937]">{video.title}</p>
                          </div>
                          {video.watched ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-[#e7f8ef] px-2.5 py-1 text-xs font-medium text-[#027a48]">
                              <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                              Completed
                            </span>
                          ) : (
                            <span className="text-xs text-[#6b7280]">
                              {markingVideoIndex === video.index ? 'Updating...' : 'Watch till end'}
                            </span>
                          )}
                        </div>

                        {getYouTubeVideoId(video.url) ? (
                          <>
                            <iframe
                              title={video.title}
                              src={`https://www.youtube.com/embed/${getYouTubeVideoId(video.url)}?rel=0&modestbranding=1`}
                              className="mt-3 h-[220px] w-full rounded-lg border border-[#e5e7eb] bg-black"
                              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                              allowFullScreen
                            />

                            {!video.watched && (
                              <button
                                type="button"
                                className="mt-3 rounded-md bg-[#5b2c91] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#4a2374]"
                                onClick={() => handleVideoEnded(video.index)}
                                disabled={markingVideoIndex === video.index}
                              >
                                {markingVideoIndex === video.index ? 'Updating...' : 'Mark as watched'}
                              </button>
                            )}
                            <p className="mt-2 text-xs text-[#6b7280]">
                              Watch the full video, then click Mark as watched.
                            </p>
                          </>
                        ) : !video.url ? (
                          <div className="mt-3 rounded-lg border border-[#f3d6d6] bg-[#fff5f5] p-3 text-xs text-[#b42318]">
                            Video URL is not configured for this slot.
                          </div>
                        ) : (
                          <>
                            <video
                              controls
                              className="mt-3 w-full rounded-lg border border-[#e5e7eb] bg-black"
                              onEnded={() => handleVideoEnded(video.index)}
                            >
                              <source src={video.url} type="video/mp4" />
                            </video>

                            <p className="mt-2 text-xs text-[#6b7280]">
                              Video auto-marks complete when playback reaches the end.
                            </p>
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {moduleStatus === 'completed' && (
                  <div className="mt-6 rounded-xl border border-[#d1fadf] bg-[#ecfdf3] p-4 text-sm text-[#027a48]">
                    Module completed. You can move to the next module from the Training Modules page.
                  </div>
                )}
              </>
            )}

            {error && (
              <div className="mt-4 text-xs text-red-600">
                {error}
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
