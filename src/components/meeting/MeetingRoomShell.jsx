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
  const recognitionRef = useRef(null);
  const autoMonitoringRef = useRef(false);
  const autoStartCompletedRef = useRef(false);
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
  const sessionClosedSyncRef = useRef(false);
  const rtcConfigRef = useRef(DEFAULT_RTC_CONFIG);

  const [connectionState, setConnectionState] = useState('idle');
  const [micEnabled, setMicEnabled] = useState(true);
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
  const [meetingSummary, setMeetingSummary] = useState('');
  const [summaryLoading, setSummaryLoading] = useState(false);
  const isMentorToolsEnabled = participantRole === 'mentor';
  const showManualMentorTools = false;

  const searchParams = useMemo(() => new URLSearchParams(location.search), [location.search]);
  const sessionId = Number(searchParams.get('sessionId') || 0);

  const hasSpeechRecognition = useMemo(() => {
    if (typeof window === 'undefined') return false;
    return Boolean(window.SpeechRecognition || window.webkitSpeechRecognition);
  }, []);

  const appendError = useCallback((message) => {
    if (!message) return;
    if (isSuppressedRtcError(message)) return;
    console.error('[MeetingRoomShell]', String(message));
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
    const recognition = recognitionRef.current;
    if (recognition) {
      try {
        recognition.onend = null;
        recognition.stop();
      } catch {
        // no-op
      }
      recognitionRef.current = null;
    }
    setMonitoring(false);
    setMonitoringStatus(false);
    if (isMentorToolsEnabled && sessionId) {
      const recordingActive = Boolean(recorderRef.current && recorderRef.current.state !== 'inactive');
      try {
        await api.updateSessionRecording(sessionId, {
          status: recordingActive ? 'recording' : 'stopped',
          metadata: {
            monitoring_started: false,
          },
        });
      } catch {
        // no-op
      }
    }
  }, [api, isMentorToolsEnabled, sessionId]);

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
      const nextMonitoring = Boolean(metadata.monitoring_started);
      setRecordingStatus(nextStatus);
      setMonitoringStatus(nextMonitoring);
      if (participantRole === 'mentor') {
        setRecording(nextStatus === 'recording');
      }
      const savedSummary = String(metadata.meeting_summary || '').trim();
      if (savedSummary) {
        setMeetingSummary(savedSummary);
      }
    },
    [participantRole]
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
    async (transcriptValue) => {
      if (!isMentorToolsEnabled) return;
      const text = String(transcriptValue || '').trim();
      if (!sessionId || !text) return;
      setAnalysisLoading(true);
      try {
        const response = await api.analyzeSessionTranscript(sessionId, {
          transcript: text,
          speaker_role: participantRole,
        });
        if (response?.flagged) {
          setAlert(response);
          await loadIncidents();
        }
      } catch (err) {
        appendError(err?.message || 'Unable to analyze transcript.');
      } finally {
        setAnalysisLoading(false);
      }
    },
    [api, appendError, isMentorToolsEnabled, loadIncidents, participantRole, sessionId]
  );

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
          `ICE candidate error${code ? ` (${code})` : ''}${host ? ` on ${host}` : ''}${
            text ? `: ${text}` : ''
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
          if (signalType === 'bye') {
            // Ignore stale bye signals from previous attempts before signaling starts.
            if (!peer.currentRemoteDescription && peer.signalingState === 'stable') {
              continue;
            }
            closePeerConnection();
            offerSentRef.current = false;
            if (participantRole === 'mentor') {
              await createOfferIfNeeded({ force: true, iceRestart: true });
            }
          }
        } catch (err) {
          appendError(err?.message || 'Unable to process meeting signal.');
        }
      }
    },
    [
      appendError,
      closePeerConnection,
      createOfferIfNeeded,
      ensurePeerConnection,
      sendSignal,
      participantRole,
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
      audio: true,
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
    if (!isMentorToolsEnabled) return;
    if (!hasSpeechRecognition || monitoring) return;
    const SpeechRecognitionCtor = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognitionCtor) return;

    const recognition = new SpeechRecognitionCtor();
    recognition.continuous = true;
    recognition.interimResults = false;
    recognition.lang = 'en-US';
    autoMonitoringRef.current = true;

    recognition.onresult = (event) => {
      const transcript = Array.from(event.results)
        .slice(event.resultIndex)
        .filter((item) => item.isFinal)
        .map((item) => item[0]?.transcript || '')
        .join(' ')
        .trim();
      if (transcript) {
        transcriptSegmentsRef.current.push(transcript);
        setAnalysisInput((prev) => [prev, transcript].filter(Boolean).join(' '));
        analyzeTranscript(transcript);
      }
    };
    recognition.onend = () => {
      if (autoMonitoringRef.current) {
        try {
          recognition.start();
        } catch {
          autoMonitoringRef.current = false;
          setMonitoring(false);
        }
      }
    };
    recognition.onerror = () => {
      autoMonitoringRef.current = false;
      setMonitoring(false);
    };

    recognition.start();
    recognitionRef.current = recognition;
    setMonitoring(true);
    setMonitoringStatus(true);

    if (sessionId) {
      const recordingActive = Boolean(recorderRef.current && recorderRef.current.state !== 'inactive');
      try {
        await api.updateSessionRecording(sessionId, {
          status: recordingActive ? 'recording' : 'not_started',
          metadata: {
            monitoring_started: true,
          },
        });
      } catch {
        // no-op
      }
    }
  }, [analyzeTranscript, api, hasSpeechRecognition, isMentorToolsEnabled, monitoring, sessionId]);

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
            monitoring_started: monitoringActive,
          },
        });
      } catch (err) {
        appendError(err?.message || 'Unable to update recording status.');
      }
    }
  }, [api, appendError, isMentorToolsEnabled, sessionId, stopRecordingComposition]);

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
            monitoring_started: monitoringActive,
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
            monitoring_started: monitoringActive,
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
    participantRole,
    sessionId,
    stopRecordingComposition,
    uploadRecordingToCloudinary,
  ]);

  const generateMeetingSummary = useCallback(async () => {
    if (!isMentorToolsEnabled || !sessionId) return;
    if (summaryRequestedRef.current) return;
    const transcript = transcriptSegmentsRef.current.join(' ').trim() || String(analysisInput || '').trim();
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
  }, [analysisInput, api, appendError, isMentorToolsEnabled, pollRecordingStatus, sessionId]);

  const toggleMic = useCallback(async () => {
    const stream = localStreamRef.current;
    if (!stream) return;
    const nextEnabled = !micEnabled;
    try {
      stream.getAudioTracks().forEach((track) => {
        track.enabled = nextEnabled;
      });
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

  const leaveMeeting = useCallback(async () => {
    if (sessionId) {
      try {
        await sendSignal('bye', {});
      } catch {
        // no-op
      }
      if (participantRole === 'mentor') {
        await markSessionClosed();
      }
      setSelectedSessionId(sessionId);
    }
    await stopSpeechMonitoring();
    await generateMeetingSummary();
    await stopRecording();
    stopRecordingStatusPolling();
    stopReconnectLoop();
    stopPolling();
    closePeerConnection();
    stopMediaTracks();
    navigate(exitPath);
  }, [
    closePeerConnection,
    exitPath,
    generateMeetingSummary,
    markSessionClosed,
    navigate,
    participantRole,
    sendSignal,
    sessionId,
    stopMediaTracks,
    stopReconnectLoop,
    stopRecordingStatusPolling,
    stopPolling,
    stopRecording,
    stopSpeechMonitoring,
  ]);

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
  }, [
    appendError,
    closePeerConnection,
    createOfferIfNeeded,
    initializeLocalMedia,
    isMentorToolsEnabled,
    loadIncidents,
    prepareRtcConfig,
    pollSignals,
    sessionId,
    startRecordingStatusPolling,
    startPolling,
    stopMediaTracks,
    stopReconnectLoop,
    stopRecordingStatusPolling,
    stopPolling,
    stopRecording,
    stopSpeechMonitoring,
  ]);

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
    if (!sessionId || connectionState !== 'connected' || typeof window === 'undefined') return;
    const guardKey = getRefreshGuardKey(sessionId, participantRole);
    try {
      window.sessionStorage.removeItem(guardKey);
    } catch {
      // no-op
    }
  }, [connectionState, participantRole, sessionId]);

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
    if (!isMentorToolsEnabled) return;
    if (connectionState !== 'connected') return;
    if (autoStartCompletedRef.current) return;

    autoStartCompletedRef.current = true;
    const startTools = async () => {
      await startRecording();
      await startSpeechMonitoring();
      await pollRecordingStatus();
    };
    startTools();
  }, [
    connectionState,
    isMentorToolsEnabled,
    pollRecordingStatus,
    startRecording,
    startSpeechMonitoring,
  ]);

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

  return (
    <div className="min-h-[75vh] p-3 sm:p-5 lg:p-6">
      <div className="mb-4 rounded-xl border border-[#e5e7eb] bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-[#111827] sm:text-2xl">{title}</h1>
            <p className="text-xs text-[#6b7280] sm:text-sm">
              Session #{sessionId || '-'} | Role: {participantRole} | Connection: {connectionState}
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <span
                className={`inline-flex rounded-full px-2 py-1 text-[10px] font-semibold ${
                  recordingStatus === 'recording'
                    ? 'bg-[#dcfce7] text-[#166534]'
                    : 'bg-[#f3f4f6] text-[#374151]'
                }`}
              >
                Recording: {recordingStatus === 'recording' ? 'Started' : 'Not Started'}
              </span>
              <span
                className={`inline-flex rounded-full px-2 py-1 text-[10px] font-semibold ${
                  monitoringStatus ? 'bg-[#ede9fe] text-[#5b21b6]' : 'bg-[#f3f4f6] text-[#374151]'
                }`}
              >
                Monitoring: {monitoringStatus ? 'Started' : 'Not Started'}
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
              <div className="font-semibold">
                Abusive language detected ({alert?.severity || 'low'})
              </div>
              <div>Matched terms: {(alert?.matched_terms || []).join(', ') || 'none'}</div>
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
        className={`overflow-hidden bg-black ${
          isFullscreen ? 'rounded-none border-0' : 'rounded-xl border border-[#e5e7eb]'
        }`}
      >
        <div
          className={`relative ${
            isFullscreen ? 'h-[100vh] min-h-[100vh]' : 'h-[56vh] min-h-[320px] sm:h-[62vh] lg:h-[70vh]'
          }`}
        >
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className={`h-full w-full bg-[#111827] object-cover ${
              remoteCameraEnabled === false ? 'invisible' : 'visible'
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
                className={`h-[92px] w-full object-cover sm:h-[128px] lg:h-[146px] ${
                  cameraEnabled ? 'visible' : 'invisible'
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
                className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold text-white ${
                  recording ? 'bg-[#ef4444] hover:bg-[#dc2626]' : 'bg-[#2563eb] hover:bg-[#1d4ed8]'
                }`}
                hidden={!isMentorToolsEnabled}
              >
                {recording ? 'Stop Recording' : 'Start Recording'}
              </button>
              <button
                type="button"
                onClick={monitoring ? stopSpeechMonitoring : startSpeechMonitoring}
                disabled={!hasSpeechRecognition}
                className="inline-flex items-center gap-1.5 rounded-lg bg-[#7c3aed] px-3 py-2 text-xs font-semibold text-white hover:bg-[#6d28d9] disabled:cursor-not-allowed disabled:bg-[#c4b5fd]"
                hidden={!isMentorToolsEnabled}
              >
                {monitoring ? 'Stop Monitoring' : 'Start Monitoring'}
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
  );
};

export default MeetingRoomShell;
