import { useCallback, useState } from 'react';
import { menteeApi } from '../api/menteeApi';
import {
  clearAssessmentDraft,
  getAssessmentDraft,
  setAssessmentDraft,
} from '../api/storage';

const buildRequestPayload = (draft) => {
  const payload = {
    session_mode: 'online',
    allow_auto_match: true,
  };

  if (draft.feeling) payload.feeling = draft.feeling;
  if (draft.feeling_cause) payload.feeling_cause = draft.feeling_cause;
  if (draft.support_type) payload.support_type = draft.support_type;
  if (draft.comfort_level) payload.comfort_level = draft.comfort_level;
  if (draft.language) payload.language = draft.language;

  return payload;
};

export const useMenteeAssessment = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const saveAnswer = useCallback((key, value) => {
    const current = getAssessmentDraft();
    setAssessmentDraft({
      ...current,
      [key]: value,
    });
  }, []);

  const submitAssessment = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const payload = buildRequestPayload(getAssessmentDraft());
      const response = await menteeApi.createRequest(payload);
      clearAssessmentDraft();
      return response;
    } catch (err) {
      setError(err?.message || 'Failed to submit assessment.');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    error,
    draft: getAssessmentDraft(),
    saveAnswer,
    submitAssessment,
    clearAssessmentDraft,
  };
};
