import React, { useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import MeetingRoomShell from './MeetingRoomShell';
import { mentorApi } from '../../apis/api/mentorApi';
import { menteeApi } from '../../apis/api/menteeApi';
import {
  ACTIVE_MEETING_EVENT_NAME,
  clearActiveMeeting,
  getActiveMeeting,
} from '../../apis/api/storage';

const getUiMode = (pathname) => {
  const path = String(pathname || '');
  if (path.includes('meeting-room') || path.includes('zoom-meeting')) return 'full';
  return 'background';
};

const getReopenPath = (participantRole, sessionId) => {
  const id = Number(sessionId || 0);
  if (!id) return '';
  return participantRole === 'mentor'
    ? `/mentor-meeting-room?sessionId=${id}`
    : `/mentee-meeting-room?sessionId=${id}`;
};

const MeetingHost = () => {
  const location = useLocation();
  const [activeMeeting, setActiveMeetingState] = useState(() => getActiveMeeting());

  useEffect(() => {
    const handleChange = () => setActiveMeetingState(getActiveMeeting());
    window.addEventListener(ACTIVE_MEETING_EVENT_NAME, handleChange);
    return () => window.removeEventListener(ACTIVE_MEETING_EVENT_NAME, handleChange);
  }, []);

  const sessionId = Number(activeMeeting?.sessionId || 0);
  const participantRole = activeMeeting?.participantRole === 'mentor' ? 'mentor' : 'mentee';

  const uiMode = useMemo(() => getUiMode(location?.pathname), [location?.pathname]);
  const reopenPath = useMemo(() => getReopenPath(participantRole, sessionId), [participantRole, sessionId]);

  if (!sessionId) return null;

  const api = participantRole === 'mentor' ? mentorApi : menteeApi;
  const exitPath = participantRole === 'mentor' ? '/mentor-session-completed' : '/feedback';
  const exitLabel = participantRole === 'mentor' ? 'End Session' : 'Leave & Feedback';

  return (
    <MeetingRoomShell
      api={api}
      participantRole={participantRole}
      exitPath={exitPath}
      title="Bond Room Meeting"
      exitLabel={exitLabel}
      sessionIdOverride={sessionId}
      uiMode={uiMode}
      reopenPath={reopenPath}
      onExit={clearActiveMeeting}
    />
  );
};

export default MeetingHost;

