import React from 'react';
import MeetingRoomShell from '../../meeting/MeetingRoomShell';
import { mentorApi } from '../../../apis/api/mentorApi';

const MeetingRoom = () => {
  return (
    <MeetingRoomShell
      api={mentorApi}
      participantRole="mentor"
      exitPath="/mentor-session-completed"
      title="Bond Room Meeting"
      exitLabel="End Session"
    />
  );
};

export default MeetingRoom;
