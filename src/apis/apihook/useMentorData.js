import { useCallback, useEffect, useMemo, useState } from 'react';
import { getAuthSession } from '../api/storage';
import { mentorApi } from '../api/mentorApi';

const normalizeMentor = (payload) => {
  if (!payload) return null;
  if (Array.isArray(payload)) return payload[0] || null;
  if (Array.isArray(payload?.results)) return payload.results[0] || null;
  return payload;
};

export const useMentorData = ({ autoLoad = true } = {}) => {
  const authSession = useMemo(() => getAuthSession(), []);
  const [mentor, setMentor] = useState(null);
  const [loading, setLoading] = useState(Boolean(autoLoad));
  const [error, setError] = useState('');

  const loadCurrentMentor = useCallback(async () => {
    if (!authSession?.email) {
      setMentor(null);
      setError('Missing authenticated mentor session.');
      return null;
    }

    setLoading(true);
    setError('');
    try {
      const response = await mentorApi.getMentors({ email: authSession.email });
      const normalized = normalizeMentor(response);
      setMentor(normalized);
      if (!normalized?.id) {
        setError('Mentor profile not found for this account.');
        return null;
      }
      return normalized;
    } catch (err) {
      setError(err?.message || 'Unable to load mentor profile.');
      setMentor(null);
      return null;
    } finally {
      setLoading(false);
    }
  }, [authSession?.email]);

  useEffect(() => {
    if (!autoLoad) return;
    loadCurrentMentor();
  }, [autoLoad, loadCurrentMentor]);

  return {
    authSession,
    mentor,
    loading,
    error,
    loadCurrentMentor,
    setMentor,
  };
};
