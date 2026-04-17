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
        duration: session?.duration_minutes ? `${session.duration_minutes} min` : '-',
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
        color: ['var(--theme-v-accent)', 'var(--theme-v-highlight-mid)', 'var(--theme-v-nav-hover-text)'][index % 3],
      }));
    }

    if (!normalizedTopics.length) {
      return [{ label: 'No topics yet', value: 100, count: 0, color: 'var(--theme-v-surface-overlay-track)' }];
    }

    const sorted = [...normalizedTopics].sort((a, b) => Number(b.count || 0) - Number(a.count || 0));
    const top = sorted.slice(0, 5);
    const remaining = sorted.slice(5);
    const remainingCount = remaining.reduce((acc, item) => acc + Number(item.count || 0), 0);
    const merged = remainingCount > 0 ? [...top, { label: 'Other Topics', count: remainingCount }] : top;
    const totalCount = merged.reduce((acc, item) => acc + Number(item.count || 0), 0) || 1;
    const palette = [
      'var(--theme-v-accent)',
      'var(--theme-v-highlight-mid)',
      'var(--theme-v-nav-hover-text)',
      'var(--theme-v-text-label)',
      'var(--theme-v-text-muted-soft)',
      'var(--theme-v-nav-text)',
    ];

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
      segments.push(`var(--theme-v-surface-overlay-track) ${cursor}% 100%`);
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
        duration: item.duration_minutes ? `${item.duration_minutes} min` : '-',
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
    <div className="min-h-screen bg-transparent p-4 text-[color:var(--theme-v-text-primary)] sm:p-6 lg:p-8">
      <div className="w-full">
        <div className="relative overflow-hidden rounded-3xl border border-[color:var(--theme-v-border-strong)] bg-[linear-gradient(135deg,var(--theme-v-bg-mid)_0%,var(--theme-v-bg-start)_50%,var(--theme-v-bg-end)_100%)] p-4 shadow-[0_20px_45px_-28px_var(--theme-v-shell-shadow)] ring-1 ring-[color:var(--theme-v-hero-ring)] sm:p-6">
          <div className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-[color:var(--theme-v-orb-gold)] blur-3xl" />
          <div className="pointer-events-none absolute -left-16 -bottom-16 h-36 w-36 rounded-full bg-[color:var(--theme-v-orb-light)] blur-3xl" />
          <div>
            <h2 className="font-sans text-[30px] font-bold leading-[36px] tracking-[0px] align-middle text-[color:var(--theme-v-text-primary)]">Impact Dashboard</h2>
            <p className="mt-1 text-sm text-[color:var(--theme-v-text-secondary)]">Track your mentoring outcomes, ratings, and monthly impact.</p>
          </div>
          <button
            type="button"
            className="inline-flex items-center gap-2 self-start rounded-xl border border-[color:var(--theme-v-hero-border)] bg-[color:var(--theme-v-nav-hover-bg)] px-3 py-2 text-xs font-medium text-[color:var(--theme-v-accent)] shadow-sm transition-all hover:-translate-y-0.5 hover:border-[color:var(--theme-v-accent)] hover:shadow sm:self-auto"
            onClick={handleExport}
          >
            <Download className="h-3.5 w-3.5" aria-hidden="true" />
            Export Report
          </button>
        </div>

        {showTrainingPendingCard && (
          <button
            type="button"
            className="mt-5 w-full rounded-2xl border border-[color:var(--theme-v-border-medium)] bg-[color:var(--theme-v-surface-overlay)] p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-[color:var(--theme-v-accent)] hover:shadow-md"
            onClick={() => navigate('/mentor-training-modules')}
          >
            <p className="text-xs uppercase tracking-[0.08em] text-[color:var(--theme-v-accent)]">Optional</p>
            <p className="mt-1 text-base font-semibold text-[color:var(--theme-v-accent)]">Training Module Pending</p>
            <p className="mt-1 text-xs text-[color:var(--theme-v-text-secondary)]">
              You can continue mentoring now. Click here anytime to complete training modules.
            </p>
          </button>
        )}

        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <button
            type="button"
            className="group rounded-2xl border border-[color:var(--theme-v-border-medium)] bg-[color:var(--theme-v-surface-overlay)] p-4 text-left shadow-[0_10px_24px_-18px_var(--theme-v-shell-shadow)] transition hover:-translate-y-0.5 hover:border-[color:var(--theme-v-accent)] hover:shadow-[0_18px_32px_-20px_var(--theme-v-shell-shadow)] cursor-pointer"
            onClick={() => navigate('/mentor-session-records')}
          >
            <p
              className="text-[color:var(--theme-v-text-primary)]"
              style={{ fontSize: '16px', lineHeight: '20px', fontWeight: 500 }}
            >
              Total Sessions
            </p>
            <div className="mt-2 flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[color:var(--theme-v-surface-overlay-strong)] text-[color:var(--theme-v-accent)] transition-transform group-hover:scale-105">
                <Video className="h-4 w-4" />
              </span>
              <span className="text-[24px] font-semibold text-[color:var(--theme-v-accent)]">
                {isInitialLoading ? '--' : summary.total_sessions || 0}
              </span>
            </div>
            <p className="mt-1 text-[11px] text-[color:var(--theme-v-text-secondary)]">
              {isInitialLoading ? 'Loading metrics...' : sessionChangeLabel}
            </p>
          </button>
          <button
            type="button"
            className="group rounded-2xl border border-[color:var(--theme-v-border-medium)] bg-[color:var(--theme-v-surface-overlay)] p-4 text-left shadow-[0_10px_24px_-18px_var(--theme-v-shell-shadow)] transition hover:-translate-y-0.5 hover:border-[color:var(--theme-v-accent)] hover:shadow-[0_18px_32px_-20px_var(--theme-v-shell-shadow)] cursor-pointer"
            onClick={() => setDonatedPopupOpen(true)}
          >
            <div className="flex items-center justify-between">
              <p
                className="text-[color:var(--theme-v-text-primary)]"
                style={{ fontSize: '16px', lineHeight: '20px', fontWeight: 500 }}
              >
                Total Complementary Service
              </p>
            </div>
            <div className="mt-2 flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[color:var(--theme-v-surface-overlay-strong)] text-[color:var(--theme-v-accent)] transition-transform group-hover:scale-105">
                <Leaf className="h-4 w-4" />
              </span>
              <span className="text-[24px] font-semibold text-[color:var(--theme-v-accent)]">
                {isInitialLoading ? '--' : donatedRows.length}
              </span>
            </div>
            <p className="mt-1 text-[11px] text-[color:var(--theme-v-text-secondary)]">Total complementary sessions</p>
          </button>
          <button
            type="button"
            className="group rounded-2xl border border-[color:var(--theme-v-border-medium)] bg-[color:var(--theme-v-surface-overlay)] p-4 text-left shadow-[0_10px_24px_-18px_var(--theme-v-shell-shadow)] transition hover:-translate-y-0.5 hover:border-[color:var(--theme-v-accent)] hover:shadow-[0_18px_32px_-20px_var(--theme-v-shell-shadow)] cursor-pointer"
            onClick={() => {
              setClaimedPopupMessage('');
              setClaimedPopupOpen(true);
            }}
          >
            <p
              className="text-[color:var(--theme-v-text-primary)]"
              style={{ fontSize: '16px', lineHeight: '20px', fontWeight: 500 }}
            >
              Total Claimed
            </p>
            <div className="mt-2 flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[color:var(--theme-v-surface-overlay-strong)] text-[color:var(--theme-v-accent)] transition-transform group-hover:scale-105">
                <Clock className="h-4 w-4" />
              </span>
              <span className="text-[24px] font-semibold text-[color:var(--theme-v-accent)]">
                Rs {summary.total_claimed || 0}
              </span>
            </div>
            <p className="mt-1 text-[11px] text-[color:var(--theme-v-text-secondary)]">Pending payout: Rs {summary.pending_payout || 0}</p>
          </button>
          <button
            type="button"
            className="group rounded-2xl border border-[color:var(--theme-v-border-medium)] bg-[color:var(--theme-v-surface-overlay)] p-4 text-left shadow-[0_10px_24px_-18px_var(--theme-v-shell-shadow)] transition hover:-translate-y-0.5 hover:border-[color:var(--theme-v-accent)] hover:shadow-[0_18px_32px_-20px_var(--theme-v-shell-shadow)] cursor-pointer"
            onClick={() => setRatingPopupOpen(true)}
          >
            <p
              className="text-[color:var(--theme-v-text-primary)]"
              style={{ fontSize: '16px', lineHeight: '20px', fontWeight: 500 }}
            >
              Avg. Rating
            </p>
            <div className="mt-2 flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[color:var(--theme-v-surface-overlay-strong)] text-[color:var(--theme-v-accent)] transition-transform group-hover:scale-105">
                <Star className="h-4 w-4" />
              </span>
              <span className="text-[24px] font-semibold text-[color:var(--theme-v-accent)]">{summary.average_rating || 0}</span>
            </div>
            <p className="mt-1 text-[11px] text-[color:var(--theme-v-text-secondary)]">Based on {reviewCount} reviews</p>
          </button>
        </div>

        <div className="mt-5 grid gap-4 lg:grid-cols-3">
          <div className="rounded-2xl border border-[color:var(--theme-v-border-medium)] bg-[color:var(--theme-v-surface-overlay)] p-4 shadow-[0_16px_30px_-22px_var(--theme-v-shell-shadow)]">
            <h3
              className="text-[color:var(--theme-v-text-primary)]"
              style={{ fontSize: '16px', lineHeight: '20px', fontWeight: 500 }}
            >
              Topics Addressed
            </h3>
            <div className="mt-4 flex h-[calc(100%-28px)] flex-col justify-between gap-4">
              <div className="grid place-items-center">
                <div
                  className="relative flex h-40 w-40 items-center justify-center rounded-full ring-1 ring-[color:var(--theme-v-border-soft)]"
                  style={{ background: topicConicGradient }}
                >
                  <div className="flex h-28 w-28 flex-col items-center justify-center rounded-full bg-[color:var(--theme-v-surface-overlay)] ring-1 ring-[color:var(--theme-v-border-soft)]">
                    <span className="text-[20px] font-semibold text-[color:var(--theme-v-accent)]">{topicTotalCount}</span>
                    <span className="text-[11px] text-[color:var(--theme-v-text-secondary)]">total logs</span>
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                {topicChartData.map((item, index) => (
                  <div key={`${item.label}-${index}`} className="flex items-center justify-between text-[11px] text-[color:var(--theme-v-text-secondary)]">
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

          <div className="rounded-2xl border border-[color:var(--theme-v-border-medium)] bg-[linear-gradient(135deg,var(--theme-v-bg-start)_0%,var(--theme-v-bg-mid)_55%,var(--theme-v-bg-end)_100%)] p-4 text-[color:var(--theme-v-text-primary)] shadow-[0_16px_30px_-20px_var(--theme-v-shell-shadow)] ring-1 ring-[color:var(--theme-v-hero-ring)]">
            <h3
              className="text-[color:var(--theme-v-text-primary)]"
              style={{ fontSize: '16px', lineHeight: '20px', fontWeight: 500 }}
            >
              Monthly Contribution
            </h3>
            <div className="mt-6 grid grid-cols-6 gap-2 items-end h-36">
              {monthlySeries.map((item) => (
                <div key={item.key} className="flex flex-col items-center gap-2">
                  <div
                    className={`w-full rounded-md ${item.value === maxMonthlyValue ? 'bg-[color:var(--theme-v-accent)]' : 'bg-[color:var(--theme-v-surface-overlay-track)]'}`}
                    style={{ height: `${Math.max(10, (item.value / maxMonthlyValue) * 100)}px` }}
                  />
                  <span className="text-[10px] text-[color:var(--theme-v-text-primary)]/70">{item.label}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-col items-center rounded-2xl border border-[color:var(--theme-v-border-medium)] bg-[color:var(--theme-v-surface-overlay)] p-4 shadow-[0_16px_30px_-22px_var(--theme-v-shell-shadow)]">
            <h3
              className="text-[color:var(--theme-v-text-primary)] self-start"
              style={{ fontSize: '16px', lineHeight: '20px', fontWeight: 500 }}
            >
              Donation vs Claim Ratio
            </h3>
            <div
              className="mt-6 h-36 w-36 rounded-full flex items-center justify-center"
              style={{ background: `conic-gradient(var(--theme-v-accent) 0% ${donationRatio}%, var(--theme-v-surface-overlay-track) ${donationRatio}% 100%)` }}
            >
              <div className="h-28 w-28 rounded-full bg-[color:var(--theme-v-surface-overlay)] flex items-center justify-center ring-1 ring-[color:var(--theme-v-border-soft)]">
                <span className="text-[16px] font-semibold text-[color:var(--theme-v-accent)]">{donationRatio}%</span>
              </div>
            </div>
            <div className="mt-4 flex items-center gap-4 text-[11px] text-[color:var(--theme-v-text-secondary)]">
              <span className="inline-flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-[color:var(--theme-v-surface-overlay-track)]" />
                Claimed
              </span>
              <span className="inline-flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-[color:var(--theme-v-accent)]" />
                Donated
              </span>
            </div>
            <div className="mt-4 grid w-full grid-cols-2 gap-2 text-[11px]">
              <div className="rounded-lg bg-[color:var(--theme-v-surface-overlay)] px-3 py-2 text-[color:var(--theme-v-accent)] ring-1 ring-[color:var(--theme-v-border-soft)]">
                Donated: {Number(summary.total_donated || 0)}
              </div>
              <div className="rounded-lg bg-[color:var(--theme-v-surface-overlay)] px-3 py-2 text-[color:var(--theme-v-text-secondary)] ring-1 ring-[color:var(--theme-v-border-soft)]">
                Claimed: {Number(summary.total_claimed || 0)}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-5 overflow-hidden rounded-2xl border border-[color:var(--theme-v-border-medium)] bg-[color:var(--theme-v-surface-overlay)] shadow-[0_18px_34px_-24px_var(--theme-v-shell-shadow)]">
          <div className="flex items-center justify-between border-b border-[color:var(--theme-v-border-medium)] bg-[color:var(--theme-v-surface-overlay-strong)] p-4">
            <h3
              className="text-[color:var(--theme-v-text-primary)]"
              style={{ fontSize: '18px', lineHeight: '22px', fontWeight: 600 }}
            >
              Session Ledger
            </h3>
            <span className="rounded-full bg-[color:var(--theme-v-surface-overlay)] px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider text-[color:var(--theme-v-accent)] ring-1 ring-[color:var(--theme-v-border-soft)]">
              Recent Activity
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[12px]">
              <thead className="border-y border-[color:var(--theme-v-border-medium)] bg-[color:var(--theme-v-surface-overlay)] text-[color:var(--theme-v-text-secondary)]">
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
                    ? 'bg-[color:var(--theme-v-toast-error-bg)] text-[color:var(--theme-v-toast-error-text)]'
                    : statusLabel === 'Donated'
                      ? 'bg-[color:var(--theme-v-selected-bg)] text-[color:var(--theme-v-accent-text)]'
                      : statusLabel === 'Claimed'
                        ? 'bg-[color:var(--theme-v-selected-bg)] text-[color:var(--theme-v-accent-text)]'
                        : 'bg-[color:var(--theme-v-surface-overlay-track)] text-[color:var(--theme-v-text-primary)]';
                return (
                    <tr key={row.id} className="border-t border-[color:var(--theme-v-border-medium)] text-[color:var(--theme-v-text-label)] transition-colors hover:bg-[color:var(--theme-v-surface-overlay-strong)]">
                    <td className="px-4 py-3">
                      {row.date ? new Date(row.date).toLocaleDateString() : '-'}
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
                            className={`h-3 w-3 ${idx < row.rating ? 'text-[color:var(--theme-v-accent)]' : 'text-white/30'}`}
                            fill={idx < row.rating ? 'currentColor' : 'none'}
                          />
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-[color:var(--theme-v-text-secondary)]">{row.notes || '-'}</td>
                  </tr>
                );
              })}
              {!tableRows.length && (
                <tr className="border-t border-[color:var(--theme-v-border-medium)] text-[color:var(--theme-v-text-primary)]">
                  <td className="px-4 py-3 text-sm text-[color:var(--theme-v-text-secondary)]" colSpan={6}>
                    No ledger entries yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
          <div className="flex items-center justify-between border-t border-[color:var(--theme-v-border-medium)] bg-[color:var(--theme-v-surface-overlay)] p-4 text-[12px] text-[color:var(--theme-v-text-secondary)]">
            <span className="rounded-lg bg-[color:var(--theme-v-surface-overlay)] px-2 py-1 text-[12px] text-[color:var(--theme-v-accent)] ring-1 ring-[color:var(--theme-v-border-soft)]">
              Showing {ledgerRows.length ? (ledgerPage - 1) * ledgerPageSize + 1 : 0}-
              {Math.min(ledgerPage * ledgerPageSize, ledgerRows.length)} of {ledgerRows.length} sessions
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                className="rounded-md border border-[color:var(--theme-v-hero-border)] bg-[color:var(--theme-v-nav-hover-bg)] px-3 py-1 text-[color:var(--theme-v-accent)] transition-colors hover:bg-[color:var(--theme-v-header-bg)] disabled:opacity-50"
                onClick={() => setLedgerPage((prev) => Math.max(1, prev - 1))}
                disabled={isInitialLoading || ledgerPage <= 1}
              >
                Previous
              </button>
              <button
                type="button"
                className="rounded-md bg-[color:var(--theme-v-accent)] px-3 py-1 text-[color:var(--theme-v-accent-text)] transition-colors hover:bg-[color:var(--theme-v-accent-hover)] disabled:opacity-50"
                onClick={() => setLedgerPage((prev) => Math.min(totalLedgerPages, prev + 1))}
                disabled={isInitialLoading || ledgerPage >= totalLedgerPages}
              >
                Next
              </button>
            </div>
          </div>
        </div>
        {(loading || error) && (
          <div className={`mt-3 text-xs ${error ? 'text-red-600' : 'text-[color:var(--theme-v-text-secondary)]'}`}>
            {error || 'Loading impact dashboard...'}
          </div>
        )}
      </div>

      {donatedPopupOpen && (
        <div className="fixed inset-0 z-50 bg-black/55 backdrop-blur-[1px] flex items-center justify-center px-4">
          <div className="w-full max-w-lg rounded-2xl border border-[color:var(--theme-v-border-strong)] bg-[linear-gradient(180deg,var(--theme-v-shell-bg-start)_0%,var(--theme-v-shell-bg-end)_100%)] p-5 text-[color:var(--theme-v-text-primary)] shadow-[0_24px_48px_-18px_var(--theme-v-shell-shadow)]">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold text-[color:var(--theme-v-text-primary)]">Total Complementary Sessions</h3>
              <button
                type="button"
                className="text-xs text-[color:var(--theme-v-accent)] underline"
                onClick={() => setDonatedPopupOpen(false)}
              >
                Close
              </button>
            </div>
            <div className="mt-4 overflow-hidden rounded-xl border border-[color:var(--theme-v-border-medium)] bg-[color:var(--theme-v-surface-overlay)]">
              <table className="w-full text-left text-xs">
                <thead className="bg-[color:var(--theme-v-surface-overlay-strong)] text-[color:var(--theme-v-text-label)]">
                  <tr>
                    <th className="px-3 py-2 font-medium">Mentee Name</th>
                    <th className="px-3 py-2 font-medium">Session ID</th>
                  </tr>
                </thead>
                <tbody>
                  {donatedRows.length > 0 ? (
                    donatedRows.map((row) => (
                        <tr key={`donated-${row.id}`} className="border-t border-[color:var(--theme-v-hero-border)] text-[color:var(--theme-v-text-primary)]">
                        <td className="px-3 py-2">{row.mentee}</td>
                        <td className="px-3 py-2">#{row.sessionId}</td>
                      </tr>
                    ))
                  ) : (
                    <tr className="border-t border-[color:var(--theme-v-hero-border)] text-[color:var(--theme-v-text-secondary)]">
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
        <div className="fixed inset-0 z-50 bg-black/55 backdrop-blur-[1px] flex items-center justify-center px-4">
          <div className="w-full max-w-lg rounded-2xl border border-[color:var(--theme-v-border-strong)] bg-[linear-gradient(180deg,var(--theme-v-shell-bg-start)_0%,var(--theme-v-shell-bg-end)_100%)] p-5 text-[color:var(--theme-v-text-primary)] shadow-[0_24px_48px_-18px_var(--theme-v-shell-shadow)]">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold text-[color:var(--theme-v-text-primary)]">Total Sessions</h3>
              <button
                type="button"
                className="text-xs text-[color:var(--theme-v-accent)] underline"
                onClick={() => setSessionsPopupOpen(false)}
              >
                Close
              </button>
            </div>
            <div className="mt-4 overflow-hidden rounded-xl border border-[color:var(--theme-v-border-medium)] bg-[color:var(--theme-v-surface-overlay)]">
              <table className="w-full text-left text-xs">
                <thead className="bg-[color:var(--theme-v-surface-overlay-strong)] text-[color:var(--theme-v-text-label)]">
                  <tr>
                    <th className="px-3 py-2 font-medium">Mentee Name</th>
                    <th className="px-3 py-2 font-medium">Session ID</th>
                    <th className="px-3 py-2 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {sessionDetailRows.length > 0 ? (
                    sessionDetailRows.map((row) => (
                    <tr key={`session-${row.id}`} className="border-t border-[color:var(--theme-v-hero-border)] text-[color:var(--theme-v-text-primary)]">
                        <td className="px-3 py-2">{row.menteeName}</td>
                        <td className="px-3 py-2">#{row.id}</td>
                        <td className="px-3 py-2">{getStatusLabel(row.status)}</td>
                      </tr>
                    ))
                  ) : (
                    <tr className="border-t border-[color:var(--theme-v-hero-border)] text-[color:var(--theme-v-text-secondary)]">
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
        <div className="fixed inset-0 z-50 bg-black/55 backdrop-blur-[1px] flex items-center justify-center px-4">
          <div className="w-full max-w-3xl rounded-2xl border border-[color:var(--theme-v-border-strong)] bg-[linear-gradient(180deg,var(--theme-v-shell-bg-start)_0%,var(--theme-v-shell-bg-end)_100%)] p-5 text-[color:var(--theme-v-text-primary)] shadow-[0_24px_48px_-18px_var(--theme-v-shell-shadow)]">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold text-[color:var(--theme-v-text-primary)]">Total Claimed</h3>
              <button
                type="button"
                className="text-xs text-[color:var(--theme-v-accent)] underline"
                onClick={() => {
                  setClaimedPopupMessage('');
                  setClaimedPopupOpen(false);
                }}
              >
                Close
              </button>
            </div>
            {claimedPopupMessage && (
              <p className="mt-3 rounded-lg border border-[color:var(--theme-v-border-soft)] bg-[color:var(--theme-v-surface-overlay)] px-3 py-2 text-xs text-[color:var(--theme-v-text-primary)]">
                {claimedPopupMessage}
              </p>
            )}
            <div className="mt-4 overflow-hidden rounded-xl border border-[color:var(--theme-v-border-medium)] bg-[color:var(--theme-v-surface-overlay)]">
              <table className="w-full text-left text-xs">
                <thead className="bg-[color:var(--theme-v-surface-overlay-strong)] text-[color:var(--theme-v-text-label)]">
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
                    <tr key={`claimed-${row.id}`} className="border-t border-[color:var(--theme-v-hero-border)] text-[color:var(--theme-v-text-primary)]">
                        <td className="px-3 py-2">{row.menteeName}</td>
                        <td className="px-3 py-2">#{row.sessionId}</td>
                        <td className="px-3 py-2">Rs {row.amount}</td>
                        <td className="px-3 py-2">{getPayoutStatusLabel(row.status)}</td>
                        <td className="px-3 py-2">
                          {canMarkPaid && row.status !== 'paid' ? (
                            <button
                              type="button"
                              className="rounded-md bg-[color:var(--theme-v-accent)] px-2.5 py-1 text-[11px] text-[color:var(--theme-v-accent-text)] disabled:opacity-60"
                              disabled={markPaidLoadingId === row.id}
                              onClick={() => handleMarkPaid(row.id)}
                            >
                              {markPaidLoadingId === row.id ? 'Processing...' : 'Mark Paid'}
                            </button>
                          ) : (
                            <span className="text-[11px] text-[color:var(--theme-v-text-secondary)]">-</span>
                          )}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr className="border-t border-[color:var(--theme-v-hero-border)] text-[color:var(--theme-v-text-secondary)]">
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
        <div className="fixed inset-0 z-50 bg-black/55 backdrop-blur-[1px] flex items-center justify-center px-4">
          <div className="w-full max-w-lg rounded-2xl border border-[color:var(--theme-v-border-strong)] bg-[linear-gradient(180deg,var(--theme-v-shell-bg-start)_0%,var(--theme-v-shell-bg-end)_100%)] p-5 text-[color:var(--theme-v-text-primary)] shadow-[0_24px_48px_-18px_var(--theme-v-shell-shadow)]">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold text-[color:var(--theme-v-text-primary)]">Avg. Rating</h3>
              <button
                type="button"
                className="text-xs text-[color:var(--theme-v-accent)] underline"
                onClick={() => setRatingPopupOpen(false)}
              >
                Close
              </button>
            </div>
            <div className="mt-4 overflow-hidden rounded-xl border border-[color:var(--theme-v-border-medium)] bg-[color:var(--theme-v-surface-overlay)]">
              <table className="w-full text-left text-xs">
                <thead className="bg-[color:var(--theme-v-surface-overlay-strong)] text-[color:var(--theme-v-text-label)]">
                  <tr>
                    <th className="px-3 py-2 font-medium">Mentee Name</th>
                    <th className="px-3 py-2 font-medium">Session ID</th>
                    <th className="px-3 py-2 font-medium">Rating</th>
                  </tr>
                </thead>
                <tbody>
                  {ratingDetailRows.length > 0 ? (
                    ratingDetailRows.map((row) => (
                    <tr key={`rating-${row.id}`} className="border-t border-[color:var(--theme-v-hero-border)] text-[color:var(--theme-v-text-primary)]">
                        <td className="px-3 py-2">{row.menteeName}</td>
                        <td className="px-3 py-2">#{row.sessionId}</td>
                        <td className="px-3 py-2">{row.rating}</td>
                      </tr>
                    ))
                  ) : (
                    <tr className="border-t border-[color:var(--theme-v-hero-border)] text-[color:var(--theme-v-text-secondary)]">
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

