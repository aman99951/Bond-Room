import React, { useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { setSelectedSessionId } from '../../../apis/api/storage';

const isValidMeetingUrl = (value) => {
  if (!value) return false;
  try {
    const parsed = new URL(value);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
};

const ZoomMeeting = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const { meetingUrl, sessionId } = useMemo(() => {
    const params = new URLSearchParams(location.search);
    return {
      meetingUrl: params.get('url') || '',
      sessionId: params.get('sessionId') || '',
    };
  }, [location.search]);

  const hasValidUrl = isValidMeetingUrl(meetingUrl);

  const goToFeedback = () => {
    if (sessionId) {
      setSelectedSessionId(sessionId);
    }
    navigate('/feedback');
  };

  return (
    <div className="min-h-[70vh] p-4 sm:p-6 bg-transparent">
      <div className="rounded-xl border border-[#e5e7eb] bg-white shadow-[0px_1px_2px_0px_rgba(0,0,0,0.08)] overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#e5e7eb] px-4 py-3">
          <h1
            className="text-[#111827]"
            style={{ fontFamily: 'DM Sans', fontSize: '24px', lineHeight: '30px', fontWeight: 700 }}
          >
            Zoom Meeting
          </h1>
          <div className="flex items-center gap-2">
            {hasValidUrl && (
              <button
                type="button"
                onClick={() => window.location.assign(meetingUrl)}
                className="inline-flex items-center rounded-md border border-[#d1d5db] bg-white px-3 py-1.5 text-xs text-[#374151]"
              >
                Open Directly
              </button>
            )}
            <button
              type="button"
              onClick={() => navigate('/my-sessions')}
              className="inline-flex items-center rounded-md border border-[#d1d5db] bg-white px-3 py-1.5 text-xs text-[#374151]"
            >
              Back to Sessions
            </button>
            <button
              type="button"
              onClick={goToFeedback}
              className="inline-flex items-center rounded-md bg-[#5D3699] px-3 py-1.5 text-xs text-white"
            >
              Leave Feedback
            </button>
          </div>
        </div>

        {!hasValidUrl ? (
          <div className="p-5 text-sm text-red-600">
            Invalid or missing meeting link. Please go back and try joining again.
          </div>
        ) : (
          <div className="h-[75vh] bg-[#f8fafc]">
            <div className="border-b border-[#e5e7eb] bg-[#f9fafb] px-4 py-2 text-xs text-[#6b7280]">
              If this embedded view shows an access error, use "Open Directly" to continue in this same tab.
            </div>
            <iframe
              title="Zoom Meeting"
              src={meetingUrl}
              className="h-[calc(75vh-33px)] w-full border-0"
              allow="camera; microphone; fullscreen; display-capture; clipboard-read; clipboard-write"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default ZoomMeeting;
