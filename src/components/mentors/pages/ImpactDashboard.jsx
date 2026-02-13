import React, { useEffect, useMemo, useState } from 'react';
import { Download, Star, Video, Leaf, Clock } from 'lucide-react';
import { mentorApi } from '../../../apis/api/mentorApi';
import { useMentorData } from '../../../apis/apihook/useMentorData';

const ImpactDashboard = () => {
  const { mentor } = useMentorData();
  const [dashboard, setDashboard] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [feedbackList, setFeedbackList] = useState([]);
  const [ledgerPage, setLedgerPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const ledgerPageSize = 5;

  useEffect(() => {
    let cancelled = false;
    if (!mentor?.id) {
      setLoading(false);
      return undefined;
    }

    const loadDashboard = async () => {
      setLoading(true);
      setError('');
      try {
        const [dashboardResponse, sessionResponse, feedbackResponse] = await Promise.all([
          mentorApi.getMentorImpactDashboard(mentor.id),
          mentorApi.listSessions({ mentor_id: mentor.id }),
          mentorApi.listSessionFeedback({ mentor_id: mentor.id }),
        ]);
        if (!cancelled) {
          setDashboard(dashboardResponse || null);
          setSessions(Array.isArray(sessionResponse) ? sessionResponse : sessionResponse?.results || []);
          setFeedbackList(Array.isArray(feedbackResponse) ? feedbackResponse : feedbackResponse?.results || []);
        }
      } catch (err) {
        if (!cancelled) setError(err?.message || 'Unable to load impact dashboard.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadDashboard();
    return () => {
      cancelled = true;
    };
  }, [mentor?.id]);

  const summary = dashboard?.summary || {};
  const topicStats = Array.isArray(dashboard?.topic_stats) ? dashboard.topic_stats : [];
  const ledger = Array.isArray(dashboard?.ledger) ? dashboard.ledger : [];
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
        date: entry.decided_at || entry.updated_at || '',
        mentee: session?.mentee ? `Mentee #${session.mentee}` : `Session #${entry.session}`,
        duration: session?.duration_minutes ? `${session.duration_minutes} min` : '—',
        status: entry.action || entry.status,
        rating: feedback?.rating ? Number(feedback.rating) : 0,
        notes: entry.note || '',
      };
    });
  }, [ledger, feedbackMap, sessionMap]);

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

  return (
    <div className="min-h-screen bg-transparent text-[#111827] p-6 sm:p-8 rounded-2xl">
      <div className="max-w-[1200px] mx-auto">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-['DM_Sans'] font-bold text-[30px] leading-[36px] tracking-[0px] align-middle text-[#333333]">Impact Dashboard</h2>
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

        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl border border-[#e6e2f1] bg-white p-4 shadow-sm">
            <p
              className="text-[#333333]"
              style={{ fontFamily: 'DM Sans', fontSize: '16px', lineHeight: '20px', fontWeight: 500 }}
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
            <p className="mt-1 text-[11px] text-[#6b7280]">
              {isInitialLoading ? 'Loading metrics...' : sessionChangeLabel}
            </p>
          </div>
          <div className="rounded-xl border border-[#e6e2f1] bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <p
                className="text-[#333333]"
                style={{ fontFamily: 'DM Sans', fontSize: '16px', lineHeight: '20px', fontWeight: 500 }}
              >
                Total Donated
              </p>
              <span className="text-[11px] text-[#9ca3af]">This month</span>
            </div>
            <div className="mt-2 flex items-center gap-2">
              <span className="h-8 w-8 rounded-full bg-[#dcfce7] text-[#16a34a] flex items-center justify-center">
                <Leaf className="h-4 w-4" />
              </span>
              <span className="text-[24px] font-semibold text-[#16a34a]">
                ₹{summary.total_donated || 0}
              </span>
            </div>
            <p className="mt-1 text-[11px] text-[#6b7280]">All time</p>
          </div>
          <div className="rounded-xl border border-[#e6e2f1] bg-white p-4 shadow-sm">
            <p
              className="text-[#333333]"
              style={{ fontFamily: 'DM Sans', fontSize: '16px', lineHeight: '20px', fontWeight: 500 }}
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
            <p className="mt-1 text-[11px] text-[#6b7280]">Pending payout: ₹{summary.pending_payout || 0}</p>
          </div>
          <div className="rounded-xl border border-[#e6e2f1] bg-white p-4 shadow-sm">
            <p
              className="text-[#333333]"
              style={{ fontFamily: 'DM Sans', fontSize: '16px', lineHeight: '20px', fontWeight: 500 }}
            >
              Avg. Rating
            </p>
            <div className="mt-2 flex items-center gap-2">
              <span className="h-8 w-8 rounded-full bg-[#fef3c7] text-[#f59e0b] flex items-center justify-center">
                <Star className="h-4 w-4" />
              </span>
              <span className="text-[24px] font-semibold text-[#f59e0b]">{summary.average_rating || 0}</span>
            </div>
            <p className="mt-1 text-[11px] text-[#6b7280]">Based on {reviewCount} reviews</p>
          </div>
        </div>

        <div className="mt-5 grid gap-4 lg:grid-cols-3">
          <div className="rounded-xl border border-white/15 bg-white p-4 shadow-[0_8px_20px_rgba(0,0,0,0.2)]">
            <h3
              className="text-[#333333]"
              style={{ fontFamily: 'DM Sans', fontSize: '16px', lineHeight: '20px', fontWeight: 500 }}
            >
              Topics Addressed
            </h3>
            <div className="mt-4 space-y-3">
              {topicRows.map((item, index) => (
                <div key={`${item.label}-${index}`}>
                  <div className="flex items-center justify-between text-[11px] text-[#6b7280]">
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
              style={{ fontFamily: 'DM Sans', fontSize: '16px', lineHeight: '20px', fontWeight: 500 }}
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
              style={{ fontFamily: 'DM Sans', fontSize: '16px', lineHeight: '20px', fontWeight: 500 }}
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
            <div className="mt-4 flex items-center gap-4 text-[11px] text-[#6b7280]">
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
              style={{ fontFamily: 'DM Sans', fontSize: '16px', lineHeight: '20px', fontWeight: 500 }}
            >
              Session Ledger
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[11px]">
              <thead className="text-[#6b7280] border-t border-[#e6e2f1]">
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
                  <tr key={row.id} className="border-t border-[#f1f5f9] text-[#4b5563]">
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
                    <td className="px-4 py-3 text-[#9ca3af]">{row.notes || '—'}</td>
                  </tr>
                );
              })}
              {!tableRows.length && (
                <tr className="border-t border-[#f1f5f9] text-[#4b5563]">
                  <td className="px-4 py-3 text-xs text-[#6b7280]" colSpan={6}>
                    No ledger entries yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
          <div className="flex items-center justify-between p-4 text-[11px] text-[#6b7280] border-t border-[#e6e2f1]">
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
          <div className={`mt-3 text-xs ${error ? 'text-red-600' : 'text-[#6b7280]'}`}>
            {error || 'Loading impact dashboard...'}
          </div>
        )}
      </div>
    </div>
  );
};

export default ImpactDashboard;


