import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, Wallet, Heart, Flag, Clock, Calendar } from 'lucide-react';
import { mentorApi } from '../../../apis/api/mentorApi';
import { getSelectedSessionId } from '../../../apis/api/storage';

const SessionCompleted = () => {
  const navigate = useNavigate();
  const [selected, setSelected] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [infoMessage, setInfoMessage] = useState('');
  const [issueCategory, setIssueCategory] = useState('other');
  const [issueDescription, setIssueDescription] = useState('');

  const sessionId = useMemo(() => getSelectedSessionId(), []);

  useEffect(() => {
    let cancelled = false;
    if (!sessionId) {
      setLoading(false);
      return undefined;
    }
    const loadSession = async () => {
      setLoading(true);
      setError('');
      try {
        const response = await mentorApi.getSessionById(sessionId);
        if (!cancelled) setSession(response || null);
      } catch (err) {
        if (!cancelled) setError(err?.message || 'Unable to load session.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    loadSession();
    return () => {
      cancelled = true;
    };
  }, [sessionId]);

  const menteeLabel = session?.mentee ? `Mentee #${session.mentee}` : 'Mentee';
  const durationLabel = session?.duration_minutes ? `${session.duration_minutes} Minutes` : 'Duration TBD';
  const dateLabel = session?.scheduled_start
    ? new Date(session.scheduled_start).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })
    : 'Date TBD';

  const handleConfirm = async () => {
    if (!selected || !session?.id) return;
    setSaving(true);
    setError('');
    setInfoMessage('');
    try {
      await mentorApi.updateSession(session.id, { status: 'completed' });
      const payload = { action: selected };
      if (selected === 'report') {
        payload.issue_category = issueCategory;
        payload.issue_description = issueDescription;
      }
      await mentorApi.submitSessionDisposition(session.id, payload);
      setInfoMessage('Session disposition saved successfully.');
      navigate('/mentor-sessions', { replace: true });
    } catch (err) {
      setError(err?.message || 'Unable to process session disposition.');
    } finally {
      setSaving(false);
    }
  };

  const cards = [
    {
      id: 'claim',
      title: 'Claim Session',
      desc: 'Mark this session as claimed.',
      icon: Wallet,
      tone: 'purple',
    },
    {
      id: 'donate',
      title: 'Complementary Service',
      desc: 'Mark this session as a complementary service.',
      icon: Heart,
      tone: 'yellow',
    },
    {
      id: 'report',
      title: 'Report Issue',
      desc: 'Technical issues or student no-show.',
      icon: Flag,
      tone: 'gray',
    },
  ];

  return (
    <div className="min-h-screen bg-transparent p-6 sm:p-10">
      <div className="w-full rounded-[16px] bg-white shadow-[0_20px_40px_rgba(0,0,0,0.12)] border border-[#ece7f6] p-10">
        <div className="flex flex-col items-center text-center">
          <div className="h-16 w-16 rounded-full bg-[#dcfce7] flex items-center justify-center">
            <Check className="h-6 w-6 text-[#22c55e]" aria-hidden="true" />
          </div>
          <h1 className="mt-4 text-2xl font-semibold text-[#1f2937]">Session Completed!</h1>
        </div>

        <div className="mt-6 rounded-2xl bg-[#f7fafc] px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-4 text-[#374151]">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-full bg-gradient-to-br from-[#f59e0b] to-[#ec4899] text-white flex items-center justify-center text-xs font-semibold">
              {menteeLabel
                .split(' ')
                .slice(-1)[0]
                ?.replace('#', '')
                ?.slice(0, 2) || 'MN'}
            </div>
            <div className="font-medium">{menteeLabel}</div>
          </div>
          <div className="hidden sm:block h-6 w-px bg-[#e5e7eb]" />
          <div className="flex items-center gap-2 text-sm">
            <Clock className="h-4 w-4 text-[#6b7280]" />
            {durationLabel}
          </div>
          <div className="hidden sm:block h-6 w-px bg-[#e5e7eb]" />
          <div className="flex items-center gap-2 text-sm">
            <Calendar className="h-4 w-4 text-[#6b7280]" />
            {dateLabel}
          </div>
        </div>

        <p className="mt-4 text-center text-sm text-[#6b7280]">
          This session has been successfully recorded.
        </p>

        <div className="mt-8 text-center">
          <h2 className="text-sm font-semibold text-[#374151]">
            How would you like to process this session?
          </h2>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          {cards.map((card) => {
            const Icon = card.icon;
            const selectedStyle =
              selected === card.id ? 'ring-2 ring-[#5b2c91]' : 'ring-1 ring-transparent';
            const toneStyle =
              card.tone === 'purple'
                ? 'bg-[#efe7ff] text-[#5b2c91]'
                : card.tone === 'yellow'
                ? 'bg-[#fff3c4] text-[#f59e0b]'
                : 'bg-[#f3f4f6] text-[#6b7280]';
            return (
              <button
                key={card.id}
                type="button"
                onClick={() => setSelected(card.id)}
                className={`rounded-2xl bg-white border border-[#e5e7eb] p-5 text-center shadow-[0_8px_18px_rgba(0,0,0,0.06)] ${selectedStyle}`}
              >
                <div className={`mx-auto h-12 w-12 rounded-full flex items-center justify-center ${toneStyle}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="mt-4 text-sm font-semibold text-[#1f2937]">{card.title}</h3>
                <p className="mt-2 text-xs text-[#6b7280]">{card.desc}</p>
              </button>
            );
          })}
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {selected === 'report' && (
            <>
              <div>
                <label className="block text-xs text-[#6b7280] mb-1">Issue Category</label>
                <select
                  className="w-full rounded-md border border-[#e5e7eb] bg-white px-3 py-2 text-sm"
                  value={issueCategory}
                  onChange={(event) => setIssueCategory(event.target.value)}
                >
                  <option value="technical_issue">Technical Issue</option>
                  <option value="mentee_no_show">Mentee No-show</option>
                  <option value="safety_concern">Safety Concern</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-xs text-[#6b7280] mb-1">Issue Description</label>
                <textarea
                  rows={3}
                  className="w-full rounded-md border border-[#e5e7eb] bg-white px-3 py-2 text-sm"
                  value={issueDescription}
                  onChange={(event) => setIssueDescription(event.target.value)}
                  placeholder="Describe the issue."
                />
              </div>
            </>
          )}
        </div>

        <div className="mt-8 flex flex-col items-center gap-3">
          <button
            type="button"
            className={`w-full sm:w-[320px] rounded-full py-3 text-sm font-semibold transition ${
              selected ? 'bg-[#5b2c91] text-white' : 'bg-[#e5e7eb] text-[#9ca3af]'
            }`}
            disabled={!selected || saving}
            onClick={handleConfirm}
          >
            {saving ? 'Saving...' : 'Confirm Selection'}
          </button>
          <button type="button" className="text-sm text-[#6b7280]">
            Need Help?
          </button>
          {(loading || error || infoMessage) && (
            <div className={`text-xs ${error ? 'text-red-600' : 'text-green-700'}`}>
              {error || infoMessage || 'Loading session...'}
            </div>
          )}
        </div>
      </div>

    </div>
  );
};

export default SessionCompleted;


