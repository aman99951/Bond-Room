import { useEffect } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { getVoluntorSession, logoutVoluntorUser } from './voluntorStore';

const VoluntorLogout = () => {
  const navigate = useNavigate();
  const session = getVoluntorSession();

  useEffect(() => {
    logoutVoluntorUser();
    navigate('/volunteer', { replace: true });
  }, [navigate]);

  if (!session) {
    return <Navigate to="/volunteer" replace />;
  }

  return null;
};

export default VoluntorLogout;




