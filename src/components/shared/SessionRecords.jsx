import React, { useEffect, useMemo, useState } from 'react';
import { Calendar, Clock, FileText, Search, Video } from 'lucide-react';
import { menteeApi } from '../../apis/api/menteeApi';
import { mentorApi } from '../../apis/api/mentorApi';
import { getAuthSession, mapAppRoleToUiRole } from '../../apis/api/storage';
import { formatIndiaDateKey, getIndiaTimeLabel, indiaDateKeyToLabel } from '../../utils/indiaTime';

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || '/api').replace(/\/+$/, '');

const resolveMediaUrl = (value) => {
  if (!value) return '';
  if (/^https?:\/\//i.test(value)) return value;
  if (value.startsWith('/')) {
    const base = API_BASE_URL.endsWith('/api') ? API_BASE_URL.slice(0, -4) : API_BASE_URL;
    return base ? `${base}${value}` : value;
  }
  return value;
};

const normalizeList = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.results)) return payload.results;
  return [];
};

const formatStatus = (value) => {
  const normalized = String(value || 'scheduled').trim().toLowerCase();
  if (!normalized) return 'Scheduled';
  return normalized
    .split('_')
    .join(' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
};

const formatDate = (value) => {
  const key = formatIndiaDateKey(value);
  if (!key) return 'Date TBD';
  return indiaDateKeyToLabel(key, { month: 'short', day: 'numeric', year: 'numeric' });
};

const formatTimeRange = (startValue, endValue) => {
  const startLabel = getIndiaTimeLabel(startValue, { hour12: true });
  const endLabel = getIndiaTimeLabel(endValue, { hour12: true });
  if (!startLabel || !endLabel) return 'Time TBD';
  return `${startLabel} - ${endLabel}`;
};

const formatDateTime = (value) => {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  const dateLabel = formatDate(value);
  const timeLabel = getIndiaTimeLabel(value, { hour12: true });
  if (!dateLabel || !timeLabel) return '-';
  return `${dateLabel}, ${timeLabel}`;
};

const formatFileSize = (value) => {
  const size = Number(value || 0);
  if (!size) return '-';
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  if (size < 1024 * 1024 * 1024) return `${(size / (1024 * 1024)).toFixed(1)} MB`;
  return `${(size / (1024 * 1024 * 1024)).toFixed(1)} GB`;
};

const getSessionSortTime = (session) => {
  const rawValue = session?.scheduled_start || session?.updated_at || session?.created_at || '';
  const parsed = new Date(rawValue);
  const millis = parsed.getTime();
  return Number.isNaN(millis) ? 0 : millis;
};

const getMenteeName = (session) => {
  const fromLinkedMentee =
    typeof session?.mentee === 'object'
      ? [session?.mentee?.first_name, session?.mentee?.last_name].filter(Boolean).join(' ').trim()
      : '';
  const fromSessionFields = [session?.mentee_first_name, session?.mentee_last_name]
    .filter(Boolean)
    .join(' ')
    .trim();
  if (fromSessionFields) return fromSessionFields;
  if (session?.mentee_name) return session.mentee_name;
  if (fromLinkedMentee) return fromLinkedMentee;
  if (session?.mentee) return `Mentee #${session.mentee}`;
  return 'Mentee';
};

const getMenteeAvatar = (session) => {
  if (session?.mentee_avatar) return session.mentee_avatar;
  if (typeof session?.mentee === 'object' && session?.mentee?.avatar) return session.mentee.avatar;
  return '';
};

const getStatusClasses = (statusValue) => {
  const normalized = String(statusValue || '').toLowerCase();
  if (normalized === 'completed') return 'bg-green-50 text-green-700 ring-1 ring-green-200';
  if (normalized === 'scheduled' || normalized === 'approved') {
    return 'bg-blue-50 text-blue-700 ring-1 ring-blue-200';
  }
  if (normalized === 'requested') return 'bg-amber-50 text-amber-700 ring-1 ring-amber-200';
  if (normalized === 'canceled' || normalized === 'no_show') {
    return 'bg-rose-50 text-rose-700 ring-1 ring-rose-200';
  }
  return 'bg-gray-100 text-gray-700 ring-1 ring-gray-200';
};

const SessionRecords = () => {
  const role = mapAppRoleToUiRole(getAuthSession()?.role) || 'menties';
  const isMentorRole = role === 'mentors';

  const [sessions, setSessions] = useState([]);
  const [recordingsBySession, setRecordingsBySession] = useState({});
  const [mentorMap, setMentorMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchValue, setSearchValue] = useState('');

  useEffect(() => {
    let cancelled = false;

    const loadRecords = async () => {
      setLoading(true);
      setError('');
      try {
        const sessionApi = isMentorRole ? mentorApi : menteeApi;
        let sessionItems = [];
        if (isMentorRole) {
          const response = await mentorApi.listSessions();
          sessionItems = normalizeList(response);
        } else {
          const [sessionResponse, mentorResponse] = await Promise.all([
            menteeApi.listSessions(),
            menteeApi.listMentors(),
          ]);
          sessionItems = normalizeList(sessionResponse);
          const mentorItems = normalizeList(mentorResponse);
          const nextMentorMap = {};
          mentorItems.forEach((item) => {
            nextMentorMap[String(item?.id)] = {
              name: [item?.first_name, item?.last_name].filter(Boolean).join(' ').trim(),
              avatar: item?.avatar || item?.profile_photo || '',
            };
          });
          if (!cancelled) setMentorMap(nextMentorMap);
        }

        const recordingEntries = await Promise.all(
          sessionItems.map(async (session) => {
            try {
              const recording = await sessionApi.getSessionRecording(session.id);
              return [String(session.id), recording || null];
            } catch {
              return [String(session.id), null];
            }
          })
        );

        if (cancelled) return;
        setSessions(sessionItems);
        setRecordingsBySession(Object.fromEntries(recordingEntries));
      } catch (err) {
        if (!cancelled) {
          setError(err?.message || 'Unable to load session records.');
          setSessions([]);
          setRecordingsBySession({});
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadRecords();
    return () => {
      cancelled = true;
    };
  }, [isMentorRole]);

  const statuses = useMemo(() => {
    const unique = new Set();
    sessions.forEach((session) => {
      const statusValue = String(session?.status || '').toLowerCase();
      if (statusValue) unique.add(statusValue);
    });
    return ['all', ...Array.from(unique)];
  }, [sessions]);

  const rows = useMemo(() => {
    return sessions
      .map((session) => {
        const recording = recordingsBySession[String(session.id)] || null;
        const metadata = recording?.metadata && typeof recording.metadata === 'object' ? recording.metadata : {};
        const summary = String(metadata?.meeting_summary || '').trim();
        const highlights = Array.isArray(metadata?.meeting_highlights) ? metadata.meeting_highlights : [];
        const actionItems = Array.isArray(metadata?.meeting_action_items) ? metadata.meeting_action_items : [];

        const participant = isMentorRole
          ? {
              name: getMenteeName(session),
              avatar: resolveMediaUrl(getMenteeAvatar(session)),
              label: 'Mentee',
            }
          : {
              name: mentorMap[String(session?.mentor)]?.name || `Mentor #${session?.mentor || '-'}`,
              avatar: resolveMediaUrl(mentorMap[String(session?.mentor)]?.avatar || ''),
              label: 'Mentor',
            };

        return {
          session,
          participant,
          recording,
          summary,
          highlights,
          actionItems,
        };
      })
      .filter((item) => {
        if (statusFilter !== 'all') {
          if (String(item.session?.status || '').toLowerCase() !== statusFilter) return false;
        }
        if (searchValue.trim()) {
          const query = searchValue.trim().toLowerCase();
          const participantName = String(item.participant?.name || '').toLowerCase();
          const topic = (Array.isArray(item.session?.topic_tags) ? item.session.topic_tags.join(' ') : '').toLowerCase();
          if (!participantName.includes(query) && !topic.includes(query) && !String(item.session?.id).includes(query)) {
            return false;
          }
        }
        return true;
      })
      .sort((left, right) => getSessionSortTime(right.session) - getSessionSortTime(left.session));
  }, [isMentorRole, mentorMap, recordingsBySession, searchValue, sessions, statusFilter]);

  return (
    <div className="min-h-screen bg-transparent p-2 sm:p-4 lg:p-6">
      <div className="mb-6 flex flex-col gap-4 rounded-[28px] border border-[#e8dcff] bg-[linear-gradient(135deg,#ffffff_0%,#fcfaff_45%,#f8f3ff_100%)] p-4 shadow-[0_28px_60px_-46px_rgba(93,54,153,0.65)] ring-1 ring-[#efe7ff] lg:flex-row lg:items-center lg:justify-between lg:p-6">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#5D3699] text-white">
            <FileText className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[#111827]">Session Records</h1>
            <p className="text-sm text-[#6b7280]">
              View all sessions, recording status, summaries, and meeting details.
            </p>
          </div>
        </div>

        <div className="flex w-full flex-col gap-3 sm:flex-row lg:w-auto">
          <div className="relative w-full sm:w-[280px]">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9ca3af]" />
            <input
              type="text"
              value={searchValue}
              onChange={(event) => setSearchValue(event.target.value)}
              placeholder="Search by person, topic, or session id"
              className="h-11 w-full rounded-xl border-0 bg-white pl-10 pr-4 text-sm text-[#111827] ring-1 ring-[#e5e7eb] focus:ring-2 focus:ring-[#5D3699]"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            className="h-11 rounded-xl border-0 bg-white px-4 text-sm text-[#111827] ring-1 ring-[#e5e7eb] focus:ring-2 focus:ring-[#5D3699]"
          >
            {statuses.map((statusValue) => (
              <option key={statusValue} value={statusValue}>
                {statusValue === 'all' ? 'All Statuses' : formatStatus(statusValue)}
              </option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="rounded-2xl bg-white p-6 text-sm text-[#6b7280] shadow-sm ring-1 ring-[#e5e7eb]">
          Loading session records...
        </div>
      ) : null}

      {error ? (
        <div className="mb-4 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700 ring-1 ring-red-100">{error}</div>
      ) : null}

      {!loading && !rows.length ? (
        <div className="rounded-2xl bg-white p-10 text-center text-sm text-[#6b7280] shadow-sm ring-1 ring-[#e5e7eb]">
          No sessions found for the selected filters.
        </div>
      ) : null}

      <div className="grid gap-4">
        {rows.map((item) => {
          const { session, recording, participant, summary, highlights, actionItems } = item;
          const recordingStatus = String(recording?.status || 'not_started').toLowerCase();
          return (
            <div key={session.id} className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-[#e5e7eb] sm:p-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <div className="text-xs font-medium uppercase tracking-wide text-[#6b7280]">
                    Session #{session.id}
                  </div>
                  <div className="mt-1 flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-[#f3f4f6] text-sm font-semibold text-[#5D3699]">
                      {participant.avatar ? (
                        <img src={participant.avatar} alt={participant.name} className="h-full w-full object-cover" />
                      ) : (
                        participant.name.charAt(0).toUpperCase()
                      )}
                    </div>
                    <div>
                      <div className="text-lg font-semibold text-[#111827]">{participant.name}</div>
                      <div className="text-sm text-[#6b7280]">{participant.label}</div>
                    </div>
                  </div>
                </div>
                <span className={`inline-flex w-fit rounded-full px-3 py-1 text-xs font-semibold ${getStatusClasses(session?.status)}`}>
                  {formatStatus(session?.status)}
                </span>
              </div>

              <div className="mt-4 grid gap-3 text-sm text-[#374151] sm:grid-cols-2 lg:grid-cols-4">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-[#5D3699]" />
                  <span>{formatDate(session?.scheduled_start)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-[#5D3699]" />
                  <span>{formatTimeRange(session?.scheduled_start, session?.scheduled_end)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Video className="h-4 w-4 text-[#5D3699]" />
                  <span>{formatStatus(session?.mode || 'online')}</span>
                </div>
                <div>
                  <span className="font-medium text-[#111827]">Duration:</span>{' '}
                  {session?.duration_minutes ? `${session.duration_minutes} mins` : '45 mins'}
                </div>
              </div>

              <div className="mt-4 rounded-xl bg-[#f8fafc] p-3 ring-1 ring-[#e5e7eb]">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="text-sm font-semibold text-[#111827]">
                    Recording: {formatStatus(recordingStatus)}
                  </div>
                  <span className="text-xs text-[#6b7280]">Recording playback disabled</span>
                </div>
                <div className="mt-2 grid gap-2 text-xs text-[#6b7280] sm:grid-cols-3">
                  <div>
                    <span className="font-medium text-[#374151]">Started:</span> {formatDateTime(recording?.started_at)}
                  </div>
                  <div>
                    <span className="font-medium text-[#374151]">Ended:</span> {formatDateTime(recording?.ended_at)}
                  </div>
                  <div>
                    <span className="font-medium text-[#374151]">File Size:</span> {formatFileSize(recording?.file_size_bytes)}
                  </div>
                </div>
              </div>

              <div className="mt-4 grid gap-4 lg:grid-cols-3">
                <div className="lg:col-span-2 rounded-xl border border-[#e5e7eb] bg-white p-3">
                  <div className="text-xs font-semibold uppercase tracking-wide text-[#6b7280]">
                    Meeting Summary
                  </div>
                  <p className="mt-2 text-sm text-[#111827]">
                    {summary || 'Summary not generated yet for this session.'}
                  </p>
                </div>
                <div className="rounded-xl border border-[#e5e7eb] bg-white p-3">
                  <div className="text-xs font-semibold uppercase tracking-wide text-[#6b7280]">
                    Additional Details
                  </div>
                  <div className="mt-2 space-y-2 text-sm text-[#374151]">
                    <div>
                      <span className="font-medium text-[#111827]">Highlights:</span>{' '}
                      {highlights.length ? highlights.slice(0, 2).join(' | ') : 'Not available'}
                    </div>
                    <div>
                      <span className="font-medium text-[#111827]">Action Items:</span>{' '}
                      {actionItems.length ? actionItems.slice(0, 2).join(' | ') : 'Not available'}
                    </div>
                    <div>
                      <span className="font-medium text-[#111827]">Topics:</span>{' '}
                      {Array.isArray(session?.topic_tags) && session.topic_tags.length
                        ? session.topic_tags.join(', ')
                        : 'Not provided'}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default SessionRecords;
