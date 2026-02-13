import { useCallback, useEffect, useMemo, useState } from 'react';
import { getAuthSession } from '../api/storage';
import { menteeApi } from '../api/menteeApi';

const normalizeMentee = (payload) => {
  if (!payload) return null;
  if (Array.isArray(payload)) return payload[0] || null;
  return payload;
};

export const useMenteeData = ({ autoLoad = true } = {}) => {
  const authSession = useMemo(() => getAuthSession(), []);
  const [mentee, setMentee] = useState(null);
  const [loading, setLoading] = useState(Boolean(autoLoad));
  const [error, setError] = useState('');

  const loadCurrentMentee = useCallback(async () => {
    if (!authSession?.email) {
      setMentee(null);
      setError('Missing authenticated mentee session.');
      return null;
    }

    setLoading(true);
    setError('');
    try {
      const response = await menteeApi.getMentees({ email: authSession.email });
      const normalized = normalizeMentee(response);
      setMentee(normalized);
      if (!normalized?.id) {
        setError('Mentee profile not found for this account.');
        return null;
      }
      return normalized;
    } catch (err) {
      setError(err?.message || 'Unable to load mentee profile.');
      setMentee(null);
      return null;
    } finally {
      setLoading(false);
    }
  }, [authSession?.email]);

  useEffect(() => {
    if (!autoLoad) return;
    loadCurrentMentee();
  }, [autoLoad, loadCurrentMentee]);

  return {
    authSession,
    mentee,
    loading,
    error,
    loadCurrentMentee,
    setMentee,
  };
};
