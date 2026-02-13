import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { mentorApi } from '../../../apis/api/mentorApi';
import { useMentorData } from '../../../apis/apihook/useMentorData';

const formatDateLabel = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Date TBD';
  return date.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
};

const formatTimeRange = (startValue, endValue) => {
  const start = new Date(startValue);
  const end = new Date(endValue);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return 'Time TBD';
  const startLabel = start.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  const endLabel = end.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  return `${startLabel} - ${endLabel}`;
};

const normalizeList = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.results)) return payload.results;
  return [];
};

const SessionRequests = () => {
  const { mentor } = useMentorData();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const loadRequests = useCallback(async () => {
    if (!mentor?.id) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      const response = await mentorApi.listSessions({ mentor_id: mentor.id, status: 'requested' });
      const list = normalizeList(response);
      setSessions(list);
    } catch (err) {
      setError(err?.message || 'Unable to load session requests.');
      setSessions([]);
    } finally {
      setLoading(false);
    }
  }, [mentor?.id]);

  useEffect(() => {
    loadRequests();
  }, [loadRequests]);

  const handleDecision = async (sessionId, status) => {
    if (!sessionId) return;
    setUpdatingId(sessionId);
    setError('');
    setSuccess('');
    try {
      await mentorApi.updateSession(sessionId, { status });
      setSessions((prev) => prev.filter((session) => session.id !== sessionId));
      setSuccess('Session updated.');
    } catch (err) {
      setError(err?.message || 'Unable to update session.');
    } finally {
      setUpdatingId(null);
    }
  };

  const rows = useMemo(() => sessions, [sessions]);

  return (
    <div className="p-4 sm:p-6 bg-transparent">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1
            className="text-[#111827]"
            style={{ fontFamily: 'DM Sans', fontSize: '30px', lineHeight: '36px', fontWeight: 700 }}
          >
            Session Requests
          </h1>
          <p className="mt-1 text-xs text-[#6b7280]">
            Review mentee requests waiting for your approval.
          </p>
        </div>
        <button
          type="button"
          onClick={loadRequests}
          className="inline-flex items-center justify-center rounded-md border border-[#e5e7eb] bg-white px-4 py-2 text-xs text-[#6b7280]"
          disabled={loading}
        >
          {loading ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      <div className="mt-4 rounded-xl border border-[#e5e7eb] bg-white overflow-x-auto shadow-[0px_1px_2px_0px_rgba(0,0,0,0.08)]">
        <table className="min-w-[720px] w-full text-xs">
          <thead className="bg-[#f8fafc] text-[#6b7280]">
            <tr>
              <th className="text-left p-3 border-b border-[#e5e7eb]">Mentee</th>
              <th className="text-left p-3 border-b border-[#e5e7eb]">Date</th>
              <th className="text-left p-3 border-b border-[#e5e7eb]">Time</th>
              <th className="text-left p-3 border-b border-[#e5e7eb]">Duration</th>
              <th className="text-left p-3 border-b border-[#e5e7eb]">Mode</th>
              <th className="text-left p-3 border-b border-[#e5e7eb]">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((session) => {
              const durationLabel = session?.duration_minutes
                ? `${session.duration_minutes} min`
                : 'TBD';
              const modeLabel = session?.mode ? session.mode.replace('_', ' ') : 'N/A';
              const busy = updatingId === session.id;
              return (
                <tr key={session.id} className="border-b border-[#e5e7eb]">
                  <td className="p-3 text-[#111827]">{`Mentee #${session.mentee}`}</td>
                  <td className="p-3 text-[#6b7280]">{formatDateLabel(session.scheduled_start)}</td>
                  <td className="p-3 text-[#6b7280]">
                    {formatTimeRange(session.scheduled_start, session.scheduled_end)}
                  </td>
                  <td className="p-3 text-[#6b7280]">{durationLabel}</td>
                  <td className="p-3 text-[#6b7280]">{modeLabel}</td>
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleDecision(session.id, 'approved')}
                        disabled={busy}
                        className="rounded-md bg-[#5D3699] px-3 py-1.5 text-[11px] text-white disabled:opacity-70"
                      >
                        {busy ? 'Updating...' : 'Approve'}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDecision(session.id, 'canceled')}
                        disabled={busy}
                        className="rounded-md border border-[#e5e7eb] px-3 py-1.5 text-[11px] text-[#6b7280] disabled:opacity-70"
                      >
                        Decline
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {!rows.length && !loading && (
              <tr>
                <td className="p-4 text-xs text-[#6b7280]" colSpan={6}>
                  No session requests yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {(loading || error || success) && (
        <div className={`mt-3 text-xs ${error ? 'text-red-600' : success ? 'text-green-700' : 'text-[#6b7280]'}`}>
          {error || success || 'Loading session requests...'}
        </div>
      )}
    </div>
  );
};

export default SessionRequests;
