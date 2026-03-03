import React, { useEffect, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { setActiveMeeting } from '../../../apis/api/storage';

const MeetingRoom = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const sessionId = useMemo(() => {
    const params = new URLSearchParams(location.search);
    return Number(params.get('sessionId') || 0);
  }, [location.search]);

  useEffect(() => {
    if (!sessionId) return;
    setActiveMeeting({ sessionId, participantRole: 'mentor' });
  }, [sessionId]);

  useEffect(() => {
    if (!sessionId) {
      navigate('/mentor-sessions', { replace: true });
    }
  }, [navigate, sessionId]);

  // Meeting UI is hosted globally by <MeetingHost /> so the call persists across navigation.
  return null;
};

export default MeetingRoom;
