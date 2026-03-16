import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  Maximize2,
  Mic,
  MicOff,
  Minimize2,
  PhoneOff,
  ShieldAlert,
  Video,
  VideoOff,
} from 'lucide-react';
import { setSelectedSessionId } from '../../apis/api/storage';

const TURN_URL = String(import.meta.env.VITE_TURN_URL || '').trim();
const TURN_URLS = String(import.meta.env.VITE_TURN_URLS || '').trim();
const TURN_USERNAME = String(import.meta.env.VITE_TURN_USERNAME || '').trim();
const TURN_CREDENTIAL = String(import.meta.env.VITE_TURN_CREDENTIAL || '').trim();
const TURN_CREDENTIALS_URL = String(import.meta.env.VITE_TURN_CREDENTIALS_URL || '').trim();
const STUN_URL = String(import.meta.env.VITE_STUN_URL || 'stun:stun.l.google.com:19302').trim();
const STUN_URLS = String(import.meta.env.VITE_STUN_URLS || '').trim();
const FORCE_RELAY = ['1', 'true', 'yes', 'on'].includes(
  String(import.meta.env.VITE_FORCE_RELAY || '').trim().toLowerCase()
);

const splitUrls = (value) =>
  String(value || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);

const stunUrls = [...splitUrls(STUN_URLS), ...splitUrls(STUN_URL)];
if (!stunUrls.length && STUN_URL) stunUrls.push(STUN_URL);

const turnUrls = [...splitUrls(TURN_URLS), ...splitUrls(TURN_URL)];
const HAS_TURN_CONFIG = Boolean(turnUrls.length && TURN_USERNAME && TURN_CREDENTIAL);
const RELAY_REQUESTED = FORCE_RELAY;
const RELAY_ENABLED = RELAY_REQUESTED && HAS_TURN_CONFIG;

const rtcIceServers = [];
if (stunUrls.length) {
  rtcIceServers.push({
    urls: stunUrls.length === 1 ? stunUrls[0] : stunUrls,
  });
}
if (HAS_TURN_CONFIG) {
  rtcIceServers.push({
    urls: turnUrls.length === 1 ? turnUrls[0] : turnUrls,
    username: TURN_USERNAME,
    credential: TURN_CREDENTIAL,
  });
}

const DEFAULT_RTC_CONFIG = {
  iceServers: rtcIceServers,
  iceTransportPolicy: RELAY_ENABLED ? 'relay' : 'all',
};

const normalizeRtcIceServers = (payload) => {
  const rows = Array.isArray(payload) ? payload : Array.isArray(payload?.iceServers) ? payload.iceServers : [];
  return rows
    .map((row) => {
      if (!row || typeof row !== 'object') return null;
      const rawUrls = Array.isArray(row.urls) ? row.urls : [row.urls || row.url];
      const urls = rawUrls.map((item) => String(item || '').trim()).filter(Boolean);
      if (!urls.length) return null;
      const entry = { urls: urls.length === 1 ? urls[0] : urls };
      const username = String(row.username || '').trim();
      const credential = String(row.credential || '').trim();
      if (username) entry.username = username;
      if (credential) entry.credential = credential;
      return entry;
    })
    .filter(Boolean);
};

const hasTurnIceServers = (servers) =>
  servers.some((server) => {
    const urls = Array.isArray(server?.urls) ? server.urls : [server?.urls];
    return urls.some((value) => String(value || '').trim().toLowerCase().startsWith('turn'));
  });

const CLOUDINARY_CLOUD_NAME = String(import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || '').trim();
const CLOUDINARY_UPLOAD_PRESET = String(import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || '').trim();
const CLOUDINARY_UPLOAD_FOLDER = String(import.meta.env.VITE_CLOUDINARY_UPLOAD_FOLDER || 'bond-room').trim();
const SERVERLESS_MAX_UPLOAD_BYTES = Number(import.meta.env.VITE_SERVERLESS_MAX_UPLOAD_BYTES || 4 * 1024 * 1024);
const ABUSE_TOAST_DEDUP_MS = 6000;
const ABUSE_SUMMARY_DEDUP_MS = 12000;
const AUTO_VIDEO_SCAN_INTERVAL_MS = Number(import.meta.env.VITE_VIDEO_SAFETY_SCAN_MS || 6000);
const AUTO_VIDEO_ALERT_DEDUP_MS = Number(import.meta.env.VITE_VIDEO_ALERT_DEDUP_MS || 30000);
const SPEECH_DUPLICATE_WINDOW_MS = Number(import.meta.env.VITE_SPEECH_DUPLICATE_WINDOW_MS || 1800);
const LOCAL_ABUSE_TERMS = [
  'idiot',
  'stupid',
  'shut up',
  'loser',
  'hate you',
  'kill yourself',
  'moron',
  'useless',
  'dumb',
  'fool',
  'bastard',
  'asshole',
  'fuck',
  'fucker',
  'fucking',
  'fuck off',
  'shit',
  'bitch',
  'motherfucker',
  'madarchod',
  'madar chod',
  'behenchod',
  'behen chod',
  'benchod',
  'bsdk',
  'bkl',
  'gandu',
  'kameena',
  'haramzada',
  'chutiya',
  'harami',
];

const toArray = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.results)) return payload.results;
  return [];
};

const normalizeSignalPayload = (value) => {
  if (!value) return {};
  if (typeof value.toJSON === 'function') return value.toJSON();
  return value;
};

const getParticipantDisplayRole = (role) => {
  const normalized = String(role || '').trim().toLowerCase();
  if (normalized === 'mentor') return 'Mentor';
  if (normalized === 'mentee') return 'Mentee';
  return 'Participant';
};

const normalizeParticipantRole = (role) => {
  const normalized = String(role || '').trim().toLowerCase();
  if (normalized === 'mentor' || normalized === 'mentee') return normalized;
  return '';
};

const formatIncidentTypeLabel = (value) =>
  String(value || 'unknown')
    .trim()
    .replace(/_/g, ' ')
    .toLowerCase();

const normalizeAbuseText = (value) =>
  String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[-_/]+/g, ' ')
    .replace(/[^\w\s*]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const compactAbuseText = (value) =>
  String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[@]/g, 'a')
    .replace(/[$]/g, 's')
    .replace(/[!1]/g, 'i')
    .replace(/[0]/g, 'o')
    .replace(/[3]/g, 'e')
    .replace(/[4]/g, 'a')
    .replace(/[5]/g, 's')
    .replace(/[7]/g, 't')
    .replace(/[^a-z0-9]+/g, '');

const escapeRegex = (value) => String(value || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const severityFromMatchCount = (count) => {
  if (count >= 3) return 'high';
  if (count >= 2) return 'medium';
  return 'low';
};

const detectLocalAbusiveTerms = (value) => {
  const source = normalizeAbuseText(value);
  if (!source) return [];
  const sourceCompact = compactAbuseText(value);
  const sourceTokens = source.split(/\s+/).filter(Boolean);
  const matches = [];

  const isMaskedTokenLikelyTerm = (tokenValue, termValue) => {
    const token = String(tokenValue || '').trim().toLowerCase();
    const term = String(termValue || '').trim().toLowerCase();
    if (!token || !term || !token.includes('*')) return false;
    if (term.length < 4 || token[0] !== term[0]) return false;

    const wildcardPattern = new RegExp(`^${escapeRegex(token).replace(/\\\*/g, '[a-z]*')}$`, 'i');
    if (!wildcardPattern.test(term)) return false;

    const explicitLetters = token.replace(/\*/g, '');
    if (explicitLetters.length >= 2) {
      let cursor = 0;
      for (const char of explicitLetters) {
        cursor = term.indexOf(char, cursor);
        if (cursor === -1) return false;
        cursor += 1;
      }
    }

    const trailingLetterMatch = token.match(/[a-z](?=[^a-z]*$)/i);
    if (trailingLetterMatch && trailingLetterMatch[0] !== term[term.length - 1]) {
      return false;
    }

    return Math.abs(token.length - term.length) <= 3;
  };

  for (const term of LOCAL_ABUSE_TERMS) {
    const normalized = normalizeAbuseText(term);
    if (!normalized) continue;
    const pattern = new RegExp(`\\b${escapeRegex(normalized).replace(/\s+/g, '\\s+')}\\b`, 'i');
    if (pattern.test(source)) {
      matches.push(normalized);
      continue;
    }
    const compact = compactAbuseText(normalized.replace(/\*/g, ''));
    if (compact && compact.length >= 4 && sourceCompact.includes(compact)) {
      matches.push(normalized);
      continue;
    }

    if (!normalized.includes(' ') && sourceTokens.some((token) => isMaskedTokenLikelyTerm(token, normalized))) {
      matches.push(normalized);
    }
  }
  return Array.from(new Set(matches));
};

const buildLanguageAlertMessage = (speakerRole, viewerRole) => {
  const speaker = getParticipantDisplayRole(speakerRole);
  const speakerNormalized = String(speakerRole || '').trim().toLowerCase();
  const viewerNormalized = String(viewerRole || '').trim().toLowerCase();
  if (speakerNormalized && speakerNormalized === viewerNormalized) {
    return 'Warning: Bad wording detected. Please maintain respectful communication during the session.';
  }
  if (speakerNormalized === 'mentee') {
    return 'Alert: Mentee used bad wording. Please guide the conversation respectfully.';
  }
  if (speakerNormalized === 'mentor') {
    return 'Alert: Mentor used bad wording. You may continue cautiously or end the session if needed.';
  }
  return `Alert: ${speaker} used bad wording.`;
};

const isSuppressedRtcError = (message) => {
  const text = String(message || '').toLowerCase();
  return (
    text.includes("failed to execute 'setremotedescription'") &&
    text.includes('order of m-lines')
  );
};

const isPrivateHostCandidate = (value) => {
  const host = String(value || '').trim().toLowerCase();
  const rfc1918OrLinkLocalIpv4 =
    /\b10\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/.test(host) ||
    /\b192\.168\.\d{1,3}\.\d{1,3}\b/.test(host) ||
    /\b172\.(1[6-9]|2\d|3[0-1])\.\d{1,3}\.\d{1,3}\b/.test(host) ||
    /\b169\.254\.\d{1,3}\.\d{1,3}\b/.test(host);
  const localIpv6 = host.includes('fe80:') || host.includes('fd') || host.includes('fc');
  return (
    rfc1918OrLinkLocalIpv4 ||
    localIpv6
  );
};

const isIgnorableIceCandidateErrorEvent = (event) => {
  const code = Number(event?.errorCode || 0);
  const text = String(event?.errorText || '').toLowerCase();
  const host = String(event?.hostCandidate || '').toLowerCase();
  if (code === 701) return true;
  if (text.includes('stun binding request timed out')) return true;
  if (text.includes('address not associated with the desired network interface')) return true;
  if (text.includes('failed to establish connection')) return true;
  if (isPrivateHostCandidate(host)) return true;
  return false;
};

const getRefreshGuardKey = (sessionId, participantRole) =>
  `bond-room:meeting-refresh:${participantRole || 'unknown'}:${sessionId || '0'}`;

const MeetingRoomShell = ({
  api,
  participantRole,
  exitPath,
  title,
  exitLabel,
  sessionIdOverride,
  uiMode = 'full',
  reopenPath = '',
  onExit,
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const stageContainerRef = useRef(null);
  const localStreamRef = useRef(null);
  const remoteStreamRef = useRef(null);
  const peerConnectionRef = useRef(null);
  const senderRef = useRef({ audio: null, video: null });
  const pollIntervalRef = useRef(null);
  const reconnectIntervalRef = useRef(null);
  const recordingStatusPollIntervalRef = useRef(null);
  const lastSignalIdRef = useRef(0);
  const offerSentRef = useRef(false);
  const recorderRef = useRef(null);
  const recordingChunksRef = useRef([]);
  const transcriptSegmentsRef = useRef([]);
  const roleTranscriptSegmentsRef = useRef({ mentor: [], mentee: [] });
  const recognitionRef = useRef(null);
  const autoMonitoringRef = useRef(false);
  const speechRestartTimerRef = useRef(null);
  const speechRestartDelayRef = useRef(550);
  const summaryRequestedRef = useRef(false);
  const remoteStreamStateCleanupRef = useRef(null);
  const remoteMediaSignalRef = useRef({ micEnabled: null, cameraEnabled: null });
  const placeholderVideoTrackRef = useRef(null);
  const cameraTracksRef = useRef(new Set());
  const recordingMixedStreamRef = useRef(null);
  const recordingCanvasRef = useRef(null);
  const recordingCanvasRafRef = useRef(null);
  const recordingAudioContextRef = useRef(null);
  const recordingAudioDestinationRef = useRef(null);
  const recordingAudioNodesRef = useRef([]);
  const recordingAudioTrackIdsRef = useRef(new Set());
  const toastTimerRef = useRef(null);
  const lastLocalAbuseToastRef = useRef(0);
  const lastRemoteAbuseToastRef = useRef(0);
  const lastSpeechModerationRef = useRef({ text: '', at: 0 });
  const lastInterimFeedAtRef = useRef(0);
  const lastAbuseSummaryAtRef = useRef(0);
  const abuseSummaryBusyRef = useRef(false);
  const videoAnalysisBusyRef = useRef(false);
  const videoScanErrorAtRef = useRef(0);
  const lastVideoAlertByKeyRef = useRef({});
  const sessionClosedSyncRef = useRef(false);
  const rtcConfigRef = useRef(DEFAULT_RTC_CONFIG);
  const exitingRef = useRef(false);
  const monitoringFeedIdRef = useRef(0);
  const [connectionState, setConnectionState] = useState('idle');
  const [micEnabled, setMicEnabled] = useState(true);
  const micEnabledRef = useRef(true);
  const [cameraEnabled, setCameraEnabled] = useState(true);
  const [remoteMicEnabled, setRemoteMicEnabled] = useState(null);
  const [remoteCameraEnabled, setRemoteCameraEnabled] = useState(null);
  const [peerLabel, setPeerLabel] = useState('Peer');
  const [recording, setRecording] = useState(false);
  const [recordingStatus, setRecordingStatus] = useState('not_started');
  const [monitoring, setMonitoring] = useState(false);
  const [monitoringStatus, setMonitoringStatus] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [analysisInput, setAnalysisInput] = useState('');
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [alert, setAlert] = useState(null);
  const [incidents, setIncidents] = useState([]);
  const [toastState, setToastState] = useState({
    open: false,
    message: '',
    type: 'warning',
  });
  const [meetingSummary, setMeetingSummary] = useState('');
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [remoteEnded, setRemoteEnded] = useState(false);
  const [monitoringFeed, setMonitoringFeed] = useState([]);
  const [liveInterimTranscript, setLiveInterimTranscript] = useState('');
  const monitoringActive = monitoringStatus || monitoring;
  const isMentorToolsEnabled = participantRole === 'mentor';
  const canSpeechModeration = participantRole === 'mentor' || participantRole === 'mentee';
  const monitoringMetadataKey =
    participantRole === 'mentor' ? 'monitoring_started_mentor' : 'monitoring_started_mentee';
  const showManualMentorTools = false;

  const searchParams = useMemo(() => new URLSearchParams(location.search), [location.search]);
  const sessionIdFromQuery = Number(searchParams.get('sessionId') || 0);
  const sessionId = Number(sessionIdOverride || sessionIdFromQuery || 0);

  const hasSpeechRecognition = useMemo(() => {
    if (typeof window === 'undefined') return false;
    return Boolean(window.SpeechRecognition || window.webkitSpeechRecognition);
  }, []);

  const appendError = useCallback((message) => {
    if (!message) return;
    if (isSuppressedRtcError(message)) return;
    console.error('[MeetingRoomShell]', String(message));
  }, []);

  const appendMonitoringTranscript = useCallback((text, source = 'local') => {
    const value = String(text || '').replace(/\s+/g, ' ').trim();
    if (!value) return;
    monitoringFeedIdRef.current += 1;
    const nextEntry = {
      id: monitoringFeedIdRef.current,
      text: value,
      source: String(source || 'local').trim().toLowerCase(),
      at: new Date().toISOString(),
    };
    setMonitoringFeed((prev) => [nextEntry, ...prev].slice(0, 40));
  }, []);

  const appendRoleTranscriptSegment = useCallback((roleValue, textValue) => {
    const role = String(roleValue || '').trim().toLowerCase();
    if (role !== 'mentor' && role !== 'mentee') return;
    const value = String(textValue || '').replace(/\s+/g, ' ').trim();
    if (!value) return;
    const bucket = roleTranscriptSegmentsRef.current?.[role];
    if (!Array.isArray(bucket)) {
      roleTranscriptSegmentsRef.current[role] = [value];
      return;
    }
    if (bucket[bucket.length - 1] === value) return;
    bucket.push(value);
    if (bucket.length > 240) {
      bucket.splice(0, bucket.length - 240);
    }
  }, []);

  const showToast = useCallback((message, type = 'warning', duration = 4500) => {
    const text = String(message || '').trim();
    if (!text) return;
    setToastState({ open: true, message: text, type });
    if (toastTimerRef.current) {
      window.clearTimeout(toastTimerRef.current);
    }
    toastTimerRef.current = window.setTimeout(() => {
      setToastState((prev) => ({ ...prev, open: false }));
    }, duration);
  }, []);

  const prepareRtcConfig = useCallback(async () => {
    rtcConfigRef.current = DEFAULT_RTC_CONFIG;
    if (!TURN_CREDENTIALS_URL) return;
    try {
      const response = await fetch(TURN_CREDENTIALS_URL, {
        method: 'GET',
        cache: 'no-store',
      });
      if (!response.ok) {
        throw new Error(`TURN credentials request failed (${response.status}).`);
      }
      const payload = await response.json();
      const dynamicIceServers = normalizeRtcIceServers(payload);
      if (!dynamicIceServers.length) {
        throw new Error('TURN credentials response did not include ICE servers.');
      }
      const relayAllowed = RELAY_REQUESTED && hasTurnIceServers(dynamicIceServers);
      rtcConfigRef.current = {
        iceServers: dynamicIceServers,
        iceTransportPolicy: relayAllowed ? 'relay' : 'all',
      };
      if (RELAY_REQUESTED && !relayAllowed) {
        appendError('TURN credentials did not include TURN relay URLs, using non-relay ICE policy.');
      }
    } catch (err) {
      appendError(`Unable to load TURN credentials API, falling back to static ICE config. ${err?.message || ''}`.trim());
    }
  }, [appendError]);

  useEffect(() => {
    if (!RELAY_REQUESTED || HAS_TURN_CONFIG) return;
    appendError(
      'VITE_FORCE_RELAY is enabled but TURN config is incomplete. Add VITE_TURN_URL(S), VITE_TURN_USERNAME and VITE_TURN_CREDENTIAL, or disable VITE_FORCE_RELAY.'
    );
  }, [appendError]);

  useEffect(() => () => {
    if (toastTimerRef.current) {
      window.clearTimeout(toastTimerRef.current);
      toastTimerRef.current = null;
    }
  }, []);

  const stopRecordingComposition = useCallback(() => {
    if (recordingCanvasRafRef.current) {
      window.cancelAnimationFrame(recordingCanvasRafRef.current);
      recordingCanvasRafRef.current = null;
    }
    recordingAudioNodesRef.current.forEach(({ source, gain }) => {
      try {
        source.disconnect();
      } catch {
        // no-op
      }
      try {
        gain.disconnect();
      } catch {
        // no-op
      }
    });
    recordingAudioNodesRef.current = [];
    recordingAudioTrackIdsRef.current.clear();

    if (recordingAudioContextRef.current) {
      try {
        recordingAudioContextRef.current.close();
      } catch {
        // no-op
      }
      recordingAudioContextRef.current = null;
    }
    recordingAudioDestinationRef.current = null;

    const mixedStream = recordingMixedStreamRef.current;
    if (mixedStream) {
      mixedStream.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch {
          // no-op
        }
      });
      recordingMixedStreamRef.current = null;
    }
    recordingCanvasRef.current = null;
  }, []);

  const attachStreamAudioToRecording = useCallback((stream) => {
    const context = recordingAudioContextRef.current;
    const destination = recordingAudioDestinationRef.current;
    if (!context || !destination || !stream) return;

    stream.getAudioTracks().forEach((track) => {
      if (!track || track.readyState !== 'live') return;
      if (recordingAudioTrackIdsRef.current.has(track.id)) return;
      try {
        const trackStream = new MediaStream([track]);
        const source = context.createMediaStreamSource(trackStream);
        const gain = context.createGain();
        gain.gain.value = 1;
        source.connect(gain);
        gain.connect(destination);
        recordingAudioNodesRef.current.push({ source, gain });
        recordingAudioTrackIdsRef.current.add(track.id);
      } catch {
        // no-op
      }
    });
  }, []);

  const createMixedRecordingStream = useCallback(() => {
    const localStream = localStreamRef.current;
    if (!localStream) return null;
    const mixedStream = new MediaStream();

    const canvas = document.createElement('canvas');
    canvas.width = 1280;
    canvas.height = 720;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    recordingCanvasRef.current = canvas;

    const drawFrame = () => {
      const width = canvas.width;
      const height = canvas.height;
      const panelWidth = Math.floor(width / 2);
      const localVideo = localVideoRef.current;
      const remoteVideo = remoteVideoRef.current;
      const canDrawLocal = Boolean(localVideo && localVideo.readyState >= 2);
      const canDrawRemote = Boolean(remoteVideo && remoteVideo.readyState >= 2);

      ctx.fillStyle = '#111827';
      ctx.fillRect(0, 0, width, height);

      if (canDrawLocal && canDrawRemote) {
        ctx.drawImage(remoteVideo, 0, 0, panelWidth, height);
        ctx.drawImage(localVideo, panelWidth, 0, panelWidth, height);
      } else if (canDrawLocal) {
        ctx.drawImage(localVideo, 0, 0, width, height);
      } else if (canDrawRemote) {
        ctx.drawImage(remoteVideo, 0, 0, width, height);
      } else {
        ctx.fillStyle = '#6b7280';
        ctx.font = 'bold 42px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('Recording Meeting...', width / 2, height / 2);
      }

      recordingCanvasRafRef.current = window.requestAnimationFrame(drawFrame);
    };
    drawFrame();

    const canvasStream = canvas.captureStream(15);
    const canvasTrack = canvasStream.getVideoTracks()[0];
    if (canvasTrack) {
      mixedStream.addTrack(canvasTrack);
    }

    try {
      const AudioContextCtor = window.AudioContext || window.webkitAudioContext;
      if (AudioContextCtor) {
        const audioContext = new AudioContextCtor();
        const audioDestination = audioContext.createMediaStreamDestination();
        recordingAudioContextRef.current = audioContext;
        recordingAudioDestinationRef.current = audioDestination;
        try {
          audioContext.resume();
        } catch {
          // no-op
        }
        attachStreamAudioToRecording(localStream);
        attachStreamAudioToRecording(remoteStreamRef.current);
        audioDestination.stream.getAudioTracks().forEach((track) => mixedStream.addTrack(track));
      }
    } catch {
      // no-op
    }

    recordingMixedStreamRef.current = mixedStream;
    return mixedStream;
  }, [attachStreamAudioToRecording]);

  const detachRemoteStreamStateListeners = useCallback(() => {
    if (remoteStreamStateCleanupRef.current) {
      remoteStreamStateCleanupRef.current();
      remoteStreamStateCleanupRef.current = null;
    }
  }, []);

  const syncRemoteMediaState = useCallback((stream) => {
    if (!stream) {
      setRemoteMicEnabled(null);
      setRemoteCameraEnabled(null);
      return;
    }
    const hasLiveAudio = stream
      .getAudioTracks()
      .some((track) => track.readyState === 'live' && !track.muted);
    const hasLiveVideo = stream
      .getVideoTracks()
      .some((track) => track.readyState === 'live' && !track.muted);
    const signalState = remoteMediaSignalRef.current || {};
    setRemoteMicEnabled(
      typeof signalState.micEnabled === 'boolean' ? signalState.micEnabled : hasLiveAudio
    );
    setRemoteCameraEnabled(
      typeof signalState.cameraEnabled === 'boolean' ? signalState.cameraEnabled : hasLiveVideo
    );
  }, []);

  const attachRemoteStreamStateListeners = useCallback(
    (stream) => {
      detachRemoteStreamStateListeners();
      if (!stream) {
        setRemoteMicEnabled(null);
        setRemoteCameraEnabled(null);
        return;
      }

      const listeners = [];
      const bindTrack = (track) => {
        if (!track || typeof track.addEventListener !== 'function') return;
        const handleTrackState = () => syncRemoteMediaState(stream);
        track.addEventListener('mute', handleTrackState);
        track.addEventListener('unmute', handleTrackState);
        track.addEventListener('ended', handleTrackState);
        listeners.push({ track, handleTrackState });
      };

      stream.getTracks().forEach(bindTrack);

      const handleAddTrack = (event) => {
        bindTrack(event?.track);
        syncRemoteMediaState(stream);
      };
      const handleRemoveTrack = () => {
        syncRemoteMediaState(stream);
      };

      if (typeof stream.addEventListener === 'function') {
        stream.addEventListener('addtrack', handleAddTrack);
        stream.addEventListener('removetrack', handleRemoveTrack);
      }

      syncRemoteMediaState(stream);

      remoteStreamStateCleanupRef.current = () => {
        listeners.forEach(({ track, handleTrackState }) => {
          try {
            track.removeEventListener('mute', handleTrackState);
            track.removeEventListener('unmute', handleTrackState);
            track.removeEventListener('ended', handleTrackState);
          } catch {
            // no-op
          }
        });
        if (typeof stream.removeEventListener === 'function') {
          stream.removeEventListener('addtrack', handleAddTrack);
          stream.removeEventListener('removetrack', handleRemoveTrack);
        }
      };
    },
    [detachRemoteStreamStateListeners, syncRemoteMediaState]
  );

  const stopMediaTracks = useCallback(() => {
    detachRemoteStreamStateListeners();
    stopRecordingComposition();
    remoteMediaSignalRef.current = { micEnabled: null, cameraEnabled: null };
    remoteStreamRef.current = null;
    cameraTracksRef.current.forEach((track) => {
      try {
        track.stop();
      } catch {
        // no-op
      }
    });
    cameraTracksRef.current.clear();
    if (placeholderVideoTrackRef.current) {
      try {
        placeholderVideoTrackRef.current.stop();
      } catch {
        // no-op
      }
      placeholderVideoTrackRef.current = null;
    }
    const localStream = localStreamRef.current;
    if (localStream) {
      localStream.getTracks().forEach((track) => track.stop());
      localStreamRef.current = null;
    }
    if (localVideoRef.current) {
      localVideoRef.current.srcObject = null;
    }
    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = null;
    }
    setRemoteMicEnabled(null);
    setRemoteCameraEnabled(null);
  }, [detachRemoteStreamStateListeners, stopRecordingComposition]);

  const stopSpeechMonitoring = useCallback(async () => {
    autoMonitoringRef.current = false;
    speechRestartDelayRef.current = 550;
    if (speechRestartTimerRef.current) {
      window.clearTimeout(speechRestartTimerRef.current);
      speechRestartTimerRef.current = null;
    }
    const recognition = recognitionRef.current;
    if (recognition) {
      try {
        recognition.onend = null;
        recognition.onerror = null;
        recognition.onresult = null;
        recognition.stop();
      } catch {
        // no-op
      }
      recognitionRef.current = null;
    }
    setMonitoring(false);
    setMonitoringStatus(false);
    lastSpeechModerationRef.current = { text: '', at: 0 };
    lastInterimFeedAtRef.current = 0;
    setLiveInterimTranscript('');
    if (isMentorToolsEnabled && sessionId) {
      const recordingActive = Boolean(recorderRef.current && recorderRef.current.state !== 'inactive');
      try {
        await api.updateSessionRecording(sessionId, {
          status: recordingActive ? 'recording' : 'stopped',
          metadata: {
            [monitoringMetadataKey]: false,
          },
        });
      } catch {
        // no-op
      }
    }
  }, [api, isMentorToolsEnabled, monitoringMetadataKey, sessionId]);

  const closePeerConnection = useCallback(() => {
    detachRemoteStreamStateListeners();
    const peer = peerConnectionRef.current;
    if (peer) {
      try {
        peer.ontrack = null;
        peer.onicecandidate = null;
        peer.onconnectionstatechange = null;
        peer.close();
      } catch {
        // no-op
      }
      peerConnectionRef.current = null;
      senderRef.current = { audio: null, video: null };
    }
    setConnectionState('closed');
  }, [detachRemoteStreamStateListeners]);

  const stopPolling = useCallback(() => {
    if (pollIntervalRef.current) {
      window.clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
  }, []);

  const stopReconnectLoop = useCallback(() => {
    if (reconnectIntervalRef.current) {
      window.clearInterval(reconnectIntervalRef.current);
      reconnectIntervalRef.current = null;
    }
  }, []);

  const stopRecordingStatusPolling = useCallback(() => {
    if (recordingStatusPollIntervalRef.current) {
      window.clearInterval(recordingStatusPollIntervalRef.current);
      recordingStatusPollIntervalRef.current = null;
    }
  }, []);

  const applyRecordingSnapshot = useCallback(
    (payload) => {
      const nextStatus = String(payload?.status || 'not_started').toLowerCase();
      const metadata = payload?.metadata && typeof payload.metadata === 'object' ? payload.metadata : {};
      setRecordingStatus(nextStatus);
      const roleMonitoring = metadata?.[monitoringMetadataKey];
      if (!autoMonitoringRef.current && !recognitionRef.current && typeof roleMonitoring === 'boolean') {
        setMonitoringStatus(roleMonitoring);
      }
      if (participantRole === 'mentor') {
        setRecording(nextStatus === 'recording');
      }
      const savedSummary = String(metadata.meeting_summary || '').trim();
      if (savedSummary) {
        setMeetingSummary(savedSummary);
      }
    },
    [monitoringMetadataKey, participantRole]
  );

  const pollRecordingStatus = useCallback(async () => {
    if (!sessionId || typeof api.getSessionRecording !== 'function') return;
    try {
      const response = await api.getSessionRecording(sessionId);
      applyRecordingSnapshot(response);
    } catch {
      // no-op: recording status sync should not interrupt the meeting flow.
    }
  }, [api, applyRecordingSnapshot, sessionId]);

  const generateAbuseEventSummary = useCallback(
    async (transcriptHint = '') => {
      if (!isMentorToolsEnabled || !sessionId) return;
      const now = Date.now();
      if (abuseSummaryBusyRef.current) return;
      if (now - lastAbuseSummaryAtRef.current < ABUSE_SUMMARY_DEDUP_MS) return;
      const transcript = String(transcriptHint || '').trim();
      if (!transcript) return;

      abuseSummaryBusyRef.current = true;
      lastAbuseSummaryAtRef.current = now;
      try {
        const response = await api.analyzeSessionTranscript(sessionId, {
          transcript,
          speaker_role: 'system',
          generate_summary: true,
        });
        const nextSummary = String(response?.summary || '').trim();
        if (nextSummary) {
          setMeetingSummary(nextSummary);
        }
        await pollRecordingStatus();
      } catch (err) {
        appendError(err?.message || 'Unable to update abuse summary.');
      } finally {
        abuseSummaryBusyRef.current = false;
      }
    },
    [api, appendError, isMentorToolsEnabled, pollRecordingStatus, sessionId]
  );

  const startRecordingStatusPolling = useCallback(() => {
    if (recordingStatusPollIntervalRef.current) return;
    pollRecordingStatus();
    recordingStatusPollIntervalRef.current = window.setInterval(() => {
      pollRecordingStatus();
    }, 2000);
  }, [pollRecordingStatus]);

  const uploadRecordingToCloudinary = useCallback(async (file, sessionIdValue) => {
    if (!file) return null;

    const normalizeUploadResponse = (payload) => ({
      secureUrl: String(payload?.secure_url || payload?.url || '').trim(),
      publicId: String(payload?.public_id || '').trim(),
      bytes: Number(payload?.bytes || 0),
    });

    if (typeof api.getSessionRecordingUploadSignature === 'function' && sessionIdValue) {
      const signaturePayload = await api.getSessionRecordingUploadSignature(sessionIdValue, {});
      const uploadUrl = String(signaturePayload?.upload_url || '').trim();
      const apiKey = String(signaturePayload?.api_key || '').trim();
      const timestamp = String(signaturePayload?.timestamp || '').trim();
      const signature = String(signaturePayload?.signature || '').trim();
      const folder = String(signaturePayload?.folder || '').trim();
      const publicId = String(signaturePayload?.public_id || '').trim();

      if (uploadUrl && apiKey && timestamp && signature) {
        const signedForm = new FormData();
        signedForm.append('file', file);
        signedForm.append('api_key', apiKey);
        signedForm.append('timestamp', timestamp);
        signedForm.append('signature', signature);
        if (folder) signedForm.append('folder', folder);
        if (publicId) signedForm.append('public_id', publicId);

        const signedResponse = await fetch(uploadUrl, {
          method: 'POST',
          body: signedForm,
        });
        const signedPayload = await signedResponse.json().catch(() => ({}));
        if (!signedResponse.ok) {
          const message =
            String(signedPayload?.error?.message || signedPayload?.message || '').trim() ||
            'Cloud storage upload failed.';
          throw new Error(message);
        }
        return normalizeUploadResponse(signedPayload);
      }
    }

    if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_UPLOAD_PRESET) return null;

    const endpoint = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/video/upload`;
    const cloudinaryForm = new FormData();
    cloudinaryForm.append('file', file);
    cloudinaryForm.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
    cloudinaryForm.append('folder', CLOUDINARY_UPLOAD_FOLDER);
    if (sessionIdValue) {
      cloudinaryForm.append('public_id', `session-${sessionIdValue}-${Date.now()}`);
    }

    const response = await fetch(endpoint, {
      method: 'POST',
      body: cloudinaryForm,
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      const message =
        String(payload?.error?.message || payload?.message || '').trim() ||
        'Cloud storage upload failed.';
      throw new Error(message);
    }
    return normalizeUploadResponse(payload);
  }, [api]);

  const sendSignal = useCallback(
    async (signalType, payload) => {
      if (!sessionId) return;
      await api.sendSessionMeetingSignal(sessionId, {
        signal_type: signalType,
        payload: normalizeSignalPayload(payload),
      });
    },
    [api, sessionId]
  );

  const markSessionClosed = useCallback(async () => {
    if (!sessionId) return;
    if (sessionClosedSyncRef.current) return;
    if (typeof api.updateSession !== 'function') return;

    sessionClosedSyncRef.current = true;
    try {
      await api.updateSession(sessionId, { status: 'completed' });
    } catch {
      sessionClosedSyncRef.current = false;
    }
  }, [api, sessionId]);

  const publishLocalMediaState = useCallback(
    async (nextMicEnabled, nextCameraEnabled) => {
      if (!sessionId) return;
      try {
        await sendSignal('media_state', {
          mic_enabled: Boolean(nextMicEnabled),
          camera_enabled: Boolean(nextCameraEnabled),
        });
      } catch (err) {
        appendError(err?.message || 'Unable to share media state.');
      }
    },
    [appendError, sendSignal, sessionId]
  );

  const _createPlaceholderVideoTrack = useCallback(() => {
    if (typeof document === 'undefined') return null;
    const canvas = document.createElement('canvas');
    canvas.width = 16;
    canvas.height = 16;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
    const stream = canvas.captureStream(1);
    return stream.getVideoTracks()[0] || null;
  }, []);

  const captureVideoFrameDataUrl = useCallback((videoElement) => {
    if (!videoElement || typeof document === 'undefined') return '';
    const sourceWidth = Number(videoElement.videoWidth || 0);
    const sourceHeight = Number(videoElement.videoHeight || 0);
    if (!sourceWidth || !sourceHeight) return '';

    const maxWidth = 640;
    const scale = Math.min(1, maxWidth / sourceWidth);
    const targetWidth = Math.max(160, Math.round(sourceWidth * scale));
    const targetHeight = Math.max(90, Math.round(sourceHeight * scale));

    const canvas = document.createElement('canvas');
    canvas.width = targetWidth;
    canvas.height = targetHeight;
    const context = canvas.getContext('2d', { alpha: false });
    if (!context) return '';
    context.drawImage(videoElement, 0, 0, targetWidth, targetHeight);
    try {
      return canvas.toDataURL('image/jpeg', 0.68);
    } catch {
      return '';
    }
  }, []);

  const loadIncidents = useCallback(async () => {
    if (!sessionId) return;
    try {
      const response = await api.listSessionAbuseIncidents(sessionId);
      setIncidents(toArray(response));
    } catch (err) {
      appendError(err?.message || 'Unable to load abuse incidents.');
    }
  }, [api, appendError, sessionId]);

  const analyzeTranscript = useCallback(
    async (transcriptValue, { silent = false } = {}) => {
      const text = String(transcriptValue || '').trim();
      if (!sessionId || !text) return;
      const localMatches = detectLocalAbusiveTerms(text);
      const localSeverity = severityFromMatchCount(localMatches.length);
      let response = null;

      if (!silent) {
        setAnalysisLoading(true);
      }

      // Show toast IMMEDIATELY for local matches — do NOT wait for API
      if (localMatches.length > 0) {
        console.log('[MeetingRoomShell] Local bad words detected:', localMatches);
        const now = Date.now();
        if (now - lastLocalAbuseToastRef.current > ABUSE_TOAST_DEDUP_MS) {
          lastLocalAbuseToastRef.current = now;
          showToast(
            buildLanguageAlertMessage(participantRole, participantRole),
            'error'
          );
        }

        if (isMentorToolsEnabled) {
          setAlert({
            flagged: true,
            speaker_role: participantRole,
            severity: localSeverity,
            matched_terms: localMatches,
            confidence_score: Math.min(0.98, 0.58 + localMatches.length * 0.14),
            incident_type: 'verbal_abuse',
            recommended_action:
              localSeverity === 'high'
                ? 'terminate_session'
                : localSeverity === 'medium'
                  ? 'escalate_review'
                  : 'warn',
          });
        }

        try {
          const viewerRole = participantRole === 'mentor' ? 'mentee' : 'mentor';
          sendSignal('safety_alert', {
            alert_kind: 'language',
            speaker_role: participantRole,
            severity: localSeverity || 'low',
            matched_terms: localMatches,
            message: buildLanguageAlertMessage(participantRole, viewerRole),
            transcript_excerpt: text.slice(0, 1200),
            incident_id: null,
            created_at: new Date().toISOString(),
          });
        } catch {
          // no-op
        }
      }

      // API call runs in background — not blocking the local toast above
      try {
        response = await api.analyzeSessionTranscript(sessionId, {
          transcript: text,
          speaker_role: participantRole,
        });
      } catch (err) {
        appendError(err?.message || 'Unable to analyze transcript.');
      }

      // Handle any additional server-side flags the API returns
      if (response?.flagged) {
        const resolvedSeverity = String(response?.severity || localSeverity || 'low').toLowerCase();
        const resolvedMatches = Array.isArray(response?.matched_terms)
          ? response.matched_terms
          : localMatches;

        if (localMatches.length === 0) {
          try {
            const viewerRole = participantRole === 'mentor' ? 'mentee' : 'mentor';
            sendSignal('safety_alert', {
              alert_kind: 'language',
              speaker_role: participantRole,
              severity: resolvedSeverity || 'low',
              matched_terms: resolvedMatches,
              message: buildLanguageAlertMessage(participantRole, viewerRole),
              transcript_excerpt: text.slice(0, 1200),
              incident_id: response?.incident_id || null,
              created_at: new Date().toISOString(),
            });
          } catch {
            // no-op
          }
        }

        if (isMentorToolsEnabled) {
          setAlert(
            response || {
              flagged: true,
              speaker_role: participantRole,
              severity: resolvedSeverity,
              matched_terms: resolvedMatches,
              confidence_score: Math.min(0.98, 0.58 + resolvedMatches.length * 0.14),
              incident_type: 'verbal_abuse',
              recommended_action:
                resolvedSeverity === 'high'
                  ? 'terminate_session'
                  : resolvedSeverity === 'medium'
                    ? 'escalate_review'
                    : 'warn',
            }
          );
          await loadIncidents();
        }

        // Only show a second toast if there wasn't already a local match toast
        if (localMatches.length === 0) {
          const now = Date.now();
          if (now - lastLocalAbuseToastRef.current > ABUSE_TOAST_DEDUP_MS) {
            lastLocalAbuseToastRef.current = now;
            showToast(
              buildLanguageAlertMessage(participantRole, participantRole),
              'error'
            );
          }
        }
      }

      if (!silent) {
        setAnalysisLoading(false);
      }
    },
    [
      api,
      appendError,
      isMentorToolsEnabled,
      loadIncidents,
      participantRole,
      sendSignal,
      sessionId,
      showToast,
    ]
  );

  const runAutoVideoBehaviorScan = useCallback(async () => {
    if (!sessionId) return;
    if (typeof api?.analyzeSessionVideoFrame !== 'function') return;
    if (videoAnalysisBusyRef.current) return;

    const candidates = [];
    const localTrack = localStreamRef.current?.getVideoTracks?.()[0];
    if (cameraEnabled && localTrack && localTrack.readyState === 'live' && localTrack.enabled !== false) {
      candidates.push({
        speakerRole: participantRole,
        videoElement: localVideoRef.current,
        sourceLabel: 'local',
      });
    }

    const remoteTrack = remoteStreamRef.current?.getVideoTracks?.()[0];
    if (remoteCameraEnabled !== false && remoteTrack && remoteTrack.readyState === 'live' && remoteTrack.enabled !== false) {
      candidates.push({
        speakerRole: participantRole === 'mentor' ? 'mentee' : 'mentor',
        videoElement: remoteVideoRef.current,
        sourceLabel: 'remote',
      });
    }

    if (!candidates.length) return;

    videoAnalysisBusyRef.current = true;
    try {
      for (const candidate of candidates) {
        const frameDataUrl = captureVideoFrameDataUrl(candidate.videoElement);
        if (!frameDataUrl) continue;

        const speakerRole = candidate.speakerRole;
        const response = await api.analyzeSessionVideoFrame(sessionId, {
          speaker_role: speakerRole,
          frame_data_url: frameDataUrl,
          notes: `Realtime video safety scan from ${participantRole} client (${candidate.sourceLabel}).`,
        });
        if (!response?.flagged) continue;

        const incidentType = String(response?.incident_type || 'unknown').trim().toLowerCase() || 'unknown';
        const severity = String(response?.severity || 'medium').trim().toLowerCase() || 'medium';
        const recommendedAction =
          String(response?.recommended_action || 'warn').trim().toLowerCase() || 'warn';
        const incidentLabel = formatIncidentTypeLabel(incidentType);
        const alertKey = `${speakerRole}:${incidentType}`;
        const now = Date.now();
        const lastAlertAt = Number(lastVideoAlertByKeyRef.current[alertKey] || 0);
        if (now - lastAlertAt < AUTO_VIDEO_ALERT_DEDUP_MS) continue;
        lastVideoAlertByKeyRef.current[alertKey] = now;

        const fallbackMessage = `Alert: ${getParticipantDisplayRole(speakerRole)} showed ${incidentLabel}.`;
        const toastMessage =
          recommendedAction === 'terminate_session'
            ? `${fallbackMessage} Please end the session.`
            : recommendedAction === 'escalate_review'
              ? `${fallbackMessage} This has been escalated for review.`
              : fallbackMessage;
        showToast(toastMessage, severity === 'high' ? 'error' : 'warning', 6500);

        if (isMentorToolsEnabled && speakerRole === 'mentee') {
          setAlert({
            flagged: true,
            speaker_role: speakerRole,
            incident_type: incidentType,
            severity,
            recommended_action: recommendedAction,
            confidence_score: Number(response?.confidence_score || 0),
            matched_terms: Array.isArray(response?.matched_terms) ? response.matched_terms : [],
          });
          await loadIncidents();
          await generateAbuseEventSummary(`Video behavior alert detected: ${incidentLabel}.`);
          try {
            await api.updateSessionRecording(sessionId, {
              status: recordingStatus === 'recording' ? 'recording' : 'stopped',
              metadata: {
                abuse_detected: true,
                last_abuse_type: 'behavior',
                last_abuse_detected_at: new Date().toISOString(),
                last_abuse_incident_type: incidentType,
              },
            });
          } catch {
            // no-op
          }
        }

        try {
          await sendSignal('safety_alert', {
            alert_kind: 'behavior',
            speaker_role: speakerRole,
            incident_type: incidentType,
            severity,
            recommended_action: recommendedAction,
            message: toastMessage,
            incident_id: response?.incident_id || null,
            created_at: new Date().toISOString(),
          });
        } catch {
          // no-op
        }
        break;
      }
    } catch (err) {
      const now = Date.now();
      if (now - videoScanErrorAtRef.current > 15000) {
        videoScanErrorAtRef.current = now;
        appendError(err?.message || 'Unable to analyze video frame.');
      }
    } finally {
      videoAnalysisBusyRef.current = false;
    }
  }, [
    api,
    appendError,
    captureVideoFrameDataUrl,
    generateAbuseEventSummary,
    isMentorToolsEnabled,
    loadIncidents,
    participantRole,
    cameraEnabled,
    recordingStatus,
    remoteCameraEnabled,
    sendSignal,
    sessionId,
    showToast,
  ]);

  const attachLocalTracksToPeer = useCallback((peer) => {
    const stream = localStreamRef.current;
    if (!peer || !stream) return;

    const existingTrackIds = new Set(
      peer
        .getSenders()
        .map((sender) => sender?.track?.id)
        .filter(Boolean)
    );

    stream.getTracks().forEach((track) => {
      if (!track || existingTrackIds.has(track.id)) return;
      const sender = peer.addTrack(track, stream);
      if (track.kind === 'audio') senderRef.current.audio = sender;
      if (track.kind === 'video') {
        senderRef.current.video = sender;
        cameraTracksRef.current.add(track);
      }
    });
  }, []);

  const ensurePeerConnection = useCallback(() => {
    if (peerConnectionRef.current) {
      attachLocalTracksToPeer(peerConnectionRef.current);
      return peerConnectionRef.current;
    }

    const peer = new RTCPeerConnection(rtcConfigRef.current || DEFAULT_RTC_CONFIG);
    peer.onconnectionstatechange = () => {
      const nextState = peer.connectionState || 'connecting';
      setConnectionState(nextState);
      if (participantRole === 'mentor' && (nextState === 'failed' || nextState === 'disconnected')) {
        offerSentRef.current = false;
      }
    };
    peer.onicecandidate = async (event) => {
      if (!event.candidate) return;
      try {
        await sendSignal('ice', event.candidate);
      } catch (err) {
        appendError(err?.message || 'Unable to share ICE candidate.');
      }
    };
    peer.onicecandidateerror = (event) => {
      if (isIgnorableIceCandidateErrorEvent(event)) return;
      const host = String(event?.hostCandidate || '').trim();
      const code = event?.errorCode;
      const text = String(event?.errorText || '').trim();
      if (text || code) {
        appendError(
          `ICE candidate error${code ? ` (${code})` : ''}${host ? ` on ${host}` : ''}${text ? `: ${text}` : ''
          }`
        );
      }
    };
    peer.ontrack = (event) => {
      const [stream] = event.streams;
      if (!stream || !remoteVideoRef.current) return;
      remoteStreamRef.current = stream;
      remoteVideoRef.current.srcObject = stream;
      attachRemoteStreamStateListeners(stream);
      attachStreamAudioToRecording(stream);
    };
    attachLocalTracksToPeer(peer);
    peerConnectionRef.current = peer;
    return peer;
  }, [
    appendError,
    attachLocalTracksToPeer,
    attachRemoteStreamStateListeners,
    attachStreamAudioToRecording,
    participantRole,
    sendSignal,
  ]);

  const createOfferIfNeeded = useCallback(async ({ force = false, iceRestart = false } = {}) => {
    if (!sessionId || participantRole !== 'mentor') return;
    if (!force && offerSentRef.current) return;
    const peer = ensurePeerConnection();
    if (peer.signalingState !== 'stable') return;
    try {
      offerSentRef.current = true;
      const offer = await peer.createOffer(iceRestart ? { iceRestart: true } : undefined);
      await peer.setLocalDescription(offer);
      await sendSignal('offer', peer.localDescription || offer);
      setConnectionState('connecting');
    } catch (err) {
      offerSentRef.current = false;
      throw err;
    }
  }, [ensurePeerConnection, participantRole, sendSignal, sessionId]);

  const processSignals = useCallback(
    async (signals) => {
      if (!signals.length || !sessionId) return;
      const peer = ensurePeerConnection();
      for (const signal of signals) {
        lastSignalIdRef.current = Math.max(lastSignalIdRef.current, Number(signal.id) || 0);
        const signalType = String(signal?.signal_type || '').toLowerCase();
        const payload = signal?.payload || {};
        const signalSenderRole = normalizeParticipantRole(signal?.sender_role);
        try {
          if (signalType === 'offer') {
            // Ignore stale offers once signaling has moved away from stable.
            if (peer.signalingState !== 'stable') {
              continue;
            }
            const offerDescription = new RTCSessionDescription({
              type: 'offer',
              sdp: payload?.sdp || '',
            });
            await peer.setRemoteDescription(offerDescription);
            if (peer.signalingState !== 'have-remote-offer') {
              continue;
            }
            const answer = await peer.createAnswer();
            await peer.setLocalDescription(answer);
            await sendSignal('answer', peer.localDescription || answer);
            continue;
          }
          if (signalType === 'answer') {
            // Valid only while we are waiting for remote answer.
            if (peer.signalingState !== 'have-local-offer') {
              continue;
            }
            if (peer.currentRemoteDescription?.type === 'answer') {
              continue;
            }
            const answerDescription = new RTCSessionDescription({
              type: 'answer',
              sdp: payload?.sdp || '',
            });
            await peer.setRemoteDescription(answerDescription);
            offerSentRef.current = false;
            continue;
          }
          if (signalType === 'ice') {
            try {
              await peer.addIceCandidate(new RTCIceCandidate(payload));
            } catch {
              // Ignore stale ICE candidates.
            }
            continue;
          }
          if (signalType === 'media_state') {
            const nextMic = typeof payload?.mic_enabled === 'boolean' ? payload.mic_enabled : null;
            const nextCamera = typeof payload?.camera_enabled === 'boolean' ? payload.camera_enabled : null;
            remoteMediaSignalRef.current = { micEnabled: nextMic, cameraEnabled: nextCamera };
            if (typeof nextMic === 'boolean') {
              setRemoteMicEnabled(nextMic);
            }
            if (typeof nextCamera === 'boolean') {
              setRemoteCameraEnabled(nextCamera);
            }
            continue;
          }
          if (signalType === 'transcript') {
            const payloadSpeakerRole = normalizeParticipantRole(payload?.speaker_role);
            const speakerRole = signalSenderRole || payloadSpeakerRole;
            const transcriptExcerpt = String(
              payload?.transcript_excerpt || payload?.transcript || payload?.text || ''
            ).trim();
            if (transcriptExcerpt && speakerRole && speakerRole !== participantRole) {
              appendMonitoringTranscript(transcriptExcerpt, speakerRole);
              appendRoleTranscriptSegment(speakerRole, transcriptExcerpt);
              transcriptSegmentsRef.current.push(transcriptExcerpt);
              setAnalysisInput((prev) => [prev, transcriptExcerpt].filter(Boolean).join(' '));
            }
            continue;
          }
          if (signalType === 'transcript_bundle') {
            const payloadSpeakerRole = normalizeParticipantRole(payload?.speaker_role);
            const speakerRole = signalSenderRole || payloadSpeakerRole;
            if (!speakerRole || speakerRole === participantRole) continue;
            const segments = Array.isArray(payload?.segments) ? payload.segments : [];
            segments
              .map((item) => String(item || '').replace(/\s+/g, ' ').trim())
              .filter(Boolean)
              .forEach((segment) => {
                appendRoleTranscriptSegment(speakerRole, segment);
              });
            continue;
          }
          if (signalType === 'safety_alert') {
            const speakerRole = String(payload?.speaker_role || '').trim().toLowerCase();
            const alertKind = String(payload?.alert_kind || 'language').trim().toLowerCase();
            const transcriptExcerpt = String(payload?.transcript_excerpt || '').trim();
            if (transcriptExcerpt && speakerRole && speakerRole !== participantRole) {
              appendMonitoringTranscript(transcriptExcerpt, speakerRole);
            }
            if (alertKind === 'behavior') {
              const incidentType = String(payload?.incident_type || 'unknown').trim().toLowerCase();
              const severity = String(payload?.severity || 'medium').trim().toLowerCase();
              const fallbackMessage = `Alert: ${getParticipantDisplayRole(
                speakerRole
              )} showed ${formatIncidentTypeLabel(incidentType)}.`;
              const message = String(payload?.message || '').trim() || fallbackMessage;
              const now = Date.now();
              const dedupeKey = `remote:${speakerRole}:${incidentType}`;
              const lastAlertAt = Number(lastVideoAlertByKeyRef.current[dedupeKey] || 0);
              if (now - lastAlertAt > ABUSE_TOAST_DEDUP_MS) {
                lastVideoAlertByKeyRef.current[dedupeKey] = now;
                showToast(message, severity === 'high' ? 'error' : 'warning', 6500);
              }
              if (participantRole === 'mentor' && speakerRole === 'mentee') {
                generateAbuseEventSummary(
                  `Video behavior alert: ${formatIncidentTypeLabel(incidentType)}.`
                );
              }
              continue;
            }
            if (speakerRole && speakerRole !== participantRole) {
              const now = Date.now();
              if (now - lastRemoteAbuseToastRef.current > ABUSE_TOAST_DEDUP_MS) {
                lastRemoteAbuseToastRef.current = now;
                showToast(
                  String(payload?.message || '').trim() ||
                  buildLanguageAlertMessage(speakerRole, participantRole),
                  'error'
                );
              }
            }
            if (participantRole === 'mentor' && speakerRole === 'mentee') {
              if (transcriptExcerpt) {
                generateAbuseEventSummary(transcriptExcerpt);
              }
            }
            continue;
          }
          if (signalType === 'bye') {
            // Ignore stale bye signals from previous attempts before signaling starts.
            if (!peer.currentRemoteDescription && peer.signalingState === 'stable') {
              continue;
            }
            // Remote explicitly left the meeting; end the session for both participants.
            setRemoteEnded(true);
          }
        } catch (err) {
          appendError(err?.message || 'Unable to process meeting signal.');
        }
      }
    },
    [
      appendMonitoringTranscript,
      appendRoleTranscriptSegment,
      appendError,
      ensurePeerConnection,
      generateAbuseEventSummary,
      participantRole,
      showToast,
      sendSignal,
      sessionId,
    ]
  );

  const pollSignals = useCallback(async () => {
    if (!sessionId) return;
    try {
      const response = await api.listSessionMeetingSignals(sessionId, {
        after_id: lastSignalIdRef.current,
      });
      const rows = toArray(response);
      await processSignals(rows);
    } catch (err) {
      appendError(err?.message || 'Unable to receive meeting signals.');
    }
  }, [api, appendError, processSignals, sessionId]);

  const startPolling = useCallback(() => {
    if (pollIntervalRef.current) return;
    pollIntervalRef.current = window.setInterval(() => {
      pollSignals();
    }, 1200);
  }, [pollSignals]);

  const initializeLocalMedia = useCallback(async () => {
    if (!navigator?.mediaDevices?.getUserMedia) {
      throw new Error('This browser does not support camera/microphone access.');
    }
    const stream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      },
    });
    localStreamRef.current = stream;
    if (localVideoRef.current) {
      localVideoRef.current.srcObject = stream;
    }

    const peer = ensurePeerConnection();
    attachLocalTracksToPeer(peer);
    await publishLocalMediaState(true, true);
    return stream;
  }, [attachLocalTracksToPeer, ensurePeerConnection, publishLocalMediaState]);

  const startSpeechMonitoring = useCallback(async () => {
    if (!canSpeechModeration) return;
    if (!hasSpeechRecognition) return;
    if (!micEnabled) return;
    const SpeechRecognitionCtor = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognitionCtor) return;

    autoMonitoringRef.current = true;

    const scheduleRestart = (delayMs = 700) => {
      if (typeof window === 'undefined') return;
      if (!autoMonitoringRef.current) return;
      if (speechRestartTimerRef.current) {
        window.clearTimeout(speechRestartTimerRef.current);
      }
      const nextDelay = Math.min(Math.max(delayMs, 500), 2800);
      speechRestartDelayRef.current = nextDelay;
      speechRestartTimerRef.current = window.setTimeout(() => {
        speechRestartTimerRef.current = null;
        if (!autoMonitoringRef.current) return;
        const activeRecognition = recognitionRef.current;
        if (!activeRecognition) return;
        try {
          activeRecognition.start();
          setMonitoring(true);
          setMonitoringStatus(true);
          speechRestartDelayRef.current = 700;
        } catch (restartErr) {
          const restartCode = String(restartErr?.name || restartErr?.message || '').toLowerCase();
          if (restartCode.includes('invalidstate')) {
            setMonitoring(true);
            setMonitoringStatus(true);
            return;
          }
          if (
            restartCode.includes('not-allowed') ||
            restartCode.includes('service-not-allowed') ||
            restartCode.includes('notallowed')
          ) {
            autoMonitoringRef.current = false;
            recognitionRef.current = null;
            setMonitoring(false);
            setMonitoringStatus(false);
            showToast('Microphone speech monitoring permission is blocked.', 'warning', 6000);
            return;
          }
          scheduleRestart(Math.min(nextDelay + 300, 2800));
        }
      }, nextDelay);
    };

    const commitTranscript = (value, { broadcast = true, analyze = true } = {}) => {
      if (!micEnabledRef.current) return;
      const text = String(value || '').replace(/\s+/g, ' ').trim();
      if (!text) return;
      const now = Date.now();
      const previous = lastSpeechModerationRef.current;
      if (previous.text === text && now - previous.at < SPEECH_DUPLICATE_WINDOW_MS) {
        return;
      }
      lastSpeechModerationRef.current = { text, at: now };
      transcriptSegmentsRef.current.push(text);
      appendRoleTranscriptSegment(participantRole, text);
      appendMonitoringTranscript(text, 'local');
      setAnalysisInput((prev) => [prev, text].filter(Boolean).join(' '));
      if (broadcast) {
        Promise.resolve(
          sendSignal('transcript', {
            speaker_role: participantRole,
            transcript_excerpt: text.slice(0, 1200),
            created_at: new Date().toISOString(),
          })
        ).catch(() => {
          // no-op
        });
      }
      if (analyze) {
        analyzeTranscript(text, { silent: true });
      }
    };

    let recognition = recognitionRef.current;
    if (!recognition) {
      recognition = new SpeechRecognitionCtor();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.maxAlternatives = 1;
      recognition.lang = 'en-US';
      if ('profanityFilter' in recognition) {
        try {
          recognition.profanityFilter = false;
        } catch {
          // no-op
        }
      }

      recognition.onresult = (event) => {
        const rows = Array.from(event.results).slice(event.resultIndex);
        const finalTranscript = rows
          .filter((item) => item?.isFinal)
          .map((item) => String(item?.[0]?.transcript || '').trim())
          .filter(Boolean)
          .join(' ')
          .trim();
        const interimTranscript = rows
          .filter((item) => !item?.isFinal)
          .map((item) => String(item?.[0]?.transcript || '').trim())
          .filter(Boolean)
          .join(' ')
          .trim();

        setLiveInterimTranscript(interimTranscript);
        if (interimTranscript) {
          const now = Date.now();
          const wordCount = interimTranscript.split(/\s+/).filter(Boolean).length;
          if (wordCount >= 2 && now - lastInterimFeedAtRef.current > 900) {
            lastInterimFeedAtRef.current = now;
            appendMonitoringTranscript(interimTranscript, 'local');
          }
        }

        if (!finalTranscript) return;
        setLiveInterimTranscript('');
        commitTranscript(finalTranscript);
      };

      recognition.onstart = () => {
        speechRestartDelayRef.current = 700;
        if (speechRestartTimerRef.current) {
          window.clearTimeout(speechRestartTimerRef.current);
          speechRestartTimerRef.current = null;
        }
        setMonitoring(true);
        setMonitoringStatus(true);
      };

      recognition.onend = () => {
        setLiveInterimTranscript('');
        if (autoMonitoringRef.current) {
          setMonitoring(true);
          setMonitoringStatus(true);
          scheduleRestart(speechRestartDelayRef.current);
          return;
        }
        setMonitoring(false);
        setMonitoringStatus(false);
      };

      recognition.onerror = (event) => {
        const code = String(event?.error || '').trim().toLowerCase();
        if (code === 'not-allowed' || code === 'service-not-allowed') {
          autoMonitoringRef.current = false;
          setMonitoring(false);
          setMonitoringStatus(false);
          showToast('Microphone speech monitoring permission is blocked.', 'warning', 6000);
          return;
        }
        if (code) {
          appendError(`Speech monitoring error: ${code}`);
        }
        if (autoMonitoringRef.current) {
          setMonitoring(true);
          setMonitoringStatus(true);
          scheduleRestart(Math.min(speechRestartDelayRef.current + 300, 2800));
          return;
        }
        setMonitoring(false);
        setMonitoringStatus(false);
      };

      recognitionRef.current = recognition;
    }

    try {
      recognition.start();
      setMonitoring(true);
      setMonitoringStatus(true);
    } catch (err) {
      const code = String(err?.name || err?.message || '').toLowerCase();
      if (code.includes('invalidstate')) {
        setMonitoring(true);
        setMonitoringStatus(true);
      } else if (
        code.includes('not-allowed') ||
        code.includes('service-not-allowed') ||
        code.includes('notallowed')
      ) {
        autoMonitoringRef.current = false;
        setMonitoring(false);
        setMonitoringStatus(false);
        showToast('Microphone speech monitoring permission is blocked.', 'warning', 6000);
        return;
      } else {
        setMonitoring(true);
        setMonitoringStatus(true);
        scheduleRestart(Math.min(speechRestartDelayRef.current + 300, 2800));
        appendError(err?.message || 'Unable to start speech monitoring. Retrying...');
        return;
      }
    }

    if (sessionId && isMentorToolsEnabled) {
      const recordingActive = Boolean(recorderRef.current && recorderRef.current.state !== 'inactive');
      try {
        await api.updateSessionRecording(sessionId, {
          status: recordingActive ? 'recording' : 'not_started',
          metadata: {
            [monitoringMetadataKey]: true,
          },
        });
      } catch {
        // no-op
      }
    }
  }, [
    analyzeTranscript,
    api,
    appendMonitoringTranscript,
    appendRoleTranscriptSegment,
    appendError,
    canSpeechModeration,
    hasSpeechRecognition,
    isMentorToolsEnabled,
    micEnabled,
    monitoringMetadataKey,
    participantRole,
    sessionId,
    sendSignal,
    showToast,
  ]);

  const stopRecording = useCallback(async () => {
    const recorder = recorderRef.current;
    const hadActiveRecorder = Boolean(recorder && recorder.state !== 'inactive');
    if (hadActiveRecorder) {
      recorder.stop();
    } else {
      stopRecordingComposition();
    }
    recorderRef.current = null;
    setRecording(false);
    setRecordingStatus('stopped');
    if (isMentorToolsEnabled && sessionId && hadActiveRecorder) {
      const monitoringActive = Boolean(autoMonitoringRef.current);
      try {
        await api.updateSessionRecording(sessionId, {
          status: 'stopped',
          metadata: {
            recording_started: false,
            [monitoringMetadataKey]: monitoringActive,
          },
        });
      } catch (err) {
        appendError(err?.message || 'Unable to update recording status.');
      }
    }
  }, [api, appendError, isMentorToolsEnabled, monitoringMetadataKey, sessionId, stopRecordingComposition]);

  const startRecording = useCallback(async () => {
    if (!isMentorToolsEnabled) return;
    const localStream = localStreamRef.current;
    if (!localStream) {
      appendError('Local media stream is not ready for recording.');
      return;
    }
    if (typeof MediaRecorder === 'undefined') {
      appendError('MediaRecorder is not available in this browser.');
      return;
    }
    try {
      const stream = createMixedRecordingStream();
      if (!stream || !stream.getTracks().length) {
        appendError('Unable to build mixed recording stream.');
        return;
      }
      const recorder = new MediaRecorder(stream);
      recordingChunksRef.current = [];
      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          recordingChunksRef.current.push(event.data);
        }
      };
      recorder.onstop = async () => {
        const chunks = recordingChunksRef.current;
        try {
          if (!chunks.length || !sessionId) return;
          const blob = new Blob(chunks, { type: recorder.mimeType || 'video/webm' });
          const monitoringActive = Boolean(autoMonitoringRef.current);
          const file = new File([blob], `session-${sessionId}-${Date.now()}.webm`, {
            type: recorder.mimeType || 'video/webm',
          });
          const metadataBase = {
            mime_type: recorder.mimeType || 'video/webm',
            recording_started: false,
            [monitoringMetadataKey]: monitoringActive,
          };
          let persisted = false;

          if (
            typeof api.getSessionRecordingUploadSignature === 'function' ||
            (CLOUDINARY_CLOUD_NAME && CLOUDINARY_UPLOAD_PRESET)
          ) {
            try {
              const cloudUpload = await uploadRecordingToCloudinary(file, sessionId);
              if (cloudUpload?.secureUrl) {
                await api.updateSessionRecording(sessionId, {
                  status: 'uploaded',
                  file_size_bytes: String(blob.size),
                  recording_url: cloudUpload.secureUrl,
                  storage_key: cloudUpload.publicId || '',
                  metadata: {
                    ...metadataBase,
                    storage_provider: 'cloudinary',
                    storage_mode: 'direct_upload',
                  },
                });
                persisted = true;
              }
            } catch (err) {
              appendError(err?.message || 'Unable to upload recording to cloud storage.');
            }
          }

          if (!persisted && blob.size > SERVERLESS_MAX_UPLOAD_BYTES) {
            try {
              await api.updateSessionRecording(sessionId, {
                status: 'failed',
                file_size_bytes: String(blob.size),
                metadata: {
                  ...metadataBase,
                  upload_skipped_reason: 'payload_too_large_for_serverless',
                  max_serverless_upload_bytes: SERVERLESS_MAX_UPLOAD_BYTES,
                },
              });
            } catch {
              // no-op
            }
            appendError(
              'Recording is too large for serverless upload. Configure backend Cloudinary signing or frontend Cloudinary upload env vars.'
            );
            persisted = true;
          }

          if (!persisted) {
            const formData = new FormData();
            formData.append('status', 'uploaded');
            formData.append('file_size_bytes', String(blob.size));
            formData.append('recording_file', file);
            formData.append('metadata', JSON.stringify(metadataBase));
            try {
              await api.updateSessionRecording(sessionId, formData);
            } catch (err) {
              if (err?.status === 413) {
                try {
                  await api.updateSessionRecording(sessionId, {
                    status: 'failed',
                    file_size_bytes: String(blob.size),
                    metadata: {
                      ...metadataBase,
                      upload_skipped_reason: 'payload_too_large_for_serverless',
                      max_serverless_upload_bytes: SERVERLESS_MAX_UPLOAD_BYTES,
                    },
                  });
                } catch {
                  // no-op
                }
                appendError(
                  'Recording upload exceeded deployment size limits. Configure Cloudinary direct upload.'
                );
              } else {
                throw err;
              }
            }
          }
        } catch (err) {
          appendError(err?.message || 'Unable to persist recording metadata.');
        } finally {
          stopRecordingComposition();
        }
      };
      recorder.start(1000);
      recorderRef.current = recorder;
      setRecording(true);
      setRecordingStatus('recording');
      if (sessionId) {
        const monitoringActive = Boolean(autoMonitoringRef.current);
        await api.updateSessionRecording(sessionId, {
          status: 'recording',
          metadata: {
            role: participantRole,
            source: 'browser_media_recorder',
            recording_started: true,
            [monitoringMetadataKey]: monitoringActive,
          },
        });
      }
    } catch (err) {
      stopRecordingComposition();
      appendError(err?.message || 'Unable to start recording.');
    }
  }, [
    api,
    appendError,
    createMixedRecordingStream,
    isMentorToolsEnabled,
    monitoringMetadataKey,
    participantRole,
    sessionId,
    stopRecordingComposition,
    uploadRecordingToCloudinary,
  ]);

  const generateMeetingSummary = useCallback(async () => {
    if (!isMentorToolsEnabled || !sessionId) return;
    if (summaryRequestedRef.current) return;
    const roleBuckets = roleTranscriptSegmentsRef.current || { mentor: [], mentee: [] };
    const menteeTranscript = Array.isArray(roleBuckets.mentee)
      ? roleBuckets.mentee.join(' ').trim()
      : '';
    const mentorTranscript = Array.isArray(roleBuckets.mentor)
      ? roleBuckets.mentor.join(' ').trim()
      : '';
    const transcriptFromRoles = [
      menteeTranscript ? `Mentee: ${menteeTranscript}` : '',
      mentorTranscript ? `Mentor: ${mentorTranscript}` : '',
    ]
      .filter(Boolean)
      .join('\n\n')
      .trim();
    const transcriptFromSegments = transcriptSegmentsRef.current.join(' ').trim();
    const transcriptFromInput = String(analysisInput || '').trim();
    const transcriptFromFeed = monitoringFeed
      .slice()
      .reverse()
      .map((entry) => String(entry?.text || '').trim())
      .filter(Boolean)
      .join(' ')
      .trim();
    const transcript =
      transcriptFromRoles || transcriptFromSegments || transcriptFromInput || transcriptFromFeed;
    if (!transcript) return;

    summaryRequestedRef.current = true;
    setSummaryLoading(true);
    try {
      const response = await api.analyzeSessionTranscript(sessionId, {
        transcript,
        speaker_role: 'system',
        generate_summary: true,
      });
      const nextSummary = String(response?.summary || '').trim();
      if (nextSummary) {
        setMeetingSummary(nextSummary);
      }
      if (response?.summary_error) {
        appendError(response.summary_error);
      }
      await pollRecordingStatus();
    } catch (err) {
      appendError(err?.message || 'Unable to generate meeting summary.');
    } finally {
      setSummaryLoading(false);
    }
  }, [analysisInput, api, appendError, isMentorToolsEnabled, monitoringFeed, pollRecordingStatus, sessionId]);

  const sendLocalTranscriptBundle = useCallback(async () => {
    if (!sessionId) return;
    const role = String(participantRole || '').trim().toLowerCase();
    if (role !== 'mentor' && role !== 'mentee') return;
    const roleSegments = roleTranscriptSegmentsRef.current?.[role];
    if (!Array.isArray(roleSegments) || !roleSegments.length) return;
    const segments = roleSegments
      .map((item) => String(item || '').replace(/\s+/g, ' ').trim())
      .filter(Boolean)
      .slice(-200);
    if (!segments.length) return;
    await sendSignal('transcript_bundle', {
      speaker_role: role,
      segments,
      created_at: new Date().toISOString(),
    });
  }, [participantRole, sendSignal, sessionId]);

  const toggleMic = useCallback(async () => {
    const stream = localStreamRef.current;
    if (!stream) return;
    const nextEnabled = !micEnabled;
    try {
      stream.getAudioTracks().forEach((track) => {
        track.enabled = nextEnabled;
      });
      micEnabledRef.current = nextEnabled;
      setMicEnabled(nextEnabled);
      await publishLocalMediaState(nextEnabled, cameraEnabled);
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
    } catch (err) {
      appendError(err?.message || 'Unable to toggle microphone.');
    }
  }, [appendError, cameraEnabled, micEnabled, publishLocalMediaState]);

  const toggleCamera = useCallback(async () => {
    const stream = localStreamRef.current;
    if (!stream) return;
    const nextEnabled = !cameraEnabled;
    try {
      const currentTracks = stream.getVideoTracks();
      if (!nextEnabled) {
        if (senderRef.current.video) {
          await senderRef.current.video.replaceTrack(null);
        }
        currentTracks.forEach((track) => {
          try {
            track.stop();
          } catch {
            // no-op
          }
          stream.removeTrack(track);
          cameraTracksRef.current.delete(track);
        });
      } else if (currentTracks.length === 0) {
        const videoStream = await navigator.mediaDevices.getUserMedia({ video: true });
        const nextTrack = videoStream.getVideoTracks()[0];
        if (!nextTrack) {
          throw new Error('Unable to access camera.');
        }
        if (senderRef.current.video) {
          await senderRef.current.video.replaceTrack(nextTrack);
        } else if (peerConnectionRef.current) {
          senderRef.current.video = peerConnectionRef.current.addTrack(nextTrack, stream);
        }
        nextTrack.enabled = true;
        stream.addTrack(nextTrack);
        cameraTracksRef.current.add(nextTrack);
      } else {
        currentTracks.forEach((track) => {
          track.enabled = true;
        });
      }

      setCameraEnabled(nextEnabled);
      await publishLocalMediaState(micEnabled, nextEnabled);
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
    } catch (err) {
      appendError(err?.message || 'Unable to toggle camera.');
    }
  }, [appendError, cameraEnabled, micEnabled, publishLocalMediaState]);

  const toggleFullscreen = useCallback(async () => {
    const stageEl = stageContainerRef.current;
    if (!stageEl || typeof document === 'undefined') return;

    const currentFullscreenEl = document.fullscreenElement || document.webkitFullscreenElement;
    try {
      if (currentFullscreenEl) {
        if (document.exitFullscreen) {
          await document.exitFullscreen();
        } else if (document.webkitExitFullscreen) {
          document.webkitExitFullscreen();
        }
        return;
      }
      if (stageEl.requestFullscreen) {
        await stageEl.requestFullscreen();
      } else if (stageEl.webkitRequestFullscreen) {
        stageEl.webkitRequestFullscreen();
      }
    } catch {
      appendError('Unable to switch fullscreen mode.');
    }
  }, [appendError]);

  const leaveMeeting = useCallback(async ({ triggeredByRemote = false } = {}) => {
    if (exitingRef.current) return;
    exitingRef.current = true;
    if (sessionId) {
      try {
        await sendLocalTranscriptBundle();
      } catch {
        // no-op
      }
      if (!triggeredByRemote) {
        try {
          await sendSignal('bye', {});
        } catch {
          // no-op
        }
      }
      // Requirement: when either participant leaves, stop the meeting and persist artifacts.
      await markSessionClosed();
      setSelectedSessionId(sessionId);
    }
    await stopSpeechMonitoring();
    if (isMentorToolsEnabled) {
      try {
        await pollSignals();
      } catch {
        // no-op
      }
    }
    await generateMeetingSummary();
    await stopRecording();
    stopRecordingStatusPolling();
    stopReconnectLoop();
    stopPolling();
    closePeerConnection();
    stopMediaTracks();
    if (typeof onExit === 'function') {
      try {
        onExit();
      } catch {
        // no-op
      }
    }
    navigate(exitPath);
  }, [
    closePeerConnection,
    exitPath,
    generateMeetingSummary,
    markSessionClosed,
    navigate,
    pollSignals,
    isMentorToolsEnabled,
    sendLocalTranscriptBundle,
    sendSignal,
    sessionId,
    stopMediaTracks,
    stopReconnectLoop,
    stopRecordingStatusPolling,
    stopPolling,
    stopRecording,
    stopSpeechMonitoring,
    onExit,
  ]);

  useEffect(() => {
    if (!remoteEnded) return;
    leaveMeeting({ triggeredByRemote: true });
  }, [leaveMeeting, remoteEnded]);

  useEffect(() => {
    let cancelled = false;
    sessionClosedSyncRef.current = false;
    if (!sessionId) {
      appendError('Missing session ID. Please join from My Sessions.');
      setConnectionState('failed');
      return undefined;
    }

    const setupMeeting = async () => {
      setSelectedSessionId(sessionId);
      setConnectionState('connecting');
      try {
        await prepareRtcConfig();
        const localStream = await initializeLocalMedia();
        if (cancelled) {
          if (localStream) {
            localStream.getTracks().forEach((track) => {
              try {
                track.stop();
              } catch {
                // no-op
              }
            });
          }
          return;
        }
        startRecordingStatusPolling();
        startPolling();
        await pollSignals();
        await createOfferIfNeeded();
        if (isMentorToolsEnabled) {
          await loadIncidents();
        }
      } catch (err) {
        if (!cancelled) {
          appendError(err?.message || 'Unable to initialize meeting room.');
          setConnectionState('failed');
        }
      }
    };

    setupMeeting();
    return () => {
      cancelled = true;
      stopSpeechMonitoring();
      stopRecording();
      stopRecordingStatusPolling();
      stopReconnectLoop();
      stopPolling();
      closePeerConnection();
      stopMediaTracks();
    };
  }, [participantRole, sessionId]);

  useEffect(() => {
    if (participantRole !== 'mentor' || !sessionId) return undefined;
    if (connectionState === 'connected') {
      stopReconnectLoop();
      return undefined;
    }
    if (reconnectIntervalRef.current) return undefined;

    reconnectIntervalRef.current = window.setInterval(() => {
      if (!localStreamRef.current) return;
      createOfferIfNeeded({ force: true, iceRestart: true }).catch(() => {
        // no-op: retry loop should stay silent and non-blocking.
      });
    }, 6000);

    return () => stopReconnectLoop();
  }, [
    connectionState,
    createOfferIfNeeded,
    participantRole,
    sessionId,
    stopReconnectLoop,
  ]);

  useEffect(() => {
    if (!sessionId || connectionState !== 'failed' || typeof window === 'undefined') return undefined;
    const guardKey = getRefreshGuardKey(sessionId, participantRole);
    try {
      const attempts = Number(window.sessionStorage.getItem(guardKey) || '0');
      const maxAttempts = 2;
      if (attempts >= maxAttempts) {
        console.error('[MeetingRoomShell] Auto-refresh skipped: max failed refresh attempts reached.');
        return undefined;
      }
      window.sessionStorage.setItem(guardKey, String(attempts + 1));
    } catch {
      // no-op
    }
    const timer = window.setTimeout(() => {
      window.location.reload();
    }, 1200);
    return () => {
      window.clearTimeout(timer);
    };
  }, [connectionState, participantRole, sessionId]);

  useEffect(() => {
    if (
      !sessionId ||
      participantRole !== 'mentor' ||
      connectionState !== 'connecting' ||
      typeof window === 'undefined'
    ) {
      return undefined;
    }
    const timer = window.setTimeout(() => {
      window.location.reload();
    }, 10000);
    return () => {
      window.clearTimeout(timer);
    };
  }, [connectionState, participantRole, sessionId]);

  useEffect(() => {
    if (!sessionId || connectionState !== 'connected' || typeof window === 'undefined') return;
    const guardKey = getRefreshGuardKey(sessionId, participantRole);
    try {
      window.sessionStorage.removeItem(guardKey);
    } catch {
      // no-op
    }
  }, [connectionState, participantRole, sessionId]);

  useEffect(() => {
    monitoringFeedIdRef.current = 0;
    setMonitoringFeed([]);
    setLiveInterimTranscript('');
    roleTranscriptSegmentsRef.current = { mentor: [], mentee: [] };
  }, [participantRole, sessionId]);

  useEffect(() => {
    if (typeof document === 'undefined') return undefined;
    const handleFullscreenChange = () => {
      const currentFullscreenEl = document.fullscreenElement || document.webkitFullscreenElement;
      setIsFullscreen(Boolean(currentFullscreenEl));
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    handleFullscreenChange();
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
    };
  }, []);

  useEffect(() => {
    micEnabledRef.current = Boolean(micEnabled);
  }, [micEnabled]);

  useEffect(() => {
    if (!sessionId) return undefined;
    if (connectionState !== 'connected') return undefined;
    if (!micEnabled) return undefined;
    if (!canSpeechModeration || !hasSpeechRecognition) return undefined;
    if (!localStreamRef.current) return undefined;
    if (monitoringActive) return undefined;
    startSpeechMonitoring();
    return undefined;
  }, [
    canSpeechModeration,
    connectionState,
    hasSpeechRecognition,
    micEnabled,
    monitoringActive,
    sessionId,
    startSpeechMonitoring,
  ]);

  useEffect(() => {
    if (micEnabled) return undefined;
    if (!monitoringActive) return undefined;
    stopSpeechMonitoring();
    return undefined;
  }, [micEnabled, monitoringActive, stopSpeechMonitoring]);

  useEffect(() => {
    if (!sessionId) return undefined;
    if (connectionState !== 'connected') return undefined;
    if (typeof api?.analyzeSessionVideoFrame !== 'function') return undefined;
    const initialScanTimer = window.setTimeout(() => {
      runAutoVideoBehaviorScan();
    }, 1200);
    const interval = window.setInterval(() => {
      runAutoVideoBehaviorScan();
    }, Math.max(4500, AUTO_VIDEO_SCAN_INTERVAL_MS));
    return () => {
      window.clearTimeout(initialScanTimer);
      window.clearInterval(interval);
    };
  }, [api, connectionState, runAutoVideoBehaviorScan, sessionId]);

  useEffect(() => {
    if (!isMentorToolsEnabled || connectionState !== 'connected') return undefined;
    if (recording || recordingStatus === 'recording') return undefined;
    if (typeof MediaRecorder === 'undefined') return undefined;

    let attempts = 0;
    const maxAttempts = 6;
    const retryTimer = window.setInterval(() => {
      if (recording || recordingStatus === 'recording') {
        window.clearInterval(retryTimer);
        return;
      }
      if (!localStreamRef.current) return;
      if (attempts >= maxAttempts) {
        window.clearInterval(retryTimer);
        return;
      }
      attempts += 1;
      startRecording();
    }, 2500);

    return () => {
      window.clearInterval(retryTimer);
    };
  }, [connectionState, isMentorToolsEnabled, recording, recordingStatus, startRecording]);

  useEffect(() => {
    let cancelled = false;

    const resolveDisplayName = (firstName, lastName, fallback = '') => {
      const fullName = [firstName, lastName].filter(Boolean).join(' ').trim();
      return fullName || String(fallback || '').trim();
    };

    const loadPeerLabel = async () => {
      if (!sessionId || typeof api.getSessionById !== 'function') {
        setPeerLabel('Peer');
        return;
      }
      try {
        const session = await api.getSessionById(sessionId);
        if (cancelled) return;

        if (participantRole === 'mentor') {
          const menteeName = resolveDisplayName(
            session?.mentee_first_name,
            session?.mentee_last_name,
            session?.mentee_name
          );
          if (menteeName) {
            setPeerLabel(menteeName);
            return;
          }
          if (session?.mentee) {
            setPeerLabel(`Mentee #${session.mentee}`);
            return;
          }
          setPeerLabel('Mentee');
          return;
        }

        const mentorFromSession = typeof session?.mentor === 'object' ? session.mentor : null;
        const mentorNameFromSession = resolveDisplayName(
          mentorFromSession?.first_name,
          mentorFromSession?.last_name,
          session?.mentor_name || session?.mentor_full_name
        );
        if (mentorNameFromSession) {
          setPeerLabel(mentorNameFromSession);
          return;
        }

        if (session?.mentor && typeof api.getMentorById === 'function') {
          try {
            const mentor = await api.getMentorById(session.mentor);
            if (cancelled) return;
            const mentorName = resolveDisplayName(mentor?.first_name, mentor?.last_name);
            setPeerLabel(mentorName || `Mentor #${session.mentor}`);
            return;
          } catch {
            // no-op
          }
        }

        if (session?.mentor) {
          setPeerLabel(`Mentor #${session.mentor}`);
          return;
        }
        setPeerLabel('Mentor');
      } catch {
        if (!cancelled) {
          setPeerLabel('Peer');
        }
      }
    };

    loadPeerLabel();
    return () => {
      cancelled = true;
    };
  }, [api, participantRole, sessionId]);

  const showFullUi = uiMode !== 'background';

  return (
    <>
      {uiMode === 'background' ? (
        <div className="fixed inset-x-0 top-0 z-[70] border-b border-[#e5e7eb] bg-white/95 backdrop-blur-sm">
          <div className="mx-auto flex max-w-[1280px] flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
            <div className="text-sm text-[#111827]">
              <span className="font-semibold">Call in progress</span>
              <span className="text-[#6b7280]">{peerLabel ? ` with ${peerLabel}` : ''}.</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  if (reopenPath) navigate(reopenPath);
                }}
                className="inline-flex items-center gap-2 rounded-lg bg-[#f5f3ff] px-3 py-2 text-xs font-semibold text-[#5D3699] ring-1 ring-[#5D3699]/10 transition-colors hover:bg-[#ede9fe]"
              >
                <Video className="h-4 w-4" />
                Back to call
              </button>
              <button
                type="button"
                onClick={() => leaveMeeting()}
                className="inline-flex items-center gap-2 rounded-lg bg-[#ef4444] px-3 py-2 text-xs font-semibold text-white hover:bg-[#dc2626]"
              >
                <PhoneOff className="h-4 w-4" />
                {exitLabel}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {toastState.open ? (
        <div className="pointer-events-none fixed right-4 top-4 z-[95] w-[92vw] max-w-sm">
          <div
            className={`rounded-xl border px-3 py-2 text-xs shadow-lg sm:text-sm ${toastState.type === 'error'
              ? 'border-[#fecaca] bg-[#fef2f2] text-[#7f1d1d]'
              : 'border-[#fde68a] bg-[#fffbeb] text-[#78350f]'
              }`}
            role="status"
            aria-live="polite"
          >
            <div className="flex items-start gap-2">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              <div>{toastState.message}</div>
            </div>
          </div>
        </div>
      ) : null}

      {/* Keep the full meeting UI mounted so navigation doesn't disconnect the call. */}
      <div
        className={`${showFullUi ? '' : 'absolute left-[-99999px] top-0 h-px w-px overflow-hidden'} min-h-[75vh] p-3 sm:p-5 lg:p-6`}
      >
        <div className="mb-4 rounded-xl border border-[#e5e7eb] bg-white p-4 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="text-xl font-bold text-[#111827] sm:text-2xl">{title}</h1>
              <p className="text-xs text-[#6b7280] sm:text-sm">
                Session #{sessionId || '-'} | Role: {participantRole} | Connection: {connectionState}
              </p>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <span
                  className={`inline-flex rounded-full px-2 py-1 text-[10px] font-semibold ${recordingStatus === 'recording'
                    ? 'bg-[#dcfce7] text-[#166534]'
                    : 'bg-[#f3f4f6] text-[#374151]'
                    }`}
                >
                  Recording: {recordingStatus === 'recording' ? 'Started' : 'Not Started'}
                </span>
                <span
                  className={`inline-flex rounded-full px-2 py-1 text-[10px] font-semibold ${monitoringActive ? 'bg-[#ede9fe] text-[#5b21b6]' : 'bg-[#f3f4f6] text-[#374151]'
                    }`}
                >
                  Monitoring: {monitoringActive ? 'Started' : 'Not Started'}
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={leaveMeeting}
              className="inline-flex items-center gap-2 rounded-lg bg-[#ef4444] px-3 py-2 text-xs font-semibold text-white hover:bg-[#dc2626]"
            >
              <PhoneOff className="h-4 w-4" />
              {exitLabel}
            </button>
          </div>
        </div>
        <div className="mb-4 rounded-xl border border-[#e5e7eb] bg-white p-4 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="text-sm font-semibold text-[#111827]">Monitoring Words (Realtime)</div>
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold ${monitoringActive
                  ? 'bg-[#dcfce7] text-[#166534]'
                  : 'bg-[#f3f4f6] text-[#374151]'
                  }`}
              >
                Speech Engine: {monitoringActive ? 'Running' : 'Stopped'}
              </span>
              <span className="text-[11px] text-[#6b7280]">Latest {monitoringFeed.length} entries</span>
              <button
                type="button"
                onClick={monitoringActive ? stopSpeechMonitoring : startSpeechMonitoring}
                disabled={!hasSpeechRecognition}
                className="inline-flex items-center rounded-md bg-[#111827] px-2.5 py-1 text-[11px] font-semibold text-white hover:bg-[#1f2937] disabled:cursor-not-allowed disabled:bg-[#9ca3af]"
              >
                {monitoringActive ? 'Stop Monitoring' : 'Start Monitoring'}
              </button>
            </div>
          </div>
          <div className="mt-2 rounded-lg border border-[#e5e7eb] bg-[#f9fafb] px-3 py-2 text-xs text-[#374151]">
            {liveInterimTranscript
              ? `Listening: ${liveInterimTranscript}`
              : 'Listening: waiting for speech...'}
          </div>
          <div className="mt-2 max-h-44 overflow-y-auto rounded-lg border border-[#e5e7eb] bg-white">
            {monitoringFeed.length ? (
              <div className="divide-y divide-[#f3f4f6]">
                {monitoringFeed.map((entry) => (
                  <div key={entry.id} className="px-3 py-2 text-xs text-[#111827]">
                    <div className="mb-1 flex items-center gap-2">
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold ${entry.source === 'local'
                          ? 'bg-[#dbeafe] text-[#1d4ed8]'
                          : 'bg-[#ede9fe] text-[#5b21b6]'
                          }`}
                      >
                        {entry.source === 'local' ? 'You' : getParticipantDisplayRole(entry.source)}
                      </span>
                      <span className="text-[10px] text-[#6b7280]">
                        {new Date(entry.at).toLocaleTimeString()}
                      </span>
                    </div>
                    <div>{entry.text}</div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="px-3 py-4 text-xs text-[#6b7280]">
                No monitoring words yet. Start speaking to see live words here.
              </div>
            )}
          </div>
        </div>
        {meetingSummary ? (
          <div className="mb-4 rounded-xl border border-[#d1fae5] bg-[#ecfdf5] px-4 py-3 text-sm text-[#065f46]">
            <div className="text-xs font-semibold uppercase tracking-wide text-[#047857]">Meeting Summary</div>
            <div className="mt-1">{meetingSummary}</div>
          </div>
        ) : null}
        {summaryLoading ? (
          <div className="mb-4 rounded-xl border border-[#dbeafe] bg-[#eff6ff] px-4 py-3 text-xs text-[#1d4ed8]">
            Generating meeting summary...
          </div>
        ) : null}

        {isMentorToolsEnabled && alert?.flagged ? (
          <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900 sm:text-sm">
            <div className="flex items-start gap-2">
              <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" />
              <div>
                {String(alert?.incident_type || 'verbal_abuse').toLowerCase() === 'verbal_abuse' ? (
                  <>
                    <div className="font-semibold">
                      Abusive language detected ({alert?.severity || 'low'})
                    </div>
                    <div>Matched terms: {(alert?.matched_terms || []).join(', ') || 'none'}</div>
                  </>
                ) : (
                  <>
                    <div className="font-semibold">
                      Video behavior detected: {formatIncidentTypeLabel(alert?.incident_type)} (
                      {alert?.severity || 'low'})
                    </div>
                    <div>
                      Recommended action:{' '}
                      {String(alert?.recommended_action || 'warn').replace(/_/g, ' ')}
                    </div>
                  </>
                )}
                {alert?.flagged_mentee_info?.id ? (
                  <div className="mt-1">
                    Mentee: {alert.flagged_mentee_info.first_name} {alert.flagged_mentee_info.last_name}
                    {' | '}Email: {alert.flagged_mentee_info.email}
                    {' | '}Parent Mobile: {alert.flagged_mentee_info.parent_mobile || '-'}
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        ) : null}

        <div
          ref={stageContainerRef}
          className={`overflow-hidden bg-black ${isFullscreen ? 'rounded-none border-0' : 'rounded-xl border border-[#e5e7eb]'
            }`}
        >
          <div
            className={`relative ${isFullscreen ? 'h-[100vh] min-h-[100vh]' : 'h-[56vh] min-h-[320px] sm:h-[62vh] lg:h-[70vh]'
              }`}
          >
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              className={`h-full w-full bg-[#111827] object-cover ${remoteCameraEnabled === false ? 'invisible' : 'visible'
                }`}
            />
            {remoteCameraEnabled === false ? (
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black text-sm font-semibold text-white">
                Peer Camera Off
              </div>
            ) : null}
            <div className="pointer-events-none absolute left-2 top-2 rounded-full bg-black/65 px-2 py-1 text-[10px] font-semibold text-white sm:left-3 sm:top-3">
              {peerLabel}
            </div>
            {remoteCameraEnabled === false || remoteMicEnabled === false ? (
              <div className="pointer-events-none absolute left-2 top-10 flex flex-wrap gap-1 sm:left-3 sm:top-12">
                {remoteCameraEnabled === false ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-black/70 px-2 py-1 text-[10px] font-semibold text-white">
                    <VideoOff className="h-3 w-3" />
                    Camera Off
                  </span>
                ) : null}
                {remoteMicEnabled === false ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-black/70 px-2 py-1 text-[10px] font-semibold text-white">
                    <MicOff className="h-3 w-3" />
                    Mic Off
                  </span>
                ) : null}
              </div>
            ) : null}

            <div className="absolute bottom-3 right-3 w-[42vw] min-w-[120px] max-w-[180px] sm:w-[220px] sm:max-w-[220px] lg:w-[260px] lg:max-w-[260px]">
              <div className="relative overflow-hidden rounded-lg border border-white/30 bg-[#111827] shadow-xl">
                <video
                  ref={localVideoRef}
                  autoPlay
                  muted
                  playsInline
                  className={`h-[92px] w-full object-cover sm:h-[128px] lg:h-[146px] ${cameraEnabled ? 'visible' : 'invisible'
                    }`}
                />
                {!cameraEnabled ? (
                  <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black text-xs font-semibold text-white">
                    Camera Off
                  </div>
                ) : null}
                <div className="pointer-events-none absolute left-1.5 top-1.5 rounded-full bg-black/65 px-2 py-0.5 text-[9px] font-semibold text-white sm:left-2 sm:top-2 sm:text-[10px]">
                  You
                </div>
                {!cameraEnabled || !micEnabled ? (
                  <div className="pointer-events-none absolute left-1.5 top-7 flex flex-wrap gap-1 sm:left-2 sm:top-8">
                    {!cameraEnabled ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-black/70 px-1.5 py-0.5 text-[9px] font-semibold text-white sm:text-[10px]">
                        <VideoOff className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                        Cam Off
                      </span>
                    ) : null}
                    {!micEnabled ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-black/70 px-1.5 py-0.5 text-[9px] font-semibold text-white sm:text-[10px]">
                        <MicOff className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                        Mic Off
                      </span>
                    ) : null}
                  </div>
                ) : null}
              </div>
            </div>

            {isFullscreen ? (
              <div className="absolute inset-x-0 bottom-4 z-20 flex justify-center px-3">
                <div className="flex items-center gap-2 rounded-full bg-black/70 px-3 py-2 backdrop-blur">
                  <button
                    type="button"
                    onClick={toggleMic}
                    className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1.5 text-xs font-semibold text-white hover:bg-white/25"
                  >
                    {micEnabled ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
                    {micEnabled ? 'Mic On' : 'Mic Off'}
                  </button>
                  <button
                    type="button"
                    onClick={toggleCamera}
                    className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1.5 text-xs font-semibold text-white hover:bg-white/25"
                  >
                    {cameraEnabled ? <Video className="h-4 w-4" /> : <VideoOff className="h-4 w-4" />}
                    {cameraEnabled ? 'Camera On' : 'Camera Off'}
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        </div>

        <div className="mt-4 rounded-xl border border-[#e5e7eb] bg-white p-3 sm:p-4">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={toggleMic}
              className="inline-flex items-center gap-1.5 rounded-lg bg-[#f3f4f6] px-3 py-2 text-xs font-semibold text-[#111827] hover:bg-[#e5e7eb]"
            >
              {micEnabled ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
              {micEnabled ? 'Mute Mic' : 'Unmute Mic'}
            </button>
            <button
              type="button"
              onClick={toggleCamera}
              className="inline-flex items-center gap-1.5 rounded-lg bg-[#f3f4f6] px-3 py-2 text-xs font-semibold text-[#111827] hover:bg-[#e5e7eb]"
            >
              {cameraEnabled ? <Video className="h-4 w-4" /> : <VideoOff className="h-4 w-4" />}
              {cameraEnabled ? 'Stop Camera' : 'Start Camera'}
            </button>
            <button
              type="button"
              onClick={toggleFullscreen}
              className="inline-flex items-center gap-1.5 rounded-lg bg-[#f3f4f6] px-3 py-2 text-xs font-semibold text-[#111827] hover:bg-[#e5e7eb]"
            >
              {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
              {isFullscreen ? 'Exit Full Screen' : 'Full Screen'}
            </button>
            {showManualMentorTools ? (
              <>
                <button
                  type="button"
                  onClick={recording ? stopRecording : startRecording}
                  className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold text-white ${recording ? 'bg-[#ef4444] hover:bg-[#dc2626]' : 'bg-[#2563eb] hover:bg-[#1d4ed8]'
                    }`}
                  hidden={!isMentorToolsEnabled}
                >
                  {recording ? 'Stop Recording' : 'Start Recording'}
                </button>
                <button
                  type="button"
                  onClick={monitoringActive ? stopSpeechMonitoring : startSpeechMonitoring}
                  disabled={!hasSpeechRecognition}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-[#7c3aed] px-3 py-2 text-xs font-semibold text-white hover:bg-[#6d28d9] disabled:cursor-not-allowed disabled:bg-[#c4b5fd]"
                  hidden={!isMentorToolsEnabled}
                >
                  {monitoringActive ? 'Stop Monitoring' : 'Start Monitoring'}
                </button>
              </>
            ) : null}
          </div>
          {showManualMentorTools && isMentorToolsEnabled && !hasSpeechRecognition ? (
            <p className="mt-2 text-xs text-[#6b7280]">
              Browser speech recognition is unavailable. Use manual transcript input below.
            </p>
          ) : null}
        </div>

        {showManualMentorTools && isMentorToolsEnabled ? (
          <div className="mt-4 rounded-xl border border-[#e5e7eb] bg-white p-3 sm:p-4">
            <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-[#111827]">
              <AlertTriangle className="h-4 w-4 text-[#f59e0b]" />
              Call Analysis
            </div>
            <textarea
              value={analysisInput}
              onChange={(event) => setAnalysisInput(event.target.value)}
              rows={3}
              placeholder="Paste or type conversation snippet for abuse detection."
              className="w-full rounded-lg border border-[#d1d5db] px-3 py-2 text-sm text-[#111827] focus:border-[#7c3aed] focus:outline-none"
            />
            <div className="mt-2 flex items-center justify-between">
              <button
                type="button"
                onClick={() => analyzeTranscript(analysisInput)}
                disabled={analysisLoading || !analysisInput.trim()}
                className="rounded-lg bg-[#111827] px-3 py-2 text-xs font-semibold text-white hover:bg-[#1f2937] disabled:cursor-not-allowed disabled:bg-[#9ca3af]"
              >
                {analysisLoading ? 'Analyzing...' : 'Analyze Snippet'}
              </button>
              <span className="text-xs text-[#6b7280]">Incidents Logged: {incidents.length}</span>
            </div>
          </div>
        ) : null}
      </div>
    </>
  );
};

export default MeetingRoomShell;
