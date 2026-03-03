import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Video, X } from 'lucide-react';
import { menteeApi } from '../../apis/api/menteeApi';
import { getAuthSession, mapAppRoleToUiRole, setSelectedSessionId } from '../../apis/api/storage';
import {
  formatIndiaDateKey,
  getIndiaTimeLabel,
  indiaDateKeyToLabel,
} from '../../utils/indiaTime';

const normalizeList = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.results)) return payload.results;
  return [];
};

const hasConcreteMentorName = (label) => {
  const text = String(label || '').trim();
  if (!text) return false;
  if (text === 'Mentor') return false;
  if (/^Mentor #/i.test(text)) return false;
  return true;
};

const parseDateMs = (value) => {
  const parsed = new Date(value || '');
  const millis = parsed.getTime();
  return Number.isNaN(millis) ? null : millis;
};

const isPastSession = (session) => {
  const end = new Date(session?.scheduled_end || session?.scheduled_start || '');
  if (Number.isNaN(end.getTime())) return false;
  return end < new Date();
};

const isConnectionClosed = (session) => {
  const candidates = [
    session?.connection_status,
    session?.connectionStatus,
    session?.connection_state,
    session?.connectionState,
    session?.meeting_connection_status,
    session?.meeting_status,
    session?.meetingStatus,
  ];
  return candidates.some((value) => String(value || '').trim().toLowerCase() === 'closed');
};

const isJoinableStatus = (session) => {
  const status = String(session?.status || '').trim().toLowerCase();
  return ['approved', 'scheduled'].includes(status);
};

const canJoinSession = (session) =>
  isJoinableStatus(session) && !isPastSession(session) && !isConnectionClosed(session);

const getJoinUrl = (session) =>
  session?.join_url || session?.meeting_url || session?.joinUrl || session?.host_join_url || '';

const getMentorName = (session) => {
  const profileFromSession =
    typeof session?.mentor === 'object' && session?.mentor
      ? [session?.mentor?.first_name, session?.mentor?.last_name].filter(Boolean).join(' ').trim()
      : '';
  const fullName = [session?.mentor_first_name, session?.mentor_last_name].filter(Boolean).join(' ').trim();
  return (
    fullName ||
    profileFromSession ||
    session?.mentor_name ||
    (typeof session?.mentor === 'number' || typeof session?.mentor === 'string' ? `Mentor #${session.mentor}` : '') ||
    'Mentor'
  );
};

const formatStartedAtLabel = (value) => {
  const dateKey = formatIndiaDateKey(value);
  const dateLabel = dateKey ? indiaDateKeyToLabel(dateKey, { month: 'short', day: 'numeric', year: 'numeric' }) : '';
  const timeLabel = getIndiaTimeLabel(value, { hour12: true });
  if (!dateLabel && !timeLabel) return '';
  if (!dateLabel) return timeLabel || '';
  if (!timeLabel) return dateLabel;
  return `${dateLabel} at ${timeLabel}`;
};

const isMentorStartedSession = (session) => {
  const status = String(session?.status || '').toLowerCase();
  if (!['approved', 'scheduled'].includes(status)) return false;
  const mentorJoinedAtMs = parseDateMs(session?.mentor_joined_at);
  if (!mentorJoinedAtMs) return false;

  const nowMs = Date.now();
  const twelveHoursMs = 12 * 60 * 60 * 1000;
  if (mentorJoinedAtMs > nowMs + 60 * 1000) return false;
  if (nowMs - mentorJoinedAtMs > twelveHoursMs) return false;
  return true;
};

const openJoinLink = (navigate, url, sessionId) => {
  if (!url) return false;
  setSelectedSessionId(sessionId);
  if (url.startsWith('http://') || url.startsWith('https://')) {
    window.location.assign(url);
    return true;
  }
  navigate(url);
  return true;
};

const MenteeMeetingInviteBanner = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [invite, setInvite] = useState(null);
  const [mentorMap, setMentorMap] = useState({});
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState('');
  const dismissedSessionIdsRef = useRef(new Set());
  const joinedSessionIdsRef = useRef(new Set());
  const pollRef = useRef(null);

  const role = useMemo(() => mapAppRoleToUiRole(getAuthSession()?.role), []);

  const shouldHide = useMemo(() => {
    const path = location?.pathname || '';
    return path.includes('meeting-room') || path.includes('zoom-meeting');
  }, [location?.pathname]);

  const loadInvite = useCallback(async () => {
    if (role !== 'menties') return;
    if (shouldHide) return;
    try {
      const response = await menteeApi.listSessions();
      const rows = normalizeList(response);
      let best = null;

      rows.forEach((session) => {
        const sessionId = String(session?.id || '');
        if (!sessionId) return;
        if (dismissedSessionIdsRef.current.has(sessionId)) return;
        if (joinedSessionIdsRef.current.has(sessionId)) return;
        if (!isMentorStartedSession(session)) return;

        if (!best) {
          best = session;
          return;
        }
        const bestMs = parseDateMs(best?.mentor_joined_at) || 0;
        const candidateMs = parseDateMs(session?.mentor_joined_at) || 0;
        if (candidateMs > bestMs) best = session;
      });

      setInvite(best || null);
    } catch {
      // Keep banner quiet on background polling failures.
    }
  }, [role, shouldHide]);

  useEffect(() => {
    if (role !== 'menties') return undefined;
    loadInvite();
    if (pollRef.current) window.clearInterval(pollRef.current);
    pollRef.current = window.setInterval(() => {
      loadInvite();
    }, 12000);
    return () => {
      if (pollRef.current) window.clearInterval(pollRef.current);
      pollRef.current = null;
    };
  }, [loadInvite, role]);

  useEffect(() => {
    if (role !== 'menties') return undefined;
    let cancelled = false;

    const loadMentors = async () => {
      try {
        const response = await menteeApi.listMentors();
        if (cancelled) return;
        const mentors = normalizeList(response);
        const next = {};
        mentors.forEach((mentor) => {
          if (!mentor?.id) return;
          const name = `${mentor?.first_name || ''} ${mentor?.last_name || ''}`.trim();
          next[String(mentor.id)] = name || `Mentor #${mentor.id}`;
        });
        setMentorMap(next);
      } catch {
        // ignore mentor loading errors for banner
      }
    };

    loadMentors();
    const intervalId = window.setInterval(loadMentors, 60000);
    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
    };
  }, [role]);

  const handleDismiss = useCallback(() => {
    const sessionId = String(invite?.id || '');
    if (sessionId) dismissedSessionIdsRef.current.add(sessionId);
    setInvite(null);
    setError('');
  }, [invite?.id]);

  const handleJoin = useCallback(async () => {
    if (!invite?.id) return;
    if (!isJoinableStatus(invite)) {
      setError('Session is not available for joining.');
      return;
    }
    if (isConnectionClosed(invite)) {
      setError('Session connection is closed.');
      return;
    }
    if (isPastSession(invite)) return;

    setError('');
    setJoining(true);
    const sessionKey = String(invite.id);
    try {
      const existing = getJoinUrl(invite);
      const isWrongRolePath = typeof existing === 'string' && existing.includes('/mentor-meeting-room');
      if (existing && !isWrongRolePath) {
        joinedSessionIdsRef.current.add(sessionKey);
        setInvite(null);
        openJoinLink(navigate, existing, invite.id);
        return;
      }

      const response = await menteeApi.getSessionJoinLink(invite.id);
      const url = response?.meeting_url || response?.join_url || response?.host_join_url || '';
      if (!url) {
        setError('Join link not ready yet.');
        return;
      }
      joinedSessionIdsRef.current.add(sessionKey);
      setInvite(null);
      openJoinLink(navigate, url, invite.id);
    } catch (err) {
      setError(err?.message || 'Unable to fetch join link.');
    } finally {
      setJoining(false);
    }
  }, [invite, navigate]);

  if (role !== 'menties' || shouldHide || !invite) return null;

  const fallbackMentorName = getMentorName(invite);
  const mentorName =
    hasConcreteMentorName(fallbackMentorName)
      ? fallbackMentorName
      : mentorMap[String(invite?.mentor || '')] || fallbackMentorName;
  const startedLabel = formatStartedAtLabel(invite?.mentor_joined_at);

  return (
    <div className="sticky top-0 z-40 mb-4 rounded-xl border border-[#d8b4fe] bg-[#faf5ff] px-4 py-3 shadow-sm ring-1 ring-[#f3e8ff]">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0 text-sm text-[#4c1d95]">
          <span className="font-semibold">{mentorName}</span> started your session{startedLabel ? ` on ${startedLabel}` : ''}.
          {canJoinSession(invite) ? ' You can join now.' : ' Join will be available shortly.'}
          {error ? <span className="ml-2 text-red-600">{error}</span> : null}
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleJoin}
            disabled={joining || !canJoinSession(invite)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-[#5D3699] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#4a2b7a] disabled:opacity-50"
          >
            <Video className="h-3.5 w-3.5" />
            {joining ? 'Joining...' : 'Join Meeting'}
          </button>
          <button
            type="button"
            onClick={handleDismiss}
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-[#5D3699] transition-colors hover:bg-[#f5f3ff]"
            aria-label="Dismiss notification"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default MenteeMeetingInviteBanner;
