import React from 'react';
import MeetingRoomShell from '../../meeting/MeetingRoomShell';
import { menteeApi } from '../../../apis/api/menteeApi';

const MeetingRoom = () => {
  return (
    <MeetingRoomShell
      api={menteeApi}
      participantRole="mentee"
      exitPath="/feedback"
      title="Bond Room Meeting"
      exitLabel="Leave & Feedback"
    />
  );
};

export default MeetingRoom;
