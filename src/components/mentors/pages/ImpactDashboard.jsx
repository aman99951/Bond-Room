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

  const topicChartData = useMemo(() => {
    if (isInitialLoading) {
      return loadingTopicPlaceholders.map((item, index) => ({
        ...item,
        color: ['#5b2c91', '#7b4cbc', '#a27be0'][index % 3],
      }));
    }

    if (!normalizedTopics.length) {
      return [{ label: 'No topics yet', value: 100, count: 0, color: '#d9c8f8' }];
    }

    const sorted = [...normalizedTopics].sort((a, b) => Number(b.count || 0) - Number(a.count || 0));
    const top = sorted.slice(0, 5);
    const remaining = sorted.slice(5);
    const remainingCount = remaining.reduce((acc, item) => acc + Number(item.count || 0), 0);
    const merged = remainingCount > 0 ? [...top, { label: 'Other Topics', count: remainingCount }] : top;
    const totalCount = merged.reduce((acc, item) => acc + Number(item.count || 0), 0) || 1;
    const palette = ['#5b2c91', '#7b4cbc', '#9b7bdc', '#b99ae9', '#d2bbf4', '#e8dcfb'];

    let used = 0;
    return merged.map((item, index) => {
      const isLast = index === merged.length - 1;
      const rawPercent = (Number(item.count || 0) / totalCount) * 100;
      const value = isLast ? Math.max(0, 100 - used) : Math.round(rawPercent);
      used += value;
      return {
        label: item.label || 'Other',
        value,
        count: Number(item.count || 0),
        color: palette[index % palette.length],
      };
    });
  }, [isInitialLoading, loadingTopicPlaceholders, normalizedTopics]);

  const topicTotalCount = useMemo(
    () => topicChartData.reduce((acc, item) => acc + Number(item.count || 0), 0),
    [topicChartData]
  );

  const topicConicGradient = useMemo(() => {
    let cursor = 0;
    const segments = topicChartData.map((item, index) => {
      const remaining = Math.max(0, 100 - cursor);
      const slice = index === topicChartData.length - 1
        ? remaining
        : Math.min(remaining, Math.max(0, Number(item.value || 0)));
      const start = cursor;
      const end = cursor + slice;
      cursor = end;
      return `${item.color} ${start}% ${end}%`;
    });
    if (cursor < 100) {
      segments.push(`#ede5ff ${cursor}% 100%`);
    }
    return `conic-gradient(${segments.join(', ')})`;
  }, [topicChartData]);

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
    <div className="min-h-screen bg-transparent p-4 text-[#111827] sm:p-6 lg:p-8">
      <div className="w-full">
        <div className="relative overflow-hidden rounded-3xl bg-[linear-gradient(120deg,#ffffff_0%,#f8f4ff_55%,#f3ecff_100%)] p-4 shadow-[0_20px_45px_-28px_rgba(93,54,153,0.45)] ring-1 ring-[#e6def8] sm:p-6">
          <div className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-[#d7c2ff]/35 blur-3xl" />
          <div className="pointer-events-none absolute -left-16 -bottom-16 h-36 w-36 rounded-full bg-[#ede5ff]/70 blur-3xl" />
          <div>
            <h2 className="font-sans text-[30px] font-bold leading-[36px] tracking-[0px] align-middle text-[#1f1a32]">Impact Dashboard</h2>
            <p className="mt-1 text-sm text-[#6b5f84]">Track your mentoring outcomes, ratings, and monthly impact.</p>
          </div>
          <button
            type="button"
            className="inline-flex items-center gap-2 self-start rounded-xl border border-[#d9cdf3] bg-white px-3 py-2 text-xs font-medium text-[#4a2b7a] shadow-sm transition-all hover:-translate-y-0.5 hover:border-[#bda7e8] hover:shadow sm:self-auto"
            onClick={handleExport}
          >
            <Download className="h-3.5 w-3.5" aria-hidden="true" />
            Export Report
          </button>
        </div>

        {showTrainingPendingCard && (
          <button
            type="button"
            className="mt-5 w-full rounded-2xl border border-[#d9c8f5] bg-gradient-to-r from-[#f5f0ff] via-[#fbf9ff] to-white p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-[#c9b5e8] hover:shadow-md"
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
            className="group rounded-2xl border border-[#e6e2f1] bg-[linear-gradient(145deg,#ffffff_0%,#f9f6ff_100%)] p-4 text-left shadow-[0_10px_24px_-18px_rgba(93,54,153,0.55)] transition hover:-translate-y-0.5 hover:border-[#c9b5e8] hover:shadow-[0_18px_32px_-20px_rgba(93,54,153,0.6)] cursor-pointer"
            onClick={() => navigate('/mentor-session-records')}
          >
            <p
              className="text-[#333333]"
              style={{ fontSize: '16px', lineHeight: '20px', fontWeight: 500 }}
            >
              Total Sessions
            </p>
            <div className="mt-2 flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#ede9fe] text-[#5b2c91] transition-transform group-hover:scale-105">
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
            className="group rounded-2xl border border-[#e6e2f1] bg-[linear-gradient(145deg,#ffffff_0%,#f8fff9_100%)] p-4 text-left shadow-[0_10px_24px_-18px_rgba(31,128,73,0.45)] transition hover:-translate-y-0.5 hover:border-[#b9e4c9] hover:shadow-[0_18px_32px_-20px_rgba(31,128,73,0.5)] cursor-pointer"
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
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#dcfce7] text-[#16a34a] transition-transform group-hover:scale-105">
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
            className="group rounded-2xl border border-[#e6e2f1] bg-[linear-gradient(145deg,#ffffff_0%,#f5f9ff_100%)] p-4 text-left shadow-[0_10px_24px_-18px_rgba(59,130,246,0.5)] transition hover:-translate-y-0.5 hover:border-[#bdd8ff] hover:shadow-[0_18px_32px_-20px_rgba(59,130,246,0.55)] cursor-pointer"
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
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#dbeafe] text-[#3b82f6] transition-transform group-hover:scale-105">
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
            className="group rounded-2xl border border-[#e6e2f1] bg-[linear-gradient(145deg,#ffffff_0%,#fffbf0_100%)] p-4 text-left shadow-[0_10px_24px_-18px_rgba(245,158,11,0.5)] transition hover:-translate-y-0.5 hover:border-[#f8d89a] hover:shadow-[0_18px_32px_-20px_rgba(245,158,11,0.5)] cursor-pointer"
            onClick={() => setRatingPopupOpen(true)}
          >
            <p
              className="text-[#333333]"
              style={{ fontSize: '16px', lineHeight: '20px', fontWeight: 500 }}
            >
              Avg. Rating
            </p>
            <div className="mt-2 flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#fef3c7] text-[#f59e0b] transition-transform group-hover:scale-105">
                <Star className="h-4 w-4" />
              </span>
              <span className="text-[24px] font-semibold text-[#f59e0b]">{summary.average_rating || 0}</span>
            </div>
            <p className="mt-1 text-[11px] text-[#475467]">Based on {reviewCount} reviews</p>
          </button>
        </div>

        <div className="mt-5 grid gap-4 lg:grid-cols-3">
          <div className="rounded-2xl border border-[#e6def8] bg-[linear-gradient(155deg,#ffffff_0%,#faf6ff_100%)] p-4 shadow-[0_16px_30px_-22px_rgba(93,54,153,0.45)]">
            <h3
              className="text-[#333333]"
              style={{ fontSize: '16px', lineHeight: '20px', fontWeight: 500 }}
            >
              Topics Addressed
            </h3>
            <div className="mt-4 flex h-[calc(100%-28px)] flex-col justify-between gap-4">
              <div className="grid place-items-center">
                <div
                  className="relative flex h-40 w-40 items-center justify-center rounded-full ring-1 ring-[#e4d8fb]"
                  style={{ background: topicConicGradient }}
                >
                  <div className="flex h-28 w-28 flex-col items-center justify-center rounded-full bg-[linear-gradient(145deg,#ffffff,#f7f2ff)] ring-1 ring-[#e6def8]">
                    <span className="text-[20px] font-semibold text-[#5b2c91]">{topicTotalCount}</span>
                    <span className="text-[11px] text-[#6b5f84]">total logs</span>
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                {topicChartData.map((item, index) => (
                  <div key={`${item.label}-${index}`} className="flex items-center justify-between text-[11px] text-[#475467]">
                    <span className="inline-flex min-w-0 items-center gap-2">
                      <span className="h-2.5 w-2.5 flex-shrink-0 rounded-full" style={{ backgroundColor: item.color }} />
                      <span className="truncate">{item.label}</span>
                    </span>
                    <span className="ml-2 whitespace-nowrap">{item.value}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="rounded-2xl bg-[linear-gradient(135deg,#4b2a86_0%,#5f35a7_55%,#7b4cbc_100%)] p-4 text-white shadow-[0_16px_30px_-20px_rgba(75,42,134,0.7)] ring-1 ring-white/15">
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

          <div className="flex flex-col items-center rounded-2xl border border-[#e6def8] bg-[linear-gradient(155deg,#ffffff_0%,#faf6ff_100%)] p-4 shadow-[0_16px_30px_-22px_rgba(93,54,153,0.45)]">
            <h3
              className="text-[#333333] self-start"
              style={{ fontSize: '16px', lineHeight: '20px', fontWeight: 500 }}
            >
              Donation vs Claim Ratio
            </h3>
            <div
              className="mt-6 h-36 w-36 rounded-full flex items-center justify-center"
              style={{ background: `conic-gradient(#8b5cf6 0% ${donationRatio}%, #d6c2ff ${donationRatio}% 100%)` }}
            >
              <div className="h-28 w-28 rounded-full bg-[linear-gradient(145deg,#ffffff,#f7f2ff)] flex items-center justify-center ring-1 ring-[#e6def8]">
                <span className="text-[16px] font-semibold text-[#5b2c91]">{donationRatio}%</span>
              </div>
            </div>
            <div className="mt-4 flex items-center gap-4 text-[11px] text-[#475467]">
              <span className="inline-flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-[#d6c2ff]" />
                Claimed
              </span>
              <span className="inline-flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-[#8b5cf6]" />
                Donated
              </span>
            </div>
            <div className="mt-4 grid w-full grid-cols-2 gap-2 text-[11px]">
              <div className="rounded-lg bg-white px-3 py-2 text-[#5b2c91] ring-1 ring-[#e6def8]">
                Donated: {Number(summary.total_donated || 0)}
              </div>
              <div className="rounded-lg bg-white px-3 py-2 text-[#6b5f84] ring-1 ring-[#e6def8]">
                Claimed: {Number(summary.total_claimed || 0)}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-5 overflow-hidden rounded-2xl border border-[#e6def8] bg-[linear-gradient(160deg,#ffffff_0%,#fcfaff_100%)] shadow-[0_18px_34px_-24px_rgba(93,54,153,0.45)]">
          <div className="flex items-center justify-between border-b border-[#e6def8] bg-[linear-gradient(120deg,#f8f4ff_0%,#f2ebff_100%)] p-4">
            <h3
              className="text-[#3f2b66]"
              style={{ fontSize: '18px', lineHeight: '22px', fontWeight: 600 }}
            >
              Session Ledger
            </h3>
            <span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider text-[#5D3699] ring-1 ring-[#dccff5]">
              Recent Activity
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[12px]">
              <thead className="border-y border-[#e6def8] bg-[#f7f1ff] text-[#5b4d78]">
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
                    ? 'bg-[#fee2e2] text-[#b91c1c]'
                    : statusLabel === 'Donated'
                      ? 'bg-[#ede3ff] text-[#5D3699]'
                      : statusLabel === 'Claimed'
                        ? 'bg-[#e9ddff] text-[#4a2b7a]'
                        : 'bg-[#e2e8f0] text-[#334155]';
                return (
                    <tr key={row.id} className="border-t border-[#f1edf9] text-[#1f2937] transition-colors hover:bg-[#faf6ff]">
                    <td className="px-4 py-3">
                      {row.date ? new Date(row.date).toLocaleDateString() : '—'}
                    </td>
                    <td className="px-4 py-3">{row.mentee}</td>
                    <td className="px-4 py-3">{row.duration}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex rounded-md px-2 py-0.5 text-[11px] font-semibold ${badgeClass}`}>
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
                <tr className="border-t border-[#f1edf9] text-[#1f2937]">
                  <td className="px-4 py-3 text-sm text-[#475467]" colSpan={6}>
                    No ledger entries yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
          <div className="flex items-center justify-between border-t border-[#e6def8] bg-white p-4 text-[12px] text-[#475467]">
            <span className="rounded-lg bg-[#faf6ff] px-2 py-1 text-[12px] text-[#4a2b7a] ring-1 ring-[#e6def8]">
              Showing {ledgerRows.length ? (ledgerPage - 1) * ledgerPageSize + 1 : 0}-
              {Math.min(ledgerPage * ledgerPageSize, ledgerRows.length)} of {ledgerRows.length} sessions
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                className="rounded-md border border-[#e6def8] bg-white px-3 py-1 text-[#4a2b7a] transition-colors hover:bg-[#f8f4ff] disabled:opacity-50"
                onClick={() => setLedgerPage((prev) => Math.max(1, prev - 1))}
                disabled={isInitialLoading || ledgerPage <= 1}
              >
                Previous
              </button>
              <button
                type="button"
                className="rounded-md bg-[#5D3699] px-3 py-1 text-white transition-colors hover:bg-[#4a2b7a] disabled:opacity-50"
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
