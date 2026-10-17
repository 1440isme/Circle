'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { getSocket } from '../lib/socket';
import { CallType, IceServerConfig } from '@circle/types';

interface PeerStream {
  userId: string;
  stream: MediaStream;
  displayName?: string;
}

interface UseWebRTCCallOptions {
  callSessionId: string | null;
  callType: CallType;
  currentUserId: string;
  iceServers?: IceServerConfig[];
  onCallEnded?: () => void;
}

export function useWebRTCCall({
  callSessionId,
  callType,
  currentUserId,
  iceServers = [{ urls: 'stun:stun.l.google.com:19302' }],
  onCallEnded,
}: UseWebRTCCallOptions) {
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStreams, setRemoteStreams] = useState<PeerStream[]>([]);
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const [isVideoDisabled, setIsVideoDisabled] = useState(callType === CallType.AUDIO);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const peerConnections = useRef<Map<string, RTCPeerConnection>>(new Map());
  const localStreamRef = useRef<MediaStream | null>(null);

  // Initialize local media stream
  const startLocalMedia = useCallback(async () => {
    try {
      if (typeof window === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
        throw new Error('Trình duyệt không hỗ trợ WebRTC MediaDevices');
      }

      const constraints: MediaStreamConstraints = {
        audio: true,
        video: callType === CallType.VIDEO,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints).catch((err) => {
        if (err?.name === 'NotSupportedError' || err?.message?.includes('Not supported')) {
          // Fallback dummy stream for headless/virtual environments
          const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
          const osc = audioCtx.createOscillator();
          const dst = audioCtx.createMediaStreamDestination();
          osc.connect(dst);
          osc.start();
          const dummyStream = dst.stream;
          if (callType === CallType.VIDEO) {
            const canvas = document.createElement('canvas');
            canvas.width = 640;
            canvas.height = 480;
            const canvasStream = canvas.captureStream(30);
            dummyStream.addTrack(canvasStream.getVideoTracks()[0]);
          }
          return dummyStream;
        }
        throw err;
      });
      localStreamRef.current = stream;
      setLocalStream(stream);
      setIsConnected(true);
      setError(null);
      return stream;
    } catch (err: any) {
      console.error('[WebRTC] Error acquiring media stream:', err);
      setError(err?.message || 'Không thể truy cập Microphone hoặc Camera');
      return null;
    }
  }, [callType]);

  const iceServersRef = useRef(iceServers);
  useEffect(() => {
    iceServersRef.current = iceServers;
  }, [iceServers]);

  // Create or get RTCPeerConnection for a remote peer
  const getOrCreatePeerConnection = useCallback(
    (targetUserId: string, stream: MediaStream) => {
      if (peerConnections.current.has(targetUserId)) {
        return peerConnections.current.get(targetUserId)!;
      }

      const servers = iceServersRef.current.length > 0
        ? iceServersRef.current
        : [{ urls: 'stun:stun.l.google.com:19302' }];

      const pc = new RTCPeerConnection({
        iceServers: servers.map((s) => ({
          urls: s.urls,
          username: s.username,
          credential: s.credential,
        })),
      });

      // Add local stream tracks to this peer connection
      stream.getTracks().forEach((track) => {
        pc.addTrack(track, stream);
      });

      // Handle ICE Candidate generation
      pc.onicecandidate = (event) => {
        if (event.candidate && callSessionId) {
          const socket = getSocket();
          socket?.emit('webrtc:signal', {
            callSessionId,
            targetUserId,
            signal: { candidate: event.candidate },
          });
        }
      };

      // Handle incoming remote media tracks
      pc.ontrack = (event) => {
        let incomingStream = event.streams[0];
        if (!incomingStream) {
          incomingStream = new MediaStream([event.track]);
        }
        if (incomingStream) {
          setRemoteStreams((prev) => {
            const exists = prev.some((p) => p.userId === targetUserId);
            if (exists) {
              return prev.map((p) =>
                p.userId === targetUserId ? { ...p, stream: incomingStream } : p,
              );
            }
            return [...prev, { userId: targetUserId, stream: incomingStream }];
          });
        }
      };

      pc.onconnectionstatechange = () => {
        if (
          pc.connectionState === 'disconnected' ||
          pc.connectionState === 'failed' ||
          pc.connectionState === 'closed'
        ) {
          setRemoteStreams((prev) => prev.filter((p) => p.userId !== targetUserId));
          peerConnections.current.delete(targetUserId);
        }
      };

      peerConnections.current.set(targetUserId, pc);
      return pc;
    },
    [callSessionId],
  );

  // Toggle Microphone
  const toggleAudio = useCallback(() => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsAudioMuted(!audioTrack.enabled);
      }
    }
  }, []);

  // Toggle Camera
  const toggleVideo = useCallback(() => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoDisabled(!videoTrack.enabled);
      }
    }
  }, []);

  const onCallEndedRef = useRef(onCallEnded);
  useEffect(() => {
    onCallEndedRef.current = onCallEnded;
  }, [onCallEnded]);

  const startLocalMediaRef = useRef(startLocalMedia);
  useEffect(() => {
    startLocalMediaRef.current = startLocalMedia;
  }, [startLocalMedia]);

  // Main lifecycle & signaling listeners
  useEffect(() => {
    if (!callSessionId || !currentUserId) return;

    let isMounted = true;
    let activeStream: MediaStream | null = null;
    const socket = getSocket();

    const initCall = async () => {
      activeStream = await startLocalMediaRef.current();
      if (!isMounted || !activeStream || !socket) return;

      // Join socket call room
      socket.emit('call:join', { callSessionId });

      // Signal handler for incoming WebRTC SDP / ICE messages
      const handleSignal = async (payload: any) => {
        if (!isMounted || payload.callSessionId !== callSessionId) return;
        const senderId = payload.senderUserId;
        if (!senderId || senderId === currentUserId || !activeStream) return;

        const pc = getOrCreatePeerConnection(senderId, activeStream);

        try {
          if (payload.signal?.type === 'offer') {
            const isOfferCollision =
              pc.signalingState !== 'stable' ||
              (pc as any).isMakingOffer;
            
            // Deterministic collision resolution: lower userId yields to higher userId
            const isPolite = currentUserId.localeCompare(senderId) < 0;

            if (isOfferCollision && !isPolite) {
              // Ignore colliding offer from peer if impolite
              return;
            }

            if (isOfferCollision && isPolite) {
              await Promise.all([
                pc.setLocalDescription({ type: 'rollback' }),
                pc.setRemoteDescription(new RTCSessionDescription(payload.signal)),
              ]);
            } else {
              await pc.setRemoteDescription(new RTCSessionDescription(payload.signal));
            }

            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);

            // Flush buffered candidates if any
            const pendingCandidates = (pc as any)._pendingCandidates || [];
            while (pendingCandidates.length > 0) {
              const cand = pendingCandidates.shift();
              try {
                await pc.addIceCandidate(cand);
              } catch (e) {
                console.warn('[WebRTC] Buffered candidate add error:', e);
              }
            }

            socket.emit('webrtc:signal', {
              callSessionId,
              targetUserId: senderId,
              signal: answer,
            });
          } else if (payload.signal?.type === 'answer') {
            if (pc.signalingState === 'have-local-offer') {
              await pc.setRemoteDescription(new RTCSessionDescription(payload.signal));

              // Flush buffered candidates
              const pendingCandidates = (pc as any)._pendingCandidates || [];
              while (pendingCandidates.length > 0) {
                const cand = pendingCandidates.shift();
                try {
                  await pc.addIceCandidate(cand);
                } catch (e) {
                  console.warn('[WebRTC] Buffered candidate add error:', e);
                }
              }
            }
          } else if (payload.signal?.candidate) {
            try {
              const candidate = new RTCIceCandidate(payload.signal.candidate);
              if (pc.remoteDescription && pc.remoteDescription.type) {
                await pc.addIceCandidate(candidate);
              } else {
                if (!(pc as any)._pendingCandidates) {
                  (pc as any)._pendingCandidates = [];
                }
                (pc as any)._pendingCandidates.push(candidate);
              }
            } catch (candErr) {
              console.warn('[WebRTC] Candidate add warning:', candErr);
            }
          }
        } catch (signalErr) {
          console.error('[WebRTC] Signaling processing error:', signalErr);
        }
      };

      // Peer joined -> initiate an offer if in stable state
      const handlePeerJoined = async (payload: any) => {
        if (!isMounted) return;
        const newPeerUserId =
          payload.participant?.member?.userId ||
          payload.participant?.member?.user?.id ||
          payload.participant?.userId;
        if (!newPeerUserId || newPeerUserId === currentUserId || !activeStream) return;

        const pc = getOrCreatePeerConnection(newPeerUserId, activeStream);
        if (pc.signalingState !== 'stable') return;

        try {
          (pc as any).isMakingOffer = true;
          const offer = await pc.createOffer();
          await pc.setLocalDescription(offer);

          socket.emit('webrtc:signal', {
            callSessionId,
            targetUserId: newPeerUserId,
            signal: offer,
          });
        } catch (offerErr) {
          console.error('[WebRTC] Error creating offer:', offerErr);
        } finally {
          (pc as any).isMakingOffer = false;
        }
      };

      const handlePeerLeft = (payload: any) => {
        if (!isMounted) return;
        if (payload.callSessionId === callSessionId && payload.userId) {
          const pc = peerConnections.current.get(payload.userId);
          if (pc) {
            pc.close();
            peerConnections.current.delete(payload.userId);
          }
          setRemoteStreams((prev) => prev.filter((p) => p.userId !== payload.userId));
        }
      };

      const handleCallEnded = (payload: any) => {
        if (!isMounted) return;
        if (payload.callSessionId === callSessionId) {
          onCallEndedRef.current?.();
        }
      };

      socket.on('webrtc:signal', handleSignal);
      socket.on('call:participant-joined', handlePeerJoined);
      socket.on('call:participant-left', handlePeerLeft);
      socket.on('call:ended', handleCallEnded);

      // Announce self presence to mesh in room
      socket.emit('call:mesh-ready', { callSessionId, userId: currentUserId });
    };

    initCall();

    return () => {
      isMounted = false;
      // Cleanup all connections and tracks
      if (activeStream) {
        activeStream.getTracks().forEach((track) => track.stop());
      }
      peerConnections.current.forEach((pc) => pc.close());
      peerConnections.current.clear();
      setRemoteStreams([]);
      setLocalStream(null);
      localStreamRef.current = null;

      if (socket) {
        socket.off('webrtc:signal');
        socket.off('call:participant-joined');
        socket.off('call:participant-left');
        socket.off('call:ended');
      }
    };
  }, [
    callSessionId,
    currentUserId,
    getOrCreatePeerConnection,
  ]);

  return {
    localStream,
    remoteStreams,
    isAudioMuted,
    isVideoDisabled,
    isConnected,
    error,
    toggleAudio,
    toggleVideo,
  };
}
