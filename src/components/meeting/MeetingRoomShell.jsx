import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  Download,
  Mic,
  MicOff,
  PhoneOff,
  ShieldAlert,
  Video,
  VideoOff,
} from 'lucide-react';
import { setSelectedSessionId } from '../../apis/api/storage';

const rtcConfig = {
  iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
};

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
  const localStreamRef = useRef(null);
  const peerConnectionRef = useRef(null);
  const senderRef = useRef({ audio: null, video: null });
  const pollIntervalRef = useRef(null);
  const lastSignalIdRef = useRef(0);
  const offerSentRef = useRef(false);
  const recorderRef = useRef(null);
  const recordingChunksRef = useRef([]);
  const recognitionRef = useRef(null);
  const autoMonitoringRef = useRef(false);

  const [error, setError] = useState('');
  const [connectionState, setConnectionState] = useState('idle');
  const [micEnabled, setMicEnabled] = useState(true);
  const [cameraEnabled, setCameraEnabled] = useState(true);
  const [recording, setRecording] = useState(false);
  const [recordingUrl, setRecordingUrl] = useState('');
  const [monitoring, setMonitoring] = useState(false);
  const [analysisInput, setAnalysisInput] = useState('');
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [alert, setAlert] = useState(null);
  const [incidents, setIncidents] = useState([]);
  const isMentorToolsEnabled = participantRole === 'mentor';

  const searchParams = useMemo(() => new URLSearchParams(location.search), [location.search]);
  const sessionId = Number(searchParams.get('sessionId') || 0);

  const hasSpeechRecognition = useMemo(() => {
    if (typeof window === 'undefined') return false;
    return Boolean(window.SpeechRecognition || window.webkitSpeechRecognition);
  }, []);

  const appendError = useCallback((message) => {
    if (!message) return;
    setError(String(message));
  }, []);

  const stopMediaTracks = useCallback(() => {
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
  }, []);

  const stopSpeechMonitoring = useCallback(() => {
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
  }, []);

  const closePeerConnection = useCallback(() => {
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
  }, []);

  const stopPolling = useCallback(() => {
    if (pollIntervalRef.current) {
      window.clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
  }, []);

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

  const ensurePeerConnection = useCallback(() => {
    if (peerConnectionRef.current) return peerConnectionRef.current;

    const peer = new RTCPeerConnection(rtcConfig);
    peer.onconnectionstatechange = () => {
      setConnectionState(peer.connectionState || 'connecting');
    };
    peer.onicecandidate = async (event) => {
      if (!event.candidate) return;
      try {
        await sendSignal('ice', event.candidate);
      } catch (err) {
        appendError(err?.message || 'Unable to share ICE candidate.');
      }
    };
    peer.ontrack = (event) => {
      const [stream] = event.streams;
      if (!stream || !remoteVideoRef.current) return;
      remoteVideoRef.current.srcObject = stream;
    };
    peerConnectionRef.current = peer;
    return peer;
  }, [appendError, sendSignal]);

  const createOfferIfNeeded = useCallback(async () => {
    if (!sessionId || participantRole !== 'mentor' || offerSentRef.current) return;
    const peer = ensurePeerConnection();
    offerSentRef.current = true;
    const offer = await peer.createOffer();
    await peer.setLocalDescription(offer);
    await sendSignal('offer', peer.localDescription || offer);
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
          if (signalType === 'bye') {
            closePeerConnection();
            stopMediaTracks();
          }
        } catch (err) {
          appendError(err?.message || 'Unable to process meeting signal.');
        }
      }
    },
    [appendError, closePeerConnection, ensurePeerConnection, sendSignal, sessionId, stopMediaTracks]
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
    stream.getTracks().forEach((track) => {
      const sender = peer.addTrack(track, stream);
      if (track.kind === 'audio') senderRef.current.audio = sender;
      if (track.kind === 'video') senderRef.current.video = sender;
    });
  }, [ensurePeerConnection]);

  const startSpeechMonitoring = useCallback(() => {
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
        .filter((item) => item.isFinal)
        .map((item) => item[0]?.transcript || '')
        .join(' ')
        .trim();
      if (transcript) {
        setAnalysisInput(transcript);
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
  }, [analyzeTranscript, hasSpeechRecognition, isMentorToolsEnabled, monitoring]);

  const stopRecording = useCallback(async () => {
    const recorder = recorderRef.current;
    const hadActiveRecorder = Boolean(recorder && recorder.state !== 'inactive');
    if (hadActiveRecorder) {
      recorder.stop();
    }
    recorderRef.current = null;
    setRecording(false);
    if (isMentorToolsEnabled && sessionId && hadActiveRecorder) {
      try {
        await api.updateSessionRecording(sessionId, { status: 'stopped' });
      } catch (err) {
        appendError(err?.message || 'Unable to update recording status.');
      }
    }
  }, [api, appendError, isMentorToolsEnabled, sessionId]);

  const startRecording = useCallback(async () => {
    if (!isMentorToolsEnabled) return;
    const stream = localStreamRef.current;
    if (!stream) {
      appendError('Local media stream is not ready for recording.');
      return;
    }
    if (typeof MediaRecorder === 'undefined') {
      appendError('MediaRecorder is not available in this browser.');
      return;
    }
    try {
      const recorder = new MediaRecorder(stream);
      recordingChunksRef.current = [];
      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          recordingChunksRef.current.push(event.data);
        }
      };
      recorder.onstop = async () => {
        const chunks = recordingChunksRef.current;
        if (!chunks.length) return;
        const blob = new Blob(chunks, { type: recorder.mimeType || 'video/webm' });
        const nextUrl = URL.createObjectURL(blob);
        setRecordingUrl((prev) => {
          if (prev) URL.revokeObjectURL(prev);
          return nextUrl;
        });
        if (!sessionId) return;
        try {
          await api.updateSessionRecording(sessionId, {
            status: 'stopped',
            file_size_bytes: blob.size,
            metadata: {
              mime_type: recorder.mimeType || 'video/webm',
            },
          });
        } catch (err) {
          appendError(err?.message || 'Unable to persist recording metadata.');
        }
      };
      recorder.start(1000);
      recorderRef.current = recorder;
      setRecording(true);
      if (sessionId) {
        await api.updateSessionRecording(sessionId, {
          status: 'recording',
          metadata: {
            role: participantRole,
            source: 'browser_media_recorder',
          },
        });
      }
    } catch (err) {
      appendError(err?.message || 'Unable to start recording.');
    }
  }, [api, appendError, isMentorToolsEnabled, participantRole, sessionId]);

  const toggleMic = useCallback(async () => {
    const stream = localStreamRef.current;
    if (!stream) return;
    const nextEnabled = !micEnabled;
    try {
      if (!nextEnabled) {
        stream.getAudioTracks().forEach((track) => {
          track.stop();
          stream.removeTrack(track);
        });
        const peer = peerConnectionRef.current;
        const senders = peer ? peer.getSenders() : [];
        for (const sender of senders) {
          if (sender === senderRef.current.audio || sender?.track?.kind === 'audio') {
            try {
              sender.track?.stop();
            } catch {
              // no-op
            }
            await sender.replaceTrack(null);
          }
        }
        if (!senders.length && senderRef.current.audio) {
          await senderRef.current.audio.replaceTrack(null);
        }
      } else {
        const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const nextTrack = audioStream.getAudioTracks()[0];
        if (nextTrack) {
          stream.addTrack(nextTrack);
          if (senderRef.current.audio) {
            await senderRef.current.audio.replaceTrack(nextTrack);
          } else if (peerConnectionRef.current) {
            senderRef.current.audio = peerConnectionRef.current.addTrack(nextTrack, stream);
          }
        }
      }
      setMicEnabled(nextEnabled);
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
    } catch (err) {
      appendError(err?.message || 'Unable to toggle microphone.');
    }
  }, [appendError, micEnabled]);

  const toggleCamera = useCallback(async () => {
    const stream = localStreamRef.current;
    if (!stream) return;
    const nextEnabled = !cameraEnabled;
    try {
      if (!nextEnabled) {
        stream.getVideoTracks().forEach((track) => {
          track.stop();
          stream.removeTrack(track);
        });
        const peer = peerConnectionRef.current;
        const senders = peer ? peer.getSenders() : [];
        for (const sender of senders) {
          if (sender === senderRef.current.video || sender?.track?.kind === 'video') {
            try {
              sender.track?.stop();
            } catch {
              // no-op
            }
            await sender.replaceTrack(null);
          }
        }
        if (!senders.length && senderRef.current.video) {
          await senderRef.current.video.replaceTrack(null);
        }
      } else {
        const videoStream = await navigator.mediaDevices.getUserMedia({ video: true });
        const nextTrack = videoStream.getVideoTracks()[0];
        if (nextTrack) {
          stream.addTrack(nextTrack);
          if (senderRef.current.video) {
            await senderRef.current.video.replaceTrack(nextTrack);
          } else if (peerConnectionRef.current) {
            senderRef.current.video = peerConnectionRef.current.addTrack(nextTrack, stream);
          }
        }
      }
      setCameraEnabled(nextEnabled);
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
    } catch (err) {
      appendError(err?.message || 'Unable to toggle camera.');
    }
  }, [appendError, cameraEnabled]);

  const leaveMeeting = useCallback(async () => {
    if (sessionId) {
      try {
        await sendSignal('bye', {});
      } catch {
        // no-op
      }
      setSelectedSessionId(sessionId);
    }
    stopSpeechMonitoring();
    await stopRecording();
    stopPolling();
    closePeerConnection();
    stopMediaTracks();
    navigate(exitPath);
  }, [
    closePeerConnection,
    exitPath,
    navigate,
    sendSignal,
    sessionId,
    stopMediaTracks,
    stopPolling,
    stopRecording,
    stopSpeechMonitoring,
  ]);

  useEffect(() => {
    let cancelled = false;
    if (!sessionId) {
      setError('Missing session ID. Please join from My Sessions.');
      return undefined;
    }

    const setupMeeting = async () => {
      setSelectedSessionId(sessionId);
      setConnectionState('connecting');
      try {
        await initializeLocalMedia();
        if (cancelled) return;
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
      stopPolling();
      closePeerConnection();
      stopMediaTracks();
      if (recordingUrl) URL.revokeObjectURL(recordingUrl);
    };
  }, [
    appendError,
    closePeerConnection,
    createOfferIfNeeded,
    initializeLocalMedia,
    isMentorToolsEnabled,
    loadIncidents,
    pollSignals,
    recordingUrl,
    sessionId,
    startPolling,
    stopMediaTracks,
    stopPolling,
    stopRecording,
    stopSpeechMonitoring,
  ]);

  return (
    <div className="min-h-[75vh] p-3 sm:p-5 lg:p-6">
      <div className="mb-4 rounded-xl border border-[#e5e7eb] bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-[#111827] sm:text-2xl">{title}</h1>
            <p className="text-xs text-[#6b7280] sm:text-sm">
              Session #{sessionId || '-'} | Role: {participantRole} | Connection: {connectionState}
            </p>
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

      {error ? (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
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

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="overflow-hidden rounded-xl border border-[#e5e7eb] bg-white">
          <div className="border-b border-[#e5e7eb] px-3 py-2 text-xs font-semibold text-[#374151]">
            Your Camera
          </div>
          <video ref={localVideoRef} autoPlay muted playsInline className="h-[240px] w-full bg-[#111827] object-cover sm:h-[320px]" />
        </div>
        <div className="overflow-hidden rounded-xl border border-[#e5e7eb] bg-white">
          <div className="border-b border-[#e5e7eb] px-3 py-2 text-xs font-semibold text-[#374151]">
            Peer Camera
          </div>
          <video ref={remoteVideoRef} autoPlay playsInline className="h-[240px] w-full bg-[#111827] object-cover sm:h-[320px]" />
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
        </div>
        {isMentorToolsEnabled && !hasSpeechRecognition ? (
          <p className="mt-2 text-xs text-[#6b7280]">
            Browser speech recognition is unavailable. Use manual transcript input below.
          </p>
        ) : null}
      </div>

      {isMentorToolsEnabled && recordingUrl ? (
        <div className="mt-4 rounded-xl border border-[#e5e7eb] bg-white p-3">
          <a
            href={recordingUrl}
            download={`session-${sessionId}-recording.webm`}
            className="inline-flex items-center gap-1.5 rounded-lg bg-[#059669] px-3 py-2 text-xs font-semibold text-white hover:bg-[#047857]"
          >
            <Download className="h-4 w-4" />
            Download Recording
          </a>
        </div>
      ) : null}

      {isMentorToolsEnabled ? (
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
