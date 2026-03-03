import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Download, Star, Video, Leaf, Clock } from 'lucide-react';
import { mentorApi } from '../../../apis/api/mentorApi';
import { useMentorData } from '../../../apis/apihook/useMentorData';
import { getAuthSession } from '../../../apis/api/storage';

const ImpactDashboard = () => {
  const navigate = useNavigate();
  const { mentor } = useMentorData();
  const [dashboard, setDashboard] = useState(null);
  const [onboardingStatus, setOnboardingStatus] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [feedbackList, setFeedbackList] = useState([]);
  const [payoutTransactions, setPayoutTransactions] = useState([]);
  const [ledgerPage, setLedgerPage] = useState(1);
  const [donatedPopupOpen, setDonatedPopupOpen] = useState(false);
  const [sessionsPopupOpen, setSessionsPopupOpen] = useState(false);
  const [claimedPopupOpen, setClaimedPopupOpen] = useState(false);
  const [ratingPopupOpen, setRatingPopupOpen] = useState(false);
  const [markPaidLoadingId, setMarkPaidLoadingId] = useState(null);
  const [claimedPopupMessage, setClaimedPopupMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const ledgerPageSize = 5;
  const sessionRole = getAuthSession()?.role || '';
  const canMarkPaid = sessionRole === 'mentor' || sessionRole === 'admin';

  const loadDashboard = useCallback(async (isMountedRef) => {
    if (!mentor?.id) {
      if (isMountedRef?.current) setDashboard(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError('');
    try {
      const [dashboardResponse, sessionResponse, feedbackResponse, payoutResponse, onboardingResponse] = await Promise.all([
        mentorApi.getMentorImpactDashboard(mentor.id),
        mentorApi.listSessions({ mentor_id: mentor.id }),
        mentorApi.listSessionFeedback({ mentor_id: mentor.id }),
        mentorApi.listPayoutTransactions({ mentor_id: mentor.id }),
        mentorApi.getMentorOnboarding(mentor.id),
      ]);
      if (isMountedRef?.current) {
        setDashboard(dashboardResponse || null);
        setOnboardingStatus(onboardingResponse?.status || null);
        setSessions(Array.isArray(sessionResponse) ? sessionResponse : sessionResponse?.results || []);
        setFeedbackList(Array.isArray(feedbackResponse) ? feedbackResponse : feedbackResponse?.results || []);
        setPayoutTransactions(Array.isArray(payoutResponse) ? payoutResponse : payoutResponse?.results || []);
      }
    } catch (err) {
      if (isMountedRef?.current) setError(err?.message || 'Unable to load impact dashboard.');
    } finally {
      if (isMountedRef?.current) setLoading(false);
    }
  }, [mentor?.id]);

  useEffect(() => {
    const isMountedRef = { current: true };
    loadDashboard(isMountedRef);
    return () => {
      isMountedRef.current = false;
    };
  }, [loadDashboard]);

  const summary = dashboard?.summary || {};
  const trainingStatus = String(onboardingStatus?.training_status || '').toLowerCase();
  const showTrainingPendingCard = Boolean(trainingStatus) && trainingStatus !== 'completed';
  const topicStats = useMemo(
    () => (Array.isArray(dashboard?.topic_stats) ? dashboard.topic_stats : []),
    [dashboard?.topic_stats]
  );
  const ledger = useMemo(
    () => (Array.isArray(dashboard?.ledger) ? dashboard.ledger : []),
    [dashboard?.ledger]
  );
  const reviewCount = feedbackList.length;
  const isInitialLoading = loading && !dashboard;

  const sessionMap = useMemo(() => {
    return sessions.reduce((acc, session) => {
      acc[String(session.id)] = session;
      return acc;
    }, {});
  }, [sessions]);

  const feedbackMap = useMemo(() => {
    return feedbackList.reduce((acc, feedback) => {
      acc[String(feedback.session)] = feedback;
      return acc;
    }, {});
  }, [feedbackList]);

  const ledgerRows = useMemo(() => {
    return ledger.map((entry) => {
      const session = sessionMap[String(entry.session)] || null;
      const feedback = feedbackMap[String(entry.session)] || null;
      return {
        id: entry.id,
        sessionId: entry.session,
        date: entry.decided_at || entry.updated_at || '',
        mentee:
          session?.mentee_name ||
          [session?.mentee_first_name, session?.mentee_last_name].filter(Boolean).join(' ') ||
          (session?.mentee ? `Mentee #${session.mentee}` : `Session #${entry.session}`),
        duration: session?.duration_minutes ? `${session.duration_minutes} min` : '—',
        status: entry.action || entry.status,
        rating: feedback?.rating ? Number(feedback.rating) : 0,
        notes: entry.note || '',
      };
    });
  }, [ledger, feedbackMap, sessionMap]);

  const donatedRows = useMemo(
    () => ledgerRows.filter((row) => String(row.status || '').toLowerCase() === 'donate'),
    [ledgerRows]
  );
  const claimedPayoutRows = useMemo(
    () =>
      payoutTransactions
        .filter((row) => String(row.transaction_type || '').toLowerCase() === 'session_claim')
        .map((item) => {
          const session = sessionMap[String(item.session)] || null;
          return {
            id: item.id,
            sessionId: item.session,
            amount: Number(item.amount || 0),
            status: String(item.status || 'pending').toLowerCase(),
            menteeName:
              session?.mentee_name ||
              [session?.mentee_first_name, session?.mentee_last_name].filter(Boolean).join(' ') ||
              (session?.mentee ? `Mentee #${session.mentee}` : `Session #${item.session || item.id}`),
          };
        }),
    [payoutTransactions, sessionMap]
  );

  const totalLedgerPages = useMemo(
    () => Math.max(1, Math.ceil(ledgerRows.length / ledgerPageSize)),
    [ledgerRows.length, ledgerPageSize]
  );

  const paginatedLedgerRows = useMemo(() => {
    const startIndex = (ledgerPage - 1) * ledgerPageSize;
    return ledgerRows.slice(startIndex, startIndex + ledgerPageSize);
  }, [ledgerPage, ledgerPageSize, ledgerRows]);

  useEffect(() => {
    setLedgerPage(1);
  }, [ledgerRows.length]);

  const getStatusLabel = (status) => {
    if (status === 'claim') return 'Claimed';
    if (status === 'donate') return 'Donated';
    if (status === 'report') return 'Reported';
    return status || 'Pending';
  };

  const getPayoutStatusLabel = (status) => {
    const normalized = String(status || '').toLowerCase();
    if (!normalized) return 'Pending';
    return normalized.charAt(0).toUpperCase() + normalized.slice(1);
  };

  const handleMarkPaid = async (payoutId) => {
    setClaimedPopupMessage('');
    setMarkPaidLoadingId(payoutId);
    try {
      await mentorApi.markPayoutTransactionPaid(payoutId, {});
      setClaimedPopupMessage('Payout marked as paid successfully.');
      await loadDashboard({ current: true });
    } catch (err) {
      setClaimedPopupMessage(err?.message || 'Unable to mark payout as paid right now.');
    } finally {
      setMarkPaidLoadingId(null);
    }
  };

  const handleExport = () => {
    if (!ledgerRows.length) {
      setError('No ledger entries to export.');
      return;
    }
    setError('');
    const headers = ['Date', 'Mentee', 'Duration', 'Status', 'Rating', 'Notes'];
    const lines = ledgerRows.map((row) => {
      const dateLabel = row.date ? new Date(row.date).toLocaleDateString() : '-';
      const statusLabel = getStatusLabel(row.status);
      const values = [
        dateLabel,
        row.mentee,
        row.duration,
        statusLabel,
        row.rating || 0,
        row.notes || '',
      ];
      return values
        .map((value) => {
          const text = String(value ?? '');
          if (text.includes('"') || text.includes(',') || text.includes('\n')) {
            return `"${text.replace(/"/g, '""')}"`;
          }
          return text;
        })
        .join(',');
    });
    const csv = [headers.join(','), ...lines].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `session-ledger-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const donationRatio = useMemo(() => {
    const donated = Number(summary.total_donated || 0);
    const claimed = Number(summary.total_claimed || 0);
    const total = donated + claimed;
    if (!total) return 0;
    return Math.round((donated / total) * 100);
  }, [summary.total_claimed, summary.total_donated]);

  const normalizedTopics = useMemo(() => {
    if (!topicStats.length) return [];
    const total = topicStats.reduce((acc, item) => acc + Number(item.count || 0), 0) || 1;
    return topicStats.map((item) => {
      const labelValue = Array.isArray(item.topics_discussed)
        ? item.topics_discussed.join(', ')
        : item.topics_discussed || 'Other';
      const count = Number(item.count || 0);
      return {
        label: labelValue || 'Other',
        value: Math.round((count / total) * 100),
        count,
      };
    });
  }, [topicStats]);

  const loadingTopicPlaceholders = useMemo(
    () => [
      { label: 'Loading topic data...', value: 70, count: 0 },
      { label: 'Loading topic data...', value: 45, count: 0 },
      { label: 'Loading topic data...', value: 25, count: 0 },
    ],
    []
  );

  const monthlySeries = useMemo(() => {
    const now = new Date();
    const months = [];
    for (let i = 5; i >= 0; i -= 1) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      months.push({
        key,
        label: date.toLocaleDateString([], { month: 'short' }),
        value: 0,
        count: 0,
      });
    }
    const indexByKey = months.reduce((acc, item, idx) => {
      acc[item.key] = idx;
      return acc;
    }, {});
    sessions.forEach((session) => {
      if (session.status && session.status !== 'completed') return;
      const when = new Date(session.scheduled_start);
      if (Number.isNaN(when.getTime())) return;
      const key = `${when.getFullYear()}-${String(when.getMonth() + 1).padStart(2, '0')}`;
      const idx = indexByKey[key];
      if (idx === undefined) return;
      const hours = Number(session.duration_minutes || 0) / 60;
      months[idx].value += hours;
      months[idx].count += 1;
    });
    return months.map((item) => ({
      ...item,
      value: Math.round(item.value * 10) / 10,
    }));
  }, [sessions]);

  const sessionChangeLabel = useMemo(() => {
    if (monthlySeries.length < 2) return 'No prior month data';
    const current = monthlySeries[monthlySeries.length - 1]?.count || 0;
    const previous = monthlySeries[monthlySeries.length - 2]?.count || 0;
    if (!previous) return current ? 'New this month' : 'No prior month data';
    const delta = Math.round(((current - previous) / previous) * 100);
    const direction = delta >= 0 ? 'up' : 'down';
    return `${Math.abs(delta)}% ${direction} from last month`;
  }, [monthlySeries]);

  const maxMonthlyValue = useMemo(
    () => Math.max(1, ...monthlySeries.map((item) => item.value)),
    [monthlySeries]
  );

  const tableRows = isInitialLoading
    ? Array.from({ length: ledgerPageSize }).map((_, index) => ({
      id: `loading-${index + 1}`,
      date: '',
      mentee: 'Loading...',
      duration: '--',
      status: 'pending',
      rating: 0,
      notes: 'Loading...',
    }))
    : paginatedLedgerRows;

  const topicRows = isInitialLoading
    ? loadingTopicPlaceholders
      : normalizedTopics.length
      ? normalizedTopics
      : [{ label: 'No data', value: 0, count: 0 }];

  const sessionDetailRows = useMemo(
    () =>
      sessions.map((item) => ({
        id: item.id,
        menteeName:
          item.mentee_name ||
          [item.mentee_first_name, item.mentee_last_name].filter(Boolean).join(' ') ||
          (item.mentee ? `Mentee #${item.mentee}` : `Session #${item.id}`),
        status: item.status || 'pending',
        duration: item.duration_minutes ? `${item.duration_minutes} min` : '—',
      })),
    [sessions]
  );
  const ratingDetailRows = useMemo(
    () =>
      feedbackList.map((item, index) => {
        const session = sessionMap[String(item.session)] || null;
        return {
          id: item.id || `${item.session || 'session'}-${index + 1}`,
          sessionId: item.session || session?.id || '-',
          menteeName:
            session?.mentee_name ||
            [session?.mentee_first_name, session?.mentee_last_name].filter(Boolean).join(' ') ||
            (session?.mentee ? `Mentee #${session.mentee}` : `Session #${item.session || item.id || index + 1}`),
          rating: Number(item.rating || 0),
        };
      }),
    [feedbackList, sessionMap]
  );

  return (
    <div className="min-h-screen bg-transparent text-[#111827] p-6 sm:p-8 rounded-2xl">
      <div className="max-w-full mx-auto">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-sans font-bold text-[30px] leading-[36px] tracking-[0px] align-middle text-[#333333]">Impact Dashboard</h2>
          </div>
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-md border border-white/20 bg-white px-3 py-2 text-xs text-[#1f2937] self-start sm:self-auto"
            onClick={handleExport}
          >
            <Download className="h-3.5 w-3.5" aria-hidden="true" />
            Export Report
          </button>
        </div>

        {showTrainingPendingCard && (
          <button
            type="button"
            className="mt-5 w-full rounded-xl border border-[#d9c8f5] bg-gradient-to-r from-[#f5f0ff] to-white p-4 text-left hover:border-[#c9b5e8] transition"
            onClick={() => navigate('/mentor-training-modules')}
          >
            <p className="text-xs uppercase tracking-[0.08em] text-[#7c3aed]">Optional</p>
            <p className="mt-1 text-base font-semibold text-[#5b2c91]">Training Module Pending</p>
            <p className="mt-1 text-xs text-[#475467]">
              You can continue mentoring now. Click here anytime to complete training modules.
            </p>
          </button>
        )}

        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <button
            type="button"
            className="rounded-xl border border-[#e6e2f1] bg-white p-4 shadow-sm text-left hover:border-[#c9b5e8] transition cursor-pointer"
            onClick={() => navigate('/mentor-session-records')}
          >
            <p
              className="text-[#333333]"
              style={{ fontSize: '16px', lineHeight: '20px', fontWeight: 500 }}
            >
              Total Sessions
            </p>
            <div className="mt-2 flex items-center gap-2">
              <span className="h-8 w-8 rounded-full bg-[#ede9fe] text-[#5b2c91] flex items-center justify-center">
                <Video className="h-4 w-4" />
              </span>
              <span className="text-[24px] font-semibold text-[#5b2c91]">
                {isInitialLoading ? '--' : summary.total_sessions || 0}
              </span>
            </div>
            <p className="mt-1 text-[11px] text-[#475467]">
              {isInitialLoading ? 'Loading metrics...' : sessionChangeLabel}
            </p>
          </button>
          <button
            type="button"
            className="rounded-xl border border-[#e6e2f1] bg-white p-4 shadow-sm text-left hover:border-[#c9b5e8] transition cursor-pointer"
            onClick={() => setDonatedPopupOpen(true)}
          >
            <div className="flex items-center justify-between">
              <p
                className="text-[#333333]"
                style={{ fontSize: '16px', lineHeight: '20px', fontWeight: 500 }}
              >
                Total Complementary Service
              </p>
            </div>
            <div className="mt-2 flex items-center gap-2">
              <span className="h-8 w-8 rounded-full bg-[#dcfce7] text-[#16a34a] flex items-center justify-center">
                <Leaf className="h-4 w-4" />
              </span>
              <span className="text-[24px] font-semibold text-[#16a34a]">
                {isInitialLoading ? '--' : donatedRows.length}
              </span>
            </div>
            <p className="mt-1 text-[11px] text-[#475467]">Total complementary sessions</p>
          </button>
          <button
            type="button"
            className="rounded-xl border border-[#e6e2f1] bg-white p-4 shadow-sm text-left hover:border-[#c9b5e8] transition cursor-pointer"
            onClick={() => {
              setClaimedPopupMessage('');
              setClaimedPopupOpen(true);
            }}
          >
            <p
              className="text-[#333333]"
              style={{ fontSize: '16px', lineHeight: '20px', fontWeight: 500 }}
            >
              Total Claimed
            </p>
            <div className="mt-2 flex items-center gap-2">
              <span className="h-8 w-8 rounded-full bg-[#dbeafe] text-[#3b82f6] flex items-center justify-center">
                <Clock className="h-4 w-4" />
              </span>
              <span className="text-[24px] font-semibold text-[#3b82f6]">
                ₹{summary.total_claimed || 0}
              </span>
            </div>
            <p className="mt-1 text-[11px] text-[#475467]">Pending payout: ₹{summary.pending_payout || 0}</p>
          </button>
          <button
            type="button"
            className="rounded-xl border border-[#e6e2f1] bg-white p-4 shadow-sm text-left hover:border-[#c9b5e8] transition cursor-pointer"
            onClick={() => setRatingPopupOpen(true)}
          >
            <p
              className="text-[#333333]"
              style={{ fontSize: '16px', lineHeight: '20px', fontWeight: 500 }}
            >
              Avg. Rating
            </p>
            <div className="mt-2 flex items-center gap-2">
              <span className="h-8 w-8 rounded-full bg-[#fef3c7] text-[#f59e0b] flex items-center justify-center">
                <Star className="h-4 w-4" />
              </span>
              <span className="text-[24px] font-semibold text-[#f59e0b]">{summary.average_rating || 0}</span>
            </div>
            <p className="mt-1 text-[11px] text-[#475467]">Based on {reviewCount} reviews</p>
          </button>
        </div>

        <div className="mt-5 grid gap-4 lg:grid-cols-3">
          <div className="rounded-xl border border-white/15 bg-white p-4 shadow-[0_8px_20px_rgba(0,0,0,0.2)]">
            <h3
              className="text-[#333333]"
              style={{ fontSize: '16px', lineHeight: '20px', fontWeight: 500 }}
            >
              Topics Addressed
            </h3>
            <div className="mt-4 space-y-3">
              {topicRows.map((item, index) => (
                <div key={`${item.label}-${index}`}>
                  <div className="flex items-center justify-between text-[11px] text-[#475467]">
                    <span>{item.label}</span>
                    <span>{item.value}%</span>
                  </div>
                  <div className="mt-2 h-2 w-full rounded-full bg-[#ede9fe]">
                    <div className="h-2 rounded-full bg-[#5b2c91]" style={{ width: `${Math.min(item.value, 100)}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl bg-[#4b2a86] p-4 shadow-[0_8px_20px_rgba(0,0,0,0.3)] text-white">
            <h3
              className="text-white"
              style={{ fontSize: '16px', lineHeight: '20px', fontWeight: 500 }}
            >
              Monthly Contribution
            </h3>
            <div className="mt-6 grid grid-cols-6 gap-2 items-end h-36">
              {monthlySeries.map((item) => (
                <div key={item.key} className="flex flex-col items-center gap-2">
                  <div
                    className={`w-full rounded-md ${item.value === maxMonthlyValue ? 'bg-[#fdd253]' : 'bg-white/20'}`}
                    style={{ height: `${Math.max(10, (item.value / maxMonthlyValue) * 100)}px` }}
                  />
                  <span className="text-[10px] text-white/70">{item.label}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-[#e6e2f1] bg-white p-4 shadow-sm flex flex-col items-center">
            <h3
              className="text-[#333333] self-start"
              style={{ fontSize: '16px', lineHeight: '20px', fontWeight: 500 }}
            >
              Donation vs Claim Ratio
            </h3>
            <div
              className="mt-6 h-36 w-36 rounded-full flex items-center justify-center"
              style={{ background: `conic-gradient(#22c55e 0% ${donationRatio}%, #3b82f6 ${donationRatio}% 100%)` }}
            >
              <div className="h-28 w-28 rounded-full bg-white flex items-center justify-center">
                <span className="text-[16px] font-semibold text-[#333333]">{donationRatio}%</span>
              </div>
            </div>
            <div className="mt-4 flex items-center gap-4 text-[11px] text-[#475467]">
              <span className="inline-flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-[#3b82f6]" />
                Claimed
              </span>
              <span className="inline-flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-[#22c55e]" />
                Donated
              </span>
            </div>
          </div>
        </div>

        <div className="mt-5 rounded-xl border border-white/15 bg-white shadow-[0_8px_20px_rgba(0,0,0,0.2)]">
            <div className="p-4">
            <h3
              className="text-[#333333]"
              style={{ fontSize: '16px', lineHeight: '20px', fontWeight: 500 }}
            >
              Session Ledger
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[11px]">
              <thead className="text-[#475467] border-t border-[#e6e2f1]">
              <tr>
                <th className="px-4 py-3 font-medium">Date</th>
                <th className="px-4 py-3 font-medium">Mentee</th>
                <th className="px-4 py-3 font-medium">Duration</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Rating</th>
                <th className="px-4 py-3 font-medium">Notes</th>
              </tr>
            </thead>
            <tbody>
              {tableRows.map((row) => {
                const statusLabel = getStatusLabel(row.status);
                const badgeClass =
                  statusLabel === 'Reported'
                    ? 'bg-[#dbeafe] text-[#2563eb]'
                    : statusLabel === 'Donated'
                      ? 'bg-[#22c55e] text-white'
                      : 'bg-[#f59e0b] text-white';
                return (
                    <tr key={row.id} className="border-t border-[#f1f5f9] text-[#1f2937]">
                    <td className="px-4 py-3">
                      {row.date ? new Date(row.date).toLocaleDateString() : '—'}
                    </td>
                    <td className="px-4 py-3">{row.mentee}</td>
                    <td className="px-4 py-3">{row.duration}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex rounded-md px-2 py-0.5 text-[10px] ${badgeClass}`}>
                        {statusLabel}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-0.5">
                        {Array.from({ length: 5 }).map((_, idx) => (
                          <Star
                            key={idx}
                            className={`h-3 w-3 ${idx < row.rating ? 'text-[#fbbf24]' : 'text-[#e5e7eb]'}`}
                            fill={idx < row.rating ? 'currentColor' : 'none'}
                          />
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-[#475467]">{row.notes || '—'}</td>
                  </tr>
                );
              })}
              {!tableRows.length && (
                <tr className="border-t border-[#f1f5f9] text-[#1f2937]">
                  <td className="px-4 py-3 text-xs text-[#475467]" colSpan={6}>
                    No ledger entries yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
          <div className="flex items-center justify-between p-4 text-[11px] text-[#475467] border-t border-[#e6e2f1]">
            <span>
              Showing {ledgerRows.length ? (ledgerPage - 1) * ledgerPageSize + 1 : 0}-
              {Math.min(ledgerPage * ledgerPageSize, ledgerRows.length)} of {ledgerRows.length} sessions
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                className="rounded-md border border-[#e6e2f1] px-3 py-1 disabled:opacity-50"
                onClick={() => setLedgerPage((prev) => Math.max(1, prev - 1))}
                disabled={isInitialLoading || ledgerPage <= 1}
              >
                Previous
              </button>
              <button
                type="button"
                className="rounded-md bg-[#5b2c91] text-white px-3 py-1 disabled:opacity-50"
                onClick={() => setLedgerPage((prev) => Math.min(totalLedgerPages, prev + 1))}
                disabled={isInitialLoading || ledgerPage >= totalLedgerPages}
              >
                Next
              </button>
            </div>
          </div>
        </div>
        {(loading || error) && (
          <div className={`mt-3 text-xs ${error ? 'text-red-600' : 'text-[#475467]'}`}>
            {error || 'Loading impact dashboard...'}
          </div>
        )}
      </div>

      {donatedPopupOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center px-4">
          <div className="w-full max-w-lg rounded-2xl border border-[#e6e2f1] bg-white p-5 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold text-[#111827]">Total Complementary Sessions</h3>
              <button
                type="button"
                className="text-xs text-[#5b2c91] underline"
                onClick={() => setDonatedPopupOpen(false)}
              >
                Close
              </button>
            </div>
            <div className="mt-4 rounded-xl border border-[#e5e7eb] overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#f8fafc] text-[#475467]">
                  <tr>
                    <th className="px-3 py-2 font-medium">Mentee Name</th>
                    <th className="px-3 py-2 font-medium">Session ID</th>
                  </tr>
                </thead>
                <tbody>
                  {donatedRows.length > 0 ? (
                    donatedRows.map((row) => (
                        <tr key={`donated-${row.id}`} className="border-t border-[#f1f5f9] text-[#1f2937]">
                        <td className="px-3 py-2">{row.mentee}</td>
                        <td className="px-3 py-2">#{row.sessionId}</td>
                      </tr>
                    ))
                  ) : (
                    <tr className="border-t border-[#f1f5f9] text-[#475467]">
                      <td className="px-3 py-3" colSpan={2}>
                        No donated sessions yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {sessionsPopupOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center px-4">
          <div className="w-full max-w-lg rounded-2xl border border-[#e6e2f1] bg-white p-5 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold text-[#111827]">Total Sessions</h3>
              <button
                type="button"
                className="text-xs text-[#5b2c91] underline"
                onClick={() => setSessionsPopupOpen(false)}
              >
                Close
              </button>
            </div>
            <div className="mt-4 rounded-xl border border-[#e5e7eb] overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#f8fafc] text-[#475467]">
                  <tr>
                    <th className="px-3 py-2 font-medium">Mentee Name</th>
                    <th className="px-3 py-2 font-medium">Session ID</th>
                    <th className="px-3 py-2 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {sessionDetailRows.length > 0 ? (
                    sessionDetailRows.map((row) => (
                    <tr key={`session-${row.id}`} className="border-t border-[#f1f5f9] text-[#1f2937]">
                        <td className="px-3 py-2">{row.menteeName}</td>
                        <td className="px-3 py-2">#{row.id}</td>
                        <td className="px-3 py-2">{getStatusLabel(row.status)}</td>
                      </tr>
                    ))
                  ) : (
                    <tr className="border-t border-[#f1f5f9] text-[#475467]">
                      <td className="px-3 py-3" colSpan={3}>
                        No sessions yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {claimedPopupOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center px-4">
          <div className="w-full max-w-3xl rounded-2xl border border-[#e6e2f1] bg-white p-5 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold text-[#111827]">Total Claimed</h3>
              <button
                type="button"
                className="text-xs text-[#5b2c91] underline"
                onClick={() => {
                  setClaimedPopupMessage('');
                  setClaimedPopupOpen(false);
                }}
              >
                Close
              </button>
            </div>
            {claimedPopupMessage && (
              <p className="mt-3 rounded-lg bg-[#f8fafc] px-3 py-2 text-xs text-[#0f172a] border border-[#e2e8f0]">
                {claimedPopupMessage}
              </p>
            )}
            <div className="mt-4 rounded-xl border border-[#e5e7eb] overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#f8fafc] text-[#475467]">
                  <tr>
                    <th className="px-3 py-2 font-medium">Mentee Name</th>
                    <th className="px-3 py-2 font-medium">Session ID</th>
                    <th className="px-3 py-2 font-medium">Amount</th>
                    <th className="px-3 py-2 font-medium">Status</th>
                    <th className="px-3 py-2 font-medium">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {claimedPayoutRows.length > 0 ? (
                    claimedPayoutRows.map((row) => (
                    <tr key={`claimed-${row.id}`} className="border-t border-[#f1f5f9] text-[#1f2937]">
                        <td className="px-3 py-2">{row.menteeName}</td>
                        <td className="px-3 py-2">#{row.sessionId}</td>
                        <td className="px-3 py-2">₹{row.amount}</td>
                        <td className="px-3 py-2">{getPayoutStatusLabel(row.status)}</td>
                        <td className="px-3 py-2">
                          {canMarkPaid && row.status !== 'paid' ? (
                            <button
                              type="button"
                              className="rounded-md bg-[#5b2c91] px-2.5 py-1 text-[11px] text-white disabled:opacity-60"
                              disabled={markPaidLoadingId === row.id}
                              onClick={() => handleMarkPaid(row.id)}
                            >
                              {markPaidLoadingId === row.id ? 'Processing...' : 'Mark Paid'}
                            </button>
                          ) : (
                            <span className="text-[11px] text-[#475467]">-</span>
                          )}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr className="border-t border-[#f1f5f9] text-[#475467]">
                      <td className="px-3 py-3" colSpan={5}>
                        No claimed sessions yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {ratingPopupOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center px-4">
          <div className="w-full max-w-lg rounded-2xl border border-[#e6e2f1] bg-white p-5 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold text-[#111827]">Avg. Rating</h3>
              <button
                type="button"
                className="text-xs text-[#5b2c91] underline"
                onClick={() => setRatingPopupOpen(false)}
              >
                Close
              </button>
            </div>
            <div className="mt-4 rounded-xl border border-[#e5e7eb] overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#f8fafc] text-[#475467]">
                  <tr>
                    <th className="px-3 py-2 font-medium">Mentee Name</th>
                    <th className="px-3 py-2 font-medium">Session ID</th>
                    <th className="px-3 py-2 font-medium">Rating</th>
                  </tr>
                </thead>
                <tbody>
                  {ratingDetailRows.length > 0 ? (
                    ratingDetailRows.map((row) => (
                    <tr key={`rating-${row.id}`} className="border-t border-[#f1f5f9] text-[#1f2937]">
                        <td className="px-3 py-2">{row.menteeName}</td>
                        <td className="px-3 py-2">#{row.sessionId}</td>
                        <td className="px-3 py-2">{row.rating}</td>
                      </tr>
                    ))
                  ) : (
                    <tr className="border-t border-[#f1f5f9] text-[#475467]">
                      <td className="px-3 py-3" colSpan={3}>
                        No ratings yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ImpactDashboard;
