import { Navigate, Route, Routes } from 'react-router-dom';
import VoluntorLayout from './VoluntorLayout';
import VoluntorLanding from './VoluntorLanding';
import VoluntorRegister from './VoluntorRegister';
import VoluntorLogin from './VoluntorLogin';
import VoluntorActivities from './VoluntorActivities';
import VoluntorEventRegister from './VoluntorEventRegister';
import VoluntorDashboard from './VoluntorDashboard';
import VoluntorLogout from './VoluntorLogout';

const VoluntorFlow = () => {
  return (
    <Routes>
      <Route element={<VoluntorLayout />}>
        <Route index element={<VoluntorLanding />} />
        <Route path="register" element={<VoluntorRegister />} />
        <Route path="login" element={<VoluntorLogin />} />
        <Route path="activities" element={<VoluntorActivities />} />
        <Route path="activities/:eventId/register" element={<VoluntorEventRegister />} />
        <Route path="my-space" element={<VoluntorDashboard />} />
        <Route path="logout" element={<VoluntorLogout />} />
        <Route path="*" element={<Navigate to="/volunteer" replace />} />
      </Route>
    </Routes>
  );
};

export default VoluntorFlow;




