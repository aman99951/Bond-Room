import { useCallback, useState } from 'react';
import { menteeApi } from '../api/menteeApi';
import {
  clearAssessmentDraft,
  getAssessmentDraft,
  setAssessmentDraft,
} from '../api/storage';

const toSelectionArray = (value, fallback = '') => {
  if (Array.isArray(value)) {
    return value.map((item) => String(item || '').trim()).filter(Boolean);
  }
  if (typeof value === 'string' && value.trim()) {
    return [value.trim()];
  }
  if (typeof fallback === 'string' && fallback.trim()) {
    return [fallback.trim()];
  }
  return [];
};

const buildRequestPayload = (draft) => {
  const feelingSelections = toSelectionArray(draft.feelings, draft.feeling);
  const causeSelections = toSelectionArray(draft.feeling_causes, draft.feeling_cause);
  const extraNotes = [];

  if (feelingSelections.length) {
    extraNotes.push(`Feelings selected: ${feelingSelections.join(', ')}`);
  }
  if (draft.feeling_other_text?.trim()) {
    extraNotes.push(`Feeling details: ${draft.feeling_other_text.trim()}`);
  }
  if (causeSelections.length) {
    extraNotes.push(`Causes selected: ${causeSelections.join(', ')}`);
  }
  if (draft.feeling_cause_other_text?.trim()) {
    extraNotes.push(`Cause details: ${draft.feeling_cause_other_text.trim()}`);
  }

  const existingFreeText = String(draft.free_text || '').trim();
  const combinedFreeText = [existingFreeText, ...extraNotes].filter(Boolean).join('\n');

  const payload = {
    session_mode: 'online',
    allow_auto_match: true,
  };

  if (feelingSelections.length) payload.feeling = feelingSelections[0];
  if (causeSelections.length) payload.feeling_cause = causeSelections[0];
  if (draft.support_type) payload.support_type = draft.support_type;
  if (draft.comfort_level) payload.comfort_level = draft.comfort_level;
  if (draft.language) payload.language = draft.language;
  if (combinedFreeText) payload.free_text = combinedFreeText;

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
